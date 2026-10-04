const assert=require('node:assert/strict');
const fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
(async()=>{
  const db=new PGlite();
  const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333',appt='44444444-4444-4444-8444-444444444444';
  try{
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
    await db.exec(fs.readFileSync('backend/schema.sql','utf8'));await db.exec(fs.readFileSync('backend/pro.sql','utf8'));
    await db.query('insert into auth.users values($1),($2)',[a,b]);
    const as=async(owner)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await db.exec('set role authenticated');};
    await as(a);
    await db.query("insert into public.car_agent_cases(id,owner_id,name,phone,brand,model,variant,status,remark) values($1,$2,'Customer','+60123456789','Proton','S70','Lite','Document collected','First')",[id,a]);
    assert.equal((await db.query('select * from public.car_agent_case_events')).rows.length,1);
    await db.exec('reset role');await db.query("update public.car_agent_cases set activity_at=now()-interval '4 days' where id=$1",[id]);
    // Trigger preserves activity_at; age fixtures must temporarily disable only the tested stamp.
    await db.exec('alter table public.car_agent_cases disable trigger car_case_stamp');await db.query("update public.car_agent_cases set activity_at=now()-interval '4 days' where id=$1",[id]);await db.exec('alter table public.car_agent_cases enable trigger car_case_stamp');
    await as(a);let before=(await db.query('select activity_at from public.car_agent_cases')).rows[0].activity_at;
    await db.query("update public.car_agent_cases set color='White',activity_at=now() where id=$1",[id]);
    assert.equal(new Date((await db.query('select activity_at from public.car_agent_cases')).rows[0].activity_at).getTime(),new Date(before).getTime(),'metadata does not reset follow up');
    await db.query("update public.car_agent_cases set remark='New remark' where id=$1",[id]);assert.equal((await db.query('select * from public.car_agent_case_events')).rows.length,2);
    assert.notEqual(new Date((await db.query('select activity_at from public.car_agent_cases')).rows[0].activity_at).getTime(),new Date(before).getTime());
    await assert.rejects(db.query('update public.car_agent_cases set owner_id=$1 where id=$2',[b,id]));
    await assert.rejects(db.query("insert into public.car_agent_case_events(case_id,owner_id,status,remark) values($1,$2,'Delivered','Fake')",[id,a]));
    await as(b);assert.equal((await db.query('select * from public.car_agent_cases')).rows.length,0);assert.equal((await db.query('select * from public.car_agent_case_events')).rows.length,0);
    assert.equal((await db.query("update public.car_agent_cases set status='Delivered' where id=$1 returning id",[id])).rows.length,0);
    await assert.rejects(db.query("insert into public.car_agent_appointments(id,owner_id,case_id,name,phone,type,starts_at) values($1,$2,$3,'Other','+60123456789','Delivery',now()+interval '1 day')",[appt,b,id]),'cannot link another owner case');
    await db.exec('reset role');await db.exec('set role anon');await assert.rejects(db.query('select * from public.car_agent_cases'));await assert.rejects(db.query('select * from public.car_agent_appointments'));await db.exec('reset role');
    await db.query("insert into public.car_push_subscriptions(endpoint_hash,token_hash,subscription) values('endpoint','token','{}')");const sid=(await db.query('select id from public.car_push_subscriptions')).rows[0].id;
    await db.query('insert into public.car_agent_devices values($1,$2)',[sid,a]);
    await as(a);await db.query("insert into public.car_agent_appointments(id,owner_id,name,phone,type,starts_at) values($1,$2,'Customer','+60123456789','Test Drive',now()+interval '59 minutes')",[appt,a]);await db.exec('reset role');
    let claims=(await db.query('select * from public.car_agent_claim_reminders()')).rows;assert.equal(claims.length,1);assert.equal(claims[0].offset_hours,1);assert.equal((await db.query('select * from public.car_agent_claim_reminders()')).rows.length,0);
    await as(a);await db.query("update public.car_agent_appointments set starts_at=now()+interval '3 hours 59 minutes' where id=$1",[appt]);await db.exec('reset role');claims=(await db.query('select * from public.car_agent_claim_reminders()')).rows;assert.equal(claims.length,1);assert.equal(claims[0].revision,2);assert.equal(claims[0].offset_hours,4);
    await as(a);await db.query("update public.car_agent_appointments set status='Cancelled' where id=$1",[appt]);await db.exec('reset role');assert.equal((await db.query('select * from public.car_agent_claim_reminders()')).rows.length,0);
    for(const hours of [24,72]){await as(a);await db.query("update public.car_agent_appointments set status='Scheduled', starts_at=now()+make_interval(hours=>$1)-interval '1 minute' where id=$2",[hours,appt]);await db.exec('reset role');claims=(await db.query('select * from public.car_agent_claim_reminders()')).rows;assert.equal(claims.length,1);assert.equal(claims[0].offset_hours,hours);}
    await db.exec("alter table auth.users add column raw_app_meta_data jsonb default '{}', add column email_confirmed_at timestamptz default now()");
    await db.exec(fs.readFileSync('backend/pro-followup.sql','utf8'));
    await db.exec(fs.readFileSync('supabase/migrations/20261004001942_agent_soft_delete.sql','utf8'));
    const events=(await db.query('select * from public.car_agent_case_events')).rows.length;
    before=(await db.query('select activity_at from public.car_agent_cases')).rows[0].activity_at;
    await as(b);assert.equal((await db.query('update public.car_agent_cases set agent_deleted_at=now() where id=$1 returning id',[id])).rows.length,0);
    await as(a);await db.query('update public.car_agent_cases set agent_deleted_at=now() where id=$1',[id]);
    await db.query('update public.car_agent_appointments set agent_deleted_at=now() where id=$1',[appt]);
    assert.equal((await db.query('select * from public.car_agent_cases where agent_deleted_at is null')).rows.length,0);
    assert.equal((await db.query('select * from public.car_agent_appointments where agent_deleted_at is null')).rows.length,0);
    await assert.rejects(db.query('update public.car_agent_cases set agent_deleted_at=null where id=$1',[id]));
    await assert.rejects(db.query('delete from public.car_agent_cases where id=$1',[id]));
    await db.exec('reset role');
    assert.equal((await db.query('select * from public.car_agent_cases')).rows.length,1);
    assert.equal((await db.query('select * from public.car_agent_appointments')).rows.length,1);
    assert.equal((await db.query('select * from public.car_agent_case_events')).rows.length,events);
    assert.equal(new Date((await db.query('select activity_at from public.car_agent_cases')).rows[0].activity_at).getTime(),new Date(before).getTime());
    assert.equal((await db.query('select * from public.car_agent_claim_reminders()')).rows.length,0);
    console.log('PASS PRO SQL: owner isolation, anonymous denial, immutable history, activity timestamps, linked case ownership, reminder offsets, revision and claim deduplication.');
  }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
