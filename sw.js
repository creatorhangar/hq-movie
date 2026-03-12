// HQ Movie — Service Worker (Cache-First)
const CACHE_NAME = 'hq-movie-v97-design-tokens';
const ASSETS = [
    '/',
    '/index.html',
    '/styles-v3.css?v=34',
    '/i18n.js?v=5',
    '/layouts.js?v=4',
    '/layouts-video.js?v=7',
    '/app.js?v=12',
    '/video-exporter.js?v=11',
    '/ui.js?v=37',
    '/onboarding.js?v=8',
    '/controller.js?v=31',
    '/manifest.json',
    '/locales/en.json',
    '/locales/pt-BR.json',
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
