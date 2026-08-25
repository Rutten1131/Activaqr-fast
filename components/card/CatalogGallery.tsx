"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Info, DollarSign, ChevronLeft, ChevronRight, Plus, Minus, Trash2, ShoppingCart, ShoppingBag, Search, ArrowLeft, Utensils, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVideoEmbedUrl, getYouTubeThumbnail, checkIsVerticalVideo, isVideoUrl, needsMetaSDKEmbed } from "@/lib/videoUtils";
import SocialVideoEmbed from './SocialVideoEmbed';
import { DishSteamViewer } from '../restaurant/DishSteamViewer';
import { getMenuTranslations, translateCategory } from '@/lib/menuI18n';

export interface CatalogItem {
    id: string;
    category?: string;
    categoria?: string;
    name?: string;
    titulo?: string;
    image?: string;
    images?: string[];  // Support both English and Spanish
    imagenes?: string[]; // Spanish variant
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
    data: CatalogItem[] | { categories: string[], products: CatalogItem[], item_label_singular?: string, item_label_plural?: string };
    whatsapp?: string;
    onLightboxToggle?: (isOpen: boolean) => void;
    templateId?: string;
    initialCategory?: string;
    lightboxInline?: boolean;
    isRestaurant?: boolean;
    sectionTitle?: string;
    lang?: string;
    categoryImages?: Record<string, string>;
    itemLabelSingular?: string;
    itemLabelPlural?: string;
}

// Mapa de tipografías por template con texturas y jerarquía premium
const TEMPLATE_FONTS: Record<string, { title: string; body: string }> = {
    'hedkandi': { title: 'font-display-condensed font-black tracking-wide', body: 'font-sans-body font-medium' },
    'showcase': { title: 'font-display-condensed font-black tracking-wide', body: 'font-sans-body font-medium' },
    'industrial': { title: 'font-sans-body font-black tracking-tight', body: 'font-sans-body font-medium' },
    'carrocerias': { title: 'font-sans-body font-black tracking-tight', body: 'font-sans-body font-medium' },
};
const DEFAULT_FONTS = { title: 'font-sans-body font-black tracking-tight', body: 'font-sans-body font-medium' };

export interface CartItem {
    product: CatalogItem;
    quantity: number;
}

