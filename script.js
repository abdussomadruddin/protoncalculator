const DEFAULT_STATE = {
  brand: "Proton", model: "NEW S70 1.5 i-GT", variant: "Lite", interestRate: 2.35,
  insuranceOption: "with", ncd: 0, depositOption: "full", customDeposit: 0, loanPeriod: 9,
};
const INSURANCE_RATE = 0.03;
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
const insuranceBodyInput = $("#insuranceBodyPrice");
let statusTimer = null;

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
function offerIsCurrent(offer) {
  return offer && localDate() <= offer.verifiedThrough;
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
  const model = getSelectedModel();
  const variant = getSelectedVariant();
  bodyPriceInput.value = variant.bodyPrice ?? variant.otrPrice;
  rebateInput.value = offerIsCurrent(model.rebate) ? model.rebate.amount : 0;
  extrasInput.value = 0;
  insuranceBodyInput.value = "";
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
  const model = getSelectedModel();
  const variant = getSelectedVariant();
  const hasBodyPrice = variant.bodyPrice !== null;
  const inputPrice = Math.max(readNumber(bodyPriceInput), 0);
  const rebate = Math.max(readNumber(rebateInput), 0);
  const extras = Math.max(readNumber(extrasInput), 0);
  const interestRate = Math.max(readNumber(interestRateInput), 0);
  const insuranceOption = getCheckedValue("insuranceOption");
  const ncd = Math.min(Math.max(Number(ncdSelect.value) || 0, 0), 100);
  const loanPeriod = Number(loanPeriodSelect.value) || DEFAULT_STATE.loanPeriod;
  // OTR minus selling price includes published mandatory accessories and registration.
  // OTR-only prices already include those charges, so never add them a second time.
  const includedCharges = hasBodyPrice ? Math.round((variant.otrPrice - variant.bodyPrice) * 100) / 100 : 0;
  const insuranceBase = hasBodyPrice ? inputPrice : Math.max(readNumber(insuranceBodyInput), 0);
  const priceAfterRebate = Math.max(inputPrice - rebate, 0);
  const insurance = insuranceOption === "with" ? insuranceBase * INSURANCE_RATE * (1 - ncd / 100) : 0;
  const otrTotal = priceAfterRebate + includedCharges + extras + insurance;
  const depositAmount = getDepositAmount(otrTotal);
  const loanAfterDeposit = Math.max(otrTotal - depositAmount, 0);
  const errors = [];
  if (!form.checkValidity() || inputPrice <= 0) errors.push("Sila lengkapkan harga dan nilai input yang sah.");
  if (rebate > inputPrice) errors.push("Rebate tidak boleh melebihi harga kereta.");
  if (insuranceOption === "with" && !hasBodyPrice && insuranceBase <= 0) {
    errors.push("Harga body tidak diterbitkan dalam sumber ini. Masukkan harga body sah untuk insurance 3%, atau pilih Exclude insurance.");
  }
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
    priceOverride: inputPrice !== (variant.bodyPrice ?? variant.otrPrice),
  };
}
function buildTemplate(values) {
  const { modelData: model, variantData: variant } = values;
  const paymentLines = [values.depositLabel + ", 7 years: *" + money(values.baseMonthly) + "/month*"];
  if (values.loanPeriod !== 7) paymentLines.push(values.depositLabel + ", " + values.loanPeriod + " years: *" + money(values.selectedMonthly) + "/month*");
  const lines = [
    "*" + values.brand.toUpperCase() + " LOAN ESTIMATE*", "",
    "Model: " + values.model, "Variant: " + values.variant, "",
    (values.hasBodyPrice ? "Body price" : "OTR price (without insurance)") + ": " + money(values.inputPrice),
    "Rebate: " + money(values.rebate), "Price after rebate: " + money(values.priceAfterRebate),
  ];
  if (values.includedCharges) lines.push("Published accessories & registration: " + money(values.includedCharges));
  if (values.extras) lines.push("Additional colour / accessories: " + money(values.extras));
  if (values.insuranceOption === "with") {
    lines.push("", "Insurance base before rebate: " + money(values.insuranceBase),
      "Estimated insurance (3%, " + percent(values.ncd) + " NCD): " + money(values.insurance));
  } else lines.push("", "Insurance: Excluded");
  lines.push("OTR " + (values.insuranceOption === "with" ? "with" : "without") + " insurance: *" + money(values.otrTotal) + "*", "",
    "Deposit amount: " + money(values.depositAmount), "Loan after deposit: " + money(values.loanAfterDeposit), "",
    "Interest rate: " + percent(values.interestRate) + " p.a. (flat estimate)", ...paymentLines);
  if (values.batteryMonthly) lines.push("", "Battery lease: " + money(values.batteryMonthly) + "/month for " + variant.batteryMonths + " months (separate from loan)",
    "Loan + battery lease (" + values.loanPeriod + " years loan): *" + money(values.selectedMonthly + values.batteryMonthly) + "/month*",
    "Battery lease continues for its own term, even if the car loan ends earlier.");
  lines.push("", "Registration: " + (model.registration || "Individual Private") + ", Peninsular Malaysia",
    "Official price snapshot: " + model.checkedAt, "Source: " + (variant.source || model.source));
  if (values.priceOverride) lines.push("Price manually adjusted; not the published source price.");
  if (!values.hasBodyPrice && values.insuranceOption === "with") lines.push("Insurance body price entered manually; not published in source.");
  if (values.rebate) lines.push(offerIsCurrent(model.rebate) && values.rebate === model.rebate.amount
    ? "Introductory offer: " + model.rebate.source + " (subject to terms and stock)" : "Rebate entered manually; confirm eligibility with dealer.");
  if (model.estimated) lines.push("Official source price is ESTIMATED; final dealer price must be confirmed.");
  if (model.needsConfirmation) lines.push(model.note);
  if (model.registration === "Company Commercial") lines.push("Commercial insurance requires an insurer quotation; 3% is an estimate only.");
  if (localDate().slice(0, 7) !== model.checkedAt.slice(0, 7)) lines.push("Price snapshot is not for the current month; recheck with dealer.");
  lines.push("Estimate only; subject to bank approval and insurer quotation.");
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
  insuranceBodyInput.disabled = values.hasBodyPrice || values.insuranceOption !== "with";
  $("#insuranceBodyWrap").hidden = insuranceBodyInput.disabled;
  $("#brandHeading").textContent = values.brand.toUpperCase();
  $("#priceLabel").textContent = values.hasBodyPrice ? "Car Body Price" : "OTR (excl. insurance)";
  $("#priceStatus").textContent = (model.estimated ? "Harga anggaran" : "Disemak") + " · 30 Sep 2026" + (values.priceOverride ? " · Harga manual" : "");
  $("#priceSource").href = variant.source || model.source;
  $("#priceScope").textContent = "Semenanjung Malaysia · " + (model.registration || "Individu persendirian") + (model.powertrain ? " · " + model.powertrain : "");
  $("#priceNote").textContent = [
    !values.hasBodyPrice ? "Sumber rasmi menerbitkan OTR sahaja, bukan harga body." : "OTR rasmi tanpa insurance: " + money(variant.otrPrice) + ". Caj diterbitkan: " + money(values.includedCharges) + ".",
    model.paintNote, model.note,
    localDate().slice(0, 7) !== CATALOG_CHECKED_AT.slice(0, 7) ? "Snapshot September 2026. Harga bulan semasa perlu disemak semula." : "",
  ].filter(Boolean).join(" ");
  $("#rebateNote").textContent = offerIsCurrent(model.rebate)
    ? money(model.rebate.amount) + " harga pengenalan. Tertakluk syarat dan stok; disemak 30 Sep 2026."
    : "Rebate manual. RM0 bermaksud tiada rebate dimasukkan, bukan pengesahan tiada promosi.";
  $("#confirmationWrap").hidden = !model.estimated && !model.needsConfirmation;
  $("#insuranceNote").textContent = values.hasBodyPrice
    ? "Anggaran 3% daripada harga body sebelum rebate, selepas NCD. Bukan premium insurer sebenar; perlindungan tambahan tidak termasuk."
    : "Insurans 3% memerlukan harga body sah; harga OTR tidak dianggap sebagai harga body.";
  $("#heroMonthly").textContent = valid ? money(values.selectedMonthly) : "Belum lengkap";
  $("#heroModel").textContent = values.brand + " " + values.model + " · " + values.variant;
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
  interestRateInput.value = DEFAULT_STATE.interestRate;
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
// Selects dispatch input before change; their dependent options are not rebuilt yet.
form.addEventListener("input", (event) => {
  if (![brandSelect, modelSelect, variantSelect].includes(event.target)) render();
});
form.addEventListener("change", render);
$("#copyButton").addEventListener("click", copyTemplate);
$("#resetButton").addEventListener("click", resetDefaults);
fillOptions(brandSelect, Object.keys(CAR_CATALOG));
resetDefaults();
