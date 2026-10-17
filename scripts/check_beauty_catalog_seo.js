const https = require('https');

https.get('https://www.activaqr.com/catalog/beauty-studio-isabella-jimenez-2j75', (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
        const get = (re) => (body.match(re) || [])[1] || 'NOT_FOUND';
        console.log('BEAUTY CATALOG TITLE:', get(/<title>([^<]+)<\/title>/));
        console.log('BEAUTY CATALOG DESC:', get(/<meta name="description" content="([^"]+)"/));
        console.log('BEAUTY CATALOG KEYWORDS:', get(/<meta name="keywords" content="([^"]+)"/));
    });
});
