import type { Metadata } from "next";
import pool from "@/lib/db";
import { redirect } from "next/navigation";
import { buildClientSeoMetadata } from "@/lib/seo/metadataHelper";
import MenuClient from "./MenuClient";

export const revalidate = 60;

const QUERY = `
    SELECT 
        id, slug, nombre, nombre_negocio, tipo_perfil, profesion, empresa, bio, 
        direccion, web, whatsapp, email, google_business, google_rating, google_reviews_count,
        instagram, facebook, tiktok, youtube, linkedin, x, productos_servicios, etiquetas,
        plan, foto_url, galeria_urls, portada_desktop, portada_movil, catalogo_json,
        menu_digital, json_override, last_edited_at, created_at
     FROM registraya_vcard_registros 
     WHERE slug = ? OR id = ? LIMIT 1
`;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.activaqr.com";

    try {
        const [rows]: any = await pool.execute(QUERY, [slug, slug]);

        if (rows && rows.length > 0) {
            const client = rows[0];
            const displayName =
                client.tipo_perfil === "negocio"
                    ? client.nombre_negocio || client.nombre
                    : client.nombre;

            const baseMetadata = buildClientSeoMetadata(client, baseUrl, true);

            // Personalizar título para la ruta /menu
            return {
                ...baseMetadata.metadata,
                title: `${displayName} | Menú / Catálogo Digital — ActivaQR`,
                description: `Explora el menú y catálogo de productos de ${displayName}. Precios, fotos y pedidos por WhatsApp.`,
            };
        }
    } catch (err) {
        console.error("[MenuPage] Error generating metadata:", err);
    }

    const name = slug
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");

    return {
        metadataBase: new URL(baseUrl),
        title: `${name} | Menú Digital - ActivaQR`,
        description: `Explora el catálogo de productos y menú digital de ${name}.`,
        openGraph: {
            title: `${name} - Menú Digital`,
            description: `Catálogo interactivo de productos y servicios.`,
            url: `${baseUrl}/menu/${slug}`,
            type: "website",
            images: [
                {
                    url: `${baseUrl}/og-default.png`,
                    width: 800,
                    height: 800,
                    alt: "ActivaQR",
                    type: "image/png",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${name} - Menú Digital`,
            images: [`${baseUrl}/og-default.png`],
        },
    };
}

export default async function MenuPage({
    params,
}: {
    params: Promise<{ slug: string }> | { slug: string };
}) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.activaqr.com";

    let schemaJsonLd: Record<string, any> | null = null;

    try {
        const [rows]: any = await pool.execute(
            `SELECT 
                id, slug, nombre, nombre_negocio, tipo_perfil, profesion, empresa, bio, 
                direccion, web, whatsapp, email, google_business, google_rating, google_reviews_count,
                instagram, facebook, tiktok, youtube, linkedin, x, productos_servicios, etiquetas,
                plan, foto_url, galeria_urls, portada_desktop, portada_movil, catalogo_json,
                menu_digital, json_override, status, last_edited_at, created_at
             FROM registraya_vcard_registros 
             WHERE slug = ? OR id = ? LIMIT 1`,
            [slug, slug]
        );

        if (rows && rows.length > 0) {
            if (rows[0].status === "cancelado") {
                redirect("/catalog/activaqr-9ag4");
            }

            const { schemaJsonLd: generatedSchema } = buildClientSeoMetadata(
                rows[0],
                baseUrl,
                true
            );
            schemaJsonLd = generatedSchema;
        }
    } catch (err) {
        console.error("[MenuPage] Error in server-side check:", err);
    }

    return (
        <>
            {schemaJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(schemaJsonLd).replace(/</g, "\\u003c"),
                    }}
                />
            )}
            <MenuClient />
        </>
    );
}
