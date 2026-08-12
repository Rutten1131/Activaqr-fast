import pool from '@/lib/db';

interface CrmWebhookPayload {
    event: string;
    timestamp: string;
    data: Record<string, any>;
}

/**
 * Dispara un evento webhook al CRM externo de finanzas.
 * Si CRM_EXTERNAL_WEBHOOK_URL no está configurada, simplemente loguea y no falla.
 */
export async function notifyCrmWebhook(payload: CrmWebhookPayload): Promise<void> {
    const webhookUrl = process.env.CRM_EXTERNAL_WEBHOOK_URL;
    if (!webhookUrl) {
        console.log('[CRM Webhook] CRM_EXTERNAL_WEBHOOK_URL no configurada, omitiendo notificación.');
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source': 'ActivaQR',
                'X-Event-Type': payload.event,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
            console.error(`[CRM Webhook] Error enviando evento ${payload.event}: ${response.status} ${response.statusText}`);
        } else {
            console.log(`[CRM Webhook] Evento ${payload.event} enviado exitosamente.`);
        }
    } catch (err) {
        // No lanzamos error para no interrumpir el flujo de pago
        console.error('[CRM Webhook] Error de red al notificar CRM:', err);
    }
}

/**
 * Construye y envía el evento payment.succeeded al CRM externo.
 * Se llama desde los webhooks de PayPal, Crossmint, etc. después de confirmar el pago.
 */
export async function notifyCrmPaymentSucceeded(email: string, paymentMethod: string, referenceId?: string): Promise<void> {
    try {
        // Obtener datos completos del cliente recién pagado
        const [rows]: any = await pool.execute(`
            SELECT 
                r.id, r.slug, r.nombre, r.nombre_negocio, r.email, r.whatsapp,
                r.tipo_perfil, r.profesion, r.plan, r.status,
                r.created_at, r.paid_at, r.activated_at, r.expires_at,
                r.seller_id, r.commission_status,
                s.nombre as vendedor_nombre,
                s.codigo as vendedor_codigo,
                s.comision_porcentaje,
                s.parent_id,
                p.nombre as lider_nombre,
                p.codigo as lider_codigo,
                p.comision_porcentaje as lider_comision_porcentaje
            FROM registraya_vcard_registros r
            LEFT JOIN registraya_vcard_sellers s ON r.seller_id = s.id
            LEFT JOIN registraya_vcard_sellers p ON s.parent_id = p.id
            WHERE r.email = ?
            ORDER BY r.created_at DESC
            LIMIT 1
        `, [email]);

        if (!rows.length) {
            console.warn(`[CRM Webhook] No se encontró registro para email ${email}`);
            return;
        }

        const client = rows[0];

        await notifyCrmWebhook({
            event: 'payment.succeeded',
            timestamp: new Date().toISOString(),
            data: {
                project_code: 'ACTIVAQR',
                transaction_reference: referenceId || `AQR-${Date.now()}`,
                client: {
                    id: client.id,
                    slug: client.slug,
                    nombre: client.nombre,
                    nombre_negocio: client.nombre_negocio,
                    email: client.email,
                    whatsapp: client.whatsapp,
                    tipo_perfil: client.tipo_perfil,
                    profesion: client.profesion,
                },
                order: {
                    plan: client.plan,
                    status: client.status,
                    metodo_pago: paymentMethod,
                    referencia_externa: referenceId || null,
                    paid_at: client.paid_at,
                    created_at: client.created_at,
                    activated_at: client.activated_at,
                    expires_at: client.expires_at,
                },
                attribution: client.seller_id ? {
                    seller_id: client.seller_id,
                    seller_codigo: client.vendedor_codigo,
                    seller_nombre: client.vendedor_nombre,
                    comision_porcentaje: client.comision_porcentaje,
                    parent_seller_id: client.parent_id || null,
                    lider_codigo: client.lider_codigo || null,
                    lider_nombre: client.lider_nombre || null,
                    lider_comision_porcentaje: client.lider_comision_porcentaje || null,
                } : null,
            }
        });
    } catch (err) {
        console.error('[CRM Webhook] Error construyendo payload de pago:', err);
    }
}

/**
 * Notifica al CRM externo sobre un nuevo registro (aún sin pagar).
 */
export async function notifyCrmNewRegistration(clientId: string, slug: string, email: string, nombre: string, plan: string, sellerCodigo?: string): Promise<void> {
    await notifyCrmWebhook({
        event: 'vcard.registered',
        timestamp: new Date().toISOString(),
        data: {
            project_code: 'ACTIVAQR',
            client_id: clientId,
            slug,
            nombre,
            email,
            plan_solicitado: plan,
            status: 'pendiente',
            seller_codigo: sellerCodigo || null,
        }
    });
}
