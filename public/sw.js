const CACHE_NAME = 'filosofia-app-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/admin.html',
    '/styles.css',
    '/admin.css',
    '/app.js',
    '/admin.js',
    '/manifest.json',
    '/icons/icon.png',
    '/icons/icon-192.png'
];

// Install: Cache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        // console.log('Service Worker: Deleting old cache', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Hybrid strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-http/https requests (e.g., chrome-extension://)
    if (!event.request.url.startsWith('http')) return;

    // API Requests: Network-First with Offline Fallback
    if (url.pathname.startsWith('/api')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Only cache successful GET requests
                    if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
                        // CRITICAL: Clone synchronously before returning to avoid "Response body already used"
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) return cachedResponse;

                    // Return a JSON error if offline and not in cache
                    return new Response(JSON.stringify({
                        error: 'Offline e sem dados em cache',
                        data: []
                    }), {
                        headers: { 'Content-Type': 'application/json' },
                        status: 503
                    });
                })
        );
        return;
    }

    // Static Assets: Cache-First, then Network (Stale-While-Revalidate could also work)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                // Cache dynamic static assets that are not in the initial ASSETS list (GET only)
                if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
                    // CRITICAL: Clone synchronously before returning
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // For HTML fallback if everything fails
                if (event.request.mode === 'navigate') {
                    return caches.match('/');
                }
            });
        })
    );
});
