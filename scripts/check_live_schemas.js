const https = require('https');

https.get('https://cortinasypersianasloja.com/', (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (scripts) {
      scripts.forEach((s, idx) => {
        console.log('=== SCHEMA SCRIPT ' + idx + ' ===');
        console.log(s);
      });
    } else {
      console.log('No JSON-LD found');
    }
  });
});
