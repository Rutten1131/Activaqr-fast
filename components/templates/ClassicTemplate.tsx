"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Download, User, Smartphone, Zap, CheckCircle, Phone, MessageSquare, UserPlus,
    Mail, Briefcase, Settings, ChevronDown, ChevronLeft, ChevronRight, Utensils, Shield
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import CatalogGallery from '@/components/card/CatalogGallery';
import CabinetMenu from '@/components/CabinetMenu';
import ShareButton from '@/components/ShareButton';
import { safeParse } from '@/lib/jsonUtils';
import MapSection from '@/components/MapSection';
import type { ClassicTemplateProps } from '@/components/templates/types';
import { checkIsVerticalVideo, getDirectVideoUrl } from '@/lib/videoUtils';
import LimitedTimeOffer from '@/components/LimitedTimeOffer';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const StarRating = ({ rating, count, className }: { rating: number | string, count?: number | string, className?: string }) => {
    const r = typeof rating === 'string' ? parseFloat(rating) : rating;
    if (!r || isNaN(r)) return null;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} className={cn("w-3 h-3 md:w-4 md:h-4 shrink-0", i < Math.floor(r) ? "text-yellow-400 fill-yellow-400" : (i < r ? "text-yellow-400 fill-yellow-400 opacity-50" : "text-white/20 fill-white/20"))} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
            <span className="text-[10px] md:text-sm font-black text-white/90">{r.toFixed(1)}</span>
            {count && <span className="text-[8px] md:text-xs font-bold text-white/40 uppercase tracking-tighter">({count} reseñas)</span>}
        </div>
    );
};

// getYouTubeID y getTikTokID se reciben como props desde VCardClient
// Fuente única: lib/videoUtils.ts

