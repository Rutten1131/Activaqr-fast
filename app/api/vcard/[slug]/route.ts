import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await context.params;

        // 1. Buscar usuario por slug o ID usando MySQL
        const connection = await pool.getConnection();
        let user: any = null;

        try {
            const [rows] = await connection.execute(
                'SELECT * FROM registraya_vcard_registros WHERE slug = ? OR id = ?',
                [slug, slug]
            );

            if ((rows as any[]).length > 0) {
                user = (rows as any[])[0];
            }
        } finally {
            connection.release();
        }

        if (!user) {
            console.error("VCF Lookup Error:", { slug });
            return NextResponse.json(
                {
                    error: 'Perfil no encontrado',
                    debug_slug: slug
                },
                { status: 404 }
            );
        }

        // 1a. Verificar estado
        if (user.status === 'cancelado') {
            return NextResponse.redirect(new URL('/card/activaqr-9ag4', request.url));
        }

        // 1b. Formatear Notas con Galería, Productos y Redes
        const escapeVCardValue = (text: string) => {
            if (!text) return '';
            return text
                .replace(/\\/g, '\\\\')
                .replace(/,/g, '\\,')
                .replace(/;/g, '\\;')
                .replace(/\r?\n/g, '\\n');
        };

        const getGalleryArray = (data: any) => {
            if (!data) return [];
            if (Array.isArray(data)) return data;
            if (typeof data === 'string') {
                try {
                    const parsed = JSON.parse(data);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    return data.split(',').map(u => u.trim()).filter(Boolean);
                }
            }
            return [];
        };

        const bio = user.bio || '';
        const whatsapp = user.whatsapp || '';
        const nombre = user.nombre || 'Usuario';

        const isCarlosVIP = slug === 'litos-ink-vape-urban-shop-zg5z' || user.id === '6212fd72-e576-474d-8c60-66d9802826ec';

        // Formatear menú digital por categorías y precios para el VCF
        let menuFormattedText = '';
        let extractedProducts: string[] = [];

        if (user.menu_digital) {
            const trimmedMenu = user.menu_digital.trim();
            if (trimmedMenu.startsWith('[') || trimmedMenu.startsWith('{')) {
                try {
                    const parsed = JSON.parse(trimmedMenu);
                    const categories = Array.isArray(parsed) ? parsed : (parsed.categories || []);
                    if (Array.isArray(categories) && categories.length > 0 && categories[0]?.name) {
                        const lines: string[] = [];
                        categories.forEach((cat: any) => {
                            if (!cat || !cat.name) return;
                            lines.push(`\n📍 ${cat.name.toUpperCase()}:`);
                            const items = cat.items || [];
                            if (Array.isArray(items)) {
                                items.forEach((item: any) => {
                                    const pName = item.name || item.titulo || item.nombre;
                                    if (pName) {
                                        const priceStr = item.price ? ` (${item.price})` : '';
                                        const descStr = item.description || item.desc ? ` - ${item.description || item.desc}` : '';
                                        lines.push(`• ${pName.trim()}${priceStr}${descStr}`);
                                    }
                                });
                            }
                        });
                        menuFormattedText = lines.join('\n').trim();
                    }
                } catch (e) {
                    console.error("Error parsing user.menu_digital for VCF:", e);
                }
            }
        }

        // Respaldo de catalogo_json si no hay menú digital
        if (!menuFormattedText && user.catalogo_json) {
            try {
                const parsed = JSON.parse(user.catalogo_json);
                const items = Array.isArray(parsed) ? parsed : (parsed.products || []);
                if (Array.isArray(items) && items.length > 0) {
                    extractedProducts = items.map((item: any) => item.name || item.titulo).filter(Boolean);
                }
            } catch (e) {
                console.error("Error parsing user.catalogo_json for VCF:", e);
            }
        }

        let productsText = '';
        if (menuFormattedText) {
            productsText = menuFormattedText;
        } else if (extractedProducts.length > 0) {
            productsText = extractedProducts.map(p => `• ${p}`).join('\n');
        } else if (user.productos_servicios) {
            productsText = user.productos_servicios;
        }

        let noteContent = bio;
        if (productsText) {
            noteContent += `\n\n${menuFormattedText ? 'Menú Digital / Carta:' : 'Productos/Servicios:'}\n${productsText}`;
        }

        const gallery = getGalleryArray(user.galeria_urls);
        if (gallery.length > 0) {
            noteContent += `\n\nMis Trabajos:\n${gallery.join('\n')}`;
        }

        // Solo añadimos etiquetas a las notas si NO es Carlos VIP (Limpieza VIP)
        if (user.etiquetas && !isCarlosVIP) {
            noteContent += `\n\nEtiquetas: ${user.etiquetas}`;
        }

        noteContent += "\n\n- Realizado por www.activaqr.com";

        // Limpiar WhatsApp para el campo TEL (Preservar el + si existe para mejor compatibilidad internacional)
        const cleanWhatsApp = whatsapp.replace(/\D/g, ''); // Solo números para links
        const whatsappWithPlus = whatsapp.trim().startsWith('+') ? `+${cleanWhatsApp}` : cleanWhatsApp;

        // Función para line folding (removida para campos de texto por problemas en Android)

        // 2. Generar vCard con todos los campos (Version 4.0 para paridad con /registro)
        let fullName = '';
        let structuredName = ''; // Campo N:
        let organization = '';   // Campo ORG:

        if (user.tipo_perfil === 'negocio') {
            organization = user.nombre_negocio || nombre;
            if (user.contacto_nombre || user.contacto_apellido) {
                structuredName = `${escapeVCardValue(user.contacto_apellido || '')};${escapeVCardValue(user.contacto_nombre || '')};;;`;
                const contactFullName = `${user.contacto_nombre || ''} ${user.contacto_apellido || ''}`.trim();
                fullName = `${organization} - ${contactFullName}`;
            } else {
                structuredName = ';;;;';
                fullName = organization;
            }
        } else {
            const firstName = user.nombres || nombre.split(' ')[0] || '';
            const lastName = user.apellidos || nombre.split(' ').slice(1).join(' ') || '';
            fullName = `${firstName} ${lastName}`.trim() || nombre;
            structuredName = `${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`;
            organization = user.empresa || "";
        }

        const vcardLines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN;CHARSET=UTF-8:${escapeVCardValue(fullName)}`,
            `N;CHARSET=UTF-8:${structuredName}`, // Ya escapado individualmente
            user.profesion ? `TITLE;CHARSET=UTF-8:${escapeVCardValue(user.profesion)}` : '',
            organization ? `ORG;CHARSET=UTF-8:${escapeVCardValue(organization)}` : '',
            `TEL;TYPE=CELL:+${cleanWhatsApp}`,
            `EMAIL;TYPE=WORK,INTERNET:${escapeVCardValue(user.email)}`,
            user.direccion ? `ADR;TYPE=WORK;LABEL="${escapeVCardValue(user.direccion)}":;;${escapeVCardValue(user.direccion)};;;;` : '',
            user.web ? `URL:${escapeVCardValue(user.web)}` : '',
            `NOTE:${escapeVCardValue(noteContent)}`,
            user.google_business ? `URL;type=GOOGLE_BUSINESS:${escapeVCardValue(user.google_business)}` : '',
            user.etiquetas ? `CATEGORIES:${escapeVCardValue(user.etiquetas)}` : '',
            user.instagram ? `X-SOCIALPROFILE;TYPE=instagram;LABEL=Instagram:${escapeVCardValue(user.instagram)}` : '',
            user.instagram ? `URL;type=INSTAGRAM:${escapeVCardValue(user.instagram)}` : '',
            user.facebook ? `X-SOCIALPROFILE;TYPE=facebook;LABEL=Facebook:${escapeVCardValue(user.facebook)}` : '',
            user.facebook ? `URL;type=FACEBOOK:${escapeVCardValue(user.facebook)}` : '',
            user.linkedin ? `X-SOCIALPROFILE;TYPE=linkedin;LABEL=LinkedIn:${escapeVCardValue(user.linkedin)}` : '',
            user.linkedin ? `URL;type=LINKEDIN:${escapeVCardValue(user.linkedin)}` : '',
            user.tiktok ? `X-SOCIALPROFILE;TYPE=tiktok;LABEL=TikTok:${escapeVCardValue(user.tiktok)}` : '',
            user.tiktok ? `URL;type=TIKTOK:${escapeVCardValue(user.tiktok)}` : '',
            user.youtube ? `URL;type=YOUTUBE:${escapeVCardValue(user.youtube)}` : '',
            user.x ? `URL;type=X:${escapeVCardValue(user.x)}` : '',
            `X-SOCIALPROFILE;TYPE=whatsapp;LABEL=WhatsApp:https://wa.me/${cleanWhatsApp}`,
            `URL;type=WHATSAPP:https://wa.me/${cleanWhatsApp}`,
            `REV:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        ];

        // --- INJERTO VIP PRE-GENERACIÓN (SOLO Carlos Vásquez - litos-ink-vape-urban-shop-zg5z) ---
        if (isCarlosVIP) {
            // 1. Forzar nombre largo en iPhone: Sobreescribir FN, N, añadir ORG y X-ABShowAs
            for (let i = vcardLines.length - 1; i >= 0; i--) {
                if (vcardLines[i].startsWith('FN:')) {
                    vcardLines[i] = 'FN:Litos ink vape urban shop';
                }
                if (vcardLines[i].startsWith('N:')) {
                    vcardLines[i] = 'N:;Litos ink vape urban shop;;;';
                }
            }
            // Insertar ORG y X-ABShowAs después de la línea N:
            const nIndex = vcardLines.findIndex(l => l.startsWith('N:'));
            if (nIndex !== -1) {
                vcardLines.splice(nIndex + 1, 0, 'ORG:Litos ink vape urban shop', 'X-ABShowAs:COMPANY');
            }

            // 2. Eliminar X-SOCIALPROFILE genéricos y URL genéricas para evitar duplicados en iPhone
            const tagsToRemove = [
                'X-SOCIALPROFILE;type=instagram', 'X-SOCIALPROFILE;type=facebook', 'X-SOCIALPROFILE;type=linkedin', 'X-SOCIALPROFILE;type=tiktok',
                'URL;type=INSTAGRAM', 'URL;type=FACEBOOK', 'URL;type=LINKEDIN', 'URL;type=TIKTOK'
            ];
            for (let i = vcardLines.length - 1; i >= 0; i--) {
                if (tagsToRemove.some(tag => vcardLines[i].startsWith(tag))) {
                    vcardLines.splice(i, 1);
                }
            }

            // 3. Inyectar bloques NATIVOS de iOS (itemX.URL) con los Nombres Personalizados Exactos
            if (user.instagram) {
                vcardLines.push(`item1.URL:${escapeVCardValue(user.instagram)}`);
                vcardLines.push(`item1.X-ABLabel:Litos ink Tatto`);
            }
            if (user.facebook) {
                vcardLines.push(`item2.URL:${escapeVCardValue(user.facebook)}`);
                vcardLines.push(`item2.X-ABLabel:Litos Urban Shop`);
            }
            if (user.linkedin) {
                vcardLines.push(`item3.URL:${escapeVCardValue(user.linkedin)}`);
                vcardLines.push(`item3.X-ABLabel:Litos Vape Shop`);
            }
        }

        // Helper para detectar tipo MIME desde la URL o Content-Type
        const detectImageType = (url: string, contentType?: string | null): string => {
            if (contentType) {
                if (contentType.includes('png')) return 'PNG';
                if (contentType.includes('gif')) return 'GIF';
                if (contentType.includes('webp')) return 'JPEG'; // WebP se convierte a JPEG
                if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'JPEG';
            }
            const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
            if (ext === 'png') return 'PNG';
            if (ext === 'gif') return 'GIF';
            if (ext === 'webp') return 'JPEG'; // WebP se trata como JPEG tras conversión
            return 'JPEG'; // default
        };

        // Procesar foto
        if (user.foto_url) {
            try {
                // Use sharp to convert to JPEG and resize for compatibility
                const photoResp = await fetch(user.foto_url, { next: { revalidate: 3600 } });
                if (photoResp.ok) {
                    const originalBuffer = await photoResp.arrayBuffer();
                    const sharp = require('sharp');
                    
                    const processedBuffer = await sharp(Buffer.from(originalBuffer))
                        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
                        .jpeg({ quality: 80 })
                        .toBuffer();

                    const b64 = processedBuffer.toString('base64');

                    // Fold base64 string every 72 characters to be safe for vCard specification
                    const foldedB64 = b64.match(/.{1,72}/g)?.join('\r\n ') || b64;
                    vcardLines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${foldedB64}`);
                }
            } catch (e) {
                console.error("Error inline photo:", e);
                // Fallback to original logic if sharp fails
                try {
                    const photoResp = await fetch(user.foto_url);
                    if (photoResp.ok) {
                        const buffer = await photoResp.arrayBuffer();
                        const contentType = photoResp.headers.get('content-type');
                        const imageType = detectImageType(user.foto_url, contentType);
                        const b64 = Buffer.from(buffer).toString('base64');
                        const foldedB64 = b64.match(/.{1,72}/g)?.join('\r\n ') || b64;
                        vcardLines.push(`PHOTO;ENCODING=b;TYPE=${imageType}:${foldedB64}`);
                    }
                } catch (innerE) {
                    console.error("Critical fallback photo error:", innerE);
                }
            }
        }

        vcardLines.push('END:VCARD');

        // Unimos las líneas con \r\n, sin hacer foldLine a los campos de texto
        // porque el corte arbitrario rompe caracteres Unicode y secuencias de escape
        // en analizadores de Android/iOS.
        let vcard = vcardLines
            .filter(Boolean)
            .join('\r\n');

        // --- INICIO INJERTO VIP (VCF OVERRIDE) ---
        if (user.json_override) {
            try {
                const overrides = JSON.parse(user.json_override);
                for (const [key, value] of Object.entries(overrides)) {
                    if (typeof key === 'string' && typeof value === 'string') {
                        // Reemplazar globalmente todas las ocurrencias de la llave
                        // Usamos un escape básico para la llave en la expresión regular
                        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        vcard = vcard.replace(new RegExp(escapeRegExp(key), 'g'), value);
                    }
                }
            } catch (e) {
                console.warn("Silent Fail: Falló el override VIP (JSON malformado) para:", user.slug || slug);
                // Si falla, el catch se lo traga silenciosamente y la variable vcard sigue conteniendo la data normal
            }
        }
        // --- FIN INJERTO VIP ---

        // 3. Track download on the server
        try {
            let ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
            // Truncate if multiple IPs are present or if it's too long for the DB (varchar 45)
            if (ip_address.includes(',')) ip_address = ip_address.split(',')[0].trim();
            if (ip_address.length > 45) ip_address = ip_address.substring(0, 45);

            const user_agent = (request.headers.get('user-agent') || 'unknown').substring(0, 255);
            const method = 'api_direct';
            const actualSlug = user.slug || slug;

            // Optional anti-spam
            const [recent]: any = await pool.execute(
                `SELECT id FROM vcard_downloads_log 
                 WHERE slug = ? AND ip_address = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 10 SECOND)`,
                [actualSlug, ip_address]
            );

            if (recent.length === 0) {
                await pool.execute(
                    `INSERT INTO vcard_downloads_log (slug, method, ip_address, user_agent, created_at)
                     VALUES (?, ?, ?, ?, NOW())`,
                    [actualSlug, method, ip_address, user_agent]
                );
            }
        } catch (trackErr) {
            console.error("Silent Fail: Falló el tracking de descarga en el API directo", trackErr);
        }

        // 4. Retornar con headers estándar
        return new NextResponse(vcard, {
            status: 200,
            headers: {
                'Content-Type': 'text/vcard; charset=UTF-8',
                'Content-Disposition': `attachment; filename="${user.slug || slug}.vcf"`,
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (err) {
        console.error('Error generating vCard:', err);
        return NextResponse.json(
            { error: 'Error al generar vCard' },
            { status: 500 }
        );
    }
}
