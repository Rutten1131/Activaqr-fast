const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function showExamples() {
    const conn = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT || '42755'),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    // Traer 4 registros reales: 2 negocios y 2 personas
    const [rows] = await conn.execute(`
        SELECT nombre, nombre_negocio, tipo_perfil, profesion, empresa, bio, productos_servicios, mensaje
        FROM registraya_vcard_registros 
        WHERE status IN ('pagado', 'entregado')
        ORDER BY created_at DESC
        LIMIT 8
    `);

    for (const r of rows) {
        console.log('='.repeat(60));
        console.log(`NOMBRE: ${r.nombre}`);
        console.log(`NOMBRE_NEGOCIO: ${r.nombre_negocio || '(vacío)'}`);
        console.log(`TIPO: ${r.tipo_perfil}`);
        console.log(`PROFESION: ${r.profesion || '(vacío)'}`);
        console.log(`EMPRESA: ${r.empresa || '(vacío)'}`);
        console.log(`BIO: ${r.bio ? r.bio.substring(0, 120) + (r.bio.length > 120 ? '...' : '') : '(vacío)'}`);
        console.log(`PRODUCTOS: ${r.productos_servicios ? r.productos_servicios.substring(0, 120) + (r.productos_servicios.length > 120 ? '...' : '') : '(vacío)'}`);
        console.log(`MENSAJE PERSONALIZADO: ${r.mensaje || '(vacío - usará fallback)'}`);
        
        // Simular el fallback
        let fallbackMsg = '';
        if (r.tipo_perfil === 'negocio') {
            const name = r.nombre_negocio || r.nombre || 'nuestro negocio';
            let desc = '';
            const rawDesc = r.bio || r.productos_servicios;
            if (rawDesc && rawDesc.trim()) {
                let cleanDesc = rawDesc.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
                if (cleanDesc.length > 80) {
                    cleanDesc = cleanDesc.substring(0, 77) + '...';
                }
                desc = ` (${cleanDesc})`;
            }
            fallbackMsg = `¡Hola {nombre}! Te comparto el contacto digital de ${name}${desc}. 🤝\n\nGuarda nuestro contacto digital aquí abajo 👇`;
        } else {
            const name = r.nombre || 'mi contacto';
            let desc = '';
            if (r.profesion && r.profesion.trim()) {
                const companyStr = (r.empresa && r.empresa.trim()) ? ` en ${r.empresa.trim()}` : '';
                desc = ` (${r.profesion.trim()}${companyStr})`;
            } else if (r.bio && r.bio.trim()) {
                let cleanBio = r.bio.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
                if (cleanBio.length > 80) {
                    cleanBio = cleanBio.substring(0, 77) + '...';
                }
                desc = ` (${cleanBio})`;
            }
            fallbackMsg = `¡Hola {nombre}! Te comparto el contacto digital de ${name}${desc}. 🤝\n\nGuarda mi contacto digital aquí abajo 👇`;
        }
        
        console.log(`\n>>> MENSAJE QUE SE ENVIARÍA EN WHATSAPP (si {nombre} = "César Reyes"):`);
        console.log(fallbackMsg.replace('{nombre}', 'César Reyes'));
        console.log('');
    }

    await conn.end();
}

showExamples().catch(console.error);
