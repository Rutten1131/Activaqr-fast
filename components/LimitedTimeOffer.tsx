"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Clock, Flame, Tag } from "lucide-react";

interface LimitedTimeOfferProps {
    offer?: {
        enabled?: boolean;
        badge?: string;
        title?: string;
        description?: string;
        originalPrice?: string;
        offerPrice?: string;
        expiresAt?: string;
        ctaText?: string;
    };
    themePrimary?: string;
    className?: string;
}

// Calculates a percentage discount between two price strings (e.g. "$100" and "$80")
function calcDiscount(original: string, offer: string): number | null {
    const orig = parseFloat(original.replace(/[^0-9.]/g, ""));
    const off = parseFloat(offer.replace(/[^0-9.]/g, ""));
    if (!orig || !off || orig <= off) return null;
    return Math.round(((orig - off) / orig) * 100);
}

export default function LimitedTimeOffer({
    offer,
    themePrimary = "#FF6B00",
    className,
}: LimitedTimeOfferProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
    });
    const [isExpired, setIsExpired] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        if (!offer?.expiresAt) return;

        const calculateTimeLeft = () => {
            let expStr = offer.expiresAt!;
            if (!expStr.includes('Z') && !expStr.match(/[+-]\d{2}:\d{2}$/)) {
                expStr = expStr + '-05:00';
            }
            const difference = new Date(expStr).getTime() - new Date().getTime();

            if (difference <= 0) {
                setIsExpired(true);
                return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            return { days, hours, minutes, seconds, total: difference };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [offer?.expiresAt]);

    if (!offer?.enabled || isDismissed || isExpired) return null;

    const formatNumber = (n: number) => n.toString().padStart(2, "0");

    const discountPct =
        offer.originalPrice && offer.offerPrice
            ? calcDiscount(offer.originalPrice, offer.offerPrice)
            : null;

    // Hero label - prefer discount %, else title, else "OFERTA"
    const heroLabel =
        discountPct ? `${discountPct}%` :
        offer.title ? offer.title :
        "OFERTA";

    const subLabel = offer.description || "Descuento Especial";

    return (
        <>
            {/* ─── CORNER BADGE — impacto visual, estilo cartel ─── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.4 }}
                className={cn(
                    "absolute top-6 right-4 md:top-8 md:right-8 z-50 select-none",
                    className
                )}
                whileHover={{ scale: 1.04 }}
            >
                {/* Outer ring / shadow glow */}
                <motion.div
                    className="absolute inset-0 rounded-[22px] pointer-events-none"
                    style={{ boxShadow: `0 0 0 3px ${themePrimary}, 0 8px 32px ${themePrimary}80` }}
                    animate={{ boxShadow: [
                        `0 0 0 3px ${themePrimary}, 0 8px 24px ${themePrimary}60`,
                        `0 0 0 5px ${themePrimary}cc, 0 12px 40px ${themePrimary}90`,
                        `0 0 0 3px ${themePrimary}, 0 8px 24px ${themePrimary}60`,
                    ]}}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                <div
                    className="relative overflow-hidden rounded-[22px] flex flex-col items-center cursor-pointer w-[155px] md:w-[180px]"
                    style={{
                        background: `linear-gradient(160deg, ${themePrimary} 0%, color-mix(in srgb, ${themePrimary} 70%, #000) 100%)`,
                    }}
                    onClick={() => setIsModalOpen(true)}
                >
                    {/* X dismiss button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsDismissed(true); }}
                        className="absolute top-1.5 left-1.5 z-20 w-5 h-5 rounded-full bg-black/30 hover:bg-black/60 flex items-center justify-center transition-colors"
                        aria-label="Cerrar oferta"
                    >
                        <X size={10} className="text-white/80" />
                    </button>
                    {/* Animated shine */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    />

                    {/* Dot texture overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.07] pointer-events-none"
                        style={{
                            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                            backgroundSize: "10px 10px",
                        }}
                    />

                    {/* TOP PILL — "🔥 OFERTA" */}
                    <div className="relative z-10 w-full flex justify-center pt-2.5 pb-1 px-3">
                        <motion.span
                            className="text-[10px] font-black uppercase tracking-widest text-black/80 bg-white/30 px-2.5 py-0.5 rounded-full flex items-center gap-1"
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                        >
                            🔥 OFERTA
                        </motion.span>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="relative z-10 flex flex-col items-center px-3 pb-1 w-full">
                        {/* Original price — crossed out, small */}
                        {offer.originalPrice && (
                            <span className="text-[11px] font-black text-black/50 line-through leading-none">
                                {offer.originalPrice}
                            </span>
                        )}

                        {/* THE BIG NUMBER/TEXT — like the reference "35%" */}
                        <motion.div
                            className="font-black text-white leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] text-center w-full overflow-hidden text-ellipsis"
                            style={{
                                fontSize: "clamp(1.8rem, 10vw, 2.5rem)",
                                textShadow: "0 2px 8px rgba(0,0,0,0.3), -1px -1px 0 rgba(0,0,0,0.2), 1px 1px 0 rgba(0,0,0,0.2)",
                            }}
                            animate={{ scale: [1, 1.04, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                        >
                            {offer.offerPrice ? offer.offerPrice : heroLabel}
                        </motion.div>

                        {/* "OFF" sub-line if we showed a %-discount as the big number */}
                        {discountPct && !offer.offerPrice && (
                            <span className="text-[13px] font-black text-white/90 uppercase tracking-widest leading-none -mt-0.5">
                                DE DESCUENTO
                            </span>
                        )}

                        {/* Description / sub-line when price is shown */}
                        {offer.offerPrice && offer.title && (
                            <span className="text-[9px] font-black text-white/95 uppercase tracking-wider leading-tight text-center px-1.5 mt-1.5 block w-full break-words">
                                {offer.title}
                            </span>
                        )}
                    </div>

                    {/* COUNTDOWN ROW */}
                    {offer.expiresAt && (
                        <div className="relative z-10 w-full flex justify-center items-center gap-1 bg-black/20 px-2 py-1.5 mt-1">
                            <Clock size={9} className="text-white/70" />
                            <span className="text-[10px] font-black tabular-nums text-white/90">
                                {timeLeft.days > 0 && `${timeLeft.days}d `}
                                {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
                            </span>
                        </div>
                    )}

                    {/* TAP hint */}
                    <div className="relative z-10 py-1.5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/50">
                            VER MÁS →
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* ─── FULL DETAIL MODAL — slide-up sheet ─── */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 280, damping: 28 }}
                            className="relative w-full md:max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl border-t md:border"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                borderColor: `${themePrimary}50`,
                                backgroundColor: "#0a0a0a",
                            }}
                        >
                            {/* Color top stripe */}
                            <div className="h-1.5 w-full" style={{ background: themePrimary }} />

                            {/* Ambient glow */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: `radial-gradient(ellipse at top center, ${themePrimary}20 0%, transparent 65%)`,
                                }}
                            />

                            {/* Close */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
                                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-50"
                            >
                                <X size={18} className="text-white/70" />
                            </button>

                            <div className="relative z-10 px-8 pt-7 pb-10 flex flex-col items-center gap-5 text-center">
                                {/* Badge */}
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest"
                                    style={{ backgroundColor: themePrimary, color: "#000" }}
                                >
                                    <Flame size={13} />
                                    OFERTA ESPECIAL
                                </div>

                                {/* Description */}
                                {offer.description && (
                                    <p className="text-white/80 text-base font-semibold leading-snug max-w-xs">
                                        {offer.description}
                                    </p>
                                )}

                                {/* Prices */}
                                {(offer.originalPrice || offer.offerPrice) && (
                                    <div className="flex flex-col items-center gap-1 w-full">
                                        {offer.originalPrice && (
                                            <div className="flex items-center gap-2">
                                                <Tag size={11} className="text-white/40" />
                                                <span className="text-sm text-white/40 line-through font-bold">
                                                    Precio normal: {offer.originalPrice}
                                                </span>
                                            </div>
                                        )}
                                        {offer.offerPrice && (
                                            <motion.div
                                                className="font-black"
                                                style={{
                                                    color: themePrimary,
                                                    fontSize: "clamp(3.5rem, 20vw, 6rem)",
                                                    lineHeight: 1,
                                                    textShadow: `0 4px 24px ${themePrimary}60`,
                                                }}
                                                animate={{ scale: [1, 1.04, 1] }}
                                                transition={{ duration: 1.8, repeat: Infinity }}
                                            >
                                                {offer.offerPrice}
                                            </motion.div>
                                        )}
                                        {discountPct && (
                                            <div
                                                className="mt-1 px-5 py-1.5 rounded-full text-sm font-black"
                                                style={{
                                                    backgroundColor: `${themePrimary}20`,
                                                    color: themePrimary,
                                                }}
                                            >
                                                ✨ {discountPct}% de descuento
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Title only (no price) */}
                                {!offer.offerPrice && offer.title && (
                                    <div
                                        className="font-black"
                                        style={{
                                            color: themePrimary,
                                            fontSize: "clamp(3rem, 18vw, 5rem)",
                                            lineHeight: 1,
                                        }}
                                    >
                                        {offer.title}
                                    </div>
                                )}

                                {/* Countdown */}
                                {offer.expiresAt && (
                                    <div className="w-full">
                                        <div className="flex items-center justify-center gap-2 text-white/50 mb-3">
                                            <Clock size={14} />
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                Termina en:
                                            </span>
                                        </div>
                                        <div className="flex items-stretch justify-center gap-2">
                                            {timeLeft.days > 0 && (
                                                <div className="flex flex-col items-center bg-white/5 rounded-2xl px-4 py-3 min-w-[60px]">
                                                    <span className="text-3xl font-black" style={{ color: themePrimary }}>
                                                        {timeLeft.days}
                                                    </span>
                                                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">días</span>
                                                </div>
                                            )}
                                            {[
                                                { val: timeLeft.hours, label: "horas" },
                                                { val: timeLeft.minutes, label: "min" },
                                                { val: timeLeft.seconds, label: "seg" },
                                            ].map(({ val, label }) => (
                                                <div key={label} className="flex flex-col items-center bg-white/5 rounded-2xl px-4 py-3 min-w-[60px]">
                                                    <span className="text-3xl font-black text-white tabular-nums">
                                                        {formatNumber(val)}
                                                    </span>
                                                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CTA */}
                                {offer.ctaText && (
                                    <button
                                        className="w-full py-4 rounded-2xl font-black uppercase text-base tracking-wider text-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                                        style={{
                                            backgroundColor: themePrimary,
                                            boxShadow: `0 8px 32px ${themePrimary}50`,
                                        }}
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        {offer.ctaText}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
