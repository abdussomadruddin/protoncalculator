const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(require('node:path').join(__dirname, '../activity.js'), 'utf8');
(async () => {
  const calls = [];
  const listeners = {};
  const values = new Map();
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v) };
  const context = { location: { protocol: 'https:', hostname: 'test' }, crypto: webcrypto, localStorage: storage, sessionStorage: storage,
    navigator: { userAgent: 'iPhone', standalone: true }, Notification: { permission: 'granted' }, matchMedia: () => ({ matches: false }),
    document: { hidden: false, addEventListener: (k, v) => { listeners[k] = v; } },
    addEventListener: (k, v) => { listeners[k] = v; }, setInterval: () => {}, AbortSignal,
    fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return { ok: true }; } };
  context.window = context;
  vm.runInNewContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, 1); assert.equal(calls[0].body.phoneApp, true);
  assert.equal(calls[0].body.deviceToken, values.get('carloan-device-token'));
  await listeners.pageshow(); assert.equal(calls.length, 1);
  context.Notification.permission = 'denied'; await listeners['carloan-notification-synced']();
  assert.equal(calls.length, 2); assert.equal(calls[1].body.permission, 'denied');
  context.navigator.standalone = false; await listeners.pageshow();
  assert.equal(calls[2].body.phoneApp, false);
  context.document.hidden = true; await listeners.visibilitychange(); assert.equal(calls.length, 3);
  vm.runInNewContext(source, { ...context, localStorage: { getItem() { throw Error('blocked'); } } });
  assert.equal(calls.length, 3);
  console.log('PASS activity: private device ID reuse, app-mode detection, throttling, permission updates, hidden/storage failures.');
})().catch(error => { console.error(error); process.exitCode = 1; });
