"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    QrCode,
    MessageCircle,
    TrendingUp,
    Clock,
    DollarSign,
    Zap,
    MapPin,
    ShoppingBag,
    CheckCircle2,
    Star,
    Store,
} from "lucide-react";

/* ───────── Helpers ───────── */
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return { ref, inView };
}

/** Genera props de animación con delay escalonado */
function anim(delay = 0) {
    return {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, delay, ease: "easeOut" },
    } as const;
}

/** Igual que anim() pero para whileInView */
function animView(delay = 0) {
    return {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.55, delay, ease: "easeOut" },
    } as const;
}

/* ─────────────────────────────────────────────────
   RADAR PING – decorative pulsing ring animation
───────────────────────────────────────────────── */
function RadarPing() {
    return (
        <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f66739] opacity-40" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#f66739]" />
        </span>
    );
}

/* ─────────────────────────────────────────────────
   SCATTERED PINGS - background decorations
───────────────────────────────────────────────── */
function ScatteredPings() {
    const positions: React.CSSProperties[] = [
        { top: "15%", left: "8%" },
        { top: "70%", left: "5%" },
        { top: "35%", right: "6%" },
        { top: "80%", right: "10%" },
        { top: "50%", left: "50%" },
    ];
    return (
        <>
            {positions.map((pos, i) => (
                <span
                    key={i}
                    className="absolute z-[5] pointer-events-none"
                    style={pos}
                >
                    <span className="relative flex h-2 w-2">
                        <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-20"
                            style={{ animationDelay: `${i * 0.4}s` }}
                        />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white opacity-60" />
                    </span>
                </span>
            ))}
        </>
    );
}

/* ─────────────────────────────────────────────────
   BADGE component
───────────────────────────────────────────────── */
function Badge({ children }: { children: React.ReactNode }) {
    return (
        <div className="inline-flex items-center gap-2 bg-[#001549] text-white px-4 py-2 rounded-full shadow-lg mb-8">
            <RadarPing />
            <span className="text-[10px] font-black uppercase tracking-widest">{children}</span>
        </div>
    );
}

/* ─────────────────────────────────────────────────
   WHATSAPP CTA BUTTON
───────────────────────────────────────────────── */
const WA_NUMBER = "593963425323";
const WA_MSG = encodeURIComponent("Quiero que entren 10 personas más al día a mi local");
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MSG}`;

function CTAButton({
    children = "Quiero que entren más →",
    size = "lg",
    id = "cta-btn",
}: {
    children?: React.ReactNode;
    size?: "lg" | "sm";
    id?: string;
}) {
    return (
        <motion.a
            id={id}
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className={`inline-flex items-center gap-3 bg-[#f66739] text-white font-black rounded-full shadow-[0_8px_40px_rgba(246,103,57,0.45)] hover:bg-[#e5562d] transition-colors duration-300 ${size === "lg" ? "px-10 py-6 text-xl" : "px-8 py-4 text-base"}`}
        >
            <MessageCircle size={size === "lg" ? 24 : 20} />
            {children}
        </motion.a>
    );
}

