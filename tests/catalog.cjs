const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'catalog.js'), 'utf8') + fs.readFileSync(path.join(root, 'rebates.js'), 'utf8'), context);
const catalog = vm.runInContext('CAR_CATALOG', context);
// Independent expectations transcribed from the official price tables in the audit.
const expected = {
  Mitsubishi: {
    Xforce: [109980, 119980], XPANDER: [99980, 109980],
    Triton: [159980, 145980, 116980, 114980, 169980, 155980, 165980],
    'Triton Single Cab': [107980, 104980, 101980],
  },
  Mazda: {
    'Mazda3 Sedan': [120620, 166059], 'Mazda3 Liftback': [120620, 166059, 175059],
    'MX-5 RF': [294154, 296154], 'CX-30': [122409, 130409, 138409, 146409],
    'All New CX-5': [171510.4], 'CX-5 CKD': [135469.2, 147469.2, 164960.4, 154960.4, 166760.4],
    'CX-8': [165360.4, 171360.4, 186360.4, 201360.4, 193122.8],
    'CX-60': [200510.4, 252872.8, 252872.8, 252872.8], 'CX-80': [296610.4],
    'BT-50 Double Cab': [140418.4, 140418.4],
  },
  GWM: {
    'WEY G9 Hi4 PHEV': [269800], 'HAVAL H6 HEV': [139800], 'ORA GOOD CAT': [110580],
    'ORA GOOD CAT GT': [120620], 'TANK 300': [250000], 'TANK 300 HEV': [259800],
    'TANK 500 HEV': [328800, 336800],
  },
  BYD: {
    'SEAL 6': [100770, 116680], 'The New SEAL': [172835, 193465], 'ATTO 2': [100820],
    '2026 ATTO 3': [126660, 139835, 151165], DOLPHIN: [100740, 125760],
    M6: [110600, 124660], '2026 SEALION 7': [164700, 189835, 205465],
  },
};
assert.equal(Object.keys(catalog).length, 11);
assert.equal(catalog.Tesla, undefined);
assert.equal(vm.runInContext('REBATE_AUDIT_SOURCES.Tesla', context), undefined);
for (const [brand, models] of Object.entries(expected)) {
  assert.deepEqual(Array.from(catalog[brand], m => m.name), Object.keys(models));
  for (const model of catalog[brand]) {
    assert.equal(model.checkedAt, '2026-10-02');
    assert.deepEqual(Array.from(model.variants, v => v.bodyPrice), models[model.name], `${brand}: ${model.name}`);
    assert.equal(new Set(model.variants.map(v => v.name)).size, model.variants.length);
    for (const variant of model.variants) {
      assert.equal(variant.bodyPrice, variant.otrPrice);
      assert.equal(vm.runInContext(`findOfficialRebate(${JSON.stringify(brand)}, ${JSON.stringify(model.name)}, ${JSON.stringify(variant.name)}, '2026', '2026-10-02')`, context), null);
    }
  }
  assert.equal(vm.runInContext(`REBATE_AUDIT_SOURCES[${JSON.stringify(brand)}].checkedAt`, context), '2026-10-02');
}
assert.equal(catalog.Mitsubishi.find(m => m.name === 'Triton').variants.at(-1).needsConfirmation, true);
assert.ok(!catalog.GWM.some(m => m.name.includes('ORA 5')));
console.log('PASS: 4 new brands, 28 model groups, 66 official price rows; Tesla removed, existing Mazda prices retained, no invented prelaunch price or unconditional rebate.');
