import { Metadata } from 'next';
import { headers } from 'next/headers';
import pool from '@/lib/db';
import HomeClient from './HomeClient';
import CatalogPage, { generateMetadata as generateCatalogMetadata } from './catalog/[slug]/page';
import CardPage, { generateMetadata as generateCardMetadata } from './card/[slug]/page';

const ROOT_DOMAINS = new Set([
    'activaqr.com',
    'www.activaqr.com',
    'localhost',
    '127.0.0.1',
    'activaqr2.vercel.app',
    'gimnasios.activaqr.com',
    'restaurante.activaqr.com'
]);

async function getCustomDomainClient(host: string) {
    if (!host || ROOT_DOMAINS.has(host) || host.endsWith('.vercel.app')) {
        return null;
    }
    try {
        const [rows]: any = await pool.execute(
            'SELECT id, slug, plan, status FROM registraya_vcard_registros WHERE custom_domain = ? LIMIT 1',
            [host]
        );
        if (rows && rows.length > 0) {
            return rows[0];
        }
    } catch (err) {
        console.error('[Home] Error resolving custom domain client:', err);
    }
    return null;
}

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const rawHost = headersList.get('x-forwarded-host') || headersList.get('host') || '';
    const host = rawHost.split(':')[0].toLowerCase().trim();

    const client = await getCustomDomainClient(host);
    if (client && client.slug) {
        if (client.plan === 'catalog') {
            return generateCatalogMetadata({ params: { slug: client.slug } });
        } else {
            return generateCardMetadata({ params: { slug: client.slug } });
        }
    }

    return {
        title: 'ActivaQR | Tu negocio instalado en la agenda de tu cliente, hoy mismo',
        description: 'Convierte tu contacto en una herramienta de ventas. Digitaliza tu tarjeta de presentación, crea catálogos y automatiza tu atención por WhatsApp.',
        keywords: 'tarjetas digitales, qr dinamico, vcard, contacto digital, catálogo whatsapp, activaqr',
        openGraph: {
            title: 'ActivaQR | Tu Negocio en su Teléfono',
            description: 'La forma más rápida y profesional de compartir tu contacto y vender por WhatsApp.',
            images: ['/images/ActivaQR_hero.webp'],
        }
    };
}

export default async function Home() {
    const headersList = await headers();
    const rawHost = headersList.get('x-forwarded-host') || headersList.get('host') || '';
    const host = rawHost.split(':')[0].toLowerCase().trim();

    const client = await getCustomDomainClient(host);
    if (client && client.slug) {
        if (client.plan === 'catalog') {
            return <CatalogPage params={{ slug: client.slug }} />;
        } else {
            return <CardPage params={{ slug: client.slug }} />;
        }
    }

    return (
        <div className="relative">
            <HomeClient />
            
            {/* SEO Hidden Text for Search Engines */}
            <div className="sr-only">
                <h1>ActivaQR - El Poder del Contacto Digital</h1>
                <p>
                    Deja de usar tarjetas de papel. Con ActivaQR puedes tener una tarjeta de presentación digital 
                    profesional con QR dinámico por solo $35 al año. Ideal para profesionales, negocios y empresas 
                    que buscan modernizar su atención al cliente y aumentar sus ventas por WhatsApp.
                </p>
                <h2>Nuestros Planes</h2>
                <ul>
                    <li>Contacto Digital: $35/año - Lo esencial para profesionales.</li>
                    <li>Contacto Business: $100/año - Identidad corporativa y enlaces de venta.</li>
                    <li>Business + Catálogo: $200/año - Tu vitrina de ventas interactiva.</li>
                    <li>Sitio Web Completo: $1,000 - Tu ecosistema digital profesional a medida.</li>
                </ul>
            </div>
        </div>
    );
}
