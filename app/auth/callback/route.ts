import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam || !code) {
    return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
  }

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