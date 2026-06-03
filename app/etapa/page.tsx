"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/lib/supabase";

const ETAPAS = [
  {
    stage: 1,
    nombre: "Exploradores",
    emoji: "🌱",
    edad: "6 a 12 años",
    descripcion: "Sumas, restas, multiplicación, fracciones y más",
    color: "#4CAF50",
    border: "#2e7d32",
    bg: "#0d2b0d",
    disponible: true,
  },
  {
    stage: 2,
    nombre: "Aventureros",
    emoji: "🚀",
    edad: "12 a 18 años",
    descripcion: "Álgebra, ecuaciones, trigonometría y funciones",
    color: "#29B6F6",
    border: "#0277bd",
    bg: "#0a1f2e",
    disponible: false,
  },
  {
    stage: 3,
    nombre: "Desafiantes",
    emoji: "🎯",
    edad: "Pre-universitario",
    descripcion: "Límites, derivadas y sistemas de ecuaciones",
    color: "#FFA726",
    border: "#e65100",
    bg: "#2b1e0a",
    disponible: false,
  },
  {
    stage: 4,
    nombre: "Expertos",
    emoji: "🏆",
    edad: "Universidad",
    descripcion: "Cálculo, álgebra lineal y estadística avanzada",
    color: "#CE93D8",
    border: "#6a1b9a",
    bg: "#1e0a2b",
    disponible: false,
  },
];

export default function EtapaPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  async function handleSelect(stage: number) {
    if (!user || saving) return;
    setSelected(stage);
    setSaving(true);

    await supabase
      .from("profiles")
      .update({ stage })
      .eq("id", user.id);

    await refreshProfile();
    router.replace("/mapa");
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="etapa-root">

        <div className="etapa-header">
          <div className="etapa-logo">🧮</div>
          <h1 className="etapa-title">¿Cuál es tu nivel?</h1>
          <p className="etapa-sub">Elegí tu etapa para empezar. Podés cambiarla cuando quieras.</p>
        </div>

        <div className="etapa-grid">
          {ETAPAS.map(e => (
            <button
              key={e.stage}
              className={`etapa-card ${!e.disponible ? "locked" : ""} ${selected === e.stage ? "selecting" : ""}`}
              style={{
                background: e.bg,
                borderColor: e.disponible ? `${e.color}55` : "rgba(255,255,255,0.06)",
              }}
              disabled={!e.disponible || saving}
              onClick={() => handleSelect(e.stage)}
            >
              {!e.disponible && <div className="card-lock">🔒 Próximamente</div>}

              <div className="card-emoji" style={{ filter: e.disponible ? `drop-shadow(0 0 12px ${e.color}88)` : "grayscale(1) opacity(0.4)" }}>
                {e.emoji}
              </div>

              <div className="card-nombre" style={{ color: e.disponible ? e.color : "rgba(255,255,255,0.3)" }}>
                {e.nombre}
              </div>

              <div className="card-edad" style={{ color: e.disponible ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}>
                {e.edad}
              </div>

              <div className="card-desc" style={{ color: e.disponible ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.15)" }}>
                {e.descripcion}
              </div>

              {e.disponible && (
                <div className="card-cta" style={{ background: e.color, color: "#0a0a0f" }}>
                  {selected === e.stage ? "Cargando..." : "Empezar →"}
                </div>
              )}
            </button>
          ))}
        </div>

      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0a0a0f; min-height: 100dvh; overflow-x: hidden; }

.etapa-root {
  min-height: 100dvh; background: #0a0a0f;
  font-family: 'Nunito', sans-serif; color: #fff;
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 20px 60px;
  gap: 32px;
}

.etapa-header { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }

.etapa-logo {
  font-size: 3.5rem;
  animation: bounce-logo 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 16px rgba(255,200,0,0.4));
}
@keyframes bounce-logo {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

.etapa-title {
  font-family: 'Fredoka One', sans-serif;
  font-size: clamp(1.8rem, 5vw, 2.4rem);
  font-weight: 400; color: #fff;
}

.etapa-sub {
  font-size: 0.9rem; font-weight: 700;
  color: rgba(255,255,255,0.4);
  max-width: 320px; line-height: 1.5;
}

.etapa-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  width: 100%;
  max-width: 480px;
}

@media (max-width: 400px) {
  .etapa-grid { grid-template-columns: 1fr; }
}

.etapa-card {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 24px 16px 20px;
  border-radius: 20px; border: 1.5px solid transparent;
  cursor: pointer; text-align: center;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  overflow: hidden;
}

.etapa-card:not(.locked):hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.etapa-card:not(.locked):active { transform: translateY(0); }
.etapa-card.locked { cursor: not-allowed; }
.etapa-card.selecting { opacity: 0.7; }
.etapa-card:disabled { cursor: not-allowed; }

.card-lock {
  position: absolute; top: 10px; right: 10px;
  font-size: 0.65rem; font-weight: 800;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 3px 8px;
  color: rgba(255,255,255,0.35);
}

.card-emoji { font-size: 2.8rem; line-height: 1; }

.card-nombre {
  font-family: 'Fredoka One', sans-serif;
  font-size: 1.2rem; font-weight: 400;
  line-height: 1.1;
}

.card-edad {
  font-size: 0.72rem; font-weight: 800;
  letter-spacing: 0.5px;
}

.card-desc {
  font-size: 0.72rem; font-weight: 700;
  line-height: 1.4;
}

.card-cta {
  margin-top: 8px;
  padding: 9px 20px; border-radius: 12px;
  font-size: 0.85rem; font-weight: 900;
  box-shadow: 0 4px 0 rgba(0,0,0,0.2);
  transition: transform 0.12s, box-shadow 0.12s;
}
.etapa-card:not(.locked):hover .card-cta {
  transform: translateY(-1px);
  box-shadow: 0 5px 0 rgba(0,0,0,0.2);
}
`;