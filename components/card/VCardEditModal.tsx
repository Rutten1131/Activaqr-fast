"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Download, Key, AlertCircle, CheckCircle, Loader2, Edit, Image as ImageIcon, Zap, Phone, User, ChevronDown, Store, Plus, Trash2, Activity, Video, Camera, Upload, Info, Sparkles } from 'lucide-react';
import { formatPhoneEcuador, cn } from '@/lib/utils';
import { isVideoUrl } from '@/lib/videoUtils';

interface VCardEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialSlug: string;
    allowCatalog?: boolean;
    initialSection?: 'perfil' | 'contacto' | 'hero' | 'portada' | 'catalogo';
    isSetup?: boolean;
}

const safeParse = <T,>(str: string | null | undefined, fallback: T): T => {
    if (!str) return fallback;
    try {
        return JSON.parse(str) as T;
    } catch (e) {
        return fallback;
    }
};

const getYouTubeID = (url: string) => {
    if (!url) return null;
    // If it's already an 11-character ID, return it
    if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    
    // Regex updated to support /shorts/ and various existing formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export default function VCardEditModal({ 
    isOpen, 
    onClose, 
    initialSlug, 
    allowCatalog = false,
    initialSection = 'perfil',
    isSetup = false
}: VCardEditModalProps) {
    const [step, setStep] = useState<'code' | 'edit' | 'success'>('code');
    const [editCode, setEditCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [usesRemaining, setUsesRemaining] = useState(0);
    const [activeSection, setActiveSection] = useState<'perfil' | 'contacto' | 'hero' | 'portada' | 'categorias' | 'catalogo' | 'autoridad' | 'industrial' | 'carta' | 'video-redes' | 'code' | 'success' | 'hedkandi' | null>(initialSection);
    const [isStructuring, setIsStructuring] = useState(false);
    const [productCategoryFilter, setProductCategoryFilter] = useState<string>('Todas');
    const productCategoryFilterRef = useRef('Todas');

    // Load code from localStorage on mount
    useEffect(() => {
        const savedCode = localStorage.getItem('rya_edit_code_biz');
        if (savedCode) {
            setEditCode(savedCode);
        }
    }, []);

    // Relational Menu Builder States & Hooks
    const [menuCategories, setMenuCategories] = useState<any[]>([]);
    const [loadingMenu, setLoadingMenu] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showAIImporter, setShowAIImporter] = useState(false);
    const [aiRawText, setAiRawText] = useState('');

    useEffect(() => {
        const loadMenuData = async () => {
            if (!userData?.id) return;
            setLoadingMenu(true);
            try {
                const res = await fetch(`/api/menu/categories?vcard_id=${userData.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const categories = data.categories || [];
                    
                    const fullCategories = await Promise.all(categories.map(async (cat: any) => {
                        const prodRes = await fetch(`/api/menu/products?categoria_id=${cat.id}`);
                        const prodData = prodRes.ok ? await prodRes.json() : { products: [] };
                        return {
                            ...cat,
                            products: prodData.products || []
                        };
                    }));
                    
                    setMenuCategories(fullCategories);
                }
            } catch (err) {
                console.error("Error al cargar menú:", err);
            } finally {
                setLoadingMenu(false);
            }
        };

        if (activeSection === 'carta' && userData?.id) {
            loadMenuData();
        }
    }, [activeSection, userData?.id]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || !userData?.id) return;
        try {
            const res = await fetch('/api/menu/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vcard_id: userData.id,
                    nombre: newCategoryName.trim(),
                    code: editCode
                })
            });
            if (res.ok) {
                const data = await res.json();
                setMenuCategories(prev => [...prev, { ...data.category, products: [] }]);
                setNewCategoryName('');
                setExpandedCategories(prev => ({ ...prev, [data.category.id]: true }));
            } else {
                const errData = await res.json();
                alert(errData.error || 'Error al crear categoría');
            }
        } catch (err) {
            alert('Error de conexión');
        }
    };

    const handleUpdateCategoryName = async (id: number, newName: string) => {
        if (!newName.trim()) return;
        try {
            const res = await fetch('/api/menu/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    nombre: newName.trim(),
                    code: editCode
                })
            });
            if (res.ok) {
                setMenuCategories(prev => prev.map(cat => cat.id === id ? { ...cat, nombre: newName.trim() } : cat));
            }
        } catch (err) {
            console.error('Error updating category name:', err);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta categoría? Todos los productos dentro de ella se eliminarán permanentemente.')) return;
        try {
            const res = await fetch(`/api/menu/categories?id=${id}&code=${editCode}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setMenuCategories(prev => prev.filter(cat => cat.id !== id));
            } else {
                alert('Error al eliminar la categoría');
            }
        } catch (err) {
            alert('Error de conexión');
        }
    };

    const handleAddProduct = async (categoryId: number) => {
        try {
            const res = await fetch('/api/menu/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoria_id: categoryId,
                    nombre: 'Nuevo Producto/Servicio',
                    descripcion: '',
                    precio: null,
                    imagen_url: null,
                    disponible: 1,
                    code: editCode
                })
            });
            if (res.ok) {
                const data = await res.json();
                setMenuCategories(prev => prev.map(cat => {
                    if (cat.id === categoryId) {
                        return {
                            ...cat,
                            products: [...(cat.products || []), data.product]
                        };
                    }
                    return cat;
                }));
            } else {
                alert('Error al agregar el producto');
            }
        } catch (err) {
            alert('Error de conexión');
        }
    };

    const handleUpdateProduct = async (productId: number, fields: any) => {
        try {
            const res = await fetch('/api/menu/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: productId,
                    ...fields,
                    code: editCode
                })
            });
            if (res.ok) {
                setMenuCategories(prev => prev.map(cat => {
                    const products = cat.products || [];
                    if (products.some((p: any) => p.id === productId)) {
                        return {
                            ...cat,
                            products: products.map((p: any) => p.id === productId ? { ...p, ...fields } : p)
                        };
                    }
                    return cat;
                }));
            }
        } catch (err) {
            console.error('Error updating product:', err);
        }
    };

    const handleDeleteProduct = async (categoryId: number, productId: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto/servicio?')) return;
        try {
            const res = await fetch(`/api/menu/products?id=${productId}&code=${editCode}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setMenuCategories(prev => prev.map(cat => {
                    if (cat.id === categoryId) {
                        return {
                            ...cat,
                            products: (cat.products || []).filter((p: any) => p.id !== productId)
                        };
                    }
                    return cat;
                }));
            } else {
                alert('Error al eliminar el producto');
            }
        } catch (err) {
            alert('Error de conexión');
        }
    };

    const handleProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>, categoryId: number, productId: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            if (userData?.slug) {
                fd.append('slug', userData.slug);
            }
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const { url } = await res.json();
                const putRes = await fetch('/api/menu/products', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: productId,
                        imagen_url: url,
                        code: editCode
                    })
                });
                if (putRes.ok) {
                    setMenuCategories(prev => prev.map(cat => {
                        if (cat.id === categoryId) {
                            return {
                                ...cat,
                                products: (cat.products || []).map((p: any) => p.id === productId ? { ...p, imagen_url: url } : p)
                            };
                        }
                        return cat;
                    }));
                } else {
                    alert('Error al guardar la URL de la imagen');
                }
            } else {
                alert('Error al subir la imagen');
            }
        } catch (err) {
            alert('Error al subir la imagen');
        } finally {
            setUploadingImage(false);
        }
    };

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
        productos_servicios: '',
        etiquetas: '',
        menu_digital: '',
        youtube: '',
        youtube_video_url: '',
        x: '',
        wifi_ssid: '',
        wifi_password: '',
        foto_url: '',
        portada_desktop: '',
        portada_movil: '',
        hero_button_text: '',
        hero_action: 'wifi' as 'wifi' | 'file' | 'link',
        hero_file_url: '',
        hero_external_link: '',
        hero_wifi_steps: ['step1', 'step2', 'step3'] as string[],
        hero_section_title: 'Oferta del Hero',
        hero_step1_title: 'Descarga Nuestro Contacto',
        hero_step2_title: 'Asegurate de importar el contacto',
        hero_step2_text: '',
        hero_step3_title: 'Conéctate a la Red',
        hero_step3_text: '',
        google_rating: '',
        google_reviews_count: '',
        template_id: 'classic',
        hero_slides_json: [] as Array<{ 
            id: string, 
            portada_desktop: string, 
            portada_movil: string, 
            title: string, 
            description?: string,
            active: boolean,
            offerEnabled?: boolean,
            offerTitle?: string,
            offerDescription?: string,
            offerOriginalPrice?: string,
            offerPrice?: string,
            offerExpiresAt?: string,
            offerCtaText?: string
        }>,
        catalogo_json: { categories: [], products: [] } as { categories: string[], products: any[] },
        json_override: {} as any
    });

    // ℹ️ NOTA: El antiguo useEffect que sincronizaba productos_servicios → catalogo_json.categories
    // fue eliminado porque causaba contaminación de categorías al abrir el editor.
    // Las categorías del catálogo se construyen correctamente desde la BD en validateCode().

    const validateCode = async () => {
        const cleanedCode = editCode.trim().replace(/\s/g, '');
        if (!cleanedCode) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/edit/validate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: cleanedCode, slug: initialSlug })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('rya_edit_code_biz', cleanedCode);
                setUserData(data.data);
                setUsesRemaining(data.usesRemaining);
                setFormData({
                    tipo_perfil: data.data.tipo_perfil || 'persona',
                    nombres: data.data.nombres || '',
                    apellidos: data.data.apellidos || '',
                    nombre_negocio: data.data.nombre_negocio || '',
                    contacto_nombre: data.data.contacto_nombre || '',
                    contacto_apellido: data.data.contacto_apellido || '',
                    profession: data.data.profession || '',
                    company: data.data.company || '',
                    whatsapp: data.data.whatsapp || '',
                    email: data.data.email || '',
                    bio: data.data.bio || '',
                    address: data.data.address || '',
                    web: data.data.web || '',
                    google_business: data.data.google_business || '',
                    instagram: data.data.instagram || '',
                    linkedin: data.data.linkedin || '',
                    facebook: data.data.facebook || '',
                    tiktok: data.data.tiktok || '',
                    productos_servicios: data.data.productos_servicios || '',
                    etiquetas: data.data.etiquetas || '',
                    menu_digital: data.data.menu_digital || '',
                    youtube: data.data.youtube || '',
                    youtube_video_url: data.data.youtube_video_url || '',
                    x: data.data.x || '',
                    wifi_ssid: data.data.wifi_ssid || '',
                    wifi_password: data.data.wifi_password || '',
                    foto_url: data.data.foto_url || '',
                    portada_desktop: data.data.portada_desktop || '', 
                    portada_movil: data.data.portada_movil || '',
                    hero_button_text: data.data.hero_button_text || '',
                    hero_action: data.data.hero_action || 'wifi',
                    hero_file_url: data.data.hero_file_url || '',
                    hero_external_link: data.data.hero_external_link || '',
                    hero_wifi_steps: data.data.hero_wifi_steps ? (typeof data.data.hero_wifi_steps === 'string' ? JSON.parse(data.data.hero_wifi_steps) : data.data.hero_wifi_steps) : ['step1', 'step2', 'step3'],
                    hero_section_title: data.data.hero_section_title || 'Oferta del Hero',
                    hero_step1_title: data.data.hero_step1_title || 'Descarga Nuestro Contacto',
                    hero_step2_title: data.data.hero_step2_title || 'Asegurate de importar el contacto',
                    hero_step2_text: data.data.hero_step2_text || '',
                    hero_step3_title: data.data.hero_step3_title || 'Conéctate a la Red',
                    hero_step3_text: data.data.hero_step3_text || '',

                    google_rating: data.data.google_rating || '',
                    google_reviews_count: data.data.google_reviews_count || '',
                    template_id: data.data.template_id || 'classic',
                    hero_slides_json: (() => {
                        const raw = data.data.hero_slides_json ? (typeof data.data.hero_slides_json === 'string' ? JSON.parse(data.data.hero_slides_json) : data.data.hero_slides_json) : null;
                        if (!raw || !Array.isArray(raw) || raw.length === 0) {
                            if (data.data.portada_desktop || data.data.portada_movil) {
                                return [{
                                    id: `slide_${Math.random().toString(36).substr(2, 9)}`,
                                    portada_desktop: data.data.portada_desktop || '',
                                    portada_movil: data.data.portada_movil || '',
                                    title: data.data.hero_section_title || 'Oferta del Hero',
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
                            return [];
                        }
                        // Ensure all slides have offer fields
                        return raw.map((slide: any) => ({
                            ...slide,
                            offerEnabled: slide.offerEnabled || false,
                            offerTitle: slide.offerTitle || '',
                            offerDescription: slide.offerDescription || '',
                            offerOriginalPrice: slide.offerOriginalPrice || '',
                            offerPrice: slide.offerPrice || '',
                            offerExpiresAt: slide.offerExpiresAt || '',
                            offerCtaText: slide.offerCtaText || ''
                        }));
                    })(),
                    catalogo_json: (() => {
                        const raw = data.data.catalogo_json ? (typeof data.data.catalogo_json === 'string' ? JSON.parse(data.data.catalogo_json) : data.data.catalogo_json) : null;
                        if (!raw) return { categories: [], products: [] };
                        
                        let products = [];
                        let categories = [];

                        if (Array.isArray(raw)) {
                            products = raw;
                        } else if (raw.products) {
                            products = raw.products;
                            categories = raw.categories || [];
                        }

                        // Normalize all fields from Spanish or English
                        products = products.map((p: any) => {
                            // Preserve full images array (check both English and Spanish field names)
                            let images: string[] = [];
                            if (Array.isArray(p.images) && p.images.length > 0) {
                                images = p.images;
                            } else if (Array.isArray(p.imagenes) && p.imagenes.length > 0) {
                                images = p.imagenes;
                            } else if (p.image || p.imagen || p.foto || p.url) {
                                images = [p.image || p.imagen || p.foto || p.url].filter(Boolean);
                            }

                            // Extract videos array
                            let videos: string[] = [];
                            if (Array.isArray(p.videos) && p.videos.length > 0) {
                                videos = p.videos;
                            } else if (p.video || p.video_url) {
                                videos = [p.video || p.video_url].filter(Boolean);
                            }

                            // Live migration: Move video URLs from images to videos
                            const videoUrlsFromImages = images.filter(url => isVideoUrl(url));
                            if (videoUrlsFromImages.length > 0) {
                                videos = [...new Set([...videos, ...videoUrlsFromImages])];
                                images = images.filter(url => !isVideoUrl(url));
                            }

                            // Si el producto tiene categoría inválida, asignar string vacío (no 'Sin Categoría')
                            const rawCat = p.category || p.categoria || '';
                            const normalizedCat = (rawCat === 'Nueva Categoría' || rawCat === 'Sin Categoría' || rawCat === 'Todas') ? '' : rawCat;
                            return {
                                id: p.id || `prod_${Math.random().toString(36).substr(2, 9)}`,
                                name: p.name || p.nombre || p.titulo || '',
                                price: p.price || p.precio || '',
                                description: p.description || p.descripcion || '',
                                image: images[0] || '',
                                images: images,
                                video: videos[0] || '',
                                videos: videos,
                                category: normalizedCat
                            };
                        });

                        // Limpiar categorías inválidas: 'Nueva Categoría', 'Sin Categoría', 'Todas', ''
                        const invalidCats = ['Nueva Categoría', 'Sin Categoría', 'Todas', ''];
                        
                        // Si categories está vacío, inferir desde productos válidos
                        if (categories.length === 0) {
                            categories = Array.from(new Set(products.map((p: any) => p.category).filter((c: string) => c && !invalidCats.includes(c))));
                        } else {
                            // Limpiar categorías guardadas de valores inválidos
                            categories = categories.filter((c: string) => c && !invalidCats.includes(c));
                            // Añadir categorías que vengan de productos pero no estén en la lista
                            const productCats = products.map((p: any) => p.category).filter((c: string) => c && !invalidCats.includes(c));
                            categories = [...new Set([...categories, ...productCats])];
                        }

                        return { categories, products };
                    })(),
                    json_override: (() => {
                        if (!data.data.json_override) return {};
                        try {
                            return typeof data.data.json_override === 'string' 
                                ? JSON.parse(data.data.json_override) 
                                : data.data.json_override;
                        } catch (e) {
                            console.error("Error parsing json_override:", e);
                            return {};
                        }
                    })()
                });
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
        // Removiendo confirm para evitar bloqueos del navegador en ciertos entornos
        setLoading(true);
        try {
            const formattedData = {
                ...formData,
                whatsapp: (() => {
                    let num = formData.whatsapp.replace(/\D/g, '');
                    // Si el usuario pone 09... (10 dígitos), convertir a 5939...
                    if (num.startsWith('0') && num.length === 10) {
                        return '593' + num.substring(1);
                    }
                    return num;
                })(),
                template_id: formData.template_id || 'classic',
                menu_digital: menuCategories.length > 0 
                    ? JSON.stringify(menuCategories.map(cat => ({
                        id: cat.id,
                        name: cat.nombre,
                        items: (cat.products || []).map((prod: any) => {
                            let formattedPrice = '';
                            if (prod.precio !== null && prod.precio !== undefined) {
                                formattedPrice = `$${Number(prod.precio).toFixed(2)}`;
                            } else if (prod.price) {
                                formattedPrice = prod.price;
                            }
                            return {
                                id: prod.id,
                                name: prod.nombre,
                                desc: prod.descripcion || prod.desc || '',
                                price: formattedPrice,
                                image: prod.imagen_url || prod.image || '',
                                disponible: prod.disponible !== undefined ? prod.disponible : 1
                            };
                        })
                    })))
                    : formData.menu_digital,
                // Asegurar que json_override sea string para la API
                json_override: typeof formData.json_override === 'object' 
                    ? JSON.stringify(formData.json_override) 
                    : (formData.json_override || '{}')
            };

            // DEBUG: Log hero_slides_json before sending to API
            if (formattedData.hero_slides_json) {
                const slides = formattedData.hero_slides_json;
                if (Array.isArray(slides)) {
                    slides.forEach((s: any, i: number) => {
                        console.log(`[SAVE DEBUG] slide[${i}] offerExpiresAt="${s.offerExpiresAt}" offerEnabled=${s.offerEnabled} offerTitle="${s.offerTitle}"`);
                    });
                }
            }

            const res = await fetch('/api/edit/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: editCode,
                    data: formattedData,
                    slug: initialSlug
                })
            });
            const result = await res.json();

            if (res.ok) {
                setStep('success');
            } else {
                alert(result.error || 'Error al guardar cambios');
            }
        } catch (err) {
            console.error('Error in handleSave:', err);
            alert('Error de conexión al intentar guardar');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'foto_url' | 'portada_desktop' | 'portada_movil') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            if (userData?.slug) {
                fd.append('slug', userData.slug);
            }
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const { url } = await res.json();
                setFormData({ ...formData, [field]: url });
            } else {
                alert('Error al subir imagen');
            }
        } catch (err) {
            alert('Error al subir imagen');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleHeroSlideImage = async (e: React.ChangeEvent<HTMLInputElement>, id: string, type: 'portada_desktop' | 'portada_movil') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            if (userData?.slug) {
                fd.append('slug', userData.slug);
            }
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const { url } = await res.json();
                setFormData({
                    ...formData,
                    hero_slides_json: formData.hero_slides_json.map(slide => slide.id === id ? { ...slide, [type]: url } : slide)
                });
            } else {
                alert('Error al subir imagen de slide');
            }
        } catch (err) {
            alert('Error al subir imagen de slide');
        } finally {
            setUploadingImage(false);
        }
    };

    const addHeroSlide = () => {
        if (formData.hero_slides_json.length >= 10) {
            alert('Máximo 10 Banners permitidos');
            return;
        }
        const newSlide = {
            id: `slide_${Math.random().toString(36).substr(2, 9)}`,
            portada_desktop: formData.portada_desktop || '', // Use current single portadas as default to avoid empty initially if possible
            portada_movil: formData.portada_movil || '',
            title: 'Nuevo Banner',
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
        setFormData(prev => ({
            ...prev,
            hero_slides_json: [...prev.hero_slides_json, newSlide]
        }));
    };

    const toggleHeroSlideActive = (id: string, currentlyActive: boolean) => {
        if (currentlyActive) {
            const activeCount = formData.hero_slides_json.filter(s => s.active).length;
            if (activeCount <= 1) {
                alert('Debes mantener al menos 1 Banner Hero activo.');
                return;
            }
        }
        setFormData(prev => ({
            ...prev,
            hero_slides_json: prev.hero_slides_json.map(slide => 
                slide.id === id ? { ...slide, active: !currentlyActive } : slide
            )
        }));
    };

    const removeHeroSlide = (id: string) => {
        const slideToRemove = formData.hero_slides_json.find(s => s.id === id);
        if (slideToRemove?.active) {
            const activeCount = formData.hero_slides_json.filter(s => s.active).length;
            if (activeCount <= 1) {
                alert('No puedes eliminar este banner activo porque debe haber al menos 1 Banner Hero activo. Apaga u enciende otros primero.');
                return;
            }
        }
        setFormData(prev => ({
            ...prev,
            hero_slides_json: prev.hero_slides_json.filter(s => s.id !== id)
        }));
    };

    const updateHeroSlideTitle = (id: string, title: string) => {
        setFormData(prev => ({
            ...prev,
            hero_slides_json: prev.hero_slides_json.map(slide => 
                slide.id === id ? { ...slide, title } : slide
            )
        }));
    };

    const updateHeroSlideDescription = (id: string, description: string) => {
        setFormData(prev => ({
            ...prev,
            hero_slides_json: prev.hero_slides_json.map(slide => 
                slide.id === id ? { ...slide, description } : slide
            )
        }));
    };

    const updateHeroSlideOffer = (id: string, field: string, value: any) => {
        let finalValue = value;
        if (field === 'offerExpiresAt' && value && value.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            finalValue = `${value}T08:00`;
        }
        console.log('[DEBUG offerUpdate]', field, '=', finalValue);
        setFormData(prev => ({
            ...prev,
            hero_slides_json: prev.hero_slides_json.map(slide => 
                slide.id === id ? { ...slide, [field]: finalValue } : slide
            )
        }));
    };

    const toggleHeroSlideOffer = (id: string, enabled: boolean) => {
        setFormData(prev => ({
            ...prev,
            hero_slides_json: prev.hero_slides_json.map(slide => 
                slide.id === id ? { ...slide, offerEnabled: enabled } : slide
            )
        }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Allow VCF, PDF, DOCX, etc.
        setLoading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            if (userData?.slug) {
                fd.append('slug', userData.slug);
            }
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const { url } = await res.json();
                setFormData({ ...formData, hero_file_url: url });
                alert('Archivo subido correctamente');
            } else {
                alert('Error al subir el archivo');
            }
        } catch (err) {
            console.error('Error uploading file:', err);
            alert('Error al subir el archivo');
        } finally {
            setLoading(false);
        }
    };

    // --- Helper Logic for Categories ---
    const experienceCategories = (() => {
        let title = "";
        let subtitle = "";
        let images: any[] = [];
        let parsed: any = {};
        try {
            const raw = formData.json_override;
            parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
            title = parsed.experienceTitle || "";
            subtitle = parsed.experienceSubtitle || "Especialidad";
            images = parsed.experienceImages || [];
        } catch (e) {}
        
        const rawLines = formData?.productos_servicios
            ?.split('\n')
            .filter((l: string) => l.trim().length > 0) || [];
            
        const replacements = (() => {
            const raw = formData.json_override;
            if (!raw) return {};
            try {
                return typeof raw === 'string' ? JSON.parse(raw) : raw;
            } catch (e) { return {}; }
        })();

        const descriptions = (() => {
            const raw = formData.json_override;
            if (!raw) return {};
            try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return parsed.experienceDescriptions || {};
            } catch (e) { return {}; }
        })();
            
        return {
            title,
            subtitle,
            categories: rawLines.map((cat: string, index: number) => {
                const customImg = images.find((i: any) => i.index === index);
                const customTitleObj = (parsed.experienceTitles || []).find((t: any) => t.index === index);
                const customDescObj = (Array.isArray(parsed.experienceDescriptions) ? parsed.experienceDescriptions : []).find((d: any) => d.index === index);
                
                // Prioridad: 1. Título por índice, 2. Reemplazo global, 3. Texto original
                const displayTitle = customTitleObj?.title || replacements[cat] || cat;
                
                // Prioridad: 1. Descripción por índice, 2. Descripción global por key, 3. Vacío
                const displayDesc = customDescObj?.description || (typeof descriptions === 'object' && !Array.isArray(descriptions) ? descriptions[cat] : "") || "";
                
                return {
                    index,
                    originalTitle: cat,
                    title: displayTitle,
                    description: displayDesc,
                    img: customImg?.url || ''
                }
            })
        };
    })();

    const experienceButton = (() => {
        let parsed: any = {};
        try {
            const raw = formData.json_override;
            parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
        } catch (e) {}
        return parsed.experienceButton || { text: "", action: "whatsapp", url: "", fileUrl: "" };
    })();

    const updateCategoryDescription = (index: number, newDesc: string) => {
        setFormData(prev => {
            const raw = prev.json_override;
            const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
            
            const nextDescriptions = [...(Array.isArray(parsed.experienceDescriptions) ? parsed.experienceDescriptions : [])];
            const existingIdx = nextDescriptions.findIndex((d: any) => d.index === index);
            
            if (existingIdx >= 0) {
                if (newDesc) {
                    nextDescriptions[existingIdx].description = newDesc;
                } else {
                    nextDescriptions.splice(existingIdx, 1);
                }
            } else if (newDesc) {
                nextDescriptions.push({ index, description: newDesc });
            }
            
            return { 
                ...prev, 
                json_override: {
                    ...parsed,
                    experienceDescriptions: nextDescriptions
                } 
            };
        });
    };

    const updateExperienceCategories = (newTitle?: string, newImages?: any[], newSubtitle?: string) => {
        setFormData(prev => {
            const raw = prev.json_override;
            const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
            
            const nextObj = {
                ...parsed,
                experienceTitle: newTitle !== undefined ? newTitle : (parsed.experienceTitle),
                experienceImages: newImages !== undefined ? newImages : (parsed.experienceImages),
                experienceSubtitle: newSubtitle !== undefined ? newSubtitle : (parsed.experienceSubtitle)
            };
            
            return { ...prev, json_override: nextObj };
        });
    };

    const updateExperienceButton = (fields: Partial<{ text: string; action: 'whatsapp' | 'link' | 'file'; url: string; fileUrl: string }>) => {
        setFormData(prev => {
            const raw = prev.json_override;
            const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
            const currentBtn = parsed.experienceButton || { text: "", action: "whatsapp", url: "", fileUrl: "" };
            return {
                ...prev,
                json_override: {
                    ...parsed,
                    experienceButton: { ...currentBtn, ...fields }
                }
            };
        });
    };

    const handleExperienceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('file', file);
        if (userData?.slug) {
            fd.append('slug', userData.slug);
        }
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const { url } = await res.json();
                updateExperienceButton({ fileUrl: url });
            } else {
                alert('Error al subir el archivo.');
            }
        } catch (err) {
            console.error("Error uploading experience file:", err);
            alert('Error al subir el archivo.');
        } finally {
            setUploadingImage(false);
        }
    };

    const updateCategoryTitle = (index: number, newTitle: string) => {
        setFormData(prev => {
            const raw = prev.json_override;
            const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
            
            const nextTitles = [...(Array.isArray(parsed.experienceTitles) ? parsed.experienceTitles : [])];
            const existingIdx = nextTitles.findIndex((t: any) => t.index === index);
            
            if (existingIdx >= 0) {
                if (newTitle) {
                    nextTitles[existingIdx].title = newTitle;
                } else {
                    nextTitles.splice(existingIdx, 1);
                }
            } else if (newTitle) {
                nextTitles.push({ index, title: newTitle });
            }
            
            // Actualizar el nombre DIRECTAMENTE en Catálogo Pro por su ÍNDICE (sin buscar por nombre)
            const catalogo = { ...(prev.catalogo_json || { categories: [], products: [] }) };
            if (newTitle && index >= 0 && index < catalogo.categories.length) {
                catalogo.categories[index] = newTitle;
            }
            
            return { 
                ...prev, 
                catalogo_json: catalogo,
                json_override: {
                    ...parsed,
                    experienceTitles: nextTitles
                } 
            };
        });
    };

    // Actualiza el enlace de catálogo para una categoría de Características por índice
    const updateCatalogLink = (index: number, catalogCategory: string) => {
        setFormData(prev => {
            const raw = prev.json_override;
            const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
            const currentLinks = parsed.experienceCatalogLinks || {};
            if (catalogCategory) {
                currentLinks[index] = catalogCategory;
            } else {
                delete currentLinks[index];
            }
            return {
                ...prev,
                json_override: {
                    ...parsed,
                    experienceCatalogLinks: { ...currentLinks }
                }
            };
        });
    };

    const handleAutoStructure = async () => {
        const text = aiRawText;
        if (!text || text.trim().length < 10) {
            alert('Por favor escribe algo de texto con tus productos/servicios primero.');
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
            if (!data.json) {
                alert(data.error || 'Error al estructurar el menú.');
                return;
            }

            let structuredMenu = [];
            try {
                structuredMenu = JSON.parse(data.json);
            } catch (jsonErr) {
                const cleaned = data.json.replace(/```json/g, '').replace(/```/g, '').trim();
                structuredMenu = JSON.parse(cleaned);
            }

            if (!Array.isArray(structuredMenu)) {
                throw new Error("El formato devuelto no es un arreglo válido");
            }

            const newCategories: any[] = [];
            for (const cat of structuredMenu) {
                // 1. Crear categoría en DB
                const catRes = await fetch('/api/menu/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vcard_id: userData.id,
                        nombre: cat.name || cat.nombre || 'Sin Nombre',
                        code: editCode
                    })
                });

                if (!catRes.ok) continue;
                const catData = await catRes.json();
                const createdCat = { ...catData.category, products: [] };

                // 2. Crear sus productos
                const items = cat.items || cat.productos || [];
                const createdProducts = [];
                for (const item of items) {
                    let rawPrice = item.price || item.precio;
                    let parsedPrice: number | null = null;
                    if (rawPrice !== undefined && rawPrice !== null) {
                        const cleanPriceStr = String(rawPrice).replace(/[^0-9.]/g, '');
                        if (cleanPriceStr) {
                            parsedPrice = parseFloat(cleanPriceStr);
                        }
                    }

                    const prodRes = await fetch('/api/menu/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            categoria_id: createdCat.id,
                            nombre: item.name || item.nombre || 'Producto sin nombre',
                            descripcion: item.desc || item.descripcion || '',
                            precio: parsedPrice,
                            imagen_url: null,
                            disponible: 1,
                            code: editCode
                        })
                    });

                    if (prodRes.ok) {
                        const prodData = await prodRes.json();
                        createdProducts.push(prodData.product);
                    }
                }

                createdCat.products = createdProducts;
                newCategories.push(createdCat);
            }

            setMenuCategories(prev => [...prev, ...newCategories]);
            setAiRawText('');
            setShowAIImporter(false);
            alert('¡Menú estructurado y guardado exitosamente!');
        } catch (err) {
            console.error('Error structuring menu:', err);
            alert('Hubo un error al estructurar o procesar los datos con la IA.');
        } finally {
            setIsStructuring(false);
        }
    };

    const handleCategoryImage = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            if (userData?.slug) {
                fd.append('slug', userData.slug);
            }
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const { url } = await res.json();
                setFormData(prev => {
                    const raw = prev.json_override;
                    const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
                    const currentImages = parsed.experienceImages || [];
                    const nextImages = [...currentImages.filter((img: any) => img.index !== index), { index, url }];
                    
                    return {
                        ...prev,
                        json_override: {
                            ...parsed,
                            experienceImages: nextImages
                        }
                    };
                });
            }
        } catch (err) {
            console.error("Error uploading category image:", err);
        } finally {
            setUploadingImage(false);
        }
    };

    // --- Industrial Template Config ---
    const industrialConfig = (() => {
        const raw = formData.json_override;
        const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
        const config = parsed.industrialConfig || {};
        
        return {
            badge: config.badge || "Garantía de Calidad",
            title: config.title || "Por qué elegirnos",
            description: config.description || "Nuestra infraestructura y equipo están preparados para los desafíos más exigentes. La eficiencia de su flota u operación es nuestra prioridad absoluta.",
            metrics: config.metrics || [
                { label: "Capacidad Operativa", value: "100" },
                { label: "Cumplimiento de Tiempos", value: "98" }
            ],
            stats: config.stats || [
                { label: "Experiencia", value: "10+" },
                { label: "Proyectos", value: "200+" },
                { label: "Efectividad", value: "99%" },
                { label: "Soporte", value: "24/7" }
            ]
        };
    })();

    const updateIndustrialConfig = (updates: any) => {
        setFormData(prev => {
            const raw = prev.json_override;
            const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
            const currentConfig = parsed.industrialConfig || industrialConfig;
            
            return {
                ...prev,
                json_override: {
                    ...parsed,
                    industrialConfig: {
                        ...currentConfig,
                        ...updates
                    }
                }
            };
        });
    };

    const menuTitle = (() => {
        const raw = formData.json_override;
        const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
        return parsed.menuTitle || '';
    })();

    const updateMenuTitle = (title: string) => {
        setFormData(prev => {
            const raw = prev.json_override;
            const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
            return {
                ...prev,
                json_override: {
                    ...parsed,
                    menuTitle: title
                }
            };
        });
    };

    // --- Hedkandi Template Config ---
    const marqueeText = (() => {
        const raw = formData.json_override;
        const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
        return parsed.marqueeText || formData.nombre_negocio || '';
    })();

    const updateMarqueeText = (text: string) => {
        setFormData(prev => {
            const raw = prev.json_override;
            const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
            return {
                ...prev,
                json_override: {
                    ...parsed,
                    marqueeText: text
                }
            };
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                    {/* Header */}
                    <div className="bg-primary p-6 flex justify-between items-center text-white shrink-0">
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                                <Edit size={24} />
                                Configuración de VCard
                            </h2>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">
                                Edita Hero, Ofertas y perfil directamente
                            </p>
                        </div>
                        <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto grow">

                        {step === 'code' && (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <Key size={40} className="text-primary" />
                                </div>
                                <h3 className="text-2xl font-black text-navy mb-2">Código de Edición Requerido</h3>
                                <p className="text-gray-500 mb-8 max-w-xs text-sm">
                                    Por seguridad, ingresa el código que recibiste por correo para editar este perfil.
                                </p>

                                <div className="w-full max-w-sm mb-4">
                                    <input 
                                        type="text" 
                                        value={editCode}
                                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                        placeholder="Ingresa tu código"
                                        className="w-full border-2 border-gray-100 rounded-2xl p-4 text-center text-xl font-black text-gray-900 tracking-[0.2em] focus:border-primary outline-none transition-all uppercase"
                                    />
                                    {error && <p className="text-red-500 text-xs font-bold mt-2 flex items-center justify-center gap-1 uppercase tracking-tighter italic"> <AlertCircle size={14}/> {error}</p>}
                                </div>

                                <button 
                                    onClick={validateCode}
                                    disabled={loading || !editCode}
                                    className="bg-primary text-white font-black py-4 px-10 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 uppercase tracking-widest text-sm flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                    Validar Acceso
                                </button>

                                <button 
                                    onClick={onClose}
                                    className="mt-6 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-primary transition-colors flex items-center gap-2"
                                >
                                    <X size={12} /> Cerrar y Volver
                                </button>

                                {error && error.includes('RYA-') && (
                                    <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase italic border-t pt-4 w-full max-w-xs">
                                        Tip: Revisa tu correo de bienvenida para el código de edición.
                                    </p>
                                )}
                            </div>
                        )}

                        {step === 'edit' && (
                            <div className="space-y-6">
                                <div className="bg-navy/5 p-4 rounded-2xl border border-navy/10 flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3 text-navy">
                                        <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center">
                                            <Edit size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Editando Perfil</p>
                                            <p className="text-sm font-black uppercase tracking-tight italic">/{initialSlug}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Uso Ilimitado</p>
                                        <p className="text-lg font-black text-green-600 tracking-tighter leading-none mt-1">♾️</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pb-20">

                                    {/* SECCIÓN 4: CARRUSEL DE BANNERS (HERO) */}
                                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => setActiveSection(activeSection === 'portada' ? null : 'portada')}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                    <ImageIcon size={18} />
                                                </div>
                                                <div className="text-left leading-none">
                                                    <span className="font-black text-navy uppercase text-sm tracking-tighter">Banners Dinámicos Hero</span>
                                                    <p className="text-[9px] font-black text-navy/40 uppercase tracking-widest mt-0.5">{formData.hero_slides_json?.length || 0}/10 Banners Creados</p>
                                                </div>
                                            </div>
                                            <ChevronDown size={20} className={cn("text-navy/30 transition-transform", activeSection === 'portada' && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                            {activeSection === 'portada' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-white border-t border-gray-100"
                                                >
                                                    <div className="p-6 space-y-6">
                                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
                                                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                                            <div className="text-xs">
                                                                <p className="font-bold">Mínimo 1 Banner Activo</p>
                                                                <p className="opacity-80 mt-1">El sistema requiere que siempre haya al menos una imagen activa para mostrar en el inicio.</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6">
                                                            {formData.hero_slides_json?.map((slide: any, index: number) => (
                                                                <div key={slide.id} className={cn("border rounded-2xl p-4 transition-colors relative", slide.active ? "border-navy/10 bg-white shadow-sm" : "border-gray-200 bg-gray-50 opacity-80")}>
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="bg-navy text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{index + 1}</span>
                                                                            <span className="text-sm font-bold text-navy uppercase">Banner</span>
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center gap-3">
                                                                             <button 
                                                                                type="button"
                                                                                onClick={() => toggleHeroSlideActive(slide.id, slide.active)}
                                                                                className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors", slide.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500")}
                                                                            >
                                                                                {slide.active ? 'Activo' : 'Inactivo'}
                                                                            </button>
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => removeHeroSlide(slide.id)}
                                                                                className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                                                                title="Eliminar Banner"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div>
                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block mb-1">Título / Frase</label>
                                                                            <input 
                                                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-navy placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                                                value={slide.title}
                                                                                onChange={(e) => updateHeroSlideTitle(slide.id, e.target.value)}
                                                                                placeholder="Ej. NUEVA COLECCIÓN"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block mb-1">Descripción</label>
                                                                            <input 
                                                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-navy placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                                                value={slide.description || ''}
                                                                                onChange={(e) => updateHeroSlideDescription(slide.id, e.target.value)}
                                                                                placeholder="Ej. Soluciones premium"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* OFERTA DE TIEMPO LIMITADO - SIEMPRE VISIBLE */}
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
                                                                                onClick={() => toggleHeroSlideOffer(slide.id, !slide.offerEnabled)}
                                                                                className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase transition-colors", slide.offerEnabled ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-400")}
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
                                                                                    onChange={(e) => updateHeroSlideOffer(slide.id, 'offerTitle', e.target.value)}
                                                                                    placeholder="Ej. 20% OFF"
                                                                                />
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Descripción</label>
                                                                                <input 
                                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none transition-all"
                                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                                    value={slide.offerDescription || ''}
                                                                                    onChange={(e) => updateHeroSlideOffer(slide.id, 'offerDescription', e.target.value)}
                                                                                    placeholder="Ej. En todos los servicios"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Precio Original</label>
                                                                                <input 
                                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-gray-400 outline-none transition-all line-through"
                                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                                    value={slide.offerOriginalPrice || ''}
                                                                                    onChange={(e) => updateHeroSlideOffer(slide.id, 'offerOriginalPrice', e.target.value)}
                                                                                    placeholder="$100"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Precio Oferta</label>
                                                                                <input 
                                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-black outline-none transition-all"
                                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb', color: slide.offerEnabled ? '#ea580c' : '#9ca3af' }}
                                                                                    value={slide.offerPrice || ''}
                                                                                    onChange={(e) => updateHeroSlideOffer(slide.id, 'offerPrice', e.target.value)}
                                                                                    placeholder="$80"
                                                                                />
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Vencimiento</label>
                                                                                <input 
                                                                                    type="datetime-local"
                                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none transition-all"
                                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                                    value={(slide.offerExpiresAt || '').substring(0, 16)}
                                                                                    onChange={(e) => {
                                                                                        updateHeroSlideOffer(slide.id, 'offerExpiresAt', e.target.value);
                                                                                    }}
                                                                                    onBlur={(e) => {
                                                                                        updateHeroSlideOffer(slide.id, 'offerExpiresAt', e.target.value);
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <label className="text-[8px] font-black uppercase tracking-widest block mb-1" style={{ color: slide.offerEnabled ? '#f97316' : '#9ca3af' }}>Texto CTA</label>
                                                                                <input 
                                                                                    className="w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none transition-all"
                                                                                    style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                                    value={slide.offerCtaText || ''}
                                                                                    onChange={(e) => updateHeroSlideOffer(slide.id, 'offerCtaText', e.target.value)}
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
                                                                                        onChange={(e) => updateHeroSlideOffer(slide.id, 'offerColor', e.target.value)}
                                                                                    />
                                                                                    <input 
                                                                                        type="text"
                                                                                        className="flex-1 bg-white border rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none"
                                                                                        style={{ borderColor: slide.offerEnabled ? '#fed7aa' : '#e5e7eb' }}
                                                                                        value={slide.offerColor || ''}
                                                                                        onChange={(e) => updateHeroSlideOffer(slide.id, 'offerColor', e.target.value)}
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

                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            {/* Desktop */}
                                                                            <div className="space-y-2">
                                                                                <div className="flex justify-between items-center">
                                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desktop (PC) - 16:9</label>
                                                                                    <label className="cursor-pointer text-primary hover:text-primary/70 text-[10px] font-black uppercase transition-colors">
                                                                                        Cambiar
                                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleHeroSlideImage(e, slide.id, 'portada_desktop')} />
                                                                                    </label>
                                                                                </div>
                                                                                <div className="aspect-[21/9] bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 relative group">
                                                                                    {slide.portada_desktop ? (
                                                                                        <img src={slide.portada_desktop} className="w-full h-full object-cover" />
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 p-2">
                                                                                            <ImageIcon size={20} className="mb-2 opacity-50" />
                                                                                            <span className="text-[10px] font-bold text-center">Subir Imagen Ordenador</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {!slide.portada_desktop && (
                                                                                        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleHeroSlideImage(e, slide.id, 'portada_desktop')} />
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Movil */}
                                                                            <div className="space-y-2">
                                                                                <div className="flex justify-between items-center">
                                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Móvil - Vertical</label>
                                                                                    <label className="cursor-pointer text-primary hover:text-primary/70 text-[10px] font-black uppercase transition-colors">
                                                                                        Cambiar
                                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleHeroSlideImage(e, slide.id, 'portada_movil')} />
                                                                                    </label>
                                                                                </div>
                                                                                <div className="aspect-[4/5] w-24 sm:w-32 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 relative group">
                                                                                    {slide.portada_movil ? (
                                                                                        <img src={slide.portada_movil} className="w-full h-full object-cover" />
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 p-2">
                                                                                            <ImageIcon size={20} className="mb-2 opacity-50" />
                                                                                            <span className="text-[9px] font-bold text-center leading-tight">Subir Imagen Móvil</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {!slide.portada_movil && (
                                                                                        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleHeroSlideImage(e, slide.id, 'portada_movil')} />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {formData.hero_slides_json?.length < 10 && (
                                                            <button
                                                                type="button"
                                                                onClick={addHeroSlide}
                                                                className="w-full py-4 border-2 border-dashed border-primary/20 rounded-2xl flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors font-bold uppercase tracking-wide text-xs"
                                                            >
                                                                <Plus size={16} /> Agregar Nuevo Banner Hero
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* SECCIÓN 2.5: CATEGORÍAS E IMÁGENES (PROTOCOLO VIP) */}
                                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => setActiveSection(activeSection === 'categorias' ? null : 'categorias')}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
                                                    <Edit size={18} />
                                                </div>
                                                <span className="font-black text-navy uppercase text-sm tracking-tighter">Editar Categorías e Imágenes</span>
                                            </div>
                                            <ChevronDown size={20} className={cn("text-navy/30 transition-transform", activeSection === 'categorias' && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                            {activeSection === 'categorias' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-white border-t border-gray-100"
                                                >
                                                    <div className="p-6 space-y-6">
                                                        {/* Global Section Titles */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título de Sección (Experiencia)</label>
                                                                <input 
                                                                    className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" 
                                                                    value={experienceCategories.title} 
                                                                    onChange={(e) => updateExperienceCategories(e.target.value)} 
                                                                    placeholder="Ej. NUESTRAS CATEGORÍAS" 
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-primary uppercase tracking-widest">Especialidad / Subtítulo</label>
                                                                <input 
                                                                    className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-primary/5 border-primary/20" 
                                                                    value={experienceCategories.subtitle} 
                                                                    onChange={(e) => updateExperienceCategories(undefined, undefined, e.target.value)} 
                                                                    placeholder="Ej. Especialistas en Color y Corte" 
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Categories Grid */}
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categorías Individuales (Máx 6)</label>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {experienceCategories.categories.map((cat, idx) => (
                                                                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                                        {/* Thumbnail / Upload */}
                                                                        <div className="relative w-16 h-16 rounded-lg bg-gray-200 overflow-hidden shrink-0 group cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary transition-all">
                                                                            {cat.img ? (
                                                                                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                                    <Download size={20} />
                                                                                </div>
                                                                            )}
                                                                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                                                                {uploadingImage ? <Loader2 size={16} className="text-white animate-spin" /> : <Edit size={16} className="text-white" />}
                                                                                <input 
                                                                                    type="file" 
                                                                                    className="hidden" 
                                                                                    onChange={(e) => handleCategoryImage(e, idx)}
                                                                                    accept="image/*"
                                                                                    disabled={uploadingImage}
                                                                                />
                                                                            </label>
                                                                        </div>

                                                                        {/* Title and Description Editor */}
                                                                        <div className="grow space-y-2">
                                                                            <div className="space-y-1">
                                                                                <p className="text-[10px] font-black text-navy/40 uppercase tracking-tighter">Título Categoría {idx + 1}</p>
                                                                                <input 
                                                                                    className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none py-1 text-sm font-bold text-navy"
                                                                                    value={cat.title}
                                                                                    onChange={(e) => updateCategoryTitle(idx, e.target.value)}
                                                                                    placeholder={cat.originalTitle}
                                                                                />
                                                                            </div>
                                                                            {/* Enlace a categoría del catálogo */}
                                                                            {formData.catalogo_json?.categories?.length > 0 && (
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[10px] font-black text-primary/70 uppercase tracking-tighter flex items-center gap-1">
                                                                                        <Store size={10} /> "Ver catálogo" → enlazar a:
                                                                                    </p>
                                                                                    <select
                                                                                        className="w-full bg-primary/5 border border-primary/20 rounded-lg px-2 py-1.5 text-xs font-bold text-navy outline-none focus:border-primary transition-colors cursor-pointer"
                                                                                        value={(() => {
                                                                                            const raw = formData.json_override;
                                                                                            const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
                                                                                            return (parsed.experienceCatalogLinks || {})[idx] || '';
                                                                                        })()}
                                                                                        onChange={(e) => updateCatalogLink(idx, e.target.value)}
                                                                                    >
                                                                                        <option value="">— Categoría automática (por nombre) —</option>
                                                                                        {formData.catalogo_json.categories.map((catName: string) => (
                                                                                            <option key={catName} value={catName}>{catName}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const lines = (formData.productos_servicios || '').split('\n').filter((l: string) => l.trim()).filter((_: string, i: number) => i !== idx);
                                                                                const raw = formData.json_override;
                                                                                const parsed = typeof raw === 'string' ? safeParse(raw, {}) : (raw || {});
                                                                                const cleanTitles = (parsed.experienceTitles || []).filter((t: any) => t.index !== idx);
                                                                                const cleanImages = (parsed.experienceImages || []).filter((i: any) => i.index !== idx);
                                                                                const reindexedTitles = cleanTitles.map((t: any, i: number) => ({ ...t, index: i }));
                                                                                const reindexedImages = cleanImages.map((img: any, i: number) => ({ ...img, index: i }));
                                                                                parsed.experienceTitles = reindexedTitles;
                                                                                if (reindexedImages.length > 0) parsed.experienceImages = reindexedImages;
                                                                                else delete parsed.experienceImages;
                                                                                setFormData({ ...formData, productos_servicios: lines.join('\n'), json_override: parsed });
                                                                            }}
                                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start mt-2"
                                                                            title="Eliminar categoría"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>


                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* SECCIÓN 2.6: CARTA / MENÚ DIGITAL */}
                                    {(userData?.plan === 'business' || userData?.plan === 'catalog' || userData?.plan === 'digital' || userData?.plan === 'pro') && (
                                        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                            <button 
                                                onClick={() => setActiveSection(activeSection === 'carta' ? null : 'carta')}
                                                className="w-full flex items-center justify-between p-4 bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
                                                type="button"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                        <Zap size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="font-black text-navy uppercase text-sm tracking-tighter block">Carta / Menú Digital</span>
                                                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Soporta URL, Texto o JSON estructurado</span>
                                                    </div>
                                                </div>
                                                <ChevronDown size={20} className={cn("text-navy/30 transition-transform", activeSection === 'carta' && "rotate-180")} />
                                            </button>
                                            <AnimatePresence>
                                                {activeSection === 'carta' && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden bg-white border-t border-gray-100"
                                                    >
                                                         <div className="p-6 space-y-6">
                                                             {/* AI Importer Toggle Section */}
                                                             <div className="mb-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                                 <div className="flex justify-between items-center">
                                                                     <div className="flex items-center gap-2">
                                                                         <Zap size={16} className="text-primary animate-pulse" />
                                                                         <div>
                                                                             <span className="font-black text-navy uppercase text-xs tracking-tight block">¿Tienes una lista en texto plano?</span>
                                                                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nuestra IA la estructura y la inserta automáticamente</span>
                                                                         </div>
                                                                     </div>
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => setShowAIImporter(!showAIImporter)}
                                                                         className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                                                     >
                                                                         {showAIImporter ? 'Cerrar Asistente' : 'Estructurar con IA'}
                                                                     </button>
                                                                 </div>
                                                                 
                                                                 {showAIImporter && (
                                                                     <div className="mt-4 pt-4 border-t border-gray-200/60 space-y-3">
                                                                         <textarea
                                                                             className="w-full border rounded-xl p-3 text-xs text-gray-900 bg-white focus:border-primary outline-none min-h-[120px] scrollbar-hide font-bold"
                                                                             value={aiRawText}
                                                                             onChange={e => setAiRawText(e.target.value)}
                                                                             placeholder={`Pega tus productos aquí de forma simple. Ejemplo:\n\nEntradas:\n- Tequeños con salsa de ajo $6.50\n- Papas fritas artesanales $4.00\n\nBebidas:\n- Coca Cola $1.50\n- Limonada Imperial $2.50`}
                                                                         />
                                                                         <div className="flex justify-between items-center">
                                                                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider italic">
                                                                                 * Creará las categorías y productos directamente.
                                                                             </span>
                                                                             <button
                                                                                 type="button"
                                                                                 onClick={handleAutoStructure}
                                                                                 disabled={isStructuring}
                                                                                 className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                                                             >
                                                                                 {isStructuring ? (
                                                                                     <>
                                                                                         <Loader2 size={12} className="animate-spin" />
                                                                                         Estructurando...
                                                                                     </>
                                                                                 ) : (
                                                                                     <>
                                                                                         <Zap size={12} />
                                                                                         Estructurar e Importar
                                                                                     </>
                                                                                 )}
                                                                             </button>
                                                                         </div>
                                                                     </div>
                                                                 )}
                                                             </div>

                                                             {/* Loader / Visual Menu Builder */}
                                                             {loadingMenu ? (
                                                                 <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                                                     <Loader2 size={32} className="text-primary animate-spin" />
                                                                     <span className="text-[10px] font-black text-navy/40 uppercase tracking-widest animate-pulse">Cargando catálogo digital...</span>
                                                                 </div>
                                                             ) : (
                                                                 <div className="space-y-4">
                                                                     {menuCategories.length === 0 ? (
                                                                         <div className="text-center py-8 bg-gray-50 border border-dashed rounded-2xl">
                                                                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Aún no tienes categorías en tu menú</p>
                                                                             <p className="text-[10px] text-gray-400 max-w-xs mx-auto">Comienza agregando una categoría abajo o usa nuestro asistente de Inteligencia Artificial.</p>
                                                                         </div>
                                                                     ) : (
                                                                         <div className="space-y-3">
                                                                             {menuCategories.map((cat: any) => {
                                                                                 const isExpanded = !!expandedCategories[cat.id];
                                                                                 return (
                                                                                     <div key={cat.id} className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
                                                                                         {/* Category Header */}
                                                                                         <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/50 transition-colors">
                                                                                             <div className="flex items-center gap-2 flex-1">
                                                                                                 <button
                                                                                                     type="button"
                                                                                                     onClick={() => setExpandedCategories(prev => ({ ...prev, [cat.id]: !isExpanded }))}
                                                                                                     className="p-1 text-gray-400 hover:text-navy"
                                                                                                 >
                                                                                                     <ChevronDown size={18} className={cn("transition-transform text-navy/40", !isExpanded && "-rotate-90")} />
                                                                                                 </button>
                                                                                                 <input
                                                                                                     type="text"
                                                                                                     defaultValue={cat.nombre}
                                                                                                     onBlur={e => handleUpdateCategoryName(cat.id, e.target.value)}
                                                                                                     placeholder="Nombre de la categoría"
                                                                                                     className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary font-black uppercase text-navy tracking-tight text-xs p-1 outline-none transition-colors w-full max-w-xs"
                                                                                                 />
                                                                                             </div>
                                                                                             <div className="flex items-center gap-2">
                                                                                                 <button
                                                                                                     type="button"
                                                                                                     onClick={() => handleAddProduct(cat.id)}
                                                                                                     className="bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                                                                                 >
                                                                                                     + Producto
                                                                                                 </button>
                                                                                                 <button
                                                                                                     type="button"
                                                                                                     onClick={() => handleDeleteCategory(cat.id)}
                                                                                                     className="text-red-500 hover:bg-red-50 p-1.5 rounded-xl transition-all"
                                                                                                     title="Eliminar Categoría"
                                                                                                 >
                                                                                                     <Trash2 size={14} />
                                                                                                 </button>
                                                                                             </div>
                                                                                         </div>

                                                                                         {/* Products List (Expanded) */}
                                                                                         {isExpanded && (
                                                                                             <div className="p-3 border-t border-gray-100 bg-white space-y-3">
                                                                                                 {(cat.products || []).length === 0 ? (
                                                                                                     <p className="text-[10px] font-bold text-gray-400 text-center py-4 uppercase tracking-wider">No hay productos en esta categoría</p>
                                                                                                 ) : (
                                                                                                     <div className="divide-y divide-gray-100">
                                                                                                         {(cat.products || []).map((prod: any) => (
                                                                                                             <div key={prod.id} className="py-3 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-3 items-start md:items-center">
                                                                                                                 {/* Input details */}
                                                                                                                 <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 w-full">
                                                                                                                     <div className="md:col-span-5">
                                                                                                                         <input
                                                                                                                             type="text"
                                                                                                                             defaultValue={prod.nombre}
                                                                                                                             onBlur={e => handleUpdateProduct(prod.id, { nombre: e.target.value })}
                                                                                                                             placeholder="Nombre del producto"
                                                                                                                             className="w-full text-xs font-bold text-navy border-b border-gray-100 focus:border-primary p-1 outline-none transition-colors"
                                                                                                                         />
                                                                                                                     </div>
                                                                                                                     <div className="md:col-span-5">
                                                                                                                         <input
                                                                                                                             type="text"
                                                                                                                             defaultValue={prod.descripcion || ''}
                                                                                                                             onBlur={e => handleUpdateProduct(prod.id, { descripcion: e.target.value })}
                                                                                                                             placeholder="Descripción corta"
                                                                                                                             className="w-full text-xs font-medium text-gray-600 border-b border-gray-100 focus:border-primary p-1 outline-none transition-colors"
                                                                                                                         />
                                                                                                                     </div>
                                                                                                                     <div className="md:col-span-2">
                                                                                                                         <div className="flex items-center border-b border-gray-100 focus-within:border-primary p-1 transition-colors">
                                                                                                                             <span className="text-[10px] font-bold text-gray-400 mr-0.5">$</span>
                                                                                                                             <input
                                                                                                                                 type="number"
                                                                                                                                 step="0.01"
                                                                                                                                 defaultValue={prod.precio || ''}
                                                                                                                                 onBlur={e => handleUpdateProduct(prod.id, { precio: e.target.value ? parseFloat(e.target.value) : null })}
                                                                                                                                 placeholder="0.00"
                                                                                                                                 className="w-full text-xs font-bold text-navy outline-none bg-transparent"
                                                                                                                             />
                                                                                                                         </div>
                                                                                                                     </div>
                                                                                                                 </div>

                                                                                                                 {/* Actions & Availability */}
                                                                                                                 <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                                                                                                     <label className="flex items-center gap-1.5 cursor-pointer">
                                                                                                                         <input
                                                                                                                             type="checkbox"
                                                                                                                             defaultChecked={prod.disponible === 1}
                                                                                                                             onChange={e => handleUpdateProduct(prod.id, { disponible: e.target.checked ? 1 : 0 })}
                                                                                                                             className="rounded border-gray-300 text-primary focus:ring-primary h-3 w-3"
                                                                                                                         />
                                                                                                                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest select-none">Disponible</span>
                                                                                                                     </label>
                                                                                                                     <button
                                                                                                                         type="button"
                                                                                                                         onClick={() => handleDeleteProduct(cat.id, prod.id)}
                                                                                                                         className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-xl transition-all"
                                                                                                                         title="Eliminar Producto"
                                                                                                                     >
                                                                                                                         <Trash2 size={14} />
                                                                                                                     </button>
                                                                                                                 </div>
                                                                                                             </div>
                                                                                                         ))}
                                                                                                     </div>
                                                                                                 )}
                                                                                             </div>
                                                                                         )}
                                                                                     </div>
                                                                                 );
                                                                             })}
                                                                         </div>
                                                                     )}

                                                                     {/* Add Category Section */}
                                                                     <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                                                         <input
                                                                             type="text"
                                                                             value={newCategoryName}
                                                                             onChange={e => setNewCategoryName(e.target.value)}
                                                                             placeholder="Nueva categoría (ej: Bebidas, Postres, Entradas)"
                                                                             className="flex-1 text-xs font-bold text-navy border rounded-xl px-3 py-2 outline-none focus:border-primary"
                                                                         />
                                                                         <button
                                                                             type="button"
                                                                             onClick={handleAddCategory}
                                                                             className="bg-navy hover:bg-navy-dark text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                                                         >
                                                                             + Categoría
                                                                          </button>
                                                                     </div>
                                                                 </div>
                                                             )}
                                                         </div>
                                                     </motion.div>
                                                 )}
                                             </AnimatePresence>
                                         </div>
                                     )}

                                    {/* SECCIÓN 2.8: VIDEO, REDES Y UBICACIÓN */}
                                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => setActiveSection(activeSection === 'video-redes' ? null : 'video-redes')}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                                    <Video size={18} />
                                                </div>
                                                <span className="font-black text-navy uppercase text-sm tracking-tighter">Video, Redes y Ubicación</span>
                                            </div>
                                            <ChevronDown size={20} className={cn("text-navy/30 transition-transform", activeSection === 'video-redes' && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                            {activeSection === 'video-redes' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-white border-t border-gray-100"
                                                >
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Video Promocional */}
                                                        <div className="col-span-full space-y-1">
                                                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest decoration-primary decoration-2 underline-offset-4 flex items-center gap-2">
                                                                <Video size={14} /> Video Promocional (YouTube, TikTok, IG, FB)
                                                            </label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50 border-indigo-200" value={formData.youtube_video_url} onChange={(e) => setFormData({ ...formData, youtube_video_url: e.target.value })} placeholder="Pega aquí el link de YouTube, TikTok, Instagram o Facebook..." />
                                                        </div>

                                                        {/* Redes Sociales */}
                                                        <div className="col-span-full">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Redes Sociales</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-[#25D366] uppercase tracking-widest">WhatsApp</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="+593..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Email</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@ejemplo.com" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Instagram (Link)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="https://..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-[#0077B5] uppercase tracking-widest">LinkedIn (Link)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} placeholder="https://..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-black uppercase tracking-widest">TikTok (Social)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.tiktok} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })} placeholder="Link a perfil TikTok..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-[#FF0000] uppercase tracking-widest">YouTube (Social)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} placeholder="Link a canal YouTube..." />
                                                        </div>
                                                        <div className="col-span-full space-y-1">
                                                            <label className="text-[10px] font-black text-[#1DA1F2] uppercase tracking-widest">X (Twitter - Link)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50 border-blue-100" value={formData.x} onChange={(e) => setFormData({ ...formData, x: e.target.value })} placeholder="https://x.com/tuperfil" />
                                                        </div>
                                                        <div className="col-span-full space-y-1">
                                                            <label className="text-[10px] font-black text-[#1877F2] uppercase tracking-widest">Facebook (Link)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50 border-blue-100" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} placeholder="https://facebook.com/..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Sitio Web</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.web} onChange={(e) => setFormData({ ...formData, web: e.target.value })} placeholder="https://..." />
                                                        </div>

                                                        {/* Calificación y Reseña */}
                                                        {(userData?.plan === 'business' || userData?.plan === 'catalog') && (
                                                            <div className="grid grid-cols-2 gap-4 col-span-full">
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Puntaje Google (Estrellas)</label>
                                                                    <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50 border-yellow-100" type="number" step="0.1" min="1" max="5" value={formData.google_rating} onChange={(e) => setFormData({ ...formData, google_rating: e.target.value })} placeholder="Ej. 4.9" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Número de Reseñas</label>
                                                                    <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50 border-yellow-100" type="number" value={formData.google_reviews_count} onChange={(e) => setFormData({ ...formData, google_reviews_count: e.target.value })} placeholder="Ej. 128" />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Ubicación */}
                                                        <div className="col-span-full">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 mt-4">Ubicación</p>
                                                        </div>
                                                        <div className="col-span-full space-y-1">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dirección Física</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Ej. Calle Principal #123" />
                                                        </div>
                                                        <div className="col-span-full space-y-1">
                                                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Google Business / Maps</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.google_business} onChange={(e) => setFormData({ ...formData, google_business: e.target.value })} placeholder="Link a Maps" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                     {/* SECCIÓN 2.7: MÓDULO INDUSTRIAL (Sólo si template es industrial) */}
                                    {formData.template_id === 'industrial' && (
                                        <div className="border-2 border-[#FF5C00]/20 rounded-2xl overflow-hidden shadow-sm">
                                            <button 
                                                onClick={() => setActiveSection(activeSection === 'industrial' ? null : 'industrial')} 
                                                className="w-full flex items-center justify-between p-4 bg-[#FF5C00]/5 hover:bg-[#FF5C00]/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#FF5C00] flex items-center justify-center text-white">
                                                        <Activity size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="font-black text-navy uppercase text-sm tracking-tighter block">Módulo Industrial / Confianza</span>
                                                        <span className="text-[10px] font-bold text-[#FF5C00] uppercase tracking-widest">Personaliza métricas y estadísticas</span>
                                                    </div>
                                                </div>
                                                <ChevronDown size={20} className={cn("text-navy/30 transition-transform", activeSection === 'industrial' && "rotate-180")} />
                                            </button>
                                            <AnimatePresence>
                                                {activeSection === 'industrial' && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden bg-white border-t border-[#FF5C00]/10"
                                                    >
                                                        <div className="p-6 space-y-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Etiqueta Superior</label>
                                                                    <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={industrialConfig.badge} onChange={(e) => updateIndustrialConfig({ badge: e.target.value })} placeholder="Garantía de Calidad" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título Principal</label>
                                                                    <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={industrialConfig.title} onChange={(e) => updateIndustrialConfig({ title: e.target.value })} placeholder="Por qué elegirnos" />
                                                                </div>
                                                                <div className="col-span-full space-y-1">
                                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción de Confianza</label>
                                                                    <textarea className="w-full border rounded-lg p-3 text-gray-900 text-sm font-medium bg-gray-50" rows={2} value={industrialConfig.description} onChange={(e) => updateIndustrialConfig({ description: e.target.value })} placeholder="Nuestra infraestructura..." />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <label className="text-[10px] font-black text-[#FF5C00] uppercase tracking-widest block border-b pb-2">Barras de Progreso (Métricas %)</label>
                                                                <div className="grid grid-cols-1 gap-3">
                                                                    {industrialConfig.metrics.map((m: any, i: number) => (
                                                                        <div key={i} className="flex gap-2">
                                                                            <input 
                                                                                className="flex-1 border rounded-lg p-2 text-xs font-bold" 
                                                                                value={m.label} 
                                                                                onChange={(e) => {
                                                                                    const next = [...industrialConfig.metrics];
                                                                                    next[i].label = e.target.value;
                                                                                    updateIndustrialConfig({ metrics: next });
                                                                                }}
                                                                            />
                                                                            <input 
                                                                                className="w-20 border rounded-lg p-2 text-xs font-bold text-center text-[#FF5C00]" 
                                                                                type="number"
                                                                                value={m.value} 
                                                                                onChange={(e) => {
                                                                                    const next = [...industrialConfig.metrics];
                                                                                    next[i].value = e.target.value;
                                                                                    updateIndustrialConfig({ metrics: next });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <label className="text-[10px] font-black text-[#FF5C00] uppercase tracking-widest block border-b pb-2">Cuadros de Estadísticas (Kpis)</label>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {industrialConfig.stats.map((s: any, i: number) => (
                                                                        <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                                                            <input 
                                                                                className="w-full bg-transparent font-black text-navy text-lg outline-none" 
                                                                                value={s.value} 
                                                                                placeholder="Valor (ej: 10+)"
                                                                                onChange={(e) => {
                                                                                    const next = [...industrialConfig.stats];
                                                                                    next[i].value = e.target.value;
                                                                                    updateIndustrialConfig({ stats: next });
                                                                                }}
                                                                            />
                                                                            <input 
                                                                                className="w-full bg-transparent font-bold text-gray-400 text-[10px] uppercase tracking-widest outline-none" 
                                                                                value={s.label} 
                                                                                placeholder="Etiqueta (ej: EXPERIENCIA)"
                                                                                onChange={(e) => {
                                                                                    const next = [...industrialConfig.stats];
                                                                                    next[i].label = e.target.value;
                                                                                    updateIndustrialConfig({ stats: next });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* SECCIÓN 2.8: MÓDULO HEDKANDI (Texto del Marquee) */}
                                    {(formData.template_id === 'hedkandi' || formData.template_id === 'showcase') && (
                                        <div className="border-2 border-pink-500/20 rounded-2xl overflow-hidden shadow-sm">
                                            <button 
                                                onClick={() => setActiveSection(activeSection === 'hedkandi' ? null : 'hedkandi')} 
                                                className="w-full flex items-center justify-between p-4 bg-pink-500/5 hover:bg-pink-500/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-white">
                                                        <Sparkles size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="font-black text-navy uppercase text-sm tracking-tighter block">Módulo Hedkandi / Showcase</span>
                                                        <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">Personaliza el texto del marquee</span>
                                                    </div>
                                                </div>
                                                <ChevronDown size={20} className={cn("text-navy/30 transition-transform", activeSection === 'hedkandi' && "rotate-180")} />
                                            </button>
                                            <AnimatePresence>
                                                {activeSection === 'hedkandi' && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden bg-white border-t border-pink-500/10"
                                                    >
                                                        <div className="p-6 space-y-4">
                                                            <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
                                                                <div className="flex gap-3 text-pink-800">
                                                                    <Info size={18} className="shrink-0 mt-0.5" />
                                                                    <div className="text-xs">
                                                                        <p className="font-bold">Texto de Fondo en Marquee</p>
                                                                        <p className="opacity-80 mt-1">Este texto aparece repetido como fondo animado en la sección de CTA. Por defecto usa el nombre del negocio.</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Texto del Marquee</label>
                                                                <input 
                                                                    className="w-full border rounded-xl p-3 text-gray-900 text-sm font-bold bg-gray-50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                                                                    value={marqueeText}
                                                                    onChange={(e) => updateMarqueeText(e.target.value)}
                                                                    placeholder={formData.nombre_negocio || "Nombre de tu negocio"}
                                                                />
                                                                <p className="text-[10px] text-gray-400 italic mt-1">Deja vacío para usar el nombre del negocio por defecto</p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* SECCIÓN 5: CATÁLOGO DE PRODUCTOS (VISIBLE SI EL PLAN ES CATALOG O SI SE PERMITE EXPLÍCITAMENTE) */}
                                     {(userData?.plan === 'catalog' || allowCatalog) && (
                                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => setActiveSection(activeSection === 'catalogo' ? null : 'catalogo')}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center text-navy">
                                                    <Store size={18} />
                                                </div>
                                                <div className="text-left leading-none">
                                                    <span className="font-black text-navy uppercase text-sm tracking-tighter">Catálogo de Productos</span>
                                                    {!allowCatalog && userData?.plan !== 'catalog' && <p className="text-[9px] font-black text-navy/40 uppercase tracking-widest">Exclusivo Plan BIZ + CAT</p>}
                                                </div>
                                            </div>
                                            <ChevronDown size={20} className={cn("text-navy/30 transition-transform", activeSection === 'catalogo' && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                            {activeSection === 'catalogo' && (userData?.plan === 'catalog' || allowCatalog) && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-visible bg-white border-t border-gray-100"
                                                >
                                                    <div className="p-5 flex flex-col gap-5">
                                                        {/* CATEGORÍAS - etiquetas simples */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">📁 Categorías</span>
                                                                <button
                                                                    onClick={() => {
                                                                        const cat = prompt('Nueva categoría (ej: Hamburguesas, Bebidas):');
                                                                        if (cat && cat.trim() && !formData.catalogo_json.categories.includes(cat.trim())) {
                                                                            setFormData({
                                                                                ...formData,
                                                                                catalogo_json: {
                                                                                    ...formData.catalogo_json,
                                                                                    categories: [...formData.catalogo_json.categories, cat.trim()]
                                                                                }
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="text-[11px] font-black text-[#FF5C00] bg-[#FF5C00]/10 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-[#FF5C00]/20 transition-all"
                                                                >
                                                                    + Nueva
                                                                </button>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {formData.catalogo_json.categories.filter((c: string) => c && !['Nueva Categoría', 'Sin Categoría', 'Todas', '', 'General'].includes(c)).map((cat, idx) => (
                                                                    <div key={idx} className="bg-[#FF5C00]/10 border border-[#FF5C00]/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                                                                        <span className="text-[11px] font-black text-[#FF5C00]">{cat}</span>
                                                                        <button onClick={() => {
                                                                            const productCount = formData.catalogo_json.products.filter(
                                                                                p => (p.category || p.categoria || '').toLowerCase() === cat.toLowerCase()
                                                                            ).length;
                                                                            var msg = 'Eliminar categoria "' + cat + '"?';
                                                                            if (productCount > 0) {
                                                                                msg += '\n\nADVERTENCIA: Tambien se eliminaran ' + productCount + ' producto(s) de esta categoria.\n\nEsta accion no se puede deshacer.';
                                                                            }
                                                                            if (!confirm(msg)) return;
                                                                            setFormData({
                                                                                ...formData,
                                                                                catalogo_json: {
                                                                                    ...formData.catalogo_json,
                                                                                    categories: formData.catalogo_json.categories.filter(c => c !== cat),
                                                                                    products: formData.catalogo_json.products.filter(
                                                                                        p => (p.category || p.categoria || '').toLowerCase() !== cat.toLowerCase()
                                                                                    )
                                                                                }
                                                                            });
                                                                        }} className="text-[#FF5C00]/50 hover:text-red-500 transition-colors"><X size={13} /></button>
                                                                    </div>
                                                                ))}
                                                                {formData.catalogo_json.categories.filter((c: string) => c && !['Nueva Categoría', 'Sin Categoría', 'Todas', '', 'General'].includes(c)).length === 0 && (
                                                                    <span className="text-[10px] text-gray-400 italic">Crea categorías para agrupar tus productos 😊</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* FILTRO + BOTÓN AÑADIR */}
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={productCategoryFilter}
                                                                onChange={(e) => { setProductCategoryFilter(e.target.value); productCategoryFilterRef.current = e.target.value; }}
                                                                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl text-[11px] font-black uppercase py-2.5 px-3 outline-none text-navy"
                                                            >
                                                                <option value="Todas">🎯 Todas</option>
                                                                {formData.catalogo_json.categories.filter((c: string) => c && !['Nueva Categoría', 'Sin Categoría', 'Todas', '', 'General'].includes(c)).map(c => (
                                                                    <option key={c} value={c}>📦 {c}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => {
                                                                    const cf = productCategoryFilterRef.current;
                                                                    const invalidCats = ['Nueva Categoría', 'Sin Categoría', 'Todas', '', 'General'];
                                                                    const cats = formData.catalogo_json.categories.filter((c: string) => c && !invalidCats.includes(c));
                                                                    const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                                                    let cat = cf !== 'Todas' ? (cats.find(c => norm(c) === norm(cf)) || cf) : (cats[0] || '');
                                                                    // Si cat es inválido, usar empty string
                                                                    if (!cat || invalidCats.includes(cat)) cat = '';
                                                                    setFormData({
                                                                        ...formData,
                                                                        catalogo_json: {
                                                                            ...formData.catalogo_json,
                                                                            products: [{
                                                                                id: `prod_${Date.now()}`,
                                                                                name: 'Producto Nuevo',
                                                                                price: '',
                                                                                description: '',
                                                                                image: '',
                                                                                images: [],
                                                                                video: '',
                                                                                category: cat
                                                                            }, ...formData.catalogo_json.products]
                                                                        }
                                                                    });
                                                                }}
                                                                className="bg-[#FF5C00] text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                            >
                                                                <Plus size={18} /> Añadir
                                                            </button>
                                                        </div>

                                                        {/* LISTA DE PRODUCTOS */}
                                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                                                            {formData.catalogo_json.products
                                                                .filter(p => {
                                                                    if (productCategoryFilter === 'Todas') return true;
                                                                    const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                                                    return norm(p.category || '') === norm(productCategoryFilter || '');
                                                                })
                                                                .map((prod, pIdx) => (
                                                                <div key={prod.id || pIdx} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative group hover:border-[#FF5C00]/30 transition-all">
                                                                    <button onClick={() => {
                                                                        if (confirm('¿Eliminar este producto?')) {
                                                                            setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.filter(p => p.id !== prod.id) } });
                                                                        }
                                                                    }} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"><X size={13} /></button>

                                                                    {/* Fila superior: Foto + Nombre + Precio */}
                                                                    <div className="flex items-start gap-3 mb-3">
                                                                        {/* FOTO principal + miniaturas extra */}
                                                                        <div className="flex-shrink-0 space-y-1">
                                                                            <label className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-all border border-gray-200 relative group/img block">
                                                                                {(() => {
                                                                                    const imgs = prod.images || (prod.image ? [prod.image] : []);
                                                                                    const imgSrc = imgs[0] || '';
                                                                                    return imgSrc ? (
                                                                                        <img src={imgSrc} className="w-full h-full object-cover" />
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[20px]">📷</div>
                                                                                    );
                                                                                })()}
                                                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity rounded-xl">
                                                                                    <Camera size={16} className="text-white" />
                                                                                </div>
                                                                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (!file) return;
                                                                                    const fd = new FormData();
                                                                                    fd.append('file', file);
                                                                                    if (userData?.slug) fd.append('slug', userData.slug);
                                                                                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                                                                    if (res.ok) {
                                                                                        const { url } = await res.json();
                                                                                        const current = prod.images || (prod.image ? [prod.image] : []);
                                                                                        setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, images: [...current, url], image: current[0] || url } : p) } });
                                                                                    }
                                                                                }} />
                                                                            </label>
                                                                            {/* Miniaturas extra (si tiene más fotos) */}
                                                                            {(prod.images?.length || 0) > 1 && (
                                                                                <div className="flex gap-1 mt-1">
                                                                                    {prod.images.slice(1, 5).map((imgUrl: string, iIdx: number) => (
                                                                                        <div key={iIdx} className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 relative group/mini shadow-sm">
                                                                                            <img src={imgUrl} className="w-full h-full object-cover" />
                                                                                            <button onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                const updated = prod.images.filter((_: string, idx: number) => idx !== iIdx + 1);
                                                                                                setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, images: updated, image: updated[0] || '' } : p) } });
                                                                                            }} className="absolute inset-0 bg-red-500/60 flex items-center justify-center opacity-0 group-hover/mini:opacity-100 transition-opacity text-white text-[8px] font-black"><X size={10} /></button>
                                                                                        </div>
                                                                                    ))}
                                                                                    {(prod.images?.length || 0) > 5 && <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500 shadow-sm">+{prod.images.length - 5}</div>}
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {/* Miniaturas de videos vinculados */}
                                                                            {(prod.videos?.length || 0) > 0 && (
                                                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                                                    {prod.videos.map((vidUrl: string, vIdx: number) => (
                                                                                        <div key={vIdx} className="w-9 h-9 rounded-lg bg-black overflow-hidden border border-gray-200 relative group/vid shadow-sm flex items-center justify-center text-white" title={vidUrl}>
                                                                                            <Video size={12} className="text-white/60 group-hover/vid:opacity-0 transition-opacity" />
                                                                                            <button onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                const updated = prod.videos.filter((_: string, idx: number) => idx !== vIdx);
                                                                                                setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, videos: updated, video: updated[0] || '' } : p) } });
                                                                                            }} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity text-white text-[8px] font-black"><X size={10} /></button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
 
                                                                        {/* Nombre + Precio */}
                                                                        <div className="flex-1 min-w-0 space-y-1.5">
                                                                            <input className="w-full bg-transparent border-0 border-b-2 border-gray-100 focus:border-[#FF5C00] pb-1 text-sm font-black text-navy outline-none placeholder:text-gray-300 transition-colors" value={prod.name} onChange={(e) => setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, name: e.target.value } : p) } })} placeholder="Nombre del producto" />
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-gray-400 text-[11px] font-bold">$</span>
                                                                                <input className="flex-1 bg-transparent border-0 border-b-2 border-gray-100 focus:border-[#FF5C00] pb-1 text-sm font-black text-navy outline-none placeholder:text-gray-300 transition-colors" value={prod.price} onChange={(e) => setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, price: e.target.value } : p) } })} placeholder="Precio" type="text" />
                                                                                <select className="bg-gray-100 border-0 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase text-navy outline-none" value={prod.category || ''} onChange={(e) => setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, category: e.target.value } : p) } })}>
                                                                                    {formData.catalogo_json.categories.filter(c => c && !['Nueva Categoría', 'Sin Categoría', 'Todas', '', 'General'].includes(c)).map(c => (
                                                                                        <option key={c} value={c}>{c}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                    </div>
 
                                                                    {/* DESCRIPCIÓN */}
                                                                    <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-[11px] font-medium text-navy min-h-[52px] resize-none outline-none focus:border-[#FF5C00]/50 transition-all placeholder:text-gray-300" value={prod.description} onChange={(e) => setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, description: e.target.value } : p) } })} placeholder="Descripción breve del producto..." rows={2} />
 
                                                                    {/* SUBIR ARCHIVO o pegar LINK (imagen o video) */}
                                                                    <div className="mt-2 flex items-center gap-2">
                                                                        <label className="flex items-center gap-1 text-[10px] font-bold text-[#FF5C00] bg-[#FF5C00]/10 hover:bg-[#FF5C00]/20 px-3 py-1.5 rounded-lg cursor-pointer transition-all">
                                                                            <Camera size={12} /> Subir
                                                                            <input type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (!file) return;
                                                                                const fd = new FormData();
                                                                                fd.append('file', file);
                                                                                if (userData?.slug) fd.append('slug', userData.slug);
                                                                                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                                                                if (res.ok) {
                                                                                    const { url } = await res.json();
                                                                                    if (isVideoUrl(url) || file.type.startsWith('video/')) {
                                                                                        const current = prod.videos || (prod.video ? [prod.video] : []);
                                                                                        setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, videos: [...current, url], video: current[0] || url } : p) } });
                                                                                    } else {
                                                                                        const current = prod.images || (prod.image ? [prod.image] : []);
                                                                                        setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, images: [...current, url], image: current[0] || url } : p) } });
                                                                                    }
                                                                                }
                                                                            }} />
                                                                        </label>
                                                                        <span className="text-[10px] text-gray-300">o</span>
                                                                        <div className="flex-1 flex items-center gap-1">
                                                                            <input className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] text-navy outline-none placeholder:text-gray-300" placeholder="Pega link (imagen o video)..." id={`media-link-${prod.id}`} />
                                                                            <button onClick={() => {
                                                                                const input = document.getElementById(`media-link-${prod.id}`) as HTMLInputElement;
                                                                                const url = input?.value?.trim();
                                                                                if (!url) return;
                                                                                if (isVideoUrl(url)) {
                                                                                    const current = prod.videos || (prod.video ? [prod.video] : []);
                                                                                    setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, videos: [...current, url], video: current[0] || url } : p) } });
                                                                                } else {
                                                                                    const current = prod.images || (prod.image ? [prod.image] : []);
                                                                                    setFormData({ ...formData, catalogo_json: { ...formData.catalogo_json, products: formData.catalogo_json.products.map(p => p.id === prod.id ? { ...p, images: [...current, url], image: current[0] || url } : p) } });
                                                                                }
                                                                                input.value = '';
                                                                            }} className="text-[10px] font-black text-[#FF5C00] hover:underline px-2 whitespace-nowrap">+ Link</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {formData.catalogo_json.products.filter(p => {
                                                                if (productCategoryFilter === 'Todas') return true;
                                                                const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                                                return norm(p.category || '') === norm(productCategoryFilter || '');
                                                            }).length === 0 && (
                                                                <div className="text-center py-8 text-gray-400 text-[12px] font-medium border-2 border-dashed border-gray-100 rounded-2xl">
                                                                    {productCategoryFilter === 'Todas' ? '👆 Añade tu primer producto' : `No hay productos en "${productCategoryFilter}"`}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                    {/* SECCIÓN 1: PERFIL */}
                                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => setActiveSection(activeSection === 'perfil' ? null : 'perfil')}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center text-navy font-black italic uppercase text-xs">
                                                    ID
                                                </div>
                                                <span className="font-black text-navy uppercase text-sm tracking-tighter">Identidad y Perfil</span>
                                            </div>
                                            <ChevronDown size={20} className={cn("text-navy/30 transition-transform", activeSection === 'perfil' && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                            {activeSection === 'perfil' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-white border-t border-gray-100"
                                                >
                                                    <div className="p-6 space-y-6">
                                                        <div className="flex gap-6 items-center">
                                                            <div className="relative group w-20 h-20 shrink-0">
                                                                <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-md">
                                                                    {formData.foto_url || userData.foto_url ? (
                                                                        <img src={formData.foto_url || userData.foto_url} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">?</div>
                                                                    )}
                                                                </div>
                                                                 <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                                      {uploadingImage ? <Loader2 size={16} className="text-white animate-spin" /> : <Edit size={16} className="text-white" />}
                                                                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'foto_url')} disabled={uploadingImage} />
                                                                  </label>
                                                             </div>
                                                             <div className="flex-1 space-y-3">
                                                                 {uploadingImage && (
                                                                     <p className="text-[10px] text-primary font-black animate-pulse uppercase italic">Optimizando imagen...</p>
                                                                 )}
                                                                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                                                    {['persona', 'negocio'].map((t) => (
                                                                        <button key={t} onClick={() => setFormData({ ...formData, tipo_perfil: t as any })} className={cn("flex-1 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all", formData.tipo_perfil === t ? "bg-white text-primary shadow-sm" : "text-gray-500")}>
                                                                            {t}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                {formData.tipo_perfil === 'persona' ? (
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} placeholder="Nombres" />
                                                                        <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} placeholder="Apellidos" />
                                                                    </div>
                                                                ) : (
                                                                    <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.nombre_negocio} onChange={(e) => setFormData({ ...formData, nombre_negocio: e.target.value })} placeholder="Nombre del Negocio" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profesión / Rubro</label>
                                                                <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.profession} onChange={(e) => setFormData({ ...formData, profession: e.target.value })} placeholder="Ej. Arquitecto" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa (Opcional)</label>
                                                                <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Tu empresa" />
                                                            </div>
                                                            <div className="col-span-full space-y-1">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sobre Mí / Bio</label>
                                                                <textarea className="w-full border rounded-lg p-3 text-gray-900 text-sm font-medium bg-gray-50" rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Cuéntales qué haces..." />
                                                            </div>
                                                                              {/* Soluciones Destacadas */}
                                                             {(userData?.plan === 'business' || userData?.plan === 'pro' || userData?.plan === 'digital' || (!userData?.plan && userData?.tipo_perfil === 'negocio') || userData?.plan === 'catalog') && (
                                                                 <div className="col-span-full space-y-2">
                                                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Soluciones Destacadas</label>
                                                                     {((userData?.plan === 'business' || userData?.plan === 'catalog') && menuCategories && menuCategories.length > 0) ? (
                                                                         <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3 transition-all">
                                                                             <div className="flex items-center gap-2">
                                                                                 <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold animate-pulse">✨</span>
                                                                                 <span className="text-[10px] font-black text-navy/70 uppercase tracking-wider">
                                                                                     Sincronizado automáticamente con tu Carta / Menú
                                                                                 </span>
                                                                             </div>
                                                                             <p className="text-[10px] text-gray-400 leading-normal">
                                                                                 Las categorías activas de tu Menú Digital o Catálogo de Servicios alimentan automáticamente la sección de servicios principales en tu vCard.
                                                                             </p>
                                                                             <div className="flex flex-wrap gap-1.5 pt-1">
                                                                                 {menuCategories.map((cat: any, i: number) => (
                                                                                     <span key={cat.id || i} className="inline-flex items-center bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-[10px] font-bold text-navy/80 shadow-sm border-dashed">
                                                                                         <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
                                                                                         {cat.nombre || cat.name}
                                                                                     </span>
                                                                                 ))}
                                                                             </div>
                                                                         </div>
                                                                     ) : (
                                                                         userData?.plan !== 'catalog' && (
                                                                             <textarea 
                                                                                 className="w-full border rounded-lg p-3 text-gray-900 text-sm font-medium bg-gray-50" 
                                                                                 rows={3} 
                                                                                 value={formData.productos_servicios} 
                                                                                 onChange={(e) => setFormData({ ...formData, productos_servicios: e.target.value })} 
                                                                                 placeholder="Lista tus soluciones o servicios principales..." 
                                                                             />
                                                                         )
                                                                     )}
                                                                 </div>
                                                             )}
                                                             {formData.tipo_perfil === 'negocio' && (
                                                                 <div className="col-span-full grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                                     <div className="space-y-1">
                                                                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombres Responsable</label>
                                                                         <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-white" value={formData.contacto_nombre} onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })} placeholder="Ej. Juan" />
                                                                     </div>
                                                                     <div className="space-y-1">
                                                                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Apellidos Responsable</label>
                                                                         <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-white" value={formData.contacto_apellido} onChange={(e) => setFormData({ ...formData, contacto_apellido: e.target.value })} placeholder="Ej. Perez" />
                                                                     </div>
                                                                 </div>
                                                             )}
                                                             <div className="col-span-full space-y-1">
                                                                 <label className="text-[10px] font-black text-primary uppercase tracking-widest">Etiquetas / Tags (Separados por coma)</label>
                                                                 <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-primary/5 border-primary/20" value={formData.etiquetas} onChange={(e) => setFormData({ ...formData, etiquetas: e.target.value })} placeholder="Ej. Parrillada, Eventos, Gourmet" />
                                                             </div>

                                                             {/* ─── COLOR PICKER: Tema personalizado ─── */}
                                                             <div className="col-span-full border-t border-gray-100 pt-4 mt-2">
                                                                 <div className="flex items-center justify-between gap-4">
                                                                     <div className="flex-1">
                                                                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Color Principal del Tema</label>
                                                                         <p className="text-[9px] text-gray-400 leading-tight">
                                                                             Elige el color que destacará en tu perfil (botones, títulos, bordes). 
                                                                             Si no eliges ninguno, se extraerá automáticamente de tu foto de perfil.
                                                                         </p>
                                                                     </div>
                                                                     <div className="flex items-center gap-3 shrink-0">
                                                                         <input 
                                                                             type="color" 
                                                                             value={(() => {
                                                                                 const override = formData.json_override || {};
                                                                                 return (override as any).themePrimary || '#f66739';
                                                                             })()}
                                                                             onChange={(e) => {
                                                                                 const newColor = e.target.value;
                                                                                 setFormData({
                                                                                     ...formData,
                                                                                     json_override: {
                                                                                         ...(formData.json_override || {}),
                                                                                         themePrimary: newColor,
                                                                                         themeTextOnPrimary: '#ffffff',
                                                                                     }
                                                                                 });
                                                                             }}
                                                                             className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-primary/50 transition-colors"
                                                                             style={{ backgroundColor: (() => {
                                                                                 const override = formData.json_override || {};
                                                                                 return (override as any).themePrimary || '#f66739';
                                                                             })() }}
                                                                         />
                                                                         <button
                                                                             onClick={() => {
                                                                                 const newOverride = { ...(formData.json_override || {}) };
                                                                                 delete (newOverride as any).themePrimary;
                                                                                 delete (newOverride as any).themeTextOnPrimary;
                                                                                 setFormData({ ...formData, json_override: newOverride });
                                                                             }}
                                                                             className="text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                                                                             title="Restaurar color automático"
                                                                         >
                                                                             Auto
                                                                         </button>
                                                                     </div>
                                                                 </div>
                                                                 {/* Preview del color */}
                                                                 <div className="flex items-center gap-3 mt-3">
                                                                     <div 
                                                                         className="w-full h-9 rounded-lg flex items-center px-4 text-[10px] font-black uppercase tracking-widest"
                                                                         style={{ 
                                                                             backgroundColor: (() => {
                                                                                 const override = formData.json_override || {};
                                                                                 return (override as any).themePrimary || '#f66739';
                                                                             })(),
                                                                             color: '#ffffff'
                                                                         }}
                                                                     >
                                                                         Vista previa del color
                                                                     </div>
                                                                     <span className="text-[10px] font-mono text-gray-400 shrink-0">
                                                                         {(() => {
                                                                             const override = formData.json_override || {};
                                                                             return (override as any).themePrimary || '#f66739';
                                                                         })()}
                                                                     </span>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* SECCIÓN 2: CONTACTO Y REDES */}
                                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                        <button 
                                            onClick={() => setActiveSection(activeSection === 'contacto' ? null : 'contacto')}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                                                    <Phone size={18} />
                                                </div>
                                                <span className="font-black text-navy uppercase text-sm tracking-tighter">Contacto y Redes Sociales</span>
                                            </div>
                                            <ChevronDown size={20} className={cn("text-navy/30 transition-transform", activeSection === 'contacto' && "rotate-180")} />
                                        </button>
                                        <AnimatePresence>
                                            {activeSection === 'contacto' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-white border-t border-gray-100"
                                                >
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-[#25D366] uppercase tracking-widest">WhatsApp</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="+593..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Email</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@ejemplo.com" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Instagram (Link)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="https://..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-[#0077B5] uppercase tracking-widest">LinkedIn (Link)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} placeholder="https://..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-black uppercase tracking-widest">TikTok (Social)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.tiktok} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })} placeholder="Link a perfil TikTok..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-[#FF0000] uppercase tracking-widest">YouTube (Social)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} placeholder="Link a canal YouTube..." />
                                                        </div>
                                                        <div className="col-span-full space-y-1">
                                                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest text-[#1DA1F2]">X (Twitter - Link)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50 border-blue-100" value={formData.x} onChange={(e) => setFormData({ ...formData, x: e.target.value })} placeholder="https://x.com/tuperfil" />
                                                        </div>
                                                        <div className="col-span-full space-y-1">
                                                            <label className="text-[10px] font-black text-[#1877F2] uppercase tracking-widest">Facebook (Link)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50 border-blue-100" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} placeholder="https://facebook.com/..." />
                                                        </div>
                                                        <div className="col-span-full space-y-1">
                                                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest decoration-primary decoration-2 underline-offset-4 flex items-center gap-2">
                                                                <Video size={14} /> Video Promocional (YouTube, TikTok, IG, FB)
                                                            </label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50 border-indigo-200" value={formData.youtube_video_url} onChange={(e) => setFormData({ ...formData, youtube_video_url: e.target.value })} placeholder="Pega aquí el link de YouTube, TikTok, Instagram o Facebook..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Título de Catálogo / Carta</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={menuTitle} onChange={(e) => updateMenuTitle(e.target.value)} placeholder="Ej. NUESTRA CARTA" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Menú Digital (Link)</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.menu_digital} onChange={(e) => setFormData({ ...formData, menu_digital: e.target.value })} placeholder="https://..." />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-primary uppercase tracking-widest">Sitio Web</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.web} onChange={(e) => setFormData({ ...formData, web: e.target.value })} placeholder="https://..." />
                                                        </div>
                                                        <div className="col-span-full space-y-1">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dirección Física</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Ej. Calle Principal #123" />
                                                        </div>
                                                        <div className="col-span-full space-y-1">
                                                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Google Business / Maps</label>
                                                            <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50" value={formData.google_business} onChange={(e) => setFormData({ ...formData, google_business: e.target.value })} placeholder="Link a Maps" />
                                                        </div>
                                                        {(userData?.plan === 'business' || userData?.plan === 'catalog') && (
                                                         <div className="grid grid-cols-2 gap-4 col-span-full">
                                                             <div className="space-y-1">
                                                                 <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Puntaje Google (Estrellas)</label>
                                                                 <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50 border-yellow-100" type="number" step="0.1" min="1" max="5" value={formData.google_rating} onChange={(e) => setFormData({ ...formData, google_rating: e.target.value })} placeholder="Ej. 4.9" />
                                                             </div>
                                                             <div className="space-y-1">
                                                                 <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Número de Reseñas</label>
                                                                 <input className="w-full border rounded-lg p-3 text-gray-900 text-sm font-bold bg-gray-50 border-yellow-100" type="number" value={formData.google_reviews_count} onChange={(e) => setFormData({ ...formData, google_reviews_count: e.target.value })} placeholder="Ej. 128" />
                                                             </div>
                                                         </div>
                                                         )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                        </div>
                        )}

                        {step === 'success' && (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-500 px-4">
                                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-200 relative">
                                    <CheckCircle size={56} className="text-white" />
                                    <motion.div 
                                        className="absolute inset-0 rounded-full border-4 border-green-500"
                                        animate={{ scale: [1, 1.5, 1.5, 1], opacity: [1, 0, 0, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />
                                </div>
                                <h3 className="text-4xl font-black text-navy mb-4 tracking-tighter uppercase italic leading-none">
                                    ¡Cambios<br/>Guardados!
                                </h3>
                                <p className="text-gray-500 font-bold mb-10 max-w-sm uppercase text-xs tracking-widest decoration-primary decoration-4">
                                    Tu perfil ha sido actualizado. Los cambios serán visibles de inmediato.
                                </p>
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="bg-navy text-white font-black py-4 px-12 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-sm"
                                >
                                    Cerrar y Ver Perfil
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    {step === 'edit' && (
                        <div className="p-6 bg-white border-t flex justify-center gap-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] relative z-[60]">
                            <button 
                                onClick={onClose}
                                className="flex-1 max-w-[160px] bg-gray-100 text-navy font-black py-3 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                            >
                                <X size={16} /> Cancelar
                            </button>
                            <button 
                                 onClick={handleSave}
                                 disabled={loading || uploadingImage}
                                 className="flex-1 max-w-[300px] bg-primary text-white font-black py-3 rounded-xl hover:scale-[1.02] active:scale-100 transition-all uppercase tracking-[0.1em] text-xs flex items-center justify-center gap-3 shadow-lg shadow-primary/20 disabled:opacity-50"
                             >
                                 {loading ? <Loader2 className="animate-spin" size={18} /> : (uploadingImage ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />)}
                                 {loading ? 'Guardando...' : (uploadingImage ? 'Procesando...' : 'Confirmar y Guardar')}
                             </button>
                        </div>
                    )}
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
}
