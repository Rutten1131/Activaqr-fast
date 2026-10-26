const https = require('https');

function checkFavicon(url) {
  https.get(url, (res) => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
      console.log('=== ' + url + ' ===');
      const icons = html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi);
      console.log('Icon tags:', icons);
    });
  });
}

checkFavicon('https://cortinasypersianasloja.com/');
checkFavicon('https://beautystudioisabeljimenez.com/');
