(() => {
  const $ = selector => document.querySelector(selector);
  const status = message => { $('#adminStatus').textContent = message; };
  const icons = () => window.lucide?.createIcons();
  let busy = false;
  let pendingBroadcast = null;
  try { pendingBroadcast = localStorage.getItem('car-loan-admin-pending-push'); } catch {}
  function rememberBroadcast(id) {
    pendingBroadcast = id;
    try { if (id) localStorage.setItem('car-loan-admin-pending-push', id); else localStorage.removeItem('car-loan-admin-pending-push'); } catch {}
  }
  async function sendAll(id, initial) {
    rememberBroadcast(id);
    let result = initial;
    try {
      for (let batch = 0; batch < 510; batch++) {
        if (!result?.complete) result = await api('broadcast', { id });
        status('Popup aktif. Provider menerima: ' + result.sent + '. Gagal: ' + result.failed + '. Sedang diproses: ' + result.processing + '.');
        if (result.complete) {
          if (!result.processing) rememberBroadcast(null);
          status((result.processing ? 'Masih diproses. Sambung selepas 5 minit jika penghantaran terganggu. ' : 'Popup diterbitkan dan penghantaran push selesai. ') + 'Provider menerima: ' + result.sent + '. Gagal: ' + result.failed + '. Ini bukan pengesahan notification telah dibaca.');
          return;
        }
        result = null;
      }
      status('Popup aktif. Penghantaran belum selesai; tekan Sambung push pada rekod ini.');
    } catch (error) {
      status('Popup telah diterbitkan. Push terganggu; tekan Sambung push pada rekod ini. ' + error.message);
    }
  }
  async function api(action, body) {
    const response = await fetch('/api/app?action=' + action, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.error || 'Sambungan terganggu. Cuba lagi.'); error.status = response.status; throw error; }
    return data;
  }
  async function task(work) {
    if (busy) return; busy = true;
    const controls = [...document.querySelectorAll('button')]; controls.forEach(button => { button.disabled = true; });
    try { await work(); } catch (error) { status(error.message); if (error.status === 401) showLogin(); }
    finally { busy = false; document.querySelectorAll('button').forEach(button => { button.disabled = button.dataset.unavailable === 'true'; }); }
  }
  function showLogin() { $('#adminSessionLoading').hidden = true; $('#loginSection').hidden = false; $('#adminDashboard').hidden = true; $('#logoutButton').hidden = true; }
  function showChecking() {
    $('#loginSection').hidden = true; $('#adminDashboard').hidden = true; $('#logoutButton').hidden = true;
    $('#adminSessionLoading').hidden = false; $('#adminSessionRetry').hidden = true;
    $('.admin-session-spinner').hidden = false;
    $('#adminSessionMessage').textContent = 'Menyemak sesi...'; status('');
  }
  async function loadStats() {
    $('#statsStatus').textContent = 'Memuatkan statistik...';
    try {
      const data = await api('stats');
      for (const period of data.traffic) {
        if (![1, 7, 30].includes(period.days)) continue;
        $('#visits' + period.days).textContent = Number(period.visits).toLocaleString('ms-MY');
        $('#devices' + period.days).textContent = Number(period.devices).toLocaleString('ms-MY') + ' peranti unik';
      }
      $('#notificationCount').textContent = Number(data.notifications).toLocaleString('ms-MY');
      $('#phoneAppCount').textContent = Number(data.phoneApps).toLocaleString('ms-MY');
      $('#phonePushCount').textContent = Number(data.phoneAppsWithNotifications).toLocaleString('ms-MY');
      $('#statsStatus').textContent = data.startedAt ? 'Data sejak ' + new Date(data.startedAt).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' }) : 'Belum ada trafik direkodkan.';
    } catch (error) {
      for (const id of ['visits1', 'visits7', 'visits30', 'notificationCount', 'phoneAppCount', 'phonePushCount']) $('#' + id).textContent = '—';
      for (const days of [1, 7, 30]) $('#devices' + days).textContent = '';
      $('#statsStatus').textContent = 'Statistik tidak tersedia. ' + error.message;
      if (error.status === 401) showLogin();
    }
  }
  function preview(title, message, link, label) {
    $('#adminDialogTitle').textContent = title; $('#adminDialogMessage').textContent = message;
    const a = $('#previewLink'); a.hidden = true; a.removeAttribute('href');
    if (link) { const url = new URL(link); if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Gunakan link HTTPS yang sah.'); a.href = url.href; a.textContent = label || 'Buka link'; a.hidden = false; }
    $('#confirmSend').hidden = true; $('#adminDialog').showModal(); icons();
  }
  async function load() {
    const data = await api('admin');
    $('#adminSessionLoading').hidden = true;
    $('#loginSection').hidden = true; $('#adminDashboard').hidden = false; $('#logoutButton').hidden = false;
    $('#adminIdentity').textContent = data.email;
    $('#publishButton').disabled = !data.pushReady; $('#publishButton').dataset.unavailable = String(!data.pushReady);
    const list = $('#announcementList'); list.replaceChildren();
    if (!data.announcements.length) { const p = document.createElement('p'); p.className = 'admin-subtitle'; p.textContent = 'Belum ada hebahan.'; list.append(p); }
    for (const a of data.announcements) {
      const row = document.createElement('article'); row.className = 'announcement-row';
      const badge = document.createElement('span'); badge.className = 'announcement-badge' + (a.active ? '' : ' inactive'); badge.textContent = a.active ? 'Popup aktif' : 'Tidak aktif';
      const heading = document.createElement('h4'); heading.textContent = a.title;
      const text = document.createElement('p'); text.textContent = a.message;
      const date = document.createElement('small'); date.textContent = new Date(a.created_at).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' });
      const controls = document.createElement('div'); controls.className = 'announcement-controls';
      function button(label, iconName, handler) { const b = document.createElement('button'); b.type = 'button'; b.className = 'secondary-action'; const icon = document.createElement('i'); icon.dataset.lucide = iconName; b.append(icon, document.createTextNode(label)); b.onclick = handler; controls.append(b); return b; }
      button('Preview', 'eye', () => preview(a.title, a.message, a.link_url, a.link_label));
      if (a.active) {
        button('Tutup popup', 'eye-off', () => task(async () => { await api('deactivate', { id: a.id }); await load(); status('Popup hebahan telah dinyahaktifkan.'); }));
        const send = button(pendingBroadcast === a.id ? 'Sambung push' : 'Status / sambung push', 'send', () => {
          preview('Sambung notification?', a.title + '\n\nSambung ke peranti yang belum diproses. Peranti yang sudah diterima provider tidak dihantar semula.', null);
          $('#confirmSend').hidden = false;
          $('#confirmSend').onclick = () => { $('#adminDialog').close(); task(async () => {
            await sendAll(a.id); await load();
          }); };
        });
        send.disabled = !data.pushReady; send.dataset.unavailable = String(!data.pushReady);
      }
      row.append(badge, heading, text, date, controls); list.append(row);
    }
    icons();
    await loadStats();
  }
  $('#loginForm').onsubmit = event => { event.preventDefault(); task(async () => {
    try { await api('login', { email: $('#adminEmail').value.trim(), password: $('#adminPassword').value }); await load(); status('Login berjaya.'); }
    finally { $('#adminPassword').value = ''; }
  }); };
  $('#togglePassword').onclick = () => {
    const visible = $('#adminPassword').type === 'password';
    $('#adminPassword').type = visible ? 'text' : 'password';
    $('#togglePassword').setAttribute('aria-pressed', String(visible));
    $('#togglePassword').title = visible ? 'Sembunyikan password' : 'Tunjuk password';
    $('#togglePassword').setAttribute('aria-label', $('#togglePassword').title);
    $('#togglePassword').innerHTML = '<i data-lucide="' + (visible ? 'eye-off' : 'eye') + '"></i>'; icons();
  };
  $('#announcementForm').onsubmit = event => { event.preventDefault(); task(async () => {
    status('Menerbitkan popup dan menghantar push...');
    const published = await api('publish', { title: $('#announcementTitle').value, message: $('#announcementMessage').value, linkUrl: $('#announcementLink').value.trim(), linkLabel: $('#announcementLabel').value });
    rememberBroadcast(published.announcement.id);
    $('#announcementForm').reset(); await load();
    if (published.pushError) status(published.pushError);
    else await sendAll(published.announcement.id, published.push);
    await load();
  }); };
  $('#previewButton').onclick = () => { try { preview($('#announcementTitle').value || 'Tajuk hebahan', $('#announcementMessage').value || 'Mesej hebahan', $('#announcementLink').value.trim(), $('#announcementLabel').value); } catch (error) { status(error.message); } };
  $('#adminDialogClose').onclick = () => $('#adminDialog').close();
  $('#logoutButton').onclick = () => task(async () => { await api('logout', {}); showLogin(); status('Anda telah logout.'); });
  icons();
  async function initialise() {
    showChecking();
    try {
      const params = new URLSearchParams(location.hash.slice(1));
      if (location.hash) history.replaceState(null, '', location.pathname);
      if (params.get('error_description')) throw new Error(params.get('error_description'));
      const config = await api('config');
      if (!config.ready) { showLogin(); status('Backend admin belum dikonfigurasi. Login dan hebahan belum tersedia.'); $('#loginForm button[type=submit]').disabled = true; $('#loginForm button[type=submit]').dataset.unavailable = 'true'; return; }
      $('#loginForm button[type=submit]').dataset.unavailable = 'false';
      try { await load(); } catch (error) { if (error.status !== 401) throw error; showLogin(); }
    } catch (error) {
      $('#adminSessionMessage').textContent = error.message;
      $('.admin-session-spinner').hidden = true; $('#adminSessionRetry').hidden = false;
    }
  }
  $('#adminSessionRetry').onclick = () => task(initialise);
  task(initialise);
})();
