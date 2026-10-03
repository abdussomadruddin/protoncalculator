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
  const appointment = data.kind === 'appointment';
  const followup = data.kind === 'followup';
  event.waitUntil(Promise.all([
    self.registration.showNotification(String(data.title || 'Car Loan MY').slice(0, 100), {
      body, icon: APP_ICON, badge: APP_ICON, tag: 'carloan-' + String(data.id || 'news'),
      data: followup ? { followup: true, url: '/' } : appointment ? { appointmentId: data.id, url: '/' } : { announcementId: data.id, url: '/' },
    }),
    self.clients.matchAll({ type: 'window' }).then(clients => clients.forEach(client => { if (!appointment&&!followup) client.postMessage({ type: 'announcement' }); })),
  ]));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const appointmentId = event.notification.data?.appointmentId;
  const followup = event.notification.data?.followup;
  const announcementId = event.notification.data?.announcementId || 'latest';
  const target = followup ? '/?followup=1' : appointmentId ? '/?appointment=' + encodeURIComponent(appointmentId) : '/?announcement=' + encodeURIComponent(announcementId);
  // Always open our app; external links remain an explicit action in the popup.
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
    const client = clients.find(client => new URL(client.url).origin === self.location.origin && !new URL(client.url).pathname.startsWith('/admin'));
    if (client) {
      await client.focus();
      // A suspended/old page may not have a listener. Use a deep link if it cannot acknowledge.
      const handled = await new Promise(resolve => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => { channel.port1.close(); resolve(false); }, 500);
        channel.port1.onmessage = () => { clearTimeout(timer); channel.port1.close(); resolve(true); };
        try { client.postMessage(followup ? {type:'followup'} : appointmentId ? { type: 'appointment', appointmentId } : { type: 'announcement', force: true, announcementId }, [channel.port2]); }
        catch { clearTimeout(timer); channel.port1.close(); resolve(false); }
      });
      if (!handled) {
        const navigated = await client.navigate(target).catch(() => null);
        if (!navigated) await self.clients.openWindow(target);
      }
    } else await self.clients.openWindow(target);
  }));
});
