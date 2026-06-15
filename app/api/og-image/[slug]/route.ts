import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Convierte un buffer de imagen a JPEG usando Sharp.
 * Si no es WebP o falla la conversión, devuelve el buffer original.
 */
function toBodyInit(data: Buffer): BodyInit {
    return data as unknown as BodyInit;
}

async function convertToJpeg(buffer: Buffer | Uint8Array, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const inputBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    // Si ya es JPEG, devolver tal cual
    if (mimeType === 'image/jpeg') {
        return { buffer: inputBuffer, mimeType };
    }

    // Intentar convertir a JPEG (WebP, PNG, etc.)
    try {
        const sharp = (await import('sharp')).default;
        const jpegBuffer = await sharp(inputBuffer)
            .resize(1200, 630, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 85 })
            .toBuffer();
        return { buffer: jpegBuffer, mimeType: 'image/jpeg' };
    } catch (e) {
        console.error('Sharp conversion failed, serving original', e);
        return { buffer: inputBuffer, mimeType };
    }
}

/**
 * Descarga una imagen desde una URL externa.
 */
async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ActivaQR-OG-Bot/1.0)',
            },
        });
        clearTimeout(timeoutId);

        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        return { buffer: Buffer.from(arrayBuffer), mimeType: contentType };
    } catch (e) {
        console.error('Failed to fetch image from URL:', url, e);
        return null;
    }
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug: rawSlug } = await context.params;
        // Strip out common image extensions if appended (e.g., .jpg, .png)
        const slug = rawSlug.replace(/\.(jpg|jpeg|png)$/i, '');
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.activaqr.com';

        // ─── Cache buster: si ?v= está presente, forzamos siempre fresco ──
        const version = request.nextUrl.searchParams.get('v');
        const isFreshRequest = !!version; // Si hay ?v=, el cliente quiere datos frescos
        const cacheControl = isFreshRequest
            ? 'public, s-maxage=0, must-revalidate, max-age=0'
            : 'public, s-maxage=86400, stale-while-revalidate=3600';

        const [rows]: any = await pool.execute(
            'SELECT foto_url FROM registraya_vcard_registros WHERE slug = ?',
            [slug]
        );

        if (rows && rows.length > 0) {
            const fotoUrl = rows[0].foto_url;

            if (fotoUrl && fotoUrl.startsWith('data:image/')) {
                // ─── Procesar base64 data URI ───────────────────────────────
                const matches = fotoUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                
                if (matches && matches.length === 3) {
                    const mimeType = matches[1];
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');

                    // Convertir a JPEG para máxima compatibilidad con OG crawlers
                    const result = await convertToJpeg(buffer, mimeType);
                    
                    return new Response(toBodyInit(result.buffer), {
                        headers: {
                            'Content-Type': result.mimeType,
                            'Content-Length': String(result.buffer.length),
                            'Cache-Control': cacheControl,
                            'X-OG-Type': 'processed-jpeg',
                            'X-OG-Version': version || 'none',
                        },
                    });
                }
            } else if (fotoUrl && fotoUrl.startsWith('http')) {
                // ─── Descargar imagen externa (BunnyCDN, Supabase, etc.) ──
                // NO redirigimos porque podría ser WebP → WhatsApp no lo soporta bien
                // En su lugar, descargamos, convertimos a JPEG y servimos directamente
                const fetched = await fetchImageBuffer(fotoUrl);
                if (fetched) {
                    const result = await convertToJpeg(fetched.buffer, fetched.mimeType);
                    
                    return new Response(toBodyInit(result.buffer), {
                        headers: {
                            'Content-Type': result.mimeType,
                            'Content-Length': String(result.buffer.length),
                            'Cache-Control': cacheControl,
                            'X-OG-Type': 'converted-jpeg',
                            'X-OG-Version': version || 'none',
                        },
                    });
                }
            }
        }

        // ─── Fallback: redirigir a imagen OG default ───────────────────────
        return NextResponse.redirect(`${appUrl}/images/og-preview.jpg`, isFreshRequest ? 302 : 301);
        
    } catch (error) {
        console.error('Error serving OG image:', error);
        // Fallback final: imagen default
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.activaqr.com';
        return Response.redirect(`${appUrl}/images/og-preview.jpg`);
    }
}
