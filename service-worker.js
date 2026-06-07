// service-worker.js

// لیست فایل‌هایی که باید کش بشن (برای آفلاین کار کردن)
// این لیست باید شامل تمام فایل‌های CSS، JS، آیکون‌ها و خود index.html باشه
const CACHE_NAME = 'aeris-weather-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css', // مسیر CSS خودت رو اینجا بذار
  // اضافه کردن تمام فایل‌های JS ماژولار
  '/js/config.js',
  '/js/state.js',
  '/js/api.js',
  '/js/ui.js',
  '/js/events.js',
  '/js/app.js',
  // آیکون‌ها
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // فونت‌ها یا منابع دیگه اگر داری
];

// مرحله نصب Service Worker
self.addEventListener('install', (event) => {
  // event.waitUntil() مطمئن میشه که نصب کامل نشده تا وقتی promise حل بشه
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache); // اضافه کردن همه فایل‌ها به کش
      })
      .then(() => self.skipWaiting()) // فعال شدن سریعتر worker جدید
  );
});

// مرحله رهگیری درخواست‌ها (Fetch)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // اگر فایل در کش پیدا شد، همون رو برگردون
        if (response) {
          return response;
        }
        // در غیر این صورت، از شبکه بگیر
        return fetch(event.request).then(
          (response) => {
            // اگر response معتبر بود، اون رو هم در کش ذخیره کن برای استفاده‌های بعدی
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // کلون کردن response چون response اصلی رو نمیشه دوباره استفاده کرد
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
      .catch(error => {
        // مدیریت خطاها در زمان fetch (مثلاً اگر شبکه قطع بود و فایل در کش هم نبود)
        console.error('Fetch error:', error);
        // می‌تونی اینجا یک صفحه خطای آفلاین یا محتوای پیش‌فرض برگردونی
        // return new Response('<h1>Offline</h1><p>You are offline, and this content could not be loaded.</p>', { headers: {'Content-Type': 'text/html'} });
      })
  );
});

// مرحله فعال‌سازی Service Worker (پاک کردن کش‌های قدیمی)
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]; // لیستی از کش‌های معتبر
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // اگر کش جزو لیست معتبر نبود، پاکش کن
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // کنترل همه client ها رو بدست بگیر
  );
});
