"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Clock } from "lucide-react";

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

export default function LimitedTimeOffer({ 
    offer, 
    themePrimary = "#FF6B00",
    className 
}: LimitedTimeOfferProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0
    });
    const [isExpired, setIsExpired] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!offer?.expiresAt) return;

        const calculateTimeLeft = () => {
            const difference = new Date(offer.expiresAt!).getTime() - new Date().getTime();
            
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

    // Don't Render if no offer, not enabled, or expired
    if (!offer?.enabled || isExpired || !offer?.expiresAt) return null;

    const formatNumber = (n: number) => n.toString().padStart(2, "0");

    return (
        <>
            {/* Badge pequeño en esquina del hero */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "absolute top-6 right-6 md:top-8 md:right-8 z-50 cursor-pointer",
                    className
                )}
                onClick={() => setIsModalOpen(true)}
            >
                <div 
                    className="relative bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/50 overflow-hidden hover:border-orange-500/50 transition-all hover:scale-105"
                    style={{ minWidth: "100px" }}
                >
                    {/* Glow effect */}
                    <div 
                        className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
                        style={{ backgroundColor: themePrimary }}
                    />

                    <div className="relative z-10 flex flex-col items-center gap-1">
                        {/* Badge / Title - Siempre dice OFERTA */}
                        <div 
                            className="text-sm md:text-base font-black uppercase tracking-wider px-4 py-1.5 rounded-full"
                            style={{ 
                                backgroundColor: themePrimary,
                                color: '#000'
                            }}
                        >
                            OFERTA
                        </div>

                        {/* Countdown Timer */}
                        <div className="flex items-center gap-0.5 text-white">
                            <span className="text-xs md:text-sm font-black tabular-nums">
                                {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}
                            </span>
                            <span className="text-[8px] text-white/40">:</span>
                            <span className="text-xs md:text-sm font-black tabular-nums" style={{ color: themePrimary }}>
                                {formatNumber(timeLeft.seconds)}
                            </span>
                        </div>

                        {/* Label */}
                        <span className="text-[7px] md:text-[8px] text-white/50 font-bold uppercase tracking-widest">
                            {timeLeft.days > 0 
                                ? `${timeLeft.days} día${timeLeft.days > 1 ? 's' : ''}`
                                : "restante"
                            }
                        </span>
                    </div>

                    {/* Pulsing indicator */}
                    <div 
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full animate-pulse"
                        style={{ backgroundColor: themePrimary }}
                    />
                </div>
            </motion.div>

            {/* Modal de oferta completa */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="relative w-full max-w-lg border rounded-3xl p-10 shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                borderColor: `${themePrimary}40`,
                                backgroundColor: '#0a0a0a',
                            }}
                        >
                            {/* Fondo con gradiente del tema */}
                            <div 
                                className="absolute inset-0"
                                style={{ background: `linear-gradient(135deg, ${themePrimary}20 0%, transparent 50%, ${themePrimary}10 100%)` }}
                            />

                            {/* Close button */}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                            >
                                <X size={20} className="text-white/70" />
                            </button>

                            {/* Badge / Título GRANDE */}
                            {offer.title && (
                                <div className="relative z-10 text-center mb-6">
                                    <div 
                                        className="inline-block text-4xl md:text-5xl font-black uppercase tracking-wider px-6 py-2 rounded-2xl"
                                        style={{ 
                                            backgroundColor: themePrimary,
                                            color: '#000'
                                        }}
                                    >
                                        {offer.title}
                                    </div>
                                </div>
                            )}

                            {/* Description GRANDE */}
                            {offer.description && (
                                <div className="relative z-10 text-center mb-8">
                                    <p className="text-white/90 text-2xl md:text-3xl font-bold">{offer.description}</p>
                                </div>
                            )}

                            {/* Precios - MUCHO MAS GRANDE */}
                            <div className="relative z-10 flex flex-col items-center gap-3 mb-8">
                                {offer.originalPrice && (
                                    <div className="text-center">
                                        <span className="text-lg text-white/50 font-bold uppercase">Precio Normal:</span>
                                        <div className="text-3xl text-white/40 line-through font-black">
                                            {offer.originalPrice}
                                        </div>
                                    </div>
                                )}
                                
                                {offer.offerPrice && (
                                    <div className="text-center">
                                        <span className="text-lg text-white/70 font-bold uppercase" style={{ color: themePrimary }}>Precio Oferta:</span>
                                        <div 
                                            className="text-6xl md:text-7xl font-black"
                                            style={{ color: themePrimary }}
                                        >
                                            {offer.offerPrice}
                                        </div>
                                    </div>
                                )}

                                {/* Calcular descuento si tenemos ambos precios */}
                                {offer.originalPrice && offer.offerPrice && (
                                    <div 
                                        className="mt-2 px-6 py-2 rounded-full text-xl font-black"
                                        style={{ 
                                            backgroundColor: `${themePrimary}20`,
                                            color: themePrimary 
                                        }}
                                    >
                                        ¡Ahorra {offer.originalPrice}!
                                    </div>
                                )}
                            </div>

                            {/* Countdown GRANDE */}
                            <div className="relative z-10 text-center mb-8">
                                <div className="flex items-center justify-center gap-2 text-white/60 mb-3">
                                    <Clock size={20} />
                                    <span className="text-sm font-bold uppercase tracking-wider">Termina en:</span>
                                </div>
                                
                                <div className="flex items-center justify-center gap-4">
                                    {timeLeft.days > 0 && (
                                        <div className="text-center">
                                            <div 
                                                className="text-5xl md:text-6xl font-black"
                                                style={{ color: themePrimary }}
                                            >
                                                {timeLeft.days}
                                            </div>
                                            <div className="text-xs uppercase tracking-widest text-white/50 font-bold">días</div>
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <div className="text-5xl md:text-6xl font-black text-white">
                                            {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
                                        </div>
                                        <div className="text-xs uppercase tracking-widest text-white/50 font-bold">horas</div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Button GRANDE */}
                            {offer.ctaText && (
                                <button
                                    className="relative z-10 w-full py-5 rounded-2xl font-black uppercase text-lg tracking-wider text-black transition-all hover:scale-[1.02] shadow-lg"
                                    style={{ 
                                        backgroundColor: themePrimary,
                                        boxShadow: `0 10px 40px ${themePrimary}60`
                                    }}
                                >
                                    {offer.ctaText}
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
