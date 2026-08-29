import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// ═══ CIERRE AUTOMÁTICO DE VOTACIÓN ═══
const CIERRE_VOTACION = new Date('2025-09-14T00:00:00-05:00');

export async function POST(req: NextRequest) {
    try {
        // ═══ VERIFICAR SI LA VOTACIÓN SIGUE ABIERTA ═══
        if (new Date() >= CIERRE_VOTACION) {
            return NextResponse.json({
                error: 'La votación de la 197ª Feria de Loja ha finalizado. ¡Gracias por participar!',
                votacion_cerrada: true
            }, { status: 403 });
        }

        const body = await req.json();
        const { negocio_id, negocio_nombre, telefono_votante, nombre_votante, mensaje_recibido } = body;

        if (!telefono_votante) {
            return NextResponse.json({ error: 'El teléfono del votante es obligatorio.' }, { status: 400 });
        }

        let targetId = negocio_id;
        let businessRecord: any = null;

        if (targetId) {
            const [rows]: any = await pool.query(`SELECT id, nombre_negocio, google_reviews_url, is_active FROM feria_negocios WHERE id = ?`, [targetId]);
            if (rows.length > 0) businessRecord = rows[0];
        } else if (negocio_nombre) {
            const [rows]: any = await pool.query(
                `SELECT id, nombre_negocio, google_reviews_url, is_active FROM feria_negocios WHERE nombre_negocio LIKE ? AND is_active = 1 LIMIT 1`,
                [`%${negocio_nombre.trim()}%`]
            );
            if (rows.length > 0) businessRecord = rows[0];
        }

        if (!businessRecord) {
            return NextResponse.json({ error: 'Negocio no encontrado o no activo en la Feria.' }, { status: 404 });
        }

        // Insertar voto
        await pool.query(
            `INSERT INTO feria_votos (negocio_id, telefono_votante, nombre_votante, mensaje_recibido) VALUES (?, ?, ?, ?)`,
            [businessRecord.id, telefono_votante.trim(), nombre_votante || null, mensaje_recibido || null]
        );

        // Actualizar total de votos
        await pool.query(
            `UPDATE feria_negocios SET total_votos = total_votos + 1 WHERE id = ?`,
            [businessRecord.id]
        );

        return NextResponse.json({
            success: true,
            negocio: {
                id: businessRecord.id,
                nombre_negocio: businessRecord.nombre_negocio,
                google_reviews_url: businessRecord.google_reviews_url
            },
            has_reviews_url: !!(businessRecord.google_reviews_url && businessRecord.google_reviews_url.trim().length > 0),
            message: `Voto registrado para ${businessRecord.nombre_negocio}`
        });

    } catch (error: any) {
        console.error('Error registrando voto:', error);
        return NextResponse.json({ error: error.message || 'Error registrando voto' }, { status: 500 });
    }
}
