/// <reference lib="webworker" />
/* eslint-env serviceworker */

// Phoenix Booking Service Worker for Push Notifications

const CACHE_NAME = 'phoenix-booking-v1';

// Listen for push events
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[SW] Push event but no data');
    return;
  }

  const data = event.data.json();
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.data?.primaryKey || 1,
      url: data.data?.url || '/',
      ...data.data,
    },
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'close', title: 'Close' },
    ],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'phoenix-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Phoenix Booking', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received.');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window tab is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      // Otherwise, open a new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification was closed', event.notification.tag);
});

// Service Worker Install
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing.');
  self.skipWaiting();
});

// Service Worker Activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated.');
  event.waitUntil(clients.claim());
});

// Background Sync (for offline booking submissions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    console.log('[SW] Syncing bookings...');
    // Handle background sync for offline bookings
  }
});
