import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

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
        console.error('Failed to resolve short URL in profile load:', url, e);
        return url;
    }
}

/**
 * Detecta la orientación real de un video de Facebook/Instagram leyendo los meta tags
 * og:video:width y og:video:height del HTML de la página.
 * Devuelve la URL con ?aspect=vertical o ?aspect=horizontal agregado.
 */
async function annotateVideoAspect(url: string | null | undefined): Promise<string | null | undefined> {
    if (!url) return url;
    const lower = url.toLowerCase().trim();

    // Si ya tiene parámetro aspect, no hacer nada
    if (lower.includes('aspect=vertical') || lower.includes('aspect=horizontal')) return url;

    // Solo procesar URLs de Facebook reel (donde no sabemos si es vertical u horizontal)
    // Instagram siempre es vertical, no necesitamos detectar
    const isFacebookReel = lower.includes('facebook.com/reel');
    if (!isFacebookReel) return url;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        });
        clearTimeout(timeoutId);

        if (response.status === 200) {
            const html = await response.text();

            // Extraer og:video:width y og:video:height
            const widthMatch = html.match(/<meta\s+property="og:video:width"\s+content="(\d+)"/i) ||
                               html.match(/<meta\s+content="(\d+)"\s+property="og:video:width"/i);
            const heightMatch = html.match(/<meta\s+property="og:video:height"\s+content="(\d+)"/i) ||
                                html.match(/<meta\s+content="(\d+)"\s+property="og:video:height"/i);

            if (widthMatch && heightMatch) {
                const width = parseInt(widthMatch[1], 10);
                const height = parseInt(heightMatch[1], 10);
                const aspect = height > width ? 'vertical' : 'horizontal';
                const separator = url.includes('?') ? '&' : '?';
                console.log(`[annotateVideoAspect] ${url} → ${width}x${height} → ${aspect}`);
                return `${url}${separator}aspect=${aspect}`;
            }
        }

        return url;
    } catch (e) {
        console.error('Failed to annotate video aspect:', url, e);
        return url;
    }
}

// Helper simple para parsear JSON de forma segura
function safeParseJson(str: string | null): any {
    if (!str) return null;
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}

// Repara un string JSON truncado de forma robusta retrocediendo caracteres
function repairTruncatedJsonExhaustive(str: string | null | undefined): any[] | null {
    if (!str) return null;
    const trimmed = str.trim();
    
    // Intentar parse estándar primero
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {
        // continuar con reparación
    }

    const candidates = [
        '',
        ']',
        '}',
        '}]',
        '}}]',
        ']}]',
        '}]}]',
        '"}]',
        '"}',
        ',""}]',
        ',[]}]',
        '}]}',
        ']}'
    ];

    for (let i = trimmed.length; i > 0; i--) {
        const sub = trimmed.substring(0, i);
        for (const cand of candidates) {
            try {
                const repaired = sub + cand;
                const parsed = JSON.parse(repaired);
                if (Array.isArray(parsed)) {
                    console.log(`[API JIT JoiRepair] Successfully repaired truncated JSON at index ${i} with suffix: ${cand}`);
                    return parsed;
                }
            } catch (err) {
                // ignorar error e intentar siguiente candidato
            }
        }
    }
    return null;
}

