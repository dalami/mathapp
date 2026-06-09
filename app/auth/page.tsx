"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";

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

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithEmail, signUpWithEmail, user, loading } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      const t = setTimeout(() => router.replace("/etapa"), 0);
      return () => clearTimeout(t);
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (searchParams.get("error") === "callback_failed") {
      const t = setTimeout(() => {
        setError("El link expiró o no es válido. Intentá de nuevo.");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    window.history.replaceState({}, "", "/auth");
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError("El link expiró o no es válido. Intentá de nuevo.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    if (mode === "login") {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError(translateError(error));
      } else {
        router.replace("/etapa");
      }
    } else {
      if (displayName.trim().length < 2) {
        setError("El nombre debe tener al menos 2 caracteres.");
        setSubmitting(false);
        return;
      }
      const { error } = await signUpWithEmail(
        email,
        password,
        displayName.trim(),
      );
      if (error) {
        setError(translateError(error));
      } else {
        setSuccessMsg("¡Revisá tu email para confirmar tu cuenta! 🎉");
      }
    }

    setSubmitting(false);
  };

  if (loading) return null;

  return (
    <div className="bg-white/6 backdrop-blur-xl border border-white/12 rounded-[28px] p-10 w-full max-w-105 relative z-10 shadow-[0_32px_64px_rgba(0,0,0,0.4)]">
      {/* Logo / encabezado */}
      <div className="text-center mb-7">
        <span className="text-[3.5rem] block mb-2 drop-shadow-[0_4px_12px_rgba(255,200,0,0.4)] animate-[bounceLogo_2s_ease-in-out_infinite]">
          🧮
        </span>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          MathApp
        </h1>
        <p className="text-[0.95rem] text-white/55 mt-1">
          {mode === "login"
            ? "¡Bienvenido de vuelta!"
            : "¡Creá tu cuenta gratis!"}
        </p>
      </div>

      {/* Toggle login / registro */}
      <div className="flex bg-black/25 rounded-2xl p-1 mb-5 gap-1">
        <button
          type="button"
          className={`flex-1 py-2.5 rounded-xl text-[0.9rem] font-bold cursor-pointer transition-all duration-200 border-none ${
            mode === "login"
              ? "bg-[#FFD700] text-[#1a1a4e] shadow-[0_4px_12px_rgba(255,215,0,0.35)]"
              : "bg-transparent text-white/50"
          }`}
          onClick={() => {
            setMode("login");
            setError(null);
            setSuccessMsg(null);
          }}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className={`flex-1 py-2.5 rounded-xl text-[0.9rem] font-bold cursor-pointer transition-all duration-200 border-none ${
            mode === "register"
              ? "bg-[#FFD700] text-[#1a1a4e] shadow-[0_4px_12px_rgba(255,215,0,0.35)]"
              : "bg-transparent text-white/50"
          }`}
          onClick={() => {
            setMode("register");
            setError(null);
            setSuccessMsg(null);
          }}
        >
          Registrarse
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} noValidate>
        {mode === "register" && (
          <div className="mb-3.5">
            <label
              htmlFor="name"
              className="block text-[0.85rem] font-bold text-white/70 mb-1.5"
            >
              ¿Cómo te llamás?
            </label>
            <input
              id="name"
              type="text"
              placeholder="Tu nombre o apodo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-4 py-3.5 bg-white/8 border border-white/12 rounded-xl text-white text-[0.95rem] font-[inherit] outline-none transition-all duration-200 placeholder:text-white/30 focus:border-[#FFD700] focus:bg-white/12"
            />
          </div>
        )}

        <div className="mb-3.5">
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

        <div className="mb-3.5">
          <label
            htmlFor="password"
            className="block text-[0.85rem] font-bold text-white/70 mb-1.5"
          >
            Contraseña
            {mode === "register" && (
              <span className="font-normal opacity-70">
                {" "}
                (mínimo 6 caracteres)
              </span>
            )}
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
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
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

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-[0.88rem] mb-3.5 font-semibold leading-snug bg-red-500/20 text-red-300 border border-red-500/30"
            role="alert"
          >
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div
            className="px-4 py-3 rounded-xl text-[0.88rem] mb-3.5 font-semibold leading-snug bg-green-500/20 text-green-300 border border-green-500/30"
            role="status"
          >
            ✅ {successMsg}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-4 bg-linear-to-br from-[#FFD700] to-[#FF8C00] text-[#1a1a4e] border-none rounded-2xl text-base font-extrabold cursor-pointer transition-all duration-200 mt-1 tracking-wide shadow-[0_6px_20px_rgba(255,140,0,0.35)] hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_10px_28px_rgba(255,140,0,0.45)] active:not-disabled:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          disabled={submitting}
        >
          {submitting
            ? "Cargando..."
            : mode === "login"
              ? "Entrar al juego 🚀"
              : "Crear cuenta 🎉"}
        </button>
        {mode === "login" && (
          <button
            type="button"
            className="w-full py-2 mt-2 bg-transparent border-none text-white/40 text-[0.83rem] font-bold cursor-pointer hover:text-white/70 transition-colors"
            onClick={() => router.push("/forgot-password")}
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#1a1a4e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-6 relative overflow-hidden">
      <Particles />
      <Suspense fallback={null}>
        <AuthForm />
      </Suspense>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "Email o contraseña incorrectos.";
  if (msg.includes("Email not confirmed"))
    return "Confirmá tu email antes de ingresar.";
  if (msg.includes("User already registered"))
    return "Ya existe una cuenta con ese email.";
  if (msg.includes("Password should be at least"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("Unable to validate email")) return "El email no es válido.";
  if (msg.includes("rate limit"))
    return "Demasiados intentos. Esperá unos minutos.";
  return msg;
}
