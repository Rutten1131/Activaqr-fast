"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Utensils,
    Camera,
    Mic,
    MicOff,
    Upload,
    CheckCircle2,
    X,
    Play,
    Pause,
    Trash2,
    Send,
    FileText,
    MapPin,
    Phone,
    Instagram,
    Sparkles,
    AlertCircle,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    uuid: string;
}

export default function RestaurantOnboardingClient({ uuid }: Props) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form fields
    const [nombreRestaurante, setNombreRestaurante] = useState("");
    const [telefonoContacto, setTelefonoContacto] = useState("");
    const [direccionFisica, setDireccionFisica] = useState("");
    const [instagram, setInstagram] = useState("");
    const [tiktok, setTiktok] = useState("");
    const [observaciones, setObservaciones] = useState("");

    // Media Arrays
    const [cartaFotos, setCartaFotos] = useState<string[]>([]);
    const [platosFotos, setPlatosFotos] = useState<string[]>([]);
    const [audios, setAudios] = useState<string[]>([]);

    // Audio Recorder State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    // Fetch existing draft
    useEffect(() => {
        const loadOnboarding = async () => {
            try {
                const res = await fetch(`/api/onboarding-menu?uuid=${uuid}`);
                const data = await res.json();
                if (data.success && data.data) {
                    const item = data.data;
                    setNombreRestaurante(item.nombre_restaurante || item.pipeline_nombre || "");
                    setTelefonoContacto(item.telefono_contacto || item.contacto_telefono || "");
                    setDireccionFisica(item.direccion_fisica || "");
                    if (item.redes_sociales) {
                        const redes = typeof item.redes_sociales === "string" ? JSON.parse(item.redes_sociales) : item.redes_sociales;
                        setInstagram(redes.instagram || "");
                        setTiktok(redes.tiktok || "");
                    }
                    if (item.carta_fotos) {
                        setCartaFotos(typeof item.carta_fotos === "string" ? JSON.parse(item.carta_fotos) : item.carta_fotos);
                    }
                    if (item.platos_fotos) {
                        setPlatosFotos(typeof item.platos_fotos === "string" ? JSON.parse(item.platos_fotos) : item.platos_fotos);
                    }
                    if (item.audios_descripcion) {
                        setAudios(typeof item.audios_descripcion === "string" ? JSON.parse(item.audios_descripcion) : item.audios_descripcion);
                    }
                    setObservaciones(item.observaciones || "");
                    if (item.estado === "enviado" || item.estado === "completado") {
                        setSubmitted(true);
                    }
                }
            } catch (err) {
                console.error("Error loading onboarding:", err);
            } finally {
                setLoading(false);
            }
        };
        loadOnboarding();
    }, [uuid]);

    // Handle Image Uploads
    const handleFileUpload = async (files: FileList | null, target: "carta" | "platos") => {
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fd = new FormData();
            fd.append("file", file);
            fd.append("slug", "onboarding");

            try {
                const res = await fetch("/api/upload", { method: "POST", body: fd });
                if (res.ok) {
                    const { url } = await res.json();
                    if (target === "carta") {
                        setCartaFotos((prev) => [...prev, url]);
                    } else {
                        setPlatosFotos((prev) => [...prev, url]);
                    }
                }
            } catch (err) {
                console.error("Error uploading image:", err);
            }
        }
    };

    // Audio Recording Controls
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const audioFile = new File([audioBlob], `audio_platos_${Date.now()}.webm`, { type: "audio/webm" });
                
                const fd = new FormData();
                fd.append("file", audioFile);
                fd.append("slug", "onboarding_audios");

                try {
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    if (res.ok) {
                        const { url } = await res.json();
                        setAudios((prev) => [...prev, url]);
                    }
                } catch (err) {
                    console.error("Error uploading audio:", err);
                }
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            alert("No se pudo acceder al micrófono. Por favor permite los permisos de audio.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    // Submit Onboarding
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                uuid,
                nombre_restaurante: nombreRestaurante,
                telefono_contacto: telefonoContacto,
                direccion_fisica: direccionFisica,
                redes_sociales: { instagram, tiktok },
                carta_fotos: cartaFotos,
                platos_fotos: platosFotos,
                audios_descripcion: audios,
                observaciones,
                estado: "enviado",
            };

            const res = await fetch("/api/onboarding-menu", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                alert("Error al enviar la información. Inténtalo nuevamente.");
            }
        } catch (err) {
            console.error("Error submitting onboarding:", err);
            alert("Error de conexión al enviar.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center">
                <Loader2 size={36} className="text-primary animate-spin" />
            </div>
        );
    }

    if (submitted) {
        return (
            <main className="min-h-screen bg-navy text-white flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-navy-light/60 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={36} />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">¡Información Recibida!</h1>
                    <p className="text-white/60 text-sm">
                        Hemos recibido todos los materiales y notas de tu restaurante. Nuestro equipo está estructurando tu Menú Interactivo de alta conversión.
                    </p>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl w-full text-xs text-white/50 font-medium">
                        Te contactaremos por WhatsApp ({telefonoContacto}) apenas tu menú esté listo para tu revisión.
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-navy text-white py-8 px-4 md:px-8">
            <div className="max-w-3xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <header className="text-center flex flex-col items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/40 rounded-full text-primary text-xs font-black uppercase tracking-widest">
                        <Sparkles size={14} /> Lanzamiento de Menú Interactivo
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                        Entrega de Materiales del Restaurante
                    </h1>
                    <p className="text-white/60 text-sm max-w-xl">
                        Sube las fotos de tu carta física y graba notas de voz explicando tus platos. Nosotros nos encargamos de todo el armado.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* SECCIÓN 1: DATOS BÁSICOS */}
                    <div className="bg-navy-light/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col gap-4">
                        <h2 className="text-lg font-black uppercase tracking-wide flex items-center gap-2 text-white">
                            <Utensils size={18} className="text-primary" /> 1. Datos del Restaurante
                        </h2>

                        <div>
                            <label className="text-white/60 text-xs font-black uppercase mb-1 block">Nombre del Restaurante</label>
                            <input
                                type="text"
                                required
                                value={nombreRestaurante}
                                onChange={(e) => setNombreRestaurante(e.target.value)}
                                placeholder="Ej: La Parrilla de Don Carlos"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-white/60 text-xs font-black uppercase mb-1 block">WhatsApp de Contacto</label>
                                <input
                                    type="text"
                                    required
                                    value={telefonoContacto}
                                    onChange={(e) => setTelefonoContacto(e.target.value)}
                                    placeholder="+593 99..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-white/60 text-xs font-black uppercase mb-1 block">Dirección Física (Ciudad / Calle)</label>
                                <input
                                    type="text"
                                    value={direccionFisica}
                                    onChange={(e) => setDireccionFisica(e.target.value)}
                                    placeholder="Av. Principal y Secundaria"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-white/60 text-xs font-black uppercase mb-1 block">Instagram (Opcional)</label>
                                <input
                                    type="text"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    placeholder="@mirestaurante"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-white/60 text-xs font-black uppercase mb-1 block">TikTok (Opcional)</label>
                                <input
                                    type="text"
                                    value={tiktok}
                                    onChange={(e) => setTiktok(e.target.value)}
                                    placeholder="@mirestaurante"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: FOTOS DE LA CARTA FÍSICA */}
                    <div className="bg-navy-light/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-wide flex items-center gap-2 text-white">
                                    <FileText size={18} className="text-primary" /> 2. Fotos de tu Carta o Menú Físico
                                </h2>
                                <p className="text-white/50 text-xs mt-1">
                                    Toma fotos legibles de todas las páginas de tu menú actual con precios.
                                </p>
                            </div>
                        </div>

                        <label className="border-2 border-dashed border-white/20 hover:border-primary/50 bg-white/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                            <Upload size={24} className="text-primary" />
                            <span className="text-xs font-black uppercase tracking-wider text-white">Seleccionar Fotos de la Carta</span>
                            <span className="text-[11px] text-white/40">JPG, PNG o WEBP (puedes subir varias)</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files, "carta")}
                            />
                        </label>

                        {cartaFotos.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                                {cartaFotos.map((img, idx) => (
                                    <div key={idx} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group">
                                        <img src={img} alt={`Carta ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setCartaFotos((prev) => prev.filter((_, i) => i !== idx))}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 transition-all"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 3: GRABACIÓN DE VOZ (CHEF / DUEÑO) */}
                    <div className="bg-navy-light/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-wide flex items-center gap-2 text-white">
                                    <Mic size={18} className="text-primary" /> 3. Notas de Voz Explicando tus Platos
                                </h2>
                                <p className="text-white/50 text-xs mt-1">
                                    Graba un audio diciendo: <em>"Nuestra especialidad es el lomo a la piedra con salsa de la casa, incluye papas rústicas..."</em>.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl gap-4">
                            {isRecording ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-500 animate-pulse">
                                        <Mic size={28} />
                                    </div>
                                    <span className="font-mono text-sm font-black text-red-400">
                                        Grabando: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={stopRecording}
                                        className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                                    >
                                        Detener y Guardar Audio
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    className="px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 shadow-orange transition-all hover:scale-105"
                                >
                                    <Mic size={18} />
                                    Grabar Nota de Voz del Menú
                                </button>
                            )}
                        </div>

                        {audios.length > 0 && (
                            <div className="flex flex-col gap-2 pt-2">
                                <span className="text-xs font-black uppercase text-white/50">Audios Grabados ({audios.length})</span>
                                {audios.map((audioUrl, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl">
                                        <audio controls src={audioUrl} className="h-8 max-w-xs" />
                                        <button
                                            type="button"
                                            onClick={() => setAudios((prev) => prev.filter((_, i) => i !== idx))}
                                            className="p-2 text-red-400 hover:text-red-300 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 4: FOTOS DE PLATOS (OPCIONAL) */}
                    <div className="bg-navy-light/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col gap-4">
                        <h2 className="text-lg font-black uppercase tracking-wide flex items-center gap-2 text-white">
                            <Camera size={18} className="text-primary" /> 4. Fotos de tus Platos Estrella (Opcional)
                        </h2>

                        <label className="border-2 border-dashed border-white/20 hover:border-primary/50 bg-white/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                            <Camera size={24} className="text-primary" />
                            <span className="text-xs font-black uppercase tracking-wider text-white">Subir Fotos de Platos</span>
                            <span className="text-[11px] text-white/40">Platos servidos, bebidas o postres</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files, "platos")}
                            />
                        </label>

                        {platosFotos.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                                {platosFotos.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                                        <img src={img} alt={`Plato ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setPlatosFotos((prev) => prev.filter((_, i) => i !== idx))}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 transition-all"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 5: OBSERVACIONES */}
                    <div className="bg-navy-light/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl flex flex-col gap-4">
                        <label className="text-white/60 text-xs font-black uppercase mb-1 block">Observaciones o Instrucciones Especiales</label>
                        <textarea
                            rows={3}
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Ej: Solo abrimos de jueves a domingo, los precios ya incluyen IVA..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
                        />
                    </div>

                    {/* Botón Enviar */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-5 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest rounded-3xl shadow-orange flex items-center justify-center gap-3 transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Send size={20} />
                                Enviar Materiales del Restaurante
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
