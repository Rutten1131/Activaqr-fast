import { Metadata } from 'next';
import PropuestaClient from './PropuestaClient';

export const metadata: Metadata = {
    title: 'Propuesta de Colaboración Institucional — 197.ª Feria de Loja | ActivaQR',
    description: 'Propuesta oficial de concurso para artesanos con votación digital, directorio de expositores y premios tecnológicos para la 197.ª Feria de Loja.',
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: 'Propuesta de Colaboración — 197.ª Feria de Loja | ActivaQR',
        description: 'Iniciativa digital gratuita para artesanos y expositores: Directorio interactivo, dinámica de votación y $600 en premios tecnológicos.',
        images: ['/images/ActivaQR_hero.webp'],
    },
    alternates: {
        canonical: 'https://activaqr.com/feria-loja/propuesta',
    }
};

export default function PropuestaPage() {
    return <PropuestaClient />;
}
