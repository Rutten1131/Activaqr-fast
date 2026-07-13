import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_HOST = process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
const BUNNY_PULLZONE_URL = process.env.BUNNY_PULLZONE_URL;

/**
 * POST: Upload a media file (image, video, audio) to Bunny CDN for broadcast use.
 * Accepts FormData with a 'file' field.
 * Returns the public CDN URL.
 */
export async function POST(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    if (!BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_API_KEY || !BUNNY_PULLZONE_URL) {
        return NextResponse.json({
            error: 'Bunny CDN no configurado. Verifique BUNNY_STORAGE_ZONE, BUNNY_STORAGE_API_KEY, BUNNY_PULLZONE_URL en .env'
        }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
        }

        // Validate file size (max 16MB)
        const MAX_SIZE = 16 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'El archivo excede el límite de 16MB' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'video/mp4', 'video/quicktime', 'video/webm',
            'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4'
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: `Tipo de archivo no soportado: ${file.type}. Tipos permitidos: imagen (jpeg, png, webp, gif), video (mp4, mov, webm), audio (mp3, ogg, wav)`
            }, { status: 400 });
        }

        // Determine media type category
        let mediaType: 'image' | 'video' | 'audio' = 'image';
        if (file.type.startsWith('video/')) mediaType = 'video';
        else if (file.type.startsWith('audio/')) mediaType = 'audio';

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'bin';
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileName = `broadcast_${mediaType}_${timestamp}_${randomSuffix}.${ext}`;
        const storagePath = `broadcast/${fileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Bunny CDN
        const uploadUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${storagePath}`;

        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': BUNNY_STORAGE_API_KEY,
                'Content-Type': 'application/octet-stream'
            },
            body: buffer
        });

        if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            console.error('[Broadcast Upload] Bunny CDN error:', errText);
            return NextResponse.json({ error: `Error subiendo a CDN: ${errText}` }, { status: 500 });
        }

        const publicUrl = `${BUNNY_PULLZONE_URL}/${storagePath}`;

        console.log(`[Broadcast Upload] Archivo subido: ${publicUrl} (${mediaType}, ${(file.size / 1024).toFixed(1)}KB)`);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            mediaType,
            fileName: file.name,
            size: file.size
        });

    } catch (err: any) {
        console.error('[Broadcast Upload] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
