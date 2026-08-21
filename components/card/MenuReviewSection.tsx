"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { getMenuTranslations } from "@/lib/menuI18n";

interface MenuReviewSectionProps {
    registroId: string | number;
    googleReviewUrl?: string;
    accentColor?: string;
    bgColor?: string;
    lang?: string;
}

export default function MenuReviewSection({
    registroId,
    googleReviewUrl = "#",
    accentColor = "#f66739",
    bgColor,
    lang = "es",
}: MenuReviewSectionProps) {
    const t = getMenuTranslations(lang);

    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerContact, setCustomerContact] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleRatingClick = (rating: number) => {
        setSelectedRating(rating);
        setIsSubmitted(false);
    };

    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRating || !registroId) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/vcard/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registro_id: registroId,
                    rating: selectedRating,
                    comment,
                    customer_name: customerName,
                    customer_contact: customerContact,
                }),
            });

            if (res.ok) {
                setIsSubmitted(true);
            } else {
                alert("Error al enviar tus comentarios. Inténtalo de nuevo.");
            }
        } catch (err) {
            console.error("Error enviando feedback:", err);
            alert("Error de conexión.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section
            className="py-20 md:py-28 px-4 md:px-12 relative overflow-hidden text-white border-t border-white/10 transition-colors duration-500"
            style={{ backgroundColor: bgColor || "#001549" }}
        >
            {/* Ambient Background Glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-15"
                style={{ backgroundColor: accentColor }}
            />

            <div className="max-w-4xl mx-auto relative z-10 text-center">
                {/* Header Badge */}
                <div className="flex items-center gap-4 mb-6 md:mb-8 w-full justify-center">
                    <div
                        className="h-[1px] flex-1 max-w-[100px] opacity-40"
                        style={{ background: `linear-gradient(to right, transparent, ${accentColor})` }}
                    />
                    <span
                        className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-bold"
                        style={{ color: accentColor }}
                    >
                        {t.reviewMotorBadge}
                    </span>
                    <div
                        className="h-[1px] flex-1 max-w-[100px] opacity-40"
                        style={{ background: `linear-gradient(to left, transparent, ${accentColor})` }}
                    />
                </div>

                <h3 className="text-3xl sm:text-4xl md:text-6xl uppercase tracking-tight mb-3 md:mb-4 text-white leading-none font-black drop-shadow-md">
                    {t.reviewTitle}
                </h3>
                <p className="text-xs md:text-sm text-white/60 uppercase tracking-[0.25em] max-w-xl mx-auto mb-10 md:mb-12 font-medium">
                    {t.reviewSubtitle}
                </p>

                {/* Interactive Stars Row */}
                <div className="flex justify-center items-center gap-3 md:gap-6 mb-12">
                    {[1, 2, 3, 4, 5].map((star) => {
                        const active =
                            hoverRating !== null
                                ? star <= hoverRating
                                : selectedRating !== null && star <= selectedRating;
                        return (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingClick(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(null)}
                                className="p-2 transition-all duration-300 hover:scale-125 focus:outline-none group cursor-pointer"
                            >
                                <svg
                                    className="w-10 h-10 md:w-14 md:h-14 transition-all duration-300 fill-current"
                                    viewBox="0 0 20 20"
                                    style={{
                                        color: active ? "#ffc107" : "rgba(255,255,255,0.2)",
                                        filter: active
                                            ? "drop-shadow(0 0 16px rgba(255, 193, 7, 0.7))"
                                            : "none",
                                    }}
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </button>
                        );
                    })}
                </div>

                {/* 5 ESTRELLAS -> Google Reviews Redirect Card */}
                {selectedRating === 5 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="border border-white/15 bg-black/40 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 md:p-14 max-w-2xl mx-auto shadow-2xl space-y-6"
                    >
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-lg"
                            style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
                        >
                            ⭐ 5.0
                        </div>
                        <h4 className="text-2xl sm:text-3xl md:text-4xl text-white uppercase tracking-tight leading-tight font-black">
                            {t.starThanksTitle}
                        </h4>
                        <p className="text-xs md:text-sm text-white/70 uppercase tracking-widest leading-relaxed font-medium">
                            {t.starThanksDesc}
                        </p>
                        <div className="pt-2">
                            <a
                                href={googleReviewUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-sm sm:text-base md:text-lg tracking-[0.15em] uppercase transition-all duration-300 shadow-2xl hover:scale-105 text-white font-black"
                                style={{ backgroundColor: accentColor }}
                            >
                                {t.shareOnGoogleMaps}
                            </a>
                        </div>
                    </motion.div>
                )}

                {/* 1 A 4 ESTRELLAS -> Formulario Interno de Mejora */}
                {selectedRating !== null && selectedRating < 5 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="border border-white/15 bg-black/40 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 md:p-14 max-w-2xl mx-auto shadow-2xl space-y-6 text-left"
                    >
                        {!isSubmitted ? (
                            <form onSubmit={handleSubmitFeedback} className="space-y-6">
                                <div className="text-center space-y-2">
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80 block font-bold">
                                        ★ {selectedRating} / 5
                                    </span>
                                    <h4 className="text-xl sm:text-2xl md:text-4xl text-white uppercase tracking-tight font-black">
                                        {t.improveTitle}
                                    </h4>
                                    <p className="text-xs text-white/60 uppercase tracking-widest max-w-md mx-auto font-medium">
                                        {t.improveSubtitle}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/50 block ml-1">
                                        {t.feedbackLabel}
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder={t.feedbackPlaceholder}
                                        className="w-full bg-black/50 border border-white/15 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-white/40 transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 block ml-1">
                                            {t.nameLabel}
                                        </label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder={t.namePlaceholder}
                                            className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-white/40 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 block ml-1">
                                            {t.contactLabel}
                                        </label>
                                        <input
                                            type="text"
                                            value={customerContact}
                                            onChange={(e) => setCustomerContact(e.target.value)}
                                            placeholder={t.contactPlaceholder}
                                            className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-white/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 sm:py-5 rounded-2xl text-sm sm:text-base md:text-lg tracking-[0.2em] uppercase transition-all duration-300 font-black shadow-2xl text-white hover:brightness-110 disabled:opacity-50 cursor-pointer"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {isSubmitting ? t.sendingFeedback : t.sendFeedback}
                                </button>
                            </form>
                        ) : (
                            <div className="py-8 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl font-black border border-emerald-500/30">
                                    ✓
                                </div>
                                <h4 className="text-2xl sm:text-3xl text-white uppercase tracking-widest font-black">
                                    {t.feedbackSuccessTitle}
                                </h4>
                                <p className="text-xs md:text-sm text-white/70 uppercase tracking-widest leading-relaxed max-w-md mx-auto font-medium">
                                    {t.feedbackSuccessDesc}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
