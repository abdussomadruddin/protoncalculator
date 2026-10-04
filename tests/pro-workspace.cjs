const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));let logged=false,failSave=true,writes=[],requests=[];
    const old=new Date(Date.now()-4*86400000).toISOString(),recent=new Date().toISOString();
    const seed={id:'11111111-1111-4111-8111-111111111111',name:'Customer A',phone:'+60123456789',brand:'Proton',model:'NEW S70 1.5 i-GT',variant:'Lite',color:'White',remark:'Ready',status:'Submission',activity_at:old};
    const records=[seed,...['Rejected','Delivered','Cancelled'].map((status,i)=>({...seed,id:'terminal-'+i,name:status,status})),{...seed,id:'recent',name:'Recent',activity_at:recent}];
    await page.route('https://pro.test/**',async route=>{
      const url=new URL(route.request().url());if(url.pathname==='/api/app'){
        const action=url.searchParams.get('action');requests.push(action);
        if(action==='config')return route.fulfill({json:{ready:false}});
        if(action==='pro-session')return route.fulfill({status:logged?200:401,json:logged?{email:'agent@test.example',active:true,remindersReady:false}:{error:'Login ejen'}});
        if(action==='pro-login'||action==='pro-register'){logged=true;return route.fulfill({json:{email:'agent@test.example'}});}
        if(action==='pro-logout'){logged=false;return route.fulfill({json:{ok:true}});}
        if(action==='pro-counts')return route.fulfill({json:{case:5,followup:1,appointment:0}});
        if(action==='pro-cases'){await new Promise(resolve=>setTimeout(resolve,200));return route.fulfill({json:{records}});}
        if(action==='pro-appointments')return route.fulfill({json:{records:[]}});
        if(action==='pro-history')return route.fulfill({json:{records:[{created_at:recent,status:'Submission',remark:'<script>window.hacked=true</script>'}]}});
        if(action==='pro-case-delete'){const body=route.request().postDataJSON();writes.push(body);if(!failSave){const index=records.findIndex(r=>r.id===body.id);if(index>=0)records.splice(index,1);}return route.fulfill({status:failSave?503:200,json:failSave?{error:'Delete failure'}:{deleted:true}});}
        if(action==='pro-case-save'||action==='pro-appointment-save'){writes.push(route.request().postDataJSON());await new Promise(r=>setTimeout(r,150));return route.fulfill({status:failSave?503:200,json:failSave?{error:'Test save failure'}:{saved:true}});}
        return route.fulfill({json:{announcement:null}});
      }
      const file=path.join(root,url.pathname==='/'?'index.html':url.pathname.slice(1));return route.fulfill({body:fs.readFileSync(file),contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'}[path.extname(file)]||'text/plain'});
    });
    await page.goto('https://pro.test/');await page.waitForFunction(()=>window.CarLoanBoot.ready);if(await page.locator('#appDialog').isVisible())await page.locator('#dialogClose').click();
    assert.equal(await page.locator('.workspace').isVisible(),true);assert.equal(await page.locator('.pro-pane').isVisible(),false);assert.ok(!requests.includes('pro-cases'),'home never requires private data');
    assert.equal(await page.locator('.pro-mark').count(),4);assert.equal(await page.locator('.pro-tabs button').count(),5);
    await page.locator('#appMenuButton').click();await page.getByRole('button',{name:'Profil Ejen',exact:true}).click();await page.getByRole('heading',{name:'Daftar ejen',exact:true}).waitFor();assert.equal(await page.locator('.pro-auth input').count(),4);assert.equal(await page.locator('.pro-auth input[name=email]').count(),1);assert.equal(await page.locator('.pro-auth input[name=password]').count(),1);await page.getByRole('tab',{name:'Calculator',exact:true}).click();
    const start=await page.getByRole('tab',{name:'Calculator',exact:true}).boundingBox(),end=await page.getByRole('tab',{name:/^Case/}).boundingBox();await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();await page.waitForTimeout(220);await page.mouse.move(end.x+end.width/2,end.y+end.height/2,{steps:8});await page.mouse.up();await page.getByRole('heading',{name:'Daftar ejen',exact:true}).waitFor();assert.equal(await page.locator('.workspace').isVisible(),false);assert.equal(await page.getByRole('tab',{name:/^Case/}).getAttribute('aria-selected'),'true');
    await page.locator('.pro-auth input[name=name]').fill('Agent');await page.locator('.pro-auth input[name=phone]').fill('0173559147');await page.locator('.pro-auth input[name=email]').fill('agent@test.example');await page.locator('.pro-auth input[name=password]').fill('password123');await page.locator('.pro-auth button[type=submit]').click();await page.locator('.pro-record').first().waitFor();assert.equal(await page.locator('.pro-record').count(),5);
    await page.locator('[data-tab=case] .pro-count').waitFor();assert.equal(await page.locator('[data-tab=case] .pro-count').textContent(),'5');assert.equal(await page.locator('[data-tab=followup] .pro-count').textContent(),'1');assert.equal(await page.locator('[data-tab=appointment] .pro-mark').isVisible(),false);assert.equal(await page.locator('[data-tab=comparison] .pro-mark').isVisible(),false);assert.equal(await page.locator('.pro-mark:visible').allTextContents().then(labels=>labels.includes('PRO')),false);
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);
    await page.getByRole('tab',{name:/^Follow Up/}).click();await page.getByText('Case tanpa perubahan status atau remark selama 3 hari.').waitFor();assert.equal(await page.locator('.pro-record').count(),1);assert.equal(await page.locator('.pro-record h3').textContent(),'Customer A');
    const boundaries=await page.evaluate(()=>{
      const row={status:'Submission',activity_at:new Date(Date.now()-3*86400000).toISOString()};return [proWorkspace.isFollowUp(row),proWorkspace.isFollowUp({...row,activity_at:new Date(Date.now()-3*86400000+5000).toISOString()}),...['Rejected','Delivered','Cancelled'].map(status=>proWorkspace.isFollowUp({...row,status}))];
    });assert.deepEqual(boundaries,[true,false,false,false,false]);
    await page.getByRole('button',{name:'Sejarah',exact:true}).click();await page.getByText('<script>window.hacked=true</script>',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>Boolean(window.hacked)),false);await page.locator('.pro-editor').getByRole('button',{name:'Tutup',exact:true}).click();
    await page.getByRole('button',{name:'Edit',exact:true}).click();const editor=page.locator('.pro-editor');assert.equal(await editor.locator('input[type=file]').count(),0);const options=await editor.locator('[name=status] option').allTextContents();assert.equal(options.length,11);assert.ok(!options.includes('Waiting ehakmilik'));assert.ok(!options.includes('Grant & roadtax collected'));
    await editor.locator('[name=remark]').fill('Updated remark');await editor.getByRole('button',{name:'Simpan',exact:true}).click();await editor.getByText('Test save failure').waitFor();assert.equal(await editor.locator('[name=remark]').inputValue(),'Updated remark');const first=writes.at(-1).id;failSave=false;await editor.getByRole('button',{name:'Simpan',exact:true}).click();await editor.waitFor({state:'detached'});assert.equal(writes.at(-1).id,first);
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);
    await page.getByRole('tab',{name:/^Case/}).click();const quick=page.locator('.pro-quick-case').first();await quick.waitFor();failSave=true;await quick.locator('textarea').fill('Inline update');await quick.getByRole('button',{name:'Simpan',exact:true}).click();await quick.getByText('Test save failure').waitFor();assert.equal(await quick.locator('textarea').inputValue(),'Inline update');failSave=false;await quick.getByRole('button',{name:'Simpan',exact:true}).click();await quick.getByText('Disimpan',{exact:true}).waitFor();assert.equal(writes.at(-1).remark,'Inline update');await quick.locator('select').selectOption('LOU received');await page.waitForFunction(()=>!document.querySelector('.pro-quick-case select').disabled);assert.equal(writes.at(-1).status,'LOU received');assert.equal(writes.at(-1).remark,'Inline update');assert.equal(await page.locator('meta[name=viewport]').getAttribute('content').then(v=>v.includes('user-scalable=no')),true);
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);
    await page.getByRole('tab',{name:/^Appointment/}).click();await page.getByText('Reminder push belum diaktifkan di server. Appointment masih boleh direkodkan.').waitFor();await page.getByRole('button',{name:'+ Appointment',exact:true}).click();const appointment=page.locator('.pro-editor');await appointment.locator('[name=case_id]').selectOption(seed.id);assert.equal(await appointment.locator('[name=name]').inputValue(),seed.name);assert.equal(await appointment.locator('[name=phone]').inputValue(),seed.phone);
    await appointment.locator('[name=starts_at]').fill('2026-12-01T10:30');await appointment.getByRole('button',{name:'Simpan',exact:true}).click();await appointment.waitFor({state:'detached'});assert.equal(writes.at(-1).starts_at,'2026-12-01T02:30:00.000Z');
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);
    await page.getByRole('tab',{name:/^Comparison/}).click();await page.locator('.comparison-car').first().waitFor();assert.equal(await page.locator('.comparison-car').count(),2);
    for(const width of [320,390,768,1280]){
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);
      await page.setViewportSize({width,height:900});await page.getByRole('tab',{name:/^Case/}).click();await page.locator('.pro-record').first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      const bounds=await page.locator('.pro-tabs').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1);for(const b of await page.locator('.pro-tabs button').all())assert.ok((await b.boundingBox()).height>=44);
    }
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/car-loan-pro-case-phone.png',fullPage:true});
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);
    await page.getByRole('tab',{name:'Calculator',exact:true}).click();await page.screenshot({path:'/tmp/car-loan-pro-calculator-phone.png'});
    const nav=await page.locator('.pro-tabs').boundingBox(),actions=await page.locator('.actions').boundingBox();assert.ok(actions.y+actions.height<=nav.y,'actions and floating tabs must not overlap');
    await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await page.waitForTimeout(80);
    const raised=await page.locator('.actions').boundingBox();
    await page.evaluate(()=>scrollTo(0,300));await page.waitForFunction(()=>document.querySelector('.pro-tabs').classList.contains('is-scroll-hidden'));assert.equal(await page.locator('.pro-tabs').evaluate(n=>n.inert),true);await page.waitForTimeout(400);const lowered=await page.locator('.actions').boundingBox();assert.ok(Math.abs(lowered.y-raised.y-63)<1,'Action buttons slide into space vacated by tabs');assert.ok(lowered.y+lowered.height<=844,'Actions remain on screen');
    await page.evaluate(()=>scrollTo(0,250));await page.waitForFunction(()=>!document.querySelector('.pro-tabs').classList.contains('is-scroll-hidden'));assert.equal(await page.locator('.pro-tabs').evaluate(n=>n.inert),false);await page.waitForTimeout(400);assert.ok(Math.abs((await page.locator('.actions').boundingBox()).y-raised.y)<1,'Actions return above tabs');
    await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.getByRole('button',{name:'Refresh',exact:true}).count(),0);
    await page.waitForTimeout(350);await page.getByRole('tab',{name:/^Case/}).click();await page.locator('.pro-record').first().waitFor();
    await page.locator('.pro-record').first().getByRole('button',{name:'Padam',exact:true}).click();
    const deletion=page.locator('.pro-editor');const beforeDelete=writes.length;
    assert.equal(await deletion.getByText('Rekod akan hilang daripada paparan ejen. Rekod asal kekal dalam database admin.',{exact:true}).count(),0);
    await deletion.getByRole('button',{name:'Teruskan',exact:true}).click();assert.equal(writes.length,beforeDelete);
    await deletion.getByText('Pengesahan kedua: pasti mahu padamkan rekod ini?',{exact:true}).waitFor();
    await deletion.getByRole('button',{name:'Tutup',exact:true}).click();assert.equal(await page.locator('.pro-record').count(),5);
    await page.locator('.pro-record').first().getByRole('button',{name:'Padam',exact:true}).click();await deletion.getByRole('button',{name:'Teruskan',exact:true}).click();failSave=true;
    await deletion.getByRole('button',{name:'Ya, padam dari paparan',exact:true}).click();await deletion.getByText('Delete failure',{exact:true}).waitFor();assert.equal(await page.locator('.pro-record').count(),5);
    failSave=false;await deletion.getByRole('button',{name:'Ya, padam dari paparan',exact:true}).click();await deletion.waitFor({state:'detached'});assert.equal(await page.locator('.pro-record').count(),4);assert.equal(writes.at(-1).confirmAgain,true);
    await page.reload();await page.waitForFunction(()=>window.CarLoanBoot.ready);if(await page.locator('#appDialog').isVisible())await page.locator('#dialogClose').click();assert.equal(await page.locator('.workspace').isVisible(),true,'reload defaults to calculator');assert.deepEqual(errors,[]);
    console.log('PASS PRO UI: anonymous calculator default, 5 compact tabs, auth gating, private cases, status list, 3-day follow up, terminal exclusion, safe history, save failure/retry, appointment case link/Malaysia time, comparison and 4 widths.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
