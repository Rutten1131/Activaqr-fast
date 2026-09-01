import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { requireAdmin, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    const { searchParams } = new URL(req.url);
    const getNextCode = searchParams.get('nextCode') === 'true';

    try {
        if (getNextCode) {
            const [lastSeller]: any = await pool.execute('SELECT id FROM registraya_vcard_sellers ORDER BY id DESC LIMIT 1');
            const nextId = lastSeller.length > 0 ? lastSeller[0].id + 1 : 1;
            const nextCode = nextId.toString().padStart(3, '0');
            return NextResponse.json({ nextCode });
        }

        // Fetch sellers with their sales count using efficient aggregated joins
        const query = `
                SELECT 
                    s.id, s.nombre, s.code as codigo, s.email, s.comision_porcentaje, s.activo, s.created_at, s.terminos_aceptados_en,
                    s.banco_nombre, s.banco_beneficiario, s.banco_numero_cuenta, s.banco_cedula, s.banco_correo, s.datos_bancarios_completados,
                    COALESCE(direct_sales.total, 0) as total_ventas,
                    COALESCE(direct_sales.pagadas, 0) as ventas_pagadas,
                    COALESCE(team.count, 0) as team_count
                FROM registraya_vcard_sellers s
                LEFT JOIN (
                    SELECT seller_id, COUNT(*) as total, SUM(CASE WHEN status IN ('pagado', 'entregado') THEN 1 ELSE 0 END) as pagadas
                    FROM registraya_vcard_registros
                    WHERE seller_id IS NOT NULL
                    GROUP BY seller_id
                ) direct_sales ON s.id = direct_sales.seller_id
                LEFT JOIN (
                    SELECT parent_id, COUNT(*) as count
                    FROM registraya_vcard_sellers
                    WHERE parent_id IS NOT NULL
                    GROUP BY parent_id
                ) team ON s.id = team.parent_id
                ORDER BY s.nombre ASC
            `;
        const [rows] = await pool.execute(query);
        return NextResponse.json({ data: rows });
    } catch (err: any) {
        console.error('Error fetching sellers:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const { nombre, email, password, comision_porcentaje } = await req.json();

        if (!nombre || !email || !password) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // Generar un código único (basado en el último ID o secuencial)
        const [lastSeller]: any = await pool.execute('SELECT id FROM registraya_vcard_sellers ORDER BY id DESC LIMIT 1');
        const nextId = lastSeller.length > 0 ? lastSeller[0].id + 1 : 1;
        const codigo = nextId.toString().padStart(3, '0');

        // Hashear contraseña antes de guardar
        const hashedPassword = await hashPassword(password);

        const query = `
            INSERT INTO registraya_vcard_sellers (nombre, email, password, role, comision_porcentaje, code, activo)
            VALUES (?, ?, ?, 'seller', ?, ?, 1)
        `;

        const [result]: any = await pool.execute(query, [
            nombre,
            email,
            hashedPassword,
            comision_porcentaje || 30,
            codigo
        ]);

        // ENVIAR CORREO DE BIENVENIDA
        // IMPORTANTE: usar await — Vercel termina el proceso al retornar la respuesta,
        // por lo que fire-and-forget (.catch()) nunca completa en serverless.
        const origin = req.headers.get('origin') || 'https://activaqr.com';
        const dashboardUrl = `${origin}/admin/vendedor`;
        const referralUrl = `${origin}/registro?ref=${codigo}`;

        try {
            await sendMail({
                to: email,
                subject: 'Bienvenido al Equipo de Ventas ActivaQR',
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                        <div style="padding: 20px 0; text-align: center;">
                            <h2 style="color: #FF6B00; margin: 0; font-size: 24px; font-weight: 800;">¡Hola, ${nombre}!</h2>
                            <p style="font-size: 16px; color: #64748b; margin-top: 8px;">Estamos muy emocionados de tenerte con nosotros. Aquí tienes tus credenciales para acceder a tu panel de control:</p>
                        </div>
                        
                        <div style="background: #f8fafc; border-radius: 20px; padding: 25px; border: 1px solid #e2e8f0; margin: 20px 0;">
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 5px 0; font-size: 14px;"><strong>Usuario:</strong> ${email}</p>
                                <p style="margin: 5px 0; font-size: 14px;"><strong>Contraseña:</strong> ${password}</p>
                                <p style="margin: 5px 0; font-size: 14px;"><strong>Tu Código:</strong> <span style="font-size: 1.1em; color: #FF6B00; font-weight: bold;">${codigo}</span></p>
                            </div>

                            <p style="font-weight: bold; font-size: 14px; margin-bottom: 10px;">Tu enlace de ventas personalizado:</p>
                            <div style="background: #FFF7ED; border: 1px solid #FF6B00; padding: 12px; border-radius: 8px; word-break: break-all; margin-bottom: 20px;">
                                <a href="${referralUrl}" style="color: #FF6B00; font-weight: bold; text-decoration: none; font-size: 13px;">${referralUrl}</a>
                            </div>
                            <p style="font-size: 11px; color: #64748b; font-style: italic;">Cualquier cliente que use este link se te asignará automáticamente.</p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${dashboardUrl}" style="background: #FF6B00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Acceder a Mi Panel</a>
                        </div>

                        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px;">
                            <p style="margin-bottom: 4px;"><strong>ActivaQR - Soporte a Vendedores</strong></p>
                            <p style="margin-bottom: 12px;">César Reyes Jaramillo | Gestión de Afiliados</p>
                            <p>Este es un mensaje automático de ActivaQR. Por favor, no respondas a este correo.</p>
                        </div>
                    </div>
                `
            });
            console.log(`[sellers/POST] ✅ Correo de bienvenida enviado a ${email}`);
        } catch (emailErr: any) {
            // No fallamos la creación del vendedor si el correo falla
            console.error('[sellers/POST] ❌ Error al enviar correo de bienvenida:', emailErr.message);
        }

        return NextResponse.json({
            success: true,
            data: {
                id: result.insertId,
                nombre,
                codigo,
                email
            }
        });
    } catch (err: any) {
        console.error('Error creating seller:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const adminKey = req.headers.get('x-admin-key');
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
        const auth = requireAdmin(req);
        if (auth) return auth;
    }
    let connection;
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const targetLeaderIdRaw = searchParams.get('targetLeaderId');

        if (!id) {
            return NextResponse.json({ error: 'ID de Vendedor es requerido' }, { status: 400 });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (targetLeaderIdRaw !== null) {
            // El usuario solicitó MIGRAR TODO y luedo ELIMINAR
            const targetParentId = (targetLeaderIdRaw === '0' || !targetLeaderIdRaw) ? null : Number(targetLeaderIdRaw);

            // 1. Heredar Sub-Vendedores
            await connection.execute('UPDATE registraya_vcard_sellers SET parent_id = ? WHERE parent_id = ?', [targetParentId, id]);

            // Si el Admin (0) rescata, el target para los datos no puede ser NULL (porque field_visits exige un INT).
            // Requerimos que indique a UN líder específico (ej. el propio Admin si está registrado como seller, u otro socio).
            if (targetParentId === null) {
                // Para simplificar, si el Admin no selecciona a otro vendedor, no podemos migrar visitas (porque exigen seller_id NOT NULL).
                // Pero un Admin sí debe seleccionar a alquien. Bloqueamos esta acción si no hay target.
                throw new Error("Para migrar clientes y visitas, debes seleccionar un Socio o Vendedor específico (no puedes dejarlo vacío).");
            }

            // Nota de auditoría
            const [origin]: any = await connection.execute('SELECT nombre FROM registraya_vcard_sellers WHERE id = ?', [id]);
            const sellerName = origin.length > 0 ? origin[0].nombre : 'Desconocido';
            const note = `\n\n[Sistema]: Registro rescatado permanentemente del vendedor eliminado: ${sellerName} en fecha ${new Date().toLocaleDateString('es-ES')}`;

            // 2. Heredar Clientes/Ventas (Reasignar seller_id y añadir nota al historial)
            await connection.execute(`
                UPDATE registraya_vcard_registros 
                SET seller_id = ?, bio = CONCAT(IFNULL(bio, ''), ?)
                WHERE seller_id = ?
            `, [targetParentId, note, id]);

            // 3. Heredar Visitas
            await connection.execute('UPDATE registraya_vcard_field_visits SET seller_id = ? WHERE seller_id = ?', [targetParentId, id]);

            // 4. Heredar Seguimientos
            await connection.execute('UPDATE registraya_vcard_follow_ups SET seller_id = ? WHERE seller_id = ?', [targetParentId, id]);

        } else {
            // Hard Delete Flow Directo de Administrador (Sin rescate)
            // Verificar si tiene sub-vendedores
            const [subs]: any = await connection.execute('SELECT id FROM registraya_vcard_sellers WHERE parent_id = ?', [id]);
            if (subs.length > 0) {
                await connection.rollback();
                return NextResponse.json({ error: 'No se puede eliminar un líder con sub-vendedores activos. Usa la opción de rescate.' }, { status: 400 });
            }
            await connection.execute('DELETE FROM registraya_vcard_field_visits WHERE seller_id = ?', [id]);
            await connection.execute('DELETE FROM registraya_vcard_follow_ups WHERE seller_id = ?', [id]);
            await connection.execute('DELETE FROM registraya_vcard_registros WHERE seller_id = ?', [id]);
        }

        // Finalmente, Eliminar al vendedor
        const [result]: any = await connection.execute('DELETE FROM registraya_vcard_sellers WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
        }

        await connection.commit();
        return NextResponse.json({ success: true, message: 'Vendedor eliminado y portafolio gestionado correctamente.' });
    } catch (err: any) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error deleting seller transaction:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
