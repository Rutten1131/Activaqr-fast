"use client";
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import Script from 'next/script';

const HIDDEN_LAYOUT_ROUTES = [
    '/demo', 
    '/hedkandi', 
    '/auditoria-operativa/v2', 
    '/auditoria-operativa', 
    '/contacto-digital-v2', 
    '/contacto-business-v2', 
    '/contacto-business-catalogo-v2', 
    '/sitio-web-completo-v2',
    '/contacto-digital-producto',
    '/contacto-business-producto',
    '/contacto-business-catalogo-producto',
    '/sitio-web-completo-producto',
    '/card',
    '/catalog',
    '/menu',
    '/solidario-nestor'
];

function isHiddenRoute(pathname: string | null): boolean {
    return HIDDEN_LAYOUT_ROUTES.some(r => pathname?.startsWith(r));
}

export function HeaderWrapper() {
    const pathname = usePathname();
    if (isHiddenRoute(pathname)) return null;
    return <Navbar />;
}

export function FooterWrapper() {
    const pathname = usePathname();
    if (isHiddenRoute(pathname)) return null;
    return <Footer />;
}

export function WhatsAppWidgetWrapper() {
    const pathname = usePathname();
    if (isHiddenRoute(pathname)) return null;
    return (
        <Script
          src="/widget.js"
          data-phone="593963425323"
          data-message="Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20ActivaQR"
          data-position="right"
          data-color="#25D366"
          data-brand="ActivaQR"
          data-api={process.env.NEXT_PUBLIC_WIDGET_API_URL || "https://www.activaqr.com/api/widget"}
          strategy="lazyOnload"
        />
    );
}

