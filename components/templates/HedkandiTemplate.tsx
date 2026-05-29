"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { HedkandiTemplateProps } from './types';
import { safeParse } from '@/lib/jsonUtils';
import MapSection from '@/components/MapSection';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkIsVerticalVideo } from '@/lib/videoUtils';
import ShareButton from '@/components/ShareButton';


/** Imágenes de fallback organizadas por categoría visual para la grilla de experiencia */
const FALLBACK_EXPERIENCE_IMAGES = [
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=600&auto=format&fit=crop',
];

export default function HedkandiTemplate(props: HedkandiTemplateProps) {
    // Auto-play for the Hero Slider
    React.useEffect(() => {
        if (props.activeSlides && props.activeSlides.length > 1) {
            const interval = setInterval(() => {
                const nextIndex = ((props.currentSlideIndex || 0) + 1) % props.activeSlides!.length;
                props.setCurrentSlideIndex?.(nextIndex);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [props.activeSlides, props.currentSlideIndex, props.setCurrentSlideIndex]);
 
    // State for the Experience Slider
    const [activeExpIndex, setActiveExpIndex] = React.useState(0);
    // State for Lightbox
    const [lightboxImg, setLightboxImg] = React.useState<string | null>(null);
    // Touch handlers for swipe on Experience Slider
    const [touchStart, setTouchStart] = React.useState<number>(0);
    const handleTouchStartExperience = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
    };
    const handleTouchMoveExperience = (e: React.TouchEvent) => {
        if (touchStart === 0) return;
        const diff = e.touches[0].clientX - touchStart;
        if (Math.abs(diff) > 60) {
            const rawLines = props.data?.productos_servicios?.split('\n').filter((l: string) => l.trim().length > 0) || [];
            const bannerCount = rawLines.length >= 1 ? rawLines.length : 3;
            if (diff > 0) {
                setActiveExpIndex(prev => (prev > 0 ? prev - 1 : bannerCount - 1));
            } else {
                setActiveExpIndex(prev => (prev < bannerCount - 1 ? prev + 1 : 0));
            }
            setTouchStart(0);
        }
    };
    const handleTouchEndExperience = () => setTouchStart(0);

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
 
    return (
        <div 
            className="w-full min-h-screen bg-white text-[#1A1A1A] overflow-x-hidden selection:bg-[#7292ab] selection:text-white"
            style={{ 
                '--theme-primary': props.themePrimary || '#FF5C00',
                '--theme-bg': props.extractedBg ? `color-mix(in srgb, ${props.extractedBg} 20%, #050510)` : '#001549',
            } as React.CSSProperties}
        >
            
            {/* HIDE GLOBAL HEADER/FOOTER */}
            <style dangerouslySetInnerHTML={{__html: `
                /* Hide global navigation for this template */
                header, footer, nav { display: none !important; }
            `}} />

            {/* 1. HERO SECTION */}
            <section className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-end pb-4 md:pb-8 bg-[#1A1A1A]">
                {/* Dynamic Banner Slider */}
                <div className="absolute inset-0 z-0">
                    {props.activeSlides && props.activeSlides.length > 0 ? (
                        props.activeSlides.map((slide, idx) => (
                            <motion.div
                                key={slide.id || idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: props.currentSlideIndex === idx ? 1 : 0 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="absolute inset-0"
                                style={{ 
                                    pointerEvents: props.currentSlideIndex === idx ? 'auto' : 'none'
                                }}
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center md:hidden"
                                    style={{ backgroundImage: `url(${slide.portada_movil || slide.portada_desktop || props.data?.portada_movil || props.data?.portada_desktop})` }}
                                />
                                <div
                                    className="absolute inset-0 bg-cover bg-center hidden md:block"
                                    style={{ backgroundImage: `url(${slide.portada_desktop || slide.portada_movil || props.data?.portada_desktop || props.data?.portada_movil})` }}
                                />

                            </motion.div>
                        ))
                    ) : (
                        <div className="absolute inset-0">
                            <div
                                className="absolute inset-0 bg-cover bg-center md:hidden"
                                style={{ backgroundImage: `url(${props.data?.portada_movil || props.data?.portada_desktop})` }}
                            />
                            <div
                                className="absolute inset-0 bg-cover bg-center hidden md:block"
                                style={{ backgroundImage: `url(${props.data?.portada_desktop || props.data?.portada_movil})` }}
                            />

                        </div>
                    )}
                </div>

                {/* Main Hero Content - Centered */}
                <div className="relative z-10 w-full px-4 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
                    {/* Text Content */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="w-full max-w-4xl flex flex-col items-center"
                    >
                        <h1 className="w-fit mx-auto bg-black/50 backdrop-blur-md px-8 py-4 sm:px-10 sm:py-5 rounded-[2rem] text-white text-[28px] sm:text-5xl md:text-7xl lg:text-[55px] leading-none font-display-condensed uppercase drop-shadow-2xl mb-4 break-words [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000] border border-white/10">
                            {props.activeSlides && props.activeSlides[props.currentSlideIndex || 0]?.title 
                                ? props.activeSlides[props.currentSlideIndex || 0].title 
                                : (props.data?.nombre_negocio || "FOR THOSE WHO KNOW")}
                        </h1>
                        
                        {(props.activeSlides?.[props.currentSlideIndex || 0]?.description || props.data?.bio) && (
                            <p className="w-fit mx-auto bg-black/50 backdrop-blur-md px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl text-white/90 font-sans-body text-base sm:text-base md:text-[20px] uppercase tracking-[0.2em] mb-8 max-w-3xl leading-relaxed [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000] border border-white/10 font-bold">
                                {props.activeSlides?.[props.currentSlideIndex || 0]?.description || props.data?.bio || "PREMIUM EXPERIENCE"}
                            </p>
                        )}

                        <div className="flex flex-col items-center gap-3 w-full px-2">
                            {/* Botón principal: WhatsApp — mensaje personalizado según slide activo */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    const waNumber = props.data?.whatsapp?.replace(/\D/g, '') || '';
                                    const activeTitle = props.activeSlides?.[props.currentSlideIndex || 0]?.title || props.data?.nombre_negocio || '';
                                    const message = activeTitle
                                        ? `Hola, vi tu perfil y me interesa ${activeTitle}`
                                        : 'Hola, vi tu perfil y me gustaría saber más';
                                    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className="w-full max-w-xs px-6 py-3 font-display-condensed text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2"
                                style={{ backgroundColor: '#25D366', color: 'white', border: 'none !important' }}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 1.016-.04.036-.06.054-.06.066-.015.045-.004.101.025.136.167.19.604.698.706.814.099.115.173.223.223.372.05.149.05.298-.025.471-.074.173-.397.867-.546 1.238-.074.223-.347.297-.545.223-.348-.124-1.32-.495-2.085-1.264-.77-.77-1.264-1.735-1.387-2.084-.074-.198.05-.471.223-.545.074-.025.124-.05.173-.099.074-.074.149-.198.223-.322.074-.124.099-.248.124-.372.025-.124.025-.273-.025-.422-.05-.149-.421-1.016-.578-1.389-.173-.397-.347-.397-.57-.397-.149 0-.322 0-.496.025-.173.025-.446.074-.669.298-.223.223-.843.843-.843 2.059 0 1.216.892 2.403 1.015 2.557.124.149 1.736 2.678 4.215 3.66.589.233 1.05.372 1.409.496.595.198 1.137.174 1.567.105.485-.074 1.473-.595 1.68-1.17.207-.575.207-1.068.148-1.17-.05-.099-.173-.149-.446-.298Z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.66 1.433 5.167L2 22l4.833-1.433A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm0 18.182a8.16 8.16 0 0 1-4.155-1.147l-.298-.179-2.869.85.857-2.8-.194-.31a8.165 8.165 0 0 1-1.25-4.414c0-4.523 3.686-8.186 8.21-8.186 2.19 0 4.248.853 5.796 2.4a8.137 8.137 0 0 1 2.404 5.786c0 4.524-3.687 8.19-8.21 8.19l-.091-.19Z"/></svg>
                                WHATSAPP
                            </motion.button>

                            {/* Botón secundario: Compartir — estilo sutil Classic */}
                            <ShareButton
                                title={props.activeSlides && props.activeSlides[props.currentSlideIndex || 0]?.title
                                    ? props.activeSlides[props.currentSlideIndex || 0].title
                                    : (props.data?.nombre_negocio || "FOR THOSE WHO KNOW")}
                                text={props.data?.bio || "PREMIUM EXPERIENCE"}
                                variant="button"
                                buttonStyle="outline"
                                buttonText="COMPARTIR"
                                className="!bg-black/80 backdrop-blur-sm !border-white/30 !text-white hover:!bg-black px-5 py-2 rounded-full text-xs tracking-widest"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. THE EXPERIENCE SLIDER — Carrusel de banners contenidos y redondeados */}
            {!props.hideExperience && (() => {
                const rawLines = props.data?.productos_servicios
                    ?.split('\n')
                    .filter((l: string) => l.trim().length > 0) || [];

                const banners = rawLines.length >= 1
                    ? rawLines.map((cat: string, i: number) => {
                        const customImg = props.experienceImages?.find(e => e.index === i);
                        const customTitleObj = props.experienceTitles?.find(t => t.index === i);
                        const displayTitle = customTitleObj?.title || (props as any)[cat] || cat;
                        
                        return {
                            title: displayTitle.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '').trim().toUpperCase(),
                            num: `0${i + 1}`,
                            subtitle: props.experienceSubtitle || 'Especialidad',
                            img: customImg?.url || FALLBACK_EXPERIENCE_IMAGES[i % FALLBACK_EXPERIENCE_IMAGES.length],
                        };
                    })
                    : [
                        { title: 'SERVICES', num: '01', subtitle: 'Premium Care', img: FALLBACK_EXPERIENCE_IMAGES[0] },
                        { title: 'STYLING', num: '02', subtitle: 'Expert Cut', img: FALLBACK_EXPERIENCE_IMAGES[1] },
                        { title: 'BEAUTY', num: '03', subtitle: 'Full Spa', img: FALLBACK_EXPERIENCE_IMAGES[2] },
                    ];

                const whatsappNumber = props.data?.whatsapp?.replace(/\D/g, '') || '';
                const getExperienceButtonForIndex = (index: number) => {
                    const raw = props.data?.json_override;
                    const parsed = safeParse(raw, {});
                    
                    if (parsed.experienceButtons && parsed.experienceButtons[index]) {
                        const btn = parsed.experienceButtons[index];
                        return {
                            text: btn.text || "CONSULTAR AHORA",
                            action: btn.action || "whatsapp",
                            url: btn.url || "",
                            fileUrl: btn.fileUrl || ""
                        };
                    }
                    
                    if (parsed.experienceButton) {
                        return {
                            text: parsed.experienceButton.text || "CONSULTAR AHORA",
                            action: parsed.experienceButton.action || "whatsapp",
                            url: parsed.experienceButton.url || "",
                            fileUrl: parsed.experienceButton.fileUrl || ""
                        };
                    }
                    
                    return {
                        text: "CONSULTAR AHORA",
                        action: "whatsapp",
                        url: "",
                        fileUrl: ""
                    };
                };

                return (
                    <section className="w-full bg-white py-24 overflow-hidden">
                        <div className="px-4 md:px-12 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-7xl mx-auto">
                            <div>
                                <h2 className="font-display-condensed text-3xl sm:text-4xl md:text-6xl tracking-tight text-black uppercase leading-none break-words">
                                    {props.experienceTitle || "NUESTROS SERVICIOS"}
                                </h2>
                                <p className="font-sans-body text-xs md:text-sm uppercase tracking-[0.3em] text-black/40 mt-4">
                                    Explora nuestra selección exclusiva
                                </p>
                            </div>
                            
                            {/* Slider Controls */}
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setActiveExpIndex(prev => (prev > 0 ? prev - 1 : banners.length - 1))}
                                    className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button 
                                    onClick={() => setActiveExpIndex(prev => (prev < banners.length - 1 ? prev + 1 : 0))}
                                    className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="relative w-full max-w-7xl mx-auto px-4 md:px-12">
                            <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl"
                                onTouchStart={handleTouchStartExperience}
                                onTouchMove={handleTouchMoveExperience}
                                onTouchEnd={handleTouchEndExperience}
                            >
                                {banners.map((col: any, idx: number) => {
                                    const experienceButton = getExperienceButtonForIndex(idx);
                                    return (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0 }}
                                        animate={{ 
                                            opacity: activeExpIndex === idx ? 1 : 0,
                                            scale: activeExpIndex === idx ? 1 : 1.1,
                                            x: activeExpIndex === idx ? 0 : (idx < activeExpIndex ? -100 : 100)
                                        }}
                                        transition={{ duration: 0.8, ease: "circOut" }}
                                        className="absolute inset-0 w-full h-full"
                                        style={{ display: activeExpIndex === idx ? 'block' : 'none' }}
                                    >
                                        {/* Clickable area — opens lightbox */}
                                        <div 
                                            className="absolute inset-0 cursor-pointer"
                                            onClick={() => setLightboxImg(col.img)}
                                        >
                                            {/* Background Image */}
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{ backgroundImage: `url(${col.img})` }}
                                            />
                                            {/* Gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />
                                        </div>
                                        
                                        {/* Content Overlay (above clickable area) */}
                                        <div className="relative z-10 h-full w-full p-8 md:p-20 flex flex-col justify-center items-start pointer-events-none">
                                            <motion.div
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: activeExpIndex === idx ? 0 : 20, opacity: activeExpIndex === idx ? 1 : 0 }}
                                                transition={{ delay: 0.3, duration: 0.6 }}
                                                className="pointer-events-auto"
                                            >
                                                <span className="font-display-condensed text-white/40 text-xl tracking-[0.4em] uppercase block mb-4">
                                                    Categoría {col.num}
                                                </span>
                                                <h3 className="font-display-condensed text-lg md:text-2xl lg:text-3xl text-white uppercase tracking-tight mb-4 drop-shadow-xl line-clamp-2">
                                                    {col.title}
                                                </h3>
                                                <p 
                                                    className="font-sans-body tracking-[0.5em] uppercase text-xs md:text-sm font-bold mb-10" 
                                                    style={{ color: props.themePrimary !== '#1A1A1A' ? props.themePrimary : '#dc2626' }}
                                                >
                                                    {col.subtitle}
                                                </p>
                                                
                                                {(!experienceButton.action || experienceButton.action === 'whatsapp') && (
                                                    <div className="flex flex-wrap gap-3 pointer-events-auto">
                                                        <motion.a
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            href={`https://wa.me/${whatsappNumber}?text=Hola, deseo información sobre ${col.title}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-white text-black px-10 py-4 rounded-full font-display-condensed text-lg md:text-xl tracking-[0.2em] uppercase transition-all duration-300 hover:bg-black hover:text-white inline-block shadow-xl"
                                                        >
                                                            {experienceButton.text}
                                                        </motion.a>
                                                        {props.data?.plan === 'catalog' && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                const url = new URL(window.location.href);
                                                                url.searchParams.set('cat', col.title.toLowerCase());
                                                                window.history.pushState({}, '', url.toString());
                                                                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                            }}
                                                            className="bg-[var(--theme-primary,#FF5C00)] text-white px-8 py-4 rounded-full font-display-condensed text-lg md:text-xl tracking-[0.2em] uppercase transition-all duration-300 hover:brightness-110 inline-block shadow-xl cursor-pointer"
                                                            style={{ backgroundColor: props.themePrimary || '#FF5C00' }}
                                                        >
                                                            Ver catálogo
                                                        </motion.button>
                                                        )}
                                                    </div>
                                                )}
                                                {experienceButton.action === 'link' && (
                                                    <motion.a
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        href={experienceButton.url || "#"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-white text-black px-10 py-4 rounded-full font-display-condensed text-lg md:text-xl tracking-[0.2em] uppercase transition-all duration-300 hover:bg-black hover:text-white inline-block shadow-xl pointer-events-auto"
                                                    >
                                                        {experienceButton.text}
                                                    </motion.a>
                                                )}
                                                {experienceButton.action === 'file' && (
                                                    <motion.a
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        href={experienceButton.fileUrl || "#"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download
                                                        className="bg-white text-black px-10 py-4 rounded-full font-display-condensed text-lg md:text-xl tracking-[0.2em] uppercase transition-all duration-300 hover:bg-black hover:text-white inline-flex items-center gap-2 shadow-xl pointer-events-auto"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                        {experienceButton.text}
                                                    </motion.a>
                                                )}
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                    );
                                })}
                            </div>
                            
                            {/* Pagination Dots */}
                            <div className="flex justify-center gap-2 mt-10">
                                {banners.map((_: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveExpIndex(idx)}
                                        className={`h-2 transition-all duration-500 rounded-full ${
                                            activeExpIndex === idx ? 'w-12 bg-black' : 'w-4 bg-black/10'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

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
                    </section>
                );
            })()}

            {/* ─── VIDEO/DESTACADO SECTION ─── */}
            <section className="bg-white py-12 px-4">
                <div className="max-w-7xl mx-auto flex justify-center">
                    {(() => {
                        const videoUrl = props.data?.video_url || props.data?.youtube_video_url || props.data?.youtube_url;
                        const embedUrl = props.getVideoEmbedUrl(videoUrl);
                        const isVertical = checkIsVerticalVideo(videoUrl);

                        return (
                            <motion.div
                                initial={{ y: 40, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className={cn(
                                    "w-full flex justify-center mx-auto",
                                    embedUrl ? (isVertical ? "max-w-[450px]" : "max-w-4xl") : "max-w-[400px]"
                                )}
                            >
                                {embedUrl ? (
                                    <div className="w-full rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-black/5 bg-black/5 p-3 md:p-6">
                                        <div className={cn(
                                            "rounded-[2rem] overflow-hidden bg-black",
                                            isVertical ? "aspect-[9/16]" : "aspect-video"
                                        )}>
                                            <iframe 
                                                width="100%" 
                                                height="100%" 
                                                src={embedUrl} 
                                                title="Video player" 
                                                frameBorder="0" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen 
                                                className="w-full h-full"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full aspect-[4/5] rounded-[3rem] overflow-hidden border border-black/5 shadow-2xl">
                                        <img 
                                            src={props.data?.foto_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop"} 
                                            alt={props.data?.nombre_negocio}
                                            className="w-full h-full object-cover transition-all duration-1000"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })()}
                </div>
            </section>

            {/* ─── SLOT 1: Después de Experience (menú, galería, servicios) ─── */}
            {props.afterExperienceSlot}

            {/* 3. BIOGRAPHY SECTION */}
            <section className="bg-[#1A1A1A] text-white py-24 px-4 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Logo del cliente */}
                    {props.data?.foto_url && (
                        <div className="mb-10 flex justify-center">
                            <img 
                                src={props.data.foto_url} 
                                alt={props.data.nombre_negocio}
                                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-white/10 object-cover grayscale hover:grayscale-0 transition-all duration-700"
                            />
                        </div>
                    )}
                    
                    <div className="mb-8 whitespace-pre-line text-white/80 font-sans-body text-sm md:text-lg leading-relaxed max-w-2xl mx-auto">
                        {props.data?.bio || "Expertos en crear experiencias únicas de belleza y bienestar."}
                    </div>
                    
                    <p 
                        className="font-display-condensed text-3xl md:text-4xl tracking-widest uppercase italic"
                        style={{ color: props.themePrimary !== '#1A1A1A' ? props.themePrimary : '#dc2626' }}
                    >
                        {props.data?.profesion || "Premium Experience"}
                    </p>
                </div>
            </section>

            {/* AUTHORITY MODULE SECTION */}
            {(() => {
                const authorityModule = safeParse(props.data?.json_override, {}).authorityModule || { enabled: false };
                if (!authorityModule.enabled) return null;

                return (
                    <section className="bg-white py-24 md:py-32 px-4 md:px-12 relative overflow-hidden">
                        <div className="max-w-7xl mx-auto border-y border-black/10 py-20 relative">
                            <div className="flex flex-col items-center text-center">
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="flex items-center gap-3 border border-black px-6 py-2 rounded-full mb-10"
                                >
                                    <Shield size={16} />
                                    <span className="font-sans-body text-[10px] md:text-xs font-black uppercase tracking-[0.4em]">{authorityModule.badge || "ESTÁNDAR DE EXCELENCIA"}</span>
                                </motion.div>

                                <motion.h3 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="font-display-condensed text-5xl md:text-[8rem] text-black uppercase leading-[0.9] mb-10 tracking-tighter"
                                >
                                    {authorityModule.title || "LEGADO Y CONFIANZA"}
                                </motion.h3>

                                {authorityModule.description && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 }}
                                        className="font-serif-elegant italic text-2xl md:text-4xl text-black/60 max-w-4xl mb-20 leading-snug"
                                    >
                                        {authorityModule.description}
                                    </motion.p>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-20 w-full mb-24">
                                    {authorityModule.stats?.map((stat: any, i: number) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.4 + (i * 0.1) }}
                                            className="flex flex-col items-center"
                                        >
                                            <span className="font-display-condensed text-6xl md:text-8xl text-black italic leading-none mb-4">{stat.value}</span>
                                            <span className="font-sans-body text-[10px] md:text-xs font-black text-black/30 uppercase tracking-[0.3em]">{stat.label}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 w-full text-left">
                                    {authorityModule.metrics?.map((metric: any, i: number) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.6 + (i * 0.1) }}
                                            className="space-y-6"
                                        >
                                            <div className="flex justify-between items-end border-b border-black/5 pb-4">
                                                <span className="font-sans-body text-xs md:text-sm font-black text-black uppercase tracking-[0.3em]">{metric.label}</span>
                                                <span className="font-display-condensed text-3xl md:text-4xl italic text-black">{metric.value}%</span>
                                            </div>
                                            <div className="h-[2px] w-full bg-black/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${metric.value}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 2, delay: 1, ease: [0.16, 1, 0.3, 1] }}
                                                    className="h-full bg-black"
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                );
            })()}

            {/* 4. GOOGLE TRUST & SOCIAL SECTION */}
            {props.data?.google_rating && (
            <section className="bg-[#1A1A1A] py-24 px-4 md:px-12 relative overflow-hidden">
                {/* Background ambient glow */}
                <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none opacity-20"
                    style={{ backgroundColor: props.themePrimary !== '#1A1A1A' ? props.themePrimary : '#dc2626' }}
                ></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-[3rem] p-8 md:p-16 flex flex-col items-center text-center shadow-2xl">
                        {/* Title with lines */}
                        <div className="flex items-center gap-4 mb-10 w-full justify-center">
                            <div 
                                className="h-[1px] flex-1 opacity-50"
                                style={{ background: `linear-gradient(to right, transparent, ${props.themePrimary !== '#1A1A1A' ? props.themePrimary : '#dc2626'})` }}
                            ></div>
                            <span 
                                className="font-sans-body text-[10px] md:text-xs tracking-[0.3em] uppercase font-bold"
                                style={{ color: props.themePrimary !== '#1A1A1A' ? props.themePrimary : '#dc2626' }}
                            >
                                TESTIMONIO DE NUESTROS CLIENTES
                            </span>
                            <div 
                                className="h-[1px] flex-1 opacity-50"
                                style={{ background: `linear-gradient(to left, transparent, ${props.themePrimary !== '#1A1A1A' ? props.themePrimary : '#dc2626'})` }}
                            ></div>
                        </div>

                        {/* Stars */}
                        <div className="flex gap-2 mb-6">
                            {[...Array(5)].map((_, i) => {
                                const r = parseFloat(String(props.data?.google_rating));
                                const isFilled = i < Math.floor(r);
                                const isHalf = !isFilled && i < r;
                                return (
                                    <svg 
                                        key={i} 
                                        className="w-6 h-6 md:w-8 md:h-8 fill-current" 
                                        viewBox="0 0 20 20"
                                        style={{ 
                                            color: isFilled || isHalf ? (props.themePrimary !== '#1A1A1A' ? props.themePrimary : '#dc2626') : 'rgba(255,255,255,0.15)',
                                            opacity: isHalf ? 0.5 : 1
                                        }}
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                );
                            })}
                        </div>

                        {/* Rating Number */}
                        <div className="font-display-condensed text-8xl md:text-9xl leading-none text-white mb-4">
                            {parseFloat(String(props.data?.google_rating)).toFixed(1)}
                        </div>
                        <div className="font-sans-body text-xs md:text-sm tracking-widest uppercase text-white/60 mb-10">
                            {props.data?.google_reviews_count || "10+"} RESEÑAS EN <span className="font-bold" style={{ color: props.themePrimary !== '#1A1A1A' ? props.themePrimary : '#dc2626' }}>GOOGLE BUSINESS</span>
                        </div>

                        {/* Quote */}
                        <p className="font-sans-body text-sm md:text-lg text-white/80 italic mb-12 max-w-2xl leading-relaxed">
                            "Gracias a nuestra comunidad por calificarnos con {props.data?.google_rating} estrellas. ¡Tu opinión nos ayuda a crecer!"
                        </p>

                        {/* Action Button */}
                        <a 
                            href={props.data?.google_business || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex items-center gap-4 bg-white/5 border border-white/10 hover:bg-white/10 px-8 md:px-12 py-5 rounded-2xl transition-all duration-500"
                        >
                            <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                                style={{ 
                                    backgroundColor: `${props.themePrimary !== '#1A1A1A' ? props.themePrimary : '#dc2626'}33`,
                                    color: props.themePrimary !== '#1A1A1A' ? props.themePrimary : '#dc2626'
                                }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="font-display-condensed text-lg md:text-xl tracking-[0.2em] text-white uppercase">
                                VER TODAS LAS RESEÑAS Y CÓMO LLEGAR
                            </span>
                        </a>

                        {/* Social Links Row */}
                        <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-12">
                            {['instagram', 'whatsapp', 'facebook', 'tiktok_url'].map((social) => {
                                const url = props.data?.[social];
                                if (!url) return null;
                                return (
                                    <a 
                                        key={social}
                                    href={social === 'whatsapp' ? (url.startsWith('http') ? url : `https://wa.me/${url.replace(/\D/g, '')}`) : url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/40 hover:text-red-500 transition-colors duration-300"
                                    >
                                        {social === 'instagram' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
                                        {social === 'whatsapp' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>}
                                        {social === 'facebook' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                                        {social === 'tiktok_url' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.53.68V17c0 .02 0 .03 0 .05 0 2.25-1.83 4.07-4.08 4.07s-4.08-1.83-4.08-4.07c0-2.25 1.83-4.07 4.08-4.07.43 0 .85.07 1.24.2v-2.6c-.4-.06-.8-.1-1.24-.1-3.69 0-6.68 2.99-6.68 6.68S4.77 23.88 8.45 23.88c3.69 0 6.68-2.99 6.68-6.68V7.1c1.06.78 2.37 1.25 3.77 1.32V5.78c-1.58-.05-3-.79-3.96-2.01-.54-.7-.88-1.55-.94-2.48l-.02-.61h-1.45z"/></svg>}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>
            )}

            {/* ─── SLOT 2: Antes de Marquee CTA (info secundaria, ubicación, horarios) ─── */}
            {props.beforeMarqueeSlot}

            {/* 5. MARQUEE & CTA SECTION */}
            <section className="bg-white py-24 border-y border-black overflow-hidden relative">
                {/* Custom CSS for Marquee */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes marquee-scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-hedkandi-marquee {
                        display: flex;
                        width: fit-content;
                        animation: marquee-scroll 30s linear infinite;
                    }
                `}} />

                <div className="animate-hedkandi-marquee whitespace-nowrap mb-12">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="font-display-condensed text-[10rem] md:text-[15rem] leading-none text-black mx-8 uppercase italic opacity-10">
                            {props.data?.nombre_negocio || "HEDKANDI"}
                        </span>
                    ))}
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center px-4">
                    <h4 className="font-display-condensed text-3xl md:text-4xl tracking-widest mb-8 text-black">
                        ORDENA POR WHATSAPP
                    </h4>
                    <button
                        onClick={props.downloadVCF}
                        className="bg-black text-white px-12 md:px-16 py-4 md:py-5 font-display-condensed text-xl md:text-2xl tracking-widest uppercase hover:bg-white hover:text-black hover:border-black border-none transition-all duration-500"
                        style={{ border: 'none !important' }}
                    >
                        GUARDAR CONTACTO
                    </button>
                </div>
            </section>

            {props.afterMarqueeSlot}

            {/* Ubicación / Mapa */}
            <section className="w-full bg-white pt-24 pb-0 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-12 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                    <div className="flex-1">
                        <h4 className="font-display-condensed text-3xl md:text-4xl tracking-widest text-black mb-4">
                            UBICACIÓN ESTRATÉGICA
                        </h4>
                        <p className="font-sans-body uppercase tracking-[0.3em] text-xs md:text-sm text-black/40 leading-relaxed max-w-xl">
                            {props.data?.direccion || props.data?.address || "Visítanos en nuestra ubicación oficial"}
                        </p>
                    </div>
                    <a 
                        href={
                            (props.data?.google_business || "").startsWith('http')
                                ? props.data?.google_business
                                : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(props.data?.direccion || props.data?.address || props.data?.nombre_negocio || props.data?.nombre || "Loja, Ecuador")}`
                        }
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="border border-black px-10 py-4 font-display-condensed text-lg tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300 whitespace-nowrap"
                    >
                        VER EN GOOGLE MAPS
                    </a>
                </div>
                
                <MapSection 
                    googleBusiness={props.data?.google_business}
                    businessName={props.data?.nombre_negocio || props.data?.nombre || ''}
                    addressText={props.data?.direccion || props.data?.address || ''}
                    containerClassName="w-full h-[450px] md:h-[650px] relative"
                    iframeClassName="hover:grayscale transition-all duration-1000"
                />
            </section>
        </div>
    );
}