export default function ClassicTemplate({
    data,
    slug,
    extractedBg,
    themePrimary,
    themeTextOnPrimary,
    activeSlides,
    currentSlideIndex,
    setCurrentSlideIndex,
    isAccordionOpen,
    setIsAccordionOpen,
    wifiStep,
    setWifiStep,
    isProductsExpanded,
    setIsProductsExpanded,
    setIsEditModalOpen,
    setIsLightboxOpen,
    setIsFooterVisible,
    handleHeroClick,
    downloadVCF,
    isPlaceholderUrl,
    getVideoEmbedUrl,
    showCatalog = false,
    afterExperienceSlot,
    beforeMarqueeSlot,
    afterMarqueeSlot
}: ClassicTemplateProps & { 
    afterExperienceSlot?: React.ReactNode, 
    beforeMarqueeSlot?: React.ReactNode,
    afterMarqueeSlot?: React.ReactNode 
}) {
    console.log("ACTIVAQR_DEBUG: ClassicTemplate Loaded for slug:", slug);

    // Estado local para Lightbox de productos
    const [lightboxImg, setLightboxImg] = React.useState<string | null>(null);

    // Cerrar lightbox con Escape y bloquear scroll
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

    const handleWhatsapp = () => {
        if (data.whatsapp) {
            window.open(`https://wa.me/${data.whatsapp.replace(/\D/g, '')}`, '_blank');
        }
    };

    const authorityModule = (() => {
        const raw = data.json_override;
        const parsed = safeParse(raw, {});
        return parsed.authorityModule || { enabled: false };
    })();

    // Hero Offer from active slide (per-banner offer)
    const heroOffer = (() => {
        if (!activeSlides || activeSlides.length === 0) return undefined;
        const currentSlide = activeSlides[currentSlideIndex];
        if (!currentSlide) return undefined;
        
        // Build offer object from slide's offer fields
        if (currentSlide.offerEnabled) {
            return {
                enabled: true,
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

    // Offer color from active slide (falls back to themePrimary)
    const offerColor = (() => {
        if (!activeSlides || activeSlides.length === 0) return themePrimary;
        const currentSlide = activeSlides[currentSlideIndex];
        return currentSlide?.offerColor || themePrimary;
    })();

    const socialLinks = [
        {
            id: 'whatsapp',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M19.057 4.298c-1.883-1.884-4.386-2.922-7.05-2.922-5.495 0-9.968 4.471-9.968 9.966 0 1.756.459 3.468 1.328 4.975l-1.41 5.148 5.266-1.381c1.455.794 3.09 1.211 4.78 1.212h.004c5.493 0 9.964-4.471 9.964-9.966 0-2.662-1.036-5.166-2.921-7.052zm-7.05 15.393h-.003c-1.488 0-2.946-.4-4.23-1.155l-.304-.18-3.146.825.839-3.067-.197-.314c-.829-1.321-1.267-2.854-1.267-4.43 0-4.43 3.605-8.036 8.04-8.036 2.148 0 4.167.837 5.684 2.355 1.517 1.518 2.352 3.538 2.352 5.686-.002 4.434-3.609 8.041-8.043 8.041zm4.412-6.03c-.242-.121-1.431-.707-1.652-.788-.221-.081-.383-.121-.544.121-.161.242-.625.787-.766.949-.141.161-.282.181-.524.061-.242-.121-1.02-.376-1.943-1.199-.718-.641-1.203-1.433-1.344-1.675-.141-.242-.015-.373.106-.493.109-.108.242-.282.363-.423.121-.141.161-.242.242-.403.081-.161.04-.303-.02-.424-.061-.121-.544-1.312-.746-1.796-.196-.472-.397-.407-.544-.415-.141-.007-.302-.008-.463-.008-.161 0-.423.061-.644.303-.221.242-.846.827-.846 2.018 0 1.191.866 2.336.987 2.5.121.164 1.706 2.605 4.133 3.651.577.249 1.027.397 1.378.508.579.185 1.107.158 1.523.096.465-.069 1.431-.585 1.632-1.15.201-.564.201-1.049.141-1.15-.06-.101-.221-.161-.463-.282z"/>
                </svg>
            ),
            label: 'WhatsApp',
            value: data.whatsapp,
            color: 'bg-[#25D366] text-white shadow-[#25D366]/30',
            url: `https://wa.me/${data.whatsapp?.replace(/\D/g, '')}`
        },
        {
            id: 'instagram',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.56.216.96.474 1.38.894.42.42.678.82.894 1.38.163.422.358 1.057.412 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.412 2.227-.216.56-.474.96-.894 1.38-.42.42-.82.678-1.38.894-.422.163-1.057.358-2.227.412-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.412-.56-.216-.96-.474-1.38-.894-.42-.42-.678-.82-.894-1.38-.163-.422-.358-1.057-.412-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.216-.56.474-.96.894-1.38.42-.42.82-.678 1.38-.894.422-.163 1.057-.358 2.227-.412 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.277.059-2.148.262-2.911.558-.788.306-1.457.715-2.123 1.381s-1.075 1.335-1.381 2.123c-.296.763-.499 1.634-.558 2.911-.059 1.28-.073 1.688-.073 4.947s.014 3.667.072 4.947c.059 1.277.262 2.148.558 2.911.306.788.715 1.457 1.381 2.123s1.335 1.075 2.123 1.381c.763.296 1.634.499 2.911.558 1.28.059 1.688.073 4.947.073s3.667-.014 4.947-.072c1.277-.059 2.148-.262 2.911-.558.788-.306 1.457-.715 2.123-1.381s1.075-1.335 1.381-2.123c.296-.763.499-1.634.558-2.911.059-1.28.073-1.688.073-4.947s-.014-3.667-.072-4.947c-.059-1.277-.262-2.148-.558-2.911-.306-.788-.715-1.457-1.381-2.123s-1.335-1.075-2.123-1.381c-.763-.296-1.634-.499-2.911-.558-1.28-.059-1.688-.073-4.947-.073z" /><path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
            ),
            label: 'Instagram',
            value: data.instagram,
            color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
            url: data.instagram
        },
        {
            id: 'linkedin',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
                </svg>
            ),
            label: 'LinkedIn',
            value: data.linkedin,
            color: 'bg-[#0077B5]',
            url: data.linkedin
        },
        {
            id: 'facebook',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
            label: 'Facebook',
            value: data.facebook,
            color: 'bg-[#1877F2]',
            url: data.facebook
        },
        {
            id: 'tiktok',
            icon: (
                <svg viewBox="0 0 448 512" fill="currentColor" className="w-5 h-5">
                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                </svg>
            ),
            label: 'TikTok',
            value: data.tiktok,
            color: 'bg-black text-white shadow-black/30',
            url: data.tiktok
        },
        {
            id: 'youtube',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.082 0 12 0 12s0 3.918.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.918 24 12 24 12s0-3.918-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            ),
            label: 'YouTube',
            value: data.youtube,
            color: 'bg-[#FF0000]',
            url: data.youtube
        },
        {
            id: 'x',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
            ),
            label: 'X (Twitter)',
            value: data.x,
            color: 'bg-[#000000]',
            url: data.x
        },
        {
            id: 'menu_digital',
            icon: <Utensils className="w-5 h-5" />,
            label: 'Menú Digital',
            value: data.menu_digital,
            color: 'bg-[var(--theme-primary)] text-white shadow-[var(--theme-primary)]/30',
            url: data.menu_digital
        },
    ].filter(s => s.value);

    const nextSlide = () => {
        setCurrentSlideIndex((currentSlideIndex + 1) % activeSlides.length);
    };

    const prevSlide = () => {
        setCurrentSlideIndex((currentSlideIndex - 1 + activeSlides.length) % activeSlides.length);
    };

    const getHeroButtonIcon = () => {
        const action = data.hero_action || 'wifi';
        if (action === 'wifi') return <Zap size={16} className="md:w-6 md:h-6 shrink-0" />;
        if (action === 'file') return <Download size={16} className="md:w-6 md:h-6 shrink-0" />;
        return <Smartphone size={16} className="md:w-6 md:h-6 shrink-0" />;
    };

    const getHeroButtonText = () => {
        if (data.hero_button_text) return data.hero_button_text;
        const action = data.hero_action || 'wifi';
        if (action === 'wifi') return "VER OFERTA";
        if (action === 'file') return "DESCARGAR CONTACTO O ARCHIVO";
        return "VER MÁS INFORMACIÓN";
    };

    const wifiStepsConfig = safeParse<string[]>(data.hero_wifi_steps, ['step1', 'step2', 'step3']);
    const showStep1 = wifiStepsConfig.includes('step1');
    const showStep2 = wifiStepsConfig.includes('step2');
    const showStep3 = wifiStepsConfig.includes('step3');
    const nextAfterStep1 = showStep2 ? 2 : (showStep3 ? 3 : 1);
    const nextAfterStep2 = showStep3 ? 3 : 2;

    const renderSocialSidebar = () => (
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl w-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--theme-primary)]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <h4 className="text-[10px] md:text-xs font-display-condensed uppercase tracking-[0.3em] text-[var(--theme-primary)] mb-8 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-[var(--theme-primary)]/30"></span>
                Canales digitales
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-1 gap-4">
                {socialLinks.map((social) => (
                    <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col xl:flex-row items-center xl:gap-4 p-4 md:p-6 bg-white/10 rounded-[28px] md:rounded-[32px] border border-white/5 hover:border-[var(--theme-primary)]/50 transition-all hover:bg-white/20"
                    >
                        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-3 xl:mb-0 shadow-lg group-hover:scale-110 transition-transform shrink-0", social.color)}>
                            {social.icon}
                        </div>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider text-white/40 group-hover:text-white transition-colors text-center xl:text-left">{social.label}</span>
                    </a>
                ))}

                {data.email && (
                    <a href={`mailto:${data.email}`} className="col-span-2 md:col-span-4 xl:col-span-1 flex items-center gap-4 p-4 md:p-5 bg-white/10 rounded-[24px] border border-white/5 hover:border-[var(--theme-primary)]/50 transition-all group overflow-hidden">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 text-[var(--theme-primary)] group-hover:scale-110 transition-transform shrink-0">
                            <Mail size={18} />
                        </div>
                        <div className="text-left min-w-0">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Email</p>
                            <p className="font-bold text-[10px] md:text-xs truncate text-white/80">{data.email}</p>
                        </div>
                    </a>
                )}

                {data.direccion && (
                    <div className="col-span-2 md:col-span-4 xl:col-span-1 flex flex-col gap-3 p-4 md:p-5 bg-white/10 rounded-[24px] border border-white/5 overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 text-[#68d3fe] shrink-0">
                                <Smartphone size={18} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[10px] font-display-condensed text-white/30 uppercase tracking-widest mb-1">Ubicación</p>
                                <p className="font-medium text-xs text-white/70 break-words line-clamp-3 leading-relaxed">{data.direccion}</p>
                            </div>
                        </div>
                        {(data.google_business || data.address || data.direccion) && (
                            <a 
                                href={data.google_business?.startsWith('http') ? data.google_business : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.direccion || data.address || data.nombre_negocio || data.nombre)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--theme-primary)]/20 hover:bg-[var(--theme-primary)]/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-[var(--theme-primary)] hover:text-white transition-all"
                            >
                                <Zap size={12} /> Cómo llegar
                            </a>
                        )}
                    </div>
                )}
            </div>

            {data.web && (
                <a href={data.web} target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center justify-between p-5 md:p-6 bg-gradient-to-r from-[#05509c] to-[var(--theme-bg)] rounded-[24px] border border-white/10 group">
                    <div className="flex items-center gap-4">
                        <div className="text-xl">🌐</div>
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Web oficial</span>
                    </div>
                    <Zap size={16} className="text-[var(--theme-primary)] group-hover:scale-125 transition-transform" />
                </a>
            )}
        </div>
    );

    const showHero = activeSlides.length > 0;

    return (
        <div className="relative" style={{ 
            '--theme-bg': `color-mix(in srgb, ${extractedBg} 20%, #050510)`, 
            '--theme-bg-raw': extractedBg,
            '--theme-primary': themePrimary,
            '--theme-text-on-primary': themeTextOnPrimary
        } as React.CSSProperties}>
            {/* Top fixed bar for navigation and edit */}
            <div className="fixed top-6 left-6 right-6 z-[60] flex justify-start items-center pointer-events-none">
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="pointer-events-auto bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110 shadow-lg group"
                    title="Configurar Perfil"
                >
                    <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
            </div>

            {/* =================== FULLSCREEN HERO =================== */}
            {showHero && activeSlides.length > 0 && (
                <section className="relative min-h-screen w-full flex flex-col items-center justify-end pb-12 md:pb-24 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        {activeSlides.map((slide, idx) => (
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
                                    className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
                                    style={{ backgroundImage: `url('${slide.portada_movil || slide.portada_desktop}')` }}
                                />
                                <div
                                    className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
                                    style={{ backgroundImage: `url('${slide.portada_desktop || slide.portada_movil}')` }}
                                />
                            </motion.div>
                        ))}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70 z-0" />

                    {activeSlides.length > 1 && (
                        <>
                            <button 
                                onClick={prevSlide}
                                className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm transition-all border border-white/10 hover:scale-110 z-20"
                                aria-label="Anterior"
                            >
                                <ChevronLeft size={28} />
                            </button>
                            <button 
                                onClick={nextSlide}
                                className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-sm transition-all border border-white/10 hover:scale-110 z-20"
                                aria-label="Siguiente"
                            >
                                <ChevronRight size={28} />
                            </button>
                        </>
                    )}

                    <div className="relative z-10 flex flex-col items-center px-6 md:px-24 text-center w-full max-w-5xl pt-20">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="w-fit mx-auto bg-black/40 backdrop-blur-md border border-white/10 px-8 py-4 rounded-[2rem] text-[28px] sm:text-5xl md:text-7xl lg:text-[55px] font-black uppercase italic tracking-tighter text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] leading-[1] break-words [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000] mb-6"
                        >
                            {data.tipo_perfil === 'negocio' ? (data.nombre_negocio || data.nombre) : data.nombre}
                        </motion.h1>

                        <AnimatePresence mode="wait">
                            {activeSlides[currentSlideIndex].title && (
                                <motion.h2
                                    key={activeSlides[currentSlideIndex].id + "_title"}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="text-sm md:text-xl font-display-condensed uppercase tracking-[0.4em] px-8 py-2 rounded-full border border-white/20 backdrop-blur-md shadow-2xl bg-white/10 text-white mx-auto w-fit mb-6"
                                >
                                    {activeSlides[currentSlideIndex].title}
                                </motion.h2>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {(activeSlides[currentSlideIndex].description || data.profesion) && (
                                <motion.p
                                    key={activeSlides[currentSlideIndex].id + "_desc"}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="w-fit mx-auto bg-black/40 backdrop-blur-md border border-white/10 px-8 py-4 rounded-2xl text-base sm:text-2xl md:text-[20px] font-display-condensed italic text-white/90 drop-shadow-2xl break-words max-w-[85vw] md:max-w-4xl leading-tight tracking-[0.1em] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000] mb-10"
                                >
                                    {activeSlides[currentSlideIndex].description || data.profesion}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {(data.plan === 'business' || data.plan === 'catalog') && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="mt-6"
                            >
                                <StarRating rating={data.google_rating} count={data.google_reviews_count} />
                            </motion.div>
                        )}
                        
                        {activeSlides.length > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2">
                                {activeSlides.map((_: any, i: number) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setCurrentSlideIndex(i)}
                                        className={cn("h-1.5 rounded-full transition-all duration-300", i === currentSlideIndex ? "bg-[var(--theme-primary)] w-8" : "bg-white/30 w-1.5 hover:bg-white/60 hover:w-3")}
                                        aria-label={`Ir al slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="relative z-10 pb-8 md:pb-24 flex flex-col items-center gap-3 md:gap-6"
                    >
                        <ShareButton 
                            title={data.tipo_perfil === 'negocio' ? (data.nombre_negocio || data.nombre) : data.nombre}
                            text={data.bio || "Mira este perfil digital"}
                            variant="button"
                            buttonStyle="outline"
                        />
                    </motion.div>

                    {/* Limited Time Offer - Solo visible en Hero */}
                    <LimitedTimeOffer offer={heroOffer} themePrimary={offerColor} />
                </section>
            )}

            {/* =================== PROFILE DETAILS =================== */}
            <main id="profile-details" className="min-h-screen bg-[var(--theme-bg)] text-white selection:bg-[var(--theme-primary)]/30 py-8 md:py-12 relative overflow-clip font-sans">

                <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[50%] bg-[var(--theme-primary)]/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#05509c]/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10 pt-4 md:pt-8 px-2 md:px-4">
                    <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
                        <div className="lg:col-span-12 grid lg:grid-cols-12 gap-6 md:gap-8 items-start">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="lg:col-span-12 flex flex-col w-full min-w-0 order-1"
                            >
                                <div className="flex-1 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[3.5rem] p-10 lg:p-16 shadow-2xl shadow-navy/5 relative overflow-hidden group min-w-0 w-full">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[var(--theme-primary)] to-transparent opacity-10 rounded-bl-full shrink-0" />

                                    <div className="flex flex-col items-center gap-8 md:gap-12 relative z-10 w-full">
                                        <div className="relative shrink-0">
                                            {/* Authority Badge */}
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-full shadow-lg border border-white/10">
                                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Identidad Digital • vCard 3.0</span>
                                                </div>
                                            </div>

                                            <div className="w-32 h-32 md:w-36 lg:w-48 rounded-[2.5rem] bg-gradient-to-br from-[var(--theme-primary)] to-[#05509c] p-1 shadow-2xl">
                                                <div className="w-full h-full aspect-square rounded-[2.2rem] bg-[var(--theme-bg)] overflow-hidden flex items-center justify-center">
                                                    {data.foto_url ? (
                                                        <img src={data.foto_url} className="w-full h-full object-cover" alt={data.nombre} />
                                                    ) : (
                                                        <User className="text-white/10" size={80} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-[#66bf19] p-2 rounded-full shadow-lg border-2 border-[var(--theme-bg)]">
                                                <CheckCircle size={20} className="text-white" />
                                            </div>
                                        </div>

                                        <div className="text-center flex-1 min-w-0 w-full">
                                            <div className="flex flex-col items-center w-full">
                                                <h1 className="text-2xl md:text-4xl lg:text-6xl font-black tracking-tighter leading-[1.05] mb-2 capitalize italic text-white break-words drop-shadow-md">
                                                    {data.tipo_perfil === 'negocio' ? (data.nombre_negocio || data.nombre) : data.nombre}
                                                </h1>
                                                <p className="text-base md:text-xl font-bold text-[var(--theme-primary)] uppercase tracking-[0.2em] mb-6 drop-shadow-sm break-words opacity-90">
                                                    {data.profesion || "Profesional Estratégico"}
                                                </p>
                                                
                                                {data.tipo_perfil === 'negocio' && (data.contacto_nombre || data.contacto_apellido) && (
                                                    <div className="mb-8">
                                                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center text-[var(--theme-primary)]">
                                                                <User size={16} />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Atención Directa</p>
                                                                <p className="text-sm font-bold text-white mb-0 leading-none">{data.contacto_nombre} {data.contacto_apellido}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {data.empresa && (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-8 max-w-full">
                                                    <Briefcase size={14} className="text-[var(--theme-primary)] shrink-0" />
                                                    <span className="text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-wider text-white/50 truncate text-ellipsis">{data.empresa}</span>
                                                </div>
                                            )}
                                            <div className="w-full mt-12">
                                                <div className="grid grid-cols-3 gap-4 md:gap-6">
                                                    <button
                                                        onClick={() => window.location.href = `tel:${data.whatsapp?.replace(/\D/g, '')}`}
                                                        className="flex flex-col items-center justify-center gap-3 py-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[var(--theme-primary)] transition-all group shadow-xl"
                                                    >
                                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center text-[var(--theme-primary)] group-hover:scale-110 transition-transform">
                                                            <Phone size={24} />
                                                        </div>
                                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/70">Llamar</span>
                                                    </button>

                                                    <button
                                                        onClick={handleWhatsapp}
                                                        className="flex flex-col items-center justify-center gap-3 py-8 rounded-[2rem] bg-[var(--theme-primary)] border border-[var(--theme-primary)]/20 hover:scale-105 transition-all shadow-[0_20px_40px_-10px_rgba(246,103,57,0.5)] group"
                                                    >
                                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                                            <MessageSquare size={24} />
                                                        </div>
                                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">Mensaje</span>
                                                    </button>

                                                    <button
                                                        onClick={downloadVCF}
                                                        className="flex flex-col items-center justify-center gap-3 py-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[var(--theme-primary)] transition-all group shadow-xl"
                                                    >
                                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center text-[var(--theme-primary)] group-hover:scale-110 transition-transform">
                                                            <UserPlus size={24} />
                                                        </div>
                                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/70">Guardar</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {(data.bio || data.productos_servicios || data.catalogo_json || data.menu_digital) && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="mt-12 md:mt-16 pt-10 border-t border-white/10 flex flex-col gap-10"
                                        >
                                            {data.bio && (
                                                <div className="bg-gradient-to-br from-white/[0.05] to-transparent p-6 md:p-8 rounded-[32px] border border-white/10 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-primary)]/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />
                                                    
                                                    <h4 className="text-[10px] sm:text-xs font-display-condensed uppercase tracking-[0.3em] text-[var(--theme-primary)] mb-5 flex items-center gap-3 relative z-10">
                                                        <span className="w-6 h-6 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center">
                                                            <User size={12} className="text-[var(--theme-primary)]" />
                                                        </span>
                                                        Perfil profesional
                                                    </h4>
                                                    
                                                    <div className="relative z-10">
                                                        <p className="text-sm md:text-base font-medium leading-relaxed text-white/90 break-words max-w-4xl whitespace-pre-wrap relative pl-6">
                                                            <span className="absolute left-0 top-0 text-4xl text-[var(--theme-primary)]/30 font-serif leading-none -mt-2">"</span>
                                                            {data.bio}
                                                            <span className="text-[var(--theme-primary)]/30 text-4xl font-serif leading-none ml-1 relative top-2">"</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}


                                            {(() => {
                                                // PRIORIDAD:
                                                // 1. Menú Digital (formato [{name, items}])
                                                // 2. Catálogo de productos/servicios (JSON)
                                                // 3. productos_servicios (campo legado de texto libre)
                                                let productsList: string[] = [];

                                                // 1. Intentar desde menu_digital
                                                const menuCats = safeParse<any[]>(data.menu_digital, []);
                                                if (Array.isArray(menuCats) && menuCats.length > 0 && menuCats[0]?.name) {
                                                    productsList = menuCats.map(cat => cat.name || cat.nombre).filter(Boolean);
                                                }

                                                // 2. Si no hay menú, intentar desde catalogo_json
                                                if (productsList.length === 0 && data.catalogo_json) {
                                                    const parsedCatalog = safeParse<any>(data.catalogo_json, { products: [], categories: [] });
                                                    const catalogCats = parsedCatalog?.categories || [];
                                                    if (Array.isArray(catalogCats) && catalogCats.length > 0) {
                                                        productsList = catalogCats;
                                                    } else if (Array.isArray(parsedCatalog?.products) && parsedCatalog.products.length > 0) {
                                                        const cats = Array.from(new Set(parsedCatalog.products.map((item: any) => item.category || item.categoria))).filter(Boolean) as string[];
                                                        productsList = cats;
                                                    }
                                                    if (productsList.length === 0 && Array.isArray(parsedCatalog) && parsedCatalog.length > 0) {
                                                        const cats = Array.from(new Set(parsedCatalog.map((item: any) => item.category || item.categoria))).filter(Boolean) as string[];
                                                        productsList = cats;
                                                    }
                                                }

                                                // 3. Último recurso: productos_servicios
                                                if (productsList.length === 0 && data.productos_servicios) {
                                                    productsList = data.productos_servicios
                                                        .split(data.productos_servicios.includes('\n') ? '\n' : ',')
                                                        .map((item: string) => item.trim())
                                                        .filter((item: string) => item !== '');
                                                }

                                                if (productsList.length === 0) return null;

                                                // ─── Leer datos de experiencia desde json_override ───
                                                const overridesParsed = safeParse<any>(data?.json_override, {});
                                                const experienceTitles: Array<{index: number, title: string}> = overridesParsed.experienceTitles || [];
                                                const experienceImages: Array<{index: number, url: string}> = overridesParsed.experienceImages || [];
                                                const experienceSectionTitle = overridesParsed.experienceTitle || '';
                                                const experienceSubtitle = overridesParsed.experienceSubtitle || '';

                                                // Si hay títulos personalizados configurados, limitar categorías a ese número
                                                if (experienceTitles.length > 0 && productsList.length > experienceTitles.length) {
                                                    productsList = productsList.slice(0, experienceTitles.length);
                                                }

                                                const visibleProducts = isProductsExpanded ? productsList : productsList.slice(0, 4);

                                                // Imágenes por defecto (fallback)
                                                const defaultCatImages = [
                                                    "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop",
                                                    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop",
                                                    "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=2070&auto=format&fit=crop",
                                                    "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=2070&auto=format&fit=crop",
                                                    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2070&auto=format&fit=crop"
                                                ];

                                                return (
                                                    <div className="mt-12">
                                                        <div className="flex items-center justify-between mb-10">
                                                            <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-[var(--theme-primary)] flex items-center gap-3">
                                                                <span className="w-8 h-8 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center">
                                                                    <Briefcase size={14} className="text-[var(--theme-primary)]" />
                                                                </span>
                                                                {experienceSectionTitle || 'Soluciones destacadas'}
                                                            </h4>
                                                            <span className="hidden md:inline-flex px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/5">
                                                                {experienceSubtitle || 'Nuestras especialidades'}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                                            {visibleProducts.map((line: string, index: number) => {
                                                                // Aplicar título personalizado desde experienceTitles si existe
                                                                const customTitleObj = experienceTitles.find((t: any) => t.index === index);
                                                                const displayText = customTitleObj?.title || line.replace(/^[-•*]\s*/, '');
                                                                
                                                                // Aplicar imagen personalizada desde experienceImages si existe
                                                                const customImg = experienceImages.find((img: any) => img.index === index);
                                                                const imgSrc = customImg?.url || defaultCatImages[index % defaultCatImages.length];
                                                                
                                                                return (
                                                                    <motion.div 
                                                                        key={index} 
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        whileInView={{ opacity: 1, y: 0 }}
                                                                        viewport={{ once: true }}
                                                                        transition={{ delay: index * 0.1 }}
                                                                        whileHover={{ y: -10 }}
                                                                        className="group relative h-[300px] md:h-[400px] rounded-[32px] overflow-hidden border border-white/10 bg-black/40 shadow-2xl cursor-pointer"
                                                                        onClick={() => setLightboxImg(imgSrc)}
                                                                    >
                                                                        <img 
                                                                            src={imgSrc}
                                                                            alt={displayText}
                                                                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700"
                                                                        />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                                                        
                                                                        <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                                                            <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                                                <span className="px-3 py-1 bg-[var(--theme-primary)] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4 inline-block shadow-lg shadow-[var(--theme-primary)]/40">
                                                                                    {experienceSubtitle || 'Categoría'}
                                                                                </span>
                                                                                <h3 className="text-sm md:text-base lg:text-lg font-display-condensed font-black text-white uppercase italic leading-tight mb-4 line-clamp-2">
                                                                                    {displayText}
                                                                                </h3>
                                                                                <div className="h-0.5 w-12 bg-[var(--theme-primary)] group-hover:w-full transition-all duration-700 mb-6" />
                                                                                
                                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex gap-2">
                                                                                    <button 
                                                                                        onClick={handleWhatsapp}
                                                                                        className="flex-1 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                                                                                    >
                                                                                        Consultar
                                                                                    </button>
                                                                                    {data.plan === 'catalog' && (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const url = new URL(window.location.href);
                                                                                            url.searchParams.set('cat', displayText.toLowerCase());
                                                                                            window.history.pushState({}, '', url.toString());
                                                                                            document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                                        }}
                                                                                        className="flex-1 py-4 rounded-2xl bg-[var(--theme-primary)] text-white text-xs font-black uppercase tracking-widest text-center hover:brightness-110 transition-all"
                                                                                    >
                                                                                        Ver catálogo
                                                                                    </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                                            <Zap size={20} className="text-[var(--theme-primary)]" />
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                            
                                                            {productsList.length > 4 && (
                                                                <div className="col-span-full mt-12 flex justify-center">
                                                                    <button 
                                                                        onClick={() => setIsProductsExpanded(!isProductsExpanded)}
                                                                        className="flex items-center gap-3 px-10 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black tracking-[0.4em] uppercase transition-all hover:scale-105 active:scale-95"
                                                                    >
                                                                        {isProductsExpanded ? 'Cerrar galería' : `Ver todo el portafolio (${productsList.length - 4})`}
                                                                        <ChevronDown size={20} className={cn("transition-transform duration-500", isProductsExpanded && "rotate-180")} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Catálogo de Productos/Servicios (AQUÍ - DEBAJO DE SERVICIOS) */}
                                            {(showCatalog || data?.plan === 'catalog' || data?.plan === 'digital') && (() => {
                                                let catalogSource = data.catalogo_json;
                                                if (!catalogSource && data.menu_digital?.trim().startsWith('[')) {
                                                    catalogSource = data.menu_digital;
                                                }
                                                if (!catalogSource) return null;

                                                const parsedCatalog = safeParse(catalogSource, { products: [], categories: [] });
                                                const isServiceMenu = Array.isArray(parsedCatalog) && 
                                                                     parsedCatalog.length > 0 && 
                                                                     'items' in parsedCatalog[0];

                                                return (
                                                    <div id="catalogo" className="w-full mt-12">
                                                        {isServiceMenu ? (
                                                            <CabinetMenu 
                                                                data={parsedCatalog} 
                                                                businessName={data.nombre_negocio || data.nombre} 
                                                                whatsapp={data.whatsapp}
                                                            />
                                                        ) : (
                                                            <CatalogGallery 
                                                                data={parsedCatalog} 
                                                                whatsapp={data.whatsapp}
                                                                onLightboxToggle={setIsLightboxOpen}
                                                                lightboxInline={true}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Video Spotlight (AQUÍ - DEBAJO DEL CATÁLOGO) */}
                                            {(() => {
                                                const videoUrl = data.youtube_video_url || data.youtube || data.tiktok;
                                                const embedUrl = getVideoEmbedUrl(videoUrl);
                                                const directVideoUrl = getDirectVideoUrl(videoUrl);
                                                if (!embedUrl && !directVideoUrl) return null;
                                                
                                                const isVertical = checkIsVerticalVideo(videoUrl);
                                                return (
                                                    <div className="w-full mt-12 md:mt-20">
                                                        <div className="flex items-center justify-between mb-8">
                                                            <h4 className="text-[10px] sm:text-xs font-display-condensed uppercase tracking-[0.3em] text-[var(--theme-primary)] flex items-center gap-3">
                                                                <span className="w-8 h-8 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center">
                                                                    <Zap size={14} className="text-[var(--theme-primary)]" />
                                                                </span>
                                                                Spotlight cinemático
                                                            </h4>
                                                            <span className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black tracking-widest text-white/30 uppercase">
                                                                Foto films exclusive
                                                            </span>
                                                        </div>
                                                        <div className={cn(
                                                            "w-full rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10 bg-black/60 relative group",
                                                            isVertical ? "max-w-md mx-auto aspect-[9/16]" : "aspect-video"
                                                        )}>
                                                            {embedUrl ? (
                                                                <iframe
                                                                    width="100%"
                                                                    height="100%"
                                                                    src={embedUrl}
                                                                    title="Video player"
                                                                    frameBorder="0"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                    className="w-full h-full scale-[1.01]"
                                                                ></iframe>
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
                                                            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 rounded-[inherit]" />
                                                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent" />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>


                        </div>

                        {/* Slot placeholder — el contenido real se renderiza fuera del grid */}
                    </div>
                </div>

                {/* ─── NUESTRA CARTA (FULL WIDTH) ─── */}
                {afterExperienceSlot && (
                    <div className="w-full mt-12 md:mt-20">
                        {afterExperienceSlot}
                    </div>
                )}

                <div className="max-w-6xl mx-auto relative z-10 px-2 md:px-4">
                    <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-stretch">

                        {data.google_rating && (
                            <div className="lg:col-span-12 order-3 xl:order-4 mt-8 md:mt-16 w-full">
                                <motion.div 
                                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 text-center relative overflow-hidden"
                                >
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, delay: 0.3 }}
                                        className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
                                        style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)` }}
                                    />
                                    
                                    <motion.h4 
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-8 flex items-center justify-center gap-3"
                                        style={{ color: 'var(--theme-primary)' }}
                                    >
                                        <span className="w-8 h-[1px]" style={{ background: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}></span>
                                        Testimonio de nuestros clientes
                                        <span className="w-8 h-[1px]" style={{ background: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}></span>
                                    </motion.h4>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: 0.4 }}
                                        className="flex items-center justify-center gap-1.5 mb-4"
                                    >
                                        {[...Array(5)].map((_, i) => {
                                            const r = parseFloat(String(data.google_rating));
                                            const isFilled = i < Math.floor(r);
                                            const isHalf = !isFilled && i < r;
                                            return (
                                                <motion.svg
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0, rotate: -30 }}
                                                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ 
                                                        duration: 0.5, 
                                                        delay: 0.5 + (i * 0.12),
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 15
                                                    }}
                                                    className="w-6 h-6 md:w-8 md:h-8"
                                                    viewBox="0 0 20 20"
                                                    style={{ 
                                                        color: isFilled || isHalf ? 'var(--theme-primary)' : 'rgba(255,255,255,0.15)',
                                                        fill: isFilled || isHalf ? 'var(--theme-primary)' : 'rgba(255,255,255,0.15)',
                                                        opacity: isHalf ? 0.5 : 1
                                                    }}
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </motion.svg>
                                            );
                                        })}
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.3 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: 1.1, type: "spring", stiffness: 200 }}
                                        className="mb-2"
                                    >
                                        <span 
                                            className="text-5xl md:text-7xl font-black leading-none"
                                            style={{ color: 'var(--theme-primary)' }}
                                        >
                                            {parseFloat(String(data.google_rating)).toFixed(1)}
                                        </span>
                                    </motion.div>

                                    <motion.p
                                        initial={{ opacity: 0, y: 8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 1.4 }}
                                        className="text-xs md:text-sm font-bold text-white/50 uppercase tracking-widest mb-6"
                                    >
                                        {data.google_reviews_count && `${data.google_reviews_count} reseñas en `}
                                        <span style={{ color: 'var(--theme-primary)' }}>Google Business</span>
                                    </motion.p>

                                    <motion.p
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: 1.6 }}
                                        className="text-white/50 text-xs md:text-sm font-medium max-w-md mx-auto italic leading-relaxed mb-8"
                                    >
                                        &ldquo;Gracias a nuestra comunidad por calificarnos con {data.google_rating} estrellas. ¡Tu opinión nos ayuda a crecer!&rdquo;
                                    </motion.p>

                                    {(data.google_business || data.address || data.direccion) && (
                                        <motion.a
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: 1.8 }}
                                            href={`https://www.google.com/search?q=${encodeURIComponent((data.nombre_negocio || data.nombre) + ' Opiniones')}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-4 border text-white px-8 py-4 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
                                            style={{ 
                                                background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                                                borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)'
                                            }}
                                        >
                                            <div 
                                                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                                style={{ background: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)', color: 'var(--theme-primary)' }}
                                            >
                                                <Smartphone size={14} />
                                            </div>
                                            Ver todas las reseñas y cómo llegar
                                        </motion.a>
                                    )}
                                </motion.div>
                            </div>
                        )}


                {(() => {
                    const addressText = data?.direccion || data?.address || '';
                    const rawGoogleBusiness = data?.google_business || "https://maps.app.goo.gl/zGHf7235Myux7T4P7";
                    const isGoogleLink = rawGoogleBusiness.startsWith('http');
                    
                    let buttonHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressText || data?.nombre_negocio || data?.nombre || "Loja, Ecuador")}`;
                    if (isGoogleLink) {
                        buttonHref = rawGoogleBusiness;
                    }
                    
                    return (
                        <div className="lg:col-span-12 order-4 xl:order-5 mt-16 md:mt-32 w-full">
                            <div className="max-w-6xl mx-auto px-6 mb-10 flex flex-col items-center text-center gap-8">
                                <div>
                                    <div className="inline-flex items-center gap-2 bg-[var(--theme-primary)] text-white px-4 py-1.5 rounded-full shadow-lg mb-4">
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Encuéntranos</span>
                                    </div>
                                    <h4 className="text-3xl md:text-5xl font-black tracking-tighter text-white italic leading-none mb-4">
                                        Ubicación estratégica
                                    </h4>
                                    <p className="text-white/50 text-sm md:text-base font-medium max-w-xl leading-relaxed">
                                        {addressText || "Visítanos en nuestra ubicación oficial para una experiencia personalizada."}
                                    </p>
                                </div>
                                <a 
                                    href={buttonHref}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-white text-navy px-10 py-6 rounded-full text-sm font-black uppercase tracking-widest flex items-center gap-4 transition-all hover:scale-105 shadow-2xl hover:bg-[var(--theme-primary)] hover:text-white group"
                                >
                                    <Smartphone size={18} />
                                    Trazar ruta
                                </a>
                            </div>
                            
                            <div className="max-w-5xl mx-auto px-4 w-full">
                                <MapSection 
                                    googleBusiness={data?.google_business}
                                    businessName={data?.nombre_negocio || data?.nombre || ''}
                                    addressText={addressText}
                                    containerClassName="w-full h-[400px] md:h-[500px] relative rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] bg-navy/40 backdrop-blur-md"
                                    iframeStyle={{ filter: 'contrast(1.05) brightness(0.9)' }}
                                >
                                    <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[inherit]" />
                                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-navy/20 via-transparent to-navy/40" />
                                </MapSection>
                            </div>
                        </div>
                    );
                })()}

                        <div className="lg:col-span-12 order-3 w-full mt-16 md:mt-32">
                            {renderSocialSidebar()}
                        </div>
                    </div>
                </div>

                {beforeMarqueeSlot && (
                    <div className="w-full max-w-7xl mx-auto px-4 mt-16 md:mt-32">
                        {beforeMarqueeSlot}
                    </div>
                )}

                {afterMarqueeSlot && (
                    <div className="w-full mt-16 md:mt-32">
                        {afterMarqueeSlot}
                    </div>
                )}

                {authorityModule.enabled && (
                    <section className="mt-20 md:mt-40 max-w-5xl mx-auto px-6 w-full">
                        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] md:rounded-[4.5rem] p-8 md:p-20 relative overflow-hidden group shadow-2xl">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--theme-primary)]/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="inline-flex items-center gap-3 bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] px-5 py-2 rounded-full border border-[var(--theme-primary)]/30 mb-8"
                                >
                                    <Shield size={14} />
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">{authorityModule.badge || "Garantía de Calidad"}</span>
                                </motion.div>

                                <motion.h3 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="text-4xl md:text-7xl font-black tracking-tighter text-white italic uppercase leading-[0.9] mb-8"
                                >
                                    {authorityModule.title || "Por qué Elegirnos"}
                                </motion.h3>

                                {authorityModule.description && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 }}
                                        className="text-lg md:text-2xl text-white/60 font-medium max-w-3xl mb-16 leading-relaxed"
                                    >
                                        {authorityModule.description}
                                    </motion.p>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 w-full mb-20">
                                    {authorityModule.stats?.map((stat: any, i: number) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.4 + (i * 0.1) }}
                                            className="flex flex-col items-center"
                                        >
                                            <span className="text-4xl md:text-6xl font-black text-white italic tracking-tighter mb-2">{stat.value}</span>
                                            <span className="text-[10px] md:text-xs font-black text-white/40 uppercase tracking-[0.2em]">{stat.label}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full text-left">
                                    {authorityModule.metrics?.map((metric: any, i: number) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.6 + (i * 0.1) }}
                                            className="space-y-4"
                                        >
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm md:text-base font-black text-white uppercase tracking-widest">{metric.label}</span>
                                                <span className="text-2xl md:text-3xl font-black text-[var(--theme-primary)] italic">{metric.value}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${metric.value}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-[#05509c]"
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <style jsx>{`
                    .video-container :global(iframe) { aspect-ratio: 16/9; }
                    .video-container-tiktok :global(iframe) { aspect-ratio: 9/16; }
                    @media (max-width: 640px) {
                        .video-container :global(iframe), .video-container { aspect-ratio: 9/16; max-height: 70vh; }
                        .video-container-tiktok :global(iframe), .video-container-tiktok { aspect-ratio: 9/16; max-height: 80vh; }
                    }
                `}</style>

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
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl cursor-default"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
