const mysql = require('mysql2/promise');

async function applySeo() {
    console.log('--- 1. Conectando a la base de datos de ActivaQR ---');
    const conn = await mysql.createConnection({
        host: 'mysql.us.stackcp.com',
        port: 42755,
        user: 'Activaqrbasededatos-35303936889f',
        password: 'pwye546gfr',
        database: 'Activaqrbasededatos-35303936889f'
    });

    try {
        console.log('--- 2. Consultando cliente beauty-studio-isabella-jimenez-2j75 ---');
        const [rows] = await conn.execute(
            'SELECT id, slug, json_override FROM registraya_vcard_registros WHERE slug = ?',
            ['beauty-studio-isabella-jimenez-2j75']
        );

        if (!rows || rows.length === 0) {
            throw new Error('No se encontró el registro para beauty-studio-isabella-jimenez-2j75');
        }

        const currentOverride = rows[0].json_override 
            ? (typeof rows[0].json_override === 'string' ? JSON.parse(rows[0].json_override) : rows[0].json_override)
            : {};

        console.log('Override actual existente:', JSON.stringify(currentOverride, null, 2));

        // 3. Estructuración SEO Premium + LLM GEO-Context
        const seoData = {
            customTitle: 'Peluquería en Loja | Isabella Jiménez Beauty Studio — Salón de Belleza',
            customDescription: 'Peluquería y salón de belleza en Loja para mujer. Especialistas en balayage, alisados orgánicos, colorimetría, manicure, peinados y maquillaje. Agenda tu cita.',
            customKeywords: [
                'peluqueria loja',
                'peluquerias en loja',
                'peluqueria cerca de mi',
                'peluqueria cerca de mi ubicacion',
                'peluqueria de mujer cerca de mi',
                'isabella jimenez',
                'isabella jimenez beauty studio',
                'salon de belleza loja',
                'salones de belleza en loja',
                'manicure loja',
                'balayage loja',
                'alisado organico loja',
                'alisado progresivo loja',
                'mechas loja',
                'tratamientos capilares loja',
                'maquillaje profesional loja',
                'peinados loja'
            ],
            schemaCategory: 'BeautySalon',
            faqs: [
                {
                    q: '¿Dónde encontrar una peluquería y salón de belleza cerca de mí en Loja?',
                    a: 'Isabella Jiménez Beauty Studio está ubicada en la intersección de Juan José Peña y Azuay, Loja, Ecuador (código postal 110108). Ofrecemos servicios completos de peluquería femenina, estilismo y estética en un ambiente moderno y exclusivo.'
                },
                {
                    q: '¿Qué servicios de peluquería y estilismo ofrecen en Loja?',
                    a: 'Nos especializamos en colorimetría capilar (balayage, mechas, rayitos, cobertura de canas), alisados (progresivo y orgánico), tratamientos reparadores y anticaída, peinados para eventos, maquillaje profesional, manicure, pedicure y depilación facial.'
                },
                {
                    q: '¿Cómo agendar una cita en Isabella Jiménez Beauty Studio?',
                    a: 'Puedes reservar tu turno fácilmente comunicándote por WhatsApp al +593 959 160 445. Te brindamos asesoría personalizada para elegir el tratamiento o cambio de look ideal para tu cabello.'
                },
                {
                    q: '¿Realizan paquetes de peinado y maquillaje para novias o eventos en Loja?',
                    a: 'Sí, disponemos de paquetes integrales de peinados y maquillaje social para novias, quinceañeras, graduaciones y eventos especiales en Loja, garantizando acabados de larga duración con productos profesionales.'
                }
            ],
            enableIndexed: true
        };

        const updatedOverride = {
            ...currentOverride,
            seo: seoData
        };

        // 4. Actualización en BD (profesión limpia sin perder concordancia)
        console.log('--- 3. Guardando actualización aislada en BD ---');
        await conn.execute(
            'UPDATE registraya_vcard_registros SET json_override = ? WHERE slug = ?',
            [JSON.stringify(updatedOverride), 'beauty-studio-isabella-jimenez-2j75']
        );

        console.log('--- 4. Verificando persistencia ---');
        const [verify] = await conn.execute(
            'SELECT slug, json_override FROM registraya_vcard_registros WHERE slug = ?',
            ['beauty-studio-isabella-jimenez-2j75']
        );

        console.log('✅ ÉXITO TOTAL: Override guardado y verificado en BD:');
        console.log(JSON.stringify(JSON.parse(verify[0].json_override), null, 2));

    } finally {
        await conn.end();
    }
}

applySeo().catch(err => {
    console.error('Error aplicando SEO a Beauty Studio:', err);
    process.exit(1);
});
