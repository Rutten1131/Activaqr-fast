const mysql = require('mysql2/promise');
require('dotenv').config();

async function createFeriaTables() {
    console.log('--- Creando tablas para la Feria de Loja 197 en MySQL ---');
    
    const dbConfig = {
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        connectTimeout: 30000,
    };

    console.log('Conectando a MySQL:', dbConfig.host, 'BD:', dbConfig.database);
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión establecida con éxito.');

        // Tabla feria_negocios
        const createNegociosTableSQL = `
        CREATE TABLE IF NOT EXISTS feria_negocios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(150) UNIQUE NOT NULL,
            nombre_negocio VARCHAR(255) NOT NULL,
            nombre_representante VARCHAR(255) NOT NULL,
            telefono_negocio VARCHAR(50) DEFAULT NULL,
            logo_url TEXT DEFAULT NULL,
            google_reviews_url TEXT DEFAULT NULL,
            whatsapp_target_number VARCHAR(50) DEFAULT '+593963425323',
            total_votos INT DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_nombre (nombre_negocio),
            INDEX idx_slug (slug),
            INDEX idx_votos (total_votos DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await connection.execute(createNegociosTableSQL);
        console.log('✅ Tabla `feria_negocios` creada/verificada.');

        // Tabla feria_votos
        const createVotosTableSQL = `
        CREATE TABLE IF NOT EXISTS feria_votos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            negocio_id INT NOT NULL,
            telefono_votante VARCHAR(50) NOT NULL,
            nombre_votante VARCHAR(255) DEFAULT NULL,
            mensaje_recibido TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_negocio (negocio_id),
            INDEX idx_telefono (telefono_votante),
            CONSTRAINT fk_feria_negocio FOREIGN KEY (negocio_id) REFERENCES feria_negocios (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await connection.execute(createVotosTableSQL);
        console.log('✅ Tabla `feria_votos` creada/verificada.');

        console.log('🎉 Todas las tablas de la Feria de Loja se crearon correctamente.');
    } catch (err) {
        console.error('❌ Error creando tablas de la Feria:', err);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createFeriaTables();
