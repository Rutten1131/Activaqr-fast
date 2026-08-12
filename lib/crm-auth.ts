import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifica la autenticación del CRM externo via header x-crm-api-key.
 * Retorna null si la autenticación es exitosa, o un NextResponse con error si falla.
 */
export function verifyCrmAuth(req: NextRequest): NextResponse | null {
    const crmApiKey = req.headers.get('x-crm-api-key');
    if (!process.env.CRM_API_KEY) {
        console.error('[CRM Auth] CRM_API_KEY no configurada en variables de entorno');
        return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 });
    }
    if (crmApiKey !== process.env.CRM_API_KEY) {
        return NextResponse.json({ error: 'No autorizado - API key inválida' }, { status: 401 });
    }
    return null;
}
