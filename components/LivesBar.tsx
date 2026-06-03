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
export function LivesPill({
  lives,
  livesResetAt,
  onClick,
}: {
  lives: number;
  livesResetAt: string | null;
  onClick?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
  if (!livesResetAt || lives >= MAX_LIVES) {
    return;
  }
  const target = new Date(livesResetAt).getTime();
  const update = () => setTimeLeft(Math.max(0, target - Date.now()));
  const t = setInterval(update, 1000);
  setTimeout(update, 0);
  return () => clearInterval(t);
}, [livesResetAt, lives]);

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "4px 9px",
        cursor: onClick ? "pointer" : "default",
        fontFamily: "Nunito, sans-serif",
        fontSize: "0.78rem",
        fontWeight: 800,
        color: "#fff",
      }}
    >
      <span>❤️</span>
      <span style={{ color: lives <= 1 ? "#EF5350" : lives <= 2 ? "#FFA726" : "#FF4757" }}>
        {lives}
      </span>
      {lives < MAX_LIVES && timeLeft > 0 && (
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem" }}>
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
        const { data } = await supabase.rpc("restore_lives", { p_user_id: userId });
        if (data?.lives > 0) {
          onLivesRestored(data.lives, localCoins);
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
    const { data } = await supabase.rpc("buy_life_with_coins", { p_user_id: userId });
    setBuying(false);
    if (data?.ok) {
      setLocalCoins(data.coins);
      onLivesRestored(data.lives, data.coins);
    }
  };

  const canBuy = localCoins >= 100;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.bigEmoji}>💔</div>
        <h2 style={styles.modalTitle}>¡Sin vidas!</h2>
        <p style={styles.modalSub}>
          Necesitás esperar o usar monedas para seguir jugando.
        </p>

        <div style={styles.regenBox}>
          <div style={styles.regenLabel}>Próxima vida gratis en</div>
          <div style={styles.regenTimer}>
            {timeLeft > 0 ? msToMMSS(timeLeft) : "¡Lista!"}
          </div>
          <div style={styles.livesIcons}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                style={{ fontSize: "1.4rem", opacity: 0.2, filter: "grayscale(1)" }}
              >
                ❤️
              </span>
            ))}
          </div>
        </div>

        <button
          style={{
            ...styles.buyBtn,
            opacity: canBuy && !buying ? 1 : 0.45,
            cursor: canBuy && !buying ? "pointer" : "not-allowed",
          }}
          disabled={!canBuy || buying}
          onClick={handleBuyWithCoins}
        >
          {buying ? "Comprando..." : `🪙 Usar 100 monedas (tenés ${localCoins})`}
        </button>

        <button
          style={styles.adBtn}
          onClick={() => {
            // TODO: rewarded ad — por ahora da 1 vida gratis
            onLivesRestored(1, localCoins);
          }}
        >
          📺 Ver un video y ganar 1 vida
        </button>

        <button style={styles.closeBtn} onClick={onClose}>
          Volver al mapa 🗺️
        </button>
      </div>
    </div>
  );
}

// ─── Hook: restaura vidas al montar la pantalla ───────────────
export function useRestoreLives(userId: string | undefined) {
  const restore = useCallback(async () => {
    if (!userId) return null;
    const { data } = await supabase.rpc("restore_lives", { p_user_id: userId });
    return data as { lives: number; next_regen: string | null; max: boolean } | null;
  }, [userId]);

  return restore;
}

// ─── Estilos ──────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backdropFilter: "blur(8px)",
  },
  modal: {
    background: "#1a1a25",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 28,
    padding: "32px 24px",
    width: "min(400px, 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    textAlign: "center",
    fontFamily: "Nunito, sans-serif",
    color: "#fff",
  },
  bigEmoji: {
    fontSize: "3.5rem",
    lineHeight: 1,
  },
  modalTitle: {
    fontFamily: "Fredoka One, sans-serif",
    fontSize: "1.8rem",
    fontWeight: 400,
    color: "#EF5350",
    margin: 0,
  },
  modalSub: {
    fontSize: "0.88rem",
    color: "rgba(255,255,255,0.5)",
    fontWeight: 700,
    margin: 0,
  },
  regenBox: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "16px 24px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  regenLabel: {
    fontSize: "0.78rem",
    color: "rgba(255,255,255,0.4)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  regenTimer: {
    fontFamily: "Fredoka One, sans-serif",
    fontSize: "2.2rem",
    color: "#FFD700",
    letterSpacing: "0.05em",
  },
  livesIcons: {
    display: "flex",
    gap: 6,
  },
  buyBtn: {
    width: "100%",
    padding: "15px 20px",
    borderRadius: 16,
    border: "1px solid rgba(255,215,0,0.3)",
    background: "rgba(255,215,0,0.1)",
    color: "#FFD700",
    fontFamily: "Nunito, sans-serif",
    fontSize: "0.92rem",
    fontWeight: 800,
    transition: "background 0.15s",
  },
  adBtn: {
    width: "100%",
    padding: "15px 20px",
    borderRadius: 16,
    border: "1px solid rgba(100,180,255,0.25)",
    background: "rgba(41,182,246,0.08)",
    color: "#4FC3F7",
    fontFamily: "Nunito, sans-serif",
    fontSize: "0.92rem",
    fontWeight: 800,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  closeBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Nunito, sans-serif",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};