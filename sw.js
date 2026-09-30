const APP_ICON = '/icon-192.png?v=20260930';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
// Network-only: never serve stale vehicle prices or authenticated admin responses.
self.addEventListener('fetch', event => {
  if (event.request.method === 'GET' && new URL(event.request.url).origin === self.location.origin) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
  }
});
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { message: event.data?.text() }; }
  const body = String(data.message || 'Hebahan baharu daripada Car Loan MY.').slice(0, 500);
  event.waitUntil(Promise.all([
    self.registration.showNotification(String(data.title || 'Car Loan MY').slice(0, 100), {
      body, icon: APP_ICON, badge: APP_ICON, tag: 'carloan-' + String(data.id || 'news'),
      data: { announcementId: data.id, url: '/' },
    }),
    self.clients.matchAll({ type: 'window' }).then(clients => clients.forEach(client => client.postMessage({ type: 'announcement' }))),
  ]));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  // Always open our app; external links remain an explicit action in the popup.
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
    const client = clients.find(client => new URL(client.url).origin === self.location.origin && !new URL(client.url).pathname.startsWith('/admin'));
    if (client) { await client.focus(); client.postMessage({ type: 'announcement', force: true }); }
    else await self.clients.openWindow('/?announcement=' + encodeURIComponent(event.notification.data?.announcementId || 'latest'));
  }));
});
