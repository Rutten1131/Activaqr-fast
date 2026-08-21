import { PoolConnection } from 'mysql2/promise';

function repairTruncatedJsonExhaustive(str: string | null | undefined): any[] | null {
    if (!str) return null;
    const trimmed = str.trim();
    
    // Attempt standard parse first
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {
        // continue to repair
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
                    return parsed;
                }
            } catch (err) {
                // ignore
            }
        }
    }
    return null;
}

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
                    desc: item.desc || item.descripcion || '',
                    image: item.image || item.imagen || item.imagen_url || null
                }))
            };
        })
        .filter(cat => cat !== null && cat.name.length > 0);
}

export async function syncMenuDigitalToRelational(
    connection: any,
    registroId: string,
    menuDigital: string | null | undefined
) {
    if (!registroId) return;

    // Delete existing categories (will cascade delete products because of ON DELETE CASCADE)
    await connection.execute(
        'DELETE FROM registraya_menu_categorias WHERE registro_id = ?',
        [registroId]
    );

    if (!menuDigital || menuDigital.trim() === '' || menuDigital.trim() === 'null') {
        return;
    }

    const rawLegacyMenu = repairTruncatedJsonExhaustive(menuDigital);
    const legacyMenu = cleanRepairedMenu(rawLegacyMenu);

    if (legacyMenu.length > 0) {
        for (let cIdx = 0; cIdx < legacyMenu.length; cIdx++) {
            const cat = legacyMenu[cIdx];
            if (!cat || !cat.name) continue;

            // Insert Category
            const [catResult] = await connection.execute(
                'INSERT INTO registraya_menu_categorias (registro_id, nombre, orden) VALUES (?, ?, ?)',
                [registroId, cat.name.trim(), cIdx]
            );
            const categoryId = (catResult as any).insertId;

            // Insert Products
            if (Array.isArray(cat.items)) {
                for (let pIdx = 0; pIdx < cat.items.length; pIdx++) {
                    const item = cat.items[pIdx];
                    if (!item || !item.name) continue;

                    // Clean and validate price
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
    }
}
