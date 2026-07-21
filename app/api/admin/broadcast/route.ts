import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
// Increase max duration for broadcast (Vercel Pro = 60s)
export const maxDuration = 60;

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

/**
 * GET: Preview — returns count and list of recipients based on status filter
 */
export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    const { searchParams } = new URL(req.url);
    const statuses = searchParams.get('statuses')?.split(',') || ['pagado', 'entregado'];
    const plansParam = searchParams.get('plans');
    const plans = plansParam ? plansParam.split(',') : null;

    // Validate statuses
    const validStatuses = ['pendiente', 'pagado', 'entregado', 'cancelado'];
    const filtered = statuses.filter(s => validStatuses.includes(s));
    if (filtered.length === 0) {
        return NextResponse.json({ error: 'No se proporcionaron estados válidos' }, { status: 400 });
    }

    try {
        const placeholders = filtered.map(() => '?').join(', ');
        let query = `SELECT id, slug, nombre, nombre_negocio, whatsapp, plan, status
                     FROM registraya_vcard_registros
                     WHERE status IN (${placeholders})
                       AND whatsapp IS NOT NULL
                       AND whatsapp != ''`;
        const params: any[] = [...filtered];

        if (plans && plans.length > 0) {
            const planPlaceholders = plans.map(() => '?').join(', ');
            query += ` AND plan IN (${planPlaceholders})`;
            params.push(...plans);
        }

        query += ` ORDER BY paid_at DESC, created_at DESC`;

        const [rows]: any = await pool.execute(query, params);

        return NextResponse.json({
            total: rows.length,
            recipients: rows.map((r: any) => ({
                id: r.id,
                slug: r.slug,
                nombre: r.nombre || r.nombre_negocio || 'Sin nombre',
                whatsapp: r.whatsapp,
                plan: r.plan,
                status: r.status
            }))
        });
    } catch (err: any) {
        console.error('[Broadcast] Error fetching recipients:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST: Send broadcast message to a specific batch of recipients
 * Body: { message, mediaUrl?, mediaType?, recipientIds?, statuses?, delayMs?, testNumber? }
 * 
 * The frontend controls batching:
 *   - Fetches all recipients via GET
 *   - Splits into micro-batches of 5-10
 *   - Calls POST for each batch with recipientIds[]
 *   - Waits 15-30s between batches
 */
export async function POST(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    // Validate Ecuador business hours (8:00 AM - 6:00 PM ECT)
    const ecuadorNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
    const ecuadorHour = ecuadorNow.getHours();
    const ecuadorMinutes = ecuadorNow.getMinutes();
    const timeStr = `${ecuadorHour.toString().padStart(2, '0')}:${ecuadorMinutes.toString().padStart(2, '0')}`;

    if (ecuadorHour < 8 || ecuadorHour >= 20) {
        console.log(`[Broadcast] Bloqueado: hora actual en Ecuador = ${timeStr} (fuera de 08:00-18:00)`);
        return NextResponse.json({
            error: `Fuera de horario permitido. Hora actual en Ecuador: ${timeStr}. Solo se permite enviar entre 08:00 y 20:00.`,
            ecuadorTime: timeStr,
            allowed: false
        }, { status: 403 });
    }

    console.log(`[Broadcast] Hora Ecuador: ${timeStr} — dentro de horario permitido.`);

    // Validate Evolution API config
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
        return NextResponse.json({
            error: 'Evolution API no configurada. Verifique EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE en .env'
        }, { status: 500 });
    }

    try {
        const body = await req.json();
        const {
            message,
            mediaUrl,
            mediaType, // 'image' | 'video' | 'audio'
            recipientIds, // array of specific IDs for this batch
            statuses = ['pagado', 'entregado'],
            delayMs = 5000,
            testNumber, // optional number for testing
            dynamicQr // flag to send dynamic WhatsApp QR
        } = body;

        if (!message || message.trim().length === 0) {
            return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
        }

        // Determine recipients
        let recipients: any[] = [];
        if (testNumber) {
            // Normalize phone to search in DB (try with 0 prefix and 593 prefix)
            const normalized = testNumber.startsWith('593') ? '0' + testNumber.slice(3) : testNumber;
            const pool = (await import('@/lib/db')).default;
            const [testRows]: any = await pool.execute(
                `SELECT id, slug, nombre, nombre_negocio, whatsapp FROM registraya_vcard_registros 
                 WHERE whatsapp IN (?, ?) LIMIT 1`,
                [normalized, testNumber.startsWith('0') ? '593' + testNumber.slice(1) : testNumber]
            );
            if (testRows.length > 0) {
                const tr = testRows[0];
                recipients = [{
                    id: tr.id,
                    slug: tr.slug,
                    nombre: tr.nombre || tr.nombre_negocio || 'Cliente',
                    whatsapp: testNumber,
                    plan: 'test',
                    status: 'test'
                }];
                console.log(`[Broadcast] Modo Prueba REAL → encontrado: ${recipients[0].nombre} (slug: ${recipients[0].slug})`);
            } else {
                // Fallback if number not in DB
                recipients = [{
                    id: 'test-id',
                    slug: 'cesar-reyes-jaramillo-eu0t',
                    nombre: 'César',
                    whatsapp: testNumber,
                    plan: 'test',
                    status: 'test'
                }];
                console.log(`[Broadcast] Modo Prueba FALLBACK (número no en BD). Enviando a: ${testNumber}`);
            }

        } else {
            // Validate statuses
            const validStatuses = ['pendiente', 'pagado', 'entregado', 'cancelado'];
            const filtered = (statuses as string[]).filter(s => validStatuses.includes(s));
            if (filtered.length === 0) {
                return NextResponse.json({ error: 'No se proporcionaron estados válidos' }, { status: 400 });
            }

            // Fetch recipients — either by specific IDs (batch mode) or by status filter
            if (recipientIds && Array.isArray(recipientIds) && recipientIds.length > 0) {
                // Batch mode: frontend sends specific IDs for this micro-batch
                const idPlaceholders = recipientIds.map(() => '?').join(', ');
                const [rows]: any = await pool.execute(
                    `SELECT id, slug, nombre, nombre_negocio, whatsapp, plan, status
                     FROM registraya_vcard_registros
                     WHERE id IN (${idPlaceholders})
                       AND whatsapp IS NOT NULL
                       AND whatsapp != ''`,
                    recipientIds
                );
                recipients = rows as any[];
            } else {
                // Legacy mode: fetch by status (limited to 10 for safety)
                const placeholders = filtered.map(() => '?').join(', ');
                const [rows]: any = await pool.execute(
                    `SELECT id, slug, nombre, nombre_negocio, whatsapp, plan, status
                     FROM registraya_vcard_registros
                     WHERE status IN (${placeholders})
                       AND whatsapp IS NOT NULL
                       AND whatsapp != ''
                     ORDER BY created_at DESC
                     LIMIT 10`,
                    filtered
                );
                recipients = rows as any[];
            }
        }

        // Clamp delay between 3s and 15s
        const baseDelay = Math.max(3000, Math.min(15000, Number(delayMs) || 5000));

        if (recipients.length === 0) {
            return NextResponse.json({
                success: true,
                total: 0,
                sent: 0,
                failed: 0,
                message: 'No hay destinatarios con los filtros seleccionados'
            });
        }

        console.log(`[Broadcast] Enviando a ${recipients.length} destinatarios con delay base de ${baseDelay}ms`);

        const results: { id: string; nombre: string; whatsapp: string; status: 'sent' | 'failed'; error?: string }[] = [];
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        // Add random jitter (±30%) to appear human-like
        const jitteredDelay = () => baseDelay + Math.floor((Math.random() - 0.5) * baseDelay * 0.6);

        for (let i = 0; i < recipients.length; i++) {
            const r = recipients[i];

            try {
                // Format WhatsApp number to international format (Ecuador: 593)
                let clientWhatsApp = r.whatsapp.replace(/\D/g, '');
                if (clientWhatsApp.length === 10 && clientWhatsApp.startsWith('0')) {
                    clientWhatsApp = '593' + clientWhatsApp.substring(1);
                } else if (clientWhatsApp.length === 9 && !clientWhatsApp.startsWith('593')) {
                    clientWhatsApp = '593' + clientWhatsApp;
                }

                let waRes: Response;
                let currentMessage = message
                    .replace(/{nombre}/g, r.nombre || r.nombre_negocio || 'Cliente')
                    .replace(/{slug}/g, r.slug || '');

                let finalMediaUrl = mediaUrl;
                let finalMediaType = mediaType;

                if (dynamicQr && r.slug) {
                    const cleanWa = (r.whatsapp || '').replace(/\D/g, '') || '593963425323';
                    finalMediaUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Contacto:${r.slug}`)}`)}`;
                    finalMediaType = 'image';
                }

                if (finalMediaUrl && finalMediaType) {
                    // Send media message
                    // Evolution API supports 'image', 'video', and 'document' as mediatype.
                    // Images → 'image' (inline preview)
                    // Videos → 'video' (inline with thumbnail, playable)
                    // Audios → 'document' (file attachment with correct mimetype)
                    const evolutionMediaType = finalMediaType === 'audio' ? 'document' : finalMediaType;

                    const mimeTypes: Record<string, string> = {
                        image: 'image/jpeg',
                        video: 'video/mp4',
                        audio: 'audio/mpeg'
                    };

                    const fileExtensions: Record<string, string> = {
                        image: '.jpg',
                        video: '.mp4',
                        audio: '.mp3'
                    };

                    const payload = {
                        number: clientWhatsApp,
                        mediatype: evolutionMediaType,
                        mimetype: mimeTypes[finalMediaType] || 'application/octet-stream',
                        media: finalMediaUrl,
                        caption: currentMessage,
                        fileName: `broadcast_${finalMediaType}_${Date.now()}${fileExtensions[finalMediaType] || ''}`
                    };

                    waRes = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': EVOLUTION_API_KEY
                        },
                        body: JSON.stringify(payload)
                    });
                } else {
                    // Send text-only message
                    waRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': EVOLUTION_API_KEY
                        },
                        body: JSON.stringify({
                            number: clientWhatsApp,
                            text: currentMessage,
                            delay: 1200,
                            linkPreview: true
                        })
                    });
                }

                const resText = await waRes.text();
                console.log(`[Broadcast Debug] Evolution API Status: ${waRes.status} | Response:`, resText);

                if (waRes.ok) {
                    results.push({
                        id: r.id,
                        nombre: r.nombre || r.nombre_negocio || 'Sin nombre',
                        whatsapp: r.whatsapp,
                        status: 'sent'
                    });
                } else {
                    results.push({
                        id: r.id,
                        nombre: r.nombre || r.nombre_negocio || 'Sin nombre',
                        whatsapp: r.whatsapp,
                        status: 'failed',
                        error: resText
                    });
                }
            } catch (err: any) {
                console.error(`[Broadcast Debug] Error al conectar con Evolution API:`, err);
                results.push({
                    id: r.id,
                    nombre: r.nombre || r.nombre_negocio || 'Sin nombre',
                    whatsapp: r.whatsapp,
                    status: 'failed',
                    error: err.message
                });
            }

            // Wait between messages with randomized delay (skip after last)
            if (i < recipients.length - 1) {
                const jitter = jitteredDelay();
                console.log(`[Broadcast] Esperando ${jitter}ms antes del siguiente envío...`);
                await delay(jitter);
            }
        }

        const sent = results.filter(r => r.status === 'sent').length;
        const failed = results.filter(r => r.status === 'failed').length;

        console.log(`[Broadcast] Completado: ${sent} enviados, ${failed} fallidos de ${recipients.length} total`);

        return NextResponse.json({
            success: true,
            total: recipients.length,
            sent,
            failed,
            results
        });

    } catch (err: any) {
        console.error('[Broadcast] Error crítico:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
