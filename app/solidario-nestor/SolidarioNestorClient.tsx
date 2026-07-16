"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    User, 
    Briefcase, 
    Smartphone, 
    CheckCircle, 
    Loader2, 
    Heart, 
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
    Camera,
    MapPin,
    FileText,
    ChevronLeft,
    ChevronRight,
    Zap,
    X
} from "lucide-react";
import { formatPhoneEcuador } from "@/lib/utils";

const INDUSTRY_TAGS: Record<string, string[]> = {
    'carpintero': ['Carpintería', 'Muebles', 'Madera', 'Reparaciones', 'Diseño'],
    'plomero': ['Plomería', 'Tubería', 'Agua', 'Goteras', 'Filtración', 'Fontanero'],
    'electricista': ['Electricidad', 'Luces', 'Cables', 'Cortocircuito', 'Instalaciones'],
    'enfermera': ['Enfermería', 'Cuidado', 'Salud', 'Adultos', 'Niños', 'Curaciones'],
    'enfermero': ['Enfermería', 'Cuidado', 'Salud', 'Adultos', 'Niños', 'Curaciones'],
    'pastelero': ['Pastelería', 'Tortas', 'Dulces', 'Eventos', 'Fiestas', 'Repostería'],
    'pastelera': ['Pastelería', 'Tortas', 'Dulces', 'Eventos', 'Fiestas', 'Repostería'],
    'tecnico': ['Reparaciones', 'Servicio Técnico', 'Mantenimiento', 'Soporte'],
    'abogado': ['Legal', 'Juicios', 'Asesoría', 'Derecho'],
    'doctor': ['Salud', 'Medicina', 'Consulta', 'Médico'],
    'odontologo': ['Dientes', 'Salud Bucal', 'Dentista', 'Limpieza'],
};

const normalizeText = (text: string) => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

