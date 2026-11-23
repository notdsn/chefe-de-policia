const C = 'refugio-zero-v1';
const F = ['./', 'index.html', 'css/app.css?v=1', 'js/data.js?v=1', 'js/core.js?v=1', 'js/ai.js?v=1', 'js/map.js?v=1', 'js/ui.js?v=1', 'js/main.js?v=1'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(F))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => { if (e.request.method !== 'GET') return; e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request))); });
