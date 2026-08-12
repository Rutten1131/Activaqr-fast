import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from '@/lib/db';
import { notifyCrmPaymentSucceeded } from '@/lib/crm-webhook';

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-crossmint-signature");

        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 401 });
        }

        const secret = process.env.CROSSMINT_WEBHOOK_SECRET;
        if (!secret) {
            console.error("[Crossmint Webhook] CROSSMINT_WEBHOOK_SECRET not set");
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("[Crossmint Webhook] Firma inválida");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        const event = JSON.parse(rawBody);
        console.log("[Crossmint Webhook] Evento recibido:", event.type);

        if (event.type === "orders.payment.succeeded") {
            const paymentId = event.data?.id;
            const email = event.data?.recipient?.email;

            if (email) {
                console.log(`[Crossmint Webhook] Pago exitoso para ${email}, ID: ${paymentId}`);

                try {
                    const connection = await pool.getConnection();
                    try {
                        const [result] = await connection.execute(
                            'UPDATE registraya_vcard_registros SET status = ? WHERE email = ?',
                            ['pagado', email]
                        );

                        const [rows] = await connection.execute(
                            'SELECT nombre, whatsapp FROM registraya_vcard_registros WHERE email = ?',
                            [email]
                        );
                        const users = rows as any[];

                        if (users.length > 0) {
                            console.log(`[Crossmint Webhook] Usuario ${email} marcado como pagado.`);

                            // Notificar al CRM de Finanzas
                            await notifyCrmPaymentSucceeded(email, 'crypto_crossmint', paymentId);

                            try {
                                const wpNotifyUrl = new URL('/api/notify-whatsapp', req.url).toString();
                                await fetch(wpNotifyUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        name: users[0].nombre,
                                        email: email,
                                        whatsapp: users[0].whatsapp,
                                        plan: 'PAGO CRYPTO CONFIRMADO (Crossmint)'
                                    })
                                });
                            } catch (notifyErr) {
                                console.error('[Crossmint Webhook] Error al notificar WhatsApp:', notifyErr);
                            }
                        } else {
                            console.warn(`[Crossmint Webhook] Usuario no encontrado: ${email}`);
                        }
                    } finally {
                        connection.release();
                    }
                } catch (dbErr) {
                    console.error("[Crossmint Webhook] Error en MySQL:", dbErr);
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error("[Crossmint Webhook] Error crítico:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
