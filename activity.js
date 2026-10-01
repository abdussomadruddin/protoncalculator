(() => {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join('');
  let deviceToken;
  let sessionToken;
  let lastSent = 0;
  let previousState;
  try {
    deviceToken = localStorage.getItem('carloan-device-token');
    if (!/^[a-f0-9]{64}$/.test(deviceToken || '')) {
      deviceToken = token(); localStorage.setItem('carloan-device-token', deviceToken);
    }
    const session = JSON.parse(sessionStorage.getItem('carloan-visit') || 'null');
    sessionToken = session && Date.now() - session.at < 30 * 60 * 1000 ? session.token : token();
    sessionStorage.setItem('carloan-visit', JSON.stringify({ token: sessionToken, at: Date.now() }));
  } catch { return; }
  async function record() {
    if (document.hidden) return;
    const phone = /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent);
    const phoneApp = phone && (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
    const permission = 'Notification' in window ? Notification.permission : 'unsupported';
    const state = phoneApp + ':' + permission;
    if (state === previousState && Date.now() - lastSent < 5 * 60 * 1000) return;
    lastSent = Date.now();
    try {
      const response = await fetch('/api/app?action=activity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceToken, sessionToken, phoneApp, permission }),
        signal: AbortSignal.timeout(12000),
      });
      if (response.ok) previousState = state;
    } catch { /* Analytics must never interrupt the calculator. */ }
  }
  record();
  addEventListener('pageshow', record);
  addEventListener('carloan-notification-synced', record);
  addEventListener('appinstalled', record);
  document.addEventListener('visibilitychange', record);
  setInterval(record, 5 * 60 * 1000);
})();
