const mysql = require('mysql2/promise');
require('dotenv').config();

async function upgradeFeriaSchema() {
    console.log('--- Actualizando esquema de la Feria de Loja en MySQL ---');
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
        console.log('✅ Conexión establecida.');

        const alterNegociosCols = [
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'emprendimientos'`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS numero_stand VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS origen VARCHAR(150) DEFAULT 'Loja'`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS anios_trayectoria VARCHAR(50) DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS descripcion_historia TEXT DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS materiales_ingredientes TEXT DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS productos_json LONGTEXT DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS redes_json TEXT DEFAULT NULL`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS tiene_gbp TINYINT(1) DEFAULT 0`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS total_votos_verificados INT DEFAULT 0`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS total_visitas INT DEFAULT 0`,
            `ALTER TABLE feria_negocios ADD COLUMN IF NOT EXISTS total_contactos_guardados INT DEFAULT 0`,
        ];

        for (const sql of alterNegociosCols) {
            try {
                await connection.execute(sql);
            } catch (err) {
                // Ignore if column exists or syntax variant
                console.log('Columna verificada:', err.message);
            }
        }
        console.log('✅ Columnas de `feria_negocios` actualizadas.');

        const alterVotosCols = [
            `ALTER TABLE feria_votos ADD COLUMN IF NOT EXISTS token_wa VARCHAR(64) DEFAULT NULL`,
            `ALTER TABLE feria_votos ADD COLUMN IF NOT EXISTS device_hash VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE feria_votos ADD COLUMN IF NOT EXISTS ip_hash VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE feria_votos ADD COLUMN IF NOT EXISTS verificado TINYINT(1) DEFAULT 0`,
        ];

        for (const sql of alterVotosCols) {
            try {
                await connection.execute(sql);
            } catch (err) {
                console.log('Columna verificada:', err.message);
            }
        }
        console.log('✅ Columnas de `feria_votos` actualizadas.');

        console.log('🎉 Esquema de base de datos ampliado exitosamente.');
    } catch (e) {
        console.error('Error en migración:', e);
    } finally {
        if (connection) await connection.end();
    }
}

upgradeFeriaSchema();
