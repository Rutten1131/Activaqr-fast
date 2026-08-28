import { Metadata } from 'next';
import FeriaHubClient from './FeriaHubClient';

export const metadata: Metadata = {
    title: '197ª Feria de Loja 2025: Agenda, Conciertos y Expositores | Votación Oficial',
    description: 'Guía digital oficial de la 197ª Feria de Loja: agenda de conciertos, catálogo de expositores, artesanos y votación en vivo para elegir a los mejores stands.',
    keywords: 'feria de loja 2025, conciertos feria de loja, expositores feria de loja, artesanias loja, agenda feria de loja, activaqr',
    openGraph: {
        title: '197ª Feria de Loja 2025 | Agenda, Conciertos y Votación Oficial',
        description: 'Vota por tu stand favorito, descubre el cronograma de conciertos y explora a todos los emprendedores de la Feria de Loja.',
        images: ['/images/ActivaQR_hero.webp'],
    },
    alternates: {
        canonical: 'https://activaqr.com/feria-loja',
    }
};

export default function FeriaLojaHubPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: '197ª Feria de Loja 2025',
        startDate: '2025-08-28',
        endDate: '2025-09-21',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
            '@type': 'Place',
            name: 'Complejo Ferial Simón Bolívar',
            address: {
                '@type': 'PostalAddress',
                streetAddress: 'Av. Salvador Bustamante Celi',
                addressLocality: 'Loja',
                addressRegion: 'Loja',
                addressCountry: 'EC'
            }
        },
        organizer: {
            '@type': 'Organization',
            name: 'Corporación de Ferias de Loja',
            url: 'https://cfloja.org'
        },
        description: 'Directorio digital, agenda de conciertos y votación oficial de los expositores de la 197ª Feria de Loja, impulsada por ActivaQR.'
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <FeriaHubClient />
        </>
    );
}
