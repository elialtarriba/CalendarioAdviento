// Service worker mínimo para poder instalar la app en Android (Chrome).
// No guarda nada en caché: siempre carga la versión más nueva de internet (así no se quedan versiones viejas).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (e.request.mode !== 'navigate') { e.respondWith(fetch(e.request)); return; }
  e.respondWith(fetch(e.request).catch(() => new Response('<h1 style="font-family:sans-serif;text-align:center;margin-top:40vh">🎄 Sin conexión a internet</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
