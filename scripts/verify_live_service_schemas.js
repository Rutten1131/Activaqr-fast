const https = require('https');

function checkSchema(url, label) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                const matches = [...body.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
                console.log(`\n=================== ${label} ===================`);
                matches.forEach((m) => {
                    try {
                        const parsed = JSON.parse(m[1]);
                        const graph = parsed['@graph'] || [parsed];
                        graph.forEach(item => {
                            if (item.hasOfferCatalog) {
                                console.log('OfferCatalog Type:', item.hasOfferCatalog['@type']);
                                const items = item.hasOfferCatalog.itemListElement || [];
                                console.log(`Items count: ${items.length}`);
                                items.slice(0, 3).forEach((it, idx) => {
                                    console.log(`  [${idx + 1}] ${it.itemOffered?.name} -> Type: ${it.itemOffered?.['@type']}`);
                                });
                            }
                        });
                    } catch (e) {
                        console.error('Error parseando JSON:', e.message);
                    }
                });
                resolve();
            });
        }).on('error', (e) => {
            console.error(e.message);
            resolve();
        });
    });
}

async function run() {
    await checkSchema('https://beautystudioisabeljimenez.com', 'BEAUTY STUDIO CUSTOM DOMAIN');
    await checkSchema('https://www.activaqr.com/catalog/beauty-studio-isabella-jimenez-2j75', 'BEAUTY STUDIO CATALOG URL');
    await checkSchema('https://cortinasypersianasloja.com', 'UDITEX CUSTOM DOMAIN');
}

run();
