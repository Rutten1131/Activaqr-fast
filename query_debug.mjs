import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'mysql.us.stackcp.com',
  port: 42755,
  user: 'Activaqrbasededatos-35303936889f',
  password: 'pwye546gfr',
  database: 'Activaqrbasededatos-35303936889f',
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0
});

async function main() {
  console.log('🔍 Conectando a la base de datos...\n');
  
  // Buscar registros con "baby" en el slug
  const [rows] = await pool.execute(
    `SELECT id, slug, nombre, nombre_negocio, status, plan, created_at 
     FROM registraya_vcard_registros 
     WHERE slug LIKE '%baby%' OR slug LIKE '%clean%'
     ORDER BY created_at DESC LIMIT 20`
  );
  
  if (rows.length === 0) {
    console.log('❌ No se encontraron registros con "baby" o "clean" en el slug\n');
  } else {
    console.log(`✅ Encontrados ${rows.length} registro(s):\n`);
    for (const row of rows) {
      console.log('---');
      console.log(`ID: ${row.id}`);
      console.log(`Slug: ${row.slug}`);
      console.log(`Nombre: ${row.nombre}`);
      console.log(`Negocio: ${row.nombre_negocio}`);
      console.log(`Status: ${row.status}`);
      console.log(`Plan: ${row.plan}`);
      console.log(`Fecha: ${row.created_at}`);
    }
    console.log('\n---');
  }
  
  // También buscar si existe exactamente "baby-claen" vs "baby-clean"
  const [exactMatch] = await pool.execute(
    `SELECT slug, status FROM registraya_vcard_registros WHERE slug IN ('baby-claen', 'baby-clean')`
  );
  
  if (exactMatch.length > 0) {
    console.log('\n📋 Coincidencia exacta:');
    for (const row of exactMatch) {
      console.log(`  - ${row.slug} → status: ${row.status}`);
    }
  }
  
  await pool.end();
  console.log('\n✅ Consulta completada');
}

main().catch(console.error);
