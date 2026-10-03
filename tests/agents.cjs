const assert=require('node:assert/strict');
const manage=require('../lib/agents.cjs');
const id='11111111-1111-4111-8111-111111111111';
let calls=[];
const user={id,email:'agent@example.com',user_metadata:{carloan_pro:true,name:'Agent',whatsapp:'+60173559147'}};
async function run(action,body){calls=[];const res={status(n){this.code=n;return this;},json(data){this.data=data;return this;}};await manage({method:body?'POST':'GET',query:{action},body},res,{adminEmail:'admin@example.com',uuid:v=>v,fail:(s,m)=>{throw Error(s+':'+m);},supabase:async(path,options)=>{calls.push({path,options});return {data:path.includes('?page=')?{users:[user,{...user,email:'admin@example.com'}]}:path.includes('car_save')?true:user};}});return res;}
(async()=>{
  assert.equal((await run('manage-agent-list')).data.records.length,1);
  await assert.rejects(run('manage-agent-delete',{id,confirm:true,confirmEmail:'wrong'}));assert.equal(calls.length,1);
  await run('manage-agent-delete',{id,confirm:true,confirmEmail:user.email});assert.equal(calls[1].options.method,'PUT');assert.equal(calls[1].options.body.app_metadata.pro_disabled,true);assert.ok(!calls.some(c=>c.options?.method==='DELETE'));
  await run('manage-agent-edit',{id,email:user.email,name:'Updated',phone:'0173559147'});assert.equal(calls[1].options.body.user_metadata.whatsapp,'+60173559147');assert.equal(calls[2].options.body.whatsapp,'+60173559147');
  await assert.rejects(run('manage-agent-create',{email:user.email,name:'Agent',phone:'bad',password:'password123'}));
  await run('manage-agent-create',{email:user.email,name:'Agent',phone:'0173559147',password:'password123'});assert.equal(calls[0].options.body.email_confirm,true);assert.equal(calls[0].options.body.user_metadata.carloan_pro,true);
  console.log('PASS agent management: admin exclusion, double confirmation, non-destructive disable, contact edit sync and confirmed signup.');
})().catch(e=>{console.error(e);process.exitCode=1;});
