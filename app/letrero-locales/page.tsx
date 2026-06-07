import { Metadata } from 'next';
import LetreroLocalesClient from './LetreroLocalesClient';

export const metadata: Metadata = {
    title: 'Letrero QR para Locales — Que entren más clientes | ActivaQR',
    description: 'Letrero + QR que detiene clientes, muestra tu catálogo y recibe pedidos por WhatsApp. $200 al año. Se paga solo en 17 días.',
};

export default function LetreroLocalesPage() {
    return <LetreroLocalesClient />;
}
