"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "@/lib/supabase";
import { NoLivesModal, useRestoreLives } from "@/components/LivesBar";
import { useSound } from "../../hooks/useSound";

interface LevelInfo {
  id: string;
  name: string;
  icon: string;
  is_boss: boolean;
  time_limit_secs: number | null;
  questions_count: number;
  island_id: number;
  order_index: number;
}

interface Question {
  id: string;
  body: string;
  correct_answer: string;
  options: string[];
  difficulty: number;
  hint: string | null;
}

interface SubmitResult {
  coins_earned: number;
  is_new_best: boolean;
  stars: number;
  streak_days: number;
}

type GamePhase = "loading" | "playing" | "feedback" | "finished" | "no_lives";
type FeedbackType = "correct" | "wrong";

const ISLAND_COLORS: Record<number, string> = {
  1: "#4CAF50",
  2: "#29B6F6",
  3: "#FFA726",
  4: "#EF5350",
  5: "#CE93D8",
  6: "#42A5F5",
  7: "#78909C",
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function calcStars(totalErrors: number, totalQuestions: number): number {
  const rate = totalErrors / totalQuestions;
  if (rate === 0) return 3;
  if (rate <= 0.2) return 2;
  if (rate <= 0.5) return 1;
  return 0;
}

export default function JugarPage() {
  const router = useRouter();
  const params = useParams();
  const levelId = params.id as string;
  const { user, profile, refreshProfile } = useAuth();

  const [level, setLevel] = useState<LevelInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives] = useState(5);
  const [coins, setCoins] = useState(0);
  const [livesResetAt, setLivesResetAt] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [stars, setStars] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextLevelId, setNextLevelId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { enabled: soundEnabled, toggle: toggleSound } = useSound(
    "/sounds/background.ogg",
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorsRef = useRef(0);
  const livesRef = useRef(5);
  const phaseRef = useRef<GamePhase>("loading");
  const fetchedRef = useRef(false);
  const nextLevelIdRef = useRef<string | null>(null);
  // FIX: ref del profile para leerlo dentro del efecto sin ponerlo en las deps
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const restoreLives = useRestoreLives(user?.id);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);
  // FIX: resetear fetchedRef cuando cambia el levelId (router.push misma ruta)
  useEffect(() => {
    fetchedRef.current = false;
  }, [levelId]);

  const accentColor = ISLAND_COLORS[level?.island_id ?? 1] ?? "#4CAF50";

  // ─── Limpiar timers al desmontar ─────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (feedbackRef.current) clearTimeout(feedbackRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  // ─── Cargar nivel ────────────────────────────────────────
  // FIX: profile FUERA de las deps — se lee via profileRef para evitar
  // que refreshProfile() (llamado en handleFinish) reactive este efecto
  // mientras el setTimeout de autoAdvance todavía está corriendo.
  useEffect(() => {
    if (!user || !levelId) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchLevel() {
      // Esperamos a que profile esté disponible (puede tardar un tick)
      let currentProfile = profileRef.current;
      if (!currentProfile) {
        // Poll liviano: esperar hasta 2s a que el profile llegue
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 100));
          currentProfile = profileRef.current;
          if (currentProfile) break;
        }
      }
      if (!currentProfile) {
        window.location.href = "/mapa";
        return;
      }

      try {
        let currentLives = currentProfile.lives ?? 5;
        let currentResetAt: string | null =
          currentProfile.lives_reset_at ?? null;

        try {
          const restored = await restoreLives();
          if (restored) {
            currentLives = restored.lives;
            currentResetAt = restored.next_regen;
          }
        } catch {
          // Si falla restore, usamos datos del perfil
        }

        if (currentLives <= 0) {
          setLives(0);
          setCoins(currentProfile.coins ?? 0);
          setLivesResetAt(currentResetAt);
          setPhase("no_lives");
          return;
        }

        const { data: lvl, error: lvlErr } = await supabase
          .from("levels")
          .select(
            "id, name, icon, is_boss, time_limit_secs, questions_count, island_id, order_index",
          )
          .eq("id", levelId)
          .single();

        if (lvlErr || !lvl) {
          console.error("Error cargando nivel:", lvlErr);
          router.replace("/mapa");
          return;
        }

        const { data: qs, error: qsErr } = await supabase
          .from("questions")
          .select("id, body, correct_answer, options, difficulty, hint")
          .eq("level_id", levelId)
          .order("difficulty");

        if (qsErr || !qs || qs.length === 0) {
          console.error(
            "Error cargando preguntas:",
            qsErr,
            "cantidad:",
            qs?.length,
          );
          router.replace("/mapa");
          return;
        }

        const typedLvl = lvl as LevelInfo;
        const typedQs = qs as Question[];
        const selected = shuffle(typedQs).slice(0, typedLvl.questions_count);

        const { data: nextLvls } = await supabase
          .from("levels")
          .select("id, order_index")
          .eq("island_id", typedLvl.island_id)
          .gt("order_index", typedLvl.order_index)
          .order("order_index", { ascending: true })
          .limit(1);

        const nextLvl = nextLvls?.[0] ?? null;
        errorsRef.current = 0;
        livesRef.current = currentLives;

        setLevel(typedLvl);
        setQuestions(selected);
        nextLevelIdRef.current = nextLvl?.id ?? null;
        setNextLevelId(nextLvl?.id ?? null);
        setCurrentIdx(0);
        setLives(currentLives);
        setCoins(currentProfile.coins ?? 0);
        setLivesResetAt(currentResetAt);
        setFeedback(null);
        setSelectedOption(null);
        setStars(0);
        setCoinsEarned(0);
        setIsNewBest(false);
        setIsSubmitting(false);
        setCountdown(null);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
        if (typedLvl.time_limit_secs) setTimeLeft(typedLvl.time_limit_secs);
        else setTimeLeft(null);
        setPhase("playing");
      } catch (e) {
        console.error("Error inesperado:", e);
        router.replace("/mapa");
      }
    }

    fetchLevel();
  }, [user, levelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Shuffle opciones ────────────────────────────────────
  useEffect(() => {
    if (questions[currentIdx]) {
      const opts = shuffle(questions[currentIdx].options);
      const t = setTimeout(() => setShuffledOptions(opts), 0);
      return () => clearTimeout(t);
    }
  }, [currentIdx, questions]);

  // ─── Finalizar nivel ─────────────────────────────────────
  const handleFinish = useCallback(
    async (finalErrors: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (feedbackRef.current) clearTimeout(feedbackRef.current);
      if (isSubmitting) return;

      setIsSubmitting(true);
      setPhase("finished");

      const earnedStars = calcStars(finalErrors, questions.length);
      const timeSpent = level?.time_limit_secs
        ? level.time_limit_secs - (timeLeft ?? 0)
        : 0;
      setStars(earnedStars);

      if (user) {
        try {
          const { data } = await supabase.rpc("submit_level_result", {
            p_user_id: user.id,
            p_level_id: levelId,
            p_stars: earnedStars,
            p_errors: finalErrors,
            p_time_seconds: timeSpent,
          });
          if (data) {
            const result = data as SubmitResult;
            setCoinsEarned(result.coins_earned ?? 0);
            setIsNewBest(result.is_new_best ?? false);
          }
        } catch (e) {
          console.error("Error guardando resultado:", e);
        }
        try {
          // FIX: refreshProfile en background, sin await que bloquee el autoAdvance
          refreshProfile().catch(() => {});
        } catch (e) {
          console.error("Error actualizando perfil:", e);
        }
      }

      if (earnedStars > 0) {
        setCountdown(3);
        let secs = 3;
        countdownRef.current = setInterval(() => {
          secs -= 1;
          setCountdown(secs);
          if (secs <= 0 && countdownRef.current)
            clearInterval(countdownRef.current);
        }, 1000);

        autoAdvanceRef.current = setTimeout(() => {
          const dest = nextLevelIdRef.current;
          if (dest) {
            router.push(`/jugar/${dest}`);
          } else {
            router.push(`/mapa`);
          }
        }, 3500);
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isSubmitting,
      questions.length,
      level,
      timeLeft,
      user,
      levelId,
      refreshProfile,
    ],
  );

  const handleFinishRef = useRef(handleFinish);
  useEffect(() => {
    handleFinishRef.current = handleFinish;
  }, [handleFinish]);

  // ─── Timer ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleFinishRef.current(errorsRef.current);
      return;
    }
    timerRef.current = setTimeout(
      () => setTimeLeft((t) => (t !== null ? t - 1 : null)),
      1000,
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, phase]);

  // ─── Avanzar pregunta ────────────────────────────────────
  const advanceQuestion = useCallback(
    (newErrors: number, correct: boolean) => {
      const isLast = currentIdx >= questions.length - 1;
      const noLives = !correct && livesRef.current <= 0;
      if (isLast || noLives) {
        handleFinishRef.current(newErrors);
      } else {
        setCurrentIdx((i) => i + 1);
        setSelectedOption(null);
        setFeedback(null);
        setPhase("playing");
      }
    },
    [currentIdx, questions.length],
  );

  // ─── Responder ───────────────────────────────────────────
  const handleAnswer = useCallback(
    async (option: string) => {
      if (phaseRef.current !== "playing" || selectedOption) return;
      if (timerRef.current) clearTimeout(timerRef.current);

      const question = questions[currentIdx];
      const isCorrect = option === question.correct_answer;

      setSelectedOption(option);
      setFeedback(isCorrect ? "correct" : "wrong");
      setPhase("feedback");

      let newErrors = errorsRef.current;

      if (!isCorrect) {
        newErrors += 1;
        errorsRef.current = newErrors;
        if (user) {
          try {
            const { data } = await supabase.rpc("spend_life", {
              p_user_id: user.id,
            });
            const newLives =
              typeof data === "number"
                ? data
                : Math.max(0, livesRef.current - 1);
            livesRef.current = newLives;
            setLives(newLives);
          } catch {
            const newLives = Math.max(0, livesRef.current - 1);
            livesRef.current = newLives;
            setLives(newLives);
          }
        }
      }

      feedbackRef.current = setTimeout(
        () => advanceQuestion(newErrors, isCorrect),
        1400,
      );
    },
    [selectedOption, currentIdx, questions, user, advanceQuestion],
  );

  // ─── Reintentar ──────────────────────────────────────────
  const handleRetry = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);

    errorsRef.current = 0;
    livesRef.current = lives;

    const reshuffled = shuffle(questions);
    setQuestions(reshuffled);
    setCurrentIdx(0);
    setFeedback(null);
    setSelectedOption(null);
    setStars(0);
    setCoinsEarned(0);
    setIsNewBest(false);
    setIsSubmitting(false);
    setCountdown(null);
    if (level?.time_limit_secs) setTimeLeft(level.time_limit_secs);
    setPhase("playing");
  }, [questions, lives, level]);

  // ─── Salir ───────────────────────────────────────────────
  const handleExit = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);

    if (
      user &&
      (phaseRef.current === "playing" || phaseRef.current === "feedback")
    ) {
      try {
        await supabase.rpc("spend_life", { p_user_id: user.id });
      } catch {
        // Si falla, igual salimos
      }
    }

    router.replace("/mapa");
  }, [router, user]);

  // ─── RENDERS ─────────────────────────────────────────────
  if (phase === "no_lives" && user) {
    return (
      <NoLivesModal
        userId={user.id}
        coins={coins}
        livesResetAt={livesResetAt}
        onClose={() => {
          router.replace("/mapa");
        }}
        onLivesRestored={(newLives, newCoins) => {
          setLives(newLives);
          setCoins(newCoins);
          fetchedRef.current = false;
          router.replace(`/jugar/${levelId}`);
        }}
      />
    );
  }

  if (phase === "loading" || !level || questions.length === 0) {
    return <LoadingScreen />;
  }

  const question = questions[currentIdx];
  if (!question) return <LoadingScreen />;

  if (phase === "finished") {
    return (
      <FinishScreen
        stars={stars}
        coinsEarned={coinsEarned}
        isNewBest={isNewBest}
        levelName={level.name}
        accentColor={accentColor}
        nextLevelId={nextLevelId}
        countdown={countdown}
        onBack={handleExit}
        onRetry={handleRetry}
        onShop={() => router.push("/tienda")}
      />
    );
  }

  const progress = (currentIdx / questions.length) * 100;
  const isTwoOptions = question.options.length === 2;
  const timerPct =
    level.time_limit_secs && timeLeft !== null
      ? (timeLeft / level.time_limit_secs) * 100
      : 100;
  const timerColor =
    timeLeft !== null && timeLeft < 10
      ? "#EF5350"
      : timeLeft !== null && timeLeft < 20
        ? "#FFA726"
        : accentColor;

  return (
    <div className="min-h-dvh bg-[#0a0a0f] font-[Nunito,sans-serif] text-white flex flex-col items-center w-full max-w-140 mx-auto pb-10">
      {/* ── HEADER ── */}
      <header className="w-full px-5 pt-4 pb-3 flex items-center gap-3.5 sticky top-0 z-10 bg-[rgba(10,10,15,0.97)] border-b border-white/6">
        <button
          className="w-9 h-9 rounded-full shrink-0 bg-white/8 border border-white/12 text-white/60 text-base cursor-pointer flex items-center justify-center transition-colors duration-150 hover:bg-white/15"
          onClick={handleExit}
          aria-label="Salir"
        >
          ✕
        </button>
        <button
          className="text-lg leading-none opacity-50 hover:opacity-90 transition-opacity duration-150"
          onClick={handleExit}
          aria-label="Volver al mapa"
          title="Volver al mapa"
        >
          🗺️
        </button>
        <button
          className="text-lg leading-none opacity-50 hover:opacity-90 transition-opacity duration-150"
          onClick={() => router.push("/tienda")}
          aria-label="Tienda"
          title="Tienda"
        >
          🛒
        </button>
        <button
          className="text-lg leading-none opacity-50 hover:opacity-90 transition-opacity duration-150"
          onClick={toggleSound}
          aria-label={soundEnabled ? "Silenciar" : "Activar sonido"}
          title={soundEnabled ? "Silenciar" : "Activar sonido"}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
        <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-400ms ease-out"
            style={{ width: `${progress}%`, background: accentColor }}
          />
        </div>
        <div className="flex gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`text-[1.05rem] transition-all duration-300 ${i > lives ? "opacity-[0.18] grayscale" : ""}`}
            >
              ❤️
            </span>
          ))}
        </div>
      </header>

      {/* ── TIMER ── */}
      {timeLeft !== null && level.time_limit_secs && (
        <div className="w-full px-5 pt-2.5 pb-1.5 flex items-center gap-2.5">
          <span className="text-[0.9rem]">⏱</span>
          <div className="flex-1 h-1.5 bg-white/8 rounded full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000 linear"
              style={{
                width: `${timerPct}%`,
                background: timerColor,
                transition: "width 1s linear, background 0.4s",
              }}
            />
          </div>
          <span
            className="text-[0.82rem] font-extrabold min-w-7.5 text-right transition-colors duration-300"
            style={{ color: timerColor }}
          >
            {timeLeft}s
          </span>
        </div>
      )}

      {/* ── PREGUNTA ── */}
      <div className="w-[calc(100%-32px)] mt-5 bg-white/5 border border-white/9 rounded-3xl px-6 py-7 min-h-37.5 flex flex-col items-center justify-center gap-3 text-center">
        <div className="text-[0.72rem] font-extrabold opacity-35 tracking-[1.2px] uppercase">
          Pregunta {currentIdx + 1} / {questions.length}
        </div>
        <div className="font-[FredokaOne,sans-serif] text-[clamp(1.2rem,3.5vw,1.6rem)] leading-[1.45] text-white">
          {question.body}
        </div>
      </div>

      {/* ── OPCIONES ── */}
      <div
        className={`w-[calc(100%-32px)] mt-4 grid gap-3 ${isTwoOptions ? "grid-cols-2" : "grid-cols-2"}`}
      >
        {shuffledOptions.map((option) => {
          const isCorrectOpt = option === question.correct_answer;
          const isSelectedOpt = option === selectedOption;

          return (
            <button
              key={option}
              disabled={!!selectedOption}
              onClick={() => handleAnswer(option)}
              className={`
                px-3.5 py-4.5 rounded-[18px] border-2 border-b-4
                font-[Nunito,sans-serif] text-[clamp(0.9rem,2.5vw,1.05rem)] font-extrabold
                text-white text-center leading-snug cursor-pointer
                transition-all duration-120 disabled:cursor-default
                hover:not-disabled:-translate-y-0.5 hover:not-disabled:bg-white/12
                active:not-disabled:translate-y-0.5 active:not-disabled:border-b-2
                ${
                  selectedOption
                    ? isCorrectOpt
                      ? "bg-green-500/25 border-[#4CAF50] border-b-[#2e7d32]"
                      : isSelectedOpt
                        ? "bg-red-500/25 border-[#EF5350] border-b-[#b71c1c]"
                        : "opacity-40 bg-white/6 border-white/10 border-b-white/8"
                    : "bg-white/6 border-white/10 border-b-white/8"
                }
              `}
              style={
                !selectedOption
                  ? {
                      borderColor: `${accentColor}44`,
                      borderBottomColor: `${accentColor}88`,
                    }
                  : undefined
              }
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* ── FEEDBACK ── */}
      {feedback && (
        <div
          className={`w-[calc(100%-32px)] mt-3.5 px-4.5 py-3.5 rounded-2xl flex items-center gap-3 font-extrabold text-[0.95rem] animate-[slideUp_0.22s_ease] ${
            feedback === "correct"
              ? "bg-green-500/18 border border-[#4CAF5055] text-[#a5d6a7]"
              : "bg-red-500/18 border border-[#EF535055] text-[#ef9a9a]"
          }`}
        >
          <span className="text-[1.3rem] shrink-0">
            {feedback === "correct" ? "✅" : "❌"}
          </span>
          <span>
            {feedback === "correct"
              ? "¡Correcto! 🎉"
              : `Casi. Era: ${question.correct_answer}`}
          </span>
        </div>
      )}

      {/* ── CONTINUAR ── */}
      {phase === "feedback" && (
        <button
          className="mt-3 px-6 py-2.5 rounded-xl border-none bg-white/8 text-white/50 font-[Nunito,sans-serif] text-[0.85rem] font-bold cursor-pointer transition-colors duration-150 hover:bg-white/[0.14] hover:text-white"
          onClick={() =>
            advanceQuestion(errorsRef.current, feedback === "correct")
          }
        >
          Continuar →
        </button>
      )}

      {/* ── BANNER ADMOB ── */}
      <div className="w-[calc(100%-32px)] mt-auto pt-4">
        <div className="w-full h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center gap-2">
          <span className="text-white/20 text-xs font-bold tracking-widest uppercase">
            Publicidad
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Pantalla de resultado ────────────────────────────────────
function FinishScreen({
  stars,
  coinsEarned,
  isNewBest,
  levelName,
  accentColor,
  nextLevelId,
  countdown,
  onBack,
  onRetry,
  onShop,
}: {
  stars: number;
  coinsEarned: number;
  isNewBest: boolean;
  levelName: string;
  accentColor: string;
  nextLevelId: string | null;
  countdown: number | null;
  onBack: () => void;
  onRetry: () => void;
  onShop: () => void;
}) {
  const won = stars > 0;
  return (
    <div className="min-h-dvh bg-[#0a0a0f] font-[Nunito,sans-serif] text-white flex flex-col items-center justify-center max-w-120 mx-auto px-6 py-10 gap-5 text-center">
      <div className="text-[4.5rem] animate-[pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
        {stars === 3 ? "🏆" : stars === 2 ? "🎉" : won ? "👍" : "💪"}
      </div>

      <h1
        className="font-[FredokaOne,sans-serif] text-[clamp(1.8rem,5vw,2.4rem)] font-normal"
        style={{ color: accentColor }}
      >
        {stars === 3
          ? "¡Perfecto!"
          : stars === 2
            ? "¡Muy bien!"
            : won
              ? "¡Lo lograste!"
              : "¡Seguí intentando!"}
      </h1>

      <p className="text-[0.88rem] opacity-45 font-bold">{levelName}</p>

      <div className="flex gap-3.5 justify-center my-2">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className="text-[clamp(2.2rem,6vw,3rem)] animate-[starPop_0.4s_cubic-bezier(0.34,1.56,0.64,1)_both]"
            style={{
              opacity: stars >= s ? 1 : 0.18,
              animationDelay: `${s * 0.15}s`,
              filter: stars >= s ? "drop-shadow(0 0 8px #FFD700)" : "none",
            }}
          >
            ⭐
          </span>
        ))}
      </div>

      {coinsEarned > 0 && (
        <div className="inline-flex items-center gap-2 bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)] rounded-full px-5 py-2.5 text-[0.95rem] font-extrabold text-[#FFD700]">
          🪙 +{coinsEarned} monedas
        </div>
      )}

      {isNewBest && (
        <div className="bg-green-500/12 border border-green-500/30 rounded-xl px-4 py-2 text-[0.85rem] font-extrabold text-[#a5d6a7]">
          🎯 ¡Nuevo récord personal!
        </div>
      )}

      {won && nextLevelId && countdown !== null && (
        <div className="bg-white/6 border border-white/12 rounded-xl px-5 py-2.5 text-[0.88rem] font-extrabold text-white/60 animate-[pulseFade_1s_ease-in-out_infinite_alternate]">
          Siguiente nivel en {countdown}s...
        </div>
      )}

      {won && !nextLevelId && (
        <div className="bg-white/6 border border-white/12 rounded-xl px-5 py-2.5 text-[0.88rem] font-extrabold text-white/60 animate-[pulseFade_1s_ease-in-out_infinite_alternate]">
          🏝️ ¡Isla completada! Volviendo al mapa...
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-85">
        <button
          className="w-full py-4.5 rounded-[18px] border-none bg-white/8 text-white/60 font-[Nunito,sans-serif] text-base font-black cursor-pointer transition-all duration-120 border border-white/12 hover:bg-white/13"
          onClick={onBack}
        >
          Volver al mapa 🗺️
        </button>
        <button
          className="w-full py-4.5 rounded-[18px] border-none bg-white/8 text-white/60 font-[Nunito,sans-serif] text-base font-black cursor-pointer transition-all duration-120 border border-white/12 hover:bg-white/13"
          onClick={onShop}
        >
          Tienda 🛒
        </button>
        {!won && (
          <button
            className="w-full py-4.5 rounded-[18px] border-none text-[#0a0a0f] font-[Nunito,sans-serif] text-base font-black cursor-pointer transition-all duration-120 shadow-[0_5px_0_rgba(0,0,0,0.25)] hover:-translate-y-0.5 hover:shadow-[0_7px_0_rgba(0,0,0,0.25)] active:translate-y-0.5 active:shadow-[0_2px_0_rgba(0,0,0,0.25)]"
            style={{ background: accentColor }}
            onClick={onRetry}
          >
            Intentar de nuevo 🔄
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-[3.5rem] animate-[bounceLoad_0.7s_ease-in-out_infinite_alternate]">
        🧮
      </div>
    </div>
  );
}
