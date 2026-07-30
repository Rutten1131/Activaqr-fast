import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import pool from '../lib/db';

async function main() {
    try {
        const [rows]: any = await pool.execute(
            'SELECT id, codigo, nombre FROM registraya_vcard_sellers WHERE codigo = ?',
            ['007']
        );

        if (rows.length > 0) {
            console.log('--- VENDEDOR 007 ENCONTRADO EN BD ---');
            console.log('ID:', rows[0].id, '| Código:', rows[0].codigo, '| Nombre:', rows[0].nombre);
        } else {
            console.log('El vendedor 007 NO existe. Creándolo ahora en la BD...');
            const [result]: any = await pool.execute(
                `INSERT INTO registraya_vcard_sellers (codigo, nombre, role, comision_porcentaje, activo, created_at)
                 VALUES (?, ?, ?, ?, 1, NOW())`,
                ['007', 'Vendedor 007', 'seller', 30.00]
            );
            console.log('--- VENDEDOR 007 CREADO CON ÉXITO ---');
            console.log('ID asignado:', result.insertId);
        }
    } catch (e) {
        console.error('Error al verificar/crear vendedor 007:', e);
    }
    process.exit(0);
}

main();
