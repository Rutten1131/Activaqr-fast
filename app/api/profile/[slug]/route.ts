import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

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
            // else: menu_digital stays as-is (could be null or non-JSON value)

            return NextResponse.json(user);

        } finally {
            connection.release();
        }
    } catch (err: any) {
        console.error('Error fetching profile:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
