"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
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

// ─── Colores por isla ────────────────────────────────────────
const ISLAND_THEMES: Record<
  number,
  { bg: string; node: string; nodeBorder: string; glow: string; label: string }
> = {
  1: {
    bg: "#1a4a1a",
    node: "#4CAF50",
    nodeBorder: "#2e7d32",
    glow: "#4CAF5066",
    label: "#c8e6c9",
  },
  2: {
    bg: "#1a3a4a",
    node: "#29B6F6",
    nodeBorder: "#0277bd",
    glow: "#29B6F666",
    label: "#b3e5fc",
  },
  3: {
    bg: "#4a3a1a",
    node: "#FFA726",
    nodeBorder: "#e65100",
    glow: "#FFA72666",
    label: "#ffe0b2",
  },
  4: {
    bg: "#4a1a1a",
    node: "#EF5350",
    nodeBorder: "#b71c1c",
    glow: "#EF535066",
    label: "#ffcdd2",
  },
  5: {
    bg: "#3a1a4a",
    node: "#CE93D8",
    nodeBorder: "#6a1b9a",
    glow: "#CE93D866",
    label: "#f3e5f5",
  },
  6: {
    bg: "#1a2a4a",
    node: "#42A5F5",
    nodeBorder: "#0d47a1",
    glow: "#42A5F566",
    label: "#bbdefb",
  },
  7: {
    bg: "#2a2a2a",
    node: "#78909C",
    nodeBorder: "#37474f",
    glow: "#78909C66",
    label: "#eceff1",
  },
};

const SNAKE_POSITIONS = [
  { x: 75 },
  { x: 50 },
  { x: 25 },
  { x: 50 },
  { x: 75 },
  { x: 50 },
  { x: 25 },
  { x: 50 },
  { x: 75 },
  { x: 50 },
];

const NODE_HEIGHT = 90;
const ISLAND_HEADER = 80;
const ISLAND_PADDING = 24;

