"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";

// ─── Íconos SVG inline ───────────────────────────────────────
const IconGoogle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

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

// ─── Partículas de fondo decorativas ─────────────────────────
const PARTICLES = ["⭐", "🔢", "➕", "➖", "✖️", "🍎", "🎲", "💡"];

function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span key={i} className={`particle particle-${i}`}>
          {p}
        </span>
      ))}
    </div>
  );
}

// ─── Formulario separado para poder usar useSearchParams ─────
function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user, loading } =
    useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Si ya hay sesión activa, redirigir al mapa
  useEffect(() => {
  if (!loading && user) {
    const t = setTimeout(() => router.replace("/mapa"), 0);
    return () => clearTimeout(t);
  }
}, [user, loading, router]);

  // Mostrar error de callback (ej: link de email expirado)
  useEffect(() => {
  if (searchParams.get("error") === "callback_failed") {
    const t = setTimeout(() => {
      setError("El link expiró o no es válido. Intentá de nuevo.");
    }, 0);
    return () => clearTimeout(t);
  }
}, [searchParams]);

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
        router.replace("/mapa");
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

  const handleGoogle = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(translateError(error));
  };

  if (loading) return null;

  return (
    <div className="card">
      {/* Logo / encabezado */}
      <div className="card-header">
        <div className="logo">🧮</div>
        <h1 className="title">MathApp</h1>
        <p className="subtitle">
          {mode === "login"
            ? "¡Bienvenido de vuelta!"
            : "¡Creá tu cuenta gratis!"}
        </p>
      </div>

      {/* Toggle login / registro */}
      <div className="mode-toggle">
        <button
          type="button"
          className={`toggle-btn ${mode === "login" ? "active" : ""}`}
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
          className={`toggle-btn ${mode === "register" ? "active" : ""}`}
          onClick={() => {
            setMode("register");
            setError(null);
            setSuccessMsg(null);
          }}
        >
          Registrarse
        </button>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        className="google-btn"
        onClick={handleGoogle}
        disabled={submitting}
      >
        <IconGoogle />
        Continuar con Google
      </button>

      <div className="divider">
        <span>o</span>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} noValidate>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="name">¿Cómo te llamás?</label>
            <input
              id="name"
              type="text"
              placeholder="Tu nombre o apodo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="password">
            Contraseña
            {mode === "register" && (
              <span className="hint"> (mínimo 6 caracteres)</span>
            )}
          </label>
          <div className="pass-wrapper">
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
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPass((v) => !v)}
              aria-label={
                showPass ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              <IconEye show={showPass} />
            </button>
          </div>
        </div>

        {/* Mensajes de error / éxito */}
        {error && (
          <div className="msg msg-error" role="alert">
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="msg msg-success" role="status">
            ✅ {successMsg}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting
            ? "Cargando..."
            : mode === "login"
              ? "Entrar al juego 🚀"
              : "Crear cuenta 🎉"}
        </button>
      </form>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function AuthPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Nunito', 'Fredoka One', system-ui, sans-serif;
          background: #0f0c29;
          min-height: 100vh;
        }

        .page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a4e 0%, #16213e 50%, #0f3460 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Partículas flotantes */
        .particles { position: absolute; inset: 0; pointer-events: none; }
        .particle {
          position: absolute;
          font-size: 1.5rem;
          opacity: 0.12;
          animation: float linear infinite;
        }
        .particle-0 { left: 5%;  top: 10%; animation-duration: 14s; animation-delay: 0s;   font-size: 2rem; }
        .particle-1 { left: 20%; top: 70%; animation-duration: 18s; animation-delay: -3s;  font-size: 1.2rem; }
        .particle-2 { left: 40%; top: 15%; animation-duration: 12s; animation-delay: -7s;  }
        .particle-3 { left: 60%; top: 80%; animation-duration: 16s; animation-delay: -2s;  font-size: 1.8rem; }
        .particle-4 { left: 75%; top: 25%; animation-duration: 20s; animation-delay: -5s;  }
        .particle-5 { left: 85%; top: 60%; animation-duration: 15s; animation-delay: -1s;  font-size: 2.2rem; }
        .particle-6 { left: 10%; top: 50%; animation-duration: 22s; animation-delay: -9s;  font-size: 1rem; }
        .particle-7 { left: 55%; top: 45%; animation-duration: 11s; animation-delay: -4s;  font-size: 1.6rem; }

        @keyframes float {
          0%   { transform: translateY(0px) rotate(0deg);   opacity: 0.08; }
          50%  { opacity: 0.18; }
          100% { transform: translateY(-80px) rotate(20deg); opacity: 0.08; }
        }

        /* Card */
        .card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 40px 36px;
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.4);
        }

        .card-header { text-align: center; margin-bottom: 28px; }

        .logo {
          font-size: 3.5rem;
          display: block;
          margin-bottom: 8px;
          filter: drop-shadow(0 4px 12px rgba(255, 200, 0, 0.4));
          animation: bounce-logo 2s ease-in-out infinite;
        }
        @keyframes bounce-logo {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }

        .title {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
        }
        .subtitle {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.55);
          margin-top: 4px;
        }

        /* Toggle */
        .mode-toggle {
          display: flex;
          background: rgba(0,0,0,0.25);
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 20px;
          gap: 4px;
        }
        .toggle-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: rgba(255,255,255,0.5);
        }
        .toggle-btn.active {
          background: #FFD700;
          color: #1a1a4e;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.35);
        }

        /* Google */
        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px;
          background: rgba(255,255,255,0.95);
          color: #333;
          border: none;
          border-radius: 14px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
        }
        .google-btn:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
        .google-btn:active { transform: translateY(0); }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          color: rgba(255,255,255,0.3);
          font-size: 0.85rem;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.12);
        }

        /* Fields */
        .field { margin-bottom: 14px; }
        .field label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
          margin-bottom: 6px;
        }
        .field .hint { font-weight: 400; opacity: 0.7; }

        .field input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: #fff;
          font-size: 0.95rem;
          font-family: inherit;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
        }
        .field input::placeholder { color: rgba(255,255,255,0.3); }
        .field input:focus {
          border-color: #FFD700;
          background: rgba(255,255,255,0.12);
        }

        .pass-wrapper { position: relative; }
        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          padding: 0;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.8); }

        /* Mensajes */
        .msg {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.88rem;
          margin-bottom: 14px;
          font-weight: 600;
          line-height: 1.4;
        }
        .msg-error  { background: rgba(239, 68, 68, 0.2);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
        .msg-success{ background: rgba(34, 197, 94, 0.2);  color: #86efac; border: 1px solid rgba(34,197,94,0.3); }

        /* Submit */
        .submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #FFD700, #FF8C00);
          color: #1a1a4e;
          border: none;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 4px;
          letter-spacing: 0.3px;
          box-shadow: 0 6px 20px rgba(255, 140, 0, 0.35);
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(255, 140, 0, 0.45);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @media (max-width: 480px) {
          .card { padding: 32px 24px; border-radius: 24px; }
          .title { font-size: 1.7rem; }
        }
      `}</style>


      <div className="page">
        <Particles />
        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>
      </div>
    </>
  );
}

// ─── Traducción de errores de Supabase al español ────────────
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
