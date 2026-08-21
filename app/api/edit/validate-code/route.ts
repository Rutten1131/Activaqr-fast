import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { code, slug } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            let query = `SELECT 
                    id, slug, edit_code, edit_uses_remaining, tipo_perfil, plan,
                    nombres, apellidos, nombre_negocio, contacto_nombre, contacto_apellido,
                    nombre, profesion as profession, empresa as company, whatsapp, email, bio, 
                    direccion as address, web, google_business, instagram, linkedin, 
                    facebook, tiktok, youtube, x, productos_servicios, etiquetas, foto_url,
                    menu_digital, wifi_ssid, wifi_password, portada_desktop, portada_movil, hero_button_text,
                    hero_action, hero_file_url, hero_external_link, hero_wifi_steps,
                    hero_section_title, hero_step1_title, hero_step2_title, hero_step2_text, hero_step3_title, hero_step3_text,
                    catalogo_json, youtube_video_url, google_rating, google_reviews_count, seller_id as sellerCode, hero_slides_json, template_id, json_override, mensaje
                 FROM registraya_vcard_registros 
                 WHERE UPPER(edit_code) = UPPER(?)`;
            
            const params: any[] = [code];

            if (slug) {
                query += ` AND slug = ?`;
                params.push(slug);
            }

            const [rows] = await connection.execute(query, params);

            const users = rows as any[];

            if (users.length === 0) {
                return NextResponse.json({ error: 'Código no encontrado para este perfil' }, { status: 401 });
            }

            const user = users[0];

            // Si catalogo_json está vacío pero existen categorías/productos relacionales, reconstruir
            if (!user.catalogo_json || user.catalogo_json === 'null') {
                try {
                    const [dbCategories]: any = await connection.execute(
                        'SELECT * FROM registraya_menu_categorias WHERE registro_id = ? ORDER BY orden ASC, created_at ASC',
                        [user.id]
                    );
                    if (dbCategories && dbCategories.length > 0) {
                        const categoriesList: string[] = [];
                        const productsList: any[] = [];

                        for (const cat of dbCategories) {
                            categoriesList.push(cat.nombre);
                            const [dbProducts]: any = await connection.execute(
                                'SELECT * FROM registraya_menu_productos WHERE categoria_id = ? ORDER BY orden ASC, created_at ASC',
                                [cat.id]
                            );
                            if (dbProducts && dbProducts.length > 0) {
                                for (const prod of dbProducts) {
                                    let formattedPrice = '';
                                    if (prod.precio !== null && prod.precio !== undefined) {
                                        const priceStr = String(prod.precio);
                                        formattedPrice = priceStr.startsWith('$') ? priceStr : `$${parseFloat(priceStr).toFixed(2)}`;
                                    }
                                    productsList.push({
                                        id: String(prod.id),
                                        name: prod.nombre,
                                        titulo: prod.nombre,
                                        price: formattedPrice,
                                        precio: formattedPrice,
                                        description: prod.descripcion || '',
                                        descripcion: prod.descripcion || '',
                                        category: cat.nombre,
                                        categoria: cat.nombre,
                                        image: prod.imagen_url || '',
                                        images: prod.imagen_url ? [prod.imagen_url] : [],
                                    });
                                }
                            }
                        }

                        user.catalogo_json = {
                            categories: categoriesList,
                            products: productsList,
                        };
                    }
                } catch (e) {
                    console.error('Error fetching relational menu in validate-code:', e);
                }
            }

            // Return user data for editing (Ediciones ilimitadas)
            return NextResponse.json({
                success: true,
                usesRemaining: 'Ilimitado',
                data: user
            });

        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error('Error validating edit code:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
