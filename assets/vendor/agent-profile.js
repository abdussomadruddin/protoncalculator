(() => {
  const key = 'car-loan-my-poster-contact';
  let storageWarning = '';
  let pending = null;
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
    const contact = { name: name.trim(), phone: normalized };
    if (!pending || pending.name !== contact.name || pending.phone !== contact.phone) pending = { ...contact, id: crypto.randomUUID(), saved: false };
    if (!pending.saved) {
      status.textContent = 'Menyimpan profil...';
      const response = await fetch('/api/app?action=agent-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout?.(15000), body: JSON.stringify({ id: pending.id, ...contact }) });
      const data = await response.json();
      if (!response.ok || data.saved !== true) throw new Error(data.error || 'Rekod profil tidak dapat disimpan. Cuba semula.');
      pending.saved = true;
    }
    localStorage.setItem(key, JSON.stringify(contact));
    dispatchEvent(new Event('agent-profile-change'));
  }
  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('button.primary-action'); if (button.disabled) return; button.disabled = true;
    form.querySelectorAll('input').forEach(input => { input.disabled = true; });
    try { await save(form.elements.name.value, form.elements.phone.value); dialog.close(); }
    catch (error) { status.textContent = pending?.saved ? 'Rekod admin disimpan, tetapi profil tidak dapat disimpan sepenuhnya pada peranti: ' + error.message + ' Kalkulator masih boleh digunakan.' : error.message + ' Cuba semula; borang anda dikekalkan.'; }
    finally { button.disabled = false; form.querySelectorAll('input').forEach(input => { input.disabled = false; }); }
  };
  window.agentProfile = { read, normalize, save, open: () => {
    const profile = read(); form.reset(); form.elements.name.value = profile.name || ''; form.elements.phone.value = profile.phone || ''; status.textContent = storageWarning; dialog.showModal(); window.lucide?.createIcons();
    const initial={name:form.elements.name.value,phone:form.elements.phone.value};
    fetch('/api/app?action=pro-profile').then(async response=>{if(!response.ok)return;const latest=await response.json();if(!dialog.open||form.elements.name.value!==initial.name||form.elements.phone.value!==initial.phone||form.elements.name.disabled)return;if(latest.name&&normalize(latest.phone)){form.elements.name.value=latest.name;form.elements.phone.value=latest.phone;try{localStorage.setItem(key,JSON.stringify({name:latest.name,phone:latest.phone}));}catch{status.textContent='Storan peranti tidak tersedia.';}}}).catch(()=>{});
  } };
})();
