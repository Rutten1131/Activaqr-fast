"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Info, DollarSign, ChevronLeft, ChevronRight, Plus, Minus, Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVideoEmbedUrl, getYouTubeThumbnail, checkIsVerticalVideo } from "@/lib/videoUtils";

export interface CatalogItem {
    id: string;
    category?: string;
    categoria?: string;
    name?: string;
    titulo?: string;
    image?: string;
    url?: string;
    description?: string;
    descripcion?: string;
    price?: string;
    precio?: string;
    foto?: string;
    imagen?: string;
    video?: string;
    video_url?: string;
}

interface CatalogGalleryProps {
    data: CatalogItem[] | { categories: string[], products: CatalogItem[] };
    whatsapp?: string;
    onLightboxToggle?: (isOpen: boolean) => void;
    templateId?: string;
    initialCategory?: string;
}

// Mapa de tipografías por template
const TEMPLATE_FONTS: Record<string, { title: string; body: string }> = {
    'hedkandi': { title: 'font-display-condensed font-black', body: 'font-sans-body' },
    'showcase': { title: 'font-display-condensed font-black', body: 'font-sans-body' },
    'industrial': { title: 'font-black', body: 'font-sans' },
    'carrocerias': { title: 'font-black', body: 'font-sans' },
};
const DEFAULT_FONTS = { title: 'font-black', body: 'font-sans' };

export interface CartItem {
    product: CatalogItem;
    quantity: number;
}

