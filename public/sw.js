// CicilanKu Progressive Web App Service Worker
const CACHE_NAME = 'cicilanku-v3';

// Hanya aset statis murni. Jangan masukkan rute yang bergantung login.
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// 1. Install Event (fault-tolerant)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets...');
      return Promise.all(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.error(`Gagal melakukan cache pada aset: ${asset}`, err);
            return Promise.resolve();
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// 2. Activate Event - hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 3. Fetch Event - Network First, fallback ke cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Biarkan request ke domain lain (Supabase, dll.) lewat tanpa dicegat
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((response) => {
        if (response) return response;

        if (event.request.mode === 'navigate') {
          return new Response(
            '<!doctype html><html lang="id"><head><meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<title>Offline - CicilanKu</title></head>' +
            '<body style="font-family:sans-serif;text-align:center;padding:50px;">' +
            '<h1>Anda sedang offline</h1>' +
            '<p>Periksa koneksi internet Anda lalu coba lagi.</p>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }

        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })
    )
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

  const targetUrl = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  ).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
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