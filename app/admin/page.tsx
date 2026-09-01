"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    XCircle,
    ExternalLink,
    Search,
    Filter,
    Clock,
    Eye,
    Download,
    RefreshCw,
    LogOut,
    User,
    ImageIcon,
    FileText,
    ShieldAlert,
    ShieldCheck,
    Edit,
    Edit3,
    Save,
    X,
    Upload,
    Trash2,
    Mail,
    Loader2,
    ChevronRight,
    QrCode,
    BarChart3,
    Users,
    ChevronDown,
    Info,
    Settings,
    Landmark,
    CreditCard,
    TrendingUp,
    Smartphone,
    Store,
    Library,
    Plus,
    Bell,
    CalendarCheck,
    Copy,
    BarChart2,
    Send,
    Utensils,
    Award,
    Trophy
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import StatsModal from "@/components/admin/StatsModal";
import VCardEditModal from "@/components/admin/VCardEditModal";
import { formatPhoneEcuador } from "@/lib/utils";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import BroadcastPanel from "@/components/admin/BroadcastPanel";


// Utilidad para detectar URLs de marcador de posición o no válidas
const isPlaceholderUrl = (url: string | null | undefined) => {
    if (!url) return true;
    if (url.startsWith('data:image')) return false; // Base64 is not a placeholder
    const placeholders = [
        'photo.com', 'example.com', 'placeholder.com', 'placehold.co', 
        'placeholder.supabase.co', 'supabase.co/storage',
        '_default.png', 'hero_desktop_default', 'hero_mobile_default'
    ];
    return placeholders.some(p => url.toLowerCase().includes(p));
};

