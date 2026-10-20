// public/sw.js — ForgeOS TWA-optimised service worker
// Version bump here forces reinstall when you change the SW logic.
const CACHE_VERSION = 'v8';
const SHELL_CACHE = `forgeos-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `forgeos-static-${CACHE_VERSION}`;

// Handle SKIP_WAITING message from the page's registration script.
// This allows the waiting SW to activate immediately without needing
// all tabs to close, ensuring instant cache control on every TWA launch.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


// App-shell pages that should always be available offline and
// served instantly on every TWA cold-launch after first activation.
const SHELL_URLS = [
  '/',
  '/manifest.json',
];

// Long-lived static assets (Next.js content-hashed chunks).
const STATIC_IMMUTABLE = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
// skipWaiting() means this SW becomes active immediately — no waiting for
// old tabs to close.  Combined with clients.claim() below this ensures
// the very first TWA launch is served by the SW.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then((cache) =>
        cache.addAll(SHELL_URLS).catch((err) =>
          console.warn('[SW] Shell pre-cache failed:', err)
        )
      ),
      caches.open(STATIC_CACHE).then((cache) =>
        cache.addAll(STATIC_IMMUTABLE).catch((err) =>
          console.warn('[SW] Static pre-cache failed:', err)
        )
      ),
    ])
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
// clients.claim() forces this SW to control all open tabs/windows immediately
// so even the first TWA cold-launch benefits from cache.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key !== SHELL_CACHE && key !== STATIC_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET — let mutations/POSTs go to the network.
  if (request.method !== 'GET') return;

  // 2. Never intercept API routes, NextAuth, or Stripe/Razorpay webhooks.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/') === false && url.pathname.includes('_rsc')
  ) return;

  // 3. Cache-First (immutable) for Next.js content-hashed static chunks.
  //    These never change for a given hash so a cache hit is always safe.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    event.respondWith(
      caches.match(request, { cacheName: STATIC_CACHE }).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // 4. Stale-While-Revalidate for page navigation — this is the key TWA fix.
  //    On cold launch the cached shell HTML is returned INSTANTLY (0ms network
  //    wait) while a fresh copy is fetched in the background and stored for
  //    the next visit.  The user sees your dark UI immediately — no Chrome
  //    address-bar flash, no blank white screen.
  // 4. Network-First with cache fallback for page navigation.
  //    Ensures users immediately receive newly deployed versions when online,
  //    while offline users still load instantly from cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          return (await cache.match(request)) || (await cache.match('/'));
        })
    );
    return;
  }

  // 5. For everything else (images, JSON, etc.) — Network-First with cache
  //    fallback so fresh data takes priority but offline still works.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});

