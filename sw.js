// Guarda la app en el iPhone para que abra rápido y sin conexión.
// Sube la versión cada vez que cambie algún archivo de la app.
const VERSION = "armario-v8";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Solo los archivos propios de la app; la IA, el tiempo y las fuentes van siempre a internet.
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  // La página principal: primero internet (para recibir actualizaciones), si no hay conexión, la copia guardada.
  if (e.request.mode === "navigate") {
    e.respondWith(
      // no-store: salta la caché de GitHub y del navegador para recibir siempre la última versión.
      fetch(url.href, { cache: "no-store", credentials: "same-origin" })
        .then((res) => { if (!res.ok) throw new Error(res.status); const copy = res.clone(); caches.open(VERSION).then((c) => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
