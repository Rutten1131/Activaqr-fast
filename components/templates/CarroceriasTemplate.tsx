"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, Mail, MapPin, MessageCircle, ChevronLeft, ChevronRight,
    CheckCircle, Star, Wrench, Truck, Shield, Clock, Users, Award,
    Instagram, Facebook, ChevronDown
} from 'lucide-react';
import { safeParse as safeJsonParse } from '@/lib/jsonUtils';
import { BaseTemplateProps, HeroCarouselTemplateProps } from './types';
import { formatPhoneEcuador } from '@/lib/utils';
import ShareButton from '@/components/ShareButton';
import LimitedTimeOffer from '@/components/LimitedTimeOffer';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface CatalogProduct {
    id: string;
    name?: string;
    titulo?: string;
    category?: string;
    categoria?: string;
    image?: string;
    images?: string[];
    url?: string;
    foto?: string;
    imagen?: string;
    price?: string;
    precio?: string;
    description?: string;
    descripcion?: string;
}

interface CarroceriasTemplateProps extends HeroCarouselTemplateProps {
    data: {
        nombre_negocio?: string;
        profesion?: string;
        bio?: string;
        whatsapp?: string;
        email?: string;
        address?: string;
        foto_url?: string;
        portada_desktop?: string;
        portada_movil?: string;
        instagram?: string;
        facebook?: string;
        productos_servicios?: string;
        catalogo_json?: {
            categories?: string[];
            products?: CatalogProduct[];
        };
        [key: string]: any;
    };
}

