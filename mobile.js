(() => {
  const dialog = document.querySelector('#appDialog');
  const title = document.querySelector('#dialogTitle');
  const description = document.querySelector('#dialogDescription');
  const content = document.querySelector('#dialogContent');
  const status = document.querySelector('#dialogStatus');
  const action = document.querySelector('#dialogAction');
  const secondary = document.querySelector('#dialogSecondary');
  const close = document.querySelector('#dialogClose');
  const phone = /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent);
  const ios = /iPhone|iPod/i.test(navigator.userAgent);
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Private browsing may limit storage. */ } },
  };
  let locked = false;
  let installPrompt;
  let announcement;
  let displayedAnnouncement = null;
  let swReady;
  let configPromise;
  let announcementTimer;
  let notificationAttempted = false;
  const icons = () => window.lucide?.createIcons();
  const api = async (actionName, body) => {
    const response = await fetch('/api/app?action=' + actionName, {
      method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', signal: AbortSignal.timeout(12000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.error || 'Sambungan terganggu. Cuba lagi.'); error.status = response.status; throw error; }
    return data;
  };
  function show({ heading, text, button, run, dismissible = true, alternative, alternateRun }) {
    displayedAnnouncement = null;
    locked = !dismissible;
    title.textContent = heading;
    description.textContent = text;
    content.replaceChildren();
    status.textContent = '';
    close.hidden = locked;
    action.hidden = !button;
    action.textContent = button || '';
    action.disabled = false;
    action.onclick = run || dismiss;
    secondary.hidden = !alternative;
    secondary.textContent = alternative || '';
    secondary.onclick = alternateRun || dismiss;
    if (!dialog.open) dialog.showModal();
    icons();
  }
  function dismiss() { if (!locked) { dialog.close(); displayedAnnouncement = null; checkAnnouncement(); } }
  function featureIcon(name) {
    const div = document.createElement('div'); div.className = 'dialog-feature-icon';
    const icon = document.createElement('i'); icon.dataset.lucide = name;
    div.append(icon); content.append(div); icons();
  }
  function notice(message) {
    const banner = document.querySelector('#appNotice');
    banner.querySelector('span').textContent = message; banner.hidden = false;
  }
  function installGuide() {
    show({ heading: 'Jadikan app di telefon', text: ios ? 'Pasang Car Loan MY melalui Safari/Chrome.' : 'Pasang Car Loan MY melalui Chrome.',
      button: installPrompt ? 'Pasang app' : 'Faham', run: installPrompt ? install : dismiss });
    const steps = ios ? [
      'Buka laman ini dalam Safari/Chrome pada iPhone.',
      'Tekan Share. Jika tersembunyi, buka menu More dahulu.',
      'Pilih Add to Home Screen. Aktifkan Open as Web App jika pilihan ini muncul.',
      'Tekan Add, kemudian buka icon Car Loan MY dari Home Screen.',
    ] : [
      'Buka laman ini dalam Chrome pada telefon Android.',
      'Tekan menu tiga titik di penjuru browser.',
      'Pilih Add to Home screen atau Install app.',
      'Tekan Install / Add, kemudian buka icon Car Loan MY dari Home Screen.',
    ];
    const list = document.createElement('ol'); list.className = 'install-steps';
    steps.forEach(text => { const li = document.createElement('li'); li.textContent = text; list.append(li); });
    content.append(list);
  }
  async function install() {
    if (!installPrompt) return installGuide();
    const prompt = installPrompt; installPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') dismiss(); else installGuide();
  }
  async function notificationConfig() {
    if (!configPromise) configPromise = api('config').catch(error => { configPromise = null; throw error; });
    return configPromise;
  }
  function notificationUnavailable(message) {
    show({ heading: 'Notification belum tersedia', text: message,
      button: 'Semak semula', run: () => { configPromise = null; notificationGate(); },
      alternative: 'Teruskan guna app', alternateRun: dismiss });
    featureIcon('bell-off');
  }
  async function notificationGate() {
    show({ heading: 'Semak notification', text: 'Menyemak sambungan notification...', button: null });
    try {
      const config = await notificationConfig();
      if (!dialog.open || title.textContent !== 'Semak notification') return;
      if (!config.pushReady) {
        notificationUnavailable('Sambungan notification di server belum diaktifkan oleh admin. Ini bukan masalah tetapan telefon anda. Kalkulator masih boleh digunakan.'); return;
      }
      if (ios && !standalone()) { installGuide(); return; }
      if (!('Notification' in window) || !('PushManager' in window) || !swReady) {
        notificationUnavailable('Telefon atau browser ini belum menyokong notification. Buka app dari Home Screen dan gunakan versi terkini.'); return;
      }
      await swReady;
      if (!dialog.open || title.textContent !== 'Semak notification') return;
    } catch {
      if (dialog.open && title.textContent === 'Semak notification') notificationUnavailable('Sambungan ke server notification terganggu. Semak internet dan cuba semula.');
      return;
    }
    show({ heading: 'Aktifkan notification', text: 'Terima hebahan Car Loan MY. Tekan butang di bawah, kemudian pilih Allow pada popup telefon.',
      button: 'On notification', run: enableNotifications, dismissible: false });
    featureIcon('bell-ring');
  }
  function allowAfterAttempt(message) {
    notificationAttempted = true;
    storage.set('carloan-notification-attempted', '1');
    status.textContent = message;
    secondary.hidden = false;
    secondary.textContent = 'Teruskan guna app';
    secondary.onclick = () => { locked = false; dialog.close(); notice(message); checkAnnouncement(); };
  }
  function base64Bytes(value) {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(base64 + '='.repeat((4 - base64.length % 4) % 4)), c => c.charCodeAt(0));
  }
  async function subscribe(existingOnly = false) {
    const config = await notificationConfig();
    if (!config.pushReady) throw new Error('Notification belum tersedia. Kalkulator masih boleh digunakan.');
    const registration = await swReady;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription && existingOnly) return null;
    if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64Bytes(config.vapidPublicKey) });
    let deviceToken = storage.get('carloan-device-token');
    if (!deviceToken) { deviceToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join(''); storage.set('carloan-device-token', deviceToken); }
    try { await api('subscribe', { subscription: subscription.toJSON(), deviceToken }); }
    catch (error) {
      if (error.status !== 409) throw error;
      await subscription.unsubscribe();
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64Bytes(config.vapidPublicKey) });
      await api('subscribe', { subscription: subscription.toJSON(), deviceToken });
    }
    return subscription;
  }
  async function enableNotifications() {
    action.disabled = true;
    status.textContent = '';
    try {
      if (!('Notification' in window) || !('PushManager' in window) || !swReady) {
        allowAfterAttempt('Telefon atau browser ini belum menyokong notification. Gunakan versi terkini; kalkulator masih boleh digunakan.'); return;
      }
      // Call before any await so iOS sees the direct button gesture.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        allowAfterAttempt(permission === 'denied' ? 'Notification disekat. Aktifkan semula melalui Settings telefon apabila diperlukan.' : 'Notification belum diaktifkan. Anda boleh cuba semula dalam Tetapan app.'); return;
      }
      await subscribe();
      notificationAttempted = true; storage.set('carloan-notification-attempted', '1');
      document.querySelector('#appNotice').hidden = true;
      locked = false; dialog.close(); checkAnnouncement();
    } catch (error) {
      configPromise = null;
      allowAfterAttempt(error.message);
    } finally { action.disabled = false; }
  }
  function settings() {
    show({ heading: 'Tetapan app', text: 'Car Loan MY', button: null });
    const menu = document.createElement('div'); menu.className = 'dialog-menu';
    const options = [
      ['download', 'Add to Home Screen', installGuide],
      ['bell-ring', 'Notification', notificationGate],
      ['megaphone', 'Hebahan terkini', () => checkAnnouncement(true)],
    ];
    for (const [iconName, label, handler] of options) {
      const button = document.createElement('button'); button.type = 'button';
      const icon = document.createElement('i'); icon.dataset.lucide = iconName;
      button.append(icon, document.createTextNode(label)); button.onclick = handler; menu.append(button);
    }
    content.append(menu); icons();
  }
  async function checkAnnouncement(force = false) {
    if (!phone || locked || (dialog.open && !displayedAnnouncement && !force)) return;
    try {
      const data = await api('announcement');
      if (locked || (dialog.open && !displayedAnnouncement && !force)) return;
      announcement = data.announcement;
      if (displayedAnnouncement && !announcement) { displayedAnnouncement = null; dialog.close(); }
      if (!announcement) {
        if (force) show({ heading: 'Tiada hebahan baharu', text: 'Anda sudah mengikuti hebahan terkini.', button: 'Tutup' });
        return;
      }
      if (!force && displayedAnnouncement === announcement.id && dialog.open) return;
      if (!force && storage.get('carloan-announcement-' + announcement.id)) { if (displayedAnnouncement) { displayedAnnouncement = null; dialog.close(); } return; }
      const a = announcement;
      let url;
      try { const parsed = new URL(a.link_url); if (parsed.protocol === 'https:') url = parsed.href; } catch { /* Text-only announcement. */ }
      show({ heading: a.title, text: a.message, button: url ? (a.link_label || 'Buka link') : 'Tutup', run: () => {
        storage.set('carloan-announcement-' + a.id, '1'); dismiss();
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      } });
      displayedAnnouncement = a.id;
      featureIcon('megaphone');
      close.onclick = () => { storage.set('carloan-announcement-' + a.id, '1'); dismiss(); };
    } catch { if (force) show({ heading: 'Tidak dapat memuatkan hebahan', text: 'Semak sambungan internet dan cuba lagi.', button: 'Cuba lagi', run: () => checkAnnouncement(true) }); }
  }
  dialog.addEventListener('cancel', event => { if (locked) event.preventDefault(); });
  close.onclick = dismiss;
  dialog.addEventListener('close', () => { if (dialog.open) return; displayedAnnouncement = null; close.onclick = dismiss; });
  document.querySelector('#appNotice button').onclick = () => { document.querySelector('#appNotice').hidden = true; };
  document.querySelector('#appMenuButton').onclick = settings;
  addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); installPrompt = event;
    if (dialog.open && title.textContent === 'Jadikan app di telefon' && !locked) { action.textContent = 'Pasang app'; action.onclick = install; }
  });
  addEventListener('appinstalled', () => { if (!locked && dialog.open) dialog.close(); });
  addEventListener('pageshow', () => {
    if (phone && standalone() && 'Notification' in window && Notification.permission !== 'granted' && notificationAttempted) notice('Notification belum aktif. Tekan Tetapan app untuk mencuba semula.');
  });
  icons();
  if (!phone) {
    show({ heading: 'Untuk telefon sahaja', text: 'Car Loan MY hanya boleh digunakan di telefon. Buka alamat ini menggunakan browser iPhone atau Android.',
      button: 'Copy link', run: async () => { try { await navigator.clipboard.writeText(location.origin + '/'); action.textContent = 'Link disalin'; } catch { status.textContent = location.origin + '/'; } }, dismissible: false });
    featureIcon('smartphone'); return;
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    swReady = navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready);
    swReady.catch(() => { swReady = null; });
  }
  notificationAttempted = storage.get('carloan-notification-attempted') === '1';
  if (standalone()) {
    notificationConfig().then(async config => {
      if (!config.pushReady) { notificationUnavailable('Sambungan notification di server belum diaktifkan oleh admin. Ini bukan masalah tetapan telefon anda. Kalkulator masih boleh digunakan.'); return; }
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        if (!notificationAttempted) notificationGate();
        else notice('Notification belum aktif. Tekan Tetapan app untuk mencuba semula.');
      } else if (!await subscribe(true)) notificationGate();
    }).catch(() => notice('Sambungan server notification terganggu. Kalkulator masih boleh digunakan.'));
  } else installGuide();
  checkAnnouncement(new URLSearchParams(location.search).has('announcement'));
  announcementTimer = setInterval(() => { if (!document.hidden) checkAnnouncement(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkAnnouncement(); });
  navigator.serviceWorker?.addEventListener('message', event => checkAnnouncement(event.data?.force === true));
  addEventListener('pagehide', () => clearInterval(announcementTimer), { once: true });
})();
