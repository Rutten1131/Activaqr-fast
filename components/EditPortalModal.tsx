"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Download, Key, AlertCircle, CheckCircle, Loader2, Edit, ArrowRight, Plus, Trash2, Upload, Zap } from 'lucide-react';
import { formatPhoneEcuador, cn } from '@/lib/utils';

interface EditPortalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EditPortalModal({ isOpen, onClose }: EditPortalModalProps) {
    const [step, setStep] = useState<'code' | 'edit' | 'success'>('code');
    const [editCode, setEditCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState<any>(null);
    const [usesRemaining, setUsesRemaining] = useState(0);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Hero Slides State
    const [heroSlides, setHeroSlides] = useState<any[]>([]);
    const [uploadingHeroSlide, setUploadingHeroSlide] = useState<string | null>(null);

    // Load code from localStorage on mount
    useEffect(() => {
        const savedCode = localStorage.getItem('rya_edit_code');
        if (savedCode) {
            setEditCode(savedCode);
        }
    }, []);

    // Form fields editable
    const [formData, setFormData] = useState({
        tipo_perfil: 'persona' as 'persona' | 'negocio',
        nombres: '',
        apellidos: '',
        nombre_negocio: '',
        contacto_nombre: '',
        contacto_apellido: '',
        profession: '',
        company: '',
        whatsapp: '',
        email: '',
        bio: '',
        address: '',
        web: '',
        google_business: '',
        instagram: '',
        linkedin: '',
        facebook: '',
        tiktok: '',
        products: '',
        categories: '',
        menu_digital: '',
        youtube: '',
        x: '',
        wifi_ssid: '',
        wifi_password: '',
        foto_url: '', // For profile image update (base64)
        portada_desktop: '', // New hero desktop
        portada_movil: '',   // New hero mobile
        hero_button_text: '', // Custom hero button text
        hero_slides_json: '',
        sellerCode: ''
    });

    const validateCode = async () => {
        const cleanedCode = editCode.trim().replace(/\s/g, '');
        if (!cleanedCode) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/edit/validate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: cleanedCode })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('rya_edit_code', cleanedCode);
                setUserData(data.data);
                setUsesRemaining(data.usesRemaining);
                setFormData({
                    tipo_perfil: data.data.tipo_perfil || 'persona',
                    nombres: data.data.nombres || '',
                    apellidos: data.data.apellidos || '',
                    nombre_negocio: data.data.nombre_negocio || '',
                    contacto_nombre: data.data.contacto_nombre || '',
                    contacto_apellido: data.data.contacto_apellido || '',
                    profession: data.data.profession || data.data.profesion || '',
                    company: data.data.company || data.data.empresa || '',
                    whatsapp: data.data.whatsapp || '',
                    email: data.data.email || '',
                    bio: data.data.bio || '',
                    address: data.data.address || data.data.direccion || '',
                    web: data.data.web || '',
                    google_business: data.data.google_business || '',
                    instagram: data.data.instagram || '',
                    linkedin: data.data.linkedin || '',
                    facebook: data.data.facebook || '',
                    tiktok: data.data.tiktok || '',
                    products: data.data.productos_servicios || data.data.products || '',
                    categories: data.data.etiquetas || data.data.categories || '',
                    menu_digital: data.data.menu_digital || '',
                    youtube: data.data.youtube || '',
                    x: data.data.x || '',
                    wifi_ssid: data.data.wifi_ssid || '',
                    wifi_password: data.data.wifi_password || '',
                    foto_url: '', // Keep empty on load, only set if changed. Use userData.foto_url for display.
                    portada_desktop: data.data.portada_desktop || '',
                    portada_movil: data.data.portada_movil || '',
                    hero_button_text: data.data.hero_button_text || '',
                    hero_slides_json: data.data.hero_slides_json || '',
                    sellerCode: data.data.sellerCode || data.data.seller_id || ''
                });
                
