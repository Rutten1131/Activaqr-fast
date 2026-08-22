import { NextRequest, NextResponse } from "next/server";
import { consolidateMenuCategories } from "@/lib/consolidateMenu";

export const maxDuration = 120; // 2 minutos para procesamiento de visión pesado

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Modelos de visión en OpenRouter en orden de prioridad
const OPENROUTER_VISION_MODELS = [
    "google/gemini-2.0-flash-001",
    "google/gemini-2.0-flash-exp:free",
    "qwen/qwen-2.5-vl-72b-instruct:free",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "openai/gpt-4o-mini",
];

const SYSTEM_PROMPT = `Eres un asistente experto en OCR y digitalización gastronómica de alta precisión.
Tu trabajo es analizar fotos de cartas o menús de restaurantes, cafeterías, bares o negocios, extraer TODO el texto visible y organizarlo estructuradamente.

REGLAS OBLIGATORIAS:
1. Extrae TODOS los platos, bebidas, combos, postres, entradas, carnes, mariscos y promociones con sus respectivos precios y descripciones si existen.
2. CONSOLIDA EN CATEGORÍAS PRINCIPALES (Máximo 4 a 8 categorías en total). Agrupa bebidas en "Bebidas & Cocteles", entradas en "Entradas & Piqueos", etc.
3. Formatea los precios con su símbolo (ej: "$5.00", "$12.50"). Si un plato no tiene precio visible, pon "".
4. Responde ÚNICAMENTE un objeto JSON válido con la siguiente estructura, SIN markdown de triple comilla, SIN explicaciones:

{
  "categories": [
    {
      "name": "Nombre de Categoría",
      "items": [
        {
          "name": "Nombre del Producto",
          "price": "$0.00",
          "description": "Descripción si la hay"
        }
      ]
    }
  ]
}`;

// Helper para extraer y reparar JSON si viene con texto o levemente truncado
function extractAndParseJson(raw: string): any {
    if (!raw) return null;
    let text = raw.trim();

    // Remover bloques de markdown ```json ... ``` o ``` ... ```
    if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    // Buscar el primer { y el último }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        // Intento de reparación básica para strings truncados
        try {
            let repaired = text;
            const openBraces = (repaired.match(/{/g) || []).length;
            const closeBraces = (repaired.match(/}/g) || []).length;
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;

            // Cerrar strings si quedaron abiertos
            if ((repaired.match(/"/g) || []).length % 2 !== 0) {
                repaired += '"';
            }
            // Cerrar brackets
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                repaired += "]";
            }
            // Cerrar llaves
            for (let i = 0; i < openBraces - closeBraces; i++) {
                repaired += "}";
            }
            return JSON.parse(repaired);
        } catch (repairErr) {
            console.error("JSON parse and repair failed:", repairErr);
            return null;
        }
    }
}

// ─── Proveedor 1: Google Gemini API Directa ──────────────────────────────────
async function processWithGemini(images: string[]): Promise<any | null> {
    if (!GEMINI_API_KEY) return null;

    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

    for (const model of models) {
        try {
            const parts: any[] = [{ text: `${SYSTEM_PROMPT}\n\nAnaliza estas ${images.length} imágenes de la carta y devuelve el JSON:` }];

            for (const img of images) {
                if (img.startsWith("data:")) {
                    const matches = img.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                    if (matches) {
                        parts.push({
                            inline_data: {
                                mime_type: matches[1],
                                data: matches[2],
                            },
                        });
                    }
                } else {
                    // Si es URL remota, intentamos descargarla como buffer base64
                    try {
                        const res = await fetch(img);
                        const buffer = await res.arrayBuffer();
                        const base64 = Buffer.from(buffer).toString("base64");
                        const contentType = res.headers.get("content-type") || "image/jpeg";
                        parts.push({
                            inline_data: {
                                mime_type: contentType,
                                data: base64,
                            },
                        });
                    } catch (fetchErr) {
                        console.warn("Error fetching remote image for Gemini:", img, fetchErr);
                    }
                }
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 8192,
                            responseMimeType: "application/json",
                        },
                    }),
                }
            );

            if (!response.ok) {
                const err = await response.text();
                console.warn(`Gemini API (${model}) failed HTTP ${response.status}:`, err);
                continue;
            }

            const resData = await response.json();
            const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
                const parsed = extractAndParseJson(rawText);
                if (parsed && (parsed.categories || Array.isArray(parsed))) {
                    console.log(`[OCR SUCCESS] Processed with direct Gemini API (${model})`);
                    return parsed;
                }
            }
        } catch (e: any) {
            console.warn(`Gemini API (${model}) exception:`, e.message);
        }
    }
    return null;
}

