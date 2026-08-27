import { NextRequest, NextResponse } from 'next/server';

// Dominios principales del sistema que no se reescriben
const ROOT_DOMAINS = new Set([
    'activaqr.com',
    'www.activaqr.com',
    'localhost',
    '127.0.0.1',
    'activaqr2.vercel.app',
    'gimnasios.activaqr.com',
    'restaurante.activaqr.com'
]);

/**
 * Proxy unificado de Next.js 16:
 * 1. Multi-tenant: reescritura dinámica de dominios y subdominios personalizados
 * 2. Seguridad Admin: protege APIs sensibles de administración
 */
export async function proxy(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;

    // ─── 1. SEGURIDAD ADMIN Y APIS PROTEGIDAS ────────────────────────────────────
    const isAdminProtected = (
        pathname.startsWith('/api/admin/registros') ||
        pathname.startsWith('/api/survey/list') ||
        pathname.startsWith('/api/send-vcard')
    );

    if (isAdminProtected) {
        const adminKey = request.headers.get('x-admin-key');
        const expectedKey = process.env.ADMIN_API_KEY;

        if (!expectedKey) {
            console.error('ADMIN_API_KEY not configured');
            return NextResponse.json(
                { error: 'Error de configuración del servidor' },
                { status: 500 }
            );
        }

        const sellerId = url.searchParams.get('seller_id');
        if (!sellerId) {
            if (!adminKey || adminKey !== expectedKey) {
                return NextResponse.json(
                    { error: 'No autorizado. Se requiere clave de administrador.' },
                    { status: 401 }
                );
            }
        }
        return NextResponse.next();
    }

    // ─── 2. MULTI-TENANT: RESOLUCIÓN DE DOMINIOS PERSONALIZADOS ──────────────────
    const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const host = rawHost.split(':')[0].toLowerCase().trim();

    // Si es dominio raíz o local, continuar normal
    if (!host || ROOT_DOMAINS.has(host) || host.endsWith('.vercel.app')) {
        return NextResponse.next();
    }

    // Si entra a la raíz '/', resolvemos a qué catálogo o tarjeta pertenece
    if (pathname === '/') {
        try {
            const resolveUrl = new URL(`/api/internal/resolve-domain?host=${host}`, request.url);
            const res = await fetch(resolveUrl.toString(), {
                headers: {
                    'x-internal-middleware': 'true'
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.slug) {
                    const destination = data.isCatalog ? `/catalog/${data.slug}` : `/card/${data.slug}`;
                    const rewriteUrl = new URL(destination, request.url);
                    
                    const response = NextResponse.rewrite(rewriteUrl);
                    response.headers.set('x-custom-domain', host);
                    return response;
                }
            }
        } catch (err) {
            console.error('[Proxy] Error resolving custom domain:', err);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Coincide con todas las rutas excepto:
         * - _next/static, _next/image, favicon, sitemap, robots
         * - extensiones estáticas comunes
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|vcf|css|js)$).*)',
    ],
};
