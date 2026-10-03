(() => {
  const statuses=['Document collected','More document needed','Submission','Rejected','LOU received','Pending sign agreement','Pending allocation','Registered','Prepare delivery','Delivered','Cancelled'];
  const terminal=new Set(['Rejected','Delivered','Cancelled']);
  const tabs=[['calculator','Calculator','calculator'],['comparison','Comparison','git-compare-arrows'],['case','Case','folder-kanban'],['followup','Follow Up','clock-3'],['appointment','Appointment','calendar-days']];
  const workspace=document.querySelector('.workspace'), shell=document.querySelector('.app-shell');
  const pane=document.createElement('section');pane.className='pro-pane';pane.hidden=true;shell.append(pane);
  const nav=document.createElement('nav');nav.className='pro-tabs';nav.setAttribute('aria-label','Workspace');nav.setAttribute('role','tablist');
  for(const [id,label,icon] of tabs){const b=document.createElement('button');b.type='button';b.dataset.tab=id;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(id==='calculator'));b.innerHTML=`<i data-lucide="${icon}"></i><span>${label}</span>${id==='calculator'?'':'<small class="pro-mark">PRO</small>'}`;b.onclick=()=>select(id);nav.append(b);}document.body.append(nav);
  let current='calculator',agent=null,records=[],appointments=[],generation=0,authMode='register',comparison=null,redrawLive=null;
  const lens=document.createElement('span');lens.className='pro-tab-lens';lens.setAttribute('aria-hidden','true');nav.prepend(lens);
  const tabButtons=[...nav.querySelectorAll('button')];
  function positionLens(id){const index=tabs.findIndex(t=>t[0]===id);nav.style.setProperty('--tab-index',Math.max(0,index));}
  let gesture=null,suppressClickUntil=0;
  let lastScroll=Math.max(0,scrollY),scrollTravel=0,scrollDirection=0,scrollFrame=0;
  function setTabsHidden(hidden){nav.classList.toggle('is-scroll-hidden',hidden);document.body.classList.toggle('tabs-scroll-hidden',hidden);nav.inert=hidden;}
  function revealTabs(){setTabsHidden(false);}
  addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{
    scrollFrame=0;const y=Math.max(0,Math.min(scrollY,document.documentElement.scrollHeight-innerHeight)),delta=y-lastScroll;lastScroll=y;
    if(document.querySelector('dialog[open]')||gesture||nav.querySelector(':focus-visible')){revealTabs();scrollTravel=0;return;}
    if(y<32){revealTabs();scrollTravel=0;return;}
    const direction=Math.sign(delta);if(!direction)return;if(direction!==scrollDirection)scrollTravel=0;scrollDirection=direction;scrollTravel+=Math.abs(delta);
    if(scrollTravel>=(direction>0?24:10)){setTabsHidden(direction>0);scrollTravel=0;}
  });},{passive:true});
  nav.addEventListener('focusin',revealTabs);
  nav.addEventListener('pointerdown',event=>{
    if(event.button!==0||!event.target.closest('button'))return;
    const index=tabButtons.indexOf(event.target.closest('button'));
    gesture={pointer:event.pointerId,startX:event.clientX,startY:event.clientY,index,dragging:false};
    nav.setPointerCapture(event.pointerId);nav.classList.add('is-pressed');
    gesture.timer=setTimeout(()=>{if(gesture){gesture.dragging=true;nav.classList.add('is-dragging');positionLens(tabs[gesture.index][0]);}},180);
  });
  nav.addEventListener('pointermove',event=>{
    if(!gesture||event.pointerId!==gesture.pointer)return;
    if(Math.hypot(event.clientX-gesture.startX,event.clientY-gesture.startY)>8)gesture.dragging=true;
    if(!gesture.dragging)return;
    nav.classList.add('is-dragging');const bounds=nav.getBoundingClientRect();
    gesture.index=Math.max(0,Math.min(4,Math.floor((event.clientX-bounds.left-6)/((bounds.width-12)/5))));positionLens(tabs[gesture.index][0]);
    tabButtons.forEach((b,i)=>b.classList.toggle('is-target',i===gesture.index));
  });
  function endGesture(event,cancelled){if(!gesture||event.pointerId!==gesture.pointer)return;const state=gesture;clearTimeout(state.timer);gesture=null;nav.classList.remove('is-pressed','is-dragging');tabButtons.forEach(b=>b.classList.remove('is-target'));if(!cancelled){suppressClickUntil=Date.now()+400;select(tabs[state.index][0]);}else positionLens(current);}
  nav.addEventListener('pointerup',event=>endGesture(event,false));nav.addEventListener('pointercancel',event=>endGesture(event,true));
  nav.addEventListener('click',event=>{if(Date.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
  const icons=()=>window.lucide?.createIcons();
  const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
  const button=(label,run,cls='secondary-action')=>{const b=el('button',cls,label);b.type='button';b.onclick=run;return b;};
  const date=value=>new Date(value).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur',dateStyle:'medium',timeStyle:'short'});
  const due=(row,now=Date.now())=>!terminal.has(row.status)&&now-new Date(row.activity_at).getTime()>=3*86400000;
  let counts={},countPending=false;
  function badges(){for(const button of tabButtons){const badge=button.querySelector('.pro-mark');if(!badge)continue;const count=counts[button.dataset.tab]||0;badge.hidden=!!agent&&count===0;badge.textContent=agent?String(count):'PRO';badge.classList.toggle('pro-count',!!agent);}}
  async function refreshCounts(){if(!agent||!agent.active||countPending)return;countPending=true;try{const next=await api('pro-counts');if(agent){counts=next;badges();}}catch(error){if(error.status===401||error.status===403){live.stop();expired();}}finally{countPending=false;}}
  async function api(action,body,params=''){
    const response=await fetch('/api/app?action='+action+params,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:'no-store'});
    const data=await response.json();if(!response.ok){const error=new Error(data.error||data.message||'Sambungan gagal. Cuba lagi.');error.status=response.status;throw error;}return data;
  }
  const message=(text,cls='pro-subtle')=>pane.append(el('p',cls,text));
  function heading(title,icon){const h=el('div','pro-heading');const text=el('h2');text.innerHTML=`<i data-lucide="${icon}"></i>`;text.append(document.createTextNode(title));h.append(text);pane.append(h);icons();}
  function auth(){pane.replaceChildren();heading('Ejen PRO','shield-check');const form=el('form','pro-auth');const modes=el('div','pro-toolbar');for(const [mode,label]of[['login','Login'],['register','Daftar']]){const b=button(label,()=>{authMode=mode;auth();});b.setAttribute('aria-pressed',String(mode===authMode));modes.append(b);}form.append(modes,el('h3','',authMode==='login'?'Login ejen':'Daftar ejen'),el('p','pro-subtle','PRO percuma sehingga 31 Disember 2026. Tiada caj automatik. Calculator tidak memerlukan login.'));
    for(const [name,label,type]of[...(authMode==='register'?[['name','Nama','text'],['phone','No WhatsApp','tel']]:[]),['email','Email','email'],['password','Password','password']]){const l=el('label','',label),input=el('input');input.name=name;input.type=type;input.required=true;input.maxLength=name==='email'?254:name==='name'?100:name==='phone'?20:256;if(name==='password')input.minLength=8;if(name==='phone')input.inputMode='tel';input.autocomplete=name==='name'?'name':name==='phone'?'tel':name==='email'?'email':authMode==='login'?'current-password':'new-password';l.append(input);form.append(l);}
    const status=el('p','pro-error');status.setAttribute('role','status');const submit=el('button','primary-action',authMode==='login'?'Login':'Daftar');submit.type='submit';form.append(status,submit);form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;status.textContent='Menyemak...';try{const result=await api('pro-'+authMode,{...Object.fromEntries(new FormData(form)),tab:current});if(result.confirmation){status.textContent='Semak email untuk pengesahan, kemudian login.';return;}agent=null;await select(current);}catch(error){status.textContent=error.message;}finally{submit.disabled=false;}};pane.append(form);icons();
  }
  async function linkDevice(){try{const registration=await navigator.serviceWorker?.getRegistration();const sub=await registration?.pushManager.getSubscription();const token=localStorage.getItem('carloan-device-token');if(sub&&token)await api('pro-device',{subscription:sub.toJSON(),deviceToken:token});}catch(e){if(current==='appointment')message('Reminder belum disambungkan: '+e.message,'pro-error');}}
  let sessionPending=null;
  function restoreSession(){if(!sessionPending)sessionPending=api('pro-session').then(result=>{agent=result;badges();refreshCounts();if(agent.active)live.start();return result;}).finally(()=>{sessionPending=null;});return sessionPending;}
  async function select(id){revealTabs();if(!tabs.some(t=>t[0]===id))id='calculator';current=id;positionLens(id);const version=++generation;nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===id)));workspace.hidden=id!=='calculator';pane.hidden=id==='calculator';
    redrawLive=null;if(id==='calculator'){icons();return;}
    if(agent&&id!=='comparison'&&agent.active)render();
    else{pane.replaceChildren();const meta=tabs.find(t=>t[0]===id);heading(meta[1],meta[2]);const loading=el('div','pro-loading');loading.setAttribute('role','status');loading.setAttribute('aria-label','Memuatkan');loading.innerHTML='<i data-lucide="loader-circle"></i>';pane.append(loading);icons();}
    try{if(!agent)await restoreSession();if(version!==generation)return;if(!agent.active){pane.replaceChildren();heading('Ejen PRO','shield-check');message('Tempoh percuma telah tamat. Hubungi support. Tiada caj automatik.');return;}
      if(id==='comparison'){pane.replaceChildren();heading('Comparison','git-compare-arrows');const capture=button('Gunakan kiraan calculator semasa',()=>{comparison.replaceChildren();window.carComparison.mount(comparison);icons();});pane.append(capture);if(!comparison){comparison=el('div','pro-comparison');window.carComparison.mount(comparison);}pane.append(comparison);icons();return;}
      const result=await api(id==='appointment'?'pro-appointments':'pro-cases');if(version!==generation)return;
      if(id==='appointment'){appointments=result.records;const cases=await api('pro-cases');if(version!==generation)return;records=cases.records;}else records=result.records;
      if(!pane.contains(document.activeElement))render();linkDevice();refreshCounts();
    }catch(error){if(version!==generation)return;if(error.status===401){live.stop();agent=null;counts={};badges();auth();}else{pane.replaceChildren();heading(tabs.find(t=>t[0]===id)[1],tabs.find(t=>t[0]===id)[2]);message(error.message,'pro-error');pane.append(button('Cuba semula',()=>select(id)));}}
  }
  function render(){pane.replaceChildren();const meta=tabs.find(t=>t[0]===current);heading(meta[1],meta[2]);const toolbar=el('div','pro-toolbar'),search=el('input');search.type='search';search.placeholder='Cari nama / WhatsApp';search.setAttribute('aria-label','Cari rekod');toolbar.append(search);
    if(current!=='followup')toolbar.append(button(current==='appointment'?'+ Appointment':'+ Case',()=>edit(null,current==='appointment'), 'primary-action'));
    const filter=el('select');filter.setAttribute('aria-label','Status');const opts=current==='appointment'?['Semua','Scheduled','Completed','Cancelled']:['Semua',...statuses];for(const s of opts)filter.append(new Option(s,s));toolbar.append(filter);pane.append(toolbar);
    if(current==='followup')message('Case tanpa perubahan status atau remark selama 3 hari.');
    if(current==='appointment'){message('Reminder: 3 hari, 1 hari, 4 jam dan 1 jam sebelum appointment (waktu Malaysia). Aktifkan Notification dalam Tetapan app.');if(!agent.remindersReady)message('Reminder push belum diaktifkan di server. Appointment masih boleh direkodkan.','pro-error');}
    const list=el('div','pro-list');pane.append(list);
    redrawLive=()=>{if(list.isConnected)draw();};
    function draw(){list.replaceChildren();const rows=(current==='appointment'?appointments:records).filter(r=>(current!=='followup'||due(r))&&(filter.value==='Semua'||r.status===filter.value)&&(r.name+' '+r.phone).toLowerCase().includes(search.value.toLowerCase()));if(!rows.length){list.append(el('p','pro-empty','Tiada rekod.'));return;}for(const r of rows){const card=el('article','pro-record');card.append(el('h3','',r.name),el('p','',r.phone),el('span','pro-status'+(terminal.has(r.status)||r.status==='Completed'?' terminal':''),r.status));if(current==='appointment'){card.append(el('p','',r.type+' · '+date(r.starts_at)),el('p','',r.location),el('p','',r.notes));}else{card.append(el('p','',[r.brand,r.model,r.variant].join(' ')),el('p','',r.color),el('p','',r.remark),el('p','pro-subtle','Aktiviti terakhir · '+date(r.activity_at)));}
      if(current!=='appointment'){card.querySelector('.pro-status').remove();card.append(quickCase(r,draw));}
      const actions=el('div','pro-toolbar');for(const [label,url,icon]of[['WhatsApp','https://wa.me/'+r.phone.slice(1),'message-circle'],['Call','tel:'+r.phone,'phone']]){const a=el('a');a.href=url;a.innerHTML=`<i data-lucide="${icon}"></i>`;a.append(document.createTextNode(label));if(label==='WhatsApp'){a.target='_blank';a.rel='noopener noreferrer';}actions.append(a);}actions.append(button('Edit',()=>edit(r,current==='appointment')));if(current!=='appointment')actions.append(button('Sejarah',()=>history(r)));card.append(actions);list.append(card);}icons();}search.oninput=draw;filter.onchange=draw;draw();if((current==='appointment'?appointments:records).length===1000)message('Memaparkan 1,000 rekod terkini sahaja.','pro-error');icons();
  }
  function quickCase(record,redraw){
    const form=el('form','pro-quick-case'),label=el('label','','Status'),select=el('select'),remark=el('textarea'),feedback=el('p','pro-subtle'),save=el('button','primary-action','Simpan');
    form.dataset.remark=record.remark||'';form.dataset.status=record.status;select.setAttribute('aria-label','Status case '+record.name);for(const status of statuses)select.append(new Option(status,status));select.value=record.status;label.append(select);
    remark.setAttribute('aria-label','Remark '+record.name);remark.placeholder='Isi remark';remark.value=record.remark||'';remark.maxLength=2000;remark.rows=2;save.type='submit';feedback.setAttribute('role','status');form.append(label,remark,save,feedback);let busy=false;
    async function persist(statusOnly){if(busy)return;busy=true;select.disabled=true;save.disabled=true;feedback.textContent='Menyimpan...';const next={...record,status:select.value,remark:statusOnly?record.remark:remark.value};
      try{const changed=next.status!==record.status||next.remark!==record.remark;await api('pro-case-save',next);Object.assign(record,next,changed?{activity_at:new Date().toISOString()}:{});form.dataset.remark=record.remark||'';form.dataset.status=record.status;feedback.className='pro-subtle';feedback.textContent='Disimpan';refreshCounts();if(current==='followup'&&changed)redraw();}
      catch(error){if(statusOnly)select.value=record.status;feedback.textContent=error.message;feedback.className='pro-error';}
      finally{busy=false;select.disabled=false;save.disabled=false;}
    }
    select.onchange=()=>persist(true);form.onsubmit=event=>{event.preventDefault();persist(false);};return form;
  }
  function dialog(title){const d=el('dialog','app-dialog pro-editor'),top=el('div','dialog-top');top.append(el('h2','',title),button('Tutup',()=>d.close()));d.append(top);document.body.append(d);d.addEventListener('close',()=>d.remove());return d;}
  function edit(record,appointment){const d=dialog(appointment?'Appointment':'Case'),form=el('form'),grid=el('div','pro-form-grid');const defaults=record||{name:'',phone:'',brand:document.querySelector('#brandSelect').value,model:document.querySelector('#modelSelect').value,variant:document.querySelector('#variantSelect').value,type:'Test Drive',status:appointment?'Scheduled':'Document collected'};
    function field(name,label,type='text',values){const l=el('label','',label),i=el(values?'select':type==='textarea'?'textarea':'input');i.name=name;if(values)for(const v of values)i.append(new Option(typeof v==='string'?v:v.label,typeof v==='string'?v:v.value));else if(type!=='textarea')i.type=type;i.value=defaults[name]||'';i.required=['name','phone','brand','model','variant','starts_at','type'].includes(name);if(name==='phone')i.inputMode='tel';if(type==='textarea')l.className='full-width';l.append(i);grid.append(l);return i;}
    field('name','Nama pelanggan');field('phone','No WhatsApp','tel');
    if(appointment){field('type','Jenis','text',['Test Drive','Delivery']);const linked=field('case_id','Case (optional)','text',[{value:'',label:'Tiada case'},...records.map(r=>({value:r.id,label:r.name+' · '+r.model}))]);linked.onchange=()=>{const c=records.find(r=>r.id===linked.value);if(c){form.elements.name.value=c.name;form.elements.phone.value=c.phone;}};const dt=field('starts_at','Tarikh / masa Malaysia','datetime-local');if(record)dt.value=new Date(new Date(record.starts_at).getTime()+8*3600000).toISOString().slice(0,16);field('status','Status','text',['Scheduled','Completed','Cancelled']);field('location','Lokasi');field('notes','Nota','textarea');}
    else{const brand=field('brand','Brand','text',Object.keys(CAR_CATALOG)),model=field('model','Model','text',[]),variant=field('variant','Variant','text',[]);const variants=()=>{variant.replaceChildren(...(CAR_CATALOG[brand.value].find(m=>m.name===model.value)?.variants||[]).map(v=>new Option(v.name,v.name)));};const models=()=>{model.replaceChildren(...CAR_CATALOG[brand.value].map(m=>new Option(m.name,m.name)));variants();};models();if([...model.options].some(o=>o.value===defaults.model)){model.value=defaults.model;variants();}if([...variant.options].some(o=>o.value===defaults.variant))variant.value=defaults.variant;brand.onchange=models;model.onchange=variants;field('color','Warna');field('status','Status','text',statuses);field('remark','Remark','textarea');}
    const status=el('p','pro-error'),save=el('button','primary-action','Simpan');save.type='submit';form.append(grid,status,save);d.append(form);const requestID=record?.id||crypto.randomUUID();let busy=false;
    form.onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;save.disabled=true;status.textContent='Menyimpan...';const body={...Object.fromEntries(new FormData(form)),tab:current};body.id=requestID;if(appointment)body.starts_at=body.starts_at?new Date(body.starts_at+':00+08:00').toISOString():'';try{await api(appointment?'pro-appointment-save':'pro-case-save',body);d.close();await select(current);}catch(error){status.textContent=error.message;}finally{busy=false;save.disabled=false;}};
    d.showModal();icons();
  }
  async function history(record){
    const d=dialog('Sejarah · '+record.name),status=el('p','pro-subtle','Memuatkan...'),list=el('ul','pro-history');d.append(status,list);d.showModal();let version=0,timer;
    async function update(){const request=++version;try{const {records:events}=await api('pro-history',undefined,'&id='+encodeURIComponent(record.id));if(!d.open||request!==version)return;status.textContent='';list.replaceChildren();for(const event of events)list.append(el('li','',date(event.created_at)+'\n'+event.status+'\n'+event.remark));}catch(error){if(d.open&&request===version)status.textContent=error.message;}}
    const changed=()=>{clearTimeout(timer);timer=setTimeout(update,150);};addEventListener('carloan-pro-live',changed);d.addEventListener('close',()=>{version++;clearTimeout(timer);removeEventListener('carloan-pro-live',changed);});await update();
  }
  window.proWorkspace={select,isFollowUp:due,openProfile:()=>{if(agent){window.agentProfile.open();return;}authMode='register';current='case';generation++;positionLens(current);nav.querySelectorAll('button').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.tab===current)));workspace.hidden=true;pane.hidden=false;revealTabs();auth();}};icons();
  addEventListener('carloan-notification-synced',()=>{if(agent)linkDevice();});
  navigator.serviceWorker?.addEventListener('message',event=>{if(['appointment','followup'].includes(event.data?.type)){event.ports?.[0]?.postMessage({handled:true});select(event.data.type==='followup'?'followup':'appointment');}});
  let refreshing=false,livePending=false,liveTimer=null;
  function editing(){return Boolean(document.querySelector('dialog[open]'))||Boolean(pane.querySelector('.pro-list')?.contains(document.activeElement))||Array.from(pane.querySelectorAll('.pro-quick-case')).some(form=>form.querySelector('button').disabled||form.querySelector('textarea').value!==form.dataset.remark||form.querySelector('select').value!==form.dataset.status);}
  function requestSync(){livePending=true;dispatchEvent(new Event('carloan-pro-live'));clearTimeout(liveTimer);liveTimer=setTimeout(syncLive,150);}
  function expired(){agent=null;counts={};records=[];appointments=[];document.querySelectorAll('.pro-editor[open]').forEach(dialog=>dialog.close());badges();if(current!=='calculator')auth();}
  const live=window.CarLoanLive(api,requestSync,expired);
  async function syncLive(){
    if(!agent||!agent.active||document.hidden||refreshing)return;
    refreshCounts();if(!['case','followup','appointment'].includes(current)){livePending=false;return;}
    if(editing())return;
    refreshing=true;livePending=false;const version=generation;
    try{
      const cases=await api('pro-cases');const meetings=current==='appointment'?await api('pro-appointments'):null;
      if(version!==generation||!agent)return;
      if(editing()){livePending=true;return;}
      const changed=JSON.stringify(records)!==JSON.stringify(cases.records)||meetings&&JSON.stringify(appointments)!==JSON.stringify(meetings.records);
      records=cases.records;if(meetings)appointments=meetings.records;if(changed||current==='followup')redrawLive?.();
    }catch(error){if(version===generation&&(error.status===401||error.status===403)){live.stop();expired();}}
    finally{refreshing=false;if(livePending&&!editing())requestSync();}
  }
  document.addEventListener('focusout',()=>{if(livePending)requestSync();});
  document.addEventListener('close',()=>{if(livePending)requestSync();},true);
  // Normal launches always open Calculator; notification deep links are explicit exceptions.
  const confirmation=new URLSearchParams(location.search).get('auth_token_hash');
  if(confirmation){history.replaceState(null,'',location.pathname);workspace.hidden=true;pane.hidden=false;pane.append(el('p','pro-subtle','Mengesahkan email...'));api('pro-confirm',{token_hash:confirmation}).then(result=>select(result.next)).catch(error=>{current='case';authMode='login';auth();message(error.message,'pro-error');});}
  else if(new URLSearchParams(location.search).has('appointment'))select('appointment');
  else if(new URLSearchParams(location.search).has('followup'))select('followup');
  else restoreSession().catch(()=>{});
})();
