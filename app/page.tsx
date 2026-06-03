"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Números flotantes de fondo ───────────────────────────────
const FLOAT_ITEMS = [
  "1", "2", "3", "+", "×", "7", "π", "∞", "=", "9",
  "÷", "5", "√", "8", "−", "4", "∑", "6", "%", "0",
];

const FLOATERS = Array.from({ length: 28 }, (_, i) => ({
  symbol: FLOAT_ITEMS[i % FLOAT_ITEMS.length],
  left: `${(i * 37 + 5) % 95}%`,
  top: `${(i * 53 + 10) % 90}%`,
  size: 0.8 + (i % 5) * 0.35,
  delay: (i * 0.4) % 6,
  duration: 6 + (i % 5) * 2,
  opacity: 0.04 + (i % 4) * 0.025,
}));

// ─── Islas de preview ─────────────────────────────────────────
const ISLANDS = [
  { icon: "🌿", name: "Sumas y restas",  color: "#4CAF50", bg: "#0d2b0d" },
  { icon: "💧", name: "Multiplicación",  color: "#29B6F6", bg: "#0a1f2e" },
  { icon: "🔥", name: "División",        color: "#FFA726", bg: "#2b1e0a" },
  { icon: "⚡", name: "Fracciones",      color: "#EF5350", bg: "#2b0a0a" },
  { icon: "🌙", name: "Geometría",       color: "#CE93D8", bg: "#1e0a2b" },
  { icon: "🌊", name: "Álgebra",         color: "#42A5F5", bg: "#0a142b" },
  { icon: "🏔️", name: "Desafío final",   color: "#78909C", bg: "#181818" },
];

// ─── Features ─────────────────────────────────────────────────
const FEATURES = [
  { icon: "🗺️", title: "Mapa de aventuras",    desc: "7 islas temáticas con 70 niveles que se desbloquean progresivamente." },
  { icon: "⭐", title: "Sistema de estrellas",  desc: "Hasta 3 estrellas por nivel. ¿Podés perfeccionarlos todos?" },
  { icon: "❤️", title: "Vidas y desafíos",      desc: "Cada error cuesta una vida. Pensá antes de responder." },
  { icon: "🪙", title: "Monedas y recompensas", desc: "Ganás monedas jugando. Usálas para power-ups y más vidas." },
  { icon: "🔥", title: "Racha diaria",          desc: "Jugá todos los días y mantenés tu racha. ¡El aprendizaje es hábito!" },
  { icon: "👑", title: "Plan Pro",              desc: "Vidas infinitas, sin publicidad y acceso a todos los niveles." },
];

