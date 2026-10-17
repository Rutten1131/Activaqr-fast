const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: 'mysql.us.stackcp.com',
        port: 42755,
        user: 'Activaqrbasededatos-35303936889f',
        password: 'pwye546gfr',
        database: 'Activaqrbasededatos-35303936889f'
    });

    try {
        console.log('1. Consultando registro actual de uditex-dcnv...');
        const [rows] = await conn.execute(
            'SELECT id, slug, json_override FROM registraya_vcard_registros WHERE slug = ?',
            ['uditex-dcnv']
        );

        if (!rows || rows.length === 0) {
            console.error('No se encontró el registro para uditex-dcnv');
            process.exit(1);
        }

        const currentOverride = rows[0].json_override 
            ? (typeof rows[0].json_override === 'string' ? JSON.parse(rows[0].json_override) : rows[0].json_override)
            : {};

        console.log('Override actual:', JSON.stringify(currentOverride));

        // Metadatos SEO y GEO de alta intención local (Google Search + LLMs)
        const seoData = {
            customTitle: 'Cortinas y Persianas en Loja | Uditex Fabricación y Venta',
            customDescription: '¿Dónde comprar cortinas y persianas en Loja? En Uditex fabricamos a medida: persianas zebra, blackout, enrollables y tradicionales. Cotiza por WhatsApp.',
            customKeywords: [
                'donde comprar cortinas en loja',
                'donde comprar persianas en loja',
                'cortinas en loja',
                'persianas en loja',
                'persianas zebra loja',
                'cortinas blackout loja',
                'persianas enrollables loja',
                'paneles japoneses loja',
                'instalacion de cortinas loja',
                'fabricacion de persianas loja',
                'telas para cortinas loja',
                'decoracion de interiores loja',
                'uditex loja',
                'cortinas y persianas loja'
            ],
            schemaCategory: 'Store',
            faqs: [
                {
                    q: '¿Dónde comprar cortinas y persianas a medida en Loja?',
                    a: 'En Uditex, ubicados en la calle Olmedo entre Azuay y Alonso de Mercadillo, Loja. Fabricamos y comercializamos cortinas tradicionales, visillos, telas blackout y persianas modernas con instalación y asesoría técnica a domicilio.'
                },
                {
                    q: '¿Qué tipos de persianas modernas tienen disponibles en Loja?',
                    a: 'Disponemos de persianas tipo Zebra (día y noche), persianas enrollables, persianas verticales de PVC y paneles japoneses deslizantes para residencias, oficinas y locales comerciales.'
                },
                {
                    q: '¿Cómo solicitar una cotización de cortinas o persianas en Loja?',
                    a: 'Puedes solicitar una cotización personalizada y asesoría a domicilio enviando las medidas aproximadas de tus ventanas directamente a nuestro WhatsApp (+593 99 230 3326).'
                },
                {
                    q: '¿Ofrecen servicio de instalación de cortinas y persianas en Loja?',
                    a: 'Sí, en Uditex brindamos el servicio completo que incluye toma de medidas, confección o fabricación a medida, entrega e instalación profesional garantizada en toda la ciudad de Loja y sectores aledaños.'
                }
            ],
            enableIndexed: true
        };

        const updatedOverride = {
            ...currentOverride,
            seo: seoData
        };

        console.log('2. Aplicando actualización aislada a uditex-dcnv...');
        const [updateRes] = await conn.execute(
            'UPDATE registraya_vcard_registros SET json_override = ? WHERE slug = ?',
            [JSON.stringify(updatedOverride), 'uditex-dcnv']
        );

        console.log('Resultado UPDATE:', updateRes);

        // Verificación
        const [verifyRows] = await conn.execute(
            'SELECT slug, json_override FROM registraya_vcard_registros WHERE slug = ?',
            ['uditex-dcnv']
        );

        console.log('Override verificado en BD:', JSON.stringify(JSON.parse(verifyRows[0].json_override), null, 2));

    } finally {
        await conn.end();
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
