"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const isTaxiPage = pathname === '/para-taxis-y-camionetas';
    const isCatalog = false; // Disable hiding on catalog as per user request

    if (isTaxiPage) return null;

    return (
        <footer className="py-20 bg-[#050505] relative overflow-hidden border-t border-white/5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF6B2B]/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
                    <div className="max-w-xs">
                        <img 
                            src="/images/logo_header.png" 
                            alt="ActivaQR" 
                            className="h-7 w-auto mb-6 brightness-0 invert opacity-80"
                        />
                        <p className="text-[11px] font-medium text-white/70 leading-relaxed uppercase tracking-wider">
                            Protegemos tu identidad profesional y aseguramos que siempre seas el primero en la mente de tus clientes.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Plataforma</span>
                            <Link href="/blog" className="text-[11px] font-bold text-white hover:text-[#FF6B2B] transition-colors">Blog</Link>
                            <Link href="/diagnostico" className="text-[11px] font-bold text-white hover:text-[#FF6B2B] transition-colors">Diagnóstico</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Soluciones</span>
                            <Link href="/contacto-digital-v2" className="text-[11px] font-bold text-white hover:text-[#FF6B2B] transition-colors">V2 Experience</Link>
                            <Link href="/contacto-digital-producto" className="text-[11px] font-bold text-white hover:text-[#FF6B2B] transition-colors">Producto</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Comercial</span>
                            <Link href="/ventas" className="text-[11px] font-black text-[#FF6B2B] hover:text-white transition-colors uppercase tracking-widest">Ventas VIP</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Legal</span>
                            <Link href="/terminos" className="text-[11px] font-bold text-white hover:text-[#FF6B2B] transition-colors">Términos</Link>
                            <Link href="/privacidad" className="text-[11px] font-bold text-white hover:text-[#FF6B2B] transition-colors">Privacidad</Link>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                        © 2026 · Activa<span className="text-[#FF6B2B] italic">QR</span> · Identidad Estratégica.
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                        Built by <a href="https://www.cesarreyesjaramillo.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#FF6B2B] transition-colors">César Reyes Jaramillo</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
