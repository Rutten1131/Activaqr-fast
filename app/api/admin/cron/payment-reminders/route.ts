import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ⚠️ MODO MANUAL: Esta ruta SOLO se activa desde el panel admin.
// Los recordatorios automáticos están DESACTIVADOS.

const CESAR_ID = 11;

function getEvolutionConfig() {
    return {
        apiUrl: process.env.EVOLUTION_API_URL || 'http://178.238.238.158:8080',
        apiKey: process.env.EVOLUTION_API_KEY || '42a447c1-3d74-4b52-9571-042c174f7621',
        instance: process.env.EVOLUTION_INSTANCE || 'barber_593963410409'
    };
}

function generateVCard(user: any) {
    const escapeVCardValue = (text: string) => {
        if (!text) return '';
        return text
            .replace(/\\/g, '\\\\')
            .replace(/,/g, '\\,')
            .replace(/;/g, '\\;')
            .replace(/\r?\n/g, '\\n');
    };

    const bio = user.bio || '';
    const whatsapp = user.whatsapp || '';
    const nombre = user.nombre || 'Usuario';

    let noteContent = bio;
    if (user.productos_servicios) {
        noteContent += `\n\nProductos/Servicios:\n${user.productos_servicios}`;
    }
    noteContent += "\n\n- Realizado por www.activaqr.com";

    const cleanWhatsApp = whatsapp.replace(/\D/g, '');
    const whatsappWithPlus = whatsapp.trim().startsWith('+') ? `+${cleanWhatsApp}` : cleanWhatsApp;

    let fullName = '';
    let structuredName = '';
    let organization = '';

    if (user.tipo_perfil === 'negocio') {
        organization = user.nombre_negocio || nombre;
        if (user.contacto_nombre || user.contacto_apellido) {
            structuredName = `${escapeVCardValue(user.contacto_apellido || '')};${escapeVCardValue(user.contacto_nombre || '')};;;`;
            const contactFullName = `${user.contacto_nombre || ''} ${user.contacto_apellido || ''}`.trim();
            fullName = `${organization} - ${contactFullName}`;
        } else {
            structuredName = ';;;;';
            fullName = organization;
        }
    } else {
        const firstName = user.nombres || nombre.split(' ')[0] || '';
        const lastName = user.apellidos || nombre.split(' ').slice(1).join(' ') || '';
        fullName = `${firstName} ${lastName}`.trim() || nombre;
        structuredName = `${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`;
        organization = user.empresa || "";
    }

    const vcardLines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCardValue(fullName)}`,
        `N:${structuredName}`,
        user.profesion ? `TITLE:${escapeVCardValue(user.profesion)}` : '',
        `TEL;TYPE=CELL,VOICE:${whatsappWithPlus}`,
        `X-ABLabel:Móvil`,
        `EMAIL;TYPE=WORK,INTERNET:${escapeVCardValue(user.email)}`,
        user.direccion ? `ADR;TYPE=WORK:;;${escapeVCardValue(user.direccion)};;;;` : '',
        user.web ? `URL:${escapeVCardValue(user.web)}` : '',
        `NOTE:${escapeVCardValue(noteContent)}`,
        'END:VCARD'
    ];

    return vcardLines.filter(Boolean).join('\r\n');
}

export async function GET(req: NextRequest) {
    // Solo admin autenticado puede disparar esto manualmente
    const authError = requireAdmin(req);
    if (authError) return authError;

    const { apiUrl: EVOLUTION_API_URL, apiKey: EVOLUTION_API_KEY, instance: EVOLUTION_INSTANCE } = getEvolutionConfig();

    try {
        console.log('[Cron-Payment] Iniciando bot de recordatorios de pago...');

        // 1. Buscar registros PENDIENTES de César (16) o Directos (NULL)
        // Reglas de secuencia:
        // - Nivel 1: > 3 días, count 0
        // - Nivel 2: > 7 días, count 1
        // - Nivel 3: > 15 días, count 2
        
        const query = `
            SELECT *
            FROM registraya_vcard_registros
            WHERE status = 'pendiente'
            AND (seller_id = ? OR seller_id IS NULL)
            AND (
                (reminder_count = 0 AND created_at <= DATE_SUB(NOW(), INTERVAL 3 DAY)) OR
                (reminder_count = 1 AND created_at <= DATE_SUB(NOW(), INTERVAL 7 DAY)) OR
                (reminder_count = 2 AND created_at <= DATE_SUB(NOW(), INTERVAL 15 DAY))
            )
            AND (last_reminder_at IS NULL OR last_reminder_at <= DATE_SUB(NOW(), INTERVAL 2 DAY))
            LIMIT 50
        `;

        const [rows]: any = await pool.execute(query, [CESAR_ID]);
        const registros = rows as any[];

        console.log(`[Cron-Payment] Encontrados ${registros.length} registros para notificar.`);

        const planNames: Record<string, string> = {
            'pro': 'Contacto Digital',
            'business': 'Contacto Business',
            'catalogo': 'C. Business + Catálogo'
        };

        const results = [];

        for (const r of registros) {
            try {
                const nextCount = r.reminder_count + 1;
                let message = "";
                const clientName = r.nombre || r.nombre_negocio || "Cliente";
                const pName = planNames[r.plan] || "Contacto Digital";

                if (nextCount === 1) {
                    message = `Hola ${clientName} \uD83D\uDC4B\u2728, soy Alejandra de ActivaQR. \u00A1Tu ${pName} ya est\u00E1 activo y funcionando! \uD83D\uDE80 Solo queda pendiente el pago. \uD83D\uDE09 \u00BFTe gustar\u00EDa que te env\u00EDe los datos?`;
                } else if (nextCount === 2) {
                    message = `Hola ${clientName} \uD83D\uDC4B, soy Alejandra. Tu ${pName} sigue al aire \uD83D\uDE80 pero a\u00FAn no hemos recibido el reporte del pago. \uD83D\uDE05 \u00BFPodemos ayudarte con algo o te paso la cuenta de nuevo? \u2728`;
                } else {
                    message = `${clientName} \uD83D\uDC4B\u26A0\uFE0F, soy Alejandra de ActivaQR. Tu ${pName} est\u00E1 activo, pero se desactivar\u00E1 muy pronto por falta de pago. \uD83D\uDED1 \u00BFTe mando los datos ahora mismo para mantenerlo funcionando? \u26A1`;
                }

                const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

                // Format WhatsApp number to international 593 format (Ecuador)
                let clientWhatsApp = r.whatsapp.replace(/\D/g, '');
                if (clientWhatsApp.length === 10 && clientWhatsApp.startsWith('0')) {
                    clientWhatsApp = '593' + clientWhatsApp.substring(1);
                } else if (clientWhatsApp.length === 9 && !clientWhatsApp.startsWith('593')) {
                    clientWhatsApp = '593' + clientWhatsApp;
                }

                const waRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY || '' },
                    body: JSON.stringify({ number: clientWhatsApp, text: message })
                });

                if (waRes.ok) {
                    // Update record
                    await pool.execute(
                        'UPDATE registraya_vcard_registros SET reminder_count = ?, last_reminder_at = NOW() WHERE id = ?',
                        [nextCount, r.id]
                    );

                    // Notify César (593963410409) about the reminder sent
                    try {
                        const cesarMsg = `📌 *Notificación:* Se ha enviado el recordatorio de pago #${nextCount} a *${clientName}* (${r.whatsapp}). Atento por si responde con dudas o el comprobante.`;
                        await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY || '' },
                            body: JSON.stringify({ number: "593963410409", text: cesarMsg })
                        });
                    } catch (e) {
                        console.error("Error notifying Cesar:", e);
                    }

                    results.push({ id: r.id, name: clientName, level: nextCount, status: 'sent' });
                } else {
                    const err = await waRes.text();
                    results.push({ id: r.id, name: clientName, status: 'failed', error: err });
                }

            } catch (err: any) {
                results.push({ id: r.id, status: 'error', error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            reminders_sent: results.filter(r => r.status === 'sent').length,
            details: results
        });

    } catch (err: any) {
        console.error('[Cron-Payment] Error crítico:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
