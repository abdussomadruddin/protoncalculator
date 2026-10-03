(() => {
  const key = 'car-loan-my-poster-contact';
  let storageWarning = '';
  const normalize = value => {
    const phone = String(value).replace(/[\s()-]/g, '').replace(/^\+/, '').replace(/^0/, '60');
    return /^601(?:1\d{8}|[02-9]\d{7})$/.test(phone) ? '+' + phone : null;
  };
  function read() { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { storageWarning = 'Storan peranti tidak tersedia. Kalkulator masih boleh digunakan.'; return {}; } }
  const dialog = document.createElement('dialog'); dialog.className = 'app-dialog profile-dialog';
  dialog.innerHTML = '<div class="dialog-top"><h2>Profil Ejen</h2><button type="button" class="icon-button" aria-label="Tutup"><i data-lucide="x"></i></button></div><form><label>Nama<input name="name" required maxlength="100" autocomplete="name"></label><label>No WhatsApp<input name="phone" required type="tel" autocomplete="tel"></label><p role="status"></p><button class="primary-action">Simpan profil</button></form>';
  document.body.append(dialog);
  const form = dialog.querySelector('form'), status = form.querySelector('[role=status]');
  dialog.querySelector('.icon-button').onclick = () => dialog.close();
  async function save(name, phone) {
    const normalized = normalize(phone);
    if (!name.trim() || name.trim().length > 100 || /[\x00-\x1f]/.test(name) || !normalized) throw new Error('Nama atau WhatsApp tidak sah.');
    localStorage.setItem(key, JSON.stringify({ name: name.trim(), phone: normalized }));
    dispatchEvent(new Event('agent-profile-change'));
  }
  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('button.primary-action'); button.disabled = true;
    try { await save(form.elements.name.value, form.elements.phone.value); dialog.close(); }
    catch (error) { status.textContent = 'Profil tidak dapat disimpan sepenuhnya pada peranti: ' + error.message + ' Kalkulator masih boleh digunakan.'; }
    finally { button.disabled = false; }
  };
  window.agentProfile = { read, normalize, save, open: () => {
    const profile = read(); form.reset(); form.elements.name.value = profile.name || ''; form.elements.phone.value = profile.phone || ''; status.textContent = storageWarning; dialog.showModal(); window.lucide?.createIcons();
  } };
})();
