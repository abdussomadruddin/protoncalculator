const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const sdk=`window.liveClients=[];window.CarLoanRealtime={RealtimeClient:class{constructor(){this.bindings=[];liveClients.push(this)}async setAuth(token){this.token=token}channel(){return this}on(type,filter,callback){this.bindings.push({type,filter,callback});return this}subscribe(callback){this.status=callback;setTimeout(()=>callback('SUBSCRIBED'),0);return this}async removeAllChannels(){this.bindings=[]}async disconnect(){}}};window.emitLive=table=>liveClients.forEach(c=>c.bindings.forEach(b=>{if(b.type==='postgres_changes'&&b.filter.table===table&&b.filter.event==='UPDATE')b.callback({})}));`;
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const seed={id:'11111111-1111-4111-8111-111111111111',name:'Customer',phone:'+60123456789',brand:'Proton',model:'S70',variant:'Lite',status:'Submission',remark:'Original',activity_at:new Date(Date.now()-4*86400000).toISOString()};
  let records=[seed],meetings=[],fail=false,announcement=null;
  await page.route('https://live.test/**',async route=>{
   const url=new URL(route.request().url()),action=url.searchParams.get('action');
   if(url.pathname==='/api/app'){
    if(action==='config')return route.fulfill({json:{ready:false}});
    if(action==='pro-session')return route.fulfill({json:{email:'agent@example.com',active:true}});
    if(action==='public-realtime'||action==='pro-realtime')return route.fulfill({json:{url:'https://test.supabase.co',key:'public',accessToken:action==='pro-realtime'?'owner-token':undefined,ownerId:seed.id,...(action==='public-realtime'?{subscriptions:[{table:'car_live_signals',filter:'topic=eq.announcements'}]}:{})}});
    if(action==='pro-counts')return route.fulfill({json:{case:records.length,followup:records.filter(r=>r.status==='Submission').length,appointment:meetings.length}});
    if(action==='pro-cases'||action==='pro-appointments')return route.fulfill({status:fail?503:200,json:fail?{error:'Offline'}:{records:action==='pro-cases'?records:meetings}});
    if(action==='announcement')return route.fulfill({json:{announcement}});
    return route.fulfill({json:{}});
   }
   if(url.pathname.endsWith('/supabase-realtime.js'))return route.fulfill({body:sdk,contentType:'text/javascript'});
   const file=path.join(root,url.pathname==='/'?'index.html':url.pathname.slice(1));return route.fulfill({body:fs.readFileSync(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'}[path.extname(file)]||'text/plain'});
  });
  await page.goto('https://live.test/');await page.waitForFunction(()=>window.CarLoanBoot.ready);if(await page.locator('#appDialog').isVisible())await page.locator('#dialogClose').click();
  await page.waitForFunction(()=>liveClients.some(c=>c.token==='owner-token'));
  await page.getByRole('tab',{name:/^Case/}).click();await page.locator('.pro-record h3').waitFor();
  records=[{...seed,name:'Updated on another device'}];await page.evaluate(()=>emitLive('car_agent_cases'));await page.getByRole('heading',{name:'Updated on another device',exact:true}).waitFor();
  const search=page.getByRole('searchbox',{name:'Cari rekod'});await search.fill('Updated');
  records.push({...seed,id:'second',name:'Other customer'});await page.evaluate(()=>emitLive('car_agent_cases'));await page.waitForTimeout(400);assert.equal(await search.inputValue(),'Updated');assert.equal(await page.locator('.pro-record').count(),1);
  const draft=page.locator('.pro-quick-case textarea').first();await draft.fill('Unsaved draft');records=[{...records[0],remark:'Remote change'},records[1]];await page.evaluate(()=>emitLive('car_agent_cases'));await page.waitForTimeout(400);assert.equal(await draft.inputValue(),'Unsaved draft');
  await draft.fill('Original');await search.focus();await page.getByText('Remote change',{exact:true}).waitFor();
  fail=true;await page.evaluate(()=>emitLive('car_agent_cases'));await page.waitForTimeout(400);assert.equal(await page.locator('.pro-record h3').textContent(),'Updated on another device');fail=false;
  await page.evaluate(()=>{document.activeElement.blur();scrollTo(0,0)});await page.waitForTimeout(350);await page.getByRole('tab',{name:/^Follow Up/}).click();await page.locator('.pro-record').first().waitFor();records=records.map(r=>({...r,status:'Delivered'}));await page.evaluate(()=>emitLive('car_agent_cases'));await page.waitForFunction(()=>document.querySelectorAll('.pro-record').length===0);
  await page.getByRole('tab',{name:/^Appointment/}).click();await page.getByText('Tiada rekod.',{exact:true}).waitFor();meetings=[{id:'meeting',name:'New appointment',phone:seed.phone,status:'Scheduled',type:'Delivery',starts_at:new Date(Date.now()+86400000).toISOString(),location:'Showroom',notes:''}];await page.evaluate(()=>emitLive('car_agent_appointments'));await page.getByRole('heading',{name:'New appointment',exact:true}).waitFor();
  announcement={id:'live-announcement',title:'Realtime announcement',message:'New official announcement'};await page.evaluate(()=>emitLive('car_live_signals'));await page.getByRole('heading',{name:'Realtime announcement',exact:true}).waitFor();await page.locator('#dialogClose').click();
  await page.evaluate(()=>dispatchEvent(new Event('online')));await page.waitForTimeout(500);assert.deepEqual(errors,[]);
  console.log('PASS realtime UI: cross-device cases/appointments, badges, follow-up, announcements, preserved search/drafts, network failure and reconnect.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
