import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const host = rawHost.split(':')[0].toLowerCase().trim();

    // 1. Ignorar dominios principales del sistema
    if (!host || ROOT_DOMAINS.has(host) || host.endsWith('.vercel.app')) {
        return NextResponse.next();
    }

    // 2. Solo reescribir la raíz '/' o rutas sin extensión
    if (url.pathname === '/') {
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
            console.error('[Middleware] Error resolving custom domain:', err);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Coincide con todas las rutas excepto:
         * - api (rutas API)
         * - _next/static (archivos estáticos compilados)
         * - _next/image (optimización de imágenes)
         * - favicon.ico, sitemap, robots, etc.
         * - extensiones de archivo comunes
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|vcf|css|js)$).*)',
    ],
};