                // Parse and set hero slides
                let parsedSlides: any[] = [];
                if (data.data.hero_slides_json) {
                    try {
                        let raw = data.data.hero_slides_json;
                        // Handle both string and object from MySQL JSON column
                        if (typeof raw === 'string') {
                            raw = JSON.parse(raw);
                        }
                        // Validate it's an array with items
                        if (Array.isArray(raw) && raw.length > 0) {
                            parsedSlides = raw;
                        } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                            // Handle case where it's a single object instead of array
                            parsedSlides = [raw];
                        }
                    } catch (e) {
                        console.error('Error parsing hero_slides_json:', e);
                    }
                }
                
                // Fallback: if no hero_slides but has legacy portada images, create a slide
                if (parsedSlides.length === 0 && (data.data.portada_desktop || data.data.portada_movil)) {
                    parsedSlides = [{
                        id: `slide_${Date.now()}`,
                        portada_desktop: data.data.portada_desktop || '',
                        portada_movil: data.data.portada_movil || '',
                        title: data.data.hero_section_title || 'Mi Banner',
                        description: '',
                        active: true,
                        offerEnabled: false,
                        offerTitle: '',
                        offerDescription: '',
                        offerOriginalPrice: '',
                        offerPrice: '',
                        offerExpiresAt: '',
                        offerCtaText: ''
                    }];
                }
                
                setHeroSlides(parsedSlides);
                
                setStep('edit');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!confirm('¿Estás seguro de guardar los cambios en tu perfil digital?')) return;

        // Auto-format WhatsApp before saving using global utility
        const formattedData = {
            ...formData,
            productos_servicios: formData.products || '',
            etiquetas: formData.categories || '',
            whatsapp: formatPhoneEcuador(formData.whatsapp),
            hero_slides_json: JSON.stringify(heroSlides)
        };

        setLoading(true);
        try {
            const res = await fetch('/api/edit/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: editCode,
                    data: formattedData,
                    slug: userData?.slug // Use actual slug from loaded data
                })
            });
            const result = await res.json();

            if (res.ok) {
                setUserData((prev: any) => ({ ...prev, ...formattedData })); // Update local user data for preview
                setUsesRemaining(result.remaining);
                setStep('success');
            } else {
                alert(result.error);
            }
        } catch (err) {
            alert('Error al guardar cambios');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhoto(true);
        setError('');

        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });

            if (!uploadRes.ok) throw new Error('Error al procesar la imagen');
            
            const result = await uploadRes.json();
            
            if (result.url) {
                // result.url is the base64 string optimized by the server (WebP 80%)
                setFormData(prev => ({ ...prev, foto_url: result.url }));
            } else {
                setError('No se recibió la URL de la imagen');
            }
        } catch (err: any) {
            console.error('Error subiendo foto:', err);
            setError('Error al subir la imagen. Intenta con una más pequeña.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    // Hero Slide CRUD Functions
    const addHeroSlide = () => {
        if (heroSlides.length >= 10) {
            alert('Máximo 10 banners permitidos.');
            return;
        }
        const newSlide = {
            id: `slide_${Date.now()}`,
            portada_desktop: '',
            portada_movil: '',
            title: '',
            description: '',
            active: true,
            offerEnabled: false,
            offerTitle: '',
            offerDescription: '',
            offerOriginalPrice: '',
            offerPrice: '',
            offerExpiresAt: '',
            offerCtaText: ''
        };
        setHeroSlides([...heroSlides, newSlide]);
    };

    const removeHeroSlide = (slideId: string) => {
        if (heroSlides.length <= 1) {
            alert('Debe haber al menos 1 banner.');
            return;
        }
        setHeroSlides(heroSlides.filter((s: any) => s.id !== slideId));
    };

    const updateHeroSlides = (updatedSlides: any[]) => {
        setHeroSlides(updatedSlides);
    };

    const toggleHeroSlideActive = (slideId: string, currentlyActive: boolean) => {
        if (currentlyActive) {
            const activeCount = heroSlides.filter((s: any) => s.active).length;
            if (activeCount <= 1) {
                alert('Debe haber al menos 1 banner activo.');
                return;
            }
        }
        setHeroSlides(heroSlides.map((s: any) => s.id === slideId ? { ...s, active: !s.active } : s));
    };

    const handleHeroSlideImageUpload = async (file: File, slideId: string, field: 'portada_desktop' | 'portada_movil') => {
        setUploadingHeroSlide(slideId);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });

            if (!uploadRes.ok) throw new Error('Error al procesar la imagen');
            
            const result = await uploadRes.json();
            
            if (result.url) {
                setHeroSlides(heroSlides.map((s: any) => s.id === slideId ? { ...s, [field]: result.url } : s));
            } else {
                alert('No se recibió la URL de la imagen');
            }
        } catch (err: any) {
            console.error('Error uploading hero slide image:', err);
            alert('Error de conexión al subir imagen.');
        } finally {
            setUploadingHeroSlide(null);
        }
    };

    const downloadVCard = async () => {
        if (!userData) return;

        setLoading(true);

        try {
            // Track download asynchronously
            fetch('/api/vcard/track-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: userData.slug, method: 'edit_portal' })
            }).catch(err => console.error("Error tracking download:", err));

            // Usar la misma API que /admin usa — genera el VCF completo
            // con foto JPEG, tags de WhatsApp, redes sociales, etc.
            const response = await fetch(`/api/vcard/${userData.slug}`);
            if (!response.ok) throw new Error('Error al generar vCard');

            const vcfBlob = await response.blob();
            const url = window.URL.createObjectURL(vcfBlob);
            const a = document.createElement("a");
            a.href = url;
            const filename = `${userData.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error descargando VCF:", error);
        }

        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-primary p-6 flex justify-between items-center text-white shrink-0">
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                                <Edit size={24} />
                                Portal de Autoedición
                            </h2>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">
                                Actualiza tus datos sin cambiar tu QR
                            </p>
                        </div>
                        <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto grow">

                        {/* STEP 1: CODE ENTRY */}
                        {step === 'code' && (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <Key size={40} className="text-primary" />
                                </div>
                                <h3 className="text-2xl font-black text-navy mb-2">Ingresa tu Código de Edición</h3>
                                <p className="text-gray-500 mb-8 max-w-xs">
                                    Encuentra tu código único (ej. RYA-2026-XXXX) en el correo de bienvenida.
                                </p>

                                <div className="w-full max-w-sm mb-4">
                                    <input
                                        type="text"
                                        value={editCode}
                                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                        placeholder="RYA-2026-XXXX"
                                        className="w-full text-center text-2xl font-black text-navy border-2 border-gray-200 rounded-xl p-4 uppercase focus:border-primary outline-none tracking-widest"
                                    />
                                    {error && (
                                        <p className="text-red-500 text-sm font-bold mt-2 flex items-center justify-center gap-1">
                                            <AlertCircle size={14} /> {error}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={validateCode}
                                    disabled={loading || editCode.length < 10}
                                    className="bg-navy text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Verificar Código'}
                                </button>
                            </div>
                        )}

                        {/* STEP 2: EDIT FORM */}
                        {step === 'edit' && userData && (
                            <div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                                    <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="text-sm text-emerald-800 font-bold">Ediciones Ilimitadas Activadas</p>
                                        <p className="text-xs text-emerald-700 mt-1">
                                            Puedes realizar <strong className="text-emerald-900">cambios ilimitados</strong> en tu información en cualquier momento. Tu código QR físico seguirá funcionando exactamente igual.
                                        </p>
                                    </div>
                                </div>

                                {/* Perfil Type Toggle */}
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
                                    <button
                                        onClick={() => setFormData({ ...formData, tipo_perfil: 'persona' })}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all",
                                            formData.tipo_perfil === 'persona' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-navy"
                                        )}
                                    >
                                        Persona
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, tipo_perfil: 'negocio' })}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all",
                                            formData.tipo_perfil === 'negocio' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-navy"
                                        )}
                                    >
                                        Negocio / Local
                                    </button>
                                </div>

                                {/* 1. IDENTIDAD (Paso 1 de /registro) */}
                                <div className="col-span-full border-b pb-4 mb-4">
                                    <h4 className="text-sm font-black text-primary uppercase mb-4 flex items-center gap-2 italic">
                                        <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                                        1. Identidad
                                    </h4>
                                    <div className="space-y-4">
                                        {formData.tipo_perfil === 'persona' ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="form-group">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Nombres</label>
                                                    <input
                                                        className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                        value={formData.nombres}
                                                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                                                        placeholder="Ej. Juan"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Apellidos</label>
                                                    <input
                                                        className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                        value={formData.apellidos}
                                                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                                        placeholder="Ej. Pérez"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="form-group">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Nombre del Negocio / Local</label>
                                                    <input
                                                        className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                        value={formData.nombre_negocio}
                                                        onChange={(e) => setFormData({ ...formData, nombre_negocio: e.target.value })}
                                                        placeholder="Ej. Restaurante El Sol"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="form-group">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Contacto Nombre (Opcional)</label>
                                                        <input
                                                            className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                            value={formData.contacto_nombre}
                                                            onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Contacto Apellido (Opcional)</label>
                                                        <input
                                                            className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                            value={formData.contacto_apellido}
                                                            onChange={(e) => setFormData({ ...formData, contacto_apellido: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">WhatsApp</label>
                                                <input
                                                    className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                    value={formData.whatsapp}
                                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Email</label>
                                                <input
                                                    className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Código de Vendedor / Promocional</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm uppercase"
                                                value={formData.sellerCode}
                                                onChange={(e) => setFormData({ ...formData, sellerCode: e.target.value })}
                                                placeholder="Ej. 001"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. PERFIL PROFESIONAL (Paso 2 de /registro) */}
                                <div className="col-span-full border-b pb-4 mb-4">
                                    <h4 className="text-sm font-black text-primary uppercase mb-4 flex items-center gap-2 italic">
                                        <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                                        2. Perfil Profesional
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Profesión / Título</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.profession}
                                                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Empresa (Opcional)</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.company}
                                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-full">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Tu Bio o Descripción</label>
                                            <textarea
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm resize-none"
                                                rows={2}
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-full">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Productos o Servicios</label>
                                            <textarea
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm resize-none"
                                                rows={3}
                                                value={formData.products}
                                                onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. CONECTIVIDAD Y OFERTA (Paso 2 de /registro) */}
                                <div className="col-span-full border-b pb-4 mb-4">
                                    <h4 className="text-sm font-black text-primary uppercase mb-4 flex items-center gap-2 italic">
                                        <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                                        3. Conectividad y Oferta
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-full form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Dirección / Ubicación</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Ej. Oficina 203, Edificio X"
                                            />
                                        </div>
                                    {userData?.plan !== 'digital' && (
                                        <>
                                            <div className="form-group">
                                                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Título de la Oferta / Promoción (Opcional)</label>
                                                <input
                                                    className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                    value={formData.wifi_ssid}
                                                    onChange={(e) => setFormData({ ...formData, wifi_ssid: e.target.value })}
                                                    placeholder="Ej: Gran Descuento Especial"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Descripción Corta o Subtítulo (Opcional)</label>
                                                <input
                                                    className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                    value={formData.wifi_password}
                                                    onChange={(e) => setFormData({ ...formData, wifi_password: e.target.value })}
                                                    placeholder="Ej: Válido hasta el viernes"
                                                />
                                            </div>
                                            <div className="col-span-full form-group">
                                                <label className="text-[10px] font-black text-primary uppercase mb-1 block italic">Texto Personalizado Botón de Oferta (Hero)</label>
                                                <input
                                                    className="w-full border-2 border-primary/20 rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                    value={formData.hero_button_text}
                                                    onChange={(e) => setFormData({ ...formData, hero_button_text: e.target.value })}
                                                    placeholder="Ej. ACCEDE A NUESTRO INTERNET o DIA DE LA MUJER"
                                                />
                                            </div>
                                        </>
                                    )}
                                    </div>
                                </div>

                                {/* 4. ENLACES Y REDES (Paso 2 de /registro) */}
                                <div className="col-span-full border-b pb-4 mb-4">
                                    <h4 className="text-sm font-black text-primary uppercase mb-4 flex items-center gap-2 italic">
                                        <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                                        4. Enlaces y Redes
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Sitio Web</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.web}
                                                onChange={(e) => setFormData({ ...formData, web: e.target.value })}
                                                placeholder="www.tuempresa.com"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Google Business / Maps</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.google_business}
                                                onChange={(e) => setFormData({ ...formData, google_business: e.target.value })}
                                                placeholder="https://maps.app.goo.gl/..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Instagram (Link)</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.instagram}
                                                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                                placeholder="https://instagram.com/..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">TikTok (Link)</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.tiktok}
                                                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                                                placeholder="https://tiktok.com/@..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Facebook (Link)</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.facebook}
                                                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">LinkedIn (Link)</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.linkedin}
                                                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">YouTube (Canal)</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.youtube}
                                                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">X / Twitter (Link)</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.x}
                                                onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-full form-group">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">🍽️ Menú Digital (Link)</label>
                                            <input
                                                className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                                value={formData.menu_digital}
                                                onChange={(e) => setFormData({ ...formData, menu_digital: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 5. SEO (Paso 2 de /registro) */}
                                <div className="col-span-full border-b pb-4 mb-4">
                                    <h4 className="text-sm font-black text-primary uppercase mb-4 flex items-center gap-2 italic">
                                        <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                                        5. SEO y Etiquetas
                                    </h4>
                                    <div className="form-group">
                                        <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Etiquetas de Búsqueda (Separadas por comas)</label>
                                        <input
                                            className="w-full border rounded-xl p-2.5 font-bold text-navy focus:border-primary outline-none transition-all text-sm"
                                            value={formData.categories}
                                            onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                                            placeholder="ej. goteras, fugas, tuberías"
                                        />
                                    </div>
                                </div>

                                {/* 6. IDENTIDAD VISUAL (Paso 3 de /registro) */}
                                <div className="col-span-full mb-6">
                                    <h4 className="text-sm font-black text-primary uppercase mb-4 flex items-center gap-2 italic">
                                        <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                                        6. Foto de Perfil
                                    </h4>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group w-24 h-24 shrink-0">
                                            <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-md">
                                                {formData.foto_url || userData.foto_url ? (
                                                    <img
                                                        src={formData.foto_url || userData.foto_url}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">?</div>
                                                )}
                                            </div>
                                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                                    <Edit size={20} className="text-white" />
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handlePhotoUpload}
                                                />
                                            </label>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                                Sube una foto clara de ti o de tu negocio. <br/>
                                                <span className="text-primary opacity-60">Se actualizará en tu tarjeta digital y vCard.</span>
                                            </p>
                                            {uploadingPhoto && (
                                                <div className="flex items-center gap-2 mt-2 text-primary font-black animate-pulse text-[10px] uppercase">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    Procesando y optimizando imagen...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 7. BANNERS DINÁMICOS HERO */}
                                {(userData?.plan === 'business' || userData?.plan === 'catalog') && (
                                    <div className="col-span-full border-b pb-4 mb-4">
                                        <h4 className="text-sm font-black text-primary uppercase mb-4 flex items-center gap-2 italic">
                                            <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                                            7. Banners Dinámicos Hero
                                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black normal-case ml-2">
                                                {heroSlides.length}/10 Creados
                                            </span>
                                        </h4>
                                        <p className="text-xs text-gray-400 mb-4">
                                            Los banners aparecen en tu tarjeta digital. Puedes activar hasta 10 banners con ofertas personalizadas por banner.
                                        </p>

                                        <div className="space-y-4">
                                            {heroSlides.length === 0 ? (
                                                <div className="text-center py-8 text-gray-400 text-sm">
                                                    No hay banners configurados. Haz clic en "Añadir Nuevo Banner" para comenzar.
                                                </div>
                                            ) : heroSlides.map((slide: any, index: number) => (
                                                <div key={slide?.id || `slide_${index}`} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-16 h-10 bg-gray-200 rounded-lg overflow-hidden">
                                                                {slide?.portada_desktop ? (
                                                                    <img src={slide.portada_desktop} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px] uppercase font-black">Sin img</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-navy">{slide.title || 'Sin título'}</p>
                                                                <p className="text-[10px] text-gray-400">{slide.active ? 'Activo' : 'Inactivo'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleHeroSlideActive(slide.id, slide.active)}
                                                                className={cn(
                                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors",
                                                                    slide.active ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-400"
                                                                )}
                                                            >
                                                                {slide.active ? 'Activo' : 'Inactivo'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeHeroSlide(slide.id)}
                                                                className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Título del Banner</label>
                                                            <input
                                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none focus:border-primary transition-all"
                                                                value={slide.title || ''}
                                                                onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, title: e.target.value } : s))}
                                                                placeholder="Ej. Oferta del Hero"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Descripción del Banner</label>
                                                            <input
                                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none focus:border-primary transition-all"
                                                                value={slide.description || ''}
                                                                onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, description: e.target.value } : s))}
                                                                placeholder="Ej. Soluciones Premium"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Oferta Limitada por Banner - SIEMPRE VISIBLE */}
                                                    <div className={cn(
                                                        "rounded-xl p-4 border space-y-3 transition-all",
                                                        slide.offerEnabled 
                                                            ? "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200" 
                                                            : "bg-gray-50 border-gray-200"
                                                    )}>
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                                                style={{ color: slide.offerEnabled ? '#ea580c' : '#6b7280' }}>
                                                                <Zap size={12} className={slide.offerEnabled ? "fill-orange-400" : "fill-gray-400"} /> 
                                                                OFERTA DE TIEMPO LIMITADO
                                                            </h5>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerEnabled: !s.offerEnabled } : s))}
                                                                className={cn(
                                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase transition-colors",
                                                                    slide.offerEnabled ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-400"
                                                                )}
                                                            >
                                                                {slide.offerEnabled ? '✓ ACTIVA' : 'OFF'}
                                                            </button>
                                                        </div>

                                                        {/* Siempre mostrar campos pero deshabilitados si no está activa */}
                                                        <div className={cn("grid grid-cols-2 gap-3", !slide.offerEnabled && "opacity-50 pointer-events-none")}>
                                                            <div className="col-span-2">
                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Texto Badge</label>
                                                                <input
                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none transition-all"
                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                    value={slide.offerTitle || ''}
                                                                    onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerTitle: e.target.value } : s))}
                                                                    placeholder="Ej. 20% OFF"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Descripción</label>
                                                                <input
                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none transition-all"
                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                    value={slide.offerDescription || ''}
                                                                    onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerDescription: e.target.value } : s))}
                                                                    placeholder="Ej. En todos los servicios"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Precio Original</label>
                                                                <input
                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-gray-400 outline-none transition-all line-through"
                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                    value={slide.offerOriginalPrice || ''}
                                                                    onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerOriginalPrice: e.target.value } : s))}
                                                                    placeholder="$100"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Precio Oferta</label>
                                                                <input
                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-black outline-none transition-all"
                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb', color: slide.offerEnabled ? '#ea580c' : '#9ca3af' }}
                                                                    value={slide.offerPrice || ''}
                                                                    onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerPrice: e.target.value } : s))}
                                                                    placeholder="$80"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Vencimiento</label>
                                                                <input
                                                                    type="datetime-local"
                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none transition-all"
                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                    value={slide.offerExpiresAt || ''}
                                                                    onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerExpiresAt: e.target.value } : s))}
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Texto CTA</label>
                                                                <input
                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none transition-all"
                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                    value={slide.offerCtaText || ''}
                                                                    onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerCtaText: e.target.value } : s))}
                                                                    placeholder="Aprovechar"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Color del Modal</label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="color"
                                                                        className="w-10 h-10 rounded-xl border-2 cursor-pointer overflow-hidden"
                                                                        style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                        value={slide.offerColor || '#FF5C00'}
                                                                        onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerColor: e.target.value } : s))}
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        className="flex-1 bg-white border rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none"
                                                                        style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                        value={slide.offerColor || ''}
                                                                        onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerColor: e.target.value } : s))}
                                                                        placeholder="#FF5C00"
                                                                    />
                                                                    <span className="text-[9px] text-gray-400 italic">Nombre o hex</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {!slide.offerEnabled && (
                                                            <p className="text-[9px] text-gray-400 text-center italic">
                                                                Activa la oferta para habilitar estos campos
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Desktop (16:9)</label>
                                                            <div className="w-full aspect-video bg-gray-200 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group relative">
                                                                {slide.portada_desktop ? (
                                                                    <img src={slide.portada_desktop} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[9px] uppercase font-black text-gray-400">Sin Imagen</span>
                                                                )}
                                                                <label className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-10">
                                                                    <Upload size={18} className="text-white" />
                                                                    <input 
                                                                        type="file" 
                                                                        className="hidden" 
                                                                        accept="image/*" 
                                                                        onChange={e => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) handleHeroSlideImageUpload(file, slide.id, 'portada_desktop');
                                                                        }} 
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Móvil (4:5)</label>
                                                            <div className="w-full aspect-[4/5] bg-gray-200 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group relative">
                                                                {slide.portada_movil ? (
                                                                    <img src={slide.portada_movil} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[9px] uppercase font-black text-gray-400 text-center px-2">Sin Imagen</span>
                                                                )}
                                                                <label className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-10">
                                                                    <Upload size={18} className="text-white" />
                                                                    <input 
                                                                        type="file" 
                                                                        className="hidden" 
                                                                        accept="image/*" 
                                                                        onChange={e => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) handleHeroSlideImageUpload(file, slide.id, 'portada_movil');
                                                                        }} 
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {heroSlides.length < 10 && (
                                                <button
                                                    type="button"
                                                    onClick={addHeroSlide}
                                                    className="border-2 border-dashed border-gray-300 hover:border-primary rounded-2xl text-gray-400 hover:text-primary font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center justify-center gap-3 min-h-[200px] w-full"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <Plus size={24} />
                                                    </div>
                                                    Añadir Nuevo Banner
                                                </button>
                                            )}
                                            {uploadingHeroSlide && (
                                                <div className="flex items-center justify-center gap-2 text-primary font-black animate-pulse text-xs uppercase">
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Subiendo imagen...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 3: SUCCESS */}
                        {step === 'success' && (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                                    <CheckCircle size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-navy mb-2">¡Cambios Guardados!</h3>
                                <p className="text-gray-500 mb-8 max-w-xs">
                                    Tu información ha sido actualizada. Tu código QR físico funcionará con estos nuevos datos.
                                </p>
                                <p className="text-sm font-bold text-navy mb-6">
                                    Te quedan: <span className="text-primary text-lg">{usesRemaining}</span> ediciones.
                                </p>

                                <div className="flex flex-col gap-3 w-full max-w-sm">
                                    <button
                                        onClick={downloadVCard}
                                        disabled={loading}
                                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                                        Descargar Archivo de Contacto (.vcf)
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="text-navy/50 font-bold uppercase text-xs hover:text-navy transition-colors py-2"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer Actions */}
                    {step === 'edit' && (
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setStep('code')}
                                className="px-6 py-2 rounded-xl border border-gray-300 font-bold text-gray-500 hover:bg-gray-100 transition-colors uppercase text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                 onClick={handleSave}
                                 disabled={loading || uploadingPhoto}
                                 className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors uppercase text-sm flex items-center gap-2 disabled:opacity-50"
                             >
                                 {loading ? <Loader2 className="animate-spin" size={18} /> : (uploadingPhoto ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />)}
                                 {loading ? 'Guardando...' : (uploadingPhoto ? 'Procesando...' : 'Guardar Cambios')}
                             </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
