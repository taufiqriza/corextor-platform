const CACHE_VERSION = 'v3';
const STATIC_CACHE = `corextor-static-${CACHE_VERSION}`;
const CACHE_PREFIX = 'corextor-static-';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith(CACHE_PREFIX) && name !== STATIC_CACHE)
        .map(name => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  if (isStaticAssetRequest(url.pathname)) {
    event.respondWith(handleStaticAssetRequest(request));
  }
});

async function handleStaticAssetRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(response => {
      if (response && response.status === 200 && response.type === 'basic') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

function isStaticAssetRequest(pathname) {
  return /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(pathname);
}
