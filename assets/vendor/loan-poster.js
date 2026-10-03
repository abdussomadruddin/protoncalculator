(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog poster-dialog';
  dialog.style.maxHeight = '90dvh';
  dialog.style.overflowY = 'auto';
  dialog.setAttribute('aria-label', 'Preview gambar loan');
  dialog.innerHTML = '<div class="dialog-top"><h2>Preview gambar loan</h2><button type="button" class="icon-button" aria-label="Tutup"><i data-lucide="x"></i></button></div><canvas width="1080" height="1350" role="img" aria-label="Poster loan"></canvas><form><label>Nama<input name="name" required maxlength="100" autocomplete="name"></label><label>No WhatsApp<input name="phone" required type="tel" autocomplete="tel" placeholder="0123456789"></label><p role="status"></p><button class="primary-action" type="submit">Simpan & Download</button></form>';
  document.body.append(dialog);
  dialog.querySelectorAll('input').forEach(input => { input.style.width = '100%'; input.style.margin = '8px 0 16px'; });
  dialog.querySelector('.icon-button').onclick = () => { if (!busy) dialog.close(); };
  dialog.addEventListener('cancel',event => { if(busy) event.preventDefault(); });
  const canvas = dialog.querySelector('canvas'), ctx = canvas.getContext('2d');
  const form = dialog.querySelector('form'), status = form.querySelector('[role=status]');
  const contactKey = 'car-loan-my-poster-contact';
  const editContact = document.createElement('button');
  editContact.type = 'button'; editContact.className = 'secondary-action';
  editContact.textContent = 'Edit nama & WhatsApp';
  form.prepend(editContact);
  function contactMode(saved) {
    form.querySelectorAll('label').forEach(label => { label.hidden = saved; });
    editContact.hidden = !saved;
  }
  function loadContact() {
    try {
      const contact = JSON.parse(localStorage.getItem(contactKey));
      if (typeof contact?.name === 'string' && contact.name.trim() && contact.name.length <= 100 && /^\+601(?:1\d{8}|[02-9]\d{7})$/.test(contact.phone)) {
        form.elements.name.value = contact.name; form.elements.phone.value = contact.phone;
        contactMode(true); return;
      }
    } catch {}
    contactMode(false);
  }
  editContact.onclick = () => {
    if (busy) return;
    schedule(); contactMode(false);
    status.textContent = ''; form.elements.name.focus();
  };
  const saveButton = form.querySelector('[type=submit]');
  const downloadLink = document.createElement('a');
  downloadLink.className = 'secondary-action'; downloadLink.textContent = 'Download JPG';
  downloadLink.hidden = true; downloadLink.download = 'car-loan-my.jpg';
  let savedFile = null, savedUrl = null, recorded = false, generation = 0, timer, deviceWarning = '';
  const phoneDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function clearSaved() {
    savedFile = null; recorded = false; saveButton.disabled = true; saveButton.textContent = 'Simpan & Download';
    if (savedUrl) URL.revokeObjectURL(savedUrl);
    savedUrl = null; downloadLink.removeAttribute('href');
  }
  async function saveImage() {
    if (!savedFile) return;
    try {
      if (phoneDevice && navigator.canShare?.({files:[savedFile]})) {
        // Invoke sharing directly from this tap, before any asynchronous work.
        await navigator.share({files:[savedFile],title:'Car Loan MY'});
        status.textContent = 'Menu telefon dibuka. Pilih Save Image atau Save to Files jika tersedia.';
      } else { downloadLink.click(); status.textContent = 'Download JPG dimulakan. Semak Downloads pada peranti.'; }
    } catch(error) {
      status.textContent = error.name === 'AbortError' ? '' : 'Tekan Simpan Gambar untuk cuba semula.';
    }
    if(deviceWarning) status.textContent = deviceWarning + ' ' + status.textContent;
  }
  async function generate(version) {
    drawPoster();
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',.95));
    if (version !== generation || !dialog.open) return;
    if (!blob) { status.textContent = 'Gambar tidak dapat dijana. Cuba semula.'; return; }
    savedFile = new File([blob],'car-loan-my.jpg',{type:'image/jpeg'});
    savedUrl = URL.createObjectURL(blob); downloadLink.href = savedUrl;
    saveButton.disabled = !validContact();
  }
  function validContact() { return form.elements.name.value.trim().length > 0 && form.elements.name.value.trim().length <= 100 && !/[\x00-\x1f]/.test(form.elements.name.value) && !!window.agentProfile.normalize(form.elements.phone.value); }
  function schedule() { clearTimeout(timer); generation++; clearSaved(); requestId = crypto.randomUUID(); const version = generation; timer = setTimeout(() => generate(version),250); }
  for (const input of [form.elements.name, form.elements.phone]) input.addEventListener('input',schedule);
  let snapshot, requestId, busy = false;
  const money = n => 'RM ' + Number(n).toLocaleString('en-MY', {minimumFractionDigits:2, maximumFractionDigits:2});
  function text(value, x, y, size = 30, color = '#263238', max = 960) {
    ctx.fillStyle = color; ctx.font = `600 ${size}px Arial`;
    while (ctx.measureText(String(value)).width > max && size > 14) ctx.font = `600 ${--size}px Arial`;
    ctx.fillText(String(value), x, y, max);
  }
  function panel(x, y, width, height) {
    ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#061b3430'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
    ctx.beginPath(); ctx.roundRect(x,y,width,height,18); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }
  function drawPoster() {
    const cars = snapshot?.cars || (snapshot ? [snapshot] : []), v = cars[0], dual = cars.length === 2;
    if (!v) return;
    ctx.fillStyle = '#f4f5f6'; ctx.fillRect(0,0,1080,1350);
    // Reusable print layout with restrained diagonal bands and a dotted texture.
    ctx.fillStyle = '#e7eaed';
    for(let i=0;i<5;i++) {ctx.beginPath();ctx.moveTo(0,1100+i*45);ctx.lineTo(1080,430+i*45);ctx.lineTo(1080,450+i*45);ctx.lineTo(0,1120+i*45);ctx.fill();}
    ctx.fillStyle = '#dde1e5';
    for(let x=10;x<210;x+=16) for(let y=10;y<210;y+=16){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
    text('KIRAAN LOAN KENDERAAN',40,50,24,'#101820',430);
    ctx.textAlign='right';text('https://carloanmalaysia.vercel.app',1040,50,24,'#087f68',550);ctx.textAlign='left';
    ctx.fillStyle='#e00028';ctx.fillRect(40,66,75,4);
    text(dual ? 'BANDING KERETA' : v.brand+' '+v.model,40,137,52,'#071b43',850);
    text(dual ? 'Tetapan loan berasingan' : v.variant,40,180,28,'#627086',920);
    cars.forEach((v,i)=>{
      const years = v.loanPeriod;
      const x=dual ? 36+i*516 : 36, w=dual ? 492 : 1008;
      panel(x,216,w,870);
      ctx.fillStyle='#071b43';ctx.fillRect(x,216,85,70);
      text(String(i+1),x+27,266,42,'#ffffff',60);
      text(years+' TAHUN',x+110,267,36,'#071b43',w-135);
      ctx.fillStyle='#e00028';ctx.fillRect(x+110,283,76,4);
      const title = (dual ? v.brand+' ' : '')+v.model;
      if(dual) {
        ctx.font='600 28px Arial'; let line='',lines=[];
        for(const word of title.split(' ')) { if(line && ctx.measureText(line+' '+word).width>w-56) { lines.push(line);line=word; } else line += (line?' ':'')+word; }
        lines.push(line); lines.slice(0,2).forEach((line,n)=>text(line,x+28,326+n*31,28,'#071b43',w-56));
        if(lines.length>2) text(lines.slice(1).join(' '),x+28,357,24,'#071b43',w-56);
      } else text(title,x+28,336,38,'#071b43',w-56);
      text(v.variant,x+28,382,31,'#627086',w-56);
      const interest=v.loanAfterDeposit*v.interestRate/100*years;
      const monthly=calculateMonthly(v.loanAfterDeposit,v.interestRate,years);
      const rows=[['Harga kereta',money(v.inputPrice)],['Rebate',money(v.rebate)],['Aksesori tambahan',money(v.extras)],['Insurans (NCD '+v.ncd+'%)',v.insuranceOption==='with'?money(v.insurance):'Tidak termasuk'],['Downpayment',money(v.depositAmount)],['Jumlah loan',money(v.loanAfterDeposit)],['Kadar faedah flat',v.interestRate+'%'],['Jumlah faedah',money(interest)],['Jumlah bayaran loan',money(v.loanAfterDeposit+interest)]];
      rows.forEach(([label,value],index)=>{
        const y=dual ? 425+index*54 : 441+index*52;
        ctx.strokeStyle='#dce0e4';ctx.beginPath();ctx.moveTo(x+24,y-26);ctx.lineTo(x+w-24,y-26);ctx.stroke();
        text(label,x+26,y,dual ? 21 : 30,'#18232c',dual ? w-52 : w*.53-30);
        ctx.textAlign='right';text(value,x+w-26,dual ? y+25 : y,dual ? 26 : 34,'#071b43',dual ? w-52 : w*.44-26);ctx.textAlign='left';
      });
      text('ANSURAN BULANAN',x+28,943,30,'#18232c',w-56);
      text(money(monthly),x+28,1015,72,'#db0027',w-56);
      text('/ bulan',x+28,1055,30,'#18232c',w-56);
      if(v.batteryMonthly) text('Bateri berasingan: '+money(v.batteryMonthly)+'/bln',x+28,1080,dual ? 19 : 25,'#627086',w-56);
    });
    panel(36,1140,1008,119);
    text(form.elements.name.value.trim() || 'CAR LOAN MY',58,1190,30,'#071b43',450);
    text('Kiraan loan kenderaan',58,1227,20,'#627086',450);
    text(form.elements.phone.value.trim() || 'WhatsApp',550,1190,31,'#087f68',310);
    text('Hubungi untuk maklumat lanjut',550,1227,19,'#627086',310);
    const phone = window.agentProfile.normalize(form.elements.phone.value);
    if (phone) {
      const qr = qrcode(0,'M'); qr.addData('https://wa.me/'+phone.slice(1)); qr.make();
      const count = qr.getModuleCount(), unit = 100/(count+8);
      ctx.fillStyle = '#fff'; ctx.fillRect(910,1150,100,100); ctx.fillStyle = '#071b43';
      for(let row=0;row<count;row++) for(let col=0;col<count;col++) if(qr.isDark(row,col)) ctx.fillRect(910+(col+4)*unit,1150+(row+4)*unit,unit+.1,unit+.1);
    }
    text('Ansuran lebih rendah tidak bermaksud kos keseluruhan lebih murah.',40,1297,20,'#627086',1000);
    text('Anggaran sahaja. Tertakluk kelulusan bank dan quotation insurer.',40,1331,20,'#627086',1000);
  }
  form.elements.name.addEventListener('input',drawPoster);
  form.elements.phone.addEventListener('input',drawPoster);
  const snapshotFields = ['brand','model','variant','loanPeriod','inputPrice','rebate','extras','insurance','insuranceOption','depositOption','depositAmount','loanAfterDeposit','interestRate','ncd','baseMonthly','selectedMonthly','batteryMonthly'];
  async function open(cars) {
    if(cars.some(v => v.errors?.length)) { alert(cars.flatMap(v => v.errors).join('\n')); return; }
    const clean = cars.map(v => Object.fromEntries(snapshotFields.map(k => [k,v[k]])));
    snapshot = clean.length === 1 ? clean[0] : {version:2,cars:clean}; requestId = crypto.randomUUID();
    clearSaved();
    form.reset(); status.textContent = ''; deviceWarning = '';
    loadContact();
    drawPoster();
    dialog.showModal();
    generation++; await generate(generation);
  }
  window.loanPoster = {open};
  document.querySelector('#downloadImageButton').onclick = () => open([calculateValues()]);
  dialog.addEventListener('close',() => { clearTimeout(timer); generation++; clearSaved(); });
  addEventListener('agent-profile-change',() => { if(dialog.open && !busy) { loadContact(); schedule(); } });
  form.onsubmit = async event => {
    event.preventDefault(); if(busy) return;
    if (!savedFile || !validContact()) return;
    if (recorded) {
      busy = true; saveButton.disabled = true;
      try { await saveImage(); } finally { busy = false; saveButton.disabled = false; }
      return;
    }
    const phone=form.elements.phone.value.replace(/[\s()-]/g,'').replace(/^\+/, '').replace(/^0/,'60');
    if(!/^601(?:1\d{8}|[02-9]\d{7})$/.test(phone)) {status.textContent='Masukkan nombor telefon Malaysia yang sah.'; return;}
    busy=true; const button=form.querySelector('[type=submit]'); button.disabled=true;
    form.querySelectorAll('input').forEach(input => { input.disabled = true; }); editContact.disabled = true;
    status.textContent='Menyimpan rekod...';
    try {
      const response=await fetch('/api/app?action=download-request',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout?.(15000),body:JSON.stringify({id:requestId,name:form.elements.name.value.trim(),phone:'+'+phone,snapshot})});
      const data=await response.json(); if(!response.ok || data.saved !== true) throw new Error(data.error || 'Simpanan gagal.');
      recorded = true;
      try {
        localStorage.setItem(contactKey,JSON.stringify({name:form.elements.name.value.trim(),phone:'+'+phone}));
        contactMode(true);
      } catch { deviceWarning = 'Browser tidak membenarkan profil disimpan pada peranti ini. Kalkulator masih boleh digunakan.'; }
      saveButton.textContent = 'Simpan Gambar';
      await saveImage();
    } catch(error) {status.textContent=error.message+' Cuba semula; borang anda dikekalkan.';}
    finally {busy=false;button.disabled=!savedFile || !validContact(); form.querySelectorAll('input').forEach(input => { input.disabled = false; }); editContact.disabled = false;}
  };
})();
