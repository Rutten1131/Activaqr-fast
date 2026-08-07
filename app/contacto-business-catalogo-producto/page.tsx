"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowRight, Play, ChevronDown, Camera, Smartphone, User, Mail
} from "lucide-react";
import RegisterWizard from "@/components/RegisterWizard";

// --- Tipos ---
type Step = 1 | 2 | 3; // 1: Hero, 2: Video, 3: Registro (Wizard)

const StepWrapper = ({ children, isVisible }: { children: React.ReactNode; isVisible: boolean }) => (
  <AnimatePresence mode="wait">
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full h-full flex flex-col items-center justify-center relative z-10"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export default function ContactoCatalogoMicroFunnel() {
  const [step, setStep] = useState<Step>(1);
  const [videoFinished, setVideoFinished] = useState(false);

  return (
    <main className={`bg-[#0a0a0a] text-white font-sans selection:bg-[#FF6B2B] h-screen overflow-hidden relative ${step >= 3 ? "overflow-y-auto" : ""}`}>
      
      {/* Botón Volver (Sutil) */}
      <button 
        onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : window.location.href = "/"}
        className="fixed top-8 left-8 z-[100] text-white/30 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]"
      >
        <ArrowLeft size={14} /> Volver
      </button>

      {/* --- PASO 1: HERO --- */}
      <StepWrapper isVisible={step === 1}>
        <div className="absolute inset-0 z-0">
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            className="w-full h-full bg-cover bg-center grayscale"
            style={{ backgroundImage: "url('/images/Reingenierìa/plan_catalogo_notificaciones.webp')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
        </div>

        <div className="container mx-auto px-12 md:px-20 text-left max-w-6xl relative z-10 pt-20">
          <p className="text-[#FF6B2B] text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-4">
            BUSINESS + CATÁLOGO · $200/AÑO
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-[1.1] max-w-2xl uppercase">
            Tu catálogo digital <br />
            <span className="text-white/40 italic">vendiendo 24/7.</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg font-bold mb-10 uppercase tracking-[0.2em] max-w-xl">
            Sube hasta 30 productos y recibe los pedidos directo a tu WhatsApp. Sin comisiones.
          </p>
          <button 
            onClick={() => setStep(2)}
            className="inline-flex items-center gap-4 bg-[#FF6B2B] text-white font-black text-lg px-12 py-6 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-[#FF6B2B]/20"
          >
            Activar mi Catálogo Ahora <ArrowRight size={24} />
          </button>
        </div>
      </StepWrapper>

      {/* --- PASO 2: VIDEO --- */}
      <StepWrapper isVisible={step === 2}>
        <div className="container mx-auto px-6 text-center max-w-4xl py-20">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">
            Mira cómo el Catálogo Digital automatiza tus ventas.
          </p>
          <h2 className="text-2xl md:text-4xl font-black mb-12 tracking-tighter uppercase">Asesoría de Configuración Incluida</h2>
          <div className="relative aspect-video bg-[#111] rounded-2xl overflow-hidden border border-white/5 shadow-2xl mb-10">
            <iframe 
              src="https://iframe.mediadelivery.net/embed/261314/191c563b-d77d-4620-b775-0d5b659e28fe?autoplay=true&loop=false&muted=false&preload=true&responsive=true" 
              loading="lazy" 
              className="w-full h-full border-none"
              allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" 
              allowFullScreen={true}
            />
          </div>
          <button onClick={() => setStep(3)} className="inline-flex items-center gap-3 bg-[#FF6B2B] text-white font-black text-base px-12 py-5 rounded-xl hover:scale-105 transition-all">
            Ir al pago y registro <ArrowRight size={20} />
          </button>
        </div>
      </StepWrapper>

      {/* --- PASO 3: REGISTRO MAESTRO --- */}
      {step === 3 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="container mx-auto px-6 py-12 min-h-screen flex flex-col items-center justify-start"
        >
          <div className="w-full max-w-5xl">
            <RegisterWizard paymentFirst={true} initialPlan="catalogo" />
          </div>
        </motion.div>
      )}

    </main>
  );
}
