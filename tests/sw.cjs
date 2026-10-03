const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const handlers = {};
let windows = [];
let opened;
class MessageChannel {
  constructor() {
    this.port1 = { close() {} };
    this.port2 = { postMessage: data => this.port1.onmessage?.({ data }) };
  }
}
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '..', 'sw.js'), 'utf8'), {
  self: { location: { origin: 'https://app.test' }, addEventListener: (name, handler) => { handlers[name] = handler; },
    clients: { matchAll: async () => windows, openWindow: async url => { opened = url; } } },
  URL, MessageChannel, setTimeout, clearTimeout,
});
async function click(id, appointment = false) {
  let work; let closed = false;
  handlers.notificationclick({ notification: { data: appointment ? { appointmentId: id } : { announcementId: id }, close() { closed = true; } }, waitUntil(promise) { work = promise; } });
  await work; assert.ok(closed);
}
(async () => {
  await click('clicked-id'); assert.equal(opened, '/?announcement=clicked-id');
  windows = []; await click('appointment-id',true);assert.equal(opened,'/?appointment=appointment-id');
  windows=[{url:'https://app.test/',focus:async()=>{},postMessage(data,ports){assert.equal(data.type,'appointment');assert.equal(data.appointmentId,'appointment-id');ports[0].postMessage({handled:true});}}];
  opened=null;await click('appointment-id',true);assert.equal(opened,null);
  windows=[];
  let navigated;
  windows = [{ url: 'https://app.test/', focus: async () => {}, navigate: async url => { navigated = url; return windows[0]; },
    postMessage(data, ports) { assert.equal(data.announcementId, 'clicked-id'); assert.equal(data.force, true); ports[0].postMessage({ handled: true }); } }];
  opened = null; await click('clicked-id'); assert.equal(navigated, undefined); assert.equal(opened, null);
  windows[0].postMessage = () => {};
  await click('clicked-id'); assert.equal(navigated, '/?announcement=clicked-id');
  windows[0].postMessage = () => { throw new Error('Page was discarded'); };
  navigated = null;
  await click('clicked-id'); assert.equal(navigated, '/?announcement=clicked-id');
  windows = [{ url: 'https://app.test/admin' }, { url: 'https://foreign.test/' }];
  await click('clicked-id'); assert.equal(opened, '/?announcement=clicked-id');
  console.log('PASS notification clicks: exact ID, cold launch, live-page acknowledgement, suspended-page deep-link fallback, admin/foreign exclusion.');
})().catch(error => { console.error(error); process.exitCode = 1; });
