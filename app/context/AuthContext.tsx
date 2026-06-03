"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export interface Profile {
  id: string;
  display_name: string;
  avatar_id: number;
  stage: 0 | 1 | 2 | 3 | 4;
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
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error: string | null }>;
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

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      await supabase.rpc("restore_lives", { p_user_id: userId });
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (!error && data) setProfile(data as Profile);
    } catch (e) {
      console.error("Error cargando perfil:", e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // ─── Limpiar sesión inválida y redirigir al login ─────────
  const clearSession = useCallback(() => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    // Limpiar cookies de Supabase del browser
    supabase.auth.signOut().catch(() => {});
  }, []);

  useEffect(() => {
    // Cargar sesión inicial
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (error) {
        // Token inválido o expirado → limpiar
        console.warn("Sesión inválida, limpiando:", error.message);
        clearSession();
        return;
      }

      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      // Token inválido o sesión expirada
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !s)) {
        clearSession();
        return;
      }

      // Error de token → limpiar
      if (!s && (event as string) === "INITIAL_SESSION") {
        clearSession();
        return;
      }

      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        await fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, clearSession]);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
