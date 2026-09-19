import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isRateLimited, getClientIP } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * External READ-ONLY endpoint to list active clients (pagado/entregado).
 * Designed for external systems (CRM, bots, integrations) that need bulk client data.
 *
 * Usage:
 *   GET /api/external/registros
 *   GET /api/external/registros?page=1&limit=50
 *   GET /api/external/registros?search=juan
 *   GET /api/external/registros?plan=pro
 *   GET /api/external/registros?status=pagado
 *   GET /api/external/registros?slug=juan-perez
 *   Headers: { "x-api-key": "EXTERNAL_API_KEY" }
 *
 * Returns: paginated list of active clients with public-safe fields only.
 * READ-ONLY: This endpoint never modifies data.
 */
export async function GET(req: NextRequest) {
    // 1. Authenticate with external API key
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.EXTERNAL_API_KEY;

    if (!expectedKey) {
        console.error('[external/registros] EXTERNAL_API_KEY not configured');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!apiKey || apiKey !== expectedKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limiting: 20 requests per minute (bulk endpoint, stricter than vcard)
    const clientIP = getClientIP(req);
    if (isRateLimited('external-registros:' + clientIP, 20, 60000)) {
        return NextResponse.json(
            { error: 'Too many requests. Try again later.' },
            { status: 429 }
        );
    }

    // 3. Parse query params
    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit    = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const search   = searchParams.get('search')?.trim() || '';
    const planFilter   = searchParams.get('plan')?.trim()   || '';
    const statusFilter = searchParams.get('status')?.trim() || '';
    const slugFilter   = searchParams.get('slug')?.trim()   || '';

    try {
        const conditions: string[] = [];
        const params: any[] = [];

        // Security: always restrict to active clients only
        if (statusFilter === 'pagado' || statusFilter === 'entregado') {
            conditions.push('r.status = ?');
            params.push(statusFilter);
        } else {
            conditions.push("r.status IN ('pagado', 'entregado')");
        }

        if (search) {
            conditions.push('(LOWER(r.nombre) LIKE ? OR LOWER(r.email) LIKE ? OR LOWER(r.whatsapp) LIKE ? OR LOWER(r.nombre_negocio) LIKE ?)');
            const p = '%' + search.toLowerCase() + '%';
            params.push(p, p, p, p);
        }

        if (planFilter) {
            conditions.push('r.plan = ?');
            params.push(planFilter);
        }

        if (slugFilter) {
            conditions.push('r.slug = ?');
            params.push(slugFilter);
        }

        const whereClause = 'WHERE ' + conditions.join(' AND ');

        // Count query for pagination metadata
        const countQuery = 'SELECT COUNT(*) as total FROM registraya_vcard_registros r ' + whereClause;
        const [[countRow]]: any = await pool.execute(countQuery, params);
        const total = countRow?.total || 0;

        // Main query - public-safe fields only, never internal keys or admin data
        const offset = (page - 1) * limit;
        const query = 'SELECT r.id, r.slug, r.nombre, r.nombre_negocio, r.empresa, r.email, r.whatsapp, r.status, r.plan, r.tipo_perfil, r.profesion, r.bio, r.direccion, r.web, r.instagram, r.linkedin, r.facebook, r.tiktok, r.youtube, r.x, r.google_business, r.foto_url, r.template_id, r.etiquetas, r.productos_servicios, r.activated_at, r.expires_at, r.created_at, COALESCE(dl.downloads_count, 0) as downloads_count FROM registraya_vcard_registros r LEFT JOIN (SELECT slug, COUNT(*) as downloads_count FROM vcard_downloads_log GROUP BY slug) dl ON r.slug = dl.slug ' + whereClause + ' ORDER BY r.created_at DESC LIMIT ' + limit + ' OFFSET ' + offset;

        const [rows]: any = await pool.execute(query, params);

        return NextResponse.json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
                has_next: page * limit < total,
                has_prev: page > 1,
            },
            filters_applied: {
                search: search || null,
                plan: planFilter || null,
                status: statusFilter || 'pagado,entregado',
                slug: slugFilter || null,
            }
        });

    } catch (err: any) {
        console.error('[external/registros] Database error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
