const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const handler = require('../api/app');
const originalFetch = global.fetch;
const originalEnv = { ...process.env };
Object.assign(process.env, { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'private-service-key', SUPABASE_PUBLISHABLE_KEY: 'public-key', ADMIN_EMAIL: 'lurbaymarketing@gmail.com', APP_ORIGIN: 'https://protoncalculator.vercel.app' });
after(() => { global.fetch = originalFetch; process.env = originalEnv; });
async function request(action, { method = 'GET', body, cookie, id, origin = 'https://protoncalculator.vercel.app' } = {}) {
  const req = { query: { action, id }, method, body, headers: { origin, 'content-type': 'application/json', cookie } };
  const res = { headers: {}, code: null, data: null, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; }, end(data) { this.data = data; } };
  await handler(req, res); return res;
}
test('public config cannot expose private credentials', async () => {
  const res = await request('config'); assert.equal(res.code, 200); assert.ok(res.data.ready);
  assert.ok(!JSON.stringify(res.data).includes('private-service-key'));
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.equal((await request('admin')).code, 503); process.env.SUPABASE_SERVICE_ROLE_KEY = key;
});
test('persistent admin session rotates refresh cookie for 365 days without exposing tokens', async () => {
  const access = 'header.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
  global.fetch = async (url,options) => {
    if(url.includes('grant_type=refresh_token')) {
      assert.equal(JSON.parse(options.body).refresh_token,'existing-refresh');
      return new Response(JSON.stringify({access_token:access,refresh_token:'rotated-refresh',user:{email:process.env.ADMIN_EMAIL,email_confirmed_at:'2026-01-01'}}));
    }
    return new Response('[]');
  };
  const res=await request('downloads',{cookie:'__Host-carloan-admin-refresh=existing-refresh'});
  assert.equal(res.code,200);
  assert.ok(res.headers['Set-Cookie'].some(cookie=>cookie.includes('rotated-refresh') && cookie.includes('Max-Age=31536000') && cookie.includes('HttpOnly; Secure; SameSite=Strict')));
  assert.ok(!JSON.stringify(res.data).includes('rotated-refresh'));
  const logout=await request('logout',{method:'POST',body:{},cookie:'__Host-carloan-admin-refresh=existing-refresh'});
  assert.equal(logout.headers['Set-Cookie'].length,2);
  assert.ok(logout.headers['Set-Cookie'].every(cookie=>cookie.includes('Max-Age=0')));
});
test('notification deep link fetches only the requested active announcement', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  global.fetch = async url => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('active'), 'eq.true');
    assert.equal(parsed.searchParams.get('id'), 'eq.' + id);
    assert.equal(parsed.searchParams.get('select'), 'id,title,message,link_url,link_label');
    return new Response('[]');
  };
  assert.deepEqual((await request('announcement', { id })).data, { announcement: null });
  assert.equal((await request('announcement', { id: 'invalid&active=eq.false' })).code, 400);
});
test('unauthenticated visitors cannot publish, deactivate, send, or read admin data', async () => {
  global.fetch = () => { throw new Error('Unexpected backend request'); };
  for (const action of ['publish', 'deactivate', 'broadcast']) {
    const res = await request(action, { method: 'POST', body: {} }); assert.equal(res.code, 401);
  }
  assert.equal((await request('admin')).code, 401);
  assert.equal((await request('stats')).code, 401);
  assert.equal((await request('downloads')).code, 401);
  assert.equal((await request('downloads-excel')).code, 401);
});
test('download requests validate contact, origin and calculation before storage', async () => {
  const principal = 60000;
  const body = {id:'11111111-1111-4111-8111-111111111111',name:'Test',phone:'0123456789',snapshot:{brand:'Proton',model:'S70',variant:'Lite',loanPeriod:9,inputPrice:60000,rebate:0,extras:0,insurance:0,depositAmount:0,loanAfterDeposit:principal,interestRate:2.5,ncd:0,baseMonthly:principal*1.175/84,selectedMonthly:principal*1.225/108,batteryMonthly:0}};
  global.fetch = async (url, options) => {
    assert.ok(url.endsWith('/rpc/car_save_download'));
    const payload=JSON.parse(options.body);
    assert.equal(payload.whatsapp,'+60123456789');
    assert.equal(payload.request_id,body.id);
    return new Response('true');
  };
  assert.equal((await request('download-request',{method:'POST',body})).code,200);
  assert.equal((await request('download-request',{method:'POST',body,origin:'https://evil.test'})).code,403);
  assert.equal((await request('download-request',{method:'POST',body:{...body,phone:'123'}})).code,400);
  assert.equal((await request('download-request',{method:'POST',body:{...body,snapshot:{...body.snapshot,selectedMonthly:1}}})).code,400);
  global.fetch=async()=>new Response('false');
  assert.equal((await request('download-request',{method:'POST',body})).code,429);
});
test('activity validates input, hashes identifiers and never returns aggregate data publicly', async () => {
  const body = { deviceToken: 'a'.repeat(64), sessionToken: 'b'.repeat(64), phoneApp: true, permission: 'granted' };
  assert.equal((await request('activity', { method: 'POST', body: { ...body, permission: 'invalid' } })).code, 400);
  assert.equal((await request('activity', { method: 'POST', body, origin: 'https://evil.test' })).code, 403);
  global.fetch = async (url, options) => {
    assert.ok(url.endsWith('/rpc/car_record_activity'));
    const payload = JSON.parse(options.body);
    assert.notEqual(payload.device_hash, body.deviceToken); assert.equal(payload.phone_app, true);
    return new Response('true');
  };
  assert.deepEqual((await request('activity', { method: 'POST', body })).data, { recorded: true });
});
test('comparison snapshots validate both cars and preserve legacy downloads', async () => {
  const car = {brand:'Proton',model:'S70',variant:'Lite',loanPeriod:9,inputPrice:60000,rebate:0,extras:0,insurance:0,insuranceOption:'exclude',depositAmount:0,loanAfterDeposit:60000,interestRate:2.5,ncd:0,baseMonthly:60000*1.175/84,selectedMonthly:60000*1.225/108,batteryMonthly:0};
  const body = {id:'11111111-1111-4111-8111-111111111111',name:'Test',phone:'0123456789',snapshot:{version:2,cars:[car,{...car,brand:'Perodua',batteryMonthly:275}]}};
  global.fetch = async (url,options) => {const data=JSON.parse(options.body);assert.equal(data.calculation.cars.length,2);assert.equal(data.calculation.cars[1].batteryMonthly,275);return new Response('true');};
  assert.equal((await request('download-request',{method:'POST',body})).code,200);
  for(const cars of [[],[car,car,car],[car,{...car,loanAfterDeposit:1}],[car,{...car,insuranceOption:'with'}]]) {
    assert.equal((await request('download-request',{method:'POST',body:{...body,snapshot:{version:2,cars}}})).code,400);
  }
});
test('admin Excel exports two cars as text-safe contact rows', async () => {
  const car = {brand:'Proton',model:'S70',variant:'Lite',loanPeriod:9,inputPrice:60000,selectedMonthly:700};
  global.fetch = async url => {
    if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify({email:process.env.ADMIN_EMAIL,email_confirmed_at:'2026-01-01'}));
    return new Response(JSON.stringify([{id:'test',created_at:'2026-10-04T00:00:00Z',name:'=HYPERLINK("bad")',whatsapp:'+60123456789',snapshot:{version:2,cars:[car,{...car,brand:'Perodua'}]}}]));
  };
  const res=await request('downloads-excel',{cookie:'__Host-carloan-admin=valid.jwt.token'});
  const ExcelJS=require('exceljs'),book=new ExcelJS.Workbook();await book.xlsx.load(res.data);
  const sheet=book.worksheets[0];assert.equal(sheet.getCell('C2').type,ExcelJS.ValueType.String);assert.equal(sheet.getCell('D2').value,'+60123456789');assert.equal(sheet.getCell('E2').value,'Proton');assert.equal(sheet.getCell('T2').value,'Perodua');
});
test('only authenticated admin can retrieve aggregated statistics', async () => {
  global.fetch = async url => {
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ email: process.env.ADMIN_EMAIL, email_confirmed_at: '2026-09-30' }));
    assert.ok(url.endsWith('/rpc/car_admin_stats'));
    return new Response(JSON.stringify({ traffic: [], notifications: 5 }));
  };
  const response = await request('stats', { cookie: '__Host-carloan-admin=valid.jwt.token' });
  assert.equal(response.code, 200); assert.equal(response.data.notifications, 5);
});
test('cross-origin writes and wrong admin email denied before upstream work', async () => {
  assert.equal((await request('publish', { method: 'POST', origin: 'https://evil.example', body: {} })).code, 403);
  assert.equal((await request('login', { method: 'POST', body: { email: 'stranger@example.com' } })).code, 401);
});
test('all official production aliases accept writes but foreign and spoofed origins do not', async () => {
  global.fetch = () => { throw new Error('Validation must precede backend request'); };
  for (const origin of ['https://protoncalculator.vercel.app', 'https://carloanmalaysia.vercel.app', 'https://protoncalculator-abdussomadruddin-projects.vercel.app']) {
    assert.equal((await request('login', { method: 'POST', origin, body: {} })).code, 401);
  }
  for (const origin of [undefined, 'null', 'http://carloanmalaysia.vercel.app', 'https://carloanmalaysia.vercel.app.evil.test', 'https://evil.test']) {
    assert.equal((await request('login', { method: 'POST', origin: origin ?? 'null', body: {} })).code, 403);
  }
});
test('safe announcement URLs and push provider endpoints', () => {
  for (const link of ['javascript:alert(1)', 'http://example.com', 'https://user:password@example.com', 'data:text/html,hello']) assert.throws(() => handler.httpsLink(link));
  assert.equal(handler.httpsLink('https://example.com/promo'), 'https://example.com/promo');
  const keys = { p256dh: Buffer.alloc(65, 1).toString('base64url'), auth: Buffer.alloc(16, 2).toString('base64url') };
  for (const endpoint of ['https://localhost/admin', 'https://169.254.169.254/latest', 'http://fcm.googleapis.com/a', 'https://fcm.googleapis.com.evil.com/a', 'https://fcm.googleapis.com:8080/a']) assert.throws(() => handler.validateSubscription({ endpoint, keys }));
  for (const endpoint of ['https://fcm.googleapis.com/fcm/send/a', 'https://web.push.apple.com/Q/a', 'https://updates.push.services.mozilla.com/wpush/v2/a', 'https://wns2-db5p.notify.windows.com/w/?token=test']) assert.equal(handler.validateSubscription({ endpoint, keys }).endpoint, endpoint);
  for (const endpoint of ['https://notify.windows.com.evil.test/a', 'https://evilnotify.windows.com/a']) assert.throws(() => handler.validateSubscription({ endpoint, keys }));
  assert.throws(() => handler.validateSubscription({ endpoint: 'https://fcm.googleapis.com/a', keys: { p256dh: 'short', auth: 'short' } }));
});
test('non-admin and unconfirmed accounts cannot use admin API', async () => {
  for (const user of [{ email: 'stranger@example.com', email_confirmed_at: '2026-09-30' }, { email: 'lurbaymarketing@gmail.com' }]) {
    global.fetch = async () => new Response(JSON.stringify(user), { status: 200 });
    assert.equal((await request('admin', { cookie: '__Host-carloan-admin=valid.jwt.token' })).code, 403);
  }
});
test('password login verifies admin and creates a secure HttpOnly session without exposing tokens', async () => {
  const jwt = 'header.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url') + '.signature';
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://test.supabase.co/auth/v1/token?grant_type=password');
    assert.equal(JSON.parse(options.body).password, 'test-only-password');
    return new Response(JSON.stringify({ access_token: jwt, user: { email: 'lurbaymarketing@gmail.com', email_confirmed_at: '2026-09-30' } }), { status: 200 });
  };
  const res = await request('login', { method: 'POST', body: { email: 'lurbaymarketing@gmail.com', password: 'test-only-password' } });
  assert.equal(res.code, 200); assert.match(res.headers['Set-Cookie'], /HttpOnly; Secure; SameSite=Strict/);
  assert.ok(!JSON.stringify(res.data).includes(jwt));
});
test('missing and incorrect passwords fail without a session', async () => {
  assert.equal((await request('login', { method: 'POST', body: { email: 'lurbaymarketing@gmail.com' } })).code, 401);
  global.fetch = async () => new Response('{"error":"invalid_grant"}', { status: 400 });
  const result = await request('login', { method: 'POST', body: { email: 'lurbaymarketing@gmail.com', password: 'wrong-test-password' } });
  assert.equal(result.code, 401); assert.equal(result.headers['Set-Cookie'], undefined);
});
test('publishing starts push in the same request and preserves ID on push failure', async () => {
  Object.assign(process.env, { VAPID_PUBLIC_KEY: 'test', VAPID_PRIVATE_KEY: 'test', VAPID_SUBJECT: 'mailto:test@example.com' });
  const id = '00000000-0000-4000-8000-000000000001';
  let publishCalls = 0, pushCalls = 0;
  global.fetch = async url => {
    if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify({ email: 'lurbaymarketing@gmail.com', email_confirmed_at: '2026-09-30' }));
    if (url.endsWith('/rpc/car_publish_announcement')) { publishCalls++; return new Response(JSON.stringify({ id })); }
    if (url.includes('/car_announcements?id=')) { pushCalls++; return new Response('[]'); }
    throw new Error('Unexpected URL');
  };
  const res = await request('publish', { method: 'POST', cookie: '__Host-carloan-admin=valid.jwt.token', body: { title: 'Test', message: 'Test message' } });
  assert.equal(res.code, 200); assert.equal(res.data.announcement.id, id); assert.ok(res.data.pushError);
  assert.equal(publishCalls, 1); assert.equal(pushCalls, 1);
});
test('backend error details never leak publicly', async () => {
  global.fetch = async () => new Response('{"message":"private SQL and keys private-service-key"}', { status: 500 });
  const res = await request('announcement'); assert.equal(res.code, 503);
  assert.ok(!JSON.stringify(res.data).includes('private-service-key'));
});
