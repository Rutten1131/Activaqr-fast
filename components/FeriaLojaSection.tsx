"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Medal,
    Flame,
    ArrowRight,
    Store,
    RefreshCw,
    Heart,
    ChevronLeft,
    ChevronRight,
    Sparkles
} from "lucide-react";
import Link from "next/link";

const FERIA_DEADLINE = new Date("2026-09-20T23:59:59-05:00");

interface Participante {
    id: number;
    slug: string;
    nombre_negocio: string;
    logo_url: string | null;
    portada_url?: string | null;
    total_votos: number;
}

export default function FeriaLojaSection() {
    const [top5, setTop5] = useState<Participante[]>([]);
    const [participantes, setParticipantes] = useState<Participante[]>([]);
    const [stats, setStats] = useState({ total_participantes: 0, total_votos: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const fetchRanking = async () => {
        try {
            const res = await fetch("/api/feria/ranking", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setTop5(data.top5 || []);
                    setParticipantes(data.participantes || []);
                    setStats(data.stats || { total_participantes: 0, total_votos: 0 });
                }
            }
        } catch (err) {
            console.error("Error fetching ranking:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (new Date() > FERIA_DEADLINE) return;
        fetchRanking();
        const interval = setInterval(fetchRanking, 30000);
        return () => clearInterval(interval);
    }, []);

    const displayList = top5.length > 0 ? top5 : participantes;

    // Auto-play del carrusel 3D cada 3.5 segundos
    useEffect(() => {
        if (isPaused || displayList.length <= 1) return;
        const timer = setInterval(() => {
            setActiveIndex((curr) => (curr + 1) % displayList.length);
        }, 3500);
        return () => clearInterval(timer);
    }, [isPaused, displayList.length]);

    if (new Date() > FERIA_DEADLINE) return null;

    return (
        <section
            id="competencia-feria"
            className="relative py-20 md:py-28 overflow-hidden section-dark"
            style={{
                background: "linear-gradient(180deg, #0a0a0a 0%, #0d121d 50%, #0a0a0a 100%)",
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Ambient Lighting & Grid */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#001549]/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-10 md:mb-14">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-tight mb-4"
                    >
                        197.ª Feria de Loja • <span className="text-primary italic">Competencia Oficial</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-white/70 text-base md:text-lg max-w-2xl mx-auto font-medium"
                    >
                        Vota aquí por el negocio o artesano que quieras apoyar. ¡Cada voto cuenta en tiempo real!
                    </motion.p>
                </div>

                {/* Main Content Area */}
                {isLoading && displayList.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw size={36} className="animate-spin text-primary" />
                    </div>
                ) : displayList.length === 0 ? (
                    /* Fallback sin registros */
                    <div className="text-center py-16 px-6 rounded-3xl bg-white/[0.03] border border-white/10 max-w-xl mx-auto mb-16">
                        <Trophy size={56} className="text-primary mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-white mb-2">¡Comienza la Competencia!</h3>
                        <p className="text-white/60 text-sm mb-8">
                            Aún no hay negocios registrados. Sé el primer stand en inscribirse y ganar votos del público.
                        </p>
                        <Link
                            href="/feria"
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-black px-8 py-4 rounded-2xl text-base shadow-xl transition-all hover:scale-105"
                        >
                            Inscribir mi Stand Ahora <ArrowRight size={18} />
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* ═══ 3D ROTATING CAROUSEL SLIDER (ESTILO "EL SISTEMA QUE SE PAGA SOLO") ═══ */}
                        <div className="relative h-[620px] sm:h-[660px] flex items-center justify-center overflow-hidden mb-12">
                            {/* Navigation Buttons */}
                            {displayList.length > 1 && (
                                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-2 sm:px-4 z-50 pointer-events-none">
                                    <button
                                        onClick={() => {
                                            setActiveIndex((prev) => (prev === 0 ? displayList.length - 1 : prev - 1));
                                            setIsPaused(true);
                                        }}
                                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white pointer-events-auto transition-all hover:bg-primary hover:border-primary shadow-xl"
                                        aria-label="Anterior"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveIndex((prev) => (prev === displayList.length - 1 ? 0 : prev + 1));
                                            setIsPaused(true);
                                        }}
                                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white pointer-events-auto transition-all hover:bg-primary hover:border-primary shadow-xl"
                                        aria-label="Siguiente"
                                    >
                                        <ChevronRight size={22} />
                                    </button>
                                </div>
                            )}

                            {/* Cards Track */}
                            <div className="relative w-full max-w-5xl flex items-center justify-center h-full">
                                <AnimatePresence mode="popLayout">
                                    {displayList.map((item, index) => {
                                        // Circular position mapping
                                        let position = index - activeIndex;
                                        const half = displayList.length / 2;
                                        if (position > half) {
                                            position -= displayList.length;
                                        } else if (position < -half) {
                                            position += displayList.length;
                                        }
                                        const isActive = index === activeIndex;
                                        const isVisible = Math.abs(position) <= 2;

                                        if (!isVisible) return null;

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={false}
                                                animate={{
                                                    x: `calc(-50% + ${position * 320}px)`,
                                                    scale: isActive ? 1.05 : Math.abs(position) === 1 ? 0.85 : 0.7,
                                                    zIndex: 30 - Math.abs(position) * 10,
                                                    opacity: isActive ? 1 : Math.abs(position) === 1 ? 0.45 : 0,
                                                    filter: isActive ? "blur(0px)" : Math.abs(position) === 1 ? "blur(3px)" : "blur(8px)",
                                                    left: "50%",
                                                    pointerEvents: isActive || Math.abs(position) === 1 ? "auto" : "none",
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 260,
                                                    damping: 25,
                                                }}
                                                onClick={() => {
                                                    setActiveIndex(index);
                                                    setIsPaused(true);
                                                }}
                                                className={`absolute cursor-pointer group w-[300px] sm:w-[325px] h-[550px] sm:h-[590px] rounded-[3.5rem] overflow-hidden border shadow-2xl transition-all duration-700 ${
                                                    isActive
                                                        ? "border-primary/60 ring-4 ring-primary/30"
                                                        : "border-white/20"
                                                }`}
                                            >
                                                {/* Background Cover Photo - Logo del Negocio */}
                                                <div className="absolute inset-0 z-0 bg-[#070E20] overflow-hidden flex items-center justify-center">
                                                    {item.logo_url ? (
                                                        <>
                                                            {/* Logo difuminado de fondo para ambientación */}
                                                            <img
                                                                src={item.logo_url}
                                                                alt={item.nombre_negocio}
                                                                className="absolute inset-0 w-full h-full object-cover scale-150 filter blur-2xl opacity-25"
                                                            />
                                                            {/* Logo principal nítido y centrado */}
                                                            <div className="w-44 h-44 sm:w-52 sm:h-52 p-4 rounded-3xl bg-white/[0.06] border border-white/10 backdrop-blur-md flex items-center justify-center -translate-y-14 shadow-2xl transition-transform duration-700 group-hover:scale-110">
                                                                <img
                                                                    src={item.logo_url}
                                                                    alt={item.nombre_negocio}
                                                                    className="w-full h-full object-contain drop-shadow-2xl"
                                                                />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black text-6xl -translate-y-14 shadow-2xl">
                                                            {item.nombre_negocio.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    {/* Degradado inferior hacia el contenido */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050B1C] via-[#050B1C]/50 to-transparent" />
                                                </div>

                                                {/* Top Position Tag */}
                                                <div className="absolute top-4 inset-x-0 flex justify-center z-20">
                                                    {index === 0 ? (
                                                        <span className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5">
                                                            <Trophy size={13} /> 🥇 1er Lugar • Líder
                                                        </span>
                                                    ) : index === 1 ? (
                                                        <span className="bg-slate-300/20 backdrop-blur-md border border-slate-300/30 text-slate-200 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5">
                                                            🥈 2do Lugar
                                                        </span>
                                                    ) : index === 2 ? (
                                                        <span className="bg-amber-700/30 backdrop-blur-md border border-amber-700/40 text-amber-300 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5">
                                                            🥉 3er Lugar
                                                        </span>
                                                    ) : (
                                                        <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-2xl">
                                                            Puesto #{index + 1}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Bottom Floating Glass Card */}
                                                <div className="absolute bottom-0 left-0 w-full p-4 sm:p-5 z-10">
                                                    <div className="bg-[#050B1C]/85 backdrop-blur-[30px] border border-white/20 p-5 sm:p-6 rounded-[2.8rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
                                                        {/* Title */}
                                                        <h3 className="font-black text-white text-lg sm:text-xl text-center leading-snug line-clamp-1 mb-2">
                                                            {item.nombre_negocio}
                                                        </h3>

                                                        {/* Votes Pill */}
                                                        <div className="flex justify-center mb-4">
                                                            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary font-black text-xs uppercase tracking-wider">
                                                                <Flame size={14} className="animate-pulse" />
                                                                <span>{item.total_votos} {item.total_votos === 1 ? 'Voto' : 'Votos'}</span>
                                                            </div>
                                                        </div>

                                                        {/* CTA Button */}
                                                        <Link
                                                            href={`/feria-loja/${item.slug}`}
                                                            className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-center transition-all shadow-xl bg-primary hover:bg-[#ff7b52] text-white flex items-center justify-center gap-2 hover:scale-[1.02]"
                                                            style={{ boxShadow: "0 10px 25px rgba(246,103,57,0.35)" }}
                                                        >
                                                            <Heart size={15} className="fill-white" />
                                                            <span>Ver Ficha & Votar</span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </>
                )}

                {/* Muro de Logos de Todos los Participantes -> Enlace directo a la página de cada negocio */}
                {participantes.length > 0 && (
                    <div className="mb-14 rounded-3xl p-6 md:p-8 bg-white/[0.02] border border-white/5">
                        <div className="text-center mb-6">
                            <h4 className="text-sm md:text-base font-black uppercase tracking-widest text-white/90">
                                🎪 Todos los Negocios y Stands Participantes
                            </h4>
                            <p className="text-white/50 text-xs mt-1">Haz clic en cualquier stand para ver su ficha y apoyarlo</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
                            {participantes.map((part) => (
                                <Link
                                    key={part.id}
                                    href={`/feria-loja/${part.slug}`}
                                    title={`Ver ficha y votar por ${part.nombre_negocio} (${part.total_votos} votos)`}
                                    className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-primary/15 border border-white/10 hover:border-primary/50 transition-all flex items-center gap-2.5 group shadow-sm hover:scale-105"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                                        {part.logo_url ? (
                                            <img src={part.logo_url} alt={part.nombre_negocio} className="w-full h-full object-contain" />
                                        ) : (
                                            <Store size={14} className="text-primary" />
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-white group-hover:text-white transition-colors max-w-[160px] truncate">
                                        {part.nombre_negocio}
                                    </span>
                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        {part.total_votos}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
