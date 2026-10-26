import { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const headersList = await headers();
    const rawHost = headersList.get('x-forwarded-host') || headersList.get('host') || 'www.activaqr.com';
    const cleanHost = rawHost.split(':')[0].toLowerCase().trim();
    const domainWithoutWww = cleanHost.replace(/^www\./, '');

    const isActivaQr = cleanHost.includes('activaqr.com') || cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1');

    if (!isActivaQr) {
        try {
            const [rows]: any = await pool.execute(
                `SELECT nombre, nombre_negocio, tipo_perfil, bio, foto_url, json_override 
                 FROM registraya_vcard_registros 
                 WHERE custom_domain IN (?, ?) AND status != 'cancelado' LIMIT 1`,
                [cleanHost, domainWithoutWww]
            );

            if (rows && rows.length > 0) {
                const client = rows[0];
                const displayName = client.tipo_perfil === 'negocio'
                    ? (client.nombre_negocio || client.nombre)
                    : client.nombre;

                let iconUrl = client.foto_url && client.foto_url.startsWith('http') ? client.foto_url : '/favicon.ico';
                if (client.json_override) {
                    try {
                        const parsed = typeof client.json_override === 'string'
                            ? JSON.parse(client.json_override)
                            : client.json_override;
                        if (parsed?.custom_favicon) {
                            iconUrl = parsed.custom_favicon;
                        }
                    } catch {}
                }

                return {
                    name: displayName,
                    short_name: displayName,
                    description: client.bio || displayName,
                    start_url: '/',
                    display: 'standalone',
                    background_color: '#ffffff',
                    theme_color: '#002B49',
                    icons: [
                        {
                            src: iconUrl,
                            sizes: 'any',
                        },
                        {
                            src: iconUrl,
                            sizes: '192x192',
                        },
                        {
                            src: iconUrl,
                            sizes: '512x512',
                        }
                    ]
                };
            }
        } catch (err) {
            console.error('[Manifest] Error resolving custom domain manifest:', err);
        }
    }

    return {
        name: 'ActivaQR - Contacto Digital',
        short_name: 'ActivaQR',
        description: 'Tu contacto profesional en 1 clic. Siempre aparece primero en el teléfono de tus clientes.',
        start_url: '/',
        display: 'standalone',
        background_color: '#FDFCF6',
        theme_color: '#002B49',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/images/logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/images/logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
        ],
        shortcuts: [
            {
                name: 'Panel Vendedor',
                short_name: 'Mi Panel',
                description: 'Acceso directo al panel de ventas y comisiones',
                url: '/admin/vendedor',
                icons: [{ src: '/favicon.ico', sizes: '192x192' }]
            },
            {
                name: 'Panel Administrador',
                short_name: 'Admin',
                description: 'Acceso directo al panel de gestión de perfiles de contacto',
                url: '/admin',
                icons: [{ src: '/favicon.ico', sizes: '192x192' }]
            }
        ]
    }
}
