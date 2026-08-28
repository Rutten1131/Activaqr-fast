import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const [negocios]: any = await pool.query(
            `SELECT id, slug, nombre_negocio, nombre_representante, telefono_negocio, 
                    logo_url, google_reviews_url, whatsapp_target_number, total_votos, 
                    is_active, created_at, updated_at
             FROM feria_negocios
             ORDER BY total_votos DESC, created_at ASC`
        );

        const [totalStats]: any = await pool.query(
            `SELECT 
                COUNT(*) as total_stands,
                COALESCE(SUM(total_votos), 0) as total_votos_general,
                SUM(CASE WHEN google_reviews_url IS NOT NULL AND google_reviews_url != '' THEN 1 ELSE 0 END) as stands_con_reviews
             FROM feria_negocios`
        );

        const [recentVotes]: any = await pool.query(
            `SELECT v.id, v.negocio_id, n.nombre_negocio, v.telefono_votante, v.nombre_votante, v.mensaje_recibido, v.created_at
             FROM feria_votos v
             LEFT JOIN feria_negocios n ON v.negocio_id = n.id
             ORDER BY v.created_at DESC
             LIMIT 50`
        );

        return NextResponse.json({
            success: true,
            stats: totalStats[0] || { total_stands: 0, total_votos_general: 0, stands_con_reviews: 0 },
            negocios,
            recent_votes: recentVotes
        });
    } catch (error: any) {
        console.error('Error al obtener lista de negocios de la feria:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const body = await req.json();
        const { id, is_active } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }

        await pool.query(
            `UPDATE feria_negocios SET is_active = ? WHERE id = ?`,
            [is_active ? 1 : 0, id]
        );

        return NextResponse.json({ success: true, message: 'Estado actualizado' });
    } catch (error: any) {
        console.error('Error actualizando negocio:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }

        await pool.query(`DELETE FROM feria_negocios WHERE id = ?`, [id]);

        return NextResponse.json({ success: true, message: 'Negocio eliminado' });
    } catch (error: any) {
        console.error('Error eliminando negocio:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
