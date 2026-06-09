"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
            left: ["5%", "20%", "40%", "60%", "75%", "85%", "10%", "55%"][i],
            top: ["10%", "70%", "15%", "80%", "25%", "60%", "50%", "45%"][i],
            animationDuration: [
              "14s",
              "18s",
              "12s",
              "16s",
              "20s",
              "15s",
              "22s",
              "11s",
            ][i],
            animationDelay: [
              "0s",
              "-3s",
              "-7s",
              "-2s",
              "-5s",
              "-1s",
              "-9s",
              "-4s",
            ][i],
            fontSize: [
              "2rem",
              "1.2rem",
              "1.5rem",
              "1.8rem",
              "1.5rem",
              "2.2rem",
              "1rem",
              "1.6rem",
            ][i],
          }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}

const IconEye = ({ show }: { show: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {show ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase envía el token como fragment (#access_token=...) o como query param
  // El SDK lo procesa automáticamente con onAuthStateChange
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // También revisamos si hay error en los params
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
   
      setTimeout(() => {
        setError(
          errorDescription ?? "El link expiró o no es válido. Pedí uno nuevo.",
        );
      }, 0);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(
        "No se pudo actualizar la contraseña. El link puede haber expirado.",
      );
    } else {
      setDone(true);
      // Redirigir al mapa después de 2 segundos
      setTimeout(() => router.replace("/etapa"), 2000);
    }

    setSubmitting(false);
  }

  return (
    <div className="bg-white/6 backdrop-blur-xl border border-white/12 rounded-[28px] p-10 w-full max-w-105 relative z-10 shadow-[0_32px_64px_rgba(0,0,0,0.4)]">
      <div className="text-center mb-7">
        <span className="text-[3.5rem] block mb-2 drop-shadow-[0_4px_12px_rgba(255,200,0,0.4)] animate-[bounceLogo_2s_ease-in-out_infinite]">
          🔐
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Nueva contraseña
        </h1>
        <p className="text-[0.95rem] text-white/55 mt-1">
          Ingresá tu nueva contraseña
        </p>
      </div>

      {done ? (
        <div className="text-center">
          <div className="px-4 py-4 rounded-xl text-[0.9rem] mb-6 font-semibold leading-snug bg-green-500/20 text-green-300 border border-green-500/30">
            ✅ ¡Contraseña actualizada! Redirigiendo...
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-[0.85rem] font-bold text-white/70 mb-1.5"
            >
              Nueva contraseña{" "}
              <span className="font-normal opacity-70">
                (mínimo 6 caracteres)
              </span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3.5 bg-white/8 border border-white/12 rounded-xl text-white text-[0.95rem] font-[inherit] outline-none transition-all duration-200 placeholder:text-white/30 focus:border-[#FFD700] focus:bg-white/12"
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none text-white/40 cursor-pointer flex items-center transition-colors duration-200 p-0 hover:text-white/80"
                onClick={() => setShowPass((v) => !v)}
                aria-label={
                  showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                <IconEye show={showPass} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="confirm"
              className="block text-[0.85rem] font-bold text-white/70 mb-1.5"
            >
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3.5 bg-white/8 border border-white/12 rounded-xl text-white text-[0.95rem] font-[inherit] outline-none transition-all duration-200 placeholder:text-white/30 focus:border-[#FFD700] focus:bg-white/12"
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none text-white/40 cursor-pointer flex items-center transition-colors duration-200 p-0 hover:text-white/80"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                <IconEye show={showConfirm} />
              </button>
            </div>
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-[0.88rem] mb-4 font-semibold leading-snug bg-red-500/20 text-red-300 border border-red-500/30"
              role="alert"
            >
              ⚠️ {error}
            </div>
          )}

          {!sessionReady && !error && (
            <div className="px-4 py-3 rounded-xl text-[0.88rem] mb-4 font-semibold leading-snug bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              ⏳ Verificando el link...
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !sessionReady}
            className="w-full py-4 bg-linear-to-br from-[#FFD700] to-[#FF8C00] text-[#1a1a4e] border-none rounded-2xl text-base font-extrabold cursor-pointer transition-all duration-200 mt-1 tracking-wide shadow-[0_6px_20px_rgba(255,140,0,0.35)] hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_10px_28px_rgba(255,140,0,0.45)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Guardando..." : "Guardar nueva contraseña 🔐"}
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
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#1a1a4e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-6 relative overflow-hidden">
      <Particles />
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
