"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "@/lib/supabase";
import { NoLivesModal, useRestoreLives } from "@/components/LivesBar";

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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorsRef = useRef(0);
  const livesRef = useRef(5);
  const phaseRef = useRef<GamePhase>("loading");
  const fetchedRef = useRef(false);

  const restoreLives = useRestoreLives(user?.id);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

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
  useEffect(() => {
    if (!user || !levelId || !profile) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchLevel() {
      try {
        let currentLives = profile?.lives ?? 5;
        let currentResetAt: string | null = profile?.lives_reset_at ?? null;

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
          setCoins(profile?.coins ?? 0);
          setLivesResetAt(currentResetAt);
          setPhase("no_lives");
          return;
        }

        const { data: lvl, error: lvlErr } = await supabase
          .from("levels")
          .select("id, name, icon, is_boss, time_limit_secs, questions_count, island_id, order_index")
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
          console.error("Error cargando preguntas:", qsErr, "cantidad:", qs?.length);
          router.replace("/mapa");
          return;
        }

        const typedLvl = lvl as LevelInfo;
        const typedQs = qs as Question[];
        const selected = shuffle(typedQs).slice(0, typedLvl.questions_count);

        const { data: nextLvl } = await supabase
          .from("levels")
          .select("id")
          .eq("island_id", typedLvl.island_id)
          .eq("order_index", typedLvl.order_index + 1)
          .single();

        errorsRef.current = 0;
        livesRef.current = currentLives;

        setLevel(typedLvl);
        setQuestions(selected);
        setNextLevelId(nextLvl?.id ?? null);
        setCurrentIdx(0);
        setLives(currentLives);
        setCoins(profile?.coins ?? 0);
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
    return () => { fetchedRef.current = false; };
  }, [user, levelId, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Shuffle opciones ────────────────────────────────────
  useEffect(() => {
    if (questions[currentIdx]) {
      const opts = shuffle(questions[currentIdx].options);
      const t = setTimeout(() => setShuffledOptions(opts), 0);
      return () => clearTimeout(t);
    }
  }, [currentIdx, questions]);

  // ─── Finalizar nivel ─────────────────────────────────────
  const handleFinish = useCallback(async (finalErrors: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    if (isSubmitting) return;

    setIsSubmitting(true);
    setPhase("finished");

    const earnedStars = calcStars(finalErrors, questions.length);
    const timeSpent = level?.time_limit_secs ? level.time_limit_secs - (timeLeft ?? 0) : 0;
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
        await refreshProfile();
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
        if (secs <= 0 && countdownRef.current) clearInterval(countdownRef.current);
      }, 1000);
      autoAdvanceRef.current = setTimeout(() => {
        if (nextLevelId) router.replace(`/jugar/${nextLevelId}`);
        else router.replace("/mapa");
      }, 3500);
    }
  }, [isSubmitting, questions.length, level, timeLeft, user, levelId, refreshProfile, nextLevelId, router]);

  const handleFinishRef = useRef(handleFinish);
  useEffect(() => { handleFinishRef.current = handleFinish; }, [handleFinish]);

  // ─── Timer ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || timeLeft === null) return;
    if (timeLeft <= 0) { handleFinishRef.current(errorsRef.current); return; }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t !== null ? t - 1 : null), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, phase]);

  // ─── Avanzar pregunta ────────────────────────────────────
  const advanceQuestion = useCallback((newErrors: number, correct: boolean) => {
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
  }, [currentIdx, questions.length]);

  // ─── Responder ───────────────────────────────────────────
  const handleAnswer = useCallback(async (option: string) => {
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
          const { data } = await supabase.rpc("spend_life", { p_user_id: user.id });
          const newLives = typeof data === "number" ? data : Math.max(0, livesRef.current - 1);
          livesRef.current = newLives;
          setLives(newLives);
        } catch {
          const newLives = Math.max(0, livesRef.current - 1);
          livesRef.current = newLives;
          setLives(newLives);
        }
      }
    }

    feedbackRef.current = setTimeout(() => advanceQuestion(newErrors, isCorrect), 1400);
  }, [selectedOption, currentIdx, questions, user, advanceQuestion]);

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
  const handleExit = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    router.replace("/mapa");
  }, [router]);

  // ─── RENDERS — no_lives va PRIMERO ───────────────────────
  if (phase === "no_lives" && user) {
    return (
      <>
        <style>{CSS}</style>
        <NoLivesModal
          userId={user.id}
          coins={coins}
          livesResetAt={livesResetAt}
          onClose={() => router.replace("/mapa")}
          onLivesRestored={(newLives, newCoins) => {
            setLives(newLives);
            setCoins(newCoins);
            fetchedRef.current = false;
            router.replace(`/jugar/${levelId}`);
          }}
        />
      </>
    );
  }

  if (phase === "loading" || !level || questions.length === 0) {
    return <LoadingScreen />;
  }

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
      />
    );
  }

  const question = questions[currentIdx];
  const progress = (currentIdx / questions.length) * 100;
  const isTwoOptions = question.options.length === 2;
  const timerPct = level.time_limit_secs && timeLeft !== null
    ? (timeLeft / level.time_limit_secs) * 100 : 100;
  const timerColor = timeLeft !== null && timeLeft < 10 ? "#EF5350"
    : timeLeft !== null && timeLeft < 20 ? "#FFA726" : accentColor;

  return (
    <>
      <style>{CSS}</style>
      <div className="game-root">
        <header className="game-header">
          <button className="exit-btn" onClick={handleExit} aria-label="Salir">✕</button>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${progress}%`, background: accentColor }} />
          </div>
          <div className="lives-row">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={`life ${i > lives ? "lost" : ""}`}>❤️</span>
            ))}
          </div>
        </header>

        {timeLeft !== null && level.time_limit_secs && (
          <div className="timer-row">
            <span className="timer-icon">⏱</span>
            <div className="timer-track">
              <div className="timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
            </div>
            <span className="timer-num" style={{ color: timerColor }}>{timeLeft}s</span>
          </div>
        )}

        <div className="question-card">
          <div className="q-counter">Pregunta {currentIdx + 1} / {questions.length}</div>
          <div className="q-body">{question.body}</div>
        </div>

        <div className={`options-grid ${isTwoOptions ? "two" : "four"}`}>
          {shuffledOptions.map((option) => {
            let cls = "option-btn";
            if (selectedOption) {
              if (option === question.correct_answer) cls += " correct";
              else if (option === selectedOption) cls += " wrong";
              else cls += " dimmed";
            }
            return (
              <button
                key={option}
                className={cls}
                disabled={!!selectedOption}
                onClick={() => handleAnswer(option)}
                style={!selectedOption ? {
                  borderColor: `${accentColor}44`,
                  borderBottomColor: `${accentColor}88`,
                } : undefined}
              >
                {option}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className={`feedback-banner ${feedback}`}>
            <span className="fb-icon">{feedback === "correct" ? "✅" : "❌"}</span>
            <span>{feedback === "correct" ? "¡Correcto! 🎉" : `Casi. Era: ${question.correct_answer}`}</span>
          </div>
        )}

        {phase === "feedback" && (
          <button className="skip-btn" onClick={() => advanceQuestion(errorsRef.current, feedback === "correct")}>
            Continuar →
          </button>
        )}
      </div>
    </>
  );
}

// ─── Pantalla de resultado ────────────────────────────────────
function FinishScreen({
  stars, coinsEarned, isNewBest, levelName, accentColor,
  nextLevelId, countdown, onBack, onRetry,
}: {
  stars: number; coinsEarned: number; isNewBest: boolean; levelName: string;
  accentColor: string; nextLevelId: string | null; countdown: number | null;
  onBack: () => void; onRetry: () => void;
}) {
  const won = stars > 0;
  return (
    <>
      <style>{CSS}</style>
      <div className="finish-root">
        <div className="finish-emoji">
          {stars === 3 ? "🏆" : stars === 2 ? "🎉" : won ? "👍" : "💪"}
        </div>
        <h1 className="finish-title" style={{ color: accentColor }}>
          {stars === 3 ? "¡Perfecto!" : stars === 2 ? "¡Muy bien!" : won ? "¡Lo lograste!" : "¡Seguí intentando!"}
        </h1>
        <p className="finish-level">{levelName}</p>
        <div className="stars-row">
          {[1, 2, 3].map((s) => (
            <span key={s} className="star" style={{
              opacity: stars >= s ? 1 : 0.18,
              animationDelay: `${s * 0.15}s`,
              filter: stars >= s ? "drop-shadow(0 0 8px #FFD700)" : "none",
            }}>⭐</span>
          ))}
        </div>
        {coinsEarned > 0 && <div className="coins-badge">🪙 +{coinsEarned} monedas</div>}
        {isNewBest && <div className="best-badge">🎯 ¡Nuevo récord personal!</div>}
        {won && nextLevelId && countdown !== null && (
          <div className="countdown-badge">Siguiente nivel en {countdown}s...</div>
        )}
        {won && !nextLevelId && (
          <div className="countdown-badge">🏝️ ¡Isla completada! Volviendo al mapa...</div>
        )}
        <div className="finish-btns">
          <button className="btn-back-secondary" onClick={onBack}>Volver al mapa 🗺️</button>
          {!won && (
            <button className="btn-retry" onClick={onRetry} style={{ background: accentColor }}>
              Intentar de nuevo 🔄
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function LoadingScreen() {
  return (
    <>
      <style>{CSS}</style>
      <div className="loading-root">
        <div className="loading-emoji">🧮</div>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; background: #0a0a0f; }

.game-root, .finish-root, .loading-root {
  min-height: 100dvh; background: #0a0a0f;
  font-family: 'Nunito', sans-serif; color: #fff;
  display: flex; flex-direction: column; align-items: center; width: 100%;
}
.game-root   { max-width: 560px; margin: 0 auto; padding-bottom: 40px; }
.finish-root { max-width: 480px; margin: 0 auto; justify-content: center; padding: 40px 24px; gap: 20px; text-align: center; }
.loading-root { justify-content: center; }

.game-header {
  width: 100%; padding: 16px 20px 12px;
  display: flex; align-items: center; gap: 14px;
  position: sticky; top: 0; z-index: 10;
  background: rgba(10,10,15,0.97);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.exit-btn {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6); font-size: 1rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: background 0.15s;
}
.exit-btn:hover { background: rgba(255,255,255,0.15); }
.progress-wrap { flex: 1; height: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 8px; transition: width 0.4s ease; }
.lives-row { display: flex; gap: 3px; flex-shrink: 0; }
.life { font-size: 1.05rem; transition: opacity 0.3s, filter 0.3s; }
.life.lost { opacity: 0.18; filter: grayscale(1); }

.timer-row { width: 100%; padding: 10px 20px 6px; display: flex; align-items: center; gap: 10px; }
.timer-icon { font-size: 0.9rem; }
.timer-track { flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
.timer-fill { height: 100%; border-radius: 4px; transition: width 1s linear, background 0.4s; }
.timer-num { font-size: 0.82rem; font-weight: 800; min-width: 30px; text-align: right; transition: color 0.3s; }

.question-card {
  width: calc(100% - 32px); margin: 20px auto 0;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
  border-radius: 24px; padding: 28px 24px; min-height: 150px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center;
}
.q-counter { font-size: 0.72rem; font-weight: 800; opacity: 0.35; letter-spacing: 1.2px; text-transform: uppercase; }
.q-body { font-family: 'Fredoka One', sans-serif; font-size: clamp(1.2rem, 3.5vw, 1.6rem); font-weight: 400; line-height: 1.45; color: #fff; }

.options-grid { width: calc(100% - 32px); margin: 16px auto 0; display: grid; gap: 12px; }
.options-grid.four { grid-template-columns: 1fr 1fr; }
.options-grid.two  { grid-template-columns: 1fr 1fr; }

.option-btn {
  padding: 18px 14px; border-radius: 18px;
  border: 2px solid rgba(255,255,255,0.1); border-bottom: 4px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.06); color: #fff;
  font-family: 'Nunito', sans-serif; font-size: clamp(0.9rem, 2.5vw, 1.05rem);
  font-weight: 800; cursor: pointer; text-align: center;
  transition: transform 0.12s, background 0.12s, border-color 0.12s; line-height: 1.3;
}
.option-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); transform: translateY(-2px); }
.option-btn:active:not(:disabled) { transform: translateY(2px); border-bottom-width: 2px; }
.option-btn:disabled { cursor: default; }
.option-btn.correct { background: rgba(76,175,80,0.25) !important; border-color: #4CAF50 !important; border-bottom-color: #2e7d32 !important; }
.option-btn.wrong   { background: rgba(239,83,80,0.25) !important; border-color: #EF5350 !important; border-bottom-color: #b71c1c !important; }
.option-btn.dimmed  { opacity: 0.4; }

.feedback-banner {
  width: calc(100% - 32px); margin: 14px auto 0; padding: 14px 18px; border-radius: 16px;
  display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 0.95rem;
  animation: slide-up 0.22s ease;
}
.feedback-banner.correct { background: rgba(76,175,80,0.18); border: 1px solid #4CAF5055; color: #a5d6a7; }
.feedback-banner.wrong   { background: rgba(239,83,80,0.18); border: 1px solid #EF535055; color: #ef9a9a; }
.fb-icon { font-size: 1.3rem; flex-shrink: 0; }
@keyframes slide-up { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.skip-btn {
  margin: 12px auto 0; padding: 10px 24px; border-radius: 12px; border: none;
  background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5);
  font-family: 'Nunito', sans-serif; font-size: 0.85rem; font-weight: 700;
  cursor: pointer; transition: background 0.15s;
}
.skip-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }

.finish-emoji { font-size: 4.5rem; animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }
.finish-title { font-family: 'Fredoka One', sans-serif; font-size: clamp(1.8rem, 5vw, 2.4rem); font-weight: 400; }
.finish-level { font-size: 0.88rem; opacity: 0.45; font-weight: 700; }
.stars-row { display: flex; gap: 14px; justify-content: center; margin: 8px 0; }
.star { font-size: clamp(2.2rem, 6vw, 3rem); animation: star-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes star-pop { from { transform: scale(0) rotate(-20deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }

.coins-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3);
  border-radius: 20px; padding: 10px 20px; font-size: 0.95rem; font-weight: 800; color: #FFD700;
}
.best-badge {
  background: rgba(76,175,80,0.12); border: 1px solid rgba(76,175,80,0.3);
  border-radius: 12px; padding: 8px 16px; font-size: 0.85rem; font-weight: 800; color: #a5d6a7;
}
.countdown-badge {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px; padding: 10px 20px; font-size: 0.88rem; font-weight: 800;
  color: rgba(255,255,255,0.6); animation: pulse-fade 1s ease-in-out infinite alternate;
}
@keyframes pulse-fade { from { opacity: 0.5; } to { opacity: 1; } }

.finish-btns { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 340px; }
.btn-retry, .btn-back-primary, .btn-back-secondary {
  width: 100%; padding: 18px; border-radius: 18px; border: none;
  font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 900;
  cursor: pointer; transition: transform 0.12s, box-shadow 0.12s;
  box-shadow: 0 5px 0 rgba(0,0,0,0.25);
}
.btn-retry:hover, .btn-back-primary:hover { transform: translateY(-2px); box-shadow: 0 7px 0 rgba(0,0,0,0.25); }
.btn-retry:active, .btn-back-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0,0,0,0.25); }
.btn-retry { color: #0a0a0f; }
.btn-back-secondary {
  background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.12); box-shadow: none;
}
.btn-back-secondary:hover { background: rgba(255,255,255,0.13); }

.loading-emoji { font-size: 3.5rem; animation: bounce 0.7s ease-in-out infinite alternate; }
@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-14px); } }

@media (min-width: 600px) {
  .question-card { padding: 36px 32px; min-height: 180px; }
  .options-grid  { gap: 14px; }
  .option-btn    { padding: 22px 18px; border-radius: 20px; }
  .game-header   { padding: 18px 28px 14px; }
}
`;