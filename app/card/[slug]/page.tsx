import type { Metadata } from "next";
import VCardClient from "./VCardClient";
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
            const { metadata } = buildClientSeoMetadata(client, baseUrl, false);
            return metadata;
        }
    } catch (err) {
        console.error('Error generating dynamic SEO metadata:', err);
    }

    // Fallback if client not found or error
    const name = slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    return {
        metadataBase: new URL(baseUrl),
        title: `${name} | Perfil y Contacto Digital - ActivaQR`,
        description: `Conéctate con ${name}. Escanea el código QR para guardar mi contacto profesional directamente en tu teléfono.`,
        openGraph: {
            title: `${name} - Contacto Digital ActivaQR`,
            description: `Guarda mi contacto profesional con un solo clic.`,
            url: `${baseUrl}/card/${slug}`,
            type: 'profile',
            images: [
                {
                    url: `${baseUrl}/images/og-preview.jpg`,
                    width: 1200,
                    height: 630,
                    alt: name,
                    type: 'image/jpeg',
                }
            ]
        },
        twitter: {
            card: 'summary_large_image',
            title: `${name} - Contacto Digital ActivaQR`,
            images: [`${baseUrl}/images/og-preview.jpg`],
        }
    };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
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
                redirect('/card/activaqr-9ag4');
            }

            const { schemaJsonLd: generatedSchema } = buildClientSeoMetadata(rows[0], baseUrl, false);
            schemaJsonLd = generatedSchema;
        }
    } catch (err) {
        console.error('Error in Page server-side check and schema generation:', err);
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
            <VCardClient />
        </>
    );
}

