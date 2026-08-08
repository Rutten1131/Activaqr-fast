import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Hasta 60s para procesamiento con visión

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

// Modelos gratuitos de visión en orden de preferencia
const VISION_MODELS = [
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-nano-12b-v2-vl:free",
];

const SYSTEM_PROMPT = `Eres un asistente experto en OCR y gastronomía. 
Tu trabajo es analizar fotos de cartas o menús de restaurantes, cafeterías o bares, extraer TODO el texto visible y organizarlo estructuradamente.

REGLAS OBLIGATORIAS:
1. Extrae todos los platos, bebidas, combos, postres y promociones con sus respectivos precios y descripciones si existen.
2. Agrupa los productos en categorías lógicas (ej: "Entradas", "Platos Fuertes", "Bebidas", "Postres", "Especialidades", etc.).
3. Formatea los precios correctamente con su símbolo (ej: "$5.00", "$2.50").
4. Si un plato no tiene precio visible, pon "".
5. Responde ÚNICAMENTE un objeto JSON válido con la siguiente estructura, SIN markdown de triple comilla, SIN explicaciones:

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

        // Construir contenido para OpenRouter
        const userContent: any[] = [
            {
                type: "text",
                text: "Analiza estas imágenes de nuestro menú y extrae la información en el formato JSON solicitado:",
            },
        ];

        for (const img of imagesToProcess) {
            userContent.push({
                type: "image_url",
                image_url: {
                    url: img.startsWith("data:") ? img : img,
                },
            });
        }

        let lastError = "";

        // Intentar con los modelos disponibles
        for (const model of VISION_MODELS) {
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
                        max_tokens: 3000,
                    }),
                });

                if (!response.ok) {
                    const errText = await response.text();
                    lastError = `Model ${model} failed HTTP ${response.status}: ${errText}`;
                    console.warn(lastError);
                    continue;
                }

                const data = await response.json();
                const rawContent = data.choices?.[0]?.message?.content?.trim();

                if (!rawContent) {
                    lastError = `Model ${model} returned empty content`;
                    continue;
                }

                // Limpiar posibles bloques de código markdown
                const cleanedContent = rawContent
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .trim();

                const jsonOutput = JSON.parse(cleanedContent);

                if (jsonOutput && jsonOutput.categories) {
                    return NextResponse.json({
                        success: true,
                        modelUsed: model,
                        data: jsonOutput,
                    });
                }
            } catch (err: any) {
                lastError = `Model ${model} exception: ${err.message}`;
                console.error(lastError);
            }
        }

        return NextResponse.json(
            {
                error: "No se pudo procesar el menú con los modelos disponibles. Inténtalo de nuevo con fotos más nítidas.",
                details: lastError,
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
