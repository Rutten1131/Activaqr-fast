const mysql = require('mysql2/promise');

async function main() {
    console.log('--- 1. Conectando a la base de datos de ActivaQR ---');
    const conn = await mysql.createConnection({
        host: 'mysql.us.stackcp.com',
        port: 42755,
        user: 'Activaqrbasededatos-35303936889f',
        password: 'pwye546gfr',
        database: 'Activaqrbasededatos-35303936889f'
    });

    try {
        console.log('--- 2. Obteniendo registro actual de uditex-dcnv ---');
        const [rows] = await conn.execute(
            'SELECT id, slug, json_override FROM registraya_vcard_registros WHERE slug = ?',
            ['uditex-dcnv']
        );

        if (!rows || rows.length === 0) {
            throw new Error('No se encontró el registro para uditex-dcnv');
        }

        const currentOverride = rows[0].json_override 
            ? (typeof rows[0].json_override === 'string' ? JSON.parse(rows[0].json_override) : rows[0].json_override)
            : {};

        console.log('Override actual existente:', JSON.stringify(currentOverride, null, 2));

        // Construir la sección SEO y FAQ Schema (0 cambios en frontend, 100% verídico sin inventar fábricas)
        const seoData = {
            customTitle: 'Cortinas y Persianas en Loja | Uditex — Venta e Instalación',
            customDescription: 'Venta e instalación de cortinas y persianas en Loja: cortinas zebra, blackout, enrollables y paneles japoneses. Asesoría a domicilio y cotización por WhatsApp.',
            customKeywords: [
                'cortinas loja',
                'cortinas en loja',
                'persianas loja',
                'persianas en loja',
                'cortinas y persianas loja',
                'cortinas zebra loja',
                'cortinas blackout loja',
                'persianas enrollables loja',
                'paneles japoneses loja',
                'instalacion de cortinas loja',
                'telas para cortinas loja',
                'decoracion de interiores loja',
                'uditex loja'
            ],
            schemaCategory: 'Store',
            faqs: [
                {
                    q: '¿Dónde comprar cortinas y persianas en Loja?',
                    a: 'En Uditex, ubicados en la calle Olmedo entre Azuay y Alonso de Mercadillo, Loja. Ofrecemos venta e instalación de cortinas tradicionales, persianas modernas tipo zebra, blackout y paneles japoneses con asesoría a domicilio.'
                },
                {
                    q: '¿Qué tipos de persianas tienen disponibles en Loja?',
                    a: 'Disponemos de persianas tipo Zebra (día y noche), persianas enrollables, persianas verticales de PVC y paneles japoneses deslizantes para residencias, oficinas y locales comerciales.'
                },
                {
                    q: '¿Cómo solicitar una cotización o asesoría en Loja?',
                    a: 'Puedes solicitar una cotización y asesoría técnica a domicilio enviando las medidas aproximadas de tus ventanas directamente a nuestro WhatsApp (+593 99 230 3326).'
                },
                {
                    q: '¿Ofrecen servicio de instalación de cortinas y persianas en Loja?',
                    a: 'Sí, en Uditex brindamos el servicio completo que incluye toma de medidas, venta, entrega e instalación profesional en toda la ciudad de Loja y sectores aledaños.'
                }
            ],
            enableIndexed: true
        };

        const updatedOverride = {
            ...currentOverride,
            seo: seoData
        };

        console.log('--- 3. Guardando actualización aislada en BD ---');
        await conn.execute(
            'UPDATE registraya_vcard_registros SET json_override = ? WHERE slug = ?',
            [JSON.stringify(updatedOverride), 'uditex-dcnv']
        );

        console.log('--- 4. Verificando persistencia ---');
        const [verify] = await conn.execute(
            'SELECT slug, json_override FROM registraya_vcard_registros WHERE slug = ?',
            ['uditex-dcnv']
        );

        console.log('✅ ÉXITO TOTAL: Override guardado y verificado en BD:');
        console.log(JSON.stringify(JSON.parse(verify[0].json_override), null, 2));

    } finally {
        await conn.end();
    }
}

main().catch(err => {
    console.error('Error aplicando SEO a Uditex:', err);
    process.exit(1);
});
