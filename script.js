const PROTON_MODELS = {
  "Proton S70": [
    { name: "Executive", price: 68800 },
    { name: "Premium", price: 79800 },
    { name: "Flagship", price: 89800 },
    { name: "Flagship X", price: 94900 },
  ],
  "Proton X50": [
    { name: "Executive", price: 89800 },
    { name: "Premium", price: 101800 },
    { name: "Flagship", price: 113300 },
  ],
  "Proton X70": [
    { name: "Standard", price: 99800 },
    { name: "Executive", price: 110800 },
    { name: "Premium", price: 123800 },
  ],
  "Proton X90": [
    { name: "Standard", price: 99800 },
    { name: "Executive", price: 113800 },
    { name: "Premium", price: 123800 },
    { name: "Flagship", price: 146800 },
  ],
  "Proton All New Saga": [
    { name: "Standard", price: 38990 },
    { name: "Executive", price: 43990 },
    { name: "Premium", price: 48990 },
  ],
  "Proton Persona": [
    { name: "Standard", price: 47800 },
    { name: "Executive", price: 53300 },
    { name: "Premium", price: 58300 },
  ],
  "Proton Iriz": [
    { name: "Standard", price: 42800 },
    { name: "Executive", price: 50300 },
    { name: "Active", price: 57300 },
  ],
};

const DEFAULT_STATE = {
  model: "Proton S70",
  variant: "Flagship X",
  interestRate: 2.3,
  insuranceOption: "with",
  ncd: 0,
  depositOption: "full",
  customDeposit: 0,
  loanPeriod: 9,
};

const INSURANCE_RATE = 0.03;
const BASE_COMPARISON_YEARS = 7;
const MODEL_REBATES = {
  "Proton All New Saga": 500,
  "Proton Persona": 2000,
  "Proton S70": 5000,
  "Proton X70": 7000,
  "Proton X90": 7000,
};

const form = document.querySelector("#loanForm");
const modelSelect = document.querySelector("#modelSelect");
const variantSelect = document.querySelector("#variantSelect");
const bodyPriceInput = document.querySelector("#bodyPrice");
const rebateInput = document.querySelector("#rebate");
const interestRateInput = document.querySelector("#interestRate");
const ncdSelect = document.querySelector("#ncd");
const customDepositInput = document.querySelector("#customDeposit");
const customDepositWrap = document.querySelector("#customDepositWrap");
const loanPeriodSelect = document.querySelector("#loanPeriod");
const templateOutput = document.querySelector("#templateOutput");
const copyButton = document.querySelector("#copyButton");
const resetButton = document.querySelector("#resetButton");
const copyState = document.querySelector("#copyState");
const summaryOtr = document.querySelector("#summaryOtr");
const summaryLoan = document.querySelector("#summaryLoan");
const summaryDeposit = document.querySelector("#summaryDeposit");
const summarySeven = document.querySelector("#summarySeven");
const summarySelected = document.querySelector("#summarySelected");
const summaryPeriodLabel = document.querySelector("#summaryPeriodLabel");

let statusTimer = null;

