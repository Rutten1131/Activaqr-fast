const pool = require('../lib/db').default || require('../lib/db');

async function main() {
    try {
        const [rows] = await pool.execute(
            'SELECT id, codigo, nombre FROM registraya_vcard_sellers WHERE codigo = ?',
            ['007']
        );

        if (rows.length > 0) {
            console.log('El vendedor 007 YA EXISTE:', rows[0]);
        } else {
            console.log('El vendedor 007 NO existe. Creándolo ahora...');
            const [result] = await pool.execute(
                `INSERT INTO registraya_vcard_sellers (codigo, nombre, role, comision_porcentaje, activo, created_at)
                 VALUES (?, ?, ?, ?, 1, NOW())`,
                ['007', 'Vendedor 007', 'seller', 30.00]
            );
            console.log('Vendedor 007 creado exitosamente con ID:', result.insertId);
        }
    } catch (e) {
        console.error('Error al verificar/crear vendedor 007:', e);
    } process.exit(0);
}

main();
