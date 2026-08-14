import { ClientProfileData } from './types';
import { classifyBusinessProfile } from './businessClassifier';

/**
 * Genera el marcado estructurado JSON-LD según el estándar de Schema.org para Google Rich Snippets.
 */
export function generateSchemaJsonLd(profile: ClientProfileData, baseUrl: string = 'https://www.activaqr.com'): Record<string, any> {
    const classification = classifyBusinessProfile(profile);
    const schemaType = classification.category;
    
    const displayName = profile.tipo_perfil === 'negocio'
        ? (profile.nombre_negocio || profile.nombre)
        : profile.nombre;

    const pageUrl = `${baseUrl}/card/${profile.slug}`;
    const catalogUrl = `${baseUrl}/catalog/${profile.slug}`;

    // Redes sociales para sameAs
    const sameAs: string[] = [];
    if (profile.instagram) sameAs.push(profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace('@', '')}`);
    if (profile.facebook) sameAs.push(profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`);
    if (profile.tiktok) sameAs.push(profile.tiktok.startsWith('http') ? profile.tiktok : `https://tiktok.com/@${profile.tiktok.replace('@', '')}`);
    if (profile.youtube) sameAs.push(profile.youtube.startsWith('http') ? profile.youtube : `https://youtube.com/${profile.youtube}`);
    if (profile.linkedin) sameAs.push(profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`);
    if (profile.x) sameAs.push(profile.x.startsWith('http') ? profile.x : `https://x.com/${profile.x.replace('@', '')}`);
    if (profile.google_business) sameAs.push(profile.google_business);
    if (profile.web) sameAs.push(profile.web.startsWith('http') ? profile.web : `https://${profile.web}`);

    // Imágenes para schema
    const images: string[] = [];
    if (profile.foto_url && profile.foto_url.startsWith('http')) images.push(profile.foto_url);
    if (profile.portada_desktop && profile.portada_desktop.startsWith('http')) images.push(profile.portada_desktop);
    if (profile.portada_movil && profile.portada_movil.startsWith('http')) images.push(profile.portada_movil);
    
    // Parse galeria_urls
    if (profile.galeria_urls) {
        try {
            const parsedGal = typeof profile.galeria_urls === 'string'
                ? JSON.parse(profile.galeria_urls)
                : profile.galeria_urls;
            if (Array.isArray(parsedGal)) {
                for (const img of parsedGal) {
                    if (typeof img === 'string' && img.startsWith('http')) {
                        images.push(img);
                    } else if (img && typeof img === 'object' && img.url && typeof img.url === 'string' && img.url.startsWith('http')) {
                        images.push(img.url);
                    }
                }
            }
        } catch {
            // ignore
        }
    }

    if (images.length === 0) {
        images.push(`${baseUrl}/api/og-image/${profile.slug}.jpg`);
    }

    // Descripción
    const description = profile.bio ||
        `${displayName} - ${classification.nichedTitleSuffix}. Contáctanos para más información o visita nuestro perfil digital interactivo.`;

    // Teléfono formateado
    let telephone = profile.whatsapp || '';
    if (telephone && !telephone.startsWith('+')) {
        telephone = `+593${telephone.replace(/^0+/, '')}`;
    }

    // Estructura base
    const baseSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        '@id': `${pageUrl}#identity`,
        name: displayName,
        alternateName: profile.nombre_negocio && profile.nombre !== profile.nombre_negocio ? profile.nombre : undefined,
        description: description,
        url: pageUrl,
        image: images,
        telephone: telephone || undefined,
        email: profile.email || undefined,
        sameAs: sameAs.length > 0 ? sameAs : undefined
    };

    // Agregar dirección si existe
    if (profile.direccion) {
        baseSchema.address = {
            '@type': 'PostalAddress',
            streetAddress: profile.direccion,
            addressCountry: 'EC'
        };
    }

    // Si tiene valoración de Google
    const ratingVal = typeof profile.google_rating === 'number'
        ? profile.google_rating
        : parseFloat(profile.google_rating || '0');
    const reviewsCount = typeof profile.google_reviews_count === 'number'
        ? profile.google_reviews_count
        : parseInt(profile.google_reviews_count || '0', 10);

    if (ratingVal > 0) {
        baseSchema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: ratingVal,
            reviewCount: reviewsCount > 0 ? reviewsCount : 1,
            bestRating: '5',
            worstRating: '1'
        };
    }

    // Si es Restaurante / Comida
    if (schemaType === 'Restaurant' || schemaType === 'FoodEstablishment' || schemaType === 'CafeOrCoffeeShop' || schemaType === 'BarOrPub') {
        if (classification.cuisineType) {
            baseSchema.servesCuisine = classification.cuisineType;
        }
        baseSchema.hasMenu = catalogUrl;
        baseSchema.priceRange = '$$';
        baseSchema.acceptsReservations = 'True';
    }

    // Extraer Catálogo o Menú Digital a OfferCatalog / Menu items para enriquecer el Schema
    const offerItems: any[] = [];

    // 1. De catalogo_json
    if (profile.catalogo_json) {
        try {
            const catObj = typeof profile.catalogo_json === 'string'
                ? JSON.parse(profile.catalogo_json)
                : profile.catalogo_json;

            if (catObj?.products && Array.isArray(catObj.products)) {
                for (const p of catObj.products.slice(0, 15)) {
                    if (p.name || p.nombre) {
                        offerItems.push({
                            '@type': 'Offer',
                            itemOffered: {
                                '@type': schemaType === 'Restaurant' ? 'MenuItem' : 'Product',
                                name: p.name || p.nombre,
                                description: p.description || p.descripcion || undefined,
                                image: p.image || p.imagen || undefined
                            },
                            price: p.price || p.precio ? String(p.price || p.precio).replace(/[^0-9.]/g, '') : undefined,
                            priceCurrency: 'USD'
                        });
                    }
                }
            }
        } catch {
            // ignore
        }
    }

    // 2. Si no hay productos en catálogo, extraer de productos_servicios como OfferCatalog
    if (offerItems.length === 0 && profile.productos_servicios) {
        const lines = profile.productos_servicios
            .split('\n')
            .map(l => l.replace(/^[-*•]\s*/, '').trim())
            .filter(Boolean)
            .slice(0, 10);

        for (const line of lines) {
            offerItems.push({
                '@type': 'Offer',
                itemOffered: {
                    '@type': 'Service',
                    name: line
                }
            });
        }
    }

    if (offerItems.length > 0) {
        baseSchema.hasOfferCatalog = {
            '@type': 'OfferCatalog',
            name: `Catálogo de ${displayName}`,
            itemListElement: offerItems
        };
    }

    // Limpiar claves undefined
    return JSON.parse(JSON.stringify(baseSchema));
}

