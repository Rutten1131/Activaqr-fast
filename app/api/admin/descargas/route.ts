import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const type = searchParams.get('type');

    if (type === 'stats' || (!slug && !type)) {
        try {
            const [[totalRow]]: any = await pool.execute(`SELECT COUNT(*) as count FROM vcard_downloads_log`);
            const [[weeklyRow]]: any = await pool.execute(`SELECT COUNT(*) as count FROM vcard_downloads_log WHERE created_at >= NOW() - INTERVAL 7 DAY`);
            const [[monthlyRow]]: any = await pool.execute(`SELECT COUNT(*) as count FROM vcard_downloads_log WHERE created_at >= NOW() - INTERVAL 30 DAY`);
            const [[todayRow]]: any = await pool.execute(`SELECT COUNT(*) as count FROM vcard_downloads_log WHERE created_at >= CURDATE()`);

            return NextResponse.json({
                total: totalRow?.count || 0,
                weekly: weeklyRow?.count || 0,
                monthly: monthlyRow?.count || 0,
                today: todayRow?.count || 0
            });
        } catch (err: any) {
            console.error('[ADMIN DESCARGAS STATS] Error:', err);
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
    }

    try {
        const [rows]: any = await pool.execute(
            `SELECT * FROM vcard_downloads_log 
             WHERE slug = ? 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [slug]
        );

        return NextResponse.json({ data: rows });
    } catch (err: any) {
        console.error('[ADMIN DESCARGAS] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

