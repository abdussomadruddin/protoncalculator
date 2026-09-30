const DEFAULT_STATE = {
  brand: "Proton", model: "NEW S70 1.5 i-GT", variant: "Lite",
  insuranceOption: "with", ncd: 0, depositOption: "full", customDeposit: 0, loanPeriod: 9,
};
const INSURANCE_RATE = 0.033;
const BASE_COMPARISON_YEARS = 7;
const $ = (selector) => document.querySelector(selector);
const form = $("#loanForm");
const brandSelect = $("#brandSelect");
const modelSelect = $("#modelSelect");
const variantSelect = $("#variantSelect");
const bodyPriceInput = $("#bodyPrice");
const rebateInput = $("#rebate");
const extrasInput = $("#extras");
const interestRateInput = $("#interestRate");
const ncdSelect = $("#ncd");
const customDepositInput = $("#customDeposit");
const loanPeriodSelect = $("#loanPeriod");
const templateOutput = $("#templateOutput");
let statusTimer = null;
let interestRateManual = false;
let rebateManual = false;
let rebateDate = null;
function selectedOffer() { return findOfficialRebate(brandSelect.value, modelSelect.value, variantSelect.value, $("#rebateYear").value, localDate()); }
function applyRebate() {
  rebateManual = false; rebateDate = localDate();
  const offer = selectedOffer();
  rebateInput.value = offer ? offer.amount : "";
}

// Editable flat-rate estimation policy, not a bank quote or guaranteed minimum rate.
function getDefaultInterestRate(price, model = getSelectedModel()) {
  if (model.registration === "Company Commercial") return 3.5;
  if (model.powertrain === "EV") return 2.35;
  if (price < 50000) return 3;
  if (price < 100000) return 2.5;
  return 2.35;
}

