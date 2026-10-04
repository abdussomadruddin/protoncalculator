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
  const ios = /iPhone|iPod|iPad/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(navigator.userAgent);
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
  let notificationSynced = false;
  let announcementRequest = 0;
  let announcementLoading = false;
  const launchAnnouncement = new URLSearchParams(location.search).get('announcement');
  const notificationLaunch = new URLSearchParams(location.search).has('announcement');
  const reminderInterval = 5 * 60 * 1000;
  let nextInstallReminder = Date.now() + reminderInterval;
  const reminderExempt = () => phone && standalone() && notificationSynced && 'Notification' in window && Notification.permission === 'granted';
  function checkInstallReminder() {
    if (document.hidden || dialog.open || locked || announcementLoading || reminderExempt() || Date.now() < nextInstallReminder) return;
    installGuide();
  }
  const icons = () => window.lucide?.createIcons();
  const api = async (actionName, body, id) => {
    const request = fetch('/api/app?action=' + actionName + (id && id !== 'latest' ? '&id=' + encodeURIComponent(id) : ''), {
      method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', signal: AbortSignal.timeout(12000),
    });
    const response = await (window.CarLoanBoot?.wait(request) || request);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.error || 'Sambungan terganggu. Cuba lagi.'); error.status = response.status; throw error; }
    return data;
  };
  function show({ heading, text, button, run, dismissible = true, alternative, alternateRun }) {
    dialog.classList.remove('settings-dialog','pro-features-dialog');
    displayedAnnouncement = null;
    locked = !dismissible;
    title.textContent = heading;
    description.textContent = text;
    content.replaceChildren();
    status.textContent = '';
    close.hidden = locked;
    close.onclick = dismiss;
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
    nextInstallReminder = Date.now() + reminderInterval;
    const alreadyInstalled = standalone();
    show({ heading: ios || android ? 'Jadikan app di telefon' : 'Jadikan Car Loan MY sebagai app', text: alreadyInstalled ? 'App sudah dipasang. Peringatan berhenti untuk app telefon dengan notification aktif.' : ios ? 'Pasang Car Loan MY melalui Safari/Chrome.' : android ? 'Pasang Car Loan MY melalui Chrome.' : 'Pasang Car Loan MY melalui Chrome, Edge atau Safari pada komputer.',
      button: installPrompt ? 'Pasang app' : 'Faham', run: installPrompt ? install : dismiss });
    const steps = ios ? [
      'Buka laman ini dalam Safari/Chrome pada iPhone.',
      'Tekan Share. Jika tersembunyi, buka menu More dahulu.',
      'Pilih Add to Home Screen. Aktifkan Open as Web App jika pilihan ini muncul.',
      'Tekan Add, kemudian buka icon Car Loan MY dari Home Screen.',
    ] : android ? [
      'Buka laman ini dalam Chrome pada telefon Android.',
      'Tekan menu tiga titik di penjuru browser.',
      'Pilih Add to Home screen atau Install app.',
      'Tekan Install / Add, kemudian buka icon Car Loan MY dari Home Screen.',
    ] : [
      'Buka laman ini dalam Chrome, Edge atau Safari pada komputer.',
      'Chrome / Edge: buka menu tiga titik. Safari pada Mac: buka menu File.',
      'Chrome / Edge: pilih Install Car Loan MY atau Install page as app. Safari: pilih Add to Dock.',
      'Tekan Install / Add, kemudian buka Car Loan MY melalui senarai Apps atau Dock.',
    ];
    if (!(ios && !alreadyInstalled)) {
      secondary.hidden = false; secondary.textContent = 'Aktifkan notification'; secondary.onclick = notificationGate;
    }
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
        notificationUnavailable('Browser ini belum menyokong push notification. Gunakan Chrome, Edge, Firefox atau Safari terkini. Pada iPhone/iPad, pasang melalui Add to Home Screen dahulu.'); return;
      }
      await swReady;
      if (!dialog.open || title.textContent !== 'Semak notification') return;
    } catch {
      if (dialog.open && title.textContent === 'Semak notification') notificationUnavailable('Sambungan ke server notification terganggu. Semak internet dan cuba semula.');
      return;
    }
    show({ heading: 'Aktifkan notification', text: 'Terima hebahan Car Loan MY pada peranti ini. Tekan butang di bawah, kemudian pilih Allow / Benarkan pada popup browser atau peranti.',
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
  function permissionHelp() {
    return ios ? 'Notification disekat. Buka Settings peranti > Notifications > Car Loan MY dan aktifkan Allow Notifications. Kemudian buka semula app dari Home Screen.'
      : 'Notification disekat. Buka tetapan laman melalui ikon di sebelah alamat browser > Site settings / Permissions > Notifications > Allow. Semak juga Settings peranti > Notifications untuk browser ini, kemudian muat semula laman.';
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
    notificationSynced = true;
    dispatchEvent(new Event('carloan-notification-synced'));
    return subscription;
  }
  async function enableNotifications() {
    action.disabled = true;
    status.textContent = '';
    try {
      if (!('Notification' in window) || !('PushManager' in window) || !swReady) {
        allowAfterAttempt('Browser ini belum menyokong push notification. Gunakan browser terkini; pada iPhone/iPad pasang app ke Home Screen dahulu. Kalkulator masih boleh digunakan.'); return;
      }
      // Call before any await so iOS sees the direct button gesture.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        allowAfterAttempt(permission === 'denied' ? permissionHelp() : 'Notification belum diaktifkan. Pilih Allow / Benarkan pada browser atau cuba semula dalam Tetapan app.'); return;
      }
      await subscribe();
      notificationAttempted = true; storage.set('carloan-notification-attempted', '1');
      notice('Notification aktif untuk peranti dan browser ini. Anda sudah melanggan hebahan Car Loan MY.');
      locked = false; dialog.close(); checkAnnouncement();
    } catch (error) {
      notificationSynced = false;
      configPromise = null;
      allowAfterAttempt(error.name === 'NotAllowedError' ? permissionHelp() : error.name === 'AbortError' ? 'Pendaftaran push terganggu. Semak sambungan internet dan tetapan notification browser, kemudian cuba semula.' : error.message);
    } finally { action.disabled = false; }
  }
  function settings() {
    show({ heading: 'Tetapan app', text: '', button: null });
    dialog.classList.add('settings-dialog');
    const menu = document.createElement('div'); menu.className = 'dialog-menu';
    const options = [
      ['contact', 'Profil Ejen', () => { dialog.close(); window.proWorkspace.openProfile(); }],
      ['sparkles', 'Semua Fungsi PRO', proFeatures],
      ['download', 'Add to Home Screen', installGuide],
      ['bell-ring', 'Notification', notificationGate],
      ['megaphone', 'Hebahan terkini', () => checkAnnouncement(true)],
    ];
    for (const [iconName, label, handler] of options) {
      const button = document.createElement('button'); button.type = 'button';
      const icon = document.createElement('i'); icon.dataset.lucide = iconName;
      button.append(icon, document.createTextNode(label)); button.onclick = handler; menu.append(button);
    }
    const support = document.createElement('a'); support.className = 'support-whatsapp';
    support.href = 'https://wa.me/60173559147'; support.target = '_blank'; support.rel = 'noopener noreferrer';
    const whatsapp = document.createElement('img'); whatsapp.src = '/assets/icons/whatsapp.svg'; whatsapp.alt = ''; whatsapp.width = 22; whatsapp.height = 22;
    support.append(whatsapp, document.createTextNode('Hubungi Support')); menu.append(support);
    content.append(menu); icons();
  }
  function proFeatures() {
    show({heading:'Semua Fungsi PRO',text:'Calculator percuma tanpa akaun. Empat tab PRO percuma sehingga 31 Disember 2026.',button:'Kembali ke Tetapan',run:settings});
    dialog.classList.add('pro-features-dialog');
    const list=document.createElement('div');list.className='pro-feature-list';
    for(const [iconName,label,text] of [
      ['calculator','Calculator','Kira ansuran ikut kereta, rebate, insurans/NCD, downpayment, kadar faedah dan tempoh. Copy WhatsApp atau simpan poster JPG.'],
      ['git-compare-arrows','Comparison · PRO','Banding dua kereta dengan tetapan loan berasingan. Lihat ansuran, jumlah faedah dan bayaran loan; simpan poster dua kereta.'],
      ['folder-kanban','Case · PRO','Rekod pelanggan dan kereta dari Document collected hingga Delivered atau Cancelled. Tukar status, simpan remark, lihat sejarah dan hubungi pelanggan.'],
      ['clock-3','Follow Up · PRO','Case tanpa kemas kini status atau remark selama 3 hari muncul di sini. Rejected, Delivered dan Cancelled dikecualikan. Reminder push pada 8 pagi waktu Malaysia jika ada case.'],
      ['calendar-days','Appointment · PRO','Rekod Test Drive atau Delivery, tarikh, masa, lokasi dan nota. Reminder push 3 hari, 1 hari, 4 jam dan 1 jam sebelum appointment; notification perlu aktif.'],
    ]) {
      const row=document.createElement('section'),icon=document.createElement('i'),copy=document.createElement('div'),heading=document.createElement('h3'),description=document.createElement('p');
      icon.dataset.lucide=iconName;heading.textContent=label;description.textContent=text;copy.append(heading,description);row.append(icon,copy);list.append(row);
    }
    content.append(list);icons();
  }
  async function checkAnnouncement(force = false, id) {
    if (!force && (announcementLoading || locked || (dialog.open && !displayedAnnouncement))) return;
    const request = ++announcementRequest;
    if (force) {
      announcementLoading = true;
      show({ heading: 'Memuatkan hebahan', text: 'Mendapatkan hebahan yang dipilih...', button: 'Tutup' });
    }
    try {
      const data = await api('announcement', null, id);
      if (request !== announcementRequest) return;
      announcementLoading = false;
      if (!force && (locked || (dialog.open && !displayedAnnouncement))) return;
      announcement = data.announcement;
      if (displayedAnnouncement && !announcement) { displayedAnnouncement = null; dialog.close(); }
      if (!announcement) {
        if (force) show({ heading: 'Tiada hebahan baharu', text: id && id !== 'latest' ? 'Hebahan ini sudah ditutup oleh admin atau tidak lagi tersedia.' : 'Anda sudah mengikuti hebahan terkini.', button: 'Tutup' });
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
    } catch {
      if (request !== announcementRequest) return;
      announcementLoading = false;
      if (force) show({ heading: 'Tidak dapat memuatkan hebahan', text: 'Semak sambungan internet dan cuba lagi.', button: 'Cuba lagi', run: () => checkAnnouncement(true, id) });
    }
  }
  dialog.addEventListener('cancel', event => { if (locked) event.preventDefault(); });
  close.onclick = dismiss;
  dialog.addEventListener('close', () => { if (dialog.open) return; if (announcementLoading) { announcementRequest++; announcementLoading = false; } displayedAnnouncement = null; close.onclick = dismiss; checkInstallReminder(); });
  document.querySelector('#appNotice button').onclick = () => { document.querySelector('#appNotice').hidden = true; };
  document.querySelector('#appMenuButton').onclick = settings;
  addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); installPrompt = event;
    if (dialog.open && (title.textContent === 'Jadikan app di telefon' || title.textContent === 'Jadikan Car Loan MY sebagai app') && !locked) { action.textContent = 'Pasang app'; action.onclick = install; }
  });
  addEventListener('appinstalled', () => { if (!locked && dialog.open) dialog.close(); });
  addEventListener('pageshow', () => {
    if (phone && standalone() && 'Notification' in window && Notification.permission !== 'granted' && notificationAttempted) notice('Notification belum aktif. Tekan Tetapan app untuk mencuba semula.');
  });
  icons();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    swReady = navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready);
    if(window.CarLoanBoot)swReady=window.CarLoanBoot.wait(swReady);
    swReady.catch(() => { swReady = null; });
  }
  notificationAttempted = storage.get('carloan-notification-attempted') === '1';
  navigator.serviceWorker?.addEventListener('message', event => {
    if (event.data?.type !== 'announcement') return;
    if (event.data.force === true) event.ports?.[0]?.postMessage({ handled: true });
    checkAnnouncement(event.data.force === true, event.data.announcementId);
  });
  if (notificationLaunch) {
    const url = new URL(location.href); url.searchParams.delete('announcement'); history.replaceState(null, '', url);
    checkAnnouncement(true, launchAnnouncement || 'latest');
    if ('Notification' in window && Notification.permission === 'granted' && swReady && 'PushManager' in window) {
      subscribe(true).catch(() => notice('Langganan notification belum disegerakkan. Cuba semula dalam Tetapan app.'));
    }
  } else if (standalone()) {
    const startupNotification=notificationConfig().then(async config => {
      if (announcementLoading || displayedAnnouncement) return;
      if (!config.pushReady) { notificationUnavailable('Sambungan notification di server belum diaktifkan oleh admin. Ini bukan masalah tetapan telefon anda. Kalkulator masih boleh digunakan.'); return; }
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        if (!notificationAttempted) notificationGate();
        else notice('Notification belum aktif. Tekan Tetapan app untuk mencuba semula.');
      } else if (!await subscribe(true) && !announcementLoading && !displayedAnnouncement) notificationGate();
    }).catch(() => notice('Sambungan server notification terganggu. Kalkulator masih boleh digunakan.'));
    window.CarLoanBoot?.wait(startupNotification);
  } else {
    installGuide();
    if ('Notification' in window && Notification.permission === 'granted' && swReady && 'PushManager' in window) {
      subscribe(true).catch(() => notice('Langganan notification belum disegerakkan. Cuba semula dalam Tetapan app.'));
    }
  }
  if (!notificationLaunch) checkAnnouncement();
  let announcementSyncPending=false;
  const announcementLive=window.CarLoanLive(api,()=>{if(document.hidden)return;if(announcementLoading||locked||dialog.open&&!displayedAnnouncement){announcementSyncPending=true;return;}announcementSyncPending=false;checkAnnouncement();},()=>{},'public-realtime');
  announcementLive.start();
  dialog.addEventListener('close',()=>{if(!dialog.open&&announcementSyncPending){announcementSyncPending=false;checkAnnouncement();}});
  setInterval(checkInstallReminder, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkInstallReminder(); checkAnnouncement(); } });
})();
