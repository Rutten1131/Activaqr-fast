'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Award, 
    Gift, 
    QrCode, 
    CheckCircle2, 
    ShieldCheck, 
    Globe, 
    Trophy, 
    ExternalLink, 
    Phone, 
    Mail, 
    Printer, 
    Share2, 
    Check, 
    Sparkles,
    Calendar,
    MapPin,
    Layers,
    MessageSquare,
    Building2,
    Users,
    Vote,
    ChevronDown
} from 'lucide-react';

export default function PropuestaClient() {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        if (typeof window !== 'undefined') {
            const shareData = {
                title: 'Propuesta de Colaboración — 197.ª Feria de Loja | ActivaQR',
                text: 'Propuesta oficial de concurso para artesanos con votación digital y directorio de expositores para la 197.ª Feria de Loja.',
                url: window.location.href,
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    // Compartir cancelado por el usuario
                }
            } else {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#050B1C] text-white font-sans selection:bg-primary selection:text-white pb-20">
            {/* Top Bar - Actions */}
            <div className="bg-[#0A1229]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 px-4 py-3 print:hidden">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                    <Link 
                        href="/feria-loja" 
                        className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white transition-colors"
                    >
                        <ExternalLink size={14} className="text-primary" />
                        <span>Ver Directorio en Vivo</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-[#ff7b52] text-white text-xs font-bold transition-all shadow-md shadow-primary/20 hover:scale-105"
                        >
                            {copied ? <Check size={14} className="text-white" /> : <Share2 size={14} />}
                            <span>{copied ? '¡Enlace Copiado!' : 'Compartir Propuesta'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ HERO BANNER FULLSCREEN CON FOTO REAL DE LA FERIA ═══ */}
            <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
                {/* Real Feria de Loja Photo Background */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/feria-loja-aisle.jpg"
                        alt="197ª Feria de Loja"
                        className="w-full h-full object-cover object-center scale-105 filter brightness-[0.55]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050B1C] via-transparent to-black/20" />
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-lg">
                        <Trophy size={14} className="text-orange-400" />
                        <span>197.ª Feria de Loja • Iniciativa Oficial</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white drop-shadow-2xl">
                        Propuesta de Colaboración<br className="hidden sm:block" /> e Innovación Digital
                    </h1>
                    
                    <p className="text-white/90 text-sm sm:text-lg max-w-2xl mx-auto font-medium drop-shadow-lg">
                        Concurso para artesanos con votación digital, directorio interactivo y <strong className="text-primary font-black">$600 USD en premios tecnológicos</strong> aportados por ActivaQR.
                    </p>

                    <div className="pt-4">
                        <a
                            href="#propuesta"
                            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-primary hover:bg-[#ff7b52] text-white font-black text-sm uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(246,103,57,0.4)] hover:scale-105 hover:shadow-[0_15px_40px_rgba(246,103,57,0.5)]"
                        >
                            Ver Propuesta Completa
                            <ChevronDown size={18} />
                        </a>
                    </div>
                </div>

                {/* Bottom fade into content */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050B1C] to-transparent z-10 pointer-events-none" />
            </section>

            {/* Document Container */}
            <main id="propuesta" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 scroll-mt-4">
                {/* Official Letter Header */}
                <header className="bg-gradient-to-b from-[#0e1938] to-[#081026] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black shadow-inner">
                                <QrCode size={26} />
                            </div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-primary">Documento Formal</span>
                                <h2 className="text-lg font-black tracking-tight text-white">ActivaQR • Propuesta Institucional</h2>
                            </div>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                            <CheckCircle2 size={13} />
                            <span>100% Gratuito para la Feria</span>
                        </div>
                    </div>

                    {/* Recipient & Metadata Grid */}
                    <div className="grid sm:grid-cols-2 gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">Dirigida a:</span>
                            <p className="font-extrabold text-white text-base">Dr. Diego Guzmán</p>
                            <p className="text-white/70 text-xs font-medium">Director — 197.ª Feria de Loja</p>
                        </div>
                        <div className="sm:text-right flex flex-col justify-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">Lugar y Fecha:</span>
                            <p className="font-bold text-white/90">Loja, septiembre de 2026</p>
                            <p className="text-xs text-primary font-semibold flex items-center sm:justify-end gap-1 mt-0.5">
                                <CheckCircle2 size={13} />
                                Plataforma Lista y Operativa
                            </p>
                        </div>
                    </div>
                </header>

                {/* Letter Body / Introduction */}
                <div className="bg-[#0A1229]/60 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-xl space-y-10">
                    {/* Saludo y preámbulo */}
                    <div className="space-y-4 text-white/90 text-sm sm:text-base leading-relaxed border-b border-white/10 pb-8">
                        <p className="font-bold text-white text-base">De mi consideración:</p>
                        <p>
                            Por medio de la presente, me permito poner a consideración de la organización de la <strong>197.ª Feria de Loja</strong> una iniciativa que busca contribuir a la <strong>promoción y visibilidad digital de los artesanos, emprendedores y expositores participantes</strong>, mediante una dinámica de votación digital sencilla, participativa y <strong>completamente gratuita para ellos y para la organización</strong>.
                        </p>
                        <p>
                            La propuesta nace con la intención de generar una experiencia interactiva adicional para los visitantes de la feria y, al mismo tiempo, brindar a los expositores herramientas digitales que puedan continuar siendo útiles después del evento.
                        </p>
                    </div>

                    {/* 1. En qué consiste */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shrink-0">1</span>
                            <h2 className="text-lg sm:text-xl font-bold text-white">¿En qué consiste la propuesta?</h2>
                        </div>
                        <div className="pl-11 space-y-3 text-white/80 text-sm leading-relaxed">
                            <p>
                                Cada expositor participante contará con un <strong>código QR personalizado</strong> que conducirá a su <strong>ficha digital</strong>: una página con su información, fotografía, descripción de su trabajo, productos y ubicación dentro de la feria.
                            </p>
                            <p>
                                Durante los días del evento, los visitantes podrán escanear el código del expositor que deseen apoyar y registrar un <strong>voto digital, contabilizado automáticamente y en tiempo real</strong>.
                            </p>
                            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 text-white/90 flex items-start gap-3">
                                <Sparkles className="text-primary shrink-0 mt-0.5" size={18} />
                                <p className="text-xs sm:text-sm">
                                    De esta manera, los propios artesanos y expositores podrán invitar a sus clientes y visitantes a conocerlos y apoyarlos mediante esta dinámica de orgullo y participación.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 2. Un directorio digital de la feria */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shrink-0">2</span>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Un directorio digital de la feria</h2>
                        </div>
                        <div className="pl-11 space-y-4 text-white/80 text-sm leading-relaxed">
                            <p>
                                Las fichas de todos los expositores conformarán un <strong>directorio digital navegable de la 197.ª Feria de Loja</strong>: una guía en línea donde los visitantes podrán explorar participantes por categoría (artesanías, gastronomía, productos naturales, emprendimientos, etc.), conocer su historia y ubicarlos dentro del evento.
                            </p>
                            <p>
                                Este directorio quedará disponible en línea incluso después de finalizada la feria, constituyendo un <strong>registro digital perdurable del evento y de sus participantes</strong>.
                            </p>
                            <div>
                                <Link
                                    href="/feria-loja"
                                    target="_blank"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all hover:scale-105"
                                >
                                    <Globe size={15} className="text-primary" />
                                    <span>Ver demostración del Directorio ActivaQR</span>
                                    <ExternalLink size={13} className="text-white/50" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* 3. Ranking en tiempo real */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shrink-0">3</span>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Un ranking visible durante la feria</h2>
                        </div>
                        <div className="pl-11 space-y-3 text-white/80 text-sm leading-relaxed">
                            <p>
                                Los resultados se contabilizan automáticamente en la plataforma desarrollada para esta iniciativa. Mediante un tablero público, participantes y visitantes podrán observar cómo avanza la dinámica y qué expositores lideran la votación.
                            </p>
                            <p>
                                La votación permanecerá abierta hasta el cierre de la feria, el <strong>domingo 13 de septiembre</strong>.
                            </p>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs italic text-white/90">
                                💬 Permite generar una competencia sana e incentivar a cada expositor a promover activamente su participación con mensajes como: <strong className="text-orange-400">"¡Apoya a tu expositor favorito! Escanea su código QR y dale tu voto."</strong>
                            </div>
                        </div>
                    </section>

                    {/* 4. Transparencia y validación */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shrink-0">4</span>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Transparencia y validación de los votos</h2>
                        </div>
                        <div className="pl-11 space-y-3 text-white/80 text-sm leading-relaxed">
                            <p>Para procurar una dinámica transparente, el sistema cuenta con robustos mecanismos de control:</p>
                            <div className="grid sm:grid-cols-2 gap-3 pt-1">
                                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                                    <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={17} />
                                    <span className="text-xs">Restricción de votaciones repetidas (1 voto por número/dispositivo por negocio).</span>
                                </div>
                                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={17} />
                                    <span className="text-xs">Registro y trazabilidad de cada interacción en la base de datos.</span>
                                </div>
                                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                                    <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={17} />
                                    <span className="text-xs">Detección de patrones que puedan alterar artificialmente los resultados.</span>
                                </div>
                                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-2.5">
                                    <Calendar className="text-emerald-400 shrink-0 mt-0.5" size={17} />
                                    <span className="text-xs">Cierre automático programado al término de la jornada de clausura.</span>
                                </div>
                            </div>
                            <p className="text-xs text-white/70 pt-1">
                                📌 <em>Previo al anuncio oficial de los ganadores, los resultados finales serán revisados y validados conjuntamente con la organización para total conformidad.</em>
                            </p>
                        </div>
                    </section>

                    {/* 5. Beneficio que permanece */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shrink-0">5</span>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Después de la feria: un beneficio que permanece</h2>
                        </div>
                        <div className="pl-11 space-y-3 text-white/80 text-sm leading-relaxed">
                            <p>
                                La interacción no termina con el evento. Días después, las personas que participaron en la dinámica podrán recibir —de manera totalmente voluntaria y sin ningún tipo de incentivo, en estricto cumplimiento de las políticas de Google— una invitación a compartir su experiencia con los expositores que conozcan y tengan presencia en Google.
                            </p>
                            <p>
                                De esta forma, la iniciativa ayuda a que los artesanos y productores no solo obtengan votos durante la feria, sino que <strong>construyan una reputación digital orgánica en Google Maps y buscadores</strong> que perdura todo el año.
                            </p>
                        </div>
                    </section>

                    {/* 6. Reconocimiento y Premios */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shrink-0">6</span>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Reconocimiento a los participantes ($600 en Premios)</h2>
                        </div>
                        <div className="pl-11 space-y-4 text-white/80 text-sm leading-relaxed">
                            <p>
                                Como incentivo directo, se entregarán <strong>7 premios tecnológicos aportados íntegramente por ActivaQR</strong> (valor referencial aproximado: <strong>$600 USD</strong>):
                            </p>

                            <div className="grid gap-3 sm:grid-cols-3">
                                {/* Primer Premio */}
                                <div className="bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-2 border-amber-400/40 rounded-2xl p-4 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">1.er Lugar</span>
                                        <Trophy size={18} className="text-amber-400" />
                                    </div>
                                    <h3 className="font-bold text-white text-sm mb-1">Sitio Web Completo</h3>
                                    <p className="text-xs text-white/70">
                                        Con dominio propio, catálogo o menú digital interactivo para presentar todos sus productos.
                                    </p>
                                </div>

                                {/* Segundo y Tercer Premio */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">2.º y 3.er Lugar</span>
                                        <Award size={18} className="text-orange-400" />
                                    </div>
                                    <h3 className="font-bold text-white text-sm mb-1">2 Landing Pages</h3>
                                    <p className="text-xs text-white/70">
                                        Páginas individuales de alto impacto para promocionar al artesano, negocio y catálogo.
                                    </p>
                                </div>

                                {/* Cuatro Premios Adicionales */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-primary">4.º al 7.º Lugar</span>
                                        <Gift size={18} className="text-primary" />
                                    </div>
                                    <h3 className="font-bold text-white text-sm mb-1">4 Contactos Digitales</h3>
                                    <p className="text-xs text-white/70">
                                        Identidad digital profesional que inyecta su contacto directo en la agenda de sus clientes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 7 y 8: Beneficios para Expositores y la Feria */}
                    <section className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                        {/* 7. Beneficios para Expositores */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">7</span>
                                <h3 className="text-base font-bold text-white">Para los Expositores</h3>
                            </div>
                            <ul className="space-y-2 text-xs sm:text-sm text-white/80 pl-2">
                                <li className="flex items-start gap-2">
                                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>Mayor visibilidad e interacción durante la feria.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>Ficha digital propia dentro del directorio oficial.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>Oportunidad de ganar uno de los 7 premios tecnológicos.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>Herramientas digitales útiles incluso después del evento.</span>
                                </li>
                            </ul>
                        </div>

                        {/* 8. Beneficios para la 197.ª Feria */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">8</span>
                                <h3 className="text-base font-bold text-white">Para la 197.ª Feria de Loja</h3>
                            </div>
                            <ul className="space-y-2 text-xs sm:text-sm text-white/80 pl-2">
                                <li className="flex items-start gap-2">
                                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>Dinámica digital inédita que posiciona a la feria como pionera e innovadora.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>Directorio digital público con permanencia post-evento.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span>Informe de métricas e interacción al cierre de la feria.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <span><strong>Cero costo y cero esfuerzo técnico para la organización.</strong></span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* 9. Aportes y Coordinación */}
                    <section className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shrink-0">9</span>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Aportes y Coordinación</h2>
                        </div>
                        <div className="pl-11 space-y-4 text-white/80 text-sm leading-relaxed">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
                                <h3 className="font-black text-emerald-400 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={16} />
                                    ActivaQR aporta al 100% sin costo para la feria:
                                </h3>
                                <ul className="text-xs sm:text-sm space-y-1.5 text-white/90">
                                    <li>• Desarrollo y operación completa de la plataforma en la nube.</li>
                                    <li>• Sistema de votación con mecanismos de control anti-fraude.</li>
                                    <li>• Los 7 premios tecnológicos para los expositores más votados.</li>
                                    <li>• Directorio digital con fichas individuales de cada expositor.</li>
                                    <li>• Informe de participación e interacción al cierre del evento.</li>
                                </ul>
                            </div>

                            <p className="text-xs text-white/70">
                                <strong>Puntos a coordinar con la Dirección de la Feria (opcionales):</strong>
                                <br />
                                Difusión en canales oficiales (pantallas, redes o locución), entrega coordinada de códigos QR y anuncio de ganadores durante los actos de clausura.
                            </p>
                        </div>
                    </section>

                    {/* 10. Sobre ActivaQR */}
                    <section className="space-y-3 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shrink-0">10</span>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Sobre ActivaQR</h2>
                        </div>
                        <div className="pl-11 text-white/80 text-sm leading-relaxed">
                            <p>
                                La iniciativa es desarrollada y operada por <strong>ActivaQR</strong> como un aporte tecnológico a la 197.ª Feria de Loja, permitiendo demostrar en un escenario real el potencial de las herramientas digitales aplicadas a la promoción y fidelización de pequeños negocios y emprendimientos. <strong>No es un servicio comercial para venta a los artesanos</strong>; es una contribución directa a la feria y a quienes la hacen posible.
                            </p>
                        </div>
                    </section>

                    {/* 11. Solicitud y Cierre */}
                    <section className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shrink-0">11</span>
                            <h2 className="text-lg sm:text-xl font-bold text-white">Solicitud</h2>
                        </div>
                        <div className="pl-11 space-y-4 text-white/80 text-sm leading-relaxed">
                            <p>
                                Por lo expuesto, pongo esta iniciativa a consideración de la <strong>Dirección de la 197.ª Feria de Loja</strong>, con el propósito de que sea evaluada y, de considerarse viable, coordinemos conjuntamente su puesta en marcha.
                            </p>
                            <p>
                                Dado que la plataforma se encuentra completamente desarrollada y puede entrar en funcionamiento inmediato, la dinámica puede aprovecharse al máximo durante los días restantes de la feria.
                            </p>
                            <p>
                                Quedo atento a la decisión de mantener una breve reunión para presentar personalmente el funcionamiento de la dinámica.
                            </p>
                        </div>
                    </section>

                    {/* Firma Digital y Contacto Directo */}
                    <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white/5 rounded-3xl p-6 sm:p-8">
                        <div>
                            <p className="text-xs uppercase tracking-widest font-black text-primary mb-1">Atentamente,</p>
                            <h3 className="text-xl font-black text-white">Ing. César Reyes Jaramillo</h3>
                            <p className="text-xs text-white/70 font-medium">ActivaQR — Soluciones digitales para negocios</p>
                            
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-white/80">
                                <a href="tel:0963410409" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                                    <Phone size={13} className="text-primary" />
                                    <span>0963410409</span>
                                </a>
                                <a href="mailto:negocios@cesarreyesjaramillo.com" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                                    <Mail size={13} className="text-primary" />
                                    <span>negocios@cesarreyesjaramillo.com</span>
                                </a>
                            </div>
                        </div>

                        {/* Botón WhatsApp de Acción Inmediata */}
                        <div className="shrink-0 w-full sm:w-auto">
                            <a
                                href="https://wa.me/593963410409?text=Hola%20Ing.%20C%C3%A9sar%20Reyes%2C%20le%20escribo%20respecto%20a%20la%20Propuesta%20de%20la%20197%C2%AA%20Feria%20de%20Loja"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#25D366]/20 hover:scale-105"
                            >
                                <MessageSquare size={16} />
                                <span>Coordinar por WhatsApp</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <footer className="text-center mt-10 text-xs text-white/40 print:hidden">
                    <p>Propuesta elaborada por ActivaQR • Loja, Ecuador</p>
                    <div className="mt-2">
                        <Link href="/feria-loja" className="text-primary hover:underline font-semibold">
                            Ir al Directorio de la 197.ª Feria de Loja
                        </Link>
                    </div>
                </footer>
            </main>
        </div>
    );
}
