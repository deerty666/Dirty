const CACHE_NAME='deerty-menu-cache-v1';
const urlsToCache=['/','index.html','style.css','script.js','manifest.json'];

self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(urlsToCache))); });

self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });

self.addEventListener('activate',e=>{ const whitelist=[CACHE_NAME]; e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>!whitelist.includes(k)?caches.delete(k):null)))); });
