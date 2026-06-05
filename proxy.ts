import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/mapa", "/jugar", "/perfil", "/tienda"];
const AUTH_ONLY = ["/auth"];

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Sin sesión intentando acceder a ruta protegida → login
  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Con sesión intentando acceder a /auth → verificar stage
  const isAuthOnly = AUTH_ONLY.some(p => pathname.startsWith(p));
  if (user && isAuthOnly) {
    // Verificar si ya eligió etapa
    const { data: profile } = await supabase
      .from("profiles")
      .select("stage")
      .eq("id", user.id)
      .single();

    if (!profile || profile.stage === 0) {
      return NextResponse.redirect(new URL("/etapa", request.url));
    }
    return NextResponse.redirect(new URL("/mapa", request.url));
  }

  // Con sesión en /mapa → verificar que tenga stage elegido
  if (user && pathname.startsWith("/mapa")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stage")
      .eq("id", user.id)
      .single();

    if (!profile || profile.stage === 0) {
      return NextResponse.redirect(new URL("/etapa", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|privacidad|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};