import type { Metadata } from "next";
import VCardClient from "@/app/card/[slug]/VCardClient";
import pool from "@/lib/db";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const slug = (await params).slug;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.activaqr.com';
    const ogImageUrl = `${baseUrl}/api/og-image/${slug}.jpg`;

    try {
        const [rows]: any = await pool.execute(
            'SELECT nombre, foto_url, last_edited_at, bio FROM registraya_vcard_registros WHERE slug = ?',
            [slug]
        );

        if (rows && rows.length > 0) {
            const client = rows[0];
            const name = client.nombre;
            const description = `Explora el catálogo de productos y servicios de ${name}. ${client.bio || ''}`;

            // Version cache buster basado en última edición
            const version = client.last_edited_at
                ? new Date(client.last_edited_at).getTime().toString(36)
                : slug.slice(-6);
            const ogImageUrlWithVersion = `${ogImageUrl}?v=${version}`;

            return {
                metadataBase: new URL(baseUrl),
                title: `${name} - Catálogo de Productos | ActivaQR`,
                description: description,
                openGraph: {
                    title: `${name} - Catálogo Interactivo`,
                    description: description,
                    url: `${baseUrl}/catalog/${slug}`,
                    type: 'website',
                    images: [
                        {
                            url: ogImageUrlWithVersion,
                            secureUrl: ogImageUrlWithVersion,
                            width: 1200,
                            height: 630,
                            alt: `Catálogo de ${name}`,
                            type: 'image/jpeg',
                        },
                    ],
                },
                twitter: {
                    card: 'summary_large_image',
                    title: `${name} - Catálogo Interactivo`,
                    description: description,
                    images: [ogImageUrlWithVersion],
                }
            };
        }
    } catch (err) {
        console.error('Error generating metadata:', err);
    }

    const name = slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    return {
        metadataBase: new URL(baseUrl),
        title: `${name} - Catálogo de Productos | ActivaQR`,
        description: `Explora el catálogo de productos y servicios de ${name}.`,
        openGraph: {
            title: `${name} - Catálogo`,
            description: `Catálogo interactivo de productos y servicios.`,
            url: `${baseUrl}/catalog/${slug}`,
            type: 'website',
            images: [
                {
                    url: `${baseUrl}/og-default.png`,
                    width: 800,
                    height: 800,
                    alt: 'ActivaQR',
                    type: 'image/png',
                }
            ]
        },
        twitter: {
            card: 'summary_large_image',
            title: `${name} - Catálogo`,
            images: [`${baseUrl}/og-default.png`],
        }
    };
}

export default async function CatalogPage({ params }: { params: { slug: string } }) {
    const slug = (await params).slug;

    try {
        const [rows]: any = await pool.execute(
            'SELECT status FROM registraya_vcard_registros WHERE slug = ? OR id = ?',
            [slug, slug]
        );

        if (rows && rows.length > 0 && rows[0].status === 'cancelado') {
            redirect('/catalog/activaqr-9ag4');
        }
    } catch (err) {
        console.error('Error in CatalogPage server-side check:', err);
    }

    return <VCardClient showCatalog={true} />;
}
