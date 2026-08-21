"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Plus,
    Trash2,
    Edit2,
    ChevronRight,
    ArrowLeft,
    Camera,
    Video,
    DollarSign,
    Save,
    CheckCircle2,
    Lock,
    Loader2,
    Utensils,
    Copy,
    Sparkles,
    Image as ImageIcon,
    Palette,
    Globe,
    Settings,
    Play,
    Star,
    ExternalLink,
    Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { safeParse } from "@/lib/jsonUtils";
import { MenuLanguage } from "@/lib/menuI18n";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface MenuProduct {
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
    images?: string[];
    imagenes?: string[];
    video?: string;
    video_url?: string;
    videos?: string[];
}

export interface VisualMenuEditorProps {
    isOpen: boolean;
    onClose: () => void;
    slug: string;
    onSaved?: () => void;
}

// ─── Color Themes ─────────────────────────────────────────────────────────────
const THEME_PRESETS = [
    { id: "midnight", name: "Midnight Navy", color: "#001549", border: "#1e3a8a" },
    { id: "carbon", name: "Carbon Black", color: "#0D0D0D", border: "#27272a" },
    { id: "wine", name: "Steakhouse Wine", color: "#180A0F", border: "#831843" },
    { id: "coffee", name: "Warm Coffee", color: "#14100C", border: "#78350f" },
    { id: "emerald", name: "Emerald Fresh", color: "#091510", border: "#065f46" },
    { id: "white", name: "Clean White", color: "#FFFFFF", border: "#e5e7eb" },
];

const LANGUAGE_OPTIONS: { id: MenuLanguage; name: string; flag: string }[] = [
    { id: "es", name: "Español", flag: "🇪🇸" },
    { id: "en", name: "English", flag: "🇺🇸" },
    { id: "fr", name: "Français", flag: "🇫🇷" },
    { id: "it", name: "Italiano", flag: "🇮🇹" },
    { id: "pt", name: "Português", flag: "🇵🇹" },
    { id: "de", name: "Deutsch", flag: "🇩🇪" },
];

