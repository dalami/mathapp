const CACHE_NAME = "mathapp-v1";

const STATIC_ASSETS = ["/", "/auth", "/mapa", "/manifest.json"];

// Instalación — cachear assets estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activación — limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener("fetch", (event) => {
  // Solo interceptar requests GET
  if (event.request.method !== "GET") return;

  // No interceptar requests a Supabase ni APIs externas
  const url = new URL(event.request.url);
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar en cache si la respuesta es válida
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin red — intentar desde cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback para navegación offline
          if (event.request.destination === "document") {
            return caches.match("/mapa") || caches.match("/auth");
          }
        });
      }),
  );
});
