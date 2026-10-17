const https = require('https');

function checkDomain(domain) {
    return new Promise((resolve) => {
        https.get(`https://${domain}`, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                const getMatch = (re) => (body.match(re) || [])[1] || 'NOT_FOUND';
                resolve({
                    domain,
                    status: res.statusCode,
                    title: getMatch(/<title>([^<]+)<\/title>/),
                    canonical: getMatch(/<link rel="canonical" href="([^"]+)"/)
                });
            });
        }).on('error', err => resolve({ domain, error: err.message }));
    });
}

async function verifyAll() {
    console.log('--- AUDITORÍA DE AISLAMIENTO MULTI-TENANT ---');
    const domains = [
        'cortinasypersianasloja.com',
        'beautystudioisabeljimenez.com',
        'www.activaqr.com'
    ];

    for (const d of domains) {
        const res = await checkDomain(d);
        console.log(`\nDOMINIO: ${res.domain}`);
        console.log(`STATUS: ${res.status}`);
        console.log(`TITLE: ${res.title}`);
        console.log(`CANONICAL: ${res.canonical}`);
    }
}

verifyAll();
