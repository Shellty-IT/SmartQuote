// SmartQuote-AI/public/sw.js
const CACHE_NAME = 'smartquote-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
    '/',
    '/dashboard',
    '/dashboard/offers',
    '/dashboard/clients',
    '/dashboard/ai',
    '/offline.html',
];

const CACHE_STRATEGIES = {
    cacheFirst: [
        /\/_next\/static\//,
        /\/icons\//,
        /\/manifest\.json$/,
        /\.woff2?$/,
        /\.png$/,
        /\.svg$/,
        /\.ico$/,
    ],
    networkFirst: [
        /\/_next\/data\//,
        /\/dashboard/,
        /\/offer\/view\//,
    ],
    networkOnly: [
        /\/api\//,
        /\/auth\//,
        /nextauth/,
    ],
};

function matchesPatterns(url, patterns) {
    return patterns.some(function(pattern) {
        return pattern.test(url);
    });
}

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(PRECACHE_URLS).catch(function() {
                return cache.addAll(['/offline.html']);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function(name) {
                        return name !== CACHE_NAME;
                    })
                    .map(function(name) {
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    var url = event.request.url;

    if (event.request.method !== 'GET') return;

    if (matchesPatterns(url, CACHE_STRATEGIES.networkOnly)) {
        return;
    }

    if (matchesPatterns(url, CACHE_STRATEGIES.cacheFirst)) {
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                if (cached) return cached;
                return fetch(event.request).then(function(response) {
                    if (response && response.status === 200) {
                        var clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    if (matchesPatterns(url, CACHE_STRATEGIES.networkFirst)) {
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    if (response && response.status === 200) {
                        var clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(function() {
                    return caches.match(event.request).then(function(cached) {
                        return cached || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                if (response && response.status === 200 && response.type === 'basic') {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(function() {
                return caches.match(event.request).then(function(cached) {
                    if (cached) return cached;
                    if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
                        return caches.match(OFFLINE_URL);
                    }
                    return new Response('', { status: 408, statusText: 'Offline' });
                });
            })
    );
});

self.addEventListener('push', function(event) {
    var data = { title: 'SmartQuote AI', body: 'Nowe powiadomienie', url: '/dashboard' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            vibrate: [200, 100, 200],
            tag: data.tag || 'smartquote-notification',
            renotify: true,
            data: { url: data.url || '/dashboard' },
            actions: [
                { action: 'open', title: 'Otwórz' },
                { action: 'dismiss', title: 'Odrzuć' },
            ],
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    var url = '/dashboard';
    if (event.notification.data && event.notification.data.url) {
        url = event.notification.data.url;
    }

    if (event.action === 'dismiss') return;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.includes('/dashboard') && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return self.clients.openWindow(url);
        })
    );
});