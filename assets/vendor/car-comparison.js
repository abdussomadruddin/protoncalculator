(() => {
  const trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'secondary-action compare-trigger';
  trigger.innerHTML = '<i data-lucide="git-compare-arrows"></i> Banding Kereta';
  document.querySelector('#loanForm').append(trigger);
  const dialog = document.createElement('dialog'); dialog.className = 'app-dialog comparison-dialog';
  dialog.setAttribute('aria-label','Banding Kereta');
  dialog.innerHTML = '<div class="dialog-top"><h2>Banding Kereta</h2><button type="button" class="icon-button" aria-label="Tutup"><i data-lucide="x"></i></button></div><div class="comparison-grid"></div><p role="status"></p><button type="button" class="primary-action comparison-poster"><i data-lucide="image-down"></i> Preview poster</button>';
  document.body.append(dialog); dialog.querySelector('.icon-button').onclick = () => dialog.close();
  const grid = dialog.querySelector('.comparison-grid'), status = dialog.querySelector('[role=status]'), posterButton = dialog.querySelector('.comparison-poster');
  let snapshots = [];
  const fields = [['inputPrice','Harga kereta'],['rebate','Rebate'],['extras','Aksesori tambahan'],['interestRate','Kadar faedah (%)'],['customDeposit','Downpayment custom']];
  function options(select, values) { select.replaceChildren(...values.map(value => { const option = document.createElement('option'); option.value = value; option.textContent = value; return option; })); }
  function editor(initial, index) {
    const form = document.createElement('form'); form.className = 'comparison-car';
    form.innerHTML = '<h3>Kereta '+(index ? 'B' : 'A')+'</h3><label>Brand<select name="brand"></select></label><label>Model<select name="model"></select></label><label>Variant<select name="variant"></select></label><div class="comparison-fields">'+fields.map(([name,label]) => '<label>'+label+'<input name="'+name+'" type="number" min="0" max="10000000" step="any" required></label>').join('')+'<label>Insurans<select name="insuranceOption"><option value="with">With insurance</option><option value="exclude">Exclude insurance</option></select></label><label>NCD (%)<input name="ncd" type="number" min="0" max="100" step="any" required></label><label>Downpayment<select name="depositOption"><option value="full">Full loan</option><option value="ten">10%</option><option value="custom">Custom</option></select></label><label>Tempoh loan<select name="loanPeriod"></select></label><label>Tahun kenderaan<select name="year"></select></label></div><label class="comparison-confirm" hidden><input name="confirmed" type="checkbox"> Harga akhir disahkan dengan pengedar</label><dl class="comparison-results"></dl>';
    const e = form.elements;
    options(e.brand, Object.keys(CAR_CATALOG)); options(e.loanPeriod, [1,2,3,4,5,6,7,8,9]); options(e.year, [2026,2025,2024]);
    const model = () => CAR_CATALOG[e.brand.value].find(m => m.name === e.model.value);
    const variant = () => model().variants.find(v => v.name === e.variant.value);
    function variants() { options(e.variant, model().variants.map(v => v.name)); }
    function models() { options(e.model, CAR_CATALOG[e.brand.value].map(m => m.name)); variants(); }
    function price() { const v = variant(); e.inputPrice.value = v.bodyPrice; e.interestRate.value = getDefaultInterestRate(v.bodyPrice, model()); e.rebate.value = findOfficialRebate(e.brand.value,e.model.value,e.variant.value,e.year.value,localDate())?.amount || 0; e.extras.value = 0; e.confirmed.checked = false; }
    e.brand.value = initial.brand; models(); e.model.value = initial.model; variants(); e.variant.value = initial.variant;
    for (const [name] of fields) e[name].value = initial[name] ?? (name === 'customDeposit' ? initial.depositAmount : 0);
    e.insuranceOption.value = initial.insuranceOption === 'with' ? 'with' : 'exclude'; e.ncd.value = initial.ncd;
    e.depositOption.value = initial.depositOption || (initial.depositAmount ? 'custom' : 'full'); e.loanPeriod.value = initial.loanPeriod;
    e.confirmed.checked = true;
    function update() {
      const input = {brand:e.brand.value,model:e.model.value,variant:e.variant.value,insuranceOption:e.insuranceOption.value,depositOption:e.depositOption.value,batteryMonthly:variant().batteryMonthly || 0};
      for (const name of ['inputPrice','rebate','extras','interestRate','customDeposit','ncd','loanPeriod']) input[name] = Number(e[name].value);
      const needsConfirmation = model().estimated || model().needsConfirmation || variant().needsConfirmation;
      form.querySelector('.comparison-confirm').hidden = !needsConfirmation;
      e.customDeposit.disabled = e.depositOption.value !== 'custom'; e.ncd.disabled = e.insuranceOption.value !== 'with';
      const v = calculateCarSnapshot(input); v.errors = [];
      if (!form.checkValidity() || input.inputPrice <= 0 || input.rebate > input.inputPrice || input.interestRate > 100 || (needsConfirmation && !e.confirmed.checked)) v.errors.push('Semak input dan sahkan harga kereta '+(index ? 'B' : 'A')+'.');
      snapshots[index] = v;
      const interest = v.loanAfterDeposit * v.interestRate / 100 * v.loanPeriod;
      const results = form.querySelector('.comparison-results'); results.replaceChildren();
      for (const [label,value] of [['Harga',v.inputPrice],['Jumlah loan',v.loanAfterDeposit],['Ansuran / bulan',v.selectedMonthly],['Jumlah faedah',interest],['Jumlah bayaran loan',v.loanAfterDeposit+interest],...(v.batteryMonthly ? [['Sewaan bateri / bulan (berasingan)',v.batteryMonthly]] : [])]) { const row = document.createElement('div'),dt = document.createElement('dt'),dd = document.createElement('dd'); dt.textContent = label; dd.textContent = money(value); row.append(dt,dd); results.append(row); }
      status.textContent = snapshots.flatMap(s => s.errors || []).join(' '); posterButton.disabled = snapshots.length !== 2 || snapshots.some(s => s.errors.length);
    }
    form.addEventListener('submit',event => event.preventDefault());
    form.onchange = event => { if (event.target === e.brand) { models(); price(); } else if (event.target === e.model) { variants(); price(); } else if (event.target === e.variant) price(); else if(event.target === e.year) e.rebate.value = findOfficialRebate(e.brand.value,e.model.value,e.variant.value,e.year.value,localDate())?.amount || 0; update(); };
    form.oninput = event => { if(event.target.tagName !== 'SELECT') update(); }; grid.append(form); update();
  }
  function prepare() {
    const a = calculateValues(); if (a.errors.length) { alert(a.errors.join('\n')); return; }
    snapshots = []; grid.replaceChildren(); editor({...a,depositOption:getCheckedValue('depositOption'),customDeposit:Number(customDepositInput.value)||0},0); editor(a,1); window.lucide?.createIcons(); return true;
  }
  trigger.onclick = () => { if (window.proWorkspace) window.proWorkspace.select('comparison'); else if(prepare()) dialog.showModal(); };
  window.carComparison = { mount(container) { prepare(); container.append(grid,status,posterButton); } };
  posterButton.onclick = () => { dialog.close(); window.loanPoster.open(snapshots); };
  window.lucide?.createIcons();
})();
