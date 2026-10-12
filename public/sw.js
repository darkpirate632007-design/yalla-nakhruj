/* Yalla Nakhruj progressive web app: lightweight offline app-shell cache. */
const CACHE_NAME = "yalla-nakhruj-shell-v2";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const root = self.registration.scope;
    const urls = [
      root,
      `${root}index.html`,
      `${root}manifest.webmanifest`,
      `${root}icons/yalla-nakhruj.svg`,
      `${root}icons/yalla-nakhruj-192.png`,
      `${root}icons/yalla-nakhruj-512.png`,
      `${root}icons/yalla-nakhruj-maskable-512.png`
    ];
    await Promise.allSettled(urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response && response.ok) await cache.put(url, response);
      } catch (_) {
        // The page can still install; unavailable assets will be fetched later.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("yalla-nakhruj-") && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Do not cache third-party API results or personal data.

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) || (await cache.match(`${self.registration.scope}index.html`)) || Response.error();
      }
    })());
    return;
  }

  // Network-first for app assets, with a cache fallback when offline.
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(request)) || Response.error();
    }
  })());
});
