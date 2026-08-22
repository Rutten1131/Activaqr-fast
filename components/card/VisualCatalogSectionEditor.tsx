"use client";

import React, { useState, useMemo } from "react";
import {
    Plus,
    Trash2,
    Camera,
    Video as VideoIcon,
    ChevronRight,
    ArrowLeft,
    Image as ImageIcon,
    Edit3,
    X,
    Check,
    Utensils,
    Package,
    DollarSign,
    Sparkles,
    Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getVideoEmbedUrl, getYouTubeThumbnail } from "@/lib/videoUtils";

export interface CatalogProduct {
    id: string;
    name?: string;
    titulo?: string;
    price?: string;
    precio?: string;
    description?: string;
    descripcion?: string;
    category?: string;
    categoria?: string;
    image?: string;
    foto?: string;
    imagen?: string;
    images?: string[];
    imagenes?: string[];
    video?: string;
    video_url?: string;
    videos?: string[];
}

export interface VisualCatalogSectionEditorProps {
    categories: string[];
    products: CatalogProduct[];
    categoryImages?: Record<string, string>;
    onChange: (updated: {
        categories: string[];
        products: CatalogProduct[];
        categoryImages: Record<string, string>;
    }) => void;
    themeColor?: string;
}

// ─── Compresor de imágenes cliente ───────────────────────────────────────────
const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(img.src);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/webp", 0.85));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