export default function SolidarioNestorClient() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatedSlug, setGeneratedSlug] = useState("");
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Formulario estructurado idéntico a la especificación con TODOS los campos del producto de $35
    const [formData, setFormData] = useState({
        tipo_perfil: "persona" as "persona" | "negocio",
        nombres: "",
        apellidos: "",
        nombre_negocio: "",
        contacto_nombre: "",
        contacto_apellido: "",
        whatsapp: "",
        email: "",
        
        // Perfil y Enlaces
        profession: "",
        company: "",
        bio: "",
        productos_servicios: "",
        etiquetas: "",
        address: "",
        google_business: "",
        menu_digital: "",
        
        // Redes Sociales
        linkedin: "",
        tiktok: "",
        youtube: "",
        x: "",
        instagram: "",
        facebook: "",
        web: "",
        
        // Archivos
        photo: null as File | null,
    });

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [hasManualTags, setHasManualTags] = useState(false);

    // Auto-generar etiquetas por profesión al escribir
    useEffect(() => {
        if (!hasManualTags) {
            const professionNormalized = normalizeText(formData.profession);
            const key = Object.keys(INDUSTRY_TAGS).find(k =>
                professionNormalized.includes(normalizeText(k))
            );
            if (key) {
                setFormData(prev => ({ ...prev, etiquetas: INDUSTRY_TAGS[key!].join(', ') }));
            }
        }
    }, [formData.profession, hasManualTags]);

    // Generar etiquetas utilizando la API de Inteligencia Artificial
    const generateWithAI = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!formData.profession) {
            alert("Por favor ingresa tu profesión primero para poder generar etiquetas relevantes.");
            return;
        }
        setIsGeneratingTags(true);
        try {
            const response = await fetch('/api/generate-tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company: formData.company || (formData.tipo_perfil === 'negocio' ? formData.nombre_negocio : ''),
                    profession: formData.profession,
                    bio: formData.bio,
                    products: formData.productos_servicios,
                    plan: 'digital'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Error en el servidor');
            }

            if (data.tags) {
                setFormData(prev => ({ ...prev, etiquetas: data.tags }));
                setHasManualTags(true);
            } else {
                alert("No se pudieron generar etiquetas. Intenta de nuevo.");
            }
        } catch (err: any) {
            console.error("Error generating tags:", err);
            alert(`No pudimos conectar con la IA: ${err.message || 'Error de conexión'}.`);
        } finally {
            setIsGeneratingTags(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, photo: file }));
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
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
            if (!formData.nombre_negocio.trim()) newErrors.nombre_negocio = "El nombre comercial es obligatorio";
        }

        if (!formData.whatsapp.trim()) {
            newErrors.whatsapp = "El WhatsApp es obligatorio";
        } else {
            const cleanPhone = formData.whatsapp.replace(/\D/g, "");
            if (cleanPhone.length < 9) {
                newErrors.whatsapp = "El número no parece válido";
            }
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
        setStep(prev => prev + 1);
    };

    const prevStep = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setStep(prev => prev - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.photo) {
            alert("Por favor sube una foto de perfil/logo antes de finalizar.");
            return;
        }
        setIsSubmitting(true);

        try {
            let photoUrl = null;

            if (formData.photo) {
                const uploadFormData = new FormData();
                uploadFormData.append("file", formData.photo);
                const tempSlug = `solidario-${Date.now()}`;
                uploadFormData.append("slug", tempSlug);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    photoUrl = uploadData.url;
                }
            }

            const finalNombre = formData.tipo_perfil === "negocio" 
                ? formData.nombre_negocio 
                : `${formData.nombres} ${formData.apellidos}`;
            const cleanName = finalNombre.toLowerCase()
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
                web: formData.web || null,
                google_business: formData.google_business || null,
                instagram: formData.instagram || null,
                linkedin: formData.linkedin || null,
                facebook: formData.facebook || null,
                tiktok: formData.tiktok || null,
                youtube: formData.youtube || null,
                x: formData.x || null,
                menu_digital: formData.menu_digital || null,
                
                // Forzados para el plan Solidario
                plan: "digital",
                status: "pagado",
                payment_method: "solidario",
                template_id: "classic",
                foto_url: photoUrl,
                slug: slug,
            };

            const response = await fetch("/api/vcard/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al registrar el contacto");
            }

            setGeneratedSlug(slug);

            // Enviar correo de bienvenida automáticamente (solo para solidario)
            try {
                const vcardUrl = `${window.location.origin}/api/vcard/${slug}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(vcardUrl)}`;
                
                fetch("/api/send-vcard", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "x-admin-key": "rya-admin-k3y-2026-s3cur3" // Bypass admin auth using the secret key
                    },
                    body: JSON.stringify({
                        vcardUrl,
                        qrUrl,
                        plan: "digital",
                        slug: slug,
                        email: formData.email,
                        nombre: finalNombre,
                        edit_code: result.edit_code
                    })
                }).catch(err => console.error("Error al enviar email automático:", err));
            } catch (emailErr) {
                console.error("Error disparando email automático:", emailErr);
            }

            try {
                fetch("/api/notify-whatsapp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: finalNombre,
                        email: formData.email,
                        whatsapp: formatPhoneEcuador(formData.whatsapp),
                        plan: "digital",
                        businessName: formData.nombre_negocio || "",
                        profession: formData.profession || "",
                        foto_url: photoUrl,
                        source: "solidario_nestor"
                    })
                }).catch(err => console.error(err));
            } catch {}

            setStep(4);

        } catch (err: any) {
            alert(`Error: ${err.message || "Ocurrió un error inesperado"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
            {/* Cabecera / Banner Solidario */}
            <div className="max-w-5xl mx-auto mb-16 text-center">
                {/* Logo de Solidaridad */}
                <div className="mb-6 flex justify-center">
                    <img 
                        src="/images/logo-solidaridad-nestor.png" 
                        alt="Ayuda para Néstor Javier" 
                        className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-full border-2 border-[#f66739]/20 p-1 bg-white/5"
                    />
                </div>

                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-6">
                    <Heart className="w-3.5 h-3.5 fill-current" /> Campaña Solidaria Activa
                </span>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-6">
                    Juntos por <span className="text-[#f66739]">Néstor</span>
                </h1>
                
                {/* HISTORIA DE NÉSTOR */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-left mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        {/* Texto */}
                        <div className="md:col-span-7 space-y-4">
                            {/* En móvil: versión truncada / expandible */}
                            <div className="block md:hidden space-y-4">
                                <p className="text-white/80 leading-relaxed font-medium">
                                    Tras haber enfrentado una trombosis pulmonar, sepsis generalizada y falla multiorgánica, Néstor Javier
                                    {!isExpanded ? (
                                        <span>...</span>
                                    ) : (
                                        <span>
                                            <strong> Morales Espinosa</strong> sigue luchando por su completa recuperación. Aunque logró superar esta grave crisis de salud, las secuelas persisten y requiere urgentemente de <strong>rehabilitación física</strong> para recuperar su independencia y autonomía en la vida diaria.
                                        </span>
                                    )}
                                </p>
                                {isExpanded && (
                                    <>
                                        <p className="text-white/80 leading-relaxed font-medium">
                                            Para lograr que sus músculos vuelvan a ser capaces de soportar su peso, se estima que necesitará aproximadamente dos o tres meses de terapia diaria con un rehabilitador físico. ¡Hoy necesitamos tu ayuda para apoyar su recuperación!
                                        </p>
                                        <p className="text-white/80 leading-relaxed font-medium">
                                            Con tu aporte solidario de $35, obtienes tu <strong>Contacto Profesional</strong> para tu perfil profesional o comercial, apoyando directamente al financiamiento de la terapia de Néstor.
                                        </p>
                                    </>
                                )}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="text-[#f66739] hover:text-[#FF8A33] font-bold text-xs uppercase tracking-wider focus:outline-none transition-colors border border-[#f66739]/30 rounded-lg px-3 py-1.5 bg-[#f66739]/10"
                                    >
                                        {isExpanded ? "Ocultar" : "Seguir leyendo"}
                                    </button>
                                </div>
                            </div>

                            {/* En desktop: Siempre completo */}
                            <div className="hidden md:block space-y-4">
                                <p className="text-white/80 leading-relaxed font-medium">
                                    Tras haber enfrentado una trombosis pulmonar, sepsis generalizada y falla multiorgánica, <strong>Néstor Javier Morales Espinosa</strong> sigue luchando por su completa recuperación. Aunque logró superar esta grave crisis de salud, las secuelas persisten y requiere urgentemente de <strong>rehabilitación física</strong> para recuperar su independencia y autonomía en la vida diaria.
                                </p>
                                <p className="text-white/80 leading-relaxed font-medium">
                                    Para lograr que sus músculos vuelvan a ser capaces de soportar su peso, se estima que necesitará aproximadamente dos o tres meses de terapia diaria con un rehabilitador físico. ¡Hoy necesitamos tu ayuda para apoyar su recuperación!
                                </p>
                                <p className="text-white/80 leading-relaxed font-medium">
                                    Con tu aporte solidario de $35, obtienes tu <strong>Contacto Profesional</strong> para tu perfil profesional o comercial, apoyando directamente al financiamiento de la terapia de Néstor.
                                </p>
                            </div>
                        </div>
                        
                        {/* Imágenes */}
                        <div className="md:col-span-5 grid grid-cols-2 gap-4">
                            <div 
                                onClick={() => setActiveImage("/images/nestor-solidario-2.jpg")}
                                className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 shadow-lg cursor-zoom-in group"
                            >
                                <img 
                                    src="/images/nestor-solidario-2.jpg" 
                                    alt="Néstor Javier Morales Espinosa en recuperación" 
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-black/60 px-3 py-1 rounded-full text-xs text-white font-black uppercase tracking-wider">Ampliar</span>
                                </div>
                            </div>
                            <div 
                                onClick={() => setActiveImage("/images/nestor-solidario-1.png")}
                                className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 shadow-lg cursor-zoom-in group"
                            >
                                <img 
                                    src="/images/nestor-solidario-1.png" 
                                    alt="Néstor Javier Morales Espinosa en silla de ruedas" 
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-black/60 px-3 py-1 rounded-full text-xs text-white font-black uppercase tracking-wider">Ampliar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Formulario y Detalles */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* Beneficios del Contacto Digital */}
                <div className="lg:col-span-4 bg-[#0d1527] border border-white/5 rounded-3xl p-8 space-y-6 lg:sticky lg:top-8">
                    <h3 className="text-lg font-black uppercase tracking-widest text-[#f66739]">¿Qué incluye tu Contacto Digital?</h3>
                    <div className="text-4xl font-black">$35<span className="text-xs text-white/50 font-normal"> / Aporte solidario</span></div>
                    
                    <ul className="space-y-4">
                        {[
                            "Tarjeta de Contacto Profesional en línea",
                            "Foto de perfil y bio adaptada",
                            "Enlace directo a WhatsApp y redes",
                            "Botón de descarga para contactos en un click",
                            "Enlace personalizado y QR integrado",
                            "Optimizado para celular y de por vida"
                        ].map((feat, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                                <span className="p-0.5 rounded-full bg-[#66bf19]/20 text-[#66bf19] mt-0.5">
                                    <Check className="w-3.5 h-3.5" />
                                </span>
                                <span>{feat}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Formulario Multi-Step */}
                <div className="lg:col-span-8 bg-[#0a1229] border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl relative overflow-hidden">
                    
                    {/* Indicador de pasos */}
                    {step < 4 && (
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/10">
                            {[
                                { num: 1, label: "Básico", icon: User },
                                { num: 2, label: "Contacto", icon: Briefcase },
                                { num: 3, label: "Visual", icon: Camera }
                            ].map((s) => (
                                <div key={s.num} className="flex items-center gap-2">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all duration-300 md:text-lg border-2 ${
                                        step === s.num 
                                            ? "bg-[#f66739] text-[#050B1C] border-[#f66739] shadow-[0_0_20px_rgba(255,107,0,0.4)] scale-110" 
                                            : step > s.num 
                                                ? "bg-[#0A1229] border-[#f66739] text-[#f66739]" 
                                                : "bg-[#050B1C] border-white/10 text-white/30"
                                    }`}>
                                        {step > s.num ? <Check strokeWidth={4} className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider hidden sm:inline ${
                                        step >= s.num ? "text-white" : "text-white/40"
                                    }`}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            
                            {/* PASO 1: DATOS BÁSICOS */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => updateField("tipo_perfil", "persona")}
                                            className={`flex flex-col items-center p-6 border-2 rounded-2xl transition-all font-black uppercase tracking-widest text-[11px] ${
                                                formData.tipo_perfil === "persona" 
                                                    ? "border-[#f66739] bg-[#f66739]/10 text-[#f66739] shadow-lg shadow-[#f66739]/20" 
                                                    : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                                            }`}
                                        >
                                            <User size={32} className="mb-3" />
                                            Profesional / Persona
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateField("tipo_perfil", "negocio")}
                                            className={`flex flex-col items-center p-6 border-2 rounded-2xl transition-all font-black uppercase tracking-widest text-[11px] ${
                                                formData.tipo_perfil === "negocio" 
                                                    ? "border-[#f66739] bg-[#f66739]/10 text-[#f66739] shadow-lg shadow-[#f66739]/20" 
                                                    : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                                            }`}
                                        >
                                            <Briefcase size={32} className="mb-3" />
                                            Negocio / Local
                                        </button>
                                    </div>

                                    {formData.tipo_perfil === "persona" ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">Nombres *</label>
                                                <input
                                                    type="text"
                                                    value={formData.nombres}
                                                    onChange={(e) => updateField("nombres", e.target.value)}
                                                    className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#f66739]/50 text-white outline-none"
                                                    placeholder="Ej: Juan Carlos"
                                                />
                                                {errors.nombres && <p className="text-rose-400 text-xs mt-1">{errors.nombres}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">Apellidos *</label>
                                                <input
                                                    type="text"
                                                    value={formData.apellidos}
                                                    onChange={(e) => updateField("apellidos", e.target.value)}
                                                    className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#f66739]/50 text-white outline-none"
                                                    placeholder="Ej: Pérez Gómez"
                                                />
                                                {errors.apellidos && <p className="text-rose-400 text-xs mt-1">{errors.apellidos}</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">Nombre del Negocio *</label>
                                                <input
                                                    type="text"
                                                    value={formData.nombre_negocio}
                                                    onChange={(e) => updateField("nombre_negocio", e.target.value)}
                                                    className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#f66739]/50 text-white outline-none"
                                                    placeholder="Ej: Ferretería El Maestro"
                                                />
                                                {errors.nombre_negocio && <p className="text-rose-400 text-xs mt-1">{errors.nombre_negocio}</p>}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Nombre Contacto (Opcional)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.contacto_nombre}
                                                        onChange={(e) => updateField("contacto_nombre", e.target.value)}
                                                        className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-white/30 text-white outline-none"
                                                        placeholder="Solo un nombre"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Apellido Contacto (Opcional)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.contacto_apellido}
                                                        onChange={(e) => updateField("contacto_apellido", e.target.value)}
                                                        className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-white/30 text-white outline-none"
                                                        placeholder="Solo un apellido"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">WhatsApp *</label>
                                            <input
                                                type="tel"
                                                value={formData.whatsapp}
                                                onChange={(e) => updateField("whatsapp", e.target.value)}
                                                className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#f66739]/50 text-white outline-none"
                                                placeholder="Ej. 0991234567"
                                            />
                                            {errors.whatsapp && <p className="text-rose-400 text-xs mt-1">{errors.whatsapp}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">Correo Electrónico *</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => updateField("email", e.target.value)}
                                                className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#f66739]/50 text-white outline-none"
                                                placeholder="correo@ejemplo.com"
                                            />
                                            {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* PASO 2: CONTACTO Y PERFIL */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">Profesión o Cargo *</label>
                                            <input
                                                type="text"
                                                value={formData.profession}
                                                onChange={(e) => updateField("profession", e.target.value)}
                                                className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#f66739]/50 text-white outline-none"
                                                placeholder="Ej: Ing. Civil / Gerente de Ventas"
                                            />
                                        </div>
                                        {formData.tipo_perfil === "persona" && (
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Empresa (Opcional)</label>
                                                <input
                                                    type="text"
                                                    value={formData.company}
                                                    onChange={(e) => updateField("company", e.target.value)}
                                                    className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-white/30 text-white outline-none"
                                                    placeholder="Ej: Constructora ABC"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">Descripción Corta / Especialidad *</label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => updateField("bio", e.target.value)}
                                            rows={3}
                                            className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#f66739]/50 text-white outline-none resize-none"
                                            placeholder="Resume en qué ayudas a tus clientes..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Soluciones Destacadas</label>
                                        <textarea
                                            value={formData.productos_servicios}
                                            onChange={(e) => updateField("productos_servicios", e.target.value)}
                                            rows={2}
                                            className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-white/30 text-white outline-none resize-none"
                                            placeholder="Ej: Reparación de techos, Albañilería, Pintura..."
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">Etiquetas de Búsqueda *</label>
                                            <button
                                                type="button"
                                                onClick={generateWithAI}
                                                disabled={isGeneratingTags}
                                                className="text-[9px] font-black uppercase tracking-widest text-[#f66739] bg-[#f66739]/10 px-3 py-1.5 rounded-lg border border-[#f66739]/20 hover:bg-[#f66739]/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                {isGeneratingTags ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />} Generar con IA
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.etiquetas}
                                            onChange={(e) => {
                                                updateField("etiquetas", e.target.value);
                                                setHasManualTags(true);
                                            }}
                                            className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#f66739]/50 text-white outline-none"
                                            placeholder="Ej: plomero, reparacion, mantenimiento (separadas por coma)"
                                        />
                                        <p className="text-[9px] text-white/30 italic">Ayuda a encontrar este contacto en el directorio.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">Ciudad y Dirección *</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => updateField("address", e.target.value)}
                                            className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#f66739]/50 text-white outline-none"
                                            placeholder="Ej: Loja, Av. Cuxibamba 12-34"
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">Link de Google Maps</label>
                                        <input
                                            type="url"
                                            value={formData.google_business}
                                            onChange={(e) => updateField("google_business", e.target.value)}
                                            className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#f66739]/50 text-white outline-none"
                                            placeholder="https://maps.app.goo.gl/..."
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-primary">Menú Digital / Catálogo PDF</label>
                                        <input
                                            type="text"
                                            value={formData.menu_digital}
                                            onChange={(e) => updateField("menu_digital", e.target.value)}
                                            className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-primary/50 text-white outline-none"
                                            placeholder="https://link-a-tu-menu.com/pdf"
                                        />
                                        <p className="text-[9px] text-white/30 italic">Ideal para restaurantes o locales con carta digital.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#68d3fe]">LinkedIn (Link Completo)</label>
                                            <input
                                                type="url"
                                                value={formData.linkedin}
                                                onChange={(e) => updateField("linkedin", e.target.value)}
                                                className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#68d3fe]/50 text-white outline-none"
                                                placeholder="https://linkedin.com/..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#68d3fe]">TikTok (Link Completo)</label>
                                            <input
                                                type="url"
                                                value={formData.tiktok}
                                                onChange={(e) => updateField("tiktok", e.target.value)}
                                                className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#68d3fe]/50 text-white outline-none"
                                                placeholder="https://tiktok.com/..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#68d3fe]">YouTube (Canal)</label>
                                            <input
                                                type="url"
                                                value={formData.youtube}
                                                onChange={(e) => updateField("youtube", e.target.value)}
                                                className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#68d3fe]/50 text-white outline-none"
                                                placeholder="https://youtube.com/..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#68d3fe]">X / Twitter (Link Completo)</label>
                                            <input
                                                type="url"
                                                value={formData.x}
                                                onChange={(e) => updateField("x", e.target.value)}
                                                className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-5 py-4 focus:border-[#68d3fe]/50 text-white outline-none"
                                                placeholder="https://x.com/..."
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* PASO 3: VISUAL */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-[#050B1C] border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                                        <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={32} className="text-white/20" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3 w-full">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#f66739]">Sube tu mejor Foto / Logo *</label>
                                            <p className="text-[10px] text-white/40 leading-relaxed mb-4">Recomendado: Cuadrada, clara y profesional. Este es el primer impacto visual de tu tarjeta.</p>
                                            <div className="relative group w-full sm:w-auto">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                                                    <Camera size={18} /> Subir Imagen
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#050B1C] border border-white/10 p-6 rounded-2xl">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-4 border-b border-white/10 pb-2">Redes Sociales (Solo Enlaces, Opcional)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="url"
                                                value={formData.instagram}
                                                onChange={(e) => updateField("instagram", e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f66739] text-white"
                                                placeholder="Instagram Link"
                                            />
                                            <input
                                                type="url"
                                                value={formData.facebook}
                                                onChange={(e) => updateField("facebook", e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f66739] text-white"
                                                placeholder="Facebook Link"
                                            />
                                            <input
                                                type="url"
                                                value={formData.web}
                                                onChange={(e) => updateField("web", e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f66739] text-white"
                                                placeholder="Página Web (URL)"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* PASO 4: ÉXITO */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8 space-y-6"
                                >
                                    <div className="w-16 h-16 bg-[#66bf19]/20 text-[#66bf19] rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-white">¡Muchas gracias por tu solidaridad!</h3>
                                        <p className="text-sm text-white/70 max-w-md mx-auto">Tu apoyo a Néstor hace la diferencia. Tu Contacto Digital ha sido configurado en nuestro sistema. Te enviaremos tu acceso e instrucciones al correo ingresado en menos de 24 horas.</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep(1);
                                                setFormData({
                                                    tipo_perfil: "persona",
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
                                                    photo: null,
                                                });
                                                setPhotoPreview(null);
                                                setHasManualTags(false);
                                            }}
                                            className="px-8 py-3.5 bg-[#f66739] hover:bg-[#e5562d] rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            Registrar Otro
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>

                        {/* Botones de Navegación del Wizard */}
                        {step < 4 && (
                            <div className="flex justify-between items-center pt-8 border-t border-white/10 mt-8">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={(e) => prevStep(e)}
                                        className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-white/5 hover:bg-white/10 text-white"
                                    >
                                        <ChevronLeft size={18} /> Atrás
                                    </button>
                                ) : (
                                    <div />
                                )}

                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={(e) => nextStep(e)}
                                        className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-[#FF8A33] rounded-2xl font-black text-sm uppercase tracking-widest text-[#050B1C] transition-all shadow-[0_5px_15px_rgba(255,107,0,0.3)] hover:scale-105 active:scale-95"
                                    >
                                        Siguiente <ChevronRight size={18} />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !formData.photo}
                                        className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-400 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all shadow-[0_5px_15px_rgba(34,197,94,0.3)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4.5 h-4.5 animate-spin" /> Procesando...
                                            </>
                                        ) : (
                                            <>
                                                Generar Contacto <Heart className="w-4 h-4 fill-current" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Lightbox para imágenes */}
            <AnimatePresence>
                {activeImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveImage(null)}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
                    >
                        <button 
                            onClick={() => setActiveImage(null)}
                            className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[101]"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            src={activeImage}
                            alt="Vista ampliada"
                            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
