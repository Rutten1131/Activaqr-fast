const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT)
  });
  
  const query = "SELECT id, slug, nombre, nombre_negocio, whatsapp, plan, status FROM registraya_vcard_registros WHERE status IN ('pagado', 'entregado') AND whatsapp IS NOT NULL AND whatsapp != '' ORDER BY paid_at DESC, created_at DESC";
                 
  const [rows] = await conn.execute(query);
  const lastFour = rows.slice(-4);
  console.log('=== ÚLTIMOS 4 DESTINATARIOS (LOTE FALLIDO) ===');
  lastFour.forEach(r => console.log('- Nombre:', r.nombre || r.nombre_negocio, '| Wa:', r.whatsapp, '| Slug:', r.slug));
  await conn.end();
}

check().catch(console.error);
