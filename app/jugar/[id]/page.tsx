"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "@/lib/supabase";

// ─── Tipos ───────────────────────────────────────────────────
interface Island {
  id: number;
  name: string;
  icon: string;
  order_index: number;
}

interface LevelRaw {
  id: string;
  name: string;
  icon: string;
  order_index: number;
  island_id: number;
  is_boss: boolean;
  time_limit_secs: number | null;
  questions_count: number;
  unlock_requires: string | null;
}

interface ProgressRow {
  level_id: string;
  stars: number;
}

interface Level extends LevelRaw {
  stars: number;
  status: "completed" | "current" | "locked";
}

// ─── Constantes fuera del componente ─────────────────────────
const ISLAND_THEMES: Record<
  number,
  {
    bg: string;
    node: string;
    nodeBorder: string;
    shadow: string;
    label: string;
  }
> = {
  1: {
    bg: "#0d2b0d",
    node: "#4CAF50",
    nodeBorder: "#2e7d32",
    shadow: "#4CAF5055",
    label: "#c8e6c9",
  },
  2: {
    bg: "#0a1f2e",
    node: "#29B6F6",
    nodeBorder: "#0277bd",
    shadow: "#29B6F655",
    label: "#b3e5fc",
  },
  3: {
    bg: "#2b1e0a",
    node: "#FFA726",
    nodeBorder: "#e65100",
    shadow: "#FFA72655",
    label: "#ffe0b2",
  },
  4: {
    bg: "#2b0a0a",
    node: "#EF5350",
    nodeBorder: "#b71c1c",
    shadow: "#EF535055",
    label: "#ffcdd2",
  },
  5: {
    bg: "#1e0a2b",
    node: "#CE93D8",
    nodeBorder: "#6a1b9a",
    shadow: "#CE93D855",
    label: "#f3e5f5",
  },
  6: {
    bg: "#0a142b",
    node: "#42A5F5",
    nodeBorder: "#0d47a1",
    shadow: "#42A5F555",
    label: "#bbdefb",
  },
  7: {
    bg: "#181818",
    node: "#78909C",
    nodeBorder: "#37474f",
    shadow: "#78909C55",
    label: "#eceff1",
  },
};

const SNAKE_X = [72, 50, 28, 50, 72, 50, 28, 50, 72, 50];
const NODE_H = 100;
const HDR_H = 72;
const PAD = 16;
const AVATARS = ["🦖", "🐙", "🐯", "🐲", "🦄", "🤖"];

// Generado una sola vez al cargar el módulo (no en cada render)
const STARS = Array.from({ length: 30 }).map(() => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: `${Math.random() * 4}s`,
  duration: `${2 + Math.random() * 3}s`,
  size: `${2 + Math.random() * 3}px`,
}));

