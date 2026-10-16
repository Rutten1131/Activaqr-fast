import type { Metadata } from 'next';
import { ClientProfileData, SeoConfig } from './types';
import { classifyBusinessProfile } from './businessClassifier';
import { generateCombinedSchemaJsonLd } from './schemaGenerator';

export function buildClientSeoMetadata(
    profile: ClientProfileData,
    baseUrl: string = 'https://www.activaqr.com',
    isCatalog: boolean = false
): {
    metadata: Metadata;
    schemaJsonLd: Record<string, any>;
} {
    const classification = classifyBusinessProfile(profile);
    
    // Parsear json_override para verificar si hay configuraciones de SEO manuales
    let seoConfig: SeoConfig = {};
    let customFaviconUrl: string | null = null;
    if (profile.json_override) {
        try {
            const parsed = typeof profile.json_override === 'string'
                ? JSON.parse(profile.json_override)
                : profile.json_override;
            if (parsed?.seo) {
                seoConfig = parsed.seo;
            }
            if (parsed?.custom_favicon) {
                customFaviconUrl = parsed.custom_favicon;
            }
        } catch {
            // ignore
        }
    }

    const displayName = profile.tipo_perfil === 'negocio'
        ? (profile.nombre_negocio || profile.nombre)
        : profile.nombre;

    // Determinar si es dominio personalizado del cliente
    const hasCustomDomain = Boolean(profile.custom_domain && profile.custom_domain.trim() !== '');

    // Determinar ciudad / ubicación si está presente en dirección
    let locationSuffix = '';
    if (profile.direccion) {
        const parts = profile.direccion.split(',').map(s => s.trim());
        if (parts.length > 0) {
            locationSuffix = ` en ${parts[parts.length - 1]}`;
        }
    }

    // Título optimizado (sin sufijo "- ActivaQR" si es custom domain)
    let title = seoConfig.customTitle;
    if (!title) {
        if (isCatalog) {
            title = hasCustomDomain
                ? `${displayName} | Catálogo Digital & Servicios${locationSuffix}`
                : `${displayName} | Catálogo Digital & Menú${locationSuffix} - ActivaQR`;
        } else {
            const niche = classification.nichedTitleSuffix;
            title = `${displayName} | ${niche}${locationSuffix} - Perfil Oficial`;
        }
    }

    // Meta Descripción optimizada
    let description = seoConfig.customDescription;
    if (!description) {
        if (isCatalog) {
            description = `Explora el catálogo oficial de ${displayName}. Descubre nuestros productos, servicios, promociones y haz tu pedido o reserva directamente por WhatsApp.`;
        } else if (profile.bio && profile.bio.length > 20) {
            description = hasCustomDomain
                ? `${profile.bio} Contacta con ${displayName} directamente.`
                : `${profile.bio} Contacta con ${displayName} directamente a través de su tarjeta digital interactiva ActivaQR.`;
        } else {
            const niche = classification.nichedTitleSuffix;
            description = `Conoce a ${displayName} (${niche}). Guarda mi contacto, consulta servicios, ubicación, redes y catálogo en un solo clic.`;
        }
    }

    // Keywords
    const keywordsSet = new Set<string>();
    if (seoConfig.customKeywords && Array.isArray(seoConfig.customKeywords)) {
        seoConfig.customKeywords.forEach(k => keywordsSet.add(k.trim()));
    } else {
        keywordsSet.add(displayName.toLowerCase());
        if (profile.nombre && profile.nombre !== displayName) keywordsSet.add(profile.nombre.toLowerCase());
        if (classification.nichedTitleSuffix) keywordsSet.add(classification.nichedTitleSuffix.toLowerCase());
        if (classification.cuisineType) keywordsSet.add(classification.cuisineType.toLowerCase());

        // Extraer de etiquetas
        if (profile.etiquetas) {
            profile.etiquetas.split(',').forEach(tag => {
                const t = tag.trim().toLowerCase();
                if (t) keywordsSet.add(t);
            });
        }

        // Extraer de productos_servicios
        if (profile.productos_servicios) {
            profile.productos_servicios.split('\n').slice(0, 8).forEach(line => {
                const clean = line.replace(/^[-*•]\s*/, '').trim().toLowerCase();
                if (clean && clean.length <= 40) keywordsSet.add(clean);
            });
        }

        keywordsSet.add('activaqr');
        keywordsSet.add('tarjeta digital');
        keywordsSet.add('contacto digital');
        keywordsSet.add('catalogo digital');
    }

    const keywords = Array.from(keywordsSet);

    // Versión para cache-busting en imágenes
    const version = profile.last_edited_at
        ? new Date(profile.last_edited_at).getTime().toString(36)
        : profile.slug.slice(-6);

    const ogImageUrl = `${baseUrl}/api/og-image/${profile.slug}.jpg?v=${version}`;

    const ogImages: any[] = [
        {
            url: ogImageUrl,
            secureUrl: ogImageUrl,
            width: 1200,
            height: 630,
            alt: displayName,
            type: 'image/jpeg',
        },
    ];

    if (profile.foto_url && profile.foto_url.startsWith('http')) {
        ogImages.push({
            url: profile.foto_url,
            secureUrl: profile.foto_url,
            width: 1200,
            height: 630,
            alt: displayName,
        });
    }

    const effectiveBaseUrl = profile.custom_domain
        ? `https://${profile.custom_domain.replace(/^https?:\/\//, '')}`
        : baseUrl;

    const canonicalUrl = profile.custom_domain
        ? effectiveBaseUrl
        : `${baseUrl}/${isCatalog ? 'catalog' : 'card'}/${profile.slug}`;

    // Determinar favicon del cliente
    // Prioridad 1: custom_favicon definido en json_override
    // Prioridad 2: foto_url (logo o foto de perfil del cliente) si tiene dominio propio
    // Fallback: /favicon.ico del sistema
    const clientFavicon = customFaviconUrl || (hasCustomDomain && profile.foto_url && profile.foto_url.startsWith('http') ? profile.foto_url : '/favicon.ico');

    const metadata: Metadata = {
        metadataBase: new URL(effectiveBaseUrl),
        title,
        description,
        keywords,
        icons: {
            icon: clientFavicon,
            shortcut: clientFavicon,
            apple: clientFavicon,
        },
        alternates: {
            canonical: canonicalUrl,
            languages: {
                'es-EC': canonicalUrl,
                'es': canonicalUrl,
            }
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            siteName: hasCustomDomain ? displayName : 'ActivaQR',
            locale: 'es_EC',
            type: isCatalog ? 'website' : 'profile',
            images: ogImages,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
        },
        robots: {
            index: seoConfig.enableIndexed !== false,
            follow: seoConfig.enableIndexed !== false,
            googleBot: {
                index: seoConfig.enableIndexed !== false,
                follow: seoConfig.enableIndexed !== false,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        other: {
            'og:image:width': '1200',
            'og:image:height': '630',
        },
    };

    const schemaJsonLd = generateCombinedSchemaJsonLd(profile, effectiveBaseUrl, isCatalog);

    return {
        metadata,
        schemaJsonLd,
    };
}

