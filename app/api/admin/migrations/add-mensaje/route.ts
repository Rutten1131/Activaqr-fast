import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await pool.query(
            `ALTER TABLE registraya_vcard_registros ADD COLUMN mensaje TEXT DEFAULT NULL;`
        );
        return NextResponse.json({ message: 'Column mensaje added successfully!' }, { status: 200 });
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
             return NextResponse.json({ message: 'Column mensaje already exists' }, { status: 200 });
        }
        return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }
}
