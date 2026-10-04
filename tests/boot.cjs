const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('https://boot.test/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/app'){
    const action=url.searchParams.get('action');
    if(action==='pro-session'){await gate;return route.fulfill({json:{email:'agent@example.com',active:true}});}
    if(action==='pro-cases'||action==='pro-appointments'){await new Promise(resolve=>setTimeout(resolve,400));return route.fulfill({json:{records:[]}});}
    if(action==='pro-counts')return route.fulfill({json:{case:0,followup:0,appointment:0}});
    if(action.endsWith('realtime'))return route.fulfill({status:503,json:{error:'Not available'}});
    return route.fulfill({json:{ready:false,announcement:null}});
   }
   const file=path.join(root,url.pathname==='/'?'index.html':url.pathname.slice(1));return route.fulfill({body:fs.readFileSync(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'}[path.extname(file)]||'text/plain'});
  });
  await page.goto('https://boot.test/');assert.equal(await page.locator('#appBoot').isVisible(),true);assert.equal(await page.locator('.app-shell').isVisible(),false);
  await page.screenshot({path:'/tmp/car-loan-startup-phone.png'});
  release();await page.waitForFunction(()=>CarLoanBoot.ready);await page.locator('#appBoot').waitFor({state:'detached'});assert.equal(await page.locator('.app-shell').isVisible(),true);
  if(await page.locator('#appDialog').isVisible())await page.locator('#dialogClose').click();
  await page.getByRole('tab',{name:/^Case/}).click();await page.getByText('Tiada rekod.',{exact:true}).waitFor();assert.equal(await page.locator('#appBoot').count(),0,'Tab changes must not restart splash');
  await page.reload();await page.waitForFunction(()=>CarLoanBoot.ready);assert.deepEqual(errors,[]);
  const offline=await browser.newPage();await offline.route('https://timeout.test/**',route=>{
   const url=new URL(route.request().url());if(url.pathname==='/api/app')return new Promise(()=>{});
   const file=path.join(root,url.pathname==='/'?'index.html':url.pathname.slice(1));return route.fulfill({body:fs.readFileSync(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'}[path.extname(file)]||'text/plain'});
  });
  await offline.goto('https://timeout.test/');await offline.waitForFunction(()=>CarLoanBoot.ready,{},{timeout:10000});assert.equal(await offline.locator('.app-shell').isVisible(),true,'Slow backend cannot block calculator forever');
  console.log('PASS startup: logo loading, waits for session and data, one-time reveal, reload, no JS errors, 8-second escape.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
