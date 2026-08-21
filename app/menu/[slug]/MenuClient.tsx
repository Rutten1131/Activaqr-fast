"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import CatalogGallery from "@/components/card/CatalogGallery";
import VisualMenuEditor from "@/components/card/VisualMenuEditor";
import MenuReviewSection from "@/components/card/MenuReviewSection";
import { safeParse } from "@/lib/jsonUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isPlaceholderUrl = (url: string | null | undefined): boolean => {
    if (!url) return true;
    if (url.startsWith("data:image")) return false;
    const PLACEHOLDERS = [
        "photo.com", "example.com", "placeholder.com", "placehold.co",
        "placeholder.supabase.co", "supabase.co/storage",
        "_default.png", "hero_desktop_default", "hero_mobile_default",
    ];
    return PLACEHOLDERS.some((p) => url.toLowerCase().includes(p));
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MenuClient() {
    const { slug } = useParams();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditActive, setIsEditActive] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [urlCategory, setUrlCategory] = useState<string>("");

    // ─── Fetch data function ──────────────────────────────────────────────────
    const fetchMenuData = useCallback(async () => {
        if (!slug) return;
        try {
            const res = await fetch(`/api/profile/${slug}?_t=${Date.now()}`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (err) {
            console.error("[MenuClient] Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    // ─── Edit query param ─────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("edit") === "true") {
                setIsEditModalOpen(true);
                setIsEditActive(true);
            }
        }
    }, []);

    // ─── Initial Load ─────────────────────────────────────────────────────────
    useEffect(() => {
        fetchMenuData();
    }, [fetchMenuData]);

    // ─── URL category tracking (?cat=) ────────────────────────────────────────
    useEffect(() => {
        if (!data) return;
        const checkUrl = () => {
            const params = new URLSearchParams(window.location.search);
            const cat = params.get("cat") || "";
            setUrlCategory(cat);
            if (cat) {
                setTimeout(() => {
                    const el = document.getElementById("catalogo");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 400);
            }
        };
        const originalPushState = history.pushState;
        history.pushState = function (...args) {
            originalPushState.apply(this, args);
            window.dispatchEvent(new Event("urlchange"));
        };
        checkUrl();
        window.addEventListener("urlchange", checkUrl);
        window.addEventListener("popstate", checkUrl);
        return () => {
            window.removeEventListener("urlchange", checkUrl);
            window.removeEventListener("popstate", checkUrl);
            history.pushState = originalPushState;
        };
    }, [data]);

    // ─── Loading state ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-4 border-gray-100 border-t-orange-500 rounded-full mb-4"
                />
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    Cargando Menú...
                </p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
                    Menú no encontrado
                </p>
            </div>
        );
    }

    // ─── Derived data ─────────────────────────────────────────────────────────
    const overrides = safeParse<any>(data?.json_override, {});
    const menuBgColor = overrides.menu_bg_color || "#001549";
    const menuLanguage = overrides.menu_language || "es";
    const categoryImages = overrides.category_images || {};

    const displayName =
        data.tipo_perfil === "negocio"
            ? data.nombre_negocio || data.nombre
            : data.nombre;
    const logoUrl = !isPlaceholderUrl(data.foto_url) ? data.foto_url : null;

    const hasCatalog = data?.catalogo_json;
    const catalogData = hasCatalog
        ? safeParse(data.catalogo_json, { products: [], categories: [] })
        : null;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            className="relative min-h-screen transition-colors duration-500"
            style={{ backgroundColor: menuBgColor }}
        >
            {/* ── Editor mode banner ── */}
            {isEditActive && (
                <motion.div
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    className="fixed top-0 left-0 right-0 z-[10000] bg-orange-600 text-white p-3 shadow-2xl flex items-center justify-between border-b border-white/10"
                >
                    <div className="flex items-center gap-3 ml-2 md:ml-4">
                        <div className="bg-white/20 p-2 rounded-lg hidden sm:block">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-80 mb-0.5">
                                Modo Editor Activo
                            </p>
                            <h4 className="text-[11px] sm:text-sm font-black uppercase tracking-tight leading-none">
                                Editor de Menú
                            </h4>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mr-2 md:mr-4">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-white text-orange-600 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                        >
                            EDITAR AHORA
                        </button>
                        <button
                            onClick={() => setIsEditActive(false)}
                            className="p-2 text-white/50 hover:text-white transition-colors"
                            title="Ocultar banner"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </motion.div>
            )}

            {/* ── Menú principal ── */}
            <main id="catalogo" className={`max-w-5xl mx-auto px-4 pt-1 pb-10 ${isEditActive ? "mt-[52px]" : ""}`}>
                {catalogData ? (
                    <CatalogGallery
                        data={catalogData}
                        whatsapp={data.whatsapp}
                        onLightboxToggle={setIsLightboxOpen}
                        templateId={data.template_id}
                        initialCategory={urlCategory}
                        sectionTitle="MENÚ"
                        lang={menuLanguage}
                        categoryImages={categoryImages}
                        isRestaurant={true}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                            Menú en construcción
                        </h2>
                        <p className="text-sm text-white/50 max-w-xs">
                            Pronto encontrarás aquí los platillos y bebidas con precios actualizados.
                        </p>
                        {data.whatsapp && (
                            <a
                                href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 bg-[#25D366] text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#20bb5a] transition-all shadow-lg"
                            >
                                Consultar por WhatsApp
                            </a>
                        )}
                    </div>
                )}
            </main>

            {/* ── Sección de Reseñas (solo si está activada en el editor) ── */}
            {overrides.show_reviews !== false && data?.id && (
                <MenuReviewSection
                    registroId={data.id}
                    googleReviewUrl={overrides.google_review_url || data?.google_business || "#"}
                    accentColor="#f66739"
                    bgColor={menuBgColor}
                    lang={menuLanguage}
                />
            )}

            {/* ── Editor Visual Dinámico (activado solo mediante enlace directo ?edit=true) ── */}
            <VisualMenuEditor
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setIsEditActive(false);
                    if (typeof window !== "undefined") {
                        const url = new URL(window.location.href);
                        if (url.searchParams.has("edit")) {
                            url.searchParams.delete("edit");
                            window.history.replaceState({}, "", url.pathname + url.search);
                        }
                    }
                }}
                slug={slug as string}
                onSaved={fetchMenuData}
            />
        </div>
    );
}