/**
 * Genera el marcado BreadcrumbList para que Google muestre la jerarquía de navegación y sitelinks.
 */
export function generateBreadcrumbJsonLd(
    profile: ClientProfileData,
    baseUrl: string = 'https://www.activaqr.com',
    isCatalog: boolean = false
): Record<string, any> {
    const displayName = profile.tipo_perfil === 'negocio'
        ? (profile.nombre_negocio || profile.nombre)
        : profile.nombre;

    const pageUrl = `${baseUrl}/card/${profile.slug}`;
    const catalogUrl = `${baseUrl}/catalog/${profile.slug}`;

    const items: any[] = [
        {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: baseUrl
        }
    ];

    if (isCatalog) {
        items.push(
            {
                '@type': 'ListItem',
                position: 2,
                name: displayName,
                item: pageUrl
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: `Catálogo y Menú`,
                item: catalogUrl
            }
        );
    } else {
        items.push({
            '@type': 'ListItem',
            position: 2,
            name: displayName,
            item: pageUrl
        });
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items
    };
}

/**
 * Genera el payload @graph combinado con el Schema del Negocio y los Breadcrumbs en un único bloque estándar.
 */
export function generateCombinedSchemaJsonLd(
    profile: ClientProfileData,
    baseUrl: string = 'https://www.activaqr.com',
    isCatalog: boolean = false
): Record<string, any> {
    const businessSchema = generateSchemaJsonLd(profile, baseUrl);
    const breadcrumbSchema = generateBreadcrumbJsonLd(profile, baseUrl, isCatalog);

    return {
        '@context': 'https://schema.org',
        '@graph': [
            businessSchema,
            breadcrumbSchema
        ]
    };
}

