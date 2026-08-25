import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import mysql from 'mysql2/promise';

export async function runMigration() {
    console.log('🚀 Running migration for 10 Cases & Affiliate Engine...');
    console.log('Connecting to MySQL host:', process.env.MYSQL_HOST, 'port:', process.env.MYSQL_PORT);

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        connectTimeout: 30000,
    });

    try {
        await connection.beginTransaction();

        // 1. Tabla de Aliados / Influencers / Referidores
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS registraya_aliados (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                email VARCHAR(255) NULL,
                whatsapp VARCHAR(50) NOT NULL,
                redes_sociales JSON NULL COMMENT '{"instagram": "@...", "tiktok": "@..."}',
                tipo ENUM('influencer', 'referidor', 'distribuidor', 'agencia', 'vendedor', 'otro') DEFAULT 'influencer',
                codigo VARCHAR(50) UNIQUE NOT NULL COMMENT 'Código único ej: JUANREST',
                slug_link VARCHAR(100) NULL COMMENT 'Ruta personalizada',
                mercado_principal VARCHAR(10) DEFAULT 'EC' COMMENT 'EC, ES, US, etc.',
                comision_tipo ENUM('porcentaje', 'monto_fijo') DEFAULT 'porcentaje',
                comision_valor DECIMAL(10,2) DEFAULT 20.00 COMMENT 'Porcentaje ej 20% o Monto fijo ej $100',
                estado ENUM('activo', 'inactivo') DEFAULT 'activo',
                notas TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_codigo (codigo),
                INDEX idx_tipo (tipo),
                INDEX idx_estado (estado)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        // 2. Tabla del Pipeline de Restaurantes Referidos
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS registraya_pipeline_restaurantes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                aliado_id INT NULL,
                canal_origen VARCHAR(100) DEFAULT 'influencer' COMMENT 'influencer, referido, pauta_fb, google, prospeccion, web, whatsapp',
                nombre_restaurante VARCHAR(255) NOT NULL,
                contacto_nombre VARCHAR(255) NULL,
                contacto_telefono VARCHAR(50) NOT NULL,
                contacto_email VARCHAR(255) NULL,
                pais VARCHAR(10) DEFAULT 'EC' COMMENT 'EC, ES, US, etc.',
                ciudad VARCHAR(100) NULL,
                tipo_cocina VARCHAR(100) NULL,
                estado ENUM(
                    'prospecto',
                    'contactado',
                    'interesado',
                    'propuesta_enviada',
                    'vendido',
                    'pagado',
                    'en_implementacion',
                    'activo',
                    'caso_exito',
                    'comision_pagada',
                    'perdido'
                ) DEFAULT 'prospecto',
                es_candidato_10_casos TINYINT(1) DEFAULT 0,
                producto_interes VARCHAR(100) DEFAULT 'menu_interactivo',
                precio_pactado DECIMAL(10,2) DEFAULT 500.00,
                vcard_registro_id INT NULL COMMENT 'FK a registraya_vcard_registros si ya se creó la ficha',
                menu_slug VARCHAR(100) NULL,
                onboarding_uuid VARCHAR(64) NULL,
                notas TEXT NULL,
                fecha_primer_contacto TIMESTAMP NULL,
                fecha_cierre TIMESTAMP NULL,
                fecha_instalacion TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (aliado_id) REFERENCES registraya_aliados(id) ON DELETE SET NULL,
                INDEX idx_estado (estado),
                INDEX idx_aliado (aliado_id),
                INDEX idx_candidato (es_candidato_10_casos)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        // 3. Tabla de Comisiones Configurables
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS registraya_comisiones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pipeline_id INT NULL,
                aliado_id INT NOT NULL,
                producto VARCHAR(100) DEFAULT 'menu_interactivo',
                precio_venta DECIMAL(10,2) NOT NULL,
                descuento_aplicado DECIMAL(10,2) DEFAULT 0.00,
                monto_comision DECIMAL(10,2) NOT NULL,
                porcentaje_aplicado DECIMAL(5,2) NULL,
                estado ENUM('pendiente', 'aprobada', 'pagada', 'anulada') DEFAULT 'pendiente',
                fecha_pago TIMESTAMP NULL,
                metodo_pago VARCHAR(100) NULL,
                comprobante_url VARCHAR(500) NULL,
                notas TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (aliado_id) REFERENCES registraya_aliados(id) ON DELETE CASCADE,
                FOREIGN KEY (pipeline_id) REFERENCES registraya_pipeline_restaurantes(id) ON DELETE SET NULL,
                INDEX idx_estado (estado),
                INDEX idx_aliado (aliado_id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        // 4. Tabla de Gestión de los 10 Casos de Éxito
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS registraya_casos_exito (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pipeline_id INT UNIQUE NOT NULL,
                aliado_influencer_id INT NULL,
                numero_caso INT NULL COMMENT '1 a 10',
                mercado VARCHAR(10) DEFAULT 'EC' COMMENT 'EC, ES, US',
                hito_candidato_seleccionado TINYINT(1) DEFAULT 1,
                hito_pago_recibido TINYINT(1) DEFAULT 0,
                hito_menu_implementado TINYINT(1) DEFAULT 0,
                hito_influencer_asignado TINYINT(1) DEFAULT 0,
                hito_contenido_publicado TINYINT(1) DEFAULT 0,
                hito_testimonio_recolectado TINYINT(1) DEFAULT 0,
                hito_autorizacion_firmada TINYINT(1) DEFAULT 0,
                hito_caso_publicado TINYINT(1) DEFAULT 0,
                enlaces_contenido JSON NULL COMMENT '["https://tiktok.com/@..."]',
                testimonio_texto TEXT NULL,
                testimonio_video_url VARCHAR(500) NULL,
                metricas_alcanzadas JSON NULL COMMENT '{"vistas": 15000, "escaneos": 450}',
                fecha_activacion TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (pipeline_id) REFERENCES registraya_pipeline_restaurantes(id) ON DELETE CASCADE,
                FOREIGN KEY (aliado_influencer_id) REFERENCES registraya_aliados(id) ON DELETE SET NULL,
                INDEX idx_numero_caso (numero_caso)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        // 5. Tabla de Onboarding / Recopilación de Información de Restaurante
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS registraya_menu_onboarding (
                id INT AUTO_INCREMENT PRIMARY KEY,
                uuid VARCHAR(64) UNIQUE NOT NULL,
                pipeline_id INT NULL,
                nombre_restaurante VARCHAR(255) NOT NULL,
                telefono_contacto VARCHAR(50) NOT NULL,
                direccion_fisica TEXT NULL,
                redes_sociales JSON NULL,
                logo_url VARCHAR(500) NULL,
                carta_fotos JSON NULL COMMENT 'Array de URLs de fotos del menú físico o PDFs',
                platos_fotos JSON NULL COMMENT 'Array de URLs de fotos de platos',
                audios_descripcion JSON NULL COMMENT 'Array de URLs de notas de voz del chef/dueño',
                observaciones TEXT NULL,
                estado ENUM('borrador', 'enviado', 'en_procesamiento', 'completado') DEFAULT 'borrador',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (pipeline_id) REFERENCES registraya_pipeline_restaurantes(id) ON DELETE SET NULL,
                INDEX idx_uuid (uuid)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        await connection.commit();
        console.log('✅ All 5 tables created successfully!');
    } catch (err) {
        await connection.rollback();
        console.error('❌ Migration failed:', err);
        throw err;
    } finally {
        if (connection) await connection.end();
    }
}

runMigration()
    .then(() => {
        console.log('🎉 Migration completed.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('💥 Migration error:', err);
        process.exit(1);
    });

