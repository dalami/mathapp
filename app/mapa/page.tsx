"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { supabase } from "@/lib/supabase";
import { LivesPill } from "@/components/LivesBar";

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

const STARS_BG = Array.from({ length: 30 }).map(() => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: `${Math.random() * 4}s`,
  duration: `${2 + Math.random() * 3}s`,
  size: `${2 + Math.random() * 3}px`,
}));

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
  const [loadError, setLoadError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const fetchedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = user?.id;
  const profileStage = profile?.stage;

  useEffect(() => {
    fetchedRef.current = false;
  }, [userId]);

  // FIX: refreshProfile ya no está en las deps del useEffect principal.
  // Lo guardamos en ref para poder usarlo dentro sin que cause re-ejecución.
  const refreshProfileRef = useRef(refreshProfile);
  useEffect(() => {
    refreshProfileRef.current = refreshProfile;
  }, [refreshProfile]);

  const fetchData = useCallback(async () => {
    if (!userId || !profileStage) return;
    setLoading(true);
    setLoadError(false);

    // Timeout de seguridad: si en 10s no terminó, mostrar error con retry
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setLoadError(true);
    }, 10000);

    try {
      // restore_lives en background — no bloquea, y NO llama refreshProfile
      // para evitar que el cambio de profile re-dispare el useEffect
      void Promise.resolve(supabase.rpc("restore_lives", { p_user_id: userId }))
        .then(() => {
          refreshProfileRef.current();
        })
        .catch((e) => console.error("restore_lives:", e));

      const [islandsRes, levelsRes, progressRes] = await Promise.all([
        supabase
          .from("islands")
          .select("id,name,icon,order_index")
          .eq("stage", profileStage)
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
          .eq("user_id", userId),
      ]);

      if (islandsRes.error) console.error("islands error:", islandsRes.error);
      if (levelsRes.error) console.error("levels error:", levelsRes.error);
      if (progressRes.error)
        console.error("progress error:", progressRes.error);

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
    } catch (e) {
      console.error("fetchData error:", e);
      setLoadError(true);
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
    }
  }, [userId, profileStage]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.replace("/auth");
      return;
    }
    // Si hay usuario pero no hay profile todavía, esperar
    if (!profile) return;
    if (!profileStage) {
      router.replace("/etapa");
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchData();
  }, [authLoading, userId, profileStage, profile, router, fetchData]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loading) window.scrollTo({ top: 0, behavior: "instant" });
  }, [loading]);

  // Restaurar vidas cuando la app vuelve del background (PWA)
  useEffect(() => {
    if (!userId) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await supabase.rpc("restore_lives", { p_user_id: userId });
        refreshProfileRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [userId]);

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

  // Pantalla de error con retry
  if (loadError) {
    return (
      <div className="min-h-dvh bg-[#0a0a0f] flex flex-col items-center justify-center gap-5 font-[Nunito,sans-serif] px-6 text-center">
        <div className="text-5xl">😵</div>
        <div className="text-white/60 text-sm font-bold">
          No se pudo cargar el mapa
        </div>
        <button
          className="px-6 py-3 rounded-2xl bg-white/10 border border-white/15 text-white font-extrabold text-sm cursor-pointer hover:bg-white/18 transition-colors"
          onClick={() => {
            fetchedRef.current = false;
            setLoadError(false);
            fetchData();
          }}
        >
          Reintentar 🔄
        </button>
      </div>
    );
  }

  if (authLoading || (userId && profile && loading)) return <LoadingScreen />;
  if (!user || !profile) return <LoadingScreen />;

  const levelsByIsland = islands.map((island) =>
    levels
      .filter((l) => l.island_id === island.id)
      .sort((a, b) => a.order_index - b.order_index),
  );
  const totalStars = levels.reduce((s, l) => s + l.stars, 0);
  const completedCount = levels.filter((l) => l.status === "completed").length;
  const avatarEmoji = AVATARS[(profile?.avatar_id ?? 1) - 1] ?? "🦖";
  const totalLevels = islands.length * 10;

  return (
    <>
      {/* ── ESTRELLAS DE FONDO ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0a0a0f]"
        aria-hidden="true"
      >
        {STARS_BG.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white/75 animate-[twinkle_ease-in-out_infinite_alternate]"
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

      <div
        className="relative z-10 min-h-dvh font-[Nunito,sans-serif] text-white flex flex-col items-center max-w-130 mx-auto"
        ref={topRef}
      >
        {/* ── TOP BAR ── */}
        <header className="sticky top-0 z-50 w-full px-4 py-2.5 bg-[rgba(10,10,15,0.97)] border-b border-white/[0.07] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              className="w-10 h-10 rounded-full shrink-0 bg-linear-to-br from-[#2a1a4a] to-[#1a2a4a] border-2 border-white/20 text-[1.4rem] cursor-pointer flex items-center justify-center transition-transform duration-150 hover:scale-[1.08] hover:border-white/40"
              onClick={() => setShowAvatars((v) => !v)}
              title="Cambiar avatar"
            >
              {avatarEmoji}
            </button>
            <div>
              <div className="text-sm font-extrabold text-white leading-tight">
                {profile?.display_name ?? "Jugador"}
              </div>
              <div className="text-[0.68rem] text-white/40 font-bold">
                {completedCount}/{totalLevels} niveles · ⭐ {totalStars}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/[0.07] border border-white/10 rounded-full px-2.5 py-1 text-xs font-extrabold text-white">
              🔥
              <span className="text-[#FF6B35]">
                {profile?.streak_days ?? 0}
              </span>
            </div>
            <div
              className="relative group flex items-center gap-1 bg-white/[0.07] border border-white/10 rounded-full px-2.5 py-1 text-xs font-extrabold text-white cursor-pointer hover:bg-white/12 transition-colors"
              onClick={() => router.push("/tienda")}
            >
              🪙<span className="text-[#FFD700]">{profile?.coins ?? 0}</span>
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#1a1a25] border border-white/10 text-white/70 text-[0.65rem] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                Tienda 🛒
              </span>
            </div>
            <LivesPill
              lives={profile?.lives ?? 5}
              livesResetAt={profile?.lives_reset_at ?? null}
              userId={user?.id}
              onRestored={() => refreshProfileRef.current()}
            />
            <button
              className="w-8 h-8 rounded-full bg-white/8 border border-white/12 text-white/70 text-lg cursor-pointer flex items-center justify-center transition-colors duration-150 hover:bg-white/15 tracking-[-1px]"
              onClick={() => setShowMenu((v) => !v)}
              aria-label="Menú"
            >
              ⋯
            </button>
          </div>
        </header>

        {/* ── DROPDOWN MENÚ ── */}
        {showMenu && (
          <div className="fixed top-16 right-[max(16px,calc(50vw-244px))] z-9999 bg-[#1a1a25] border border-white/12 rounded-2xl p-1.5 min-w-47.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-[fadeIn_0.15s_ease]">
            <button
              className="w-full px-3.5 py-2.5 rounded-xl border-none bg-transparent text-white/85 font-[Nunito,sans-serif] text-sm font-bold cursor-pointer text-left flex items-center gap-2 transition-colors duration-150 hover:bg-white/8"
              onClick={() => {
                setShowAvatars(true);
                setShowMenu(false);
              }}
            >
              🎭 Cambiar avatar
            </button>
            <div className="h-px bg-white/8 my-1" />
            <button
              className="w-full px-3.5 py-2.5 rounded-xl border-none bg-transparent text-white/85 font-[Nunito,sans-serif] text-sm font-bold cursor-pointer text-left flex items-center gap-2 transition-colors duration-150 hover:bg-white/8"
              onClick={() => {
                setShowMenu(false);
                router.push("/etapa");
              }}
            >
              🌍 Cambiar etapa
            </button>
            <div className="h-px bg-white/8 my-1" />
            <button
              className="w-full px-3.5 py-2.5 rounded-xl border-none bg-transparent text-white/85 font-[Nunito,sans-serif] text-sm font-bold cursor-pointer text-left flex items-center gap-2 transition-colors duration-150 hover:bg-white/8"
              onClick={() => {
                setShowMenu(false);
                router.push("/tienda");
              }}
            >
              🛒 Tienda
            </button>
            <div className="h-px bg-white/8 my-1" />
            <button
              className="w-full px-3.5 py-2.5 rounded-xl border-none bg-transparent text-[#ef9a9a] font-[Nunito,sans-serif] text-sm font-bold cursor-pointer text-left flex items-center gap-2 transition-colors duration-150 hover:bg-[rgba(239,83,80,0.12)]"
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
          <div
            className="fixed inset-0 z-300 bg-black/75 backdrop-blur-[10px] flex items-center justify-center animate-[fadeIn_0.2s_ease]"
            onClick={() => setShowAvatars(false)}
          >
            <div
              className="bg-[#1a1a25] border border-white/12 rounded-3xl p-7 flex flex-col items-center gap-5 w-[min(340px,90vw)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-[FredokaOne,sans-serif] text-xl text-white">
                Elegí tu avatar
              </div>
              <div className="grid grid-cols-3 gap-3 w-full">
                {AVATARS.map((av, i) => (
                  <button
                    key={i}
                    className={`aspect-square rounded-2xl border-2 text-4xl cursor-pointer flex items-center justify-center transition-all duration-150 disabled:opacity-50 disabled:cursor-wait hover:bg-white/12 ${
                      profile?.avatar_id === i + 1
                        ? "border-[#FFD700] bg-[rgba(255,215,0,0.12)] shadow-[0_0_16px_rgba(255,215,0,0.3)]"
                        : "border-white/10 bg-white/6"
                    }`}
                    onClick={() => handleAvatarSelect(i)}
                    disabled={savingAvatar}
                  >
                    {av}
                  </button>
                ))}
              </div>
              <button
                className="w-full py-3 rounded-xl border border-white/12 bg-white/6 text-white/60 font-[Nunito,sans-serif] text-sm font-bold cursor-pointer transition-colors duration-150 hover:bg-white/10"
                onClick={() => setShowAvatars(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── MAPA ── */}
        <main className="w-full pt-3 pb-20 flex flex-col">
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
              <div key={island.id} className="w-full">
                {islandIdx > 0 && (
                  <div className="flex items-center gap-2.5 px-7 py-1.5 opacity-25">
                    <div className="flex-1 h-px bg-white/20" />
                    <span className="text-xs text-white/50">▲</span>
                    <div className="flex-1 h-px bg-white/20" />
                  </div>
                )}

                <div
                  className="flex items-center gap-3 px-5 py-3.5 mx-3 mb-1 rounded-2xl border border-transparent"
                  style={{
                    background: theme.bg,
                    borderColor: `${theme.node}44`,
                  }}
                >
                  <span className="text-3xl shrink-0">{island.icon}</span>
                  <div>
                    <div
                      className="font-[FredokaOne,sans-serif] text-[0.95rem] leading-tight"
                      style={{ color: theme.label }}
                    >
                      {island.name}
                    </div>
                    <div
                      className="text-[0.68rem] font-bold opacity-55 mt-px"
                      style={{ color: theme.label }}
                    >
                      {completed}/{islandLevels.length} completados
                    </div>
                  </div>
                </div>

                <div className="relative w-full" style={{ height: blockH }}>
                  <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
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
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-2"
                        style={{ left: `${c.x}%`, top: c.y }}
                      >
                        <div className="flex gap-px mb-1">
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
                          className={`
                            rounded-full border-[3px] border-transparent bg-[#2a2a35] text-white
                            flex items-center justify-center relative outline-none
                            transition-transform duration-140ms active:scale-[0.91]
                            ${level.is_boss ? "w-18 h-18 text-[1.7rem]" : "w-16 h-16 text-[1.4rem]"}
                            ${isCurrent ? "animate-[pulseNode_2s_ease-in-out_infinite]" : ""}
                            ${isLocked ? "cursor-not-allowed opacity-50 grayscale-[0.6]" : "cursor-pointer"}
                          `}
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
                          onClick={() => {
                            if (!isLocked) router.push(`/jugar/${level.id}`);
                          }}
                          aria-label={level.name}
                        >
                          {isLocked ? "🔒" : level.icon}
                          {isCurrent && (
                            <span
                              className="absolute -inset-2 rounded-full border-2 border-transparent animate-[pingAnim_2s_ease-out_infinite] opacity-0"
                              style={{ borderColor: theme.node }}
                            />
                          )}
                        </button>

                        <div
                          className="mt-1.5 text-[0.64rem] font-extrabold text-center max-w-19.5 leading-tight px-1.5 py-px rounded-md bg-black/55 whitespace-nowrap overflow-hidden text-ellipsis"
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

          <div className="text-center px-4 py-7 text-white/18 text-xs font-bold">
            ⭐ {totalStars} estrellas · {completedCount} niveles completados
          </div>
        </main>
      </div>
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex flex-col items-center justify-center gap-3.5 font-[Nunito,sans-serif]">
      <div className="text-5xl animate-[bounceLoad_0.75s_ease-in-out_infinite_alternate]">
        🧮
      </div>
      <div className="text-white/35 text-sm font-bold">Cargando mapa...</div>
    </div>
  );
}
