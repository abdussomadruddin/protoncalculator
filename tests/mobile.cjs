const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const iosUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 Version/18.4 Mobile/15E148 Safari/604.1';
const androidUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36';
const vapid = require('web-push').generateVAPIDKeys();
let announcement = null;
let pushReady = true;
const subscriptions = [];
const errors = [];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/app') {
    res.setHeader('Content-Type', 'application/json');
    if (url.searchParams.get('action') === 'config') return res.end(JSON.stringify({ ready: pushReady, pushReady, vapidPublicKey: pushReady ? vapid.publicKey : null }));
    if (url.searchParams.get('action') === 'announcement') return res.end(JSON.stringify({ announcement }));
    if (url.searchParams.get('action') === 'subscribe') { let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => { subscriptions.push(JSON.parse(body)); res.end('{"subscribed":true}'); }); return; }
    if (url.searchParams.get('action') === 'admin') { res.statusCode = 401; return res.end('{"error":"Sila login admin."}'); }
    res.statusCode = 404; return res.end('{}');
  }
  const relative = url.pathname === '/' ? 'index.html' : url.pathname === '/admin' ? 'admin.html' : url.pathname.slice(1);
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.statusCode = 404; return res.end(); }
  const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain');
  // Same strict CSP as the production config.
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  fs.createReadStream(file).pipe(res);
});
async function mockInstalled(page, permission, existing = true, installed = true) {
  await page.addInitScript(({ permission, existing, installed }) => {
    Object.defineProperty(navigator, 'standalone', { value: installed });
    window.permissionCalls = 0;
    Object.defineProperty(window, 'Notification', { value: { permission, requestPermission: async () => { window.permissionCalls++; return permission; } } });
    window.PushManager = function() {};
    const subscription = { toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: { p256dh: 'test', auth: 'test' } }), unsubscribe: async () => true };
    window.subscriptionCalls = 0;
    const registration = { pushManager: { getSubscription: async () => existing ? subscription : null, subscribe: async () => { window.subscriptionCalls++; return subscription; } } };
    const sw = new EventTarget(); sw.register = async () => registration; sw.ready = Promise.resolve(registration);
    Object.defineProperty(navigator, 'serviceWorker', { value: sw });
  }, { permission, existing, installed });
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const contexts = [];
  async function pageFor(userAgent, width = 390) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, ...(userAgent ? { userAgent } : {}) }); contexts.push(context);
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); return page;
  }
  try {
    const desktop = await pageFor(null, 1280); await desktop.clock.install(); await desktop.goto(base);
    assert.equal(await desktop.locator('#dialogTitle').innerText(), 'Jadikan Car Loan MY sebagai app');
    assert.equal(await desktop.locator('.install-steps li').count(), 4);
    assert.ok(await desktop.locator('#dialogClose').isVisible());
    await desktop.keyboard.press('Escape'); assert.ok(await desktop.locator('#appDialog').isHidden());
    assert.ok(await desktop.locator('#brandSelect').isEnabled());
    await desktop.clock.fastForward(299000); assert.ok(await desktop.locator('#appDialog').isHidden());
    await desktop.clock.fastForward(16000); assert.ok(await desktop.locator('#appDialog').isVisible());
    await desktop.locator('#dialogClose').click();
    await desktop.locator('#appMenuButton').click();
    await desktop.clock.fastForward(300000);
    assert.equal(await desktop.locator('#dialogTitle').innerText(), 'Tetapan app');
    await desktop.locator('#dialogClose').click();
    await desktop.waitForFunction(() => document.querySelector('#dialogTitle').textContent === 'Jadikan Car Loan MY sebagai app');
    await desktop.screenshot({ path: '/tmp/car-loan-desktop-install.png' });
    await desktop.goto(base + '/admin');
    assert.ok(await desktop.locator('#loginSection').isVisible());
    assert.ok(await desktop.locator('#adminDashboard').isHidden());
    const ios = await pageFor(iosUA); await ios.goto(base);
    assert.equal(await ios.title(), 'Car Loan MY');
    assert.equal(await ios.locator('#brandHeading').count(), 0);
    assert.equal(await ios.locator('.estimate-banner').count(), 0);
    assert.equal(await ios.locator('.install-steps li').count(), 4);
    assert.match(await ios.locator('#dialogDescription').innerText(), /Safari/);
    await ios.screenshot({ path: '/tmp/car-loan-ios-install.png', animations: 'disabled' });
    await ios.locator('#dialogClose').click();
    await ios.locator('.price-details summary').click();
    assert.equal(await ios.locator('.price-details-label').evaluate(el => getComputedStyle(el).transform), 'none');
    for (const width of [320, 390, 430]) {
      await ios.setViewportSize({ width, height: 844 });
      assert.equal(await ios.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const logo = await ios.locator('.app-logo').evaluate(el => el.complete && el.naturalWidth > 0); assert.ok(logo);
      assert.ok(await ios.locator('#copyButton svg').count());
      await ios.screenshot({ path: '/tmp/car-loan-phone-' + width + '.png', fullPage: true });
    }
    await ios.selectOption('#ncd', '55');
    const values = await ios.evaluate(() => calculateValues());
    assert.ok(Math.abs(values.insurance - 59800 * .033 * .45) < .001);
    assert.ok(!(await ios.inputValue('#templateOutput')).includes('3.3%'));
    const android = await pageFor(androidUA); await android.goto(base);
    assert.equal(await android.locator('.install-steps li').count(), 4);
    assert.match(await android.locator('#dialogDescription').innerText(), /Chrome/);
    // Service worker really registers on the loopback secure context.
    await android.waitForFunction(async () => Boolean(await navigator.serviceWorker.getRegistration()));
    const denied = await pageFor(iosUA); await mockInstalled(denied, 'denied'); await denied.goto(base);
    await denied.waitForFunction(() => document.querySelector('#dialogTitle').textContent === 'Aktifkan notification');
    assert.equal(await denied.locator('#dialogTitle').innerText(), 'Aktifkan notification');
    assert.equal(await denied.evaluate(() => window.permissionCalls), 0);
    await denied.locator('#dialogAction').click();
    assert.equal(await denied.evaluate(() => window.permissionCalls), 1);
    await denied.locator('#dialogSecondary').click();
    assert.ok(await denied.locator('#appDialog').isHidden()); assert.ok(await denied.locator('#appNotice').isVisible());
    await denied.reload(); assert.ok(await denied.locator('#appDialog').isHidden());
    pushReady = false;
    const unavailable = await pageFor(iosUA); await mockInstalled(unavailable, 'granted'); await unavailable.goto(base);
    await unavailable.waitForFunction(() => document.querySelector('#dialogTitle').textContent === 'Notification belum tersedia');
    assert.match(await unavailable.locator('#dialogDescription').innerText(), /bukan masalah tetapan telefon/);
    assert.equal(await unavailable.locator('#dialogAction').innerText(), 'Semak semula');
    assert.equal(await unavailable.evaluate(() => window.permissionCalls + window.subscriptionCalls), 0);
    pushReady = true;
    await unavailable.locator('#dialogAction').click();
    await unavailable.waitForFunction(() => document.querySelector('#dialogTitle').textContent === 'Aktifkan notification');
    await unavailable.locator('#dialogAction').click();
    await unavailable.waitForFunction(() => !document.querySelector('#appDialog').open);
    const firstSubscription = await pageFor(iosUA); await mockInstalled(firstSubscription, 'granted', false); await firstSubscription.goto(base);
    await firstSubscription.waitForFunction(() => document.querySelector('#dialogTitle').textContent === 'Aktifkan notification');
    assert.equal(await firstSubscription.evaluate(() => window.subscriptionCalls), 0);
    await firstSubscription.locator('#dialogAction').click();
    await firstSubscription.waitForFunction(() => window.subscriptionCalls === 1 && !document.querySelector('#appDialog').open);
    const granted = await pageFor(androidUA); await granted.clock.install(); await mockInstalled(granted, 'granted'); await granted.goto(base);
    await granted.waitForFunction(() => !document.querySelector('#appDialog').open);
    await granted.waitForTimeout(150);
    await granted.clock.fastForward(600000); assert.ok(await granted.locator('#appDialog').isHidden());
    const desktopApp = await pageFor(null, 1280); await desktopApp.clock.install(); await mockInstalled(desktopApp, 'granted'); await desktopApp.goto(base);
    await desktopApp.waitForTimeout(150); await desktopApp.clock.fastForward(315000);
    assert.equal(await desktopApp.locator('#dialogTitle').innerText(), 'Jadikan Car Loan MY sebagai app');
    const desktopBrowser = await pageFor(null, 1280); await mockInstalled(desktopBrowser, 'granted', false, false); await desktopBrowser.goto(base);
    await desktopBrowser.locator('#dialogSecondary').click();
    await desktopBrowser.waitForFunction(() => document.querySelector('#dialogTitle').textContent === 'Aktifkan notification');
    assert.match(await desktopBrowser.locator('#dialogDescription').innerText(), /browser atau peranti/);
    await desktopBrowser.locator('#dialogAction').click();
    await desktopBrowser.waitForFunction(() => window.subscriptionCalls === 1 && !document.querySelector('#appDialog').open);
    assert.match(await desktopBrowser.locator('#appNotice').innerText(), /Notification aktif/);
    const desktopDenied = await pageFor(null, 1280); await mockInstalled(desktopDenied, 'denied', false, false); await desktopDenied.goto(base);
    await desktopDenied.locator('#dialogSecondary').click();
    await desktopDenied.waitForFunction(() => document.querySelector('#dialogTitle').textContent === 'Aktifkan notification');
    await desktopDenied.locator('#dialogAction').click();
    assert.match(await desktopDenied.locator('#dialogStatus').innerText(), /Site settings \/ Permissions/);
    await desktopDenied.locator('#dialogSecondary').click();
    assert.ok(await desktopDenied.locator('#brandSelect').isEnabled());
    assert.ok(subscriptions.length > 0);
    announcement = { id: 'test-announcement', title: '<b>Hebahan</b>', message: 'Mesej\n<script>alert(1)</script>', link_url: 'https://example.com/promo', link_label: 'Lihat promosi' };
    await granted.locator('#appMenuButton').click(); await granted.getByRole('button', { name: 'Hebahan terkini' }).click();
    await granted.waitForFunction(expected => document.querySelector('#dialogTitle').textContent === expected, announcement.title);
    assert.equal(await granted.locator('#dialogTitle').innerText(), announcement.title);
    assert.equal(await granted.locator('#dialogDescription').innerText(), announcement.message);
    assert.equal(await granted.locator('#dialogTitle b').count(), 0);
    assert.equal(await granted.locator('#dialogAction').innerText(), 'Lihat promosi');
    await granted.screenshot({ path: '/tmp/car-loan-announcement.png', animations: 'disabled' });
    const activeAnnouncement = announcement;
    announcement = null;
    await granted.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await granted.waitForFunction(() => !document.querySelector('#appDialog').open);
    announcement = activeAnnouncement;
    await granted.locator('#appMenuButton').click(); await granted.getByRole('button', { name: 'Hebahan terkini' }).click();
    await granted.waitForFunction(expected => document.querySelector('#dialogTitle').textContent === expected, announcement.title);
    await granted.locator('#dialogClose').click();
    await granted.reload(); assert.ok(await granted.locator('#appDialog').isHidden());
    assert.deepEqual(errors, []);
    console.log('PASS mobile: all-device access, 5-minute install reminders, modal deferral, phone notification exemption, desktop app reminders, admin, 4-step guides, subscription and phone layouts.');
  } finally { for (const context of contexts) await context.close(); await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
