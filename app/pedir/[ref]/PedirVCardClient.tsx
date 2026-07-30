"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Briefcase,
    Smartphone,
    CheckCircle,
    Loader2,
    Globe,
    Instagram,
    Linkedin,
    Facebook,
    Upload,
    ArrowRight,
    ArrowLeft,
    Check,
    Sparkles,
    Youtube,
    MapPin,
    FileText,
    X,
    Link2,
    ShoppingBag,
    Tag,
    Camera,
    ClipboardList,
    BadgeCheck,
} from "lucide-react";
import { formatPhoneEcuador } from "@/lib/utils";

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface PedirVCardClientProps {
    refCode: string | null;
}

// ─── Etiquetas por industria ────────────────────────────────────────────────
const INDUSTRY_TAGS: Record<string, string[]> = {
    carpintero: ["Carpintería", "Muebles", "Madera", "Reparaciones", "Diseño"],
    plomero: ["Plomería", "Tubería", "Agua", "Goteras", "Filtración", "Fontanero"],
    electricista: ["Electricidad", "Luces", "Cables", "Cortocircuito", "Instalaciones"],
    enfermera: ["Enfermería", "Cuidado", "Salud", "Adultos", "Niños", "Curaciones"],
    enfermero: ["Enfermería", "Cuidado", "Salud", "Adultos", "Niños", "Curaciones"],
    pastelero: ["Pastelería", "Tortas", "Dulces", "Eventos", "Fiestas", "Repostería"],
    pastelera: ["Pastelería", "Tortas", "Dulces", "Eventos", "Fiestas", "Repostería"],
    tecnico: ["Reparaciones", "Servicio Técnico", "Mantenimiento", "Soporte"],
    abogado: ["Legal", "Juicios", "Asesoría", "Derecho"],
    doctor: ["Salud", "Medicina", "Consulta", "Médico"],
    odontologo: ["Dientes", "Salud Bucal", "Dentista", "Limpieza"],
    veterinario: ["Veterinaria", "Mascotas", "Animales", "Salud Animal"],
    arquitecto: ["Arquitectura", "Diseño", "Construcción", "Planos"],
    contador: ["Contabilidad", "Impuestos", "Finanzas", "Auditoría"],
    chef: ["Gastronomía", "Cocina", "Comida", "Restaurante", "Catering"],
};

const normalizeText = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// ─── Pasos del formulario ───────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: "Datos", icon: User },
    { id: 2, label: "Perfil", icon: Briefcase },
    { id: 3, label: "Redes", icon: Globe },
    { id: 4, label: "Revisar", icon: ClipboardList },
];

