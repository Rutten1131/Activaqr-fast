import { MetadataRoute } from 'next';
import pool from '@/lib/db';
import { BLOG_POSTS } from '@/lib/blog-data';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidar cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.activaqr.com';

    // 1. Páginas estáticas y de conversión
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/contacto-digital`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/contacto-business`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/sitio-web-completo`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/registro`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/diagnostico`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/encuesta`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/letrero-locales`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/para-taxis-y-camionetas`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ];

    // 2. Artículos de Blog
    const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    // 3. Perfiles y Catálogos Dinámicos de Clientes (Existentes y Nuevos)
    const clientPages: MetadataRoute.Sitemap = [];

    try {
        const [rows]: any = await pool.execute(
            `SELECT slug, plan, status, json_override, last_edited_at, created_at 
             FROM registraya_vcard_registros 
             WHERE status != 'cancelado' AND slug IS NOT NULL AND slug != ''`
        );

        if (rows && Array.isArray(rows)) {
            for (const row of rows) {
                // Verificar si tiene noindex en json_override
                let isIndexed = true;
                if (row.json_override) {
                    try {
                        const parsed = typeof row.json_override === 'string'
                            ? JSON.parse(row.json_override)
                            : row.json_override;
                        if (parsed?.seo?.enableIndexed === false) {
                            isIndexed = false;
                        }
                    } catch {
                        // ignore
                    }
                }

                if (!isIndexed) continue;

                const lastMod = row.last_edited_at 
                    ? new Date(row.last_edited_at) 
                    : (row.created_at ? new Date(row.created_at) : new Date());

                // Prioridad por tipo de plan ($200 y $100 con mayor prioridad)
                let priority = 0.7;
                if (row.plan === 'sitio-web' || row.plan === 'web') priority = 0.9;
                else if (row.plan === 'catalog' || row.plan === 'business') priority = 0.85;

                // URL del perfil / tarjeta digital
                clientPages.push({
                    url: `${baseUrl}/card/${row.slug}`,
                    lastModified: lastMod,
                    changeFrequency: 'weekly',
                    priority: priority,
                });

                // Si es plan con catálogo / menú, incluir también la URL de catálogo
                if (row.plan === 'catalog' || row.plan === 'business' || row.plan === 'sitio-web') {
                    clientPages.push({
                        url: `${baseUrl}/catalog/${row.slug}`,
                        lastModified: lastMod,
                        changeFrequency: 'weekly',
                        priority: Math.max(0.6, priority - 0.05),
                    });
                }
            }
        }
    } catch (err) {
        console.error('Error generando sitemap dinámico para clientes:', err);
    }

    return [...staticPages, ...blogPages, ...clientPages];
}

