import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import pool from '../lib/db';

async function main() {
    try {
        console.log('Host DB:', process.env.MYSQL_HOST, 'Port:', process.env.MYSQL_PORT);
        const [rows]: any = await pool.execute(
            'SELECT id, codigo, nombre, activo, role FROM registraya_vcard_sellers'
        );
        console.log('--- VENDEDORES REGISTRADOS EN BD (Total:', rows.length, ') ---');
        console.table(rows);
    } catch (e) {
        console.error('Error al listar vendedores:', e);
    }
    process.exit(0);
}

main();
