import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const WA_NUMBER = '593963425323';

// ═══ CIERRE AUTOMÁTICO DE VOTACIÓN ═══
// La votación cierra a la medianoche del 14 de septiembre de 2025 (hora Ecuador)
const CIERRE_VOTACION = new Date('2025-09-14T00:00:00-05:00');

// ═══ PROTECCIÓN ANTIFRAUDE: MÁXIMO DE VOTOS POR IP EN VENTANA DE TIEMPO ═══
const MAX_VOTOS_POR_IP_POR_HORA = 15; // Si una IP vota más de 15 veces en 1 hora → sospechoso

function getIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function POST(req: NextRequest) {
    try {
        // ═══ VERIFICAR SI LA VOTACIÓN SIGUE ABIERTA ═══
        if (new Date() >= CIERRE_VOTACION) {
            return NextResponse.json({
                error: 'La votación de la 197ª Feria de Loja ha finalizado. ¡Gracias por participar!',
                votacion_cerrada: true
            }, { status: 403 });
        }

        const body = await req.json();
        const { expositor_id, slug, device_fingerprint } = body;

        if (!expositor_id && !slug) {
            return NextResponse.json({ error: 'Expositor no especificado' }, { status: 400 });
        }

        // Buscar expositor
        let expositor: any = null;
        if (expositor_id) {
            const [rows]: any = await pool.query('SELECT id, slug, nombre_negocio, is_active FROM feria_negocios WHERE id = ?', [expositor_id]);
            if (rows.length > 0) expositor = rows[0];
        } else if (slug) {
            const [rows]: any = await pool.query('SELECT id, slug, nombre_negocio, is_active FROM feria_negocios WHERE slug = ?', [slug]);
            if (rows.length > 0) expositor = rows[0];
        }

        if (!expositor || !expositor.is_active) {
            return NextResponse.json({ error: 'Expositor no encontrado o inactivo' }, { status: 404 });
        }

        const ip = getIp(req);
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 32);
        const deviceHash = device_fingerprint ? String(device_fingerprint).substring(0, 64) : ipHash;

        // ═══ ANTIFRAUDE: Detectar ráfagas sospechosas desde la misma IP ═══
        const [rateCheck]: any = await pool.query(
            `SELECT COUNT(*) as votos_recientes FROM feria_votos
             WHERE ip_hash = ? AND created_at >= NOW() - INTERVAL 1 HOUR`,
            [ipHash]
        );
        if (rateCheck[0]?.votos_recientes >= MAX_VOTOS_POR_IP_POR_HORA) {
            console.warn(`[ANTIFRAUDE] IP ${ipHash} superó ${MAX_VOTOS_POR_IP_POR_HORA} votos/hora`);
            return NextResponse.json({
                error: 'Has alcanzado el límite de votos por hora. Intenta más tarde.',
                rate_limited: true
            }, { status: 429 });
        }

        // Verificar si ya votó por ESTE expositor desde este dispositivo en las últimas 24 horas
        const [existing]: any = await pool.query(
            `SELECT id, verificado FROM feria_votos 
             WHERE negocio_id = ? AND (device_hash = ? OR ip_hash = ?) 
             AND created_at >= NOW() - INTERVAL 1 DAY
             LIMIT 1`,
            [expositor.id, deviceHash, ipHash]
        );

        let tokenWa = crypto.randomBytes(4).toString('hex').toUpperCase(); // Ej: 4A8F9C2B
        let alreadyVoted = false;
        let isVerified = false;

        if (existing.length > 0) {
            alreadyVoted = true;
            isVerified = existing[0].verificado === 1;
        } else {
            // Registrar nuevo voto simple
            await pool.query(
                `INSERT INTO feria_votos (negocio_id, telefono_votante, device_hash, ip_hash, token_wa, verificado, mensaje_recibido)
                 VALUES (?, 'web_anonimo', ?, ?, ?, 0, 'Voto Web 1-Clic')`,
                [expositor.id, deviceHash, ipHash, tokenWa]
            );

            // Incrementar contador de votos simples
            await pool.query(
                `UPDATE feria_negocios SET total_votos = total_votos + 1 WHERE id = ?`,
                [expositor.id]
            );
        }

        // Generar URL de WhatsApp para verificación x3
        const waMsg = `Verificar Voto Feria #${tokenWa} por: ${expositor.nombre_negocio}`;
        const waVerifyUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;

        return NextResponse.json({
            success: true,
            already_voted: alreadyVoted,
            is_verified: isVerified,
            expositor: {
                id: expositor.id,
                slug: expositor.slug,
                nombre_negocio: expositor.nombre_negocio,
            },
            token_wa: tokenWa,
            whatsapp_verify_url: waVerifyUrl,
            message: alreadyVoted
                ? `Ya habías votado por ${expositor.nombre_negocio}. ¡Puedes verificar tu voto en WhatsApp!`
                : `🎉 ¡Tu voto por ${expositor.nombre_negocio} ha sido registrado!`
        });

    } catch (error: any) {
        console.error('Error registrando voto web:', error);
        return NextResponse.json({ error: error.message || 'Error al procesar el voto' }, { status: 500 });
    }
}
