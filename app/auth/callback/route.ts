import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const errorParam = searchParams.get("error");

  if (errorParam || (!code && !(tokenHash && type))) {
    return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
  }

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookiesToSet) => {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Exchange exitoso server-side — flujo normal (browser desktop/web)
        return NextResponse.redirect(`${origin}/auth`);
      }

      // Exchange falló server-side (típico en PWA/TWA por contexto de cookies).
      // Fallback: pasamos el code al cliente para que lo intercambie en el browser.
      return NextResponse.redirect(`${origin}/auth?code=${code}`);

    } catch {
      // Error inesperado — mismo fallback al cliente
      return NextResponse.redirect(`${origin}/auth?code=${code}`);
    }
  }

  // token_hash + type: confirmación de signup, recovery, email change, etc.
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash!,
    });

    if (error) {
      return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
    }

    const destination = type === "recovery" ? "/reset-password" : "/auth";
    return NextResponse.redirect(`${origin}${destination}`);
  } catch {
    return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
  }
}