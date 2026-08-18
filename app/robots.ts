import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
        sitemap: 'https://www.activaqr.com/sitemap.xml',
    }
}