// ─── Proveedor 2: OpenRouter Vision ──────────────────────────────────────────
async function processWithOpenRouter(images: string[]): Promise<any | null> {
    if (!OPENROUTER_API_KEY) return null;

    const userContent: any[] = [
        {
            type: "text",
            text: "Analiza estas imágenes de nuestro menú y extrae la información en el formato JSON solicitado:",
        },
    ];

    for (const img of images) {
        userContent.push({
            type: "image_url",
            image_url: {
                url: img,
            },
        });
    }

    for (const model of OPENROUTER_VISION_MODELS) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "https://activaqr.com",
                    "X-Title": "ActivaQR Menu Generator",
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: userContent },
                    ],
                    temperature: 0.1,
                    max_tokens: 8192,
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.warn(`OpenRouter Model ${model} failed HTTP ${response.status}: ${errText}`);
                continue;
            }

            const data = await response.json();
            const rawContent = data.choices?.[0]?.message?.content?.trim();

            if (!rawContent) continue;

            const jsonOutput = extractAndParseJson(rawContent);
            if (jsonOutput && (jsonOutput.categories || Array.isArray(jsonOutput))) {
                console.log(`[OCR SUCCESS] Processed with OpenRouter model: ${model}`);
                return jsonOutput;
            }
        } catch (err: any) {
            console.warn(`OpenRouter Model ${model} exception:`, err.message);
        }
    }
    return null;
}

// ─── Proveedor 3: OpenAI Directo (GPT-4o Mini) ───────────────────────────────
async function processWithOpenAI(images: string[]): Promise<any | null> {
    if (!OPENAI_API_KEY) return null;

    try {
        const userContent: any[] = [
            {
                type: "text",
                text: "Analiza estas imágenes de la carta y devuelve el JSON estructurado:",
            },
        ];

        for (const img of images) {
            userContent.push({
                type: "image_url",
                image_url: { url: img },
            });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userContent },
                ],
                temperature: 0.1,
                max_tokens: 8192,
                response_format: { type: "json_object" },
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const rawContent = data.choices?.[0]?.message?.content?.trim();
            if (rawContent) {
                const parsed = extractAndParseJson(rawContent);
                if (parsed) {
                    console.log("[OCR SUCCESS] Processed with OpenAI gpt-4o-mini");
                    return parsed;
                }
            }
        }
    } catch (e: any) {
        console.warn("OpenAI Direct exception:", e.message);
    }
    return null;
}

// ─── Handler Principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const { images } = await req.json();

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json(
                { error: "Se requiere al menos una imagen (URL o Base64)" },
                { status: 400 }
            );
        }

        // Limitar a un máximo de 10 imágenes por petición
        const imagesToProcess = images.slice(0, 10);

        // 1. Intentar primero con Gemini API Directa (más rápida, mayor ventana y sin límites artificiales)
        let result = await processWithGemini(imagesToProcess);

        // 2. Si falla o no está disponible, intentar con OpenRouter (Multi-model Vision)
        if (!result) {
            result = await processWithOpenRouter(imagesToProcess);
        }

        // 3. Si falla, intentar con OpenAI Directo (GPT-4o Mini)
        if (!result) {
            result = await processWithOpenAI(imagesToProcess);
        }

        if (result) {
            const consolidatedData = consolidateMenuCategories(result);
            return NextResponse.json({
                success: true,
                data: consolidatedData,
            });
        }

        return NextResponse.json(
            {
                error: "No se pudo procesar el menú con los modelos disponibles. Inténtalo de nuevo con fotos más nítidas o menos fotos a la vez.",
            },
            { status: 500 }
        );
    } catch (error: any) {
        console.error("Error en /api/menu/process:", error);
        return NextResponse.json(
            { error: "Error interno del servidor", details: error.message },
            { status: 500 }
        );
    }
}