export default function AdminDashboard() {
    const [registros, setRegistros] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("todos");
    const [sellers, setSellers] = useState<any[]>([]);
    const [sellerIdFilter, setSellerIdFilter] = useState<number | null>(null);
    const [isNotifying, setIsNotifying] = useState(false);
    const [isSellersDropdownOpen, setIsSellersDropdownOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [accessKey, setAccessKey] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRegistro, setEditingRegistro] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [statsTotal, setStatsTotal] = useState({ count: 0, income: 0, utility: 0, pending: 0, pendingValue: 0, pendingCommission: 0, paidCommission: 0, cola: 0, comisionesPendientes: 0 });
    const [globalDownloadStats, setGlobalDownloadStats] = useState({ total: 0, weekly: 0, monthly: 0, today: 0 });

    // Estados para creación de vendedor
    const [isCreateSellerModalOpen, setIsCreateSellerModalOpen] = useState(false);
    const [newSeller, setNewSeller] = useState({ nombre: '', email: '', password: '', comision_porcentaje: 30 });
    const [isCreatingSeller, setIsCreatingSeller] = useState(false);
    const [nextSellerCode, setNextSellerCode] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(false);

    // Estados para edición de vendedor
    const [isEditSellerModalOpen, setIsEditSellerModalOpen] = useState(false);
    const [editingSeller, setEditingSeller] = useState<any>(null);
    const [isSavingSeller, setIsSavingSeller] = useState(false);
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);


    // Estados para migración de equipo
    const [isMigrateModalOpen, setIsMigrateModalOpen] = useState(false);
    const [migratingLeader, setMigratingLeader] = useState<any>(null);
    const [targetLeaderId, setTargetLeaderId] = useState<number>(0);
    const [isMigratingTeam, setIsMigratingTeam] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isHeroPromptOpen, setIsHeroPromptOpen] = useState(false);
    const [promptRegistro, setPromptRegistro] = useState<any>(null);
    const [setupTarget, setSetupTarget] = useState<'view' | 'catalog'>('view');
    const [setupProducts, setSetupProducts] = useState<any[]>([
        { id: Date.now().toString(), categoria: '', titulo: '', descripcion: '', precio: '', url: '' }
    ]);

    // Estados para Catálogo
    const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState(false);
    const [catalogRegistro, setCatalogRegistro] = useState<any>(null);
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [newCatalogItem, setNewCatalogItem] = useState({ categoria: 'General', titulo: '', descripcion: '', precio: '' });
    const [catalogImageFile, setCatalogImageFile] = useState<File | null>(null);
    const [isSavingCatalog, setIsSavingCatalog] = useState(false);

    // Estados para Nuevo Cliente
    const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
    const [newClientData, setNewClientData] = useState({
        nombre: '',
        email: '',
        whatsapp: '',
        plan: 'basic',
        slug: ''
    });
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    // Estado para modal de descargas
    const [isDownloadsModalOpen, setIsDownloadsModalOpen] = useState(false);
    const [downloadsModalSlug, setDownloadsModalSlug] = useState<string | null>(null);
    const [downloadsModalName, setDownloadsModalName] = useState<string>('');
    const [downloadsData, setDownloadsData] = useState<any[]>([]);
    const [loadingDownloads, setLoadingDownloads] = useState(false);

    const openDownloadsModal = async (slug: string, nombre: string, adminKey: string) => {
        setDownloadsModalSlug(slug);
        setDownloadsModalName(nombre);
        setIsDownloadsModalOpen(true);
        setLoadingDownloads(true);
        try {
            const res = await fetch(`/api/admin/descargas?slug=${encodeURIComponent(slug)}`, {
                headers: { 'x-admin-key': adminKey }
            });
            const data = await res.json();
            setDownloadsData(data.data || []);
        } catch (err) {
            console.error('Error cargando descargas:', err);
        } finally {
            setLoadingDownloads(false);
        }
    };

    const exportDownloadsJSON = () => {
        const blob = new Blob([JSON.stringify(downloadsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `descargas_${downloadsModalSlug}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const fetchNextCode = async () => {
        const adminKey = localStorage.getItem('admin_access_key') || '';
        try {
            const res = await fetch('/api/admin/sellers?nextCode=true', {
                headers: { 'x-admin-key': adminKey }
            });
            const data = await res.json();
            if (data.nextCode) setNextSellerCode(data.nextCode);
        } catch (err) {
            console.error("Error fetching next code:", err);
        }
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Evitando caracteres ambiguos
        let pass = "";
        for (let i = 0; i < 6; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewSeller({ ...newSeller, password: pass });
    };

    useEffect(() => {
        if (isCreateSellerModalOpen) {
            fetchNextCode();
        }
    }, [isCreateSellerModalOpen]);

    useEffect(() => {
        const storedKey = localStorage.getItem('admin_access_key');
        if (storedKey) {
            // Validar la clave almacenada contra el servidor
            fetch('/api/admin/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: storedKey })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.valid) {
                        setIsAuthorized(true);
                    } else {
                        localStorage.removeItem('admin_access_key');
                    }
                })
                .catch(() => localStorage.removeItem('admin_access_key'));
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: accessKey })
            });
            const data = await res.json();
            if (data.valid) {
                localStorage.setItem('admin_access_key', accessKey);
                setIsAuthorized(true);
            } else {
                alert("Clave incorrecta");
            }
        } catch {
            alert("Error de conexión al servidor");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_access_key');
        setIsAuthorized(false);
    };

    // Helper to calculate and set stats from records
    const calculateAndSetStats = (all: any[], currentSellers: any[]) => {
        const totalIngreso = all.reduce((acc: number, r: any) => 
            (r.status === 'pagado' || r.status === 'entregado') ? acc + getPlanPrice(r.plan) : acc, 0);

        const totalComisionesVendedores = all.reduce((acc: number, r: any) => {
            if ((r.status === 'pagado' || r.status === 'entregado') && r.seller_id) {
                if (isThirdPartySeller(r.seller_id, currentSellers)) {
                    const seller = currentSellers.find((s: any) => String(s.id) === String(r.seller_id));
                    const percentage = seller ? parseFloat(seller.comision_porcentaje || '0') : 0;
                    const price = getPlanPrice(r.plan);
                    return acc + (price * percentage / 100);
                }
            }
            return acc;
        }, 0);

        const clientesPendientesCount = all.filter((r: any) => r.status === 'pendiente').length;
        const valorClientesPendientes = all.filter((r: any) => r.status === 'pendiente').reduce((acc: number, r: any) => 
            acc + getPlanPrice(r.plan), 0);

        const comisionesXPagarMonto = all.reduce((acc: number, r: any) => {
            if ((r.status === 'pagado' || r.status === 'entregado') && r.seller_id) {
                if (isThirdPartySeller(r.seller_id, currentSellers)) {
                    if (r.commission_status === 'pending' || r.commission_status === 'paid_to_leader' || !r.commission_status) {
                        const seller = currentSellers.find((s: any) => String(s.id) === String(r.seller_id));
                        const percentage = seller ? parseFloat(seller.comision_porcentaje || '0') : 0;
                        const price = getPlanPrice(r.plan);
                        return acc + (price * percentage / 100);
                    }
                }
            }
            return acc;
        }, 0);

        const comisionesPendientesCount = all.filter((r: any) => 
            r.seller_id && 
            isThirdPartySeller(r.seller_id, currentSellers) &&
            (r.commission_status === 'pending' || r.commission_status === 'paid_to_leader' || !r.commission_status) && 
            (r.status === 'pagado' || r.status === 'entregado')
        ).length;

        const comisionesPagadasMonto = all.reduce((acc: number, r: any) => {
            if ((r.status === 'pagado' || r.status === 'entregado') && r.seller_id) {
                if (isThirdPartySeller(r.seller_id, currentSellers)) {
                    if (r.commission_status === 'completed') {
                        const seller = currentSellers.find((s: any) => String(s.id) === String(r.seller_id));
                        const percentage = seller ? parseFloat(seller.comision_porcentaje || '0') : 0;
                        const price = getPlanPrice(r.plan);
                        return acc + (price * percentage / 100);
                    }
                }
            }
            return acc;
        }, 0);

        const colaCorreos = all.filter((r: any) => r.status === 'pagado' && !r.auto_email_sent).length;
        
        setStatsTotal({
            count: all.length,
            income: totalIngreso,
            utility: totalIngreso - totalComisionesVendedores,
            pending: clientesPendientesCount,
            pendingValue: valorClientesPendientes,
            pendingCommission: comisionesXPagarMonto,
            paidCommission: comisionesPagadasMonto,
            cola: colaCorreos,
            comisionesPendientes: comisionesPendientesCount
        });
        setTotalCount(all.length);
    };

    const fetchRegistros = async () => {
        setLoading(true);
        try {
            const adminKey = localStorage.getItem('admin_access_key') || '';
            const [sRes, rRes] = await Promise.all([
                fetch('/api/admin/sellers', { headers: { 'x-admin-key': adminKey } }),
                fetch('/api/admin/registros?page=1&limit=10000', { headers: { 'x-admin-key': adminKey } })
            ]);

            let currentSellers = sellers;
            if (sRes.ok) {
                const sData = await sRes.json().catch(() => ({}));
                currentSellers = sData.data || [];
                setSellers(currentSellers);
            }

            if (rRes.ok) {
                const rData = await rRes.json().catch(() => ({}));
                if (rData.data) {
                    setRegistros(rData.data);
                    setTotalCount(rData.data.length);
                    setHasMore(false);
                    calculateAndSetStats(rData.data, currentSellers);
                }
            } else {
                const errData = await rRes.json().catch(() => ({}));
                console.error('Admin API Error:', errData);
            }
        } catch (err: any) {
            console.error('Error fetching registros:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatsTotal = async () => {
        // Stats are now computed directly inside fetchRegistros
    };

    const fetchGlobalDownloadStats = async () => {
        try {
            const adminKey = localStorage.getItem('admin_access_key') || '';
            const res = await fetch('/api/admin/descargas?type=stats', {
                headers: { 'x-admin-key': adminKey }
            });
            if (res.ok) {
                const data = await res.json();
                setGlobalDownloadStats({
                    total: data.total || 0,
                    weekly: data.weekly || 0,
                    monthly: data.monthly || 0,
                    today: data.today || 0
                });
            }
        } catch (err) {
            console.error('Error fetching global download stats:', err);
        }
    };

    // Search is now fully client-side — no re-fetch needed on searchTerm change

    const fetchSellers = async () => {
        try {
            const adminKey = localStorage.getItem('admin_access_key') || '';
            const res = await fetch('/api/admin/sellers', {
                headers: { 'x-admin-key': adminKey }
            });
            if (res.ok) {
                const result = await res.json();
                if (result.data) setSellers(result.data);
            }
        } catch (err) {
            console.error('Error fetching sellers:', err);
        }
    };

    const handleEditSeller = (seller: any) => {
        setEditingSeller({ ...seller }); // Clone seller object to avoid direct mutation
        setIsEditSellerModalOpen(true);
    };

    const handleSaveSellerEdit = async () => {
        if (!editingSeller) return;
        setIsSavingSeller(true);
        try {
            const token = localStorage.getItem("admin_access_key");
            if (!token) throw new Error("No token admin");

            const res = await fetch(`/api/admin/sellers/${editingSeller.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-key": token
                },
                body: JSON.stringify(editingSeller)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al actualizar vendedor");

            alert("Vendedor actualizado correctamente");
            setIsEditSellerModalOpen(false);
            setEditingSeller(null);
            fetchSellers(); // Refresh the list
        } catch (err: any) {
            alert(err.message || "Error de conexión");
        }
        setIsSavingSeller(false);
    };

    const handleDeleteRegistro = async (id: number, nombre: string) => {
        if (!confirm(`¿Estás seguro de eliminar permanentemente a ${nombre}? Esta acción borrara todos los datos asociados (incluyendo el slug) y no se puede deshacer.`)) return;

        const adminKey = localStorage.getItem('admin_access_key') || '';
        try {
            const res = await fetch(`/api/admin/registros?id=${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': adminKey }
            });
            if (res.ok) {
                alert("Registro eliminado con éxito");
                fetchRegistros();
            } else {
                const data = await res.json();
                alert("Error: " + (data.error || "No se pudo eliminar el registro"));
            }
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    const handleDeleteSeller = async (id: number) => {
        const seller = sellers.find(s => s.id === id);
        if (!seller) return;

        // Siempre abrir el modal de rescate para asegurar que los clientes/visitas no queden huérfanos
        setMigratingLeader(seller);
        setIsMigrateModalOpen(true);
    };

    const handleMigrateAndConfirmDelete = async () => {
        if (!migratingLeader) return;

        if (targetLeaderId === 0) {
            alert("Para heredar clientes y mapas, debes seleccionar a un Socio o Vendedor Oficial. (Si eres tú mismo, selecciónate en la lista).");
            return;
        }

        if (!confirm(`¿Estás absolutamente seguro de ELIMINAR a ${migratingLeader.nombre} y TRANSFERIR permanentemente todo su portafolio al vendedor seleccionado?`)) return;

        setIsMigratingTeam(true);

        const adminKey = localStorage.getItem('admin_access_key') || '';
        try {
            const res = await fetch(`/api/admin/sellers?id=${migratingLeader.id}&targetLeaderId=${targetLeaderId}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': adminKey }
            });

            const data = await res.json();
            if (res.ok) {
                alert(data.message || "Vendedor eliminado y portafolio heredado con éxito.");
                setIsMigrateModalOpen(false);
                setMigratingLeader(null);
                fetchSellers();
                fetchRegistros(); // Refrescar registros heredados
            } else {
                alert("Error: " + data.error);
            }
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setIsMigratingTeam(false);
        }
    };

    useEffect(() => {
        if (isAuthorized) {
            fetchRegistros();
            fetchSellers();
            fetchStatsTotal();
            fetchGlobalDownloadStats();
        }
    }, [isAuthorized]);

    // Live Mode Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAuthorized && isLive) {
            interval = setInterval(() => {
                // Refresh without showing loading state to avoid flickering
                const adminKey = localStorage.getItem('admin_access_key') || '';
                fetch('/api/admin/registros', { headers: { 'x-admin-key': adminKey } })
                    .then(res => res.json())
                    .then(data => {
                        if (data.data) setRegistros(data.data);
                    })
                    .catch(err => console.error("Live update failed", err));

                fetchGlobalDownloadStats();
            }, 10000); // Every 10 seconds
        }
        return () => clearInterval(interval);
    }, [isAuthorized, isLive]);

    const updateCommissionStatus = async (id: string, currentStatus: string) => {
        if (pendingIds.has(id)) return;

        // Ciclo: pending -> paid_to_leader -> completed -> pending
        let newStatus = '';
        if (currentStatus === 'pending') newStatus = 'paid_to_leader';
        else if (currentStatus === 'paid_to_leader') newStatus = 'completed';
        else if (currentStatus === 'completed') newStatus = 'pending';
        else newStatus = 'pending';

        const statusLabels: Record<string, string> = {
            'pending': 'PENDIENTE ⏳',
            'paid_to_leader': 'ENVIADO AL LÍDER 🚚',
            'completed': 'COMISIÓN PAGADA ✅'
        };

        if (!confirm(`¿Confirmas cambiar el estado a: ${statusLabels[newStatus]}?`)) return;

        setPendingIds(prev => new Set(prev).add(id));
        const adminKey = localStorage.getItem('admin_access_key') || '';
        try {
            const body: any = { id, commission_status: newStatus };
            if (newStatus === 'paid_to_leader') body.leader_paid_at = new Date().toISOString();

            const res = await fetch('/api/admin/registros', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setRegistros(prev => prev.map(r => r.id === id ? { ...r, commission_status: newStatus, leader_paid_at: body.leader_paid_at || r.leader_paid_at } : r));
            } else {
                const result = await res.json();
                alert("Error: " + (result.error || 'Error desconocido'));
            }
        } catch {
            alert("Error al conectar con el servidor.");
        } finally {
            setPendingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        if (pendingIds.has(id)) return;
        setPendingIds(prev => new Set(prev).add(id));

        const adminKey = localStorage.getItem('admin_access_key') || '';
        try {
            const res = await fetch('/api/admin/registros', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ id, status: newStatus })
            });
            const result = await res.json();
            if (res.ok) {
                setRegistros(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
            } else {
                alert("Error al actualizar estado: " + (result.error || 'Error desconocido'));
            }
        } catch {
            alert("Error al actualizar estado.");
        } finally {
            setPendingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleActivate = async (id: string, type: 'trial_15d' | 'annual') => {
        if (pendingIds.has(id)) return;
        
        const typeLabels: Record<string, string> = {
            'trial_15d': 'Prueba 15 Días',
            'annual': 'Suscripción 1 Año'
        };

        if (!confirm(`¿Confirmas activar el registro como: ${typeLabels[type]}?`)) return;

        setPendingIds(prev => new Set(prev).add(id));

        const adminKey = localStorage.getItem('admin_access_key') || '';
        
        // Buscar el registro actual para ver si ya tiene una fecha de expiración futura
        const currentRecord = registros.find(r => r.id === id);
        const existingExpires = currentRecord?.expires_at ? new Date(currentRecord.expires_at) : null;
        
        // Calcular fechas: si está vigente, sumamos a la fecha actual de expiración. 
        // Si ya venció o no tiene, sumamos desde hoy (now).
        const now = new Date();
        const baseDate = (existingExpires && existingExpires > now) ? existingExpires : now;
        const activatedAt = now.toISOString();
        const expiresAt = new Date(baseDate);

        if (type === 'trial_15d') {
            expiresAt.setDate(expiresAt.getDate() + 15);
        } else {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        try {
            const res = await fetch('/api/admin/registros', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ 
                    id, 
                    activated_at: activatedAt, 
                    expires_at: expiresAt.toISOString(), 
                    activation_type: type,
                    status: 'entregado', // Auto set to delivered on activation
                    expires_reminder_30d_sent: 0,
                    expires_reminder_7d_sent: 0,
                    expires_reminder_0d_sent: 0
                })
            });
            const result = await res.json();
            if (res.ok) {
                setRegistros(prev => prev.map(r => r.id === id ? { 
                    ...r, 
                    activated_at: activatedAt, 
                    expires_at: expiresAt.toISOString(), 
                    activation_type: type,
                    status: 'entregado',
                    expires_reminder_30d_sent: 0,
                    expires_reminder_7d_sent: 0,
                    expires_reminder_0d_sent: 0
                } : r));
                alert(`✅ Registro activado exitosamente (${typeLabels[type]}).`);
            } else {
                alert("Error al activar: " + (result.error || 'Error desconocido'));
            }
        } catch {
            alert("Error al activar el registro.");
        } finally {
            setPendingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const updatePlan = async (id: string, newPlan: string) => {
        if (pendingIds.has(id)) return;
        setPendingIds(prev => new Set(prev).add(id));

        const adminKey = localStorage.getItem('admin_access_key') || '';
        try {
            const res = await fetch('/api/admin/registros', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ id, plan: newPlan })
            });
            const result = await res.json();
            if (res.ok) {
                setRegistros(prev => prev.map(r => r.id === id ? { ...r, plan: newPlan } : r));
            } else {
                alert("Error al actualizar plan: " + (result.error || 'Error desconocido'));
            }
        } catch {
            alert("Error al actualizar plan.");
        } finally {
            setPendingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleEdit = async (registro: any) => {
        setIsSaving(true);
        try {
            const adminKey = localStorage.getItem('admin_access_key') || '';
            const res = await fetch(`/api/admin/registros/single?id=${registro.id}`, {
                headers: { 'x-admin-key': adminKey }
            });
            const data = await res.json();
            if (res.ok && data.data) {
                const fullRegistro = data.data;
                let galeriaUrls = fullRegistro.galeria_urls;
                if (typeof galeriaUrls === 'string') {
                    try { galeriaUrls = JSON.parse(galeriaUrls); } catch { galeriaUrls = []; }
                }
                if (!Array.isArray(galeriaUrls)) galeriaUrls = [];

                // Parse catalogo_json
                let catalogoJson = fullRegistro.catalogo_json;
                if (typeof catalogoJson === 'string') {
                    try { catalogoJson = JSON.parse(catalogoJson); } catch { catalogoJson = null; }
                }
                if (Array.isArray(catalogoJson)) {
                    // Legacy format: array of products
                    catalogoJson = {
                        categories: Array.from(new Set(catalogoJson.map((p: any) => p.categoria || p.category || 'Todas'))),
                        products: catalogoJson
                    };
                }
                if (!catalogoJson || typeof catalogoJson !== 'object') {
                    catalogoJson = { categories: [], products: [] };
                }
                // Parse hero_slides_json
                let heroSlidesJson = fullRegistro.hero_slides_json;
                if (typeof heroSlidesJson === 'string') {
                    try { heroSlidesJson = JSON.parse(heroSlidesJson); } catch { heroSlidesJson = []; }
                }
                if (!Array.isArray(heroSlidesJson)) heroSlidesJson = [];

                setEditingRegistro({ ...fullRegistro, galeria_urls: galeriaUrls, catalogo_json: catalogoJson, hero_slides_json: heroSlidesJson });
                setIsEditModalOpen(true);
            } else {
                alert("Error al obtener datos completos del registro.");
            }
        } catch (e) {
            alert("Error de red.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingRegistro) return;
        setIsSaving(true);
        const adminKey = localStorage.getItem('admin_access_key') || '';

        let recalculatedNombre = editingRegistro.nombre;
        if (editingRegistro.tipo_perfil === 'negocio') {
            recalculatedNombre = editingRegistro.nombre_negocio || editingRegistro.nombre;
            // Asegurar que ambos campos estén sincronizados antes de guardar
            editingRegistro.nombre = recalculatedNombre;
            editingRegistro.nombre_negocio = recalculatedNombre;
        } else if (editingRegistro.tipo_perfil === 'persona') {
            const combined = `${editingRegistro.nombres || ''} ${editingRegistro.apellidos || ''}`.trim();
            if (combined) recalculatedNombre = combined;
            editingRegistro.nombre = recalculatedNombre;
        }

        // 🔗 Sincronizar categorías - usar directamente catalogo.categories (ya actualizado por handleDeleteCategory/addProduct)
        try {
            let catalogo = editingRegistro.catalogo_json;
            if (typeof catalogo === 'string') { try { catalogo = JSON.parse(catalogo); } catch { catalogo = { categories: [], products: [] }; } }
            if (!catalogo || typeof catalogo !== 'object') catalogo = { categories: [], products: [] };
            if (!catalogo.categories) catalogo.categories = [];
            
            // IMPORTANTE: No regenerar categorías desde productos_servicios.
            // El admin ya actualiza catalogo.categories directamente via handleDeleteCategory/handleAddProduct.
            // Aquí solo aseguramos que categories sea un array limpio sin duplicados.
            const existingProductCats = (catalogo.products || []).map((p: any) => p.categoria || p.category).filter(Boolean);
            catalogo.categories = [...new Set([...catalogo.categories, ...existingProductCats])];
            editingRegistro.catalogo_json = catalogo;
        } catch (e) {
            console.warn('[Admin] Error sincronizando categorías:', e);
        }

        try {
            // El VCF se genera dinámicamente en el API, no es necesario guardarlo aquí.
            
            const res = await fetch('/api/admin/registros', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({
                    id: editingRegistro.id,
                    nombre: recalculatedNombre,
                    profesion: editingRegistro.profesion,
                    empresa: editingRegistro.empresa,
                    whatsapp: editingRegistro.whatsapp,
                    email: editingRegistro.email,
                    bio: editingRegistro.bio,
                    direccion: editingRegistro.direccion,
                    web: editingRegistro.web,
                    instagram: editingRegistro.instagram,
                    linkedin: editingRegistro.linkedin,
                    facebook: editingRegistro.facebook,
                    tiktok: editingRegistro.tiktok,
                    productos_servicios: editingRegistro.productos_servicios,
                    etiquetas: editingRegistro.etiquetas,
                    status: editingRegistro.status,
                    plan: editingRegistro.plan,
                    foto_url: editingRegistro.foto_url,
                    galeria_urls: editingRegistro.galeria_urls,
                    // New fields
                    google_business: editingRegistro.google_business,
                    youtube: editingRegistro.youtube,
                    x: editingRegistro.x,
                    template_id: editingRegistro.template_id || 'classic',
                    menu_digital: editingRegistro.menu_digital,
                    tipo_perfil: editingRegistro.tipo_perfil,
                    nombres: editingRegistro.nombres,
                    apellidos: editingRegistro.apellidos,
                    nombre_negocio: editingRegistro.nombre_negocio,
                    contacto_nombre: editingRegistro.contacto_nombre,
                    contacto_apellido: editingRegistro.contacto_apellido,
                    portada_desktop: editingRegistro.portada_desktop,
                    portada_movil: editingRegistro.portada_movil,
                    wifi_ssid: editingRegistro.wifi_ssid,
                    wifi_password: editingRegistro.wifi_password,
                    hero_button_text: editingRegistro.hero_button_text,
                    hero_action: editingRegistro.hero_action,
                    hero_file_url: editingRegistro.hero_file_url,
                    hero_external_link: editingRegistro.hero_external_link,
                    hero_wifi_steps: Array.isArray(editingRegistro.hero_wifi_steps) ? JSON.stringify(editingRegistro.hero_wifi_steps) : editingRegistro.hero_wifi_steps,
                    hero_section_title: editingRegistro.hero_section_title,
                    hero_step1_title: editingRegistro.hero_step1_title,
                    hero_step1_text: editingRegistro.hero_step1_text,
                    hero_step2_title: editingRegistro.hero_step2_title,
                    hero_step2_text: editingRegistro.hero_step2_text,
                    hero_step3_title: editingRegistro.hero_step3_title,
                    hero_step3_text: editingRegistro.hero_step3_text,
                    google_rating: editingRegistro.google_rating,
                    google_reviews_count: editingRegistro.google_reviews_count,
                    youtube_video_url: editingRegistro.youtube_video_url,
                    expires_reminder_7d_sent: editingRegistro.expires_reminder_7d_sent,
                    expires_reminder_0d_sent: editingRegistro.expires_reminder_0d_sent,
                    json_override: editingRegistro.json_override ? (
                        typeof editingRegistro.json_override === 'string'
                            ? editingRegistro.json_override
                            : JSON.stringify(editingRegistro.json_override)
                    ) : null,
                    catalogo_json: editingRegistro.catalogo_json ? (
                        typeof editingRegistro.catalogo_json === 'string' 
                            ? editingRegistro.catalogo_json 
                            : JSON.stringify(editingRegistro.catalogo_json)
                    ) : null,
                    hero_slides_json: editingRegistro.hero_slides_json ? (
                        typeof editingRegistro.hero_slides_json === 'string' 
                            ? editingRegistro.hero_slides_json 
                            : JSON.stringify(editingRegistro.hero_slides_json)
                    ) : null,
                    mensaje: editingRegistro.mensaje || null,
                })
            });
            const result = await res.json();
            if (res.ok) {
                setRegistros(prev => prev.map(r => r.id === editingRegistro.id ? { ...editingRegistro, nombre: recalculatedNombre } : r));
                setIsEditModalOpen(false);
                setEditingRegistro(null);
            } else {
                alert("Error al guardar cambios: " + (result.error || 'Error desconocido'));
            }
        } catch (err: any) {
            alert("Error al guardar cambios: " + err.message);
        }
        setIsSaving(false);
    };

    const generateClientSlug = (name: string) => {
        return name.toLowerCase().trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s-]+/g, '-')
            + '-' + Math.random().toString(36).substring(2, 6);
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingClient(true);
        const adminKey = localStorage.getItem('admin_access_key') || '';
        try {
            const payload = {
                ...newClientData,
                status: 'entregado',
            };
            const res = await fetch('/api/admin/registros', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok) {
                alert(`✅ Cliente creado con éxito. Slug: ${result.data.slug}`);
                setIsCreateClientModalOpen(false);
                setNewClientData({ nombre: '', email: '', whatsapp: '', plan: 'basic', slug: '' });
                fetchRegistros(); // Refrescar lista
            } else {
                alert("❌ Error: " + (result.error || 'Error desconocido'));
            }
        } catch (err: any) {
            alert("❌ Error: " + err.message);
        }
        setIsCreatingClient(false);
    };

    const handleCloneClient = async (registro: any) => {
        const baseSlug = registro.slug || registro.id;
        const newSlug = baseSlug + '-copia-' + Date.now().toString().slice(-4);
        
        if (!/^[a-z0-9-]+$/.test(newSlug)) {
            alert('El slug generado no es válido. Contacte al desarrollador.');
            return;
        }
        
        setIsSaving(true);
        const adminKey = localStorage.getItem('admin_access_key') || '';
        try {
            // Obtener el registro completo primero
            const res = await fetch(`/api/admin/registros/single?id=${registro.id}`, {
                headers: { 'x-admin-key': adminKey }
            });
            const data = await res.json();
            if (!res.ok || !data.data) {
                alert('Error al obtener datos del registro');
                return;
            }
            
            const fullRegistro = data.data;
            // Campos a excluir (calculados por la API o no existen en la DB)
            const camposExcluir = [
                'id', 'edit_code', 
                'sold_by_name', 'sold_by_code', 
                'download_count', 'downloads_count', 
                'created_at', 'updated_at',
                'last_edited_at',
                'edit_uses_remaining'
            ];
            const cleanData: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(fullRegistro)) {
                if (!camposExcluir.includes(key) && value !== undefined && value !== null) {
                    cleanData[key] = value;
                }
            }
            // Crear nuevo registro con el mismo contenido pero nuevo slug
            // Limpiar email para evitar duplicados
            const emailOriginal = cleanData.email || '';
            delete cleanData.email;
            
            const clonePayload = {
                ...cleanData,
                slug: newSlug.trim(),
                nombre: (fullRegistro.nombre || '') + ' (Copia)',
                status: 'pendiente',
            };
            
            const createRes = await fetch('/api/admin/registros', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(clonePayload)
            });
            const result = await createRes.json();
            if (createRes.ok) {
                alert(`✅ Cliente clonado con éxito.\n\nOriginal: /${baseSlug}\nNuevo: /${newSlug}`);
                fetchRegistros(); // Refrescar lista
            } else {
                alert('Error: ' + (result.error || 'Error desconocido'));
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
        setIsSaving(false);
    };

    const handleCreateSeller = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingSeller(true);
        const adminKey = localStorage.getItem('admin_access_key') || '';
        try {
            const res = await fetch('/api/admin/sellers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(newSeller)
            });
            const result = await res.json();
            if (res.ok) {
                alert(`✅ Vendedor creado con éxito. Código asignado: ${result.data.codigo}`);
                setIsCreateSellerModalOpen(false);
                setNewSeller({ nombre: '', email: '', password: '', comision_porcentaje: 30 });
                fetchSellers();
            } else {
                alert("❌ Error: " + (result.error || 'Error desconocido'));
            }
        } catch (err: any) {
            alert("❌ Error: " + err.message);
        }
        setIsCreatingSeller(false);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingRegistro) return;

        setIsSaving(true);
        try {
            // Comprimir la imagen antes de subir para evitar error 413
            const { compressImage } = await import('@/lib/imageCompress');
            const compressedFile = await compressImage(file);

            const uploadFormData = new FormData();
            uploadFormData.append('file', compressedFile);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
            if (!uploadRes.ok) throw new Error('Error subiendo foto al servidor');
            const { url: publicUrl } = await uploadRes.json();

            setEditingRegistro({ ...editingRegistro, foto_url: publicUrl });

            await fetch('/api/admin/registros', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': localStorage.getItem('admin_access_key') || ''
                },
                body: JSON.stringify({ id: editingRegistro.id, foto_url: publicUrl })
            });

            fetchRegistros(); // Sincronizar lista principal

        } catch (err: any) {
            alert("Error subiendo foto: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePortadaUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'portada_desktop' | 'portada_movil') => {
        const file = e.target.files?.[0];
        if (!file || !editingRegistro) return;

        setIsSaving(true);
        try {
            const { uploadFile } = await import('@/lib/upload');
            const { url: publicUrl } = await uploadFile({ file, slug: editingRegistro.id });

            setEditingRegistro({ ...editingRegistro, [tipo]: publicUrl });

            await fetch('/api/admin/registros', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': localStorage.getItem('admin_access_key') || ''
                },
                body: JSON.stringify({ id: editingRegistro.id, [tipo]: publicUrl })
            });

            fetchRegistros(); // Sincronizar lista principal

        } catch (err: any) {
            alert(`Error subiendo ${tipo}: ` + err.message);
        } finally {
            setIsSaving(false);
        }
    };
    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !editingRegistro || files.length === 0) return;

        setIsSaving(true);
        try {
            const { uploadFile } = await import('@/lib/upload');
            const newUrls = [...(editingRegistro.galeria_urls || [])];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const { url: publicUrl } = await uploadFile({ file, slug: editingRegistro.id });
                newUrls.push(publicUrl);
            }

            setEditingRegistro({ ...editingRegistro, galeria_urls: newUrls });

            await fetch('/api/admin/registros', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': localStorage.getItem('admin_access_key') || ''
                },
                body: JSON.stringify({ id: editingRegistro.id, galeria_urls: newUrls })
            });

            fetchRegistros(); // Sincronizar lista principal

        } catch (err: any) {
            alert("Error subiendo galería: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const removeGalleryItem = async (index: number) => {
        if (!editingRegistro) return;
        const newUrls = [...(editingRegistro.galeria_urls || [])];
        newUrls.splice(index, 1);
        setEditingRegistro({ ...editingRegistro, galeria_urls: newUrls });

        await fetch('/api/admin/registros', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-key': localStorage.getItem('admin_access_key') || ''
            },
            body: JSON.stringify({ id: editingRegistro.id, galeria_urls: newUrls })
        });
    };

    const handleViewProfile = async (registro: any) => {
        setIsSaving(true);
        try {
            const adminKey = localStorage.getItem('admin_access_key') || '';
            const res = await fetch(`/api/admin/registros/single?id=${registro.id}`, { headers: { 'x-admin-key': adminKey } });
            const data = await res.json();
            
            if (res.ok && data.data) {
                const fullRegistro = data.data;
                // Verificar si tiene banners (sistema antiguo o nuevo)
                let hasBanners = false;
                if (!isPlaceholderUrl(fullRegistro.portada_desktop) || !isPlaceholderUrl(fullRegistro.portada_movil)) {
                    hasBanners = true;
                } else {
                    try {
                        const slides = typeof fullRegistro.hero_slides_json === 'string' 
                            ? JSON.parse(fullRegistro.hero_slides_json || '[]') 
                            : (fullRegistro.hero_slides_json || []);
                        if (Array.isArray(slides) && slides.some((s: any) => s.active && (s.portada_desktop || s.portada_movil))) {
                            hasBanners = true;
                        }
                    } catch (e) {}
                }

                if (!hasBanners) {
                    setPromptRegistro(fullRegistro);
                    setSetupTarget('view');
                    setIsHeroPromptOpen(true);
                } else {
                    const targetUrl = fullRegistro.plan === 'menu'
                        ? `/menu/${fullRegistro.slug || fullRegistro.id}`
                        : (fullRegistro.plan === 'catalog' || fullRegistro.plan === 'catalogo')
                            ? `/catalog/${fullRegistro.slug || fullRegistro.id}`
                            : `/card/${fullRegistro.slug || fullRegistro.id}`;
                    window.open(targetUrl, '_blank');
                }
            } else {
                // Fallback al objeto local si falla la red
                const targetUrl = (registro as any).plan === 'menu'
                    ? `/menu/${registro.slug || registro.id}`
                    : ((registro as any).plan === 'catalog' || (registro as any).plan === 'catalogo')
                        ? `/catalog/${registro.slug || registro.id}`
                        : `/card/${registro.slug || registro.id}`;
                window.open(targetUrl, '_blank');
            }
        } catch (e) {
            const targetUrl = (registro as any).plan === 'menu'
                ? `/menu/${registro.slug || registro.id}`
                : ((registro as any).plan === 'catalog' || (registro as any).plan === 'catalogo')
                    ? `/catalog/${registro.slug || registro.id}`
                    : `/card/${registro.slug || registro.id}`;
            window.open(targetUrl, '_blank');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCatalogSetup = async (registro: any) => {
        setIsSaving(true);
        try {
            const adminKey = localStorage.getItem('admin_access_key') || '';
            const res = await fetch(`/api/admin/registros/single?id=${registro.id}`, { headers: { 'x-admin-key': adminKey } });
            const data = await res.json();
            if (res.ok && data.data) {
                const fullRegistro = data.data;
                let catItems = [];
                try {
                    let parsed = typeof fullRegistro.catalogo_json === 'string' ? JSON.parse(fullRegistro.catalogo_json || '[]') : (fullRegistro.catalogo_json || []);
                    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                    let extracted = Array.isArray(parsed) ? parsed : (parsed?.products || []);
                    if (typeof extracted === 'string') extracted = JSON.parse(extracted);
                    catItems = Array.isArray(extracted) ? extracted : [];
                } catch(e) {
                    catItems = [];
                }

                if (catItems.length === 0) {
                    setPromptRegistro(fullRegistro);
                    setSetupTarget('catalog');
                    setIsHeroPromptOpen(true);
                } else {
                    window.open(`/catalog/${fullRegistro.slug || fullRegistro.id}`, '_blank');
                }
            } else {
                alert("Error al cargar los datos del catálogo.");
            }
        } catch (e) {
            alert("Error de red.");
        } finally {
            setIsSaving(false);
        }
    };

    const openCatalogManager = async (registro: any) => {
        setIsSaving(true);
        // Limpiar estados anteriores ANTES de cargar nuevos datos
        setCatalogItems([]);
        setCatalogRegistro(null);
        try {
            const adminKey = localStorage.getItem('admin_access_key') || '';
            const res = await fetch(`/api/admin/registros/single?id=${registro.id}`, { headers: { 'x-admin-key': adminKey } });
            const data = await res.json();
            if (res.ok && data.data) {
                const fullRegistro = data.data;
                setCatalogRegistro(fullRegistro);
                let itemsToSet = [];
                try {
                    let parsed = typeof fullRegistro.catalogo_json === 'string' ? JSON.parse(fullRegistro.catalogo_json || '[]') : (fullRegistro.catalogo_json || []);
                    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                    let extracted = Array.isArray(parsed) ? parsed : (parsed?.products || []);
                    if (typeof extracted === 'string') extracted = JSON.parse(extracted);
                    itemsToSet = Array.isArray(extracted) ? extracted : [];
                } catch(e) {
                    itemsToSet = [];
                }
                setCatalogItems(itemsToSet);
                setIsCatalogManagerOpen(true);
            } else {
                alert("Error al cargar los datos.");
            }
        } catch (e) {
            alert("Error de conexión.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddCatalogItem = async () => {
        if (!catalogRegistro || !catalogImageFile || !newCatalogItem.titulo) return;
        setIsSavingCatalog(true);

        try {
            // Subir imagen (comprimir antes para evitar error 413)
            const { compressImage } = await import('@/lib/imageCompress');
            const compressedFile = await compressImage(catalogImageFile);
            const fd = new FormData();
            fd.append('file', compressedFile);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!uploadRes.ok) throw new Error('Error subiendo imagen del catálogo');
            const { url } = await uploadRes.json();

            // Extraer categorías existentes desde catalogo_json
            let existingCatalogo: any = { categories: [], products: [] };
            try {
                const raw = catalogRegistro.catalogo_json;
                const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
                if (Array.isArray(parsed)) {
                    existingCatalogo = { categories: [...new Set(parsed.map((p: any) => p.categoria || p.category || 'General'))], products: parsed };
                } else if (parsed?.products) {
                    existingCatalogo = parsed;
                }
            } catch (e) {}
            if (!existingCatalogo.categories) existingCatalogo.categories = [];
            if (!existingCatalogo.products) existingCatalogo.products = [];

            const newItem = {
                id: Date.now().toString(),
                categoria: newCatalogItem.categoria || 'General',
                category: newCatalogItem.categoria || 'General',
                nombre: newCatalogItem.titulo,
                name: newCatalogItem.titulo,
                descripcion: newCatalogItem.descripcion,
                description: newCatalogItem.descripcion,
                precio: newCatalogItem.precio,
                price: newCatalogItem.precio,
                imagenes: url ? [url] : [],
                videos: []
            };

            const updatedItems = [...existingCatalogo.products, newItem];
            const allCats = [...new Set([...existingCatalogo.categories, newItem.categoria])];
            const catalogoPayload = { categories: allCats, products: updatedItems };

            setCatalogItems(updatedItems);
            // Actualizar catalogRegistro con el nuevo estado
            setCatalogRegistro((prev: any) => ({ ...prev, catalogo_json: catalogoPayload }));

            // Guardar en formato OBJECT (compatible con VCardEditModal)
            await fetch('/api/admin/registros', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': localStorage.getItem('admin_access_key') || ''
                },
                body: JSON.stringify({ id: catalogRegistro.id, catalogo_json: JSON.stringify(catalogoPayload) })
            });

            // Limpiar formulario
            setNewCatalogItem({ categoria: 'General', titulo: '', descripcion: '', precio: '' });
            setCatalogImageFile(null);
            fetchRegistros(); // Refrescar

        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSavingCatalog(false);
        }
    };

    const handleDeleteCatalogItem = async (index: number) => {
        if (!catalogRegistro) return;
        const item = catalogItems[index];
        const itemName = item?.nombre || item?.name || item?.titulo || 'este producto';
        if (!confirm('Eliminar "' + itemName + '"?\n\nEsta accion no se puede deshacer.')) return;
        const updatedItems = [...catalogItems];
        updatedItems.splice(index, 1);
        setCatalogItems(updatedItems);

        // Re-calcular categorías desde productos restantes
        const remainingCats = [...new Set(updatedItems.map((p: any) => p.categoria || p.category || 'General').filter(Boolean))];
        const catalogoPayload = { categories: remainingCats, products: updatedItems };

        // Actualizar catalogRegistro
        setCatalogRegistro((prev: any) => ({ ...prev, catalogo_json: catalogoPayload }));

        await fetch('/api/admin/registros', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-key': localStorage.getItem('admin_access_key') || ''
            },
            body: JSON.stringify({ id: catalogRegistro.id, catalogo_json: JSON.stringify(catalogoPayload) })
        });
        fetchRegistros();
    };


    const handleHeroUploadConfirm = async () => {
        if (!promptRegistro) return;

        // Si hay datos de catálogo en el setup rápido, guardarlos primero
        const productsToSave = setupProducts.filter(p => p.titulo.trim() || p.categoria.trim());

        if (productsToSave.length > 0) {
            // Aseguramos que tengan IDs válidos y valores por defecto
            const formattedProducts = productsToSave.map((p, idx) => ({
                id: p.id || (Date.now() + idx).toString(),
                categoria: p.categoria.trim() || 'General',
                category: p.categoria.trim() || 'General',
                nombre: p.titulo.trim() || `Producto ${idx + 1}`,
                name: p.titulo.trim() || `Producto ${idx + 1}`,
                descripcion: p.descripcion.trim(),
                description: p.descripcion.trim(),
                precio: p.precio.trim(),
                price: p.precio.trim(),
                imagenes: p.url ? [p.url] : [],
                videos: []
            }));
            const cats = [...new Set(formattedProducts.map(p => p.categoria).filter(Boolean))];
            const catalogoPayload = { categories: cats, products: formattedProducts };

            try {
                await fetch('/api/admin/registros', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-key': localStorage.getItem('admin_access_key') || ''
                    },
                    body: JSON.stringify({
                        id: promptRegistro.id,
                        catalogo_json: JSON.stringify(catalogoPayload)
                    })
                });
            } catch (err) {
                console.error("Error saving initial catalog items", err);
            }
        }

        // Refresh registries to reflect new images
        fetchRegistros();
        setIsHeroPromptOpen(false);
        setSetupProducts([{ id: Date.now().toString(), categoria: '', titulo: '', descripcion: '', precio: '', url: '' }]);

        const path = setupTarget === 'catalog' ? 'catalog' : 'card';
        const suffix = setupTarget === 'catalog' ? '?setup=true' : '';

        // Open the profile/catalog after a short delay to ensure DB update is perceived
        setTimeout(() => {
            window.open(`/${path}/${promptRegistro.slug || promptRegistro.id}${suffix}`, '_blank');
        }, 500);
    };

    const filtered = (() => {
        const term = searchTerm.toLowerCase().trim();
        return registros.filter(r => {
            // --- Smart fuzzy search across all relevant fields ---
            let matchesSearch = true;
            if (term) {
                const fields = [
                    r.nombre || '',
                    r.email || '',
                    r.slug || '',
                    r.whatsapp || r.telefono || '',
                    r.plan || '',
                    r.status || '',
                    String(r.id || ''),
                    r.profesion || '',
                    r.nombre_negocio || '',
                    r.etiquetas || '',
                    r.productos_servicios || '',
                    r.bio || '',
                ].map(f => f.toLowerCase());
                // Match if ALL space-separated words appear in any field
                const words = term.split(/\s+/).filter(Boolean);
                matchesSearch = words.every(word =>
                    fields.some(f => f.includes(word))
                );
            }

            // --- Status filter ---
            let matchesStatus = true;
            if (statusFilter === "clientes_pendientes") {
                matchesStatus = r.status === "pendiente";
            } else if (statusFilter === "comisiones_pendientes") {
                matchesStatus = !!(r.seller_id && (r.commission_status === "pending" || r.commission_status === "paid_to_leader") && (r.status === "pagado" || r.status === "entregado"));
            } else if (statusFilter === "comisiones_pagadas") {
                matchesStatus = !!(r.seller_id && r.commission_status === "completed");
            } else if (statusFilter !== "todos") {
                matchesStatus = r.status === statusFilter;
            }

            const matchesSeller = !sellerIdFilter || Number(r.seller_id) === Number(sellerIdFilter) || Number(r.parent_id) === Number(sellerIdFilter);
            return matchesSearch && matchesStatus && matchesSeller;
        });
    })();

    // Helper: obtener admin key del localStorage
    const getAdminKey = () => localStorage.getItem('admin_access_key') || '';

    const handleGenerateReviewPDF = async (registro: any) => {
        if (generatingPdfId) return;
        setGeneratingPdfId(registro.id);

        try {
            const res = await fetch('/api/admin/generate-review-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': getAdminKey()
                },
                body: JSON.stringify({ id: registro.id })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error generando PDF');
            }

            // Check WhatsApp status instead of downloading
            const waSent = res.headers.get('X-WhatsApp-Sent');
            if (waSent === 'true') {
                alert('✅ PDF generado y enviado por WhatsApp correctamente al cliente.');
            } else {
                const waErrorRaw = res.headers.get('X-WhatsApp-Error') || '';
                const waError = waErrorRaw ? decodeURIComponent(waErrorRaw) : '';
                alert(`⚠️ Error enviando WhatsApp: ${waError || 'Revise las variables de Evolution API'}`);
            }

        } catch (error: any) {
            console.error('Error generating PDF:', error);
            alert('❌ Error: ' + error.message);
        } finally {
            setGeneratingPdfId(null);
        }
    };

    const sendVCardEmail = async (registro: any) => {
        if (!confirm(`¿Estás seguro de aprobar y enviar el correo a ${registro.email}?`)) return;

        setRegistros(prev => prev.map(r => r.id === registro.id ? { ...r, isSending: true } : r));

        try {
            const vcardUrl = `${window.location.origin}/api/vcard/${registro.slug || registro.id}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(vcardUrl)}`;

            // Determinar el plan efectivo basado en los datos reales del registro
            let effectivePlan = registro.plan;

            try {
                if (registro.catalogo_json) {
                    const cat = typeof registro.catalogo_json === 'string' ? JSON.parse(registro.catalogo_json) : registro.catalogo_json;
                    if (cat && cat.products && cat.products.length > 0) {
                        effectivePlan = 'catalogo';
                    } else if (Array.isArray(cat) && cat.length > 0) {
                        effectivePlan = 'catalogo'; // Soporte legacy
                    }
                }
            } catch (e) {
                console.error("Error parsing catalogo_json for email:", e);
            }

            if (effectivePlan !== 'catalogo' && (registro.portada_movil || registro.portada_desktop)) {
                effectivePlan = 'business';
            }

            const res = await fetch('/api/send-vcard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': getAdminKey()
                },
                body: JSON.stringify({
                    vcardUrl,
                    qrUrl,
                    plan: effectivePlan,
                    slug: registro.slug || registro.id,
                    email: registro.email,
                    nombre: registro.nombre,
                    edit_code: registro.edit_code
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error enviando correo');

            if (res.ok) {
                alert("✅ Correo enviado con éxito");

                // Actualizar estado a entregado Y marcar como enviado automáticamente
                const adminKey = getAdminKey();
                await fetch('/api/admin/registros', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-key': adminKey
                    },
                    body: JSON.stringify({
                        id: registro.id,
                        status: 'entregado',
                        auto_email_sent: 1
                    })
                });

                // Actualizar estado local
                setRegistros(prev => prev.map(r =>
                    r.id === registro.id ? { ...r, status: 'entregado', auto_email_sent: 1 } : r
                ));
            }

        } catch (error: any) {
            console.error("Error sending email:", error);
            alert("❌ Error al enviar: " + error.message);
        } finally {
            setRegistros(prev => prev.map(r => r.id === registro.id ? { ...r, isSending: false } : r));
        }
    };

    const handleNotificarPagos = async () => {
        if (!confirm("¿Deseas enviar recordatorios de pago automáticos a los clientes pendientes de César y Directos?")) return;

        setIsNotifying(true);
        try {
            const adminKey = getAdminKey();
            const res = await fetch('/api/admin/cron/payment-reminders?manual=true', {
                headers: {
                    'Authorization': `Bearer ${adminKey}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ Éxito: ${data.reminders_sent} recordatorios enviados.`);
                fetchRegistros(); // Recargar para ver contadores actualizados
            } else {
                alert("❌ Error: " + (data.error || "No se pudo procesar"));
            }
        } catch (e) {
            alert("❌ Error de red");
        } finally {
            setIsNotifying(false);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass-card p-12 text-center"
                >
                    <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-8">
                        <ShieldAlert size={40} />
                    </div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-8">Acceso Restringido</h2>
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Accessible username field (hidden) */}
                        <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} defaultValue="admin" />
                        <input
                            type="password"
                            placeholder="Ingrese Clave de Acceso"
                            autoComplete="current-password"
                            value={accessKey}
                            onChange={(e) => setAccessKey(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary/40 text-center font-bold text-white"
                        />
                        <button type="submit" className="w-full bg-primary py-4 rounded-2xl font-black uppercase tracking-widest shadow-orange">
                            Entrar
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    if (loading && registros.length === 0) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy text-white p-8">
            <div className="max-w-7xl mx-auto overflow-x-hidden">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Admin Dashboard</h1>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Gestión de vCards ActivaQR</p>
                    </div>

                    <div className="flex gap-4 items-center flex-wrap">
                        <Link
                            href="/admin/feria"
                            className="bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 hover:scale-105 px-4 py-3 md:px-6 md:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(246,103,57,0.2)]"
                        >
                            <Trophy size={16} />
                            Feria de Loja 197
                        </Link>
                        <Link
                            href="/admin/aliados"
                            className="bg-amber-400/10 text-amber-400 border border-amber-400/30 hover:bg-amber-400/20 hover:scale-105 px-4 py-3 md:px-6 md:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                        >
                            <Award size={16} />
                            Aliados & 10 Casos
                        </Link>
                        <Link
                            href="/admin/marketing"
                            className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:scale-105 px-4 py-3 md:px-6 md:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,200,83,0.1)]"
                        >
                            <BarChart3 size={16} />
                            Marketing & Enablement
                        </Link>
                        <button
                            onClick={() => setIsBroadcastOpen(true)}
                            className="bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 hover:scale-105 px-4 py-3 md:px-6 md:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.1)]"
                        >
                            <Send size={16} />
                            Envío Masivo (WhatsApp)
                        </button>

                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={cn(
                                "px-4 py-3 md:px-6 md:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl",
                                isLive ? "bg-green-500 text-white animate-pulse" : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                            )}
                        >
                            <div className={cn("w-2 h-2 rounded-full", isLive ? "bg-white" : "bg-white/20")} />
                            {isLive ? "LIVE MOD..." : "MODO LIVE OFF"}
                        </button>
                        <button
                            onClick={() => setIsStatsModalOpen(true)}
                            className="bg-navy border border-primary/30 text-primary px-4 py-3 md:px-6 md:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-navy transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
                        >
                            <TrendingUp size={16} />
                            Estadísticas
                        </button>
                        <button
                            onClick={handleNotificarPagos}
                            disabled={isNotifying}
                            className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 px-4 py-3 md:px-8 md:py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-500 hover:text-white transition-all flex items-center gap-2 shadow-xl shrink-0"
                        >
                            {isNotifying ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
                            Notificar
                        </button>
                        <button
                            onClick={() => { fetchRegistros(); fetchStatsTotal(); fetchGlobalDownloadStats(); }}
                            className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white shrink-0"
                        >
                            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-primary hover:bg-[#FF8A33] px-4 py-3 md:px-8 md:py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_25px_rgba(255,107,0,0.3)] text-[#050B1C] transition-all flex items-center gap-2 group shrink-0"
                        >
                            Cerrar Sesión
                            <LogOut className="group-hover:translate-x-1 transition-transform" size={18} />
                        </button>
                    </div>
                </header>

                {/* Resumen de Vendedores */}
                <div className="mb-12">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex gap-4 items-start shadow-inner">
                        <Info className="text-primary flex-shrink-0 mt-1" size={24} />
                        <div>
                            <h3 className="text-primary font-black uppercase italic tracking-widest text-sm mb-2">Manual de Jerarquía Comercial</h3>
                            <ul className="text-white/60 text-xs space-y-2 list-disc ml-4">
                                <li><strong>Tú (Admin):</strong> Creas a los <span className="text-white font-bold">Vendedores Oficiales (Socios)</span> desde aquí. Ellos tienen trato directo contigo.</li>
                                <li><strong>Vendedores Oficiales:</strong> Ellos crean a sus propios <span className="text-white font-bold">Sub-vendedores</span> desde su propio panel (Gestionar Equipo).</li>
                                <li><strong>Sub-vendedores:</strong> Cobran un 30% fijo. Sus ventas suben de nivel a su Vendedor Oficial. <em>No los crees aquí.</em></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Users className="text-primary shrink-0" size={24} />
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Socios & Vendedores</h2>
                        </div>
                        <div className="flex flex-wrap gap-2 overflow-x-hidden">
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/contratos/generar', {
                                        method: 'POST',
                                        headers: {'Content-Type': 'application/json'},
                                        body: JSON.stringify({
                                            cliente_nombre: 'Nuevo Cliente',
                                            cliente_telefono: '+593 99 999 9999',
                                            cliente_email: 'cliente@activaqr.com',
                                            servicios_seleccionados: ['digital'],
                                            monto_total: 35,
                                            monto_anticipo: 15
                                        })
                                    });
                                    const data = await res.json();
                                    if (data.contrato_url) {
                                        await navigator.clipboard.writeText(data.contrato_url);
                                        window.open(data.contrato_url, '_blank');
                                    } else {
                                        alert('Error al crear contrato');
                                    }
                                } catch (err) {
                                    alert('Error de red');
                                }
                            }}
                            className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 md:px-6 py-2.5 md:py-3 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/5 shrink-0"
                        >
                            <FileText size={14} /> Nuevo Contrato
                        </button>
                        <button
                            onClick={() => setIsCreateClientModalOpen(true)}
                            className="flex items-center gap-1.5 bg-green-500/10 text-green-500 border border-green-500/20 px-3 md:px-6 py-2.5 md:py-3 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/5 shrink-0"
                        >
                            <Plus size={14} /> Crear Cliente
                        </button>
                        <button
                            onClick={() => setIsCreateSellerModalOpen(true)}
                            className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 md:px-6 py-2.5 md:py-3 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-primary hover:text-navy transition-all shadow-lg shadow-primary/5 shrink-0"
                        >
                            <Users size={14} /> Crear Vendedor
                        </button>
                    </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {/* Botón General */}
                        <button
                            onClick={() => setSellerIdFilter(null)}
                            className={cn(
                                "px-4 py-2 md:px-8 md:py-4 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all",
                                !sellerIdFilter ? "bg-primary text-navy border-primary shadow-orange" : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                        >
                            General
                        </button>

                        {/* Botón Cesar Reyes (Socio) */}
                        {sellers.filter(s => s.nombre === 'Cesar Reyes').map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSellerIdFilter(s.id)}
                                className={cn(
                                    "px-4 py-2 md:px-8 md:py-4 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all",
                                    sellerIdFilter === s.id ? "bg-accent text-white border-accent shadow-lg shadow-accent/20" : "bg-white/5 border-white/10 hover:bg-white/10"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    {s.nombre.split(' ')[0]} <span className="hidden md:inline bg-white/10 px-2 py-0.5 rounded-md text-[8px] font-black uppercase">Socio</span>
                                </span>
                            </button>
                        ))}

                        {/* Dropdown de Vendedores */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSellersDropdownOpen(!isSellersDropdownOpen)}
                                className={cn(
                                    "px-4 py-2 md:px-8 md:py-4 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                                    sellerIdFilter && sellers.find(s => s.id === sellerIdFilter)?.nombre !== 'Cesar Reyes'
                                        ? "bg-white/20 border-white/40"
                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                )}
                            >
                                {sellerIdFilter && sellers.find(s => s.id === sellerIdFilter)?.nombre !== 'Cesar Reyes'
                                    ? sellers.find(s => s.id === sellerIdFilter)?.nombre.split(' ')[0]
                                    : "Vendedores"}
                                <ChevronDown size={16} className={cn("transition-transform", isSellersDropdownOpen && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {isSellersDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full mt-2 left-0 w-64 bg-navy border border-white/10 rounded-[32px] overflow-hidden z-50 shadow-2xl p-2"
                                    >
                                        {sellers.filter(s => s.nombre !== 'Cesar Reyes').length === 0 ? (
                                            <p className="p-4 text-center text-[10px] font-bold text-white/40 uppercase tracking-widest">No hay otros vendedores</p>
                                        ) : (
                                            sellers.filter(s => s.nombre !== 'Cesar Reyes').map(s => (
                                                <div key={s.id} className="relative group">
                                                    <button
                                                        onClick={() => {
                                                            setSellerIdFilter(s.id);
                                                            setIsSellersDropdownOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-6 py-4 rounded-2xl transition-all flex flex-col hover:bg-white/5",
                                                            sellerIdFilter === s.id ? "bg-white/10" : ""
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex flex-col truncate pr-4">
                                                                <span className="font-black text-xs uppercase tracking-tighter truncate">{s.nombre}</span>
                                                                <span className={cn(
                                                                    "text-[7px] font-black uppercase tracking-widest mt-0.5",
                                                                    s.parent_id ? "text-white/40" : "text-primary"
                                                                )}>
                                                                    {s.parent_id ? "— Asesor (Sub)" : "• Líder (Socio)"}
                                                                </span>
                                                            </div>
                                                            {s.terminos_aceptados_en ? (
                                                                <span className="text-[7px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded font-black uppercase whitespace-nowrap" title={`Firmado el ${new Date(s.terminos_aceptados_en).toLocaleString()}`}>
                                                                    Firmado
                                                                </span>
                                                            ) : (
                                                                <span className="text-[7px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded font-black uppercase whitespace-nowrap">
                                                                    Pendiente
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-[9px] font-black text-primary uppercase font-mono">#{s.codigo}</span>
                                                            <span className="text-[9px] font-bold text-white/40">{s.total_ventas} Ventas</span>
                                                        </div>
                                                    </button>
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditSeller(s); }}
                                                            className="p-2 bg-white/5 hover:bg-white/20 text-white/40 hover:text-white rounded-lg transition-all"
                                                            title="Editar Vendedor"
                                                        >
                                                            <Settings size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteSeller(s.id); }}
                                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500/40 hover:text-red-500 rounded-lg transition-all"
                                                            title="Eliminar Vendedor"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Datos Bancarios del Vendedor Seleccionado */}
                <AnimatePresence>
                    {sellerIdFilter && sellers.find(s => s.id === sellerIdFilter) && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-12"
                        >
                            <div className="bg-[#0A1229] border border-primary/20 rounded-[40px] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                    <Landmark size={80} className="text-primary" />
                                </div>

                                {(() => {
                                    const s = sellers.find(sel => sel.id === sellerIdFilter);
                                    if (!s) return null;

                                    return (
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <CreditCard className="text-primary" size={24} />
                                                <h3 className="text-xl font-black uppercase italic tracking-tighter">Datos Bancarios: {s.nombre}</h3>
                                            </div>

                                            {s.datos_bancarios_completados ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Banco</p>
                                                        <p className="text-sm font-bold text-white uppercase">{s.banco_nombre}</p>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Beneficiario</p>
                                                        <p className="text-sm font-bold text-white uppercase italic">{s.banco_beneficiario}</p>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Cédula</p>
                                                        <p className="text-sm font-bold text-white font-mono">{s.banco_cedula}</p>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">N° Cuenta</p>
                                                        <p className="text-sm font-bold text-primary font-mono">{s.banco_numero_cuenta}</p>
                                                    </div>
                                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Email</p>
                                                        <p className="text-sm font-bold text-white lowercase truncate">{s.banco_correo}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl">
                                                    <ShieldAlert className="text-red-500 flex-shrink-0" />
                                                    <p className="text-sm font-bold text-red-500/80 uppercase tracking-tight">
                                                        Este vendedor aún no ha completado sus datos bancarios.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Métricas Globales de Descargas VCF del Proyecto */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                                <Download className="text-cyan-400" size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase italic tracking-wider text-white">
                                    Descargas VCF del Proyecto
                                </h3>
                                <p className="text-[10px] font-bold text-white/40">Suma global acumulada y desglose temporal</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            En vivo
                        </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#0A1229] border border-cyan-500/20 rounded-[32px] p-6 relative overflow-hidden group shadow-lg shadow-cyan-500/5 hover:border-cyan-500/40 transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-cyan-400">
                                <Download size={44} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-2">Total Descargas VCF</p>
                            <p className="text-4xl font-black italic tracking-tighter text-white">
                                {globalDownloadStats.total.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-white/40 mt-2">
                                Suma de todos los clientes
                            </p>
                        </div>

                        <div className="bg-[#0A1229] border border-indigo-500/20 rounded-[32px] p-6 relative overflow-hidden group shadow-lg shadow-indigo-500/5 hover:border-indigo-500/40 transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-indigo-400">
                                <CalendarCheck size={44} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Descargas Mensuales</p>
                            <p className="text-4xl font-black italic tracking-tighter text-white">
                                {globalDownloadStats.monthly.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-white/40 mt-2">
                                Últimos 30 días
                            </p>
                        </div>

                        <div className="bg-[#0A1229] border border-emerald-500/20 rounded-[32px] p-6 relative overflow-hidden group shadow-lg shadow-emerald-500/5 hover:border-emerald-500/40 transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-emerald-400">
                                <TrendingUp size={44} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">Descargas Semanales</p>
                            <p className="text-4xl font-black italic tracking-tighter text-emerald-400">
                                {globalDownloadStats.weekly.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-white/40 mt-2">
                                Últimos 7 días
                            </p>
                        </div>

                        <div className="bg-[#0A1229] border border-amber-500/20 rounded-[32px] p-6 relative overflow-hidden group shadow-lg shadow-amber-500/5 hover:border-amber-500/40 transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-amber-400">
                                <Clock size={44} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-2">Descargas Hoy</p>
                            <p className="text-4xl font-black italic tracking-tighter text-white">
                                {globalDownloadStats.today.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-white/40 mt-2">
                                Fecha de hoy
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
                    <div
                        onClick={() => setStatusFilter("todos")}
                        className={cn(
                            "bg-[#0A1229] border rounded-[32px] p-6 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]",
                            statusFilter === "todos" ? "border-primary" : "border-white/5"
                        )}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-white"><QrCode size={48} /></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">vCards Vendidas</p>
                        <p className="text-4xl font-black italic tracking-tighter text-white">
                            {statsTotal.count}
                        </p>
                    </div>

                    <div
                        onClick={() => setStatusFilter("pagado")}
                        className={cn(
                            "bg-[#0A1229] border rounded-[32px] p-6 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]",
                            statusFilter === "pagado" ? "border-accent" : "border-white/5"
                        )}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-accent"><BarChart3 size={48} /></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">Total Ingresado</p>
                        <p className="text-4xl font-black italic tracking-tighter text-accent">
                            ${statsTotal.income.toFixed(2)}
                        </p>
                    </div>

                    <div
                        onClick={() => setStatusFilter("todos")}
                        className="bg-[#0A1229] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group shadow-lg shadow-white/5"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-white"><ShieldAlert size={48} /></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">Utilidad Neta</p>
                        <p className="text-4xl font-black italic tracking-tighter text-white">
                            ${statsTotal.utility.toFixed(2)}
                        </p>
                    </div>

                    <div
                        onClick={() => setStatusFilter("clientes_pendientes")}
                        className={cn(
                            "border rounded-[32px] p-6 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]",
                            statusFilter === "clientes_pendientes" ? "bg-primary/20 border-primary shadow-[0_0_30px_rgba(255,107,0,0.1)]" : "bg-primary/10 border-primary/20 hover:bg-primary/20"
                        )}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform text-primary"><Users size={48} /></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3 font-bold">Clientes x Cobrar</p>
                        <p className="text-4xl font-black italic tracking-tighter text-primary">
                            {statsTotal.pending}
                        </p>
                        <p className="text-[10px] font-bold text-primary/60 mt-2">
                            Val. Pendiente: ${statsTotal.pendingValue.toFixed(2)}
                        </p>
                    </div>

                    <div
                        onClick={() => setStatusFilter("comisiones_pendientes")}
                        className={cn(
                            "bg-[#0A1229] border rounded-[32px] p-8 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]",
                            statusFilter === "comisiones_pendientes" ? "border-primary shadow-lg shadow-primary/5" : "border-white/5"
                        )}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-primary"><Users size={48} /></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">Comisiones x Pagar</p>
                        <p className="text-4xl font-black italic tracking-tighter text-white">
                            ${statsTotal.pendingCommission.toFixed(2)}
                        </p>
                        <p className="text-[10px] font-bold text-white/40 mt-2">
                            {statsTotal.comisionesPendientes} comisiones pendientes
                        </p>
                    </div>

                    <div
                        onClick={() => setStatusFilter("comisiones_pagadas")}
                        className={cn(
                            "bg-[#0A1229] border rounded-[32px] p-6 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]",
                            statusFilter === "comisiones_pagadas" ? "border-green-500" : "border-white/5"
                        )}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-green-500"><CheckCircle size={48} /></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-3">Comis. Pagadas</p>
                        <p className="text-4xl font-black italic tracking-tighter text-green-500">
                            ${statsTotal.paidCommission.toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform text-primary"><Clock size={48} /></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Cola de Correos</p>
                        <p className="text-4xl font-black italic tracking-tighter text-primary">
                            {registros.filter(r => r.status === 'pagado' && !r.auto_email_sent).length}
                        </p>
                        <p className="text-[10px] font-bold text-white/40 mt-2 italic">
                            Envío inmediato
                        </p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden">
                    <div className="p-8 border-b border-white/10 flex flex-col md:flex-row justify-between gap-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, profesión, negocio, email, etiquetas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-16 py-4 outline-none focus:border-primary/40 transition-all font-bold text-white"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-white/40 bg-white/[0.02]">
                                    <th className="px-4 py-6 whitespace-nowrap">Usuario</th>
                                    <th className="px-4 py-6 uppercase whitespace-nowrap">Plan</th>
                                    <th className="px-4 py-6 hidden lg:table-cell">Comprobante</th>
                                    <th className="px-4 py-6 whitespace-nowrap">Vendedor</th>
                                    <th className="px-4 py-6 font-bold whitespace-nowrap">Estado</th>
                                    <th className="px-4 py-6 min-w-[200px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filtered.map((r) => (
                                    <tr key={r.id} className="hover:bg-white/[0.02] transition-all group">
                                        <td className="px-4 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                                                    {r.foto_url && !isPlaceholderUrl(r.foto_url) ? (
                                                        <img src={r.foto_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={20} className="text-white/20" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{r.nombre}</p>
                                                    <p className="text-[10px] text-white/40">{r.email}</p>
                                                    {/* Badge descargas */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const key = localStorage.getItem('admin_access_key') || '';
                                                            openDownloadsModal(r.slug || r.id, r.nombre, key);
                                                        }}
                                                        className="mt-1.5 flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-lg hover:bg-cyan-500/20 transition-all text-[9px] font-black uppercase tracking-widest"
                                                        title="Ver historial de descargas"
                                                    >
                                                        <Download size={9} />
                                                        {r.downloads_count ?? 0} descargas
                                                    </button>
                                                    {r.edit_code && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="text-[9px] font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 tracking-widest">
                                                                CODE: {r.edit_code}
                                                            </span>
                                                            <button 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(r.edit_code); 
                                                                    alert('Código copiado: ' + r.edit_code); 
                                                                }} 
                                                                className="text-white/40 hover:text-primary transition-colors p-1 bg-white/5 rounded-md border border-white/10 hover:border-primary/30" 
                                                                title="Copiar código de edición"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {r.status === 'entregado' || r.auto_email_sent ? (
                                                        <p className="text-[8px] text-green-500 font-black uppercase mt-2 flex items-center gap-1">
                                                            <CheckCircle size={8} /> Enviado Digitalmente
                                                        </p>
                                                    ) : r.paid_at ? (
                                                        <p className="text-[8px] text-accent font-bold uppercase mt-2">💳 Pago: {new Date(r.paid_at).toLocaleString()}</p>
                                                    ) : null}
                                                    {r.expires_at && (
                                                        <p className={cn(
                                                            "text-[8px] font-black uppercase mt-1 flex items-center gap-1 w-fit px-1.5 py-0.5 rounded",
                                                            new Date(r.expires_at) < new Date() ? "bg-red-500/20 text-red-500" : "bg-blue-500/20 text-blue-400"
                                                        )}>
                                                            <Clock size={8} /> 
                                                            {new Date(r.expires_at) < new Date() 
                                                                ? `Expiró: ${new Date(r.expires_at).toLocaleDateString()}` 
                                                                : `Expira: ${new Date(r.expires_at).toLocaleDateString()}`
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    value={r.plan === 'pro' || r.plan === 'basic' ? 'digital' : (r.plan || 'digital')}
                                                    onChange={(e) => updatePlan(r.id, e.target.value)}
                                                    disabled={pendingIds.has(r.id)}
                                                    className={cn(
                                                        "bg-white/5 border border-white/10 rounded-xl px-4 py-1 text-[9px] font-black uppercase tracking-widest w-fit outline-none focus:border-primary/40 transition-all cursor-pointer",
                                                        (r.plan && r.plan !== 'basic') ? "text-primary border-primary/30" : "text-white/40"
                                                    )}
                                                >
                                                    <option value="digital" className="bg-navy">Digital ($35)</option>
                                                    <option value="business" className="bg-navy">Business ($100)</option>
                                                    <option value="catalog" className="bg-navy">Catálogo ($200)</option>
                                                    <option value="menu" className="bg-navy">Menú ($150)</option>
                                                </select>
                                                {r.menu_digital && r.menu_digital.startsWith('http') && (
                                                    <a
                                                        href={r.menu_digital}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[8px] font-black uppercase text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <FileText size={10} /> Ver Menú
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 hidden lg:table-cell">
                                            {r.comprobante_url ? (
                                                <button
                                                    onClick={() => setSelectedReceipt(r.comprobante_url)}
                                                    className="group relative flex items-center justify-center p-1 bg-white/5 border border-white/10 rounded-xl hover:border-accent transition-all overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 flex items-center justify-center z-10 transition-all">
                                                        <Eye size={14} className="text-white" />
                                                    </div>
                                                    <img
                                                        src={r.comprobante_url}
                                                        alt="Comprobante"
                                                        className="h-10 w-10 object-cover rounded-lg group-hover:scale-110 transition-transform"
                                                    />
                                                </button>
                                            ) : (
                                                <span className="text-[8px] text-white/20 uppercase font-black italic tracking-widest">Sin archivo</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-6">
                                            {r.seller_id ? (
                                                <button
                                                    onClick={() => handleEditSeller(sellers.find(s => s.id === r.seller_id))}
                                                    className="flex flex-col items-start gap-1 p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all group/seller"
                                                >
                                                    <span className="text-[10px] font-black text-accent uppercase leading-tight tracking-widest flex items-center gap-2">
                                                        {r.sold_by_name?.includes(' ') ? (
                                                            <>
                                                                <ChevronRight size={10} className="text-white/20" />
                                                                <span>{r.sold_by_name?.split(' ')[0]}</span>
                                                            </>
                                                        ) : (
                                                            r.sold_by_name || `Socio #${r.seller_id}`
                                                        )}
                                                    </span>
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-white/20 uppercase font-black">Directo</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    value={r.status || 'pendiente'}
                                                    onChange={(e) => updateStatus(r.id, e.target.value)}
                                                    disabled={pendingIds.has(r.id)}
                                                    className={cn(
                                                        "bg-white/5 border border-white/10 rounded-xl px-4 py-1 text-[9px] font-black uppercase tracking-widest w-fit outline-none focus:border-primary/40 transition-all cursor-pointer",
                                                        r.status === 'pagado' ? "text-accent border-accent/30" :
                                                            r.status === 'entregado' ? "text-green-500 border-green-500/30" :
                                                                r.status === 'cancelado' ? "text-red-500 border-red-500/30" :
                                                                    "text-yellow-500 border-yellow-500/30"
                                                    )}
                                                >
                                                    <option value="pendiente" className="bg-navy">Pendiente</option>
                                                    <option value="pagado" className="bg-navy">Pagado</option>
                                                    <option value="entregado" className="bg-navy">Entregado</option>
                                                    <option value="cancelado" className="bg-navy">Cancelado</option>
                                                </select>
                                                {r.reminder_count > 0 && (
                                                    <span className="text-[7px] font-black text-yellow-500/60 uppercase">
                                                        Rec: {r.reminder_count} ({new Date(r.last_reminder_at).toLocaleDateString()})
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="flex flex-wrap items-center gap-2 min-w-[200px]">
                                                {/* Botón Enviar Email */}
                                                <button
                                                    onClick={() => sendVCardEmail(r)}
                                                    className="p-2 bg-green-500/20 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/10"
                                                    title="Aprobar y Enviar Email"
                                                    disabled={r.isSending}
                                                >
                                                    {r.isSending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                                                </button>

                                                {/* Botón Aprobar Pago Manual */}
                                                {(r.status === 'pendiente' || r.status === 'cancelado') && (
                                                    <button
                                                        onClick={() => updateStatus(r.id, 'pagado')}
                                                        disabled={pendingIds.has(r.id)}
                                                        className="p-2 bg-blue-500/20 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10"
                                                        title="Marcar como Pagado"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}

                                                {/* Botones de Activación Temporal */}
                                                <button
                                                    onClick={() => handleActivate(r.id, 'trial_15d')}
                                                    disabled={pendingIds.has(r.id)}
                                                    className="p-2 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500 hover:text-white transition-all shadow-lg shadow-purple-500/10"
                                                    title="Activar Prueba (15 Días)"
                                                >
                                                    <Clock size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleActivate(r.id, 'annual')}
                                                    disabled={pendingIds.has(r.id)}
                                                    className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10"
                                                    title="Activar Anual (1 Año)"
                                                >
                                                    <CalendarCheck size={18} />
                                                </button>

                                                {/* Botón Cancelar */}
                                                {r.status !== 'cancelado' && (
                                                    <button
                                                        onClick={() => updateStatus(r.id, 'cancelado')}
                                                        disabled={pendingIds.has(r.id)}
                                                        className="p-2 bg-red-500/10 text-red-500/40 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                        title="Cancelar Registro"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}

                                                {/* Botón Eliminar Físico */}
                                                <button
                                                    onClick={() => handleDeleteRegistro(r.id, r.nombre)}
                                                    className="p-2 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/30 shadow-lg shadow-red-500/10"
                                                    title="Eliminar Registro (Permanente)"
                                                >
                                                    <Trash2 size={18} />
                                                </button>

                                                {/* Botón Comisión (Socio) */}
                                                {r.seller_id && (
                                                    <button
                                                        onClick={() => updateCommissionStatus(r.id, r.commission_status)}
                                                        disabled={pendingIds.has(r.id)}
                                                        className={cn(
                                                            "p-2 rounded-xl transition-all shadow-lg",
                                                            r.commission_status === 'completed'
                                                                ? "bg-green-500 text-white shadow-green-500/20"
                                                                : r.commission_status === 'paid_to_leader'
                                                                    ? "bg-brand text-white shadow-brand/20"
                                                                    : "bg-white/5 text-white/20 border border-white/10 hover:bg-white/10"
                                                        )}
                                                        title={
                                                            r.commission_status === 'completed' ? "Pago Confirmado por Vendedor ✅" :
                                                                r.commission_status === 'paid_to_leader' ? "Enviado al Líder (Esperando Confirmación) 🚚" :
                                                                    "Marcar como PAGADO AL LÍDER"
                                                        }
                                                    >
                                                        <ShieldCheck size={18} />
                                                    </button>
                                                )}

                                                {/* Botón PDF Revisión */}
                                                <button
                                                    onClick={() => handleGenerateReviewPDF(r)}
                                                    disabled={generatingPdfId === r.id}
                                                    className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10"
                                                    title="Generar PDF de Revisión y enviar por WhatsApp"
                                                >
                                                    {generatingPdfId === r.id ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                                                </button>

                                                <button
                                                    onClick={() => handleEdit(r)}
                                                    className="p-2 bg-white/5 text-white/40 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                                                    title="Editar vCard"
                                                >
                                                    <Edit size={18} />
                                                </button>

                                                {/* Botón Clonar */}
                                                <button
                                                    onClick={() => handleCloneClient(r)}
                                                    disabled={pendingIds.has(r.id)}
                                                    className="p-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10"
                                                    title="Clonar Cliente"
                                                >
                                                    <Copy size={18} />
                                                </button>

                                                <a
                                                    href={`/api/vcard/${r.slug || r.id}`}
                                                    download={`${r.slug || r.id}.vcf`}
                                                    className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-navy transition-all shadow-lg shadow-primary/10"
                                                    title="Descargar vCard"
                                                >
                                                    <Download size={18} />
                                                </a>

                                                {r.plan === 'business' && (
                                                    <button
                                                        onClick={() => handleViewProfile(r)}
                                                        className="p-2 bg-white/5 text-white/40 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                                                        title="Ver Perfil"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}

                                                {r.plan === 'catalog' && (
                                                    <button
                                                        onClick={() => handleCatalogSetup(r)}
                                                        className="p-2 bg-[#f66739]/10 text-[#f66739] rounded-xl hover:bg-[#f66739] hover:text-white transition-all shadow-lg shadow-[#f66739]/10"
                                                        title="Ver Catálogo / Productos"
                                                    >
                                                        <Store size={18} />
                                                    </button>
                                                )}

                                                {/* Botón Ver Menú Digital */}
                                                <a
                                                    href={`/menu/${r.slug || r.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center"
                                                    title="Abrir Menú Digital (/menu/...)"
                                                >
                                                    <Utensils size={18} />
                                                </a>

                                                {/* Botón Abrir Editor Directo de Menú */}
                                                <a
                                                    href={`/menu/${r.slug || r.id}?edit=true`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center"
                                                    title="Abrir Enlace de Edición de Menú con Clave (?edit=true)"
                                                >
                                                    <Edit3 size={18} />
                                                </a>

                                                {/* Botón Analíticas de Descargas */}
                                                <button
                                                    onClick={() => {
                                                        const key = localStorage.getItem('admin_access_key') || '';
                                                        openDownloadsModal(r.slug || r.id, r.nombre, key);
                                                    }}
                                                    className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-white transition-all shadow-lg shadow-cyan-500/10"
                                                    title={`Ver descargas (${r.downloads_count ?? 0})`}
                                                >
                                                    <BarChart2 size={18} />
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center py-8">
                                <button
                                    onClick={loadMoreRegistros}
                                    disabled={loadingMore}
                                    className="bg-primary hover:bg-primary/80 disabled:bg-primary/50 text-white font-bold px-8 py-4 rounded-full transition-all flex items-center gap-2"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Cargando más...
                                        </>
                                    ) : (
                                        <>
                                            Cargar Más Registros
                                            <ChevronDown size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {!hasMore && registros.length > 50 && (
                            <p className="text-center text-white/40 py-4 text-sm font-bold">
                                Mostrando todos los {totalCount} registros
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedReceipt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedReceipt(null)}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="max-w-4xl w-full bg-navy rounded-[48px] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-xl font-black uppercase italic tracking-tighter">Comprobante de Pago</h3>
                                <button onClick={() => setSelectedReceipt(null)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white">
                                    Cerrar
                                </button>
                            </div>
                            <div className="p-8 flex items-center justify-center min-h-[400px]">
                                {!selectedReceipt || isPlaceholderUrl(selectedReceipt) ? (
                                    <p className="text-white/20 font-black uppercase tracking-widest">No hay imagen válida disponible</p>
                                ) : selectedReceipt.startsWith('data:image/') || (!selectedReceipt.endsWith('.pdf')) ? (
                                    <img
                                        src={selectedReceipt}
                                        className="max-h-[600px] w-auto rounded-2xl shadow-2xl"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://placehold.co/600x400/0a0b1e/white?text=Error+al+cargar+imagen";
                                        }}
                                    />
                                ) : (
                                    <iframe src={selectedReceipt} className="w-full h-[600px] rounded-2xl" />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isEditModalOpen && editingRegistro && (
                    <VCardEditModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        registro={editingRegistro}
                        setRegistro={setEditingRegistro}
                        onSave={handleSaveEdit}
                        onPhotoUpload={handlePhotoUpload}
                        onPortadaUpload={handlePortadaUpload}
                        isSaving={isSaving}
                        isAdmin={true}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isCreateSellerModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-navy rounded-[48px] border border-white/10 shadow-3xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Nuevo Vendedor Oficial</h3>
                                <button onClick={() => setIsCreateSellerModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSeller} className="p-10 space-y-8">
                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3 shadow-inner">
                                    <Info className="text-primary flex-shrink-0" size={20} />
                                    <p className="text-primary text-[10px] font-bold leading-relaxed uppercase tracking-widest">
                                        🛑 ATENCIÓN: Solo usa esto para crear SOCIOS DIRECTOS. Los sub-vendedores deben ser creados por sus líderes.
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Nombre Completo</label>
                                        <input
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary/40 transition-all"
                                            value={newSeller.nombre}
                                            onChange={e => setNewSeller({ ...newSeller, nombre: e.target.value })}
                                            placeholder="Ej: Abel Quiñonez"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Email / WhatsApp</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary/40 transition-all"
                                            value={newSeller.email}
                                            onChange={e => setNewSeller({ ...newSeller, email: e.target.value })}
                                            placeholder="vendedor@empresa.com"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="relative">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Contraseña</label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-20 py-4 font-bold outline-none focus:border-primary/40 transition-all font-mono"
                                                    value={newSeller.password}
                                                    onChange={e => setNewSeller({ ...newSeller, password: e.target.value })}
                                                    placeholder="••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={generatePassword}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Generar
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Comisión inicial (%)</label>
                                            <input
                                                required
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary/40 transition-all"
                                                value={newSeller.comision_porcentaje}
                                                onChange={e => setNewSeller({ ...newSeller, comision_porcentaje: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    {nextSellerCode && (
                                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Código a asignar:</span>
                                            <span className="text-xl font-black text-primary italic italic tracking-tighter">{nextSellerCode}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateSellerModalOpen(false)}
                                        className="flex-1 px-8 py-4 rounded-2xl bg-white/5 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreatingSeller}
                                        className="flex-1 px-8 py-4 rounded-2xl bg-primary shadow-orange font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all text-navy flex items-center justify-center gap-2"
                                    >
                                        {isCreatingSeller ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                        {isCreatingSeller ? 'Guardando...' : 'Crear Vendedor'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Editar Vendedor */}
            <AnimatePresence>
                {isEditSellerModalOpen && editingSeller && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-navy rounded-[48px] border border-white/10 shadow-3xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Editar Vendedor</h3>
                                <button onClick={() => setIsEditSellerModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSaveSellerEdit(); }} className="p-10 space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Nombre Completo</label>
                                        <input
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary/40 transition-all"
                                            value={editingSeller.nombre || ''}
                                            onChange={e => setEditingSeller({ ...editingSeller, nombre: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Email</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary/40 transition-all"
                                            value={editingSeller.email || ''}
                                            onChange={e => setEditingSeller({ ...editingSeller, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="relative">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Nueva Contraseña</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary/40 transition-all font-mono"
                                                value={editingSeller.password || ''}
                                                onChange={e => setEditingSeller({ ...editingSeller, password: e.target.value })}
                                                placeholder="(Ignorar si no cambia)"
                                            />
                                            <p className="text-[8px] text-white/30 italic ml-2 mt-2">Déjalo vacío si no cambia</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Comisión (%)</label>
                                            <input
                                                required
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary/40 transition-all"
                                                value={editingSeller.comision_porcentaje || 0}
                                                onChange={e => setEditingSeller({ ...editingSeller, comision_porcentaje: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditSellerModalOpen(false)}
                                        className="flex-1 px-8 py-4 rounded-2xl bg-white/5 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingSeller}
                                        className="flex-1 px-8 py-4 rounded-2xl bg-primary shadow-orange font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all text-navy flex items-center justify-center gap-2"
                                    >
                                        {isSavingSeller ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                        {isSavingSeller ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Migrar Equipo */}
            <AnimatePresence>
                {isMigrateModalOpen && migratingLeader && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-navy rounded-[48px] border border-white/10 shadow-3xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-red-400">Eliminar y Rescatar</h3>
                                <button onClick={() => setIsMigrateModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl space-y-2">
                                    <p className="text-sm text-red-200">
                                        Estás a punto de eliminar a <span className="font-bold">{migratingLeader.nombre}</span> permanentemente.
                                    </p>
                                    <p className="text-sm text-red-200 opacity-80">
                                        Sus clientes activos, pines geográficos y equipo de venta (si los tiene) <strong>quedarán huérfanos</strong>. Para asegurarlos, elige al Socio que recibirá este portafolio:
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 block ml-1">Nuevo Líder de Destino</label>
                                        <select
                                            value={targetLeaderId}
                                            onChange={(e) => setTargetLeaderId(Number(e.target.value))}
                                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand font-bold text-white appearance-none"
                                        >
                                            <option value={0} className="bg-navy">-- SELECCIONA A QUIÉN TRANSFERIR --</option>
                                            {sellers
                                                .filter(s => s.id !== migratingLeader.id)
                                                .map(s => (
                                                    <option key={s.id} value={s.id} className="bg-navy">
                                                        {s.nombre}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setIsMigrateModalOpen(false)}
                                        className="flex-1 px-8 py-5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all text-white/40 hover:text-white"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleMigrateAndConfirmDelete}
                                        disabled={isMigratingTeam}
                                        className="flex-1 px-8 py-5 bg-red-600 rounded-2xl font-black uppercase tracking-widest text-xs text-white hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
                                    >
                                        {isMigratingTeam ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        {isMigratingTeam ? 'Procesando...' : 'Traspasar y Eliminar'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isHeroPromptOpen && promptRegistro && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-[#0A0B1E] border border-white/10 rounded-[32px] md:rounded-[48px] overflow-hidden shadow-3xl relative flex flex-col max-h-[95vh] md:max-h-[90vh]"
                        >
                            <button 
                                onClick={() => setIsHeroPromptOpen(false)}
                                className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white z-[60] shadow-xl backdrop-blur-md border border-white/10"
                                title="Cerrar"
                            >
                                <X size={24} />
                            </button>
                            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                                <div className="text-center">
                                <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    {setupTarget === 'catalog' ? <Store size={40} /> : <ImageIcon size={40} />}
                                </div>
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">
                                    {setupTarget === 'catalog' ? '¡Activación de Catálogo!' : '¡Diseño Premium Pendiente!'}
                                </h3>
                                <p className="text-white/60 text-sm mb-12 max-w-sm mx-auto leading-relaxed">
                                    {setupTarget === 'catalog' 
                                        ? `Configura la primera categoría y producto para activar el catálogo de `
                                        : `Para que la VCard de `}
                                    <span className="text-white font-bold">{promptRegistro.nombre}</span>
                                    {setupTarget === 'catalog' ? ` y asegúrate de que las imágenes luzcan profesionales.` : ` se vea profesional, necesitamos configurar las imágenes del Hero primero.`}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Fondo Escritorio</p>
                                        <div className="aspect-video bg-white/5 rounded-[32px] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group relative">
                                            {promptRegistro.portada_desktop && !isPlaceholderUrl(promptRegistro.portada_desktop) ? (
                                                <img src={promptRegistro.portada_desktop} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon size={32} className="text-white/10" />
                                            )}
                                            <label htmlFor="hero-desktop-upload" className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-10">
                                                <Upload size={20} className="text-white" />
                                            </label>
                                            <input 
                                                id="hero-desktop-upload"
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const formData = new FormData();
                                                    formData.append('file', file);
                                                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                    if (res.ok) {
                                                        const { url } = await res.json();
                                                        await fetch('/api/admin/registros', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json', 'x-admin-key': localStorage.getItem('admin_access_key') || '' },
                                                            body: JSON.stringify({ id: promptRegistro.id, portada_desktop: url })
                                                        });
                                                        setPromptRegistro({...promptRegistro, portada_desktop: url});
                                                    }
                                                }} 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Fondo Móvil</p>
                                        <div className="aspect-[9/16] h-32 mx-auto bg-white/5 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group relative">
                                            {promptRegistro.portada_movil && !isPlaceholderUrl(promptRegistro.portada_movil) ? (
                                                <img src={promptRegistro.portada_movil} className="w-full h-full object-cover" />
                                            ) : (
                                                <Smartphone size={32} className="text-white/10" />
                                            )}
                                            <label htmlFor="hero-mobile-upload" className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-10">
                                                <Upload size={20} className="text-white" />
                                            </label>
                                            <input 
                                                id="hero-mobile-upload"
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const formData = new FormData();
                                                    formData.append('file', file);
                                                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                    if (res.ok) {
                                                        const { url } = await res.json();
                                                        await fetch('/api/admin/registros', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json', 'x-admin-key': localStorage.getItem('admin_access_key') || '' },
                                                            body: JSON.stringify({ id: promptRegistro.id, portada_movil: url })
                                                        });
                                                        setPromptRegistro({...promptRegistro, portada_movil: url});
                                                    }
                                                }} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {setupTarget === 'catalog' && (
                                    <div className="mb-12 space-y-8">
                                        <div className="flex items-center justify-between px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(255,107,0,0.5)]" />
                                                <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white">Configuración del Catálogo</h4>
                                            </div>
                                            <button 
                                                onClick={() => setSetupProducts([...setupProducts, { id: Date.now().toString(), categoria: '', titulo: '', descripcion: '', precio: '', url: '' }])}
                                                className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl transition-all border border-primary/20 group"
                                            >
                                                <Plus size={16} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Añadir Producto</span>
                                            </button>
                                        </div>

                                        <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                            {setupProducts.map((p, index) => (
                                                <div key={p.id} className="p-6 bg-white/5 rounded-[32px] border border-white/10 group relative transition-all hover:bg-white/[0.07] hover:border-primary/30">
                                                    {setupProducts.length > 1 && (
                                                        <button 
                                                            onClick={() => setSetupProducts(setupProducts.filter(item => item.id !== p.id))}
                                                            className="absolute -top-3 -right-3 w-8 h-8 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 z-20"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-8">
                                                        {/* Product Image Upload */}
                                                        <div className="space-y-3">
                                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-1">Imagen</p>
                                                            <div className="aspect-square bg-[#1A1B3A] rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center overflow-hidden group relative transition-all hover:border-primary/30">
                                                                {p.url ? (
                                                                    <img src={p.url} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="text-center p-4">
                                                                        <Upload size={20} className="text-white/10 mx-auto mb-2" />
                                                                        <p className="text-[8px] font-bold text-white/20 uppercase">Subir</p>
                                                                    </div>
                                                                )}
                                                                <label htmlFor={`setup-product-image-${p.id}`} className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-[2px] z-10">
                                                                    <ImageIcon size={18} className="text-white" />
                                                                </label>
                                                                <input 
                                                                    id={`setup-product-image-${p.id}`}
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    accept="image/*" 
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        const formData = new FormData();
                                                                        formData.append('file', file);
                                                                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                                        if (res.ok) {
                                                                            const { url } = await res.json();
                                                                            const newProducts = [...setupProducts];
                                                                            newProducts[index].url = url;
                                                                            setSetupProducts(newProducts);
                                                                        }
                                                                    }} 
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Product Details Inputs */}
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2 text-left">
                                                                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-2">Categoría</label>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Ej. Platos Fuertes"
                                                                        value={p.categoria}
                                                                        onChange={(e) => {
                                                                            const newProducts = [...setupProducts];
                                                                            newProducts[index].categoria = e.target.value;
                                                                            setSetupProducts(newProducts);
                                                                        }}
                                                                        className="w-full bg-[#1A1B3A] border border-white/5 rounded-2xl p-3 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2 text-left">
                                                                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-2">Nombre del Producto</label>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Ej. Arroz con Pollo"
                                                                        value={p.titulo}
                                                                        onChange={(e) => {
                                                                            const newProducts = [...setupProducts];
                                                                            newProducts[index].titulo = e.target.value;
                                                                            setSetupProducts(newProducts);
                                                                        }}
                                                                        className="w-full bg-[#1A1B3A] border border-white/5 rounded-2xl p-3 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-4">
                                                                <div className="space-y-2 text-left">
                                                                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-2">Descripción Corta</label>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Detalles rápidos..."
                                                                        value={p.descripcion}
                                                                        onChange={(e) => {
                                                                            const newProducts = [...setupProducts];
                                                                            newProducts[index].descripcion = e.target.value;
                                                                            setSetupProducts(newProducts);
                                                                        }}
                                                                        className="w-full bg-[#1A1B3A] border border-white/5 rounded-2xl p-3 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2 text-left">
                                                                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest px-2">Precio</label>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Ej. 15.00"
                                                                        value={p.precio}
                                                                        onChange={(e) => {
                                                                            const newProducts = [...setupProducts];
                                                                            newProducts[index].precio = e.target.value;
                                                                            setSetupProducts(newProducts);
                                                                        }}
                                                                        className="w-full bg-[#1A1B3A] border border-white/5 rounded-2xl p-3 text-sm font-bold focus:border-primary/50 transition-all outline-none text-primary"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="pt-4 px-4 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            <p className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">
                                                {setupProducts.length} producto(s) listo(s) para ser publicados en el catálogo.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                </div>
                            </div>

                            <div className="p-6 md:p-8 bg-[#0A0B1E]/80 backdrop-blur-xl border-t border-white/10">
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleHeroUploadConfirm}
                                        disabled={(!promptRegistro.portada_desktop || !isPlaceholderUrl(promptRegistro.portada_desktop)) && (!promptRegistro.portada_movil || !isPlaceholderUrl(promptRegistro.portada_movil)) ? false : (setupTarget === 'view')}
                                        className="w-full bg-primary text-navy py-4 md:py-5 rounded-[20px] md:rounded-[24px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        {setupTarget === 'catalog' ? 'Activar Catálogo y Continuar' : 'Guardar y Ver Perfil'}
                                    </button>
                                    <button
                                        onClick={() => setIsHeroPromptOpen(false)}
                                        className="w-full py-4 md:py-5 rounded-[20px] md:rounded-[24px] border border-white/10 text-white/40 font-black uppercase tracking-widest hover:bg-white/5 transition-all text-[10px] md:text-xs"
                                    >
                                        Ahora No
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Gestión de Catálogo (Completo) */}
            <AnimatePresence>
                {isCatalogManagerOpen && catalogRegistro && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-4 bg-black/95 backdrop-blur-2xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-4xl bg-[#0A0B1E] border border-white/10 rounded-[32px] md:rounded-[48px] shadow-3xl relative flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-8 md:p-12 border-b border-white/5 flex justify-between items-start bg-[#0A0B1E]/80 backdrop-blur-xl">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center shadow-inner">
                                            <Store size={24} />
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Gestor de Catálogo</h3>
                                    </div>
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest ml-14">
                                        {catalogRegistro.nombre} • {catalogItems.length} Productos
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setIsCatalogManagerOpen(false);
                                        setCatalogItems([]);
                                        setCatalogRegistro(null);
                                    }}
                                    className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white border border-white/10 shadow-xl backdrop-blur-md"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Body Scrollable */}
                            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                                {/* ─── GESTIÓN DE CATEGORÍAS ─── */}
                                {(() => {
                                    const allCategories = [...new Set(catalogItems.map((p: any) => p.categoria || p.category || 'General').filter(Boolean))];
                                    return (
                                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 mb-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">📁 Categorías ({allCategories.length})</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cat = prompt('Nueva categoría:');
                                                        if (cat && cat.trim()) {
                                                            // Add a placeholder product just to create the category
                                                            const newItem = { 
                                                                id: `cat_${Date.now()}`, 
                                                                nombre: '---', 
                                                                categoria: cat.trim(),
                                                                category: cat.trim(),
                                                                imagenes: [], 
                                                                videos: [],
                                                                descripcion: '', 
                                                                description: '',
                                                                precio: '',
                                                                price: ''
                                                            };
                                                            const updatedItems = [newItem, ...catalogItems];
                                                            setCatalogItems(updatedItems);
                                                            const remainingCats = [...new Set(updatedItems.map((p: any) => p.categoria || p.category || 'General').filter(Boolean))];
                                                            const catalogoPayload = { categories: remainingCats, products: updatedItems };
                                                            setCatalogRegistro((prev: any) => ({ ...prev, catalogo_json: catalogoPayload }));
                                                            fetch('/api/admin/registros', {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json', 'x-admin-key': localStorage.getItem('admin_access_key') || '' },
                                                                body: JSON.stringify({ id: catalogRegistro.id, catalogo_json: JSON.stringify(catalogoPayload) })
                                                            });
                                                            fetchRegistros();
                                                        }
                                                    }}
                                                    className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-indigo-500/20 transition-all"
                                                >
                                                    + Nueva
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {allCategories.map((cat, idx) => {
                                                    const productCount = catalogItems.filter((p: any) => (p.categoria || p.category || '').toLowerCase() === cat.toLowerCase()).length;
                                                    return (
                                                        <div key={idx} className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-indigo-300 uppercase">{cat}</span>
                                                            <span className="text-[8px] text-indigo-400/50 font-bold">({productCount})</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const msg = productCount > 0
                                                                        ? 'Eliminar categoria "' + cat + '"?\n\nADVERTENCIA: Tambien se eliminaran ' + productCount + ' producto(s) de esta categoria.\n\nEsta accion no se puede deshacer.'
                                                                        : 'Eliminar categoria "' + cat + '"?\n\nEsta categoria esta vacia.';
                                                                    if (!confirm(msg)) return;
                                                                    const updatedItems = catalogItems.filter((p: any) => (p.categoria || p.category || '').toLowerCase() !== cat.toLowerCase());
                                                                    setCatalogItems(updatedItems);
                                                                    const remainingCats = [...new Set(updatedItems.map((p: any) => p.categoria || p.category || 'General').filter(Boolean))];
                                                                    const catalogoPayload = { categories: remainingCats, products: updatedItems };
                                                                    setCatalogRegistro((prev: any) => ({ ...prev, catalogo_json: catalogoPayload }));
                                                                    fetch('/api/admin/registros', {
                                                                        method: 'PATCH',
                                                                        headers: { 'Content-Type': 'application/json', 'x-admin-key': localStorage.getItem('admin_access_key') || '' },
                                                                        body: JSON.stringify({ id: catalogRegistro.id, catalogo_json: JSON.stringify(catalogoPayload) })
                                                                    });
                                                                    fetchRegistros();
                                                                }}
                                                                className="text-indigo-400/50 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                                {allCategories.length === 0 && (
                                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Sin categorías. Crea una o añade productos.</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* ─── COLOR PICKER ─── */}
                                {(() => {
                                    let currentOverride: Record<string, any> = {};
                                    try {
                                        const raw = (catalogRegistro as any)?.json_override;
                                        currentOverride = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
                                    } catch {}
                                    const currentColor = currentOverride?.themePrimary || '#f66739';
                                    return (
                                        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-[32px] p-6 md:p-8 mb-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">🎨 Color del Tema</h4>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        let currentOverride: Record<string, any> = {};
                                                        try {
                                                            const raw = (catalogRegistro as any)?.json_override;
                                                            currentOverride = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
                                                        } catch {}
                                                        delete currentOverride.themePrimary;
                                                        delete currentOverride.themeTextOnPrimary;
                                                        setCatalogRegistro((prev: any) => ({ ...prev, json_override: currentOverride }));
                                                        await fetch('/api/admin/registros', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json', 'x-admin-key': localStorage.getItem('admin_access_key') || '' },
                                                            body: JSON.stringify({ id: catalogRegistro.id, json_override: JSON.stringify(currentOverride) })
                                                        });
                                                        fetchRegistros();
                                                    }}
                                                    className="text-[9px] font-black uppercase tracking-widest text-indigo-300/50 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                                                >
                                                    Restaurar Auto
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-indigo-300/40 font-bold uppercase tracking-widest mb-5">
                                                Color principal para botones, títulos y bordes del perfil. Si no eliges, se extrae de la foto.
                                            </p>
                                            <div className="flex items-center gap-6">
                                                <input 
                                                    type="color" 
                                                    value={currentColor}
                                                    onChange={async (e) => {
                                                        const newColor = e.target.value;
                                                        let currentOverride: Record<string, any> = {};
                                                        try {
                                                            const raw = (catalogRegistro as any)?.json_override;
                                                            currentOverride = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
                                                        } catch {}
                                                        const newOverride = { ...currentOverride, themePrimary: newColor, themeTextOnPrimary: '#ffffff' };
                                                        setCatalogRegistro((prev: any) => ({ ...prev, json_override: newOverride }));
                                                        await fetch('/api/admin/registros', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json', 'x-admin-key': localStorage.getItem('admin_access_key') || '' },
                                                            body: JSON.stringify({ id: catalogRegistro.id, json_override: JSON.stringify(newOverride) })
                                                        });
                                                        fetchRegistros();
                                                    }}
                                                    className="w-14 h-14 rounded-2xl border-2 border-white/20 cursor-pointer hover:border-indigo-400/50 transition-all"
                                                    style={{ backgroundColor: currentColor }}
                                                />
                                                <div className="flex-1">
                                                    <div 
                                                        className="w-full h-9 rounded-xl flex items-center px-4 text-[10px] font-black uppercase tracking-widest"
                                                        style={{ backgroundColor: currentColor, color: '#ffffff' }}
                                                    >
                                                        Vista previa
                                                    </div>
                                                    <span className="text-[9px] font-mono text-white/20 mt-1 block">{currentColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Formulario para nuevo item */}
                                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 mb-12">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-8 border-b border-white/5 pb-4">Añadir Nuevo Producto</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="aspect-square bg-white/5 rounded-[24px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
                                                {catalogImageFile ? (
                                                    <img src={URL.createObjectURL(catalogImageFile)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3 text-white/20">
                                                        <Upload size={32} />
                                                        <span className="text-[10px] uppercase font-black tracking-widest">Imagen del Producto</span>
                                                    </div>
                                                )}
                                                <label className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-10">
                                                    <Upload size={24} className="text-white" />
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        accept="image/*" 
                                                        onChange={(e) => setCatalogImageFile(e.target.files?.[0] || null)} 
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-white/40 ml-1">Título del Producto</label>
                                                <input 
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/50 transition-all"
                                                    value={newCatalogItem.titulo}
                                                    onChange={e => setNewCatalogItem({...newCatalogItem, titulo: e.target.value})}
                                                    placeholder="Nombre del producto o servicio"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-white/40 ml-1">Categoría</label>
                                                    <input 
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-primary/50 transition-all"
                                                        value={newCatalogItem.categoria}
                                                        onChange={e => setNewCatalogItem({...newCatalogItem, categoria: e.target.value})}
                                                        placeholder="Ej: Hamburguesas"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-white/40 ml-1">Precio</label>
                                                    <input 
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-primary outline-none focus:border-primary/50 transition-all"
                                                        value={newCatalogItem.precio}
                                                        onChange={e => setNewCatalogItem({...newCatalogItem, precio: e.target.value})}
                                                        placeholder="Ej: 15.00"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-white/40 ml-1">Descripción</label>
                                                <textarea 
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-medium text-white/80 outline-none focus:border-primary/50 transition-all min-h-[100px] resize-none"
                                                    value={newCatalogItem.descripcion}
                                                    onChange={e => setNewCatalogItem({...newCatalogItem, descripcion: e.target.value})}
                                                    placeholder="Breve descripción..."
                                                />
                                            </div>
                                            <button 
                                                onClick={handleAddCatalogItem}
                                                disabled={isSavingCatalog || !newCatalogItem.titulo || !catalogImageFile}
                                                className="w-full bg-primary text-navy py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
                                                {isSavingCatalog ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
                                                {isSavingCatalog ? 'Añadiendo...' : 'Añadir al Catálogo'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Lista de items existentes */}
                                <div className="space-y-6 pb-12">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 ml-1">Productos Existentes ({catalogItems.length})</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {catalogItems.map((item: any, index: number) => {
                                            // Compatibilidad: soportar ambos formatos de campo (VCardEditModal + legacy)
                                            const imgSrc = item.imagenes?.[0] || item.url || item.image || '';
                                            const titulo = item.nombre || item.name || item.titulo || 'Producto';
                                            const categoria = item.categoria || item.category || 'General';
                                            const descripcion = item.descripcion || item.description || '';
                                            const precio = item.precio || item.price || '';
                                            return (
                                            <div key={item.id || index} className="bg-white/5 border border-white/10 rounded-3xl p-4 md:p-6 flex gap-4 md:gap-6 group hover:bg-white/[0.08] transition-all relative">
                                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5">
                                                    {imgSrc ? (
                                                        <img src={imgSrc} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white/10 text-[18px] font-black">?</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h5 className="font-bold text-white text-sm line-clamp-1 flex-1">{titulo}</h5>
                                                        <button 
                                                            onClick={() => handleDeleteCatalogItem(index)}
                                                            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 transition-all rounded-xl p-2 md:p-1 flex-shrink-0"
                                                            title="Eliminar producto"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] font-black text-primary uppercase mb-1 md:mb-2 tracking-tighter">{categoria}</p>
                                                    <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed hidden md:block">{descripcion}</p>
                                                    {precio && <p className="text-xs font-black text-white mt-1 md:mt-2">${precio}</p>}
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                    {catalogItems.length === 0 && (
                                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[40px]">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Store size={32} className="text-white/10" />
                                            </div>
                                            <p className="text-white/20 text-xs font-black uppercase tracking-widest">No hay productos en el catálogo</p>
                                            <p className="text-white/10 text-[10px] uppercase mt-2 font-bold">Comienza añadiendo uno arriba</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCreateClientModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-navy border border-green-500/20 rounded-[40px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Plus size={80} className="text-green-500" />
                            </div>

                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Nuevo Cliente</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mt-1">Generación Rápida</p>
                                </div>
                                <button onClick={() => setIsCreateClientModalOpen(false)} className="text-white/40 hover:text-white p-2">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateClient} className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Nombre o Empresa</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[#1A1B3A] border border-white/5 rounded-2xl p-4 text-white font-bold focus:border-green-500/50 outline-none"
                                        value={newClientData.nombre}
                                        onChange={(e) => {
                                            const nombre = e.target.value;
                                            setNewClientData({ ...newClientData, nombre, slug: generateClientSlug(nombre) });
                                        }}
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Slug (Automático)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[#1A1B3A] border border-white/5 rounded-2xl p-4 text-white font-bold outline-none text-green-500/80"
                                        value={newClientData.slug}
                                        onChange={(e) => setNewClientData({ ...newClientData, slug: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">WhatsApp</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#1A1B3A] border border-white/5 rounded-2xl p-4 text-white font-bold focus:border-green-500/50 outline-none"
                                        value={newClientData.whatsapp}
                                        onChange={(e) => setNewClientData({ ...newClientData, whatsapp: e.target.value })}
                                        placeholder="Ej. +593991234567"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Plan Base</label>
                                    <select
                                        className="w-full bg-[#1A1B3A] border border-white/5 rounded-2xl p-4 text-white font-bold focus:border-green-500/50 outline-none appearance-none"
                                        value={newClientData.plan}
                                        onChange={(e) => setNewClientData({ ...newClientData, plan: e.target.value })}
                                    >
                                        <option value="basic">Plan Basic ($35)</option>
                                        <option value="business">Plan Business ($100)</option>
                                        <option value="catalog">Plan Catalog/Store ($200)</option>
                                        <option value="menu">Plan Menú Digital ($150)</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreatingClient || !newClientData.nombre || !newClientData.slug}
                                    className="w-full bg-green-500 text-navy py-4 rounded-[24px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    {isCreatingClient ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                                    {isCreatingClient ? 'Creando...' : 'Crear y Continuar'}
                                </button>
                                <p className="text-center text-[10px] font-bold text-white/30 uppercase">
                                    Se guardará como "Entregado". Usa "Editar" para configurar el diseño.
                                </p>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <StatsModal
                isOpen={isStatsModalOpen}
                onClose={() => setIsStatsModalOpen(false)}
            />

            {/* ── Modal: Historial de Descargas ─────────────────────────── */}
            <AnimatePresence>
                {isDownloadsModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0A1229] border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-1">Analíticas de Descargas</p>
                                    <h2 className="text-xl font-black text-white italic tracking-tight">{downloadsModalName}</h2>
                                    <p className="text-[11px] text-white/30 mt-0.5">Últimas 50 descargas registradas</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {downloadsData.length > 0 && (
                                        <button
                                            onClick={exportDownloadsJSON}
                                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all"
                                        >
                                            <Download size={14} />
                                            Exportar JSON
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsDownloadsModalOpen(false)}
                                        className="p-2 bg-white/5 text-white/40 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="overflow-y-auto grow p-6">
                                {loadingDownloads ? (
                                    <div className="flex items-center justify-center py-16 gap-3 text-white/40">
                                        <Loader2 size={24} className="animate-spin text-cyan-400" />
                                        <span className="text-sm font-bold uppercase tracking-widest">Cargando datos...</span>
                                    </div>
                                ) : downloadsData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <BarChart2 size={48} className="text-white/10 mb-4" />
                                        <p className="text-white/30 font-black uppercase tracking-widest text-sm">Sin descargas aún</p>
                                        <p className="text-white/20 text-xs mt-1">Las descargas aparecerán aquí en tiempo real</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Summary badge */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-2 rounded-xl">
                                                <Download size={16} />
                                                <span className="font-black text-lg">{downloadsData.length}</span>
                                                <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">registros</span>
                                            </div>
                                        </div>

                                        {/* Table */}
                                        <div className="rounded-2xl overflow-hidden border border-white/5">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="bg-white/[0.03] border-b border-white/5">
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white/30">#</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white/30">Fecha & Hora</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white/30">Método</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white/30 hidden md:table-cell">IP</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {downloadsData.map((d, i) => (
                                                        <tr key={d.id} className="hover:bg-white/[0.02] transition-all">
                                                            <td className="px-4 py-3 text-[10px] text-white/20 font-mono">{i + 1}</td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-xs font-bold text-white">
                                                                    {new Date(d.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </p>
                                                                <p className="text-[10px] text-white/40">
                                                                    {new Date(d.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                                    d.method === 'profile_button' ? 'bg-primary/20 text-primary' :
                                                                    d.method === 'api_direct' ? 'bg-cyan-500/20 text-cyan-400' :
                                                                    'bg-white/10 text-white/40'
                                                                }`}>
                                                                    {d.method === 'profile_button' ? 'Botón Perfil' :
                                                                     d.method === 'api_direct' ? 'QR / Directo' :
                                                                     d.method === 'edit_portal' ? 'Portal Edición' :
                                                                     d.method}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 hidden md:table-cell">
                                                                <span className="text-[10px] font-mono text-white/20">{d.ip_address}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
                {isBroadcastOpen && (
                    <BroadcastPanel
                        onClose={() => setIsBroadcastOpen(false)}
                        adminKey={getAdminKey()}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
