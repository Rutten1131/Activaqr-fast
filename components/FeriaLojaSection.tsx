"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Trophy,
    Medal,
    Flame,
    ArrowRight,
    Store,
    Users,
    Vote,
    Sparkles,
    CheckCircle2,
    RefreshCw,
    MessageCircle,
    ImageIcon,
    QrCode,
    Share2,
    ExternalLink,
    Heart
} from "lucide-react";
import Link from "next/link";

const FERIA_DEADLINE = new Date("2026-09-20T23:59:59-05:00");
const WA_NUMBER = "593963425323";

interface Participante {
    id: number;
    slug: string;
    nombre_negocio: string;
    logo_url: string | null;
    total_votos: number;
}

export default function FeriaLojaSection() {
    const [top5, setTop5] = useState<Participante[]>([]);
    const [participantes, setParticipantes] = useState<Participante[]>([]);
    const [stats, setStats] = useState({ total_participantes: 0, total_votos: 0 });
    const [isLoading, setIsLoading] = useState(true);

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
        // Polling cada 30 segundos para votos en vivo
        const interval = setInterval(fetchRanking, 30000);
        return () => clearInterval(interval);
    }, []);

    if (new Date() > FERIA_DEADLINE) return null;

    const getVoteUrl = (nombre: string) => {
        const msg = `Feria de Loja #197 - Voto por: ${nombre}`;
        return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    };

    const maxVotes = top5.length > 0 ? Math.max(...top5.map((p) => p.total_votos), 1) : 1;

    return (
        <section
            id="competencia-feria"
            className="relative py-20 md:py-28 overflow-hidden section-dark"
            style={{
                background: "linear-gradient(180deg, #0a0a0a 0%, #0d121d 50%, #0a0a0a 100%)",
            }}
        >
            {/* Ambient Lighting & Grid */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#001549]/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                {/* Header Badge */}
                <div className="text-center mb-12 md:mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-5 py-2 rounded-full mb-5 shadow-[0_0_20px_rgba(246,103,57,0.15)]"
                    >
                        <Flame size={16} className="text-primary animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-primary">
                            197 Feria de Loja • Competencia Oficial
                        </span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-tight mb-4"
                    >
                        Ranking de Stands <span className="text-primary italic">Más Votados</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-white/70 text-base md:text-lg max-w-2xl mx-auto font-medium"
                    >
                        Descubre quién lidera la feria. ¡Apoya a tu favorito escaneando su QR en el stand o votando directamente por WhatsApp!
                    </motion.p>

                    {/* Stats pills & Refresh */}
                    <div className="flex flex-wrap justify-center items-center gap-4 mt-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/80">
                            <Store size={15} className="text-primary" />
                            <span>{stats.total_participantes} Stands inscritos</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/80">
                            <Vote size={15} className="text-green-400" />
                            <span>{stats.total_votos} Votos totales</span>
                        </div>
                        <button
                            onClick={fetchRanking}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/50 hover:text-white transition-all"
                            title="Actualizar votos"
                        >
                            <RefreshCw size={13} className={isLoading ? "animate-spin text-primary" : ""} />
                            <span>En vivo</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                {isLoading && top5.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw size={36} className="animate-spin text-primary" />
                    </div>
                ) : top5.length === 0 ? (
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
                        {/* Podio / Leaderboard Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-stretch">
                            {/* Card 1st Place (Center on desktop, 1st in visual weight) */}
                            {top5[0] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="md:order-2 rounded-3xl p-6 md:p-8 flex flex-col justify-between text-center relative overflow-hidden group shadow-2xl"
                                    style={{
                                        background: "linear-gradient(180deg, rgba(246,103,57,0.18) 0%, rgba(255,255,255,0.04) 100%)",
                                        border: "2px solid rgba(246,103,57,0.5)",
                                        boxShadow: "0 20px 60px rgba(246,103,57,0.2)",
                                    }}
                                >
                                    {/* Top Leader Banner */}
                                    <div className="absolute top-0 inset-x-0 bg-primary text-white text-[11px] font-black uppercase tracking-widest py-1.5 flex items-center justify-center gap-2 shadow-md">
                                        <Trophy size={14} /> 🥇 1er Lugar • Líder de la Feria
                                    </div>

                                    <div className="mt-6">
                                        {/* Logo Container */}
                                        <div className="w-24 h-24 mx-auto rounded-2xl bg-white/10 border-2 border-primary/40 p-2 flex items-center justify-center mb-4 shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                            {top5[0].logo_url ? (
                                                <img
                                                    src={top5[0].logo_url}
                                                    alt={top5[0].nombre_negocio}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-primary/20 text-primary font-black text-2xl rounded-xl">
                                                    {top5[0].nombre_negocio.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-black text-2xl md:text-3xl text-white mb-2 line-clamp-2">
                                            {top5[0].nombre_negocio}
                                        </h3>

                                        {/* Vote Pill */}
                                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/20 border border-primary/40 text-primary font-black text-base uppercase tracking-wider mb-6">
                                            <Flame size={18} className="animate-pulse" />
                                            <span>{top5[0].total_votos} Votos</span>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/feria-loja/${top5[0].slug}`}
                                        className="w-full py-4 px-6 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-base transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02]"
                                        style={{ boxShadow: "0 10px 30px rgba(246,103,57,0.4)" }}
                                    >
                                        <Heart size={18} className="fill-white" />
                                        Ver Ficha & Votar en 1 Clic
                                    </Link>
                                </motion.div>
                            )}


                            {/* Card 2nd Place */}
                            {top5[1] ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                    className="md:order-1 rounded-3xl p-6 md:p-7 flex flex-col justify-between text-center relative overflow-hidden group hover:border-white/20 transition-all duration-300"
                                    style={{
                                        background: "rgba(255, 255, 255, 0.04)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        backdropFilter: "blur(20px)",
                                    }}
                                >
                                    <div>
                                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-300/10 border border-slate-300/30 text-slate-200 text-xs font-black uppercase tracking-wider mb-4">
                                            🥈 2do Lugar
                                        </div>

                                        <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center mb-3 shadow-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                            {top5[1].logo_url ? (
                                                <img
                                                    src={top5[1].logo_url}
                                                    alt={top5[1].nombre_negocio}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/10 text-white font-black text-xl rounded-xl">
                                                    {top5[1].nombre_negocio.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="font-black text-xl text-white mb-2 line-clamp-1">
                                            {top5[1].nombre_negocio}
                                        </h4>

                                        <div className="inline-flex items-center gap-1.5 text-slate-300 text-sm font-bold uppercase tracking-wider mb-6">
                                            <Medal size={16} /> {top5[1].total_votos} Votos
                                        </div>
                                    </div>

                                    <Link
                                        href={`/feria-loja/${top5[1].slug}`}
                                        className="w-full py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 hover:border-primary/40"
                                    >
                                        <Heart size={16} className="text-primary" />
                                        Ver Ficha & Votar
                                    </Link>
                                </motion.div>
                            ) : (
                                <div className="md:order-1 rounded-3xl p-6 border border-dashed border-white/10 flex flex-col items-center justify-center text-center text-white/40 min-h-[280px]">
                                    <Medal size={32} className="mb-2 opacity-30" />
                                    <p className="font-bold text-sm">Puesto #2 Disponible</p>
                                    <p className="text-xs text-white/30 mt-1">¡Inscribe tu negocio!</p>
                                </div>
                            )}

                            {/* Card 3rd Place */}
                            {top5[2] ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="md:order-3 rounded-3xl p-6 md:p-7 flex flex-col justify-between text-center relative overflow-hidden group hover:border-white/20 transition-all duration-300"
                                    style={{
                                        background: "rgba(255, 255, 255, 0.04)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        backdropFilter: "blur(20px)",
                                    }}
                                >
                                    <div>
                                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-400 text-xs font-black uppercase tracking-wider mb-4">
                                            🥉 3er Lugar
                                        </div>

                                        <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center mb-3 shadow-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                            {top5[2].logo_url ? (
                                                <img
                                                    src={top5[2].logo_url}
                                                    alt={top5[2].nombre_negocio}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/10 text-white font-black text-xl rounded-xl">
                                                    {top5[2].nombre_negocio.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="font-black text-xl text-white mb-1 line-clamp-1">
                                            {top5[2].nombre_negocio}
                                        </h4>

                                        <div className="inline-flex items-center gap-1.5 text-amber-400/90 text-sm font-bold uppercase tracking-wider mb-6">
                                            <Medal size={16} /> {top5[2].total_votos} Votos
                                        </div>
                                    </div>

                                    <Link
                                        href={`/feria-loja/${top5[2].slug}`}
                                        className="w-full py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 hover:border-primary/40"
                                    >
                                        <Heart size={16} className="text-primary" />
                                        Ver Ficha & Votar
                                    </Link>
                                </motion.div>
                            ) : (
                                <div className="md:order-3 rounded-3xl p-6 border border-dashed border-white/10 flex flex-col items-center justify-center text-center text-white/40 min-h-[280px]">
                                    <Medal size={32} className="mb-2 opacity-30" />
                                    <p className="font-bold text-sm">Puesto #3 Disponible</p>
                                    <p className="text-xs text-white/30 mt-1">¡Inscribe tu negocio!</p>
                                </div>
                            )}
                        </div>

                        {/* 4th and 5th Place List */}
                        {top5.length > 3 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-14">
                                {top5.slice(3, 5).map((neg, idx) => (
                                    <div
                                        key={neg.id}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-8 h-8 rounded-full bg-white/10 text-white font-black text-xs flex items-center justify-center shrink-0">
                                                #{idx + 4}
                                            </span>
                                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                                {neg.logo_url ? (
                                                    <img src={neg.logo_url} alt={neg.nombre_negocio} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Store size={16} className="text-white/40" />
                                                )}
                                            </div>
                                            <span className="font-bold text-white text-sm truncate">{neg.nombre_negocio}</span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 ml-3">
                                            <span className="text-xs font-black text-primary">{neg.total_votos} Votos</span>
                                            <a
                                                href={getVoteUrl(neg.nombre_negocio)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                                                title="Votar"
                                            >
                                                <MessageCircle size={14} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Muro de Logos de Todos los Participantes */}
                {participantes.length > 0 && (
                    <div className="mb-14 rounded-3xl p-6 md:p-8 bg-white/[0.02] border border-white/5">
                        <div className="text-center mb-6">
                            <h4 className="text-sm md:text-base font-black uppercase tracking-widest text-white/90">
                                🎪 Todos los Negocios y Stands Participantes
                            </h4>
                            <p className="text-white/50 text-xs mt-1">Haz clic en cualquier stand para votar por él</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
                            {participantes.map((part) => (
                                <a
                                    key={part.id}
                                    href={getVoteUrl(part.nombre_negocio)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`Votar por ${part.nombre_negocio} (${part.total_votos} votos)`}
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
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Call To Action Box to Register at /feria */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="rounded-3xl p-8 md:p-12 relative overflow-hidden text-center shadow-2xl"
                    style={{
                        background: "linear-gradient(135deg, rgba(246,103,57,0.2) 0%, rgba(0,21,73,0.5) 100%)",
                        border: "1px solid rgba(246,103,57,0.4)",
                    }}
                >
                    <div className="max-w-2xl mx-auto relative z-10">
                        <Sparkles size={36} className="text-primary mx-auto mb-4" />
                        <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-3">
                            ¿Tienes un Stand en la 197 Feria de Loja?
                        </h3>
                        <p className="text-white/80 text-sm md:text-base mb-8 font-medium">
                            Inscribe tu negocio gratis en menos de 1 minuto, descarga tu código QR exclusivo y compite por ser el negocio más votado del evento.
                        </p>
                        <Link
                            href="/feria"
                            className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-white font-black text-base md:text-lg px-10 py-5 rounded-2xl shadow-2xl transition-all hover:scale-105"
                            style={{ boxShadow: "0 12px 40px rgba(246,103,57,0.45)" }}
                        >
                            Inscribir mi Negocio en /feria <ArrowRight size={22} />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
