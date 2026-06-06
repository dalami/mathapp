import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
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
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("stage")
          .eq("id", user.id)
          .single();

        const destination = profile?.stage ? "/mapa" : "/etapa";

        // Página HTML intermedia que fuerza al cliente a leer la sesión
        // antes de navegar — resuelve el problema de cookies en TWA/WebView
        return new NextResponse(
          `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <script>
    // Forzar que el cliente lea la sesión actualizada antes de navegar
    // Pequeño delay para que las cookies se propaguen al WebView
    setTimeout(function() {
      window.location.replace("${destination}");
    }, 100);
  </script>
</body>
</html>`,
          {
            status: 200,
            headers: { "Content-Type": "text/html" },
          }
        );
      }

      return NextResponse.redirect(`${origin}/mapa`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}