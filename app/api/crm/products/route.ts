import { NextRequest, NextResponse } from 'next/server';
import { verifyCrmAuth } from '@/lib/crm-auth';

export const dynamic = 'force-dynamic';

/**
 * GET: Lista el catálogo oficial de productos y planes de ActivaQR para el CRM de Finanzas
 * Auth: x-crm-api-key header
 */
export async function GET(req: NextRequest) {
    const authError = verifyCrmAuth(req);
    if (authError) return authError;

    const products = [
        {
            sku: 'PLAN_ESTANDAR',
            nombre: 'vCard Inteligente Estándar',
            categoria: 'suscripcion_anual',
            precio_usd: 29.99,
            recurrencia: 'anual',
            descripcion: 'Tarjeta de contacto digital con código QR dinámico y guardado VCF automático.',
            activo: true
        },
        {
            sku: 'PLAN_PRO',
            nombre: 'vCard Pro + Menú / Catálogo Digital',
            categoria: 'suscripcion_anual',
            precio_usd: 49.99,
            recurrencia: 'anual',
            descripcion: 'Tarjeta inteligente con módulo de menú digital, productos/servicios y carruseles.',
            activo: true
        },
        {
            sku: 'PLAN_VIP',
            nombre: 'vCard VIP Custom / Estructural',
            categoria: 'suscripcion_anual',
            precio_usd: 99.99,
            recurrencia: 'anual',
            descripcion: 'Diseño ultra-personalizado con jerarquía custom, subdominio/slug reservado y prioridad SEO.',
            activo: true
        },
        {
            sku: 'PHYSICAL_CARD_NFC',
            nombre: 'Tarjeta Física NFC ActivaQR',
            categoria: 'pago_unico',
            precio_usd: 25.00,
            recurrencia: 'ninguna',
            descripcion: 'Tarjeta física de PVC o Madera grabada con chip NFC y QR impreso.',
            activo: true
        },
        {
            sku: 'WIFI_STANDALONE',
            nombre: 'Módulo QR WiFi Autónomo',
            categoria: 'pago_unico',
            precio_usd: 15.00,
            recurrencia: 'ninguna',
            descripcion: 'Sistema de conexión instantánea WiFi mediante escaneo QR para locales.',
            activo: true
        }
    ];

    return NextResponse.json({
        success: true,
        data: products,
        meta: {
            total: products.length,
            currency: 'USD'
        }
    });
}
