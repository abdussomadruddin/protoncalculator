const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await db.exec(fs.readFileSync(path.join(__dirname, '../backend/schema.sql'), 'utf8'));
    await db.exec(fs.readFileSync(path.join(__dirname, '../backend/analytics.sql'), 'utf8'));
    await db.exec(fs.readFileSync(path.join(__dirname, '../backend/analytics.sql'), 'utf8'));
    const permissions = await db.query("select tablename, rowsecurity from pg_tables where schemaname = 'public'");
    assert.equal(permissions.rows.length, 5); assert.ok(permissions.rows.every(row => row.rowsecurity));
    for (const role of ['anon', 'authenticated']) {
      const grants = await db.query("select has_table_privilege($1, 'public.car_push_subscriptions', 'select') as can_read, has_function_privilege($1, 'public.car_publish_announcement(text,text,text,text)', 'execute') as can_publish", [role]);
      assert.equal(grants.rows[0].can_read, false); assert.equal(grants.rows[0].can_publish, false);
      for (const table of ['car_visits', 'car_device_activity']) {
        assert.equal((await db.query('select has_table_privilege($1, $2, $3) as ok', [role, 'public.' + table, 'select'])).rows[0].ok, false);
      }
      assert.equal((await db.query("select has_function_privilege($1, 'public.car_admin_stats()', 'execute') as ok", [role])).rows[0].ok, false);
    }
    const sub = { endpoint: 'https://fcm.googleapis.com/test', keys: { p256dh: 'test', auth: 'test' } };
    const register = async (endpoint, token) => (await db.query('select public.car_register_subscription($1,$2,$3) as ok', [endpoint, token, sub])).rows[0].ok;
    assert.equal(await register('endpoint-one', 'owner-token'), true);
    assert.equal(await register('endpoint-one', 'foreign-token'), false);
    assert.equal(await register('endpoint-one', 'owner-token'), true);
    const publish = async title => (await db.query('select public.car_publish_announcement($1,$2,$3,$4) as result', [title, 'Message', 'https://example.com', 'Open'])).rows[0].result;
    const old = await publish('First'); const current = await publish('Second');
    assert.notEqual(old.id, current.id);
    assert.equal((await db.query('select count(*) as count from public.car_announcements where active')).rows[0].count, 1);
    const claim = async () => (await db.query('select * from public.car_claim_deliveries($1)', [current.id])).rows;
    const first = await claim(); assert.equal(first.length, 1);
    assert.equal((await claim()).length, 0);
    await db.query("update public.car_push_deliveries set updated_at = now() - interval '6 minutes' where announcement_id = $1", [current.id]);
    assert.equal((await claim()).length, 1);
    await db.query("update public.car_push_deliveries set state = 'sent' where announcement_id = $1", [current.id]);
    assert.equal((await claim()).length, 0);
    assert.equal(await register('endpoint-later', 'owner-token'), true);
    assert.equal((await claim()).length, 0, 'new subscriber not in previous broadcast snapshot');
    const summary = (await db.query('select public.car_delivery_summary($1) as result', [current.id])).rows[0].result;
    assert.deepEqual(summary, { sent: 1, failed: 0, processing: 0 });
    const device = 'a'.repeat(64), other = 'b'.repeat(64);
    const record = async (d, session, app, permission) => db.query('select public.car_record_activity($1,$2,$3,$4)', [d, session, app, permission]);
    await record(device, '1'.repeat(64), true, 'granted');
    await record(device, '1'.repeat(64), true, 'granted');
    await record(device, '2'.repeat(64), true, 'granted');
    await record(other, '3'.repeat(64), false, 'default');
    await register('analytics-endpoint', device);
    await register('rotated-endpoint', device);
    await db.query("update public.car_push_subscriptions set enabled = false where token_hash = 'owner-token'");
    let stats = (await db.query('select public.car_admin_stats() as stats')).rows[0].stats;
    assert.deepEqual(stats.traffic, [1, 7, 30].map(days => ({ days, visits: 2, devices: 2 })));
    assert.equal(stats.notifications, 1, 'rotated subscriptions count once');
    assert.equal(stats.phoneApps, 1); assert.equal(stats.phoneAppsWithNotifications, 1);
    await db.query("update public.car_visits set created_at = now() - interval '8 days' where token_hash = $1", [other]);
    await record(device, null, false, 'denied');
    stats = (await db.query('select public.car_admin_stats() as stats')).rows[0].stats;
    assert.deepEqual(stats.traffic, [{ days: 1, visits: 1, devices: 1 }, { days: 7, visits: 1, devices: 1 }, { days: 30, visits: 2, devices: 2 }]);
    assert.equal(stats.notifications, 0); assert.equal(stats.phoneAppsWithNotifications, 0); assert.equal(stats.phoneApps, 1);
    console.log('PASS SQL: valid schema, RLS/private grants, device-token ownership, single active popup, durable claims/retries, recipient snapshot, summaries.');
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
