import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { notifyCrmPaymentSucceeded } from '@/lib/crm-webhook';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const eventType = body.event_type;
        const resource = body.resource;

        console.log(`[PayPal Webhook] Evento recibido: ${eventType}`);

        // PAYMENT.CAPTURE.COMPLETED es el evento que confirma que el dinero ha sido procesado
        if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'PAYMENT.SALE.COMPLETED') {
            // Buscamos el email en custom_id (que enviamos desde el frontend)
            // O en el objeto de la orden si es un evento de checkout
            const email = resource.custom_id || resource.amount?.details?.subtotal;
            // Nota: En RegisterWizard.tsx pusimos custom_id: formData.email

            if (email && email.includes('@')) {
                console.log(`[PayPal Webhook] Confirmando pago para el usuario: ${email}`);

                try {
                    await pool.execute(
                        'UPDATE registraya_vcard_registros SET status = ?, paid_at = NOW() WHERE email = ?',
                        ['pagado', email]
                    );

                    // Fetch updated user info
                    const [rows] = await pool.execute(
                        'SELECT nombre, whatsapp FROM registraya_vcard_registros WHERE email = ?',
                        [email]
                    );
                    const users = rows as any[];

                    if (users.length > 0) {
                        console.log(`[PayPal Webhook] ¡Éxito! Usuario ${email} marcado como pagado.`);

                        // Notificar al CRM de Finanzas
                        await notifyCrmPaymentSucceeded(email, 'paypal', resource.id);

                        try {
                            const wpNotifyUrl = new URL('/api/notify-whatsapp', req.url).toString();
                            await fetch(wpNotifyUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: users[0].nombre,
                                    email: email,
                                    whatsapp: users[0].whatsapp,
                                    plan: 'PAGO CONFIRMADO (PayPal)'
                                })
                            });
                        } catch (notifyErr) {
                            console.error('[PayPal Webhook] Error al notificar WhatsApp:', notifyErr);
                        }
                    } else {
                        console.warn(`[PayPal Webhook] No se encontró ningún registro pendiente para el email: ${email}`);
                    }
                } catch (dbErr: any) {
                    console.error('[PayPal Webhook] Error actualizando MySQL:', dbErr);
                    return NextResponse.json({ error: dbErr.message }, { status: 500 });
                }
            } else {
                console.warn('[PayPal Webhook] Evento recibido sin custom_id (email) válido.');
            }
        }

        // Siempre responder 200 a PayPal para evitar reintentos innecesarios
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[PayPal Webhook] Error procesando el webhook:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
