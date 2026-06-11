import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─────────────────────────────────────────────────
// Utilidad de reparación de JSON truncado
// ─────────────────────────────────────────────────
function repairTruncatedJsonExhaustive(str: string | null | undefined): any[] | null {
    if (!str) return null;
    const trimmed = str.trim();
    
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* continuar */ }

    const candidates = ['', ']', '}', '}]', '}}]', ']}]', '}]}]', '"}]', '"}', ',""}]', ',[]}]', '}]}', ']}'];

    for (let i = trimmed.length; i > 0; i--) {
        const sub = trimmed.substring(0, i);
        for (const cand of candidates) {
            try {
                const repaired = sub + cand;
                const parsed = JSON.parse(repaired);
                if (Array.isArray(parsed)) return parsed;
            } catch (err) { /* ignorar */ }
        }
    }
    return null;
}

// ─────────────────────────────────────────────────
// PROMPT DEL SISTEMA (idéntico para todos los proveedores)
// ─────────────────────────────────────────────────
const SYSTEM_PROMPT = "Eres un experto en estructuración de catálogos que responde únicamente con arreglos JSON válidos y limpios.";

const USER_PROMPT_TEMPLATE = `Actúa como un experto en estructuración de datos para catálogos de servicios. 
Tu tarea es convertir un texto plano que describe los servicios de un negocio en un formato JSON específico para una interfaz de usuario premium.

ESQUEMA REQUERIDO:
Un arreglo de categorías, donde cada categoría tiene un nombre y un arreglo de items.
[
  {
    "name": "Nombre de la Categoría",
    "items": [
      { 
        "name": "Nombre del Servicio", 
        "price": "Precio (ej: '15.00', 'Desde $10' o 'Consulta')", 
        "desc": "Descripción muy breve (máximo 8 palabras)"
      }
    ]
  }
]

REGLAS STRICT:
1. Agrupa los servicios lógicamente en categorías basadas en el texto (ej: Peluquería Profesional, Nail Spa & Estética, Maquillaje & Eventos).
2. Si el texto no menciona precios, pon "Consulta" o inventa un precio lógico coherente (ej: "15.00", "20.00").
3. NO agregues campos extras como "tags", "highlight", "size" o "image" que no estén en el esquema. Esto es sumamente importante para reducir tamaño.
4. Mantén las descripciones extremadamente cortas (máximo 8 palabras) para conservar tokens y acelerar el tiempo de respuesta.
5. Asegúrate de que el JSON sea válido. Devuelve SOLAMENTE el JSON puro, sin bloques markdown (\`\`\`json).

TEXTO A PROCESAR:
---
{TEXT}
---

RESPUESTA:`;

// ─────────────────────────────────────────────────
// Función auxiliar: limpiar respuesta JSON
// ─────────────────────────────────────────────────
function parseAndFixJsonResponse(content: string): string | null {
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const repairedArray = repairTruncatedJsonExhaustive(cleanContent);
    if (repairedArray) return JSON.stringify(repairedArray);
    // Si el parsing directo funciona, devolverlo
    try {
        JSON.parse(cleanContent);
        return cleanContent;
    } catch { return null; }
}

// ─────────────────────────────────────────────────
// PROVIDER 1: DeepSeek
// ─────────────────────────────────────────────────
async function tryDeepSeek(text: string): Promise<string | null> {
    try {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) return null;

        const openai = new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey,
        });

        const response = await openai.chat.completions.create({
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: USER_PROMPT_TEMPLATE.replace('{TEXT}', text) }
            ],
            temperature: 0.3,
            max_tokens: 4000,
        });

        const content = response.choices[0].message.content?.trim() || '';
        console.log('[DeepSeek] Respuesta recibida, length:', content.length);
        return parseAndFixJsonResponse(content);
    } catch (err: any) {
        console.warn('[DeepSeek] Error:', err.message);
        return null;
    }
}

// ─────────────────────────────────────────────────
// PROVIDER 2: Gemini
// ─────────────────────────────────────────────────
async function tryGemini(text: string): Promise<string | null> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return null;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = USER_PROMPT_TEMPLATE.replace('{TEXT}', text);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text().trim();

        console.log('[Gemini] Respuesta recibida, length:', content.length);
        return parseAndFixJsonResponse(content);
    } catch (err: any) {
        console.warn('[Gemini] Error:', err.message);
        return null;
    }
}

// ─────────────────────────────────────────────────
// PROVIDER 3: Groq (LLaMA 3)
// ─────────────────────────────────────────────────
async function tryGroq(text: string): Promise<string | null> {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return null;

        const openai = new OpenAI({
            baseURL: 'https://api.groq.com/openai/v1',
            apiKey,
        });

        const response = await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: USER_PROMPT_TEMPLATE.replace('{TEXT}', text) }
            ],
            temperature: 0.3,
            max_tokens: 4000,
        });

        const content = response.choices[0].message.content?.trim() || '';
        console.log('[Groq] Respuesta recibida, length:', content.length);
        return parseAndFixJsonResponse(content);
    } catch (err: any) {
        console.warn('[Groq] Error:', err.message);
        return null;
    }
}

// ─────────────────────────────────────────────────
// ENDPOINT PRINCIPAL (Cascada DeepSeek → Gemini → Groq)
// ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text || text.length < 10) {
            return NextResponse.json({ error: 'Texto insuficiente para procesar' }, { status: 400 });
        }

        console.log('[structure-menu] Procesando texto de longitud:', text.length);

        // Cascada: intentar en orden de prioridad
        let result: string | null = null;
        let providerUsed = '';

        // 1️⃣ DeepSeek
        console.log('[structure-menu] Intentando DeepSeek...');
        result = await tryDeepSeek(text);
        if (result) {
            providerUsed = 'DeepSeek';
            console.log('[structure-menu] ✓ DeepSeek funcionó');
            return NextResponse.json({ json: result, provider: providerUsed });
        }

        // 2️⃣ Gemini
        console.log('[structure-menu] DeepSeek falló, intentando Gemini...');
        result = await tryGemini(text);
        if (result) {
            providerUsed = 'Gemini';
            console.log('[structure-menu] ✓ Gemini funcionó');
            return NextResponse.json({ json: result, provider: providerUsed });
        }

        // 3️⃣ Groq
        console.log('[structure-menu] Gemini falló, intentando Groq...');
        result = await tryGroq(text);
        if (result) {
            providerUsed = 'Groq';
            console.log('[structure-menu] ✓ Groq funcionó');
            return NextResponse.json({ json: result, provider: providerUsed });
        }

        // ❌ Ninguno funcionó
        console.error('[structure-menu] ✗ Todos los proveedores fallaron');
        return NextResponse.json({
            error: 'Error al estructurar con IA',
            details: 'Ninguno de los proveedores de IA (DeepSeek, Gemini, Groq) pudo procesar tu solicitud. Verifica tus API keys.'
        }, { status: 500 });

    } catch (error: any) {
        console.error('[structure-menu] Error general:', error);
        return NextResponse.json({
            error: 'Error al procesar con IA',
            details: error.message || 'Error desconocido'
        }, { status: 500 });
    }
}
