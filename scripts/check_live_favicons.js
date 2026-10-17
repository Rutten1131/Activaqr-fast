const https = require('https');

https.get('https://cortinasypersianasloja.com', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const regex = /<link[^>]*rel="([^"]*icon[^"]*)"[^>]*href="([^"]+)"[^>]*>/gi;
        let match;
        console.log('=== FAVICONS EN EL HTML DE CORTINASYPERSIANASLOJA.COM ===');
        while ((match = regex.exec(body)) !== null) {
            console.log(`Rel: ${match[1]} | Href: ${match[2]}`);
        }
    });
});
