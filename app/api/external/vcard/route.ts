import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isRateLimited, getClientIP } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * External API endpoint for the Meta WhatsApp Bot to look up vCard data by slug.
 * 
 * Usage:
 *   GET /api/external/vcard?slug=juan-perez-a3b2
 *   Headers: { "x-api-key": "EXTERNAL_API_KEY" }
 * 
 * Returns: JSON with client data + VCF download URL
 */
export async function GET(req: NextRequest) {
    // 1. Authenticate with external API key
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.EXTERNAL_API_KEY;

    if (!expectedKey) {
        console.error('[external/vcard] EXTERNAL_API_KEY not configured');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!apiKey || apiKey !== expectedKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limiting: 30 requests per minute
    const clientIP = getClientIP(req);
    if (isRateLimited(`external-vcard:${clientIP}`, 30, 60000)) {
        return NextResponse.json(
            { error: 'Too many requests. Try again later.' },
            { status: 429 }
        );
    }

    // 3. Get slug from query params
    const slug = req.nextUrl.searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Parameter "slug" is required' }, { status: 400 });
    }

    try {
        // 4. Query DB for the client by slug (only active/paid registrations)
        const [rows]: any = await pool.execute(
            `SELECT 
                id, slug, nombre, email, whatsapp, profesion, empresa, bio, direccion,
                web, google_business, instagram, linkedin, facebook, tiktok, youtube, x,
                productos_servicios, plan, foto_url, etiquetas, edit_code,
                tipo_perfil, nombres, apellidos, nombre_negocio, contacto_nombre, contacto_apellido,
                menu_digital, template_id, status, mensaje
            FROM registraya_vcard_registros 
            WHERE slug = ? 
            AND status IN ('pagado', 'entregado')
            LIMIT 1`,
            [slug]
        );

        const results = rows as any[];

        if (results.length === 0) {
            return NextResponse.json({ error: 'Contact not found or not active' }, { status: 404 });
        }

        const record = results[0];

        // 5. Build the VCF download URL
        const origin = req.headers.get('origin') || req.headers.get('host') || 'https://activaqr.com';
        const protocol = origin.startsWith('http') ? '' : 'https://';
        const vcfUrl = `${protocol}${origin}/api/vcard/${record.slug}`;

        // 6. Return client data
        return NextResponse.json({
            success: true,
            client: {
                nombre: record.nombre,
                email: record.email,
                whatsapp: record.whatsapp,
                profesion: record.profesion,
                empresa: record.empresa,
                bio: record.bio,
                foto_url: record.foto_url,
                plan: record.plan,
                slug: record.slug,
                tipo_perfil: record.tipo_perfil,
                template_id: record.template_id,
            },
            vcf_url: vcfUrl,
            card_url: `https://activaqr.com/card/${record.slug}`,
            mensaje: (() => {
                if (record.mensaje && record.mensaje.trim()) {
                    return record.mensaje.trim();
                }
                
                // Fallback dinámico si el usuario no ha personalizado su mensaje
                if (record.tipo_perfil === 'negocio') {
                    const name = record.nombre_negocio || record.nombre || 'nuestro negocio';
                    
                    // Extraer descripción corta del negocio (prioriza bio, luego productos_servicios)
                    let desc = '';
                    const rawDesc = record.bio || record.productos_servicios;
                    if (rawDesc && rawDesc.trim()) {
                        let cleanDesc = rawDesc.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
                        if (cleanDesc.length > 80) {
                            cleanDesc = cleanDesc.substring(0, 77) + '...';
                        }
                        desc = ` (${cleanDesc})`;
                    }

                    return `¡Hola {nombre}! Te comparto el contacto digital de ${name}${desc}. 🤝\n\nGuarda su contacto digital aquí abajo 👇`;
                } else {
                    const name = record.nombre || 'mi contacto';
                    
                    // Extraer descripción corta de la persona (prioriza profesión + empresa, luego bio)
                    let desc = '';
                    if (record.profesion && record.profesion.trim()) {
                        const companyStr = (record.empresa && record.empresa.trim()) ? ` en ${record.empresa.trim()}` : '';
                        desc = ` (${record.profesion.trim()}${companyStr})`;
                    } else if (record.bio && record.bio.trim()) {
                        let cleanBio = record.bio.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
                        if (cleanBio.length > 80) {
                            cleanBio = cleanBio.substring(0, 77) + '...';
                        }
                        desc = ` (${cleanBio})`;
                    }

                    return `¡Hola {nombre}! Te comparto el contacto digital de ${name}${desc}. 🤝\n\nGuarda su contacto digital aquí abajo 👇`;
                }
            })(),
        });

    } catch (err: any) {
        console.error('[external/vcard] Database error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
