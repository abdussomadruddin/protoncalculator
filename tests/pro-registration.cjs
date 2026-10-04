const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,created_at timestamptz default now(),raw_user_meta_data jsonb);");
    await db.exec(fs.readFileSync('backend/downloads.sql', 'utf8'));
    const old = '11111111-1111-4111-8111-111111111111';
    await db.query("insert into auth.users values($1,'2026-09-01T00:00:00Z', $2)", [old, {carloan_pro:true,name:'Existing',whatsapp:'+60173559147'}]);
    const sql = fs.readFileSync('backend/pro-registration.sql', 'utf8');
    await db.exec(sql);
    assert.equal((await db.query('select * from car_download_contacts')).rows.length, 1);
    assert.equal(new Date((await db.query('select created_at from car_download_contacts')).rows[0].created_at).toISOString(), '2026-09-01T00:00:00.000Z');
    await db.exec(sql);
    assert.equal((await db.query('select * from car_download_requests')).rows.length, 1);
    await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)', ['22222222-2222-4222-8222-222222222222', {carloan_pro:true,name:'New',whatsapp:'+601112345678'}]);
    assert.equal((await db.query('select * from car_download_contacts')).rows.length, 2);
    await assert.rejects(db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)', ['33333333-3333-4333-8333-333333333333', {carloan_pro:true,name:'Invalid',whatsapp:'invalid'}]));
    console.log('PASS registration sync: backfill, original dates, retry deduplication, valid new registration and invalid contact rejection.');
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
