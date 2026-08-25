import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
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
        const body = await req.json();

        let {
            nombre, email, profesion, empresa, bio, direccion,
            web, google_business, instagram, linkedin, facebook, tiktok, youtube, x, productos_servicios,
            plan, foto_url, comprobante_url, galeria_urls,
            slug, etiquetas, seller_id, edit_code, // Added edit_code for verification
            tipo_perfil, nombres, apellidos, nombre_negocio, contacto_nombre, contacto_apellido,
            menu_digital, wifi_ssid, wifi_password,
            portada_movil, portada_desktop, catalogo_json,
            google_rating, google_reviews_count, youtube_video_url,
            hero_action, hero_button_text, hero_file_url, hero_external_link, hero_wifi_steps,
            hero_section_title, hero_step1_title, hero_step1_text, hero_step2_title, hero_step2_text, hero_step3_title, hero_step3_text,
            hero_slides_json, template_id, menu_data
        } = body;

        // Si se envió un menu_data de la IA (objeto), convertirlo a JSON string para menu_digital si no hay menu_digital explícito
        if (menu_data && menu_data.categories) {
            menu_digital = JSON.stringify(menu_data.categories);
        }

        // Resolver URL corta de video si existe
        if (youtube_video_url) {
            youtube_video_url = await resolveShortUrl(youtube_video_url);
        }

        // Resolver URLs cortas de videos dentro de catalogo_json si existe
        if (catalogo_json) {
            try {
                let parsed = typeof catalogo_json === 'string' 
                    ? JSON.parse(catalogo_json) 
                    : catalogo_json;

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
                    if (typeof catalogo_json === 'string') {
                        catalogo_json = JSON.stringify(parsed);
                    } else {
                        catalogo_json = parsed;
                    }
                    body.catalogo_json = catalogo_json;
                }
            } catch (e) {
                console.error('Error resolving video URLs in catalogo_json on register:', e);
            }
        }




        // SECURITY: Never accept 'pagado' status from client unless it is a solidario campaign or seller direct.
        let finalStatus = body.status;
        if (finalStatus === 'pagado' && body.payment_method !== 'solidario' && body.payment_method !== 'seller_direct') {
            console.warn(`SECURITY: Attempted status bypass for ${email}`);
            finalStatus = 'pendiente';
        }

        const whatsapp = formatPhoneEcuador(body.whatsapp || '');

        // Calculate legacy name for compatibility and validation
        const finalNombre = nombre || (tipo_perfil === 'negocio'
            ? nombre_negocio
            : `${nombres || ''} ${apellidos || ''}`.trim());

        // Basic validation
        if (!email || !finalNombre) {
            return NextResponse.json({ error: 'Email y Nombre son requeridos' }, { status: 400 });
        }

        try {
            // Check if user exists (by email) to determine Insert or Update
            const [rows] = await pool.execute(
                'SELECT id, slug, edit_code FROM registraya_vcard_registros WHERE email = ?',
                [email]
            );

            // Prepare JSON fields
            const galeriaUrlsJson = JSON.stringify(galeria_urls || []);
            const catalogoJsonStr = catalogo_json ? (typeof catalogo_json === 'string' ? catalogo_json : JSON.stringify(catalogo_json)) : null;
            const heroWifiStepsStr = hero_wifi_steps ? (typeof hero_wifi_steps === 'string' ? hero_wifi_steps : JSON.stringify(hero_wifi_steps)) : null;
            const heroSlidesJsonStr = hero_slides_json ? (typeof hero_slides_json === 'string' ? hero_slides_json : JSON.stringify(hero_slides_json)) : null;

            if ((rows as any[]).length > 0) {
                // UPDATE - Requires validation
                const existingUser = (rows as any[])[0];

                // SECURITY: If updating existing record, must provide correct edit_code
                if (!edit_code || edit_code.toUpperCase() !== existingUser.edit_code.toUpperCase()) {
                    return NextResponse.json({
                        error: 'Este correo ya está registrado. Para actualizar tus datos, por favor usa tu Código de Edición o ve a la sección de edición.',
                        is_existing: true
                    }, { status: 403 });
                }

                const updateQuery = `
                    UPDATE registraya_vcard_registros SET
                        nombre=?, whatsapp=?, profesion=?, empresa=?, bio=?, direccion=?,
                        web=?, google_business=?, instagram=?, linkedin=?, facebook=?, tiktok=?, youtube=?, x=?,
                        productos_servicios=?, plan=?, foto_url=?, comprobante_url=?, galeria_urls=?,
                        status=?, paid_at = CASE WHEN ? = 'pagado' AND (paid_at IS NULL) THEN NOW() ELSE paid_at END,
                        slug=?, etiquetas=?, seller_id=?,
                        tipo_perfil=?, nombres=?, apellidos=?, nombre_negocio=?, contacto_nombre=?, contacto_apellido=?,
                        menu_digital=?, wifi_ssid=?, wifi_password=?,
                        portada_movil=?, portada_desktop=?, catalogo_json=?,
                        google_rating=?, google_reviews_count=?, youtube_video_url=?,
                        hero_action=?, hero_button_text=?, hero_file_url=?, hero_external_link=?, hero_wifi_steps=?,
                        hero_section_title=?, hero_step1_title=?, hero_step1_text=?, hero_step2_title=?, hero_step2_text=?, hero_step3_title=?, hero_step3_text=?,
                        hero_slides_json=?, template_id=?
                    WHERE email=?
                `;

                await pool.execute(updateQuery, [
                    finalNombre, whatsapp, profesion || null, empresa || null, bio || null, direccion || null,
                    web || null, google_business || null, instagram || null, linkedin || null, facebook || null, tiktok || null, youtube || null, x || null,
                    productos_servicios || null, plan || null, foto_url || null, comprobante_url || null, galeriaUrlsJson,
                    finalStatus || 'pendiente', finalStatus, slug || existingUser.slug, etiquetas || null, seller_id || null,
                    tipo_perfil || 'persona', nombres || null, apellidos || null, nombre_negocio || null, contacto_nombre || null, contacto_apellido || null,
                    menu_digital || null, wifi_ssid || null, wifi_password || null,
                    portada_movil || null, portada_desktop || null, catalogoJsonStr,
                    google_rating || null, google_reviews_count || null, youtube_video_url || null,
                    hero_action || null, hero_button_text || null, hero_file_url || null, hero_external_link || null, heroWifiStepsStr,
                    hero_section_title || null, hero_step1_title || null, hero_step1_text || null, hero_step2_title || null, hero_step2_text || null, hero_step3_title || null, hero_step3_text || null,
                    heroSlidesJsonStr, template_id || 'classic',
                ]);

                try {
                    await syncMenuDigitalToRelational(pool, existingUser.id, menu_digital);
                } catch (syncErr) {
                    console.error("Error syncing menu to relational tables in register UPDATE:", syncErr);
                }

                return NextResponse.json({ success: true, action: 'updated', id: existingUser.id });

            } else {
                // INSERT
                const newId = uuidv4();
                const now = new Date();
                const serverGeneratedEditCode = 'RYA-2026-' + Math.random().toString(36).substring(2, 8).toUpperCase();

                // Server-side slug generation if not provided
                let finalSlug = slug;
                if (!finalSlug) {
                    const cleanName = finalNombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
                    finalSlug = `${cleanName}-${Math.random().toString(36).substring(2, 6)}`;
                }

                // --- RESOLVE SELLER ID FROM CODE IF PROVIDED ---
                let finalSellerId = seller_id || null;
                const rawSellerCode = body.seller_code || body.seller_id;
                
                if ((!finalSellerId || typeof finalSellerId === 'string' || isNaN(Number(finalSellerId))) && rawSellerCode) {
                    try {
                        const codeStr = String(rawSellerCode).trim();
                        const cleanCode = codeStr.replace(/[^a-zA-Z0-9]/g, '');
                        const withHash = `#${cleanCode}`;

                        const [codeRows]: any = await pool.execute(`
                            SELECT id FROM registraya_vcard_sellers 
                            WHERE (
                                LOWER(code) = LOWER(?) OR LOWER(code) = LOWER(?) OR LOWER(REPLACE(code, "#", "")) = LOWER(?) OR
                                LOWER(codigo) = LOWER(?) OR LOWER(codigo) = LOWER(?) OR LOWER(REPLACE(codigo, "#", "")) = LOWER(?)
                            )
                              AND (activo = 1 OR activo IS NULL)
                            LIMIT 1
                        `, [codeStr, withHash, cleanCode, codeStr, withHash, cleanCode]);

                        if (codeRows.length > 0) {
                            finalSellerId = codeRows[0].id;
                            console.log(`[REGISTER] Resolved seller_code '${rawSellerCode}' to seller_id ${finalSellerId}`);
                        }
                    } catch (codeErr) {
                        console.error('Error resolving seller_code in register:', codeErr);
                    }
                }

                // --- FOOTPRINT ATTRIBUTION LOGIC ---
                let isFootprintAttributed = 0;

                try {
                    // Search for a visit in the last 90 days with a matching phone or email
                    // Footprint only applies if no manual seller_id was provided
                    if (!finalSellerId) {
                        const [footprintRows]: any = await pool.execute(`
                            SELECT seller_id 
                            FROM registraya_vcard_field_visits 
                            WHERE (contact_phone = ? OR (contact_email IS NOT NULL AND contact_email = ?))
                              AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
                            ORDER BY created_at DESC 
                            LIMIT 1
                        `, [whatsapp, email]);

                        if (footprintRows.length > 0) {
                            finalSellerId = footprintRows[0].seller_id;
                            isFootprintAttributed = 1;
                            console.log(`ATTRIBUTION: Footprint found for ${email}. Attributed to seller ${finalSellerId}`);
                        }
                    }
                } catch (attributionErr) {
                    console.error("Error checking footprint attribution:", attributionErr);
                }
                // -----------------------------------

                const insertQuery = `
                    INSERT INTO registraya_vcard_registros (
                        id, created_at, nombre, email, whatsapp, profesion, empresa, bio, direccion,
                        web, google_business, instagram, linkedin, facebook, tiktok, youtube, x, productos_servicios,
                        plan, foto_url, comprobante_url, galeria_urls, status, paid_at, slug, etiquetas,
                        commission_status, seller_id, attributed_by_footprint, edit_code, edit_uses_remaining,
                        tipo_perfil, nombres, apellidos, nombre_negocio, contacto_nombre, contacto_apellido,
                        menu_digital, wifi_ssid, wifi_password,
                        portada_movil, portada_desktop, catalogo_json,
                        google_rating, google_reviews_count, youtube_video_url,
                        hero_action, hero_button_text, hero_file_url, hero_external_link, hero_wifi_steps,
                        hero_section_title, hero_step1_title, hero_step1_text, hero_step2_title, hero_step2_text, hero_step3_title, hero_step3_text,
                        hero_slides_json, template_id
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                        ?, ?, ?, ?, ?, ?, ?, ?, 
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                `;

                const values = [
                    newId, now, finalNombre, email, whatsapp, profesion || null, empresa || null, bio || null, direccion || null,
                    web || null, google_business || null, instagram || null, linkedin || null, facebook || null, tiktok || null, youtube || null, x || null, productos_servicios || null,
                    plan || null, foto_url || null, comprobante_url || null, galeriaUrlsJson, finalStatus || 'pendiente', finalStatus === 'pagado' ? now : null, finalSlug, etiquetas || null,
                    'pending', // commission_status
                    finalSellerId,
                    isFootprintAttributed,
                    serverGeneratedEditCode, 2, // edit_code and uses
                    tipo_perfil || 'persona', nombres || null, apellidos || null, nombre_negocio || null, contacto_nombre || null, contacto_apellido || null,
                    menu_digital || null, wifi_ssid || null, wifi_password || null,
                    portada_movil || null, portada_desktop || null, catalogoJsonStr,
                    google_rating || null, google_reviews_count || null, youtube_video_url || null,
                    hero_action || null, hero_button_text || null, hero_file_url || null, hero_external_link || null, heroWifiStepsStr,
                    hero_section_title || null, hero_step1_title || null, hero_step1_text || null, hero_step2_title || null, hero_step2_text || null, hero_step3_title || null, hero_step3_text || null,
                    heroSlidesJsonStr, template_id || 'classic'
                ];

                await pool.execute(insertQuery, values);

                try {
                    await syncMenuDigitalToRelational(pool, newId, menu_digital);
                } catch (syncErr) {
                    console.error("Error syncing menu to relational tables in register INSERT:", syncErr);
                }

                // --- ALLY & RESTAURANT PIPELINE AUTO-TRACKING ---
                try {
                    if (menu_digital || rawSellerCode) {
                        const cleanAllyCode = rawSellerCode ? String(rawSellerCode).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : null;
                        let aliadoId = null;
                        if (cleanAllyCode) {
                            const [aliadoRows]: any = await pool.execute('SELECT id, comision_tipo, comision_valor FROM registraya_aliados WHERE codigo = ? LIMIT 1', [cleanAllyCode]);
                            if (aliadoRows.length > 0) {
                                aliadoId = aliadoRows[0].id;
                            }
                        }

                        if (aliadoId || menu_digital) {
                            const restNombre = nombre_negocio || nombres || 'Restaurante Registrado';
                            const [pipeResult]: any = await pool.execute(
                                `INSERT INTO registraya_pipeline_restaurantes (
                                    aliado_id, canal_origen, nombre_restaurante, contacto_nombre,
                                    contacto_telefono, contacto_email, pais, estado,
                                    producto_interes, vcard_registro_id, menu_slug,
                                    fecha_primer_contacto, fecha_cierre
                                ) VALUES (?, ?, ?, ?, ?, ?, 'EC', ?, 'menu_interactivo', ?, ?, NOW(), ?)`,
                                [
                                    aliadoId,
                                    aliadoId ? 'influencer' : 'web',
                                    restNombre,
                                    contacto_nombre || nombres || null,
                                    whatsapp || '',
                                    email || null,
                                    finalStatus === 'pagado' ? 'pagado' : 'prospecto',
                                    newId,
                                    finalSlug,
                                    finalStatus === 'pagado' ? now : null
                                ]
                            );

                            // Si pagó y tiene aliado, generar comisión automática
                            if (finalStatus === 'pagado' && aliadoId) {
                                const [aliadoRows]: any = await pool.execute('SELECT comision_tipo, comision_valor FROM registraya_aliados WHERE id = ?', [aliadoId]);
                                if (aliadoRows.length > 0) {
                                    const { comision_tipo, comision_valor } = aliadoRows[0];
                                    const venta = 500.00;
                                    const comision = comision_tipo === 'monto_fijo' ? Number(comision_valor) : (venta * Number(comision_valor)) / 100;
                                    await pool.execute(
                                        `INSERT INTO registraya_comisiones (
                                            pipeline_id, aliado_id, precio_venta, monto_comision, porcentaje_aplicado, estado
                                        ) VALUES (?, ?, ?, ?, ?, 'pendiente')`,
                                        [pipeResult.insertId, aliadoId, venta, comision, comision_tipo === 'porcentaje' ? comision_valor : null]
                                    );
                                }
                            }
                        }
                    }
                } catch (pipeErr) {
                    console.error('Error tracking restaurant pipeline / affiliate in register:', pipeErr);
                }

                return NextResponse.json({ success: true, action: 'created', id: newId, edit_code: serverGeneratedEditCode });
            }

        } catch (dbErr) {
            throw dbErr;
        }
    } catch (err: any) {
        console.error('Error en API de registro (MySQL):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
