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

    // Don't Render if no offer or not enabled (expired and expiresAt are optional)
    if (!offer?.enabled) return null;

    const formatNumber = (n: number) => n.toString().padStart(2, "0");

    return (
        <>
            {/* Badge pequeño en esquina del hero - Más atractivo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                    "absolute top-6 right-6 md:top-8 md:right-8 z-50 cursor-pointer",
                    className
                )}
                onClick={() => setIsModalOpen(true)}
            >
                <div 
                    className="relative bg-gradient-to-br from-black via-black to-gray-900 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl shadow-black/50 overflow-hidden hover:scale-105 transition-transform"
                    style={{ minWidth: "150px" }}
                >
                    {/* Animated glow background */}
                    <motion.div 
                        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl pointer-events-none"
                        style={{ backgroundColor: themePrimary }}
                        animate={{ 
                            opacity: [0.2, 0.4, 0.2],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Animated shine effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    />

                    <div className="relative z-10 flex flex-col items-center gap-2">
                        {/* Badge / Title - Siempre dice OFERTA */}
                        <motion.div 
                            className="text-xs md:text-sm font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg"
                            style={{ 
                                backgroundColor: themePrimary,
                                color: '#000'
                            }}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            🔥 OFERTA
                        </motion.div>

                        {/* Precios - Antes y Después */}
                        {offer?.offerPrice && (
                            <div className="flex flex-col items-center gap-1">
                                {offer?.originalPrice && (
                                    <span className="text-xs text-white/40 line-through font-medium">
                                        {offer.originalPrice}
                                    </span>
                                )}
                                <motion.span 
                                    className="text-lg md:text-2xl font-black text-white"
                                    style={{ color: themePrimary }}
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                >
                                    {offer.offerPrice}
                                </motion.span>
                            </div>
                        )}

                        {/* Countdown Timer - solo mostrar si hay expiresAt */}
                        {offer?.expiresAt && (
                            <>
                                <div className="flex items-center gap-1 text-white bg-white/10 px-3 py-1.5 rounded-lg">
                                    <Clock size={12} className="text-white/60" />
                                    <span className="text-xs md:text-sm font-black tabular-nums">
                                        {timeLeft.days > 0 && `${timeLeft.days}d `}
                                        {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Tap indicator */}
                        <span className="text-[9px] md:text-[10px] text-white/40 font-medium uppercase tracking-widest">
                            Tap →
                        </span>
                    </div>
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
