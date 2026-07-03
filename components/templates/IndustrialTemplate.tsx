"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, MapPin, Phone, Mail, Instagram, Facebook, Link as LinkIcon, Download, Zap, ChevronRight, Activity, Shield, Clock, Users, Building, Truck } from 'lucide-react';
import { formatPhoneEcuador, cn } from '@/lib/utils';
import { safeParse } from '@/lib/jsonUtils';
import MapSection from '@/components/MapSection';
import CatalogGallery from '../card/CatalogGallery';
import ShareButton from '@/components/ShareButton';
import { BaseTemplateProps, HeroCarouselTemplateProps } from './types';
import { checkIsVerticalVideo, getDirectVideoUrl } from '@/lib/videoUtils';
import LimitedTimeOffer from '@/components/LimitedTimeOffer';


export default function IndustrialTemplate(props: HeroCarouselTemplateProps) {
    const { data, afterExperienceSlot, getVideoEmbedUrl, activeSlides, currentSlideIndex } = props;
    if (!data) return null;

    const [lightboxImg, setLightboxImg] = React.useState<string | null>(null);

    // Hero offer from active slide
    const heroOffer = (() => {
        if (!activeSlides || activeSlides.length === 0) return undefined;
        const currentSlide = activeSlides[currentSlideIndex];
        if (!currentSlide) return undefined;
        if (currentSlide.offerEnabled) {
            return {
                enabled: true,
                badge: currentSlide.offerBadge || 'OFERTA',
                title: currentSlide.offerTitle || '',
                description: currentSlide.offerDescription || '',
                originalPrice: currentSlide.offerOriginalPrice || '',
                offerPrice: currentSlide.offerPrice || '',
                expiresAt: currentSlide.offerExpiresAt || '',
                ctaText: currentSlide.offerCtaText || ''
            };
        }
        return undefined;
    })();

    // Theme primary color
    const themePrimary = (() => {
        const raw = data.json_override;
        const parsed = safeParse(raw, {});
        return parsed.themePrimary || '#FF6B00';
    })();

    // Offer color from active slide (falls back to themePrimary)
    const offerColor = (() => {
        if (!activeSlides || activeSlides.length === 0) return themePrimary;
        const currentSlide = activeSlides[currentSlideIndex];
        return currentSlide?.offerColor || themePrimary;
    })();

    // Close lightbox on Escape key + lock body scroll
    React.useEffect(() => {
        if (!lightboxImg) {
            document.body.style.overflow = '';
            return;
        }
        document.body.style.overflow = 'hidden';
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxImg(null);
        };
        window.addEventListener('keydown', handleKey);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKey);
        };
    }, [lightboxImg]);

    // Default values if data is missing
    // Industrial Specific Config (from json_override)
    const { industrialConfig, authorityModule } = (() => {
        const raw = data.json_override;
        const parsed = safeParse(raw, {});
        return {
            industrialConfig: parsed.industrialConfig || {},
            authorityModule: parsed.authorityModule || { enabled: false }
        };
    })();

    // Fallback logic: if authorityModule is enabled, use its data. 
    // Otherwise, use industrialConfig (legacy).
    const isAuthorityEnabled = authorityModule.enabled === true;

    const stats = (isAuthorityEnabled ? authorityModule.stats : industrialConfig.stats) || [
        { label: "Experiencia", value: "10+", icon: <Building /> },
        { label: "Proyectos", value: "200+", icon: <Activity /> },
        { label: "Efectividad", value: "99%", icon: <Shield /> },
        { label: "Soporte", value: "24/7", icon: <Clock /> }
    ];

    const metrics = (isAuthorityEnabled ? authorityModule.metrics : industrialConfig.metrics) || [
        { label: "Capacidad Operativa", value: "100" },
        { label: "Cumplimiento de Tiempos", value: "98" }
    ];

    const chooseUs = {
        badge: (isAuthorityEnabled ? authorityModule.badge : industrialConfig.badge) || "Garantía de Calidad",
        title: (isAuthorityEnabled ? authorityModule.title : industrialConfig.title) || "Por qué elegirnos",
        description: (isAuthorityEnabled ? authorityModule.description : industrialConfig.description) || "Estamos comprometidos con la excelencia y la calidad en cada uno de nuestros servicios, asegurando resultados que superan las expectativas de nuestros clientes."
    };

    // Experience Protocol Data (Services/Categories)
    const servicesList = (() => {
        let replacements: any = {};
        let images: any[] = [];
        let descriptions: any = {};
        let experienceTitles: any[] = [];
        let experienceDescriptions: any[] = [];
        const raw = data.json_override;
        const parsed = safeParse(raw, {});
        replacements = parsed;
        images = parsed.experienceImages || [];
        descriptions = parsed.experienceDescriptions || {};
        experienceTitles = parsed.experienceTitles || [];
        experienceDescriptions = parsed.experienceDescriptions || [];

        const rawLines = data.productos_servicios?.split('\n').map((l: string) => l.trim()).filter(Boolean) || [];
        
        if (rawLines.length === 0) {
            return [
                { id: 1, title: "Logística y Distribución", description: "Gestión integral de suministros y entregas.", img: "" },
                { id: 2, title: "Mantenimiento de Flotas", description: "Cuidado preventivo y correctivo de vehículos.", img: "" },
                { id: 3, title: "Seguimiento Satelital", description: "Monitoreo en tiempo real de operaciones.", img: "" }
            ];
        }

        return rawLines.map((cat: string, index: number) => {
            const customImg = images.find((i: any) => i.index === index);
            const customTitleObj = (experienceTitles || []).find((t: any) => t.index === index);
            const customDescObj = (Array.isArray(experienceDescriptions) ? experienceDescriptions : []).find((d: any) => d.index === index);
            
            const displayTitle = customTitleObj?.title || replacements[cat] || cat;
            
            // Check if descriptions is an array (index-based) or object (key-based)
            const displayDesc = customDescObj?.description || 
                                (typeof descriptions === 'object' && !Array.isArray(descriptions) ? descriptions[cat] : "") || 
                                "Servicio especializado diseñado para garantizar la máxima eficiencia operativa.";
            
            return {
                id: index,
                title: displayTitle,
                img: customImg?.url || '',
                description: displayDesc
            };
        });
    })();

    const experienceButton = (() => {
        const raw = data.json_override;
        const parsed = safeParse(raw, {});
        return parsed.experienceButton || {
            text: "CONSULTAR AHORA",
            action: "whatsapp",
            url: "",
            fileUrl: ""
        };
    })();
    const btnText = experienceButton.text || "CONSULTAR AHORA";

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: data.nombre_negocio,
                    text: data.bio,
                    url: window.location.href,
                });
            } catch (err) {
                console.error("Error compartiendo", err);
            }
        }
    };

    return (
        <div 
            className="min-h-screen bg-[#F5F7FA] font-sans text-navy selection:bg-[var(--theme-primary)] selection:text-white"
            style={{ '--theme-primary': props.themePrimary || '#FF5C00' } as React.CSSProperties}
        >
            
            {/* 0. MINI NAVBAR */}
            <nav className="fixed top-0 left-0 w-full z-[100] px-4 md:px-8 py-3 flex justify-between items-center bg-[#001549]/95 backdrop-blur-md border-b border-white/10 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[var(--theme-primary)] rounded-sm flex items-center justify-center text-white font-black text-lg italic shadow-lg shadow-[var(--theme-primary)]/20">
                        {data.nombre_negocio?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <span className="text-white font-black uppercase tracking-tighter text-lg leading-none">{data.nombre_negocio || data.nombre || 'ACTIVAQR'}</span>
                </div>
                <div className="hidden md:flex gap-8 text-white/80 font-bold uppercase text-[10px] tracking-widest">
                    <a href="#servicios" className="hover:text-[var(--theme-primary)] transition-colors">Servicios</a>
                    <a href="#nosotros" className="hover:text-[var(--theme-primary)] transition-colors">Nosotros</a>
                    <a href="#proyectos" className="hover:text-[var(--theme-primary)] transition-colors">Flota</a>
                </div>
                {data.whatsapp && (
                    <a 
                        href={`https://wa.me/${data.whatsapp.replace(/\D/g, '')}`}
                        className="bg-[#25D366] text-white px-5 py-2 font-black uppercase text-[10px] tracking-widest hover:bg-[#1ebd57] transition-all rounded-sm flex items-center gap-2"
                    >
                        <Phone size={14} /> WhatsApp
                    </a>
                )}
            </nav>
            {/* 1. HERO SECTION */}
            <section className="relative w-full min-h-[85vh] flex flex-col justify-end pb-12 md:pb-24 overflow-hidden">
                {/* Background Image with Dark Overlay */}
                <div className="absolute inset-0 z-0">
                    {activeSlides && activeSlides.length > 0 ? (
                        activeSlides.map((slide, idx) => (
                            <motion.div
                                key={slide.id || idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: currentSlideIndex === idx ? 1 : 0 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="absolute inset-0"
                                style={{ 
                                    pointerEvents: currentSlideIndex === idx ? 'auto' : 'none'
                                }}
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center md:hidden"
                                    style={{ 
                                        backgroundImage: `url(${slide.portada_movil || slide.portada_desktop || data.foto_url})`,
                                        opacity: 0.6
                                    }}
                                />
                                <div
                                    className="absolute inset-0 bg-cover bg-center hidden md:block"
                                    style={{ 
                                        backgroundImage: `url(${slide.portada_desktop || slide.portada_movil || data.foto_url})`,
                                        opacity: 0.6
                                    }}
                                />
                            </motion.div>
                        ))
                    ) : (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center md:hidden"
                                style={{ 
                                    backgroundImage: `url(${data.portada_movil || data.portada_desktop || data.foto_url})`,
                                    opacity: 0.6
                                }}
                            />
                            <div
                                className="absolute inset-0 bg-cover bg-center hidden md:block"
                                style={{ 
                                    backgroundImage: `url(${data.portada_desktop || data.portada_movil || data.foto_url})`,
                                    opacity: 0.6
                                }}
                            />
                        </>
                    )}
                    {(!data.portada_desktop && !data.portada_movil && !data.foto_url && (!activeSlides || activeSlides.length === 0)) && (
                        <div className="w-full h-full bg-navy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#001B3D]/90 via-[#001B3D]/70 to-[#001B3D]/30" />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-block py-1 px-3 border border-[var(--theme-primary)]/50 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] font-black text-[10px] tracking-widest uppercase mb-6 rounded-sm">
                                {data.profesion || data.nombre_negocio || "Servicios"}
                            </span>
                            
                            <h1 className="w-fit bg-[#001B3D]/60 backdrop-blur-md px-6 py-4 rounded-[2rem] text-[28px] sm:text-4xl md:text-[55px] font-black text-white uppercase leading-[0.95] tracking-tighter mb-6 break-words [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000] border border-white/10">
                                {data.nombre_negocio || data.nombre || "Nombre Empresa"}
                            </h1>
                            
                            <p className="w-fit bg-[#001B3D]/60 backdrop-blur-md px-6 py-4 rounded-2xl text-base md:text-[20px] text-white/80 max-w-xl font-medium leading-relaxed mb-10 border-l-4 border-[var(--theme-primary)] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
                                {data.bio || (data.nombre_negocio ? `Excelencia y compromiso en cada servicio de ${data.nombre_negocio}.` : "Soluciones de alta calidad y eficiencia en cada entrega.")}
                            </p>

                            <div className="flex flex-wrap gap-4 items-center">
                                {data.whatsapp && (
                                    <a 
                                        href={`https://wa.me/${data.whatsapp.replace(/\D/g, '')}?text=Hola%20${data.nombre_negocio},%20me%20gustaría%20solicitar%20información.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group bg-[var(--theme-primary)] text-white px-8 py-4 font-black uppercase text-sm tracking-widest flex items-center gap-3 hover:brightness-90 transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]" />
                                        <span>Cotizar Ahora</span>
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </a>
                                )}
                                <button 
                                    onClick={handleShare}
                                    className="bg-white/10 text-white border border-white/20 px-8 py-4 font-black uppercase text-sm tracking-widest hover:bg-white hover:text-navy transition-all"
                                >
                                    <Share2 size={18} />
                                </button>

                                <ShareButton 
                                    title={data.nombre_negocio || data.nombre || "Nombre Empresa"}
                                    text={data.bio || "Soluciones de alta calidad y eficiencia en cada entrega."}
                                    variant="button"
                                    buttonStyle="outline"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Info Bar Bottom */}
                <div className="absolute bottom-0 left-0 w-full bg-[#001229]/90 backdrop-blur-md border-t border-white/10 z-20 hidden md:block">
                    <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center text-white/70 text-xs font-bold uppercase tracking-widest">
                        {data.email && <div className="flex items-center gap-2"><Mail size={14} className="text-[var(--theme-primary)]" /> {data.email}</div>}
                        {data.address && <div className="flex items-center gap-2"><MapPin size={14} className="text-[var(--theme-primary)]" /> {data.address}</div>}
                        {data.whatsapp && <div className="flex items-center gap-2"><Phone size={14} className="text-[var(--theme-primary)]" /> {formatPhoneEcuador(data.whatsapp)}</div>}
                    </div>
                </div>

                {/* Limited Time Offer Badge */}
                <LimitedTimeOffer offer={heroOffer} themePrimary={offerColor} />
            </section>

            {/* 2. SERVICES SECTION (Orange Blocks) */}
            <section id="servicios" className="py-24 px-4 bg-white relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h4 className="text-[var(--theme-primary)] font-black tracking-widest uppercase text-sm mb-2">Qué Hacemos</h4>
                        <h2 className="text-4xl md:text-5xl font-black text-navy uppercase tracking-tight">Nuestros <span className="text-[var(--theme-primary)]">Servicios</span></h2>
                        <div className="w-20 h-1 bg-[var(--theme-primary)] mx-auto mt-6" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {servicesList.map((service: any, index: number) => (
                            <div key={index} className="group relative bg-navy border border-white/10 overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                {/* Service Image / Header Area */}
                                <div 
                                    className={cn(
                                        "h-48 relative overflow-hidden flex items-center justify-center",
                                        service.img ? "cursor-pointer" : ""
                                    )}
                                    onClick={() => service.img && setLightboxImg(service.img)}
                                >
                                    {service.img ? (
                                        <img 
                                            src={service.img} 
                                            alt={service.title} 
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-[#001B3D]" />
                                    )}
                                    
                                    {/* Transparent Orange Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-[var(--theme-primary)]/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                                    
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[var(--theme-primary)] shadow-lg relative z-10 group-hover:scale-110 transition-transform">
                                        {index % 3 === 0 ? <Truck size={28} /> : index % 3 === 1 ? <Activity size={28} /> : <Shield size={28} />}
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-8 text-center bg-navy text-white relative z-10">
                                    <h3 className="font-black uppercase text-base md:text-lg mb-3 tracking-tight group-hover:text-[var(--theme-primary)] transition-colors line-clamp-2">{service.title}</h3>
                                    <div className="w-8 h-1 bg-[var(--theme-primary)] mx-auto mb-4" />
                                    <p className="text-white/60 text-sm font-medium leading-relaxed">
                                        {service.description}
                                    </p>
                                    
                                    {/* Action Button */}
                                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                        {(!experienceButton.action || experienceButton.action === 'whatsapp') && (
                                            <>
                                            <a 
                                                href={`https://wa.me/${data.whatsapp?.replace(/\D/g, '')}?text=Hola, deseo información sobre ${service.title}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-[var(--theme-primary)] hover:brightness-90 text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 transition-all duration-300 rounded-sm inline-block shadow-md animate-none"
                                            >
                                                {btnText}
                                            </a>
                                            {data.plan === 'catalog' && (
                                            <button
                                                onClick={() => {
                                                    const url = new URL(window.location.href);
                                                    url.searchParams.set('cat', service.title.toLowerCase());
                                                    window.history.pushState({}, '', url.toString());
                                                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }}
                                                className="bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 transition-colors duration-300 rounded-sm inline-block shadow-md border border-white/20 cursor-pointer"
                                            >
                                                Ver catálogo
                                            </button>
                                            )}
                                            </>
                                        )}
                                        {experienceButton.action === 'link' && (
                                            <a 
                                                href={experienceButton.url || "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-[var(--theme-primary)] hover:brightness-90 text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 transition-all duration-300 rounded-sm inline-block shadow-md animate-none"
                                            >
                                                {btnText}
                                            </a>
                                        )}
                                        {experienceButton.action === 'file' && (
                                            <a 
                                                href={experienceButton.fileUrl || "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="bg-[var(--theme-primary)] hover:brightness-90 text-white text-xs font-black uppercase tracking-wider py-2.5 px-6 transition-all duration-300 rounded-sm inline-flex items-center gap-2 shadow-md animate-none"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                {btnText}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* 4. CATALOG / PROJECTS GALLERY */}
            {(() => {
                let catalogData: any = null;
                try {
                    catalogData = typeof data.catalogo_json === 'string' 
                        ? JSON.parse(data.catalogo_json) 
                        : data.catalogo_json;
                } catch (e) {}

                if (!catalogData) return null;

                // Soporta tanto array directo como formato { products: [] }
                const products = Array.isArray(catalogData) ? catalogData : (catalogData.products || []);
                
                if (products && products.length > 0) {
                    return (
                        <section id="proyectos" className="py-24 px-4 bg-[#F5F7FA]">
                            <div className="max-w-7xl mx-auto">
                                <div className="text-center mb-16">
                                    <h4 className="text-[var(--theme-primary)] font-black tracking-widest uppercase text-sm mb-2">Galería de Proyectos</h4>
                                    <h2 className="text-4xl md:text-5xl font-black text-navy uppercase tracking-tight">Nuestro <span className="text-[var(--theme-primary)]">Catálogo</span></h2>
                                    <div className="w-20 h-1 bg-[var(--theme-primary)] mx-auto mt-6" />
                                </div>
                                
                                <CatalogGallery 
                                    data={catalogData} 
                                    whatsapp={data.whatsapp}
                                    onLightboxToggle={props.setIsLightboxOpen}
                                    templateId="industrial"
                                />
                            </div>
                        </section>
                    );
                }
                return null;
            })()}

            {/* NEW: VIDEO SECTION (Ahora debajo de catálogo) */}
            {(() => {
                const videoUrl = data.video_url || data.youtube_video_url || data.youtube || data.tiktok;
                const embedUrl = getVideoEmbedUrl?.(videoUrl);
                const directVideoUrl = getDirectVideoUrl(videoUrl);
                if (!embedUrl && !directVideoUrl) return null;

                const isVertical = checkIsVerticalVideo(videoUrl);

                return (
                    <section className="py-24 px-4 bg-navy relative overflow-hidden">
                        <div className="max-w-5xl mx-auto relative z-10">
                            <div className="text-center mb-12">
                                <h4 className="text-[var(--theme-primary)] font-black tracking-widest uppercase text-xs mb-3">En Acción</h4>
                                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">Nuestra <span className="text-[var(--theme-primary)]">Experiencia</span></h2>
                            </div>
                            <div className={cn(
                                "relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white/5 mx-auto",
                                isVertical ? "max-w-[400px] aspect-[9/16]" : "aspect-video"
                            )}>
                                {embedUrl ? (
                                    <iframe 
                                        src={embedUrl} 
                                        title="Video Corporativo"
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    />
                                ) : (
                                    <video
                                        width="100%"
                                        height="100%"
                                        controls
                                        autoPlay={false}
                                        muted
                                        playsInline
                                        className="w-full h-full object-contain"
                                        src={directVideoUrl!}
                                    >
                                        Tu navegador no soporta el elemento video.
                                    </video>
                                )}
                            </div>
                        </div>
                        {/* Background decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-primary)]/10 blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 blur-[100px]" />
                    </section>
                );
            })()}

            {/* ─── Slot Full-Width / Menú ─── */}
            {afterExperienceSlot && (
                <div className="w-full bg-white relative z-20">
                    {afterExperienceSlot}
                </div>
            )}

            {/* 3. WHY CHOOSE US (Stats) */}
            <section id="nosotros" className="py-24 px-4 bg-[#001B3D] text-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="w-full md:w-1/2">
                        <h4 className="text-[var(--theme-primary)] font-black tracking-widest uppercase text-sm mb-2">{chooseUs.badge}</h4>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8">
                            {chooseUs.title.split(' ').map((word: string, i: number) => (
                                <span key={i} className={i === chooseUs.title.split(' ').length - 1 ? "text-[var(--theme-primary)]" : ""}>
                                    {word}{' '}
                                </span>
                            ))}
                        </h2>
                        <p className="text-white/70 font-medium leading-relaxed mb-8">
                            {chooseUs.description}
                        </p>
                        
                        <div className="space-y-6">
                            {/* Progress Bars */}
                            {metrics.map((m: any, i: number) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                                        <span>{m.label}</span>
                                        <span className="text-[var(--theme-primary)]">{m.value}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--theme-primary)]" style={{ width: `${m.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 grid grid-cols-2 gap-6">
                        {stats.map((stat: any, i: number) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-6 flex flex-col items-center justify-center text-center group hover:bg-[var(--theme-primary)] transition-colors">
                                <div className="text-[var(--theme-primary)] group-hover:text-white mb-4">
                                    {/* Icon selector logic or default icons */}
                                    {i === 0 ? <Building size={36} /> : i === 1 ? <Activity size={36} /> : i === 2 ? <Shield size={36} /> : <Clock size={36} />}
                                </div>
                                <span className="text-4xl font-black mb-1 text-white">{stat.value}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white/80">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. LOCATION / MAP */}
                {(() => {
                    const addressText = data?.direccion || data?.address || '';
                    const rawGoogleBusiness = data?.google_business || "https://maps.app.goo.gl/zGHf7235Myux7T4P7";
                    const isGoogleLink = rawGoogleBusiness.startsWith('http');
                    
                    let buttonHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressText || data?.nombre_negocio || data?.nombre || "Loja, Ecuador")}`;
                    if (isGoogleLink) {
                        buttonHref = rawGoogleBusiness;
                    }
                    
                    return (
                        <section className="bg-white py-24 relative overflow-hidden" id="ubicacion">
                            <div className="absolute top-0 right-0 w-1/3 h-full bg-navy/5 transform skew-x-12 translate-x-32" />
                            <div className="max-w-7xl mx-auto px-4 relative z-10">
                                <div className="text-center mb-16">
                                    <h4 className="text-[var(--theme-primary)] font-black tracking-widest uppercase text-sm mb-2">Centro de Operaciones</h4>
                                    <h2 className="text-4xl md:text-5xl font-black text-navy uppercase tracking-tight mb-6">Nuestra <span className="text-[var(--theme-primary)]">Ubicación</span></h2>
                                    <p className="text-navy/60 font-medium leading-relaxed max-w-2xl mx-auto mb-8">
                                        {addressText || "Visítanos en nuestra ubicación oficial para una atención directa y especializada."}
                                    </p>
                                    <a 
                                        href={buttonHref}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 bg-navy text-white px-8 py-4 font-black uppercase text-sm tracking-widest hover:bg-[var(--theme-primary)] transition-colors"
                                    >
                                        <MapPin size={18} />
                                        Trazar Ruta
                                    </a>
                                </div>
                                <MapSection 
                                    googleBusiness={data?.google_business}
                                    businessName={data?.nombre_negocio || data?.nombre || ''}
                                    addressText={addressText}
                                    containerClassName="w-full h-[400px] md:h-[600px] relative border-4 border-navy/5 shadow-2xl overflow-hidden group"
                                    iframeStyle={{ filter: 'contrast(1.1) brightness(0.95)' }}
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--theme-primary)] z-10 flex items-center justify-center transform translate-x-12 -translate-y-12 rotate-45 group-hover:scale-110 transition-transform" />
                                </MapSection>
                            </div>
                        </section>
                    );
                })()}

            {/* 5. FOOTER / CONTACT */}
            <footer className="bg-[#001229] pt-20 pb-10 px-4 text-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-12 border-b border-white/10 pb-16">
                    <div className="w-full md:w-1/3 text-center md:text-left">
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-4">{data.nombre_negocio || data.nombre}</h2>
                        <p className="text-white/50 text-sm mb-6">{data.profesion || "Líderes en soluciones de alta calidad."}</p>
                        <div className="flex gap-4 justify-center md:justify-start">
                            {data.instagram && <a href={data.instagram} target="_blank" className="w-10 h-10 bg-white/5 hover:bg-[var(--theme-primary)] rounded-full flex items-center justify-center transition-colors"><Instagram size={18} /></a>}
                            {data.facebook && <a href={data.facebook} target="_blank" className="w-10 h-10 bg-white/5 hover:bg-[var(--theme-primary)] rounded-full flex items-center justify-center transition-colors"><Facebook size={18} /></a>}
                        </div>
                    </div>
                    
                    <div className="w-full md:w-2/3 flex flex-col md:flex-row justify-end gap-12 text-center md:text-right">
                        <div>
                            <h4 className="text-[var(--theme-primary)] font-black uppercase tracking-widest text-xs mb-6">Contacto Directo</h4>
                            <ul className="space-y-4 text-sm font-medium text-white/70">
                                {data.whatsapp && <li>{data.whatsapp}</li>}
                                {data.email && <li>{data.email}</li>}
                                {data.address && <li>{data.address}</li>}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-10 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                    &copy; {new Date().getFullYear()} {data.nombre_negocio || data.nombre}. Powered by ActivaQR.
                </div>
            </footer>

            {/* ─── LIGHTBOX ─── */}
            {lightboxImg && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 md:p-10 cursor-pointer"
                    onClick={() => setLightboxImg(null)}
                >
                    {/* Close button */}
                    <button 
                        onClick={() => setLightboxImg(null)}
                        className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {/* Image */}
                    <img 
                        src={lightboxImg} 
                        alt="Imagen ampliada"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
