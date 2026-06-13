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
  profileError: boolean;
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

const PROFILE_TIMEOUT_MS = 8_000;

async function fetchProfileWithTimeout(
  userId: string,
): Promise<Profile | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .abortSignal(controller.signal)
      .single();
    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchingForId = useRef<string | null>(null);
  const userRef = useRef<User | null>(null);
  const authEventFiredRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileError(false);
    const data = await fetchProfileWithTimeout(userId);
    if (data) {
      setProfile(data);
    } else {
      setProfileError(true);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (userRef.current) {
      const data = await fetchProfileWithTimeout(userRef.current.id);
      if (data) {
        setProfile(data);
        setProfileError(false);
      }
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          const uid = session.user.id;
          if (fetchingForId.current !== uid) {
            fetchingForId.current = uid;
            try {
              await fetchProfile(uid);
            } finally {
              fetchingForId.current = null;
            }
          }
        }
      } catch {
        // silencioso
      } finally {
        if (!authEventFiredRef.current) {
          setLoading(false);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AUTH EVENT", event);

      // TOKEN_REFRESHED: solo actualizar la sesión, no refetchear el profile
      // El perfil no cambió — refetchearlo causa re-renders innecesarios
      // que hacen que el mapa se recargue al volver de otra pestaña
      if (event === "TOKEN_REFRESHED") {
        if (session) setSession(session);
        authEventFiredRef.current = true;
        setLoading(false);
        return;
      }

      if (session?.user) {
        const uid = session.user.id;
        setSession(session);
        setUser(session.user);

        // Si ya tenemos el profile para este usuario cargado, no refetchear
        // Evita recargas innecesarias en SIGNED_IN por visibilidad de pestaña
        const alreadyLoaded = userRef.current?.id === uid && !profileError;

        if (!alreadyLoaded && fetchingForId.current !== uid) {
          fetchingForId.current = uid;
          try {
            await fetchProfile(uid);
          } finally {
            fetchingForId.current = null;
          }
        } else if (fetchingForId.current === uid) {
          // Fetch en curso para este uid — esperar a que termine
          await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
              if (fetchingForId.current !== uid) {
                clearInterval(interval);
                resolve();
              }
            }, 50);
          });
        }
      } else {
        setSession(session);
        setUser(null);
        setProfile(null);
        setProfileError(false);
      }

      authEventFiredRef.current = true;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]); // eslint-disable-line react-hooks/exhaustive-deps

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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error: error.message };
    if (data?.url) {
      window.location.href = data.url;
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProfileError(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        profileError,
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
