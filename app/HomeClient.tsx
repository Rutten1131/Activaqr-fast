"use client";

import { useState, useEffect } from "react";
import {
    CheckCircle2,
    Phone,
    ArrowRight,
    Smartphone,
    MessageSquare,
    Users,
    Star,
    ShieldCheck,
    ChevronRight,
    Edit,
    CheckCircle,
    FileText
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import VideoModal from "@/components/VideoModal";
import PopupManager from "@/components/PopupManager";
import EditPortalModal from "@/components/EditPortalModal";
import FloatingSalesHeader from "@/components/FloatingSalesHeader";
import QuoteModal from "@/components/QuoteModal";
import { PricingSection } from "@/components/PricingSection/PricingSection";
import { AdvancedFAQ, FAQItem } from "@/components/AdvancedFAQ/AdvancedFAQ";
import ReviewsSection from "@/components/ReviewsSection";

const HOME_FAQS: FAQItem[] = [
    {
        id: "faq-wpp",
        tag: "WHATSAPP",
        q: "¿Para qué necesito esto si ya tengo WhatsApp?",
        bullets: [
            "Evitas perder clientes que olvidan tu nombre",
            "Guardado automático con foto, mapa y redes",
            "Destacas inmediatamente frente a la competencia",
            "Presencia profesional 24/7 en su bolsillo"
        ],
        videoSourceType: "bunny",
        videoUrl: "b473d784-04bc-47f4-bcae-c2bd51752b31",
        ctaText: "Acelerar mi Posicionamiento"
    },
    {
        id: "faq-scan",
        tag: "USABILIDAD",
        q: "¿Mis clientes no saben escanear un QR?",
        bullets: [
            "Compatibilidad nativa con la cámara del 90% de celulares",
            "Compartible desde un enlace directo por WhatsApp",
            "Archivo inteligente descargable sin fricción",
            "Plantilla de auto-respuesta para tus clientes"
        ],
        videoSourceType: "bunny",
        videoUrl: "9278c314-648f-4220-b1d4-b2c94535ffa8",
        ctaText: "Eliminar la Fricción de Venta"
    },
    {
        id: "faq-cambio",
        tag: "ACTUALIZACIÓN",
        q: "¿Y si cambio de número o de trabajo?",
        bullets: [
            "Sistema 100% editable en cualquier momento",
            "Ingresas, editas y tu QR estará inmediatamente actualizado",
            "Tus tarjetas impresas jamás volverán a ser basura",
            "Proteges tu inversión para toda la vida"
        ],
        videoSourceType: "bunny",
        videoUrl: "191c563b-d77d-4620-b775-0d5b659e28fe",
        ctaText: "Blindar mi Inversión Hoy"
    },
    {
        id: "faq-metricas",
        tag: "MÉTRICAS",
        q: "¿Cómo sé que mis clientes realmente lo están usando?",
        bullets: [
            "Panel de analíticas y conversiones integrado",
            "Reporte detallado de perfiles vistos y descargados",
            "Balance mensual de resultados por correo electrónico",
            "Mides el impacto real de tu trabajo de ventas"
        ],
        videoSourceType: "bunny",
        videoUrl: "516952e4-63b3-4a20-8327-c6b8656d6456",
        ctaText: "Empezar a Medir mi Impacto"
    },
    {
        id: "faq-diferencia",
        tag: "COMPARACIÓN",
        q: "Ya tengo una tarjeta con QR — ¿en qué se diferencia esto?",
        bullets: [
            "ActivaQR inyecta tu perfil directo en la agenda, no solo abre un link",
            "No enviamos tráfico vacío a Instagram o Linktree",
            "Herramienta diseñada para retener, no solo para impresionar",
            "Tu mejor currículum de ventas a un solo toque"
        ],
        videoSourceType: "bunny",
        videoUrl: "d33fc8ea-f301-42ac-89e3-60b3b3ee56fb",
        ctaText: "Apostar por Conversiones Reales"
    },
    {
        id: "faq-profesion",
        tag: "URGENCIAS",
        q: "¿Vale la pena para mi profesión específica?",
        bullets: [
            "Crucial para profesiones de alta urgencia (Servicios, Salud, Mantenimiento)",
            "Te rescata del cementerio de los 'chats archivados'",
            "Estratega de posicionamiento en el subconsciente de tu cliente",
            "Un escudo retentivo a prueba de la competencia"
        ],
        videoSourceType: "bunny",
        videoUrl: "4b1d000d-878e-417a-871a-0a45192f2cd9",
        ctaText: "Proteger mi Prestigio Profesional"
    }
];

export default function HomeClient() {
    useEffect(() => {
        // Estilos para ocultar scrollbars pero mantener funcionalidad
        const style = document.createElement('style');
        style.textContent = `
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `;
        document.head.append(style);
        return () => style.remove();
    }, []);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [isFloatingVisible, setIsFloatingVisible] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);


    useEffect(() => {
        // Auto-play para el carrusel (5 segundos)
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === 2 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Check if URL has #editar and open modal
        if (typeof window !== 'undefined' && window.location.hash === '#editar') {
            setIsEditModalOpen(true);
        }
    }, []);

    useEffect(() => {
        let scrollTimeout: NodeJS.Timeout;
        const handleScroll = () => {
            setIsFloatingVisible(false);
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                setIsFloatingVisible(true);
            }, 800);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, []);

    return (
        <main className="min-h-screen bg-background selection:bg-primary/30 scroll-smooth relative overflow-x-hidden font-sans text-foreground">

            {/* Hero Section: Premium Horizontal Split */}
            <section className="relative min-h-screen w-full overflow-hidden flex items-center bg-background section-dark">
                {/* Background Image Container - Right Aligned & Full Height */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/Reingenierìa/v2_tarjetas_mano.webp"
                        alt="ActivaQR - El poder del contacto digital"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Subtle Overlay to ensure overall branding consistency */}
                    <div className="absolute inset-0 bg-background/20 lg:bg-transparent"></div>
                </div>

                <div className="container mx-auto relative z-20 px-6 md:px-12 py-20 lg:py-32">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-3xl glass-card p-8 md:p-12 rounded-premium shadow-2xl shadow-black/20"
                    >
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 bg-[#050505] text-white px-4 py-2 rounded-full shadow-lg mb-8"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Identidad Digital</span>
                        </motion.div>
    
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-6xl font-black text-foreground leading-[1.05] mb-6 tracking-tighter"
                        >
                          <span style={{
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            opacity: 0.55,
                            display: 'block',
                            marginBottom: '0.5rem'
                          }}>
                            Contacto digital con QR — identidad profesional instalable en agenda
                          </span>
                            Tu negocio instalado en la agenda de tu cliente, <span className="text-primary italic">hoy mismo.</span>
                        </motion.h1>
    
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-base md:text-lg text-foreground/70 mb-10 leading-relaxed font-medium max-w-xl"
                        >
                            Deja de repartir papeles que terminan en el suelo. Con ActivaQR tu negocio se instala directamente en la agenda de tus clientes.
                        </motion.p>
    
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-5 justify-start items-center"
                        >
                            <a
                                href="/registro"
                                className="w-full sm:w-auto bg-primary text-white px-10 py-6 rounded-full font-black text-xl shadow-2xl shadow-primary/30 hover:translate-y-[-4px] active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
                            >
                                Empezar ahora <ArrowRight size={24} />
                            </a>
                            <a
                                href="#demo-video"
                                className="w-full sm:w-auto bg-white/5 backdrop-blur-sm text-foreground px-10 py-6 rounded-full font-bold text-xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                            >
                                <Phone size={24} className="text-primary" /> Ver demo
                            </a>
                        </motion.div>
    
                        {/* Social Proof Text */}
                        <div className="mt-12 flex items-center gap-4 text-foreground/40 font-black uppercase tracking-tighter text-[10px]">
                            <div className="flex text-primary">
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                            </div>
                            <span>Más de 1,000 profesionales ya no usan papel</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Sección Separadora con Imagen Fija (Fixed Background) */}
            <section
                className="relative h-screen md:h-[500px] w-full bg-fixed bg-center md:bg-center bg-cover bg-no-repeat"
                style={{ backgroundImage: 'url("/images/Reingenierìa/secuencia_urbana_1_valla.webp")' }}
            >
            </section>

            {/* Sección de Reflexión: Gasto en Publicidad */}
            <section className="bg-background py-24 px-6 min-h-[600px] flex items-center relative overflow-hidden section-dark">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-white text-4xl md:text-5xl font-black uppercase tracking-tighter mb-10 leading-tight"
                    >
                        ¿Cuánto gastaste el mes pasado en volantes, diseños <span className="text-primary italic">o publicidad?</span>
                    </motion.h2>
                </div>
                
                {/* Decoradores Sutiles */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
            </section>

            {/* Sección: Video Demo */}
            <section id="demo-video" className="py-24 bg-surface relative overflow-hidden section-light">
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-primary border border-primary/20 mb-6"
                        >
                            Obtenlo hoy mismo
                        </motion.div>
                        <h2 className="text-3xl md:text-5xl font-black text-navy tracking-tighter mb-6">
                            Mira cómo funciona <span className="text-primary italic">en menos de 1 minuto</span>
                        </h2>
                        <p className="text-navy/60 max-w-2xl mx-auto text-lg font-medium">
                            Tu cliente apunta la cámara al QR. Sin apps, sin descargar nada, sin complicaciones. Tu contacto se instala directamente en la agenda.
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative aspect-video w-full max-w-5xl mx-auto rounded-premium overflow-hidden shadow-2xl border-4 border-navy/10 group"
                    >
                        <iframe
                            src="https://iframe.mediadelivery.net/embed/636136/92abbb19-6a1d-41fe-abe1-09655fd0e1cd?autoplay=false&loop=false&muted=false&preload=true&responsive=true"
                            loading="lazy"
                            className="absolute inset-0 w-full h-full border-0"
                            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                            allowFullScreen
                            title="Demostración estratégica de ActivaQR"
                        ></iframe>
                        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-navy/5 rounded-premium"></div>
                    </motion.div>

                    <div className="mt-12 flex justify-center">
                        <div className="flex items-center gap-6 p-4 bg-navy/5 rounded-3xl border border-navy/10 max-w-lg">
                            <div className="bg-primary/20 p-3 rounded-2xl text-primary">
                                <CheckCircle2 size={24} />
                            </div>
                            <p className="text-sm font-bold text-navy/70 uppercase tracking-widest leading-tight">
                                Ideal para <span className="text-primary-dark font-black">profesionales, empresas y comercios</span>. Esta herramienta se suma a como haces conocer tus productos y servicios.
                            </p>
                        </div>
                    </div>

                    <div className="relative flex md:grid md:grid-cols-3 gap-8 mt-24 w-full max-w-5xl mx-auto overflow-x-auto md:overflow-visible pb-12 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
                        {/* Card 1 */}
                        <div className="w-[80vw] md:w-auto shrink-0 snap-center relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-navy/10 transform -rotate-2 md:hover:rotate-0 transition-transform duration-500">
                            <img
                                src="/images/Reingenierìa/Portadas tipo historia/card_35_contacto.webp"
                                alt="Plan Contacto Digital"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                        {/* Card 2 */}
                        <div className="w-[80vw] md:w-auto shrink-0 snap-center relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-navy/10 z-10 md:scale-110 shadow-primary/20 transform rotate-1 md:hover:rotate-0 transition-transform duration-500">
                            <img
                                src="/images/Reingenierìa/Portadas tipo historia/card_100_business.webp"
                                alt="Plan Contacto Business"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                        {/* Card 3 */}
                        <div className="w-[80vw] md:w-auto shrink-0 snap-center relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-navy/10 transform rotate-3 md:hover:rotate-0 transition-transform duration-500">
                            <img
                                src="/images/Reingenierìa/Portadas tipo historia/card_200_catalogo.webp"
                                alt="Plan Contacto Catálogo"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>

                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </section>
            
            {/* Pricing Section Modules */}
            <PricingSection initialPlanId="business" />


            {/* Sección: Logos de Clientes (Confianza Institucional) */}
            <section className="py-20 bg-surface-soft overflow-hidden border-y border-navy/5 section-light">
                <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
                    <h3 className="text-xl md:text-2xl font-black text-navy tracking-tighter italic">
                        <span className="text-primary italic">Decenas de negocios y profesionales</span> ya usan ActivaQR
                    </h3>
                </div>

                {/* Contenedor de Carruseles */}
                <div className="flex flex-col gap-8 relative">
                    {/* Fila 1: Derecha a Izquierda */}
                    <div className="flex overflow-hidden group">
                        <motion.div
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            className="flex gap-0 whitespace-nowrap py-4"
                        >
                            <div className="flex gap-8 pr-8 shrink-0">
                                {[
                                    "@pily_vanss.webp", "CITY Shoes.jpg", "Calefones Loja.jpg", "Clínica San Bernardo.png",
                                    "Daniel Rojas - Naluz.jpeg", "Dulce Tradición.jpg", "Estetica Mariaelena Cabrera.png",
                                    "Estilista Julita Gallegos.jpeg", "Fahac.jpg", "Gaby Vera.jpg",
                                    "Jose Arevalo - Confecciones Arevalo  Covatex.webp", "Kaweh.jfif", "La Casa de la tia Omaira.jpg",
                                    "Yessy 2026.jpg"
                                ].map((logo, i) => (
                                    <div key={i} className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-full p-1 border-2 border-white/5 shadow-sm hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden shrink-0 grayscale hover:grayscale-0 transition-all duration-500">
                                        <img
                                            src={`/logos_clientes/clientes%20de%20Activa%20QR/${logo.replaceAll(' ', '%20')}`}
                                            alt={`Cliente ActivaQR ${i}`}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-8 pr-8 shrink-0" aria-hidden="true">
                                {[
                                    "@pily_vanss.webp", "CITY Shoes.jpg", "Calefones Loja.jpg", "Clínica San Bernardo.png",
                                    "Daniel Rojas - Naluz.jpeg", "Dulce Tradición.jpg", "Estetica Mariaelena Cabrera.png",
                                    "Estilista Julita Gallegos.jpeg", "Fahac.jpg", "Gaby Vera.jpg",
                                    "Jose Arevalo - Confecciones Arevalo  Covatex.webp", "Kaweh.jfif", "La Casa de la tia Omaira.jpg",
                                    "Yessy 2026.jpg"
                                ].map((logo, i) => (
                                    <div key={`dub1-${i}`} className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-full p-1 border-2 border-white/5 shadow-sm hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden shrink-0 grayscale hover:grayscale-0 transition-all duration-500">
                                        <img
                                            src={`/logos_clientes/clientes%20de%20Activa%20QR/${logo.replaceAll(' ', '%20')}`}
                                            alt={`Cliente ActivaQR ${i}`}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Fila 2: Izquierda a Derecha */}
                    <div className="flex overflow-hidden group">
                        <motion.div
                            animate={{ x: ["-50%", "0%"] }}
                            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                            className="flex gap-0 whitespace-nowrap py-4"
                        >
                            <div className="flex gap-8 pr-8 shrink-0">
                                {[
                                    "Las costillas del veci.jpg", "Loja Garden.jpg", "Lojanias.jpg", "Maricela.png",
                                    "Nelvia Sarmiento.webp", "Sareni.webp", "Sur Bike.jpg", "Tapicería Brito.webp",
                                    "camila.webp", "descarga.jfif", "logo-200-millas.png", "punto smart.jfif", "santa petrona.jpg"
                                ].map((logo, i) => (
                                    <div key={i} className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-full p-1 border-2 border-white/5 shadow-sm hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden shrink-0 grayscale hover:grayscale-0 transition-all duration-500">
                                        <img
                                            src={`/logos_clientes/clientes%20de%20Activa%20QR/${logo.replaceAll(' ', '%20')}`}
                                            alt={`Cliente ActivaQR ${i}`}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-8 pr-8 shrink-0" aria-hidden="true">
                                {[
                                    "Las costillas del veci.jpg", "Loja Garden.jpg", "Lojanias.jpg", "Maricela.png",
                                    "Nelvia Sarmiento.webp", "Sareni.webp", "Sur Bike.jpg", "Tapicería Brito.webp",
                                    "camila.webp", "descarga.jfif", "logo-200-millas.png", "punto smart.jfif", "santa petrona.jpg"
                                ].map((logo, i) => (
                                    <div key={`dub2-${i}`} className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-full p-1 border-2 border-white/5 shadow-sm hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden shrink-0 grayscale hover:grayscale-0 transition-all duration-500">
                                        <img
                                            src={`/logos_clientes/clientes%20de%20Activa%20QR/${logo.replaceAll(' ', '%20')}`}
                                            alt={`Cliente ActivaQR ${i}`}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Gradientes laterales para suavizar el scroll */}
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-surface-soft to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-surface-soft to-transparent z-10 pointer-events-none"></div>
                </div>
            </section>

            {/* Sección: Carrusel de Banners de Conversión Estratégica */}
            <section className="py-24 bg-surface relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {currentSlide === 0 && (
                                <motion.div
                                    key="slide-whatsapp-pro"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-center lg:text-left"
                                >
                                    {/* Slide 1: WhatsApp Pro-Tip */}
                                    <div className="relative z-10">
                                        <div className="inline-block bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6">
                                            ✨ MÉTODO PRO
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tighter leading-none mb-6">
                                            Compártelo por <span className="text-primary italic">WhatsApp</span>
                                        </h2>
                                        <div className="relative mb-8 text-left">
                                            <div className="absolute left-0 top-0 w-1.5 h-full bg-primary rounded-full hidden lg:block"></div>
                                            <p className="text-xl text-navy/60 font-bold italic lg:pl-8">
                                                &quot;Cuando un cliente te escriba por WhatsApp, no solo le des tu número. Envíale este mensaje junto con tu contacto digital de ActivaQR:&quot;
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                            <div className="flex items-center gap-2 text-navy/70 font-black uppercase text-[10px] tracking-widest bg-navy/5 px-3 py-2 rounded-xl border border-navy/10 italic">
                                                <div className="w-5 h-5 bg-[#66bf19] text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">✓</div>
                                                Ideal para clientes de Instagram
                                            </div>
                                            <div className="flex items-center gap-2 text-navy/70 font-black uppercase text-[10px] tracking-widest bg-navy/5 px-3 py-2 rounded-xl border border-navy/10">
                                                <div className="w-5 h-5 bg-[#66bf19] text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">✓</div>
                                                Profesionalismo
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute -inset-10 bg-gradient-to-tr from-primary/20 to-green-500/10 blur-3xl opacity-30"></div>
                                        <div className="relative bg-[#efeae2] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[10px] border-navy overflow-hidden aspect-[9/12] max-w-[380px] mx-auto group">
                                            <div className="bg-[#075e54] p-5 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl">👤</div>
                                                <div className="text-left">
                                                    <div className="text-white font-black text-sm uppercase tracking-tight">Interesado de IG</div>
                                                    <div className="text-[#25d366] text-[10px] font-bold animate-pulse">en línea</div>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-4 text-left">
                                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                                                    className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[75%] text-xs font-bold text-navy/80"
                                                >
                                                    &quot;Vi tus productos en Instagram, me puedes enviar tu catálogo?&quot;
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                                                    className="bg-[#dcf8c6] p-4 rounded-2xl rounded-tr-none shadow-md border border-navy/5 ml-auto max-w-[90%] relative"
                                                >
                                                    <p className="text-[11px] leading-relaxed text-navy font-medium whitespace-pre-line">
                                                        ✨ ¡Hola! Gracias por escribir a <span className="font-black">[Tu Negocio]</span> 🎀
                                                        {"\n\n"}
                                                        Antes de comenzar, para que puedas conocer mejor nuestro trabajo y mantenerte al día con nuestras novedades, te compartimos nuestra información de contacto.
                                                        {"\n\n"}
                                                        👉 <span className="font-black text-primary underline decoration-primary/30">Solo sigue estos pasos:</span>
                                                        {"\n"}
                                                        📎 1. Haz clic en el archivo que te enviamos
                                                        {"\n"}
                                                        📲 2. Guárdalo o impórtalo en tu teléfono
                                                        {"\n"}
                                                        🌐 3. Así tendrás nuestro contacto completo y acceso a nuestras redes.
                                                    </p>
                                                    <div className="text-[8px] text-navy/30 text-right mt-1 font-bold">11:15 p.m. ✓✓</div>
                                                </motion.div>
                                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }}
                                                    className="bg-[#dcf8c6] p-2 rounded-2xl rounded-tr-none shadow-lg ml-auto max-w-[85%] border-2 border-primary/20"
                                                >
                                                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner">
                                                            <div className="flex flex-col items-center"><span className="text-[8px] font-black opacity-50">FILE</span><span className="text-xs font-black text-primary">VCF</span></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[11px] font-black text-navy truncate">tu-contacto.vcf</div>
                                                            <div className="text-[9px] font-bold text-navy/40">VCF • 28 kB</div>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-navy/5 flex items-center justify-center text-navy/60">↓</div>
                                                    </div>
                                                </motion.div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 w-full bg-[#f0f2f5] p-3 flex items-center gap-3">
                                                <div className="w-full bg-white rounded-full py-2.5 px-5 text-[11px] text-navy/20 font-bold border border-navy/5 shadow-inner">Escribe un mensaje...</div>
                                                <div className="w-10 h-10 bg-[#075e54] rounded-full flex items-center justify-center text-white shadow-lg shrink-0">➤</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentSlide === 1 && (
                                <motion.div
                                    key="slide-estados"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-center lg:text-left"
                                >
                                    {/* Slide 2: Vende por Estados */}
                                    <div className="relative z-10">
                                        <div className="inline-block bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6">
                                            📈 ENGAGEMENT MÁXIMO
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tighter leading-none mb-6">
                                            Vende por <span className="text-primary italic">Estados de WhatsApp</span>
                                        </h2>
                                        <ul className="space-y-4 mb-8 text-left">
                                            <li className="flex items-start gap-4">
                                                <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-1">1</div>
                                                <p className="text-lg text-navy/60 font-bold">Si ellos te agregan y tu los agregas podrán ver tus estados. ¡Mayor engagement y ventas!</p>
                                            </li>
                                            <li className="flex items-start gap-4">
                                                <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-1">2</div>
                                                <p className="text-lg text-navy/60 font-bold">Si también los etiquetas, podrán crear difusiones y será más fácil enviar campañas o mensajes personalizados.</p>
                                            </li>
                                        </ul>
                                        <div className="flex gap-4 justify-center lg:justify-start">
                                            <Link href="/registro" className="bg-primary text-white font-black px-8 py-4 rounded-2xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs">
                                                Probar ahora
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -inset-10 bg-primary/10 blur-3xl rounded-full"></div>
                                        <img
                                            src="/images/estado%20de%20whatsapp.png"
                                            alt="Estados de WhatsApp"
                                            className="relative rounded-[2rem] shadow-2xl border-4 border-white transform rotate-2 max-w-md mx-auto w-full h-auto"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {currentSlide === 2 && (
                                <motion.div
                                    key="slide-automatizacion"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-center lg:text-left"
                                >
                                    {/* Slide 3: Automatización */}
                                    <div className="relative z-10">
                                        <div className="inline-block bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6">
                                            🚀 PARA NEGOCIOS ESCALABLES
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tighter leading-none mb-6">
                                            Lo hacemos <span className="text-primary italic">por ti</span>
                                        </h2>
                                        <p className="text-xl text-navy/60 font-bold mb-8 italic leading-relaxed">
                                            &quot;Si quieres simplemente ver el resultado y no perder meses y mucho dinero intentándolo tú mismo, lo hacemos por ti.&quot;
                                        </p>
                                        <div className="flex gap-4 justify-center lg:justify-start">
                                            <Link href="/registro" className="bg-primary text-white font-black px-10 py-5 rounded-2xl hover:scale-105 transition-all shadow-2xl uppercase tracking-widest text-sm">
                                                QUIERO AUTOMATIZAR
                                            </Link>
                                        </div>
                                        <img
                                            src="/images/mockup_laptop_automatizacion_activaqr_1772769734997.png"
                                            alt="Automatización ActivaQR"
                                            className="relative rounded-[2rem] shadow-2xl border-4 border-navy/10 max-w-lg mx-auto w-full h-auto"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Controles del Carrusel */}
                        <div className="flex justify-center lg:justify-start items-center gap-6 mt-16">
                            {[0, 1, 2].map((idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`h-3 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-12 bg-primary' : 'w-3 bg-navy/10 hover:bg-navy/30'}`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                            <div className="ml-4 flex gap-3">
                                <button
                                    onClick={() => setCurrentSlide((prev) => (prev === 0 ? 2 : prev - 1))}
                                    className="w-12 h-12 rounded-full bg-white border border-navy/10 flex items-center justify-center text-navy shadow-lg hover:bg-navy hover:text-white transition-all group active:scale-95"
                                    title="Anterior"
                                >
                                    <span className="group-hover:-translate-x-0.5 transition-transform font-bold">←</span>
                                </button>
                                <button
                                    onClick={() => setCurrentSlide((prev) => (prev === 2 ? 0 : prev + 1))}
                                    className="w-12 h-12 rounded-full bg-white border border-navy/10 flex items-center justify-center text-navy shadow-lg hover:bg-navy hover:text-white transition-all group active:scale-95"
                                    title="Siguiente"
                                >
                                    <span className="group-hover:translate-x-0.5 transition-transform font-bold">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Sección: Reseñas de Google (Social Proof Dinámico) */}
            <ReviewsSection />

            {/* Sección: Casos de Éxito (Social Proof Dinámico) */}
            <section className="py-24 bg-surface relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-green-600 border border-green-500/20 mb-6"
                        >
                            <Star size={14} fill="currentColor" /> Resultados Reales
                        </motion.div>
                        <h2 className="text-3xl md:text-5xl font-black text-navy tracking-tighter mb-6">
                            Profesionales que ya <span className="text-primary italic">están facturando más</span>
                        </h2>
                        <p className="text-navy/60 max-w-2xl mx-auto text-lg font-medium">
                            No es solo un enlace, es la seguridad de que tus clientes te tienen a un toque de distancia cuando más te necesitan.
                        </p>
                    </div>

                    {/* Desktop: Grid | Mobile: Carousel (Slide Horizontal) */}
                    <div className="relative">
                        <motion.div
                            className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible pb-12 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0"
                            animate={{ x: [0, -20, 0] }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatType: "reverse"
                            }}
                        >
                            {/* Caso 1: Yessy (Enfermería) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="w-[85vw] md:w-auto shrink-0 snap-center bg-white p-2 rounded-[2.5rem] shadow-xl border border-navy/5 relative group hover:translate-y-[-5px] transition-transform duration-500"
                            >
                                <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden mb-6">
                                    <img
                                        src="/logos_clientes/clientes%20de%20Activa%20QR/Yessy%202026.jpg"
                                        alt="Yessy - Enfermería a domicilio"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <p className="text-white font-black text-xl uppercase tracking-tighter">Yessy</p>
                                        <p className="text-primary text-xs font-bold uppercase tracking-widest">Enfermería Pro</p>
                                    </div>
                                </div>
                                <div className="px-6 pb-8">
                                    <div className="flex gap-1 mb-4 text-yellow-500">
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                    </div>
                                    <p className="text-navy/80 font-medium italic leading-relaxed mb-6">
                                        &quot;Muchos pacientes perdían mi número entre sus chats. Ahora, apenas los visito, escanean mi QR y aparezco primero en su agenda con mi foto. ¡Es impresionante la confianza que da!&quot;
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-navy/40">Cliente Verificado</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Caso 2: Las Costillas del Veci (Restaurante) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="w-[85vw] md:w-auto shrink-0 snap-center bg-white p-2 rounded-[2.5rem] shadow-xl border border-navy/5 relative group hover:translate-y-[-5px] transition-transform duration-500"
                            >
                                <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden mb-6">
                                    <img
                                        src="/logos_clientes/clientes%20de%20Activa%20QR/Las%20costillas%20del%20veci.jpg"
                                        alt="Las Costillas del Veci - Restaurante"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <p className="text-white font-black text-xl uppercase tracking-tighter">Costillas del Veci</p>
                                        <p className="text-primary text-xs font-bold uppercase tracking-widest">Gastronomía</p>
                                    </div>
                                </div>
                                <div className="px-6 pb-8">
                                    <div className="flex gap-1 mb-4 text-yellow-500">
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                    </div>
                                    <p className="text-navy/80 font-medium italic leading-relaxed mb-6">
                                        &quot;Antes entregábamos volantes que terminaban en el suelo. Ahora, los clientes guardan nuestro contacto directo para pedidos a domicilio. La recurrencia de pedidos ha subido notablemente.&quot;
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-navy/40">Cliente Verificado</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Caso 3: Loja Garden (Servicios) */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="w-[85vw] md:w-auto shrink-0 snap-center bg-white p-2 rounded-[2.5rem] shadow-xl border border-navy/5 relative group hover:translate-y-[-5px] transition-transform duration-500"
                            >
                                <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden mb-6">
                                    <img
                                        src="/logos_clientes/clientes%20de%20Activa%20QR/Loja%20Garden.jpg"
                                        alt="Loja Garden"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <p className="text-white font-black text-xl uppercase tracking-tighter">Loja Garden</p>
                                        <p className="text-primary text-xs font-bold uppercase tracking-widest">Servicios / Eventos</p>
                                    </div>
                                </div>
                                <div className="px-6 pb-8">
                                    <div className="flex gap-1 mb-4 text-yellow-500">
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                    </div>
                                    <p className="text-navy/80 font-medium italic leading-relaxed mb-6">
                                        &quot;La facilidad para enviar mi contacto por WhatsApp con un solo clic es increíble. Mis clientes valoran la rapidez y la presentación profesional. Ha sido clave para nuestra imagen.&quot;
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-navy/40">Cliente Verificado</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    <div className="mt-16 text-center">
                        <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-6 bg-white/50 backdrop-blur-md rounded-3xl border border-navy/5 shadow-inner">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="relative w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden">
                                        <Image 
                                            src={`/images/user-${i < 4 ? i : 1}.jpg`} 
                                            alt="Reviewer" 
                                            fill
                                            sizes="40px"
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-navy uppercase tracking-tighter">Basado en opiniones reales en Google</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex text-yellow-500"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                                    <p className="text-xs font-bold text-navy/50">4.9 / 5.0 Rating General</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-1/2 left-0 w-full h-full pointer-events-none opacity-50">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-navy/5 rounded-full blur-[150px]"></div>
                </div>
            </section>





            <AdvancedFAQ
                items={HOME_FAQS}
                title={<>Preguntas <span className="text-primary italic">Frecuentes</span></>}
                subtitle="Cero rodeos. Abre cualquier interrogante y destruiremos la duda cara a cara."
                sectionTag="Sin textos aburridos"
            />
            
            <FloatingSalesHeader />

            <VideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} videoId="92abbb19-6a1d-41fe-abe1-09655fd0e1cd" sourceType="bunny" />
            <PopupManager />
            <EditPortalModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
            <QuoteModal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} />

            {/* Floating Support Button */}
            <motion.a
                href="https://wa.me/593983237491?text=Hola,%20necesito%20soporte%20con%20ActivaQR"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                    opacity: isFloatingVisible ? 1 : 0, 
                    x: isFloatingVisible ? 0 : -20,
                    pointerEvents: isFloatingVisible ? 'auto' : 'none'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed top-20 left-6 z-40 bg-white/90 backdrop-blur-md border border-navy/10 text-navy px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2 group hover:bg-white transition-all"
            >
                <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <Phone size={16} className="text-green-500 group-hover:text-white transition-colors" />
                </div>
                <div className="text-left hidden sm:block">
                    <p className="text-[9px] font-black text-navy uppercase leading-tight">Soporte</p>
                </div>
            </motion.a>
            {/* Floating Buttons Container (Responsive) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                    opacity: isFloatingVisible ? 1 : 0, 
                    y: isFloatingVisible ? 0 : 20,
                    pointerEvents: isFloatingVisible ? 'auto' : 'none'
                }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 flex flex-row gap-2 sm:left-6 sm:translate-x-0 sm:w-auto sm:flex-col sm:bottom-6 transition-all"
            >
                {/* Floating Quote Button - ESCONDIDO
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsQuoteModalOpen(true)}
                    className="flex-1 sm:flex-none bg-[#0a1124] backdrop-blur-md border border-white/10 text-white px-3 py-2.5 rounded-2xl shadow-2xl flex items-center justify-center sm:justify-start gap-2 group transition-all"
                    style={{ boxShadow: '0 10px 30px -5px rgba(255, 107, 0, 0.3)' }}
                >
                    <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                        <FileText size={16} className="text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-left">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 hidden sm:block">Empresas</p>
                        <p className="text-[11px] font-black text-white uppercase leading-tight">Cotizar</p>
                    </div>
                </motion.button>
                */}

                {/* Floating Edit Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 sm:flex-none bg-white/95 backdrop-blur-md border border-navy/5 text-navy px-3 py-2.5 rounded-2xl shadow-xl flex items-center justify-center sm:justify-start gap-2 group transition-all"
                >
                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Edit size={16} className="text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-left">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-navy/40 hidden sm:block">Actualizar</p>
                        <p className="text-[11px] font-black text-navy uppercase leading-tight">Editar</p>
                    </div>
                </motion.button>
            </motion.div>
        </main>
    );
}

