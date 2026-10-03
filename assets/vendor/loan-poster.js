(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog poster-dialog';
  dialog.style.maxHeight = '90dvh';
  dialog.style.overflowY = 'auto';
  dialog.setAttribute('aria-label', 'Preview gambar loan');
  dialog.innerHTML = '<div class="dialog-top"><h2>Preview gambar loan</h2><button type="button" class="icon-button" aria-label="Tutup"><i data-lucide="x"></i></button></div><canvas width="1080" height="1350" role="img" aria-label="Poster perbandingan loan"></canvas><form><label>Nama<input name="name" required maxlength="100" autocomplete="name"></label><label>No WhatsApp<input name="phone" required type="tel" autocomplete="tel" placeholder="0123456789"></label><p>Nama dan nombor WhatsApp direkodkan untuk permintaan download ini.</p><p role="status"></p><button class="primary-action" type="submit">Simpan & Download</button></form>';
  document.body.append(dialog);
  dialog.querySelectorAll('input').forEach(input => { input.style.width = '100%'; input.style.margin = '8px 0 16px'; });
  dialog.querySelector('.icon-button').onclick = () => dialog.close();
  const canvas = dialog.querySelector('canvas'), ctx = canvas.getContext('2d');
  const form = dialog.querySelector('form'), status = form.querySelector('[role=status]');
  const saveButton = document.createElement('button');
  saveButton.type = 'button'; saveButton.className = 'primary-action';
  saveButton.textContent = 'Simpan Gambar'; saveButton.hidden = true;
  form.append(saveButton);
  const downloadLink = document.createElement('a');
  downloadLink.className = 'secondary-action'; downloadLink.textContent = 'Download JPG';
  downloadLink.hidden = true; downloadLink.download = 'car-loan-my.jpg';
  form.append(downloadLink);
  let savedFile = null, savedUrl = null;
  const phoneDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function clearSaved() {
    savedFile = null; saveButton.hidden = true; downloadLink.hidden = true;
    if (savedUrl) URL.revokeObjectURL(savedUrl);
    savedUrl = null; downloadLink.removeAttribute('href');
  }
  saveButton.onclick = async () => {
    if (!savedFile) return;
    try {
      if (navigator.canShare?.({files:[savedFile]})) {
        // Invoke sharing directly from this tap, before any asynchronous work.
        await navigator.share({files:[savedFile],title:'Car Loan MY'});
        status.textContent = 'Menu telefon dibuka. Pilih Save Image atau Save to Files jika tersedia.';
      } else { downloadLink.click(); status.textContent = 'Download JPG dimulakan. Semak Downloads pada peranti.'; }
    } catch(error) {
      status.textContent = error.name === 'AbortError' ? 'Simpanan dibatalkan. Tekan Simpan Gambar untuk cuba semula.' : 'Menu simpan tidak tersedia. Gunakan Download JPG.';
    }
  };
  for (const input of [form.elements.name, form.elements.phone]) input.addEventListener('input',clearSaved);
  let snapshot, requestId, busy = false;
  const money = n => 'RM ' + Number(n).toLocaleString('en-MY', {minimumFractionDigits:2, maximumFractionDigits:2});
  function text(value, x, y, size = 30, color = '#263238', max = 960) {
    ctx.fillStyle = color; ctx.font = `600 ${size}px Arial`;
    while (ctx.measureText(String(value)).width > max && size > 14) ctx.font = `600 ${--size}px Arial`;
    ctx.fillText(String(value), x, y);
  }
  let logo;
  function panel(x, y, width, height) {
    ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#061b3430'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
    ctx.beginPath(); ctx.roundRect(x,y,width,height,18); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }
  function drawPoster() {
    const v = snapshot;
    if (!v) return;
    ctx.fillStyle = '#f4f5f6'; ctx.fillRect(0,0,1080,1350);
    // Reusable print layout with restrained diagonal bands and a dotted texture.
    ctx.fillStyle = '#e7eaed';
    for(let i=0;i<5;i++) {ctx.beginPath();ctx.moveTo(0,1100+i*45);ctx.lineTo(1080,430+i*45);ctx.lineTo(1080,450+i*45);ctx.lineTo(0,1120+i*45);ctx.fill();}
    ctx.fillStyle = '#dde1e5';
    for(let x=10;x<210;x+=16) for(let y=10;y<210;y+=16){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
    text('KIRAAN LOAN KENDERAAN',40,50,24,'#101820',760);
    ctx.fillStyle='#e00028';ctx.fillRect(40,66,75,4);
    text(v.brand+' '+v.model,40,137,52,'#071b43',850);
    text(v.variant,40,180,28,'#627086',920);
    if(logo) ctx.drawImage(logo,950,27,90,90);
    const terms=[v.loanPeriod];
    terms.forEach((years,i)=>{
      const x=terms.length===1?180:36+i*522, w=terms.length===1?720:486;
      panel(x,216,w,800);
      ctx.fillStyle='#071b43';ctx.fillRect(x,216,85,70);
      text(String(i+1),x+27,266,42,'#ffffff',60);
      text(years+' TAHUN',x+110,267,36,'#071b43',w-135);
      ctx.fillStyle='#e00028';ctx.fillRect(x+110,283,76,4);
      text(v.model,x+28,336,29,'#071b43',w-56);
      text(v.variant,x+28,375,23,'#627086',w-56);
      const interest=v.loanAfterDeposit*v.interestRate/100*years;
      const monthly=calculateMonthly(v.loanAfterDeposit,v.interestRate,years);
      const rows=[['Harga kereta',money(v.inputPrice)],['Rebate',money(v.rebate)],['Aksesori tambahan',money(v.extras)],['Insurans (NCD '+v.ncd+'%)',v.insuranceOption==='with'?money(v.insurance):'Tidak termasuk'],['Downpayment',money(v.depositAmount)],['Jumlah loan',money(v.loanAfterDeposit)],['Kadar faedah flat',v.interestRate+'%'],['Jumlah faedah',money(interest)],['Jumlah bayaran loan',money(v.loanAfterDeposit+interest)]];
      rows.forEach(([label,value],index)=>{
        const y=423+index*43;
        ctx.strokeStyle='#dce0e4';ctx.beginPath();ctx.moveTo(x+24,y-26);ctx.lineTo(x+w-24,y-26);ctx.stroke();
        text(label,x+26,y,19,'#18232c',w*.53-30);
        ctx.textAlign='right';text(value,x+w-26,y,23,'#071b43',w*.44-26);ctx.textAlign='left';
      });
      text('ANSURAN BULANAN',x+28,852,22,'#18232c',w-56);
      text(money(monthly),x+28,917,50,'#db0027',w-56);
      text('/ bulan',x+28,951,23,'#18232c',w-56);
      if(v.batteryMonthly) text('Bateri berasingan: '+money(v.batteryMonthly)+'/bln',x+28,986,20,'#627086',w-56);
    });
    panel(36,1140,1008,119);
    if(logo)ctx.drawImage(logo,58,1161,76,76);
    text(form.elements.name.value.trim() || 'CAR LOAN MY',160,1190,30,'#071b43',430);
    text('Kiraan loan kenderaan',160,1227,20,'#627086',430);
    text(form.elements.phone.value.trim() || 'WhatsApp',620,1190,31,'#087f68',395);
    text('Hubungi untuk maklumat lanjut',620,1227,19,'#627086',395);
    text('Ansuran lebih rendah tidak bermaksud kos keseluruhan lebih murah.',40,1297,20,'#627086',1000);
    text('Anggaran sahaja. Tertakluk kelulusan bank dan quotation insurer.',40,1331,20,'#627086',1000);
  }
  form.elements.name.addEventListener('input',drawPoster);
  form.elements.phone.addEventListener('input',drawPoster);
  document.querySelector('#downloadImageButton').onclick = async () => {
    const v = calculateValues();
    if (v.errors.length) { alert(v.errors.join('\n')); return; }
    snapshot = JSON.parse(JSON.stringify(v)); requestId = crypto.randomUUID();
    clearSaved();
    form.reset(); status.textContent = '';
    if(!logo){const asset=new Image();asset.src='/icon-192.png';try{await asset.decode();logo=asset;}catch{}}
    drawPoster();
    dialog.showModal();
  };
  form.onsubmit = async event => {
    event.preventDefault(); if(busy) return;
    const phone=form.elements.phone.value.replace(/[\s()-]/g,'').replace(/^\+/, '').replace(/^0/,'60');
    if(!/^601(?:1\d{8}|[02-9]\d{7})$/.test(phone)) {status.textContent='Masukkan nombor telefon Malaysia yang sah.'; return;}
    busy=true; const button=form.querySelector('[type=submit]'); button.disabled=true;
    status.textContent='Menyimpan rekod...';
    try {
      const response=await fetch('/api/app?action=download-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:requestId,name:form.elements.name.value.trim(),phone:'+'+phone,snapshot})});
      const data=await response.json(); if(!response.ok) throw new Error(data.error || 'Simpanan gagal.');
      drawPoster();
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.95));
      if(!blob) throw new Error('Gambar tidak dapat dijana. Cuba semula.');
      clearSaved();
      savedFile = new File([blob],'car-loan-my.jpg',{type:'image/jpeg'});
      savedUrl = URL.createObjectURL(blob); downloadLink.href = savedUrl;
      if (phoneDevice && navigator.canShare?.({files:[savedFile]})) {
        saveButton.hidden = false; downloadLink.hidden = false;
        status.textContent = 'Rekod disimpan. Tekan Simpan Gambar, kemudian pilih Save Image atau Save to Files dalam menu telefon.';
      } else {
        downloadLink.hidden = false; downloadLink.click();
        status.textContent = 'Rekod disimpan. Download JPG dimulakan. Semak folder Downloads.';
      }
    } catch(error) {status.textContent=error.message+' Cuba semula; borang anda dikekalkan.';}
    finally {busy=false;button.disabled=false;}
  };
})();
