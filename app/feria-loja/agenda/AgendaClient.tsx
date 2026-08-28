"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    ArrowLeft,
    Sparkles,
    Flame,
    Music,
    Utensils,
    Palette,
    ArrowRight,
    Share2,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { FERIA_AGENDA_DATA, FeriaEvento } from "@/lib/feriaAgendaData";

export default function AgendaClient() {
    const [selectedCategory, setSelectedCategory] = useState<string>("todos");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const filteredEvents = useMemo(() => {
        if (selectedCategory === "todos") return FERIA_AGENDA_DATA;
        return FERIA_AGENDA_DATA.filter((e) => e.categoria === selectedCategory);
    }, [selectedCategory]);

    const handleShare = (event: FeriaEvento) => {
        if (navigator.share) {
            navigator.share({
                title: `${event.titulo} - 197ª Feria de Loja`,
                text: `${event.titulo} el ${event.fecha} a las ${event.hora} en ${event.lugar}. ¡Míralo en ActivaQR!`,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            setCopiedId(event.id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30 relative overflow-hidden font-sans">
            {/* Header de navegación */}
            <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/feria-loja" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold transition-colors">
                        <ArrowLeft size={18} className="text-primary" /> Volver a la Votación & Stands
                    </Link>
                    <Link
                        href="/feria"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary-dark text-white text-xs font-black transition-all"
                    >
                        Inscribir Stand
                    </Link>
                </div>
            </nav>

            {/* Glowing Aura */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#001549]/30 rounded-full blur-[140px] pointer-events-none -z-10" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-sky/10 border border-sky/30 px-4 py-2 rounded-full mb-5"
                    >
                        <Calendar size={15} className="text-sky" />
                        <span className="text-xs font-black uppercase tracking-widest text-sky">Cartelera Oficial 2025</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight mb-4"
                    >
                        Agenda & Conciertos <br />
                        <span className="text-primary italic">197ª Feria de Loja</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/70 text-base md:text-lg font-medium leading-relaxed mb-8"
                    >
                        Revisa los días, horarios y artistas de cada evento. Mientras disfrutas la feria, apoya a los stands locales votando en la plataforma.
                    </motion.p>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => setSelectedCategory("todos")}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                selectedCategory === "todos" ? "bg-primary text-white shadow-md" : "bg-white/5 text-white/60 hover:text-white"
                            }`}
                        >
                            📅 Todos los Eventos
                        </button>
                        <button
                            onClick={() => setSelectedCategory("concierto")}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                selectedCategory === "concierto" ? "bg-primary text-white shadow-md" : "bg-white/5 text-white/60 hover:text-white"
                            }`}
                        >
                            🎤 Conciertos & Música
                        </button>
                        <button
                            onClick={() => setSelectedCategory("gastronomia")}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                selectedCategory === "gastronomia" ? "bg-primary text-white shadow-md" : "bg-white/5 text-white/60 hover:text-white"
                            }`}
                        >
                            ☕ Café & Gastronomía
                        </button>
                        <button
                            onClick={() => setSelectedCategory("cultural")}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                selectedCategory === "cultural" ? "bg-primary text-white shadow-md" : "bg-white/5 text-white/60 hover:text-white"
                            }`}
                        >
                            🎨 Artesanía & Cultura
                        </button>
                    </div>
                </div>

                {/* Timeline / Events List */}
                <div className="space-y-6 mb-16">
                    {filteredEvents.map((evt, idx) => (
                        <motion.div
                            key={evt.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all ${
                                evt.destacado
                                    ? "bg-gradient-to-r from-white/[0.05] to-primary/[0.08] border border-primary/40 shadow-xl"
                                    : "bg-white/[0.03] border border-white/10"
                            }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-black uppercase tracking-wider">
                                            {new Date(`${evt.fecha}T12:00:00`).toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-white/50 font-bold">
                                            <Clock size={13} className="text-primary" /> {evt.hora}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-white/50 font-bold">
                                            <MapPin size={13} className="text-sky" /> {evt.lugar}
                                        </span>
                                    </div>

                                    <h3 className="text-xl md:text-2xl font-black text-white">{evt.titulo}</h3>
                                    <p className="text-white/60 text-sm leading-relaxed">{evt.descripcion}</p>

                                    {evt.artistas && evt.artistas.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            <span className="text-xs font-bold text-white/40">Artistas:</span>
                                            {evt.artistas.map((art, aIdx) => (
                                                <span key={aIdx} className="px-2.5 py-1 rounded-lg bg-white/5 text-white/80 text-xs font-semibold">
                                                    🎵 {art}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex md:flex-col items-center gap-3 shrink-0">
                                    <Link
                                        href="/feria-loja"
                                        className="py-3 px-5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
                                    >
                                        <Flame size={14} /> Votar por Stands
                                    </Link>
                                    <button
                                        onClick={() => handleShare(evt)}
                                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                        title="Compartir evento"
                                    >
                                        {copiedId === evt.id ? <CheckCircle2 size={16} className="text-green-400" /> : <Share2 size={16} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Hub Navigation Banner */}
                <div className="rounded-3xl p-8 md:p-10 bg-gradient-to-r from-primary/20 via-[#001549]/40 to-black border border-primary/30 text-center">
                    <h3 className="text-2xl font-black text-white mb-2">¿Ya votaste por tu stand favorito?</h3>
                    <p className="text-white/70 text-sm max-w-lg mx-auto mb-6">
                        Miles de visitantes están apoyando a sus artesanos preferidos. Entra al ranking y emite tu voto en 1 solo clic.
                    </p>
                    <Link
                        href="/feria-loja"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-sm transition-all shadow-xl hover:scale-105"
                    >
                        Ver Ranking de Expositores <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </main>
    );
}
