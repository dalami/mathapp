"use client";

import { useEffect, useState } from "react";

// ─── Números flotantes de fondo ───────────────────────────────
const FLOAT_ITEMS = [
  "1",
  "2",
  "3",
  "+",
  "×",
  "7",
  "π",
  "∞",
  "=",
  "9",
  "÷",
  "5",
  "√",
  "8",
  "−",
  "4",
  "∑",
  "6",
  "%",
  "0",
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

const PLAY_STORE =
  "https://play.google.com/apps/internaltest/4701392344833701397";

// ─── Etapas ───────────────────────────────────────────────────
const STAGES = [
  {
    icon: "🌱",
    name: "Exploradores",
    age: "6 a 12 años",
    desc: "Primaria completa. Sumas, restas, multiplicación, división, fracciones y más. 7 islas, 70 niveles.",
    color: "#4CAF50",
    bg: "linear-gradient(135deg, #0d2b0d, #0a1a0a)",
    border: "#4CAF5033",
    status: "available",
    islands: 7,
    levels: 70,
  },
  {
    icon: "🚀",
    name: "Aventureros",
    age: "12 a 18 años",
    desc: "Secundaria completa. Álgebra, geometría, trigonometría, estadística y funciones.",
    color: "#29B6F6",
    bg: "linear-gradient(135deg, #0a1f2e, #081520)",
    border: "#29B6F633",
    status: "available",
    islands: 9,
    levels: 135,
  },
  {
    icon: "🎯",
    name: "Desafiantes",
    age: "Pre-universitario",
    desc: "Ingreso universitario. Cálculo, álgebra lineal, probabilidad y resolución de problemas complejos.",
    color: "#FFA726",
    bg: "linear-gradient(135deg, #2b1e0a, #1a1205)",
    border: "#FFA72633",
    status: "available",
    islands: 9,
    levels: 135,
  },
  {
    icon: "🏆",
    name: "Expertos",
    age: "Universidad",
    desc: "Nivel universitario. Cálculo diferencial e integral, álgebra abstracta y matemática avanzada.",
    color: "#FFD700",
    bg: "linear-gradient(135deg, #1a1205, #0f0c00)",
    border: "#FFD70033",
    status: "available",
    islands: 12,
    levels: 180,
  },
];

// ─── Features ─────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🗺️",
    title: "Mapa de aventuras",
    desc: "Islas temáticas con niveles que se desbloquean progresivamente.",
  },
  {
    icon: "⭐",
    title: "Sistema de estrellas",
    desc: "Hasta 3 estrellas por nivel según tu desempeño. ¿Podés perfeccionarlos todos?",
  },
  {
    icon: "❤️",
    title: "Vidas y desafíos",
    desc: "Cada error cuesta una vida. Pensá antes de responder. Las vidas se regeneran con el tiempo.",
  },
  {
    icon: "🪙",
    title: "Monedas y recompensas",
    desc: "Ganás monedas jugando. Usálas para power-ups, pistas y más vidas.",
  },
  {
    icon: "🔥",
    title: "Racha diaria",
    desc: "Jugá todos los días y mantenés tu racha. El aprendizaje es un hábito.",
  },
  {
    icon: "👑",
    title: "Plan Pro",
    desc: "Vidas infinitas, sin publicidad y acceso anticipado a todas las etapas.",
  },
];

