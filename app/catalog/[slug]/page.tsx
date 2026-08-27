import type { Metadata } from "next";
import VCardClient from "@/app/card/[slug]/VCardClient";
import pool from "@/lib/db";
import { redirect } from "next/navigation";
import { buildClientSeoMetadata } from "@/lib/seo/metadataHelper";

export const revalidate = 60; // Cache de 60s en CDN con revalidación automática

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> | { slug: string } }): Promise<Metadata> {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.activaqr.com';

    try {
        const [rows]: any = await pool.execute(
            `SELECT 
                id, slug, nombre, nombre_negocio, tipo_perfil, profesion, empresa, bio, 
                direccion, web, whatsapp, email, google_business, google_rating, google_reviews_count,
                instagram, facebook, tiktok, youtube, linkedin, x, productos_servicios, etiquetas,
                plan, foto_url, galeria_urls, portada_desktop, portada_movil, catalogo_json,
                menu_digital, json_override, custom_domain, last_edited_at, created_at
             FROM registraya_vcard_registros 
             WHERE slug = ? OR id = ? LIMIT 1`,
            [slug, slug]
        );

        if (rows && rows.length > 0) {
            const client = rows[0];
            const { metadata } = buildClientSeoMetadata(client, baseUrl, true);
            return metadata;
        }
    } catch (err) {
        console.error('Error generating dynamic catalog SEO metadata:', err);
    }

    const name = slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    return {
        metadataBase: new URL(baseUrl),
        title: `${name} | Catálogo de Productos y Servicios - ActivaQR`,
        description: `Explora el catálogo interactivo de productos y servicios de ${name}.`,
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

export default async function CatalogPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.activaqr.com';

    let schemaJsonLd: Record<string, any> | null = null;

    try {
        const [rows]: any = await pool.execute(
            `SELECT 
                id, slug, nombre, nombre_negocio, tipo_perfil, profesion, empresa, bio, 
                direccion, web, whatsapp, email, google_business, google_rating, google_reviews_count,
                instagram, facebook, tiktok, youtube, linkedin, x, productos_servicios, etiquetas,
                plan, foto_url, galeria_urls, portada_desktop, portada_movil, catalogo_json,
                menu_digital, json_override, custom_domain, status, last_edited_at, created_at
             FROM registraya_vcard_registros 
             WHERE slug = ? OR id = ? LIMIT 1`,
            [slug, slug]
        );

        if (rows && rows.length > 0) {
            if (rows[0].status === 'cancelado') {
                redirect('/catalog/activaqr-9ag4');
            }

            const { schemaJsonLd: generatedSchema } = buildClientSeoMetadata(rows[0], baseUrl, true);
            schemaJsonLd = generatedSchema;
        }
    } catch (err) {
        console.error('Error in CatalogPage server-side check:', err);
    }

    return (
        <>
            {schemaJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(schemaJsonLd).replace(/</g, '\\u003c')
                    }}
                />
            )}
            <VCardClient showCatalog={true} />
        </>
    );
}

