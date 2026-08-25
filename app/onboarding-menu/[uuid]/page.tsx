import { Metadata } from 'next';
import RestaurantOnboardingClient from '@/components/onboarding/RestaurantOnboardingClient';

export const metadata: Metadata = {
    title: 'Onboarding & Entrega de Materiales | ActivaQR Menú',
    description: 'Entrega la información, carta y fotos de tu restaurante para la implementación de tu Menú Interactivo.',
};

export default async function OnboardingMenuPage({
    params,
}: {
    params: Promise<{ uuid: string }>;
}) {
    const { uuid } = await params;

    return <RestaurantOnboardingClient uuid={uuid} />;
}