export default function MapaPage() {
  const router = useRouter();
  const { profile, user, loading: authLoading } = useAuth();
  const [islands, setIslands] = useState<Island[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const currentLevelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setLoading(true);

      const { data: islandsData } = await supabase
        .from("islands")
        .select("id, name, icon, order_index")
        .eq("stage", 1)
        .order("order_index");

      const { data: levelsData } = await supabase
        .from("levels")
        .select(
          "id, name, icon, order_index, island_id, is_boss, time_limit_secs, questions_count, unlock_requires",
        )
        .order("order_index");

      const { data: progressData } = await supabase
        .from("user_progress")
        .select("level_id, stars")
        .eq("user_id", user!.id);

      const progressMap = new Map<string, number>(
        ((progressData as ProgressRow[] | null) ?? []).map((p) => [
          p.level_id,
          p.stars,
        ]),
      );

      let foundCurrent = false;
      const processedLevels: Level[] = (
        (levelsData as LevelRaw[] | null) ?? []
      ).map((lvl) => {
        const stars = progressMap.get(lvl.id) ?? 0;
        let status: Level["status"] = "locked";

        if (stars > 0) {
          status = "completed";
        } else if (!foundCurrent) {
          if (!lvl.unlock_requires || progressMap.has(lvl.unlock_requires)) {
            status = "current";
            foundCurrent = true;
          }
        }

        return { ...lvl, stars, status };
      });

      if (!foundCurrent) {
        const firstLocked = processedLevels.find((l) => l.status === "locked");
        if (firstLocked) firstLocked.status = "current";
      }

      setIslands((islandsData as Island[] | null) ?? []);
      setLevels(processedLevels);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!loading && currentLevelRef.current) {
      setTimeout(() => {
        currentLevelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 400);
    }
  }, [loading]);

  if (authLoading || loading) return <LoadingScreen />;

  const levelsByIsland = islands.map((island) =>
    levels
      .filter((l) => l.island_id === island.id)
      .sort((a, b) => a.order_index - b.order_index),
  );

  const totalStars = levels.reduce((sum, l) => sum + l.stars, 0);
  const completedLevels = levels.filter((l) => l.status === "completed").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }

        .mapa-root {
          min-height: 100vh;
          background: #0a0a0f;
          font-family: 'Nunito', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

       .topbar {
  position: sticky; top: 0; z-index: 50; width: 100%; padding: 10px 16px;
  background: rgba(10,10,15,0.97);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}

        .topbar-profile { display: flex; align-items: center; gap: 10px; }

        .avatar {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #FFD700, #FF8C00);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem;
          border: 2px solid rgba(255,215,0,0.4);
          flex-shrink: 0;
        }

        .profile-name { font-size: 0.9rem; font-weight: 800; color: #fff; line-height: 1.1; }
        .profile-sub  { font-size: 0.72rem; color: rgba(255,255,255,0.45); font-weight: 700; }

        .topbar-stats { display: flex; align-items: center; gap: 10px; }

        .stat-pill {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 5px 10px;
          font-size: 0.82rem; font-weight: 800; color: #fff;
        }

        .mapa-scroll {
          width: 100%; max-width: 420px;
          padding: 20px 0 80px;
          display: flex; flex-direction: column;
        }

        .island-header {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 24px;
          margin: 0 16px 8px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .island-icon {
          font-size: 2rem; width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 12px; background: rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        .island-info { flex: 1; }
        .island-name  { font-family: 'Fredoka One', sans-serif; font-size: 1rem; font-weight: 400; line-height: 1.2; }
        .island-progress { font-size: 0.72rem; font-weight: 700; opacity: 0.6; margin-top: 2px; }

        .island-path { position: relative; padding: 12px 0; }

        .path-svg {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none; overflow: visible;
        }

        .node-wrapper {
          position: absolute;
          transform: translate(-50%, -50%);
          display: flex; flex-direction: column; align-items: center;
          z-index: 2;
        }

        .node-stars { display: flex; gap: 1px; margin-bottom: 4px; height: 14px; align-items: center; }

        .node-btn {
          width: 64px; height: 64px;
          border-radius: 50%; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; position: relative;
          transition: transform 0.15s, box-shadow 0.15s;
          outline: none; border: 3px solid transparent;
        }

        .node-btn:active { transform: scale(0.92) !important; }

        .node-btn.completed {
          box-shadow: 0 4px 0 #1b5e20, 0 0 20px #4CAF5044;
        }

        .node-btn.current {
          box-shadow: 0 4px 0 #b8860b, 0 0 28px #FFD70066;
          animation: pulse-current 1.8s ease-in-out infinite;
        }

        .node-btn.locked {
          background: #2a2a35 !important;
          border-color: #3a3a45 !important;
          box-shadow: none !important;
          cursor: not-allowed; opacity: 0.7; filter: grayscale(0.5);
        }

        .node-btn.boss { width: 72px; height: 72px; font-size: 1.8rem; }

        @keyframes pulse-current {
          0%, 100% { transform: scale(1);     box-shadow: 0 4px 0 #b8860b, 0 0 20px #FFD70044; }
          50%       { transform: scale(1.06); box-shadow: 0 4px 0 #b8860b, 0 0 36px #FFD70088; }
        }

        .node-ping {
          position: absolute; inset: -6px; border-radius: 50%;
          border: 2px solid #FFD700;
          animation: ping 1.8s ease-out infinite; opacity: 0;
        }

        @keyframes ping {
          0%   { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(1.4);  opacity: 0; }
        }

        .node-label {
          margin-top: 6px; font-size: 0.68rem; font-weight: 800;
          text-align: center; max-width: 80px; line-height: 1.2;
          padding: 3px 6px; border-radius: 6px;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .island-divider {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 32px; opacity: 0.3;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.2); }
      `}</style>

      <div className="mapa-root">
        <header className="topbar">
          <div className="topbar-profile">
            <div className="avatar">
              {profile?.avatar_id === 1
                ? "🦖"
                : profile?.avatar_id === 2
                  ? "🐙"
                  : profile?.avatar_id === 3
                    ? "🐯"
                    : "🦖"}
            </div>
            <div>
              <div className="profile-name">
                {profile?.display_name ?? "Jugador"}
              </div>
              <div className="profile-sub">{completedLevels}/70 niveles</div>
            </div>
          </div>
          <div className="topbar-stats">
            <div className="stat-pill">
              🔥{" "}
              <span style={{ color: "#FF6B35" }}>
                {profile?.streak_days ?? 0}
              </span>
            </div>
            <div className="stat-pill">
              🪙 <span style={{ color: "#FFD700" }}>{profile?.coins ?? 0}</span>
            </div>
            <div className="stat-pill">
              ❤️ <span style={{ color: "#FF4757" }}>{profile?.lives ?? 5}</span>
            </div>
          </div>
        </header>

        <main className="mapa-scroll">
          {islands.map((island, islandIdx) => {
            const theme = ISLAND_THEMES[island.order_index] ?? ISLAND_THEMES[1];
            const islandLevels = levelsByIsland[islandIdx] ?? [];
            const completedInIsland = islandLevels.filter(
              (l) => l.status === "completed",
            ).length;
            const blockHeight =
              ISLAND_HEADER +
              islandLevels.length * NODE_HEIGHT +
              ISLAND_PADDING * 2;

            const nodeCoords = islandLevels.map((_, i) => ({
              x: `${SNAKE_POSITIONS[i % SNAKE_POSITIONS.length].x}%`,
              xNum: SNAKE_POSITIONS[i % SNAKE_POSITIONS.length].x,
              y:
                ISLAND_HEADER +
                ISLAND_PADDING +
                i * NODE_HEIGHT +
                NODE_HEIGHT / 2,
            }));

            return (
              <div key={island.id}>
                {islandIdx > 0 && (
                  <div className="island-divider">
                    <div className="divider-line" />
                    <span style={{ fontSize: "1.2rem" }}>⬆️</span>
                    <div className="divider-line" />
                  </div>
                )}

                <div
                  className="island-header"
                  style={{
                    background: `${theme.bg}cc`,
                    borderColor: `${theme.node}33`,
                  }}
                >
                  <div className="island-icon">{island.icon}</div>
                  <div className="island-info">
                    <div className="island-name" style={{ color: theme.label }}>
                      {island.name}
                    </div>
                    <div
                      className="island-progress"
                      style={{ color: theme.label }}
                    >
                      {completedInIsland}/{islandLevels.length} completados
                    </div>
                  </div>
                </div>

                <div
                  className="island-path"
                  style={{ height: blockHeight, position: "relative" }}
                >
                  <svg
                    className="path-svg"
                    viewBox={`0 0 100 ${blockHeight}`}
                    preserveAspectRatio="none"
                  >
                    {nodeCoords.map((coord, i) => {
                      if (i === 0) return null;
                      const prev = nodeCoords[i - 1];
                      const isActive = islandLevels[i].status !== "locked";
                      return (
                        <line
                          key={i}
                          x1={prev.x}
                          y1={prev.y}
                          x2={coord.x}
                          y2={coord.y}
                          stroke={isActive ? theme.node : "#2a2a35"}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={isActive ? undefined : "6 4"}
                          opacity={isActive ? 0.5 : 0.3}
                        />
                      );
                    })}
                  </svg>

                  {islandLevels.map((level, i) => {
                    const coord = nodeCoords[i];
                    const isCurrent = level.status === "current";
                    const isCompleted = level.status === "completed";
                    const isLocked = level.status === "locked";

                    return (
                      <div
                        key={level.id}
                        ref={isCurrent ? currentLevelRef : null}
                        className="node-wrapper"
                        style={{ left: coord.x, top: coord.y }}
                      >
                        <div className="node-stars">
                          {[1, 2, 3].map((s) => (
                            <span
                              key={s}
                              style={{
                                fontSize: "0.7rem",
                                opacity:
                                  isCompleted && level.stars >= s ? 1 : 0.2,
                                filter:
                                  isCompleted && level.stars >= s
                                    ? "drop-shadow(0 0 4px #FFD700)"
                                    : "none",
                              }}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>

                        <button
                          className={[
                            "node-btn",
                            level.status,
                            level.is_boss ? "boss" : "",
                          ]
                            .join(" ")
                            .trim()}
                          style={{
                            background: isCompleted
                              ? theme.node
                              : isCurrent
                                ? `linear-gradient(135deg, ${theme.node}, ${theme.nodeBorder})`
                                : undefined,
                            borderColor: isLocked
                              ? undefined
                              : theme.nodeBorder,
                          }}
                          disabled={isLocked}
                          onClick={() => {
                            if (!isLocked) router.push(`/jugar/${level.id}`);
                          }}
                          aria-label={level.name}
                        >
                          {isLocked ? "🔒" : level.icon}
                          {isCurrent && <span className="node-ping" />}
                        </button>

                        <div
                          className="node-label"
                          style={{
                            color: isLocked
                              ? "rgba(255,255,255,0.3)"
                              : theme.label,
                          }}
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

          <div
            style={{
              textAlign: "center",
              padding: "32px 16px",
              color: "rgba(255,255,255,0.2)",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            ⭐ {totalStars} estrellas ganadas
          </div>
        </main>
      </div>
    </>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap');
        @keyframes bounce-load { from { transform: translateY(0); } to { transform: translateY(-12px); } }
      `}</style>
      <div
        style={{
          fontSize: "3rem",
          animation: "bounce-load 0.8s ease-in-out infinite alternate",
        }}
      >
        🧮
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.4)",
          fontWeight: 700,
          fontSize: "1rem",
        }}
      >
        Cargando tu mapa...
      </div>
    </div>
  );
}
