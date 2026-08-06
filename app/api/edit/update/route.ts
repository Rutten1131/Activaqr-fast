import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { formatPhoneEcuador } from '@/lib/utils';
import { syncMenuDigitalToRelational } from '@/lib/menuSync';

export const dynamic = 'force-dynamic';

async function resolveShortUrl(url: string | null | undefined): Promise<string | null | undefined> {
    if (!url) return url;
    const lower = url.toLowerCase().trim();
    
    const shouldResolve = 
        lower.includes('vm.tiktok.com') || 
        lower.includes('vt.tiktok.com') || 
        lower.includes('fb.watch') || 
        lower.includes('facebook.com/share') ||
        lower.includes('facebook.com/watch') ||
        lower.includes('fb.gg') ||
        lower.includes('instagram.com/reel') ||
        lower.includes('instagram.com/p');
        
    if (!shouldResolve) return url;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
            }
        });
        clearTimeout(timeoutId);

        const finalUrl = response.url;
        
        // Si responde 200 y el body contiene og:url o canonical (común en redirects camuflados de Meta)
        if (response.status === 200) {
            const html = await response.text();
            
            const ogUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i) || 
                               html.match(/<meta\s+content="([^"]+)"\s+property="og:url"/i);
            
            const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || 
                                   html.match(/<link\s+href="([^"]+)"\s+rel="canonical"/i);
            
            const extracted = ogUrlMatch ? ogUrlMatch[1] : (canonicalMatch ? canonicalMatch[1] : null);
            if (extracted && extracted.startsWith('http')) {
                return extracted;
            }
        }

        return finalUrl || url;
    } catch (e) {
        console.error('Failed to resolve short URL:', url, e);
        return url;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { code, data, slug } = await req.json();

        if (!code || !data) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        // Resolver URL corta de video si existe
        if (data.youtube_video_url) {
            data.youtube_video_url = await resolveShortUrl(data.youtube_video_url);
        }
        console.log('[DEBUG UPDATE API] Received hero_slides_json:', JSON.stringify(data.hero_slides_json));

        // Resolver URLs cortas de videos dentro de catalogo_json si existe
        if (data.catalogo_json) {
            try {
                let parsed = typeof data.catalogo_json === 'string' 
                    ? JSON.parse(data.catalogo_json) 
                    : data.catalogo_json;

                if (parsed && parsed.products && Array.isArray(parsed.products)) {
                    for (let i = 0; i < parsed.products.length; i++) {
                        const prod = parsed.products[i];
                        if (prod.videos && Array.isArray(prod.videos)) {
                            prod.videos = await Promise.all(prod.videos.map(async (vUrl: string) => {
                                return await resolveShortUrl(vUrl);
                            }));
                        }
                        if (prod.video) {
                            prod.video = await resolveShortUrl(prod.video);
                        }
                    }
                    data.catalogo_json = parsed;
                }
            } catch (e) {
                console.error('Error resolving video URLs in catalogo_json:', e);
            }
        }


        const connection = await pool.getConnection();

        try {
            // 1. Validate code and remaining uses again (scoped by slug if provided)
            let checkQuery = 'SELECT id, edit_uses_remaining FROM registraya_vcard_registros WHERE UPPER(edit_code) = UPPER(?)';
            const checkParams = [code];
            
            if (slug) {
                checkQuery += ' AND slug = ?';
                checkParams.push(slug);
            }

            const [rows] = await connection.execute(checkQuery, checkParams);

            const user = (rows as any[])[0];

            if (!user) {
                return NextResponse.json({ error: 'Código inválido para este perfil' }, { status: 401 });
            }



            // Calculate new nombre, but preserve existing if new would be empty
            let nombreLegacy = data.tipo_perfil === 'negocio'
                ? data.nombre_negocio
                : `${data.nombres || ''} ${data.apellidos || ''}`.trim();
            
            // If the computed nombre is empty, preserve the existing one from DB
            if (!nombreLegacy) {
                const [currentRows] = await connection.execute(
                    'SELECT nombre FROM registraya_vcard_registros WHERE id = ?',
                    [user.id]
                );
                const currentRecord = (currentRows as any[])[0];
                if (currentRecord?.nombre) {
                    nombreLegacy = currentRecord.nombre;
                }
            }

            let updateQuery = `
                UPDATE registraya_vcard_registros SET
                    whatsapp = ?,
                    profesion = ?,
                    empresa = ?,
                    bio = ?,
                    direccion = ?,
                    web = ?,
                    google_business = ?,
                    instagram = ?,
                    linkedin = ?,
                    facebook = ?,
                    tiktok = ?,
                    youtube = ?,
                    x = ?,
                    productos_servicios = ?,
                    etiquetas = ?,
                    email = ?,
                    seller_id = ?,
                    tipo_perfil = ?,
                    nombres = ?,
                    apellidos = ?,
                    nombre_negocio = ?,
                    contacto_nombre = ?,
                    contacto_apellido = ?,
                    nombre = ?,
                    menu_digital = ?,
                    wifi_ssid = ?,
                    wifi_password = ?,
                    portada_desktop = ?,
                    portada_movil = ?,
                    hero_button_text = ?,
                    hero_action = ?,
                    hero_file_url = ?,
                    hero_external_link = ?,
                    hero_wifi_steps = ?,
                    hero_section_title = ?,
                    hero_step1_title = ?,
                    hero_step2_title = ?,
                    hero_step2_text = ?,
                    hero_step3_title = ?,
                    hero_step3_text = ?,
                    catalogo_json = ?,
                    hero_slides_json = ?,
                    youtube_video_url = ?,
                    google_rating = ?,
                    google_reviews_count = ?,
                    template_id = ?,
                    json_override = ?,
                    mensaje = ?,
                    last_edited_at = NOW()
            `;

            const queryParams: any[] = [
                formatPhoneEcuador(data.whatsapp || ''),
                data.profession ?? data.profesion ?? null,
                data.company ?? data.empresa ?? null,
                data.bio ?? null,
                data.address ?? data.direccion ?? null,
                data.web ?? null,
                data.google_business ?? null,
                data.instagram ?? null,
                data.linkedin ?? null,
                data.facebook ?? null,
                data.tiktok ?? null,
                data.youtube ?? null,
                data.x ?? null,
                data.productos_servicios ?? data.products ?? null,
                data.etiquetas ?? data.categories ?? null,
                data.email || null,
                data.sellerCode ?? data.seller_id ?? null,
                data.tipo_perfil || 'persona',
                data.nombres || '',
                data.apellidos || '',
                data.nombre_negocio || '',
                data.contacto_nombre || '',
                data.contacto_apellido || '',
                nombreLegacy || '',
                data.menu_digital || null,
                data.wifi_ssid || null,
                data.wifi_password || null,
                data.portada_desktop || null,
                data.portada_movil || null,
                data.hero_button_text || null,
                data.hero_action || 'wifi',
                data.hero_file_url || null,
                data.hero_external_link || null,
                data.hero_wifi_steps ? (Array.isArray(data.hero_wifi_steps) ? JSON.stringify(data.hero_wifi_steps) : data.hero_wifi_steps) : null,
                data.hero_section_title || 'Oferta del Hero',
                data.hero_step1_title || 'Descarga Nuestro Contacto',
                data.hero_step2_title || 'Asegurate de importar el contacto',
                data.hero_step2_text || null,
                data.hero_step3_title || 'Conéctate a la Red',
                data.hero_step3_text || null,
                data.catalogo_json ? (typeof data.catalogo_json === 'string' ? data.catalogo_json : JSON.stringify(data.catalogo_json)) : null,
                data.hero_slides_json ? (typeof data.hero_slides_json === 'string' ? data.hero_slides_json : JSON.stringify(data.hero_slides_json)) : null,
                data.youtube_video_url || null,
                data.google_rating || null,
                data.google_reviews_count || null,
                data.template_id || 'classic',
                data.json_override ? (typeof data.json_override === 'string' ? data.json_override : JSON.stringify(data.json_override)) : null,
                data.mensaje || null
            ];

            // If foto_url is provided (base64 from frontend), update it
            if (data.foto_url && data.foto_url.length > 0) {
                updateQuery += `, foto_url = ? `;
                queryParams.push(data.foto_url);
            }

            updateQuery += ` WHERE id = ?`;
            queryParams.push(user.id);

            await connection.execute(updateQuery, queryParams);

            // Synchronize menu_digital string with relational database tables
            try {
                await syncMenuDigitalToRelational(connection, user.id, data.menu_digital);
            } catch (syncErr) {
                console.error("Error syncing menu to relational tables in update route:", syncErr);
            }

            return NextResponse.json({
                success: true,
                message: 'Perfil actualizado correctamente',
                remaining: 'Ilimitado'
            });

        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 });
    }
}
