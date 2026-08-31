import { NextRequest, NextResponse } from 'next/server';

/**
 * API de validación de clave admin
 * El frontend envía la clave, el server la compara con ADMIN_API_KEY
 * Retorna { valid: true/false }
 */
export async function POST(req: NextRequest) {
    try {
        const { key } = await req.json();
        const expectedKey = process.env.ADMIN_API_KEY;

        if (!expectedKey) {
            console.error('ADMIN_API_KEY no configurada');
            return NextResponse.json(
                { error: 'Error de configuración del servidor' },
                { status: 500 }
            );
        }

        if (key && expectedKey && key.trim() === expectedKey.trim()) {
            return NextResponse.json({ valid: true });
        } else {
            return NextResponse.json({ valid: false, error: 'Clave incorrecta' }, { status: 401 });
        }
    } catch (err: any) {
        console.error('Validate route error:', err);
        return NextResponse.json({ error: 'Error del servidor', message: err?.message }, { status: 500 });
    }
}
