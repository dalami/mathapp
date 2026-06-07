import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
  }

  if (!code) {
    // implicit flow: el token viene en el hash, no en query params
    // redirigir a /auth para que el cliente lo procese
    return NextResponse.redirect(`${origin}/auth`);
  }

  // pkce flow (email magic link, etc)
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
    return NextResponse.redirect(`${origin}/auth`);
  }

  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}