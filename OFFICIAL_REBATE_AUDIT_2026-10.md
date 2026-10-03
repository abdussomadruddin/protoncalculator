# October 2026 HQ Rebate Audit

Checked 4 October 2026 (Malaysia). Scope: 12 brands, 97 catalog model groups,
221 variants, including EVs, hybrids and commercial vehicles. This is a rebate
audit, not a price/catalog update. No claim is made that an unverified variant
has no promotion. All amounts are MYR; body prices and calculation code are unchanged.

## Verified Changes Compared Before Editing

Current defaults were blank on 4 October because the previous verification
cutoff was 30 September. Only the following six variant defaults are renewed.

| Brand | Model | Variant | Current default | New verified default | HQ source / date | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Proton | NEW S70 1.5 i-GT | Lite | Blank | 3,000 | [Model](https://www.proton.com/models/s70-prime-lite), checked 4 Oct; [retail PDF](https://cms-assets.proton.com/proton-cms-blob/media/wzjbgkbt/proton-s70mc2_pm_22092026.pdf), effective 22 Sep 2026 | Published introductory OTR 56,800 versus retail OTR 59,800 |
| Proton | e.MAS 5 | Prime | Blank | 3,000 | [Model](https://emas.proton.com/e-mas-5/), checked 4 Oct; [PDF](https://emas.proton.com/wp-content/uploads/2026/08/PROTON-eMAS-5-Price-List-Peninsular-Malaysia.pdf), August version, effective 17 May 2026 | Current special launch OTR 56,800 versus retail OTR 59,800 |
| Proton | e.MAS 5 | Premium | Blank | 3,000 | Same e.MAS 5 HQ sources | Current special launch OTR 69,800 versus retail OTR 72,800 |
| Proton | e.MAS 7 | Prime | Blank | 7,000 | [Model](https://emas.proton.com/e-mas-7/), checked 4 Oct, 2026 model | Exact Special Launch Rebate explicitly stated for this variant |
| Proton | e.MAS 7 | Premium | Blank | 7,000 | Same e.MAS 7 HQ source | Exact rebate explicitly stated for this variant |
| Proton | e.MAS 7 | Premium Plus | Blank | 7,000 | Same e.MAS 7 HQ source | Exact rebate explicitly stated for this variant |

These ongoing launch offers have no published end date in the checked sources.
The app verification cutoff is 4 October, NOT an invented manufacturer expiry or
a guarantee through 31 October. From 5 October defaults are blank until checked
again. Historical September records retain their original cutoff and amounts.
No trade-in, financing, loyalty or service benefit is included in these amounts.

## Coverage and Manual Review

Catalog coverage means every row was enumerated and mapped against available HQ
campaign scope. Complete current-month variant-level cash evidence was found for
six rows only. The remaining 215 rows are deliberately blank, not assigned zero
as a claim that no offer exists. The following HQ pages were checked live:

| Brand | Model groups / variants | HQ evidence and gap |
| --- | --- | --- |
| Proton | 11 / 30 | [ICE promotion](https://www.proton.com/offers/current-promotion/) ends 30 Sep. S70 Prime's exact introductory price not available on current HQ model text; do not infer it from Lite. [e.MAS 7 PHEV](https://emas.proton.com/e-mas-7-phev/) launch offer limited to first 5,000 bookings; eligibility cannot be assumed. |
| Perodua | 8 / 30 | [Main HQ](https://www.perodua.com.my/) QV-E special prices 63,499 / 87,499 conflict with [PDF](https://ev.perodua.com.my/assets/Peninsular_Malaysia_New_QV-E_Price_list-DpT2PuSS.pdf), effective 15 Sep, showing 53,499 / 77,499. Neither rebate adopted pending HQ clarification. Other current exact variant rebates unavailable. |
| Honda | 9 / 26 | [Fun Begins with Honda](https://www.honda.com.my/happening/), registrations 1-31 Oct: totals include conditional owner/family, early-bird, hybrid and other rewards; no exact base-cash variant table. September amounts not renewed. |
| Toyota | 21 / 42 | [October promo](https://www.toyota.com.my/en/promotions/monthly-promo.html): up-to/from totals, instalments and vouchers. Yaris Cross offers either 2,000 rebate + 2,000 voucher OR 3,500 rebate. No automatic package choice; no universal default. |
| Jaecoo | 5 / 7 | [HQ](https://www.omodajaecoo.com.my/) / [campaign](https://www.omodajaecoo.com.my/merdeka-sales): professional affiliate eligibility and HQ approval required; current exact universal variant amounts not published. |
| OMODA | 2 / 3 | Same HQ campaign; C9 and C9 PHEV not given assumed affiliate/overtrade cash amounts. |
| Chery | 8 / 9 | [Promotion](https://www.chery.my/promotion/) still titled Merdeka & Malaysia Day; YOM-specific prices published but October validity not established. No extension of old snapshot. |
| Jetour | 5 / 8 | [Campaigns](https://jetour.com.my/discover/events-campaigns/) lists January promotion and government-employee discount; not a universal October cash offer. |
| Mitsubishi | 4 / 14 | [Offers](https://www.mitsubishi-motors.com.my/current-offers/), [Xforce](https://www.mitsubishi-motors.com.my/promotion/book-a-xforce-deal/), [XPANDER](https://www.mitsubishi-motors.com.my/promotion/book-a-new-xpander-deal/), [Triton](https://www.mitsubishi-motors.com.my/promotion/book-an-all-new-triton-deal/): registrations 1-31 Oct. Xforce 5,000 and XPANDER 7,000 are alternatives to warranty/service packages, not universal across all package choices. Triton Diesel Support is not confirmed as an immediate price deduction; footer MY2025 conflicts with MY2026 variant notes. Owners/government/trade-in bonuses excluded. |
| Mazda | 10 / 29 | [Offers](https://mazda.com.my/offers), [news](https://mazda.com.my/news-and-events); limited-period Mazda3/CX-30/CX-5 banners are dated 6 Oct (after audit date), show starting prices without exact eligible variant rebates. Do not assume reductions across variants. |
| GWM | 7 / 8 | [Offers](https://www.gwm.com.my/en/deal) and all seven linked model offer pages inspected. No exact current cash amount; owner loyalty and expired Aug-Sep campaign excluded. |
| BYD | 7 / 15 | [HQ news/promotions](https://byd.simemotors.my/news-events): gifts, lucky draws and prior campaigns do not establish exact current universal cash rebates. |

## Validation and Release Boundary

Regression coverage checks all 221 current defaults and body prices at 4 Oct,
all historical September defaults, 1 Oct non-renewal, 5 Oct cutoff, manual override
and switching variants. Existing full suite also covers calculations, insurance,
downpayment, battery rental, UI, admin, API, notifications, schema and posters.
No standalone build, typecheck or lint script is configured. Syntax checks and
the Vercel production build must pass before release. No backend/schema changes,
announcements, price changes or unrelated files are included.

Local results: full `npm test` passed (all ten configured commands, including 18
API tests), `node --check` passed for rebates and both changed test files, and
`git diff --check` passed. Initial regression failures were stale audit-date and
incorrect test property expectations; corrected narrowly before the complete
passing run. Catalog, loan calculations, API and service worker have no diff.
