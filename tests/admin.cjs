const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let loggedIn = false;
  let published = null;
  let broadcastCalls = 0;
  let publishCalls = 0;
  let interrupted = false;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://admin.test/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/app') {
      const action = url.searchParams.get('action');
      const body = route.request().postDataJSON();
      const respond = (data, status = 200) => route.fulfill({ status, json: data });
      if (action === 'config') return respond({ ready: true, pushReady: true });
      if (action === 'stats') return loggedIn ? respond({ startedAt: '2026-10-02T00:00:00Z', traffic: [1, 7, 30].map(days => ({ days, visits: days * 10, devices: days * 2 })), notifications: 42, phoneApps: 30, phoneAppsWithNotifications: 20 }) : respond({ error: 'Login required' }, 401);
      if (action === 'login') {
        assert.equal(body.email, 'admin@example.test');
        assert.equal(body.password, 'test-password-only');
        loggedIn = true; return respond({ email: body.email });
      }
      if (action === 'admin') return loggedIn ? respond({ email: 'admin@example.test', pushReady: true, announcements: published ? [published] : [] }) : respond({ error: 'Login required' }, 401);
      if (action === 'publish') {
        publishCalls++;
        published = { id: 'test-announcement', title: body.title, message: body.message, active: true, created_at: new Date().toISOString() };
        return respond({ announcement: published, push: { sent: 20, failed: 0, processing: 0, complete: false } });
      }
      if (action === 'broadcast') {
        broadcastCalls++;
        if (interrupted) return respond({ error: 'Temporary provider error' }, 503);
        return respond({ sent: broadcastCalls === 1 ? 40 : 45, failed: 0, processing: 0, complete: broadcastCalls > 1 });
      }
      if (action === 'logout') { loggedIn = false; return respond({ ok: true }); }
      return respond({}, 404);
    }
    const file = path.join(root, url.pathname === '/admin' ? 'admin.html' : url.pathname.slice(1));
    await route.fulfill({ body: fs.readFileSync(file), contentType: ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' })[path.extname(file)] });
  });
  try {
    await page.goto('https://admin.test/admin');
    await page.waitForFunction(() => !document.querySelector('#loginForm button[type=submit]').disabled);
    await page.locator('#adminEmail').fill('admin@example.test');
    await page.locator('#adminPassword').fill('test-password-only');
    await page.locator('#togglePassword').click();
    assert.equal(await page.locator('#adminPassword').getAttribute('type'), 'text');
    await page.locator('#togglePassword').click();
    assert.equal(await page.locator('#adminPassword').getAttribute('type'), 'password');
    await page.screenshot({ path: '/tmp/car-loan-admin-login.png' });
    await page.locator('#loginForm button[type=submit]').click();
    await page.waitForFunction(() => !document.querySelector('#adminDashboard').hidden);
    assert.equal(await page.locator('#adminPassword').inputValue(), '');
    await page.waitForFunction(() => document.querySelector('#visits30').textContent === '300');
    assert.equal(await page.locator('#notificationCount').textContent(), '42');
    assert.equal(await page.locator('#phonePushCount').textContent(), '20');
    await page.locator('#adminDashboard').evaluate(async element => {
      await Promise.all(element.getAnimations().map(animation => animation.finished));
    });
    await page.screenshot({ path: '/tmp/car-loan-admin-stats-phone.png' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: '/tmp/car-loan-admin-stats-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#announcementTitle').fill('Test only');
    await page.locator('#announcementMessage').fill('Mock recipients, never production.');
    await page.locator('#publishButton').click();
    await page.waitForFunction(() => document.querySelector('#adminStatus').textContent.includes('push selesai'));
    assert.equal(publishCalls, 1);
    assert.equal(broadcastCalls, 2);
    assert.equal(await page.evaluate(() => localStorage.getItem('car-loan-admin-pending-push')), null);
    interrupted = true;
    await page.locator('#announcementTitle').fill('Interrupted test');
    await page.locator('#announcementMessage').fill('Resume safely.');
    await page.locator('#publishButton').click();
    await page.waitForFunction(() => document.querySelector('#adminStatus').textContent.includes('Push terganggu'));
    assert.equal(await page.evaluate(() => localStorage.getItem('car-loan-admin-pending-push')), 'test-announcement');
    interrupted = false;
    await page.getByRole('button', { name: 'Sambung push', exact: true }).click();
    await page.locator('#confirmSend').click();
    await page.waitForFunction(() => document.querySelector('#adminStatus').textContent.includes('push selesai'));
    assert.equal(publishCalls, 2, 'Resume must not republish');
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No overflow at ' + width);
      assert.ok(await page.locator('#statsRefresh').evaluate(element => element.getBoundingClientRect().height >= 44), 'Touch target at ' + width);
    }
    await page.screenshot({ path: '/tmp/car-loan-admin-publish.png' });
    await page.locator('#logoutButton').click();
    await page.waitForFunction(() => !document.querySelector('#loginSection').hidden);
    assert.deepEqual(errors, []);
    console.log('PASS admin: password login, visibility, one-click multi-batch push, interrupted resume without republish, logout and responsive widths.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
