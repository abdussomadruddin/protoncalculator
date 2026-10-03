const assert=require('node:assert/strict');
const {test,after}=require('node:test');
const handler=require('../api/app');
const originalFetch=global.fetch,env={...process.env};
Object.assign(process.env,{SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'service-secret',SUPABASE_PUBLISHABLE_KEY:'public-key',ADMIN_EMAIL:'admin@test.example'});
after(()=>{global.fetch=originalFetch;process.env=env;});
const user={id:'11111111-1111-4111-8111-111111111111',email:'agent@test.example',email_confirmed_at:'2026-01-01'};
const id='33333333-3333-4333-8333-333333333333';
async function request(action,{body,method=body?'POST':'GET',cookie='__Host-carloan-agent=access-token',origin='https://carloanmalaysia.vercel.app',authorization}={}){
  const req={query:{action},method,body,headers:{origin,cookie,authorization,'content-type':'application/json'}};
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;}};
  await handler(req,res);return res;
}
test('anonymous calculator remains public; PRO requires separate agent session, not admin cookie',async()=>{
  global.fetch=()=>{throw new Error('No upstream expected');};
  assert.equal((await request('config',{cookie:''})).code,200);
  for(const action of ['pro-session','pro-cases','pro-appointments','pro-history'])assert.equal((await request(action,{cookie:'__Host-carloan-admin=admin-token'})).code,401);
});
test('agent login and registration use password auth and HttpOnly cookies, never admin grants',async()=>{
  global.fetch=async(url,opts)=>{assert.ok(url.includes('grant_type=password'));assert.equal(opts.headers.apikey,'public-key');return new Response(JSON.stringify({access_token:'access-token',refresh_token:'refresh-token',user}));};
  const res=await request('pro-login',{body:{email:user.email,password:'password123'}});assert.equal(res.code,200);assert.ok(res.headers['Set-Cookie'].every(c=>c.includes('HttpOnly; Secure; SameSite=Strict')&&!c.includes('carloan-admin')));assert.deepEqual(res.data,{email:user.email});
  assert.equal((await request('pro-login',{body:{email:user.email,password:'short'}})).code,400);
  assert.equal((await request('pro-register',{body:{email:user.email,password:'password123'}})).code,400);
  const calls=[];global.fetch=async(url,opts)=>{calls.push(url);const body=JSON.parse(opts.body);if(url.includes('/rpc/car_save_download'))return new Response('true');if(url.endsWith('/auth/v1/admin/users')){assert.equal(body.email_confirm,true);assert.equal(body.user_metadata.whatsapp,'+60173559147');assert.equal(opts.headers.apikey,'service-secret');return new Response(JSON.stringify(user));}assert.ok(url.includes('grant_type=password'));return new Response(JSON.stringify({access_token:'access-token',refresh_token:'refresh-token',user}));};
  const registered=await request('pro-register',{body:{email:user.email,password:'password123',name:'Agent',phone:'0173559147'}});assert.equal(registered.code,200);assert.deepEqual(registered.data,{email:user.email});assert.equal(registered.headers['Set-Cookie'].length,2);assert.ok(!calls.some(url=>url.includes('/signup')));
  global.fetch=async()=>new Response(JSON.stringify({user:{...user,email_confirmed_at:null}}));
  assert.equal((await request('pro-login',{body:{email:user.email,password:'password123'}})).code,401);
});
test('refresh restores only agent session and no private token is returned',async()=>{
  global.fetch=async url=>{assert.ok(url.includes('grant_type=refresh_token'));return new Response(JSON.stringify({access_token:'new-access',refresh_token:'new-refresh',user}));};
  const res=await request('pro-session',{cookie:'__Host-carloan-agent-refresh=old-refresh'});assert.equal(res.code,200);assert.equal(res.data.email,user.email);assert.ok(!JSON.stringify(res.data).includes('refresh'));assert.equal(res.headers['Set-Cookie'].length,2);assert.ok(res.headers['Set-Cookie'].some(cookie=>cookie.includes('carloan-agent-refresh=')&&cookie.includes('Max-Age=31536000')));
});
test('duplicate registration retries authenticate password without overwriting existing account',async()=>{
  let valid=true,writes=0;
  global.fetch=async(url,opts)=>{
    if(url.includes('/rpc/car_save_download'))return new Response('true');
    if(url.endsWith('/auth/v1/admin/users')){writes++;return new Response(JSON.stringify({error_code:'email_exists'}),{status:422});}
    assert.ok(url.includes('grant_type=password'));
    return valid?new Response(JSON.stringify({access_token:'access-token',refresh_token:'refresh-token',user})):new Response(JSON.stringify({error_code:'invalid_credentials'}),{status:400});
  };
  const body={email:user.email,password:'password123',name:'Agent',phone:'0173559147'};
  const retry=await request('pro-register',{body});assert.equal(retry.code,200);assert.equal(retry.headers['Set-Cookie'].length,2);assert.equal(writes,1);
  valid=false;const denied=await request('pro-register',{body});assert.equal(denied.code,409);assert.match(denied.data.error,/sudah didaftarkan/);assert.ok(!denied.headers['Set-Cookie']);
});
test('invalid refresh cookie is cleared instead of being repeatedly retried',async()=>{
  global.fetch=async()=>new Response(JSON.stringify({error_code:'refresh_token_not_found'}),{status:400});
  const denied=await request('pro-session',{cookie:'__Host-carloan-agent-refresh=expired-token'});assert.equal(denied.code,401);assert.ok(denied.headers['Set-Cookie'].every(cookie=>cookie.includes('Max-Age=0')));
});
test('PRO REST reads use verified user JWT and public key so RLS is not bypassed',async()=>{
  global.fetch=async(url,opts)=>{assert.equal(opts.headers.apikey,'public-key');assert.equal(opts.headers.Authorization,'Bearer access-token');return new Response(JSON.stringify(url.endsWith('/auth/v1/user')?user:[]));};
  assert.equal((await request('pro-cases')).code,200);assert.equal((await request('pro-appointments')).code,200);
  assert.equal((await request('admin')).code,401,'agent cookie not global admin session');
});
test('tab badges count exact private rows and apply follow-up and appointment filters',async()=>{
  const paths=[];global.fetch=async(url,opts)=>{
    assert.equal(opts.headers.apikey,'public-key');assert.equal(opts.headers.Authorization,'Bearer access-token');
    if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(user));
    paths.push(url);assert.equal(opts.headers.Prefer,'count=exact');assert.ok(url.includes('limit=0'));
    return new Response('[]',{headers:{'content-range':'*/'+[1200,3,0][paths.length-1]}});
  };
  const result=await request('pro-counts');assert.equal(result.code,200);assert.deepEqual(result.data,{case:1200,followup:3,appointment:0});assert.ok(paths[1].includes('status=not.in.(Rejected,Delivered,Cancelled)'));assert.ok(paths[1].includes('activity_at=lte.'));assert.ok(paths[2].includes('status=eq.Scheduled'));assert.ok(paths[2].includes('starts_at=gte.'));
  assert.equal((await request('pro-counts',{cookie:''})).code,401);
});
test('case validation, owner assigned server-side and forbidden statuses rejected',async()=>{
  let writes=[];global.fetch=async(url,opts)=>{if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(user));if(opts.method==='POST')writes.push(JSON.parse(opts.body));return new Response('[]');};
  const body={id,name:'Customer',phone:'0173559147',brand:'Proton',model:'S70',variant:'Lite',color:'White',remark:'Ready',status:'Document collected',owner_id:'attacker'};
  assert.equal((await request('pro-case-save',{body})).code,200);assert.equal(writes[0].owner_id,user.id);assert.equal(writes[0].phone,'+60173559147');
  for(const status of ['Waiting ehakmilik','Grant & roadtax collected','Fake'])assert.equal((await request('pro-case-save',{body:{...body,status}})).code,400);
  assert.equal((await request('pro-case-save',{body:{...body,phone:'123'}})).code,400);
  assert.equal((await request('pro-case-save',{body,origin:'https://evil.test'})).code,403);
});
test('appointment validates timezone, future time and type; cron rejects missing or wrong secret',async()=>{
  let saved;global.fetch=async(url,opts)=>{if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(user));if(opts.method==='POST')saved=JSON.parse(opts.body);return new Response('[]');};
  const body={id,name:'Customer',phone:'+60123456789',type:'Delivery',starts_at:'2026-12-01T10:00:00+08:00',status:'Scheduled',case_id:''};
  assert.equal((await request('pro-appointment-save',{body})).code,200);assert.equal(saved.starts_at,'2026-12-01T02:00:00.000Z');
  assert.equal((await request('pro-appointment-save',{body:{...body,starts_at:'bad'}})).code,400);
  assert.equal((await request('pro-appointment-save',{body:{...body,starts_at:'2020-01-01'}})).code,400);
  assert.equal((await request('pro-reminders',{body:{},authorization:'Bearer invalid'})).code,401);
  process.env.PRO_REMINDER_SECRET='secret-value';assert.equal((await request('pro-reminders',{body:{},authorization:'Bearer invalid'})).code,401);
});
