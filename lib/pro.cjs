const crypto = require('node:crypto');
const webpush = require('web-push');
const accessCookie='__Host-carloan-agent', refreshCookie='__Host-carloan-agent-refresh';
const STATUSES=['Document collected','More document needed','Submission','Rejected','LOU received','Pending sign agreement','Pending allocation','Registered','Prepare delivery','Delivered','Cancelled'];
function phone(value) {
  const normalized=String(value||'').replace(/[\s()-]/g,'').replace(/^\+/,'').replace(/^0/,'60');
  return /^601\d{8,9}$/.test(normalized) ? '+'+normalized : null;
}
module.exports=async function pro(req,res,ctx) {
  const {supabase,fail,readCookie,uuid,validateSubscription,pushReady}=ctx;
  const action=req.query.action, body=req.body||{};
  const isPost=()=>{if(req.method!=='POST') fail(405,'Gunakan POST.');};
  const text=(value,max,required=false)=>{if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim())) fail(400,'Input tidak sah.');return value.trim();};
  const session=(data)=>{
    if(!data?.access_token||!data?.refresh_token||!data.user?.email_confirmed_at) fail(401,'Sahkan email sebelum login.');
    if(!/^[A-Za-z0-9_.-]+$/.test(data.access_token)||!/^[A-Za-z0-9_-]{1,512}$/.test(data.refresh_token)) fail(503,'Sesi tidak sah.');
    res.setHeader('Set-Cookie',[
      `${accessCookie}=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
      `${refreshCookie}=${data.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`
    ]);
  };
  const clear=()=>res.setHeader('Set-Cookie',[accessCookie,refreshCookie].map(name=>`${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`));
  if(action==='pro-confirm') {
    isPost();if(!/^[a-f0-9]{32,128}$/.test(body.token_hash||'')) fail(400,'Pautan pengesahan tidak sah.');
    const {data}=await supabase('/auth/v1/verify',{method:'POST',service:false,body:{token_hash:body.token_hash,type:'signup'}});
    session(data);const next=data.user?.user_metadata?.return_tab;
    return res.status(200).json({next:['comparison','case','followup','appointment'].includes(next)?next:'case'});
  }
  if(action==='pro-login'||action==='pro-register') {
    isPost(); const email=text(body.email,254,true).toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof body.password!=='string'||body.password.length<8||body.password.length>256) fail(400,'Isi email sah dan password sekurang-kurangnya 8 aksara.');
    const next=['comparison','case','followup','appointment'].includes(body.tab)?body.tab:'case';
    let contact;
    if(action==='pro-register'){const name=text(body.name,100,true),whatsapp=phone(body.phone);if(/[\x00-\x1f]/.test(name)||!whatsapp||!/^\+601(?:1\d{8}|[02-9]\d{7})$/.test(whatsapp))fail(400,'Isi nama dan nombor WhatsApp Malaysia yang sah.');contact={name,whatsapp};}
    if(action==='pro-register') {
      if(email===process.env.ADMIN_EMAIL?.toLowerCase())fail(403,'Akaun admin dilindungi.');
      const {data:accepted}=await supabase('/rest/v1/rpc/car_save_download',{method:'POST',body:{request_id:crypto.randomUUID(),person_name:contact.name,whatsapp:contact.whatsapp,calculation:{kind:'pro-registration'},client_hash:crypto.createHash('sha256').update(String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown')).digest('hex')}});
      if(!accepted)fail(429,'Terlalu banyak percubaan. Cuba lagi sebentar.');
      try {
        await supabase('/auth/v1/admin/users',{method:'POST',body:{email,password:body.password,email_confirm:true,user_metadata:{return_tab:next,...contact,carloan_pro:true}}});
      }catch(error){
        if(error.status!==409)throw error;
        // A retry may follow a successful creation whose response never reached the phone.
        try {
          const {data}=await supabase('/auth/v1/token?grant_type=password',{method:'POST',service:false,body:{email,password:body.password}});
          if(data.user?.app_metadata?.pro_disabled)fail(403,'Akaun ejen telah dinyahaktifkan. Hubungi support.');
          session(data);return res.status(200).json({email:data.user.email});
        }catch(loginError){if(loginError.status===401)throw error;throw loginError;}
      }
    }
    const {data}=await supabase('/auth/v1/token?grant_type=password',{method:'POST',service:false,body:{email,password:body.password}});
    session(data);return res.status(200).json({email:data.user.email});
  }
  let token=readCookie(req,accessCookie), user;
  if(token&&/^[A-Za-z0-9_.-]+$/.test(token)) {
    try{({data:user}=await supabase('/auth/v1/user',{service:false,authToken:token}));}catch(e){if(e.status!==401) throw e;}
  }
  if(!user) {
    const refresh=readCookie(req,refreshCookie);
    if(!refresh||!/^[A-Za-z0-9_-]{1,512}$/.test(refresh)) fail(401,'Login ejen untuk menggunakan PRO.');
    let data;
    try{({data}=await supabase('/auth/v1/token?grant_type=refresh_token',{method:'POST',service:false,body:{refresh_token:refresh}}));}
    catch(error){if(error.status===401)clear();throw error;}
    session(data);token=data.access_token;user=data.user;
  }
  if(!user?.email_confirmed_at||!user.id) fail(401,'Sahkan email dan login semula.');
  if(user.app_metadata?.pro_disabled)fail(403,'Akaun ejen telah dinyahaktifkan. Hubungi support.');
  if(action==='pro-logout') {
    isPost();
    if(/^[a-f0-9]{64}$/.test(body.deviceToken||'')) {
      const hash=crypto.createHash('sha256').update(body.deviceToken).digest('hex');
      const {data}=await supabase('/rest/v1/car_push_subscriptions?token_hash=eq.'+hash+'&select=id');
      for(const subscription of data) await supabase('/rest/v1/car_agent_devices?subscription_id=eq.'+subscription.id+'&owner_id=eq.'+uuid(user.id),{method:'DELETE'});
    }
    await supabase('/auth/v1/logout?scope=local',{method:'POST',service:false,authToken:token});clear();return res.status(200).json({ok:true});
  }
  const active=Date.now()<Date.parse('2027-01-01T00:00:00+08:00');
  if(action==='pro-session'&&req.method==='GET') return res.status(200).json({email:user.email,active,freeUntil:'2026-12-31',remindersReady:Boolean(process.env.PRO_REMINDER_SECRET&&process.env.PRO_REMINDER_SCHEDULER==='enabled')});
  if(!active) fail(403,'Tempoh PRO percuma telah tamat. Hubungi support untuk akses. Tiada caj automatik.');
  const db=(path,opts={})=>supabase('/rest/v1/'+path,{...opts,service:false,authToken:token});
  if(action==='pro-counts'&&req.method==='GET') {
    const count=async path=>{
      const {headers}=await db(path,{headers:{Prefer:'count=exact'}});
      const total=headers.get('content-range')?.split('/')[1];
      if(!/^\d+$/.test(total||''))fail(503,'Jumlah rekod belum tersedia.');
      return Number(total);
    };
    const cases=await count('car_agent_cases?select=id&limit=0');
    const followup=await count('car_agent_cases?select=id&limit=0&status=not.in.(Rejected,Delivered,Cancelled)&activity_at=lte.'+encodeURIComponent(new Date(Date.now()-3*86400000).toISOString()));
    const appointment=await count('car_agent_appointments?select=id&limit=0&status=eq.Scheduled&starts_at=gte.'+encodeURIComponent(new Date().toISOString()));
    return res.status(200).json({case:cases,followup,appointment});
  }
  if(action==='pro-cases'&&req.method==='GET') {
    const {data}=await db('car_agent_cases?select=*&order=activity_at.desc&limit=1000');return res.status(200).json({records:data});
  }
  if(action==='pro-history'&&req.method==='GET') {
    const {data}=await db('car_agent_case_events?case_id=eq.'+uuid(req.query.id)+'&select=*&order=created_at.desc&limit=200');return res.status(200).json({records:data});
  }
  if(action==='pro-appointments'&&req.method==='GET') {
    const {data}=await db('car_agent_appointments?select=*&order=starts_at.asc&limit=1000');return res.status(200).json({records:data});
  }
  if(action==='pro-case-save'||action==='pro-appointment-save') {
    isPost();const id=uuid(body.id), normalized=phone(body.phone);
    if(!normalized) fail(400,'No WhatsApp Malaysia tidak sah.');
    const record={id,owner_id:user.id,name:text(body.name,100,true),phone:normalized};
    const table=action==='pro-case-save'?'car_agent_cases':'car_agent_appointments';
    if(table==='car_agent_cases') {
      if(!STATUSES.includes(body.status)) fail(400,'Status tidak sah.');
      Object.assign(record,{brand:text(body.brand,80,true),model:text(body.model,150,true),variant:text(body.variant,150,true),color:text(body.color||'',100),status:body.status,remark:text(body.remark||'',2000)});
    } else {
      const date=new Date(body.starts_at);
      if(!['Test Drive','Delivery'].includes(body.type)||!['Scheduled','Completed','Cancelled'].includes(body.status)||!Number.isFinite(date.getTime())||date.getUTCFullYear()<2026||date.getUTCFullYear()>2100) fail(400,'Tarikh atau jenis appointment tidak sah.');
      if(body.status==='Scheduled'&&date.getTime()<=Date.now()) fail(400,'Appointment mestilah pada masa akan datang.');
      Object.assign(record,{case_id:body.case_id?uuid(body.case_id):null,type:body.type,starts_at:date.toISOString(),location:text(body.location||'',300),notes:text(body.notes||'',2000),status:body.status});
    }
    // PATCH never inserts a foreign-owned UUID. RLS also guards every REST call.
    const {data}=await db(table+'?id=eq.'+id+'&select=id');
    if(data.length) await db(table+'?id=eq.'+id,{method:'PATCH',body:record});
    else await db(table,{method:'POST',body:record});
    return res.status(200).json({saved:true});
  }
  if(action==='pro-device') {
    isPost(); if(!pushReady()) fail(503,'Notification belum tersedia.');
    const subscription=validateSubscription(body.subscription);
    if(!/^[a-f0-9]{64}$/.test(body.deviceToken||'')) fail(400,'Token peranti tidak sah.');
    const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
    const {data}=await supabase(''+ '/rest/v1/car_push_subscriptions?endpoint_hash=eq.'+hash(subscription.endpoint)+'&token_hash=eq.'+hash(body.deviceToken)+'&enabled=eq.true&select=id');
    if(!data[0]) fail(403,'Aktifkan notification di Tetapan app dahulu.');
    await supabase('/rest/v1/car_agent_devices?on_conflict=subscription_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:{subscription_id:data[0].id,owner_id:user.id}});
    return res.status(200).json({linked:true});
  }
  fail(404,'Fungsi PRO tidak ditemui.');
};
module.exports.reminders=async function(req,res,{supabase,fail,pushReady}) {
  const expected=process.env.PRO_REMINDER_SECRET;
  const actual=String(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!expected||actual.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(expected))) fail(401,'Tidak dibenarkan.');
  if(!pushReady()) fail(503,'Notification belum tersedia.');
  webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
  const {data:rows}=await supabase('/rest/v1/rpc/car_agent_claim_reminders',{method:'POST',body:{}});
  let sent=0,failed=0;
  for(const row of rows) {
    const where=`appointment_id=eq.${row.appointment_id}&revision=eq.${row.revision}&offset_hours=eq.${row.offset_hours}&subscription_id=eq.${row.subscription_id}`;
    const {data:current}=await supabase(`/rest/v1/car_agent_appointments?id=eq.${row.appointment_id}&revision=eq.${row.revision}&status=eq.Scheduled&select=id`);
    if(!current.length) { await supabase('/rest/v1/car_agent_reminders?'+where,{method:'PATCH',body:{state:'failed',updated_at:new Date().toISOString()}});continue; }
    let state='sent';
    try {
      const time=new Date(row.starts_at).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'});
      await webpush.sendNotification(row.subscription,JSON.stringify({kind:'appointment',id:row.appointment_id,title:'Reminder '+row.type,message:row.offset_hours+' jam lagi · '+time}),{TTL:600,timeout:5000});sent++;
    } catch(e) { state='failed';failed++;if(e.statusCode===404||e.statusCode===410) await supabase('/rest/v1/car_push_subscriptions?id=eq.'+row.subscription_id,{method:'PATCH',body:{enabled:false}}); }
    await supabase('/rest/v1/car_agent_reminders?'+where,{method:'PATCH',body:{state,updated_at:new Date().toISOString()}});
  }
  return res.status(200).json({sent,failed});
};
module.exports.STATUSES=STATUSES;
module.exports.followupReminders=async(req,res,{supabase,fail,pushReady})=>{
  const expected=process.env.PRO_REMINDER_SECRET,actual=String(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!expected||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))fail(401,'Tidak dibenarkan.');
  if(!pushReady())fail(503,'Notification belum tersedia.');
  webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
  const {data:rows}=await supabase('/rest/v1/rpc/car_claim_followup_push',{method:'POST',body:{}});let sent=0,failed=0,index=0;
  const day=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
  async function worker(){while(index<rows.length){const row=rows[index++];let state='sent';try{await webpush.sendNotification(row.subscription,JSON.stringify({kind:'followup',id:day,title:'Follow Up hari ini',message:row.case_count+' case memerlukan follow up. Buka app untuk semak.'}),{TTL:3600,timeout:5000});sent++;}catch(error){state='failed';failed++;if(error.statusCode===404||error.statusCode===410)await supabase('/rest/v1/car_push_subscriptions?id=eq.'+row.subscription_id,{method:'PATCH',body:{enabled:false}});}await supabase('/rest/v1/car_agent_followup_push?day=eq.'+day+'&subscription_id=eq.'+row.subscription_id,{method:'PATCH',body:{state}});}}
  await Promise.all(Array.from({length:Math.min(5,rows.length)},worker));return res.status(200).json({sent,failed});
};
module.exports.phone=phone;
