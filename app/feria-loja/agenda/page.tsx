import { Metadata } from 'next';
import AgendaClient from './AgendaClient';
import { FERIA_AGENDA_DATA } from '@/lib/feriaAgendaData';

export const metadata: Metadata = {
    title: 'Agenda y Conciertos — 197ª Feria de Loja 2025 | Cartelera y Horarios',
    description: 'Cronograma completo de conciertos, noches culturales, cata de café y eventos de la 197ª Feria de Loja. Revisa las fechas, artistas y escenarios oficiales.',
    keywords: 'agenda feria de loja 2025, conciertos feria de loja, artistas feria loja, programacion feria de loja, festival cafe loja, activaqr',
    openGraph: {
        title: 'Agenda de Conciertos & Eventos | 197ª Feria de Loja 2025',
        description: 'No te pierdas ningún concierto. Conoce la cartelera oficial y apoya a los expositores en la votación digital.',
        images: ['/images/ActivaQR_hero.webp'],
    },
    alternates: {
        canonical: 'https://activaqr.com/feria-loja/agenda',
    }
};

export default function FeriaAgendaPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Agenda de Conciertos y Eventos - 197ª Feria de Loja 2025',
        startDate: '2025-08-28',
        endDate: '2025-09-21',
        location: {
            '@type': 'Place',
            name: 'Complejo Ferial Simón Bolívar',
            address: {
                '@type': 'PostalAddress',
                addressLocality: 'Loja',
                addressRegion: 'Loja',
                addressCountry: 'EC'
            }
        },
        subEvent: FERIA_AGENDA_DATA.map((evt) => ({
            '@type': 'Event',
            name: evt.titulo,
            startDate: `${evt.fecha}T${evt.hora.split(' ')[0]}:00`,
            description: evt.descripcion,
            performer: evt.artistas?.map((art) => ({
                '@type': 'PerformingGroup',
                name: art
            }))
        }))
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <AgendaClient />
        </>
    );
}