export default function CatalogGallery({ data, whatsapp, onLightboxToggle, templateId, initialCategory }: CatalogGalleryProps) {
    const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
    const [mediaIndex, setMediaIndex] = useState(0);
    const [activeMediaType, setActiveMediaType] = useState<'image' | 'video'>('image');
    
    // Cart States
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [detailQuantity, setDetailQuantity] = useState(1);

    const fonts = TEMPLATE_FONTS[templateId || ''] || DEFAULT_FONTS;

    // Helper to parse price safely
    const parsePrice = (priceStr?: string): number => {
        if (!priceStr) return 0;
        const clean = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    };

    // Helper to add item to cart
    const addToCart = (product: CatalogItem, qty: number) => {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) {
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
            }
            return [...prev, { product, quantity: qty }];
        });
    };

    // Helper to update item quantity in cart
    const updateQuantity = (productId: string, qty: number) => {
        if (qty <= 0) {
            setCart(prev => prev.filter(i => i.product.id !== productId));
        } else {
            setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
        }
    };

    // Helper to remove item from cart
    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(i => i.product.id !== productId));
    };

    // Compute cart summary
    const cartTotals = useMemo(() => {
        let totalItems = 0;
        let priceSum = 0;
        cart.forEach(item => {
            totalItems += item.quantity;
            priceSum += parsePrice(item.product.price || item.product.precio) * item.quantity;
        });
        return { totalItems, priceSum };
    }, [cart]);

    // Handle checkout to WhatsApp
    const handleCheckout = () => {
        if (!whatsapp || cart.length === 0) return;
        let text = `🛒 *NUEVO PEDIDO DESDE EL CATÁLOGO*\n\n`;
        cart.forEach((item, index) => {
            const name = item.product.name || item.product.titulo || 'Producto';
            const price = item.product.price || item.product.precio || 'Consultar';
            const qty = item.quantity;
            const numPrice = parsePrice(price);
            const subtotal = numPrice * qty;
            text += `${index + 1}. *${name}*\n`;
            text += `   Cantidad: ${qty}\n`;
            text += `   Precio unitario: ${price}\n`;
            if (numPrice > 0) {
                text += `   Subtotal: $${subtotal.toFixed(2)}\n`;
            }
            text += `\n`;
        });
        if (cartTotals.priceSum > 0) {
            text += `*TOTAL ESTIMADO:* $${cartTotals.priceSum.toFixed(2)}\n\n`;
        }
        text += `¡Hola! Me gustaría confirmar la compra de estos productos.`;
        const url = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Obtener arrays normalizados de imágenes y videos
    const getImages = (item: CatalogItem): string[] => {
        const imgs = (item as any).imagenes;
        if (Array.isArray(imgs) && imgs.length > 0) return imgs;
        const single = item.image || item.url || item.foto || item.imagen;
        return single ? [single] : [];
    };
    const getVideos = (item: CatalogItem): string[] => {
        const vids = (item as any).videos;
        if (Array.isArray(vids) && vids.length > 0) return vids;
        const single = item.video || item.video_url;
        return single ? [single] : [];
    };
    const getTotalMedia = (item: CatalogItem) => getImages(item).length + getVideos(item).length;

    const handleOpenItem = (item: CatalogItem) => {
        setSelectedItem(item);
        setMediaIndex(0);
        setDetailQuantity(1); // Reset default qty in lightbox
        setActiveMediaType(getImages(item).length > 0 ? 'image' : 'video');
        if (onLightboxToggle) onLightboxToggle(true);
    };

    const handleCloseItem = () => {
        setSelectedItem(null);
        setMediaIndex(0);
        if (onLightboxToggle) onLightboxToggle(false);
    };

    // Normalize data
    const items = useMemo(() => {
        if (Array.isArray(data)) return data;
        return data?.products || [];
    }, [data]);

    const customCategories = useMemo(() => {
        if (Array.isArray(data)) return null;
        const cats = data?.categories || null;
        return cats ? cats.filter((c: string) => c !== 'Nueva Categoría') : null;
    }, [data]);

    // Extract categories
    const categories = useMemo(() => {
        const cats = Array.from(new Set(items.map(item => item.category || item.categoria))).filter(Boolean) as string[];
        if (customCategories && customCategories.length > 0) {
            return customCategories;
        }
        return cats;
    }, [items, customCategories]);

    const [activeCategory, setActiveCategory] = useState<string>('');
    const userChangedRef = useRef(false);

    // Leer categoría inicial: solo se aplica UNA VEZ (o cuando cambia initialCategory y el usuario no ha intervenido)
    useEffect(() => {
        if (categories.length === 0) return;

        // Si el usuario ya tocó manualmente una tab, no sobreescribir su selección
        if (userChangedRef.current) return;

        // Si viene initialCategory del padre (click en "Ver catálogo"), usarla
        if (initialCategory) {
            const match = categories.find(c => c.toLowerCase() === initialCategory.toLowerCase());
            if (match) { setActiveCategory(match); return; }
        }

        // Si hay ?cat= en la URL, usarla
        const urlCat = new URLSearchParams(window.location.search).get('cat');
        if (urlCat) {
            const match = categories.find(c => c.toLowerCase() === urlCat.toLowerCase());
            if (match) { setActiveCategory(match); return; }
        }

        // Por defecto: primera categoría (solo si aún no hay una seleccionada)
        if (!activeCategory) {
            setActiveCategory(categories[0]);
        }
    }, [categories, initialCategory]);

    // Filter items based on active category (case-insensitive)
    const filteredItems = useMemo(() => {
        if (!activeCategory) return items;
        return items.filter(item => (item.category || item.categoria)?.toLowerCase() === activeCategory.toLowerCase());
    }, [items, activeCategory]);

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div className="w-full mt-8 md:mt-16 pt-6 md:pt-10 border-t border-white/10 flex flex-col gap-8">
            <h4 className={`text-[10px] sm:text-xs ${fonts.title} uppercase tracking-widest text-[var(--theme-primary)] mb-2 flex items-center gap-2`}>
                <ZoomIn size={14} /> CATÁLOGO INTERACTIVO
            </h4>

            {/* Category Filters */}
            {categories.length > 1 && ( // Show filters if there's more than 1 category
                <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                userChangedRef.current = true;
                                setActiveCategory(cat);
                                const url = new URL(window.location.href);
                                url.searchParams.set('cat', cat.toLowerCase());
                                window.history.replaceState({}, '', url.toString());
                            }}
                            className={cn(
                                `px-5 py-2 rounded-full text-xs ${fonts.title} tracking-wider uppercase transition-all duration-300 border-2 touch-manipulation cursor-pointer select-none`,
                                activeCategory === cat
                                    ? "shadow-lg scale-105 text-white"
                                    : "bg-white/10 text-white/80 border-white/20 hover:border-[var(--theme-primary)]/50 hover:bg-white/20"
                            )}
                                style={activeCategory === cat ? { 
                                    backgroundColor: 'var(--theme-primary, #FF6B00)',
                                    borderColor: 'var(--theme-primary, #FF6B00)',
                                    color: 'white',
                                    zIndex: 1
                                } : {}}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Image Grid */}
            <motion.div 
                layout 
                className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6"
            >
                <AnimatePresence mode="popLayout">
                    {filteredItems.map((item) => {
                        const isPopular = (item.name || item.titulo || '').toLowerCase().includes('equipo');
                        const isPremium = (item.name || item.titulo || '').toLowerCase().includes('master');
                        
                        return (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                                "group relative aspect-square rounded-2xl md:rounded-[32px] overflow-hidden cursor-pointer border hover:border-[var(--theme-primary)]/50 hover:shadow-[0_10px_30px_-10px_var(--theme-primary)] transition-all duration-300",
                                isPopular ? "border-[var(--theme-primary)]/40 shadow-[0_0_20px_rgba(246,103,57,0.15)]" : "border-white/10"
                            )}
                            onClick={() => handleOpenItem(item)}
                        >
                            {/* Shine effect */}
                            <div className="absolute inset-0 z-20 group-hover:translate-x-[200%] -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none" />
                            
                            {/* Badges */}
                            <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20 flex flex-col gap-1.5">
                                {isPopular && (
                                    <span className="inline-flex items-center gap-1 w-fit px-2.5 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                                        ⭐ Más Popular
                                    </span>
                                )}
                                {isPremium && (
                                    <span className="inline-flex items-center gap-1 w-fit px-2.5 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                                        👑 Premium
                                    </span>
                                )}
                                {isPopular && (
                                    <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 bg-black/60 backdrop-blur-md text-[#25D366] border border-[#25D366]/30 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-full">
                                        Ahorra 20%
                                    </span>
                                )}
                            </div>

                            {(() => {
                                const images = getImages(item);
                                const videos = getVideos(item);
                                const imageUrl = images[0] || '';
                                const videoUrl = videos[0] || '';
                                
                                // Si hay al menos una imagen, mostrar la primera
                                if (imageUrl) {
                                    return (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={imageUrl}
                                            alt={item.name || item.titulo}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    );
                                }
                                
                                // Si no hay imagen pero hay video de YouTube, intentamos sacar la miniatura
                                if (videoUrl) {
                                    const ytThumb = getYouTubeThumbnail(videoUrl);
                                    if (ytThumb) {
                                        return (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={ytThumb}
                                                alt={item.name || item.titulo}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        );
                                    }
                                    
                                    // Si es un MP4 u otro, usamos un video nativo silenciado como miniatura
                                    return (
                                        <video
                                            src={videoUrl}
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    );
                                }

                                // Fallback por defecto si no hay nada
                                return (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/50 text-white/30 p-4">
                                        <svg className="w-12 h-12 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-[9px] uppercase tracking-wider text-center">Sin imagen</span>
                                    </div>
                                );
                            })()}
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6 pb-5 md:pb-8">
                                <h3 className="text-white font-black text-sm md:text-xl uppercase tracking-wide leading-tight mb-1 group-hover:text-[var(--theme-primary)] transition-colors">
                                    {item.name || item.titulo}
                                </h3>
                                {(item.price || item.precio) && (
                                    <p className="inline-block w-fit px-3 py-1.5 bg-black/70 border border-white/20 rounded-xl text-white font-black text-xs md:text-sm mt-2 backdrop-blur-md shadow-xl">
                                        {item.price || item.precio}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )})}
                </AnimatePresence>
            </motion.div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/60 backdrop-blur-sm overflow-y-auto"
                        onClick={() => setSelectedItem(null)}
                    >
                        <motion.div
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 20, scale: 0.95 }}
                            className="relative max-w-5xl w-full flex flex-col md:flex-row bg-[#1a1d33] md:rounded-[48px] overflow-hidden border border-white/30 shadow-2xl shadow-black/80"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Mobile/Global Close Button - Fixed on mobile to always stay visible */}
                            <button 
                                className="fixed top-4 right-4 md:absolute md:top-8 md:right-8 p-3 bg-red-500/90 hover:bg-red-500 text-white rounded-full transition-all z-[120] shadow-xl hover:scale-110 active:scale-95"
                               onClick={handleCloseItem}
                            >
                                <X size={20} className="md:w-6 md:h-6" />
                            </button>

                            {/* Image Section */}
                            <div className="w-full md:w-3/5 bg-black/50 aspect-square md:aspect-auto flex flex-col items-center justify-center relative p-4 md:p-8">
                                {(() => {
                                    if (!selectedItem) return null;
                                    const images = getImages(selectedItem);
                                    const videos = getVideos(selectedItem);
                                    const allMedia: Array<{ type: 'image' | 'video'; url: string }> = [
                                        ...images.map(url => ({ type: 'image' as const, url })),
                                        ...videos.map(url => ({ type: 'video' as const, url })),
                                    ];
                                    const total = allMedia.length;
                                    const current = allMedia[mediaIndex];
                                    if (!current) return null;

                                    return (
                                        <>
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={`${mediaIndex}-${current.type}`}
                                                    initial={{ opacity: 0, x: 50 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -50 }}
                                                    className="w-full h-full flex items-center justify-center"
                                                >
                                                    {current.type === 'video' ? (
                                                        (() => {
                                                            const embedUrl = getVideoEmbedUrl(current.url);
                                                            if (embedUrl) {
                                                                const isVertical = checkIsVerticalVideo(current.url);
                                                                return (
                                                                    <iframe 
                                                                        src={embedUrl}
                                                                        className={cn(
                                                                            "rounded-2xl md:rounded-[32px] shadow-2xl mx-auto",
                                                                            isVertical 
                                                                                ? "h-full max-h-[60vh] md:max-h-[75vh] aspect-[9/16]" 
                                                                                : "w-full aspect-video"
                                                                        )}
                                                                        allowFullScreen
                                                                        allow="autoplay; encrypted-media"
                                                                    />
                                                                );
                                                            }
                                                            return (
                                                                <video 
                                                                    src={current.url} 
                                                                    controls 
                                                                    autoPlay
                                                                    className="max-w-full max-h-[50vh] md:max-h-[70vh] rounded-2xl md:rounded-[32px] shadow-2xl"
                                                                />
                                                            );
                                                        })()
                                                    ) : (
                                                        <img
                                                            src={current.url}
                                                            alt={selectedItem.name || selectedItem.titulo}
                                                            className="max-w-full max-h-[50vh] md:max-h-[70vh] object-contain rounded-2xl md:rounded-[32px] shadow-2xl"
                                                        />
                                                    )}
                                                </motion.div>
                                            </AnimatePresence>

                                            {/* Navegación entre imágenes/videos */}
                                            {total > 1 && (
                                                <>
                                                    <button 
                                                        onClick={() => setMediaIndex(i => (i - 1 + total) % total)}
                                                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all z-20 border border-white/10"
                                                    >
                                                        <ChevronLeft size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setMediaIndex(i => (i + 1) % total)}
                                                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all z-20 border border-white/10"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                                                        {allMedia.map((m, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setMediaIndex(i)}
                                                                className={cn(
                                                                    "w-2 h-2 rounded-full transition-all",
                                                                    i === mediaIndex
                                                                        ? "bg-white w-4"
                                                                        : m.type === 'video' 
                                                                            ? "bg-primary/60 hover:bg-primary" 
                                                                            : "bg-white/40 hover:bg-white/60"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Details Section */}
                            <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 bg-gradient-to-br from-[#111322] to-[#0a0b14] relative">
                                {/* Decorative Glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-primary)]/10 rounded-full blur-[80px] pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex flex-wrap items-center gap-2 mb-6">
                                        <div className={`inline-block px-3 py-1 rounded-full bg-white/10 text-white/60 text-[10px] ${fonts.title} uppercase tracking-widest w-fit border border-white/5`}>
                                            {selectedItem.category || selectedItem.categoria}
                                        </div>
                                    </div>
                                    
                                    <h2 className={`text-2xl md:text-4xl ${fonts.title} text-white uppercase tracking-tight mb-4 leading-none`}>
                                        {selectedItem.name || selectedItem.titulo}
                                    </h2>
                                    
                                    {(selectedItem.price || selectedItem.precio) && (
                                        <div className="flex items-center gap-4 mb-8 bg-white/5 w-fit p-3 pr-6 rounded-2xl border border-white/10 backdrop-blur-md">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-primary)]/50 flex items-center justify-center text-white shadow-lg shadow-[var(--theme-primary)]/20">
                                                <DollarSign size={24} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-white/50 font-black uppercase tracking-widest mb-0.5">Inversión</span>
                                                <span className="text-2xl md:text-3xl font-black text-white leading-none">{selectedItem.price || selectedItem.precio}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {(selectedItem.description || selectedItem.descripcion) && (
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                                            <Info size={12} /> DETALLES DEL PRODUCTO
                                        </h4>
                                        <div className={`text-white/80 text-sm md:text-base leading-relaxed ${fonts.body} space-y-2 whitespace-pre-line`}>
                                            {selectedItem.description || selectedItem.descripcion}
                                        </div>
                                    </div>
                                )}

                                {whatsapp && (
                                    <div className="mt-8 flex flex-col gap-3">
                                        {/* Selector de cantidad y Agregar al Carrito */}
                                        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                                            <div className="flex items-center justify-between gap-3 bg-black/40 rounded-xl px-3 py-2 border border-white/10 select-none">
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}
                                                    className="text-white hover:text-[var(--theme-primary)] transition-colors p-1"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-white font-black text-sm w-4 text-center">{detailQuantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailQuantity(q => q + 1)}
                                                    className="text-white hover:text-[var(--theme-primary)] transition-colors p-1"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    addToCart(selectedItem, detailQuantity);
                                                    handleCloseItem(); // Cerrar modal al añadir
                                                }}
                                                className="flex-1 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90 text-white py-3 px-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                                                style={{ backgroundColor: 'var(--theme-primary, #f66739)' }}
                                            >
                                                <ShoppingCart size={16} />
                                                Añadir al Carrito
                                            </button>
                                        </div>

                                        {/* Botón secundario para Comprar Directo */}
                                        <a
                                            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, me interesa comprar: ${selectedItem.name || selectedItem.titulo}. Precio: ${selectedItem.price || selectedItem.precio || 'Consultar'}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#25D366]/30 active:scale-95 transition-all"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path d="M19.057 4.298c-1.883-1.884-4.386-2.922-7.05-2.922-5.495 0-9.968 4.471-9.968 9.966 0 1.756.459 3.468 1.328 4.975l-1.41 5.148 5.266-1.381c1.455.794 3.09 1.211 4.78 1.212h.004c5.493 0 9.964-4.471 9.964-9.966 0-2.662-1.036-5.166-2.921-7.052zm-7.05 15.393h-.003c-1.488 0-2.946-.4-4.23-1.155l-.304-.18-3.146.825.839-3.067-.197-.314c-.829-1.321-1.267-2.854-1.267-4.43 0-4.43 3.605-8.036 8.04-8.036 2.148 0 4.167.837 5.684 2.355 1.517 1.518 2.352 3.538 2.352 5.686-.002 4.434-3.609 8.041-8.043 8.041zm4.412-6.03c-.242-.121-1.431-.707-1.652-.788-.221-.081-.383-.121-.544.121-.161.242-.625.787-.766.949-.141.161-.282.181-.524.061-.242-.121-1.02-.376-1.943-1.199-.718-.641-1.203-1.433-1.344-1.675-.141-.242-.015-.373.106-.493.109-.108.242-.282.363-.423.121-.141.161-.242.242-.403.081-.161.04-.303-.02-.424-.061-.121-.544-1.312-.746-1.796-.196-.472-.397-.407-.544-.415-.141-.007-.302-.008-.463-.008-.161 0-.423.061-.644.303-.221.242-.846.827-.846 2.018 0 1.191.866 2.336.987 2.5.121.164 1.706 2.605 4.133 3.651.577.249 1.027.397 1.378.508.579.185 1.107.158 1.523.096.465-.069 1.431-.585 1.632-1.15.201-.564.201-1.049.141-1.15-.06-.101-.221-.161-.463-.282z"/>
                                            </svg>
                                            Consultar por WhatsApp
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botón flotante del carrito */}
            {cartTotals.totalItems > 0 && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCartOpen(true)}
                    className="fixed bottom-24 right-6 z-[9998] bg-[#25D366] text-black p-5 rounded-full shadow-2xl flex items-center justify-center gap-3 border border-black/10 hover:shadow-[0_10px_35px_-5px_#25D366] transition-all cursor-pointer"
                >
                    <ShoppingBag size={24} className="text-black" />
                    <span className="bg-black text-white text-[12px] font-black rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                        {cartTotals.totalItems}
                    </span>
                    {cartTotals.priceSum > 0 && (
                        <span className="font-black text-base md:text-lg pr-1 border-l border-black/20 pl-3 text-black">
                            ${cartTotals.priceSum.toFixed(2)}
                        </span>
                    )}
                </motion.button>
            )}

            {/* Drawer lateral para el Carrito */}
            <AnimatePresence>
                {isCartOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex justify-end bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsCartOpen(false)}
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-md h-full bg-[#111322] border-l border-white/10 shadow-2xl p-6 flex flex-col justify-between"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag className="text-[var(--theme-primary)]" size={24} style={{ color: 'var(--theme-primary, #f66739)' }} />
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider">Tu Pedido</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="p-2 hover:bg-white/10 text-white rounded-full transition-colors cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Cart Items */}
                                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-white/40">
                                            <ShoppingBag size={48} className="mb-4 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-wider">El carrito está vacío</p>
                                        </div>
                                    ) : (
                                        cart.map(item => {
                                            const price = item.product.price || item.product.precio || '0';
                                            const numPrice = parsePrice(price);
                                            const subtotal = numPrice * item.quantity;
                                            const images = getImages(item.product);
                                            
                                            return (
                                                <div key={item.product.id} className="flex gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 items-center">
                                                    {/* Product Image */}
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
                                                        {images[0] ? (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img src={images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white/20"><ShoppingBag size={20} /></div>
                                                        )}
                                                    </div>

                                                    {/* Product Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white font-bold text-sm truncate uppercase">{item.product.name || item.product.titulo}</h4>
                                                        <p className="text-xs text-white/50 mb-2">{price}</p>
                                                        
                                                        {/* Quantity controls */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1 border border-white/5">
                                                                <button
                                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                                    className="text-white/70 hover:text-white p-1 cursor-pointer"
                                                                >
                                                                    <Minus size={12} />
                                                                </button>
                                                                <span className="text-white font-bold text-xs w-4 text-center">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                                    className="text-white/70 hover:text-white p-1 cursor-pointer"
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFromCart(item.product.id)}
                                                                className="text-red-400/80 hover:text-red-400 text-xs font-bold uppercase tracking-wider cursor-pointer"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Summary & Checkout */}
                            {cart.length > 0 && (
                                <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
                                    <div className="flex justify-between items-center text-white">
                                        <span className="text-xs font-bold uppercase tracking-wider text-white/50">Total Estimado</span>
                                        <span className="text-2xl font-black">${cartTotals.priceSum.toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full bg-[#25D366] hover:bg-[#22c35e] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_30px_-5px_rgba(37,211,102,0.4)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border-none"
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path d="M19.057 4.298c-1.883-1.884-4.386-2.922-7.05-2.922-5.495 0-9.968 4.471-9.968 9.966 0 1.756.459 3.468 1.328 4.975l-1.41 5.148 5.266-1.381c1.455.794 3.09 1.211 4.78 1.212h.004c5.493 0 9.964-4.471 9.964-9.966 0-2.662-1.036-5.166-2.921-7.052zm-7.05 15.393h-.003c-1.488 0-2.946-.4-4.23-1.155l-.304-.18-3.146.825.839-3.067-.197-.314c-.829-1.321-1.267-2.854-1.267-4.43 0-4.43 3.605-8.036 8.04-8.036 2.148 0 4.167.837 5.684 2.355 1.517 1.518 2.352 3.538 2.352 5.686-.002 4.434-3.609 8.041-8.043 8.041zm4.412-6.03c-.242-.121-1.431-.707-1.652-.788-.221-.081-.383-.121-.544.121-.161.242-.625.787-.766.949-.141.161-.282.181-.524.061-.242-.121-1.02-.376-1.943-1.199-.718-.641-1.203-1.433-1.344-1.675-.141-.242-.015-.373.106-.493.109-.108.242-.282.363-.423.121-.141.161-.242.242-.403.081-.161.04-.303-.02-.424-.061-.121-.544-1.312-.746-1.796-.196-.472-.397-.407-.544-.415-.141-.007-.302-.008-.463-.008-.161 0-.423.061-.644.303-.221.242-.846.827-.846 2.018 0 1.191.866 2.336.987 2.5.121.164 1.706 2.605 4.133 3.651.577.249 1.027.397 1.378.508.579.185 1.107.158 1.523.096.465-.069 1.431-.585 1.632-1.15.201-.564.201-1.049.141-1.15-.06-.101-.221-.161-.463-.282z"/>
                                        </svg>
                                        Enviar Pedido por WhatsApp
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
