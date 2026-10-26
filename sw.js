/* Earnly : service worker (mise en cache pour un chargement rapide et un affichage hors ligne).
   Pages : réseau d'abord (les mises à jour arrivent tout de suite), cache en secours.
   Autres fichiers du même site : cache d'abord. Les envois du formulaire (POST / autre domaine) ne sont jamais interceptés.
   Après une modification du site, changez le numéro de version ci-dessous pour vider l'ancien cache. */
const VERSION = 'earnly-v5';
const CORE = ['./', './index.html', './favicon.png', './app.html', './og-image.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
