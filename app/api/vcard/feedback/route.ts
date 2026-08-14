import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper para asegurar que la tabla vcard_feedbacks exista
async function ensureFeedbacksTable() {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS vcard_feedbacks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                registro_id INT NOT NULL,
                rating INT NOT NULL,
                comment TEXT NULL,
                customer_name VARCHAR(255) NULL,
                customer_contact VARCHAR(255) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_registro_id (registro_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    } catch (e) {
        console.error('Error al asegurar tabla vcard_feedbacks:', e);
    }
}

// POST: Registrar nueva opinión interna (1-4 estrellas)
export async function POST(req: NextRequest) {
    try {
        await ensureFeedbacksTable();
        const body = await req.json();
        const { registro_id, rating, comment, customer_name, customer_contact } = body;

        if (!registro_id || !rating) {
            return NextResponse.json({ error: 'registro_id y rating son requeridos' }, { status: 400 });
        }

        const numRating = parseInt(String(rating), 10);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            return NextResponse.json({ error: 'Rating inválido' }, { status: 400 });
        }

        await pool.execute(
            `INSERT INTO vcard_feedbacks (registro_id, rating, comment, customer_name, customer_contact)
             VALUES (?, ?, ?, ?, ?)`,
            [
                registro_id,
                numRating,
                comment || '',
                customer_name || null,
                customer_contact || null
            ]
        );

        return NextResponse.json({ success: true, message: 'Opinión guardada correctamente' });
    } catch (error) {
        console.error('Error al guardar feedback:', error);
        return NextResponse.json({ error: 'Error al procesar opinión' }, { status: 500 });
    }
}

// GET: Descargar opiniones en formato CSV o consultar total para el cliente
export async function GET(req: NextRequest) {
    try {
        await ensureFeedbacksTable();
        const { searchParams } = new URL(req.url);
        const registro_id = searchParams.get('registro_id');
        const code = searchParams.get('code');
        const format = searchParams.get('format') || 'csv';

        if (!registro_id) {
            return NextResponse.json({ error: 'registro_id es requerido' }, { status: 400 });
        }

        // Validar código de edición si se solicita la descarga o lista completa
        if (code) {
            const [rows]: any = await pool.execute(
                'SELECT id, nombre_negocio, nombre FROM registraya_vcard_registros WHERE id = ? AND UPPER(edit_code) = UPPER(?)',
                [registro_id, code]
            );
            if (!rows || rows.length === 0) {
                return NextResponse.json({ error: 'Código de edición no válido' }, { status: 403 });
            }
        }

        const [feedbacks]: any = await pool.execute(
            `SELECT id, rating, comment, customer_name, customer_contact, created_at
             FROM vcard_feedbacks
             WHERE registro_id = ?
             ORDER BY created_at DESC`,
            [registro_id]
        );

        if (format === 'json') {
            return NextResponse.json({ total: feedbacks.length, feedbacks });
        }

        // Generar CSV binario garantizado con BOM UTF-8 (0xEF, 0xBB, 0xBF)
        const csvHeader = 'sep=;\r\nNro;Fecha y Hora;Calificacion;Comentario u Observacion;Nombre del Cliente;Contacto (Telefono / Email)\r\n';
        const csvRows = feedbacks.map((f: any, idx: number) => {
            const dateStr = f.created_at ? new Date(f.created_at).toLocaleString('es-EC', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'No registrada';
            
            const numEstrellas = `${f.rating} de 5 estrellas`;
            const commentClean = (f.comment || 'Sin comentario').replace(/"/g, '""').replace(/\r?\n/g, ' ');
            const nameClean = (f.customer_name || 'Anonimo').replace(/"/g, '""');
            const contactClean = (f.customer_contact || 'No proporcionado').replace(/"/g, '""');
            
            return `"${idx + 1}";"${dateStr}";"${numEstrellas}";"${commentClean}";"${nameClean}";"${contactClean}"`;
        }).join('\r\n');

        const csvString = csvHeader + csvRows;
        const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
        const contentBuffer = Buffer.from(csvString, 'utf-8');
        const finalBuffer = Buffer.concat([bomBuffer, contentBuffer]);

        return new NextResponse(finalBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="Reporte_Opiniones_Clientes_${registro_id}.csv"`,
            },
        });
    } catch (error) {
        console.error('Error al obtener feedbacks:', error);
        return NextResponse.json({ error: 'Error al obtener opiniones' }, { status: 500 });
    }
}
