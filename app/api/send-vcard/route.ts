import { NextRequest, NextResponse } from 'next/server';
import { sendMail, EMAIL_FROM } from '@/lib/mailer';
import { isRateLimited, getClientIP } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        // Rate limiting: máximo 10 emails por minuto
        const clientIP = getClientIP(req);
        if (isRateLimited(`send-vcard:${clientIP}`, 10, 60000)) {
            return NextResponse.json(
                { error: 'Demasiadas solicitudes. Intenta en un momento.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { email, name, nombre, vcardUrl, qrUrl, backupData, edit_code, plan, slug } = body;

        const recipientEmail = email;
        const recipientName = name || nombre;

        if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
            return NextResponse.json(
                { error: 'Email del destinatario es requerido y debe ser válido' },
                { status: 400 }
            );
        }

        if (!recipientName || typeof recipientName !== 'string') {
            return NextResponse.json(
                { error: 'Nombre del destinatario es requerido' },
                { status: 400 }
            );
        }

        const attachments = [];
        if (qrUrl) {
            attachments.push({ filename: 'qr-code.png', path: qrUrl });
        }
        if (backupData) {
            attachments.push({
                filename: `backup_${recipientName.replace(/\s+/g, '_')}_${Date.now()}.json`,
                content: JSON.stringify(backupData, null, 2),
                contentType: 'application/json'
            });
        }

        // Nombre del producto según el plan (actualizado a $35 para digital)
        let productName = '$35 Contacto Digital';
        if (plan === 'business') productName = '$60 Contacto Business';
        if (plan === 'catalogo') productName = '$120 Contacto Business + Catálogo';

        // Sección Condicional según el Plan
        let extraLinkSection = '';
        if (plan === 'business' && slug) {
            extraLinkSection = `
                <div style="background-color: #F0FDF4; border: 2px solid #22C55E; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
                    <h3 style="color: #14532D; margin: 0 0 12px 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">🚀 Tu Tarjeta Web está Lista</h3>
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #166534; line-height: 1.5;">
                        Accede a tu enlace personalizado, optimizado con una vista previa visual y profesional para compartir en WhatsApp y redes sociales con gran impacto.
                    </p>
                    <a href="https://activaqr.com/card/${slug}" style="background-color: #22C55E; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 800; display: inline-block; font-size: 14px; text-transform: uppercase;">Ver Tarjeta Web →</a>
                </div>
            `;
        } else if (plan === 'catalogo' && slug) {
            extraLinkSection = `
                <div style="background-color: #FDF4FF; border: 2px solid #D946EF; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
                    <h3 style="color: #5D172D; margin: 0 0 12px 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">🛍️ Tu Catálogo Web está Activo</h3>
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #86198F; line-height: 1.5;">
                        Accede a tu enlace de tienda virtual interactiva, optimizada con una presentación elegante para compartir todos tus productos y servicios en WhatsApp y redes fácilmente.
                    </p>
                    <a href="https://activaqr.com/catalog/${slug}" style="background-color: #D946EF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 800; display: inline-block; font-size: 14px; text-transform: uppercase;">Ver Catálogo Web →</a>
                </div>
            `;
        }

        // Sección del código de edición con link directo al modal de la Home (#editar)
        let editCodeSection = '';
        if (edit_code) {
            if (plan === 'business' || plan === 'catalogo') {
                const isCatalog = plan === 'catalogo';
                editCodeSection = `
                    <div style="background-color: #F8FAFC; border: 2px solid #3B82F6; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
                        <h3 style="color: #1E3A8A; margin: 0 0 12px 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">✏️ Ediciones Ilimitadas</h3>
                        <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; line-height: 1.5;">
                            Tu plan incluye acceso <strong>ilimitado y sin costo extra</strong> a tu editor. Podrás actualizar tus <strong>Banners Promocionales</strong> (las imágenes del inicio), agregar nuevos productos o cambiar tus números cuando lo necesites.
                            Para editar, abre tu enlace interactivo y presiona el <strong>ícono de la rueda (engranaje)</strong> en la esquina superior izquierda. 
                            Luego ingresa tu código secreto:
                        </p>
                        <div style="background-color: #EEF2FF; border: 1px dashed #6366F1; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6366F1; font-weight: bold; text-transform: uppercase;">Tu Código de Edición:</p>
                            <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: 900; color: #1E3A8A; letter-spacing: 4px;">${edit_code}</span>
                        </div>
                        <a href="https://activaqr.com/${isCatalog ? 'catalog' : 'card'}/${slug}" style="background-color: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 800; display: inline-block; margin-bottom: 16px; font-size: 14px; text-transform: uppercase;">Abrir Tarjeta para Editar →</a>
                    </div>
                `;
            } else {
                editCodeSection = `
                    <div style="background-color: #F8FAFC; border: 2px solid #3B82F6; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
                        <h3 style="color: #1E3A8A; margin: 0 0 12px 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">✏️ Ediciones Ilimitadas</h3>
                        <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; line-height: 1.5;">
                            Tu plan incluye <strong>ediciones ilimitadas</strong>. ¿Cambiaste de celular o nombre? Actualiza todo tu perfil en cualquier momento, sin costo extra.
                            Para editar, ingresa a la página principal de ActivaQR con tu código secreto:
                        </p>
                        <div style="background-color: #EEF2FF; border: 1px dashed #6366F1; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6366F1; font-weight: bold; text-transform: uppercase;">Tu Código de Edición:</p>
                            <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: 900; color: #1E3A8A; letter-spacing: 4px;">${edit_code}</span>
                        </div>
                        <a href="https://activaqr.com/#editar" style="background-color: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 800; display: inline-block; margin-bottom: 16px; font-size: 14px; text-transform: uppercase;">Ir al Editor Principal →</a>
                    </div>
                `;
            }
        }

        const info = await sendMail({
            to: recipientEmail,
            subject: 'ActivaQR: Tu Contacto Digital está listo',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    <div style="padding: 20px 0; text-align: center;">
                        <h1 style="color: #FF6B00; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">¡Hola ${recipientName}!</h1>
                        <p style="font-size: 16px; color: #64748b; margin-top: 8px;">Tu <strong>${productName}</strong> profesional ha sido aprobado y generado exitosamente.</p>
                    </div>

                    <div style="background: #f8fafc; border-radius: 20px; padding: 30px; border: 1px solid #e2e8f0; text-align: center; margin-bottom: 24px;">
                        <p style="margin-bottom: 24px;">Adjunto a este correo encontrarás tu <strong>Código QR</strong> oficial para compartir de inmediato.</p>
                        
                        <a href="${vcardUrl}" style="background-color: #FF6B00; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(255,107,0,0.25); margin-bottom: 24px;">Descargar Contacto (.vcf)</a>

                        <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px;">
                            <p style="font-size: 14px; font-weight: bold; color: #050b1c; margin-bottom: 12px; text-transform: uppercase;">💬 Comparte tu QR de WhatsApp</p>
                            <p style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
                                Al escanear este código, tus clientes abrirán un chat de WhatsApp y recibirán tu información (.vcf) de forma automática.
                            </p>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`https://wa.me/593963425323?text=${encodeURIComponent(`Contacto:${slug}`)}`)}" style="width: 180px; height: 180px; border: 1px solid #e2e8f0; padding: 8px; border-radius: 12px; background: white;" alt="QR de WhatsApp" />
                        </div>
                    </div>
                    
                    ${extraLinkSection}
                    ${editCodeSection}

                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px;">
                        <p style="margin-bottom: 4px;"><strong>ActivaQR - Tecnologías de Contacto Profesional</strong></p>
                        <p style="margin-bottom: 12px;">Servicio proporcionado por César Reyes Jaramillo | Ecuador</p>
                        <p>Recibes este correo porque adquiriste un servicio en activaqr.com.</p>
                    </div>
                </div>
            `,
            attachments
        });

        return NextResponse.json({ success: true, messageId: info.messageId });


    } catch (error: any) {
        console.error('[send-vcard] Error al enviar correo:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
