const https = require('https');

https.get('https://beautystudioisabeljimenez.com/', (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const hasFaq = html.includes('FAQPage');
    const hasBeautySalon = html.includes('BeautySalon');

    console.log('--- VERIFICACIÓN EN VIVO: beautystudioisabeljimenez.com ---');
    console.log('Status HTTP:', res.statusCode);
    console.log('Title en vivo:', titleMatch ? titleMatch[1] : 'No encontrado');
    console.log('Description en vivo:', descMatch ? descMatch[1] : 'No encontrada');
    console.log('¿Tiene FAQPage Schema en HTML?:', hasFaq);
    console.log('¿Tiene BeautySalon Schema en HTML?:', hasBeautySalon);
  });
});
