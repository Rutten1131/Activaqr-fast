import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Diccionario local de respaldo para generar etiquetas sin IA si falla todo
const LOCAL_KEYWORDS: Record<string, string[]> = {
    electricista: ['electricidad', 'instalaciones electricas', 'cortocircuitos', 'tableros electricos', 'mantenimiento electrico', 'iluminacion led', 'emergencias electricas'],
    plomero: ['plomeria', 'fontaneria', 'reparacion de fugas', 'destape de cañerias', 'instalacion de sanitarios', 'filtraciones de agua', 'plomero urgente'],
    abogado: ['asesoria legal', 'abogado defensor', 'juicios', 'derecho civil', 'derecho laboral', 'tramites legales', 'consultoria juridica'],
    doctor: ['consulta medica', 'medico especialista', 'salud integral', 'atencion medica', 'diagnostico medico', 'recetas medicas', 'medicina general'],
    dentista: ['salud bucal', 'limpieza dental', 'ortodoncia', 'blanqueamiento dental', 'extraccion dental', 'odontologia integral', 'dentista ecuador'],
    carpintero: ['carpinteria', 'muebles a medida', 'muebles de madera', 'reparacion de muebles', 'puertas de madera', 'cocinas modulares'],
    enfermera: ['cuidados de enfermeria', 'enfermeria a domicilio', 'atencion de pacientes', 'curaciones', 'inyecciones', 'cuidado de adultos mayores'],
    tecnico: ['servicio tecnico', 'reparaciones a domicilio', 'mantenimiento preventivo', 'diagnostico tecnico', 'repuestos y repaciones'],
    arquitecto: ['diseno arquitectonico', 'planos de construccion', 'remodelaciones', 'supervision de obras', 'arquitectura moderna'],
    contador: ['contabilidad general', 'declaracion de impuestos', 'sri ecuador', 'asesoria tributaria', 'auditoria contable', 'balances financieros'],
    chef: ['gastronomia', 'servicio de catering', 'comida a domicilio', 'eventos y banquetes', 'menu especial', 'cocina profesional'],
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { company, bio, products, plan, profession } = body;

        const tagCount = plan === 'pro' || plan === 'digital' ? 30 : 20;
        const combinedText = `
            Negocio: ${company || ''}
            Profesión: ${profession || ''}
            Descripción: ${bio || ''}
            Productos/Servicios: ${products || ''}
        `.trim();

        if (!combinedText || combinedText.length < 3) {
            return NextResponse.json({ error: 'Ingresa al menos la profesión o nombre para generar etiquetas' }, { status: 400 });
        }

        const prompt = `Actúa como un experto en marketing y SEO en Ecuador. 
Genera una lista de exactamente ${tagCount} etiquetas o palabras clave únicas y efectivas basadas en la siguiente información de un negocio:
---
${combinedText}
---
Las etiquetas deben ser términos que los clientes en Ecuador usarían para buscar estos servicios específicamente.
Usa terminología local ecuatoriana.
Formato: Devuelve SOLO las etiquetas separadas por comas, sin numeración, sin tildes si es posible para SEO, ni texto adicional.`;

        let generatedTags: string | null = null;

        // Lista de llaves de Groq desde variables de entorno
        const groqKeys = [
            process.env.GROQ_API_KEY_1,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY
        ].filter(Boolean) as string[];

        // ── 1. CASCADA GROQ ───────────────────────────────────────────
        for (let i = 0; i < groqKeys.length; i++) {
            const key = groqKeys[i];
            try {
                const groqClient = new OpenAI({
                    baseURL: 'https://api.groq.com/openai/v1',
                    apiKey: key,
                });

                const response = await groqClient.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: 'Eres un asistente ecuatoriano experto en SEO local.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                });

                generatedTags = response.choices[0]?.message?.content?.trim() || null;
                if (generatedTags) {
                    console.log(`[generate-tags] Success using Groq Key #${i + 1}`);
                    return NextResponse.json({ tags: generatedTags });
                }
            } catch (groqErr: any) {
                console.warn(`[generate-tags] Groq Key #${i + 1} failed:`, groqErr?.message || groqErr);
            }
        }

        // ── 2. DEEPSEEK FALLBACK ──────────────────────────────────────
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        if (!generatedTags && deepseekKey) {
            try {
                const dsClient = new OpenAI({
                    baseURL: 'https://api.deepseek.com',
                    apiKey: deepseekKey,
                });
                const response = await dsClient.chat.completions.create({
                    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
                    messages: [
                        { role: "system", content: "Eres un asistente ecuatoriano experto en SEO local." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                });
                generatedTags = response.choices[0]?.message?.content?.trim() || null;
                if (generatedTags) {
                    console.log('[generate-tags] Success using DeepSeek');
                    return NextResponse.json({ tags: generatedTags });
                }
            } catch (e: any) {
                console.warn('[generate-tags] DeepSeek failed:', e?.message);
            }
        }

        // ── 3. OPENAI FALLBACK ────────────────────────────────────────
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!generatedTags && openaiKey) {
            try {
                const oaClient = new OpenAI({
                    apiKey: openaiKey,
                });
                const response = await oaClient.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "Eres un asistente ecuatoriano experto en SEO local." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                });
                generatedTags = response.choices[0]?.message?.content?.trim() || null;
                if (generatedTags) {
                    console.log('[generate-tags] Success using OpenAI');
                    return NextResponse.json({ tags: generatedTags });
                }
            } catch (e: any) {
                console.warn('[generate-tags] OpenAI failed:', e?.message);
            }
        }

        // ── 4. FALLBACK ALGORÍTMICO LOCAL ─────────────────────────────
        console.log('[generate-tags] Using local fallback generator');
        const fallbackTags: string[] = [];

        if (profession) fallbackTags.push(profession.trim());
        if (company) fallbackTags.push(company.trim());
        
        const textLower = (profession + ' ' + company + ' ' + bio + ' ' + products).toLowerCase();
        for (const [key, list] of Object.entries(LOCAL_KEYWORDS)) {
            if (textLower.includes(key)) {
                fallbackTags.push(...list);
            }
        }

        if (fallbackTags.length < 5) {
            fallbackTags.push(
                'contacto profesional', 'servicios profesionales', 'atencion personalizada', 
                'ecuador', 'servicios ecuador', 'contacto digital', 'negocio local', 'profesional capacitado'
            );
        }

        const uniqueTags = Array.from(new Set(fallbackTags)).slice(0, tagCount).join(', ');
        return NextResponse.json({ tags: uniqueTags });

    } catch (error: any) {
        console.error('Error in generate-tags API:', error);
        return NextResponse.json({
            tags: "contacto profesional, servicios profesionales, atencion personalizada, ecuador, negocio local"
        });
    }
}
