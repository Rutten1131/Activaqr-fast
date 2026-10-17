const https = require('https');

https.get('https://cortinasypersianasloja.com', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const getMatch = (re) => {
            const m = body.match(re);
            return m ? m[1] : 'NOT_FOUND';
        };
        console.log('--- SEO DIAGNOSTICO EN VIVO ---');
        console.log('TITLE:', getMatch(/<title>([^<]+)<\/title>/));
        console.log('DESCRIPTION:', getMatch(/<meta name="description" content="([^"]+)"/));
        console.log('KEYWORDS:', getMatch(/<meta name="keywords" content="([^"]+)"/));
        console.log('FAVICON:', getMatch(/<link rel="(?:shortcut )?icon" href="([^"]+)"/));
        console.log('CANONICAL:', getMatch(/<link rel="canonical" href="([^"]+)"/));
        console.log('ROBOTS META:', getMatch(/<meta name="robots" content="([^"]+)"/));
        console.log('OG:TITLE:', getMatch(/<meta property="og:title" content="([^"]+)"/));
        console.log('OG:IMAGE:', getMatch(/<meta property="og:image" content="([^"]+)"/));
        console.log('JSON-LD SCHEMA INCLUDED:', body.includes('application/ld+json'));
    });
}).on('error', (e) => console.error(e));
