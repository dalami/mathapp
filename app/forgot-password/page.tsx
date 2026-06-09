"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PARTICLES = ["⭐", "🔢", "➕", "➖", "✖️", "🍎", "🎲", "💡"];

function Particles() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute text-2xl opacity-[0.12] animate-[float_linear_infinite]"
          style={{
            left: ["5%","20%","40%","60%","75%","85%","10%","55%"][i],
            top: ["10%","70%","15%","80%","25%","60%","50%","45%"][i],
            animationDuration: ["14s","18s","12s","16s","20s","15s","22s","11s"][i],
            animationDelay: ["0s","-3s","-7s","-2s","-5s","-1s","-9s","-4s"][i],
            fontSize: ["2rem","1.2rem","1.5rem","1.8rem","1.5rem","2.2rem","1rem","1.6rem"][i],
          }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setError("No pudimos enviar el email. Verificá que sea correcto.");
    } else {
      setSent(true);
    }

    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#1a1a4e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-6 relative overflow-hidden">
      <Particles />

      <div className="bg-white/6 backdrop-blur-xl border border-white/12 rounded-[28px] p-10 w-full max-w-105 relative z-10 shadow-[0_32px_64px_rgba(0,0,0,0.4)]">
        <div className="text-center mb-7">
          <span className="text-[3.5rem] block mb-2 drop-shadow-[0_4px_12px_rgba(255,200,0,0.4)] animate-[bounceLogo_2s_ease-in-out_infinite]">
            🔑
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Recuperar contraseña
          </h1>
          <p className="text-[0.95rem] text-white/55 mt-1">
            Te enviamos un link para resetearla
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="px-4 py-4 rounded-xl text-[0.9rem] mb-6 font-semibold leading-snug bg-green-500/20 text-green-300 border border-green-500/30">
              ✅ ¡Listo! Revisá tu email y hacé click en el link para crear una nueva contraseña.
            </div>
            <button
              className="w-full py-4 bg-white/10 border border-white/15 text-white rounded-2xl text-base font-extrabold cursor-pointer transition-all duration-200 hover:bg-white/15"
              onClick={() => router.replace("/auth")}
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-[0.85rem] font-bold text-white/70 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3.5 bg-white/8 border border-white/12 rounded-xl text-white text-[0.95rem] font-[inherit] outline-none transition-all duration-200 placeholder:text-white/30 focus:border-[#FFD700] focus:bg-white/12"
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-[0.88rem] mb-4 font-semibold leading-snug bg-red-500/20 text-red-300 border border-red-500/30"
                role="alert"
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-linear-to-br from-[#FFD700] to-[#FF8C00] text-[#1a1a4e] border-none rounded-2xl text-base font-extrabold cursor-pointer transition-all duration-200 mt-1 tracking-wide shadow-[0_6px_20px_rgba(255,140,0,0.35)] hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_10px_28px_rgba(255,140,0,0.45)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Enviando..." : "Enviar link 📧"}
            </button>

            <button
              type="button"
              className="w-full py-3 mt-3 bg-transparent border-none text-white/40 text-[0.88rem] font-bold cursor-pointer hover:text-white/70 transition-colors"
              onClick={() => router.replace("/auth")}
            >
              ← Volver al inicio
            </button>
          </form>
        )}
      </div>
    </div>
  );
}