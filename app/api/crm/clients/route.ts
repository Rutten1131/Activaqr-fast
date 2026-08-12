import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyCrmAuth } from '@/lib/crm-auth';

export const dynamic = 'force-dynamic';

/**
 * GET: Lista TODOS los clientes (con filtros opcionales)
 * Auth: x-crm-api-key header
 * 
 * Query params:
 *   - status: 'pendiente' | 'pagado' | 'all' (default: 'all')
 *   - plan: Filtrar por plan específico
 *   - seller_id: Filtrar por vendedor
 *   - from: Fecha inicio (YYYY-MM-DD)
 *   - to: Fecha fin (YYYY-MM-DD)
 *   - search: Buscar por nombre, email o negocio
 *   - limit: (default 100, max 500)
 *   - offset: (default 0)
 *   - sort: 'created_at' | 'paid_at' | 'nombre' (default: 'created_at')
 *   - order: 'ASC' | 'DESC' (default: 'DESC')
 */
export async function GET(req: NextRequest) {
    const authError = verifyCrmAuth(req);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'all';
        const plan = searchParams.get('plan');
        const sellerId = searchParams.get('seller_id');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const search = searchParams.get('search');
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
        const offset = parseInt(searchParams.get('offset') || '0');
        const sort = ['created_at', 'paid_at', 'nombre', 'expires_at'].includes(searchParams.get('sort') || '')
            ? searchParams.get('sort') : 'created_at';
        const order = searchParams.get('order')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const conditions: string[] = [];
        const params: any[] = [];

        if (status !== 'all') {
            conditions.push('r.status = ?');
            params.push(status);
        }
        if (plan) {
            conditions.push('r.plan = ?');
            params.push(plan);
        }
        if (sellerId) {
            conditions.push('r.seller_id = ?');
            params.push(sellerId);
        }
        if (from) {
            conditions.push('r.created_at >= ?');
            params.push(from);
        }
        if (to) {
            conditions.push('r.created_at <= ?');
            params.push(`${to} 23:59:59`);
        }
        if (search) {
            conditions.push('(r.nombre LIKE ? OR r.email LIKE ? OR r.nombre_negocio LIKE ?)');
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                r.id,
                r.slug,
                r.nombre,
                r.nombre_negocio,
                r.email,
                r.whatsapp,
                r.status,
                r.plan,
                r.tipo_perfil,
                r.profesion,
                r.created_at,
                r.paid_at,
                r.activated_at,
                r.expires_at,
                r.seller_id,
                r.commission_status,
                r.payment_method,
                s.nombre as vendedor_nombre,
                s.codigo as vendedor_codigo,
                s.comision_porcentaje as vendedor_comision,
                (SELECT COUNT(*) FROM vcard_downloads_log WHERE slug = r.slug) as descargas
            FROM registraya_vcard_registros r
            LEFT JOIN registraya_vcard_sellers s ON r.seller_id = s.id
            ${whereClause}
            ORDER BY r.${sort} ${order}
            LIMIT ? OFFSET ?
        `;
        params.push(limit, offset);

        const [rows]: any = await pool.execute(query, params);

        // Count total con mismos filtros
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM registraya_vcard_registros r
            LEFT JOIN registraya_vcard_sellers s ON r.seller_id = s.id
            ${whereClause}
        `;
        const countParams = params.slice(0, -2); // Sin limit/offset
        const [countResult]: any = await pool.execute(countQuery, countParams);

        return NextResponse.json({
            success: true,
            data: rows,
            meta: {
                total: countResult[0].total,
                limit,
                offset,
                has_more: offset + limit < countResult[0].total,
                filters_applied: { status, plan, sellerId, from, to, search },
            }
        });
    } catch (err: any) {
        console.error('[CRM /clients] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
