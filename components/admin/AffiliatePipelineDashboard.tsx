"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award,
    Users,
    GitCommit,
    DollarSign,
    Plus,
    Search,
    Filter,
    Copy,
    Check,
    ExternalLink,
    Clock,
    AlertCircle,
    CheckCircle2,
    Utensils,
    Video,
    FileText,
    TrendingUp,
    Phone,
    Mail,
    Share2,
    Calendar,
    ChevronRight,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
    { id: "diez_casos", label: "Programa 10 Casos", icon: Award, highlight: true },
    { id: "pipeline", label: "Pipeline Restaurantes", icon: GitCommit },
    { id: "aliados", label: "Motor de Aliados", icon: Users },
    { id: "comisiones", label: "Comisiones", icon: DollarSign },
];

const PIPELINE_ESTADOS = [
    { id: "prospecto", label: "Prospecto", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
    { id: "contactado", label: "Contactado", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    { id: "interesado", label: "Interesado", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    { id: "propuesta_enviada", label: "Propuesta Enviada", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    { id: "vendido", label: "Vendido", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
    { id: "pagado", label: "Pagado ($500)", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
    { id: "en_implementacion", label: "En Implementación", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
    { id: "activo", label: "Menú Activo", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
    { id: "caso_exito", label: "⭐ Caso de Éxito", color: "bg-amber-400/20 text-amber-300 border-amber-400/50" },
    { id: "comision_pagada", label: "Comisión Pagada", color: "bg-green-600/20 text-green-300 border-green-600/40" },
];

export default function AffiliatePipelineDashboard() {
    const [activeTab, setActiveTab] = useState("diez_casos");
    const [loading, setLoading] = useState(true);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Data States
    const [aliados, setAliados] = useState<any[]>([]);
    const [pipeline, setPipeline] = useState<any[]>([]);
    const [casosExito, setCasosExito] = useState<any[]>([]);
    const [comisiones, setComisiones] = useState<any[]>([]);

    // Modals
    const [showNewAliadoModal, setShowNewAliadoModal] = useState(false);
    const [showNewPipelineModal, setShowNewPipelineModal] = useState(false);
    const [selectedCaso, setSelectedCaso] = useState<any | null>(null);

    // Form States
    const [newAliado, setNewAliado] = useState({
        nombre: "",
        whatsapp: "",
        email: "",
        tipo: "influencer",
        codigo: "",
        mercado_principal: "EC",
        comision_tipo: "porcentaje",
        comision_valor: 20,
        notas: ""
    });

    const [newPipeline, setNewPipeline] = useState({
        nombre_restaurante: "",
        contacto_nombre: "",
        contacto_telefono: "",
        contacto_email: "",
        ciudad: "",
        tipo_cocina: "",
        pais: "EC",
        aliado_codigo: "",
        precio_pactado: 500,
        es_candidato_10_casos: true,
        estado: "prospecto",
        notas: ""
    });

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const adminKey = localStorage.getItem("admin_access_key") || "";
            const headers = { "x-admin-key": adminKey };

            const [resAliados, resPipe, resCasos, resCom] = await Promise.all([
                fetch("/api/admin/aliados", { headers }),
                fetch("/api/admin/pipeline", { headers }),
                fetch("/api/admin/casos-exito", { headers }),
                fetch("/api/admin/comisiones", { headers })
            ]);

            const [dataAliados, dataPipe, dataCasos, dataCom] = await Promise.all([
                resAliados.json(),
                resPipe.json(),
                resCasos.json(),
                resCom.json()
            ]);

            if (dataAliados.success) setAliados(dataAliados.data || []);
            if (dataPipe.success) setPipeline(dataPipe.data || []);
            if (dataCasos.success) setCasosExito(dataCasos.data || []);
            if (dataCom.success) setComisiones(dataCom.data || []);
        } catch (err) {
            console.error("Error fetching affiliate/pipeline data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Create New Aliado
    const handleCreateAliado = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const adminKey = localStorage.getItem("admin_access_key") || "";
            const res = await fetch("/api/admin/aliados", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                body: JSON.stringify(newAliado)
            });
            const data = await res.json();
            if (data.success) {
                setShowNewAliadoModal(false);
                setNewAliado({
                    nombre: "",
                    whatsapp: "",
                    email: "",
                    tipo: "influencer",
                    codigo: "",
                    mercado_principal: "EC",
                    comision_tipo: "porcentaje",
                    comision_valor: 20,
                    notas: ""
                });
                fetchData();
            } else {
                alert(data.error || "Error al crear aliado");
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Create New Pipeline Restaurant
    const handleCreatePipeline = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const adminKey = localStorage.getItem("admin_access_key") || "";
            const res = await fetch("/api/admin/pipeline", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                body: JSON.stringify(newPipeline)
            });
            const data = await res.json();
            if (data.success) {
                setShowNewPipelineModal(false);
                setNewPipeline({
                    nombre_restaurante: "",
                    contacto_nombre: "",
                    contacto_telefono: "",
                    contacto_email: "",
                    ciudad: "",
                    tipo_cocina: "",
                    pais: "EC",
                    aliado_codigo: "",
                    precio_pactado: 500,
                    es_candidato_10_casos: true,
                    estado: "prospecto",
                    notas: ""
                });
                fetchData();
            } else {
                alert(data.error || "Error al registrar restaurante");
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Update Pipeline Status
    const handleUpdateStatus = async (id: number, nuevoEstado: string) => {
        try {
            const adminKey = localStorage.getItem("admin_access_key") || "";
            const res = await fetch("/api/admin/pipeline", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                body: JSON.stringify({ id, estado: nuevoEstado })
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    // Update Case Milestone
    const handleToggleMilestone = async (casoId: number, field: string, currentValue: number) => {
        try {
            const adminKey = localStorage.getItem("admin_access_key") || "";
            const res = await fetch("/api/admin/casos-exito", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                body: JSON.stringify({ id: casoId, [field]: currentValue === 1 ? 0 : 1 })
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error("Error updating milestone:", err);
        }
    };

    // Pay Commission
    const handlePayCommission = async (id: number) => {
        const metodo = prompt("Método de pago (Transferencia Banco Pichincha, PayPal, etc.):", "Transferencia Directa");
        if (!metodo) return;

        try {
            const adminKey = localStorage.getItem("admin_access_key") || "";
            const res = await fetch("/api/admin/comisiones", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                body: JSON.stringify({ id, estado: "pagada", metodo_pago: metodo })
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error("Error paying commission:", err);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Header & Tabs Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-navy-light/40 border border-white/10 p-4 rounded-3xl backdrop-blur-xl">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-5 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-wider transition-all",
                                    isActive
                                        ? "bg-primary text-white shadow-orange scale-[1.02]"
                                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                                {tab.id === "diez_casos" && (
                                    <span className="ml-1 px-2 py-0.5 bg-amber-400 text-navy font-black text-[10px] rounded-full">
                                        {casosExito.length}/10
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === "aliados" && (
                        <button
                            onClick={() => setShowNewAliadoModal(true)}
                            className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl flex items-center gap-2 shadow-orange transition-all"
                        >
                            <Plus size={16} />
                            Nuevo Aliado
                        </button>
                    )}
                    {activeTab === "pipeline" && (
                        <button
                            onClick={() => setShowNewPipelineModal(true)}
                            className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl flex items-center gap-2 shadow-orange transition-all"
                        >
                            <Plus size={16} />
                            Registrar Restaurante
                        </button>
                    )}
                </div>
            </div>

            {/* TAB 1: 10 CASOS DE ÉXITO */}
            {activeTab === "diez_casos" && (
                <div className="flex flex-col gap-6">
                    {/* Banner de Estado de la Campaña */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-primary/20 to-navy-light/40 border border-amber-500/30 p-6 md:p-8 rounded-3xl">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
                                    <Sparkles size={14} /> Campaña de Lanzamiento: 10 Restaurantes Piloto
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                                    Casos de Éxito Seleccionados: <span className="text-amber-400">{casosExito.length} de 10 Cupos</span>
                                </h2>
                                <p className="text-white/60 text-sm max-w-2xl mt-1">
                                    Inversión de activación $500 / €500. Control de implementación, contenido con influencers, testimonios y documentación comercial.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setNewPipeline((prev) => ({ ...prev, es_candidato_10_casos: true }));
                                    setShowNewPipelineModal(true);
                                }}
                                className="bg-amber-400 hover:bg-amber-300 text-navy font-black text-xs uppercase tracking-wider px-6 py-4 rounded-2xl flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
                            >
                                <Plus size={18} />
                                Asignar Nuevo Cupo
                            </button>
                        </div>
                    </div>

                    {/* Grilla de los 10 Casos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 10 }).map((_, idx) => {
                            const caso = casosExito[idx];
                            const cupoNumero = idx + 1;

                            if (!caso) {
                                return (
                                    <div
                                        key={`vacio_${idx}`}
                                        className="bg-white/5 border border-dashed border-white/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[280px]"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/30 font-black text-lg">
                                            #{cupoNumero}
                                        </div>
                                        <p className="text-white/40 text-xs font-black uppercase tracking-widest">
                                            Cupo #{cupoNumero} Disponible
                                        </p>
                                        <button
                                            onClick={() => {
                                                setNewPipeline((prev) => ({ ...prev, es_candidato_10_casos: true }));
                                                setShowNewPipelineModal(true);
                                            }}
                                            className="px-4 py-2 bg-white/10 hover:bg-primary hover:text-white text-white/70 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                                        >
                                            Seleccionar Candidato
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={caso.id}
                                    className="bg-navy-light/60 border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden backdrop-blur-xl shadow-xl"
                                >
                                    {caso.alerta_testimonio_pendiente === 1 && (
                                        <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 animate-pulse">
                                            <AlertCircle size={14} /> +30 días activo — Testimonio Pendiente
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="px-2.5 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black rounded-lg">
                                                Caso #{cupoNumero} ({caso.mercado || "EC"})
                                            </span>
                                            <span className="text-white/40 text-xs font-mono">
                                                {caso.dias_activo || 0} días activo
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-black text-white uppercase tracking-tight line-clamp-1">
                                            {caso.nombre_restaurante}
                                        </h3>
                                        <p className="text-white/50 text-xs font-medium mb-4">
                                            {caso.ciudad ? `${caso.ciudad} • ` : ""}{caso.tipo_cocina || "Restaurante"}
                                        </p>

                                        {/* Checklist de Hitos */}
                                        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                                            {[
                                                { label: "1. Pago Recibido ($500)", field: "hito_pago_recibido", val: caso.hito_pago_recibido },
                                                { label: "2. Menú Implementado", field: "hito_menu_implementado", val: caso.hito_menu_implementado },
                                                { label: "3. Influencer Asignado", field: "hito_influencer_asignado", val: caso.hito_influencer_asignado },
                                                { label: "4. Contenido Publicado", field: "hito_contenido_publicado", val: caso.hito_contenido_publicado },
                                                { label: "5. Testimonio Recolectado", field: "hito_testimonio_recolectado", val: caso.hito_testimonio_recolectado },
                                                { label: "6. Autorización Firmada", field: "hito_autorizacion_firmada", val: caso.hito_autorizacion_firmada },
                                            ].map((hito) => (
                                                <button
                                                    key={hito.field}
                                                    onClick={() => handleToggleMilestone(caso.id, hito.field, hito.val)}
                                                    className={cn(
                                                        "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left",
                                                        hito.val === 1
                                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                            : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    <span>{hito.label}</span>
                                                    {hito.val === 1 ? <CheckCircle2 size={14} className="text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/30" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                                        {caso.menu_slug && (
                                            <a
                                                href={`/menu/${caso.menu_slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider py-2.5 rounded-xl text-center flex items-center justify-center gap-1 transition-all"
                                            >
                                                <Utensils size={14} /> Ver Menú
                                            </a>
                                        )}
                                        <button
                                            onClick={() => setSelectedCaso(caso)}
                                            className="px-4 py-2.5 bg-primary/20 hover:bg-primary text-primary hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                                        >
                                            Detalles
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: PIPELINE RESTAURANTES */}
            {activeTab === "pipeline" && (
                <div className="flex flex-col gap-6">
                    <div className="overflow-x-auto bg-navy-light/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-white/10 text-white/40 font-black uppercase tracking-wider">
                                    <th className="pb-4">Restaurante</th>
                                    <th className="pb-4">Contacto / Tel</th>
                                    <th className="pb-4">Aliado / Origen</th>
                                    <th className="pb-4">Inversión</th>
                                    <th className="pb-4">Estado Ciclo de Vida</th>
                                    <th className="pb-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {pipeline.map((item) => {
                                    const currentStatus = PIPELINE_ESTADOS.find((s) => s.id === item.estado) || PIPELINE_ESTADOS[0];
                                    return (
                                        <tr key={item.id} className="hover:bg-white/5 transition-all">
                                            <td className="py-4 font-bold text-white">
                                                <div className="flex items-center gap-2">
                                                    <span>{item.nombre_restaurante}</span>
                                                    {item.es_candidato_10_casos === 1 && (
                                                        <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-black rounded">
                                                            10 Casos
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-white/40 text-[11px] font-normal">
                                                    {item.ciudad ? `${item.ciudad}, ` : ""}{item.pais}
                                                </div>
                                            </td>

                                            <td className="py-4">
                                                <div className="text-white/80 font-medium">{item.contacto_nombre || "Sin nombre"}</div>
                                                <div className="text-white/40 font-mono text-[11px]">{item.contacto_telefono}</div>
                                            </td>

                                            <td className="py-4">
                                                {item.aliado_nombre ? (
                                                    <div>
                                                        <span className="px-2 py-0.5 bg-primary/20 text-primary font-black rounded text-[11px]">
                                                            {item.aliado_codigo}
                                                        </span>
                                                        <div className="text-white/50 text-[11px] mt-0.5">{item.aliado_nombre}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-white/30 uppercase">{item.canal_origen || "Directo"}</span>
                                                )}
                                            </td>

                                            <td className="py-4 font-black text-emerald-400 font-mono">
                                                ${Number(item.precio_pactado || 500).toFixed(2)}
                                            </td>

                                            <td className="py-4">
                                                <select
                                                    value={item.estado}
                                                    onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider bg-navy cursor-pointer focus:outline-none",
                                                        currentStatus.color
                                                    )}
                                                >
                                                    {PIPELINE_ESTADOS.map((st) => (
                                                        <option key={st.id} value={st.id} className="bg-navy text-white">
                                                            {st.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.onboarding_uuid && (
                                                        <button
                                                            onClick={() => copyToClipboard(`https://activaqr.com/onboarding-menu/${item.onboarding_uuid}`, `onb_${item.id}`)}
                                                            className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-all"
                                                            title="Copiar link de Onboarding"
                                                        >
                                                            {copiedKey === `onb_${item.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                                        </button>
                                                    )}
                                                    {item.menu_slug && (
                                                        <a
                                                            href={`/menu/${item.menu_slug}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-2 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl transition-all"
                                                            title="Ver Menú Digital"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: ALIADOS & CREADORES */}
            {activeTab === "aliados" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aliados.map((aliado) => {
                        const linkRef = `https://activaqr.com/menu?ref=${aliado.codigo}`;
                        return (
                            <div
                                key={aliado.id}
                                className="bg-navy-light/40 border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-5 backdrop-blur-xl shadow-xl"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2.5 py-1 bg-primary/20 border border-primary/30 text-primary text-xs font-black rounded-lg">
                                            {aliado.codigo}
                                        </span>
                                        <span className="text-white/40 text-[11px] uppercase tracking-widest font-black">
                                            {aliado.tipo}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                        {aliado.nombre}
                                    </h3>
                                    <p className="text-white/40 text-xs font-mono mb-4">
                                        {aliado.whatsapp} {aliado.email ? `• ${aliado.email}` : ""}
                                    </p>

                                    {/* Métricas del Aliado */}
                                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/10">
                                        <div>
                                            <div className="text-white/40 text-[10px] uppercase font-black">Referidos</div>
                                            <div className="text-lg font-black text-white font-mono">{aliado.total_referidos || 0}</div>
                                        </div>
                                        <div>
                                            <div className="text-white/40 text-[10px] uppercase font-black">Ventas</div>
                                            <div className="text-lg font-black text-emerald-400 font-mono">{aliado.total_vendidos || 0}</div>
                                        </div>
                                        <div>
                                            <div className="text-white/40 text-[10px] uppercase font-black">Comisión Pendiente</div>
                                            <div className="text-sm font-black text-amber-400 font-mono">${Number(aliado.comision_pendiente || 0).toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-white/40 text-[10px] uppercase font-black">Comisión Pagada</div>
                                            <div className="text-sm font-black text-green-400 font-mono">${Number(aliado.comision_pagada || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Enlace de Referido */}
                                <div className="flex items-center gap-2 bg-navy/80 border border-white/10 rounded-2xl p-2.5">
                                    <input
                                        type="text"
                                        readOnly
                                        value={linkRef}
                                        className="bg-transparent text-white/70 text-xs font-mono flex-1 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(linkRef, `link_${aliado.id}`)}
                                        className="p-2 bg-white/10 hover:bg-primary text-white rounded-xl transition-all"
                                        title="Copiar Link"
                                    >
                                        {copiedKey === `link_${aliado.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TAB 4: COMISIONES */}
            {activeTab === "comisiones" && (
                <div className="overflow-x-auto bg-navy-light/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/10 text-white/40 font-black uppercase tracking-wider">
                                <th className="pb-4">Aliado</th>
                                <th className="pb-4">Restaurante</th>
                                <th className="pb-4">Venta</th>
                                <th className="pb-4">Monto Comisión</th>
                                <th className="pb-4">Estado</th>
                                <th className="pb-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {comisiones.map((com) => (
                                <tr key={com.id} className="hover:bg-white/5 transition-all">
                                    <td className="py-4">
                                        <div className="font-bold text-white">{com.aliado_nombre}</div>
                                        <div className="text-primary font-mono text-[11px]">{com.aliado_codigo}</div>
                                    </td>
                                    <td className="py-4 text-white font-medium">
                                        {com.nombre_restaurante || "Venta Directa"}
                                    </td>
                                    <td className="py-4 font-mono text-white/70">
                                        ${Number(com.precio_venta).toFixed(2)}
                                    </td>
                                    <td className="py-4 font-mono font-black text-amber-400 text-sm">
                                        ${Number(com.monto_comision).toFixed(2)}
                                        {com.porcentaje_aplicado && (
                                            <span className="text-white/40 text-[10px] ml-1">({com.porcentaje_aplicado}%)</span>
                                        )}
                                    </td>
                                    <td className="py-4">
                                        <span
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider",
                                                com.estado === "pagada"
                                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                    : com.estado === "aprobada"
                                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                            )}
                                        >
                                            {com.estado}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        {com.estado !== "pagada" && (
                                            <button
                                                onClick={() => handlePayCommission(com.id)}
                                                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                                            >
                                                Pagar Comisión
                                            </button>
                                        )}
                                        {com.estado === "pagada" && (
                                            <span className="text-white/40 text-[11px] font-mono">
                                                Pagado ({com.metodo_pago || "Directo"})
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL: NUEVO ALIADO */}
            <AnimatePresence>
                {showNewAliadoModal && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-navy border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl"
                        >
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                                Registrar Nuevo Aliado / Influencer
                            </h2>

                            <form onSubmit={handleCreateAliado} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-white/60 text-xs font-black uppercase mb-1 block">Nombre / Creador</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Juan Gastronómico"
                                        value={newAliado.nombre}
                                        onChange={(e) => setNewAliado({ ...newAliado, nombre: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">WhatsApp</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="+593 99..."
                                            value={newAliado.whatsapp}
                                            onChange={(e) => setNewAliado({ ...newAliado, whatsapp: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">Código Único</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="JUANREST"
                                            value={newAliado.codigo}
                                            onChange={(e) => setNewAliado({ ...newAliado, codigo: e.target.value.toUpperCase() })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">Tipo de Aliado</label>
                                        <select
                                            value={newAliado.tipo}
                                            onChange={(e) => setNewAliado({ ...newAliado, tipo: e.target.value })}
                                            className="w-full bg-navy border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                        >
                                            <option value="influencer">Influencer / Creador</option>
                                            <option value="referidor">Referidor Directo</option>
                                            <option value="distribuidor">Distribuidor</option>
                                            <option value="agencia">Agencia Gastronómica</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">Mercado</label>
                                        <select
                                            value={newAliado.mercado_principal}
                                            onChange={(e) => setNewAliado({ ...newAliado, mercado_principal: e.target.value })}
                                            className="w-full bg-navy border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                        >
                                            <option value="EC">🇪🇨 Ecuador</option>
                                            <option value="ES">🇪🇸 España</option>
                                            <option value="US">🇺🇸 Estados Unidos</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">Tipo Comisión</label>
                                        <select
                                            value={newAliado.comision_tipo}
                                            onChange={(e) => setNewAliado({ ...newAliado, comision_tipo: e.target.value })}
                                            className="w-full bg-navy border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                        >
                                            <option value="porcentaje">Porcentaje (%)</option>
                                            <option value="monto_fijo">Monto Fijo ($)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">Valor Comisión</label>
                                        <input
                                            type="number"
                                            value={newAliado.comision_valor}
                                            onChange={(e) => setNewAliado({ ...newAliado, comision_valor: Number(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewAliadoModal(false)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-2xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-2xl shadow-orange transition-all"
                                    >
                                        Guardar Aliado
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: REGISTRAR RESTAURANTE EN PIPELINE */}
            <AnimatePresence>
                {showNewPipelineModal && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-navy border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl"
                        >
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                                Registrar Restaurante
                            </h2>

                            <form onSubmit={handleCreatePipeline} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-white/60 text-xs font-black uppercase mb-1 block">Nombre del Restaurante</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Asados Don Pepe"
                                        value={newPipeline.nombre_restaurante}
                                        onChange={(e) => setNewPipeline({ ...newPipeline, nombre_restaurante: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">Contacto (Dueño/Chef)</label>
                                        <input
                                            type="text"
                                            placeholder="Nombre contacto"
                                            value={newPipeline.contacto_nombre}
                                            onChange={(e) => setNewPipeline({ ...newPipeline, contacto_nombre: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">WhatsApp / Teléfono</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="+593 99..."
                                            value={newPipeline.contacto_telefono}
                                            onChange={(e) => setNewPipeline({ ...newPipeline, contacto_telefono: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">Ciudad</label>
                                        <input
                                            type="text"
                                            placeholder="Quito, Madrid, Miami..."
                                            value={newPipeline.ciudad}
                                            onChange={(e) => setNewPipeline({ ...newPipeline, ciudad: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">Código Aliado (Opcional)</label>
                                        <input
                                            type="text"
                                            placeholder="JUANREST"
                                            value={newPipeline.aliado_codigo}
                                            onChange={(e) => setNewPipeline({ ...newPipeline, aliado_codigo: e.target.value.toUpperCase() })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="es10casos"
                                        checked={newPipeline.es_candidato_10_casos}
                                        onChange={(e) => setNewPipeline({ ...newPipeline, es_candidato_10_casos: e.target.checked })}
                                        className="w-4 h-4 accent-amber-400"
                                    />
                                    <label htmlFor="es10casos" className="text-xs text-amber-300 font-bold cursor-pointer">
                                        Asignar al Programa de los 10 Casos de Éxito ($500)
                                    </label>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPipelineModal(false)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-2xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-2xl shadow-orange transition-all"
                                    >
                                        Registrar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
