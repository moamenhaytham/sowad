/**
 * خدمة العامل للتطبيق التقدمي
 */

const CACHE_NAME = 'saad-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './saad-persona.js',
    './speech-recognition.js',
    './speech-synthesis.js',
    './gemini-api.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// تثبيت خدمة العامل
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('تم فتح التخزين المؤقت');
                return cache.addAll(urlsToCache);
            })
    );
});

// تنشيط خدمة العامل
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// استراتيجية التخزين المؤقت: الشبكة أولاً، ثم التخزين المؤقت
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // نسخ الاستجابة
                const responseToCache = response.clone();
                
                // تخزين الاستجابة في التخزين المؤقت
                caches.open(CACHE_NAME)
                    .then(cache => {
                        // تخزين فقط الطلبات GET
                        if (event.request.method === 'GET') {
                            cache.put(event.request, responseToCache);
                        }
                    });
                
                return response;
            })
            .catch(() => {
                // إذا فشل الطلب، حاول الحصول على الاستجابة من التخزين المؤقت
                return caches.match(event.request);
            })
    );
});