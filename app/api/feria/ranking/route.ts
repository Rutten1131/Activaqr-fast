import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const categoria = searchParams.get('categoria');

        let whereClause = 'WHERE is_active = 1';
        const queryParams: any[] = [];

        if (categoria && categoria !== 'todos') {
            whereClause += ' AND categoria = ?';
            queryParams.push(categoria);
        }

        // Obtener ranking ordenado por puntuación ponderada (votos simples + verificados)
        const [ranking]: any = await pool.query(
            `SELECT id, slug, nombre_negocio, nombre_representante, numero_stand, categoria, 
                    origen, logo_url, total_votos, total_votos_verificados,
                    (total_votos + (total_votos_verificados * 2)) as total_puntos
             FROM feria_negocios
             ${whereClause}
             ORDER BY total_puntos DESC, total_votos DESC, created_at ASC
             LIMIT 100`,
            queryParams
        );

        const [stats]: any = await pool.query(
            `SELECT 
                COUNT(*) as total_participantes,
                COALESCE(SUM(total_votos), 0) as total_votos,
                COALESCE(SUM(total_votos_verificados), 0) as total_votos_verificados
             FROM feria_negocios
             WHERE is_active = 1`
        );

        return NextResponse.json({
            success: true,
            top5: ranking.slice(0, 5),
            ranking: ranking || [],
            participantes: ranking || [],
            stats: stats[0] || { total_participantes: 0, total_votos: 0, total_votos_verificados: 0 }
        });
    } catch (error: any) {
        console.error('Error al obtener ranking público de la feria:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
