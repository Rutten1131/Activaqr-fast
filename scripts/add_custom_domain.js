const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        connectTimeout: 30000
    });

    console.log('Conectado a MySQL...');

    try {
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM registraya_vcard_registros LIKE 'custom_domain'
        `);

        if (columns.length === 0) {
            console.log('Agregando columna custom_domain...');
            await connection.query(`
                ALTER TABLE registraya_vcard_registros 
                ADD COLUMN custom_domain VARCHAR(255) DEFAULT NULL,
                ADD UNIQUE INDEX idx_custom_domain (custom_domain)
            `);
            console.log('✅ Columna custom_domain creada con éxito con índice UNIQUE.');
        } else {
            console.log('ℹ️ La columna custom_domain ya existe.');
        }

        const [res] = await connection.query(`
            UPDATE registraya_vcard_registros 
            SET custom_domain = 'frida.activaqr.com' 
            WHERE slug = 'frida-m01b'
        `);
        console.log(`✅ Registro de Frida actualizado (filas afectadas: ${res.affectedRows}).`);

        const [rows] = await connection.query(`
            SELECT id, slug, nombre_negocio, custom_domain, plan 
            FROM registraya_vcard_registros 
            WHERE custom_domain IS NOT NULL
        `);
        console.log('📌 Dominios personalizados registrados:', rows);

    } catch (err) {
        console.error('❌ Error en migración:', err);
    } finally {
        await connection.end();
    }
}

runMigration();
