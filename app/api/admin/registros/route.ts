import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { syncMenuDigitalToRelational } from '@/lib/menuSync';

export const dynamic = 'force-dynamic';

/**
 * GET: Lista todos los registros (requiere admin key o seller_id)
 * Params: page, limit, search, stats=true
 */
export async function GET(req: NextRequest) {
    const auth = requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('seller_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const getStats = searchParams.get('stats') === 'true';

    // Admin key required unless seller_id is provided (legacy compat)
    if (auth && !sellerId) {
        return auth;
    }

    try {
        let query = `
            SELECT 
                r.id, r.slug, r.nombre, r.nombre_negocio, r.empresa, r.email, r.whatsapp, 
                r.status, r.plan, r.created_at, r.foto_url, r.comprobante_url, r.commission_status, r.seller_id, 
                r.tipo_perfil, r.profesion, r.bio, r.direccion, r.web, r.instagram, r.linkedin, r.template_id,
                r.facebook, r.tiktok, r.productos_servicios, r.etiquetas, r.youtube, r.x, 
                r.menu_digital, r.nombres, r.apellidos, r.contacto_nombre, r.contacto_apellido, 
                r.portada_desktop, r.portada_movil, r.wifi_ssid, r.wifi_password, 
                r.hero_button_text, r.leader_paid_at, r.payment_method,
                r.google_business, r.reminder_count, r.last_reminder_at,
                r.activated_at, r.expires_at, r.activation_type,
                r.expires_reminder_30d_sent, r.expires_reminder_7d_sent, r.expires_reminder_0d_sent,
                r.hero_action, r.hero_file_url, r.hero_external_link, r.hero_wifi_steps,
                r.hero_section_title, r.hero_step1_title, r.hero_step1_text, r.hero_step2_title, r.hero_step2_text, r.hero_step3_title, r.hero_step3_text,
                r.google_rating, r.google_reviews_count, r.youtube_video_url, r.hero_slides_json,
                -- Explicitly omitting: catalogo_json, galeria_urls to save massive bandwidth
                s.nombre as sold_by_name, 
                s.codigo as sold_by_code,
                s.parent_id,
                p.nombre as parent_name,
                p.codigo as parent_code,
                (SELECT COUNT(*) FROM vcard_downloads_log WHERE slug = r.slug) as downloads_count
            FROM registraya_vcard_registros r
            LEFT JOIN registraya_vcard_sellers s ON r.seller_id = s.id
            LEFT JOIN registraya_vcard_sellers p ON s.parent_id = p.id
        `;
        const params: any[] = [];
        const conditions: string[] = [];

        if (sellerId) {
            // Find children IDs
            const [children]: any = await pool.execute('SELECT id FROM registraya_vcard_sellers WHERE parent_id = ?', [sellerId]);
            const childrenIds = (children as any[]).map(c => c.id);
            const allIds = [Number(sellerId), ...childrenIds];

            const placeholders = allIds.map(() => '?').join(', ');
            conditions.push(`r.seller_id IN (${placeholders})`);
            params.push(...allIds);
        }

        // Search filter - searches in ALL records when provided
        if (search) {
            conditions.push(`(LOWER(r.nombre) LIKE ? OR LOWER(r.email) LIKE ? OR LOWER(r.whatsapp) LIKE ?)`);
            const searchPattern = `%${search.toLowerCase()}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // If getting stats only, return count
        if (getStats) {
            const countQuery = `SELECT COUNT(*) as total FROM registraya_vcard_registros r LEFT JOIN registraya_vcard_sellers s ON r.seller_id = s.id LEFT JOIN registraya_vcard_sellers p ON s.parent_id = p.id ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`;
            const [countRows]: any = await pool.execute(countQuery, params);
            return NextResponse.json({ total: countRows[0]?.total || 0 });
        }

        query += ' ORDER BY r.created_at DESC';
        
        // Pagination: only apply LIMIT/OFFSET when not searching (search returns all matches)
        if (!search) {
            query += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
        }

        const [rows]: any = await pool.execute(query, params);
        return NextResponse.json({ data: rows, page, limit });
    } catch (err: any) {
        console.error('Error fetching registros:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * PATCH: Actualizar un registro (requiere admin key)
 */
export async function PATCH(req: NextRequest) {
    const adminKey = req.headers.get('x-admin-key');
    const sellerIdHeader = req.headers.get('x-seller-id');
    const isAdmin = adminKey === process.env.ADMIN_API_KEY;

    if (!isAdmin && !sellerIdHeader) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, ...updateFields } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }

        // Verify seller ownership if not admin
        if (!isAdmin && sellerIdHeader) {
            const [checkRows]: any = await pool.execute('SELECT seller_id FROM registraya_vcard_registros WHERE id = ?', [id]);
            if (!checkRows.length || String(checkRows[0].seller_id) !== String(sellerIdHeader)) {
                return NextResponse.json({ error: 'No autorizado para este registro' }, { status: 403 });
            }
        }

        const invalidKeys = ['vcf_base64', 'vcf_version'];
        const keys = Object.keys(updateFields).filter(k => !invalidKeys.includes(k));
        if (keys.length === 0) {
            return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
        }

        // Stringify any arrays or objects for MySQL compatibility
        // And handle empty strings for unique fields like email
        for (const key of keys) {
            if (updateFields[key] !== null && typeof updateFields[key] === 'object') {
                updateFields[key] = JSON.stringify(updateFields[key]);
            }
            if (key === 'email' && updateFields[key] === '') {
                updateFields[key] = null;
            }
        }

        // Construct dynamic UPDATE query
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const values = keys.map(key => updateFields[key]);
        const query = `UPDATE registraya_vcard_registros SET ${setClause} WHERE id = ?`;

        await pool.execute(query, [...values, id]);

        // If menu_digital was updated, sync to relational tables!
        if (keys.includes('menu_digital')) {
            try {
                await syncMenuDigitalToRelational(pool, id, updateFields['menu_digital']);
            } catch (syncErr) {
                console.error("Error syncing menu to relational tables in admin PATCH:", syncErr);
            }
        }

        // Fetch updated record
        const [rows] = await pool.execute('SELECT * FROM registraya_vcard_registros WHERE id = ?', [id]);
        return NextResponse.json({ data: rows });

    } catch (err: any) {
        console.error('Error updating registro:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * DELETE: Eliminar un registro permanentemente (requiere admin key)
 */
export async function DELETE(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }

        console.log('[ADMIN DELETE] Intentando eliminar registro ID:', id);

        // Verificar que el registro existe antes de borrar
        const [check]: any = await pool.execute(
            'SELECT id, nombre FROM registraya_vcard_registros WHERE id = ?',
            [id]
        );
        if (!check.length) {
            console.error('[ADMIN DELETE] Registro no encontrado:', id);
            return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
        }

        await pool.execute('DELETE FROM registraya_vcard_registros WHERE id = ?', [id]);

        console.log(`[ADMIN DELETE] Registro ${id} (${check[0].nombre}) eliminado permanentemente.`);
        return NextResponse.json({ message: `Registro '${check[0].nombre}' eliminado exitosamente` });

    } catch (err: any) {
        console.error('[ADMIN DELETE] Error crítico:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST: Crear un nuevo registro (requiere admin key)
 */
export async function POST(req: NextRequest) {
    const auth = requireAdmin(req);
    if (auth) return auth;

    try {
        const body = await req.json();
        const { nombre, email, whatsapp, plan, slug, status } = body;

        if (!nombre || !slug || !plan) {
            return NextResponse.json({ error: 'Nombre, slug y plan son requeridos' }, { status: 400 });
        }

        // Validate uniqueness of slug
        const [existing]: any = await pool.execute('SELECT id FROM registraya_vcard_registros WHERE slug = ?', [slug]);
        if (existing.length > 0) {
            return NextResponse.json({ error: 'El slug ya está en uso. Por favor cambia el nombre o el slug.' }, { status: 400 });
        }

        // Determine correct plan based on requested plan string if needed
        // Insert into DB
        const newId = uuidv4();
        const editCode = 'RYA-2026-ADM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const invalidKeys = ['id', 'vcf_base64', 'vcf_version'];
        const keys = Object.keys(body).filter(k => !invalidKeys.includes(k));
        if (keys.length === 0) {
            return NextResponse.json({ error: 'Nada que insertar' }, { status: 400 });
        }

        // Stringify any arrays or objects for MySQL compatibility
        // And handle empty strings for unique fields like email
        for (const key of keys) {
            if (body[key] !== null && typeof body[key] === 'object') {
                body[key] = JSON.stringify(body[key]);
            }
            if (key === 'email' && body[key] === '') {
                body[key] = null;
            }
        }

        const columns = ['id', 'edit_code', 'edit_uses_remaining', 'created_at', ...keys].join(', ');
        const placeholders = ['?', '?', '?', 'NOW()', ...keys.map(() => '?')].join(', ');
        
        const query = `INSERT INTO registraya_vcard_registros (${columns}) VALUES (${placeholders})`;
        const values = [newId, editCode, 2, ...keys.map(k => body[k])];

        await pool.execute(query, values);

        // If menu_digital is present, sync it to relational tables!
        if (body.menu_digital) {
            try {
                await syncMenuDigitalToRelational(pool, newId, body.menu_digital);
            } catch (syncErr) {
                console.error("Error syncing menu to relational tables in admin POST:", syncErr);
            }
        }

        return NextResponse.json({
            message: 'Registro creado exitosamente',
            data: { id: newId, slug }
        });

    } catch (err: any) {
        console.error('[ADMIN POST] Error creando registro:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
