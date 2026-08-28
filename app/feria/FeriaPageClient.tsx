"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Upload,
    Store,
    User,
    Phone,
    Link2,
    HelpCircle,
    CheckCircle,
    Download,
    Sparkles,
    QrCode,
    ArrowRight,
    Loader2,
    X,
    ImageIcon,
    ArrowLeft,
    Share2,
    Calendar
} from "lucide-react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";

const WA_NUMBER = "593963425323";

export default function FeriaPageClient() {
    const [step, setStep] = useState<"form" | "success">("form");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showGoogleTip, setShowGoogleTip] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [nombreNegocio, setNombreNegocio] = useState("");
    const [nombreRepresentante, setNombreRepresentante] = useState("");
    const [telefonoNegocio, setTelefonoNegocio] = useState("");
    const [googleReviewsUrl, setGoogleReviewsUrl] = useState("");

    // Success data
    const [registeredBusiness, setRegisteredBusiness] = useState<any>(null);

    const qrRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("El logo no debe superar los 5MB.");
            return;
        }
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
        setError(null);
    }, []);

    const uploadLogo = async (): Promise<string | null> => {
        if (!logoFile) return null;
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("slug", "feria-loja-197");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Error al subir el logo.");
        const data = await res.json();
        return data.url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!nombreNegocio.trim()) { setError("El nombre del negocio es obligatorio."); return; }
        if (!nombreRepresentante.trim()) { setError("El nombre del representante es obligatorio."); return; }

        setIsSubmitting(true);
        try {
            let logoUrl: string | null = null;
            if (logoFile) {
                logoUrl = await uploadLogo();
            }

            const res = await fetch("/api/feria/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre_negocio: nombreNegocio.trim(),
                    nombre_representante: nombreRepresentante.trim(),
                    telefono_negocio: telefonoNegocio.trim() || null,
                    logo_url: logoUrl,
                    google_reviews_url: googleReviewsUrl.trim() || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al registrar");

            setRegisteredBusiness(data.negocio);
            setStep("success");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al registrar tu negocio.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadQR = () => {
        const canvas = qrRef.current?.querySelector("canvas");
        if (!canvas) return;

        const padding = 40;
        const textHeight = 70;
        const newCanvas = document.createElement("canvas");
        newCanvas.width = canvas.width + padding * 2;
        newCanvas.height = canvas.height + padding * 2 + textHeight;
        const ctx = newCanvas.getContext("2d");
        if (!ctx) return;

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

        // Draw QR
        ctx.drawImage(canvas, padding, padding);

        // Add text
        ctx.fillStyle = "#0a0a0a";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            `¡Vota por ${registeredBusiness?.nombre_negocio || "nosotros"}!`,
            newCanvas.width / 2,
            canvas.height + padding + 30
        );
        ctx.font = "12px Arial";
        ctx.fillStyle = "#f66739";
        ctx.fillText("Feria de Loja #197 • Escanea y vota por WhatsApp", newCanvas.width / 2, canvas.height + padding + 52);

        const link = document.createElement("a");
        link.download = `QR-Feria-197-${registeredBusiness?.slug || "stand"}.png`;
        link.href = newCanvas.toDataURL("image/png");
        link.click();
    };

    const whatsappUrl = registeredBusiness
        ? `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Feria de Loja #197 - Voto por: ${registeredBusiness.nombre_negocio}`)}`
        : "";

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30 relative overflow-hidden font-sans">
            {/* Header de navegación */}
            <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-semibold">
                        <ArrowLeft size={18} className="text-primary" /> Volver al Inicio
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/60">Edición 197</span>
                    </div>
                </div>
            </nav>

            {/* Glowing background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#001549]/30 rounded-full blur-[140px] pointer-events-none -z-10" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20">
                {/* Badge & Title */}
                <div className="text-center mb-10 md:mb-14">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-5"
                    >
                        <Trophy size={16} className="text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Inscripción Oficial</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-black tracking-tighter leading-tight mb-4"
                    >
                        Inscribe tu Stand en la <br />
                        <span className="text-primary italic">197 Feria de Loja</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/60 text-base md:text-lg max-w-xl mx-auto font-medium"
                    >
                        Llena el formulario con los datos de tu negocio, obtén tu código QR exclusivo y que tus visitantes voten por ti vía WhatsApp.
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    {step === "form" ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="rounded-3xl p-6 md:p-10" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}>
                                    
                                    {/* Logo Upload */}
                                    <div className="mb-8">
                                        <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-3">
                                            <ImageIcon size={14} className="inline mr-2 text-primary" />
                                            Logo del Negocio o Foto del Stand
                                        </label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative group cursor-pointer rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 transition-all duration-300 flex items-center justify-center overflow-hidden bg-white/[0.02]"
                                            style={{ height: logoPreview ? "180px" : "130px" }}
                                        >
                                            {logoPreview ? (
                                                <>
                                                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-4" />
                                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold uppercase tracking-wider">Cambiar imagen</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-6">
                                                    <Upload size={28} className="mx-auto text-white/30 group-hover:text-primary transition-colors mb-2" />
                                                    <p className="text-white/60 text-sm font-semibold">Toca para subir tu logo</p>
                                                    <p className="text-white/30 text-xs mt-1">Formatos PNG, JPG, WEBP (máx. 5MB)</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Business Name */}
                                    <div className="mb-5">
                                        <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                            <Store size={14} className="inline mr-2 text-primary" />
                                            Nombre del Negocio / Stand <span className="text-primary">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={nombreNegocio}
                                            onChange={(e) => setNombreNegocio(e.target.value)}
                                            placeholder="Ej: Artesanías El Lojano"
                                            className="w-full px-5 py-4 rounded-xl text-white text-base font-medium placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                                            required
                                        />
                                    </div>

                                    {/* Representative Name */}
                                    <div className="mb-5">
                                        <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                            <User size={14} className="inline mr-2 text-primary" />
                                            Nombre del Representante o Dueño <span className="text-primary">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={nombreRepresentante}
                                            onChange={(e) => setNombreRepresentante(e.target.value)}
                                            placeholder="Ej: Carmen Valdivieso"
                                            className="w-full px-5 py-4 rounded-xl text-white text-base font-medium placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                                            required
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="mb-5">
                                        <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                            <Phone size={14} className="inline mr-2 text-primary" />
                                            WhatsApp de Contacto del Negocio
                                        </label>
                                        <input
                                            type="tel"
                                            value={telefonoNegocio}
                                            onChange={(e) => setTelefonoNegocio(e.target.value)}
                                            placeholder="Ej: 0963425323"
                                            className="w-full px-5 py-4 rounded-xl text-white text-base font-medium placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                                        />
                                    </div>

                                    {/* Google Reviews URL */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-widest">
                                                <Link2 size={14} className="text-primary" />
                                                Enlace para Calificar en Google Reseñas
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowGoogleTip(!showGoogleTip)}
                                                className="text-primary hover:underline text-xs font-bold flex items-center gap-1"
                                            >
                                                <HelpCircle size={14} /> ¿Cómo obtenerlo?
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {showGoogleTip && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mb-3 overflow-hidden"
                                                >
                                                    <div className="p-4 rounded-2xl text-sm" style={{ background: "rgba(246,103,57,0.08)", border: "1px solid rgba(246,103,57,0.2)" }}>
                                                        <div className="flex items-start gap-2.5">
                                                            <Sparkles size={18} className="text-primary mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-white font-bold mb-2">💡 ¿Cómo sacar el link de Google Reseñas?</p>
                                                                <ol className="text-white/70 space-y-1.5 list-decimal list-inside text-xs leading-relaxed">
                                                                    <li>Abre <strong className="text-white">Google Maps</strong> y busca tu negocio.</li>
                                                                    <li>Toca en <strong className="text-white">"Solicitar reseñas"</strong> o el botón de compartir enlace de opiniones.</li>
                                                                    <li>Pega el enlace en este campo.</li>
                                                                </ol>
                                                                <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-white/5">
                                                                    <p className="text-primary text-xs font-semibold">
                                                                        🤖 También puedes pedirle a ChatGPT: <br />
                                                                        <span className="text-white/80 italic">"¿Cómo obtener el link directo de Google Reseñas para mi negocio [Nombre de tu negocio]?"</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <input
                                            type="url"
                                            value={googleReviewsUrl}
                                            onChange={(e) => setGoogleReviewsUrl(e.target.value)}
                                            placeholder="https://g.page/r/tu-negocio/review"
                                            className="w-full px-5 py-4 rounded-xl text-white text-base font-medium placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                                        />
                                        <p className="text-white/30 text-xs mt-2">
                                            Opcional. Si lo colocas, el bot le enviará tu enlace de reseñas a cada persona que vote por ti.
                                        </p>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="mb-4 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20">
                                            <X size={16} /> {error}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary hover:bg-primary-dark text-white font-black text-lg py-5 rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                                        style={{ boxShadow: "0 12px 40px rgba(246,103,57,0.35)" }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={22} className="animate-spin" />
                                                Generando tu QR Oficial...
                                            </>
                                        ) : (
                                            <>
                                                <QrCode size={22} />
                                                Inscribir Stand y Descargar QR
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="rounded-3xl p-8 md:p-12" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}>
                                
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-green-500/10 border-2 border-green-500/30">
                                    <CheckCircle size={44} className="text-green-400" />
                                </div>

                                <h2 className="text-2xl md:text-4xl font-black text-white mb-2">
                                    ¡Stand Registrado con Éxito!
                                </h2>
                                <p className="text-primary font-bold text-lg mb-1">
                                    {registeredBusiness?.nombre_negocio}
                                </p>
                                <p className="text-white/50 text-sm max-w-md mx-auto mb-8">
                                    Coloca este código QR en tu stand o mesas. Cada escaneo enviará automáticamente el voto a WhatsApp.
                                </p>

                                {/* QR Card */}
                                <div className="inline-block p-6 rounded-3xl bg-white shadow-2xl mb-8" ref={qrRef}>
                                    <QRCodeCanvas
                                        value={whatsappUrl}
                                        size={240}
                                        level="H"
                                        includeMargin={false}
                                        bgColor="#ffffff"
                                        fgColor="#0a0a0a"
                                    />
                                    <div className="mt-3 text-center">
                                        <p className="text-black font-black text-xs uppercase tracking-wider">
                                            {registeredBusiness?.nombre_negocio}
                                        </p>
                                        <p className="text-primary font-bold text-[10px] uppercase tracking-widest mt-0.5">
                                            Feria de Loja 197
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-8">
                                    <button
                                        onClick={downloadQR}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white font-black text-base px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
                                        style={{ boxShadow: "0 10px 40px rgba(246,103,57,0.35)" }}
                                    >
                                        <Download size={20} />
                                        Descargar QR para Imprimir
                                    </button>

                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold text-base px-6 py-4 rounded-2xl border border-white/10 transition-colors"
                                    >
                                        <Share2 size={18} /> Probar Voto
                                    </a>
                                </div>

                                <button
                                    onClick={() => {
                                        setStep("form");
                                        setNombreNegocio("");
                                        setNombreRepresentante("");
                                        setTelefonoNegocio("");
                                        setGoogleReviewsUrl("");
                                        setLogoPreview(null);
                                        setLogoFile(null);
                                        setRegisteredBusiness(null);
                                        setError(null);
                                    }}
                                    className="text-white/40 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                                >
                                    ← Inscribir otro negocio
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
