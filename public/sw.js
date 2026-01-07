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
    '/icons/icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    // Basic Stale-while-revalidate strategy for GET requests
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
    } else {
        event.respondWith(fetch(event.request));
    }
});
