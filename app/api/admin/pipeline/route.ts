import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// GET: Listar restaurantes en el pipeline (con filtros de estado, aliado, 10 casos)
export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const { searchParams } = new URL(req.url);
        const estado = searchParams.get('estado');
        const aliadoId = searchParams.get('aliado_id');
        const solo10Casos = searchParams.get('diez_casos') === 'true';

        let query = `
            SELECT 
                p.id, p.aliado_id, p.canal_origen, p.nombre_restaurante,
                p.contacto_nombre, p.contacto_telefono, p.contacto_email,
                p.pais, p.ciudad, p.tipo_cocina, p.estado, p.es_candidato_10_casos,
                p.producto_interes, p.precio_pactado, p.vcard_registro_id,
                p.menu_slug, p.onboarding_uuid, p.notas, p.fecha_primer_contacto,
                p.fecha_cierre, p.fecha_instalacion, p.created_at, p.updated_at,
                a.nombre as aliado_nombre, a.codigo as aliado_codigo, a.tipo as aliado_tipo,
                ce.id as caso_exito_id, ce.numero_caso,
                ce.hito_pago_recibido, ce.hito_menu_implementado, ce.hito_contenido_publicado,
                ce.hito_testimonio_recolectado, ce.hito_autorizacion_firmada, ce.hito_caso_publicado
            FROM registraya_pipeline_restaurantes p
            LEFT JOIN registraya_aliados a ON p.aliado_id = a.id
            LEFT JOIN registraya_casos_exito ce ON ce.pipeline_id = p.id
            WHERE 1=1
        `;

        const params: any[] = [];

        if (estado) {
            query += ' AND p.estado = ?';
            params.push(estado);
        }
        if (aliadoId) {
            query += ' AND p.aliado_id = ?';
            params.push(aliadoId);
        }
        if (solo10Casos) {
            query += ' AND (p.es_candidato_10_casos = 1 OR ce.id IS NOT NULL)';
        }

        query += ' ORDER BY p.updated_at DESC';

        const [rows] = await pool.execute(query, params);
        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        console.error('Error fetching pipeline:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST: Registrar nuevo restaurante en el pipeline
export async function POST(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const body = await req.json();
        const {
            aliado_id,
            aliado_codigo,
            canal_origen = 'influencer',
            nombre_restaurante,
            contacto_nombre,
            contacto_telefono,
            contacto_email,
            pais = 'EC',
            ciudad,
            tipo_cocina,
            estado = 'prospecto',
            es_candidato_10_casos = false,
            producto_interes = 'menu_interactivo',
            precio_pactado = 500.00,
            notas,
        } = body;

        if (!nombre_restaurante || !contacto_telefono) {
            return NextResponse.json({ error: 'Nombre del restaurante y teléfono son obligatorios' }, { status: 400 });
        }

        let resolvedAliadoId = aliado_id || null;

        // Si se envió código de aliado en vez de ID, resolver ID
        if (!resolvedAliadoId && aliado_codigo) {
            const [aliados]: any = await pool.execute('SELECT id FROM registraya_aliados WHERE codigo = ? LIMIT 1', [aliado_codigo.trim().toUpperCase()]);
            if (aliados.length > 0) {
                resolvedAliadoId = aliados[0].id;
            }
        }

        const onboardingUuid = randomUUID();

        const [result]: any = await pool.execute(
            `INSERT INTO registraya_pipeline_restaurantes (
                aliado_id, canal_origen, nombre_restaurante, contacto_nombre,
                contacto_telefono, contacto_email, pais, ciudad, tipo_cocina,
                estado, es_candidato_10_casos, producto_interes, precio_pactado,
                onboarding_uuid, notas, fecha_primer_contacto
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                resolvedAliadoId,
                canal_origen,
                nombre_restaurante.trim(),
                contacto_nombre?.trim() || null,
                contacto_telefono.trim(),
                contacto_email?.trim() || null,
                pais,
                ciudad?.trim() || null,
                tipo_cocina?.trim() || null,
                estado,
                es_candidato_10_casos ? 1 : 0,
                producto_interes,
                Number(precio_pactado),
                onboardingUuid,
                notas?.trim() || null,
            ]
        );

        const pipelineId = result.insertId;

        // Si se marca como candidato para los 10 casos, registrar en la tabla de casos de éxito
        if (es_candidato_10_casos) {
            await pool.execute(
                `INSERT INTO registraya_casos_exito (pipeline_id, aliado_influencer_id, mercado)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE updated_at = NOW()`,
                [pipelineId, resolvedAliadoId, pais]
            );
        }

        return NextResponse.json({
            success: true,
            id: pipelineId,
            onboarding_uuid: onboardingUuid,
            onboarding_url: `https://activaqr.com/onboarding-menu/${onboardingUuid}`,
        });
    } catch (err: any) {
        console.error('Error creating pipeline record:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT: Actualizar estado y datos de un restaurante en el pipeline
export async function PUT(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const body = await req.json();
        const {
            id,
            estado,
            es_candidato_10_casos,
            precio_pactado,
            menu_slug,
            vcard_registro_id,
            notas,
            contacto_nombre,
            contacto_telefono,
            contacto_email,
            ciudad,
            tipo_cocina,
            aliado_id,
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }

        // Obtener estado actual antes de actualizar
        const [currentRows]: any = await pool.execute('SELECT * FROM registraya_pipeline_restaurantes WHERE id = ?', [id]);
        if (currentRows.length === 0) {
            return NextResponse.json({ error: 'Restaurante no encontrado en pipeline' }, { status: 404 });
        }
        const current = currentRows[0];

        // Lógica de fechas automáticas según transición de estado
        let fechaCierreSql = '';
        let fechaInstalacionSql = '';

        if (estado === 'pagado' || estado === 'vendido') {
            fechaCierreSql = ', fecha_cierre = COALESCE(fecha_cierre, NOW())';
        }
        if (estado === 'activo' || estado === 'en_implementacion') {
            fechaInstalacionSql = ', fecha_instalacion = COALESCE(fecha_instalacion, NOW())';
        }

        await pool.execute(
            `UPDATE registraya_pipeline_restaurantes SET
                estado = COALESCE(?, estado),
                es_candidato_10_casos = COALESCE(?, es_candidato_10_casos),
                precio_pactado = COALESCE(?, precio_pactado),
                menu_slug = COALESCE(?, menu_slug),
                vcard_registro_id = COALESCE(?, vcard_registro_id),
                notas = COALESCE(?, notas),
                contacto_nombre = COALESCE(?, contacto_nombre),
                contacto_telefono = COALESCE(?, contacto_telefono),
                contacto_email = COALESCE(?, contacto_email),
                ciudad = COALESCE(?, ciudad),
                tipo_cocina = COALESCE(?, tipo_cocina),
                aliado_id = COALESCE(?, aliado_id)
                ${fechaCierreSql}
                ${fechaInstalacionSql}
            WHERE id = ?`,
            [
                estado,
                es_candidato_10_casos !== undefined ? (es_candidato_10_casos ? 1 : 0) : null,
                precio_pactado !== undefined ? Number(precio_pactado) : null,
                menu_slug,
                vcard_registro_id,
                notas,
                contacto_nombre,
                contacto_telefono,
                contacto_email,
                ciudad,
                tipo_cocina,
                aliado_id,
                id,
            ]
        );

        // Si el estado pasó a 'pagado' o 'vendido' y tiene un aliado vinculado, calcular comisión automática si no existe
        const newAliadoId = aliado_id || current.aliado_id;
        if ((estado === 'pagado' || estado === 'vendido') && newAliadoId) {
            const [existingCommissions]: any = await pool.execute('SELECT id FROM registraya_comisiones WHERE pipeline_id = ?', [id]);
            if (existingCommissions.length === 0) {
                // Obtener esquema de comisión del aliado
                const [aliados]: any = await pool.execute('SELECT comision_tipo, comision_valor FROM registraya_aliados WHERE id = ?', [newAliadoId]);
                if (aliados.length > 0) {
                    const { comision_tipo, comision_valor } = aliados[0];
                    const venta = Number(precio_pactado || current.precio_pactado || 500);
                    let comisionMonto = 0;
                    let porcentaje = null;

                    if (comision_tipo === 'monto_fijo') {
                        comisionMonto = Number(comision_valor);
                    } else {
                        porcentaje = Number(comision_valor);
                        comisionMonto = (venta * porcentaje) / 100;
                    }

                    await pool.execute(
                        `INSERT INTO registraya_comisiones (
                            pipeline_id, aliado_id, precio_venta, monto_comision, porcentaje_aplicado, estado
                        ) VALUES (?, ?, ?, ?, ?, 'pendiente')`,
                        [id, newAliadoId, venta, comisionMonto, porcentaje]
                    );
                }
            }
        }

        // Si se marca como candidato de 10 casos o se actualiza estado a pagado
        if (es_candidato_10_casos || current.es_candidato_10_casos) {
            const isPaid = (estado === 'pagado' || estado === 'activo' || estado === 'caso_exito' || current.estado === 'pagado');
            await pool.execute(
                `INSERT INTO registraya_casos_exito (pipeline_id, aliado_influencer_id, hito_pago_recibido, mercado)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                    aliado_influencer_id = COALESCE(VALUES(aliado_influencer_id), aliado_influencer_id),
                    hito_pago_recibido = COALESCE(VALUES(hito_pago_recibido), hito_pago_recibido),
                    updated_at = NOW()`,
                [id, newAliadoId, isPaid ? 1 : 0, current.pais || 'EC']
            );
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error updating pipeline record:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