function money(value) {
  return "RM " + Number(value || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function percent(value) {
  return Number(value || 0).toLocaleString("en-MY", { maximumFractionDigits: 2 }) + "%";
}
function readNumber(input) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : 0;
}
function getCheckedValue(name) {
  return form.querySelector('input[name="' + name + '"]:checked')?.value || "";
}
function getSelectedModel() {
  return CAR_CATALOG[brandSelect.value].find((model) => model.name === modelSelect.value);
}
function getSelectedVariant() {
  return getSelectedModel().variants.find((variant) => variant.name === variantSelect.value);
}
function localDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function fillOptions(select, options, preferred) {
  select.replaceChildren(...options.map((value) => new Option(value, value)));
  if (options.includes(preferred)) select.value = preferred;
}
function populateModels(preferred = "") {
  fillOptions(modelSelect, CAR_CATALOG[brandSelect.value].map((model) => model.name), preferred);
  populateVariants();
}
function populateVariants(preferred = "") {
  fillOptions(variantSelect, getSelectedModel().variants.map((variant) => variant.name), preferred);
  updatePriceFromVariant();
}
function updatePriceFromVariant() {
  const variant = getSelectedVariant();
  bodyPriceInput.value = variant.bodyPrice;
  $("#rebateYear").value = "2026";
  applyRebate();
  interestRateManual = false;
  interestRateInput.value = getDefaultInterestRate(variant.bodyPrice);
  extrasInput.value = 0;
  $("#priceConfirmed").checked = false;
}
function calculateMonthly(principal, annualRate, years) {
  return years > 0 ? principal * (1 + annualRate / 100 * years) / (years * 12) : 0;
}
function getDepositAmount(otrTotal) {
  const option = getCheckedValue("depositOption");
  if (option === "ten") return otrTotal * 0.1;
  if (option === "custom") return Math.min(Math.max(readNumber(customDepositInput), 0), otrTotal);
  return 0;
}
function getDepositLabel() {
  return { ten: "10% deposit", custom: "Custom deposit", full: "Full loan" }[getCheckedValue("depositOption")];
}
function calculateValues() {
  if (!rebateManual && rebateDate !== localDate()) applyRebate();
  const model = getSelectedModel();
  const variant = getSelectedVariant();
  const hasBodyPrice = true;
  const inputPrice = Math.max(readNumber(bodyPriceInput), 0);
  const rebate = Math.max(readNumber(rebateInput), 0);
  const extras = Math.max(readNumber(extrasInput), 0);
  const interestRate = Math.max(readNumber(interestRateInput), 0);
  const insuranceOption = getCheckedValue("insuranceOption");
  const ncd = Math.min(Math.max(Number(ncdSelect.value) || 0, 0), 100);
  const loanPeriod = Number(loanPeriodSelect.value) || DEFAULT_STATE.loanPeriod;
  // Retail/OTR already includes published fees; do not add them again.
  const includedCharges = 0;
  const insuranceBase = inputPrice;
  const priceAfterRebate = Math.max(inputPrice - rebate, 0);
  const insurance = insuranceOption === "with" ? insuranceBase * INSURANCE_RATE * (1 - ncd / 100) : 0;
  const otrTotal = priceAfterRebate + includedCharges + extras + insurance;
  const depositAmount = getDepositAmount(otrTotal);
  const loanAfterDeposit = Math.max(otrTotal - depositAmount, 0);
  const errors = [];
  if (!form.checkValidity() || inputPrice <= 0) errors.push("Sila lengkapkan harga dan nilai input yang sah.");
  if (rebate > inputPrice) errors.push("Rebate tidak boleh melebihi harga kereta.");
  if ((model.estimated || model.needsConfirmation) && !$("#priceConfirmed").checked) {
    errors.push("Sahkan harga dan caj akhir dengan pengedar sebelum salin quotation.");
  }
  return {
    brand: brandSelect.value, model: model.name, variant: variant.name, modelData: model,
    variantData: variant, hasBodyPrice, inputPrice, rebate, extras, interestRate,
    insuranceOption, insuranceBase, ncd, loanPeriod, includedCharges, priceAfterRebate,
    insurance, otrTotal, depositAmount, loanAfterDeposit, depositLabel: getDepositLabel(),
    baseMonthly: calculateMonthly(loanAfterDeposit, interestRate, BASE_COMPARISON_YEARS),
    selectedMonthly: calculateMonthly(loanAfterDeposit, interestRate, loanPeriod),
    batteryMonthly: variant.batteryMonthly || 0, errors,
    priceOverride: inputPrice !== variant.bodyPrice,
  };
}
function buildTemplate(values) {
  const { variantData: variant } = values;
  const paymentLines = [values.depositLabel + ", " + values.loanPeriod + " years: *" + money(values.selectedMonthly) + "/month*"];
  const lines = [
    "*" + values.brand.toUpperCase() + " LOAN ESTIMATE*", "",
    "Model: " + values.model, "Variant: " + values.variant, "",
    (values.hasBodyPrice ? "Body price" : "OTR price (without insurance)") + ": " + money(values.inputPrice),
    "Rebate: " + money(values.rebate), "Price after rebate: " + money(values.priceAfterRebate),
  ];
  if (values.extras) lines.push("Additional colour / accessories: " + money(values.extras));
  if (values.insuranceOption === "with") {
    lines.push("", "Insurance base before rebate: " + money(values.insuranceBase),
      "Estimated insurance (" + percent(values.ncd) + " NCD): " + money(values.insurance));
  } else lines.push("", "Insurance: Excluded");
  lines.push("OTR " + (values.insuranceOption === "with" ? "with" : "without") + " insurance: *" + money(values.otrTotal) + "*", "",
    "Deposit amount: " + money(values.depositAmount), "Loan after deposit: " + money(values.loanAfterDeposit), "",
    "Interest rate: " + percent(values.interestRate) + " p.a. (flat estimate)", ...paymentLines);
  if (values.batteryMonthly) lines.push("", "Battery lease: " + money(values.batteryMonthly) + "/month for " + variant.batteryMonths + " months (separate from loan)",
    "Loan + battery lease (" + values.loanPeriod + " years loan): *" + money(values.selectedMonthly + values.batteryMonthly) + "/month*",
    "Battery lease continues for its own term, even if the car loan ends earlier.");
  return lines.join("\n");
}
function render() {
  const values = calculateValues();
  const model = values.modelData;
  const variant = values.variantData;
  const valid = values.errors.length === 0;
  const custom = getCheckedValue("depositOption") === "custom";
  customDepositInput.disabled = !custom;
  $("#customDepositWrap").hidden = !custom;
  ncdSelect.disabled = values.insuranceOption !== "with";
  $("#priceLabel").textContent = "Car Body Price";
  $("#priceStatus").textContent = (model.estimated ? "Harga anggaran" : "Disemak") + " · 30 Sep 2026" + (values.priceOverride ? " · Harga manual" : "");
  $("#priceSource").href = variant.source || model.source;
  $("#priceScope").textContent = "Semenanjung Malaysia · " + (model.registration || "Individu persendirian") + (model.powertrain ? " · " + model.powertrain : "");
  $("#priceNote").textContent = [
    "Body Price menggunakan retail/OTR tanpa insurance: " + money(variant.otrPrice) + ". Caj standard sudah termasuk; tidak ditambah lagi.",
    model.paintNote, model.note,
    localDate().slice(0, 7) !== CATALOG_CHECKED_AT.slice(0, 7) ? "Snapshot September 2026. Harga bulan semasa perlu disemak semula." : "",
  ].filter(Boolean).join(" ");
  const offer = selectedOffer();
  const audit = REBATE_AUDIT_SOURCES[values.brand];
  $("#rebateYearWrap").hidden = !["Honda", "Chery"].includes(values.brand);
  $("#rebateNote").textContent = (rebateManual ? "Rebate manual. " : offer ? "Default rasmi " + money(offer.amount) + ". " : "Rebate belum dapat disahkan; dibiarkan kosong, bukan pengesahan tiada promosi. ") + (offer?.note || audit.note) + (localDate() > REBATE_CHECKED_AT ? " Snapshot rebate perlu disemak semula untuk bulan semasa." : " Disemak 30 Sep 2026.");
  $("#rebateSource").href = offer?.source || audit.source;
  $("#interestNote").textContent = "Default anggaran flat: bawah RM50k 3.00%, RM50k–99,999.99 2.50%, RM100k ke atas / EV 2.35%, komersial 3.50%. Bukan kadar terendah dijamin; ubah mengikut tawaran bank. Kadar effective/reducing balance tidak boleh dimasukkan sebagai kadar flat.";
  $("#confirmationWrap").hidden = !model.estimated && !model.needsConfirmation;
  $("#insuranceNote").textContent = values.hasBodyPrice
    ? "Anggaran 3.3% daripada harga body sebelum rebate, selepas NCD. Bukan premium insurer sebenar; perlindungan tambahan tidak termasuk."
    : "Insurans 3.3% memerlukan harga body sah; harga OTR tidak dianggap sebagai harga body.";
  $("#estimateTerms").textContent = values.loanPeriod + " years · " + percent(values.interestRate) + " p.a.";
  templateOutput.value = valid ? buildTemplate(values) : values.errors.join("\n");
  const summaries = { summaryOtr: values.otrTotal, summaryLoan: values.loanAfterDeposit, summaryDeposit: values.depositAmount };
  Object.entries(summaries).forEach(([id, amount]) => { $("#" + id).textContent = valid ? money(amount) : "-"; });
  $("#summarySeven").textContent = valid ? money(values.baseMonthly) + "/mo" : "-";
  $("#summaryPeriodLabel").textContent = values.loanPeriod + " Years";
  $("#summarySelected").textContent = valid ? money(values.selectedMonthly) + "/mo" : "-";
  $("#batterySummary").hidden = !values.batteryMonthly;
  $("#batteryMonthly").textContent = money(values.batteryMonthly) + "/mo";
  $("#combinedMonthly").textContent = valid ? money(values.selectedMonthly + values.batteryMonthly) + "/mo" : "-";
  $("#batteryNote").textContent = (variant.batteryMonths || 0) + " bulan, berasingan daripada loan. Sewaan masih berjalan jika loan selesai lebih awal.";
  $("#validationNote").hidden = valid;
  $("#validationNote").textContent = values.errors.join(" ");
  $("#copyButton").disabled = !valid;
}
function setStatus(message, type = "") {
  const status = $("#copyState");
  status.textContent = message;
  status.className = "copy-state " + type;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => { status.textContent = "Ready"; status.className = "copy-state"; }, 2400);
}
async function copyTemplate() {
  render();
  if ($("#copyButton").disabled) return;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(templateOutput.value);
    else {
      $(".template-details").open = true;
      templateOutput.focus(); templateOutput.select();
      if (!document.execCommand("copy")) throw new Error("Copy unavailable");
      window.getSelection()?.removeAllRanges();
    }
    setStatus("Copied", "success");
  } catch {
    $(".template-details").open = true;
    templateOutput.focus(); templateOutput.select();
    setStatus("Select & copy", "error");
  }
}
function resetDefaults() {
  brandSelect.value = DEFAULT_STATE.brand;
  populateModels(DEFAULT_STATE.model);
  populateVariants(DEFAULT_STATE.variant);
  ncdSelect.value = String(DEFAULT_STATE.ncd);
  customDepositInput.value = DEFAULT_STATE.customDeposit;
  loanPeriodSelect.value = String(DEFAULT_STATE.loanPeriod);
  form.querySelector('input[name="insuranceOption"][value="' + DEFAULT_STATE.insuranceOption + '"]').checked = true;
  form.querySelector('input[name="depositOption"][value="' + DEFAULT_STATE.depositOption + '"]').checked = true;
  render();
}
brandSelect.addEventListener("change", () => { populateModels(); render(); });
modelSelect.addEventListener("change", () => { populateVariants(); render(); });
variantSelect.addEventListener("change", () => { updatePriceFromVariant(); render(); });
$("#rebateYear").addEventListener("change", () => { applyRebate(); render(); });
// Selects dispatch input before change; their dependent options are not rebuilt yet.
form.addEventListener("input", (event) => {
  if (event.target === interestRateInput) interestRateManual = true;
  if (event.target === rebateInput) rebateManual = true;
  if (event.target === bodyPriceInput && !interestRateManual) {
    interestRateInput.value = getDefaultInterestRate(readNumber(bodyPriceInput));
  }
  if (![brandSelect, modelSelect, variantSelect].includes(event.target)) render();
});
form.addEventListener("change", render);
$("#copyButton").addEventListener("click", copyTemplate);
$("#resetButton").addEventListener("click", resetDefaults);
fillOptions(brandSelect, Object.keys(CAR_CATALOG));
resetDefaults();
setInterval(() => { if (!document.hidden && rebateDate !== localDate()) render(); }, 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
