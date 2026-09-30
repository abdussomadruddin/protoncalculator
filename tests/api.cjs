const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const handler = require('../api/app');
const originalFetch = global.fetch;
const originalEnv = { ...process.env };
Object.assign(process.env, { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'private-service-key', SUPABASE_PUBLISHABLE_KEY: 'public-key', ADMIN_EMAIL: 'lurbaymarketing@gmail.com', APP_ORIGIN: 'https://protoncalculator.vercel.app' });
after(() => { global.fetch = originalFetch; process.env = originalEnv; });
async function request(action, { method = 'GET', body, cookie, origin = 'https://protoncalculator.vercel.app' } = {}) {
  const req = { query: { action }, method, body, headers: { origin, 'content-type': 'application/json', cookie } };
  const res = { headers: {}, code: null, data: null, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  await handler(req, res); return res;
}
test('public config cannot expose private credentials', async () => {
  const res = await request('config'); assert.equal(res.code, 200); assert.ok(res.data.ready);
  assert.ok(!JSON.stringify(res.data).includes('private-service-key'));
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.equal((await request('admin')).code, 503); process.env.SUPABASE_SERVICE_ROLE_KEY = key;
});
test('unauthenticated visitors cannot publish, deactivate, send, or read admin data', async () => {
  global.fetch = () => { throw new Error('Unexpected backend request'); };
  for (const action of ['publish', 'deactivate', 'broadcast']) {
    const res = await request(action, { method: 'POST', body: {} }); assert.equal(res.code, 401);
  }
  assert.equal((await request('admin')).code, 401);
});
test('cross-origin writes and wrong admin email denied before upstream work', async () => {
  assert.equal((await request('publish', { method: 'POST', origin: 'https://evil.example', body: {} })).code, 403);
  assert.equal((await request('login', { method: 'POST', body: { email: 'stranger@example.com' } })).code, 401);
});
test('safe announcement URLs and push provider endpoints', () => {
  for (const link of ['javascript:alert(1)', 'http://example.com', 'https://user:password@example.com', 'data:text/html,hello']) assert.throws(() => handler.httpsLink(link));
  assert.equal(handler.httpsLink('https://example.com/promo'), 'https://example.com/promo');
  const keys = { p256dh: Buffer.alloc(65, 1).toString('base64url'), auth: Buffer.alloc(16, 2).toString('base64url') };
  for (const endpoint of ['https://localhost/admin', 'https://169.254.169.254/latest', 'http://fcm.googleapis.com/a', 'https://fcm.googleapis.com.evil.com/a', 'https://fcm.googleapis.com:8080/a']) assert.throws(() => handler.validateSubscription({ endpoint, keys }));
  for (const endpoint of ['https://fcm.googleapis.com/fcm/send/a', 'https://web.push.apple.com/Q/a', 'https://updates.push.services.mozilla.com/wpush/v2/a']) assert.equal(handler.validateSubscription({ endpoint, keys }).endpoint, endpoint);
  assert.throws(() => handler.validateSubscription({ endpoint: 'https://fcm.googleapis.com/a', keys: { p256dh: 'short', auth: 'short' } }));
});
test('non-admin and unconfirmed accounts cannot use admin API', async () => {
  for (const user of [{ email: 'stranger@example.com', email_confirmed_at: '2026-09-30' }, { email: 'lurbaymarketing@gmail.com' }]) {
    global.fetch = async () => new Response(JSON.stringify(user), { status: 200 });
    assert.equal((await request('admin', { cookie: '__Host-carloan-admin=valid.jwt.token' })).code, 403);
  }
});
test('magic-link login exchanges verified token into secure HttpOnly session', async () => {
  const jwt = 'header.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url') + '.signature';
  global.fetch = async url => {
    assert.equal(url, 'https://test.supabase.co/auth/v1/user');
    return new Response(JSON.stringify({ email: 'lurbaymarketing@gmail.com', email_confirmed_at: '2026-09-30' }), { status: 200 });
  };
  const res = await request('session', { method: 'POST', body: { accessToken: jwt } });
  assert.equal(res.code, 200); assert.match(res.headers['Set-Cookie'], /HttpOnly; Secure; SameSite=Strict/);
  assert.ok(!JSON.stringify(res.data).includes(jwt));
});
test('backend error details never leak publicly', async () => {
  global.fetch = async () => new Response('{"message":"private SQL and keys private-service-key"}', { status: 500 });
  const res = await request('announcement'); assert.equal(res.code, 503);
  assert.ok(!JSON.stringify(res.data).includes('private-service-key'));
});