export default function VisualMenuEditor({
    isOpen,
    onClose,
    slug,
    onSaved,
}: VisualMenuEditorProps) {
    // ─── Authentication state ─────────────────────────────────────────────────
    const [step, setStep] = useState<"auth" | "editor" | "saved">("auth");
    const [code, setCode] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState("");

    // ─── Menu Data State ──────────────────────────────────────────────────────
    const [fullProfile, setFullProfile] = useState<any>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
    const [products, setProducts] = useState<MenuProduct[]>([]);

    // ─── Appearance & Language Settings ───────────────────────────────────────
    const [menuBgColor, setMenuBgColor] = useState<string>("#001549");
    const [customHexInput, setCustomHexInput] = useState<string>("#001549");
    const [menuLanguage, setMenuLanguage] = useState<MenuLanguage>("es");
    const [showReviews, setShowReviews] = useState<boolean>(true);
    const [googleReviewUrl, setGoogleReviewUrl] = useState<string>("");
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // ─── Navigation State ─────────────────────────────────────────────────────
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    // ─── Modals State ─────────────────────────────────────────────────────────
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
    const [videoModalProdId, setVideoModalProdId] = useState<string | null>(null);
    const [videoUrlInput, setVideoUrlInput] = useState("");

    // ─── Reset or Check Local Storage on Open ─────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        const savedCode = localStorage.getItem(`edit_code_${slug}`);
        if (savedCode) {
            setCode(savedCode);
            handleValidateCode(savedCode);
        } else {
            setStep("auth");
            setCode("");
            setAuthError("");
            setSelectedCategory(null);
        }
    }, [isOpen, slug]);

    // ─── Validate Code ────────────────────────────────────────────────────────
    const handleValidateCode = async (codeToValidate: string) => {
        if (!codeToValidate.trim()) {
            setAuthError("Ingresa tu clave de acceso");
            return;
        }

        setAuthLoading(true);
        setAuthError("");

        try {
            const res = await fetch("/api/edit/validate-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: codeToValidate.trim().toUpperCase(), slug }),
            });

            const result = await res.json();

            if (res.ok && (result.success || result.valid || result.data)) {
                localStorage.setItem(`edit_code_${slug}`, codeToValidate.trim().toUpperCase());
                setFullProfile(result.data);

                // Cargar overrides de tema, idioma y reseñas
                const overrides = safeParse<any>(result.data?.json_override, {});
                if (overrides.menu_bg_color) {
                    setMenuBgColor(overrides.menu_bg_color);
                    setCustomHexInput(overrides.menu_bg_color);
                }
                if (overrides.menu_language) setMenuLanguage(overrides.menu_language);
                if (overrides.category_images) setCategoryImages(overrides.category_images);
                setShowReviews(overrides.show_reviews !== false);
                setGoogleReviewUrl(overrides.google_review_url || result.data?.google_business || "");

                // Cargar categorías y productos
                const rawJson = result.data?.catalogo_json;
                let parsed = { categories: [] as string[], products: [] as MenuProduct[] };

                if (rawJson) {
                    const parsedData = typeof rawJson === "string" ? safeParse(rawJson, {}) : rawJson;
                    if (Array.isArray(parsedData)) {
                        parsed.products = parsedData;
                    } else if (parsedData) {
                        parsed.categories = parsedData.categories || [];
                        parsed.products = parsedData.products || [];
                    }
                }

                // Fallback: Si catalogo_json está vacío pero hay menu_digital
                if (parsed.products.length === 0 && result.data?.menu_digital) {
                    const rawMenu = typeof result.data.menu_digital === "string" ? safeParse(result.data.menu_digital, []) : result.data.menu_digital;
                    if (Array.isArray(rawMenu)) {
                        rawMenu.forEach((cat: any) => {
                            const catName = cat.name || "General";
                            if (!parsed.categories.includes(catName)) parsed.categories.push(catName);
                            if (Array.isArray(cat.items)) {
                                cat.items.forEach((it: any, idx: number) => {
                                    parsed.products.push({
                                        id: String(it.id || `dish-${Date.now()}-${idx}`),
                                        name: it.name || "",
                                        titulo: it.name || "",
                                        price: it.price || "",
                                        precio: it.price || "",
                                        description: it.desc || it.description || "",
                                        descripcion: it.desc || it.description || "",
                                        category: catName,
                                        categoria: catName,
                                        image: it.image || it.imagen || "",
                                        images: it.image ? [it.image] : [],
                                    });
                                });
                            }
                        });
                    }
                }

                // Normalizar categorías
                const existingCats = new Set(parsed.categories.filter((c) => c && c.trim()));
                parsed.products.forEach((p) => {
                    const c = (p.category || p.categoria || "").trim();
                    if (c && !["Nueva Categoría", "Sin Categoría", "Todas", "General"].includes(c)) {
                        existingCats.add(c);
                    }
                });

                setCategories(Array.from(existingCats));
                setProducts(parsed.products);
                setStep("editor");
            } else {
                setAuthError(result.error || "Clave incorrecta para este menú");
            }
        } catch (err) {
            setAuthError("Error de conexión. Intenta nuevamente.");
        } finally {
            setAuthLoading(false);
        }
    };

    // ─── Helper to get Representative Image for Category ─────────────────────
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
        }
        return "";
    };

    // ─── Enriched Categories ──────────────────────────────────────────────────
    const categoriesData = useMemo(() => {
        return categories.map((cat) => {
            const catItems = products.filter(
                (p) => (p.category || p.categoria || "").toLowerCase() === cat.toLowerCase()
            );
            return {
                name: cat,
                count: catItems.length,
                image: getCategoryRepresentativeImage(cat),
                hasCustomCover: !!categoryImages[cat],
            };
        });
    }, [categories, products, categoryImages]);

    // ─── Products of Selected Category ────────────────────────────────────────
    const filteredProducts = useMemo(() => {
        if (!selectedCategory) return [];
        return products.filter(
            (p) => (p.category || p.categoria || "").toLowerCase() === selectedCategory.toLowerCase()
        );
    }, [products, selectedCategory]);

    // ─── Category CRUD Actions ────────────────────────────────────────────────
    const handleAddCategory = () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
            alert("Ya existe una categoría con este nombre");
            return;
        }

        setCategories((prev) => [...prev, trimmed]);
        setNewCategoryName("");
        setIsNewCategoryModalOpen(false);
        setSelectedCategory(trimmed);
    };

    const handleRenameCategory = () => {
        if (!editingCategory) return;
        const { oldName, newName } = editingCategory;
        const trimmed = newName.trim();
        if (!trimmed || trimmed.toLowerCase() === oldName.toLowerCase()) {
            setEditingCategory(null);
            return;
        }

        // Actualizar lista de categorías
        setCategories((prev) => prev.map((c) => (c === oldName ? trimmed : c)));

        // Actualizar imagen asociada si existía
        if (categoryImages[oldName]) {
            const updatedImgs = { ...categoryImages, [trimmed]: categoryImages[oldName] };
            delete updatedImgs[oldName];
            setCategoryImages(updatedImgs);
        }

        // Actualizar categoría en todos los productos
        setProducts((prev) =>
            prev.map((p) => {
                const currentCat = p.category || p.categoria || "";
                if (currentCat.toLowerCase() === oldName.toLowerCase()) {
                    return { ...p, category: trimmed, categoria: trimmed };
                }
                return p;
            })
        );

        if (selectedCategory === oldName) {
            setSelectedCategory(trimmed);
        }

        setEditingCategory(null);
    };

    const handleDeleteCategory = (catName: string) => {
        const count = products.filter(
            (p) => (p.category || p.categoria || "").toLowerCase() === catName.toLowerCase()
        ).length;

        let msg = `¿Eliminar la categoría "${catName}"?`;
        if (count > 0) {
            msg += `\n\n⚠️ ADVERTENCIA: También se eliminarán los ${count} plato(s) contenidos en ella.`;
        }

        if (!confirm(msg)) return;

        setCategories((prev) => prev.filter((c) => c !== catName));
        setProducts((prev) =>
            prev.filter(
                (p) => (p.category || p.categoria || "").toLowerCase() !== catName.toLowerCase()
            )
        );

        if (categoryImages[catName]) {
            const updated = { ...categoryImages };
            delete updated[catName];
            setCategoryImages(updated);
        }

        if (selectedCategory === catName) {
            setSelectedCategory(null);
        }
    };

    const handleRemoveCategoryCover = (catName: string) => {
        if (!confirm(`¿Quitar la foto de portada personalizada de "${catName}"?`)) return;
        const updated = { ...categoryImages };
        delete updated[catName];
        setCategoryImages(updated);
    };

    // ─── Upload Category Cover Image ──────────────────────────────────────────
    const handleCategoryCoverUpload = async (catName: string, file: File) => {
        setUploadingId(`cat_${catName}`);
        try {
            let fileToUpload = file;
            try {
                const { compressImage } = await import("@/lib/imageCompress");
                fileToUpload = await compressImage(file);
            } catch (e) {
                console.warn("Compression fallback:", e);
            }

            const fd = new FormData();
            fd.append("file", fileToUpload);
            if (slug) fd.append("slug", slug);

            const res = await fetch("/api/upload", { method: "POST", body: fd });
            if (res.ok) {
                const { url } = await res.json();
                setCategoryImages((prev) => ({ ...prev, [catName]: url }));
            } else {
                alert("Error al subir la imagen de la categoría.");
            }
        } catch (err) {
            alert("Error de conexión al subir imagen.");
        } finally {
            setUploadingId(null);
        }
    };

    // ─── Product CRUD Actions ─────────────────────────────────────────────────
    const handleAddProduct = () => {
        if (!selectedCategory) return;

        const newProd: MenuProduct = {
            id: `prod_${Date.now()}`,
            name: "Nuevo Plato",
            price: "",
            description: "",
            category: selectedCategory,
            categoria: selectedCategory,
            image: "",
            images: [],
            videos: [],
        };

        setProducts((prev) => [newProd, ...prev]);
    };

    const handleUpdateProduct = (id: string, updates: Partial<MenuProduct>) => {
        setProducts((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    return { ...p, ...updates };
                }
                return p;
            })
        );
    };

    const handleDeleteProduct = (id: string) => {
        if (!confirm("¿Eliminar este plato del menú?")) return;
        setProducts((prev) => prev.filter((p) => p.id !== id));
    };

    const handleDuplicateProduct = (prod: MenuProduct) => {
        const duplicated: MenuProduct = {
            ...prod,
            id: `prod_${Date.now()}`,
            name: `${prod.name || prod.titulo || "Plato"} (Copia)`,
            titulo: `${prod.name || prod.titulo || "Plato"} (Copia)`,
        };
        setProducts((prev) => [duplicated, ...prev]);
    };

    // ─── Upload / Remove Product Media ───────────────────────────────────────
    const handleAddProductImage = async (prodId: string, file: File) => {
        setUploadingId(prodId);
        try {
            let fileToUpload = file;
            try {
                const { compressImage } = await import("@/lib/imageCompress");
                fileToUpload = await compressImage(file);
            } catch (e) {
                console.warn("Compression fallback:", e);
            }

            const fd = new FormData();
            fd.append("file", fileToUpload);
            if (slug) fd.append("slug", slug);

            const res = await fetch("/api/upload", { method: "POST", body: fd });
            if (res.ok) {
                const { url } = await res.json();
                setProducts((prev) =>
                    prev.map((p) => {
                        if (p.id === prodId) {
                            const currentImgs = p.images || (p.image ? [p.image] : []) || [];
                            const updated = [...currentImgs, url];
                            return {
                                ...p,
                                image: updated[0] || url,
                                foto: updated[0] || url,
                                images: updated,
                            };
                        }
                        return p;
                    })
                );
            } else {
                alert("Error al subir la foto del plato.");
            }
        } catch (err) {
            alert("Error de conexión al subir imagen.");
        } finally {
            setUploadingId(null);
        }
    };

    const handleRemoveProductImage = (prodId: string, imgIndex: number) => {
        setProducts((prev) =>
            prev.map((p) => {
                if (p.id === prodId) {
                    const currentImgs = p.images || (p.image ? [p.image] : []) || [];
                    const updated = currentImgs.filter((_, idx) => idx !== imgIndex);
                    return {
                        ...p,
                        image: updated[0] || "",
                        foto: updated[0] || "",
                        images: updated,
                    };
                }
                return p;
            })
        );
    };

    const handleRemoveProductVideo = (prodId: string, vidIndex: number) => {
        setProducts((prev) =>
            prev.map((p) => {
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
            })
        );
    };

    // ─── Save Changes to Database ─────────────────────────────────────────────
    const handleSaveMenu = async () => {
        setIsSaving(true);
        try {
            const catalogoPayload = {
                categories: categories.filter((c) => c && c.trim()),
                products: products.map((p) => ({
                    ...p,
                    name: p.name || p.titulo || "Plato",
                    titulo: p.name || p.titulo || "Plato",
                    price: p.price || p.precio || "",
                    precio: p.price || p.precio || "",
                    description: p.description || p.descripcion || "",
                    descripcion: p.description || p.descripcion || "",
                    category: p.category || p.categoria || "",
                    categoria: p.category || p.categoria || "",
                    image: (p.images && p.images[0]) || p.image || "",
                    images: p.images || (p.image ? [p.image] : []),
                    videos: p.videos || (p.video ? [p.video] : []),
                })),
            };

            const menuDigitalStructure = categories.map((catName) => {
                const catProducts = products.filter(
                    (p) => (p.category || p.categoria || "").toLowerCase() === catName.toLowerCase()
                );
                return {
                    name: catName,
                    items: catProducts.map((p) => ({
                        id: p.id,
                        name: p.name || p.titulo || "Plato",
                        price: p.price || p.precio || "",
                        desc: p.description || p.descripcion || "",
                        image: (p.images && p.images[0]) || p.image || "",
                    })),
                };
            });

            const existingOverrides = safeParse<any>(fullProfile?.json_override, {});
            const updatedOverrides = {
                ...existingOverrides,
                menu_bg_color: menuBgColor,
                menu_language: menuLanguage,
                category_images: categoryImages,
                show_reviews: showReviews,
                google_review_url: googleReviewUrl.trim(),
            };

            const payloadData = {
                ...(fullProfile || {}),
                catalogo_json: catalogoPayload,
                menu_digital: JSON.stringify(menuDigitalStructure),
                json_override: updatedOverrides,
            };

            const res = await fetch("/api/edit/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: code.trim().toUpperCase(),
                    data: payloadData,
                    slug,
                }),
            });

            if (res.ok) {
                setStep("saved");
                if (onSaved) onSaved();
                setTimeout(() => {
                    if (typeof window !== "undefined") {
                        window.location.reload();
                    }
                }, 1000);
            } else {
                const err = await res.json();
                alert(`Error al guardar: ${err.error || "Intenta nuevamente"}`);
            }
        } catch (e) {
            alert("Error de conexión al guardar los cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // ─── RENDER MODAL ─────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                className="relative w-full max-w-5xl h-[94vh] max-h-[920px] bg-[#0A0D1A] border border-white/10 rounded-3xl md:rounded-[36px] shadow-2xl shadow-black/95 flex flex-col overflow-hidden text-white font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── HEADER SUPERIOR DEL EDITOR ── */}
                <header className="px-4 sm:px-6 py-3.5 bg-[#0e1224] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-lg shadow-orange-500/10">
                            <Utensils size={20} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-tight truncate leading-tight">
                                Editor de Menú Digital
                            </h2>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest truncate">
                                {selectedCategory ? `📁 ${selectedCategory}` : `Categorías & Platos`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {step === "editor" && (
                            <>
                                {/* Botón Ajustes, Tema & Reseñas */}
                                <button
                                    onClick={() => setIsSettingsModalOpen(true)}
                                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-black uppercase"
                                    title="Personalizar Tema, Idioma y Reseñas"
                                >
                                    <Settings size={16} className="text-amber-400" />
                                    <span className="hidden md:inline">Ajustes & Reseñas</span>
                                </button>

                                {/* Botón Guardar Menú */}
                                <button
                                    onClick={handleSaveMenu}
                                    disabled={isSaving}
                                    className="bg-[#FF6B2B] hover:bg-[#ff550c] text-white font-black text-xs uppercase tracking-wider px-4 sm:px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/25 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    <span className="hidden sm:inline">{isSaving ? "Guardando..." : "Guardar Menú"}</span>
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                            title="Cerrar Editor"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* ── CONTENIDO PRINCIPAL ── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative">
                    {/* ── PASO 1: AUTENTICACIÓN POR CLAVE ── */}
                    {step === "auth" && (
                        <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center px-4 py-8">
                            <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-6 shadow-2xl shadow-orange-500/10">
                                <Lock size={36} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
                                Acceso al Editor
                            </h3>
                            <p className="text-sm text-white/60 mb-6">
                                Ingresa tu PIN / Código de edición para gestionar los platos y categorías de tu menú.
                            </p>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleValidateCode(code);
                                }}
                                className="w-full space-y-4"
                            >
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="EJ: RYA-2026-ADM-USXZP4"
                                    className="w-full bg-white/5 border border-white/15 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl p-4 text-center text-base sm:text-lg font-mono font-black uppercase tracking-wider text-white outline-none transition-all placeholder:text-white/20"
                                    autoFocus
                                />

                                {authError && (
                                    <p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                        {authError}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={authLoading || !code.trim()}
                                    className="w-full bg-[#FF6B2B] hover:bg-[#ff550c] text-white font-black text-sm uppercase tracking-wider py-4 rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {authLoading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Validando Clave...
                                        </>
                                    ) : (
                                        <>
                                            Desbloquear Editor
                                            <ChevronRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ── NOTIFICACIÓN DE GUARDADO EXITOSO ── */}
                    {step === "saved" && (
                        <div className="absolute inset-0 z-50 bg-[#0A0D1A]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 mb-4 shadow-2xl shadow-green-500/20">
                                <CheckCircle2 size={44} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                                ¡Menú Actualizado!
                            </h3>
                            <p className="text-sm text-white/60">
                                Todos los cambios, fotos, videos y configuraciones se guardaron correctamente.
                            </p>
                        </div>
                    )}

                    {/* ── PASO 2: VISTA 1 — EXPLORADOR DE CATEGORÍAS ── */}
                    {step === "editor" && !selectedCategory && (
                        <div className="space-y-6">
                            {/* Banner Superior de Categorías */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                                        📁 Categorías del Menú
                                    </h3>
                                    <p className="text-xs text-white/60 font-medium mt-1">
                                        Cambia la foto de portada, añade nuevas categorías o entra a gestionar sus platos.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setIsNewCategoryModalOpen(true)}
                                    className="bg-orange-500/20 border border-orange-500/40 hover:bg-orange-500 text-orange-400 hover:text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer shrink-0"
                                >
                                    <Plus size={16} />
                                    Nueva Categoría
                                </button>
                            </div>

                            {/* Cuadrícula de Categorías */}
                            {categoriesData.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                                    {categoriesData.map((cat) => (
                                        <div
                                            key={cat.name}
                                            className="group relative aspect-[4/5] sm:aspect-[4/3] rounded-2xl md:rounded-[28px] overflow-hidden border border-white/15 hover:border-orange-500/80 shadow-xl bg-[#141729] transition-all duration-300 flex flex-col justify-end p-4 sm:p-5"
                                        >
                                            {/* Imagen de fondo representativa */}
                                            {cat.image ? (
                                                <img
                                                    src={cat.image}
                                                    alt={cat.name}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#1b1f3b] to-[#0c0e1a] flex flex-col items-center justify-center text-white/20">
                                                    <Utensils size={40} className="mb-2 opacity-50" />
                                                </div>
                                            )}

                                            {/* Dark Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />

                                            {/* Badge Superior: Contador de Platos */}
                                            <div className="absolute top-3 left-3 z-20">
                                                <span className="px-3 py-1 bg-black/75 backdrop-blur-md border border-amber-400/50 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full shadow-lg">
                                                    {cat.count} {cat.count === 1 ? "PLATO" : "PLATOS"}
                                                </span>
                                            </div>

                                            {/* Botones de Acción en la Tarjeta: Subir Portada + Quitar Portada + Renombrar + Eliminar */}
                                            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                                                {/* Subir Foto de Portada */}
                                                <label
                                                    className="p-2 rounded-xl bg-black/80 hover:bg-orange-500 border border-white/20 text-white transition-all shadow-lg cursor-pointer flex items-center justify-center"
                                                    title="Cambiar foto de portada de categoría"
                                                >
                                                    {uploadingId === `cat_${cat.name}` ? (
                                                        <Loader2 size={13} className="animate-spin text-orange-400" />
                                                    ) : (
                                                        <Camera size={13} />
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        disabled={uploadingId === `cat_${cat.name}`}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleCategoryCoverUpload(cat.name, file);
                                                        }}
                                                    />
                                                </label>

                                                {/* Quitar Portada personalizada si existe */}
                                                {cat.hasCustomCover && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveCategoryCover(cat.name);
                                                        }}
                                                        className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 border border-red-400/30 text-white transition-all shadow-lg cursor-pointer"
                                                        title="Quitar foto de portada personalizada"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                )}

                                                {/* Renombrar */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingCategory({ oldName: cat.name, newName: cat.name });
                                                    }}
                                                    className="p-2 rounded-xl bg-black/80 hover:bg-orange-500 border border-white/20 text-white transition-all shadow-lg cursor-pointer"
                                                    title="Renombrar categoría"
                                                >
                                                    <Edit2 size={13} />
                                                </button>

                                                {/* Eliminar */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCategory(cat.name);
                                                    }}
                                                    className="p-2 rounded-xl bg-black/80 hover:bg-red-500 border border-white/20 text-white transition-all shadow-lg cursor-pointer"
                                                    title="Eliminar categoría"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>

                                            {/* Info & Botón para entrar */}
                                            <div className="relative z-20 space-y-2">
                                                <h4 className="text-white font-black text-sm sm:text-base md:text-lg uppercase tracking-tight leading-tight line-clamp-2">
                                                    {cat.name}
                                                </h4>
                                                <button
                                                    onClick={() => setSelectedCategory(cat.name)}
                                                    className="w-full bg-white/10 hover:bg-[#FF6B2B] text-white border border-white/20 hover:border-transparent py-2 px-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                                                >
                                                    Gestionar Platos
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 px-4 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                                    <Utensils size={40} className="mx-auto text-white/20 mb-3" />
                                    <h4 className="text-lg font-black uppercase text-white/80 mb-1">
                                        No hay categorías creadas
                                    </h4>
                                    <p className="text-xs text-white/50 max-w-sm mx-auto mb-5">
                                        Crea tu primera categoría (ej: Carnes, Hamburguesas, Bebidas) para empezar a añadir platos.
                                    </p>
                                    <button
                                        onClick={() => setIsNewCategoryModalOpen(true)}
                                        className="bg-[#FF6B2B] hover:bg-[#ff550c] text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-full shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                                    >
                                        + Crear Primera Categoría
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PASO 2: VISTA 2 — GESTIÓN DE PLATOS POR CATEGORÍA ── */}
                    {step === "editor" && selectedCategory && (
                        <div className="space-y-6">
                            {/* Cabecera de la Categoría Seleccionada */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-500/15 via-white/5 to-white/5 border border-orange-500/30 rounded-3xl p-5 sm:p-6">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg active:scale-95 cursor-pointer shrink-0"
                                        title="Volver a Categorías"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 rounded-md">
                                                Categoría
                                            </span>
                                            <span className="text-xs text-white/50 font-bold">
                                                {filteredProducts.length}{" "}
                                                {filteredProducts.length === 1 ? "plato" : "platos"}
                                            </span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                                            {selectedCategory}
                                        </h3>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddProduct}
                                    className="bg-[#FF6B2B] hover:bg-[#ff550c] text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
                                >
                                    <Plus size={18} />
                                    Añadir Plato
                                </button>
                            </div>

                            {/* Lista de Platos de esta Categoría */}
                            {filteredProducts.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredProducts.map((prod, idx) => {
                                        const prodImages = prod.images || (prod.image ? [prod.image] : []) || [];
                                        const mainImage = prodImages[0] || "";
                                        const prodVideos = prod.videos || (prod.video ? [prod.video] : []) || [];

                                        return (
                                            <motion.div
                                                key={prod.id || idx}
                                                layout
                                                className="bg-[#111424] border border-white/10 hover:border-orange-500/40 rounded-3xl p-4 sm:p-5 shadow-xl transition-all space-y-4"
                                            >
                                                {/* Fila Principal: Galería Multimedia Unificada + Nombre + Precio + Acciones */}
                                                <div className="flex flex-col md:flex-row gap-4 md:items-start">
                                                    {/* ── GALERÍA MULTIMEDIA UNIFICADA CON BOTÓN '+' Y BOTONES DE ELIMINAR VISIBLES ── */}
                                                    <div className="flex flex-col gap-2 shrink-0">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                                                            Fotos & Videos
                                                        </span>

                                                        {/* Fila de Miniaturas + Botón '+' */}
                                                        <div className="flex flex-wrap items-center gap-2.5">
                                                            {/* Foto Principal */}
                                                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-black/40 border border-white/20 shrink-0 group/main">
                                                                {mainImage ? (
                                                                    <>
                                                                        <img
                                                                            src={mainImage}
                                                                            alt={prod.name || "Foto"}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        {/* Botón X siempre visible para quitar foto principal */}
                                                                        <button
                                                                            onClick={() => handleRemoveProductImage(prod.id, 0)}
                                                                            className="absolute top-1 right-1 z-30 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg border border-white/30 cursor-pointer"
                                                                            title="Eliminar esta foto"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/30 p-1 text-center">
                                                                        <Camera size={20} className="mb-0.5" />
                                                                        <span className="text-[7px] font-black uppercase">Sin foto</span>
                                                                    </div>
                                                                )}
                                                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/main:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[8px] font-black uppercase tracking-wider text-center p-1 z-20">
                                                                    {uploadingId === prod.id ? (
                                                                        <Loader2 size={16} className="animate-spin text-orange-400" />
                                                                    ) : (
                                                                        <>
                                                                            <Camera size={14} className="mb-0.5" />
                                                                            Cambiar
                                                                        </>
                                                                    )}
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        disabled={uploadingId === prod.id}
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) handleAddProductImage(prod.id, file);
                                                                        }}
                                                                    />
                                                                </label>
                                                            </div>

                                                            {/* Fotos Secundarias (con botón X de eliminar siempre visible) */}
                                                            {prodImages.slice(1).map((imgUrl, imgIdx) => (
                                                                <div
                                                                    key={imgIdx}
                                                                    className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/30 border border-white/15 shrink-0"
                                                                >
                                                                    <img src={imgUrl} className="w-full h-full object-cover" />
                                                                    {/* Botón X siempre visible para quitar foto secundaria */}
                                                                    <button
                                                                        onClick={() => handleRemoveProductImage(prod.id, imgIdx + 1)}
                                                                        className="absolute top-0.5 right-0.5 z-30 w-4 h-4 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg border border-white/30 cursor-pointer"
                                                                        title="Quitar foto"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* Miniaturas de Video Vinculado (con botón X siempre visible) */}
                                                            {prodVideos.map((vidUrl, vidIdx) => (
                                                                <div
                                                                    key={vidIdx}
                                                                    className="relative w-14 h-14 rounded-xl overflow-hidden bg-purple-950/60 border border-purple-500/40 shrink-0 flex flex-col items-center justify-center text-purple-300"
                                                                    title={vidUrl}
                                                                >
                                                                    <Play size={16} className="fill-current text-purple-400" />
                                                                    <span className="text-[7px] font-black uppercase mt-0.5">Video</span>
                                                                    {/* Botón X siempre visible para quitar video */}
                                                                    <button
                                                                        onClick={() => handleRemoveProductVideo(prod.id, vidIdx)}
                                                                        className="absolute top-0.5 right-0.5 z-30 w-4 h-4 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg border border-white/30 cursor-pointer"
                                                                        title="Quitar video"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* Botón '+' para Subir Foto Extra o Vincular Video */}
                                                            <div className="flex items-center gap-1.5">
                                                                {/* + Subir Foto */}
                                                                <label
                                                                    className="w-14 h-14 rounded-xl border border-dashed border-white/25 hover:border-orange-500/80 hover:bg-orange-500/10 flex flex-col items-center justify-center text-white/50 hover:text-orange-400 transition-all cursor-pointer shrink-0"
                                                                    title="Añadir más fotos a este plato"
                                                                >
                                                                    <Plus size={16} />
                                                                    <span className="text-[7px] font-black uppercase mt-0.5">Foto</span>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        disabled={uploadingId === prod.id}
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) handleAddProductImage(prod.id, file);
                                                                        }}
                                                                    />
                                                                </label>

                                                                {/* + Vincular Video */}
                                                                <button
                                                                    onClick={() => {
                                                                        setVideoModalProdId(prod.id);
                                                                        setVideoUrlInput((prod.videos && prod.videos[0]) || prod.video || "");
                                                                    }}
                                                                    className="w-14 h-14 rounded-xl border border-dashed border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 flex flex-col items-center justify-center text-purple-400/60 hover:text-purple-300 transition-all cursor-pointer shrink-0"
                                                                    title="Vincular video de TikTok, Instagram o YouTube"
                                                                >
                                                                    <Video size={16} />
                                                                    <span className="text-[7px] font-black uppercase mt-0.5">+Video</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ── CAMPOS DE TEXTO: NOMBRE, PRECIO, DESCRIPCIÓN ── */}
                                                    <div className="flex-1 space-y-3 min-w-0">
                                                        <div className="flex flex-col sm:flex-row gap-3">
                                                            {/* Título del Plato */}
                                                            <div className="flex-1">
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 block">
                                                                    Nombre del Plato
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={prod.name || prod.titulo || ""}
                                                                    onChange={(e) =>
                                                                        handleUpdateProduct(prod.id, {
                                                                            name: e.target.value,
                                                                            titulo: e.target.value,
                                                                        })
                                                                    }
                                                                    placeholder="Ej: Parrillada Mixta Especial"
                                                                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl px-3.5 py-2.5 text-sm font-black text-white outline-none transition-all"
                                                                />
                                                            </div>

                                                            {/* Precio */}
                                                            <div className="w-full sm:w-36">
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 block">
                                                                    Precio ($)
                                                                </label>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400 font-bold text-sm">
                                                                        $
                                                                    </span>
                                                                    <input
                                                                        type="text"
                                                                        value={prod.price || prod.precio || ""}
                                                                        onChange={(e) =>
                                                                            handleUpdateProduct(prod.id, {
                                                                                price: e.target.value,
                                                                                precio: e.target.value,
                                                                            })
                                                                        }
                                                                        placeholder="12.50"
                                                                        className="w-full bg-white/5 border border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl pl-7 pr-3 py-2.5 text-sm font-black text-white outline-none transition-all"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Descripción */}
                                                        <div>
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 block">
                                                                Descripción / Ingredientes
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                value={prod.description || prod.descripcion || ""}
                                                                onChange={(e) =>
                                                                    handleUpdateProduct(prod.id, {
                                                                        description: e.target.value,
                                                                        descripcion: e.target.value,
                                                                    })
                                                                }
                                                                placeholder="Carne asada al carbón acompañada de arroz, menestra, papas fritas y ensalada fresca."
                                                                className="w-full bg-white/5 border border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl p-3 text-xs text-white/80 outline-none transition-all resize-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Botones de Acción */}
                                                    <div className="flex sm:flex-col gap-2 shrink-0 justify-end">
                                                        <button
                                                            onClick={() => handleDuplicateProduct(prod)}
                                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
                                                            title="Duplicar plato"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(prod.id)}
                                                            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white transition-all cursor-pointer"
                                                            title="Eliminar plato"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Fila Inferior: Reasignar Categoría */}
                                                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                            Mover a:
                                                        </span>
                                                        <select
                                                            value={prod.category || prod.categoria || selectedCategory}
                                                            onChange={(e) =>
                                                                handleUpdateProduct(prod.id, {
                                                                    category: e.target.value,
                                                                    categoria: e.target.value,
                                                                })
                                                            }
                                                            className="bg-white/5 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white outline-none focus:border-orange-500 cursor-pointer"
                                                        >
                                                            {categories.map((c) => (
                                                                <option key={c} value={c} className="bg-[#0e1224] text-white">
                                                                    {c}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 px-4 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                                    <Utensils size={36} className="mx-auto text-white/20 mb-3" />
                                    <h4 className="text-base font-black uppercase text-white/80 mb-1">
                                        No hay platos en "{selectedCategory}"
                                    </h4>
                                    <p className="text-xs text-white/50 max-w-sm mx-auto mb-4">
                                        Añade los primeros platos, precios e imágenes a esta categoría.
                                    </p>
                                    <button
                                        onClick={handleAddProduct}
                                        className="bg-[#FF6B2B] hover:bg-[#ff550c] text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                                    >
                                        + Añadir Primer Plato
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── MODAL: AJUSTES DE TEMA, IDIOMA & RESEÑAS ── */}
                <AnimatePresence>
                    {isSettingsModalOpen && (
                        <div className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#12162b] border border-white/15 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <h4 className="font-black text-base uppercase tracking-tight text-white flex items-center gap-2">
                                        <Settings size={18} className="text-amber-400" />
                                        Ajustes del Menú
                                    </h4>
                                    <button
                                        onClick={() => setIsSettingsModalOpen(false)}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* 1. Sección de Reseñas y Calificación de Estrellas */}
                                <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
                                            <Star size={15} className="text-amber-400 fill-current" />
                                            Módulo de Reseñas / Calificación
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowReviews(!showReviews)}
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer",
                                                showReviews ? "bg-green-500" : "bg-white/20"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out",
                                                    showReviews ? "translate-x-6" : "translate-x-0"
                                                )}
                                            />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-white/50 leading-relaxed">
                                        Muestra el bloque interactivo "¿CÓMO FUE TU EXPERIENCIA?". Las calificaciones de 5 estrellas invitan a compartir la opinión en Google Maps.
                                    </p>

                                    {showReviews && (
                                        <div className="pt-2 space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block">
                                                Enlace de Google Maps / Google Business
                                            </label>
                                            <input
                                                type="url"
                                                value={googleReviewUrl}
                                                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                                                placeholder="https://g.page/r/tu-negocio/review"
                                                className="w-full bg-black/40 border border-white/15 focus:border-amber-400 rounded-xl p-2.5 text-xs text-white outline-none font-medium"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* 2. Selector de Idioma */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                                        <Globe size={14} className="text-blue-400" />
                                        Idioma del Menú
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {LANGUAGE_OPTIONS.map((lang) => (
                                            <button
                                                key={lang.id}
                                                type="button"
                                                onClick={() => setMenuLanguage(lang.id)}
                                                className={cn(
                                                    "p-3 rounded-2xl border text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer",
                                                    menuLanguage === lang.id
                                                        ? "bg-orange-500/20 border-orange-500 text-white shadow-lg shadow-orange-500/10"
                                                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                                                )}
                                            >
                                                <span>{lang.flag}</span>
                                                <span>{lang.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. Selector de Color / Tema de Fondo */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                                        <Palette size={14} className="text-purple-400" />
                                        Color de Fondo del Menú
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        {THEME_PRESETS.map((preset) => (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => setMenuBgColor(preset.color)}
                                                className={cn(
                                                    "p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer",
                                                    menuBgColor.toLowerCase() === preset.color.toLowerCase()
                                                        ? "border-orange-500 ring-2 ring-orange-500/40 shadow-lg"
                                                        : "border-white/10 bg-white/5 hover:border-white/20"
                                                )}
                                            >
                                                <span
                                                    className="w-5 h-5 rounded-full border border-white/30 shrink-0 shadow-inner"
                                                    style={{ backgroundColor: preset.color }}
                                                />
                                                <span className="text-[11px] font-black uppercase tracking-wider text-white truncate">
                                                    {preset.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Selector Personalizado Hex */}
                                    <div className="pt-2 flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase text-white/40">Color Personalizado:</span>
                                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex-1">
                                            <input
                                                type="color"
                                                value={menuBgColor.startsWith('#') && menuBgColor.length === 7 ? menuBgColor : '#001549'}
                                                onChange={(e) => {
                                                    setMenuBgColor(e.target.value);
                                                    setCustomHexInput(e.target.value);
                                                }}
                                                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                                            />
                                            <input
                                                type="text"
                                                value={customHexInput}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCustomHexInput(val);
                                                    let clean = val.trim();
                                                    if (!clean.startsWith('#') && clean.length > 0) {
                                                        clean = `#${clean}`;
                                                    }
                                                    setMenuBgColor(clean);
                                                }}
                                                placeholder="#001549"
                                                className="w-full bg-transparent text-xs font-mono font-black uppercase text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Descargar Opiniones / Calificaciones de Clientes */}
                                <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h5 className="text-[11px] font-black uppercase text-white flex items-center gap-1.5">
                                                <Download size={14} className="text-amber-400" />
                                                Descargar Opiniones
                                            </h5>
                                            <p className="text-[10px] text-white/50 leading-relaxed mt-0.5">
                                                Exporta las opiniones y sugerencias en un archivo Excel (CSV).
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!fullProfile?.id) {
                                                    alert("No se pudo obtener el identificador del menú.");
                                                    return;
                                                }
                                                const exportUrl = `/api/vcard/feedback?registro_id=${fullProfile.id}&code=${encodeURIComponent(code)}&format=csv`;
                                                window.open(exportUrl, '_blank');
                                            }}
                                            className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                                        >
                                            <Download size={14} />
                                            Descargar CSV
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex justify-end">
                                    <button
                                        onClick={() => setIsSettingsModalOpen(false)}
                                        className="bg-[#FF6B2B] hover:bg-[#ff550c] text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                                    >
                                        Aplicar Ajustes
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── MODAL: CREAR NUEVA CATEGORÍA ── */}
                <AnimatePresence>
                    {isNewCategoryModalOpen && (
                        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#12162b] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
                            >
                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <h4 className="font-black text-base uppercase tracking-tight text-white flex items-center gap-2">
                                        <Plus size={18} className="text-orange-400" />
                                        Nueva Categoría
                                    </h4>
                                    <button
                                        onClick={() => setIsNewCategoryModalOpen(false)}
                                        className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block">
                                        Nombre de la Categoría
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Ej: Carnes y Parrillas, Bebidas, Postres..."
                                        className="w-full bg-white/5 border border-white/15 focus:border-orange-500 rounded-xl p-3 text-sm font-bold text-white outline-none"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setIsNewCategoryModalOpen(false)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddCategory}
                                        disabled={!newCategoryName.trim()}
                                        className="flex-1 bg-[#FF6B2B] hover:bg-[#ff550c] text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        Crear y Entrar
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── MODAL: RENOMBRAR CATEGORÍA ── */}
                <AnimatePresence>
                    {editingCategory && (
                        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#12162b] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
                            >
                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <h4 className="font-black text-base uppercase tracking-tight text-white flex items-center gap-2">
                                        <Edit2 size={16} className="text-orange-400" />
                                        Renombrar Categoría
                                    </h4>
                                    <button
                                        onClick={() => setEditingCategory(null)}
                                        className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block">
                                        Nuevo Nombre
                                    </label>
                                    <input
                                        type="text"
                                        value={editingCategory.newName}
                                        onChange={(e) =>
                                            setEditingCategory({ ...editingCategory, newName: e.target.value })
                                        }
                                        className="w-full bg-white/5 border border-white/15 focus:border-orange-500 rounded-xl p-3 text-sm font-bold text-white outline-none"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setEditingCategory(null)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleRenameCategory}
                                        disabled={!editingCategory.newName.trim()}
                                        className="flex-1 bg-[#FF6B2B] hover:bg-[#ff550c] text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        Guardar Nombre
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── MODAL: AGREGAR / EDITAR LINK DE VIDEO ── */}
                <AnimatePresence>
                    {videoModalProdId && (
                        <div className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#12162b] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
                            >
                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <h4 className="font-black text-base uppercase tracking-tight text-white flex items-center gap-2">
                                        <Video size={18} className="text-purple-400" />
                                        Video del Plato (TikTok / Reels / YouTube)
                                    </h4>
                                    <button
                                        onClick={() => setVideoModalProdId(null)}
                                        className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block">
                                        Enlace del Video
                                    </label>
                                    <input
                                        type="url"
                                        value={videoUrlInput}
                                        onChange={(e) => setVideoUrlInput(e.target.value)}
                                        placeholder="https://www.tiktok.com/@tu_restaurante/video/..."
                                        className="w-full bg-white/5 border border-white/15 focus:border-purple-500 rounded-xl p-3 text-xs text-white outline-none font-medium"
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-white/40 leading-relaxed">
                                        Pega el enlace directo de tu video. Se reproducirá con experiencia interactiva en la ficha del plato.
                                    </p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => {
                                            handleUpdateProduct(videoModalProdId, { videos: [], video: "" });
                                            setVideoModalProdId(null);
                                        }}
                                        className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-black text-xs uppercase px-3 py-3 rounded-xl transition-all cursor-pointer"
                                        title="Eliminar Video"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setVideoModalProdId(null)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            const trimmed = videoUrlInput.trim();
                                            handleUpdateProduct(videoModalProdId, {
                                                videos: trimmed ? [trimmed] : [],
                                                video: trimmed,
                                            });
                                            setVideoModalProdId(null);
                                        }}
                                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
                                    >
                                        Guardar Video
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
