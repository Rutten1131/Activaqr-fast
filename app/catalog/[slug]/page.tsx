import type { Metadata } from "next";
import VCardClient from "@/app/card/[slug]/VCardClient";
import pool from "@/lib/db";
import { redirect } from "next/navigation";
import { buildClientSeoMetadata } from "@/lib/seo/metadataHelper";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> | { slug: string } }): Promise<Metadata> {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.activaqr.com';

    try {
        const [rows]: any = await pool.execute(
            `SELECT 
                id, slug, nombre, profesion, empresa, bio, direccion, web, whatsapp, email, 
                google_business, instagram, linkedin, facebook, tiktok, youtube, x, productos_servicios, 
                plan, foto_url, galeria_urls, status, tipo_perfil, nombres, apellidos, 
                nombre_negocio, contacto_nombre, contacto_apellido, etiquetas, created_at,
                menu_digital, wifi_ssid, wifi_password, portada_desktop, portada_movil,
                hero_button_text, hero_action, hero_file_url, hero_external_link, 
                hero_wifi_steps, hero_section_title, hero_step1_title, hero_step1_text,
                hero_step2_title, hero_step2_text, hero_step3_title, 
                hero_step3_text, catalogo_json, youtube_video_url,
                google_rating, google_reviews_count, hero_slides_json, template_id, json_override,
                custom_domain, last_edited_at
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
    let initialData: any = null;

    try {
        const [rows]: any = await pool.execute(
            `SELECT 
                id, slug, nombre, profesion, empresa, bio, direccion, web, whatsapp, email, 
                google_business, instagram, linkedin, facebook, tiktok, youtube, x, productos_servicios, 
                plan, foto_url, galeria_urls, status, tipo_perfil, nombres, apellidos, 
                nombre_negocio, contacto_nombre, contacto_apellido, etiquetas, created_at,
                menu_digital, wifi_ssid, wifi_password, portada_desktop, portada_movil,
                hero_button_text, hero_action, hero_file_url, hero_external_link, 
                hero_wifi_steps, hero_section_title, hero_step1_title, hero_step1_text,
                hero_step2_title, hero_step2_text, hero_step3_title, 
                hero_step3_text, catalogo_json, youtube_video_url,
                google_rating, google_reviews_count, hero_slides_json, template_id, json_override,
                custom_domain, last_edited_at
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
            // Serializamos para pasar como prop al cliente (fechas → strings)
            initialData = JSON.parse(JSON.stringify(rows[0]));
        }
    } catch (err) {
        console.error('Error in CatalogPage server-side check:', err);
    }

    // Preparar datos semánticos para indexación por LLMs (ChatGPT, Perplexity, Claude, Google)
    const displayName = initialData?.tipo_perfil === 'negocio'
        ? (initialData?.nombre_negocio || initialData?.nombre)
        : initialData?.nombre;

    let catalogProducts: any[] = [];
    if (initialData?.catalogo_json) {
        try {
            const parsedCat = typeof initialData.catalogo_json === 'string'
                ? JSON.parse(initialData.catalogo_json)
                : initialData.catalogo_json;
            if (Array.isArray(parsedCat?.products)) {
                catalogProducts = parsedCat.products;
            }
        } catch {
            // ignore
        }
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
            
            {/* 🤖 Bloque semántico Server-Side para indexación profunda por LLMs y Motores de Búsqueda */}
            {initialData && (
                <section
                    style={{
                        position: 'absolute',
                        left: '-10000px',
                        top: 'auto',
                        width: '1px',
                        height: '1px',
                        overflow: 'hidden',
                    }}
                    aria-hidden="true"
                >
                    <h1>{displayName}</h1>
                    {initialData.profesion && <p><strong>Especialidad:</strong> {initialData.profesion}</p>}
                    {initialData.bio && <p><strong>Descripción:</strong> {initialData.bio}</p>}
                    {initialData.direccion && <p><strong>Ubicación:</strong> {initialData.direccion}</p>}
                    {initialData.whatsapp && <p><strong>Contacto / WhatsApp:</strong> {initialData.whatsapp}</p>}
                    {initialData.email && <p><strong>Correo electrónico:</strong> {initialData.email}</p>}
                    
                    {initialData.productos_servicios && (
                        <div>
                            <h2>Servicios y Tratamientos Principales</h2>
                            <p>{initialData.productos_servicios}</p>
                        </div>
                    )}

                    {catalogProducts.length > 0 && (
                        <div>
                            <h2>Catálogo Oficial de Productos y Servicios</h2>
                            <ul>
                                {catalogProducts.map((prod: any, idx: number) => (
                                    <li key={idx}>
                                        <h3>{prod.name || prod.nombre}</h3>
                                        {(prod.price || prod.precio) && <p>Precio: ${prod.price || prod.precio}</p>}
                                        {(prod.description || prod.descripcion) && <p>{prod.description || prod.descripcion}</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            )}

            <VCardClient showCatalog={true} initialData={initialData} />
        </>
    );
}


