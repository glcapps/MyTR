const CACHE_NAME = "mytr-timer-v2";
const OFFLINE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./js/app.js",
  "./assets/icon.svg",
  "./assets/maskable.svg",
  "https://cdn.tailwindcss.com",
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
