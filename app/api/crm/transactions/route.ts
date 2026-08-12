import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyCrmAuth } from '@/lib/crm-auth';

export const dynamic = 'force-dynamic';

/**
 * GET: Obtiene las transacciones financieras / historial de ingresos de ActivaQR
 * Auth: x-crm-api-key header
 * 
 * Query params:
 *   - status: 'pagado' | 'pendiente' | 'all' (default: 'pagado')
 *   - from: Fecha inicio (YYYY-MM-DD)
 *   - to: Fecha fin (YYYY-MM-DD)
 *   - seller_id: Filtrar por vendedor
 *   - limit: (default 100, max 500)
 *   - offset: (default 0)
 */
export async function GET(req: NextRequest) {
    const authError = verifyCrmAuth(req);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'pagado';
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const sellerId = searchParams.get('seller_id');
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
        const offset = parseInt(searchParams.get('offset') || '0');

        const conditions: string[] = [];
        const params: any[] = [];

        if (status !== 'all') {
            conditions.push('r.status = ?');
            params.push(status);
        }
        if (from) {
            conditions.push('r.paid_at >= ?');
            params.push(from);
        }
        if (to) {
            conditions.push('r.paid_at <= ?');
            params.push(`${to} 23:59:59`);
        }
        if (sellerId) {
            conditions.push('r.seller_id = ?');
            params.push(sellerId);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                r.id as client_id,
                r.slug,
                r.nombre as cliente_nombre,
                r.email as cliente_email,
                r.plan,
                r.status as estado_pago,
                r.payment_method,
                r.created_at,
                r.paid_at,
                r.seller_id,
                s.nombre as vendedor_nombre,
                s.codigo as vendedor_codigo,
                s.comision_porcentaje,
                r.commission_status,
                r.leader_paid_at,
                r.seller_confirmed_at
            FROM registraya_vcard_registros r
            LEFT JOIN registraya_vcard_sellers s ON r.seller_id = s.id
            ${whereClause}
            ORDER BY r.paid_at DESC, r.created_at DESC
            LIMIT ? OFFSET ?
        `;
        params.push(limit, offset);

        const [rows]: any = await pool.execute(query, params);

        // Mapeo de precios por plan
        const planPrices: Record<string, number> = {
            'PLAN_ESTANDAR': 29.99,
            'PLAN_PRO': 49.99,
            'PLAN_VIP': 99.99,
            'estandar': 29.99,
            'pro': 49.99,
            'vip': 99.99,
        };

        const transactions = rows.map((row: any) => {
            const planKey = (row.plan || 'PLAN_ESTANDAR').toUpperCase();
            const montoBruto = planPrices[planKey] || planPrices[row.plan] || 29.99;
            const comisionPct = row.comision_porcentaje ? parseFloat(row.comision_porcentaje) : 30;
            const montoComision = (montoBruto * comisionPct) / 100;
            const montoNetoEmpresa = montoBruto - montoComision;

            return {
                transaction_id: `TX-AQR-${row.client_id.substring(0, 8)}`,
                project_code: 'ACTIVAQR',
                client: {
                    id: row.client_id,
                    slug: row.slug,
                    nombre: row.cliente_nombre,
                    email: row.cliente_email,
                },
                financials: {
                    plan: row.plan,
                    monto_bruto: montoBruto,
                    comision_vendedor_monto: row.seller_id ? montoComision : 0,
                    comision_porcentaje: row.seller_id ? comisionPct : 0,
                    monto_neto_empresa: row.seller_id ? montoNetoEmpresa : montoBruto,
                    metodo_pago: row.payment_method || 'pasarela',
                    estado_pago: row.estado_pago,
                    paid_at: row.paid_at || row.created_at,
                },
                seller: row.seller_id ? {
                    id: row.seller_id,
                    codigo: row.vendedor_codigo,
                    nombre: row.vendedor_nombre,
                    commission_status: row.commission_status,
                    leader_paid_at: row.leader_paid_at,
                    seller_confirmed_at: row.seller_confirmed_at,
                } : null
            };
        });

        // Totales consolidados para finanzas
        const [sumResult]: any = await pool.execute(`
            SELECT COUNT(*) as total_transacciones
            FROM registraya_vcard_registros r
            ${whereClause}
        `, params.slice(0, -2));

        return NextResponse.json({
            success: true,
            data: transactions,
            meta: {
                total: sumResult[0].total_transacciones,
                limit,
                offset,
                has_more: offset + limit < sumResult[0].total_transacciones,
            }
        });
    } catch (err: any) {
        console.error('[CRM /transactions] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
