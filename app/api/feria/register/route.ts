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
            logo_url,
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
        const trimmedLogo = logo_url ? logo_url.trim() : null;
        const trimmedGoogleReviews = google_reviews_url ? google_reviews_url.trim() : null;

        const slug = generateSlug(trimmedNegocio);
        const targetNumber = '+593963425323';

        // Formato de texto para el bot de WhatsApp
        const waMessage = `Feria de Loja #197 - Voto por: ${trimmedNegocio}`;
        const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(waMessage)}`;

        // Guardar en MySQL
        const [result]: any = await pool.query(
            `INSERT INTO feria_negocios 
            (slug, nombre_negocio, nombre_representante, telefono_negocio, logo_url, google_reviews_url, whatsapp_target_number, total_votos, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)`,
            [slug, trimmedNegocio, trimmedRepresentante, trimmedTelefono, trimmedLogo, trimmedGoogleReviews, targetNumber]
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
                logo_url: trimmedLogo,
                google_reviews_url: trimmedGoogleReviews,
                whatsapp_target_number: targetNumber,
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
