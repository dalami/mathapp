const CACHE_NAME = "mathapp-v9";

const STATIC_ASSETS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/mapa") ||
    url.pathname.startsWith("/jugar") ||
    url.pathname.startsWith("/etapa") ||
    url.pathname.startsWith("/tienda") ||
    url.pathname === "/" ||
    url.pathname === ""
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) =>
          cached ?? new Response("", { status: 408 })
        )
      )
  );
});