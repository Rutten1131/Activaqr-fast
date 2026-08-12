import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyCrmAuth } from '@/lib/crm-auth';

export const dynamic = 'force-dynamic';

/**
 * GET: Lista todos los vendedores con su jerarquía, comisiones y métricas
 * Auth: x-crm-api-key header
 *
 * Query params:
 *   - role: 'seller' | 'leader' | 'admin' (default: todos)
 *   - activo: '1' | '0' (default: todos)
 *   - include_stats: '1' para incluir métricas de ventas (más lento)
 */
export async function GET(req: NextRequest) {
    const authError = verifyCrmAuth(req);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const activo = searchParams.get('activo');
        const includeStats = searchParams.get('include_stats') === '1';

        const conditions: string[] = [];
        const params: any[] = [];

        if (role) {
            conditions.push('s.role = ?');
            params.push(role);
        }
        if (activo !== null && activo !== undefined && activo !== '') {
            conditions.push('s.activo = ?');
            params.push(parseInt(activo));
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                s.id,
                s.codigo,
                s.nombre,
                s.email,
                s.role,
                s.comision_porcentaje,
                s.activo,
                s.parent_id,
                s.created_at,
                s.banco_nombre,
                s.banco_beneficiario,
                s.banco_numero_cuenta,
                s.banco_cedula,
                s.banco_correo,
                s.datos_bancarios_completados,
                p.nombre as lider_nombre,
                p.codigo as lider_codigo
            FROM registraya_vcard_sellers s
            LEFT JOIN registraya_vcard_sellers p ON s.parent_id = p.id
            ${whereClause}
            ORDER BY s.role DESC, s.created_at ASC
        `;

        const [sellers]: any = await pool.execute(query, params);

        // Si se piden stats, agregar métricas de ventas para cada vendedor
        if (includeStats) {
            for (const seller of sellers) {
                const [stats]: any = await pool.execute(`
                    SELECT 
                        COUNT(*) as total_clientes,
                        SUM(CASE WHEN status = 'pagado' THEN 1 ELSE 0 END) as clientes_pagados,
                        SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END) as clientes_pendientes,
                        COUNT(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN 1 END) as ventas_mes_actual
                    FROM registraya_vcard_registros
                    WHERE seller_id = ?
                `, [seller.id]);

                seller.stats = stats[0];

                // Contar sub-vendedores si es líder
                if (seller.role === 'leader' || seller.role === 'admin') {
                    const [teamCount]: any = await pool.execute(
                        'SELECT COUNT(*) as total_equipo FROM registraya_vcard_sellers WHERE parent_id = ?',
                        [seller.id]
                    );
                    seller.stats.total_equipo = teamCount[0].total_equipo;
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: sellers,
            meta: {
                total: sellers.length,
                include_stats: includeStats,
            }
        });
    } catch (err: any) {
        console.error('[CRM /sellers] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
