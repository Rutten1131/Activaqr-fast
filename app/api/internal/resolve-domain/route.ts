import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const host = searchParams.get('host');

    if (!host) {
        return NextResponse.json({ error: 'Missing host parameter' }, { status: 400 });
    }

    const cleanHost = host.split(':')[0].toLowerCase().trim();

    try {
        const [rows]: any = await pool.execute(
            `SELECT id, slug, plan, status, custom_domain 
             FROM registraya_vcard_registros 
             WHERE custom_domain = ? LIMIT 1`,
            [cleanHost]
        );

        if (rows && rows.length > 0) {
            const client = rows[0];
            return NextResponse.json(
                {
                    success: true,
                    slug: client.slug,
                    plan: client.plan,
                    status: client.status,
                    isCatalog: client.plan === 'catalog'
                },
                {
                    headers: {
                        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
                    }
                }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Domain not mapped' },
            { status: 404 }
        );
    } catch (err: any) {
        console.error('[resolve-domain] Error resolving domain:', err);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
