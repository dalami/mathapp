"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PLAY_STORE = "https://play.google.com/apps/internaltest/4701392344833701397";
const DEEP_LINK = "mathapp://";

type Status = "loading" | "success" | "error";

function ConfirmarContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!token_hash || !type) {
      setStatus("error");
      return;
    }

    supabase.auth
      .verifyOtp({ token_hash, type: type as "signup" | "email" | "recovery" })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
        } else {
          setStatus("success");
          setTimeout(() => { window.location.href = DEEP_LINK; }, 300);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center px-5 font-[Nunito,sans-serif]">
      <div className="flex flex-col items-center text-center gap-6 max-w-xs w-full">

        {status === "loading" && (
          <>
            <div className="text-5xl animate-[bounce_1s_ease-in-out_infinite]">🧮</div>
            <p className="text-white/50 font-bold text-sm">Confirmando tu email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl">✅</div>
            <h1 className="font-[FredokaOne,sans-serif] text-2xl text-white leading-tight">
              ¡Email confirmado!
            </h1>
            <p className="text-white/50 font-bold text-sm leading-relaxed">
              Volvé a la app para empezar a jugar.
            </p>
            <a
              href={DEEP_LINK}
              className="w-full py-4 rounded-2xl font-black text-[#08080f] text-base text-center shadow-[0_4px_0_rgba(180,120,0,0.5)]"
              style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)" }}
            >
              Abrir MathApp 🚀
            </a>
            <a
              href={PLAY_STORE}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl font-bold text-white/60 text-sm text-center border border-white/10 hover:border-white/25 hover:text-white transition-colors"
            >
              📲 Descargar app<br /><span className="text-[0.7em] opacity-70">(Solo Android)</span>
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl">⚠️</div>
            <h1 className="font-[FredokaOne,sans-serif] text-2xl text-white leading-tight">
              Link inválido o expirado
            </h1>
            <p className="text-white/50 font-bold text-sm leading-relaxed">
              Este link ya fue usado o expiró. Registrate de nuevo desde la app.
            </p>
            <a
              href={DEEP_LINK}
              className="w-full py-4 rounded-2xl font-black text-[#08080f] text-base text-center shadow-[0_4px_0_rgba(180,120,0,0.5)]"
              style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)" }}
            >
              Abrir MathApp 🚀
            </a>
            <a
              href={PLAY_STORE}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl font-bold text-white/60 text-sm text-center border border-white/10 hover:border-white/25 hover:text-white transition-colors"
            >
              📲 Descargar app<br /><span className="text-[0.7em] opacity-70">(Solo Android)</span>
            </a>
          </>
        )}

      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
      <div className="text-5xl animate-[bounce_1s_ease-in-out_infinite]">🧮</div>
    </div>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ConfirmarContent />
    </Suspense>
  );
}