export default function CatalogGallery({ 
    data, 
    whatsapp, 
    onLightboxToggle, 
    templateId, 
    initialCategory, 
    lightboxInline = false, 
    isRestaurant = false, 
    sectionTitle, 
    lang, 
    categoryImages,
    itemLabelSingular: propsItemLabelSingular,
    itemLabelPlural: propsItemLabelPlural
}: CatalogGalleryProps) {
    const t = useMemo(() => getMenuTranslations(lang), [lang]);
    const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
    const [mediaIndex, setMediaIndex] = useState(0);
    const [activeMediaType, setActiveMediaType] = useState<'image' | 'video'>('image');
    
    // Cart States
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [detailQuantity, setDetailQuantity] = useState(1);

    const fonts = TEMPLATE_FONTS[templateId || ''] || DEFAULT_FONTS;

    const isFoodRestaurant = useMemo(() => {
        if (isRestaurant) return true;
        let allText = '';
        if (data && !Array.isArray(data)) {
            const catStr = Array.isArray(data.categories) ? data.categories.join(' ') : '';
            const prodStr = Array.isArray(data.products) ? data.products.map(p => (p.name || p.titulo || '') + ' ' + (p.category || p.categoria || '')).join(' ') : '';
            allText = `${catStr} ${prodStr}`.toLowerCase();
        } else if (Array.isArray(data)) {
            allText = data.map(p => (p.name || p.titulo || '') + ' ' + (p.category || p.categoria || '')).join(' ').toLowerCase();
        }

        const foodKeywords = ['plato', 'bebida', 'entrada', 'menu', 'menú', 'gastronom', 'restaurante', 'postre', 'asado', 'comida', 'parrillada', 'piqueo', 'especialid', 'coctel', 'cocktail', 'guarnicion', 'pollo', 'carne', 'lomo', 't-bone', 'tomahawk', 'costilla', 'chuleta', 'ceviche', 'alitas', 'pinchos', 'combo', 'tex mex', 'shot', 'cerveza', 'michelada'];
        return foodKeywords.some(kw => allText.includes(kw));
    }, [isRestaurant, data]);

    const itemLabelSingular = useMemo(() => {
        if (propsItemLabelSingular && propsItemLabelSingular.trim()) return propsItemLabelSingular.trim();
        if (data && !Array.isArray(data) && (data as any).item_label_singular && (data as any).item_label_singular.trim()) {
            return (data as any).item_label_singular.trim();
        }
        if (isFoodRestaurant) return 'Plato';
        return 'Producto';
    }, [propsItemLabelSingular, data, isFoodRestaurant]);

    const itemLabelPlural = useMemo(() => {
        if (propsItemLabelPlural && propsItemLabelPlural.trim()) return propsItemLabelPlural.trim();
        if (data && !Array.isArray(data) && (data as any).item_label_plural && (data as any).item_label_plural.trim()) {
            return (data as any).item_label_plural.trim();
        }
        if (isFoodRestaurant) return 'Platos';
        return 'Productos';
    }, [propsItemLabelPlural, data, isFoodRestaurant]);

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
            const name = getItemName(item.product) || 'Producto';
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
        // Buscar tanto 'imagenes' (español) como 'images' (inglés)
        const imgs = (item as any).imagenes || (item as any).images;
        if (Array.isArray(imgs) && imgs.length > 0) return imgs.filter(url => url && !isVideoUrl(url));
        const single = item.image || item.url || item.foto || item.imagen;
        return single && !isVideoUrl(single) ? [single] : [];
    };
    const getVideos = (item: CatalogItem): string[] => {
        // Buscar tanto 'videos' como 'video' (que puede ser array o string individual)
        const vids = (item as any).videos;
        let result: string[] = [];
        if (Array.isArray(vids) && vids.length > 0) {
            result = [...vids];
        } else {
            const single = item.video || item.video_url;
            if (single) result = [single];
        }

        // Dynamic fallback: Extract video URLs placed inside images/image
        const imgs = (item as any).imagenes || (item as any).images;
        if (Array.isArray(imgs)) {
            imgs.forEach(url => {
                if (url && isVideoUrl(url) && !result.includes(url)) {
                    result.push(url);
                }
            });
        } else {
            const singleImg = item.image || item.url || item.foto || item.imagen;
            if (singleImg && isVideoUrl(singleImg) && !result.includes(singleImg)) {
                result.push(singleImg);
            }
        }

        return result;
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

    // Dynamic Translation for Dish Names and Descriptions
    const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!lang || lang === 'es' || !items || items.length === 0) {
            setTranslatedTexts({});
            return;
        }

        const textsToTranslate: string[] = [];
        items.forEach(item => {
            const name = (item.name || item.titulo || '').trim();
            const desc = (item.description || item.descripcion || '').trim();
            if (name && !textsToTranslate.includes(name)) textsToTranslate.push(name);
            if (desc && !textsToTranslate.includes(desc)) textsToTranslate.push(desc);
        });

        if (textsToTranslate.length === 0) return;

        const storageKey = `activaqr_tr_${lang}`;
        try {
            const cached = typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null;
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && typeof parsed === 'object') {
                    setTranslatedTexts(parsed);
                }
            }
        } catch {}

        fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: textsToTranslate, from: 'es', to: lang })
        })
        .then(res => res.json())
        .then(resData => {
            if (resData?.translations && Array.isArray(resData.translations)) {
                const map: Record<string, string> = {};
                textsToTranslate.forEach((text, i) => {
                    if (resData.translations[i]) {
                        map[text] = resData.translations[i];
                    }
                });
                setTranslatedTexts(prev => {
                    const updated = { ...prev, ...map };
                    try { if (typeof window !== 'undefined') sessionStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
                    return updated;
                });
            }
        })
        .catch(() => {});
    }, [lang, items]);

    const getItemName = (item?: CatalogItem | null): string => {
        if (!item) return '';
        const raw = (item.name || item.titulo || '').trim();
        if (!lang || lang === 'es') return raw;
        return translatedTexts[raw] || raw;
    };

    const getItemDescription = (item?: CatalogItem | null): string => {
        if (!item) return '';
        const raw = (item.description || item.descripcion || '').trim();
        if (!lang || lang === 'es') return raw;
        return translatedTexts[raw] || raw;
    };

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

    const [searchQuery, setSearchQuery] = useState<string>('');
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

        // Si sólo hay 1 categoría en total, seleccionarla automáticamente
        if (categories.length === 1 && !activeCategory) {
            setActiveCategory(categories[0]);
        }
    }, [categories, initialCategory]);

    // Función auxiliar para obtener la imagen representativa de una categoría
    const getCategoryRepresentativeImage = (catName: string): string => {
        if (categoryImages && categoryImages[catName]) {
            return categoryImages[catName];
        }
        const catItems = items.filter(item => (item.category || item.categoria)?.toLowerCase() === catName.toLowerCase());
        for (const item of catItems) {
            const imgs = getImages(item);
            if (imgs.length > 0 && imgs[0]) return imgs[0];
            const vids = getVideos(item);
            if (vids.length > 0 && vids[0]) {
                const yt = getYouTubeThumbnail(vids[0]);
                if (yt) return yt;
            }
        }
        return '';
    };

    // Datos enriquecidos de categorías (con imagen y conteo)
    const categoriesData = useMemo(() => {
        return categories.map(cat => {
            const catItems = items.filter(item => (item.category || item.categoria)?.toLowerCase() === cat.toLowerCase());
            const img = getCategoryRepresentativeImage(cat);
            return {
                name: cat,
                count: catItems.length,
                image: img,
                items: catItems
            };
        });
    }, [categories, items]);

    // Búsqueda global de productos
    const searchedItems = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return [];
        return items.filter(item => {
            const name = (item.name || item.titulo || '').toLowerCase();
            const desc = (item.description || item.descripcion || '').toLowerCase();
            const cat = (item.category || item.categoria || '').toLowerCase();
            return name.includes(q) || desc.includes(q) || cat.includes(q);
        });
    }, [items, searchQuery]);

    // Filter items based on active category (case-insensitive) o búsqueda
    const filteredItems = useMemo(() => {
        if (searchQuery.trim()) return searchedItems;
        if (!activeCategory) return items;
        return items.filter(item => (item.category || item.categoria)?.toLowerCase() === activeCategory.toLowerCase());
    }, [items, activeCategory, searchQuery, searchedItems]);

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div className={cn("w-full flex flex-col gap-8", sectionTitle ? "pt-2" : "mt-8 md:mt-16 pt-6 md:pt-10 border-t border-white/10")}>
            <h4 className={`text-[10px] sm:text-xs ${fonts.title} uppercase tracking-widest text-[var(--theme-primary)] mb-2 flex items-center gap-2 font-black`}>
                <ZoomIn size={14} /> {isFoodRestaurant ? t.sectionTitle : (sectionTitle ?? 'CATÁLOGO INTERACTIVO')}
            </h4>

            {/* Inline Lightbox Modal - appears just below title when lightboxInline=true */}
            {lightboxInline && selectedItem && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative w-full z-[100] bg-black/80 backdrop-blur-sm rounded-2xl md:rounded-[32px] border border-white/20 shadow-2xl shadow-black/50 overflow-hidden mb-6 md:mb-8"
                >
                    <motion.div
                        initial={{ y: 30, scale: 0.98 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 20, scale: 0.98 }}
                        className="relative w-full flex flex-col md:flex-row bg-[#1a1d33] rounded-2xl md:rounded-[32px] overflow-hidden border border-white/30 shadow-2xl shadow-black/80"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button 
                            className="absolute top-2 right-2 md:top-4 md:right-4 p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-full transition-all z-[120] shadow-xl hover:scale-110 active:scale-95"
                            onClick={handleCloseItem}
                        >
                            <X size={16} className="md:w-5 md:h-5" />
                        </button>

                        {(() => {
                            if (!selectedItem) return null;
                            const images = getImages(selectedItem);
                            const videos = getVideos(selectedItem);
                            const allMedia: Array<{ type: 'image' | 'video'; url: string }> = [
                                ...images.map(url => ({ type: 'image' as const, url })),
                                ...videos.map(url => ({ type: 'video' as const, url })),
                            ];
                            const current = allMedia[mediaIndex];
                            if (!current) return null;

                            const isVertical = current.type === 'video' && checkIsVerticalVideo(current.url);
                            const total = allMedia.length;

                            return (
                                <div className={cn(
                                    "w-full md:w-1/2 bg-black/50 flex flex-col items-center justify-center relative",
                                    isVertical 
                                        ? "h-[50vh] md:h-auto md:aspect-square" 
                                        : (current.type === 'video' ? "aspect-video md:aspect-square" : "aspect-[4/3] md:aspect-square")
                                )}>
                                    <div className="w-full h-full flex items-center justify-center p-1 md:p-4">
                                        {current.type === 'video' ? (
                                            (() => {
                                                // Instagram y Facebook: usar SDK oficial de Meta
                                                if (needsMetaSDKEmbed(current.url)) {
                                                    const isVert = checkIsVerticalVideo(current.url);
                                                    return (
                                                        <SocialVideoEmbed
                                                            url={current.url}
                                                            isVertical={isVert}
                                                            className="w-full h-full"
                                                        />
                                                    );
                                                }
                                                const embedUrl = getVideoEmbedUrl(current.url);
                                                if (embedUrl) {
                                                    const isVert = checkIsVerticalVideo(current.url);
                                                    return (
                                                        <iframe 
                                                            src={embedUrl}
                                                            className={cn(
                                                                "rounded-xl md:rounded-2xl shadow-2xl mx-auto w-full h-full",
                                                                isVert 
                                                                    ? "max-h-[35vh] md:max-h-[60vh] aspect-[9/16]" 
                                                                    : "aspect-video"
                                                            )}
                                                            allowFullScreen
                                                            allow="autoplay; encrypted-media"
                                                        />
                                                    );
                                                }
                                                return null;
                                            })()
                                        ) : (
                                            // Primera imagen en restaurante: efecto 3D orbital
                                            (isFoodRestaurant || true) && mediaIndex === 0 ? (
                                                <div className="w-full h-full min-h-[250px] aspect-square relative rounded-xl md:rounded-2xl overflow-hidden shadow-2xl bg-black">
                                                    <DishSteamViewer
                                                        src={current.url}
                                                        alt={selectedItem.name || selectedItem.titulo}
                                                        enableSteam={true}
                                                        enableRotation={true}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <img 
                                                    src={current.url} 
                                                    alt={selectedItem.name || selectedItem.titulo}
                                                    className="max-w-full max-h-full object-contain rounded-xl md:rounded-2xl shadow-2xl"
                                                />
                                            )
                                        )}
                                    </div>

                                    {/* Navigation Controls */}
                                    {total > 1 && (
                                        <>
                                            <button 
                                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/85 text-white rounded-full transition-all z-10 shadow-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMediaIndex(prev => (prev - 1 + total) % total);
                                                }}
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                            <button 
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/85 text-white rounded-full transition-all z-10 shadow-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMediaIndex(prev => (prev + 1) % total);
                                                }}
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </>
                                    )}

                                    {/* Dots Indicator */}
                                    {total > 1 && (
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/35 px-3 py-1.5 rounded-full backdrop-blur-md">
                                            {allMedia.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full transition-all",
                                                        mediaIndex === idx ? "bg-white scale-125" : "bg-white/40"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMediaIndex(idx);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Details Section - Mobile: compact, bottom half */}
                        <div className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center bg-gradient-to-br from-[#111322] to-[#0a0b14] relative overflow-y-auto"
                            style={{ maxHeight: '45vh' }}
                        >
                            <div className="relative z-10">
                                <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
                                    <div className={`inline-block px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-white/10 text-amber-300 text-[9px] md:text-[10px] ${fonts.title} font-black uppercase tracking-widest w-fit border border-amber-400/30 shadow-md`}>
                                        {translateCategory(selectedItem.category || selectedItem.categoria || '', lang)}
                                    </div>
                                </div>
                                
                                <h2 className={`text-lg md:text-2xl lg:text-3xl ${fonts.title} text-white uppercase tracking-tight mb-2 md:mb-3 leading-tight`}>
                                    {getItemName(selectedItem)}
                                </h2>
                                
                                {(selectedItem.price || selectedItem.precio) && (
                                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 bg-white/5 w-fit px-3 py-2 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-white/10 backdrop-blur-md">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-primary)]/50 flex items-center justify-center text-white shadow-lg shadow-[var(--theme-primary)]/20">
                                            <DollarSign size={16} className="md:w-5 md:h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] md:text-[9px] text-white/50 font-black uppercase tracking-widest mb-0.5">{t.priceLabel}</span>
                                            <span className="text-base md:text-xl lg:text-2xl font-black text-white leading-none">{selectedItem.price || selectedItem.precio}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {(selectedItem.description || selectedItem.descripcion) && (
                                <div className="mb-3 md:mb-4">
                                    <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 flex items-center gap-1 md:gap-2">
                                        <Info size={10} className="md:w-3 md:h-3 text-amber-400" /> {t.dishDetails}
                                    </h4>
                                    <div className={`text-white/85 text-xs md:text-sm leading-relaxed ${fonts.body} line-clamp-3 font-medium`}>
                                        {getItemDescription(selectedItem)}
                                    </div>
                                </div>
                            )}

                            {/* Always show Add to Cart - quantity selector + Add to Cart */}
                            <div className="mt-auto flex flex-col gap-2">
                                {/* Quantity selector */}
                                <div className="flex items-center justify-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                                    <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-1.5 border border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}
                                            className="text-white/70 hover:text-white transition-colors p-1 cursor-pointer"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="text-white font-black text-sm w-6 text-center">{detailQuantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setDetailQuantity(q => q + 1)}
                                            className="text-white/70 hover:text-white transition-colors p-1 cursor-pointer"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Add to Cart button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        addToCart(selectedItem, detailQuantity);
                                        handleCloseItem();
                                    }}
                                    className="w-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90 text-white py-2.5 md:py-3 px-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                                    style={{ backgroundColor: 'var(--theme-primary, #f66739)' }}
                                >
                                    <ShoppingCart size={14} className="md:w-4 md:h-4" />
                                    {t.addToCart}
                                </button>

                                {/* WhatsApp button - only if whatsapp exists */}
                                {whatsapp && (
                                    <a
                                        href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, me interesa: ${getItemName(selectedItem)}. Precio: ${selectedItem.price || selectedItem.precio || 'Consultar'}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] py-2.5 md:py-3 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#25D366]/30 active:scale-95 transition-all"
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path d="M19.057 4.298c-1.883-1.884-4.386-2.922-7.05-2.922-5.495 0-9.968 4.471-9.968 9.966 0 1.756.459 3.468 1.328 4.975l-1.41 5.148 5.266-1.381c1.455.794 3.09 1.211 4.78 1.212h.004c5.493 0 9.964-4.471 9.964-9.966 0-2.662-1.036-5.166-2.921-7.052zm-7.05 15.393h-.003c-1.488 0-2.946-.4-4.23-1.155l-.304-.18-3.146.825.839-3.067-.197-.314c-.829-1.321-1.267-2.854-1.267-4.43 0-4.43 3.605-8.036 8.04-8.036 2.148 0 4.167.837 5.684 2.355 1.517 1.518 2.352 3.538 2.352 5.686-.002 4.434-3.609 8.041-8.043 8.041zm4.412-6.03c-.242-.121-1.431-.707-1.652-.788-.221-.081-.383-.121-.544.121-.161.242-.625.787-.766.949-.141.161-.282.181-.524.061-.242-.121-1.02-.376-1.943-1.199-.718-.641-1.203-1.433-1.344-1.675-.141-.242-.015-.373.106-.493.109-.108.242-.282.363-.423.121-.141.161-.242.242-.403.081-.161.04-.303-.02-.424-.061-.121-.544-1.312-.746-1.796-.196-.472-.397-.407-.544-.415-.141-.007-.302-.008-.463-.008-.161 0-.423.061-.644.303-.221.242-.846.827-.846 2.018 0 1.191.866 2.336.987 2.5.121.164 1.706 2.605 4.133 3.651.577.249 1.027.397 1.378.508.579.185 1.107.158 1.523.096.465-.069 1.431-.585 1.632-1.15.201-.564.201-1.049.141-1.15-.06-.101-.221-.161-.463-.282z"/>
                                        </svg>
                                        {t.orderViaWhatsApp}
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Search Bar - Sleek Luxury Search Input */}
            <div className="relative w-full max-w-2xl mx-auto mb-2">
                <div className="relative flex items-center bg-[#111322]/90 hover:bg-[#16192b] border border-white/15 focus-within:border-[var(--theme-primary)] focus-within:ring-2 focus-within:ring-[var(--theme-primary)]/25 rounded-full px-4 sm:px-5 py-2.5 sm:py-3.5 transition-all shadow-xl backdrop-blur-md">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 mr-3 flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                            isFoodRestaurant 
                                ? t.searchPlaceholder 
                                : "Busca cualquier producto o servicio en el catálogo..."
                        }
                        className="w-full bg-transparent text-white placeholder-white/40 text-xs sm:text-sm font-medium focus:outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="p-1 text-white/50 hover:text-white rounded-full transition-colors ml-2 cursor-pointer"
                            title="Limpiar búsqueda"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* VISTA 1: Búsqueda activa */}
            {searchQuery.trim() ? (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                            <Search size={18} className="text-[var(--theme-primary)]" />
                            <h3 className="text-white font-bold text-base sm:text-lg">
                                Resultados para: &ldquo;<span className="text-[var(--theme-primary)]">{searchQuery}</span>&rdquo;
                            </h3>
                        </div>
                        <span className="text-xs text-white/60 font-medium">
                            {filteredItems.length} {isFoodRestaurant ? (filteredItems.length === 1 ? 'plato encontrado' : 'platos encontrados') : (filteredItems.length === 1 ? 'producto' : 'productos')}
                        </span>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="py-16 text-center text-white/40 flex flex-col items-center justify-center">
                            <Search size={48} className="mb-3 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-wider">No se encontraron productos coincidentes</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
                            >
                                Ver todas las categorías
                            </button>
                        </div>
                    ) : (
                        <motion.div 
                            layout 
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredItems.map((item) => {
                                    const isPopular = (item.name || item.titulo || '').toLowerCase().includes('equipo');
                                    const isPremium = (item.name || item.titulo || '').toLowerCase().includes('master');
                                    
                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.85 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.85 }}
                                            transition={{ duration: 0.25 }}
                                            className={cn(
                                                "group relative aspect-square rounded-2xl md:rounded-[32px] overflow-hidden cursor-pointer border hover:border-[var(--theme-primary)]/50 hover:shadow-[0_10px_30px_-10px_var(--theme-primary)] transition-all duration-300",
                                                isPopular ? "border-[var(--theme-primary)]/40 shadow-[0_0_20px_rgba(246,103,57,0.15)]" : "border-white/10"
                                            )}
                                            onClick={() => handleOpenItem(item)}
                                        >
                                            <div className="absolute inset-0 z-20 group-hover:translate-x-[200%] -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none" />
                                            
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
                                            </div>

                                            {(() => {
                                                const images = getImages(item);
                                                const videos = getVideos(item);
                                                const imageUrl = images[0] || '';
                                                const videoUrl = videos[0] || '';
                                                
                                                if (imageUrl) {
                                                    if (isFoodRestaurant) {
                                                        return (
                                                            <DishSteamViewer
                                                                src={imageUrl}
                                                                alt={item.name || item.titulo}
                                                                dishName={item.name || item.titulo}
                                                                price={item.price || item.precio}
                                                                enableSteam={true}
                                                                enableRotation={true}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        );
                                                    }
                                                    return (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={imageUrl}
                                                            alt={item.name || item.titulo}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                    );
                                                }
                                                
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

                                                return (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/50 text-white/30 p-4">
                                                        <Utensils className="w-10 h-10 mb-2 opacity-40" />
                                                        <span className="text-[9px] uppercase tracking-wider text-center">Sin imagen</span>
                                                    </div>
                                                );
                                            })()}

                                            {/* Info de producto */}
                                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/45 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6 pb-5 md:pb-8">
                                                <h3 className={`text-white ${fonts.title} text-sm sm:text-base md:text-xl uppercase tracking-tight leading-snug mb-1 group-hover:text-[var(--theme-primary)] transition-colors line-clamp-2 drop-shadow-md`}>
                                                    {item.name || item.titulo}
                                                </h3>
                                                {(item.price || item.precio) && (
                                                    <p className="inline-block w-fit px-3 py-1.5 bg-black/75 border border-white/20 rounded-xl text-white font-black text-xs md:text-sm mt-1.5 backdrop-blur-md shadow-xl font-mono">
                                                        {item.price || item.precio}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            ) : !activeCategory ? (
                /* VISTA 2: Grid de Categorías Principales */
                <div className="flex flex-col gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                            {isFoodRestaurant ? t.exploreTitle : 'Explora Nuestro Catálogo'}
                        </h2>
                        <p className="text-xs sm:text-sm text-white/60 font-medium mt-1">
                            {isFoodRestaurant 
                                ? t.exploreSubtitle 
                                : `Elige una categoría para descubrir nuestros ${itemLabelPlural.toLowerCase()}`}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 md:gap-6">
                        {categoriesData.map((cat) => (
                            <motion.div
                                key={cat.name}
                                whileHover={{ y: -4, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    userChangedRef.current = true;
                                    setActiveCategory(cat.name);
                                    const url = new URL(window.location.href);
                                    url.searchParams.set('cat', cat.name.toLowerCase());
                                    window.history.replaceState({}, '', url.toString());
                                }}
                                className="group relative aspect-[4/5] sm:aspect-[4/3] rounded-2xl md:rounded-[28px] overflow-hidden cursor-pointer border border-white/10 hover:border-[var(--theme-primary)]/70 hover:shadow-[0_15px_35px_-8px_rgba(246,103,57,0.35)] transition-all duration-300 bg-[#161824] select-none"
                            >
                                {/* Shine effect on hover */}
                                <div className="absolute inset-0 z-20 group-hover:translate-x-[200%] -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none" />

                                {/* Top Left Badge: Conteo de items dinámico */}
                                <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 z-20">
                                    <span className="inline-flex items-center px-3 py-1 bg-black/70 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                                        {cat.count} {cat.count === 1 ? itemLabelSingular : itemLabelPlural}
                                    </span>
                                </div>

                                {/* Category Image */}
                                {cat.image ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1d33] to-[#0e101a] text-white/30 p-4">
                                        <Utensils size={36} className="opacity-40 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-[11px] uppercase font-bold tracking-widest text-white/50">{cat.name}</span>
                                    </div>
                                )}

                                {/* Dark Gradient Overlay for optimal legibility */}
                                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/45 to-transparent flex flex-col justify-end p-4 sm:p-5 group-hover:from-black/90 transition-all">
                                    <h3 className="text-white font-black text-base sm:text-lg md:text-xl uppercase tracking-tight leading-snug group-hover:text-[var(--theme-primary)] transition-colors drop-shadow-md line-clamp-2">
                                        {translateCategory(cat.name, lang)}
                                    </h3>
                                    <span className="text-xs font-semibold text-amber-300/90 group-hover:text-amber-200 flex items-center gap-1.5 mt-2 transition-all group-hover:translate-x-1">
                                        {isFoodRestaurant ? t.viewDishes : `Ver ${itemLabelPlural.toLowerCase()}`} <ChevronRight size={14} />
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : (
                /* VISTA 3: Productos de la Categoría Seleccionada */
                <div className="flex flex-col gap-6">
                    {/* Header de Navegación entre Categorías */}
                    <div className="flex items-center justify-between gap-4">
                        {categories.length > 1 && (
                            <button
                                onClick={() => {
                                    userChangedRef.current = true;
                                    setActiveCategory('');
                                    const url = new URL(window.location.href);
                                    url.searchParams.delete('cat');
                                    window.history.replaceState({}, '', url.toString());
                                }}
                                className="w-fit inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer select-none"
                            >
                                <ArrowLeft size={14} /> {t.backToCategories}
                            </button>
                        )}
                    </div>

                    {/* Título de la Categoría Activa */}
                    <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                            {translateCategory(activeCategory || categories[0], lang)}
                        </h2>
                        <span className="text-xs text-white/50 font-bold uppercase tracking-wider">
                            {filteredItems.length} {filteredItems.length === 1 ? itemLabelSingular : itemLabelPlural}
                        </span>
                    </div>

                    {/* Image Grid de Productos */}
                    <motion.div 
                        layout 
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6"
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
                                        
                                        // Si hay al menos una imagen, mostrar la primera (o visor 3D para restaurantes)
                                        if (imageUrl) {
                                            if (isFoodRestaurant) {
                                                return (
                                                    <DishSteamViewer
                                                        src={imageUrl}
                                                        alt={item.name || item.titulo}
                                                        dishName={item.name || item.titulo}
                                                        price={item.price || item.precio}
                                                        enableSteam={true}
                                                        enableRotation={true}
                                                        className="w-full h-full object-cover"
                                                    />
                                                );
                                            }
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
                                            
                                            // Si es un video de TikTok, Instagram, Facebook o similar, mostramos un placeholder premium
                                            if (videoUrl.includes('tiktok.com')) {
                                                return (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 relative">
                                                        <div className="absolute top-3 right-3 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold text-white/80 uppercase tracking-wider">TikTok</div>
                                                        <svg className="w-8 h-8 mb-2 text-pink-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.42-.42-.6-.65v7.17c.02 1.4-.44 2.87-1.46 3.86-1.12 1.1-2.77 1.65-4.32 1.48-1.92-.17-3.72-1.44-4.38-3.26-.8-2.14-.15-4.75 1.68-6.13 1.34-1.04 3.19-1.27 4.79-.71v4.11c-.81-.4-1.78-.4-2.52.12-.76.51-1.16 1.46-1.01 2.37.13.91.95 1.64 1.86 1.74.87.11 1.81-.35 2.19-1.15.22-.44.27-.94.26-1.43V0z"/>
                                                        </svg>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">▶ Ver Video</span>
                                                    </div>
                                                );
                                            }
                                            if (videoUrl.includes('instagram.com')) {
                                                return (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-pink-700 to-yellow-600 text-white p-4 relative">
                                                        <div className="absolute top-3 right-3 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold text-white/80 uppercase tracking-wider">Instagram</div>
                                                        <svg className="w-8 h-8 mb-2 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                                        </svg>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">▶ Ver Reel</span>
                                                    </div>
                                                );
                                            }
                                            if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) {
                                                return (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-800 text-white p-4 relative">
                                                        <div className="absolute top-3 right-3 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold text-white/80 uppercase tracking-wider">Facebook</div>
                                                        <svg className="w-8 h-8 mb-2 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                                        </svg>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">▶ Ver Video</span>
                                                    </div>
                                                );
                                            }

                                            // Si es un MP4 u otro directo, usamos un video nativo silenciado como miniatura
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
                                                <Utensils className="w-10 h-10 mb-2 opacity-40" />
                                                <span className="text-[9px] uppercase tracking-wider text-center">Sin imagen</span>
                                            </div>
                                        );
                                    })()}
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/45 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6 pb-5 md:pb-8">
                                        <h3 className={`text-white ${fonts.title} text-sm sm:text-base md:text-xl uppercase tracking-tight leading-snug mb-1 group-hover:text-[var(--theme-primary)] transition-colors line-clamp-2 drop-shadow-md`}>
                                            {getItemName(item)}
                                        </h3>
                                        {(item.price || item.precio) && (
                                            <p className="inline-block w-fit px-3 py-1.5 bg-black/75 border border-white/20 rounded-xl text-white font-black text-xs md:text-sm mt-1.5 backdrop-blur-md shadow-xl font-mono">
                                                {item.price || item.precio}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )})}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}

            {/* Lightbox Modal */}
            <AnimatePresence>
                {/* Original Lightbox Modal - only show when NOT inline */}
            {!lightboxInline && selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={lightboxInline 
                            ? "relative w-full z-[100] bg-black/60 backdrop-blur-sm rounded-2xl md:rounded-[32px] border border-white/20 shadow-2xl shadow-black/50 overflow-hidden mb-8"
                            : "fixed inset-0 z-[100] flex items-start md:items-center justify-center pt-2 md:p-10 bg-black/60 backdrop-blur-sm overflow-y-auto"
                        }
                        onClick={lightboxInline ? undefined : () => setSelectedItem(null)}
                    >
                        <motion.div
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 20, scale: 0.95 }}
                            className={lightboxInline
                                ? "relative max-w-5xl w-full flex flex-col md:flex-row bg-[#1a1d33] rounded-2xl md:rounded-[32px] overflow-y-auto border border-white/30 shadow-2xl shadow-black/80"
                                : "relative max-w-5xl w-full my-0 md:my-auto mt-auto md:mt-0 flex flex-col md:flex-row bg-[#1a1d33] md:rounded-[48px] overflow-y-auto md:overflow-hidden border border-white/30 shadow-2xl shadow-black/80"
                            }
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Mobile/Global Close Button */}
                            <button 
                                className={lightboxInline 
                                    ? "absolute top-3 right-3 md:top-4 md:right-4 p-2 md:p-3 bg-red-500/90 hover:bg-red-500 text-white rounded-full transition-all z-[120] shadow-xl hover:scale-110 active:scale-95"
                                    : "fixed top-4 right-4 md:absolute md:top-8 md:right-8 p-3 bg-red-500/90 hover:bg-red-500 text-white rounded-full transition-all z-[120] shadow-xl hover:scale-110 active:scale-95"
                                }
                               onClick={handleCloseItem}
                            >
                                <X size={20} className="md:w-6 md:h-6" />
                            </button>

                            {/* Image Section */}
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

                                const isVertical = current.type === 'video' && checkIsVerticalVideo(current.url);
                                
                                return (
                                    <div className={cn(
                                        "w-full md:w-3/5 bg-black/50 flex flex-col items-center justify-center relative p-0",
                                        isVertical 
                                            ? "h-[50vh] md:h-auto md:aspect-auto" 
                                            : (current.type === 'video' ? "aspect-video md:aspect-auto" : "aspect-square md:aspect-auto")
                                    )}>
                                        <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={`${mediaIndex}-${current.type}`}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="w-full h-full flex items-center justify-center overflow-visible"
                                                >
                                                    {current.type === 'video' ? (
                                                        (() => {
                                                            // Instagram y Facebook: usar SDK oficial de Meta
                                                            if (needsMetaSDKEmbed(current.url)) {
                                                                const isVertical = checkIsVerticalVideo(current.url);
                                                                return (
                                                                    <SocialVideoEmbed
                                                                        url={current.url}
                                                                        isVertical={isVertical}
                                                                        className="w-full h-full"
                                                                    />
                                                                );
                                                            }
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
                                                        (isFoodRestaurant || true) && mediaIndex === 0 ? (
                                                            <div className="w-full h-[300px] sm:h-[400px] md:h-full max-h-[50vh] md:max-h-[70vh] aspect-square relative rounded-2xl md:rounded-[32px] overflow-hidden shadow-2xl bg-black">
                                                                <DishSteamViewer
                                                                    src={current.url}
                                                                    alt={selectedItem.name || selectedItem.titulo}
                                                                    enableSteam={true}
                                                                    enableRotation={true}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={current.url}
                                                                alt={selectedItem.name || selectedItem.titulo}
                                                                className="max-w-full max-h-[50vh] md:max-h-[70vh] object-contain rounded-2xl md:rounded-[32px] shadow-2xl"
                                                            />
                                                        )
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
                                        </div>
                                    );
                                })()}

                            {/* Details Section */}
                            <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 bg-gradient-to-br from-[#111322] to-[#0a0b14] relative">
                                {/* Decorative Glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-primary)]/10 rounded-full blur-[80px] pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex flex-wrap items-center gap-2 mb-6">
                                        <div className={`inline-block px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[10px] sm:text-xs ${fonts.title} font-black uppercase tracking-widest w-fit border border-amber-400/30 shadow-md`}>
                                            {translateCategory(selectedItem.category || selectedItem.categoria || '', lang)}
                                        </div>
                                    </div>
                                    
                                    <h2 className={`text-2xl md:text-4xl ${fonts.title} text-white uppercase tracking-tight mb-4 leading-none`}>
                                        {getItemName(selectedItem)}
                                    </h2>
                                    
                                    {(selectedItem.price || selectedItem.precio) && (
                                        <div className="flex items-center gap-4 mb-8 bg-white/5 w-fit p-3 pr-6 rounded-2xl border border-white/10 backdrop-blur-md">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-primary)]/50 flex items-center justify-center text-white shadow-lg shadow-[var(--theme-primary)]/20">
                                                <DollarSign size={24} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-white/50 font-black uppercase tracking-widest mb-0.5">{t.priceLabel}</span>
                                                <span className="text-2xl md:text-3xl font-black text-white leading-none">{selectedItem.price || selectedItem.precio}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {(selectedItem.description || selectedItem.descripcion) && (
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                                            <Info size={12} className="text-amber-400" /> {t.dishDetails}
                                        </h4>
                                        <div className={`text-white/85 text-sm md:text-base leading-relaxed ${fonts.body} space-y-2 whitespace-pre-line font-medium`}>
                                            {getItemDescription(selectedItem)}
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
                                                {t.addToCart}
                                            </button>
                                        </div>

                                        {/* Botón secundario para Comprar Directo */}
                                        <a
                                            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, me interesa comprar: ${getItemName(selectedItem)}. Precio: ${selectedItem.price || selectedItem.precio || 'Consultar'}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#25D366]/30 active:scale-95 transition-all"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path d="M19.057 4.298c-1.883-1.884-4.386-2.922-7.05-2.922-5.495 0-9.968 4.471-9.968 9.966 0 1.756.459 3.468 1.328 4.975l-1.41 5.148 5.266-1.381c1.455.794 3.09 1.211 4.78 1.212h.004c5.493 0 9.964-4.471 9.964-9.966 0-2.662-1.036-5.166-2.921-7.052zm-7.05 15.393h-.003c-1.488 0-2.946-.4-4.23-1.155l-.304-.18-3.146.825.839-3.067-.197-.314c-.829-1.321-1.267-2.854-1.267-4.43 0-4.43 3.605-8.036 8.04-8.036 2.148 0 4.167.837 5.684 2.355 1.517 1.518 2.352 3.538 2.352 5.686-.002 4.434-3.609 8.041-8.043 8.041zm4.412-6.03c-.242-.121-1.431-.707-1.652-.788-.221-.081-.383-.121-.544.121-.161.242-.625.787-.766.949-.141.161-.282.181-.524.061-.242-.121-1.02-.376-1.943-1.199-.718-.641-1.203-1.433-1.344-1.675-.141-.242-.015-.373.106-.493.109-.108.242-.282.363-.423.121-.141.161-.242.242-.403.081-.161.04-.303-.02-.424-.061-.121-.544-1.312-.746-1.796-.196-.472-.397-.407-.544-.415-.141-.007-.302-.008-.463-.008-.161 0-.423.061-.644.303-.221.242-.846.827-.846 2.018 0 1.191.866 2.336.987 2.5.121.164 1.706 2.605 4.133 3.651.577.249 1.027.397 1.378.508.579.185 1.107.158 1.523.096.465-.069 1.431-.585 1.632-1.15.201-.564.201-1.049.141-1.15-.06-.101-.221-.161-.463-.282z"/>
                                            </svg>
                                            {t.orderViaWhatsApp}
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
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider">{t.orderModalTitle}</h3>
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
                                            <p className="text-sm font-bold uppercase tracking-wider">{t.emptyCartMessage}</p>
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
                                                        <h4 className="text-white font-bold text-sm truncate uppercase">{getItemName(item.product)}</h4>
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
                                                                {t.clearCart ? 'Quitar' : 'Eliminar'}
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
                                        <span className="text-xs font-bold uppercase tracking-wider text-white/50">{t.cartTotal}</span>
                                        <span className="text-2xl font-black">${cartTotals.priceSum.toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full bg-[#25D366] hover:bg-[#22c35e] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_30px_-5px_rgba(37,211,102,0.4)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border-none"
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path d="M19.057 4.298c-1.883-1.884-4.386-2.922-7.05-2.922-5.495 0-9.968 4.471-9.968 9.966 0 1.756.459 3.468 1.328 4.975l-1.41 5.148 5.266-1.381c1.455.794 3.09 1.211 4.78 1.212h.004c5.493 0 9.964-4.471 9.964-9.966 0-2.662-1.036-5.166-2.921-7.052zm-7.05 15.393h-.003c-1.488 0-2.946-.4-4.23-1.155l-.304-.18-3.146.825.839-3.067-.197-.314c-.829-1.321-1.267-2.854-1.267-4.43 0-4.43 3.605-8.036 8.04-8.036 2.148 0 4.167.837 5.684 2.355 1.517 1.518 2.352 3.538 2.352 5.686-.002 4.434-3.609 8.041-8.043 8.041zm4.412-6.03c-.242-.121-1.431-.707-1.652-.788-.221-.081-.383-.121-.544.121-.161.242-.625.787-.766.949-.141.161-.282.181-.524.061-.242-.121-1.02-.376-1.943-1.199-.718-.641-1.203-1.433-1.344-1.675-.141-.242-.015-.373.106-.493.109-.108.242-.282.363-.423.121-.141.161-.242.242-.403.081-.161.04-.303-.02-.424-.061-.121-.544-1.312-.746-1.796-.196-.472-.397-.407-.544-.415-.141-.007-.302-.008-.463-.008-.161 0-.423.061-.644.303-.221.242-.846.827-.846 2.018 0 1.191.866 2.336.987 2.5.121.164 1.706 2.605 4.133 3.651.577.249 1.027.397 1.378.508.579.185 1.107.158 1.523.096.465-.069 1.431-.585 1.632-1.15.201-.564.201-1.049.141-1.15-.06-.101-.221-.161-.463-.282z"/>
                                        </svg>
                                        {t.sendOrder}
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
