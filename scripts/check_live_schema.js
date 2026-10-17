const https = require('https');

https.get('https://cortinasypersianasloja.com', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const matches = [...body.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
        console.log(`Encontrados ${matches.length} bloques JSON-LD Schema:`);
        matches.forEach((m, i) => {
            try {
                const parsed = JSON.parse(m[1]);
                console.log(`\n--- BLOQUE ${i + 1} ---`);
                console.log(JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log(`Bloque ${i + 1} no es JSON directo:`, m[1].slice(0, 150));
            }
        });
    });
});
