const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function migrate() {
    let conn;
    try {
        console.log('Cargando credenciales de .env...');
        console.log('Host:', process.env.MYSQL_HOST);
        console.log('Puerto:', process.env.MYSQL_PORT);
        console.log('Database:', process.env.MYSQL_DATABASE);

        conn = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT || '42755'),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        console.log('Conexión establecida. Intentando agregar columna mensaje...');
        await conn.execute('ALTER TABLE registraya_vcard_registros ADD COLUMN mensaje TEXT DEFAULT NULL');
        console.log('¡Columna mensaje agregada con éxito!');
        
        await conn.end();
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('La columna mensaje ya existe en la base de datos.');
        } else {
            console.error('Error durante la migración:', e);
        }
        if (conn) await conn.end();
    }
}

migrate();
