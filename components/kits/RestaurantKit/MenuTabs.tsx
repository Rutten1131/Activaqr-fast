"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MenuTabsProps, MenuItem } from '../types';

// ─── Item individual del menú ───
function MenuItemRow(props: any) {
    const name = props.name || props.titulo;
    const price = props.price || props.precio;
    const size = props.size || props.tamaño;
    const desc = props.desc || props.descripcion;
    const image = props.image || props.foto || props.imagen;
    const accentColor = props.accentColor || '#dc2626';

    const accentBorder = { borderColor: 'transparent' };
    const accentHover = { '--accent': accentColor } as React.CSSProperties;
    return (
        <div
            className="flex justify-between items-start border-b border-gray-100 pb-4 group transition-colors gap-4"
            style={{ ...accentHover, ['--hover-border' as string]: accentColor }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = accentColor)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
        >
            <div className="flex-1 flex gap-4">
                <div className="pr-4 flex-1">
                    <h4
                        className="font-sans-body font-bold text-lg text-black uppercase tracking-tight transition-colors"
                        onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                        onMouseLeave={e => (e.currentTarget.style.color = '')}
                    >
                        {name || 'Sin Título'}
                        {size && (
                            <span className="text-[10px] font-normal text-gray-400 ml-1">({size})</span>
                        )}
                    </h4>
                    {desc && (
                        <p className="text-xs text-gray-500 font-sans-body mt-1 leading-relaxed">{desc}</p>
                    )}
                </div>
            </div>
            {price && (
                <div className="text-right shrink-0">
                    <span className="font-display-condensed text-xl md:text-2xl text-black">{price}</span>
                </div>
            )}
        </div>
    );
}

// ─── COMPONENTE PRINCIPAL ───
export default function MenuTabs({
    categories,
    accentColor = 'red-600',
    ctaText,
    onCtaClick,
    title = 'NUESTRA CARTA',
}: MenuTabsProps) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [visibleItemsCount, setVisibleItemsCount] = useState(15);
    const tabsRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detectar mobile para comportamiento de slide
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Verificar scroll del tab bar
    useEffect(() => {
        const el = tabsRef.current;
        if (!el) return;
        const checkScroll = () => {
            setCanScrollLeft(el.scrollLeft > 8);
            setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
        };
        checkScroll();
        el.addEventListener('scroll', checkScroll);
        return () => el.removeEventListener('scroll', checkScroll);
    }, []);

    const scrollTabs = (direction: 'left' | 'right') => {
        const el = tabsRef.current;
        if (!el) return;
        const amount = isMobile ? 120 : 180;
        el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    // Reset visibility count when active index changes
    useEffect(() => {
        setVisibleItemsCount(15);
    }, [activeIdx]);

    // IntersectionObserver sentinel for progressive infinite scrolling
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisibleItemsCount(prev => prev + 15);
            }
        }, {
            rootMargin: '200px',
        });

        observer.observe(sentinel);
        return () => {
            if (sentinel) {
                observer.unobserve(sentinel);
            }
        };
    }, [activeIdx]);

    // Asegurar que el índice siempre esté dentro de los límites
    const safeActiveIdx = activeIdx >= categories.length ? 0 : activeIdx;

    // Restablecer el índice a 0 si la cantidad de categorías disminuye
    useEffect(() => {
        if (activeIdx >= categories.length) {
            setActiveIdx(0);
        }
    }, [categories.length, activeIdx]);

    if (!categories.length) return null;
    const activeCategory = categories[safeActiveIdx];
    if (!activeCategory) return null;

    // Color CSS real para usar en estilos inline
    const accentCSS = accentColor.startsWith('#') ? accentColor : `#${accentColor}`;

    return (
        <section className="bg-white py-24 md:py-32 w-full relative z-10">
            <div className="max-w-6xl mx-auto px-4 md:px-12">
            {/* Título */}
            <div className="text-center mb-14 md:mb-20">
                <h2 className="font-display-condensed text-4xl md:text-7xl mb-4 tracking-tighter text-black uppercase">
                    {title}
                </h2>
                <div className="w-20 md:w-24 h-1 mx-auto" style={{ backgroundColor: accentCSS }}></div>
            </div>

            {/* ─── TAB BAR: Horizontal scrollable siempre, con flechas en desktop ─── */}
            <div className="relative mb-12 md:mb-16">
                {/* Flecha izquierda (solo desktop) */}
                {canScrollLeft && !isMobile && (
                    <button
                        onClick={() => scrollTabs('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md border border-gray-100 hover:bg-black hover:text-white transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                )}

                {/* Flecha derecha (solo desktop) */}
                {canScrollRight && !isMobile && (
                    <button
                        onClick={() => scrollTabs('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md border border-gray-100 hover:bg-black hover:text-white transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                )}

                {/* Contenedor de tabs con scroll horizontal nativo */}
                <div
                    ref={tabsRef}
                    className="flex gap-3 md:gap-4 overflow-x-auto px-2 md:px-10 scrollbar-hide snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {categories.map((cat, idx) => (
                        <button
                            key={cat.name}
                            onClick={() => {
                                setActiveIdx(idx);
                                // Scroll the tab into view on mobile
                                const el = tabsRef.current;
                                if (el && isMobile) {
                                    const tab = el.children[idx] as HTMLElement;
                                    tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                }
                            }}
                            className={`shrink-0 snap-center snap-always px-5 md:px-8 py-3 font-display-condensed text-lg md:text-xl tracking-widest transition-all duration-300 border whitespace-nowrap ${
                                activeIdx === idx
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-black border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            {cat.name.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── CONTENIDO DEL MENÚ ─── */}
            <div className="min-h-[300px] md:min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeCategory.name}
                        initial={isMobile ? { opacity: 0, x: 40 } : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={isMobile ? { opacity: 0, x: -40 } : { opacity: 0, y: -20 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-x-12 md:gap-x-16 gap-y-6 md:gap-y-8"
                    >
                        {activeCategory.items.slice(0, visibleItemsCount).map((item, idx) => (
                            <MenuItemRow key={idx} {...item} accentColor={accentColor} />
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Sentinel for Infinite Scroll under active category */}
                {activeCategory && activeCategory.items && activeCategory.items.length > visibleItemsCount && (
                    <div ref={sentinelRef} className="h-14 flex items-center justify-center mt-8">
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accentCSS} transparent` }} />
                    </div>
                )}
            </div>

            {/* Indicador de slide en mobile (dots) */}
            {isMobile && categories.length > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                    {categories.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIdx(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                activeIdx === idx ? 'w-8 bg-black' : 'w-4 bg-gray-300'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* ─── CTA FINAL ─── */}
            {/* CTA removido para evitar duplicacion con HedkandiTemplate - el CTA ya existe en la plantilla */}
            </div>
        </section>
    );
}
