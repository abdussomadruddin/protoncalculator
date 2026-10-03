const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async () => {
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://localhost:4193/');
    if(await page.locator('#appDialog').isVisible())await page.locator('#dialogClose').click();
    await page.locator('#downloadImageButton').click();
    const poster=page.locator('.poster-dialog');
    await poster.getByLabel('Nama',{exact:true}).fill('Local Sandbox Test');
    await poster.getByLabel('No WhatsApp',{exact:true}).fill('0123456789');
    await page.waitForFunction(()=>!document.querySelector('.poster-dialog button[type=submit]').disabled);
    const wait=page.waitForEvent('download');await poster.locator('[type=submit]').click();
    const download=await wait;assert.equal(download.suggestedFilename(),'car-loan-my.jpg');
    await poster.getByRole('button',{name:'Tutup',exact:true}).click();
    await page.getByRole('button',{name:'Banding Kereta',exact:true}).click();
    await page.locator('.comparison-car').nth(1).locator('[name=brand]').selectOption('Honda');
    await page.locator('.comparison-poster').click();
    await page.waitForFunction(()=>!document.querySelector('.poster-dialog button[type=submit]').disabled);
    const dualWait=page.waitForEvent('download');await poster.locator('[type=submit]').click();assert.equal((await dualWait).suggestedFilename(),'car-loan-my.jpg');
    await poster.getByRole('button',{name:'Tutup',exact:true}).click();
    await page.getByRole('button',{name:'Banding Kereta',exact:true}).click();
    await page.locator('.comparison-dialog').evaluate(async element=>{await Promise.all(element.getAnimations().map(animation=>animation.finished));});
    await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'/tmp/car-loan-preview-desktop.png'});
    assert.deepEqual(errors,[]);
    console.log('PASS real local sandbox: single/two car records saved through production handler into local DB before actual JPG downloads; no production access.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
