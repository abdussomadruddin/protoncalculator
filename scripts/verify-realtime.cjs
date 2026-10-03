const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {RealtimeClient}=require('@supabase/realtime-js');
process.loadEnvFile('.env.local');
const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
const users=[],clients=[];
async function api(path,body,token=service,publicKey=false,method=body?'POST':'GET'){
  const response=await fetch(base+path,{method,headers:{apikey:publicKey?key:service,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>null);if(!response.ok)throw Error(path+' HTTP '+response.status);return data;
}
async function account(){
  const email='realtime-test-'+crypto.randomUUID()+'@example.com',password=crypto.randomBytes(24).toString('hex');
  const user=await api('/auth/v1/admin/users',{email,password,email_confirm:true});users.push(user.id);
  return api('/auth/v1/token?grant_type=password',{email,password},key,true);
}
async function subscribe(token,table,filter,events){
  const client=new RealtimeClient(base+'/realtime/v1',{params:{apikey:key}});clients.push(client);if(token)await client.setAuth(token);
  const channel=client.channel('verify-'+crypto.randomUUID());
  channel.on('system',{},event=>{if(event.status==='error')console.error('Realtime server error:',event.message);});
  channel.on('postgres_changes',{event:'*',schema:'public',table,...(filter?{filter}:{})},event=>events.push(event));
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Realtime subscription timeout')),15000);channel.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timeout);resolve();}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timeout);reject(Error(status));}});});
}
async function received(events,type){const deadline=Date.now()+10000;while(Date.now()<deadline){if(events.some(event=>event.eventType===type))return;await new Promise(resolve=>setTimeout(resolve,50));}throw Error('Missing '+type+' event');}
(async()=>{
  try{
    const [a,b]=[await account(),await account()],caseEvents=[],otherEvents=[],meetingEvents=[],publicEvents=[];
    const publicRows=await api('/rest/v1/car_live_signals?select=topic',undefined,key,true);
    assert.deepEqual(publicRows,[{topic:'announcements'}]);
    await subscribe(a.access_token,'car_agent_cases','owner_id=eq.'+a.user.id,caseEvents);
    await subscribe(b.access_token,'car_agent_cases',null,otherEvents);
    await subscribe(a.access_token,'car_agent_appointments','owner_id=eq.'+a.user.id,meetingEvents);
    await subscribe(null,'car_live_signals','topic=eq.announcements',publicEvents);
    const id=crypto.randomUUID();
    await api('/rest/v1/car_agent_cases',{id,owner_id:a.user.id,name:'Temporary realtime verification',phone:'+60123456789',brand:'Proton',model:'S70',variant:'Lite',status:'Submission',remark:'Initial'},a.access_token,true);
    try{await received(caseEvents,'INSERT');}catch(error){console.error('Case subscription received event types:',caseEvents.map(event=>event.eventType));throw error;}
    await api('/rest/v1/car_agent_cases?id=eq.'+id,{remark:'Updated'},a.access_token,true,'PATCH');
    await received(caseEvents,'UPDATE');
    await api('/rest/v1/car_agent_appointments',{id:crypto.randomUUID(),owner_id:a.user.id,name:'Temporary realtime verification',phone:'+60123456789',type:'Test Drive',starts_at:new Date(Date.now()+86400000).toISOString(),status:'Scheduled'},a.access_token,true);
    await received(meetingEvents,'INSERT');
    await new Promise(resolve=>setTimeout(resolve,500));assert.equal(otherEvents.length,0,'Another owner must not receive private events');
    assert.equal(publicEvents.length,0,'Private writes must not become public announcement signals');
    // An unmatched update exercises the signal trigger without editing or publishing an announcement.
    await api('/rest/v1/car_announcements?id=eq.'+crypto.randomUUID(),{active:false},service,false,'PATCH');
    await received(publicEvents,'UPDATE');assert.ok(publicEvents.every(event=>event.new.topic==='announcements'));
    console.log('PASS live Supabase: case INSERT/UPDATE, appointment INSERT, owner isolation, public announcement signal delivery, anonymous admin denial.');
  }finally{
    for(const client of clients){await client.removeAllChannels();await client.disconnect();}
    for(const id of users)await api('/auth/v1/admin/users/'+id,undefined,service,false,'DELETE');
    console.log('Temporary test accounts and their case/appointment data removed.');
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
