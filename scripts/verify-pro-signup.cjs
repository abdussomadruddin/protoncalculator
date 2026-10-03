const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const origin='https://carloanmalaysia.vercel.app';
const marker='signup-check-'+crypto.randomUUID();
const email=marker+'@example.com';
const password=crypto.randomBytes(24).toString('base64url');
const body={name:marker,phone:'0100000000',email,password};
let userID;
async function admin(path,options={}) {
  const response=await fetch(process.env.SUPABASE_URL+path,{...options,headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,...options.headers}});
  assert.ok(response.ok,'Verification cleanup/backend request failed: '+response.status);
  return response;
}
async function signup(value=body) {
  return fetch(origin+'/api/app?action=pro-register',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(value)});
}
(async()=>{
  assert.ok(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY,'Load local backend environment first.');
  try {
    const response=await signup();assert.equal(response.status,200,'Fresh signup failed');
    const cookie=response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
    assert.ok(cookie.includes('__Host-carloan-agent='));
    const session=await fetch(origin+'/api/app?action=pro-session',{headers:{Cookie:cookie}});
    assert.equal(session.status,200);assert.equal((await session.json()).email,email);
    const lookup=await admin('/auth/v1/admin/users?page=1&per_page=1000');
    const found=(await lookup.json()).users.find(user=>user.email===email);assert.ok(found);userID=found.id;
    const cases=await fetch(origin+'/api/app?action=pro-cases',{headers:{Cookie:cookie}});assert.equal(cases.status,200);assert.deepEqual((await cases.json()).records,[]);
    assert.equal((await signup()).status,200,'Duplicate retry with correct password failed');
    assert.equal((await signup({...body,password:crypto.randomBytes(24).toString('base64url')})).status,409,'Wrong password must not unlock existing account');
    console.log('PASS live signup, automatic session, private cases, duplicate retry and wrong-password denial. No email sent.');
  }finally {
    if(!userID){const lookup=await admin('/auth/v1/admin/users?page=1&per_page=1000');userID=(await lookup.json()).users.find(user=>user.email===email)?.id;}
    if(userID)await admin('/auth/v1/admin/users/'+userID,{method:'DELETE'});
    await admin('/rest/v1/car_download_requests?name=eq.'+encodeURIComponent(marker),{method:'DELETE'});
    console.log('Transient verification account and its contact records removed.');
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
