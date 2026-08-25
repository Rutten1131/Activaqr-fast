import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Consultar datos del onboarding por UUID
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const uuid = searchParams.get('uuid');

        if (!uuid) {
            return NextResponse.json({ error: 'UUID es requerido' }, { status: 400 });
        }

        // Buscar primero en tabla de onboarding
        const [onboardings]: any = await pool.execute(
            `SELECT 
                o.*, p.pais, p.ciudad, p.tipo_cocina, p.contacto_nombre, p.contacto_telefono, p.nombre_restaurante as pipeline_nombre
             FROM registraya_menu_onboarding o
             LEFT JOIN registraya_pipeline_restaurantes p ON o.pipeline_id = p.id
             WHERE o.uuid = ?`,
            [uuid]
        );

        if (onboardings.length > 0) {
            return NextResponse.json({ success: true, data: onboardings[0] });
        }

        // Si no existe en registraya_menu_onboarding, verificar si existe en registraya_pipeline_restaurantes
        const [pipelines]: any = await pool.execute(
            'SELECT id, nombre_restaurante, contacto_nombre, contacto_telefono, contacto_email, pais, ciudad FROM registraya_pipeline_restaurantes WHERE onboarding_uuid = ?',
            [uuid]
        );

        if (pipelines.length === 0) {
            return NextResponse.json({ error: 'Enlace de onboarding no encontrado' }, { status: 404 });
        }

        const pipe = pipelines[0];

        // Crear registro inicial en registraya_menu_onboarding
        await pool.execute(
            `INSERT INTO registraya_menu_onboarding (uuid, pipeline_id, nombre_restaurante, telefono_contacto)
             VALUES (?, ?, ?, ?)`,
            [uuid, pipe.id, pipe.nombre_restaurante, pipe.contacto_telefono]
        );

        const [created]: any = await pool.execute('SELECT * FROM registraya_menu_onboarding WHERE uuid = ?', [uuid]);
        return NextResponse.json({ success: true, data: created[0] });
    } catch (err: any) {
        console.error('Error fetching onboarding:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST / PUT: Guardar información del restaurante (marca, fotos, audios de platos)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            uuid,
            nombre_restaurante,
            telefono_contacto,
            direccion_fisica,
            redes_sociales,
            logo_url,
            carta_fotos = [],
            platos_fotos = [],
            audios_descripcion = [],
            observaciones,
            estado = 'enviado',
        } = body;

        if (!uuid) {
            return NextResponse.json({ error: 'UUID es requerido' }, { status: 400 });
        }

        const redesJson = typeof redes_sociales === 'object' ? JSON.stringify(redes_sociales) : redes_sociales || null;
        const cartaJson = JSON.stringify(carta_fotos || []);
        const platosJson = JSON.stringify(platos_fotos || []);
        const audiosJson = JSON.stringify(audios_descripcion || []);

        await pool.execute(
            `INSERT INTO registraya_menu_onboarding (
                uuid, nombre_restaurante, telefono_contacto, direccion_fisica,
                redes_sociales, logo_url, carta_fotos, platos_fotos,
                audios_descripcion, observaciones, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                nombre_restaurante = COALESCE(VALUES(nombre_restaurante), nombre_restaurante),
                telefono_contacto = COALESCE(VALUES(telefono_contacto), telefono_contacto),
                direccion_fisica = VALUES(direccion_fisica),
                redes_sociales = VALUES(redes_sociales),
                logo_url = VALUES(logo_url),
                carta_fotos = VALUES(carta_fotos),
                platos_fotos = VALUES(platos_fotos),
                audios_descripcion = VALUES(audios_descripcion),
                observaciones = VALUES(observaciones),
                estado = VALUES(estado),
                updated_at = NOW()`,
            [
                uuid,
                nombre_restaurante || 'Mi Restaurante',
                telefono_contacto || '',
                direccion_fisica || null,
                redesJson,
                logo_url || null,
                cartaJson,
                platosJson,
                audiosJson,
                observaciones || null,
                estado,
            ]
        );

        // Si el estado es 'enviado', actualizar el pipeline a 'en_implementacion' si estaba en 'vendido' o 'pagado'
        if (estado === 'enviado') {
            const [onbRows]: any = await pool.execute('SELECT pipeline_id FROM registraya_menu_onboarding WHERE uuid = ?', [uuid]);
            if (onbRows.length > 0 && onbRows[0].pipeline_id) {
                await pool.execute(
                    `UPDATE registraya_pipeline_restaurantes 
                     SET estado = 'en_implementacion' 
                     WHERE id = ? AND estado IN ('prospecto', 'contactado', 'interesado', 'propuesta_enviada', 'vendido', 'pagado')`,
                    [onbRows[0].pipeline_id]
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Información y materiales recibidos correctamente.',
        });
    } catch (err: any) {
        console.error('Error saving onboarding data:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
