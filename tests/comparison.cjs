const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const jsQR = require('jsqr');
const root = path.resolve(__dirname,'..');
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'});
    await context.addInitScript(() => {
      window.posterTextCalls=[];window.posterImageCalls=0;
      const originalText=CanvasRenderingContext2D.prototype.fillText,originalImage=CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.fillText=function(value,x,y,...args){window.posterTextCalls.push({value:String(value),x,y,align:this.textAlign});return originalText.call(this,value,x,y,...args);};
      CanvasRenderingContext2D.prototype.drawImage=function(...args){window.posterImageCalls++;return originalImage.apply(this,args);};
      if(!localStorage.getItem('car-loan-my-poster-contact')) localStorage.setItem('car-loan-my-poster-contact',JSON.stringify({name:'Legacy Agent',phone:'+60123456789'}));
      navigator.canShare = () => true;
      navigator.share = async data => { window.shareCalls = (window.shareCalls || 0)+1; window.sharedFile = data.files[0].name; window.sharedBlob = data.files[0]; if(window.shareCalls === 1) throw new DOMException('New tap required','NotAllowedError'); if(window.cancelShare) throw new DOMException('Cancelled','AbortError'); };
    });
    const page = await context.newPage(); let saves = [], profiles = [], fail = true, failProfile = false;
    const errors = []; page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://comparison.test/**',async route => {
      const url = new URL(route.request().url());
      if(url.pathname === '/api/app') {
        if(url.searchParams.get('action') === 'pro-session') return route.fulfill({json:{email:'agent@test.example',active:true}});
        if(url.searchParams.get('action') === 'download-request') { saves.push(route.request().postDataJSON()); return route.fulfill({status:fail?503:200,json:fail?{error:'Test database failure'}:{saved:true}}); }
        if(url.searchParams.get('action') === 'agent-profile') { profiles.push(route.request().postDataJSON()); return route.fulfill({status:failProfile?503:200,json:failProfile?{error:'Test profile failure'}:{saved:true}}); }
        return route.fulfill({json:{ready:false}});
      }
      const file = path.join(root,url.pathname === '/'?'index.html':url.pathname.slice(1));
      return route.fulfill({body:fs.readFileSync(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'}[path.extname(file)] || 'text/plain'});
    });
    await page.goto('https://comparison.test/');
    if(await page.locator('#appDialog').isVisible()) await page.locator('#dialogClose').click();
    await page.getByRole('tab',{name:'Comparison PRO'}).click();
    const forms = page.locator('.comparison-car');
    await forms.nth(1).locator('[name=brand]').selectOption('Perodua');
    await forms.nth(1).locator('[name=model]').selectOption('QV-E');
    if(await forms.nth(1).locator('[name=confirmed]').isVisible()) await forms.nth(1).locator('[name=confirmed]').check();
    const modelA = await forms.nth(0).locator('[name=model]').inputValue();
    assert.notEqual(await forms.nth(1).locator('[name=model]').inputValue(),modelA);
    for(const term of [1,2,3,4,5,6,7,8,9]) for(const mode of ['full','ten','custom']) for(const insurance of ['with','exclude']) {
      await forms.nth(1).locator('[name=loanPeriod]').selectOption(String(term));
      await forms.nth(1).locator('[name=depositOption]').selectOption(mode);
      if(mode==='custom') await forms.nth(1).locator('[name=customDeposit]').fill('1500');
      await forms.nth(1).locator('[name=insuranceOption]').selectOption(insurance);
      if(insurance==='with') await forms.nth(1).locator('[name=ncd]').fill('55');
      const numbers = await forms.nth(1).evaluate(form => {
        const e=form.elements, v={insuranceOption:e.insuranceOption.value,depositOption:e.depositOption.value};
        for(const k of ['inputPrice','rebate','extras','ncd','interestRate','customDeposit','loanPeriod'])v[k]=Number(e[k].value);
        return calculateCarSnapshot(v);
      });
      const insuranceValue = insurance === 'with' ? numbers.inputPrice*.033*.45 : 0;
      assert.ok(Math.abs(numbers.insurance-insuranceValue)<.001);
      assert.ok(Math.abs(numbers.selectedMonthly-calculateMonthly(numbers.loanAfterDeposit,numbers.interestRate,term))<.001);
      assert.equal(await forms.nth(0).locator('[name=model]').inputValue(),modelA);
    }
    await forms.nth(1).locator('[name=rebate]').fill('9999999');
    assert.equal(await page.locator('.comparison-poster').isDisabled(),true);
    await forms.nth(1).locator('[name=rebate]').fill('0');
    await page.locator('.comparison-poster').click();
    const poster = page.locator('.poster-dialog');
    await page.waitForFunction(()=>!document.querySelector('.poster-dialog button[type=submit]').disabled);
    assert.equal(await poster.getByLabel('Nama',{exact:true}).inputValue(),'Legacy Agent');
    assert.equal(await page.evaluate(()=>window.posterImageCalls),0,'Poster must not draw app/company icons');
    assert.ok(await page.evaluate(()=>window.posterTextCalls.some(text=>text.value==='https://carloanmalaysia.vercel.app' && text.x===1040 && text.y===50 && text.align==='right')),'Website at top right');
    const pixels = await poster.locator('canvas').evaluate(canvas => {const ctx=canvas.getContext('2d');return Array.from(ctx.getImageData(900,1140,120,120).data);});
    const qr = jsQR(new Uint8ClampedArray(pixels),120,120); assert.equal(qr.data,'https://wa.me/60123456789');
    await poster.locator('canvas').screenshot({path:'/tmp/car-loan-comparison-poster.png'});
    fs.writeFileSync('/tmp/car-loan-comparison-full.jpg',Buffer.from(await poster.locator('canvas').evaluate(canvas=>canvas.toDataURL('image/jpeg',.95).split(',')[1]),'base64'));
    await poster.locator('[type=submit]').click();
    await poster.getByText(/Test database failure/).waitFor();
    assert.equal(await page.evaluate(()=>window.shareCalls||0),0);
    fail=false; await poster.locator('[type=submit]').click();
    await poster.getByText('Tekan Simpan Gambar untuk cuba semula.').waitFor();
    const count=saves.length; await poster.locator('[type=submit]').click();
    assert.equal(saves.length,count); assert.equal(saves[0].id,saves[1].id);
    assert.equal(saves[1].snapshot.cars.length,2); assert.ok(saves[1].snapshot.cars[1].batteryMonthly>0);
    assert.equal(await page.evaluate(()=>window.sharedFile),'car-loan-my.jpg');
    await page.evaluate(()=>{window.cancelShare=true;}); await poster.locator('[type=submit]').click(); assert.equal(saves.length,count);
    await poster.getByRole('button',{name:'Edit nama & WhatsApp'}).click();
    await page.evaluate(()=>{const native=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback,...args){const delay=window.blobDelay||0;native.call(this,blob=>setTimeout(()=>callback(blob),delay),...args);};window.blobDelay=600;});
    await poster.getByLabel('Nama',{exact:true}).fill('Old Generation');
    await page.waitForTimeout(300);
    await page.evaluate(()=>{window.blobDelay=0;});
    await poster.getByLabel('Nama',{exact:true}).fill('Latest Agent');
    await poster.getByLabel('No WhatsApp',{exact:true}).fill('0198765432');
    await page.waitForFunction(()=>!document.querySelector('.poster-dialog button[type=submit]').disabled);
    await page.waitForTimeout(700);
    await page.evaluate(()=>{window.cancelShare=false;});
    await poster.locator('[type=submit]').dblclick();
    await page.waitForFunction(()=>document.querySelector('.poster-dialog button[type=submit]').textContent==='Simpan Gambar');
    assert.equal(saves.length,count+1);assert.equal(saves.at(-1).name,'Latest Agent');
    assert.equal(saves.at(-1).phone,'+60198765432');assert.notEqual(saves.at(-1).id,saves[1].id);
    const sharedPixels=await page.evaluate(async()=>{const image=await createImageBitmap(window.sharedBlob),canvas=new OffscreenCanvas(1080,1350),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);image.close();return Array.from(ctx.getImageData(900,1140,120,120).data);});
    assert.equal(jsQR(new Uint8ClampedArray(sharedPixels),120,120).data,'https://wa.me/60198765432');
    await poster.getByRole('button',{name:'Tutup',exact:true}).click();
    await page.evaluate(()=>window.agentProfile.open());
    const profile=page.locator('.profile-dialog');
    await profile.getByLabel('Nama',{exact:true}).fill('Saved Profile');
    await profile.getByLabel('No WhatsApp',{exact:true}).fill('0187654321');
    assert.equal(await profile.locator('[type=file]').count(),0);
    assert.equal(await profile.getByText(/Logo syarikat/).count(),0);
    failProfile=true;
    await profile.getByRole('button',{name:'Simpan profil',exact:true}).click();
    await profile.getByText(/Test profile failure/).waitFor();
    assert.equal(await profile.getByLabel('No WhatsApp',{exact:true}).inputValue(),'0187654321');
    assert.equal(await page.evaluate(()=>window.agentProfile.read().phone),'+60198765432');
    failProfile=false;
    await profile.getByRole('button',{name:'Simpan profil',exact:true}).dblclick();
    await profile.waitFor({state:'hidden'});
    assert.equal(profiles.length,2);assert.equal(profiles[0].id,profiles[1].id);assert.equal(profiles[1].phone,'+60187654321');
    assert.equal(saves.length,count+1,'Saving profile must not require a poster download');
    await page.reload(); if(await page.locator('#appDialog').isVisible())await page.locator('#dialogClose').click();
    await page.evaluate(()=>window.agentProfile.open());
    assert.equal(await profile.getByLabel('Nama',{exact:true}).inputValue(),'Saved Profile');
    assert.equal(await profile.getByLabel('No WhatsApp',{exact:true}).inputValue(),'+60187654321');
    assert.equal(await profile.locator('.company-preview').count(),0);
    await profile.getByRole('button',{name:'Tutup',exact:true}).click();
    await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('Blocked storage');};});
    await page.evaluate(()=>window.agentProfile.open());
    await profile.getByLabel('Nama',{exact:true}).fill('Unsaved');
    await profile.getByRole('button',{name:'Simpan profil',exact:true}).click();
    await profile.getByText(/profil tidak dapat disimpan sepenuhnya/).waitFor();
    assert.equal(profiles.at(-1).name,'Unsaved','Admin record saved even if device storage fails');
    const profileCount=profiles.length;
    await profile.getByRole('button',{name:'Simpan profil',exact:true}).click();
    assert.equal(profiles.length,profileCount,'Storage retry must not duplicate admin record');
    await profile.getByRole('button',{name:'Tutup',exact:true}).click();
    await page.getByRole('tab',{name:'Comparison PRO'}).click();
    for(const width of [320,390,768,1280]) {await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.querySelector('.pro-pane').scrollWidth<=document.querySelector('.pro-pane').clientWidth));}
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/car-loan-comparison-phone.png'});
    assert.deepEqual(errors,[]); await context.close();
    console.log('PASS comparison/profile: independent brands, terms 1–9, downpayment/insurance/NCD, battery, invalid rebate, QR decoded, legacy profile, profile reload without company logo, DB failure/retry, share activation retry and cancellation, responsive layouts. Phone sharing is mocked, not physical-device verification.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
function calculateMonthly(principal,rate,years){return principal*(1+rate/100*years)/(years*12);}
