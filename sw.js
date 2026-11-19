// Service worker mínimo para poder instalar la app en Android (Chrome).
// (V23.2) la página se pide siempre nueva (no-cache) para no quedarse con un index.html viejo.
// No guarda nada en caché: siempre carga la versión más nueva de internet (así no se quedan versiones viejas).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // (V23.5) el programa (.js, .css, .json) se comprueba siempre con internet: como ya no llevan número de versión,
  // así nunca se queda un archivo viejo guardado. Fotos, vídeos y sonidos, como antes.
  if (e.request.mode !== 'navigate') {
    const code = ['script', 'style', 'manifest'].includes(e.request.destination) || /\.(js|css|json)$/.test(new URL(e.request.url).pathname);
    e.respondWith(code ? fetch(new Request(e.request, { cache: 'no-cache' })).catch(() => fetch(e.request)) : fetch(e.request));
    return;
  }
  e.respondWith(fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).catch(() => new Response('<h1 style="font-family:sans-serif;text-align:center;margin-top:40vh">🎄 Sin conexión a internet</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
