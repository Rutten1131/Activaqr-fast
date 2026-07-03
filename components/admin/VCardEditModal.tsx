import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Download, Save, RefreshCw, QrCode, ExternalLink, Clock, X as CloseIcon, Video, Store, Library, Plus, Edit, Zap, ChevronDown, Star, Info, LogOut, CheckCircle, FileText, Loader2, ShieldCheck, User, Image as ImageIcon, AlertCircle, Copy, Layers, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/upload';

interface VCardEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    registro: any;
    setRegistro: (reg: any) => void;
    onSave: (nombre: string) => void;
    onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPortadaUpload: (e: React.ChangeEvent<HTMLInputElement>, tipo: 'portada_desktop' | 'portada_movil') => void;
    isSaving: boolean;
    isAdmin?: boolean;
}

export default function VCardEditModal({
    isOpen,
    onClose,
    registro: editingRegistro,
    setRegistro: setEditingRegistro,
    onSave,
    onPhotoUpload,
    onPortadaUpload,
    isSaving,
    isAdmin = false
}: VCardEditModalProps) {
    const [catalogTab, setCatalogTab] = useState<'config' | 'products'>('config');
    const [productCategoryFilter, setProductCategoryFilter] = useState<string>('Todas');
    const categoryFilterRef = useRef(productCategoryFilter);

    useEffect(() => {
        categoryFilterRef.current = productCategoryFilter;
    }, [productCategoryFilter]);

    // 🔄 Sincronizar NUEVAS líneas de productos_servicios → catálogo (solo cuando se agregan/eliminan líneas)
    useEffect(() => {
        const raw = editingRegistro?.productos_servicios || '';
        const rawLines = raw.split('\n').map((l: string) => l.trim()).filter(Boolean);
        if (rawLines.length === 0) return;

        let catalogo = editingRegistro.catalogo_json;
        if (typeof catalogo === 'string') { try { catalogo = JSON.parse(catalogo); } catch { catalogo = {}; } }
        if (!catalogo || typeof catalogo !== 'object') catalogo = { categories: [], products: [] };
        if (!catalogo.categories) catalogo.categories = [];

        // Limpiar 'Nueva Categoría' del array existente
        const cleanCategories = catalogo.categories.filter((c: string) => c !== 'Nueva Categoría');
        
        // Solo agregar líneas NUEVAS que no existan ya como categorías
        const newCats = rawLines.filter((line: string) => !cleanCategories.includes(line));
        if (newCats.length > 0 || cleanCategories.length !== catalogo.categories.length) {
            catalogo.categories = [...cleanCategories, ...newCats];
            setEditingRegistro({ ...editingRegistro, catalogo_json: catalogo });
        }
    }, [editingRegistro?.productos_servicios]);

    const [heroSectionOpen, setHeroSectionOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'identidad' | 'contacto' | 'contenido' | 'hero' | 'catalogo' | 'qr' | 'vip' | 'categorias'>('identidad');
    const [isStructuring, setIsStructuring] = useState(false);
    // ── Slug Changer ──
    const [newSlug, setNewSlug] = useState('');
    const [isChangingSlug, setIsChangingSlug] = useState(false);
    const [slugMessage, setSlugMessage] = useState('');
    const [slugError, setSlugError] = useState(false);

    // Video Aspect Ratio Helper
    const getVideoAspectFromUrl = (url: string | null | undefined): 'vertical' | 'horizontal' | 'auto' => {
        if (!url) return 'auto';
        try {
            const urlObj = new URL(url);
            const aspect = urlObj.searchParams.get('aspect');
            if (aspect === 'vertical') return 'vertical';
            if (aspect === 'horizontal') return 'horizontal';
        } catch { /* ignore */ }
        return 'auto';
    };

    const setVideoAspectInUrl = (url: string, aspect: 'vertical' | 'horizontal' | 'auto'): string => {
        try {
            const urlObj = new URL(url);
            if (aspect === 'auto') {
                urlObj.searchParams.delete('aspect');
            } else {
                urlObj.searchParams.set('aspect', aspect);
            }
            return urlObj.toString();
        } catch {
            return url;
        }
    };

    const handleChangeSlug = async () => {
        if (!newSlug || newSlug === editingRegistro.slug) return;
        if (!/^[a-z0-9-]+$/.test(newSlug)) {
            alert('❌ El slug solo puede contener: minúsculas, números y guiones');
            return;
        }
        if (newSlug.length < 5 || newSlug.length > 100) {
            alert('❌ El slug debe tener entre 5 y 100 caracteres');
            return;
        }
        setIsChangingSlug(true);
        try {
            const adminKey = localStorage.getItem('admin_access_key') || '';
            const res = await fetch('/api/admin/change-slug', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({
                    id: editingRegistro.id,
                    new_slug: newSlug
                })
            });
            const data = await res.json();
            if (!res.ok) {
                alert('❌ Error: ' + (data.error || 'Error al cambiar slug'));
                return;
            }
            alert('✅ Slug cambiado correctamente.\n\nAntes: /' + editingRegistro.slug + '\nAhora: /' + newSlug);
            setEditingRegistro({ ...editingRegistro, slug: newSlug });
            setNewSlug('');
        } catch (err) {
            alert('❌ Error de conexión al cambiar el slug');
        } finally {
            setIsChangingSlug(false);
        }
    };

    const handleAutoStructure = async () => {
        const text = editingRegistro.menu_digital;
        if (!text || text.length < 10) {
            alert('Por favor escribe algo de texto primero para poder estructurarlo.');
            return;
        }

        if (text.trim().startsWith('[')) {
            alert('Parece que ya tienes un formato JSON. Si quieres re-estructurar, borra los corchetes y deja solo el texto.');
            return;
        }

        setIsStructuring(true);
        try {
            const res = await fetch('/api/structure-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            
            const data = await res.json();
            if (data.json) {
                setEditingRegistro({ ...editingRegistro, menu_digital: data.json });
            } else {
                alert(data.error || 'Error al estructurar el menú.');
            }
        } catch (err) {
            console.error('Error structuring menu:', err);
            alert('Error de conexión con la IA.');
        } finally {
            setIsStructuring(false);
        }
    };

    // ── Hero Slides Management ──
    const heroSlides = (() => {
        let raw = editingRegistro?.hero_slides_json;
        if (!raw) return [];
        if (typeof raw === 'string') {
            try { raw = JSON.parse(raw); } catch { return []; }
        }
        return Array.isArray(raw) ? raw : [];
    })();

    const updateHeroSlides = (slides: any[]) => {
        setEditingRegistro({ ...editingRegistro, hero_slides_json: slides });
    };

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
            // Oferta limitada para este banner
            offerEnabled: false,
            offerTitle: '',
            offerDescription: '',
            offerOriginalPrice: '',
            offerPrice: '',
            offerExpiresAt: '',
            offerCtaText: ''
        };
        updateHeroSlides([...heroSlides, newSlide]);
    };

    const removeHeroSlide = (slideId: string) => {
        if (heroSlides.length <= 1) {
            alert('Debe haber al menos 1 banner.');
            return;
        }
        updateHeroSlides(heroSlides.filter((s: any) => s.id !== slideId));
    };

    const toggleHeroSlideActive = (slideId: string, currentlyActive: boolean) => {
        if (currentlyActive) {
            const activeCount = heroSlides.filter((s: any) => s.active).length;
            if (activeCount <= 1) {
                alert('Debe haber al menos 1 banner activo.');
                return;
            }
        }
        updateHeroSlides(heroSlides.map((s: any) => s.id === slideId ? { ...s, active: !s.active } : s));
    };

    const handleHeroSlideImageUpload = async (file: File, slideId: string, field: 'portada_desktop' | 'portada_movil') => {
        try {
            const { url } = await uploadFile({ file, slug: editingRegistro?.slug });
            updateHeroSlides(heroSlides.map((s: any) => s.id === slideId ? { ...s, [field]: url } : s));
        } catch (err) {
            console.error('Error uploading hero slide image:', err);
            alert('Error de conexión al subir imagen.');
        }
    };

    if (!isOpen || !editingRegistro) return null;

    // Parse JSON Override for VIP Easy Labels
    const vipMappings = (() => {
        const raw = editingRegistro.json_override;
        
        // Si ya hay datos guardados, los devolvemos
        if (raw && raw !== '{}') {
            try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return Object.entries(parsed)
                    .filter(([_, v]) => typeof v === 'string')
                    .map(([find, replace]) => ({ find, replace: String(replace) }));
            } catch (e) {
                console.error("Error parsing json_override:", e);
            }
        }

        // --- SÚPER ESCÁNER AUTOMÁTICO ---
        const autoTags: { find: string, replace: string }[] = [];
        
        // Función para extraer textos de cualquier objeto o array (recursivo)
        const extractTexts = (obj: any) => {
            if (!obj) return;
            if (typeof obj === 'string') {
                const trimmed = obj.trim();
                // Si es un texto corto, NO ES UNA FECHA, NO ES EMAIL, y relevante (< 45 carac)
                const isDate = /^\d{4}-\d{2}-\d{2}/.test(trimmed);
                const isEmail = trimmed.includes('@');
                const isHash = /^[a-f0-9-]{20,}$/i.test(trimmed);

                if (trimmed.length > 2 && trimmed.length < 45 && !trimmed.startsWith('http') && !isDate && !isEmail && !isHash) {
                    if (!autoTags.some(t => t.find === trimmed)) {
                        autoTags.push({ find: trimmed, replace: '' });
                    }
                }
            } else if (Array.isArray(obj)) {
                obj.forEach(item => extractTexts(item));
            } else if (typeof obj === 'object') {
                Object.entries(obj).forEach(([key, value]) => {
                    // Ignoramos campos técnicos o URLs
                    if (['url', 'image', 'icon', 'id', 'slug', 'color', 'status', 'plan'].includes(key)) return;
                    extractTexts(value);
                });
            }
        };

        // Escaneamos TODO el registro (Campos base y JSONs)
        Object.entries(editingRegistro).forEach(([key, value]) => {
            // Saltamos campos que sabemos que no son etiquetas de vCard
            if (['id', 'user_id', 'slug', 'status', 'json_override', 'catalogo_json', 'foto_url', 'portada_url'].includes(key)) return;
            
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                try {
                    const parsed = JSON.parse(value);
                    extractTexts(parsed);
                } catch (e) {
                    extractTexts(value);
                }
            } else {
                extractTexts(value);
            }
        });

        return autoTags;
    })();

    const updateVipMappings = (mappings: { find: string, replace: string }[]) => {
        // Read existing overrides to preserve complex objects
        let existingObj: Record<string, any> = {};
        try {
            const raw = editingRegistro.json_override;
            existingObj = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
        } catch (e) {}

        const newObj: Record<string, any> = {};
        // Keep complex keys (like experienceImages, experienceTitle, etc.)
        Object.entries(existingObj).forEach(([k, v]) => {
            if (typeof v !== 'string' || k === 'experienceTitle' || k === 'experienceSubtitle') {
                newObj[k] = v;
            }
        });

        // Add mapping keys
        mappings.forEach(m => {
            if (m.find) newObj[m.find] = m.replace;
        });

        setEditingRegistro({ ...editingRegistro, json_override: newObj });
    };

    const experienceCategories = (() => {
        let title = "";
        let subtitle = "";
        let images: any[] = [];
        let parsed: any = {};
        try {
            const raw = editingRegistro.json_override;
            parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
            title = parsed.experienceTitle || "";
            subtitle = parsed.experienceSubtitle || "";
            images = parsed.experienceImages || [];
        } catch (e) {}
        
        const rawLines = editingRegistro?.productos_servicios
            ?.split('\n')
            .filter((l: string) => l.trim().length > 0)
            .slice(0, 10) || [];
            
        // Preparar reemplazos VIP para mostrar el texto "final"
        const replacements = (() => {
            const raw = editingRegistro.json_override;
            if (!raw) return {};
            try {
                return typeof raw === 'string' ? JSON.parse(raw) : raw;
            } catch (e) { return {}; }
        })();
            
        return {
            title,
            subtitle,
            categories: rawLines.map((cat: string, index: number) => {
                const customImg = images.find((i: any) => i.index === index);
                const customTitleObj = (parsed.experienceTitles || []).find((t: any) => t.index === index);
                
                // Prioridad: 1. Título por índice, 2. Reemplazo global, 3. Texto original
                const displayTitle = customTitleObj?.title || replacements[cat] || cat;
                
                return {
                    index,
                    originalTitle: cat,
                    title: displayTitle,
                    img: customImg?.url || ''
                }
            })
        };
    })();

    const updateCategoryTitle = (index: number, newTitle: string) => {
        let parsed: any = {};
        try {
            const raw = editingRegistro.json_override;
            parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
        } catch (e) {}
        
        if (!parsed.experienceTitles) parsed.experienceTitles = [];
        
        const existingIdx = parsed.experienceTitles.findIndex((t: any) => t.index === index);
        if (existingIdx >= 0) {
            parsed.experienceTitles[existingIdx].title = newTitle;
        } else {
            parsed.experienceTitles.push({ index, title: newTitle });
        }
        
        // Actualizar el nombre DIRECTAMENTE en Catálogo Pro por su ÍNDICE
        const catalogo = { ...(editingRegistro.catalogo_json || { categories: [], products: [] }) };
        if (typeof catalogo.categories === 'string') { try { catalogo.categories = JSON.parse(catalogo.categories); } catch { catalogo.categories = []; } }
        if (Array.isArray(catalogo.categories) && newTitle && index >= 0 && index < catalogo.categories.length) {
            catalogo.categories[index] = newTitle;
        }
        setEditingRegistro({ ...editingRegistro, json_override: parsed, catalogo_json: catalogo });
    };

    const updateExperienceCategories = (newTitle: string, newImages: any[], newSubtitle?: string) => {
        let parsed: any = {};
        try {
            const raw = editingRegistro.json_override;
            parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
        } catch (e) {}
        
        if (newTitle !== undefined) {
            if (newTitle) parsed.experienceTitle = newTitle;
            else delete parsed.experienceTitle;
        }
        
        if (newSubtitle !== undefined) {
            if (newSubtitle) parsed.experienceSubtitle = newSubtitle;
            else delete parsed.experienceSubtitle;
        }
        
        if (newImages !== undefined) {
            if (newImages.length > 0) parsed.experienceImages = newImages;
            else delete parsed.experienceImages;
        }
        
        setEditingRegistro({ ...editingRegistro, json_override: parsed });
    };

    const handleCategoryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        try {
            const { url } = await uploadFile({ file, slug: editingRegistro?.slug });
            
            let parsed: any = {};
            try {
                const raw = editingRegistro.json_override;
                parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
            } catch (err) {}
            
            const currentImages = [...(parsed.experienceImages || [])];
            const existingIndex = currentImages.findIndex((i: any) => i.index === index);
            
            if (existingIndex >= 0) {
                currentImages[existingIndex] = { ...currentImages[existingIndex], url };
            } else {
                currentImages.push({ index, url });
            }
            
            parsed.experienceImages = currentImages;
            setEditingRegistro({ ...editingRegistro, json_override: parsed });
        } catch (err) {
            alert('Error al subir la imagen.');
        }
    };

    const updateExperienceButton = (fields: Partial<{ text: string; action: 'whatsapp' | 'link' | 'file'; url: string; fileUrl: string }>) => {
        let parsed: any = {};
        try {
            const raw = editingRegistro.json_override;
            parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
        } catch (e) {}

        const currentBtn = parsed.experienceButton || { text: "", action: "whatsapp", url: "", fileUrl: "" };
        parsed.experienceButton = { ...currentBtn, ...fields };

        setEditingRegistro({ ...editingRegistro, json_override: parsed });
    };

    const handleExperienceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        try {
            const { url } = await uploadFile({ file, slug: editingRegistro?.slug });
            updateExperienceButton({ fileUrl: url });
        } catch (err) {
            alert('Error al subir el archivo.');
        }
    };

    // --- Hedkandi Template Config: Marquee Text ---
    const marqueeText = (() => {
        let parsed: any = {};
        try {
            const raw = editingRegistro?.json_override;
            parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
        } catch (e) {}
        return parsed.marqueeText || editingRegistro?.nombre_negocio || '';
    })();

    const updateMarqueeText = (text: string) => {
        let parsed: any = {};
        try {
            const raw = editingRegistro.json_override;
            parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
        } catch (e) {}

        parsed.marqueeText = text;
        setEditingRegistro({ ...editingRegistro, json_override: parsed });
    };

    // Preparar sugerencias/atajos rápidos para este perfil
    const quickShortcuts = [
        { label: '🖋️ Estudio de Tatuajes', value: 'Estudio de Tatuajes' },
        { label: '🚬 Vape & Smoke Shop', value: 'Vape & Smoke Shop' },
        { label: '👕 Tienda Ropa Urbana', value: 'Tienda Ropa Urbana' }
    ];

    const suggestions = [
        ...(editingRegistro.empresa ? [{ label: '🏢 Empresa', value: editingRegistro.empresa }] : []),
        ...(editingRegistro.profesion ? [{ label: '👔 Profesión', value: editingRegistro.profesion }] : []),
        ...(editingRegistro.nombre ? [{ label: '👤 Nombre', value: editingRegistro.nombre }] : []),
    ].filter((s, index, self) => 
        s.value && s.value.trim() !== '' && 
        self.findIndex(t => t.value === s.value) === index
    );

    // Parse catalogo_json into a usable object
    // Normalizar campos legacy de productos (Catalog Manager usa titulo/url, VCardEditModal usa nombre/imagenes)
    const normalizeProduct = (p: any) => {
        const normalized = { ...p };
        // Mapear titulo → nombre/name
        if (!normalized.nombre && !normalized.name && normalized.titulo) {
            normalized.nombre = normalized.titulo;
            normalized.name = normalized.titulo;
        }
        // Mapear url → imagenes array
        if ((!normalized.imagenes || normalized.imagenes.length === 0) && normalized.url) {
            normalized.imagenes = [normalized.url];
        }
        if ((!normalized.imagenes || normalized.imagenes.length === 0) && normalized.image) {
            normalized.imagenes = [normalized.image];
        }
        // Mapear descripcion/description
        if (!normalized.descripcion && !normalized.description) {
            normalized.descripcion = normalized.descripcion || '';
            normalized.description = normalized.description || '';
        }
        // Mapear precio/price
        if (!normalized.precio && !normalized.price) {
            normalized.precio = normalized.precio || '';
            normalized.price = normalized.price || '';
        }
        return normalized;
    };

    const catalogoJson = (() => {
        let raw = editingRegistro.catalogo_json;
        if (!raw) return { categories: [] as string[], products: [] as any[] };
        
        let parsed = raw;
        if (typeof raw === 'string') {
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                return { categories: [] as string[], products: [] as any[] };
            }
        }
        
        if (Array.isArray(parsed)) {
            const products = parsed.map((p: any) => {
                // Usar string vacío para productos sin categoría válida
                const rawCat = p.categoria || p.category || '';
                const invalidCats = ['Nueva Categoría', 'Sin Categoría', 'Todas', ''];
                const normalizedCat = invalidCats.includes(rawCat) ? '' : rawCat;
                return normalizeProduct({ ...p, categoria: normalizedCat, category: normalizedCat });
            });
            // Filtrar categorías inválidas
            const invalidCats = ['Nueva Categoría', 'Sin Categoría', 'Todas', ''];
            const validCategories = Array.from(new Set(products.map((p: any) => p.categoria).filter((c: string) => c && !invalidCats.includes(c))));
            return {
                categories: validCategories,
                products: products
            };
        }
        
        if (typeof parsed === 'object' && parsed !== null) {
            const rawCats = (parsed.categories || []) as string[];
            // Filtrar categorías inválidas
            const invalidCats = ['Nueva Categoría', 'Sin Categoría', 'Todas', ''];
            const normalizedCats = rawCats.filter(c => c && !invalidCats.includes(c));
            const products = (parsed.products || []).map((p: any) => {
                const rawCat = p.categoria || p.category || '';
                const normalizedCat = invalidCats.includes(rawCat) ? '' : rawCat;
                return normalizeProduct({ ...p, categoria: normalizedCat, category: normalizedCat });
            });
            // Añadir categorías de productos que no estén en la lista
            const productCats = products.map((p: any) => p.categoria).filter((c: string) => c && !invalidCats.includes(c));
            const allValidCats = [...new Set([...normalizedCats, ...productCats])];
            return {
                categories: allValidCats,
                products: products
            };
        }
        
        return { categories: [] as string[], products: [] as any[] };
    })();

    const updateCatalogo = (updated: { categories: string[], products: any[] }) => {
        setEditingRegistro({ ...editingRegistro, catalogo_json: updated });
    };

    const handleDeleteCategory = (catName: string) => {
        const catalogoJson = (() => {
            const raw = editingRegistro.catalogo_json;
            if (!raw) return { categories: [], products: [] };
            if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return { categories: [], products: [] }; } }
            return raw;
        })();
        const productCount = catalogoJson.products.filter(
            (p: any) => (p.categoria || p.category || '').toLowerCase() === catName.toLowerCase()
        ).length;
        const msg = productCount > 0
            ? 'Eliminar categoria "' + catName + '"?\n\nADVERTENCIA: Tambien se eliminaran ' + productCount + ' producto(s) de esta categoria.\n\nEsta accion no se puede deshacer.'
            : 'Eliminar categoria "' + catName + '"?\n\nEsta categoria esta vacia, se eliminara sin afectar productos.';
        if (!confirm(msg)) return;
        updateCatalogo({ 
            ...catalogoJson, 
            products: catalogoJson.products.filter((p: any) => 
                (p.categoria || p.category || '').toLowerCase() !== catName.toLowerCase()
            ),
            categories: catalogoJson.categories.filter((cat: any) => cat !== catName) 
        });
    };

    const handleCloneProduct = (prod: any) => {
        if (catalogoJson.products.length >= 20) {
            alert("Máximo 20 productos permitidos. No se puede clonar.");
            return;
        }
        const cloned = {
            ...prod,
            id: `prod_${Date.now()}`,
            nombre: (prod.nombre || prod.name || 'Producto') + ' (Copia)',
            name: (prod.nombre || prod.name || 'Producto') + ' (Copia)',
        };
        updateCatalogo({ ...catalogoJson, products: [cloned, ...catalogoJson.products] });
    };

    const handleSaveEdit = () => {
        let recalculatedNombre = editingRegistro.nombre;
        if (editingRegistro.tipo_perfil === 'persona') {
            recalculatedNombre = `${editingRegistro.nombres || ''} ${editingRegistro.apellidos || ''}`.trim();
        } else if (editingRegistro.tipo_perfil === 'negocio') {
            recalculatedNombre = editingRegistro.nombre_negocio || editingRegistro.nombre;
        }
        
        onSave(recalculatedNombre);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl bg-[#050B1C] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
                {/* Header */}
                <div className="sticky top-0 z-20 bg-[#050B1C]/80 backdrop-blur-xl border-b border-white/10 p-8 flex justify-between items-start">
                    <div>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">Editar Registro</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2">ID: {editingRegistro.id}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Slug:</span>
                            <span className="text-[10px] font-mono font-black text-white/80">/{editingRegistro.slug}</span>
                            <span className="text-[10px] text-white/20">→</span>
                            <input
                                type="text"
                                value={newSlug || editingRegistro.slug || ''}
                                onChange={(e) => setNewSlug(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[10px] font-mono font-bold text-white/80 w-44 focus:outline-none focus:border-primary/50"
                                placeholder="nuevo-slug"
                            />
                            {newSlug && newSlug !== editingRegistro.slug && (
                                <button
                                    onClick={handleChangeSlug}
                                    disabled={isChangingSlug}
                                    className="px-3 py-1 rounded-md bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-wider hover:bg-primary/30 transition-all disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isChangingSlug ? (
                                        <><Loader2 size={10} className="animate-spin" /> Guardando...</>
                                    ) : (
                                        <><CheckCircle size={10} /> Guardar Slug</>
                                    )}
                                </button>
                            )}
                            {slugMessage && (
                                <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider",
                                    slugError ? "text-red-400" : "text-green-400"
                                )}>
                                    {slugMessage}
                                </span>
                            )}
                        </div>
                        {editingRegistro.edit_code && (
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-[11px] font-mono font-black text-green-400 bg-green-400/10 px-3 py-1 rounded-md border border-green-400/20 tracking-widest flex items-center gap-2">
                                    CÓDIGO DE EDICIÓN: {editingRegistro.edit_code}
                                </span>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(editingRegistro.edit_code); 
                                        alert('Código copiado: ' + editingRegistro.edit_code); 
                                    }} 
                                    className="text-green-400/50 hover:text-green-400 transition-colors p-1.5 bg-white/5 rounded-md border border-white/10 hover:border-green-400/30 flex items-center gap-1" 
                                    title="Copiar código de edición"
                                >
                                    <Copy size={12} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Copiar</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <span className={cn(
                            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            editingRegistro.status === 'pagado' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                editingRegistro.status === 'entregado' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                    "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        )}>
                            {editingRegistro.status}
                        </span>
                        <span className={cn(
                            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            editingRegistro.plan === 'pro' || editingRegistro.plan === 'business' || editingRegistro.plan === 'catalog' || editingRegistro.plan === 'digital' 
                                ? "bg-primary/10 text-primary border-primary/20" 
                                : "bg-white/5 text-white/40 border-white/10"
                        )}>
                            {editingRegistro.plan === 'catalog' ? 'Business + Catálogo' : 
                             editingRegistro.plan === 'business' ? 'Business' : 
                             editingRegistro.plan === 'pro' || editingRegistro.plan === 'digital' ? 'Digital' : 
                             editingRegistro.plan}
                        </span>
                        <button 
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-2xl transition-all"
                        >
                            <CloseIcon size={24} />
                        </button>
                    </div>
                </div>

                {/* Main Layout: Sidebar + Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar Navigation */}
                    <div className="w-72 bg-[#0A1229]/50 border-r border-white/5 p-8 flex flex-col gap-10 overflow-y-auto scrollbar-hide">
                        <div>
                            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-5 px-2">PERFIL & IDENTIDAD</h4>
                            <div className="flex flex-col gap-1.5">
                                {[
                                    { id: 'identidad', label: 'Datos Básicos', icon: <User size={14} /> },
                                    { id: 'contacto', label: 'Redes & Contacto', icon: <Copy size={14} /> },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all group",
                                            activeTab === tab.id 
                                                ? "bg-primary text-navy shadow-[0_10px_20px_rgba(255,107,0,0.2)] scale-[1.02]" 
                                                : "text-white/30 hover:bg-white/5 hover:text-white/60"
                                        )}
                                    >
                                        <span className={cn("transition-transform group-hover:scale-110", activeTab === tab.id ? "text-navy" : "text-primary/60")}>
                                            {tab.icon}
                                        </span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-5 px-2">CONTENIDO DINÁMICO</h4>
                            <div className="flex flex-col gap-1.5">
                                {[
                                    { id: 'contenido', label: 'Bio & Servicios', icon: <FileText size={14} /> },
                                    { id: 'hero', label: 'Banners & Media', icon: <ImageIcon size={14} /> },
                                    { id: 'categorias', label: 'Categorías (Experiencia)', icon: <Layers size={14} /> },
                                    ...(editingRegistro.plan === 'catalog' ? [{ id: 'catalogo', label: 'Catálogo Pro', icon: <Store size={14} /> }] : []),
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all group",
                                            activeTab === tab.id 
                                                ? "bg-primary text-navy shadow-[0_10px_20px_rgba(255,107,0,0.2)] scale-[1.02]" 
                                                : "text-white/30 hover:bg-white/5 hover:text-white/60"
                                        )}
                                    >
                                        <span className={cn("transition-transform group-hover:scale-110", activeTab === tab.id ? "text-navy" : "text-primary/60")}>
                                            {tab.icon}
                                        </span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-5 px-2">HERRAMIENTAS PRO</h4>
                            <div className="flex flex-col gap-1.5">
                                {[
                                    { id: 'qr', label: 'Diseño QR', icon: <QrCode size={14} /> },
                                    { id: 'vip', label: 'Personalización VIP', icon: <ShieldCheck size={14} /> },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all group",
                                            activeTab === tab.id 
                                                ? "bg-primary text-navy shadow-[0_10px_20px_rgba(255,107,0,0.2)] scale-[1.02]" 
                                                : "text-white/30 hover:bg-white/5 hover:text-white/60"
                                        )}
                                    >
                                        <span className={cn("transition-transform group-hover:scale-110", activeTab === tab.id ? "text-navy" : "text-primary/60")}>
                                            {tab.icon}
                                        </span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 overflow-y-auto p-12 bg-black/20">
                        {activeTab === 'identidad' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* FOTOS DE PERFIL Y PORTADAS */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="col-span-1 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 ml-1">Foto de Perfil / Logo</h4>
                                        <div className="aspect-square bg-white/5 rounded-[32px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
                                            {editingRegistro.foto_url ? (
                                                <img src={editingRegistro.foto_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-white/20">
                                                    <Upload size={32} />
                                                    <span className="text-[10px] uppercase font-black tracking-widest">Subir Foto</span>
                                                </div>
                                            )}
                                            <label className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-10">
                                                <Upload size={24} className="text-white" />
                                                <input type="file" className="hidden" accept="image/*" onChange={onPhotoUpload} />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-8 h-full flex flex-col justify-center">
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-4">CONFIGURACIÓN BÁSICA</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Estado</label>
                                                        <select
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all appearance-none"
                                                            value={editingRegistro.status}
                                                            onChange={e => setEditingRegistro({ ...editingRegistro, status: e.target.value })}
                                                        >
                                                            <option value="pendiente" className="bg-navy">Pendiente</option>
                                                            <option value="pagado" className="bg-navy">Pagado</option>
                                                            <option value="entregado" className="bg-navy">Entregado</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Plan contratado</label>
                                                            <select
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all appearance-none"
                                                            value={editingRegistro.plan === 'pro' || editingRegistro.plan === 'basic' ? 'digital' : (editingRegistro.plan || 'digital')}
                                                            onChange={e => setEditingRegistro({ ...editingRegistro, plan: e.target.value })}
                                                        >
                                                            <option value="digital" className="bg-navy">Digital ($35)</option>
                                                            <option value="business" className="bg-navy">Business ($100)</option>
                                                            <option value="catalog" className="bg-navy">Catálogo ($200)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* INFO PERSONAL */}
                                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-8">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-4">INFO PERSONAL</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Nombre que se mostrará</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all font-sans"
                                                    value={editingRegistro.nombre || ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        const updates: any = { nombre: val };
                                                        if (editingRegistro.tipo_perfil === 'negocio') {
                                                            updates.nombre_negocio = val;
                                                        }
                                                        setEditingRegistro({ ...editingRegistro, ...updates });
                                                    }}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Profesión / Cargo</label>
                                                    <input
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                        value={editingRegistro.profesion || ''}
                                                        onChange={e => setEditingRegistro({ ...editingRegistro, profesion: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Empresa</label>
                                                    <input
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                        value={editingRegistro.empresa || ''}
                                                        onChange={e => setEditingRegistro({ ...editingRegistro, empresa: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="pt-4 border-white/5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 block ml-1">Plantilla Visual</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { id: 'classic', name: 'Clásico' },
                                                        { id: 'hedkandi', name: 'Hedkandi' },
                                                        { id: 'industrial', name: 'Industrial' },
                                                        { id: 'carrocerias', name: 'Carrocerías' },
                                                    ].map(t => (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            onClick={() => setEditingRegistro({ ...editingRegistro, template_id: t.id })}
                                                            className={cn(
                                                                "py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all border",
                                                                (editingRegistro.template_id || 'classic') === t.id
                                                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                                                    : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                                                            )}
                                                        >
                                                            {t.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-white/5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 block ml-1">Tipo de Perfil</label>
                                                <div className="flex gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingRegistro({ ...editingRegistro, tipo_perfil: 'persona' })}
                                                        className={cn(
                                                            "flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border",
                                                            editingRegistro.tipo_perfil === 'persona' ? "bg-primary text-navy border-primary" : "bg-white/5 text-white/40 border-white/10"
                                                        )}
                                                    >
                                                        Persona
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingRegistro({ ...editingRegistro, tipo_perfil: 'negocio' })}
                                                        className={cn(
                                                            "flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border",
                                                            editingRegistro.tipo_perfil === 'negocio' ? "bg-primary text-navy border-primary" : "bg-white/5 text-white/40 border-white/10"
                                                        )}
                                                    >
                                                        Negocio
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {editingRegistro.tipo_perfil === 'persona' ? (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Nombres</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                    value={editingRegistro.nombres || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, nombres: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Apellidos</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                    value={editingRegistro.apellidos || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, apellidos: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Nombre del Negocio</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                    value={editingRegistro.nombre_negocio || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, nombre_negocio: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block ml-1">Nombre Contacto (Opcional)</label>
                                                    <input
                                                        className="w-full bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                        value={editingRegistro.contacto_nombre || ''}
                                                        onChange={e => setEditingRegistro({ ...editingRegistro, contacto_nombre: e.target.value })}
                                                        placeholder="Ej. Juan"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2 block ml-1">Apellido Contacto (Opcional)</label>
                                                    <input
                                                        className="w-full bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                        value={editingRegistro.contacto_apellido || ''}
                                                        onChange={e => setEditingRegistro({ ...editingRegistro, contacto_apellido: e.target.value })}
                                                        placeholder="Ej. Paz"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'contacto' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-8">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-4">DATOS DE CONTACTO</h4>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">WhatsApp (con código de país, ej: +593...)</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all text-sm"
                                                    value={editingRegistro.whatsapp || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, whatsapp: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Email Principal</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all text-sm"
                                                    value={editingRegistro.email || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Columna Derecha: Redes y Links */}
                                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-8">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-4">REDES Y LINKS</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Facebook</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                    value={editingRegistro.facebook || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, facebook: e.target.value })}
                                                    placeholder="URL perfil"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Instagram</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                    value={editingRegistro.instagram || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, instagram: e.target.value })}
                                                    placeholder="URL perfil"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">TikTok</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                    value={editingRegistro.tiktok || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, tiktok: e.target.value })}
                                                    placeholder="URL perfil"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">LinkedIn</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold text-white outline-none focus:border-primary/40 transition-all text-xs"
                                                    value={editingRegistro.linkedin || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, linkedin: e.target.value })}
                                                    placeholder="URL perfil"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">YouTube Canal</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold outline-none focus:border-primary/40 transition-all text-xs"
                                                    value={editingRegistro.youtube || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, youtube: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">X (Twitter)</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-bold outline-none focus:border-primary/40 transition-all text-xs"
                                                    value={editingRegistro.x || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, x: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'contenido' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* CONTENIDO Y UBICACIÓN */}
                                <div className="space-y-8">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-4">CONTENIDO Y UBICACIÓN</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Biografía / Sobre Mí</label>
                                                <textarea
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all resize-none min-h-[120px]"
                                                    value={editingRegistro.bio || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, bio: e.target.value })}
                                                />
                                            </div>
                                            {/* Soluciones Destacadas - Visible for professional plans except Catalog (as it has its own catalog) */}
                                            {(() => {
                                                let menuCategories: any[] = [];
                                                try {
                                                    if (editingRegistro.menu_digital) {
                                                        const parsed = typeof editingRegistro.menu_digital === 'string' ? JSON.parse(editingRegistro.menu_digital) : editingRegistro.menu_digital;
                                                        if (parsed && parsed.categories && Array.isArray(parsed.categories)) {
                                                            menuCategories = parsed.categories;
                                                        }
                                                    }
                                                } catch (e) {
                                                    // ignore
                                                }
                                                
                                                return (editingRegistro.plan === 'business' || editingRegistro.plan === 'catalog' || editingRegistro.plan === 'digital' || editingRegistro.plan === 'pro' || editingRegistro.plan === 'basic') && (
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary block ml-1">Soluciones Destacadas</label>
                                                    {((editingRegistro.plan === 'business' || editingRegistro.plan === 'catalog') && menuCategories && menuCategories.length > 0) ? (
                                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 transition-all">
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold animate-pulse">✨</span>
                                                                <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                                                                    Sincronizado automáticamente con tu Carta / Menú
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-white/50 leading-normal">
                                                                Las categorías activas de tu Menú Digital o Catálogo de Servicios alimentan automáticamente la sección de servicios principales en tu vCard.
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                                {menuCategories.map((cat: any, i: number) => (
                                                                    <span key={cat.id || i} className="inline-flex items-center bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white/80 shadow-sm border-dashed">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
                                                                        {cat.nombre || cat.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        editingRegistro.plan !== 'catalog' && (
                                                            <>
                                                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                                                                    <div>
                                                                        <p className="text-[9px] font-bold text-white/40 leading-tight">Edita o elimina los servicios extraídos.</p>
                                                                    </div>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = (editingRegistro.productos_servicios || '').trim();
                                                                            const separator = '\n';
                                                                            setEditingRegistro({ ...editingRegistro, productos_servicios: current + (current ? separator : '') + 'Nuevo Servicio' });
                                                                        }}
                                                                        className="text-white hover:text-primary bg-white/5 hover:bg-white/10 px-4 py-2 font-black uppercase text-[9px] rounded-lg flex items-center gap-1 transition-all"
                                                                    >
                                                                        <Plus size={12} /> Añadir
                                                                    </button>
                                                                </div>
                                                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                                    {(() => {
                                                                        const rawText = editingRegistro.productos_servicios || '';
                                                                        const separator = '\n';
                                                                        const items = rawText.split(/[,\n]/).map((i: string) => i.trim()).filter((i: string) => i);
                                                                        
                                                                        if (items.length === 0) {
                                                                            return <p className="text-[10px] text-white/30 italic px-2">Aún no hay servicios destacados.</p>;
                                                                        }

                                                                        return items.map((item: string, idx: number) => (
                                                                            <div key={idx} className="flex gap-3 items-center bg-white/5 border border-white/10 p-3 rounded-xl hover:border-primary/30 transition-all group">
                                                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[12px] group-hover:scale-110 transition-transform">
                                                                                    ✨
                                                                                </div>
                                                                                <input
                                                                                    className="flex-1 bg-transparent border-b border-transparent focus:border-primary/50 outline-none text-xs font-bold text-white/90 placeholder-white/20 transition-all"
                                                                                    value={item}
                                                                                    onChange={e => {
                                                                                        const newItems = [...items];
                                                                                        newItems[idx] = e.target.value;
                                                                                        setEditingRegistro({ ...editingRegistro, productos_servicios: newItems.join('\n') });
                                                                                    }}
                                                                                />
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const newItems = [...items];
                                                                                        newItems.splice(idx, 1);
                                                                                        setEditingRegistro({ ...editingRegistro, productos_servicios: newItems.join('\n') });
                                                                                    }}
                                                                                    className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </div>
                                                                        ));
                                                                    })()}
                                                                </div>
                                                            </>
                                                        )
                                                    )}
                                                </div>
                                                );
                                            })()}

                                            {/* Etiquetas / Tags - Visible for all professional plans including Catalog */}
                                            {(editingRegistro.plan === 'business' || editingRegistro.plan === 'catalog' || editingRegistro.plan === 'digital' || editingRegistro.plan === 'pro' || editingRegistro.plan === 'basic') && (
                                                <div className="pt-4">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block ml-1">Etiquetas / Tags (Separados por coma)</label>
                                                    <input
                                                        className="w-full bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary transition-all text-xs"
                                                        value={editingRegistro.etiquetas || ''}
                                                        onChange={e => setEditingRegistro({ ...editingRegistro, etiquetas: e.target.value })}
                                                        placeholder="Ej. Parrillada, Eventos, Gourmet"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Dirección Física</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all"
                                                    value={editingRegistro.direccion || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, direccion: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Google Maps (URL Compartir)</label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/40 transition-all"
                                                    value={editingRegistro.google_business || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, google_business: e.target.value })}
                                                    placeholder="https://maps.app.goo.gl/..."
                                                />
                                            </div>
                                            {(editingRegistro.plan === 'business' || editingRegistro.plan === 'catalog' || editingRegistro.plan === 'digital') && (
                                                <div className="animate-in slide-in-from-top-2 group">
                                                    <div className="flex justify-between items-center mb-2 ml-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Carta / Menú Digital o Catálogo de Servicios</label>
                                                        <button 
                                                            onClick={handleAutoStructure}
                                                            disabled={isStructuring}
                                                            className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                                        >
                                                            {isStructuring ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : (
                                                                <Zap size={12} />
                                                            )}
                                                            {isStructuring ? 'Procesando...' : 'Estructurar con IA'}
                                                        </button>
                                                    </div>
                                                    <div className="flex justify-between items-center mb-2 ml-1">
                                                        <span className="text-[8px] font-bold text-white/40 uppercase group-hover:text-primary/60 transition-colors">Soporta URL o JSON Estructurado</span>
                                                    </div>
                                                    <textarea
                                                        className="w-full bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary transition-all min-h-[120px] text-sm font-mono scrollbar-hide"
                                                        value={editingRegistro.menu_digital || ''}
                                                        onChange={e => setEditingRegistro({ ...editingRegistro, menu_digital: e.target.value })}
                                                        placeholder='Pega una URL o el JSON de servicios: [{"name": "Corte", "items": [{"name": "Varón", "price": "$10"}]}]'
                                                    />
                                                    <p className="text-[9px] text-white/30 mt-2 ml-1 leading-relaxed italic">
                                                        * El formato JSON permite activar el modo "Gabinete" premium automáticamente para servicios de estética, barbería, fotografía, etc.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'hero' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* BANNERS DINÁMICOS HERO */}
                                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-8">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                                            <ImageIcon size={16} /> BANNERS DINÁMICOS HERO
                                        </h4>
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{heroSlides.length}/10 BANNERS</span>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Info Box */}
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-300">
                                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                            <div className="text-xs">
                                                <p className="font-bold">Mínimo 1 Banner Activo</p>
                                                <p className="opacity-60 mt-1">El sistema requiere que siempre haya al menos una imagen activa para mostrar en el inicio.</p>
                                            </div>
                                        </div>

                                        {/* Slides List */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {heroSlides.map((slide: any, index: number) => (
                                                <div key={slide.id} className={cn(
                                                    "border rounded-2xl p-5 transition-colors relative",
                                                    slide.active ? "border-white/10 bg-white/5" : "border-white/5 bg-white/[0.02] opacity-60"
                                                )}>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-primary text-navy text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{index + 1}</span>
                                                            <span className="text-sm font-bold text-white uppercase">Banner</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleHeroSlideActive(slide.id, slide.active)}
                                                                className={cn(
                                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors",
                                                                    slide.active ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                                                                )}
                                                            >
                                                                {slide.active ? 'Activo' : 'Inactivo'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeHeroSlide(slide.id)}
                                                                className="w-7 h-7 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 mb-4">
                                                        <div>
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2 block">Título del Banner</label>
                                                            <input
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary/40 transition-all"
                                                                value={slide.title || ''}
                                                                onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, title: e.target.value } : s))}
                                                                placeholder="Ej. Oferta del Hero"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2 block">Descripción del Banner</label>
                                                            <input
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary/40 transition-all"
                                                                value={slide.description || ''}
                                                                onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, description: e.target.value } : s))}
                                                                placeholder="Ej. Soluciones Premium"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Oferta Limitada por Banner */}
                                                    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-2xl p-5 border border-orange-500/20 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                                                                <Zap size={12} className="fill-orange-400" /> OFERTA DE TIEMPO LIMITADO
                                                            </h5>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerEnabled: !s.offerEnabled } : s))}
                                                                className={cn(
                                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase transition-colors",
                                                                    slide.offerEnabled ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                                                                )}
                                                            >
                                                                {slide.offerEnabled ? '✓ ACTIVA' : 'OFF'}
                                                            </button>
                                                        </div>

                                                        {slide.offerEnabled && (
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="col-span-2">
                                                                    <label className="text-[8px] font-black uppercase tracking-widest text-orange-400/60 block mb-1">Texto Badge</label>
                                                                    <input
                                                                        className="w-full bg-[#050B1C] border border-orange-500/30 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all"
                                                                        value={slide.offerTitle || ''}
                                                                        onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerTitle: e.target.value } : s))}
                                                                        placeholder="Ej. 20% OFF"
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <label className="text-[8px] font-black uppercase tracking-widest text-orange-400/60 block mb-1">Descripción</label>
                                                                    <input
                                                                        className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all"
                                                                        value={slide.offerDescription || ''}
                                                                        onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerDescription: e.target.value } : s))}
                                                                        placeholder="Ej. En todos los servicios"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] font-black uppercase tracking-widest text-orange-400/60 block mb-1">Precio Original</label>
                                                                    <input
                                                                        className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white/50 outline-none focus:border-orange-500 transition-all line-through"
                                                                        value={slide.offerOriginalPrice || ''}
                                                                        onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerOriginalPrice: e.target.value } : s))}
                                                                        placeholder="$100"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] font-black uppercase tracking-widest text-orange-400/60 block mb-1">Precio Oferta</label>
                                                                    <input
                                                                        className="w-full bg-[#050B1C] border border-orange-500/50 rounded-xl px-3 py-2 text-xs font-black text-orange-400 outline-none focus:border-orange-500 transition-all"
                                                                        value={slide.offerPrice || ''}
                                                                        onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerPrice: e.target.value } : s))}
                                                                        placeholder="$80"
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <label className="text-[8px] font-black uppercase tracking-widest text-orange-400/60 block mb-1">Vencimiento</label>
                                                                    <input
                                                                        type="datetime-local"
                                                                        className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all"
                                                                        value={slide.offerExpiresAt || ''}
                                                                        onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerExpiresAt: e.target.value } : s))}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <label className="text-[8px] font-black uppercase tracking-widest text-orange-400/60 block mb-1">Texto CTA</label>
                                                                    <input
                                                                        className="w-full bg-[#050B1C] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all"
                                                                        value={slide.offerCtaText || ''}
                                                                        onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerCtaText: e.target.value } : s))}
                                                                        placeholder="Aprovechar"
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <label className="text-[8px] font-black uppercase tracking-widest text-orange-400/60 block mb-1">Color del Modal</label>
                                                                    <div className="flex items-center gap-3">
                                                                        <input
                                                                            type="color"
                                                                            className="w-12 h-12 rounded-xl border-2 border-orange-500/30 cursor-pointer overflow-hidden"
                                                                            value={slide.offerColor || '#FF5C00'}
                                                                            onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerColor: e.target.value } : s))}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            className="flex-1 bg-[#050B1C] border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none"
                                                                            value={slide.offerColor || ''}
                                                                            onChange={e => updateHeroSlides(heroSlides.map((s: any) => s.id === slide.id ? { ...s, offerColor: e.target.value } : s))}
                                                                            placeholder="#FF5C00"
                                                                        />
                                                                        <span className="text-[9px] text-white/30 italic">Nombre o hex</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-white/20 block">Desktop (16:9)</label>
                                                            <div className="w-full aspect-video bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group relative">
                                                                {slide.portada_desktop ? (
                                                                    <img src={slide.portada_desktop} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[9px] uppercase font-black text-white/20">Sin Imagen</span>
                                                                )}
                                                                <label className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-10">
                                                                    <Upload size={18} className="text-white" />
                                                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleHeroSlideImageUpload(file, slide.id, 'portada_desktop');
                                                                    }} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-white/20 block">Móvil (4:5)</label>
                                                            <div className="w-full aspect-[4/5] bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group relative">
                                                                {slide.portada_movil ? (
                                                                    <img src={slide.portada_movil} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[9px] uppercase font-black text-white/20 text-center px-2">Sin Imagen</span>
                                                                )}
                                                                <label className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-10">
                                                                    <Upload size={18} className="text-white" />
                                                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleHeroSlideImageUpload(file, slide.id, 'portada_movil');
                                                                    }} />
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
                                                    className="border-2 border-dashed border-white/10 hover:border-primary/40 rounded-2xl text-white/30 hover:text-primary font-black uppercase text-[10px] tracking-widest transition-all flex flex-col items-center justify-center gap-3 min-h-[300px]"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                                        <Plus size={24} />
                                                    </div>
                                                    Añadir Nuevo Banner
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* CONFIGURACIÓN HERO (Solo Business/Catalog) */}
                                {(editingRegistro.plan === 'business' || editingRegistro.plan === 'catalog') && (
                                    <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/20 space-y-8">
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                                            <Zap size={18} className="fill-primary" /> CONFIGURACIÓN HERO (OFERTA)
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-2 block ml-1">Texto del Botón Principal</label>
                                                <input
                                                    className="w-full bg-[#050B1C] border border-primary/30 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary transition-all text-lg"
                                                    value={editingRegistro.hero_button_text || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, hero_button_text: e.target.value })}
                                                    placeholder="EJ. DESCARGAR CATÁLOGO"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-2 block ml-1">Título de la Oferta</label>
                                                <input
                                                    className="w-full bg-[#050B1C] border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary transition-all text-white"
                                                    value={editingRegistro.hero_section_title || ''}
                                                    onChange={e => setEditingRegistro({ ...editingRegistro, hero_section_title: e.target.value })}
                                                    placeholder="Ej. Promoción Especial de Invierno"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-2 block ml-1">Acción del Botón</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { id: 'wifi', label: 'Pasos/Inst.', icon: <Zap size={14} /> },
                                                        { id: 'file', label: 'Descargar', icon: <Download size={14} /> },
                                                        { id: 'link', label: 'Enlace', icon: <ExternalLink size={14} /> }
                                                    ].map((action) => (
                                                        <button
                                                            key={action.id}
                                                            type="button"
                                                            onClick={() => setEditingRegistro({ ...editingRegistro, hero_action: action.id })}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1",
                                                                (editingRegistro.hero_action === action.id || (!editingRegistro.hero_action && action.id === 'link')) 
                                                                    ? "border-primary bg-primary text-navy" 
                                                                    : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                                                            )}
                                                        >
                                                            {action.icon}
                                                            <span className="text-[9px] font-black uppercase">{action.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="md:col-span-2">
                                                {editingRegistro.hero_action === 'wifi' && (
                                                    <div className="p-6 bg-navy/40 rounded-3xl border border-white/5 space-y-4 animate-in slide-in-from-top-2">
                                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Configuración de Pasos Interactivos</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div className="space-y-3">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-white/20 uppercase ml-1">Paso 1: Título</label>
                                                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-primary" value={editingRegistro.hero_step1_title || ''} onChange={e => setEditingRegistro({ ...editingRegistro, hero_step1_title: e.target.value })} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-white/20 uppercase ml-1">Paso 1: Subtítulo</label>
                                                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-medium text-white/50 outline-none focus:border-primary" value={editingRegistro.hero_step1_text || ''} onChange={e => setEditingRegistro({ ...editingRegistro, hero_step1_text: e.target.value })} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-white/20 uppercase ml-1">Paso 2: Título</label>
                                                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-primary" value={editingRegistro.hero_step2_title || ''} onChange={e => setEditingRegistro({ ...editingRegistro, hero_step2_title: e.target.value })} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-white/20 uppercase ml-1">Paso 2: Subtítulo</label>
                                                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-medium text-white/50 outline-none focus:border-primary" value={editingRegistro.hero_step2_text || ''} onChange={e => setEditingRegistro({ ...editingRegistro, hero_step2_text: e.target.value })} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-white/20 uppercase ml-1">Paso 3: Título</label>
                                                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-primary" value={editingRegistro.hero_step3_title || ''} onChange={e => setEditingRegistro({ ...editingRegistro, hero_step3_title: e.target.value })} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-white/20 uppercase ml-1">Paso 3: Subtítulo</label>
                                                                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-medium text-white/50 outline-none focus:border-primary" value={editingRegistro.hero_step3_text || ''} onChange={e => setEditingRegistro({ ...editingRegistro, hero_step3_text: e.target.value })} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {editingRegistro.hero_action === 'link' && (
                                                    <div className="animate-in slide-in-from-top-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-2 block ml-1">Enlace Externo</label>
                                                        <input
                                                            className="w-full bg-[#050B1C] border border-primary/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary transition-all"
                                                            value={editingRegistro.hero_external_link || ''}
                                                            onChange={e => setEditingRegistro({ ...editingRegistro, hero_external_link: e.target.value })}
                                                            placeholder="https://pagina.com"
                                                        />
                                                    </div>
                                                )}

                                                {editingRegistro.hero_action === 'file' && (
                                                    <div className="animate-in slide-in-from-top-2 space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">URL del Archivo</label>
                                                            {editingRegistro.hero_file_url && (
                                                                <a href={editingRegistro.hero_file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                                                                    <ExternalLink size={10} /> Ver Archivo Actual
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <input
                                                                className="flex-1 bg-[#050B1C] border border-primary/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary transition-all"
                                                                value={editingRegistro.hero_file_url || ''}
                                                                onChange={e => setEditingRegistro({ ...editingRegistro, hero_file_url: e.target.value })}
                                                                placeholder="URL PDF o Imagen"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* REPUTACIÓN DIGITAL Y PRODUCTO VIDEO */}
                                {(editingRegistro.plan === 'business' || editingRegistro.plan === 'catalog') && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-8 bg-yellow-500/5 rounded-[2.5rem] border border-yellow-500/20 space-y-6">
                                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-yellow-500 flex items-center gap-3">
                                                <Star size={18} className="fill-yellow-500" /> REPUTACIÓN GOOGLE
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-yellow-500/40 mb-2 block">Rating Promedio</label>
                                                    <input
                                                        type="number" step="0.1" min="1" max="5"
                                                        className="w-full bg-[#050B1C] border border-yellow-500/20 rounded-2xl px-4 py-3 font-bold text-center text-xl text-yellow-500 outline-none focus:border-yellow-500"
                                                        value={editingRegistro.google_rating || ''}
                                                        onChange={e => setEditingRegistro({ ...editingRegistro, google_rating: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black uppercase text-yellow-500/40 mb-2 block">Total Reseñas</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-[#050B1C] border border-yellow-500/20 rounded-2xl px-4 py-3 font-bold text-center text-xl text-yellow-500 outline-none focus:border-yellow-500"
                                                        value={editingRegistro.google_reviews_count || ''}
                                                        onChange={e => setEditingRegistro({ ...editingRegistro, google_reviews_count: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/20 space-y-6">
                                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-3">
                                                <Video size={18} /> VIDEO PROMOCIONAL
                                            </h3>
                                            <div className="space-y-4">
                                                <label className="text-[9px] font-black uppercase text-red-500/40 mb-2 block">Enlace de Video (YouTube, TikTok, IG, FB) o archivo directo (BunnyNet, MP4)</label>
                                                <div className="flex gap-4">
                                                    <input
                                                        className="flex-1 bg-[#050B1C] border border-red-500/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-red-500 transition-all font-sans text-xs"
                                                        value={editingRegistro.youtube_video_url || ''}
                                                        onChange={e => setEditingRegistro({ ...editingRegistro, youtube_video_url: e.target.value })}
                                                        placeholder="Pega el link de YouTube, TikTok, Reel de IG o Video de Facebook"
                                                    />
                                                    <label className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-center border border-red-500/20 shadow-lg">
                                                        <Video size={20} />
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="video/*"
                                                            onChange={async e => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                const { url } = await uploadFile({ file, slug: editingRegistro?.slug });
                                                                setEditingRegistro({ ...editingRegistro, youtube_video_url: url });
                                                            }} 
                                                        />
                                                    </label>
                                                </div>
                                                {/* Selector de orientacion para videos directos */}
                                                <div className="flex items-center gap-3 pt-2">
                                                    <label className="text-[9px] font-black uppercase text-red-500/40">Orientación:</label>
                                                    <select
                                                        className="bg-[#050B1C] border border-red-500/20 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-red-500 outline-none"
                                                        value={getVideoAspectFromUrl(editingRegistro.youtube_video_url)}
                                                        onChange={e => {
                                                            const aspect = e.target.value as 'vertical' | 'horizontal' | 'auto';
                                                            const currentUrl = editingRegistro.youtube_video_url || '';
                                                            if (currentUrl) {
                                                                setEditingRegistro({ ...editingRegistro, youtube_video_url: setVideoAspectInUrl(currentUrl, aspect) });
                                                            }
                                                        }}
                                                    >
                                                        <option value="auto">Auto (detectar)</option>
                                                        <option value="vertical">Vertical (9:16)</option>
                                                        <option value="horizontal">Horizontal (16:9)</option>
                                                    </select>
                                                    <span className="text-[9px] text-white/30">Para videos directos (BunnyNet, MP4)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'categorias' && (() => {
                            const experienceButton = (() => {
                                let parsed: any = {};
                                try {
                                    const raw = editingRegistro.json_override;
                                    parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
                                } catch (e) {}
                                return parsed.experienceButton || { text: "", action: "whatsapp", url: "", fileUrl: "" };
                            })();
                            
                            return (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/20 space-y-8">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                <Layers size={16} /> IMÁGENES DE EXPERIENCIA (HERO CARDS)
                                            </h4>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const name = prompt('Nombre de la nueva categoría:');
                                                    if (!name || !name.trim()) return;
                                                    const current = (editingRegistro.productos_servicios || '').trim();
                                                    const separator = '\n';
                                                    setEditingRegistro({ ...editingRegistro, productos_servicios: current + (current ? separator : '') + name.trim() });
                                                }}
                                                className="bg-primary/20 hover:bg-primary/40 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                            >
                                                <Plus size={14} /> Añadir Categoría
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Título de la Sección (Opcional)</label>
                                                <input
                                                    className="w-full bg-[#050B1C] border border-primary/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary transition-all text-xs"
                                                    value={experienceCategories.title}
                                                    onChange={e => updateExperienceCategories(e.target.value, experienceCategories.categories.map((c:any) => ({index: c.index, url: c.img})).filter((c:any) => c.url), experienceCategories.subtitle)}
                                                    placeholder="Ej: THE MI MARCA EXPERIENCE"
                                                />
                                                <p className="text-[9px] text-primary/40 ml-1">Si lo dejas en blanco, se usará "THE [NOMBRE NEGOCIO] EXPERIENCE" por defecto.</p>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Especialidad / Subtítulo (Global)</label>
                                                <input
                                                    className="w-full bg-[#050B1C] border border-primary/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary transition-all text-xs"
                                                    value={experienceCategories.subtitle}
                                                    onChange={e => updateExperienceCategories(experienceCategories.title, experienceCategories.categories.map((c:any) => ({index: c.index, url: c.img})).filter((c:any) => c.url), e.target.value)}
                                                    placeholder="Ej: Especialidad, Expert Care, etc."
                                                />
                                                <p className="text-[9px] text-primary/40 ml-1">Cambia el texto pequeño sobre el título de cada tarjeta.</p>
                                            </div>
                                        </div>

                                        {experienceCategories.categories.length === 0 ? (
                                            <div className="py-12 text-center border-2 border-dashed border-primary/20 rounded-3xl">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">No hay categorías configuradas.</p>
                                                <p className="text-[9px] text-primary/30 mt-2">Añade servicios en la pestaña "Bio & Servicios" primero.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {experienceCategories.categories.map((cat: any) => (
                                                    <div key={cat.index} className="bg-[#050B1C] border border-white/10 rounded-3xl overflow-hidden group">
                                                        <div className="relative aspect-square bg-white/5 flex flex-col items-center justify-center">
                                                            {cat.img ? (
                                                                <img src={cat.img} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-2 text-white/20">
                                                                    <ImageIcon size={32} />
                                                                    <span className="text-[9px] uppercase font-black tracking-widest">Foto por defecto</span>
                                                                </div>
                                                            )}
                                                            <label className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-10">
                                                                <Upload size={24} className="text-white mb-2" />
                                                                <span className="text-[10px] text-white font-black uppercase tracking-widest">Cambiar Foto</span>
                                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCategoryPhotoUpload(e, cat.index)} />
                                                            </label>
                                                        </div>
                                                        <div className="p-4 bg-white/5 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[10px] font-black text-white/40 uppercase mb-1">Tarjeta {cat.index + 1}</p>
                                                                <input 
                                                                    type="text"
                                                                    value={cat.title}
                                                                    onChange={(e) => updateCategoryTitle(cat.index, e.target.value)}
                                                                    placeholder="Nombre de categoría"
                                                                    className="bg-transparent border-none p-0 text-xs font-bold text-white uppercase focus:ring-0 w-full outline-none hover:text-primary transition-colors"
                                                                />
                                                            </div>
                                                            {cat.img && (
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => {
                                                                        const currentImages = experienceCategories.categories.map((c:any) => ({index: c.index, url: c.img})).filter((c:any) => c.url && c.index !== cat.index);
                                                                        updateExperienceCategories(experienceCategories.title, currentImages);
                                                                    }}
                                                                    className="p-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                                                                    title="Quitar foto personalizada"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    // Eliminar categoría: remover línea de productos_servicios + json_override
                                                                    const lines = (editingRegistro.productos_servicios || '').split('\n').filter((l: string) => l.trim()).filter((_: string, i: number) => i !== cat.index);
                                                                    let parsed: any = {};
                                                                    try {
                                                                        const raw = editingRegistro.json_override;
                                                                        parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
                                                                    } catch (e) {}
                                                                    const cleanTitles = (parsed.experienceTitles || []).filter((t: any) => t.index !== cat.index);
                                                                    const cleanImages = (parsed.experienceImages || []).filter((i: any) => i.index !== cat.index);
                                                                    // Reindexar
                                                                    const reindexedTitles = cleanTitles.map((t: any, i: number) => ({ ...t, index: i }));
                                                                    const reindexedImages = cleanImages.map((img: any, i: number) => ({ ...img, index: i }));
                                                                    parsed.experienceTitles = reindexedTitles;
                                                                    if (reindexedImages.length > 0) parsed.experienceImages = reindexedImages;
                                                                    else delete parsed.experienceImages;
                                                                    setEditingRegistro({ ...editingRegistro, productos_servicios: lines.join('\n'), json_override: parsed });
                                                                }}
                                                                className="p-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                                                                title="Eliminar categoría"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botón de Acción Panel */}
                                    <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/20 space-y-8">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                <ExternalLink size={16} /> BOTÓN DE ACCIÓN CONFIGURABLE (CARRUSEL / SERVICIOS)
                                            </h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Texto del Botón</label>
                                                <input
                                                    className="w-full bg-[#050B1C] border border-primary/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary transition-all text-xs"
                                                    value={experienceButton.text}
                                                    onChange={e => updateExperienceButton({ text: e.target.value })}
                                                    placeholder="Ej: CONSULTAR AHORA, VER CARTA, MÁS INFO"
                                                />
                                                <p className="text-[9px] text-primary/40 ml-1">Si lo dejas vacío se usará "CONSULTAR AHORA" por defecto.</p>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Acción al hacer clic</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['whatsapp', 'link', 'file'] as const).map((act) => (
                                                        <button
                                                            key={act}
                                                            type="button"
                                                            onClick={() => updateExperienceButton({ action: act })}
                                                            className={cn(
                                                                "py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                                                experienceButton.action === act 
                                                                    ? "bg-primary text-navy border-primary" 
                                                                    : "bg-[#050B1C] text-white/50 border-white/10 hover:border-white/20"
                                                            )}
                                                        >
                                                            {act === 'whatsapp' ? 'WhatsApp' : act === 'link' ? 'Link Web' : 'Archivo / PDF'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {experienceButton.action === 'link' && (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Enlace Web (URL)</label>
                                                <input
                                                    className="w-full bg-[#050B1C] border border-primary/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary transition-all text-xs"
                                                    value={experienceButton.url || ''}
                                                    onChange={e => updateExperienceButton({ url: e.target.value })}
                                                    placeholder="https://miweb.com/menu.pdf"
                                                />
                                            </div>
                                        )}

                                        {experienceButton.action === 'file' && (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Archivo o PDF Adjunto</label>
                                                <div className="flex items-center gap-4">
                                                    <label className="bg-primary/20 hover:bg-primary/40 text-primary px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border border-primary/20">
                                                        <Upload size={14} /> Subir Archivo / PDF
                                                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg animate-none" onChange={handleExperienceFileUpload} />
                                                    </label>
                                                    {experienceButton.fileUrl && (
                                                        <div className="flex items-center gap-2 bg-[#050B1C] border border-white/5 px-4 py-3 rounded-2xl max-w-xs overflow-hidden">
                                                            <span className="text-[10px] text-white/60 truncate font-mono">{experienceButton.fileUrl.split('/').pop()}</span>
                                                            <a href={experienceButton.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[9px] font-black uppercase flex-shrink-0">Ver</a>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[9px] text-primary/40 ml-1">Sube un menú, catálogo o folleto para que el cliente lo descargue directamente al pulsar el botón.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* MÓDULO HEDKANDI / SHOWCASE - Texto del Marquee */}
                                    {(editingRegistro.template_id === 'hedkandi' || editingRegistro.template_id === 'showcase') && (
                                        <div className="mt-8 pt-8 border-t border-primary/10">
                                            <div className="bg-pink-500/5 p-6 rounded-[2rem] border border-pink-500/20 space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-pink-500 flex items-center justify-center text-white">
                                                        <Sparkles size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-pink-400">Módulo Hedkandi / Showcase</h4>
                                                        <p className="text-[10px] text-white/40 mt-0.5">Personaliza el texto del marquee de fondo</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
                                                        <div className="flex gap-3 text-pink-300">
                                                            <Info size={16} className="shrink-0 mt-0.5" />
                                                            <div className="text-xs">
                                                                <p className="font-bold">Texto de Fondo en Marquee</p>
                                                                <p className="opacity-70 mt-1">Este texto aparece repetido como fondo animado en la sección de CTA. Por defecto usa el nombre del negocio.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-pink-400/60 uppercase tracking-widest ml-1">Texto del Marquee</label>
                                                        <input
                                                            className="w-full bg-[#050B1C] border border-pink-500/20 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-pink-500/40 transition-all text-xs"
                                                            value={marqueeText}
                                                            onChange={e => updateMarqueeText(e.target.value)}
                                                            placeholder={editingRegistro.nombre_negocio || "Nombre de tu negocio"}
                                                        />
                                                        <p className="text-[9px] text-pink-400/40 ml-1">Deja vacío para usar el nombre del negocio por defecto</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {activeTab === 'qr' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* GESTION DE QR */}
                                <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/20 space-y-8">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                        <QrCode size={16} /> GESTIÓN DE CÓDIGOS QR
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center gap-6">
                                            <div className="bg-white p-2 rounded-xl">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/vcard/${editingRegistro.slug || editingRegistro.id}`)}`} className="w-20 h-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-white uppercase">QR Descarga Directa</p>
                                                <p className="text-[9px] text-white/40 leading-tight">Ideal para tarjetas impresas. Guarda el contacto al instante.</p>
                                                <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/vcard/${editingRegistro.slug || editingRegistro.id}`)}`} target="_blank" className="text-primary text-[9px] font-black uppercase hover:underline inline-flex items-center gap-1 mt-2">Descargar QR</a>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center gap-6">
                                            <div className="bg-white p-2 rounded-xl">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/card/${editingRegistro.slug || editingRegistro.id}`)}`} className="w-20 h-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-white uppercase">QR Perfil Digital</p>
                                                <p className="text-[9px] text-white/40 leading-tight">Muestra tu perfil completo en la web antes de guardar.</p>
                                                <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/card/${editingRegistro.slug || editingRegistro.id}`)}`} target="_blank" className="text-primary text-[9px] font-black uppercase hover:underline inline-flex items-center gap-1 mt-2">Descargar QR</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'vip' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* CONFIGURACIÓN VIP (OVERRIDE FÁCIL) */}
                                <div className="bg-purple-500/5 p-8 rounded-[2.5rem] border border-purple-500/20 space-y-8">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-2">
                                                <ShieldCheck size={16} /> PERSONALIZACIÓN VIP (ETIQUETAS FÁCILES)
                                            </h4>
                                            <button 
                                                type="button"
                                                onClick={() => updateVipMappings([...vipMappings, { find: '', replace: '' }])}
                                                className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                            >
                                                <Plus size={14} /> Añadir Etiqueta
                                            </button>
                                        </div>
                                        
                                        <p className="text-[10px] text-purple-300/40 font-bold uppercase tracking-widest leading-relaxed max-w-2xl px-1">
                                            Usa esta sección para forzar cambios en la vCard descargable sin cambiar el perfil digital. 
                                        </p>

                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-purple-400/60 uppercase tracking-widest flex items-center gap-2">
                                                <Zap size={10} /> Atajos rápidos para este cliente:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {quickShortcuts.map((s, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            const existingMapping = vipMappings.find(m => m.find === s.value);
                                                            if (!existingMapping) {
                                                                updateVipMappings([...vipMappings, { find: s.value, replace: '' }]);
                                                            }
                                                        }}
                                                        className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-2 rounded-xl text-[9px] font-black text-purple-300 uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {vipMappings.length === 0 ? (
                                                <div className="py-8 text-center border-2 border-dashed border-purple-500/10 rounded-3xl">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-500/20">No hay personalizaciones VIP activas</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {vipMappings.map((m, i) => (
                                                        <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-2 transition-all">
                                                            <div className="flex-1 grid grid-cols-2 gap-4">
                                                                <input 
                                                                    placeholder="Texto Original (Ej: Empresa)"
                                                                    className="bg-purple-500/5 border border-purple-500/20 rounded-xl px-5 py-3 text-xs font-bold text-white outline-none focus:border-purple-400/50 transition-all"
                                                                    value={m.find}
                                                                    onChange={e => {
                                                                        const newM = [...vipMappings];
                                                                        newM[i].find = e.target.value;
                                                                        updateVipMappings(newM);
                                                                    }}
                                                                />
                                                                <input 
                                                                    placeholder="Nuevo Texto (Ej: Mi Marca)"
                                                                    className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs font-bold text-white outline-none focus:border-primary/40 transition-all"
                                                                    value={m.replace}
                                                                    onChange={e => {
                                                                        const newM = [...vipMappings];
                                                                        newM[i].replace = e.target.value;
                                                                        updateVipMappings(newM);
                                                                    }}
                                                                />
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => updateVipMappings(vipMappings.filter((_, idx) => idx !== i))}
                                                                className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                </div>

                                {/* ─── COLOR PICKER: Tema personalizado ─── */}
                                <div className="bg-indigo-500/5 p-8 rounded-[2.5rem] border border-indigo-500/20 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                                            🎨 COLOR DEL TEMA
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const raw = editingRegistro.json_override;
                                                let currentOverride: Record<string, any> = {};
                                                try { currentOverride = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {}); } catch {}
                                                delete currentOverride.themePrimary;
                                                delete currentOverride.themeTextOnPrimary;
                                                setEditingRegistro({ ...editingRegistro, json_override: currentOverride });
                                            }}
                                            className="text-indigo-300/50 hover:text-red-400 text-[9px] font-black uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                                        >
                                            Restaurar Auto
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-indigo-300/40 font-bold uppercase tracking-widest leading-relaxed px-1">
                                        Color principal que destacará en botones, títulos y bordes del perfil digital.
                                        Si no eliges ninguno, se extraerá automáticamente de la foto de perfil.
                                    </p>
                                    <div className="flex items-center gap-6">
                                        {(() => {
                                            const raw = editingRegistro.json_override;
                                            let currentOverride: Record<string, any> = {};
                                            try { currentOverride = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {}); } catch {}
                                            const currentColor = currentOverride?.themePrimary || '#f66739';
                                            return (
                                                <>
                                                    <input 
                                                        type="color" 
                                                        value={currentColor}
                                                        onChange={(e) => {
                                                            let currentOverride: Record<string, any> = {};
                                                            try { 
                                                                const raw = editingRegistro.json_override;
                                                                currentOverride = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {}); 
                                                            } catch {}
                                                            setEditingRegistro({ 
                                                                ...editingRegistro, 
                                                                json_override: { ...currentOverride, themePrimary: e.target.value, themeTextOnPrimary: '#ffffff' } 
                                                            });
                                                        }}
                                                        className="w-16 h-16 rounded-2xl border-2 border-white/20 cursor-pointer hover:border-indigo-400/50 transition-all"
                                                        style={{ backgroundColor: currentColor }}
                                                    />
                                                    <div className="flex-1 space-y-2">
                                                        <div 
                                                            className="w-full h-10 rounded-xl flex items-center px-5 text-[11px] font-black uppercase tracking-widest"
                                                            style={{ backgroundColor: currentColor, color: '#ffffff' }}
                                                        >
                                                            Vista previa del color
                                                        </div>
                                                        <span className="text-[10px] font-mono text-white/30">
                                                            {currentColor}
                                                        </span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'catalogo' && editingRegistro.plan === 'catalog' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* CATÁLOGO (Solo Plan Catalog) */}
                                <div className="space-y-8">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b border-white/5 pb-4 flex items-center gap-3">
                                        <Store size={18} /> CATÁLOGO DE PRODUCTOS
                                    </h4>
                                    
                                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                                        <button type="button" onClick={() => setCatalogTab('config')} className={cn("flex-1 py-3 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all", catalogTab === 'config' ? "bg-primary text-navy" : "text-white/40")}>Categorías</button>
                                        <button type="button" onClick={() => setCatalogTab('products')} className={cn("flex-1 py-3 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all", catalogTab === 'products' ? "bg-primary text-navy" : "text-white/40")}>Productos ({catalogoJson.products.length}/20)</button>
                                    </div>

                                    {catalogTab === 'config' ? (
                                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Organización del Catálogo</p>
                                                <button type="button" onClick={() => {
                                                    const cat = prompt('Nombre de la categoría:');
                                                    if (cat) updateCatalogo({ ...catalogoJson, categories: [...catalogoJson.categories, cat] });
                                                }} className="text-primary font-black uppercase text-[10px] hover:underline flex items-center gap-1"><Plus size={12} /> Nueva Categoría</button>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {catalogoJson.categories.map((c: string, i: number) => (
                                                    <div key={i} className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-primary uppercase">{c}</span>
                                                        <button type="button" onClick={() => handleDeleteCategory(c)} className="hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center border-b border-white/5 pb-6">
                                                <select 
                                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-white outline-none"
                                                    value={productCategoryFilter}
                                                    onChange={e => setProductCategoryFilter(e.target.value)}
                                                >
                                                    <option value="Todas" className="bg-navy">Todas las Categorías</option>
                                                    {catalogoJson.categories.map((c: any) => <option key={c} value={c} className="bg-navy">{c}</option>)}
                                                </select>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        if (catalogoJson.products.length >= 20) {
                                                            alert("Máximo 20 productos permitidos en total.");
                                                            return;
                                                        }
                                                        
                                                        // Determinamos la categoría objetivo basada en el filtro actual
                                                        let targetCategory = categoryFilterRef.current;
                                                        
                                                        // Si el filtro es 'Todas', intentamos usar la primera categoría real o 'Todas'
                                                        if (targetCategory === 'Todas') {
                                                            targetCategory = catalogoJson.categories[0] || 'Todas';
                                                        } else {
                                                            // Buscamos coincidencia exacta normalizada en la lista de categorías
                                                            const normalizedFilter = targetCategory.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                                            const foundCategory = catalogoJson.categories.find((c: string) => 
                                                                c.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedFilter
                                                            );
                                                            if (foundCategory) {
                                                                targetCategory = foundCategory;
                                                            }
                                                        }

                                                        const p = { 
                                                            id: `prod_${Date.now()}`, 
                                                            nombre: 'Nuevo Producto', 
                                                            name: 'Nuevo Producto', 
                                                            precio: '0.00', 
                                                            price: '0.00', 
                                                            categoria: targetCategory, 
                                                            category: targetCategory, 
                                                            imagenes: [], 
                                                            videos: [],
                                                            descripcion: '', 
                                                            description: '' 
                                                        };
                                                        updateCatalogo({ ...catalogoJson, products: [p, ...catalogoJson.products] });
                                                    }} 
                                                    className="bg-primary text-navy px-6 py-3 rounded-2xl shadow-[0_10px_20px_rgba(255,107,0,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
                                                >
                                                    <Plus size={20} className="transition-transform group-hover:rotate-90" />
                                                    <span className="font-black uppercase text-[10px] tracking-widest">
                                                        Añadir a {productCategoryFilter === 'Todas' ? (catalogoJson.categories[0] || 'Todas') : productCategoryFilter}
                                                    </span>
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                                                {catalogoJson.products.filter((p: any) => productCategoryFilter === 'Todas' || (p.categoria || p.category) === productCategoryFilter).map((prod: any, idx: number) => (
                                                    <div key={prod.id || idx} className="bg-white/[0.07] border border-white/20 p-6 rounded-3xl flex gap-6 relative group hover:bg-white/[0.1] transition-all">
                                                        <button type="button" onClick={() => handleCloneProduct(prod)} className="absolute top-4 right-12 text-white/40 hover:text-primary transition-colors" title="Clonar producto"><Copy size={16} /></button>
                                                        <button type="button" onClick={() => updateCatalogo({ ...catalogoJson, products: catalogoJson.products.filter((p: any) => p.id !== prod.id) })} className="absolute top-4 right-4 text-white/40 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                        <div className="w-24 shrink-0">
                                                            <div className="space-y-2">
                                                                {(prod.imagenes || (prod.image ? [prod.image] : [])).length === 0 ? (
                                                                    <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center text-white/20 uppercase font-black text-[9px] text-center leading-tight border border-white/10">Sin<br/>Imagen</div>
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        {(prod.imagenes || (prod.image ? [prod.image] : [])).map((imgUrl: string, imgIdx: number) => (
                                                                            <div key={imgIdx} className="flex gap-1 items-center">
                                                                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-white/5">
                                                                                    <img src={imgUrl} className="w-full h-full object-cover" />
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const imgs = [...(prod.imagenes || (prod.image ? [prod.image] : []))];
                                                                                        imgs.splice(imgIdx, 1);
                                                                                        const prods = [...catalogoJson.products];
                                                                                        const pIdx = prods.findIndex(p => p.id === prod.id);
                                                                                        prods[pIdx] = { ...prod, imagenes: imgs };
                                                                                        updateCatalogo({ ...catalogoJson, products: prods });
                                                                                    }}
                                                                                    className="p-1 text-white/20 hover:text-red-500 transition-colors"
                                                                                >
                                                                                    <CloseIcon size={10} />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <label className="flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl py-1.5 px-2 cursor-pointer transition-all border border-primary/20">
                                                                    <Upload size={10} />
                                                                    <span className="text-[7px] font-black uppercase">Subir</span>
                                                                    <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        const { url } = await uploadFile({ file, slug: editingRegistro?.slug });
                                                                        const imgs = [...(prod.imagenes || (prod.image ? [prod.image] : []))];
                                                                        imgs.push(url);
                                                                        const prods = [...catalogoJson.products];
                                                                        const pIdx = prods.findIndex(p => p.id === prod.id);
                                                                        prods[pIdx] = { ...prod, imagenes: imgs };
                                                                        updateCatalogo({ ...catalogoJson, products: prods });
                                                                    }} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-[9px] font-black uppercase text-white/20 mb-1 block">Nombre Producto</label>
                                                                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-primary/60 transition-all" value={prod.nombre || prod.name || ''} onChange={e => {
                                                                        const prods = [...catalogoJson.products];
                                                                        const pIdx = prods.findIndex(p => (p.id && prod.id) ? p.id === prod.id : (p.nombre === prod.nombre || p.name === prod.name));
                                                                        prods[pIdx] = { ...prod, nombre: e.target.value, name: e.target.value };
                                                                        updateCatalogo({ ...catalogoJson, products: prods });
                                                                    }} />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[9px] font-black uppercase text-white/20 mb-1 block">Precio</label>
                                                                    <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-primary/60 transition-all" value={prod.precio || prod.price || ''} onChange={e => {
                                                                        const prods = [...catalogoJson.products];
                                                                        const pIdx = prods.findIndex(p => (p.id && prod.id) ? p.id === prod.id : (p.nombre === prod.nombre || p.name === prod.name));
                                                                        prods[pIdx] = { ...prod, precio: e.target.value, price: e.target.value };
                                                                        updateCatalogo({ ...catalogoJson, products: prods });
                                                                    }} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-black uppercase text-white/20 mb-1 block">Descripción breve</label>
                                                                <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-medium text-white/80 min-h-[60px] resize-none outline-none focus:border-primary/60 transition-all" value={prod.descripcion || prod.description || ''} onChange={e => {
                                                                    const prods = [...catalogoJson.products];
                                                                    const pIdx = prods.findIndex(p => (p.id && prod.id) ? p.id === prod.id : (p.nombre === prod.nombre || p.name === prod.name));
                                                                    prods[pIdx] = { ...prod, descripcion: e.target.value, description: e.target.value };
                                                                    updateCatalogo({ ...catalogoJson, products: prods });
                                                                }} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-black uppercase text-white/20 mb-1 block">Videos Linkeados (Opcional)</label>
                                                                <div className="space-y-1.5">
                                                                    {(prod.videos || (prod.video ? [prod.video] : [])).map((vUrl: string, vIdx: number) => (
                                                                        <div key={vIdx} className="flex gap-1 items-center">
                                                                            <input 
                                                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold text-white outline-none focus:border-primary/60 transition-all" 
                                                                                value={vUrl} 
                                                                                placeholder="URL YouTube"
                                                                                onChange={e => {
                                                                                    const vids = [...(prod.videos || (prod.video ? [prod.video] : []))];
                                                                                    vids[vIdx] = e.target.value;
                                                                                    const prods = [...catalogoJson.products];
                                                                                    const pIdx = prods.findIndex(p => p.id === prod.id);
                                                                                    prods[pIdx] = { ...prod, videos: vids };
                                                                                    updateCatalogo({ ...catalogoJson, products: prods });
                                                                                }} 
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const vids = [...(prod.videos || (prod.video ? [prod.video] : []))];
                                                                                    vids.splice(vIdx, 1);
                                                                                    const prods = [...catalogoJson.products];
                                                                                    const pIdx = prods.findIndex(p => p.id === prod.id);
                                                                                    prods[pIdx] = { ...prod, videos: vids };
                                                                                    updateCatalogo({ ...catalogoJson, products: prods });
                                                                                }}
                                                                                className="p-1.5 text-white/20 hover:text-red-500 transition-colors"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const vids = [...(prod.videos || (prod.video ? [prod.video] : []))];
                                                                            vids.push('');
                                                                            const prods = [...catalogoJson.products];
                                                                            const pIdx = prods.findIndex(p => p.id === prod.id);
                                                                            prods[pIdx] = { ...prod, videos: vids };
                                                                            updateCatalogo({ ...catalogoJson, products: prods });
                                                                        }}
                                                                        className="text-[9px] font-bold text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
                                                                    >
                                                                        <Plus size={12} /> Añadir otro video
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Fixed */}
                <div className="p-8 border-t border-white/10 bg-[#050B1C]/90 backdrop-blur-xl flex justify-between items-center gap-4">
                    <div className="flex gap-4">
                        <button 
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl bg-white/5 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 hover:text-white transition-all text-white/40"
                        >
                            Cancelar
                        </button>
                    </div>
                    
                    <div className="flex gap-4">
                         <a
                            href={`/api/vcard/${editingRegistro.slug || editingRegistro.id}`}
                            download={`${editingRegistro.slug || editingRegistro.id}.vcf`}
                            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 text-white"
                        >
                            <Download size={14} /> vCard
                        </a>
                        <button
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="px-12 py-4 rounded-2xl bg-primary text-navy font-black uppercase text-[10px] tracking-[0.1em] shadow-[0_10px_30px_rgba(255,107,0,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