// ─────────────────────────────────────────────
// THEME COLORS  (Martinelli-style)
// ─────────────────────────────────────────────
const RED    = '#CC2222';
const YELLOW = '#F5A623';
const DARK   = '#111111';
const DARK2  = '#1A1A1A';
const DARK3  = '#222222';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getProductImages(p: CatalogProduct): string[] {
    if (p.images && p.images.length > 0) return p.images;
    const main = p.image || p.url || p.foto || p.imagen;
    return main
        ? [main]
        : ['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop'];
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

/** Top info bar (phone / location / email) */
function InfoBar({ data }: { data: CarroceriasTemplateProps['data'] }) {
    return (
        <div className="w-full text-xs font-bold uppercase tracking-widest py-2 px-4 flex flex-wrap justify-center md:justify-between items-center gap-4"
             style={{ background: RED, color: '#fff' }}>
            {data.whatsapp && (
                <a href={`tel:${data.whatsapp.replace(/\D/g, '')}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Phone size={12} /> {formatPhoneEcuador(data.whatsapp)}
                </a>
            )}
            {data.address && (
                <span className="flex items-center gap-2">
                    <MapPin size={12} /> {data.address}
                </span>
            )}
            {data.email && (
                <a href={`mailto:${data.email}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Mail size={12} /> {data.email}
                </a>
            )}
        </div>
    );
}

/** Hero section with full-bleed image and headline */
interface HeroSectionProps {
    data: CarroceriasTemplateProps['data'];
    activeSlides?: CarroceriasTemplateProps['activeSlides'];
    currentSlideIndex?: number;
    heroOffer?: {
        enabled?: boolean;
        badge?: string;
        title?: string;
        description?: string;
        originalPrice?: string;
        offerPrice?: string;
        expiresAt?: string;
        ctaText?: string;
    };
    themePrimary?: string;
    /** Color para el modal de oferta (falls back to themePrimary) */
    offerColor?: string;
}

function HeroSection(props: HeroSectionProps) {
    const { data, heroOffer, themePrimary } = props;
    const bg = data.portada_desktop || data.portada_movil || data.foto_url
        || 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?w=1920&auto=format&fit=crop';

    const waLink = data.whatsapp
        ? `https://wa.me/${data.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero más información sobre sus servicios.')}`
        : '#';

    return (
        <section className="relative w-full min-h-[75vh] flex items-end pb-12 md:pb-24" style={{ background: DARK }}>
            {/* Bg image */}
            <div className="absolute inset-0 overflow-hidden">
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
                                    style={{ 
                                        backgroundImage: `url(${slide.portada_movil || slide.portada_desktop || props.data.foto_url || 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?w=1920&auto=format&fit=crop'})`,
                                        opacity: 0.65 
                                    }}
                                />
                                <div
                                    className="absolute inset-0 bg-cover bg-center hidden md:block"
                                    style={{ 
                                        backgroundImage: `url(${slide.portada_desktop || slide.portada_movil || props.data.foto_url || 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?w=1920&auto=format&fit=crop'})`,
                                        opacity: 0.65 
                                    }}
                                />
                            </motion.div>
                        ))
                    ) : (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center md:hidden"
                                style={{ 
                                    backgroundImage: `url(${props.data.portada_movil || props.data.portada_desktop || props.data.foto_url || 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?w=1920&auto=format&fit=crop'})`,
                                    opacity: 0.65 
                                }}
                            />
                            <div
                                className="absolute inset-0 bg-cover bg-center hidden md:block"
                                style={{ 
                                    backgroundImage: `url(${props.data.portada_desktop || props.data.portada_movil || props.data.foto_url || 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?w=1920&auto=format&fit=crop'})`,
                                    opacity: 0.65 
                                }}
                            />
                        </>
                    )}
                <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${DARK}cc 35%, ${DARK}44 100%)` }} />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                    <span className="inline-block text-[11px] font-black uppercase tracking-[0.3em] mb-4 px-3 py-1 rounded-sm"
                          style={{ background: RED, color: '#fff' }}>
                        {data.profesion || 'Especialistas Automotrices'}
                    </span>

                    <h1 className="w-fit bg-black/40 backdrop-blur-md px-8 py-4 rounded-[2.5rem] text-[28px] sm:text-4xl md:text-[55px] font-black text-white uppercase leading-none tracking-tight mb-6 break-words [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000] border border-white/10">
                        {data.nombre_negocio || data.nombre || 'Tu Empresa'}
                    </h1>

                    <p className="w-fit bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl text-white/70 text-base md:text-[20px] max-w-xl leading-relaxed border-l-4 pl-5 [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000] mb-10 border border-white/10"
                       style={{ borderColor: YELLOW }}>
                        {data.bio || 'Calidad, confianza y compromiso en cada proyecto automotriz.'}
                    </p>

                    <div className="flex flex-wrap gap-4 items-center">
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 px-8 py-4 font-black uppercase text-sm tracking-widest text-white transition-all hover:brightness-90 active:scale-95"
                           style={{ background: RED }}>
                            <MessageCircle size={18} /> Contáctanos
                        </a>
                        <a href="#productos"
                           className="flex items-center gap-2 px-8 py-4 font-black uppercase text-sm tracking-widest text-white border-2 transition-all hover:bg-white hover:text-black"
                           style={{ borderColor: '#ffffff55' }}>
                            Ver Productos <ChevronDown size={18} />
                        </a>

                        <ShareButton 
                            title={data.nombre_negocio || data.nombre || 'Tu Empresa'}
                            text={data.bio || 'Calidad, confianza y compromiso en cada proyecto automotriz.'}
                            variant="button"
                            buttonStyle="outline"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Limited Time Offer Badge */}
            <LimitedTimeOffer offer={heroOffer} themePrimary={props.offerColor || themePrimary} />
        </section>
    );
}

/** Category showcase grid (like Martinelli's 4-box grid) */
function CategoryGrid({ categories, products }: { categories: string[]; products: CatalogProduct[] }) {
    if (!categories.length) return null;

    return (
        <section className="py-16 px-4" style={{ background: '#f5f5f5' }}>
            <div className="max-w-6xl mx-auto">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-center mb-2" style={{ color: RED }}>
                    Lo que hacemos
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center uppercase mb-12 break-words" style={{ color: DARK }}>
                    Nuestros Productos
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.slice(0, 4).map((cat, i) => {
                        const sample = products.find(p => (p.category || p.categoria) === cat);
                        const img = sample ? getProductImages(sample)[0]
                            : `https://images.unsplash.com/photo-160158411519${i}-04ecc0da31d7?w=600&auto=format&fit=crop`;

                        return (
                            <a key={cat} href="#productos"
                               className="relative aspect-[3/4] overflow-hidden group cursor-pointer block rounded-sm">
                                <img src={img} alt={cat} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 flex flex-col justify-end p-4"
                                     style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }}>
                                    <h3 className="text-white font-black uppercase text-sm leading-tight mb-2">{cat}</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 inline-block w-fit"
                                          style={{ background: RED, color: '#fff' }}>
                                        Ver más
                                    </span>
                                </div>
                            </a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/** Stats bar */
