import React from 'react';
import { Smartphone, MessageSquare, ShoppingBag, Monitor, ShieldCheck } from 'lucide-react';

export interface PlanFeature {
  text: string;
}

export interface Plan {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  period: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  image: string;
  color: 'primary' | 'navy' | 'black';
  cta: string;
  link: string;
  badge?: string;
  isFeatured?: boolean;
}

export const PLANES_DATA: Plan[] = [
  {
    id: 'digital',
    name: 'Contacto Digital',
    subtitle: 'Para Profesionales',
    price: '35',
    period: '/año',
    icon: <Smartphone size={28} />,
    description: 'Instala tu contacto directamente en la agenda de tus clientes — con tu foto, tu nombre y lo que haces.',
    features: ['Agenda Digital con Foto', 'Redes Sociales Ilimitadas', 'QR Dinámico Premium'],
    image: '/images/Reingenierìa/Portadas%20tipo%20historia/card_35_contacto.webp',
    color: 'primary',
    cta: 'Empezar ahora',
    link: '/contacto-digital-v2'
  },
  {
    id: 'business',
    name: 'Contacto Business',
    subtitle: 'Negocios & Marcas',
    price: '100',
    period: '/año',
    badge: '⭐ Opción Inteligente',
    icon: <MessageSquare size={32} />,
    description: 'Subes una imagen, un video o una oferta desde tu teléfono y en 10 segundos tus clientes ya lo ven cuando escanean tu QR.',
    features: ['Todo lo del plan Digital', 'Actualización en 10s', 'Promociones del Día'],
    image: '/images/Reingenierìa/Portadas%20tipo%20historia/card_100_business.webp',
    color: 'primary',
    cta: 'Activar Negocio',
    link: '/contacto-digital-v2',
    isFeatured: true
  },
  {
    id: 'catalogo',
    name: 'Business + Catálogo',
    subtitle: 'Para Ventas Online',
    price: '200',
    period: '/año',
    icon: <ShoppingBag size={28} />,
    description: 'Tus productos con foto y precio. Tu cliente elige y el pedido llega organizado a tu WhatsApp listo para despachar.',
    features: ['Todo lo del plan Business', 'Catálogo con Foto y Precio', 'Pedidos vía WhatsApp'],
    image: '/images/Reingenierìa/Portadas%20tipo%20historia/card_200_catalogo.webp',
    color: 'primary',
    cta: 'Crear Catálogo',
    link: '/sitio-web-completo-v2'
  },
  {
    id: 'auditoria',
    name: '¿Qué pasa ahora mismo en tu negocio?',
    subtitle: 'Antes de que llegue a Google.',
    price: '',
    period: '',
    icon: <ShieldCheck size={28} />,
    description: 'Sabe exactamente qué pasó, quién estaba y con qué evidencia — sin preguntarle a nadie.',
    features: [],
    image: '/images/Reingenierìa/slide_activaqr2/costo_oculto_retail.webp',
    color: 'black',
    cta: 'Audita tu negocio hoy →',
    link: '/auditoria-operativa'
  },
  {
    id: 'web',
    name: 'Sitio Web Completo',
    subtitle: 'White Glove Service',
    price: '1,000',
    period: '/único',
    icon: <Monitor size={28} />,
    description: 'Tienda en línea con 50 productos listos para vender automatizada. Construimos tu ecosistema digital completo.',
    features: ['Hasta 8 Paginas Pro', 'E-commerce & Pasarela', 'SEO & Carga Ultrarrápida'],
    image: '/images/Reingenierìa/Portadas%20tipo%20historia/card_1000_ecommerce.webp',
    color: 'navy',
    cta: 'Solicitar Cotización',
    link: '/sitio-web-completo-producto'
  }
];
