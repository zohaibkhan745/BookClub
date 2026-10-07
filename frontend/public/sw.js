// Book Club Service Worker for Web Push & PWA
const SW_VERSION = 'v1.0.0';

self.addEventListener('install', (event) => {
  // Activate worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Become available to all active clients immediately
  event.waitUntil(self.clients.claim());
});

// Push notification received from Web Push server (iOS PWA / Android)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Book Club',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'New Book Added!';
  const options = {
    body: data.body || data.message || 'A new book has been added to the Book Club.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    image: data.image || data.book_cover || undefined,
    tag: data.tag || 'book-upload-notification',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || (data.book_slug ? `/book/${data.book_slug}` : '/')
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// User clicked on the push notification banner
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is currently open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
