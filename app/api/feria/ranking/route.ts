import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Obtener los primeros 5 del ranking
        const [top5]: any = await pool.query(
            `SELECT id, slug, nombre_negocio, logo_url, total_votos
             FROM feria_negocios
             WHERE is_active = 1
             ORDER BY total_votos DESC, created_at ASC
             LIMIT 5`
        );

        // Obtener todos los participantes activos con logo para el muro/carrusel
        const [participantes]: any = await pool.query(
            `SELECT id, slug, nombre_negocio, logo_url, total_votos
             FROM feria_negocios
             WHERE is_active = 1
             ORDER BY total_votos DESC, created_at ASC`
        );

        const [stats]: any = await pool.query(
            `SELECT 
                COUNT(*) as total_participantes,
                COALESCE(SUM(total_votos), 0) as total_votos
             FROM feria_negocios
             WHERE is_active = 1`
        );

        return NextResponse.json({
            success: true,
            top5: top5 || [],
            participantes: participantes || [],
            stats: stats[0] || { total_participantes: 0, total_votos: 0 }
        });
    } catch (error: any) {
        console.error('Error al obtener ranking público de la feria:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
