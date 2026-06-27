"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck, Play, PhoneCall, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// Utilidades de animación
// ─────────────────────────────────────────────
const FadeInUp = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─────────────────────────────────────────────
// Radar Ping naranja
// ─────────────────────────────────────────────
const RadarPing = ({ className = "" }: { className?: string }) => (
  <div className={`absolute inset-0 overflow-hidden pointer-events-none z-[5] ${className}`}>
    <div style={{ position: "absolute", top: "50%", left: "25%", transform: "translate(-50%,-50%)" }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{ position: "absolute", width: 160, height: 160, top: -80, left: -80, borderRadius: "50%", border: "1px solid #FF6B2B" }}
          animate={{ scale: [0.2, 3], opacity: [0.5, 0] }}
          transition={{ duration: 4, ease: "easeOut", repeat: Infinity, delay: i * 1.33 }}
        />
      ))}
      <motion.div
        style={{ position: "absolute", width: 10, height: 10, top: -5, left: -5, borderRadius: "50%", backgroundColor: "#FF6B2B" }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.4, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Pings blancos dispersos
// ─────────────────────────────────────────────
const PINGS = [
  { top: "18%", left: "72%", delay: 0, size: 60 },
  { top: "68%", left: "82%", delay: 1.1, size: 44 },
  { top: "35%", left: "55%", delay: 2.3, size: 80 },
  { top: "80%", left: "38%", delay: 0.7, size: 50 },
  { top: "12%", left: "40%", delay: 1.8, size: 36 },
  { top: "55%", left: "90%", delay: 3.0, size: 56 },
];
const ScatteredPings = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
    {PINGS.map((p, i) => (
      <div key={i} style={{ position: "absolute", top: p.top, left: p.left }}>
        <motion.div
          style={{ position: "absolute", width: p.size, height: p.size, top: -(p.size / 2), left: -(p.size / 2), borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.6)" }}
          animate={{ scale: [0.3, 2.2], opacity: [0.8, 0] }}
          transition={{ duration: 3.5, ease: "easeOut", repeat: Infinity, delay: p.delay, repeatDelay: 1 }}
        />
        <motion.div
          style={{ position: "absolute", width: 4, height: 4, top: -2, left: -2, borderRadius: "50%", backgroundColor: "rgba(255,255,255,1)" }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        />
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Datos de testimonios (5 slides)
// ─────────────────────────────────────────────
const TESTIMONIALS = [
  {
    img: "/images/taxis/chofer3.webp",
    quote: "Un cliente me dijo después que me había buscado esa noche pero no me encontró. Me había guardado como 'taxi aeropuerto'. Perdí una carrera de $18 por eso.",
    author: "Marco A.",
    role: "Taxista · Loja",
    tag: "TAXI",
  },
  {
    img: "/images/taxis/chofer2.webp",
    quote: "Me recomendaron con un turista. Me buscó en WhatsApp, no me encontró, llamó a otro. El que me recomendó me contó después. Nunca supe cuánto perdí.",
    author: "Diego R.",
    role: "Operadora de turismo · Loja",
    tag: "FURGONETA",
  },
  {
    img: "/images/taxis/chofer1.webp",
    quote: "Yo pensaba que mis clientes fijos me tenían bien guardado. Un día le pregunté a uno cómo me tenía en el celular. Me dijo: 'taxista conocido'. Ahí entendí.",
    author: "Rosa M.",
    role: "Transporte Escolar · Loja",
    tag: "CAMIONETA",
  },
  {
    img: "/images/taxis/chofer4.webp",
    quote: "Tenía clientes que me llamabas seguido. Un mes no me buscaron. Después me enteré que cambiaron de número y no me pudieron volver a encontrar. Eso no vuelve a pasar.",
    author: "Luis P.",
    role: "Camioneta de alquiler · Loja",
    tag: "CAMIONETA",
  },
  {
    img: "/images/taxis/chofer5.webp",
    quote: "Yo daba mi número en papel. Lo perdían. Ahora comparto un enlace y se guardan solos con mi foto y todo. Los clientes mismos me dicen que así sí me van a encontrar.",
    author: "Carlos V.",
    role: "Transporte · Loja",
    tag: "TAXI",
  },
];

// ─────────────────────────────────────────────
// Slider de testimonios con imagen
// ─────────────────────────────────────────────
const TestimonialSlider = () => {
  const [active, setActive] = useState(0);
  const total = TESTIMONIALS.length;

  const next = useCallback(() => setActive((p) => (p + 1) % total), [total]);
  const prev = useCallback(() => setActive((p) => (p - 1 + total) % total), [total]);

  // Autoplay
  useEffect(() => {
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next]);

  const slide = TESTIMONIALS[active];

  return (
    <div className="relative w-full max-w-4xl mx-auto px-0 md:px-4">
      {/* Card principal — responsivo móvil */}
      <div className="relative overflow-hidden rounded-2xl w-full" style={{ aspectRatio: "16/9", minHeight: "200px" }}>
        {/* Imagen de fondo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.img})` }}
          />
        </AnimatePresence>

        {/* Overlay oscuro gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/20" />

        {/* Badge sector — arriba derecha */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] bg-[#FF6B2B] text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
            {slide.tag}
          </span>
        </div>

        {/* Texto del testimonio — abajo */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-white text-sm sm:text-base md:text-xl font-medium leading-[1.5] sm:leading-[1.6] mb-3 sm:mb-5 italic w-full">
                &quot;{slide.quote}&quot;
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-1 h-6 sm:h-8 bg-[#FF6B2B] rounded-full flex-shrink-0" />
                <div>
                  <p className="text-[#FF6B2B] font-black text-xs sm:text-sm uppercase tracking-widest">
                    {slide.author}
                  </p>
                  <p className="text-white/50 text-[10px] sm:text-xs font-medium">{slide.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controles */}
      <button
        onClick={prev}
        aria-label="Anterior"
        className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-black/50 hover:bg-[#FF6B2B] border border-white/10 hover:border-[#FF6B2B] text-white rounded-full transition-all duration-300"
      >
        <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
      <button
        onClick={next}
        aria-label="Siguiente"
        className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-black/50 hover:bg-[#FF6B2B] border border-white/10 hover:border-[#FF6B2B] text-white rounded-full transition-all duration-300"
      >
        <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`transition-all duration-300 rounded-full ${i === active
              ? "w-8 h-2 bg-[#FF6B2B] shadow-lg shadow-[#FF6B2B]/40"
              : "w-2 h-2 bg-white/20 hover:bg-white/40"
              }`}
          />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Modal de YouTube (como respaldo / CTA secondary)
// ─────────────────────────────────────────────
const YouTubeModal = ({
  isOpen,
  onClose,
  videoId,
}: {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-4xl aspect-video"
          onClick={(e) => e.stopPropagation()}
        >
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="w-full h-full rounded-sm border border-[#333]"
          />
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm uppercase tracking-widest transition-colors"
          >
            ✕ Cerrar
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────
export default function ParaTaxisPage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const YOUTUBE_VIDEO_ID = "tq5oNX8yvzo";
  const YT_EMBED = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1&color=white`;

  return (
    <main
      className="bg-[#0a0a0a] min-h-screen font-sans selection:bg-[#FF6B2B] selection:text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Botón flotante de Home */}
      <a
        href="/"
        aria-label="Volver al inicio"
        className="fixed top-5 left-5 z-50 flex items-center justify-center w-10 h-10 bg-[#111111] border border-[#333333] hover:border-[#FF6B2B] hover:text-[#FF6B2B] text-[#888888] transition-all duration-300 rounded-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </a>

      {/* ════════════════════════════════════════════
          BLOQUE 1 — HERO con VIDEO EMBEBIDO DIRECTO
      ════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden px-4">
        {/* Fondo ambiente */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 60%, rgba(255,107,43,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,21,73,0.4) 0%, transparent 60%), #0a0a0a",
          }}
        />
        {/* Cuadrícula sutil */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <RadarPing />
        <ScatteredPings />

        <div className="relative z-10 container mx-auto max-w-5xl text-center pt-24 pb-10">
          {/* Badge */}
          <FadeInUp>
            <div className="inline-flex items-center gap-2 bg-[#111111] border border-[#333333] px-5 py-2 rounded-full mb-8">
              <span className="flex h-2 w-2 rounded-full bg-[#FF6B2B] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#888888]">
                Identidad Digital · Transporte Loja, Ecuador
              </span>
            </div>
          </FadeInUp>

          {/* H1 */}
          <FadeInUp delay={0.1}>
            <h1
              className="text-white font-black tracking-tighter mb-5"
              style={{ fontSize: "clamp(2rem, 5.8vw, 4.6rem)", lineHeight: 1.06 }}
            >
              Deje de ser{" "}
              <span className="text-[#FF6B2B]">&quot;Taxi Carlos&quot;</span>
              <br />
              en el celular de sus clientes.
            </h1>
          </FadeInUp>

          {/* Subtítulo */}
          <FadeInUp delay={0.2}>
            <p className="text-[#888888] text-lg md:text-xl font-normal leading-[1.7] max-w-2xl mx-auto mb-10">
              El próximo cliente que necesite taxi a las 4AM —{" "}
              <span className="text-white font-bold">que lo llame a usted.</span>
            </p>
          </FadeInUp>

          {/* ── VIDEO EMBEBIDO DIRECTO (visible sin clic) ── */}
          <FadeInUp delay={0.3}>
            <div className="relative w-full max-w-2xl mx-auto">
              {/* Etiqueta "VEA EL VIDEO" muy visible para baja alfabetización digital */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#333]" />
                <div className="flex items-center gap-2 bg-[#FF6B2B] px-4 py-2 rounded-full">
                  <Play fill="white" size={14} className="text-white" />
                  <span className="text-white font-black text-xs uppercase tracking-wider">
                    Vea el video — 1 minuto
                  </span>
                </div>
                <div className="flex-1 h-px bg-[#333]" />
              </div>

              {/* iFrame de YouTube directamente visible */}
              <div
                className="relative w-full overflow-hidden rounded-xl border-2 border-[#FF6B2B]/30 shadow-2xl shadow-[#FF6B2B]/10"
                style={{ aspectRatio: "16/9" }}
              >
                <iframe
                  src={YT_EMBED}
                  title="ActivaQR para taxistas y transporte en Loja"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>

              <p className="text-[#555] text-xs mt-3 text-center">
                ↑ Presione el botón ▶ del video para reproducirlo
              </p>
            </div>
          </FadeInUp>
        </div>

        {/* Flecha scroll */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-14 bg-gradient-to-b from-[#FF6B2B]/60 to-transparent mx-auto"
          />
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BLOQUE 2 — LAS DOS PREGUNTAS
      ════════════════════════════════════════════ */}
      <section className="relative py-28 bg-[#050505] px-6 overflow-hidden border-t border-[#111111]">
        <ScatteredPings />
        <div className="container mx-auto max-w-4xl relative z-10">
          <FadeInUp>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#888888] text-center mb-14">
              Antes de continuar, respóndase esto
            </p>
          </FadeInUp>

          <div className="flex flex-col gap-10">
            {/* Pregunta 1 */}
            <FadeInUp delay={0.1}>
              <div className="flex gap-5 items-start p-8 bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#FF6B2B]/30 transition-all duration-500 rounded-sm">
                <span className="text-[#FF6B2B] font-black text-5xl leading-none flex-shrink-0 opacity-30">1</span>
                <p className="text-white text-xl md:text-2xl font-bold leading-[1.5] pt-2">
                  ¿Crees que alguna vez hayas perdido una carrera porque el cliente no se acordó cómo te llamabas?
                </p>
              </div>
            </FadeInUp>

            {/* Pregunta 2 */}
            <FadeInUp delay={0.2}>
              <div className="flex gap-5 items-start p-8 bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#FF6B2B]/30 transition-all duration-500 rounded-sm">
                <span className="text-[#FF6B2B] font-black text-5xl leading-none flex-shrink-0 opacity-30">2</span>
                <p className="text-white text-xl md:text-2xl font-bold leading-[1.5] pt-2">
                  Cuando un cliente te pide el número, se lo dictas o le entregas una tarjeta — en cualquier caso,{" "}
                  <span className="text-[#FF6B2B]">¿cómo crees que te guardan?</span>
                </p>
              </div>
            </FadeInUp>
          </div>

          <FadeInUp delay={0.4} className="mt-14 text-center">
            <p className="text-[#FF6B2B] text-xl md:text-2xl font-bold">
              Si la respuesta a alguna lo incomoda — siga leyendo.
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BLOQUE 3 — EL COSTO REAL
      ════════════════════════════════════════════ */}
      <section className="relative min-h-[55vh] flex items-center justify-center bg-[#000000] overflow-hidden border-t border-[#111111]">
        <RadarPing />
        <ScatteredPings />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 70% 50%, rgba(255,107,43,0.06) 0%, transparent 70%), #000000",
          }}
        />
        <div className="relative z-10 container mx-auto px-6 text-center py-24 max-w-4xl">
          <FadeInUp>
            <p className="text-white text-xl md:text-2xl font-bold mb-5">
              No es culpa de tus clientes.
            </p>
            <h2
              className="text-white font-black uppercase mb-5 tracking-tighter leading-[1.1]"
              style={{ fontSize: "clamp(1.9rem, 5.5vw, 4.2rem)" }}
            >
              Es que como todos —{" "}
              <span className="text-[#FF6B2B]">nos olvidamos</span>
              <br />
              cómo guardamos los contactos,
              <br />
              y cuando nos acordamos ya es tarde.
            </h2>
            <p className="text-[#555] text-lg md:text-xl font-bold">
              Y entonces llaman a otro.
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BLOQUE 4 — TESTIMONIOS (Slider con imagen)
      ════════════════════════════════════════════ */}
      <section className="relative py-28 bg-[#0a0a0a] px-6 overflow-hidden border-t border-[#1a1a1a]">
        <ScatteredPings />
        <div className="container mx-auto max-w-5xl relative z-10 px-2 sm:px-6">
          <FadeInUp className="mb-16 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-4">
              Taxistas y transportistas de Loja · Historias reales
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
              No le está pasando solo a usted.
            </h2>
            <p className="text-[#555] text-lg">
              Esto lo viven cada semana cientos de conductores en Loja.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <TestimonialSlider />
          </FadeInUp>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BLOQUE 5 — CÓMO FUNCIONA (3 pasos)
      ════════════════════════════════════════════ */}
      <section className="relative py-28 bg-[#050505] px-6 border-t border-[#111111]">
        <ScatteredPings />
        <div className="container mx-auto max-w-6xl relative z-10">
          <FadeInUp className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              ¿Listo para ser la primera opción?
            </h2>
            <p className="text-[#888] text-xl mt-4">Así de simple funciona:</p>
          </FadeInUp>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {[
              { step: 1, text: "Confirmas tu pago con tarjeta o transferencia vía Payphone." },
              { step: 2, text: "Llenas un formulario corto — te llega todo al correo que asignes." },
              { step: 3, text: "Si necesitas ayuda, me escribes y te guío personalmente." },
            ].map((p, i) => (
              <FadeInUp key={i} delay={i * 0.12} className="flex flex-col items-center text-center">
                <span className="text-7xl md:text-9xl font-black text-[#FF6B2B] opacity-20 mb-4 leading-none">
                  {p.step}
                </span>
                <p className="text-xl md:text-2xl text-white font-bold leading-tight px-4">{p.text}</p>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BLOQUE 6 — CIERRE Y OFERTA
      ════════════════════════════════════════════ */}
      <section
        id="oferta"
        className="relative py-32 md:py-40 bg-[#0a0a0a] px-6 border-t border-[#1a1a1a] overflow-hidden"
      >
        <RadarPing />
        <ScatteredPings />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 85%, rgba(255,107,43,0.10) 0%, transparent 65%)",
          }}
        />

        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <FadeInUp>
            <h2
              className="text-white font-black leading-tight mb-3"
              style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
            >
              $35 al año.
            </h2>
            <p className="text-[#FF6B2B] text-xl md:text-2xl font-bold mb-14">
              Menos que una sola carrera perdida.
            </p>
          </FadeInUp>

          {/* Garantía */}
          <FadeInUp delay={0.15}>
            <div className="bg-[#111111] border border-[#222222] p-7 mb-8 rounded-sm text-left">
              <div className="flex items-start gap-4">
                <ShieldCheck className="text-[#FF6B2B] flex-shrink-0 mt-0.5" size={26} />
                <div>
                  <p className="text-white font-bold text-base mb-1">Garantía de 7 días</p>
                  <p className="text-[#888] text-sm leading-relaxed">
                    Si no es para usted, le devolvemos su dinero.{" "}
                    <span className="text-white font-bold">Sin rodeos ni letras pequeñas.</span>
                  </p>
                </div>
              </div>
            </div>
          </FadeInUp>

          {/* CTA principal */}
          <FadeInUp delay={0.25}>
            <a
              id="btn-activar-contacto"
              href="/registro?plan=digital&utm_source=landing&utm_campaign=para-taxis"
              className="inline-flex items-center justify-center gap-3 bg-[#FF6B2B] text-white font-bold text-xl md:text-2xl px-10 py-6 w-full hover:bg-[#e05a1f] transition-all duration-300 hover:scale-[1.02] shadow-2xl shadow-[#FF6B2B]/20 rounded-sm mb-5"
            >
              ACTIVAR MI CONTACTO DIGITAL — $35
              <ArrowRight size={22} />
            </a>
          </FadeInUp>

          {/* WhatsApp */}
          <FadeInUp delay={0.35}>
            <a
              id="btn-whatsapp-dudas"
              href="https://wa.me/593XXXXXXXXX?text=Hola,%20tengo%20dudas%20sobre%20ActivaQR%20para%20taxis"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 border border-[#333333] hover:border-[#FF6B2B]/50 text-[#888888] hover:text-white font-bold text-base px-8 py-4 w-full transition-all duration-300 rounded-sm"
            >
              <PhoneCall size={17} />
              ¿Tiene dudas? → Escríbame por WhatsApp
            </a>
          </FadeInUp>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER PROPIO (sin el global)
      ════════════════════════════════════════════ */}
      <footer className="border-t border-[#111111] py-10 bg-[#050505] px-6">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-[#3a3a3a] text-sm">
            © {new Date().getFullYear()} ActivaQR · Diseñado para profesionales del transporte en Loja, Ecuador.
          </p>
          <div className="flex items-center gap-6">
            <a href="/terminos" className="text-[#3a3a3a] hover:text-[#666] text-sm transition-colors">
              Términos
            </a>
            <a href="/privacidad" className="text-[#3a3a3a] hover:text-[#666] text-sm transition-colors">
              Privacidad
            </a>
            <a href="/" className="text-[#3a3a3a] hover:text-[#FF6B2B] text-sm transition-colors font-bold">
              ActivaQR
            </a>
          </div>
        </div>
      </footer>

      {/* Modal YouTube (respaldo fullscreen) */}
      <YouTubeModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoId={YOUTUBE_VIDEO_ID}
      />
    </main>
  );
}
