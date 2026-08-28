import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

function generateSlug(nombre: string): string {
    const base = nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${base || 'stand'}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            nombre_negocio,
            nombre_representante,
            telefono_negocio,
            numero_stand,
            categoria,
            origen,
            anios_trayectoria,
            slogan,
            descripcion_historia,
            materiales_ingredientes,
            promocion_feria,
            productos_json,
            instagram_url,
            facebook_url,
            tiktok_url,
            logo_url,
            portada_url,
            google_reviews_url
        } = body;

        if (!nombre_negocio || !nombre_negocio.trim()) {
            return NextResponse.json({ error: 'El nombre del negocio es obligatorio.' }, { status: 400 });
        }
        if (!nombre_representante || !nombre_representante.trim()) {
            return NextResponse.json({ error: 'El nombre del representante es obligatorio.' }, { status: 400 });
        }

        const trimmedNegocio = nombre_negocio.trim();
        const trimmedRepresentante = nombre_representante.trim();
        const trimmedTelefono = telefono_negocio ? telefono_negocio.trim() : null;
        const trimmedStand = numero_stand ? numero_stand.trim() : null;
        const trimmedCategoria = categoria ? categoria.trim().toLowerCase() : 'emprendimientos';
        const trimmedOrigen = origen ? origen.trim() : 'Loja';
        const trimmedAnios = anios_trayectoria ? String(anios_trayectoria).trim() : null;
        const trimmedSlogan = slogan ? slogan.trim() : null;
        const trimmedHistoria = descripcion_historia ? descripcion_historia.trim() : null;
        const trimmedMateriales = materiales_ingredientes ? materiales_ingredientes.trim() : null;
        const trimmedPromo = promocion_feria ? promocion_feria.trim() : null;
        const productosStr = productos_json ? (typeof productos_json === 'string' ? productos_json : JSON.stringify(productos_json)) : null;
        const trimmedInstagram = instagram_url ? instagram_url.trim() : null;
        const trimmedFacebook = facebook_url ? facebook_url.trim() : null;
        const trimmedTiktok = tiktok_url ? tiktok_url.trim() : null;
        const trimmedLogo = logo_url ? logo_url.trim() : null;
        const trimmedPortada = portada_url ? portada_url.trim() : null;
        const trimmedGoogleReviews = google_reviews_url ? google_reviews_url.trim() : null;
        const tieneGbp = !!(trimmedGoogleReviews && trimmedGoogleReviews.length > 0) ? 1 : 0;

        const slug = generateSlug(trimmedNegocio);
        const targetNumber = '+593963425323';

        const host = req.headers.get('host') || 'activaqr.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const standWebUrl = `${protocol}://${host}/feria-loja/${slug}`;

        const waMessage = `Feria de Loja #197 - Voto por: ${trimmedNegocio}`;
        const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(waMessage)}`;

        // Guardar en MySQL con todos los campos extendidos
        const [result]: any = await pool.query(
            `INSERT INTO feria_negocios 
            (slug, nombre_negocio, nombre_representante, telefono_negocio, numero_stand, categoria, 
             origen, anios_trayectoria, slogan, descripcion_historia, materiales_ingredientes, 
             promocion_feria, productos_json, instagram_url, facebook_url, tiktok_url, 
             logo_url, portada_url, google_reviews_url, tiene_gbp, whatsapp_target_number, total_votos, total_votos_verificados, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1)`,
            [
                slug, trimmedNegocio, trimmedRepresentante, trimmedTelefono, trimmedStand, trimmedCategoria,
                trimmedOrigen, trimmedAnios, trimmedSlogan, trimmedHistoria, trimmedMateriales,
                trimmedPromo, productosStr, trimmedInstagram, trimmedFacebook, trimmedTiktok,
                trimmedLogo, trimmedPortada, trimmedGoogleReviews, tieneGbp, targetNumber
            ]
        );

        const insertId = result.insertId;

        return NextResponse.json({
            success: true,
            negocio: {
                id: insertId,
                slug,
                nombre_negocio: trimmedNegocio,
                nombre_representante: trimmedRepresentante,
                telefono_negocio: trimmedTelefono,
                numero_stand: trimmedStand,
                categoria: trimmedCategoria,
                origen: trimmedOrigen,
                slogan: trimmedSlogan,
                logo_url: trimmedLogo,
                portada_url: trimmedPortada,
                google_reviews_url: trimmedGoogleReviews,
                stand_web_url: standWebUrl,
                whatsapp_url: whatsappUrl,
                wa_message: waMessage
            }
        });

    } catch (error: any) {
        console.error('Error al registrar negocio de la feria:', error);
        return NextResponse.json(
            { error: error.message || 'Error al guardar el negocio en el sistema.' },
            { status: 500 }
        );
    }
}
