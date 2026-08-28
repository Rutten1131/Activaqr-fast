import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import FichaClient from './FichaClient';

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getExpositor(slug: string) {
    try {
        const [rows]: any = await pool.query(
            `SELECT id, slug, nombre_negocio, nombre_representante, telefono_negocio, 
                    numero_stand, categoria, origen, anios_trayectoria, slogan, 
                    descripcion_historia, materiales_ingredientes, promocion_feria, 
                    productos_json, instagram_url, facebook_url, tiktok_url, 
                    logo_url, portada_url, google_reviews_url, total_votos, 
                    total_votos_verificados, is_active, created_at
             FROM feria_negocios
             WHERE slug = ? LIMIT 1`,
            [slug]
        );
        if (rows.length > 0) return rows[0];
    } catch (e) {
        console.error('Error fetching expositor:', e);
    }
    return null;
}

async function getRelatedExpositores(categoria: string, currentId: number) {
    try {
        const [rows]: any = await pool.query(
            `SELECT id, slug, nombre_negocio, numero_stand, categoria, origen, logo_url, portada_url, total_votos
             FROM feria_negocios
             WHERE categoria = ? AND id != ? AND is_active = 1
             ORDER BY total_votos DESC
             LIMIT 3`,
            [categoria || 'artesanias', currentId]
        );
        return rows || [];
    } catch (e) {
        return [];
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const expositor = await getExpositor(slug);

    if (!expositor) {
        return {
            title: 'Stand no encontrado | 197ª Feria de Loja',
        };
    }

    const catName = expositor.categoria ? expositor.categoria.toUpperCase() : 'EXPOSITOR';
    const title = `${expositor.nombre_negocio} — ${catName} | 197ª Feria de Loja`;
    const desc = expositor.slogan
        ? `${expositor.slogan}. Visítanos en el ${expositor.numero_stand || 'stand oficial'} de la 197ª Feria de Loja.`
        : expositor.descripcion_historia
        ? expositor.descripcion_historia.slice(0, 160)
        : `Conoce a ${expositor.nombre_negocio} en el ${expositor.numero_stand || 'stand oficial'} de la 197ª Feria de Loja. Vota en 1 clic y apoya su emprendimiento.`;

    return {
        title,
        description: desc,
        keywords: `${expositor.nombre_negocio}, ${expositor.categoria}, feria de loja 2025, stand ${expositor.numero_stand || ''}, artesanias loja`,
        openGraph: {
            title,
            description: desc,
            images: expositor.portada_url ? [expositor.portada_url] : expositor.logo_url ? [expositor.logo_url] : ['/images/ActivaQR_hero.webp'],
        },
        alternates: {
            canonical: `https://activaqr.com/feria-loja/${slug}`,
        }
    };
}

export default async function ExpositorFichaPage({ params }: PageProps) {
    const { slug } = await params;
    const expositor = await getExpositor(slug);

    if (!expositor || !expositor.is_active) {
        notFound();
    }

    const related = await getRelatedExpositores(expositor.categoria, expositor.id);

    let productosParsed: any[] = [];
    try {
        if (expositor.productos_json) {
            productosParsed = typeof expositor.productos_json === 'string' ? JSON.parse(expositor.productos_json) : expositor.productos_json;
        }
    } catch (e) {}

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: expositor.nombre_negocio,
        description: expositor.slogan || expositor.descripcion_historia || `Expositor en la 197ª Feria de Loja. ${expositor.numero_stand || ''}`,
        image: expositor.logo_url || expositor.portada_url || 'https://activaqr.com/images/ActivaQR_hero.webp',
        telephone: expositor.telefono_negocio || undefined,
        url: `https://activaqr.com/feria-loja/${slug}`,
        address: {
            '@type': 'PostalAddress',
            streetAddress: `Stand ${expositor.numero_stand || 'Principal'} - Complejo Ferial Simón Bolívar`,
            addressLocality: expositor.origen || 'Loja',
            addressCountry: 'EC'
        },
        sameAs: [
            expositor.instagram_url,
            expositor.facebook_url,
            expositor.tiktok_url
        ].filter(Boolean),
        makesOffer: productosParsed.map((p: any) => ({
            '@type': 'Offer',
            itemOffered: {
                '@type': 'Product',
                name: p.nombre,
                description: p.descripcion,
                image: p.foto_url
            },
            price: p.precio || undefined,
            priceCurrency: 'USD'
        }))
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <FichaClient expositor={expositor} related={related} productos={productosParsed} />
        </>
    );
}
