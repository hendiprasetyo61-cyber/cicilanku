// CicilanKu Progressive Web App Service Worker
const CACHE_NAME = 'cicilanku-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// 1. Install Event (Diperbarui menjadi Fault-Tolerant)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets...');
      // Menggunakan map dan catch agar satu error tidak menggagalkan seluruh proses
      return Promise.all(
        STATIC_ASSETS.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.error(`Gagal melakukan cache pada aset: ${asset}`, err);
            // Tetap resolve agar instalasi Service Worker berlanjut
            return Promise.resolve();
          });
        })
      );
    })
  );
  self.skipWaiting(); // Memaksa SW baru untuk segera aktif
});

// 2. Activate Event - Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event - Network First with Cache Fallback for navigation
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        if (response) return response;
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

// 4. Web Push Notification Event
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'CicilanKu', body: event.data.text() };
    }
  }

  const title = data.title || 'Pengingat CicilanKu';
  const options = {
    body: data.body || 'Ada tagihan cicilan SPayLater yang mendekati jatuh tempo.',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Buka Tagihan' },
      { action: 'close', title: 'Tutup' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 5. Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});