export default function VisualCatalogSectionEditor({
    categories = [],
    products = [],
    categoryImages = {},
    onChange,
    themeColor = "#FF5C00",
}: VisualCatalogSectionEditorProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    // Modales internos
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
    const [videoModalProdId, setVideoModalProdId] = useState<string | null>(null);
    const [videoUrlInput, setVideoUrlInput] = useState("");

    // Normalizar lista de categorías válidas
    const validCategories = useMemo(() => {
        const set = new Set(categories.filter((c) => c && c.trim() && !["Nueva Categoría", "Sin Categoría", "Todas", "General"].includes(c)));
        products.forEach((p) => {
            const c = (p.category || p.categoria || "").trim();
            if (c && !["Nueva Categoría", "Sin Categoría", "Todas", "General"].includes(c)) {
                set.add(c);
            }
        });
        return Array.from(set);
    }, [categories, products]);

    // Obtener imagen representativa de categoría
    const getCategoryRepresentativeImage = (catName: string): string => {
        if (categoryImages[catName]) {
            return categoryImages[catName];
        }
        const catItems = products.filter(
            (p) => (p.category || p.categoria || "").toLowerCase() === catName.toLowerCase()
        );
        for (const item of catItems) {
            const imgs = item.images || (item.image ? [item.image] : []) || (item.foto ? [item.foto] : []);
            if (imgs.length > 0 && imgs[0]) return imgs[0];
            const vids = item.videos || (item.video ? [item.video] : []);
            if (vids.length > 0 && vids[0]) {
                const yt = getYouTubeThumbnail(vids[0]);
                if (yt) return yt;
            }
        }
        return "";
    };

    // Datos enriquecidos de categorías
    const categoriesData = useMemo(() => {
        return validCategories.map((cat) => {
            const catItems = products.filter(
                (p) => (p.category || p.categoria || "").toLowerCase() === cat.toLowerCase()
            );
            return {
                name: cat,
                count: catItems.length,
                image: getCategoryRepresentativeImage(cat),
            };
        });
    }, [validCategories, products, categoryImages]);

    // Productos de la categoría activa
    const activeCategoryProducts = useMemo(() => {
        if (!selectedCategory) return [];
        return products.filter(
            (p) => (p.category || p.categoria || "").toLowerCase() === selectedCategory.toLowerCase()
        );
    }, [products, selectedCategory]);

    // ─── ACCIONES DE CATEGORÍA ────────────────────────────────────────────────
    const handleCreateCategory = () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        if (validCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
            alert("Ya existe una categoría con este nombre");
            return;
        }
        const updatedCats = [...validCategories, trimmed];
        onChange({
            categories: updatedCats,
            products,
            categoryImages,
        });
        setNewCategoryName("");
        setIsNewCategoryModalOpen(false);
        setSelectedCategory(trimmed);
    };

    const handleSaveEditCategory = () => {
        if (!editingCategory) return;
        const { oldName, newName } = editingCategory;
        const trimmed = newName.trim();
        if (!trimmed || trimmed === oldName) {
            setEditingCategory(null);
            return;
        }

        const updatedCats = validCategories.map((c) => (c === oldName ? trimmed : c));
        const updatedProducts = products.map((p) => {
            if ((p.category || p.categoria || "").toLowerCase() === oldName.toLowerCase()) {
                return { ...p, category: trimmed, categoria: trimmed };
            }
            return p;
        });
        const updatedImages = { ...categoryImages };
        if (updatedImages[oldName]) {
            updatedImages[trimmed] = updatedImages[oldName];
            delete updatedImages[oldName];
        }

        onChange({
            categories: updatedCats,
            products: updatedProducts,
            categoryImages: updatedImages,
        });

        if (selectedCategory === oldName) {
            setSelectedCategory(trimmed);
        }
        setEditingCategory(null);
    };

    const handleDeleteCategory = (catName: string, count: number) => {
        let msg = `¿Eliminar la categoría "${catName}"?`;
        if (count > 0) {
            msg += `\n\nADVERTENCIA: También se eliminarán los ${count} producto(s) incluidos en ella.`;
        }
        if (!confirm(msg)) return;

        const updatedCats = validCategories.filter((c) => c !== catName);
        const updatedProducts = products.filter(
            (p) => (p.category || p.categoria || "").toLowerCase() !== catName.toLowerCase()
        );
        const updatedImages = { ...categoryImages };
        delete updatedImages[catName];

        onChange({
            categories: updatedCats,
            products: updatedProducts,
            categoryImages: updatedImages,
        });

        if (selectedCategory === catName) {
            setSelectedCategory(null);
        }
    };

    const handleUploadCategoryImage = async (catName: string, file: File) => {
        setUploadingId(`cat_${catName}`);
        try {
            const base64 = await compressImage(file);
            const updatedImages = { ...categoryImages, [catName]: base64 };
            onChange({
                categories: validCategories,
                products,
                categoryImages: updatedImages,
            });
        } catch (e) {
            alert("Error al comprimir la foto de categoría");
        } finally {
            setUploadingId(null);
        }
    };

    const handleRemoveCategoryImage = (catName: string) => {
        const updatedImages = { ...categoryImages };
        delete updatedImages[catName];
        onChange({
            categories: validCategories,
            products,
            categoryImages: updatedImages,
        });
    };

    // ─── ACCIONES DE PRODUCTOS ────────────────────────────────────────────────
    const handleAddProduct = () => {
        if (!selectedCategory) return;
        const newProd: CatalogProduct = {
            id: `prod_${Date.now()}`,
            name: "Nuevo Producto",
            titulo: "Nuevo Producto",
            price: "$0.00",
            precio: "$0.00",
            description: "Descripción detallada del producto o servicio.",
            descripcion: "Descripción detallada del producto o servicio.",
            category: selectedCategory,
            categoria: selectedCategory,
            image: "",
            images: [],
            video: "",
            videos: [],
        };
        const updatedProducts = [newProd, ...products];
        onChange({
            categories: validCategories,
            products: updatedProducts,
            categoryImages,
        });
    };

    const handleUpdateProductField = (prodId: string, field: keyof CatalogProduct, value: any) => {
        const updatedProducts = products.map((p) => {
            if (p.id === prodId) {
                const updated = { ...p, [field]: value };
                if (field === "name") updated.titulo = value;
                if (field === "price") updated.precio = value;
                if (field === "description") updated.descripcion = value;
                return updated;
            }
            return p;
        });
        onChange({
            categories: validCategories,
            products: updatedProducts,
            categoryImages,
        });
    };

    const handleDeleteProduct = (prodId: string) => {
        if (!confirm("¿Eliminar este producto?")) return;
        const updatedProducts = products.filter((p) => p.id !== prodId);
        onChange({
            categories: validCategories,
            products: updatedProducts,
            categoryImages,
        });
    };

    const handleUploadProductImage = async (prodId: string, file: File, isMain = false) => {
        setUploadingId(prodId);
        try {
            const base64 = await compressImage(file);
            const updatedProducts = products.map((p) => {
                if (p.id === prodId) {
                    const currentImgs = p.images || (p.image ? [p.image] : []) || [];
                    let newImgs: string[];
                    if (isMain) {
                        newImgs = [base64, ...currentImgs.filter((_, idx) => idx !== 0)];
                    } else {
                        newImgs = [...currentImgs, base64];
                    }
                    return {
                        ...p,
                        image: newImgs[0] || "",
                        images: newImgs,
                    };
                }
                return p;
            });
            onChange({
                categories: validCategories,
                products: updatedProducts,
                categoryImages,
            });
        } catch (e) {
            alert("Error al comprimir la imagen.");
        } finally {
            setUploadingId(null);
        }
    };

    const handleRemoveProductImage = (prodId: string, imgIndex: number) => {
        const updatedProducts = products.map((p) => {
            if (p.id === prodId) {
                const currentImgs = p.images || (p.image ? [p.image] : []) || [];
                const filtered = currentImgs.filter((_, idx) => idx !== imgIndex);
                return {
                    ...p,
                    image: filtered[0] || "",
                    images: filtered,
                };
            }
            return p;
        });
        onChange({
            categories: validCategories,
            products: updatedProducts,
            categoryImages,
        });
    };

    const handleAddProductVideo = (prodId: string, videoUrl: string) => {
        if (!videoUrl.trim()) return;
        const updatedProducts = products.map((p) => {
            if (p.id === prodId) {
                const currentVids = p.videos || (p.video ? [p.video] : []) || [];
                const updatedVids = [...currentVids, videoUrl.trim()];
                return {
                    ...p,
                    video: updatedVids[0] || "",
                    videos: updatedVids,
                };
            }
            return p;
        });
        onChange({
            categories: validCategories,
            products: updatedProducts,
            categoryImages,
        });
        setVideoUrlInput("");
        setVideoModalProdId(null);
    };

    const handleRemoveProductVideo = (prodId: string, vidIndex: number) => {
        const updatedProducts = products.map((p) => {
            if (p.id === prodId) {
                const currentVids = p.videos || (p.video ? [p.video] : []) || [];
                const updated = currentVids.filter((_, idx) => idx !== vidIndex);
                return {
                    ...p,
                    video: updated[0] || "",
                    videos: updated,
                };
            }
            return p;
        });
        onChange({
            categories: validCategories,
            products: updatedProducts,
            categoryImages,
        });
    };

    // ─── RENDER PRINCIPAL ─────────────────────────────────────────────────────
    return (
        <div className="w-full space-y-6">
            {/* Modal: Crear Nueva Categoría */}
            {isNewCategoryModalOpen && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-[#111322] border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
                        <h3 className="text-base font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Plus size={18} style={{ color: themeColor }} /> Nueva Categoría
                        </h3>
                        <p className="text-xs text-white/60 mb-4">
                            Ej: Especialidades, Entradas, Postres, Hamburguesas, Servicios Premium.
                        </p>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                            placeholder="Nombre de la categoría..."
                            autoFocus
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-orange-500 mb-4"
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setNewCategoryName("");
                                    setIsNewCategoryModalOpen(false);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateCategory}
                                className="px-5 py-2 rounded-xl text-xs font-black uppercase text-white shadow-lg cursor-pointer"
                                style={{ backgroundColor: themeColor }}
                            >
                                Crear Categoría
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Renombrar Categoría */}
            {editingCategory && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-[#111322] border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
                        <h3 className="text-base font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Edit3 size={18} style={{ color: themeColor }} /> Renombrar Categoría
                        </h3>
                        <input
                            type="text"
                            value={editingCategory.newName}
                            onChange={(e) =>
                                setEditingCategory({
                                    ...editingCategory,
                                    newName: e.target.value,
                                })
                            }
                            onKeyDown={(e) => e.key === "Enter" && handleSaveEditCategory()}
                            autoFocus
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-orange-500 mb-4"
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingCategory(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEditCategory}
                                className="px-5 py-2 rounded-xl text-xs font-black uppercase text-white shadow-lg cursor-pointer"
                                style={{ backgroundColor: themeColor }}
                            >
                                Guardar Nombre
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Añadir Enlace de Video */}
            {videoModalProdId && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-[#111322] border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
                        <h3 className="text-base font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                            <VideoIcon size={18} className="text-purple-400" /> Añadir Video
                        </h3>
                        <p className="text-xs text-white/60 mb-4">
                            Pega el enlace de <strong>TikTok</strong>, <strong>Instagram Reels</strong> o <strong>YouTube Shorts / Video</strong>.
                        </p>
                        <input
                            type="url"
                            value={videoUrlInput}
                            onChange={(e) => setVideoUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddProductVideo(videoModalProdId, videoUrlInput)}
                            placeholder="https://www.tiktok.com/@... o https://instagram.com/reel/..."
                            autoFocus
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-white outline-none focus:border-purple-500 mb-4"
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setVideoUrlInput("");
                                    setVideoModalProdId(null);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddProductVideo(videoModalProdId, videoUrlInput)}
                                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-black uppercase text-white shadow-lg cursor-pointer"
                            >
                                Añadir Video
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* NIVEL 1: VISTA DE TODAS LAS CATEGORÍAS                             */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {!selectedCategory ? (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                        <div>
                            <span className="text-xs font-black uppercase tracking-wider text-navy flex items-center gap-2">
                                📁 Categorías del Catálogo ({validCategories.length})
                            </span>
                            <p className="text-[11px] text-gray-500">
                                Toca cualquier categoría para editar sus productos, fotos, videos y precios.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsNewCategoryModalOpen(true)}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
                            style={{ backgroundColor: themeColor }}
                        >
                            <Plus size={16} /> + Nueva Categoría
                        </button>
                    </div>

                    {categoriesData.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-gray-50">
                            <Package size={40} className="text-gray-300 mb-3" />
                            <h4 className="text-sm font-black text-navy uppercase mb-1">No hay categorías creadas</h4>
                            <p className="text-xs text-gray-500 mb-4 max-w-sm">
                                Organiza tu catálogo por categorías (ej. Entradas, Platos Fuertes, Bebidas, Servicios).
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsNewCategoryModalOpen(true)}
                                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-white shadow-lg cursor-pointer"
                                style={{ backgroundColor: themeColor }}
                            >
                                <Plus size={16} className="inline mr-1" /> Crear Primera Categoría
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoriesData.map((cat) => (
                                <div
                                    key={cat.name}
                                    className="group relative bg-white border border-gray-200 hover:border-orange-500/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
                                    onClick={() => setSelectedCategory(cat.name)}
                                >
                                    {/* Portada de la Categoría */}
                                    <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                                        {cat.image ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={cat.image}
                                                alt={cat.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-white/30">
                                                <Utensils size={28} className="opacity-40 mb-1" />
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                                                    Sin portada
                                                </span>
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        {/* Botón cambiar/subir foto de portada */}
                                        <div
                                            className="absolute top-2 right-2 flex items-center gap-1.5 z-10"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {categoryImages[cat.name] && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCategoryImage(cat.name)}
                                                    className="w-7 h-7 bg-red-500/90 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                                                    title="Quitar foto de portada personalizada"
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}
                                            <label
                                                className="w-7 h-7 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all border border-white/20"
                                                title="Cambiar foto de portada"
                                            >
                                                <Camera size={13} />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleUploadCategoryImage(cat.name, file);
                                                    }}
                                                />
                                            </label>
                                        </div>

                                        {/* Badge de cantidad */}
                                        <div className="absolute bottom-2 left-3 z-10 flex items-center gap-1.5">
                                            <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-wider">
                                                {cat.count} {cat.count === 1 ? "Producto" : "Productos"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info y Acciones */}
                                    <div className="p-3 flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-black text-sm text-navy uppercase truncate">
                                                {cat.name}
                                            </h4>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => setEditingCategory({ oldName: cat.name, newName: cat.name })}
                                                className="p-1.5 text-gray-400 hover:text-navy rounded-lg hover:bg-gray-100 transition-colors"
                                                title="Renombrar categoría"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCategory(cat.name, cat.count)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Eliminar categoría"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCategory(cat.name)}
                                                className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors ml-1"
                                                title="Entrar a editar productos"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* ═══════════════════════════════════════════════════════════════════ */
                /* NIVEL 2: VISTA DE PRODUCTOS DE LA CATEGORÍA SELECCIONADA           */
                /* ═══════════════════════════════════════════════════════════════════ */
                <div className="space-y-4">
                    {/* Barra de navegación de nivel */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory(null)}
                            className="flex items-center gap-2 text-xs font-black uppercase text-navy hover:text-orange-600 transition-colors cursor-pointer w-fit"
                        >
                            <ArrowLeft size={16} /> Volver a Categorías
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black uppercase text-orange-600 tracking-wider bg-orange-100 px-3 py-1 rounded-full">
                                📦 {selectedCategory} ({activeCategoryProducts.length})
                            </span>
                            <button
                                type="button"
                                onClick={handleAddProduct}
                                className="px-4 py-2 rounded-xl text-xs font-black uppercase text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                style={{ backgroundColor: themeColor }}
                            >
                                <Plus size={16} /> + Añadir Producto
                            </button>
                        </div>
                    </div>

                    {/* Lista de productos de la categoría */}
                    {activeCategoryProducts.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-white">
                            <Utensils size={36} className="text-gray-300 mb-3" />
                            <h4 className="text-sm font-black text-navy uppercase mb-1">
                                No hay productos en &ldquo;{selectedCategory}&rdquo;
                            </h4>
                            <p className="text-xs text-gray-500 mb-4 max-w-sm">
                                Añade los productos o servicios que pertenecen a esta categoría con sus fotos, precios y descripción.
                            </p>
                            <button
                                type="button"
                                onClick={handleAddProduct}
                                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-white shadow-lg cursor-pointer"
                                style={{ backgroundColor: themeColor }}
                            >
                                <Plus size={16} className="inline mr-1" /> Añadir Primer Producto
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeCategoryProducts.map((prod, idx) => {
                                const images = prod.images || (prod.image ? [prod.image] : []) || (prod.foto ? [prod.foto] : []);
                                const videos = prod.videos || (prod.video ? [prod.video] : []) || [];
                                const isUploading = uploadingId === prod.id;

                                return (
                                    <div
                                        key={prod.id || idx}
                                        className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 hover:border-gray-300 transition-all relative"
                                    >
                                        {/* Botón eliminar producto */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteProduct(prod.id)}
                                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                            title="Eliminar producto"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        {/* Fila 1: Título y Precio */}
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pr-8">
                                            <div className="sm:col-span-8">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                                                    Nombre del Producto / Plato
                                                </label>
                                                <input
                                                    type="text"
                                                    value={prod.name || prod.titulo || ""}
                                                    onChange={(e) => handleUpdateProductField(prod.id, "name", e.target.value)}
                                                    placeholder="Ej: Hamburguesa Doble Queso"
                                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-navy outline-none focus:border-orange-500 focus:bg-white transition-all"
                                                />
                                            </div>
                                            <div className="sm:col-span-4">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                                                    Precio
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={prod.price || prod.precio || ""}
                                                        onChange={(e) => handleUpdateProductField(prod.id, "price", e.target.value)}
                                                        placeholder="Ej: $8.50"
                                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-navy outline-none focus:border-orange-500 focus:bg-white transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fila 2: Descripción */}
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                                                Descripción / Ingredientes / Detalles
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={prod.description || prod.descripcion || ""}
                                                onChange={(e) => handleUpdateProductField(prod.id, "description", e.target.value)}
                                                placeholder="Detalla los ingredientes, porciones o características del producto..."
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium outline-none focus:border-orange-500 focus:bg-white transition-all resize-none"
                                            />
                                        </div>

                                        {/* Fila 3: Multimedia (Fotos y Videos con Badges X Visibles) */}
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                                                Galería Multimedia (Fotos y Videos)
                                            </label>

                                            <div className="flex flex-wrap items-center gap-2.5">
                                                {/* Miniaturas de Fotos */}
                                                {images.map((imgUrl, imgIdx) => (
                                                    <div
                                                        key={`img_${imgIdx}`}
                                                        className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-gray-200 shadow-sm shrink-0 group"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                                        {imgIdx === 0 && (
                                                            <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] font-black uppercase text-center py-0.5">
                                                                Principal
                                                            </span>
                                                        )}
                                                        {/* Badge X de eliminación visible */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveProductImage(prod.id, imgIdx)}
                                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                                                            title="Eliminar foto"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Miniaturas de Videos */}
                                                {videos.map((vidUrl, vidIdx) => {
                                                    const ytThumb = getYouTubeThumbnail(vidUrl);
                                                    return (
                                                        <div
                                                            key={`vid_${vidIdx}`}
                                                            className="relative w-16 h-16 rounded-xl overflow-hidden bg-purple-950 border border-purple-400/40 shadow-sm shrink-0 group flex items-center justify-center text-white"
                                                        >
                                                            {ytThumb ? (
                                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                                <img src={ytThumb} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="flex flex-col items-center">
                                                                    <Play size={16} className="text-purple-300" />
                                                                    <span className="text-[7px] font-bold text-purple-300 uppercase">Video</span>
                                                                </div>
                                                            )}
                                                            {/* Badge X de eliminación visible */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveProductVideo(prod.id, vidIdx)}
                                                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                                                                title="Eliminar video"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}

                                                {/* Botón + Foto */}
                                                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-500 bg-gray-50 hover:bg-orange-50/30 flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 transition-all cursor-pointer shrink-0">
                                                    <Camera size={16} />
                                                    <span className="text-[8px] font-black uppercase mt-1">+ Foto</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleUploadProductImage(prod.id, file, images.length === 0);
                                                        }}
                                                    />
                                                </label>

                                                {/* Botón + Video */}
                                                <button
                                                    type="button"
                                                    onClick={() => setVideoModalProdId(prod.id)}
                                                    className="w-16 h-16 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-100/50 flex flex-col items-center justify-center text-purple-600 transition-all cursor-pointer shrink-0"
                                                >
                                                    <VideoIcon size={16} />
                                                    <span className="text-[8px] font-black uppercase mt-1">+ Video</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
