"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode,
    Upload,
    CheckCircle,
    Store,
    Sparkles,
    ShoppingBag,
    Gift,
    Instagram,
    Link2,
    Download,
    ExternalLink,
    ArrowRight,
    ArrowLeft,
    Plus,
    Trash2,
    Loader2,
    Image as ImageIcon,
    MapPin,
    Trophy,
    X,
    Facebook,
    Flame,
    Zap,
    Globe,
    CheckCircle2,
    ChevronDown
} from "lucide-react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { CATEGORIAS_FERIA } from "@/lib/feriaAgendaData";
import { compressImage } from "@/lib/imageCompress";

interface ProductInput {
    id: string;
    nombre: string;
    precio: string;
    descripcion: string;
    foto_url?: string;
    foto_file?: File | null;
    foto_preview?: string | null;
}

export default function FeriaPageClient() {
    const [step, setStep] = useState<"form" | "success">("form");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Smart Header scroll autohide
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > 80) {
                if (currentScrollY > lastScrollY) {
                    setShowHeader(false); // scrolling down
                } else {
                    setShowHeader(true); // scrolling up
                }
            } else {
                setShowHeader(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    // Images
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [portadaPreview, setPortadaPreview] = useState<string | null>(null);
    const [portadaFile, setPortadaFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [nombreNegocio, setNombreNegocio] = useState("");
    const [nombreRepresentante, setNombreRepresentante] = useState("");
    const [telefonoNegocio, setTelefonoNegocio] = useState("");
    const [numeroStand, setNumeroStand] = useState("");
    const [categoria, setCategoria] = useState("artesanias");
    const [origen, setOrigen] = useState("Loja");
    const [aniosTrayectoria, setAniosTrayectoria] = useState("");
    const [slogan, setSlogan] = useState("");
    const [descripcionHistoria, setDescripcionHistoria] = useState("");
    const [materiales, setMateriales] = useState("");
    const [promocionFeria, setPromocionFeria] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");
    const [facebookUrl, setFacebookUrl] = useState("");
    const [tiktokUrl, setTiktokUrl] = useState("");
    const [googleReviewsUrl, setGoogleReviewsUrl] = useState("");

    // Products list
    const [productos, setProductos] = useState<ProductInput[]>([
        { id: "1", nombre: "", precio: "", descripcion: "" }
    ]);

    // Success data
    const [registeredBusiness, setRegisteredBusiness] = useState<any>(null);

    const qrRef = useRef<HTMLDivElement>(null);
    const formSectionRef = useRef<HTMLDivElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const portadaInputRef = useRef<HTMLInputElement>(null);

    const scrollToForm = () => {
        formSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleLogoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;
        try {
            const file = await compressImage(rawFile, 1200, 0.85);
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
            setError(null);
        } catch (err) {
            console.error("Error procesando logo:", err);
        }
    }, []);

    const handlePortadaChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;
        try {
            const file = await compressImage(rawFile, 1400, 0.80);
            setPortadaFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setPortadaPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
            setError(null);
        } catch (err) {
            console.error("Error procesando portada:", err);
        }
    }, []);

    const handleProductImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;
        try {
            const file = await compressImage(rawFile, 1200, 0.80);
            const reader = new FileReader();
            reader.onload = (ev) => {
                setProductos((prev) => {
                    const copy = [...prev];
                    copy[index].foto_file = file;
                    copy[index].foto_preview = ev.target?.result as string;
                    return copy;
                });
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("Error procesando imagen de producto:", err);
        }
    };

    const addProduct = () => {
        if (productos.length >= 6) return;
        setProductos((prev) => [
            ...prev,
            { id: Date.now().toString(), nombre: "", precio: "", descripcion: "" }
        ]);
    };

    const removeProduct = (index: number) => {
        setProductos((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadImageToBunny = async (file: File): Promise<string> => {
        // Asegurar compresión a WebP antes del envío
        const compressed = await compressImage(file, 1400, 0.80);
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("slug", "feria-loja-197");
        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("Error al subir imagen");
        const data = await res.json();
        return data.url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!nombreNegocio.trim()) {
            setError("El nombre del negocio es obligatorio.");
            return;
        }

        setIsSubmitting(true);

        try {
            let logoUrl: string | null = null;
            let portadaUrl: string | null = null;

            if (logoFile) {
                logoUrl = await uploadImageToBunny(logoFile);
            }
            if (portadaFile) {
                portadaUrl = await uploadImageToBunny(portadaFile);
            }

            const uploadedProducts: any[] = [];
            for (const p of productos) {
                if (p.nombre.trim()) {
                    let pFotoUrl: string | null = null;
                    if (p.foto_file) {
                        pFotoUrl = await uploadImageToBunny(p.foto_file);
                    }
                    uploadedProducts.push({
                        nombre: p.nombre.trim(),
                        precio: p.precio.trim() || null,
                        descripcion: p.descripcion.trim() || null,
                        foto_url: pFotoUrl
                    });
                }
            }

            const res = await fetch("/api/feria/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre_negocio: nombreNegocio.trim(),
                    nombre_representante: nombreRepresentante.trim(),
                    telefono_negocio: telefonoNegocio.trim() || null,
                    numero_stand: numeroStand.trim() || null,
                    categoria,
                    origen: origen.trim() || "Loja",
                    anios_trayectoria: aniosTrayectoria.trim() || null,
                    slogan: slogan.trim() || null,
                    descripcion_historia: descripcionHistoria.trim() || null,
                    materiales_ingredientes: materiales.trim() || null,
                    promocion_feria: promocionFeria.trim() || null,
                    productos_json: uploadedProducts.length > 0 ? uploadedProducts : null,
                    instagram_url: instagramUrl.trim() || null,
                    facebook_url: facebookUrl.trim() || null,
                    tiktok_url: tiktokUrl.trim() || null,
                    logo_url: logoUrl,
                    portada_url: portadaUrl,
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

    const qrTargetUrl = registeredBusiness
        ? (typeof window !== "undefined"
            ? `${window.location.origin}/feria-loja/${registeredBusiness.slug}`
            : `https://activaqr.com/feria-loja/${registeredBusiness.slug}`)
        : "";

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

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        ctx.drawImage(canvas, padding, padding);

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
        ctx.fillText("197ª Feria de Loja • Escanea y vota en 1 clic", newCanvas.width / 2, canvas.height + padding + 52);

        const link = document.createElement("a");
        link.download = `QR-Feria-197-${registeredBusiness?.slug || "negocio"}.png`;
        link.href = newCanvas.toDataURL("image/png");
        link.click();
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30 relative overflow-hidden font-sans pb-24">
            {/* Header de navegación sticky con autohide */}
            <nav className={`border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50 transition-transform duration-300 ${showHeader ? "translate-y-0" : "-translate-y-full"}`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/feria-loja" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-xs sm:text-sm font-semibold">
                        <ArrowLeft size={16} className="text-primary" />
                        <span>Ver Directorio & Votaciones</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/60">
                            197ª Feria de Loja
                        </span>
                    </div>
                </div>
            </nav>

            {/* Glowing Ambient Lights */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/15 rounded-full blur-[160px] pointer-events-none -z-10" />

            {/* ═══════════════════════════════════════════════════ */}
            {/* ═══ HERO SECTION CENTRADO & LIMPIO ═══ */}
            {/* ═══════════════════════════════════════════════════ */}
            <section className="relative pt-12 md:pt-16 pb-12 md:pb-16 px-4 sm:px-6 max-w-3xl mx-auto text-center space-y-6">
                {/* Event Pill */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(246,103,57,0.2)]"
                >
                    <Trophy size={15} className="text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-primary">
                        Inscripción Oficial de Negocios • 197ª Feria
                    </span>
                </motion.div>

                {/* Main Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight"
                >
                    Crea la Página Web de tu Negocio
                </motion.h1>

                {/* Subtitle Reducido y Conciso */}
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/70 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed"
                >
                    Crea tu página oficial en 1 minuto, descarga tu código QR para tus mesas o mostrador y recibe votos de miles de visitantes.
                </motion.p>

                {/* Value Pills Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 max-w-2xl mx-auto"
                >
                    <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                        <Zap size={15} className="text-primary shrink-0" />
                        <span className="text-xs font-bold text-white/90">Voto en 1 Clic</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                        <QrCode size={15} className="text-sky shrink-0" />
                        <span className="text-xs font-bold text-white/90">QR Listo en HD</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                        <ShoppingBag size={15} className="text-green-400 shrink-0" />
                        <span className="text-xs font-bold text-white/90">Catálogo con Fotos</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                        <Globe size={15} className="text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-white/90">Google Reseñas</span>
                    </div>
                </motion.div>

                {/* CTA Scroll Button */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="pt-2"
                >
                    <button
                        onClick={scrollToForm}
                        className="inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-dark text-white font-black text-sm px-8 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105"
                        style={{ boxShadow: "0 10px 30px rgba(246,103,57,0.4)" }}
                    >
                        <span>Comenzar Registro Gratis</span>
                        <ChevronDown size={18} className="animate-bounce" />
                    </button>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════════════ */}
            {/* ═══ FORMULARIO DE REGISTRO ENRIQUECIDO ═══ */}
            {/* ═══════════════════════════════════════════════════ */}
            <div ref={formSectionRef} className="max-w-3xl mx-auto px-4 sm:px-6">
                <AnimatePresence mode="wait">
                    {step === "form" ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* ═══ SECCIÓN 1: FOTOS & IDENTIDAD VISUAL ═══ */}
                                <div className="rounded-3xl p-6 md:p-8 bg-white/[0.03] border border-white/10 space-y-5 backdrop-blur-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                                        <ImageIcon size={18} className="text-primary" />
                                        <h3 className="font-black text-lg text-white">1. Fotos & Identidad de tu Negocio</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Logo Uploader */}
                                        <div>
                                            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                                Logo o Foto de Perfil
                                            </label>
                                            <div
                                                onClick={() => logoInputRef.current?.click()}
                                                className="relative group cursor-pointer rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 transition-all flex items-center justify-center overflow-hidden bg-white/[0.02]"
                                                style={{ height: "130px" }}
                                            >
                                                {logoPreview ? (
                                                    <>
                                                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-3" />
                                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold uppercase">Cambiar</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <Upload size={22} className="mx-auto text-white/30 group-hover:text-primary mb-1" />
                                                        <p className="text-white/60 text-xs font-bold">Subir Logo / Avatar</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                        </div>

                                        {/* Portada / Banner Uploader */}
                                        <div>
                                            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                                Foto Panorámica del Local o Stand
                                            </label>
                                            <div
                                                onClick={() => portadaInputRef.current?.click()}
                                                className="relative group cursor-pointer rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 transition-all flex items-center justify-center overflow-hidden bg-white/[0.02]"
                                                style={{ height: "130px" }}
                                            >
                                                {portadaPreview ? (
                                                    <>
                                                        <img src={portadaPreview} alt="Portada" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold uppercase">Cambiar Portada</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <ImageIcon size={22} className="mx-auto text-white/30 group-hover:text-primary mb-1" />
                                                        <p className="text-white/60 text-xs font-bold">Foto de Portada / Banner</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input ref={portadaInputRef} type="file" accept="image/*" onChange={handlePortadaChange} className="hidden" />
                                        </div>
                                    </div>
                                </div>

                                {/* ═══ SECCIÓN 2: DATOS DEL NEGOCIO ═══ */}
                                <div className="rounded-3xl p-6 md:p-8 bg-white/[0.03] border border-white/10 space-y-5 backdrop-blur-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                                        <Store size={18} className="text-primary" />
                                        <h3 className="font-black text-lg text-white">2. Datos del Negocio</h3>
                                    </div>

                                    <div>
                                        <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                            Nombre del Negocio / Marca <span className="text-primary">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={nombreNegocio}
                                            onChange={(e) => setNombreNegocio(e.target.value)}
                                            placeholder="Ej: Café Don Pedro Lojano"
                                            className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                            Slogan o Frase de Impacto
                                        </label>
                                        <input
                                            type="text"
                                            value={slogan}
                                            onChange={(e) => setSlogan(e.target.value)}
                                            placeholder="Ej: El auténtico sabor del café de especialidad de Vilcabamba"
                                            className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                                <MapPin size={13} className="inline mr-1 text-primary" />
                                                N° de Stand o Ubicación (Opcional)
                                            </label>
                                            <input
                                                type="text"
                                                value={numeroStand}
                                                onChange={(e) => setNumeroStand(e.target.value)}
                                                placeholder="Ej: Stand 42, Pabellón A"
                                                className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                                Categoría
                                            </label>
                                            <select
                                                value={categoria}
                                                onChange={(e) => setCategoria(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl text-white text-sm bg-[#15151f] border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                {CATEGORIAS_FERIA.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                                Nombre del Emprendedor / Representante
                                            </label>
                                            <input
                                                type="text"
                                                value={nombreRepresentante}
                                                onChange={(e) => setNombreRepresentante(e.target.value)}
                                                placeholder="Ej: Pedro Valdivieso"
                                                className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                                WhatsApp de Contacto / Ventas
                                            </label>
                                            <input
                                                type="tel"
                                                value={telefonoNegocio}
                                                onChange={(e) => setTelefonoNegocio(e.target.value)}
                                                placeholder="Ej: 0991234567"
                                                className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ═══ SECCIÓN 3: HISTORIA & OFICIO ═══ */}
                                <div className="rounded-3xl p-6 md:p-8 bg-white/[0.03] border border-white/10 space-y-4 backdrop-blur-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                                        <Sparkles size={18} className="text-primary" />
                                        <h3 className="font-black text-lg text-white">3. Historia & Oficio</h3>
                                    </div>

                                    <div>
                                        <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                            Historia de la Marca & Elaboración (Opcional)
                                        </label>
                                        <textarea
                                            value={descripcionHistoria}
                                            onChange={(e) => setDescripcionHistoria(e.target.value)}
                                            rows={3}
                                            placeholder="Describe tu oficio: cómo nació tu emprendimiento y qué experiencia ofreces..."
                                            className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>

                                {/* ═══ SECCIÓN 4: MINI CATÁLOGO DE PRODUCTOS ═══ */}
                                <div className="rounded-3xl p-6 md:p-8 bg-white/[0.03] border border-white/10 space-y-5 backdrop-blur-xl">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag size={18} className="text-primary" />
                                            <h3 className="font-black text-lg text-white">4. Productos Destacados (Top 3)</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addProduct}
                                            disabled={productos.length >= 3}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold transition-all disabled:opacity-30"
                                        >
                                            <Plus size={14} /> Añadir
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {productos.map((prod, idx) => (
                                            <div key={prod.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative flex flex-col gap-3">
                                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                                    <label className="w-16 h-16 rounded-xl bg-white/5 border border-dashed border-white/15 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden relative group">
                                                        {prod.foto_preview ? (
                                                            <img src={prod.foto_preview} alt="Prod" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-center p-1">
                                                                <Upload size={14} className="mx-auto text-white/30 mb-0.5" />
                                                                <span className="text-[10px] text-white/40 block">Foto</span>
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleProductImageChange(idx, e)}
                                                            className="hidden"
                                                        />
                                                    </label>

                                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                                                        <input
                                                            type="text"
                                                            value={prod.nombre}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setProductos((prev) => { const copy = [...prev]; copy[idx].nombre = val; return copy; });
                                                            }}
                                                            placeholder="Nombre del producto..."
                                                            className="sm:col-span-2 px-3.5 py-2 rounded-xl text-white text-xs bg-white/5 border border-white/10"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={prod.precio}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setProductos((prev) => { const copy = [...prev]; copy[idx].precio = val; return copy; });
                                                            }}
                                                            placeholder="Precio (Ej: 12.50)"
                                                            className="px-3.5 py-2 rounded-xl text-white text-xs bg-white/5 border border-white/10"
                                                        />
                                                    </div>

                                                    {productos.length > 1 && (
                                                        <button type="button" onClick={() => removeProduct(idx)} className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors self-start sm:self-center">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={prod.descripcion}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setProductos((prev) => { const copy = [...prev]; copy[idx].descripcion = val; return copy; });
                                                    }}
                                                    placeholder="Descripción breve del producto..."
                                                    className="w-full px-3.5 py-2 rounded-xl text-white text-xs bg-white/5 border border-white/10"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ═══ SECCIÓN 5: PROMO & REDES ═══ */}
                                <div className="rounded-3xl p-6 md:p-8 bg-white/[0.03] border border-white/10 space-y-4 backdrop-blur-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                                        <Gift size={18} className="text-primary" />
                                        <h3 className="font-black text-lg text-white">5. Promoción & Redes Sociales</h3>
                                    </div>

                                    <div>
                                        <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                            Promoción o Descuento de Feria (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={promocionFeria}
                                            onChange={(e) => setPromocionFeria(e.target.value)}
                                            placeholder="Ej: 15% de descuento mencionando ActivaQR en el stand"
                                            className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                                <Instagram size={13} className="inline mr-1 text-primary" />
                                                Instagram
                                            </label>
                                            <input
                                                type="text"
                                                value={instagramUrl}
                                                onChange={(e) => setInstagramUrl(e.target.value)}
                                                placeholder="https://instagram.com/tu-marca"
                                                className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                                <Facebook size={13} className="inline mr-1 text-primary" />
                                                Facebook
                                            </label>
                                            <input
                                                type="text"
                                                value={facebookUrl}
                                                onChange={(e) => setFacebookUrl(e.target.value)}
                                                placeholder="https://facebook.com/tu-pagina"
                                                className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                                <span className="text-[11px] font-black mr-1">🎵</span>
                                                TikTok
                                            </label>
                                            <input
                                                type="text"
                                                value={tiktokUrl}
                                                onChange={(e) => setTiktokUrl(e.target.value)}
                                                placeholder="https://tiktok.com/@tu-usuario"
                                                className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
                                                <Link2 size={13} className="inline mr-1 text-primary" />
                                                Link de Google Reseñas
                                            </label>
                                            <input
                                                type="url"
                                                value={googleReviewsUrl}
                                                onChange={(e) => setGoogleReviewsUrl(e.target.value)}
                                                placeholder="https://g.page/r/..."
                                                className="w-full px-4 py-3 rounded-xl text-white text-sm bg-white/[0.05] border border-white/10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl text-xs font-semibold flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20">
                                        <X size={16} /> {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary hover:bg-primary-dark text-white font-black text-base md:text-lg py-4.5 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.01]"
                                    style={{ boxShadow: "0 12px 40px rgba(246,103,57,0.45)" }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={22} className="animate-spin" />
                                            Creando Landing Page & Generando QR...
                                        </>
                                    ) : (
                                        <>
                                            <QrCode size={22} />
                                            Crear Landing Oficial y Descargar QR
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6"
                        >
                            <div className="rounded-3xl p-8 md:p-12 bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-green-500/10 border-2 border-green-500/30">
                                    <CheckCircle size={44} className="text-green-400" />
                                </div>

                                <h2 className="text-2xl md:text-4xl font-black text-white mb-2">
                                    ¡Página Web Creada con Éxito!
                                </h2>
                                <p className="text-primary font-bold text-lg mb-1">
                                    {registeredBusiness?.nombre_negocio}
                                </p>
                                <p className="text-white/50 text-sm max-w-md mx-auto mb-8">
                                    Tu QR oficial apunta a tu página web. Al escanearlo, tus clientes podrán ver tus productos, fotos y votar en 1 clic.
                                </p>

                                {/* QR Card */}
                                <div className="inline-block p-6 rounded-3xl bg-white shadow-2xl mb-8" ref={qrRef}>
                                    <QRCodeCanvas
                                        value={qrTargetUrl}
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
                                            197ª Feria de Loja • Vota en 1 Clic
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-8">
                                    <button
                                        onClick={downloadQR}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white font-black text-base px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105"
                                        style={{ boxShadow: "0 10px 40px rgba(246,103,57,0.35)" }}
                                    >
                                        <Download size={20} />
                                        Descargar QR para Imprimir
                                    </button>

                                    <Link
                                        href={`/feria-loja/${registeredBusiness?.slug}`}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold text-base px-6 py-4 rounded-2xl border border-white/10 transition-colors"
                                    >
                                        <ExternalLink size={18} /> Ver mi Página Web
                                    </Link>
                                </div>

                                <button
                                    onClick={() => {
                                        setStep("form");
                                        setNombreNegocio("");
                                        setNombreRepresentante("");
                                        setTelefonoNegocio("");
                                        setNumeroStand("");
                                        setSlogan("");
                                        setDescripcionHistoria("");
                                        setMateriales("");
                                        setPromocionFeria("");
                                        setGoogleReviewsUrl("");
                                        setLogoPreview(null);
                                        setLogoFile(null);
                                        setPortadaPreview(null);
                                        setPortadaFile(null);
                                        setProductos([{ id: "1", nombre: "", precio: "", descripcion: "" }]);
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
