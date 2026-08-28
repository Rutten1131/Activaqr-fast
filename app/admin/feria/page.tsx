"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Store,
    User,
    Phone,
    Link2,
    CheckCircle,
    Download,
    QrCode,
    RefreshCw,
    ArrowLeft,
    Loader2,
    Power,
    Trash2,
    Star,
    Vote,
    Eye,
    Clock,
    BarChart3,
    ImageIcon
} from "lucide-react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";

const ADMIN_KEY_STORAGE = "activaqr_admin_key";
const WA_NUMBER = "593963425323";

interface FeriaNegocio {
    id: number;
    slug: string;
    nombre_negocio: string;
    nombre_representante: string;
    telefono_negocio: string | null;
    logo_url: string | null;
    google_reviews_url: string | null;
    whatsapp_target_number: string;
    total_votos: number;
    is_active: boolean;
    created_at: string;
}

interface FeriaVoto {
    id: number;
    negocio_id: number;
    nombre_negocio: string;
    telefono_votante: string;
    nombre_votante: string | null;
    mensaje_recibido: string | null;
    created_at: string;
}

export default function AdminFeriaPage() {
    const [adminKey, setAdminKey] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [negocios, setNegocios] = useState<FeriaNegocio[]>([]);
    const [recentVotes, setRecentVotes] = useState<FeriaVoto[]>([]);
    const [stats, setStats] = useState({ total_stands: 0, total_votos_general: 0, stands_con_reviews: 0 });
    const [selectedQR, setSelectedQR] = useState<FeriaNegocio | null>(null);
    const [activeTab, setActiveTab] = useState<"ranking" | "votos">("ranking");

    useEffect(() => {
        const saved = localStorage.getItem("admin_access_key") || localStorage.getItem(ADMIN_KEY_STORAGE);
        if (saved) {
            setAdminKey(saved);
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminKey.trim()) {
            localStorage.setItem(ADMIN_KEY_STORAGE, adminKey.trim());
            setIsAuthenticated(true);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/feria/admin", {
                headers: { "x-admin-key": adminKey },
            });
            if (res.status === 401) {
                localStorage.removeItem(ADMIN_KEY_STORAGE);
                setIsAuthenticated(false);
                return;
            }
            const data = await res.json();
            if (data.success) {
                setNegocios(data.negocios || []);
                setRecentVotes(data.recent_votes || []);
                setStats(data.stats || { total_stands: 0, total_votos_general: 0, stands_con_reviews: 0 });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleActive = async (id: number, currentActive: boolean) => {
        try {
            await fetch("/api/feria/admin", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                body: JSON.stringify({ id, is_active: !currentActive }),
            });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNegocio = async (id: number, nombre: string) => {
        if (!confirm(`¿Eliminar "${nombre}" y todos sus votos? Esta acción no se puede deshacer.`)) return;
        try {
            await fetch(`/api/feria/admin?id=${id}`, {
                method: "DELETE",
                headers: { "x-admin-key": adminKey },
            });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const getWhatsappUrl = (negocio: FeriaNegocio) => {
        const msg = `Feria de Loja #197 - Voto por: ${negocio.nombre_negocio}`;
        return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    };

    const downloadQR = (negocio: FeriaNegocio) => {
        const container = document.getElementById(`qr-admin-${negocio.id}`);
        const canvas = container?.querySelector("canvas");
        if (!canvas) return;

        const padding = 40;
        const textHeight = 60;
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
        ctx.fillText(`¡Vota por ${negocio.nombre_negocio}!`, newCanvas.width / 2, canvas.height + padding + 30);
        ctx.font = "12px Arial";
        ctx.fillStyle = "#666666";
        ctx.fillText("Feria de Loja #197 • Escanea y vota", newCanvas.width / 2, canvas.height + padding + 50);

        const link = document.createElement("a");
        link.download = `QR-Feria-${negocio.slug}.png`;
        link.href = newCanvas.toDataURL("image/png");
        link.click();
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                <form onSubmit={handleLogin} className="w-full max-w-sm">
                    <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="text-center mb-6">
                            <Trophy size={40} className="text-primary mx-auto mb-3" />
                            <h1 className="text-xl font-black text-white">Admin Feria de Loja</h1>
                            <p className="text-white/40 text-sm mt-1">Ingresa la clave de administrador</p>
                        </div>
                        <input
                            type="password"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            placeholder="Clave de administrador"
                            className="w-full px-4 py-3 rounded-xl text-white text-sm font-medium placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                        <button
                            type="submit"
                            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors"
                        >
                            Ingresar
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 px-4 py-4" style={{ background: "rgba(10,10,10,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="text-white/40 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <Trophy size={22} className="text-primary" />
                        <h1 className="text-lg font-black">Feria de Loja 197</h1>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        Actualizar
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(246,103,57,0.15)" }}>
                                <Store size={20} className="text-primary" />
                            </div>
                            <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Stands</span>
                        </div>
                        <p className="text-3xl font-black text-white">{stats.total_stands}</p>
                    </div>
                    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(102,191,25,0.15)" }}>
                                <BarChart3 size={20} className="text-green-400" />
                            </div>
                            <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Votos Totales</span>
                        </div>
                        <p className="text-3xl font-black text-white">{stats.total_votos_general}</p>
                    </div>
                    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(104,211,254,0.15)" }}>
                                <Star size={20} className="text-sky" />
                            </div>
                            <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Con Google Reseñas</span>
                        </div>
                        <p className="text-3xl font-black text-white">{stats.stands_con_reviews}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab("ranking")}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "ranking" ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
                    >
                        <Trophy size={14} className="inline mr-2" /> Ranking
                    </button>
                    <button
                        onClick={() => setActiveTab("votos")}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "votos" ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
                    >
                        <Clock size={14} className="inline mr-2" /> Últimos Votos
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-primary" />
                    </div>
                ) : activeTab === "ranking" ? (
                    /* Ranking Table */
                    <div className="space-y-3">
                        {negocios.length === 0 ? (
                            <div className="text-center py-20 text-white/30">
                                <Store size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="font-bold">No hay negocios registrados aún.</p>
                            </div>
                        ) : (
                            negocios.map((neg, index) => (
                                <motion.div
                                    key={neg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4"
                                    style={{
                                        background: index === 0 ? "rgba(246,103,57,0.08)" : "rgba(255,255,255,0.03)",
                                        border: `1px solid ${index === 0 ? "rgba(246,103,57,0.2)" : "rgba(255,255,255,0.06)"}`,
                                        opacity: neg.is_active ? 1 : 0.4
                                    }}
                                >
                                    {/* Position */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${index === 0 ? "bg-primary text-white" : index === 1 ? "bg-white/10 text-white" : index === 2 ? "bg-white/5 text-white/70" : "bg-white/3 text-white/40"}`}>
                                            {index + 1}
                                        </div>

                                        {/* Logo */}
                                        {neg.logo_url ? (
                                            <img src={neg.logo_url} alt={neg.nombre_negocio} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
                                                <ImageIcon size={20} className="text-white/20" />
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-black text-white text-base truncate">{neg.nombre_negocio}</h3>
                                            <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                                                <span><User size={12} className="inline mr-1" />{neg.nombre_representante}</span>
                                                {neg.telefono_negocio && <span><Phone size={12} className="inline mr-1" />{neg.telefono_negocio}</span>}
                                            </div>
                                            {neg.google_reviews_url && (
                                                <a href={neg.google_reviews_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/70 hover:text-primary mt-1 inline-flex items-center gap-1">
                                                    <Link2 size={10} /> Google Reseñas
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Votes */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="text-center px-4">
                                            <p className={`text-2xl font-black ${index === 0 ? "text-primary" : "text-white"}`}>{neg.total_votos}</p>
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">votos</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedQR(selectedQR?.id === neg.id ? null : neg)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-primary"
                                                title="Ver/Descargar QR"
                                            >
                                                <QrCode size={16} />
                                            </button>
                                            <button
                                                onClick={() => toggleActive(neg.id, neg.is_active)}
                                                className={`p-2 rounded-lg transition-colors ${neg.is_active ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-white/5 text-white/30 hover:bg-white/10"}`}
                                                title={neg.is_active ? "Desactivar" : "Activar"}
                                            >
                                                <Power size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteNegocio(neg.id, neg.nombre_negocio)}
                                                className="p-2 rounded-lg bg-red-500/5 text-red-400/50 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* QR Expandable */}
                                    {selectedQR?.id === neg.id && (
                                        <div className="w-full pt-4 border-t border-white/5 flex flex-col items-center gap-4">
                                            <div id={`qr-admin-${neg.id}`} className="bg-white p-4 rounded-xl">
                                                <QRCodeCanvas
                                                    value={getWhatsappUrl(neg)}
                                                    size={180}
                                                    level="H"
                                                    includeMargin={false}
                                                    bgColor="#ffffff"
                                                    fgColor="#0a0a0a"
                                                />
                                            </div>
                                            <button
                                                onClick={() => downloadQR(neg)}
                                                className="flex items-center gap-2 bg-primary/20 text-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/30 transition-colors"
                                            >
                                                <Download size={16} /> Descargar QR
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                ) : (
                    /* Recent Votes */
                    <div className="space-y-2">
                        {recentVotes.length === 0 ? (
                            <div className="text-center py-20 text-white/30">
                                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="font-bold">No hay votos registrados aún.</p>
                            </div>
                        ) : (
                            recentVotes.map((vote) => (
                                <div
                                    key={vote.id}
                                    className="rounded-xl p-4 flex items-center gap-4"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                                >
                                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                        <CheckCircle size={14} className="text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">
                                            {vote.nombre_votante || vote.telefono_votante} votó por <span className="text-primary">{vote.nombre_negocio}</span>
                                        </p>
                                        <p className="text-xs text-white/30 mt-0.5">
                                            {new Date(vote.created_at).toLocaleString("es-EC", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
