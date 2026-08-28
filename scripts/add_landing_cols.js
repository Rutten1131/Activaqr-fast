const mysql = require('mysql2/promise');
require('dotenv').config();

async function addLandingCols() {
    console.log('--- Añadiendo columnas para la Landing del Stand ---');
    const dbConfig = {
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        connectTimeout: 30000,
    };

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const cols = [
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS slogan VARCHAR(255) DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS portada_url TEXT DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS promocion_feria TEXT DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255) DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255) DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255) DEFAULT NULL`,
        ];

        for (const sql of cols) {
            try {
                await connection.execute(sql);
            } catch (e) {
                console.log('Nota:', e.message);
            }
        }
        console.log('✅ Columnas añadidas con éxito.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

addLandingCols();