/* ─────────────────────────────────────────────────
   SECTION COUNTER CARD
───────────────────────────────────────────────── */
function CounterCard({
    label,
    value,
    sub,
    icon,
    delay = 0,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
    delay?: number;
}) {
    return (
        <motion.div
            {...animView(delay)}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col gap-2 hover:border-[#f66739]/30 transition-colors duration-300"
        >
            <div className="w-10 h-10 bg-[#f66739]/20 rounded-2xl flex items-center justify-center text-[#f66739]">
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-2">{label}</p>
            <p className="text-3xl font-black text-white leading-none">{value}</p>
            {sub && <p className="text-sm text-white/50 font-medium">{sub}</p>}
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────── */
export default function LetreroLocalesClient() {
    const { ref: dolorRef, inView: dolorInView } = useReveal();
    const { ref: cuentaRef, inView: cuentaInView } = useReveal();
    const { ref: multiRef, inView: multiInView } = useReveal();
    const { ref: ctaFinalRef, inView: ctaFinalInView } = useReveal();

    return (
        <main className="min-h-screen bg-[#0a0a0a] selection:bg-[#f66739]/30 scroll-smooth font-sans overflow-x-hidden">

            {/* ────────── HERO ────────── */}
            <section className="relative min-h-screen w-full flex items-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#001549] via-[#0a0a0a] to-[#0a0a0a]" />
                <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#f66739]/10 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#05509c]/20 rounded-full blur-[100px] pointer-events-none" />
                <ScatteredPings />

                <div className="container mx-auto relative z-20 px-6 md:px-12 py-24 lg:py-32 max-w-3xl">
                    <motion.div {...anim(0)}>
                        <Badge>Letrero + QR para Locales • ActivaQR</Badge>
                    </motion.div>

                    <motion.h1
                        {...anim(0.1)}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tighter mb-6"
                    >
                        ¿Pagas arriendo para que la gente{" "}
                        <span className="text-[#f66739]">ENTRE</span> a tu local,
                        o para que pase de largo sin mirar?
                    </motion.h1>

                    <motion.p
                        {...anim(0.2)}
                        className="text-base md:text-lg text-white/70 mb-10 leading-relaxed font-medium max-w-xl"
                    >
                        Letrero + QR que hace que levanten la cabeza, escaneen y pidan
                        por WhatsApp. Mientras tú despachas.
                    </motion.p>

                    <motion.div {...anim(0.3)} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <CTAButton id="hero-cta">Quiero que entren más →</CTAButton>
                        <p className="text-white/30 text-sm font-bold">$200 / año · Sin comisiones</p>
                    </motion.div>

                    <motion.div {...anim(0.45)} className="flex flex-wrap gap-3 mt-10">
                        {["Se paga en 17 días", "Vende 24h sin estar", "Catálogo en tu QR"].map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/70 text-xs font-bold px-4 py-2 rounded-full"
                            >
                                <CheckCircle2 size={12} className="text-[#66bf19]" />
                                {t}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ────────── DOLOR ────────── */}
            <section className="py-24 bg-[#050505] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#f66739]/5 rounded-full blur-[120px] pointer-events-none" />
                <ScatteredPings />
                <div ref={dolorRef} />

                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <motion.div
                        {...anim(0)}
                        animate={dolorInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                        className="text-center mb-14"
                    >
                        <Badge>El problema real</Badge>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-[1.1]">
                            ¿Sigues siendo el que toma fotos,{" "}
                            <br className="hidden md:block" />
                            manda ubicación y contesta{" "}
                            <span className="text-[#f66739]">«¿precio?»</span>...
                            <br />
                            para que al final no compren?
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={dolorInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                        transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[3rem] p-8 md:p-12 text-center"
                    >
                        <p className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            Es hora de ser el{" "}
                            <span className="text-[#f66739]">dueño</span>,<br />
                            no la secretaria.
                        </p>
                        <p className="mt-4 text-white/50 font-medium text-lg">
                            Tu letrero actual no detiene a nadie. El del local de al lado sí.
                            Por eso él vende.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={dolorInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                        transition={{ duration: 0.55, delay: 0.24, ease: "easeOut" }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10"
                    >
                        {[
                            { icon: <Clock size={24} />, title: "Horas perdidas", desc: "Contestando «¿precio?», «¿dónde están?», «¿tienen foto?» todo el día." },
                            { icon: <TrendingUp size={24} />, title: "Ventas que se van", desc: "Un cliente que espera es una venta que se va. Sin catálogo, pierdes en silencio." },
                            { icon: <MapPin size={24} />, title: "Local invisible", desc: "La gente pasa mirando el celular. Tu letrero no los detiene. El de al lado sí." },
                        ].map((card, i) => (
                            <div
                                key={i}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-[#f66739]/30 transition-all duration-300"
                            >
                                <div className="w-10 h-10 bg-[#f66739]/20 rounded-2xl flex items-center justify-center text-[#f66739] mb-4">
                                    {card.icon}
                                </div>
                                <h3 className="text-white font-black text-lg mb-2">{card.title}</h3>
                                <p className="text-white/50 text-sm font-medium leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ────────── LA CUENTA ────────── */}
            <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
                <div className="absolute right-0 top-1/2 w-[600px] h-[600px] bg-[#001549]/40 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
                <ScatteredPings />
                <div ref={cuentaRef} />

                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={cuentaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className="text-center mb-14"
                    >
                        <Badge>Haz la cuenta</Badge>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-[1.1]">
                            ¿Y si solo entraran{" "}
                            <span className="text-[#f66739]">10 personas más</span> al día?
                        </h2>
                        <p className="text-white/50 mt-4 text-lg font-medium max-w-2xl mx-auto">
                            No 100. Solo 10 de las que ahora pasan de largo porque tu letrero no los detiene.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        <CounterCard delay={0}   label="Extra al día"    value="$12"     sub="Si 3 de 10 compran algo de $4"     icon={<DollarSign size={20} />} />
                        <CounterCard delay={0.1} label="Extra al mes"    value="$360"    sub="$12 × 30 días"                     icon={<TrendingUp size={20} />} />
                        <CounterCard delay={0.2} label="Costo ActivaQR"  value="$200"    sub="Por todo un año"                   icon={<QrCode size={20} />} />
                        <CounterCard delay={0.3} label="Se paga en"      value="17 días" sub="El resto del año es ganancia pura" icon={<Zap size={20} />} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={cuentaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                        transition={{ duration: 0.55, delay: 0.36, ease: "easeOut" }}
                        className="bg-gradient-to-br from-[#f66739]/20 to-[#001549]/40 border border-[#f66739]/20 backdrop-blur-md rounded-[3rem] p-8 md:p-12 text-center"
                    >
                        <p className="text-white/60 text-base font-bold uppercase tracking-widest mb-4">La regla que cambia todo</p>
                        <p className="text-2xl md:text-3xl font-black text-white leading-tight">
                            Cada dólar que inviertes tiene que volver con amigos.
                            <br />
                            <span className="text-[#f66739]">Si no, no es inversión — es gasto.</span>
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ────────── MULTIPLICADOR ────────── */}
            <section className="py-24 bg-[#050505] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-[#f66739]/5 rounded-full blur-[140px] -translate-x-1/2 pointer-events-none" />
                <ScatteredPings />
                <div ref={multiRef} />

                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={multiInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className="text-center mb-14"
                    >
                        <Badge>El multiplicador</Badge>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-[1.1] mb-4">
                            Y esto es solo si lo ven en tu puerta...
                        </h2>
                        <p className="text-white/50 text-lg font-medium max-w-2xl mx-auto">
                            ¿Qué pasa cuando alguien le toma foto a tu QR y lo revisa en su casa a las 11pm?
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: <Store size={28} />, label: "En tu puerta", desc: "Tu letrero detiene a quien pasa. Escanean, ven tu catálogo, te mandan el pedido por WhatsApp.", delay: 0 },
                            { icon: <ShoppingBag size={28} />, label: "En ferias y flyers", desc: "El mismo QR en un flyer o en la feria sigue atrayendo clientes mucho después de que te fuiste.", delay: 0.12 },
                            { icon: <Zap size={28} />, label: "24 horas, sin que estés", desc: "Tu letrero vende a las 11pm cuando ya cerraste. Tu repartidor lleva el QR en el uniforme.", delay: 0.24 },
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 28 }}
                                animate={multiInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                                transition={{ duration: 0.55, delay: card.delay, ease: "easeOut" }}
                                className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-[#f66739]/30 transition-all duration-300 group"
                            >
                                <div className="w-14 h-14 bg-[#f66739]/20 rounded-3xl flex items-center justify-center text-[#f66739] mb-6 group-hover:scale-110 transition-transform duration-300">
                                    {card.icon}
                                </div>
                                <h3 className="text-white font-black text-xl mb-3">{card.label}</h3>
                                <p className="text-white/50 font-medium leading-relaxed">{card.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={multiInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                        transition={{ duration: 0.55, delay: 0.36, ease: "easeOut" }}
                        className="mt-12 text-center"
                    >
                        <p className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                            Ese mismo <span className="text-[#f66739]">QR</span> vende{" "}
                            <span className="bg-[#f66739]/20 border border-[#f66739]/30 px-3 py-1 rounded-full">
                                24 horas
                            </span>
                            . Sin que estés.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ────────── SOCIAL PROOF ────────── */}
            <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#001549]/10 to-transparent pointer-events-none" />

                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <motion.div {...animView(0)} className="text-center mb-14">
                        <Badge>Lo que dicen los dueños</Badge>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                            43 personas paradas ayer frente al letrero
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Mónica R.", city: "Loja", business: "Tienda de ropa", text: "Antes contestaba fotos todo el día. Ahora mis clientes escanean el QR y me mandan el pedido listo. Me ahorré horas.", stars: 5 },
                            { name: "Carlos V.", city: "Cuenca", business: "Picantería", text: "El letrero paró a gente que antes pasaba de largo. Al tercer día ya tenía pedidos nuevos. Se pagó solo.", stars: 5 },
                            { name: "Lucía T.", city: "Quito", business: "Artesanías", text: "Lo puse en una feria y seguí recibiendo pedidos semanas después. La gente escaneó y me escribió desde casa.", stars: 5 },
                        ].map((t, i) => (
                            <motion.div
                                key={i}
                                {...animView(i * 0.12)}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-[#f66739]/20 transition-all duration-300"
                            >
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: t.stars }).map((_, si) => (
                                        <Star key={si} size={14} className="fill-[#f66739] text-[#f66739]" />
                                    ))}
                                </div>
                                <p className="text-white/80 font-medium leading-relaxed mb-6 italic">
                                    &ldquo;{t.text}&rdquo;
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#f66739]/20 rounded-full flex items-center justify-center text-[#f66739] font-black text-sm">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-sm">{t.name}</p>
                                        <p className="text-white/40 text-xs font-medium">
                                            {t.business} · {t.city}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ────────── CTA FINAL ────────── */}
            <section className="py-24 bg-gradient-to-br from-[#001549] via-[#05509c]/30 to-[#0a0a0a] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#f66739]/10 rounded-full blur-[120px] pointer-events-none" />
                <ScatteredPings />

                <div ref={ctaFinalRef} className="max-w-3xl mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={ctaFinalInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                    >
                        <Badge>$200 al año · 17 días para recuperarlo</Badge>

                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.05] mb-6">
                            Tu local lleva meses pagando arriendo.
                            <br />
                            <span className="text-[#f66739]">Ya es hora de que el letrero trabaje.</span>
                        </h2>

                        <p className="text-white/60 text-lg font-medium mb-10 max-w-xl mx-auto">
                            Letrero + QR + catálogo que vende por WhatsApp, 24 horas.
                            Sin comisiones. 100% tuyo.
                        </p>

                        <CTAButton id="final-cta" size="lg">
                            Quiero que entren más →
                        </CTAButton>

                        <p className="mt-6 text-white/30 text-sm font-bold">
                            Escríbenos por WhatsApp — respondemos en menos de 1 hora.
                        </p>
                    </motion.div>
                </div>
            </section>

        </main>
    );
}
