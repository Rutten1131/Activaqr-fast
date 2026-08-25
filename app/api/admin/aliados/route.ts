import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Listar todos los aliados con conteos de prospectos, ventas y comisiones
export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const query = `
            SELECT 
                a.id, a.nombre, a.email, a.whatsapp, a.redes_sociales, a.tipo,
                a.codigo, a.slug_link, a.mercado_principal, a.comision_tipo,
                a.comision_valor, a.estado, a.notas, a.created_at,
                (SELECT COUNT(*) FROM registraya_pipeline_restaurantes p WHERE p.aliado_id = a.id) as total_referidos,
                (SELECT COUNT(*) FROM registraya_pipeline_restaurantes p WHERE p.aliado_id = a.id AND p.estado IN ('vendido', 'pagado', 'en_implementacion', 'activo', 'caso_exito', 'comision_pagada')) as total_vendidos,
                (SELECT COUNT(*) FROM registraya_pipeline_restaurantes p WHERE p.aliado_id = a.id AND p.estado = 'caso_exito') as total_casos_exito,
                (SELECT COALESCE(SUM(c.monto_comision), 0) FROM registraya_comisiones c WHERE c.aliado_id = a.id AND c.estado IN ('pendiente', 'aprobada')) as comision_pendiente,
                (SELECT COALESCE(SUM(c.monto_comision), 0) FROM registraya_comisiones c WHERE c.aliado_id = a.id AND c.estado = 'pagada') as comision_pagada
            FROM registraya_aliados a
            ORDER BY a.created_at DESC
        `;

        const [rows] = await pool.execute(query);
        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        console.error('Error fetching aliados:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST: Crear nuevo aliado
export async function POST(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const body = await req.json();
        const {
            nombre,
            email,
            whatsapp,
            redes_sociales,
            tipo = 'influencer',
            codigo,
            slug_link,
            mercado_principal = 'EC',
            comision_tipo = 'porcentaje',
            comision_valor = 20,
            notas,
        } = body;

        if (!nombre || !whatsapp || !codigo) {
            return NextResponse.json({ error: 'Nombre, WhatsApp y Código son obligatorios' }, { status: 400 });
        }

        const cleanCodigo = codigo.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

        // Validar unicidad de código
        const [existing]: any = await pool.execute('SELECT id FROM registraya_aliados WHERE codigo = ?', [cleanCodigo]);
        if (existing.length > 0) {
            return NextResponse.json({ error: `El código "${cleanCodigo}" ya está en uso por otro aliado` }, { status: 400 });
        }

        const redesJson = typeof redes_sociales === 'object' ? JSON.stringify(redes_sociales) : redes_sociales || null;

        const [result]: any = await pool.execute(
            `INSERT INTO registraya_aliados (
                nombre, email, whatsapp, redes_sociales, tipo, codigo,
                slug_link, mercado_principal, comision_tipo, comision_valor, notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre.trim(),
                email?.trim() || null,
                whatsapp.trim(),
                redesJson,
                tipo,
                cleanCodigo,
                slug_link?.trim() || cleanCodigo.toLowerCase(),
                mercado_principal,
                comision_tipo,
                Number(comision_valor),
                notas?.trim() || null,
            ]
        );

        return NextResponse.json({
            success: true,
            id: result.insertId,
            codigo: cleanCodigo,
            link: `https://activaqr.com/menu?ref=${cleanCodigo}`,
        });
    } catch (err: any) {
        console.error('Error creating aliado:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT: Actualizar aliado existente
export async function PUT(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const body = await req.json();
        const {
            id,
            nombre,
            email,
            whatsapp,
            redes_sociales,
            tipo,
            codigo,
            slug_link,
            mercado_principal,
            comision_tipo,
            comision_valor,
            estado,
            notas,
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }

        const cleanCodigo = codigo ? codigo.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : null;

        if (cleanCodigo) {
            const [existing]: any = await pool.execute('SELECT id FROM registraya_aliados WHERE codigo = ? AND id != ?', [cleanCodigo, id]);
            if (existing.length > 0) {
                return NextResponse.json({ error: `El código "${cleanCodigo}" ya está en uso por otro aliado` }, { status: 400 });
            }
        }

        const redesJson = typeof redes_sociales === 'object' ? JSON.stringify(redes_sociales) : redes_sociales || null;

        await pool.execute(
            `UPDATE registraya_aliados SET
                nombre = COALESCE(?, nombre),
                email = ?,
                whatsapp = COALESCE(?, whatsapp),
                redes_sociales = ?,
                tipo = COALESCE(?, tipo),
                codigo = COALESCE(?, codigo),
                slug_link = ?,
                mercado_principal = COALESCE(?, mercado_principal),
                comision_tipo = COALESCE(?, comision_tipo),
                comision_valor = COALESCE(?, comision_valor),
                estado = COALESCE(?, estado),
                notas = ?
            WHERE id = ?`,
            [
                nombre?.trim(),
                email?.trim() || null,
                whatsapp?.trim(),
                redesJson,
                tipo,
                cleanCodigo,
                slug_link?.trim() || null,
                mercado_principal,
                comision_tipo,
                comision_valor !== undefined ? Number(comision_valor) : null,
                estado,
                notas?.trim() || null,
                id,
            ]
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error updating aliado:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
