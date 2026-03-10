// HQ Movie — Service Worker (Cache-First)
const CACHE_NAME = 'hq-movie-v66-slideshow';
const ASSETS = [
    '/',
    '/index.html',
    '/styles-v3.css?v=22',
    '/i18n.js?v=1',
    '/layouts.js?v=4',
    '/layouts-video.js?v=5',
    '/app.js?v=9',
    '/video-exporter.js?v=9',
    '/ui.js?v=22',
    '/onboarding.js?v=5',
    '/controller.js?v=19',
    '/manifest.json',
    '/vendor/dompurify.min.js',
    '/vendor/dexie.min.js',
    '/vendor/jspdf.umd.min.js',
    '/vendor/html2canvas.min.js',
    '/vendor/jszip.min.js',
    '/vendor/react.production.min.js',
    '/vendor/react-dom.production.min.js',
    '/vendor/excalidraw.production.min.js'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    const url = e.request.url;
    // Cache-first for fonts and vendor libs (rarely change)
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com') || url.includes('/vendor/')) {
        e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            return res;
        })));
        return;
    }
    // Network-first for app JS/CSS/HTML (always get latest code)
    e.respondWith(fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
    }).catch(() => caches.match(e.request)));
});
