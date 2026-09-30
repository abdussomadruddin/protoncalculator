const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const context = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'catalog.js'), 'utf8') + ';globalThis.catalog=CAR_CATALOG', context);
const catalog = JSON.parse(JSON.stringify(context.catalog));
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.005, `${actual} != ${expected}`);

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Fixed snapshot date makes the promotion cutoff deterministic and testable.
  await page.clock.install({ time: new Date('2026-09-30T04:00:00Z') });
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  const values = () => page.evaluate(() => calculateValues());
  const reset = () => page.locator('#resetButton').click();
  const select = async (brand, model, variant) => {
    await page.selectOption('#brandSelect', brand);
    await page.selectOption('#modelSelect', model);
    await page.selectOption('#variantSelect', variant);
  };
  try {
    let v = await values();
    assert.equal(v.model, 'NEW S70 1.5 i-GT');
    assert.equal(v.interestRate, 2.5);
    assert.equal(v.loanPeriod, 9);
    assert.equal(v.rebate, 0);
    assert.equal(await page.inputValue('#rebate'), '');
    near(v.insurance, 59800 * .03);
    near(v.otrTotal, 59800 + 59800 * .03);
    let variants = 0;
    for (const [brand, models] of Object.entries(catalog)) {
      assert.equal(new Set(models.map(m => m.name)).size, models.length);
      for (const model of models) {
        assert.equal(new Set(model.variants.map(x => x.name)).size, model.variants.length);
        for (const variant of model.variants) {
          assert.ok(variant.otrPrice > 0);
          assert.equal(variant.bodyPrice, variant.otrPrice);
          assert.ok(/^https:\/\//.test(variant.source || model.source));
          await select(brand, model.name, variant.name);
          assert.equal(Number(await page.inputValue('#bodyPrice')), variant.otrPrice);
          assert.equal(await page.inputValue('#rebate'), '');
          const expectedRate = model.registration === 'Company Commercial' ? 3.5 : model.powertrain === 'EV' ? 2.35 : variant.otrPrice < 50000 ? 3 : variant.otrPrice < 100000 ? 2.5 : 2.35;
          assert.equal(Number(await page.inputValue('#interestRate')), expectedRate);
          assert.equal(await page.locator('#priceSource').getAttribute('href'), variant.source || model.source);
          await page.locator('input[name="insuranceOption"][value="exclude"]').check();
          if (model.estimated || model.needsConfirmation) {
            assert.ok(await page.locator('#copyButton').isDisabled());
            await page.locator('#priceConfirmed').check();
          }
          v = await values();
          assert.deepEqual(v.errors, []);
          near(v.otrTotal, variant.otrPrice);
          await page.locator('input[name="insuranceOption"][value="with"]').check();
          v = await values(); near(v.insurance, variant.otrPrice * .03);
          near(v.otrTotal, variant.otrPrice * 1.03);
          assert.deepEqual(v.errors, []);
          const text = await page.inputValue('#templateOutput');
          assert.ok(text.startsWith('*' + brand.toUpperCase() + ' LOAN ESTIMATE*'));
          assert.ok(!/\nRegistration:|Published accessories & registration|Official price snapshot:|Source:|Introductory offer:|Estimate only;|https:\/\//.test(text));
          assert.ok(!/NaN|undefined|Infinity/.test(text));
          variants++;
        }
      }
    }
    await reset();
    for (let year = 1; year <= 9; year++) {
      await page.selectOption('#loanPeriod', String(year));
      v = await values();
      near(v.selectedMonthly, v.loanAfterDeposit * (1 + .025 * year) / (12 * year));
      const text = await page.inputValue('#templateOutput');
      assert.equal(text.split('years:').length - 1, 1);
      assert.ok(text.includes(year + ' years:'));
      if (year !== 7) assert.ok(!text.includes('7 years:'));
    }
    await page.locator('input[name="depositOption"][value="ten"]').check();
    v = await values(); near(v.depositAmount, v.otrTotal * .1);
    await page.locator('input[name="depositOption"][value="custom"]').check();
    await page.fill('#customDeposit', '1234.56');
    v = await values(); near(v.depositAmount, 1234.56); assert.deepEqual(v.errors, []);
    await page.fill('#customDeposit', '999999');
    v = await values(); near(v.loanAfterDeposit, 0);
    await reset();
    await page.selectOption('#ncd', '55');
    v = await values(); near(v.insurance, 59800 * .03 * .45);
    await page.fill('#extras', '800');
    v = await values(); near(v.insurance, 59800 * .03 * .45);
    await page.fill('#rebate', '999999');
    assert.ok(await page.locator('#copyButton').isDisabled());
    await reset();
    await select('Perodua', 'Axia', '1.0L E (5MT)');
    assert.ok(await page.locator('#copyButton').isEnabled());
    assert.equal(await page.locator('#priceLabel').innerText(), 'Car Body Price');
    v = await values(); near(v.otrTotal, 22000 * 1.03); assert.deepEqual(v.errors, []);
    await page.locator('input[name="insuranceOption"][value="exclude"]').check();
    v = await values(); near(v.otrTotal, 22000);
    await select('Perodua', 'QV-E', 'Battery-as-a-Service (BaaS)');
    assert.ok(await page.locator('#batterySummary').isVisible());
    v = await values(); near(v.otrTotal, 69999); assert.equal(v.batteryMonthly, 215);
    assert.ok((await page.inputValue('#templateOutput')).includes('108 months'));
    await select('Perodua', 'QV-E', 'Full Purchase (Battery Included)');
    assert.ok(await page.locator('#batterySummary').isHidden());
    v = await values(); near(v.otrTotal, 93999);
    await reset();
    for (const [price, rate] of [[49999.99, 3], [50000, 2.5], [99999.99, 2.5], [100000, 2.35]]) {
      await page.fill('#bodyPrice', String(price));
      assert.equal(Number(await page.inputValue('#interestRate')), rate);
    }
    await page.fill('#interestRate', '2.1');
    await page.fill('#bodyPrice', '30000');
    assert.equal(await page.inputValue('#interestRate'), '2.1');
    await reset();
    for (const width of [320, 390, 430, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `Overflow at ${width}px`);
      await page.screenshot({ path: `/tmp/car-calculator-${width}.png`, fullPage: true });
    }
    // Test the actual clipboard in the local file origin, where supported by Chrome.
    await page.locator('#copyButton').click();
    await page.waitForFunction(() => document.querySelector('#copyState').textContent === 'Copied');
    await page.clock.setSystemTime(new Date('2026-10-01T04:00:00Z'));
    await reset();
    v = await values(); assert.equal(v.rebate, 0);
    assert.ok((await page.locator('#priceNote').innerText()).includes('Snapshot September'));
    assert.ok(!(await page.inputValue('#templateOutput')).includes('not for the current month'));
    assert.deepEqual(errors, []);
    console.log(`PASS: 7 brands, ${Object.values(catalog).flat().length} models, ${variants} variants; all periods, deposit, NCD, battery, confirmations, clipboard and 5 viewport sizes.`);
  } catch (error) {
    await page.screenshot({ path: '/tmp/car-calculator-failure.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
