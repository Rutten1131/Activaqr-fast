import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const rawCode = searchParams.get('code');
    const id = searchParams.get('id');

    if (!rawCode && !id) {
        return NextResponse.json({ error: 'Código o ID es requerido' }, { status: 400 });
    }

    try {
        // En la BD la columna puede llamarse 'code' o 'codigo'. Consultamos ambas.
        let query = 'SELECT id, nombre, COALESCE(code, codigo) as codigo FROM registraya_vcard_sellers WHERE (activo = 1 OR activo IS NULL)';
        let params: any[] = [];

        if (rawCode) {
            const codeStr = rawCode.trim();
            const cleanCode = codeStr.replace(/[^a-zA-Z0-9]/g, '');
            const withHash = `#${cleanCode}`;

            query += ` AND (
                LOWER(code) = LOWER(?) OR LOWER(code) = LOWER(?) OR LOWER(REPLACE(code, "#", "")) = LOWER(?) OR
                LOWER(codigo) = LOWER(?) OR LOWER(codigo) = LOWER(?) OR LOWER(REPLACE(codigo, "#", "")) = LOWER(?)
            )`;
            params.push(codeStr, withHash, cleanCode, codeStr, withHash, cleanCode);
        } else if (id) {
            query += ' AND id = ?';
            params.push(id);
        }

        const [rows] = await pool.execute(query, params);
        const sellers = rows as any[];

        if (sellers.length > 0) {
            return NextResponse.json({
                success: true,
                id: sellers[0].id,
                nombre: sellers[0].nombre,
                codigo: sellers[0].codigo
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Vendedor no encontrado o inactivo'
            }, { status: 200 });
        }
    } catch (err: any) {
        console.error('Error validating seller code:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
