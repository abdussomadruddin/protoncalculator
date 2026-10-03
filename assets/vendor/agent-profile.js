(() => {
  const key = 'car-loan-my-poster-contact';
  let logo = null;
  let storageWarning = '';
  const normalize = value => {
    const phone = String(value).replace(/[\s()-]/g, '').replace(/^\+/, '').replace(/^0/, '60');
    return /^601(?:1\d{8}|[02-9]\d{7})$/.test(phone) ? '+' + phone : null;
  };
  function read() { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { storageWarning = 'Storan peranti tidak tersedia. Kalkulator masih boleh digunakan.'; return {}; } }
  function db() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('car-loan-my-profile', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('profile');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
  }
  async function storedLogo(value, write = false) {
    const database = await db();
    try { return await new Promise((resolve, reject) => {
      const transaction = database.transaction('profile', write ? 'readwrite' : 'readonly');
      const request = write ? transaction.objectStore('profile').put(value, 'logo') : transaction.objectStore('profile').get('logo');
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error);
    }); } finally { database.close(); }
  }
  const ready = storedLogo().then(value => { logo = value || null; }).catch(() => { storageWarning = 'Logo tidak dapat dibaca daripada storan peranti. Kalkulator masih boleh digunakan.'; });
  const dialog = document.createElement('dialog'); dialog.className = 'app-dialog profile-dialog';
  dialog.innerHTML = '<div class="dialog-top"><h2>Profil Ejen</h2><button type="button" class="icon-button" aria-label="Tutup"><i data-lucide="x"></i></button></div><form><label>Nama<input name="name" required maxlength="100" autocomplete="name"></label><label>No WhatsApp<input name="phone" required type="tel" autocomplete="tel"></label><label>Logo syarikat (optional)<input name="logo" type="file" accept="image/png,image/jpeg"></label><img class="company-preview" alt="Logo syarikat" hidden><button type="button" class="secondary-action remove-logo">Buang logo</button><p role="status"></p><button class="primary-action">Simpan profil</button></form>';
  document.body.append(dialog);
  const form = dialog.querySelector('form'), status = form.querySelector('[role=status]'), preview = form.querySelector('img');
  let draftLogo, processing = false;
  function showLogo() { preview.hidden = !draftLogo; if (draftLogo) preview.src = draftLogo; }
  dialog.querySelector('.icon-button').onclick = () => dialog.close();
  form.querySelector('.remove-logo').onclick = () => { draftLogo = null; form.elements.logo.value = ''; showLogo(); };
  form.elements.logo.onchange = async () => {
    const file = form.elements.logo.files[0]; if (!file) return;
    if (!['image/png','image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) { status.textContent = 'Pilih PNG/JPG maksimum 2 MB.'; form.elements.logo.value = ''; return; }
    processing = true; form.querySelector('[type=submit],button.primary-action').disabled = true;
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      const canvas = document.createElement('canvas'), scale = Math.min(1, 320 / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      draftLogo = canvas.toDataURL('image/png'); showLogo(); status.textContent = '';
    } catch { status.textContent = 'Logo tidak dapat dibaca.'; }
    finally { URL.revokeObjectURL(url); processing = false; form.querySelector('button.primary-action').disabled = false; }
  };
  async function save(name, phone) {
    const normalized = normalize(phone);
    if (!name.trim() || name.trim().length > 100 || /[\x00-\x1f]/.test(name) || !normalized) throw new Error('Nama atau WhatsApp tidak sah.');
    localStorage.setItem(key, JSON.stringify({ name: name.trim(), phone: normalized }));
    dispatchEvent(new Event('agent-profile-change'));
  }
  form.onsubmit = async event => {
    event.preventDefault(); if (processing) return;
    const button = form.querySelector('button.primary-action'); button.disabled = true;
    try { await save(form.elements.name.value, form.elements.phone.value); await storedLogo(draftLogo, true); logo = draftLogo; dispatchEvent(new Event('agent-profile-change')); dialog.close(); }
    catch (error) { status.textContent = 'Profil tidak dapat disimpan sepenuhnya pada peranti: ' + error.message + ' Kalkulator masih boleh digunakan.'; }
    finally { button.disabled = false; }
  };
  window.agentProfile = { read, normalize, save, ready, getLogo: () => logo, open: async () => {
    await ready; const profile = read(); form.reset(); form.elements.name.value = profile.name || ''; form.elements.phone.value = profile.phone || ''; draftLogo = logo; showLogo(); status.textContent = storageWarning; dialog.showModal(); window.lucide?.createIcons();
  } };
})();
