// اسم ذاكرة التخزين المؤقت. (تم تحديث الإصدار لضمان تحديث الـ PWA)
const CACHE_NAME = 'deerty-menu-cache-v1.1.2'; 

// قائمة بالملفات الأساسية التي يجب تخزينها مؤقتاً
const urlsToCache = [
  // ملفات HTML و CSS و JS الأساسية
  '/Dirty/', // ✨ المسار الأساسي (D كبيرة)
  '/Dirty/index.html',
  '/Dirty/style.css',
  '/Dirty/script.js',
  '/Dirty/manifest.json',
  
  // الأيقونات والصور (باستخدام أسماء ملفاتك: logo-192.png, logo-512.png)
  '/Dirty/logo.png',
  '/Dirty/logo-192.png',
  '/Dirty/logo-512.png',
  '/Dirty/images/hero-bg.jpg', // مسار افتراضي، يرجى التأكد من وجوده إن أمكن
];

// **********************************
// 1. تثبيت عامل الخدمة (Service Worker)
// **********************************
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event triggered. Caching assets...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Caching failed:', error);
      })
  );
});

// **********************************
// 2. تفعيل عامل الخدمة وتحديث الذاكرة المؤقتة
// **********************************
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event triggered. Clearing old caches...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// **********************************
// 3. جلب الموارد (Fetching - Cache-First Strategy)
// **********************************
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((networkResponse) => {
            const responseToCache = networkResponse.clone();
            
            if (networkResponse.status === 200 && networkResponse.type === 'basic') {
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
            }

            return networkResponse;
        });
      })
      .catch(() => {
          return new Response('You are offline and the resource is not cached.');
      })
  );
});
