import { createConnection } from 'mysql2/promise';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Si estás usando ES modules o tsx
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const host = process.env.SMTP_HOST?.trim().replace(/^["']|["']$/g, '');
const port = process.env.SMTP_PORT?.trim().replace(/^["']|["']$/g, '');
const user = process.env.SMTP_USER?.trim().replace(/^["']|["']$/g, '');
const pass = process.env.SMTP_PASS?.trim().replace(/^["']|["']$/g, '');
const isSecure = (process.env.SMTP_SECURE?.trim().replace(/^["']|["']$/g, '') === 'true');

const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: isSecure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
});

const EMAIL_FROM = process.env.EMAIL_FROM || '"ActivaQR" <registro@activaqr.com>';

async function main() {
    const isTest = process.argv.includes('--test');
    const testEmailIndex = process.argv.indexOf('--test') + 1;
    const testEmail = isTest && testEmailIndex < process.argv.length ? process.argv[testEmailIndex] : null;

    const connection = await createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: Number(process.env.MYSQL_PORT || 3306)
    });

    try {
        let rows: any[] = [];
        
        // Modes:
        // --test email@xxx.com           → synthetic data, sends to that email
        // --test email@xxx.com --slug mi-slug  → REAL data from DB, sends to that email
        const slugIndex = process.argv.indexOf('--slug');
        const testSlug = slugIndex !== -1 && slugIndex + 1 < process.argv.length ? process.argv[slugIndex + 1] : null;

        if (isTest && testSlug) {
            console.log(`[MODO PRUEBA REAL] Buscando registro con slug: ${testSlug}`);
            const [result]: any = await connection.execute(
                `SELECT email, nombre, nombre_negocio, slug 
                 FROM registraya_vcard_registros 
                 WHERE slug = ? LIMIT 1`,
                [testSlug]
            );
            if (!result.length) {
                console.error(`❌ No se encontró ningún registro con slug="${testSlug}"`);
                process.exit(1);
            }
            // Override email to send to the test address instead of the client's real email
            rows = [{ ...result[0], email: testEmail }];
            console.log(`✅ Registro encontrado: ${result[0].nombre || result[0].nombre_negocio} → enviando a ${testEmail}`);
        } else if (isTest && testEmail) {
            console.log(`[MODO PRUEBA SINTÉTICO] Enviando datos de ejemplo al correo: ${testEmail}`);
            rows = [{
                email: testEmail,
                nombre: 'César',
                slug: 'cesar-reyes-jaramillo-eu0t'  // slug real de tu contacto
            }];
        } else {
            // Optional filters via CLI flags:
            //   --plan digital        → only plan=digital
            //   --plan pro,business   → multiple plans
            //   --limit 5             → first 5 only
            //   --dry-run             → preview list WITHOUT sending
            const planIndex = process.argv.indexOf('--plan');
            const planFilter = planIndex !== -1 ? process.argv[planIndex + 1]?.split(',') : null;
            const limitIndex = process.argv.indexOf('--limit');
            const limitFilter = limitIndex !== -1 ? Number(process.argv[limitIndex + 1]) : null;
            const isDryRun = process.argv.includes('--dry-run');

            let query = `SELECT email, nombre, nombre_negocio, slug, plan, status
                         FROM registraya_vcard_registros
                         WHERE status IN ('pagado', 'entregado') AND email IS NOT NULL AND email != ''`;
            const params: any[] = [];

            if (planFilter && planFilter.length > 0) {
                const pp = planFilter.map(() => '?').join(', ');
                query += ` AND plan IN (${pp})`;
                params.push(...planFilter);
                console.log(`[FILTRO] Solo planes: ${planFilter.join(', ')}`);
            }

            query += ` ORDER BY paid_at DESC`;

            if (limitFilter) {
                query += ` LIMIT ?`;
                params.push(limitFilter);
                console.log(`[FILTRO] Límite: ${limitFilter} destinatarios`);
            }

            const [result]: any = await connection.execute(query, params);
            rows = result;

            if (isDryRun) {
                console.log('\n🔍 [DRY-RUN] Lista de destinatarios SIN enviar:\n');
                rows.forEach((r: any, i: number) => {
                    const nm = r.nombre || r.nombre_negocio || 'Sin nombre';
                    console.log(`  ${i + 1}. ${nm} | ${r.email} | plan: ${r.plan} | slug: ${r.slug}`);
                });
                console.log(`\nTotal: ${rows.length} destinatarios.\n`);
                await connection.end();
                process.exit(0);
            }

            console.log(`[MODO EN VIVO] Enviando a ${rows.length} clientes...`);
        }

        console.log(`Encontrados ${rows.length} destinatarios.`);

        for (const r of rows) {
            const nombre = r.nombre || r.nombre_negocio || 'Cliente';
            const slug = r.slug || 'default';
            
            // Generar el enlace dinámico para el código QR (que lleva al bot de WA con el comando)
            const waLink = `https://wa.me/593963425323?text=${encodeURIComponent(`Contacto:${slug}`)}`;
            // Generar la imagen del código QR mediante API
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(waLink)}`;
            const qrUrlHighRes = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(waLink)}`;

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #0A1229; font-size: 24px;">¡Actualización Importante de tu ActivaQR! 🚀</h2>
                    </div>
                    <p>Hola <strong>${nombre}</strong>,</p>
                    <p>Les tenemos una actualización sobre ActivaQR <strong>sin costo adicional</strong> para ustedes.</p>
                    <p>A partir de ahora, pueden imprimir un nuevo código QR y ponerlo en su negocio. Cuando un cliente lo escanea, abrirá WhatsApp automáticamente y les enviará un mensaje. En ese instante, nuestro sistema les entregará su contacto digital tal como se lo construimos.</p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <p style="font-size: 16px; margin-bottom: 15px;"><strong>Únete a nuestro canal oficial y mira el video explicativo de cómo funciona:</strong></p>
                        <a href="https://whatsapp.com/channel/0029VbCxZGO3QxS7Lu1a7v39" target="_blank" style="display: inline-block; background: #25D366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">📢 Unirse al Canal de ActivaQR</a>
                        <p style="font-size: 12px; color: #888; margin-top: 10px;">En el canal encontrarás el video y todas las novedades de tu servicio.</p>
                    </div>

                    <div style="background: #f8f9fa; padding: 30px 20px; border-radius: 12px; margin: 30px 0; border: 1px solid #eaeaea; text-align: center;">
                        <h3 style="margin-top: 0; color: #0A1229;">Tu Nuevo QR Inteligente</h3>
                        <p style="color: #666; margin-bottom: 20px;">Aquí tienes el QR actualizado generado exclusivamente para tu negocio:</p>
                        
                        <div style="margin: 20px 0;">
                            <img src="${qrUrl}" alt="QR Dinámico" width="200" height="200" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);" />
                        </div>
                        
                        <p style="font-size: 15px; margin-top: 25px;">
                            <a href="${qrUrlHighRes}" target="_blank" style="color: #0A1229; font-weight: bold; text-decoration: none; border-bottom: 2px solid #0A1229; padding-bottom: 2px;">Descargar QR en Alta Calidad (Para Imprimir)</a>
                        </p>
                    </div>

                    <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 25px 0; font-size: 14px;">
                        <p style="margin: 0;"><strong>IMPORTANTE:</strong> ¿Qué pasa si ya tienen impreso el anterior? No te preocupes, el QR anterior sigue funcionando perfectamente. Sin embargo, este nuevo QR (que usa WhatsApp) es mucho más eficiente para generar conversiones en tu negocio.</p>
                    </div>
                    
                    <p>Si desean seguir utilizando el proceso anterior o si ya tienen materiales impresos, no hay ningún problema. Esta es una mejora totalmente opcional pensada en maximizar sus resultados.</p>

                    <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                        Saludos cordiales,<br>
                        <strong>El Equipo de ActivaQR</strong>
                    </p>
                </div>
            `;

            console.log(`Enviando a ${r.email}...`);
            await transporter.sendMail({
                from: EMAIL_FROM,
                to: r.email,
                subject: '¡Mejora Gratis en tu ActivaQR! 🚀 Nuevo sistema por WhatsApp',
                html: html
            });

            // Pequeña pausa para no saturar el servidor SMTP
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('✅ ¡Campaña finalizada exitosamente!');
    } catch (e) {
        console.error('Error ejecutando la campaña:', e);
    } finally {
        await connection.end();
    }
}

main();
