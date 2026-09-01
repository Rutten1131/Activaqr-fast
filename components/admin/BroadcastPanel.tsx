"use client";

import { useState, useEffect } from "react";
import { 
    Send, 
    Image, 
    Video, 
    Music, 
    FileText, 
    Loader2, 
    CheckCircle, 
    AlertTriangle, 
    Users, 
    Clock,
    X,
    Upload
} from "lucide-react";

interface Recipient {
    id: string;
    slug?: string;
    nombre: string;
    whatsapp: string;
    plan: string;
    status: string;
}

interface BroadcastPanelProps {
    onClose: () => void;
    adminKey: string;
}

export default function BroadcastPanel({ onClose, adminKey }: BroadcastPanelProps) {
    // Form states
    const [message, setMessage] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["pagado", "entregado"]);
    const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
    const [sendLimit, setSendLimit] = useState<number | ''>('');
    const [delayMs, setDelayMs] = useState(5000);
    
    // Media attachment states
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
    const [dynamicQr, setDynamicQr] = useState(false);

    // Audience states
    const [loadingAudience, setLoadingAudience] = useState(false);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    
    // Execution states
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, sent: 0, failed: 0 });
    const [logs, setLogs] = useState<string[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);

    // Audience Mode: 'test' | 'registered' | 'custom'
    const [audienceMode, setAudienceMode] = useState<'test' | 'registered' | 'custom'>('test');
    const [testNumber, setTestNumber] = useState("593967491847");
    const [testName, setTestName] = useState("César Reyes");
    const [customText, setCustomText] = useState("");
    const [customList, setCustomList] = useState<Recipient[]>([]);

    // Ecuador clock state
    const [ecuadorTime, setEcuadorTime] = useState("");
    const [isWithinSchedule, setIsWithinSchedule] = useState(true);

    // Helper: Robust CSV & text parser (Supports Google Contacts CSV, Outlook, Excel & plain lists)
    const parseContacts = (raw: string): Recipient[] => {
        if (!raw || !raw.trim()) return [];

        // 1. Parse CSV with quotes handling
        const parseCSV = (text: string): string[][] => {
            const rows: string[][] = [];
            let currentRow: string[] = [];
            let currentField = '';
            let insideQuotes = false;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const nextChar = text[i + 1];

                if (char === '"') {
                    if (insideQuotes && nextChar === '"') {
                        currentField += '"';
                        i++;
                    } else {
                        insideQuotes = !insideQuotes;
                    }
                } else if (char === ',' && !insideQuotes) {
                    currentRow.push(currentField.trim());
                    currentField = '';
                } else if ((char === '\r' || char === '\n') && !insideQuotes) {
                    if (char === '\r' && nextChar === '\n') i++;
                    currentRow.push(currentField.trim());
                    if (currentRow.some(c => c.length > 0)) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                } else {
                    currentField += char;
                }
            }

            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());
                if (currentRow.some(c => c.length > 0)) {
                    rows.push(currentRow);
                }
            }

            return rows;
        };

        const rows = parseCSV(raw);
        if (rows.length === 0) return [];

        const list: Recipient[] = [];
        const header = rows[0].map(h => h.toLowerCase());

        // Check if row 0 is a Google Contacts or standard CSV header
        const firstNameIdx = header.findIndex(h => /first\s*name|primer\s*nombre|^nombre$/i.test(h));
        const middleNameIdx = header.findIndex(h => /middle\s*name|segundo\s*nombre/i.test(h));
        const lastNameIdx = header.findIndex(h => /last\s*name|apellido/i.test(h));
        const orgIdx = header.findIndex(h => /organization\s*name|empresa|negocio|company/i.test(h));
        
        // Look for phone columns
        const phoneIdxs = header.map((h, i) => 
            /phone|telefono|teléfono|celular|whatsapp|mobile|móvil/i.test(h) ? i : -1
        ).filter(i => i !== -1);

        const isStructuredHeader = firstNameIdx !== -1 || phoneIdxs.length > 0 || orgIdx !== -1;

        if (isStructuredHeader && rows.length > 1) {
            // Structured CSV Mode (e.g. Google Contacts)
            for (let r = 1; r < rows.length; r++) {
                const row = rows[r];
                if (row.length === 0) continue;

                // Extract name
                const firstName = firstNameIdx !== -1 ? row[firstNameIdx] : '';
                const middleName = middleNameIdx !== -1 ? row[middleNameIdx] : '';
                const lastName = lastNameIdx !== -1 ? row[lastNameIdx] : '';
                const orgName = orgIdx !== -1 ? row[orgIdx] : '';
                
                let name = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
                if (!name && orgName) name = orgName.trim();

                // Extract phone number from designated phone columns or search entire row
                let phone = '';
                for (const pIdx of phoneIdxs) {
                    if (row[pIdx]) {
                        const digits = row[pIdx].replace(/\D/g, '');
                        if (digits.length >= 8) {
                            phone = row[pIdx].trim();
                            break;
                        }
                    }
                }

                // If not found in known phone columns, search any cell in the row
                if (!phone) {
                    for (const cell of row) {
                        const digits = cell.replace(/\D/g, '');
                        if (digits.length >= 8 && digits.length <= 15 && (cell.startsWith('+') || cell.startsWith('0') || cell.startsWith('593') || cell.includes('-'))) {
                            phone = cell.trim();
                            break;
                        }
                    }
                }

                if (phone) {
                    const cleanDigits = phone.replace(/\D/g, '');
                    if (cleanDigits.length >= 8) {
                        list.push({
                            id: `custom-${r}-${Date.now()}`,
                            nombre: name || `Contacto ${r}`,
                            whatsapp: phone,
                            plan: 'manual',
                            status: 'manual'
                        });
                    }
                }
            }
        } else {
            // Plain text or simple 2-column format (e.g. "Juan Perez, 0991234567")
            const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            lines.forEach((line, idx) => {
                if (/^(first\s*name|nombre|name|cliente|telefono|phone|whatsapp)/i.test(line)) return;

                let name = "";
                let phone = "";

                if (line.includes(",") || line.includes(";") || line.includes("\t")) {
                    const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
                    if (parts.length >= 2) {
                        const part0Digits = parts[0].replace(/\D/g, "");
                        const part1Digits = parts[1].replace(/\D/g, "");

                        if (part0Digits.length >= 8 && part1Digits.length < 8) {
                            phone = parts[0];
                            name = parts[1];
                        } else {
                            name = parts[0];
                            phone = parts[1];
                        }
                    }
                } else {
                    phone = line;
                    name = `Contacto ${idx + 1}`;
                }

                const cleanDigits = phone.replace(/\D/g, "");
                if (cleanDigits.length >= 8) {
                    list.push({
                        id: `custom-${idx}-${Date.now()}`,
                        nombre: name || `Contacto ${idx + 1}`,
                        whatsapp: phone,
                        plan: 'manual',
                        status: 'manual'
                    });
                }
            });
        }

        return list;
    };

    // Parse custom text whenever it changes
    useEffect(() => {
        if (audienceMode === 'custom') {
            const parsed = parseContacts(customText);
            setCustomList(parsed);
            setRecipients(parsed);
        }
    }, [customText, audienceMode]);

    // Handle CSV / TXT upload for custom contacts
    const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                setCustomText(content);
                addLog(`📂 Archivo de contactos cargado: ${file.name}`);
            }
        };
        reader.readAsText(file);
    };

    // Download sample CSV template
    const downloadSampleCSV = () => {
        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent("Nombre,Telefono\nCarlos Gomez,0991234567\nMaria Perez,+593987654321\nJuan Lopez,0985551234");
        const link = document.createElement("a");
        link.setAttribute("href", csvContent);
        link.setAttribute("download", "ejemplo_contactos_activaqr.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addLog("📥 Plantilla CSV de ejemplo descargada.");
    };

    // Update Ecuador clock every second
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const ecuadorStr = now.toLocaleString('es-EC', {
                timeZone: 'America/Guayaquil',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            });
            setEcuadorTime(ecuadorStr);

            const ecuadorDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
            const h = ecuadorDate.getHours();
            setIsWithinSchedule(h >= 8 && h < 20);
        };

        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Load preview audience when mode, filters or test settings change
    useEffect(() => {
        if (audienceMode === 'test') {
            setRecipients([{
                id: 'test-id',
                nombre: testName || 'Cliente de Prueba',
                whatsapp: testNumber,
                plan: 'test',
                status: 'test'
            }]);
        } else if (audienceMode === 'custom') {
            setRecipients(customList);
        } else if (selectedStatuses.length > 0) {
            fetchPreview();
        } else {
            setRecipients([]);
        }
    }, [audienceMode, selectedStatuses, selectedPlans, testNumber, testName, customList]);

    const fetchPreview = async () => {
        setLoadingAudience(true);
        try {
            const planQuery = selectedPlans.length > 0 ? `&plans=${selectedPlans.join(",")}` : "";
            const res = await fetch(`/api/admin/broadcast?statuses=${selectedStatuses.join(",")}${planQuery}`, {
                headers: { 'x-admin-key': adminKey }
            });
            const data = await res.json();
            if (res.ok) {
                let list = data.recipients || [];
                setRecipients(list);
            } else {
                addLog(`Error preview: ${data.error}`);
            }
        } catch (err: any) {
            addLog(`Error de conexión al cargar preview: ${err.message}`);
        } finally {
            setLoadingAudience(false);
        }
    };

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const handleStatusToggle = (status: string) => {
        setSelectedStatuses(prev => 
            prev.includes(status) 
                ? prev.filter(s => s !== status) 
                : [...prev, status]
        );
    };

    const handlePlanToggle = (plan: string) => {
        setSelectedPlans(prev => 
            prev.includes(plan) 
                ? prev.filter(p => p !== plan) 
                : [...prev, plan]
        );
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setMediaFile(file);
        setUploading(true);
        addLog(`Subiendo archivo: ${file.name}...`);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/broadcast/upload", {
                method: "POST",
                headers: { 'x-admin-key': adminKey },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setUploadedUrl(data.url);
                setMediaType(data.mediaType);
                addLog(`✓ Archivo subido con éxito a Bunny CDN.`);
            } else {
                setMediaFile(null);
                alert(`Error al subir: ${data.error}`);
                addLog(`❌ Error subida: ${data.error}`);
            }
        } catch (err: any) {
            setMediaFile(null);
            alert(`Error de conexión: ${err.message}`);
            addLog(`❌ Error conexión subida: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = () => {
        setMediaFile(null);
        setUploadedUrl(null);
        setMediaType(null);
        addLog("Adjunto removido.");
    };

    const handleDynamicQrToggle = () => {
        const next = !dynamicQr;
        setDynamicQr(next);
        if (next) {
            // Clear any static attachment when enabling dynamic QR
            setMediaFile(null);
            setUploadedUrl(null);
            setMediaType(null);
            addLog("✅ QR Dinámico activado: se enviará el QR personalizado de cada cliente.");
        } else {
            addLog("QR Dinámico desactivado.");
        }
    };

    const handleStartBroadcast = () => {
        if (!message.trim()) {
            alert("Por favor escribe un mensaje.");
            return;
        }
        if (recipients.length === 0) {
            alert("No hay destinatarios seleccionados.");
            return;
        }
        setShowConfirm(true);
    };

    const executeBroadcast = async () => {
        setShowConfirm(false);
        setSending(true);
        setLogs([]);

        const BATCH_SIZE = 5; // 5 per API call to stay within Vercel timeout
        const BATCH_PAUSE_MIN = 15000; // 15s minimum between batches
        const BATCH_PAUSE_MAX = 30000; // 30s maximum between batches

        let totalSent = 0;
        let totalFailed = 0;
        let finalRecipients = [...recipients];
        // Apply limit if specified
        if (sendLimit && typeof sendLimit === 'number' && sendLimit > 0) {
            finalRecipients = finalRecipients.slice(0, sendLimit);
        }

        setSending(true);
        setProgress({ current: 0, total: finalRecipients.length, sent: 0, failed: 0 });
        setLogs([]);
        setShowConfirm(false);

        addLog(`🚀 Iniciando envío masivo a ${finalRecipients.length} clientes...`);
        addLog(`📦 Dividido en lotes de ${BATCH_SIZE} con pausas de ${BATCH_PAUSE_MIN / 1000}-${BATCH_PAUSE_MAX / 1000}s entre lotes.`);

        // Split recipients into micro-batches
        const batches: typeof finalRecipients[] = [];
        for (let i = 0; i < finalRecipients.length; i += BATCH_SIZE) {
            batches.push(finalRecipients.slice(i, i + BATCH_SIZE));
        }

        for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
            const batch = batches[batchIdx];
            const batchNum = batchIdx + 1;

            addLog(`📨 Lote ${batchNum}/${batches.length}: Enviando a ${batch.length} destinatarios...`);

            try {
                const res = await fetch("/api/admin/broadcast", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-admin-key": adminKey
                    },
                    body: JSON.stringify({
                        message,
                        mediaUrl: dynamicQr ? undefined : uploadedUrl,
                        mediaType: dynamicQr ? undefined : mediaType,
                        dynamicQr,
                        recipientIds: audienceMode === 'registered' ? batch.map(r => r.id) : undefined,
                        customRecipients: audienceMode === 'custom' ? batch.map(r => ({ id: r.id, nombre: r.nombre, whatsapp: r.whatsapp })) : undefined,
                        statuses: selectedStatuses,
                        delayMs,
                        testNumber: audienceMode === 'test' ? testNumber : undefined,
                        testName: audienceMode === 'test' ? testName : undefined
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    totalSent += data.sent || 0;
                    totalFailed += data.failed || 0;

                    setProgress({
                        current: Math.min((batchIdx + 1) * BATCH_SIZE, finalRecipients.length),
                        total: finalRecipients.length,
                        sent: totalSent,
                        failed: totalFailed
                    });

                    if (data.results) {
                        data.results.forEach((r: any) => {
                            if (r.status === 'sent') {
                                addLog(`  ✓ ${r.nombre} (${r.whatsapp})`);
                            } else {
                                addLog(`  ❌ ${r.nombre}: ${r.error || 'Error desconocido'}`);
                            }
                        });
                    }
                    addLog(`  ✅ Lote ${batchNum} completado: ${data.sent} enviados, ${data.failed} fallidos`);
                } else {
                    addLog(`  ❌ Lote ${batchNum} falló: ${data.error}`);
                    totalFailed += batch.length;
                }
            } catch (err: any) {
                addLog(`  ❌ Lote ${batchNum} error de red: ${err.message}`);
                totalFailed += batch.length;
            }

            // If test mode, only one batch (1 recipient)
            if (audienceMode === 'test') break;

            // Pause between batches (except after the last one)
            if (batchIdx < batches.length - 1) {
                const pauseMs = BATCH_PAUSE_MIN + Math.floor(Math.random() * (BATCH_PAUSE_MAX - BATCH_PAUSE_MIN));
                addLog(`⏳ Pausa de ${(pauseMs / 1000).toFixed(0)}s antes del siguiente lote...`);
                await new Promise(resolve => setTimeout(resolve, pauseMs));
            }
        }

        setProgress({ current: finalRecipients.length, total: finalRecipients.length, sent: totalSent, failed: totalFailed });
        addLog(`🎉 Campaña finalizada. Total enviados: ${totalSent}, Fallidos: ${totalFailed} de ${finalRecipients.length}`);
        setSending(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#050B1C]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0A1229] border border-white/10 rounded-[30px] w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl relative overflow-hidden">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Envío Masivo WhatsApp</h2>
                            </div>
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Broadcast Engine (Evolution API)</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Ecuador Clock */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold ${
                                isWithinSchedule
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                                <Clock size={14} />
                                <span>ECU {ecuadorTime}</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${isWithinSchedule ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                            </div>
                            <button 
                                onClick={onClose} 
                                disabled={sending}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    {/* Schedule warning banner */}
                    {!isWithinSchedule && (
                        <div className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-3">
                            <AlertTriangle size={18} className="text-red-400 shrink-0" />
                            <p className="text-xs text-red-300">
                                <span className="font-black">Fuera de horario.</span> Solo se permite enviar entre <span className="font-mono font-bold">08:00</span> y <span className="font-mono font-bold">20:00</span> hora Ecuador. Hora actual: <span className="font-mono font-bold">{ecuadorTime}</span>
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Step-by-Step Dashboard layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Config & Compose */}
                        <div className="space-y-6">
                            {/* Audiencia */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary block">1. Audiencia / Destinatarios</label>
                                </div>

                                {/* Mode Switcher Tabs */}
                                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl mb-4">
                                    <button
                                        type="button"
                                        disabled={sending}
                                        onClick={() => setAudienceMode('test')}
                                        className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center ${
                                            audienceMode === 'test'
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg'
                                                : 'text-white/40 hover:text-white'
                                        }`}
                                    >
                                        🧪 Probar Mi Número
                                    </button>
                                    <button
                                        type="button"
                                        disabled={sending}
                                        onClick={() => setAudienceMode('custom')}
                                        className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center ${
                                            audienceMode === 'custom'
                                                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 shadow-lg'
                                                : 'text-white/40 hover:text-white'
                                        }`}
                                    >
                                        📋 Lista Manual / CSV
                                    </button>
                                    <button
                                        type="button"
                                        disabled={sending}
                                        onClick={() => setAudienceMode('registered')}
                                        className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center ${
                                            audienceMode === 'registered'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg'
                                                : 'text-white/40 hover:text-white'
                                        }`}
                                    >
                                        👥 Clientes BD
                                    </button>
                                </div>

                                {audienceMode === 'test' && (
                                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-3">
                                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Enviar únicamente a tu WhatsApp de pruebas:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest block mb-1">Nombre Prueba:</label>
                                                <input
                                                    type="text"
                                                    value={testName}
                                                    onChange={(e) => setTestName(e.target.value)}
                                                    placeholder="Ej: César Reyes"
                                                    disabled={sending}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500/40"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest block mb-1">WhatsApp:</label>
                                                <input
                                                    type="text"
                                                    value={testNumber}
                                                    onChange={(e) => setTestNumber(e.target.value)}
                                                    placeholder="Ej: 593967491847"
                                                    disabled={sending}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-red-500/40"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-white/30">
                                            Ideal para verificar cómo llega la plantilla, saltos de línea y archivos multimedia antes de enviar a clientes.
                                        </p>
                                    </div>
                                )}

                                {audienceMode === 'custom' && (
                                    <div className="bg-[#00F0FF]/5 border border-[#00F0FF]/20 rounded-2xl p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] text-[#00F0FF] font-black uppercase tracking-wider">Pegar o Subir Contactos:</p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={downloadSampleCSV}
                                                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-lg text-[9px] font-bold text-white/70 hover:text-white flex items-center gap-1 transition-all"
                                                >
                                                    📥 Descargar Ejemplo
                                                </button>
                                                <label className="cursor-pointer bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] px-2.5 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition-all">
                                                    <Upload size={12} />
                                                    Subir CSV / TXT
                                                    <input
                                                        type="file"
                                                        accept=".csv,.txt"
                                                        className="hidden"
                                                        onChange={handleCustomFileUpload}
                                                        disabled={sending}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <textarea
                                            value={customText}
                                            onChange={(e) => setCustomText(e.target.value)}
                                            placeholder={"Formato por línea:\nJuan Perez, 0991234567\nMaría Gómez, 593987654321\n0985551234"}
                                            rows={4}
                                            disabled={sending}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder-white/20 outline-none focus:border-[#00F0FF]/40 resize-none"
                                        />

                                        <div className="flex justify-between items-center text-[9px] text-white/40">
                                            <span>Formatos: <strong className="text-white/60">Nombre, Teléfono</strong> o solo <strong className="text-white/60">Teléfono</strong></span>
                                            {customList.length > 0 && (
                                                <span className="text-[#00F0FF] font-bold">✓ {customList.length} contactos detectados</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {audienceMode === 'registered' && (
                                    <div className="space-y-4">
                                        <div className="flex gap-2 flex-wrap">
                                            {["pagado", "entregado", "pendiente"].map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    disabled={sending}
                                                    onClick={() => handleStatusToggle(status)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                                                        selectedStatuses.includes(status)
                                                            ? status === 'pendiente' 
                                                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" 
                                                                : status === 'pagado'
                                                                    ? "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30"
                                                                    : "bg-green-500/10 text-green-500 border-green-500/30"
                                                            : "bg-white/5 text-white/30 border-white/10 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        status === 'pendiente' ? "bg-yellow-500" : status === 'pagado' ? "bg-[#00F0FF]" : "bg-green-500"
                                                    }`} />
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {["digital", "catalog", "pro", "business"].map((plan) => (
                                                <button
                                                    key={plan}
                                                    type="button"
                                                    disabled={sending}
                                                    onClick={() => handlePlanToggle(plan)}
                                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${
                                                        selectedPlans.includes(plan)
                                                            ? "bg-primary/20 text-primary border-primary/40"
                                                            : "bg-white/5 text-white/30 border-white/10 hover:bg-white/10"
                                                    }`}
                                                >
                                                    {plan}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Límite de envíos:</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={sendLimit}
                                                onChange={(e) => setSendLimit(e.target.value === '' ? '' : parseInt(e.target.value))}
                                                placeholder="Todos"
                                                disabled={sending}
                                                className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs font-mono text-white outline-none focus:border-primary/40"
                                            />
                                        </div>
                                        {statusFilterWarning(selectedStatuses) && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl p-3 flex gap-2 items-start text-[10px]">
                                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                                <span>Recomendamos enviar solo a <strong>pagado</strong> o <strong>entregado</strong> para evitar spam no deseado.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Mensaje */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary block mb-3">2. Componer Mensaje</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Hola {nombre} 👋, te escribo para..."
                                    disabled={sending}
                                    rows={5}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-white/20 outline-none focus:border-primary/40 transition-all resize-none"
                                />
                                <div className="text-[9px] text-white/30 text-right mt-1 font-mono">
                                    Caracteres: {message.length}
                                </div>
                            </div>

                            {/* Adjuntar Media */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary block mb-3">3. Adjuntar Media (Opcional)</label>

                                {/* Dynamic QR Toggle */}
                                <button
                                    type="button"
                                    onClick={handleDynamicQrToggle}
                                    disabled={sending}
                                    className={`w-full mb-3 flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
                                        dynamicQr
                                            ? 'bg-primary/10 border-primary/40 text-primary'
                                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">📲</span>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest">QR Dinámico de Contacto</p>
                                            <p className="text-[9px] opacity-60">Envía el QR personalizado de WhatsApp de cada cliente</p>
                                        </div>
                                    </div>
                                    <div className={`w-8 h-4 rounded-full transition-all relative ${
                                        dynamicQr ? 'bg-primary' : 'bg-white/20'
                                    }`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                                            dynamicQr ? 'left-4' : 'left-0.5'
                                        }`} />
                                    </div>
                                </button>

                                {!dynamicQr && (
                                    !mediaFile ? (
                                        <label className="border border-dashed border-white/10 hover:border-primary/40 hover:bg-white/5 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                                            <Upload className="text-white/30 mb-2" size={24} />
                                            <span className="text-xs font-bold text-white/50">Subir Imagen, Video o Audio</span>
                                            <span className="text-[9px] text-white/30 mt-1">Límite de tamaño: 16MB</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,video/*,audio/*"
                                                onChange={handleFileChange}
                                                disabled={sending}
                                            />
                                        </label>
                                    ) : (
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {mediaType === 'image' && <Image className="text-primary shrink-0" size={20} />}
                                                {mediaType === 'video' && <Video className="text-primary shrink-0" size={20} />}
                                                {mediaType === 'audio' && <Music className="text-primary shrink-0" size={20} />}
                                                <div className="truncate">
                                                    <p className="text-xs font-bold truncate">{mediaFile.name}</p>
                                                    <p className="text-[9px] text-white/30 font-mono">
                                                        {(mediaFile.size / 1024 / 1024).toFixed(2)} MB - {mediaType}
                                                    </p>
                                                </div>
                                            </div>
                                            {uploading ? (
                                                <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                                            ) : (
                                                <button
                                                    onClick={removeAttachment}
                                                    disabled={sending}
                                                    className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Delay */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary block">4. Delay entre mensajes</label>
                                    <span className="text-xs font-mono font-bold text-white/60">{(delayMs / 1000).toFixed(1)} segundos</span>
                                </div>
                                <input
                                    type="range"
                                    min="3000"
                                    max="15000"
                                    step="500"
                                    value={delayMs}
                                    onChange={(e) => setDelayMs(Number(e.target.value))}
                                    disabled={sending}
                                    className="w-full accent-primary bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Column 2: Audience Preview & Console logs */}
                        <div className="flex flex-col h-full space-y-6">
                            {/* Audience Preview Stats */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white/80">Destinatarios Seleccionados</h3>
                                    {loadingAudience ? (
                                        <Loader2 size={14} className="animate-spin text-primary" />
                                    ) : (
                                        <div className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                            <Users size={12} />
                                            {recipients.length}
                                        </div>
                                    )}
                                </div>

                                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 text-xs">
                                    {recipients.length === 0 ? (
                                        <p className="text-white/30 text-center py-4 italic">Ningún destinatario coincide con el filtro.</p>
                                    ) : (
                                        recipients.map((r) => (
                                            <div key={r.id} className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                                                <div>
                                                    <p className="font-bold truncate max-w-[150px]">{r.nombre}</p>
                                                    <p className="text-[9px] text-white/40 font-mono">{r.whatsapp}</p>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded border border-white/10 font-bold uppercase">{r.plan}</span>
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        r.status === 'pendiente' ? "bg-yellow-500" : r.status === 'pagado' ? "bg-[#00F0FF]" : "bg-green-500"
                                                    }`} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Real-time progress / Logs console */}
                            <div className="flex-1 bg-black/40 border border-white/10 rounded-3xl p-6 flex flex-col min-h-[220px]">
                                <h3 className="text-xs font-black uppercase tracking-wider text-white/80 mb-3">Consola de Envío</h3>
                                
                                {sending && (
                                    <div className="mb-4 space-y-2">
                                        <div className="flex justify-between text-[10px] font-mono font-bold text-white/60">
                                            <span>Progreso: {progress.current} / {progress.total}</span>
                                            <span className="text-green-400">Éxitos: {progress.sent} | Fallas: {progress.failed}</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className="bg-primary h-full transition-all duration-300"
                                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto bg-black/20 rounded-2xl p-4 font-mono text-[10px] text-white/60 space-y-1.5 max-h-[160px]">
                                    {logs.length === 0 ? (
                                        <p className="text-white/20 italic">La consola está vacía. Lista para iniciar.</p>
                                    ) : (
                                        logs.map((log, idx) => (
                                            <p key={idx} className={
                                                log.includes('❌') ? "text-red-400" : 
                                                log.includes('✓') ? "text-green-400" : 
                                                log.includes('🎉') ? "text-primary font-bold" : ""
                                            }>
                                                {log}
                                            </p>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="px-8 py-6 bg-white/5 border-t border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        <Clock size={14} />
                        Lotes de 5 envíos con pausas de 15-30s
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={sending}
                            className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleStartBroadcast}
                            disabled={sending || uploading || recipients.length === 0 || !isWithinSchedule}
                            className="px-8 py-3 bg-primary text-navy hover:scale-105 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_10px_25px_rgba(255,107,0,0.2)] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {!isWithinSchedule ? 'Fuera de Horario' : 'Iniciar Envío'}
                        </button>
                    </div>
                </div>

                {/* Confirm Dialog */}
                {showConfirm && (
                    <div className="absolute inset-0 bg-[#050B1C]/90 flex items-center justify-center p-6 z-50">
                        <div className="bg-[#0A1229] border border-white/10 rounded-[30px] p-8 max-w-md text-center space-y-6">
                            <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle size={32} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black uppercase italic tracking-tighter">¿Iniciar Campaña?</h4>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    Se enviará este mensaje a <strong>{recipients.length}</strong> clientes activos. Esta acción no se puede deshacer.
                                </p>
                            </div>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={executeBroadcast}
                                    className="px-8 py-3 bg-primary text-navy rounded-2xl text-xs font-black uppercase tracking-widest"
                                >
                                    Sí, Enviar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function statusFilterWarning(statuses: string[]) {
    return statuses.includes("pendiente");
}
