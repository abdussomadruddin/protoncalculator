const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.route('**/api/app*',route=>route.fulfill({json:{ready:false,error:'Simpanan gagal'},status:route.request().url().includes('download-request')?503:200}));
    await page.goto('http://localhost:4193');
    if(await page.locator('#appDialog').isVisible()) await page.locator('#dialogClose').click();
    for(let term=1;term<=9;term++) {
      await page.selectOption('#loanPeriod',String(term));
      await page.locator('#downloadImageButton').click();
      await page.getByRole('dialog',{name:'Preview gambar loan'}).waitFor();
      assert.equal(await page.locator('canvas').getAttribute('width'),'1080');
      await page.getByRole('button',{name:'Tutup',exact:true}).click();
    }
    await page.locator('#downloadImageButton').click();
    await page.getByLabel('Nama',{exact:true}).fill('Test Preview');
    await page.getByLabel('No WhatsApp',{exact:true}).fill('0123456789');
    await page.locator('canvas').screenshot({path:'/tmp/car-loan-my-template.png'});
    await page.getByRole('button',{name:'Simpan & Download'}).click();
    await page.getByText(/borang anda dikekalkan/).waitFor();
    assert.equal(await page.getByLabel('Nama',{exact:true}).inputValue(),'Test Preview');
    await page.route('**/api/app?action=download-request',route=>route.fulfill({json:{saved:true}}));
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Simpan & Download'}).click()]);
    assert.equal(download.suggestedFilename(),'car-loan-my.jpg');
    await page.screenshot({path:'/tmp/car-loan-poster-phone.png'});
    await page.setViewportSize({width:1280,height:900});
    await page.screenshot({path:'/tmp/car-loan-poster-desktop.png'});
    const phone = await browser.newContext({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',viewport:{width:390,height:844}});
    await phone.addInitScript(() => {
      navigator.canShare = () => true;
      navigator.share = async data => { window.sharedName = data.files[0].name; };
    });
    const mobile = await phone.newPage();
    await mobile.route('**/api/app*',route=>route.fulfill({json:route.request().url().includes('download-request')?{saved:true}:{ready:false}}));
    await mobile.goto('http://localhost:4193');
    if(await mobile.locator('#appDialog').isVisible()) await mobile.locator('#dialogClose').click();
    await mobile.locator('#downloadImageButton').click();
    await mobile.getByLabel('Nama',{exact:true}).fill('Test');
    await mobile.getByLabel('No WhatsApp',{exact:true}).fill('0123456789');
    await mobile.getByRole('button',{name:'Simpan & Download'}).click();
    await mobile.getByRole('button',{name:'Simpan Gambar',exact:true}).click();
    assert.equal(await mobile.evaluate(()=>window.sharedName),'car-loan-my.jpg');
    await phone.close();
    console.log('PASS poster: 1–9 terms, PNG dimensions, failure retains form, successful save triggers PNG download; mocked backend.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