// ─── Contador animado ─────────────────────────────────────────
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = to / 40;
      const t = setInterval(() => {
        start += step;
        if (start >= to) { setVal(to); clearInterval(t); }
        else setVal(Math.floor(start));
      }, 35);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Página ───────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-[#08080f] text-white overflow-x-hidden font-[Nunito,sans-serif] selection:bg-[#FFD700] selection:text-[#08080f]">

      {/* ── FONDO ANIMADO ── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className="absolute font-[FredokaOne,sans-serif] select-none animate-[floatUp_linear_infinite]"
            style={{
              left: f.left, top: f.top,
              fontSize: `${f.size}rem`,
              opacity: f.opacity,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              color: "#fff",
            }}
          >
            {f.symbol}
          </span>
        ))}
        {/* gradiente radial central */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(255,215,0,0.04),transparent)]" />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3.5 bg-[rgba(8,8,15,0.85)] backdrop-blur-xl border-b border-white/6">
        <div className="flex items-center gap-2.5 font-[FredokaOne,sans-serif] text-xl">
          <span className="text-2xl">🧮</span>
          <span className="text-white">Math<span className="text-[#FFD700]">App</span></span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm font-bold text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Características</a>
          <a href="#islands" className="hover:text-white transition-colors">Islas</a>
          <a href="#pricing" className="hover:text-white transition-colors">Planes</a>
        </div>
        <button
          className="px-4 py-2 rounded-full bg-[#FFD700] text-[#08080f] text-sm font-black transition-all duration-150 hover:scale-105 active:scale-95"
          onClick={() => router.push("/auth")}
        >
          Jugar gratis →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-5 pt-24 pb-16">

        {/* badge */}
        <div className="inline-flex items-center gap-2 bg-white/6 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold text-white/60 mb-6 animate-[fadeDown_0.6s_ease_both]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Más de 70 niveles · Gratis para empezar
        </div>

        {/* título */}
        <h1 className="font-[FredokaOne,sans-serif] text-[clamp(2.8rem,10vw,5.5rem)] leading-[1.1] mb-4 animate-[fadeDown_0.7s_ease_both]">
          Las matemáticas<br />
          <span className="relative inline-block">
            <span className="relative z-10 text-transparent bg-clip-text bg-linear-to-r from-[#FFD700] via-[#FF8C00] to-[#FFD700] bg-size-[200%_100%] animate-[shimmer_3s_linear_infinite]">
              son un juego
            </span>
          </span>
        </h1>

        <p className="text-white/55 text-[clamp(0.95rem,3vw,1.15rem)] font-bold max-w-sm mb-8 leading-relaxed animate-[fadeDown_0.8s_ease_both]">
          Aprendé matemáticas explorando islas, superando niveles y ganando estrellas. Para todas las edades.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 animate-[fadeDown_0.9s_ease_both]">
          <button
            className="relative px-8 py-4 rounded-2xl font-black text-[#08080f] text-lg overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(255,215,0,0.4)] active:translate-y-0 shadow-[0_6px_0_rgba(200,140,0,0.5)]"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)" }}
            onClick={() => router.push("/auth")}
          >
            <span className="relative z-10">🚀 Empezar gratis</span>
          </button>
          <button
            className="px-6 py-4 rounded-2xl font-bold text-white/60 text-sm border border-white/10 hover:border-white/25 hover:text-white transition-all duration-200"
            onClick={() => document.getElementById("islands")?.scrollIntoView({ behavior: "smooth" })}
          >
            Ver el mapa →
          </button>
        </div>

        {/* preview del juego */}
        <div className="relative mt-14 w-full max-w-xs animate-[fadeUp_1s_ease_0.3s_both]">
          <div className="relative bg-[#0d0d18] border border-white/8 rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
            {/* topbar simulada */}
            <div className="flex items-center justify-between px-4 py-3 bg-[rgba(10,10,20,0.95)] border-b border-white/6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#2a1a4a] to-[#1a2a4a] flex items-center justify-center text-sm">🦖</div>
                <div>
                  <div className="text-[0.65rem] font-extrabold">Diego</div>
                  <div className="text-[0.55rem] text-white/40">3/10 niveles · ⭐ 7</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-white/[0.07] rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold">🔥<span className="text-orange-400">5</span></div>
                <div className="flex items-center gap-1 bg-white/[0.07] rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold">🪙<span className="text-[#FFD700]">140</span></div>
                <div className="flex items-center gap-1 bg-white/[0.07] rounded-full px-2 py-0.5 text-[0.6rem] font-extrabold">❤️<span className="text-red-400">4</span></div>
              </div>
            </div>
            {/* isla preview */}
            <div className="px-4 py-3 bg-[#0d2b0d]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🌿</span>
                <div>
                  <div className="text-[0.7rem] font-[FredokaOne,sans-serif] text-[#c8e6c9]">Reino de las Sumas</div>
                  <div className="text-[0.55rem] text-[#c8e6c9] opacity-50">3/10 completados</div>
                </div>
              </div>
            </div>
            {/* pregunta simulada */}
            <div className="px-4 py-4">
              <div className="bg-white/4 border border-white/[0.07] rounded-2xl px-4 py-4 text-center mb-3">
                <div className="text-[0.6rem] font-extrabold opacity-30 tracking-widest uppercase mb-1">Pregunta 3 / 5</div>
                <div className="font-[FredokaOne,sans-serif] text-lg">¿Cuánto es 7 + 8?</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["13", "15 ✓", "14", "16"].map((opt, i) => (
                  <div
                    key={i}
                    className={`py-2.5 rounded-xl text-center text-sm font-extrabold border-2 border-b-4 ${
                      i === 1
                        ? "bg-green-500/25 border-green-500 border-b-green-700 text-green-300"
                        : "bg-white/4 border-white/10 border-b-white/6 text-white/70"
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* glow */}
          <div className="absolute inset-0 rounded-3xl bg-[#FFD700]/3 blur-2xl scale-110 -z-10" />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 px-5 py-12 border-y border-white/5">
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
          {[
            { n: 70,   suffix: "+", label: "Niveles" },
            { n: 686,  suffix: "+", label: "Preguntas" },
            { n: 7,    suffix: "",  label: "Islas" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-[FredokaOne,sans-serif] text-3xl text-[#FFD700]">
                <CountUp to={s.n} suffix={s.suffix} />
              </div>
              <div className="text-white/40 text-xs font-bold mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ISLAS ── */}
      <section id="islands" className="relative z-10 px-5 py-16">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-extrabold text-[#FFD700]/60 tracking-widest uppercase mb-2">El mapa</div>
          <h2 className="font-[FredokaOne,sans-serif] text-[clamp(1.8rem,6vw,2.8rem)] leading-tight">
            7 islas, 7 aventuras
          </h2>
          <p className="text-white/40 text-sm font-bold mt-2 max-w-xs mx-auto">
            Cada isla tiene su propio mundo y desafíos. Desbloqueá todas.
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {ISLANDS.map((island, i) => (
            <div
              key={island.name}
              className="flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: island.bg,
                borderColor: `${island.color}33`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <span className="text-2xl">{island.icon}</span>
              <div className="flex-1">
                <div className="font-[FredokaOne,sans-serif] text-sm" style={{ color: island.color }}>
                  {island.name}
                </div>
                <div className="text-[0.65rem] font-bold opacity-40" style={{ color: island.color }}>
                  10 niveles · hasta 3 ⭐
                </div>
              </div>
              <div className="flex gap-px">
                {[1,2,3].map(s => (
                  <span key={s} className="text-[0.7rem]" style={{ opacity: i < 3 ? 1 : 0.2 }}>⭐</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 px-5 py-16 bg-white/1.5">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-extrabold text-[#FFD700]/60 tracking-widest uppercase mb-2">Por qué MathApp</div>
          <h2 className="font-[FredokaOne,sans-serif] text-[clamp(1.8rem,6vw,2.8rem)]">
            Aprender nunca fue<br />tan divertido
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white/3 border border-white/[0.07] rounded-2xl p-4 hover:border-[#FFD700]/20 hover:bg-white/5 transition-all duration-200"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-extrabold text-sm text-white mb-1">{f.title}</div>
              <div className="text-white/40 text-xs font-bold leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative z-10 px-5 py-16">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-extrabold text-[#FFD700]/60 tracking-widest uppercase mb-2">Planes</div>
          <h2 className="font-[FredokaOne,sans-serif] text-[clamp(1.8rem,6vw,2.8rem)]">
            Empezá gratis,<br />crecé sin límites
          </h2>
        </div>

        <div className="flex flex-col gap-4 max-w-sm mx-auto">
          {/* Free */}
          <div className="bg-white/3 border border-white/8 rounded-3xl p-6">
            <div className="font-[FredokaOne,sans-serif] text-xl mb-1">Gratis</div>
            <div className="font-[FredokaOne,sans-serif] text-4xl text-white mb-4">$0</div>
            <ul className="flex flex-col gap-2 mb-5">
              {["5 vidas por sesión", "Acceso a todas las islas", "Sistema de monedas", "Racha diaria"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm font-bold text-white/60">
                  <span className="text-white/30 text-xs">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white/60 font-extrabold text-sm hover:bg-white/10 transition-colors"
              onClick={() => router.push("/auth")}
            >
              Empezar gratis
            </button>
          </div>

          {/* Pro */}
          <div
            className="relative rounded-3xl p-6 border overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1a0a2e, #0a1a2e)", borderColor: "rgba(255,215,0,0.3)" }}
          >
            <div className="absolute top-4 right-4 bg-[#FFD700] text-[#08080f] text-[0.6rem] font-black px-2.5 py-1 rounded-full tracking-wide">
              MÁS POPULAR
            </div>
            <div className="font-[FredokaOne,sans-serif] text-xl text-[#FFD700] mb-1">Pro</div>
            <div className="flex items-end gap-1 mb-1">
              <span className="font-[FredokaOne,sans-serif] text-4xl text-white">$0.99</span>
              <span className="text-white/40 text-sm font-bold mb-1">USD/mes</span>
            </div>
            <div className="text-white/30 text-xs font-bold mb-4">Cancelá cuando quieras</div>
            <ul className="flex flex-col gap-2 mb-5">
              {["❤️ Vidas infinitas", "🚫 Sin publicidad", "🏝️ Todos los niveles", "⭐ Contenido exclusivo", "👑 Soporte prioritario"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm font-bold text-white/80">
                  <span className="text-[#FFD700] text-xs">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3.5 rounded-2xl font-black text-[#08080f] text-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,215,0,0.35)] shadow-[0_4px_0_rgba(180,120,0,0.4)]"
              style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)" }}
              onClick={() => router.push("/tienda")}
            >
              Obtener Pro 👑
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative z-10 px-5 py-20 text-center">
        <div className="relative max-w-sm mx-auto">
          <div className="absolute inset-0 bg-[#FFD700]/4 blur-3xl rounded-full scale-150" />
          <div className="relative">
            <div className="text-5xl mb-4 animate-[bounce_2s_ease-in-out_infinite]">🧮</div>
            <h2 className="font-[FredokaOne,sans-serif] text-[clamp(1.8rem,6vw,2.8rem)] mb-3 leading-tight">
              ¿Listo para la<br />aventura?
            </h2>
            <p className="text-white/40 text-sm font-bold mb-8 leading-relaxed">
              Más de 686 preguntas te esperan.<br />Empezá hoy, gratis, sin excusas.
            </p>
            <button
              className="px-10 py-4 rounded-2xl font-black text-[#08080f] text-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(255,215,0,0.45)] shadow-[0_6px_0_rgba(180,120,0,0.5)]"
              style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)" }}
              onClick={() => router.push("/auth")}
            >
              🚀 Jugar gratis ahora
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 px-5 py-8 border-t border-white/5 text-center text-white/20 text-xs font-bold">
        <div className="flex items-center justify-center gap-2 mb-2 font-[FredokaOne,sans-serif] text-base text-white/40">
          🧮 MathApp
        </div>
        <div>Aprendé matemáticas jugando · Todos los derechos reservados {new Date().getFullYear()}</div>
      </footer>

    </div>
  );
}