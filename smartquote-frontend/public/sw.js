const CACHE_NAME = 'smartquote-static-v3';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
    OFFLINE_URL,
    '/logo.svg',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/site.webmanifest',
];

function isStaticAsset(url) {
    if (url.origin !== self.location.origin) return false;
    if (url.pathname.startsWith('/_next/static/')) return true;
    return PRECACHE_URLS.includes(url.pathname);
}

function isPrivatePath(pathname) {
    return pathname === '/dashboard'
        || pathname.startsWith('/dashboard/')
        || pathname.startsWith('/offer/view/')
        || pathname.startsWith('/contract/view/')
        || pathname === '/api'
        || pathname.startsWith('/api/')
        || pathname === '/auth'
        || pathname.startsWith('/auth/');
}

function safeNotificationPath(value) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
    try {
        const url = new URL(value, self.location.origin);
        if (url.origin !== self.location.origin) return '/dashboard';
        const allowed = url.pathname === '/dashboard'
            || url.pathname.startsWith('/dashboard/')
            || url.pathname.startsWith('/offer/view/')
            || url.pathname.startsWith('/contract/view/');
        return allowed ? `${url.pathname}${url.search}${url.hash}` : '/dashboard';
    } catch {
        return '/dashboard';
    }
}

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(PRECACHE_URLS).catch(function() {
                return cache.add(OFFLINE_URL);
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
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(function() {
                return caches.match(OFFLINE_URL);
            })
        );
        return;
    }

    if (isPrivatePath(url.pathname)) return;
    if (!isStaticAsset(url)) return;

    event.respondWith(
        caches.match(event.request).then(function(cached) {
            if (cached) return cached;
            return fetch(event.request).then(function(response) {
                if (response && response.ok && response.type === 'basic') {
                    const clone = response.clone();
                    void caches.open(CACHE_NAME).then(function(cache) {
                        return cache.put(event.request, clone);
                    });
                }
                return response;
            });
        })
    );
});

self.addEventListener('push', function(event) {
    let data = { title: 'SmartQuote AI', body: 'Nowe powiadomienie', url: '/dashboard' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/android-chrome-192x192.png',
            badge: '/android-chrome-192x192.png',
            vibrate: [200, 100, 200],
            tag: data.tag || 'smartquote-notification',
            renotify: true,
            data: { url: safeNotificationPath(data.url) },
            actions: [
                { action: 'open', title: 'Otwórz' },
                { action: 'dismiss', title: 'Odrzuć' },
            ],
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.action === 'dismiss') return;

    const url = safeNotificationPath(event.notification.data && event.notification.data.url);
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if ('navigate' in client && 'focus' in client) {
                    return client.navigate(url).then(function() {
                        return client.focus();
                    });
                }
            }
            return self.clients.openWindow(url);
        })
    );
});