// ─── Contador animado ─────────────────────────────────────────
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = to / 40;
    const t = setInterval(() => {
      start += step;
      if (start >= to) {
        setVal(to);
        clearInterval(t);
      } else setVal(Math.floor(start));
    }, 35);
    return () => clearInterval(t);
  }, [to]);

  return (
    <span>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Página ───────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-fit bg-[#08080f] text-white overflow-x-hidden font-[Nunito,sans-serif] selection:bg-[#FFD700] selection:text-[#08080f]">
      {/* ── FONDO ANIMADO ── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className="absolute font-[FredokaOne,sans-serif] select-none animate-[floatUp_linear_infinite]"
            style={{
              left: f.left,
              top: f.top,
              fontSize: `${f.size}rem`,
              opacity: f.opacity,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
            }}
          >
            {f.symbol}
          </span>
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(255,215,0,0.04),transparent)]" />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3.5 bg-[rgba(8,8,15,0.9)] backdrop-blur-xl border-b border-white/6">
        <div className="flex items-center gap-2 font-[FredokaOne,sans-serif] text-xl">
          <span className="text-2xl">🧮</span>
          <span>
            Math<span className="text-[#FFD700]">App</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-5 text-sm font-bold text-white/50">
          <a href="#etapas" className="hover:text-white transition-colors">
            Etapas
          </a>
        </div>
        <a
          href={PLAY_STORE}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-full bg-[#FFD700] text-[#08080f] text-sm font-black transition-all duration-150 hover:scale-105 active:scale-95 shadow-[0_4px_0_rgba(180,120,0,0.5)]"
        >
          📲 Descargar app
          <br />
          <span className="text-[0.7em] font-bold opacity-70">
            (Solo Android)
          </span>
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-5 pt-28 pb-10">
        <div className="inline-flex items-center gap-2 bg-white/6 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold text-white/50 mb-6 animate-[fadeDown_0.6s_ease_both]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          4 etapas · De primaria a universidad · Gratis para empezar
        </div>

        <h1 className="font-[FredokaOne,sans-serif] text-[clamp(2.6rem,10vw,5.5rem)] leading-[1.1] mb-4 animate-[fadeDown_0.7s_ease_both]">
          Las matemáticas
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FFD700] via-[#FF8C00] to-[#FFD700] bg-size-[200%_100%] animate-[shimmer_3s_linear_infinite]">
            son una aventura
          </span>
        </h1>

        <p className="text-white/50 text-[clamp(0.95rem,3vw,1.1rem)] font-bold max-w-sm mb-8 leading-relaxed animate-[fadeDown_0.8s_ease_both]">
          Explorá islas, superá desafíos y dominá las matemáticas desde los 6
          años hasta la universidad.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 animate-[fadeDown_0.9s_ease_both]">
          <a
            href={PLAY_STORE}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-2xl font-black text-[#08080f] text-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(255,215,0,0.4)] active:translate-y-0 shadow-[0_6px_0_rgba(180,120,0,0.5)]"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)" }}
          >
            📲 Descargar app
            <br />
            <span className="text-[0.7em] font-bold opacity-70">
              (Solo Android)
            </span>
          </a>
          <button
            className="px-6 py-4 rounded-2xl font-bold text-white/50 text-sm border border-white/10 hover:border-white/25 hover:text-white transition-all duration-200"
            onClick={() =>
              document
                .getElementById("etapas")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Ver etapas →
          </button>
        </div>

        {/* ── VIDEO/GIF GAMEPLAY ── */}
        <div className="relative mt-12 w-full max-w-[320px] animate-[fadeUp_1s_ease_0.3s_both]">
          <div className="relative rounded-3xl overflow-hidden border border-white/8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] aspect-9/13 bg-[#0d0d18] flex flex-col items-center justify-center gap-4">
            <video
              src="/MathApp.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="text-6xl animate-[bounce_2s_ease-in-out_infinite]">
              🎮
            </div>
            <div className="text-white/30 text-sm font-bold text-center px-8 leading-relaxed">
              Video de gameplay
              <br />
              próximamente
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-[#08080f] via-transparent to-transparent" />
          </div>
          {/* glow */}
          <div className="absolute inset-0 rounded-3xl bg-[#FFD700]/3 blur-3xl scale-125 -z-10" />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 px-5 py-12 border-y border-white/5">
        <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto text-center">
          {[
            { n: 4, suffix: "", label: "Etapas" },
            { n: 280, suffix: "+", label: "Niveles" },
            { n: 686, suffix: "+", label: "Preguntas" },
            { n: 28, suffix: "", label: "Islas" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-[FredokaOne,sans-serif] text-2xl text-[#FFD700]">
                <CountUp to={s.n} suffix={s.suffix} />
              </div>
              <div className="text-white/35 text-[0.6rem] font-bold mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ETAPAS ── */}
      <section id="etapas" className="relative z-10 px-5 py-16">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-extrabold text-[#FFD700]/60 tracking-widest uppercase mb-2">
            Para cada edad
          </div>
          <h2 className="font-[FredokaOne,sans-serif] text-[clamp(1.8rem,6vw,2.8rem)] leading-tight">
            Tu aventura, tu etapa
          </h2>
          <p className="text-white/35 text-sm font-bold mt-2 max-w-xs mx-auto">
            Desde los primeros números hasta el cálculo avanzado. Un camino
            completo.
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-sm mx-auto">
          {STAGES.map((stage) => (
            <div
              key={stage.name}
              className="relative rounded-3xl border overflow-hidden transition-all duration-200 hover:scale-[1.02]"
              style={{ background: stage.bg, borderColor: stage.border }}
            >
              {stage.status === "soon" && (
                <div className="absolute top-3 right-3 bg-white/10 border border-white/10 text-white/40 text-[0.58rem] font-black px-2 py-0.5 rounded-full tracking-wide">
                  PRÓXIMAMENTE
                </div>
              )}
              {stage.status === "available" && (
                <div
                  className="absolute top-3 right-3 text-[0.58rem] font-black px-2 py-0.5 rounded-full tracking-wide"
                  style={{
                    background: `${stage.color}22`,
                    color: stage.color,
                    border: `1px solid ${stage.color}44`,
                  }}
                >
                  ✓ DISPONIBLE
                </div>
              )}

              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{stage.icon}</span>
                  <div>
                    <div
                      className="font-[FredokaOne,sans-serif] text-lg leading-tight"
                      style={{ color: stage.color }}
                    >
                      {stage.name}
                    </div>
                    <div
                      className="text-[0.68rem] font-bold opacity-50"
                      style={{ color: stage.color }}
                    >
                      {stage.age}
                    </div>
                  </div>
                </div>
                <p className="text-white/50 text-xs font-bold leading-relaxed mb-3">
                  {stage.desc}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center gap-1 text-[0.65rem] font-extrabold"
                    style={{ color: stage.color }}
                  >
                    🏝️ {stage.islands} islas
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div
                    className="flex items-center gap-1 text-[0.65rem] font-extrabold"
                    style={{ color: stage.color }}
                  >
                    🎯 {stage.levels} niveles
                  </div>
                  {stage.status === "available" && (
                    <>
                      <div className="w-px h-3 bg-white/10" />
                      <div
                        className="flex items-center gap-1 text-[0.65rem] font-extrabold"
                        style={{ color: stage.color }}
                      >
                        ⭐ hasta 3 estrellas
                      </div>
                    </>
                  )}
                </div>
              </div>

              {stage.status === "available" && (
                <div className="px-5 pb-4">
                  <a
                    href={PLAY_STORE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 rounded-2xl font-extrabold text-[#08080f] text-sm text-center transition-all duration-150 hover:-translate-y-0.5 shadow-[0_3px_0_rgba(0,0,0,0.3)]"
                    style={{
                      background: `linear-gradient(135deg, ${stage.color}, ${stage.color}cc)`,
                    }}
                  >
                    📲 Descargar
                    <br />
                    <span className="text-[0.7em] font-bold opacity-70">
                      (Solo Android)
                    </span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 px-5 py-16">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-extrabold text-[#FFD700]/60 tracking-widest uppercase mb-2">
            Por qué MathApp
          </div>
          <h2 className="font-[FredokaOne,sans-serif] text-[clamp(1.8rem,6vw,2.8rem)]">
            Aprender nunca fue
            <br />
            tan divertido
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white/3 border border-white/[0.07] rounded-2xl p-4 hover:border-[#FFD700]/20 hover:bg-white/5 transition-all duration-200"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-extrabold text-sm text-white mb-1">
                {f.title}
              </div>
              <div className="text-white/35 text-xs font-bold leading-relaxed">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative z-10 px-5 py-20 text-center">
        <div className="relative max-w-sm mx-auto">
          <div className="absolute inset-0 bg-[#FFD700]/4 blur-3xl rounded-full scale-150" />
          <div className="relative">
            <div className="text-5xl mb-4 animate-[bounce_2s_ease-in-out_infinite]">
              🧮
            </div>
            <h2 className="font-[FredokaOne,sans-serif] text-[clamp(1.8rem,6vw,2.8rem)] mb-3 leading-tight">
              ¿Listo para la
              <br />
              aventura?
            </h2>
            <p className="text-white/40 text-sm font-bold mb-8 leading-relaxed">
              Más de 686 preguntas te esperan.
              <br />
              Empezá hoy, gratis, sin excusas.
            </p>
            <a
              href={PLAY_STORE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-10 py-4 rounded-2xl font-black text-[#08080f] text-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(255,215,0,0.45)] shadow-[0_6px_0_rgba(180,120,0,0.5)]"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FF8C00)",
              }}
            >
              📲 Descargar app ahora
              <br />
              <span className="text-[0.7em] font-bold opacity-70">
                (Solo Android)
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 px-5 py-8 border-t border-white/5 text-center text-white/20 text-xs font-bold">
        <div className="flex items-center justify-center gap-2 mb-2 font-[FredokaOne,sans-serif] text-base text-white/35">
          🧮 MathApp
        </div>
        <div>
          Aprendé matemáticas jugando · Todos los derechos reservados 2026
        </div>
      </footer>
    </div>
  );
}
