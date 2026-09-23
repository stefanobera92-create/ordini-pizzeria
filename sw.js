const CACHE_NAME = 'ordini-pizzeria-v3';
const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Prima la rete (così un nuovo deploy su Netlify arriva subito), la cache solo offline.
self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(function(resp){
      if(resp && (resp.ok || resp.type === 'opaque')){
        var copy = resp.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
      }
      return resp;
    }).catch(function(){
      return caches.match(event.request).then(function(cached){
        if(cached) return cached;
        if(event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