// Limpia el menú reparado removiendo ítems o categorías incompletas o sin nombre
function cleanRepairedMenu(menu: any[] | null): any[] {
    if (!Array.isArray(menu)) return [];
    
    return menu
        .map(cat => {
            if (!cat || typeof cat !== 'object' || !cat.name) return null;
            
            const cleanItems = Array.isArray(cat.items) 
                ? cat.items.filter((item: any) => item && typeof item === 'object' && item.name && String(item.name).trim().length > 0)
                : [];
                
            return {
                name: String(cat.name).trim(),
                items: cleanItems.map((item: any) => ({
                    name: String(item.name).trim(),
                    price: item.price ? String(item.price).trim() : '',
                    desc: item.desc ? String(item.desc).trim() : '',
                    image: item.image || item.imagen || ''
                }))
            };
        })
        .filter(cat => cat !== null && cat.name.length > 0);
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await context.params;
        const connection = await pool.getConnection();

        try {
            // Search by slug or id - ONLY returning public fields
            const [rows] = await connection.execute(
                `SELECT 
                    id, slug, nombre, profesion, empresa, bio, direccion, web, whatsapp, email, 
                    google_business, instagram, linkedin, facebook, tiktok, youtube, x, productos_servicios, 
                    plan, foto_url, galeria_urls, status, tipo_perfil, nombres, apellidos, 
                    nombre_negocio, contacto_nombre, contacto_apellido, etiquetas, created_at,
                    menu_digital, wifi_ssid, wifi_password, portada_desktop, portada_movil,
                    hero_button_text, hero_action, hero_file_url, hero_external_link, 
                    hero_wifi_steps, hero_section_title, hero_step1_title, hero_step1_text,
                    hero_step2_title, hero_step2_text, hero_step3_title, 
                    hero_step3_text, catalogo_json, youtube_video_url,
                    google_rating, google_reviews_count, hero_slides_json, template_id, json_override
                 FROM registraya_vcard_registros 
                 WHERE slug = ? OR id = ?`,
                [slug, slug]
            );

            const users = rows as any[];

            if (users.length === 0) {
                return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
            }

            const user = users[0];
            const vcardId = user.id;

            // 1. Verificar si existen datos relacionales del menú
            const [catRows] = await connection.execute(
                'SELECT id FROM registraya_menu_categorias WHERE registro_id = ? LIMIT 1',
                [vcardId]
            );

            const hasRelationalData = (catRows as any[]).length > 0;

            // 2. Si no tiene datos relacionales pero posee JSON legacy en menu_digital, realizamos migración JIT (Just-In-Time)
            if (!hasRelationalData && user.menu_digital && user.menu_digital.trim().startsWith('[')) {
                // Intentar recuperar el JSON de forma robusta e inteligente (incluso si está truncado)
                const rawLegacyMenu = repairTruncatedJsonExhaustive(user.menu_digital);
                const legacyMenu = cleanRepairedMenu(rawLegacyMenu);
                
                if (legacyMenu.length > 0) {
                    console.log(`Starting JIT menu migration for profile ID: ${vcardId}...`);
                    await connection.beginTransaction();
                    try {
                        for (let cIdx = 0; cIdx < legacyMenu.length; cIdx++) {
                            const cat = legacyMenu[cIdx];
                            if (!cat || !cat.name) continue;

                            // Insertar Categoría
                            const [catResult] = await connection.execute(
                                'INSERT INTO registraya_menu_categorias (registro_id, nombre, orden) VALUES (?, ?, ?)',
                                [vcardId, cat.name.trim(), cIdx]
                            );
                            const categoryId = (catResult as any).insertId;

                            // Insertar Productos de esta Categoría
                            if (Array.isArray(cat.items)) {
                                for (let pIdx = 0; pIdx < cat.items.length; pIdx++) {
                                    const item = cat.items[pIdx];
                                    if (!item || !item.name) continue;

                                    // Limpiar y validar precio
                                    let cleanPrice = null;
                                    if (item.price) {
                                        const numericStr = String(item.price).replace(/[^\d.]/g, '');
                                        if (numericStr) {
                                            cleanPrice = parseFloat(numericStr);
                                            if (isNaN(cleanPrice)) cleanPrice = null;
                                        }
                                    }

                                    await connection.execute(
                                        `INSERT INTO registraya_menu_productos 
                                         (categoria_id, nombre, descripcion, precio, imagen_url, orden, disponible) 
                                         VALUES (?, ?, ?, ?, ?, ?, 1)`,
                                        [categoryId, item.name.trim(), item.desc || null, cleanPrice, item.image || null, pIdx]
                                    );
                                }
                            }
                        }
                        await connection.commit();
                        console.log(`✅ JIT migration completed for profile ID: ${vcardId}!`);
                    } catch (migrationErr) {
                        await connection.rollback();
                        console.error(`❌ JIT Migration failed for profile ID: ${vcardId}:`, migrationErr);
                    }
                }
            }

            // 3. Reconstruir menu_digital dinámicamente desde las tablas relacionales para retrocompatibilidad total del frontend
            const [dbCategories] = await connection.execute(
                'SELECT * FROM registraya_menu_categorias WHERE registro_id = ? ORDER BY orden ASC, created_at ASC',
                [vcardId]
            );

            // Extraer el JSON original de menu_digital ANTES de sobreescribir (para hacer fallback si precios están vacíos)
            const originalMenuDigital = user.menu_digital;

            const structuredCategories: any[] = [];
            const categories = dbCategories as any[];

            for (const cat of categories) {
                const [dbProducts] = await connection.execute(
                    'SELECT * FROM registraya_menu_productos WHERE categoria_id = ? ORDER BY orden ASC, created_at ASC',
                    [cat.id]
                );

                const items = (dbProducts as any[]).map(prod => {
                    // Formatear precio: preservar string original si ya tiene formato (ej: "$7.50")
                    // Si es numérico, formatear como "$XX.XX"
                    let formattedPrice = '';
                    if (prod.price !== null && prod.price !== undefined) {
                        const priceStr = String(prod.price);
                        if (priceStr.startsWith('$')) {
                            // Ya tiene formato $, conservarlo tal cual
                            formattedPrice = priceStr;
                        } else {
                            // Es numérico, formatear
                            const num = parseFloat(priceStr);
                            formattedPrice = isNaN(num) ? '' : `$${num.toFixed(2)}`;
                        }
                    }

                    return {
                        id: prod.id,
                        name: prod.nombre,
                        desc: prod.descripcion || '',
                        price: formattedPrice,
                        image: prod.imagen_url || '',
                        disponible: prod.disponible
                    };
                });

                structuredCategories.push({
                    id: cat.id,
                    name: cat.nombre,
                    items
                });
            }

            // Si hay datos estructurados en tablas relacionales, usarlos (reconstruidos).
            // Si NO hay y el usuario tiene JSON original en menu_digital, intentar usarlo directamente.
            if (structuredCategories.length > 0) {
                // Verificar si TODOS los precios están vacíos (bug conocido de migración JIT)
                const allPricesEmpty = structuredCategories.every((cat: any) =>
                    cat.items.every((item: any) => !item.price || item.price === '')
                );

                if (allPricesEmpty && originalMenuDigital && originalMenuDigital.trim().startsWith('[')) {
                    // Bug: los precios se perdieron en la migración JIT - usar el JSON original directamente
                    console.log('[profile] All prices empty in relational tables, falling back to original menu_digital JSON');
                    // No sobreescribimos menu_digital - dejamos el original que tiene los precios correctos
                } else {
                    user.menu_digital = JSON.stringify(structuredCategories);
                }
            } else if (user.menu_digital && user.menu_digital.trim().startsWith('[')) {
                // No hay datos relacionales pero SÍ hay JSON legacy - conservarlo tal cual
                console.log('[profile] No relational data found, preserving original menu_digital JSON');
            }

            // --- RESOLUCIÓN RETROACTIVA DE LINKS DE COMPARTIR AL VUELO ---
            let needsDbUpdate = false;

            // JIT Expiration of Limited Time Offers
            if (user.hero_slides_json) {
                try {
                    let slides = typeof user.hero_slides_json === 'string'
                        ? JSON.parse(user.hero_slides_json)
                        : user.hero_slides_json;
                        
                    if (Array.isArray(slides)) {
                        let slidesChanged = false;
                        const now = new Date().getTime();
                        
                        for (let slide of slides) {
                            if (slide.offerEnabled && slide.offerExpiresAt) {
                                // datetime-local no incluye zona horaria. Si no tiene offset (+/- o Z), asumir Ecuador (UTC-5)
                                let expStr = slide.offerExpiresAt;
                                if (!expStr.includes('Z') && !expStr.match(/[+-]\d{2}:\d{2}$/)) {
                                    expStr = expStr + '-05:00';
                                }
                                const expireTime = new Date(expStr).getTime();
                                if (expireTime <= now) {
                                    slide.offerEnabled = false; // Pasar a OFF
                                    slidesChanged = true;
                                    needsDbUpdate = true;
                                    console.log(`[profile] JIT Auto-Expired offer on banner ID: ${slide.id}`);
                                }
                            }
                        }
                        if (slidesChanged) {
                            user.hero_slides_json = JSON.stringify(slides);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing hero_slides_json for JIT expiration check:', e);
                }
            }
            
            if (user.youtube_video_url) {
                const resolved = await resolveShortUrl(user.youtube_video_url);
                if (resolved !== user.youtube_video_url) {
                    user.youtube_video_url = resolved;
                    needsDbUpdate = true;
                }
                const annotated = await annotateVideoAspect(user.youtube_video_url);
                if (annotated !== user.youtube_video_url) {
                    user.youtube_video_url = annotated;
                    needsDbUpdate = true;
                }
            }

            if (user.catalogo_json) {
                try {
                    let parsed = typeof user.catalogo_json === 'string'
                        ? JSON.parse(user.catalogo_json)
                        : user.catalogo_json;

                    if (parsed && parsed.products && Array.isArray(parsed.products)) {
                        for (let i = 0; i < parsed.products.length; i++) {
                            const prod = parsed.products[i];
                            
                            // Resolver array videos + detectar orientación
                            if (prod.videos && Array.isArray(prod.videos)) {
                                const processedVideos = await Promise.all(prod.videos.map(async (vUrl: string) => {
                                    let r = await resolveShortUrl(vUrl);
                                    if (r !== vUrl) needsDbUpdate = true;
                                    // Detectar orientación real del video
                                    const annotated = await annotateVideoAspect(r);
                                    if (annotated !== r) { needsDbUpdate = true; r = annotated; }
                                    return r;
                                }));
                                prod.videos = processedVideos;
                            }

                            // Resolver single video + detectar orientación
                            if (prod.video) {
                                let resolvedSingle = await resolveShortUrl(prod.video);
                                if (resolvedSingle !== prod.video) {
                                    prod.video = resolvedSingle;
                                    needsDbUpdate = true;
                                }
                                const annotated = await annotateVideoAspect(prod.video);
                                if (annotated !== prod.video) {
                                    prod.video = annotated;
                                    needsDbUpdate = true;
                                }
                            }
                        }
                    }

                    user.catalogo_json = typeof user.catalogo_json === 'string'
                        ? JSON.stringify(parsed)
                        : parsed;

                } catch (errJson) {
                    console.error('Error parsing catalogo_json in profile load JIT converter:', errJson);
                }
            }

            // Guardar en base de datos para persistir los links resueltos y su orientación
            if (needsDbUpdate) {
                const dbVal = typeof user.catalogo_json === 'object' ? JSON.stringify(user.catalogo_json) : user.catalogo_json;
                const dbSlidesVal = typeof user.hero_slides_json === 'object' ? JSON.stringify(user.hero_slides_json) : user.hero_slides_json;
                try {
                    await connection.execute(
                        'UPDATE registraya_vcard_registros SET catalogo_json = ?, youtube_video_url = ?, hero_slides_json = ? WHERE id = ?',
                        [dbVal, user.youtube_video_url, dbSlidesVal, user.id]
                    );
                    console.log('[profile] Successfully cached resolved video URLs, expiration updates & orientation parameters to DB.');
                } catch (errUpdate) {
                    console.error('Failed to cache resolved video URLs or expiration updates in profile load:', errUpdate);
                }
            }

            return NextResponse.json(user);

        } finally {
            connection.release();
        }
    } catch (err: any) {
        console.error('Error fetching profile:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
