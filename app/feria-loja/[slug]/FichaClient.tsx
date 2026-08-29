"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart,
    Flame,
    CheckCircle2,
    MapPin,
    Calendar,
    Share2,
    Store,
    ArrowLeft,
    Sparkles,
    Star,
    MessageCircle,
    ShoppingBag,
    Award,
    ArrowRight,
    Gift,
    Instagram,
    Facebook,
    X
} from "lucide-react";
import Link from "next/link";

interface FichaClientProps {
    expositor: any;
    related: any[];
    productos: any[];
}

export default function FichaClient({ expositor, related, productos }: FichaClientProps) {
    const [voted, setVoted] = useState(false);
    const [isVoting, setIsVoting] = useState(false);
    const [tokenWa, setTokenWa] = useState<string | null>(null);
    const [waVerifyUrl, setWaVerifyUrl] = useState<string | null>(null);
    const [votesCount, setVotesCount] = useState<number>(expositor.total_votos || 0);
    const [copied, setCopied] = useState(false);
    const [lightboxProduct, setLightboxProduct] = useState<any | null>(null);

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

    const handleVote = async () => {
        if (voted || isVoting) return;
        setIsVoting(true);

        try {
            const fingerprint = localStorage.getItem("feria_device_id") || Math.random().toString(36).substring(2);
            localStorage.setItem("feria_device_id", fingerprint);

            const res = await fetch("/api/feria/voto-web", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    expositor_id: expositor.id,
                    slug: expositor.slug,
                    device_fingerprint: fingerprint,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setVoted(true);
                setTokenWa(data.token_wa);
                setWaVerifyUrl(data.whatsapp_verify_url);
                if (!data.already_voted) {
                    setVotesCount((prev) => prev + 1);
                }
            }
        } catch (e) {
            console.error("Error al votar:", e);
        } finally {
            setIsVoting(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `¡Vota por ${expositor.nombre_negocio} en la 197ª Feria de Loja!`,
                text: `${expositor.slogan || `Conoce a ${expositor.nombre_negocio}`} en la 197ª Feria de Loja. ¡Vota en 1 clic!`,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const cleanOwnerPhone = expositor.telefono_negocio
        ? expositor.telefono_negocio.replace(/[^0-9]/g, "")
        : null;
    const directOwnerWa = cleanOwnerPhone
        ? `https://wa.me/${cleanOwnerPhone.startsWith("593") ? cleanOwnerPhone : `593${cleanOwnerPhone.replace(/^0/, "")}`}?text=${encodeURIComponent(`Hola ${expositor.nombre_negocio}, vi su página en la 197ª Feria de Loja y me gustaría consultar sobre sus productos.`)}`
        : null;

    const defaultCover = "/images/Reingenierìa/v2_tarjetas_mano.webp";
    const coverImage = expositor.portada_url || defaultCover;

    // Lista estructurada de redes sociales
    const socialNetworks = useMemo(() => {
        const list = [];
        if (directOwnerWa) {
            list.push({
                name: "WhatsApp",
                url: directOwnerWa,
                icon: <MessageCircle size={16} className="text-green-400" />,
                style: "bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-300",
                label: "WhatsApp Oficial"
            });
        }
        if (expositor.instagram_url) {
            list.push({
                name: "Instagram",
                url: expositor.instagram_url,
                icon: <Instagram size={16} className="text-pink-400" />,
                style: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 text-pink-300",
                label: "Instagram"
            });
        }
        if (expositor.facebook_url) {
            list.push({
                name: "Facebook",
                url: expositor.facebook_url,
                icon: <Facebook size={16} className="text-blue-400" />,
                style: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300",
                label: "Facebook"
            });
        }
        if (expositor.tiktok_url) {
            list.push({
                name: "TikTok",
                url: expositor.tiktok_url,
                icon: <span className="text-xs">🎵</span>,
                style: "bg-white/5 hover:bg-white/10 border-white/15 text-white/90",
                label: "TikTok"
            });
        }
        return list;
    }, [expositor, directOwnerWa]);

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30 relative overflow-hidden font-sans pb-20">
            {/* ═══ TOP FLOATING HEADER (85% MÓVIL / 70% ORDENADOR) CON SMART AUTOHIDE ═══ */}
            <nav
                className={`fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-[85%] md:w-[70%] max-w-5xl transition-all duration-300 ${
                    showHeader ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0 pointer-events-none"
                }`}
            >
                <div className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/15 shadow-2xl rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between">
                    <Link
                        href="/feria-loja"
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs sm:text-sm font-semibold transition-colors"
                    >
                        <ArrowLeft size={16} className="text-primary" />
                        <span className="hidden sm:inline">Explorar Directorio</span>
                        <span className="sm:hidden">Volver</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/feria-loja/agenda"
                            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all border border-white/10"
                        >
                            <Calendar size={13} className="text-sky" /> Conciertos
                        </Link>
                        <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
                        >
                            <Share2 size={13} /> {copied ? "¡Copiado!" : "Compartir"}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ═══ HERO LANDING BANNER CINEMATOGRÁFICO (80% DEL ALTO DE PANTALLA) ═══ */}
            <section className="relative min-h-[80vh] w-full flex items-end overflow-hidden pb-10 sm:pb-14 pt-24">
                {/* Background Cover Image with cinematic overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={coverImage}
                        alt={`Negocio ${expositor.nombre_negocio}`}
                        className="w-full h-full object-cover object-center scale-105 filter brightness-[0.52]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-black/30" />
                    <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/70" />
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 w-full">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
                        {/* 3D Logo / Avatar de mayor presencia */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-3xl bg-black/70 backdrop-blur-xl border-2 border-white/20 p-3 flex items-center justify-center shrink-0 shadow-2xl shadow-black/90 overflow-hidden relative group"
                        >
                            {expositor.logo_url ? (
                                <img
                                    src={expositor.logo_url}
                                    alt={expositor.nombre_negocio}
                                    className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <Store size={56} className="text-primary" />
                            )}
                            <div className="absolute top-2.5 right-2.5 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                            </div>
                        </motion.div>

                        {/* Text & Meta */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2.5">
                                <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider shadow-lg">
                                    <MapPin size={12} /> {expositor.numero_stand || "Feria de Loja"}
                                </span>
                                <span className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-xs font-bold uppercase tracking-wider">
                                    {expositor.categoria || "Emprendimiento"}
                                </span>
                                {expositor.origen && (
                                    <span className="text-xs text-white/70 font-semibold px-3 py-1 rounded-full bg-black/40 border border-white/10">
                                        📍 {expositor.origen}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-lg">
                                {expositor.nombre_negocio}
                            </h1>

                            {expositor.slogan ? (
                                <p className="text-base sm:text-xl text-primary font-bold italic max-w-2xl drop-shadow">
                                    "{expositor.slogan}"
                                </p>
                            ) : (
                                <p className="text-sm text-white/70">
                                    Representante: <strong className="text-white">{expositor.nombre_representante}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 relative z-20 space-y-8">
                {/* ═══ MÓDULO DE VOTACIÓN DIRECTA EN WHATSAPP ═══ */}
                <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-primary/40 backdrop-blur-2xl shadow-2xl shadow-primary/10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                        <div>
                            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mb-1">
                                <Sparkles size={14} /> Votación Oficial de la Feria
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white">
                                ¿Te gusta el trabajo de {expositor.nombre_negocio}?
                            </h3>
                            <p className="text-white/60 text-xs sm:text-sm mt-0.5 max-w-md">
                                Vota gratis en 1 clic y ayúdalos a ganar el reconocimiento al negocio favorito del público.
                            </p>
                        </div>

                        <a
                            href={`https://wa.me/593963425323?text=${encodeURIComponent(`🗳️ Voto Feria 197 por: ${expositor.nombre_negocio} [ID: ${expositor.id}] ⭐`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-base transition-all shadow-xl flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 shrink-0"
                            style={{ boxShadow: "0 10px 30px rgba(246,103,57,0.4)" }}
                        >
                            <Heart size={20} className="fill-white animate-bounce" />
                            <span>VOTAR EN 1 CLIC</span>
                        </a>
                    </div>
                </div>

                {/* ═══ BANNER DE PROMOCIÓN EXCLUSIVA DE FERIA (Si existe) ═══ */}
                {expositor.promocion_feria && (
                    <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-r from-amber-500/20 via-primary/20 to-black/40 border border-amber-400/40 shadow-xl flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30">
                            <Gift size={24} />
                        </div>
                        <div className="flex-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                                🎁 Promoción Especial en la Feria
                            </span>
                            <h4 className="text-lg md:text-xl font-black text-white mb-1">
                                {expositor.promocion_feria}
                            </h4>
                            <p className="text-white/70 text-xs">
                                Menciona que viste su página en la <strong>197ª Feria de Loja</strong> para hacer válida esta oferta.
                            </p>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* ═══ PRODUCTOS & CREACIONES DESTACADAS (2 POR FILA) ═══ */}
                {/* ═══════════════════════════════════════════════════════ */}
                {productos && productos.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary mb-1">
                                    <ShoppingBag size={14} /> Catálogo de Productos
                                </div>
                                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                                    Productos & Creaciones Destacadas
                                </h2>
                            </div>
                            <span className="text-xs font-bold text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                {productos.length} {productos.length === 1 ? "Producto" : "Productos"}
                            </span>
                        </div>

                        {/* Grid fotográfico de 2 columnas fijas */}
                        <div className="grid grid-cols-2 gap-3.5 sm:gap-6">
                            {productos.slice(0, 6).map((prod, pIdx) => (
                                <motion.div
                                    key={pIdx}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: pIdx * 0.04 }}
                                    onClick={() => setLightboxProduct(prod)}
                                    className="relative h-48 sm:h-64 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer group border border-white/10 hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 shadow-xl"
                                >
                                    {/* Imagen de Fondo */}
                                    <div className="absolute inset-0 z-0">
                                        {prod.foto_url ? (
                                            <img
                                                src={prod.foto_url}
                                                alt={prod.nombre}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter brightness-[0.45] group-hover:brightness-[0.55]"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                                                <ShoppingBag size={36} className="text-white/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                    </div>

                                    {/* Contenido en primer plano */}
                                    <div className="relative z-10 p-3.5 sm:p-5 h-full flex flex-col justify-between">
                                        {/* Top Badge: Precio o Destacado */}
                                        <div className="flex justify-start">
                                            {prod.precio ? (
                                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 text-amber-300 font-black text-[10px] sm:text-xs shadow-md">
                                                    ${prod.precio}
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white/90 font-black text-[10px] sm:text-xs shadow-md">
                                                    Destacado
                                                </span>
                                            )}
                                        </div>

                                        {/* Título & Acción */}
                                        <div>
                                            <h3 className="text-sm sm:text-xl font-black text-white tracking-tight leading-snug mb-0.5 sm:mb-1 group-hover:text-primary transition-colors line-clamp-2 drop-shadow-md">
                                                {prod.nombre}
                                            </h3>
                                            <span className="inline-flex items-center gap-1 text-amber-400 group-hover:text-primary text-[11px] sm:text-xs font-black transition-colors">
                                                Ver detalle →
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ HISTORIA, OFICIO & EXPERIENCIA ═══ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {/* Main Story Column */}
                    <div className="md:col-span-2 rounded-3xl p-6 sm:p-10 bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                        <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary mb-2">
                            <Sparkles size={14} /> Oficio & Tradición
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white mb-6">
                            La Historia detrás de {expositor.nombre_negocio}
                        </h2>

                        {expositor.descripcion_historia ? (
                            <div className="text-white/80 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line font-normal">
                                {expositor.descripcion_historia}
                            </div>
                        ) : (
                            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                                {expositor.nombre_negocio} es un emprendimiento de {expositor.origen || "Loja"} que participa en la 197ª Feria de Loja. Conoce sus productos, apoya su trabajo y vota por ellos en la competencia oficial.
                            </p>
                        )}

                        {expositor.materiales_ingredientes && (
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                                    🛠️ Materiales & Métodos de Producción
                                </h3>
                                <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                                    {expositor.materiales_ingredientes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar de Datos & Contacto */}
                    <div className="space-y-6">
                        {/* Location Card */}
                        <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white/50">
                                📍 Ubicación en la Feria
                            </h3>

                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-xs text-white/50 font-bold uppercase">Ubicación / Lugar</p>
                                <p className="text-lg font-black text-white mt-0.5">{expositor.numero_stand || "Feria de Loja"}</p>
                                <p className="text-xs text-primary font-semibold mt-1">Complejo Ferial Simón Bolívar</p>
                            </div>

                            {expositor.anios_trayectoria && (
                                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/80">
                                    <Award size={16} className="text-amber-400 shrink-0" />
                                    <span><strong>{expositor.anios_trayectoria}</strong> de trayectoria</span>
                                </div>
                            )}

                            {/* Direct Owner WhatsApp Button */}
                            {directOwnerWa && (
                                <a
                                    href={directOwnerWa}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3.5 px-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <MessageCircle size={16} /> Escribir por WhatsApp
                                </a>
                            )}
                        </div>

                        {/* ═══ GOOGLE REVIEWS CARD ELEGANTE (COLOR SAPPHIRE BLUE / GOOGLE STYLE) ═══ */}
                        {expositor.google_reviews_url && (
                            <div className="rounded-3xl p-6 bg-gradient-to-b from-blue-600/15 via-[#0c1427] to-[#0a0a0a] border border-blue-500/30 backdrop-blur-xl text-center shadow-xl">
                                <div className="flex justify-center text-amber-400 mb-2 gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill="currentColor" />
                                    ))}
                                </div>
                                <h4 className="font-black text-white text-sm sm:text-base mb-1">¿Ya probaste sus productos?</h4>
                                <p className="text-white/70 text-xs mb-4">Déjales una reseña en Google Maps para apoyar su calificación.</p>
                                <a
                                    href={expositor.google_reviews_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-lg hover:scale-105"
                                    style={{ boxShadow: "0 6px 20px rgba(37,99,235,0.3)" }}
                                >
                                    <Star size={14} fill="currentColor" /> Dejar mi Reseña
                                </a>
                            </div>
                        )}

                        {/* ═══ REDES SOCIALES ORDENADAS (1, 2, 3 O 4) ═══ */}
                        {socialNetworks.length > 0 && (
                            <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/50 mb-3.5 flex items-center gap-2">
                                    <span>Canales & Redes Oficiales</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {socialNetworks.map((net, sIdx) => (
                                        <a
                                            key={sIdx}
                                            href={net.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all hover:scale-[1.02] ${net.style}`}
                                            title={net.name}
                                        >
                                            <div className="shrink-0">{net.icon}</div>
                                            <span className="font-bold text-xs truncate">{net.label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ BANNER CONCIERTOS FACTOR COMÚN ═══ */}
                <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#001549]/80 to-black border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-sky mb-1 block">
                            📅 197ª Feria de Loja
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-white">
                            ¿Quieres ver el cronograma de conciertos de la feria?
                        </h3>
                        <p className="text-white/60 text-xs sm:text-sm mt-1">
                            Consulta las fechas, artistas estelares y escenarios oficiales del evento.
                        </p>
                    </div>
                    <Link
                        href="/feria-loja/agenda"
                        className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5"
                    >
                        Ver Cronograma de Conciertos <ArrowRight size={14} />
                    </Link>
                </div>

                {/* ═══ OTROS NEGOCIOS RELACIONADOS ═══ */}
                {related && related.length > 0 && (
                    <div className="pt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white/60">
                                Otros Negocios de {expositor.categoria || "la Feria"}
                            </h3>
                            <Link href="/feria-loja" className="text-primary text-xs font-bold hover:underline">
                                Ver todos →
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {related.map((rel) => (
                                <Link
                                    key={rel.id}
                                    href={`/feria-loja/${rel.slug}`}
                                    className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-primary/40 transition-all flex items-center gap-3.5 group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                        {rel.logo_url ? (
                                            <img src={rel.logo_url} alt={rel.nombre_negocio} className="w-full h-full object-contain" />
                                        ) : (
                                            <Store size={18} className="text-primary" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-white text-xs truncate group-hover:text-primary transition-colors">
                                            {rel.nombre_negocio}
                                        </p>
                                        <p className="text-white/40 text-[11px] truncate">{rel.numero_stand || "Feria de Loja"}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Branding ActivaQR */}
                <div className="text-center pt-10 border-t border-white/5 text-white/30 text-xs">
                    <p className="mb-2">Plataforma oficial desarrollada por <strong className="text-white/60">ActivaQR</strong></p>
                    <Link href="/" className="text-primary hover:underline font-bold text-xs">
                        ¿Quieres tu propia tarjeta de presentación digital para tu negocio? Conoce ActivaQR →
                    </Link>
                </div>
            </div>

            {/* ═══ LIGHTBOX MODAL DE PRODUCTO ═══ */}
            <AnimatePresence>
                {lightboxProduct && (
                    <motion.div
                        key="lightbox"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        onClick={() => setLightboxProduct(null)}
                    >
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 22, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative z-10 w-full max-w-lg bg-[#111] rounded-3xl overflow-hidden border border-white/15 shadow-2xl"
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setLightboxProduct(null)}
                                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            {/* Product Image */}
                            {lightboxProduct.foto_url ? (
                                <div className="w-full aspect-square bg-black">
                                    <img
                                        src={lightboxProduct.foto_url}
                                        alt={lightboxProduct.nombre}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-full aspect-square bg-white/5 flex items-center justify-center">
                                    <ShoppingBag size={48} className="text-white/20" />
                                </div>
                            )}

                            {/* Product Info */}
                            <div className="p-6 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="font-black text-white text-xl leading-tight flex-1">
                                        {lightboxProduct.nombre}
                                    </h3>
                                    {lightboxProduct.precio && (
                                        <span className="px-3 py-1.5 rounded-full bg-primary text-white font-black text-sm shrink-0">
                                            ${lightboxProduct.precio}
                                        </span>
                                    )}
                                </div>

                                {lightboxProduct.descripcion && (
                                    <p className="text-white/70 text-sm leading-relaxed">
                                        {lightboxProduct.descripcion}
                                    </p>
                                )}

                                {directOwnerWa && (
                                    <a
                                        href={`${directOwnerWa}&text=${encodeURIComponent(`Hola ${expositor.nombre_negocio}, vi "${lightboxProduct.nombre}" en la Feria de Loja y me interesa. ¿Tienen disponibilidad?`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                                        onClick={() => setLightboxProduct(null)}
                                    >
                                        <MessageCircle size={18} />
                                        <span>Consultar por WhatsApp</span>
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
