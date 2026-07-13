const fs = require('fs');
require('dotenv').config();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

const targets = [
  { nombre: 'Sur Bike', whatsapp: '+593984524936', slug: 'sur-bike-u83d' },
  { nombre: 'Punto Smart', whatsapp: '0982558192', slug: 'punto-smart-072j' },
  { nombre: 'Marielena Cabrera', whatsapp: '+593 98 526 2453', slug: 'estetica-marielena-cabrera-teu3' }
];

const messageTemplate = `¡Hola {nombre}! 👋

Te tenemos una súper actualización sobre tu ActivaQR sin costo adicional. 🚀

A partir de ahora, tienes un NUEVO código QR inteligente. Cuando un cliente lo escanee, abrirá WhatsApp automáticamente y nuestro sistema le entregará tu contacto digital de inmediato. ¡Es mucho más efectivo para cerrar ventas!

📲 *Tu nuevo QR está en la imagen de arriba.*
Puedes imprimirlo y reemplazar el actual si lo deseas.

📧 También te enviamos un correo a tu dirección registrada con el QR en alta calidad.

👉 Únete a nuestro canal oficial de ActivaQR para ver el video explicativo y recibir todas las novedades de tu servicio:
https://whatsapp.com/channel/0029VbCxZGO3QxS7Lu1a7v39

¿Tienes dudas? Responde aquí y te ayudamos.
El Equipo de ActivaQR.`;

async function send() {
    for (const r of targets) {
        let clientWhatsApp = r.whatsapp.replace(/\D/g, '');
        if (clientWhatsApp.length === 10 && clientWhatsApp.startsWith('0')) {
            clientWhatsApp = '593' + clientWhatsApp.substring(1);
        } else if (clientWhatsApp.length === 9 && !clientWhatsApp.startsWith('593')) {
            clientWhatsApp = '593' + clientWhatsApp;
        }

        const currentMessage = messageTemplate.replace(/{nombre}/g, r.nombre);
        const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`https://wa.me/593963425323?text=${encodeURIComponent(`Contacto:${r.slug}`)}`)}`;

        console.log(`Enviando a ${r.nombre} (${clientWhatsApp})...`);

        const payload = {
            number: clientWhatsApp,
            mediatype: 'image',
            mimetype: 'image/jpeg',
            media: dynamicQrUrl,
            caption: currentMessage,
            fileName: `broadcast_image_${Date.now()}.jpg`
        };

        try {
            const waRes = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify(payload)
            });

            const resText = await waRes.text();
            if (waRes.ok) {
                console.log(`✅ OK: ${r.nombre}`);
            } else {
                console.log(`❌ ERROR ${r.nombre}: ${resText}`);
            }
        } catch (e) {
            console.error(`❌ NETWORK ERROR ${r.nombre}:`, e);
        }
        
        // Wait 5 seconds between messages
        await new Promise(res => setTimeout(res, 5000));
    }
}

send().catch(console.error);