function money(value) {
  return `RM ${Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function percent(value) {
  return `${Number(value || 0).toLocaleString("en-MY", {
    maximumFractionDigits: 2,
  })}%`;
}

function readNumber(input) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : 0;
}

function getCheckedValue(name) {
  const checked = form.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}

function getSelectedVariant() {
  const variants = PROTON_MODELS[modelSelect.value] || [];
  return variants.find((variant) => variant.name === variantSelect.value) || variants[0];
}

function getAutoRebate(model, variant) {
  if (model === "Proton X50") {
    return variant === "Flagship" ? 7000 : 5000;
  }

  return MODEL_REBATES[model] || 0;
}

function populateModels() {
  modelSelect.innerHTML = Object.keys(PROTON_MODELS)
    .map((model) => `<option value="${model}">${model}</option>`)
    .join("");
}

function populateVariants(preferredVariant = "") {
  const variants = PROTON_MODELS[modelSelect.value] || [];
  variantSelect.innerHTML = variants
    .map((variant) => `<option value="${variant.name}">${variant.name}</option>`)
    .join("");

  const hasPreferred = variants.some((variant) => variant.name === preferredVariant);
  variantSelect.value = hasPreferred ? preferredVariant : variants[0]?.name || "";
  updatePriceFromVariant();
  updateRebateFromSelection();
}

function updatePriceFromVariant() {
  const selectedVariant = getSelectedVariant();
  if (selectedVariant) {
    bodyPriceInput.value = selectedVariant.price;
  }
}

function updateRebateFromSelection() {
  rebateInput.value = getAutoRebate(modelSelect.value, variantSelect.value);
}

function calculateMonthly(principal, annualRate, years) {
  const totalMonths = years * 12;
  if (!totalMonths) {
    return 0;
  }

  const totalPayable = principal + principal * (annualRate / 100) * years;
  return totalPayable / totalMonths;
}

function getDepositAmount(otrTotal) {
  const depositOption = getCheckedValue("depositOption");

  if (depositOption === "ten") {
    return otrTotal * 0.1;
  }

  if (depositOption === "custom") {
    return Math.min(Math.max(readNumber(customDepositInput), 0), otrTotal);
  }

  return 0;
}

function getDepositLabel() {
  const depositOption = getCheckedValue("depositOption");

  if (depositOption === "ten") {
    return "10% deposit";
  }

  if (depositOption === "custom") {
    return "Custom deposit";
  }

  return "Full loan";
}

function buildTemplate(values) {
  const insuranceLine =
    values.insuranceOption === "with"
      ? `Estimated insurance (${percent(values.ncd)} NCD): ${money(values.insurance)}`
      : `Insurance: Excluded`;

  const otrLine =
    values.insuranceOption === "with"
      ? `OTR with insurance: *${money(values.otrTotal)}*`
      : `OTR without insurance: *${money(values.otrTotal)}*`;

  const paymentLines = [
    `${values.depositLabel}, ${BASE_COMPARISON_YEARS} years: *${money(values.baseMonthly)}/month*`,
  ];

  if (values.loanPeriod !== BASE_COMPARISON_YEARS) {
    paymentLines.push(
      `${values.depositLabel}, ${values.loanPeriod} years: *${money(values.selectedMonthly)}/month*`,
    );
  }

  return [
    "*PROTON LOAN ESTIMATE*",
    "",
    `Model: ${values.model}`,
    `Variant: ${values.variant}`,
    "",
    `Body price: ${money(values.bodyPrice)}`,
    `Rebate: ${money(values.rebate)}`,
    `Price after rebate: ${money(values.priceAfterRebate)}`,
    "",
    insuranceLine,
    otrLine,
    "",
    `Deposit amount: ${money(values.depositAmount)}`,
    `Loan after deposit: ${money(values.loanAfterDeposit)}`,
    "",
    ...paymentLines,
  ].join("\n");
}

function calculateValues() {
  const bodyPrice = Math.max(readNumber(bodyPriceInput), 0);
  const rebate = Math.max(readNumber(rebateInput), 0);
  const interestRate = Math.max(readNumber(interestRateInput), 0);
  const insuranceOption = getCheckedValue("insuranceOption");
  const ncd = Math.max(Number(ncdSelect.value) || 0, 0);
  const loanPeriod = Number(loanPeriodSelect.value) || DEFAULT_STATE.loanPeriod;
  const priceAfterRebate = Math.max(bodyPrice - rebate, 0);
  const insurance =
    insuranceOption === "with"
      ? priceAfterRebate * INSURANCE_RATE * Math.max(1 - ncd / 100, 0)
      : 0;
  const otrTotal = priceAfterRebate + insurance;
  const depositAmount = getDepositAmount(otrTotal);
  const loanAfterDeposit = Math.max(otrTotal - depositAmount, 0);
  const baseMonthly = calculateMonthly(loanAfterDeposit, interestRate, BASE_COMPARISON_YEARS);
  const selectedMonthly = calculateMonthly(loanAfterDeposit, interestRate, loanPeriod);

  return {
    model: modelSelect.value,
    variant: variantSelect.value,
    bodyPrice,
    rebate,
    interestRate,
    insuranceOption,
    ncd,
    loanPeriod,
    priceAfterRebate,
    insurance,
    otrTotal,
    depositAmount,
    depositLabel: getDepositLabel(),
    loanAfterDeposit,
    baseMonthly,
    selectedMonthly,
  };
}

function render() {
  const values = calculateValues();
  const template = buildTemplate(values);
  const isCustomDeposit = getCheckedValue("depositOption") === "custom";

  customDepositInput.disabled = !isCustomDeposit;
  customDepositWrap.classList.toggle("is-muted", !isCustomDeposit);
  templateOutput.value = template;
  summaryOtr.textContent = money(values.otrTotal);
  summaryLoan.textContent = money(values.loanAfterDeposit);
  summaryDeposit.textContent = money(values.depositAmount);
  summarySeven.textContent = `${money(values.baseMonthly)}/mo`;
  summaryPeriodLabel.textContent = `${values.loanPeriod} Years`;
  summarySelected.textContent = `${money(values.selectedMonthly)}/mo`;
}

function setStatus(message, type = "") {
  copyState.textContent = message;
  copyState.classList.remove("success", "error");

  if (type) {
    copyState.classList.add(type);
  }

  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    copyState.textContent = "Ready";
    copyState.classList.remove("success", "error");
  }, 2400);
}

async function copyTemplate() {
  const template = templateOutput.value;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(template);
    } else {
      templateOutput.focus();
      templateOutput.select();
      document.execCommand("copy");
      window.getSelection()?.removeAllRanges();
    }

    setStatus("Copied", "success");
  } catch (error) {
    templateOutput.focus();
    templateOutput.select();
    setStatus("Select & copy", "error");
  }
}

function resetDefaults() {
  modelSelect.value = DEFAULT_STATE.model;
  populateVariants(DEFAULT_STATE.variant);
  interestRateInput.value = DEFAULT_STATE.interestRate;
  ncdSelect.value = String(DEFAULT_STATE.ncd);
  customDepositInput.value = DEFAULT_STATE.customDeposit;
  loanPeriodSelect.value = String(DEFAULT_STATE.loanPeriod);
  form.querySelector(`input[name="insuranceOption"][value="${DEFAULT_STATE.insuranceOption}"]`).checked = true;
  form.querySelector(`input[name="depositOption"][value="${DEFAULT_STATE.depositOption}"]`).checked = true;
  render();
}

modelSelect.addEventListener("change", () => {
  populateVariants();
  render();
});

variantSelect.addEventListener("change", () => {
  updatePriceFromVariant();
  updateRebateFromSelection();
  render();
});

form.addEventListener("input", render);
form.addEventListener("change", render);
copyButton.addEventListener("click", copyTemplate);
resetButton.addEventListener("click", resetDefaults);

populateModels();
resetDefaults();
