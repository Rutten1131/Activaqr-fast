"use client";
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

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
