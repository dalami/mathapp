"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { getMapRoute } from "../../lib/mapRoute";

// ─── Tipos ────────────────────────────────────────────────────
type Gateway = "mercadopago" | "paypal" | "detecting";

type CoinPack = {
  id: string;
  label: string;
  coins: number;
  priceUSD: number;
  bonus?: string;
  popular?: boolean;
};

const COIN_PACKS: CoinPack[] = [
  { id: "pack_sm", label: "Pack Pequeño", coins: 500, priceUSD: 0.49 },
  {
    id: "pack_md",
    label: "Pack Mediano",
    coins: 1200,
    priceUSD: 0.99,
    popular: true,
    bonus: "+200 bonus",
  },
  {
    id: "pack_lg",
    label: "Pack Grande",
    coins: 3000,
    priceUSD: 1.99,
    bonus: "+500 bonus",
  },
];

const MP_COUNTRIES = ["AR", "MX", "BR", "CL", "CO"];

// ─── Página principal ─────────────────────────────────────────
export default function TiendaPage() {
  const router = useRouter();
  const { profile, user, loading } = useAuth();

  const [gateway, setGateway] = useState<Gateway>("detecting");
  const [country, setCountry] = useState<string>("US");
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Detectar país por IP ──────────────────────────────────
  useEffect(() => {
    async function detectCountry() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const cc: string = data.country_code ?? "US";
        setCountry(cc);
        setGateway(MP_COUNTRIES.includes(cc) ? "mercadopago" : "paypal");
      } catch {
        setGateway("paypal"); // fallback
      }
    }
    detectCountry();
  }, []);

  // ─── Redirect si no hay sesión ────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  if (loading || !profile) return <LoadingScreen />;

  // ─── Checkout ─────────────────────────────────────────────
  async function handleCheckout(itemId: string, itemType: "pack" | "pro") {
    if (!user) return;
    setError(null);
    setLoadingItem(itemId);

    try {
      const endpoint =
        gateway === "mercadopago"
          ? "/api/store/mp-checkout"
          : "/api/store/paypal-checkout";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          itemId,
          itemType,
          country,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Error al procesar el pago");

      // Redirigir al checkout externo
      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoadingItem(null);
    }
  }

  const isPro = profile.plan === "pro";

  return (
    <div className="min-h-dvh bg-[#0a0a0f] font-[Nunito,sans-serif] text-white flex flex-col items-center max-w-130 mx-auto pb-16">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 w-full px-4 py-3 bg-[rgba(10,10,15,0.97)] border-b border-white/[0.07] flex items-center gap-3">
        <button
          className="w-9 h-9 rounded-full bg-white/8 border border-white/12 text-white/60 flex items-center justify-center transition-colors duration-150 hover:bg-white/15"
         onClick={() => router.push(getMapRoute(profile?.stage))}
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className="font-[FredokaOne,sans-serif] text-xl font-normal">
          Tienda
        </h1>
        <div className="ml-auto flex items-center gap-1.5 bg-white/[0.07] border border-white/10 rounded-full px-3 py-1 text-sm font-extrabold">
          🪙 <span className="text-[#FFD700]">{profile.coins ?? 0}</span>
        </div>
      </header>

      {/* ── GATEWAY BADGE ── */}
      {gateway !== "detecting" && (
        <div className="w-full px-4 pt-4">
          <div className="flex items-center gap-2 bg-white/4 border border-white/[0.07] rounded-2xl px-4 py-2.5 text-xs font-bold text-white/40">
            <span>{gateway === "mercadopago" ? "🇦🇷" : "🌍"}</span>
            <span>
              Pagás con {gateway === "mercadopago" ? "Mercado Pago" : "PayPal"}{" "}
              · Precios en USD
            </span>
            <button
              className="ml-auto text-white/30 hover:text-white/60 transition-colors underline"
              onClick={() =>
                setGateway(gateway === "mercadopago" ? "paypal" : "mercadopago")
              }
            >
              Cambiar
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="w-full px-4 pt-3">
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 rounded-2xl px-4 py-3 text-sm font-bold">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* ── PLAN PRO ── */}
      <section className="w-full px-4 pt-6">
        <h2 className="text-[0.72rem] font-extrabold opacity-35 tracking-[1.2px] uppercase mb-3">
          Plan Pro
        </h2>

        <div
          className="relative rounded-3xl border overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a0a2e, #0a1a2e)",
            borderColor: isPro ? "#FFD700" : "rgba(255,215,0,0.25)",
          }}
        >
          {/* badge */}
          <div className="absolute top-3 right-3 bg-[#FFD700] text-[#1a0a2e] text-[0.65rem] font-black px-2.5 py-1 rounded-full tracking-wide">
            {isPro ? "✓ ACTIVO" : "MÁS POPULAR"}
          </div>

          <div className="p-6">
            <div className="text-3xl mb-2">👑</div>
            <div className="font-[FredokaOne,sans-serif] text-2xl font-normal text-[#FFD700] mb-1">
              MathApp Pro
            </div>
            <div className="text-white/50 text-sm font-bold mb-4">
              El máximo nivel de aprendizaje
            </div>

            <ul className="flex flex-col gap-2 mb-5">
              {[
                "❤️ Vidas infinitas — jugá sin límites",
                "🚫 Sin publicidad",
                "🏝️ Acceso a todas las islas",
                "⭐ Contenido exclusivo de secundaria",
              ].map((feat) => (
                <li
                  key={feat}
                  className="flex items-center gap-2 text-sm font-bold text-white/80"
                >
                  <span className="text-[#FFD700] text-xs">✓</span> {feat}
                </li>
              ))}
            </ul>

            <div className="flex items-end gap-2 mb-4">
              <span className="font-[FredokaOne,sans-serif] text-4xl font-normal text-white">
                $0.99
              </span>
              <span className="text-white/40 text-sm font-bold mb-1">
                USD / mes
              </span>
            </div>

            {isPro ? (
              <div className="w-full py-3.5 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] font-extrabold text-center text-sm">
                ✓ Plan activo
              </div>
            ) : (
              <button
                className="w-full py-3.5 rounded-2xl font-extrabold text-[#0a0a0f] text-base transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_0_rgba(0,0,0,0.3)]"
                style={{
                  background: "linear-gradient(135deg, #FFD700, #FF8C00)",
                }}
                disabled={loadingItem === "pro"}
                onClick={() => handleCheckout("pro", "pro")}
              >
                {loadingItem === "pro"
                  ? "Procesando..."
                  : gateway === "mercadopago"
                    ? "Suscribirme con Mercado Pago 🚀"
                    : "Suscribirme con PayPal 🚀"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── PACKS DE MONEDAS ── */}
      <section className="w-full px-4 pt-8">
        <h2 className="text-[0.72rem] font-extrabold opacity-35 tracking-[1.2px] uppercase mb-3">
          Packs de monedas
        </h2>

        <div className="flex flex-col gap-3">
          {COIN_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-2xl border p-4 flex items-center gap-4 ${
                pack.popular
                  ? "border-[#FFD700]/40 bg-[rgba(255,215,0,0.05)]"
                  : "border-white/8 bg-white/3"
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-2.5 left-4 bg-[#FFD700] text-[#1a0a2e] text-[0.6rem] font-black px-2 py-0.5 rounded-full tracking-wide">
                  MEJOR VALOR
                </div>
              )}

              <div className="text-3xl">🪙</div>

              <div className="flex-1">
                <div className="font-extrabold text-sm text-white">
                  {pack.label}
                </div>
                <div className="text-[#FFD700] font-extrabold text-lg leading-tight">
                  {pack.coins.toLocaleString()} monedas
                  {pack.bonus && (
                    <span className="text-green-400 text-xs font-bold ml-1.5">
                      {pack.bonus}
                    </span>
                  )}
                </div>
              </div>

              <button
                className="shrink-0 px-4 py-2.5 rounded-xl font-extrabold text-sm transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_3px_0_rgba(0,0,0,0.3)]"
                style={{
                  background: pack.popular ? "#FFD700" : "rgba(255,215,0,0.15)",
                  color: pack.popular ? "#1a0a2e" : "#FFD700",
                  border: pack.popular
                    ? "none"
                    : "1px solid rgba(255,215,0,0.3)",
                }}
                disabled={loadingItem === pack.id}
                onClick={() => handleCheckout(pack.id, "pack")}
              >
                {loadingItem === pack.id ? "..." : `$${pack.priceUSD} USD`}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── GANAR MONEDAS GRATIS ── */}
      <section className="w-full px-4 pt-8">
        <h2 className="text-[0.72rem] font-extrabold opacity-35 tracking-[1.2px] uppercase mb-3">
          Ganar monedas gratis
        </h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-white/3 border border-white/[0.07] rounded-2xl px-4 py-3.5">
            <span className="text-2xl">🎮</span>
            <div>
              <div className="text-sm font-extrabold">Completar niveles</div>
              <div className="text-white/40 text-xs font-bold">
                10–50 monedas por nivel según estrellas
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/3 border border-white/7 rounded-2xl px-4 py-3.5">
            <span className="text-2xl">📺</span>
            <div>
              <div className="text-sm font-extrabold">Ver videos</div>
              <div className="text-white/40 text-xs font-bold">
                30 monedas por video (próximamente)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/3 border border-white/7 rounded-2xl px-4 py-3.5">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-sm font-extrabold">Racha diaria</div>
              <div className="text-white/40 text-xs font-bold">
                Bonus por días consecutivos jugando
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── USOS DE MONEDAS ── */}
      <section className="w-full px-4 pt-8">
        <h2 className="text-[0.72rem] font-extrabold opacity-35 tracking-[1.2px] uppercase mb-3">
          ¿Para qué sirven las monedas?
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "❤️", label: "Comprar vida", cost: "100" },
            { icon: "💡", label: "Ver pista", cost: "50" },
            { icon: "⏭️", label: "Saltar pregunta", cost: "75" },
            { icon: "🎭", label: "Avatar premium", cost: "200+" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/3 border border-white/[0.07] rounded-2xl px-3 py-3 flex flex-col gap-1"
            >
              <span className="text-xl">{item.icon}</span>
              <div className="text-xs font-extrabold text-white">
                {item.label}
              </div>
              <div className="text-[#FFD700] text-xs font-extrabold">
                🪙 {item.cost}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="w-full px-4 pt-8 text-center text-white/20 text-xs font-bold leading-relaxed">
        Los pagos son procesados de forma segura.
        <br />
        El Plan Pro se renueva mensualmente · Cancelá cuando quieras.
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-5xl animate-[bounceLoad_0.75s_ease-in-out_infinite_alternate]">
        🪙
      </div>
    </div>
  );
}