// ─── Componente principal ───────────────────────────────────────────────────
export default function PedirVCardClient({ refCode }: PedirVCardClientProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [generatedSlug, setGeneratedSlug] = useState("");

    // Resolución de seller desde refCode
    const [resolvedSellerId, setResolvedSellerId] = useState<number | null>(null);
    const [sellerName, setSellerName] = useState<string | null>(null);
    const [sellerResolved, setSellerResolved] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        tipo_perfil: "persona" as "persona" | "negocio",
        nombres: "",
        apellidos: "",
        nombre_negocio: "",
        contacto_nombre: "",
        contacto_apellido: "",
        whatsapp: "",
        email: "",
        profession: "",
        company: "",
        bio: "",
        productos_servicios: "",
        etiquetas: "",
        address: "",
        google_business: "",
        menu_digital: "",
        linkedin: "",
        tiktok: "",
        youtube: "",
        x: "",
        instagram: "",
        facebook: "",
        web: "",
        photo: null as File | null,
    });

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [hasManualTags, setHasManualTags] = useState(false);

    // Helper para normalizar URLs de redes sociales
    const normalizeSocialLink = (val: string | null | undefined, domain?: string): string | null => {
        if (!val) return null;
        let trimmed = val.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        const cleanUser = trimmed.replace(/^@/, "");
        if (domain && !cleanUser.includes(domain)) {
            return `https://${domain}/${cleanUser}`;
        }
        return `https://${cleanUser}`;
    };

    // ── Resolver seller desde ref ───────────────────────────────────────────
    useEffect(() => {
        const codeToValidate = (!refCode || refCode === "general") ? "007" : refCode;
        
        fetch(`/api/vcard/validate-seller?code=${encodeURIComponent(codeToValidate)}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    setResolvedSellerId(data.id);
                    setSellerName(data.nombre);
                }
            })
            .catch(() => {})
            .finally(() => setSellerResolved(true));
    }, [refCode]);

    // ── Auto-etiquetas por profesión ────────────────────────────────────────
    useEffect(() => {
        if (!hasManualTags) {
            const profNorm = normalizeText(formData.profession);
            const key = Object.keys(INDUSTRY_TAGS).find((k) =>
                profNorm.includes(normalizeText(k))
            );
            if (key) {
                setFormData((prev) => ({
                    ...prev,
                    etiquetas: INDUSTRY_TAGS[key!].join(", "),
                }));
            }
        }
    }, [formData.profession, hasManualTags]);

    // ── Generar etiquetas con IA ────────────────────────────────────────────
    const generateWithAI = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!formData.profession) {
            alert("Por favor ingresa tu profesión primero.");
            return;
        }
        setIsGeneratingTags(true);
        try {
            const response = await fetch("/api/generate-tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company: formData.company || (formData.tipo_perfil === "negocio" ? formData.nombre_negocio : ""),
                    profession: formData.profession,
                    bio: formData.bio,
                    products: formData.productos_servicios,
                    plan: "digital",
                }),
            });
            const data = await response.json();
            if (data.tags) {
                setFormData((prev) => ({ ...prev, etiquetas: data.tags }));
                setHasManualTags(true);
            }
        } catch (err) {
            console.error("Error generating tags:", err);
        } finally {
            setIsGeneratingTags(false);
        }
    };

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData((prev) => ({ ...prev, photo: file }));
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const copy = { ...prev };
                delete copy[field];
                return copy;
            });
        }
    };

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (formData.tipo_perfil === "persona") {
            if (!formData.nombres.trim()) newErrors.nombres = "El nombre es obligatorio";
            if (!formData.apellidos.trim()) newErrors.apellidos = "El apellido es obligatorio";
        } else {
            if (!formData.nombre_negocio.trim())
                newErrors.nombre_negocio = "El nombre comercial es obligatorio";
        }
        if (!formData.whatsapp.trim()) {
            newErrors.whatsapp = "El WhatsApp es obligatorio";
        } else if (formData.whatsapp.replace(/\D/g, "").length < 9) {
            newErrors.whatsapp = "El número no parece válido";
        }
        if (!formData.email.trim()) {
            newErrors.email = "El correo electrónico es obligatorio";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "El formato de correo no es válido";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (step === 1 && !validateStep1()) return;
        setStep((prev) => Math.min(prev + 1, 4));
    };

    const prevStep = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setStep((prev) => Math.max(prev - 1, 1));
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let photoUrl: string | null = null;

            // Subir foto si fue proporcionada (opcional)
            if (formData.photo) {
                const uploadFormData = new FormData();
                uploadFormData.append("file", formData.photo);
                const tempSlug = `pedir-${Date.now()}`;
                uploadFormData.append("slug", tempSlug);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    photoUrl = uploadData.url;
                }
            }

            const finalNombre =
                formData.tipo_perfil === "negocio"
                    ? formData.nombre_negocio
                    : `${formData.nombres} ${formData.apellidos}`;

            const cleanName = finalNombre
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");
            const slug = `${cleanName}-${Math.random().toString(36).substring(2, 6)}`;

            const payload = {
                tipo_perfil: formData.tipo_perfil,
                nombres: formData.tipo_perfil === "persona" ? formData.nombres : null,
                apellidos: formData.tipo_perfil === "persona" ? formData.apellidos : null,
                nombre_negocio: formData.tipo_perfil === "negocio" ? formData.nombre_negocio : null,
                contacto_nombre: formData.tipo_perfil === "negocio" ? formData.contacto_nombre : null,
                contacto_apellido: formData.tipo_perfil === "negocio" ? formData.contacto_apellido : null,
                nombre: finalNombre,
                email: formData.email,
                whatsapp: formatPhoneEcuador(formData.whatsapp),
                profesion: formData.profession || null,
                empresa: formData.company || null,
                bio: formData.bio || null,
                direccion: formData.address || null,
                productos_servicios: formData.productos_servicios || null,
                etiquetas: formData.etiquetas || null,
                web: normalizeSocialLink(formData.web),
                google_business: normalizeSocialLink(formData.google_business),
                instagram: normalizeSocialLink(formData.instagram, "instagram.com"),
                linkedin: normalizeSocialLink(formData.linkedin, "linkedin.com"),
                facebook: normalizeSocialLink(formData.facebook, "facebook.com"),
                tiktok: normalizeSocialLink(formData.tiktok, "tiktok.com"),
                youtube: normalizeSocialLink(formData.youtube, "youtube.com"),
                x: normalizeSocialLink(formData.x, "x.com"),
                menu_digital: formData.menu_digital || null,

                // Campos forzados para este formulario
                plan: "digital",
                status: "pendiente",          // ← SIEMPRE pendiente hasta confirmar pago
                payment_method: "por_confirmar",
                template_id: "classic",
                foto_url: photoUrl,
                slug: slug,
                seller_id: resolvedSellerId || null,  // ← del ref de la URL
            };

            const response = await fetch("/api/vcard/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al registrar el contacto");
            }

            setGeneratedSlug(slug);
            setIsSuccess(true);
        } catch (err: any) {
            alert(`Error: ${err.message || "Ocurrió un error inesperado"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Pantalla de éxito ────────────────────────────────────────────────────
    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-24 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="w-24 h-24 rounded-full bg-[#f66739]/10 border-2 border-[#f66739]/30 flex items-center justify-center">
                        <BadgeCheck className="w-12 h-12 text-[#f66739]" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                        ¡Pedido{" "}
                        <span className="text-[#f66739]">Recibido!</span>
                    </h1>
                    <p className="text-white/70 text-lg leading-relaxed max-w-md">
                        Tu información ha sido registrada correctamente. En cuanto confirmemos tu pago, activaremos tu <strong className="text-white">Contacto Profesional Digital</strong> y te lo enviaremos por correo.
                    </p>

                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3">
                        <p className="text-xs uppercase tracking-widest text-white/40 font-bold">¿Qué sigue?</p>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#f66739]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[#f66739] text-xs font-black">1</span>
                            </div>
                            <p className="text-white/70 text-sm">Realiza el pago de <strong className="text-white">$35</strong> según las instrucciones de tu asesor ActivaQR.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#f66739]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[#f66739] text-xs font-black">2</span>
                            </div>
                            <p className="text-white/70 text-sm">Envianos el comprobante por WhatsApp para confirmar.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#f66739]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[#f66739] text-xs font-black">3</span>
                            </div>
                            <p className="text-white/70 text-sm">Recibirás en tu correo tu <strong className="text-white">Contacto Digital + QR</strong> listo para compartir.</p>
                        </div>
                    </div>

                    <a
                        href="https://wa.me/593963425323"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#20BD5A] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Enviar comprobante por WhatsApp
                    </a>
                </motion.div>
            </div>
        );
    }

    // ── Render principal ────────────────────────────────────────────────────
    return (
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
            {/* Header */}
            <div className="text-center mb-10">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-[#f66739]/10 text-[#f66739] border border-[#f66739]/20 mb-5">
                    <Sparkles className="w-3.5 h-3.5" /> Contacto Digital · $35
                </span>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
                    Crea tu{" "}
                    <span className="text-[#f66739]">Contacto Profesional</span>
                </h1>
                <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto">
                    Llena el formulario con tu información. Una vez confirmado el pago, activamos tu contacto digital en minutos.
                </p>

                {/* Badge de vendedor ref */}
                {sellerResolved && sellerName && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60">
                        <BadgeCheck className="w-4 h-4 text-[#f66739]" />
                        Asesor: <span className="text-white font-semibold">{sellerName}</span>
                        <span className="text-white/30">· {refCode}</span>
                    </div>
                )}
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-0 mb-10">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const isActive = step === s.id;
                    const isDone = step > s.id;
                    return (
                        <div key={s.id} className="flex items-center">
                            <div className="flex flex-col items-center gap-1">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                                        isDone
                                            ? "bg-[#f66739] border-[#f66739]"
                                            : isActive
                                            ? "bg-[#f66739]/15 border-[#f66739]"
                                            : "bg-white/5 border-white/15"
                                    }`}
                                >
                                    {isDone ? (
                                        <Check className="w-4 h-4 text-white" />
                                    ) : (
                                        <Icon
                                            className={`w-4 h-4 ${isActive ? "text-[#f66739]" : "text-white/30"}`}
                                        />
                                    )}
                                </div>
                                <span
                                    className={`text-xs font-semibold hidden sm:block ${
                                        isActive ? "text-[#f66739]" : isDone ? "text-white/60" : "text-white/25"
                                    }`}
                                >
                                    {s.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div
                                    className={`h-0.5 w-12 sm:w-20 mx-1 transition-all duration-500 ${
                                        step > s.id ? "bg-[#f66739]" : "bg-white/10"
                                    }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Card contenedor */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-10">
                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                        {/* ─── PASO 1: Datos de contacto ─────────────────── */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-xl font-black mb-1">Datos de contacto</h2>
                                    <p className="text-white/50 text-sm">Tu información básica para el contacto digital.</p>
                                </div>

                                {/* Tipo de perfil */}
                                <div className="flex rounded-xl overflow-hidden border border-white/10">
                                    {(["persona", "negocio"] as const).map((tipo) => (
                                        <button
                                            key={tipo}
                                            type="button"
                                            onClick={() => updateField("tipo_perfil", tipo)}
                                            className={`flex-1 py-3 text-sm font-bold capitalize transition-all ${
                                                formData.tipo_perfil === tipo
                                                    ? "bg-[#f66739] text-white"
                                                    : "bg-white/5 text-white/50 hover:bg-white/10"
                                            }`}
                                        >
                                            {tipo === "persona" ? "👤 Persona / Profesional" : "🏢 Negocio / Empresa"}
                                        </button>
                                    ))}
                                </div>

                                {formData.tipo_perfil === "persona" ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                                Nombre(s) *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nombres}
                                                onChange={(e) => updateField("nombres", e.target.value)}
                                                placeholder="Juan Carlos"
                                                className={`w-full bg-white/5 border ${errors.nombres ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors`}
                                            />
                                            {errors.nombres && (
                                                <p className="text-red-400 text-xs mt-1">{errors.nombres}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                                Apellido(s) *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.apellidos}
                                                onChange={(e) => updateField("apellidos", e.target.value)}
                                                placeholder="Pérez Morales"
                                                className={`w-full bg-white/5 border ${errors.apellidos ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors`}
                                            />
                                            {errors.apellidos && (
                                                <p className="text-red-400 text-xs mt-1">{errors.apellidos}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                                Nombre del Negocio / Empresa *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nombre_negocio}
                                                onChange={(e) => updateField("nombre_negocio", e.target.value)}
                                                placeholder="Ferretería El Maestro"
                                                className={`w-full bg-white/5 border ${errors.nombre_negocio ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors`}
                                            />
                                            {errors.nombre_negocio && (
                                                <p className="text-red-400 text-xs mt-1">{errors.nombre_negocio}</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                                    Nombre del contacto
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.contacto_nombre}
                                                    onChange={(e) => updateField("contacto_nombre", e.target.value)}
                                                    placeholder="María"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                                    Apellido del contacto
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.contacto_apellido}
                                                    onChange={(e) => updateField("contacto_apellido", e.target.value)}
                                                    placeholder="García"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* WhatsApp */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                        WhatsApp *
                                    </label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="tel"
                                            value={formData.whatsapp}
                                            onChange={(e) => updateField("whatsapp", e.target.value)}
                                            placeholder="0987654321"
                                            className={`w-full bg-white/5 border ${errors.whatsapp ? "border-red-500" : "border-white/10"} rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors`}
                                        />
                                    </div>
                                    {errors.whatsapp && (
                                        <p className="text-red-400 text-xs mt-1">{errors.whatsapp}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                        Correo electrónico *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateField("email", e.target.value)}
                                        placeholder="tu@correo.com"
                                        className={`w-full bg-white/5 border ${errors.email ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors`}
                                    />
                                    {errors.email && (
                                        <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                                    )}
                                </div>

                                {/* Foto — OPCIONAL */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                        Foto de perfil / Logo{" "}
                                        <span className="text-white/30 normal-case font-normal">(opcional, puedes agregarla después)</span>
                                    </label>
                                    {photoPreview ? (
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={photoPreview}
                                                alt="Preview"
                                                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#f66739]/30"
                                            />
                                            <div className="flex flex-col gap-2">
                                                <span className="text-white/60 text-sm">Foto seleccionada ✓</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPhotoPreview(null);
                                                        updateField("photo", null);
                                                    }}
                                                    className="text-xs text-red-400 flex items-center gap-1 hover:text-red-300"
                                                >
                                                    <X className="w-3 h-3" /> Quitar foto
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-white/15 cursor-pointer hover:border-[#f66739]/30 hover:bg-white/5 transition-all">
                                            <Camera className="w-5 h-5 text-white/30" />
                                            <span className="text-white/40 text-sm">Subir foto o logo (JPG, PNG)</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ─── PASO 2: Perfil profesional ────────────────── */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-5"
                            >
                                <div>
                                    <h2 className="text-xl font-black mb-1">Perfil profesional</h2>
                                    <p className="text-white/50 text-sm">Cuéntanos qué haces. Estos datos aparecerán en tu contacto digital.</p>
                                </div>

                                {/* Profesión */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                        Profesión / Oficio
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.profession}
                                        onChange={(e) => updateField("profession", e.target.value)}
                                        placeholder="Electricista, Abogada, Diseñadora..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors"
                                    />
                                </div>

                                {/* Empresa (solo persona) */}
                                {formData.tipo_perfil === "persona" && (
                                    <div>
                                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                            Empresa donde trabajas (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => updateField("company", e.target.value)}
                                            placeholder="Nombre de la empresa"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors"
                                        />
                                    </div>
                                )}

                                {/* Bio */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                        Descripción / Bio
                                    </label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => updateField("bio", e.target.value)}
                                        placeholder="Cuéntale a tus clientes quién eres y qué haces. Ej: 10 años de experiencia en reparaciones eléctricas residenciales y comerciales..."
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors resize-none"
                                    />
                                </div>

                                {/* Productos / Servicios */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                        Productos / Servicios que ofreces
                                    </label>
                                    <textarea
                                        value={formData.productos_servicios}
                                        onChange={(e) => updateField("productos_servicios", e.target.value)}
                                        placeholder="Ej: Instalaciones eléctricas, Revisión de tableros, Mantenimiento preventivo..."
                                        rows={2}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors resize-none"
                                    />
                                </div>

                                {/* Etiquetas */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                                            Etiquetas SEO
                                        </label>
                                        <button
                                            type="button"
                                            onClick={generateWithAI}
                                            disabled={isGeneratingTags}
                                            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-[#f66739]/10 text-[#f66739] border border-[#f66739]/20 hover:bg-[#f66739]/20 transition-all disabled:opacity-50"
                                        >
                                            {isGeneratingTags ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            Generar con IA
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.etiquetas}
                                        onChange={(e) => {
                                            updateField("etiquetas", e.target.value);
                                            setHasManualTags(true);
                                        }}
                                        placeholder="Electricidad, Instalaciones, Emergencias, Quito..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors"
                                    />
                                    <p className="text-white/30 text-xs mt-1">Separadas por coma. Ayudan a que te encuentren en Google.</p>
                                </div>

                                {/* Dirección */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                        <MapPin className="inline w-3.5 h-3.5 mr-1" />
                                        Dirección / Ciudad
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => updateField("address", e.target.value)}
                                        placeholder="Quito, Ecuador"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors"
                                    />
                                </div>

                                {/* Google Business */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                        Link de Google Business (opcional)
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.google_business}
                                        onChange={(e) => updateField("google_business", e.target.value)}
                                        placeholder="https://maps.google.com/..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors"
                                    />
                                </div>

                                {/* Web */}
                                <div>
                                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                        <Link2 className="inline w-3.5 h-3.5 mr-1" />
                                        Sitio Web (opcional)
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.web}
                                        onChange={(e) => updateField("web", e.target.value)}
                                        placeholder="https://www.tuempresa.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* ─── PASO 3: Redes sociales ─────────────────────── */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-5"
                            >
                                <div>
                                    <h2 className="text-xl font-black mb-1">Redes sociales</h2>
                                    <p className="text-white/50 text-sm">Agrega los enlaces de tus redes. Todos son opcionales.</p>
                                </div>

                                {[
                                    { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/tu_usuario" },
                                    { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/tu_pagina" },
                                    { key: "tiktok", label: "TikTok", icon: FileText, placeholder: "https://tiktok.com/@tu_usuario" },
                                    { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/tu_perfil" },
                                    { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@tucanal" },
                                    { key: "x", label: "X / Twitter", icon: X, placeholder: "https://x.com/tu_usuario" },
                                ].map(({ key, label, icon: Icon, placeholder }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                                            <Icon className="inline w-3.5 h-3.5 mr-1" />
                                            {label}
                                        </label>
                                        <input
                                            type="url"
                                            value={(formData as any)[key]}
                                            onChange={(e) => updateField(key, e.target.value)}
                                            placeholder={placeholder}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#f66739]/50 transition-colors"
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* ─── PASO 4: Revisión y envío ───────────────────── */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-xl font-black mb-1">Revisa tu información</h2>
                                    <p className="text-white/50 text-sm">Confirma que todo está correcto antes de enviar tu pedido.</p>
                                </div>

                                {/* Resumen */}
                                <div className="space-y-3">
                                    {[
                                        {
                                            label: "Nombre",
                                            value:
                                                formData.tipo_perfil === "negocio"
                                                    ? formData.nombre_negocio
                                                    : `${formData.nombres} ${formData.apellidos}`,
                                            icon: User,
                                        },
                                        { label: "WhatsApp", value: formData.whatsapp, icon: Smartphone },
                                        { label: "Email", value: formData.email, icon: FileText },
                                        { label: "Profesión", value: formData.profession || "—", icon: Briefcase },
                                        { label: "Bio", value: formData.bio ? formData.bio.slice(0, 80) + (formData.bio.length > 80 ? "..." : "") : "—", icon: FileText },
                                        { label: "Etiquetas", value: formData.etiquetas || "—", icon: Tag },
                                        { label: "Instagram", value: formData.instagram || "—", icon: Instagram },
                                        { label: "Facebook", value: formData.facebook || "—", icon: Facebook },
                                    ].map(({ label, value, icon: Icon }) => (
                                        <div
                                            key={label}
                                            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                                        >
                                            <Icon className="w-4 h-4 text-[#f66739] flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">{label}</p>
                                                <p className="text-white/80 text-sm break-all">{value}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {photoPreview && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <Camera className="w-4 h-4 text-[#f66739] flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Foto</p>
                                                <img src={photoPreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover mt-1" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Aviso de pago */}
                                <div className="bg-[#f66739]/5 border border-[#f66739]/20 rounded-2xl p-5">
                                    <p className="text-sm text-white/70 leading-relaxed">
                                        Al hacer clic en <strong className="text-white">Enviar Pedido</strong>, tu información quedará registrada y pendiente de activación. Tu asesor te indicará cómo realizar el pago de <strong className="text-[#f66739]">$35</strong>. Una vez confirmado, activaremos tu contacto digital.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Botones de navegación */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={step === 1}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all disabled:opacity-0 disabled:pointer-events-none font-semibold"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Anterior
                        </button>

                        {step < 4 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#f66739] text-white font-black hover:bg-[#e85a2e] transition-all shadow-lg shadow-[#f66739]/25 active:scale-95"
                            >
                                Siguiente
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#f66739] text-white font-black hover:bg-[#e85a2e] transition-all shadow-lg shadow-[#f66739]/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Enviando pedido...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Enviar Pedido
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Footer info */}
            <p className="text-center text-white/25 text-xs mt-8">
                ActivaQR · Contactos Profesionales Digitales · Ecuador{" "}
                {refCode && refCode !== "general" && `· Referido: ${refCode}`}
            </p>
        </div>
    );
}
