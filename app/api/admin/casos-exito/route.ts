import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Listar los casos de éxito (con cálculo de días activos y alertas de 30 días)
export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const query = `
            SELECT 
                ce.id, ce.pipeline_id, ce.aliado_influencer_id, ce.numero_caso, ce.mercado,
                ce.hito_candidato_seleccionado, ce.hito_pago_recibido, ce.hito_menu_implementado,
                ce.hito_influencer_asignado, ce.hito_contenido_publicado, ce.hito_testimonio_recolectado,
                ce.hito_autorizacion_firmada, ce.hito_caso_publicado, ce.enlaces_contenido,
                ce.testimonio_texto, ce.testimonio_video_url, ce.metricas_alcanzadas, ce.fecha_activacion,
                ce.created_at, ce.updated_at,
                p.nombre_restaurante, p.contacto_nombre, p.contacto_telefono, p.contacto_email,
                p.ciudad, p.tipo_cocina, p.precio_pactado, p.menu_slug, p.fecha_instalacion,
                p.estado as pipeline_estado,
                a.nombre as influencer_nombre, a.codigo as influencer_codigo, a.whatsapp as influencer_whatsapp,
                DATEDIFF(NOW(), COALESCE(ce.fecha_activacion, p.fecha_instalacion, ce.created_at)) as dias_activo,
                CASE 
                    WHEN DATEDIFF(NOW(), COALESCE(ce.fecha_activacion, p.fecha_instalacion, ce.created_at)) >= 30 
                         AND ce.hito_testimonio_recolectado = 0 
                    THEN 1 
                    ELSE 0 
                END as alerta_testimonio_pendiente
            FROM registraya_casos_exito ce
            INNER JOIN registraya_pipeline_restaurantes p ON ce.pipeline_id = p.id
            LEFT JOIN registraya_aliados a ON ce.aliado_influencer_id = a.id
            ORDER BY ce.numero_caso ASC, ce.created_at ASC
        `;

        const [rows] = await pool.execute(query);
        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        console.error('Error fetching casos de exito:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT: Actualizar hitos de un caso de éxito
export async function PUT(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const body = await req.json();
        const {
            id,
            numero_caso,
            mercado,
            aliado_influencer_id,
            hito_candidato_seleccionado,
            hito_pago_recibido,
            hito_menu_implementado,
            hito_influencer_asignado,
            hito_contenido_publicado,
            hito_testimonio_recolectado,
            hito_autorizacion_firmada,
            hito_caso_publicado,
            enlaces_contenido,
            testimonio_texto,
            testimonio_video_url,
            metricas_alcanzadas,
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }

        const enlacesJson = typeof enlaces_contenido === 'object' ? JSON.stringify(enlaces_contenido) : enlaces_contenido || null;
        const metricasJson = typeof metricas_alcanzadas === 'object' ? JSON.stringify(metricas_alcanzadas) : metricas_alcanzadas || null;

        await pool.execute(
            `UPDATE registraya_casos_exito SET
                numero_caso = COALESCE(?, numero_caso),
                mercado = COALESCE(?, mercado),
                aliado_influencer_id = COALESCE(?, aliado_influencer_id),
                hito_candidato_seleccionado = COALESCE(?, hito_candidato_seleccionado),
                hito_pago_recibido = COALESCE(?, hito_pago_recibido),
                hito_menu_implementado = COALESCE(?, hito_menu_implementado),
                hito_influencer_asignado = COALESCE(?, hito_influencer_asignado),
                hito_contenido_publicado = COALESCE(?, hito_contenido_publicado),
                hito_testimonio_recolectado = COALESCE(?, hito_testimonio_recolectado),
                hito_autorizacion_firmada = COALESCE(?, hito_autorizacion_firmada),
                hito_caso_publicado = COALESCE(?, hito_caso_publicado),
                enlaces_contenido = ?,
                testimonio_texto = ?,
                testimonio_video_url = ?,
                metricas_alcanzadas = ?,
                fecha_activacion = CASE WHEN ? = 1 AND fecha_activacion IS NULL THEN NOW() ELSE fecha_activacion END
            WHERE id = ?`,
            [
                numero_caso !== undefined ? Number(numero_caso) : null,
                mercado,
                aliado_influencer_id,
                hito_candidato_seleccionado !== undefined ? (hito_candidato_seleccionado ? 1 : 0) : null,
                hito_pago_recibido !== undefined ? (hito_pago_recibido ? 1 : 0) : null,
                hito_menu_implementado !== undefined ? (hito_menu_implementado ? 1 : 0) : null,
                hito_influencer_asignado !== undefined ? (hito_influencer_asignado ? 1 : 0) : null,
                hito_contenido_publicado !== undefined ? (hito_contenido_publicado ? 1 : 0) : null,
                hito_testimonio_recolectado !== undefined ? (hito_testimonio_recolectado ? 1 : 0) : null,
                hito_autorizacion_firmada !== undefined ? (hito_autorizacion_firmada ? 1 : 0) : null,
                hito_caso_publicado !== undefined ? (hito_caso_publicado ? 1 : 0) : null,
                enlacesJson,
                testimonio_texto,
                testimonio_video_url,
                metricasJson,
                hito_menu_implementado !== undefined ? (hito_menu_implementado ? 1 : 0) : null,
                id,
            ]
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error updating caso de exito:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
