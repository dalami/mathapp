"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const MAX_LIVES = 5;

function msToMMSS(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Versión compacta: topbar del mapa ───────────────────────
// Cuando el timer llega a 0, llama al RPC y avisa al padre via onRestored.
// NO llama refreshProfile — el padre actualiza su estado local directamente.
export function LivesPill({
  lives,
  livesResetAt,
  userId,
  onClick,
  onRestored,
}: {
  lives: number;
  livesResetAt: string | null;
  userId?: string;
  onClick?: () => void;
  onRestored?: (newLives: number, nextRegen: string | null) => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!livesResetAt || lives >= MAX_LIVES) return 0;
    return Math.max(0, new Date(livesResetAt).getTime() - Date.now());
  });

  useEffect(() => {
    if (!livesResetAt || lives >= MAX_LIVES) return;

    const target = new Date(livesResetAt).getTime();

    const tick = async () => {
      const remaining = Math.max(0, target - Date.now());
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        if (!userId) return;

        // Pequeño delay por si el reloj del cliente está levemente adelantado
        await new Promise((r) => setTimeout(r, 1500));

        try {
          const { data } = await supabase.rpc("restore_lives", {
            p_user_id: userId,
          });
          if (data?.lives != null && onRestored) {
            onRestored(data.lives, data.next_regen ?? null);
          }
        } catch {
          // Fallo silencioso — el usuario puede recargar
        }
      }
    };

    const interval = setInterval(tick, 1000);
    setTimeout(tick, 0);
    return () => clearInterval(interval);
  }, [livesResetAt, lives, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const livesColor =
    lives <= 1
      ? "text-[#EF5350]"
      : lives <= 2
        ? "text-[#FFA726]"
        : "text-[#FF4757]";

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 bg-white/[0.07] border border-white/10 rounded-full px-2.5 py-1 font-[Nunito,sans-serif] text-xs font-extrabold text-white"
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <span>❤️</span>
      <span className={livesColor}>{lives}</span>
      {lives < MAX_LIVES && timeLeft > 0 && (
        <span className="text-white/40 text-[0.68rem]">
          {msToMMSS(timeLeft)}
        </span>
      )}
    </button>
  );
}

// ─── Modal "sin vidas" ────────────────────────────────────────
export function NoLivesModal({
  userId,
  coins,
  livesResetAt,
  onClose,
  onLivesRestored,
}: {
  userId: string;
  coins: number;
  livesResetAt: string | null;
  onClose: () => void;
  onLivesRestored: (newLives: number, newCoins: number) => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [buying, setBuying] = useState(false);
  const [localCoins, setLocalCoins] = useState(coins);

  useEffect(() => {
    if (!livesResetAt) return;
    const target = new Date(livesResetAt).getTime();

    const tick = async () => {
      const remaining = Math.max(0, target - Date.now());
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);

        await new Promise((r) => setTimeout(r, 1500));

        try {
          const { data } = await supabase.rpc("restore_lives", {
            p_user_id: userId,
          });
          if (data?.lives > 0) {
            onLivesRestored(data.lives, localCoins);
            return;
          }
          // Reintentar una vez más por si el servidor tardó un poco más
          await new Promise((r) => setTimeout(r, 3000));
          const { data: data2 } = await supabase.rpc("restore_lives", {
            p_user_id: userId,
          });
          if (data2?.lives > 0) {
            onLivesRestored(data2.lives, localCoins);
          }
        } catch {
          // Fallo silencioso
        }
      }
    };

    const interval = setInterval(tick, 1000);
    setTimeout(tick, 0);
    return () => clearInterval(interval);
  }, [livesResetAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBuyWithCoins = async () => {
    if (localCoins < 100 || buying) return;
    setBuying(true);
    try {
      const { data } = await supabase.rpc("buy_life_with_coins", {
        p_user_id: userId,
      });
      if (data?.ok) {
        setLocalCoins(data.coins);
        onLivesRestored(data.lives, data.coins);
      }
    } catch {
      // Fallo silencioso
    } finally {
      setBuying(false);
    }
  };

  const canBuy = localCoins >= 100;

  return (
    <div className="fixed inset-0 z-200 bg-black/85 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="bg-[#1a1a25] border border-white/10 rounded-[28px] px-6 py-8 w-[min(400px,100%)] flex flex-col items-center gap-4 text-center font-[Nunito,sans-serif] text-white">
        <div className="text-[3.5rem] leading-none">💔</div>

        <h2 className="font-[FredokaOne,sans-serif] text-[1.8rem] font-normal text-[#EF5350] m-0">
          ¡Sin vidas!
        </h2>

        <p className="text-[0.88rem] text-white/50 font-bold m-0">
          Necesitás esperar o usar monedas para seguir jugando.
        </p>

        <div className="bg-white/5 border border-white/8 rounded-2xl px-6 py-4 w-full flex flex-col items-center gap-2">
          <div className="text-[0.78rem] text-white/40 font-bold uppercase tracking-[0.08em]">
            Próxima vida gratis en
          </div>
          <div className="font-[FredokaOne,sans-serif] text-[2.2rem] text-[#FFD700] tracking-wider">
            {timeLeft > 0 ? msToMMSS(timeLeft) : "¡Lista!"}
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="text-[1.4rem] opacity-20 grayscale">
                ❤️
              </span>
            ))}
          </div>
        </div>

        <button
          className="w-full px-5 py-4 rounded-2xl border border-[rgba(255,215,0,0.3)] bg-[rgba(255,215,0,0.1)] text-[#FFD700] font-[Nunito,sans-serif] text-[0.92rem] font-extrabold transition-colors duration-150 disabled:opacity-45 disabled:cursor-not-allowed"
          disabled={!canBuy || buying}
          onClick={handleBuyWithCoins}
        >
          {buying
            ? "Comprando..."
            : `🪙 Usar 100 monedas (tenés ${localCoins})`}
        </button>

        <button
          className="w-full px-5 py-4 rounded-2xl border border-[rgba(255,215,0,0.25)] bg-[rgba(255,215,0,0.06)] text-[#FFD700] font-[Nunito,sans-serif] text-[0.92rem] font-extrabold cursor-pointer transition-colors duration-150 hover:bg-[rgba(255,215,0,0.12)]"
          onClick={onClose}
        >
          🛒 Ir a la tienda de monedas
        </button>

        <button
          className="w-full py-3.5 rounded-2xl border border-white/10 bg-white/6 text-white/50 font-[Nunito,sans-serif] text-[0.88rem] font-bold cursor-pointer transition-colors duration-150 hover:bg-white/10"
          onClick={onClose}
        >
          Volver al mapa 🗺️
        </button>
      </div>
    </div>
  );
}

// ─── Hook: restaura vidas con timeout propio ──────────────────
// Nunca bloquea más de `timeoutMs` ms. Si el RPC falla o tarda, devuelve null.
export function useRestoreLives(
  userId: string | undefined,
  timeoutMs: number = 4000,
) {
  const restore = useCallback(async () => {
    if (!userId) return null;
    try {
      const result = await Promise.race([
        supabase.rpc("restore_lives", { p_user_id: userId }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
      ]);
      if (!result) return null; // timeout
      const { data } = result as { data: { lives: number; next_regen: string | null; max: boolean } | null };
      return data ?? null;
    } catch {
      return null;
    }
  }, [userId, timeoutMs]);

  return restore;
}