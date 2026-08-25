import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Listar todas las comisiones con datos del aliado y restaurante
export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const { searchParams } = new URL(req.url);
        const aliadoId = searchParams.get('aliado_id');
        const estado = searchParams.get('estado');

        let query = `
            SELECT 
                c.id, c.pipeline_id, c.aliado_id, c.producto,
                c.precio_venta, c.descuento_aplicado, c.monto_comision,
                c.porcentaje_aplicado, c.estado, c.fecha_pago,
                c.metodo_pago, c.comprobante_url, c.notas, c.created_at,
                a.nombre as aliado_nombre, a.codigo as aliado_codigo, a.tipo as aliado_tipo,
                a.whatsapp as aliado_whatsapp, a.email as aliado_email,
                p.nombre_restaurante, p.pais, p.ciudad, p.estado as pipeline_estado
            FROM registraya_comisiones c
            INNER JOIN registraya_aliados a ON c.aliado_id = a.id
            LEFT JOIN registraya_pipeline_restaurantes p ON c.pipeline_id = p.id
            WHERE 1=1
        `;

        const params: any[] = [];
        if (aliadoId) {
            query += ' AND c.aliado_id = ?';
            params.push(aliadoId);
        }
        if (estado) {
            query += ' AND c.estado = ?';
            params.push(estado);
        }

        query += ' ORDER BY c.created_at DESC';

        const [rows] = await pool.execute(query, params);
        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        console.error('Error fetching comisiones:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT: Actualizar estado de comisión (Aprobar, Pagar, Anular)
export async function PUT(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const body = await req.json();
        const {
            id,
            estado,
            metodo_pago,
            comprobante_url,
            notas,
            monto_comision,
        } = body;

        if (!id || !estado) {
            return NextResponse.json({ error: 'ID y estado son requeridos' }, { status: 400 });
        }

        let fechaPagoSql = '';
        if (estado === 'pagada') {
            fechaPagoSql = ', fecha_pago = COALESCE(fecha_pago, NOW())';
        }

        await pool.execute(
            `UPDATE registraya_comisiones SET
                estado = ?,
                metodo_pago = COALESCE(?, metodo_pago),
                comprobante_url = COALESCE(?, comprobante_url),
                notas = COALESCE(?, notas),
                monto_comision = COALESCE(?, monto_comision)
                ${fechaPagoSql}
            WHERE id = ?`,
            [
                estado,
                metodo_pago,
                comprobante_url,
                notas,
                monto_comision !== undefined ? Number(monto_comision) : null,
                id,
            ]
        );

        // Si se pagó la comisión y está vinculada a un restaurante en pipeline, actualizar estado en pipeline
        if (estado === 'pagada') {
            const [rows]: any = await pool.execute('SELECT pipeline_id FROM registraya_comisiones WHERE id = ?', [id]);
            if (rows.length > 0 && rows[0].pipeline_id) {
                await pool.execute(
                    `UPDATE registraya_pipeline_restaurantes 
                     SET estado = 'comision_pagada' 
                     WHERE id = ? AND estado IN ('activo', 'caso_exito', 'pagado')`,
                    [rows[0].pipeline_id]
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error updating comision:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