// ─── Componente principal ─────────────────────────────────────
export default function MapaPage() {
  const router = useRouter();
  const {
    profile,
    user,
    loading: authLoading,
    signOut,
    refreshProfile,
  } = useAuth();

  const [islands, setIslands] = useState<Island[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // ─── Fetch datos ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      const [islandsRes, levelsRes, progressRes] = await Promise.all([
        supabase
          .from("islands")
          .select("id,name,icon,order_index")
          .eq("stage", 1)
          .order("order_index"),
        supabase
          .from("levels")
          .select(
            "id,name,icon,order_index,island_id,is_boss,time_limit_secs,questions_count,unlock_requires",
          )
          .order("island_id")
          .order("order_index"),
        supabase
          .from("user_progress")
          .select("level_id,stars")
          .eq("user_id", user!.id),
      ]);

      if (cancelled) return;

      const progressMap = new Map<string, number>(
        ((progressRes.data ?? []) as ProgressRow[]).map((p) => [
          p.level_id,
          p.stars,
        ]),
      );

      let foundCurrent = false;
      const processed: Level[] = ((levelsRes.data ?? []) as LevelRaw[]).map(
        (lvl) => {
          const stars = progressMap.get(lvl.id) ?? 0;
          let status: Level["status"] = "locked";
          if (stars > 0) {
            status = "completed";
          } else if (
            !foundCurrent &&
            (!lvl.unlock_requires || progressMap.has(lvl.unlock_requires))
          ) {
            status = "current";
            foundCurrent = true;
          }
          return { ...lvl, stars, status };
        },
      );

      if (!foundCurrent) {
        const first = processed.find((l) => l.status === "locked");
        if (first) first.status = "current";
      }

      setIslands((islandsRes.data ?? []) as Island[]);
      setLevels(processed);
      setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ─── Scroll al inicio ──────────────────────────────────────
  useEffect(() => {
    if (!loading && topRef.current) {
      topRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [loading]);

  // ─── Cambiar avatar ────────────────────────────────────────
  async function handleAvatarSelect(idx: number) {
    if (!user) return;
    setSavingAvatar(true);
    await supabase
      .from("profiles")
      .update({ avatar_id: idx + 1 })
      .eq("id", user.id);
    await refreshProfile();
    setSavingAvatar(false);
    setShowAvatars(false);
  }

  if (authLoading || loading) return <LoadingScreen />;

  const levelsByIsland = islands.map((island) =>
    levels
      .filter((l) => l.island_id === island.id)
      .sort((a, b) => a.order_index - b.order_index),
  );
  const totalStars = levels.reduce((s, l) => s + l.stars, 0);
  const completedCount = levels.filter((l) => l.status === "completed").length;
  const avatarEmoji = AVATARS[(profile?.avatar_id ?? 1) - 1] ?? "🦖";

  return (
    <>
      <style>{CSS}</style>

      {/* Fondo estrellado */}
      <div className="bg-stars" aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star-dot"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              animationDuration: s.duration,
              width: s.size,
              height: s.size,
            }}
          />
        ))}
      </div>

      <div className="mapa-root" ref={topRef}>
        {/* ── TOP BAR ── */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="avatar-btn"
              onClick={() => setShowAvatars((v) => !v)}
              title="Cambiar avatar"
            >
              {avatarEmoji}
            </button>
            <div>
              <div className="profile-name">
                {profile?.display_name ?? "Jugador"}
              </div>
              <div className="profile-sub">
                {completedCount}/70 niveles · ⭐ {totalStars}
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="stat-pill">
              🔥
              <span style={{ color: "#FF6B35" }}>
                {profile?.streak_days ?? 0}
              </span>
            </div>
            <div className="stat-pill">
              🪙<span style={{ color: "#FFD700" }}>{profile?.coins ?? 0}</span>
            </div>
            <div className="stat-pill">
              ❤️<span style={{ color: "#FF4757" }}>{profile?.lives ?? 5}</span>
            </div>
            <button
              className="menu-btn"
              onClick={() => setShowMenu((v) => !v)}
              aria-label="Menú"
            >
              ⋯
            </button>
          </div>
        </header>

        {/* ── DROPDOWN MENÚ ── */}
        {showMenu && (
          <div className="dropdown-menu">
            <button
              className="dropdown-item"
              onClick={() => {
                setShowAvatars(true);
                setShowMenu(false);
              }}
            >
              🎭 Cambiar avatar
            </button>
            <div className="dropdown-divider" />
            <button
              className="dropdown-item danger"
              onClick={async () => {
                await signOut();
                router.replace("/auth");
              }}
            >
              🚪 Cerrar sesión
            </button>
          </div>
        )}

        {/* ── SELECTOR DE AVATARES ── */}
        {showAvatars && (
          <div className="avatar-overlay" onClick={() => setShowAvatars(false)}>
            <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
              <div className="avatar-modal-title">Elegí tu avatar</div>
              <div className="avatar-grid">
                {AVATARS.map((av, i) => (
                  <button
                    key={i}
                    className={`avatar-option ${profile?.avatar_id === i + 1 ? "selected" : ""}`}
                    onClick={() => handleAvatarSelect(i)}
                    disabled={savingAvatar}
                  >
                    {av}
                  </button>
                ))}
              </div>
              <button
                className="avatar-close"
                onClick={() => setShowAvatars(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── MAPA ── */}
        <main className="mapa-scroll">
          {islands.map((island, islandIdx) => {
            const theme = ISLAND_THEMES[island.order_index] ?? ISLAND_THEMES[1];
            const islandLevels = levelsByIsland[islandIdx] ?? [];
            const completed = islandLevels.filter(
              (l) => l.status === "completed",
            ).length;
            const blockH = HDR_H + islandLevels.length * NODE_H + PAD * 2;

            const coords = islandLevels.map((_, i) => ({
              x: SNAKE_X[i % SNAKE_X.length],
              y: HDR_H + PAD + i * NODE_H + NODE_H / 2,
            }));

            return (
              <div key={island.id} className="island-block">
                {islandIdx > 0 && (
                  <div className="island-sep">
                    <div className="sep-line" />
                    <span className="sep-arrow">▲</span>
                    <div className="sep-line" />
                  </div>
                )}

                <div
                  className="island-header"
                  style={{
                    background: theme.bg,
                    borderColor: `${theme.node}44`,
                  }}
                >
                  <span className="island-icon">{island.icon}</span>
                  <div>
                    <div className="island-name" style={{ color: theme.label }}>
                      {island.name}
                    </div>
                    <div className="island-prog" style={{ color: theme.label }}>
                      {completed}/{islandLevels.length} completados
                    </div>
                  </div>
                </div>

                <div className="path-block" style={{ height: blockH }}>
                  <svg
                    className="path-svg"
                    viewBox={`0 0 100 ${blockH}`}
                    preserveAspectRatio="none"
                  >
                    {coords.map((c, i) => {
                      if (i === 0) return null;
                      const prev = coords[i - 1];
                      const active = islandLevels[i].status !== "locked";
                      return (
                        <line
                          key={i}
                          x1={prev.x}
                          y1={prev.y}
                          x2={c.x}
                          y2={c.y}
                          stroke={active ? theme.node : "#2a2a35"}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={active ? undefined : "5 4"}
                          opacity={active ? 0.45 : 0.25}
                        />
                      );
                    })}
                  </svg>

                  {islandLevels.map((level, i) => {
                    const c = coords[i];
                    const isCurrent = level.status === "current";
                    const isDone = level.status === "completed";
                    const isLocked = level.status === "locked";

                    return (
                      <div
                        key={level.id}
                        className="node-wrap"
                        style={{ left: `${c.x}%`, top: c.y }}
                      >
                        <div className="node-stars">
                          {[1, 2, 3].map((s) => (
                            <span
                              key={s}
                              style={{
                                fontSize: "0.65rem",
                                opacity: isDone && level.stars >= s ? 1 : 0.18,
                                filter:
                                  isDone && level.stars >= s
                                    ? `drop-shadow(0 0 4px ${theme.node})`
                                    : "none",
                              }}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>

                        <button
                          className={`node-btn ${level.status} ${level.is_boss ? "boss" : ""}`}
                          style={{
                            background: isDone
                              ? theme.node
                              : isCurrent
                                ? `linear-gradient(135deg, ${theme.node}, ${theme.nodeBorder})`
                                : undefined,
                            borderColor: isLocked
                              ? undefined
                              : theme.nodeBorder,
                            boxShadow: isCurrent
                              ? `0 4px 0 ${theme.nodeBorder}, 0 0 24px ${theme.shadow}`
                              : isDone
                                ? `0 4px 0 ${theme.nodeBorder}88, 0 0 12px ${theme.shadow}`
                                : undefined,
                          }}
                          disabled={isLocked}
                          onClick={() =>
                            !isLocked && router.push(`/jugar/${level.id}`)
                          }
                          aria-label={level.name}
                        >
                          {isLocked ? "🔒" : level.icon}
                          {isCurrent && (
                            <span
                              className="node-ping"
                              style={{ borderColor: theme.node }}
                            />
                          )}
                        </button>

                        <div
                          className="node-label"
                          style={{ color: isLocked ? "#3a3a45" : theme.label }}
                        >
                          {level.name.replace("JEFE: ", "👑 ")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="mapa-footer">
            ⭐ {totalStars} estrellas · {completedCount} niveles completados
          </div>
        </main>
      </div>
    </>
  );
}

// ─── Loading ──────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <>
      <style>{CSS}</style>
      <div className="loading-root">
        <div className="loading-emoji">🧮</div>
        <div className="loading-text">Cargando mapa...</div>
      </div>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: auto; }
body { background: #0a0a0f; overflow-x: hidden; min-height: 100dvh; }

.bg-stars {
  position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
  background: #0a0a0f;
}

.bg-stars {
  position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
}
.star-dot {
  position: absolute; border-radius: 50%; background: rgba(255,255,255,0.75);
  animation: twinkle ease-in-out infinite alternate;
}
@keyframes twinkle {
  from { opacity: 0.08; transform: scale(0.8); }
  to   { opacity: 0.85; transform: scale(1.2); }
}

.mapa-root {
  position: relative; z-index: 1; min-height: 100dvh;
  font-family: 'Nunito', sans-serif; color: #fff;
  display: flex; flex-direction: column; align-items: center;
  max-width: 520px; margin: 0 auto;
}

.topbar {
  position: sticky; top: 0; z-index: 50; width: 100%; padding: 10px 16px;
  background: rgba(10,10,15,0.9); backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
   position: relative;
}
.topbar-left  { display: flex; align-items: center; gap: 10px; }
.topbar-right { display: flex; align-items: center; gap: 8px; }

.avatar-btn {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #2a1a4a, #1a2a4a);
  border: 2px solid rgba(255,255,255,0.2); font-size: 1.4rem;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s, border-color 0.15s;
}
.avatar-btn:hover { transform: scale(1.08); border-color: rgba(255,255,255,0.4); }

.profile-name { font-size: 0.88rem; font-weight: 800; color: #fff; line-height: 1.1; }
.profile-sub  { font-size: 0.68rem; color: rgba(255,255,255,0.4); font-weight: 700; }

.stat-pill {
  display: flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 4px 9px; font-size: 0.78rem; font-weight: 800; color: #fff;
}

.menu-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.7); font-size: 1.2rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s; letter-spacing: -1px;
}
.menu-btn:hover { background: rgba(255,255,255,0.15); }

.dropdown-menu {
  position: fixed; top: 64px; right: 16px; z-index: 9999;
  background: #1a1a25; border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px; padding: 6px; min-width: 190px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  animation: fade-in 0.15s ease;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.dropdown-item {
  width: 100%; padding: 11px 14px; border-radius: 10px; border: none;
  background: transparent; color: rgba(255,255,255,0.85);
  font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 700;
  cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px;
  transition: background 0.12s;
}
.dropdown-item:hover { background: rgba(255,255,255,0.08); }
.dropdown-item.danger { color: #ef9a9a; }
.dropdown-item.danger:hover { background: rgba(239,83,80,0.12); }
.dropdown-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 4px 0; }

.avatar-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.75); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  animation: fade-in 0.2s ease;
}
.avatar-modal {
  background: #1a1a25; border: 1px solid rgba(255,255,255,0.12);
  border-radius: 24px; padding: 28px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 20px;
  width: min(340px, 90vw);
}
.avatar-modal-title { font-family: 'Fredoka One', sans-serif; font-size: 1.4rem; color: #fff; }
.avatar-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; }
.avatar-option {
  aspect-ratio: 1; border-radius: 16px; border: 2px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06); font-size: 2rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s, border-color 0.15s, background 0.15s;
}
.avatar-option:hover:not(:disabled) { transform: scale(1.08); background: rgba(255,255,255,0.12); }
.avatar-option.selected {
  border-color: #FFD700; background: rgba(255,215,0,0.12);
  box-shadow: 0 0 16px rgba(255,215,0,0.3);
}
.avatar-option:disabled { opacity: 0.5; cursor: wait; }
.avatar-close {
  width: 100%; padding: 12px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6);
  font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 700;
  cursor: pointer; transition: background 0.15s;
}
.avatar-close:hover { background: rgba(255,255,255,0.1); }

.mapa-scroll { width: 100%; padding: 12px 0 80px; display: flex; flex-direction: column; }

.island-block { width: 100%; }

.island-sep {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 28px; opacity: 0.25;
}
.sep-line  { flex: 1; height: 1px; background: rgba(255,255,255,0.2); }
.sep-arrow { font-size: 0.7rem; color: rgba(255,255,255,0.5); }

.island-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; margin: 0 12px 4px;
  border-radius: 16px; border: 1px solid transparent;
}
.island-icon { font-size: 1.8rem; flex-shrink: 0; }
.island-name { font-family: 'Fredoka One', sans-serif; font-size: 0.95rem; font-weight: 400; line-height: 1.2; }
.island-prog { font-size: 0.68rem; font-weight: 700; opacity: 0.55; margin-top: 1px; }

.path-block { position: relative; width: 100%; }
.path-svg   { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }

.node-wrap {
  position: absolute; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; z-index: 2;
}
.node-stars { display: flex; gap: 1px; margin-bottom: 5px; }

.node-btn {
  width: 62px; height: 62px; border-radius: 50%;
  border: 3px solid transparent; background: #2a2a35; color: #fff;
  font-size: 1.4rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  position: relative; transition: transform 0.14s; outline: none;
}
.node-btn.boss    { width: 72px; height: 72px; font-size: 1.7rem; }
.node-btn.current { animation: pulse-node 2s ease-in-out infinite; }
.node-btn.locked  { cursor: not-allowed; opacity: 0.5; filter: grayscale(0.6); }
.node-btn:active:not(.locked) { transform: scale(0.91); }

@keyframes pulse-node {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.07); }
}

.node-ping {
  position: absolute; inset: -8px; border-radius: 50%;
  border: 2px solid transparent;
  animation: ping-anim 2s ease-out infinite; opacity: 0;
}
@keyframes ping-anim {
  0%   { transform: scale(0.8); opacity: 0.7; }
  100% { transform: scale(1.5); opacity: 0;   }
}

.node-label {
  margin-top: 6px; font-size: 0.64rem; font-weight: 800;
  text-align: center; max-width: 78px; line-height: 1.2;
  padding: 2px 6px; border-radius: 6px; background: rgba(0,0,0,0.55);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.mapa-footer {
  text-align: center; padding: 28px 16px;
  color: rgba(255,255,255,0.18); font-size: 0.75rem; font-weight: 700;
}

.loading-root {
  min-height: 100dvh; background: #0a0a0f;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px;
  font-family: 'Nunito', sans-serif;
}
.loading-emoji { font-size: 3rem; animation: bounce-load 0.75s ease-in-out infinite alternate; }
.loading-text  { color: rgba(255,255,255,0.35); font-size: 0.9rem; font-weight: 700; }
@keyframes bounce-load { from { transform: translateY(0); } to { transform: translateY(-12px); } }

@media (min-width: 560px) {
  .mapa-root { border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05); }
  .node-btn      { width: 68px; height: 68px; }
  .node-btn.boss { width: 78px; height: 78px; }
}
`;
