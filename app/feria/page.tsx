import { Metadata } from 'next';
import FeriaPageClient from './FeriaPageClient';

export const metadata: Metadata = {
    title: 'Inscripción Competencia 197 Feria de Loja | ActivaQR',
    description: 'Registra tu negocio o stand en la Feria de Loja #197, descarga tu código QR oficial y recibe votos del público directamente por WhatsApp.',
    openGraph: {
        title: 'Competencia Oficial 197 Feria de Loja | ActivaQR',
        description: 'Inscribe tu stand y compite por ser el negocio más votado de la feria.',
        images: ['/images/ActivaQR_hero.webp'],
    }
};

export default function FeriaPage() {
    return <FeriaPageClient />;
}
