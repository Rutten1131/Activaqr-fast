"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Flame,
    Calendar,
    Search,
    Store,
    MapPin,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    RefreshCw,
    ChevronRight,
    ChevronLeft,
    Crown,
    Layers,
    Heart
} from "lucide-react";
import Link from "next/link";
import { CATEGORIAS_FERIA } from "@/lib/feriaAgendaData";

interface ExpositorItem {
    id: number;
    slug: string;
    nombre_negocio: string;
    nombre_representante: string;
    numero_stand: string | null;
    categoria: string;
    origen: string | null;
    logo_url: string | null;
    portada_url?: string | null;
    slogan?: string | null;
    total_votos: number;
    total_votos_verificados: number;
    total_puntos: number;
}

export default function FeriaHubClient() {
    const [allExpositores, setAllExpositores] = useState<ExpositorItem[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    // Carousel 3D state for Top 5
    const [activeTopIndex, setActiveTopIndex] = useState(0);

    // Smart Header scroll autohide
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > 80) {
                if (currentScrollY > lastScrollY) {
                    setShowHeader(false); // scrolling down -> hide
                } else {
                    setShowHeader(true); // scrolling up -> show
                }
            } else {
                setShowHeader(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const fetchAllExpositores = async () => {
        try {
            const res = await fetch(`/api/feria/ranking?categoria=todos`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setAllExpositores(data.ranking || []);
            }
        } catch (e) {
            console.error("Error fetching expositores:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllExpositores();
        const interval = setInterval(fetchAllExpositores, 30000);
        return () => clearInterval(interval);
    }, []);

    // El Top 5 siempre es el ranking general de TODA la feria
    const top5 = useMemo(() => {
        return allExpositores.slice(0, 5);
    }, [allExpositores]);

    // Filtrado de negocios para la sección interactiva de categorías
    const filteredExpositores = useMemo(() => {
        let list = allExpositores;
        if (activeCategory && activeCategory !== "todos") {
            list = list.filter((e) => e.categoria?.toLowerCase() === activeCategory.toLowerCase());
        }
        if (!searchTerm.trim()) return list;
        const q = searchTerm.toLowerCase();
        return list.filter(
            (e) =>
                e.nombre_negocio.toLowerCase().includes(q) ||
                (e.numero_stand && e.numero_stand.toLowerCase().includes(q)) ||
                (e.origen && e.origen.toLowerCase().includes(q)) ||
                (e.slogan && e.slogan.toLowerCase().includes(q))
        );
    }, [allExpositores, activeCategory, searchTerm]);

    // Conteo real de negocios por categoría
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allExpositores.forEach((exp) => {
            const cat = exp.categoria?.toLowerCase() || "otros";
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [allExpositores]);

    const activeCatInfo = useMemo(() => {
        if (!activeCategory || activeCategory === "todos") return null;
        return CATEGORIAS_FERIA.find((c) => c.id === activeCategory);
    }, [activeCategory]);

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30 relative overflow-hidden font-sans pb-24">
            {/* ═══ HEADER NAVBAR OFICIAL CON SMART AUTOHIDE ═══ */}
            <nav className={`border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50 transition-transform duration-300 ${showHeader ? "translate-y-0" : "-translate-y-full"}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img
                            src="/images/logo_header.png"
                            alt="ActivaQR Logo"
                            className="h-7 w-auto object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <span className="hidden sm:inline-block h-4 w-px bg-white/20" />
                        <span className="hidden sm:inline-block text-xs font-black uppercase tracking-widest text-primary">
                            197ª Feria de Loja
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/feria-loja/agenda"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold transition-all border border-white/10"
                        >
                            <Calendar size={14} className="text-sky" /> Conciertos
                        </Link>
                        <Link
                            href="/feria"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary-dark text-white text-xs font-black transition-all shadow-lg hover:scale-105"
                            style={{ boxShadow: "0 4px 20px rgba(246,103,57,0.3)" }}
                        >
                            Inscribir Negocio
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═══ HERO BANNER CINEMATOGRÁFICO CON FOTO REAL (80% DE PANTALLA) ═══ */}
            <section className="relative min-h-[80vh] w-full flex items-center justify-center overflow-hidden pb-12 pt-16">
                {/* Real Feria de Loja Photo Background */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/feria-loja-aisle.jpg"
                        alt="197ª Feria de Loja"
                        className="w-full h-full object-cover object-center scale-105 filter brightness-[0.48]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/65 to-black/35" />
                    <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/70" />
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1] drop-shadow-2xl"
                    >
                        197ª Feria de Loja <br />
                        <span className="text-primary italic">Apoya a tu Negocio Favorito</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.5 }}
                        className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
                    >
                        <Link
                            href="/feria"
                            className="px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-sm transition-all shadow-2xl hover:scale-105"
                            style={{ boxShadow: "0 10px 30px rgba(246,103,57,0.4)" }}
                        >
                            Inscribir mi Negocio Gratis
                        </Link>
                        <Link
                            href="/feria-loja/agenda"
                            className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-sm transition-all flex items-center gap-2"
                        >
                            <Calendar size={16} className="text-sky" /> Ver Conciertos
                        </Link>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-20">

                {/* ═══════════════════════════════════════════════════════ */}
                {/* ═══ TOP 5 NEGOCIOS MÁS VOTADOS (CARRUSEL 3D PREMIUM) ═══ */}
                {/* ═══════════════════════════════════════════════════════ */}
                {top5.length > 0 && (
                    <div className="relative space-y-8">
                        {/* Glowing Background Lights from Home */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 -z-10">
                            <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
                            <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px]" />
                        </div>

                        <div className="text-center max-w-2xl mx-auto">
                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-3 border border-primary/20 shadow-sm">
                                <Trophy size={14} className="text-primary" />
                                <span>Ranking en Vivo</span>
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
                                Top 5 Negocios <span className="text-primary italic">Más Votados</span>
                            </h2>
                        </div>

                        {/* 3D CAROUSEL CONTAINER */}
                        <div className="relative h-[600px] sm:h-[640px] flex items-center justify-center overflow-hidden">
                            {/* Navigation Arrows */}
                            {top5.length > 1 && (
                                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-2 sm:px-6 z-50 pointer-events-none">
                                    <button
                                        onClick={() => setActiveTopIndex((prev) => (prev === 0 ? top5.length - 1 : prev - 1))}
                                        className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white pointer-events-auto transition-all hover:bg-primary hover:border-primary hover:scale-110 shadow-2xl"
                                        aria-label="Anterior"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={() => setActiveTopIndex((prev) => (prev === top5.length - 1 ? 0 : prev + 1))}
                                        className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white pointer-events-auto transition-all hover:bg-primary hover:border-primary hover:scale-110 shadow-2xl"
                                        aria-label="Siguiente"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            )}

                            <div className="relative w-full max-w-5xl flex items-center justify-center h-full">
                                <AnimatePresence mode="popLayout">
                                    {top5.map((business, index) => {
                                        let position = index - activeTopIndex;
                                        const half = top5.length / 2;
                                        if (position > half) {
                                            position -= top5.length;
                                        } else if (position < -half) {
                                            position += top5.length;
                                        }
                                        const isActive = index === activeTopIndex;
                                        const isVisible = Math.abs(position) <= 2;

                                        if (!isVisible) return null;

                                        const rankNumber = index + 1;
                                        const rankMedal =
                                            rankNumber === 1
                                                ? { badge: "🥇 1er Lugar • Líder", bg: "bg-amber-400 text-black", border: "border-amber-400/50 ring-amber-400/30" }
                                                : rankNumber === 2
                                                ? { badge: "🥈 2do Lugar", bg: "bg-slate-300 text-black", border: "border-slate-300/40 ring-slate-300/20" }
                                                : rankNumber === 3
                                                ? { badge: "🥉 3er Lugar", bg: "bg-amber-700 text-white", border: "border-amber-700/40 ring-amber-700/20" }
                                                : { badge: `#${rankNumber} Puesto`, bg: "bg-white/20 text-white", border: "border-white/20 ring-white/10" };

                                        const bgImg = business.portada_url || business.logo_url || "/images/Reingenierìa/v2_tarjetas_mano.webp";

                                        return (
                                            <motion.div
                                                key={business.id}
                                                initial={false}
                                                animate={{
                                                    x: `calc(-50% + ${position * 310}px)`,
                                                    scale: isActive ? 1.03 : Math.abs(position) === 1 ? 0.85 : 0.7,
                                                    zIndex: 30 - Math.abs(position) * 10,
                                                    opacity: isActive ? 1 : Math.abs(position) === 1 ? 0.45 : 0,
                                                    filter: isActive ? "blur(0px)" : Math.abs(position) === 1 ? "blur(3px)" : "blur(8px)",
                                                    left: "50%",
                                                    pointerEvents: isActive || Math.abs(position) === 1 ? "auto" : "none"
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 260,
                                                    damping: 25
                                                }}
                                                onClick={() => setActiveTopIndex(index)}
                                                className={`absolute cursor-pointer group w-[300px] sm:w-[330px] h-[520px] sm:h-[560px] rounded-[3.5rem] overflow-hidden border border-white/25 shadow-2xl transition-all duration-500 ${
                                                    isActive ? `ring-4 ${rankMedal.border}` : ""
                                                }`}
                                            >
                                                {/* Background Business Image */}
                                                <div className="absolute inset-0 z-0">
                                                    <img
                                                        src={bgImg}
                                                        alt={business.nombre_negocio}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-[0.45]"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-black/30" />
                                                </div>

                                                {/* Top Rank Badge */}
                                                <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                                                    <span className={`px-4 py-1.5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-1.5 ${rankMedal.bg}`}>
                                                        {rankMedal.badge}
                                                    </span>
                                                </div>

                                                {/* Avatar / Logo */}
                                                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 w-24 h-24 rounded-3xl bg-black/70 backdrop-blur-xl border border-white/20 p-2.5 flex items-center justify-center shadow-2xl overflow-hidden">
                                                    {business.logo_url ? (
                                                        <img src={business.logo_url} alt={business.nombre_negocio} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Store size={36} className="text-primary" />
                                                    )}
                                                </div>

                                                {/* Bottom Glass Card Content */}
                                                <div className="absolute bottom-0 left-0 w-full p-4 sm:p-5 z-10">
                                                    <div className="bg-black/80 backdrop-blur-2xl border border-white/15 p-5 rounded-[2.5rem] shadow-2xl space-y-3 text-center">
                                                        <div>
                                                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider mb-0.5">
                                                                <MapPin size={11} /> {business.numero_stand || business.origen || "Loja"}
                                                            </div>
                                                            <h3 className="font-black text-white text-lg sm:text-xl truncate drop-shadow-md">
                                                                {business.nombre_negocio}
                                                            </h3>
                                                            {business.slogan && (
                                                                <p className="text-white/60 text-xs italic truncate mt-0.5">
                                                                    "{business.slogan}"
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Votes Pill */}
                                                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-white font-black text-xs">
                                                            <Flame size={14} className="text-primary animate-pulse" />
                                                            <span>{business.total_votos} {business.total_votos === 1 ? "Voto" : "Votos"}</span>
                                                        </div>

                                                        {/* Action Button */}
                                                        <Link
                                                            href={`/feria-loja/${business.slug}`}
                                                            className="w-full py-3 px-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg hover:scale-105"
                                                            style={{ boxShadow: "0 8px 25px rgba(246,103,57,0.35)" }}
                                                        >
                                                            Ver Web del Negocio <ChevronRight size={15} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* ═══ SECCIÓN UNIFICADA IN-PLACE: CATEGORÍAS & NEGOCIOS ═══ */}
                {/* ═══════════════════════════════════════════════════════ */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {activeCategory === null ? (
                            /* ─── VISTA 1: GRID DE CATEGORÍAS (2 POR FILA) ─── */
                            <motion.div
                                key="categories-view"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                            Explora por Categoría
                                        </h2>
                                        <p className="text-white/60 text-xs sm:text-sm mt-1">
                                            Elige una categoría para descubrir los emprendimientos y especialidades de la feria
                                        </p>
                                    </div>

                                    {/* Botón para ver todos directo */}
                                    <button
                                        onClick={() => setActiveCategory("todos")}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all self-start sm:self-auto"
                                    >
                                        <Layers size={14} className="text-primary" /> Ver Todos los Negocios
                                    </button>
                                </div>

                                {/* Grid de Categorías (2 columnas fijas en móvil y escritorio) */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5">
                                    {CATEGORIAS_FERIA.map((cat, cIdx) => {
                                        const count = categoryCounts[cat.id] || 0;

                                        return (
                                            <motion.div
                                                key={cat.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: cIdx * 0.03 }}
                                                onClick={() => setActiveCategory(cat.id)}
                                                className="relative h-44 sm:h-60 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer group border border-white/10 hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 shadow-xl"
                                            >
                                                {/* Background Image */}
                                                <div className="absolute inset-0 z-0">
                                                    <img
                                                        src={cat.imagen_url}
                                                        alt={cat.nombre}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter brightness-[0.42] group-hover:brightness-[0.52]"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                                </div>

                                                {/* Content inside the card */}
                                                <div className="relative z-10 p-3.5 sm:p-5 h-full flex flex-col justify-between">
                                                    {/* Top Badge: "X negocios" */}
                                                    <div className="flex justify-start">
                                                        <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 text-amber-300 font-black text-[10px] sm:text-xs shadow-md">
                                                            {count > 0 ? `${count} ${count === 1 ? "negocio" : "negocios"}` : "Explorar"}
                                                        </span>
                                                    </div>

                                                    {/* Bottom Title & Action */}
                                                    <div>
                                                        <h3 className="text-sm sm:text-xl font-black text-white tracking-tight leading-snug mb-0.5 sm:mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                                            {cat.nombre}
                                                        </h3>
                                                        <span className="inline-flex items-center gap-1 text-amber-400 group-hover:text-primary text-[11px] sm:text-xs font-black transition-colors">
                                                            Ver negocios →
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            /* ─── VISTA 2: LISTADO DE NEGOCIOS DE ESA CATEGORÍA (IN-PLACE) ─── */
                            <motion.div
                                key="businesses-view"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    setActiveCategory(null);
                                                    setSearchTerm("");
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 shadow-sm"
                                            >
                                                <ArrowLeft size={14} className="text-primary" /> Volver a Categorías
                                            </button>

                                            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                                                <Store size={22} className="text-primary" />
                                                {activeCatInfo ? activeCatInfo.nombre : "Todos los Negocios"}
                                            </h2>
                                        </div>

                                        <p className="text-white/50 text-xs">
                                            Mostrando {filteredExpositores.length} negocios inscritos
                                        </p>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="relative w-full sm:w-72">
                                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Buscar negocio..."
                                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Grid de Negocios */}
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <RefreshCw size={32} className="animate-spin text-primary opacity-60" />
                                    </div>
                                ) : filteredExpositores.length === 0 ? (
                                    <div className="text-center py-16 px-4 rounded-3xl bg-white/[0.02] border border-white/5 max-w-md mx-auto">
                                        <Store size={36} className="text-white/20 mx-auto mb-3" />
                                        <p className="font-bold text-white mb-1">No se encontraron negocios</p>
                                        <p className="text-white/40 text-xs mb-4">Aún no hay negocios en esta categoría o búsqueda.</p>
                                        <button
                                            onClick={() => {
                                                setActiveCategory(null);
                                                setSearchTerm("");
                                            }}
                                            className="text-primary text-xs font-bold hover:underline"
                                        >
                                            ← Ver todas las categorías
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {filteredExpositores.map((exp, idx) => (
                                            <motion.div
                                                key={exp.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="rounded-3xl p-5 bg-white/[0.03] border border-white/10 hover:border-primary/40 transition-all group flex flex-col justify-between hover:scale-[1.01]"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-3.5 mb-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-primary/40 transition-colors">
                                                            {exp.logo_url ? (
                                                                <img src={exp.logo_url} alt={exp.nombre_negocio} className="w-full h-full object-contain" />
                                                            ) : (
                                                                <Store size={22} className="text-primary" />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1 text-[11px] font-bold text-primary mb-0.5 uppercase tracking-wider">
                                                                <MapPin size={11} /> {exp.numero_stand || exp.origen || "Loja"}
                                                            </div>
                                                            <h4 className="font-black text-white text-base truncate group-hover:text-primary transition-colors">
                                                                {exp.nombre_negocio}
                                                            </h4>
                                                            <p className="text-white/40 text-xs truncate">{exp.nombre_representante}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5 mb-4">
                                                        <span className="text-xs text-white/50 font-semibold">Votos</span>
                                                        <span className="text-xs font-black text-white flex items-center gap-1">
                                                            <Flame size={12} className="text-primary" /> {exp.total_votos}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Link
                                                    href={`/feria-loja/${exp.slug}`}
                                                    className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-primary text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-white/10 group-hover:border-primary/40 shadow-sm"
                                                >
                                                    Ver Web del Negocio <ChevronRight size={14} />
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ═══ BANNER CONCIERTOS COMPACTO ═══ */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#001549]/90 via-black to-[#0a0a0a] border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                        <div className="w-12 h-12 rounded-2xl bg-sky/20 border border-sky/30 flex items-center justify-center text-sky shrink-0">
                            <Calendar size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-black text-white">Agenda de Conciertos & Artistas</h3>
                            <p className="text-white/60 text-xs sm:text-sm">Fechas, escenarios y cartelera oficial por días de la 197ª Feria de Loja.</p>
                        </div>
                    </div>
                    <Link
                        href="/feria-loja/agenda"
                        className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white text-navy font-black text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shrink-0"
                    >
                        Ver Cronograma <ArrowRight size={14} />
                    </Link>
                </div>

                {/* ═══ CTA INSCRIBIR NEGOCIO ═══ */}
                <div
                    className="rounded-3xl p-8 md:p-10 text-center relative overflow-hidden border border-primary/30"
                    style={{ background: "linear-gradient(135deg, rgba(246,103,57,0.15) 0%, rgba(0,21,73,0.4) 100%)" }}
                >
                    <Sparkles size={32} className="text-primary mx-auto mb-3" />
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                        ¿Tienes un Negocio en la 197ª Feria de Loja?
                    </h3>
                    <p className="text-white/70 text-xs sm:text-sm max-w-md mx-auto mb-6 font-medium">
                        Crea tu página oficial en 1 minuto, descarga tu código QR para tu mostrador y recibe votos de los visitantes.
                    </p>
                    <Link
                        href="/feria"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-black text-sm px-8 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105"
                        style={{ boxShadow: "0 10px 40px rgba(246,103,57,0.4)" }}
                    >
                        Inscribir mi Negocio Gratis <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </main>
    );
}
