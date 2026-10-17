const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'mysql.us.stackcp.com',
        port: parseInt(process.env.MYSQL_PORT || '42755', 10),
        user: process.env.MYSQL_USER || 'Activaqrbasededatos-35303936889f',
        password: process.env.MYSQL_PASSWORD || 'pwye546gfr',
        database: process.env.MYSQL_DATABASE || 'Activaqrbasededatos-35303936889f'
    });

    const payload = {
        seo: {
            customTitle: "Isabella Jiménez Beauty Studio | Salón de Belleza y Peluquería en Loja",
            customDescription: "Salón de belleza y peluquería en Loja, Ecuador. Expertos en corte de cabello para mujer, balayage, tratamientos capilares, peinados para eventos, manicura y maquillaje social. ¡Agenda tu cita directa por WhatsApp!",
            customKeywords: [
                "salon de belleza loja",
                "salon de belleza en loja",
                "beauty studio loja",
                "peluqueria loja",
                "peluqueria para mujer loja",
                "donde cortarme el cabello mujer loja",
                "corte de cabello mujer loja",
                "balayage loja",
                "balayage loja ecuador",
                "isabella jimenez beauty studio",
                "isabela jimenez loja",
                "peinados para eventos loja",
                "maquillaje social loja",
                "tratamientos capilares loja",
                "manicura loja",
                "unas semipermanentes loja"
            ],
            schemaCategory: "BeautySalon",
            faqs: [
                {
                    q: "¿Dónde cortarse el cabello para mujer en Loja?",
                    a: "En Isabella Jiménez Beauty Studio, ubicado en Juan José Peña y Azuay, Loja. Ofrecemos cortes de cabello para mujer, despunte, lavado y brushing profesional adaptado a tu estilo."
                },
                {
                    q: "¿Qué servicios ofrece Isabella Jiménez Beauty Studio en Loja?",
                    a: "Ofrecemos servicios completos de salón de belleza: coloración, balayage y mechas, tratamientos capilares de hidratación y brillo, peinados para eventos, maquillaje social, diseño de cejas, manicura clásica y esmaltado semipermanente."
                },
                {
                    q: "¿Cómo agendar una cita en Isabella Jiménez Beauty Studio?",
                    a: "Puedes agendar tu cita o consultar disponibilidad directamente por WhatsApp al número +593 959 160 445."
                },
                {
                    q: "¿Dónde queda ubicado este salón de belleza en Loja?",
                    a: "Estamos ubicados en la intersección de Juan José Peña y Azuay, en la ciudad de Loja, Ecuador (código postal 110108)."
                }
            ]
        },
        item_label_singular: "Producto",
        item_label_plural: "Productos"
    };

    const [res] = await conn.execute(
        `UPDATE registraya_vcard_registros 
         SET profesion = ?, json_override = ?, menu_digital = NULL 
         WHERE slug = 'beauty-studio-isabella-jimenez-2j75'`,
        ['Salón de Belleza & Peluquería para Mujer en Loja', JSON.stringify(payload)]
    );

    console.log('UPDATE EXITOSO! affectedRows:', res.affectedRows);
    await conn.end();
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