function StatsBar() {
    const stats = [
        { icon: <Users size={28} />, value: '500+', label: 'Clientes Felices' },
        { icon: <Award size={28} />, value: '15+',  label: 'Años de Experiencia' },
        { icon: <Wrench size={28} />, value: '1200+', label: 'Proyectos Entregados' },
        { icon: <Star size={28} />,  value: '4.9',  label: 'Calificación' },
    ];

    return (
        <div className="py-10 px-4" style={{ background: DARK3 }}>
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <div key={i} className="flex flex-col items-center text-center gap-2 group">
                        <span className="transition-colors group-hover:text-yellow-400" style={{ color: YELLOW }}>
                            {s.icon}
                        </span>
                        <span className="text-3xl md:text-4xl font-black text-white">{s.value}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** About / Why choose us */
function AboutSection({ data }: { data: CarroceriasTemplateProps['data'] }) {
    const checks = [
        'Materiales de primera calidad',
        'Atención y seguimiento personalizado',
        'Garantía en todos los trabajos',
        'Equipo técnico certificado',
    ];

    const img = data.foto_url || data.portada_movil
        || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop';

    return (
        <section id="nosotros" className="py-20 px-4" style={{ background: '#f9f9f9' }}>
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-14">
                {/* Image */}
                <div className="w-full md:w-1/2 relative">
                    <img src={img} alt="Nosotros" className="w-full rounded-sm object-cover shadow-2xl" style={{ maxHeight: 420 }} />
                    <div className="absolute -bottom-4 -right-4 px-6 py-4 font-black text-white text-sm uppercase tracking-wider"
                         style={{ background: RED }}>
                        {data.profesion || 'Especialistas'}
                    </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-1/2">
                    <p className="text-xs font-black uppercase tracking-[0.3em] mb-2" style={{ color: RED }}>Nosotros</p>
                    <h2 className="text-3xl sm:text-4xl md:text-4xl font-black uppercase mb-6 break-words" style={{ color: DARK }}>
                        ¿Por qué <span style={{ color: RED }}>elegirnos?</span>
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-8">
                        {data.bio || `Somos líderes en brindar soluciones de calidad con años de experiencia superando las expectativas de nuestros clientes.`}
                    </p>
                    <ul className="space-y-3">
                        {checks.map((c, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                                <CheckCircle size={18} style={{ color: RED, flexShrink: 0 }} />
                                {c}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

/** Product detail modal with image carousel */
function ProductModal({ product, onClose, waPhone }: { product: CatalogProduct; onClose: () => void; waPhone?: string }) {
    const images = getProductImages(product);
    const [idx, setIdx] = useState(0);

    const waLink = waPhone
        ? `https://wa.me/${waPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, me interesa: ${product.name || product.titulo}`)}`
        : '#';

    return (
        <AnimatePresence>
            <motion.div
                key="overlay"
                className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-6"
                style={{ background: 'rgba(0,0,0,0.85)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    key="modal"
                    className="relative w-full md:max-w-4xl rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col md:flex-row"
                    style={{ background: '#fff', maxHeight: '90vh' }}
                    initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Image side */}
                    <div className="relative w-full md:w-1/2 bg-gray-100" style={{ minHeight: 280 }}>
                        <img src={images[idx]} alt="" className="w-full h-full object-cover" style={{ maxHeight: 420 }} />
                        {images.length > 1 && (
                            <>
                                <button onClick={() => setIdx(i => (i === 0 ? images.length - 1 : i - 1))}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 text-white hover:bg-black/70 transition-colors">
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={() => setIdx(i => (i === images.length - 1 ? 0 : i + 1))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 text-white hover:bg-black/70 transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {images.map((_, i) => (
                                        <button key={i} onClick={() => setIdx(i)}
                                                className="w-2 h-2 rounded-full transition-all"
                                                style={{ background: i === idx ? RED : '#ffffff88' }} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Info side */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col">
                        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: RED }}>
                            {product.category || product.categoria}
                        </p>
                        <h3 className="text-2xl font-black uppercase mb-4" style={{ color: DARK }}>
                            {product.name || product.titulo}
                        </h3>
                        {(product.price || product.precio) && (
                            <p className="text-2xl font-black mb-6" style={{ color: RED }}>
                                {product.price || product.precio}
                            </p>
                        )}
                        <p className="text-gray-600 text-sm leading-relaxed flex-1">
                            {product.description || product.descripcion || 'Producto de alta calidad. Consulta disponibilidad y precio.'}
                        </p>

                        <div className="mt-8 flex flex-col gap-3">
                            <a href={waLink} target="_blank" rel="noopener noreferrer"
                               className="w-full py-4 font-black uppercase text-sm tracking-widest text-white text-center flex items-center justify-center gap-2 transition-all hover:brightness-90"
                               style={{ background: RED }}>
                                <MessageCircle size={18} /> Consultar por WhatsApp
                            </a>
                            <button onClick={onClose}
                                    className="w-full py-3 font-bold text-sm uppercase tracking-widest border-2 transition-all hover:bg-gray-100"
                                    style={{ borderColor: '#ddd', color: '#666' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/** Products grid with horizontal category nav */
function ProductsSection({ data }: { data: CarroceriasTemplateProps['data'] }) {
    const cats = data.catalogo_json?.categories || [];
    const products = data.catalogo_json?.products || [];

    const [activeTab, setActiveTab]   = useState(cats[0] || 'Todos');
    const [selected, setSelected]     = useState<CatalogProduct | null>(null);

    const filtered = activeTab === 'Todos'
        ? products
        : products.filter(p => (p.category || p.categoria) === activeTab);

    if (!products.length) return null;

    return (
        <section id="productos" className="py-20 px-4" style={{ background: '#fff' }}>
            <div className="max-w-6xl mx-auto">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-center mb-2" style={{ color: YELLOW }}>
                    Trabajos
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-center uppercase mb-10" style={{ color: DARK }}>
                    Productos Destacados
                </h2>

                {/* Category tabs */}
                {cats.length > 0 && (
                    <div className="flex overflow-x-auto gap-2 pb-4 mb-10 scrollbar-hide justify-center">
                        {['Todos', ...cats].map(c => (
                            <button key={c} onClick={() => setActiveTab(c)}
                                    className="whitespace-nowrap px-5 py-2 font-black uppercase text-xs tracking-widest transition-all"
                                    style={activeTab === c
                                        ? { background: RED, color: '#fff' }
                                        : { background: '#f0f0f0', color: DARK }}>
                                {c}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(prod => {
                            const img = getProductImages(prod)[0];
                            return (
                                <motion.div key={prod.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group cursor-pointer"
                                            onClick={() => setSelected(prod)}>
                                    <div className="relative aspect-square overflow-hidden mb-3">
                                        <img src={img} alt={prod.name || prod.titulo}
                                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                             style={{ background: 'rgba(0,0,0,0.45)' }}>
                                            <span className="px-4 py-2 font-black text-white text-xs uppercase tracking-widest"
                                                  style={{ background: RED }}>Ver Más</span>
                                        </div>
                                    </div>
                                    <h4 className="font-black uppercase text-sm mb-1" style={{ color: DARK }}>
                                        {prod.name || prod.titulo}
                                    </h4>
                                    {(prod.price || prod.precio) && (
                                        <p className="font-black text-sm" style={{ color: RED }}>
                                            {prod.price || prod.precio}
                                        </p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal */}
            {selected && (
                <ProductModal product={selected} onClose={() => setSelected(null)} waPhone={data.whatsapp} />
            )}
        </section>
    );
}

/** Services list from text field */
function ServicesSection({ data }: { data: CarroceriasTemplateProps['data'] }) {
    const raw = data.productos_servicios || '';
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return null;

    const icons = [<Truck size={32} />, <Wrench size={32} />, <Shield size={32} />, <Clock size={32} />, <Star size={32} />, <Award size={32} />];

    return (
        <section id="servicios" className="py-20 px-4" style={{ background: DARK2 }}>
            <div className="max-w-6xl mx-auto">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-center mb-2" style={{ color: RED }}>
                    Lo que ofrecemos
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-white text-center uppercase mb-14">
                    Nuestros <span style={{ color: RED }}>Servicios</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lines.map((line, i) => (
                        <div key={i} className="flex flex-col gap-4 p-6 transition-colors group"
                             style={{ background: DARK3, border: `1px solid #333` }}>
                            <span style={{ color: RED }} className="group-hover:scale-110 transition-transform origin-left">
                                {icons[i % icons.length]}
                            </span>
                            <h3 className="text-white font-black uppercase text-sm tracking-wide leading-snug">
                                {line}
                            </h3>
                            <div className="h-1 w-10" style={{ background: RED }} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/** Authority Module Section */
function AuthoritySection({ data }: { data: any }) {
    const authorityModule = (() => {
        const raw = data.json_override;
        const parsed = safeJsonParse(raw, {});
        return parsed.authorityModule || { enabled: false };
    })();

    if (!authorityModule.enabled) return null;

    return (
        <section className="py-24 px-6 relative overflow-hidden" style={{ background: DARK3 }}>
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-yellow-500/5 rounded-full blur-[80px] -ml-30 -mb-30 pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-3 bg-red-600 text-white px-4 py-1.5 rounded-sm mb-8"
                >
                    <Shield size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{authorityModule.badge || "Garantía de Calidad"}</span>
                </motion.div>

                <motion.h3 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic leading-[0.95] mb-8"
                >
                    {authorityModule.title || "Liderazgo y Capacidad"}
                </motion.h3>

                {authorityModule.description && (
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="text-lg md:text-xl text-white/60 font-medium max-w-3xl mb-16 leading-relaxed"
                    >
                        {authorityModule.description}
                    </motion.p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full mb-20 border-y border-white/5 py-12">
                    {authorityModule.stats?.map((stat: any, i: number) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 + (i * 0.1) }}
                            className="flex flex-col items-center"
                        >
                            <span className="text-3xl md:text-5xl font-black italic tracking-tighter mb-2" style={{ color: YELLOW }}>{stat.value}</span>
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{stat.label}</span>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 w-full text-left">
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
                                <span className="text-sm font-black text-white uppercase tracking-widest">{metric.label}</span>
                                <span className="text-2xl font-black italic" style={{ color: RED }}>{metric.value}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${metric.value}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                                    className="h-full"
                                    style={{ background: RED }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/** Footer */
function FooterSection({ data }: { data: CarroceriasTemplateProps['data'] }) {
    const waLink = data.whatsapp
        ? `https://wa.me/${data.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quisiera más información.')}`
        : '#';

    return (
        <footer style={{ background: DARK }}>
            {/* CTA Banner */}
            <div className="py-14 px-4 text-center" style={{ background: RED }}>
                <h2 className="text-3xl md:text-4xl font-black uppercase text-white mb-4 tracking-tight">
                    ¿Listo para tu próximo proyecto?
                </h2>
                <p className="text-white/80 mb-8 text-sm font-medium">
                    Contáctanos ahora y recibe asesoría personalizada sin costo.
                </p>
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 px-10 py-4 font-black uppercase text-sm tracking-widest text-black transition-all hover:bg-yellow-300"
                   style={{ background: YELLOW }}>
                    <MessageCircle size={18} /> Escribir por WhatsApp
                </a>
            </div>

            {/* Info strip */}
            <div className="py-10 px-4 border-t" style={{ borderColor: '#333' }}>
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                    <div>
                        <h4 className="text-white font-black uppercase text-lg tracking-tight">
                            {data.nombre_negocio || data.nombre}
                        </h4>
                        <p className="text-white/40 text-xs uppercase tracking-widest mt-1">
                            {data.profesion}
                        </p>
                    </div>
                    <ul className="text-sm text-white/60 space-y-2">
                        {data.whatsapp && <li className="flex items-center gap-2"><Phone size={14} style={{ color: RED }} /> {formatPhoneEcuador(data.whatsapp)}</li>}
                        {data.email   && <li className="flex items-center gap-2"><Mail size={14} style={{ color: RED }} /> {data.email}</li>}
                        {data.address && <li className="flex items-center gap-2"><MapPin size={14} style={{ color: RED }} /> {data.address}</li>}
                    </ul>
                    <div className="flex gap-3">
                        {data.instagram && (
                            <a href={data.instagram} target="_blank" rel="noopener noreferrer"
                               className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors hover:bg-red-700"
                               style={{ background: '#222' }}>
                                <Instagram size={18} />
                            </a>
                        )}
                        {data.facebook && (
                            <a href={data.facebook} target="_blank" rel="noopener noreferrer"
                               className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors hover:bg-red-700"
                               style={{ background: '#222' }}>
                                <Facebook size={18} />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-center pb-6 text-white/20 text-[10px] uppercase tracking-widest">
                &copy; {new Date().getFullYear()} {data.nombre_negocio || data.nombre}. Powered by ActivaQR.
            </div>
        </footer>
    );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function CarroceriasTemplate(props: CarroceriasTemplateProps) {
    const { data } = props;
    if (!data) return null;

    const cats     = data.catalogo_json?.categories || [];
    const products = data.catalogo_json?.products   || [];

    // Hero offer from active slide
    const heroOffer = (() => {
        if (!props.activeSlides || props.activeSlides.length === 0) return undefined;
        const currentSlide = props.activeSlides[props.currentSlideIndex || 0];
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

    // Theme primary color (red for Carrocerias)
    const themePrimary = RED;

    return (
        <div className="min-h-screen font-sans antialiased" style={{ background: '#f5f5f5' }}>
            {/* 0. NAVBAR */}
            <nav className="sticky top-0 z-[110] w-full bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 flex items-center justify-center text-white font-black text-xl rounded-sm" style={{ background: RED }}>
                        {data.nombre_negocio?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <span className="font-black uppercase tracking-tighter text-xl text-black">
                        {data.nombre_negocio || data.nombre || 'ACTIVAQR'}
                    </span>
                </div>
                <div className="hidden md:flex gap-8 font-black uppercase text-[10px] tracking-widest text-gray-500">
                    <a href="#productos" className="hover:text-red-600 transition-colors">Catálogo</a>
                    <a href="#servicios" className="hover:text-red-600 transition-colors">Servicios</a>
                    <a href="#nosotros" className="hover:text-red-600 transition-colors">Nosotros</a>
                </div>
                <a 
                    href={`https://wa.me/${data.whatsapp?.replace(/\D/g, '')}`}
                    target="_blank"
                    className="px-6 py-2 font-black uppercase text-[10px] tracking-widest text-white transition-all hover:brightness-90"
                    style={{ background: RED }}
                >
                    Cotizar
                </a>
            </nav>

            <InfoBar data={data} />
            <HeroSection {...props} heroOffer={heroOffer} themePrimary={themePrimary} />
            {cats.length > 0 && <CategoryGrid categories={cats} products={products} />}
            <StatsBar />
            <AboutSection data={data} />
            {products.length > 0 && <ProductsSection data={data} />}
            <ServicesSection data={data} />
            <AuthoritySection data={data} />
            <FooterSection data={data} />
        </div>
    );
}
