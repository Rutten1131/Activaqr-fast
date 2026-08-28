import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token_wa, telefono_votante, nombre_votante, mensaje_recibido } = body;

        if (!token_wa) {
            return NextResponse.json({ error: 'Token de verificación requerido' }, { status: 400 });
        }

        // Buscar el voto por token_wa
        const [votos]: any = await pool.query(
            `SELECT v.id, v.negocio_id, v.verificado, n.nombre_negocio, n.google_reviews_url 
             FROM feria_votos v
             JOIN feria_negocios n ON v.negocio_id = n.id
             WHERE v.token_wa = ?
             LIMIT 1`,
            [token_wa.trim().toUpperCase()]
        );

        if (votos.length === 0) {
            // Si no se encuentra el token exacto, buscar por nombre del negocio recibido si viene
            return NextResponse.json({ error: 'Token de voto no encontrado o expirado' }, { status: 404 });
        }

        const voto = votos[0];

        if (voto.verificado === 1) {
            return NextResponse.json({
                success: true,
                message: `El voto para ${voto.nombre_negocio} ya estaba verificado.`,
                negocio: {
                    nombre_negocio: voto.nombre_negocio,
                    google_reviews_url: voto.google_reviews_url
                }
            });
        }

        // Marcar como verificado y guardar teléfono
        await pool.query(
            `UPDATE feria_votos 
             SET verificado = 1, telefono_votante = ?, nombre_votante = ?, mensaje_recibido = ?
             WHERE id = ?`,
            [telefono_votante ? telefono_votante.trim() : 'whatsapp_verificado', nombre_votante || null, mensaje_recibido || null, voto.id]
        );

        // Incrementar votos verificados en feria_negocios
        await pool.query(
            `UPDATE feria_negocios SET total_votos_verificados = total_votos_verificados + 1 WHERE id = ?`,
            [voto.negocio_id]
        );

        return NextResponse.json({
            success: true,
            message: `🎉 ¡Voto verificado con éxito! Ahora tu voto por ${voto.nombre_negocio} vale el triple.`,
            negocio: {
                id: voto.negocio_id,
                nombre_negocio: voto.nombre_negocio,
                google_reviews_url: voto.google_reviews_url
            },
            has_reviews_url: !!(voto.google_reviews_url && voto.google_reviews_url.trim().length > 0)
        });

    } catch (error: any) {
        console.error('Error al verificar voto:', error);
        return NextResponse.json({ error: error.message || 'Error al verificar el voto' }, { status: 500 });
    }
}
