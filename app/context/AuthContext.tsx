"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

// ─── Tipos ───────────────────────────────────────────────────
export interface Profile {
  id: string;
  display_name: string;
  avatar_id: number;
  stage: 1 | 2 | 3 | 4;
  plan: "free" | "pro";
  coins: number;
  lives: number;
  lives_reset_at: string;
  streak_days: number;
  last_played_at: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Guard: evitar fetch de profile concurrente para el mismo usuario
  const fetchingForId = useRef<string | null>(null);
  // Guard: evitar que onAuthStateChange pise una sesión que getSession ya procesó
  const initializedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error && data) setProfile(data as Profile);
    return { data, error };
  }, []);

  const userRef = useRef<User | null>(null);
  useEffect(() => { userRef.current = user; }, [user]);

  const refreshProfile = useCallback(async () => {
    if (userRef.current) await fetchProfile(userRef.current.id);
  }, [fetchProfile]);

  useEffect(() => {
    // ─── Inicialización en dos pasos ─────────────────────────────────────────
    // Paso 1: getSession() para TWA/WebView donde onAuthStateChange puede
    // tardar o no disparar INITIAL_SESSION si las cookies no están listas.
    // Paso 2: onAuthStateChange para cambios posteriores (login, logout, refresh).
    // El guard initializedRef evita que ambos procesen la misma sesión.

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          initializedRef.current = true;

          const uid = session.user.id;
          if (fetchingForId.current !== uid) {
            fetchingForId.current = uid;
            try {
              await fetchProfile(uid);
            } finally {
              fetchingForId.current = null;
            }
          }
        } else {
          initializedRef.current = true;
        }
      } catch {
        initializedRef.current = true;
      } finally {
        setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // INITIAL_SESSION: ignorar si getSession() ya lo procesó
        if (event === "INITIAL_SESSION") {
          if (initializedRef.current) return;
          initializedRef.current = true;
        }

        // Para SIGNED_IN post-OAuth: setear user/session Y fetchProfile
        // ANTES de setLoading(false) para evitar renders intermedios
        // donde user existe pero profile es null.
        if (session?.user) {
          const uid = session.user.id;
          if (fetchingForId.current !== uid) {
            fetchingForId.current = uid;
            try {
              // Setear session/user
              setSession(session);
              setUser(session.user);
              // Esperar profile antes de liberar loading
              await fetchProfile(uid);
            } finally {
              fetchingForId.current = null;
            }
          }
        } else {
          setSession(session);
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;

    // Detectar si estamos en TWA (Android app) o browser normal.
    // En TWA, el redirect OAuth abre Chrome externo y no vuelve a la app.
    // Usamos skipBrowserRedirect + window.location.href para manejarlo manualmente.
    // En browser normal, dejamos que Supabase maneje el redirect directamente.
    const isTWA =
      document.referrer.includes("android-app://") ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (isTWA) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
        },
      });
      if (error || !data?.url) return { error: error?.message ?? "Error al iniciar Google" };
      window.location.href = data.url;
      return { error: null };
    }

    // Browser normal — redirect estándar
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          prompt: "select_account",
          access_type: "offline",
        },
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signInWithEmail, signUpWithEmail, signInWithGoogle,
      signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}