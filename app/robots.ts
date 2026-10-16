import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function robots(): Promise<MetadataRoute.Robots> {
    const headersList = await headers()
    const host = headersList.get('host') || 'www.activaqr.com'
    const cleanHost = host.split(':')[0].toLowerCase().trim()

    const isActivaQr = cleanHost.includes('activaqr.com') || cleanHost.includes('localhost')

    const sitemapUrl = isActivaQr
        ? 'https://www.activaqr.com/sitemap.xml'
        : `https://${cleanHost}/sitemap.xml`

    return {
        rules: {
            userAgent: '*',
            allow: [
                '/',
                '/api/og-image/',
                '/api/profile/',
                '/api/vcard/',
            ],
            disallow: [
                '/admin/',
                '/api/admin/',
                '/api/seller/',
                '/api/webhook/',
                '/api/payphone/',
                '/api/create-crypto-payment/',
                '/api/quote/',
            ],
        },
        sitemap: sitemapUrl,
    }
}

