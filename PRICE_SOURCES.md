# Official Price Snapshot

Checked: 30 September 2026 (Malaysia time). Market: Peninsular Malaysia.
This is a manually verified snapshot of current manufacturer pages and their linked PDFs, not a live price feed. An older PDF effective date is retained when that document is still linked by the current manufacturer page.

## Coverage

Seven requested brands, 67 model groups, 152 priced selections. Colour-priced Ativa and Traz selections are expanded; optional colour/accessory charges elsewhere are entered separately and are not included in standard base prices.

Only officially offered Malaysian models in the current brand catalogs are included. Recon/import vehicles, overseas variants, discontinued models and speculative prices are excluded. Omoda E5 remains in Chery because Chery Malaysia lists it; Omoda C9 is a separate marque and is not silently relabelled Jaecoo.

## Important Exceptions

- Per the user's updated definition, the app field labelled Body Price uses published retail/OTR without insurance for all 152 selections, not net selling price. Net selling prices are preserved separately as sellingPrice for audit.
- NEW S70 Lite uses RM59,800 retail without insurance, not RM59,165 net selling price. All rebates now default to an empty input, including previously verified introductory offers; blank is treated as zero only for arithmetic.
- Retail/OTR already includes required registration and standard accessories. No registration/accessory fee is added again, and the Published accessories & registration line is removed from WhatsApp text.
- WhatsApp includes only the selected loan tenure and its monthly instalment, not a separate 7-year comparison. Battery leasing remains a separately identified monthly obligation where applicable.
- Insurance is the user's 3% estimate on the retail-based Body Price before rebate, reduced by NCD. It is not an official insurer premium. Colour/accessory extras are not insured in this estimate. Commercial coverage needs an insurer quotation.
- QV-E: current price PDF effective 15 September supersedes the earlier June news release. BaaS body RM69,551 / retail RM69,999; full purchase body RM93,551 / OTR RM93,999. Current special rebate RM16,500; resulting acquisition prices RM53,499 and RM77,499. BaaS adds RM215 monthly for 108 months, separately from the car loan.
- Toyota Hiace Panel Van: the manufacturer only provides Company Commercial pricing in the current PDF. This exception is displayed explicitly; it is not labelled private individual.
- Honda City Hatchback: the official plate row is RM150, but published retail minus selling is RM340 rather than RM440. Published selling and retail totals are preserved without double-charging the conflicting row.
- Jetour T1: source explicitly says Estimated Price List. Copy requires dealer price confirmation.
- Jetour T2 i-DM: the PM-linked PDF table says East Malaysia while its footer covers both regions. Price and charges require dealer confirmation before copy.
- Chery Tiggo Cross Sport Edition is announced for launch next month; no official price is supplied as of this snapshot. No price has been invented. [Official announcement](https://www.chery.my/2026/09/29/chery-malaysia-gives-a-sneak-peek-at-the-upcoming-chery-tiggo-cross-sports-edition/).
- Rebates are always blank on model/variant changes and reset. Historical verified introductory offer metadata is retained in the catalog for audit but is not auto-applied. Conditional trade-in/loyalty offers and “up to” amounts are not applied universally.
- The app warns when the price snapshot is not the current month. Source, registration, snapshot and advisory metadata are kept in the app, not appended to the customer-facing WhatsApp template.
- Default brand/model/variant remain Proton / NEW S70 1.5 i-GT / Lite. Default interest is an editable application estimation policy: below RM50,000 3.00%, RM50,000 to RM99,999.99 2.50%, RM100,000+ 2.35%; EV 2.35%, Company Commercial 3.50%. Category overrides take precedence over price. NEW S70 Lite therefore defaults to 2.50%. These are not bank-published price tiers and must not be described as guaranteed lowest rates.
- Interest policy applies on model/variant changes and retail-price edits until the interest field is manually overridden. Changing tenure/deposit does not discard a manual rate. Actual bank rate and method must be confirmed. Current official bank pages distinguish effective/reducing-balance rates from flat estimates; do not enter an effective rate into the flat calculator. [CIMB rates](https://www.cimb.com.my/en/personal/help-support/rates-charges/interest-rates-charges/interest-rates/car-loans.html), [Maybank Hire Purchase](https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/loans/hire_purchase/hire_purchase.page).

## Verification

Playwright checks every priced selection, original price, source link, template brand, OTR totals, default values, loan terms 1-9, deposit modes/capping, NCD, manual-price safety, battery lease separation, confirmation gates, expired rebate cutoff and clipboard. Screenshots checked at 320, 390, 430, 768 and 1280 px. Browser emulation does not prove physical-device installation.

PDF price pairs were checked against extracted text; image-only/poorly encoded Jaecoo, e.MAS, QV-E and Jetour tables were rendered for visual verification. Honda uses the live official pricing tables/APIs. Perodua uses the current non-legacy price table in its official calculator. No dealer or aggregator prices were used.

Run browser tests with Node.js, Playwright and installed Chrome:

```sh
node tests/calculator.cjs
```

## Price Register

Amounts below are RM, exclude insurance, and precede any rebate. The historical Body / Selling column records published net selling price; the app Body Price uses the OTR excl. insurance column for every selection. A dash means net selling price is not published in the source used.

| Brand | Model | Variant | Body / Selling | OTR excl. insurance | Source effective date | Registration | Official source |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| Proton | NEW S70 1.5 i-GT | Lite | 59165.00 | 59800.00 | 2026-09-22 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/wzjbgkbt/proton-s70mc2_pm_22092026.pdf) |
| Proton | NEW S70 1.5 i-GT | Prime | 62165.00 | 62800.00 | 2026-09-22 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/wzjbgkbt/proton-s70mc2_pm_22092026.pdf) |
| Proton | S70 Turbo | 1.5TD Premium | 79165.00 | 79800.00 | 2026-09-22 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/5o1jezwa/proton-s70mc_pm_22092026.pdf) |
| Proton | S70 Turbo | 1.5TD Flagship | 87565.00 | 89800.00 | 2026-09-22 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/5o1jezwa/proton-s70mc_pm_22092026.pdf) |
| Proton | S70 Turbo | 1.5TD Flagship X | 88686.00 | 94800.00 | 2026-09-22 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/5o1jezwa/proton-s70mc_pm_22092026.pdf) |
| Proton | All New Saga | 1.5 Standard | 38405.00 | 38990.00 | 2025-11-27 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/ip4lyxes/all-new-proton-saga-pricelist_pm.pdf) |
| Proton | All New Saga | 1.5 Executive | 44405.00 | 44990.00 | 2025-11-27 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/ip4lyxes/all-new-proton-saga-pricelist_pm.pdf) |
| Proton | All New Saga | 1.5 Premium | 49405.00 | 49990.00 | 2025-11-27 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/ip4lyxes/all-new-proton-saga-pricelist_pm.pdf) |
| Proton | Persona | 1.6 Standard CVT | 47215.00 | 47800.00 | Not stated / live page | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/5lifygov/pm-persona-standard.pdf) |
| Proton | Persona | 1.6 Executive CVT | 52715.00 | 53300.00 | Not stated / live page | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/jewb1kp0/pm-persona-executive.pdf) |
| Proton | Persona | 1.6 Premium CVT | 57715.00 | 58300.00 | Not stated / live page | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/dwslx0px/pm-persona-premium.pdf) |
| Proton | Iriz | 1.3 Standard CVT | 42385.00 | 42800.00 | 2022-08-02 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/ohdf145c/pm-iriz-standard.pdf) |
| Proton | Iriz | 1.6 Executive CVT | 49715.00 | 50300.00 | 2022-08-02 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/5rxbyokc/pm-iriz-executive.pdf) |
| Proton | Iriz | 1.6 Active CVT | 56715.00 | 57300.00 | 2022-08-02 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/aejax1dj/pm-iriz-active.pdf) |
| Proton | All New X50 | 1.5TD Executive | 89120.00 | 89800.00 | Not stated / live page | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/mi4dqgcv/all-new-proton-x50-pricelist_pm.pdf) |
| Proton | All New X50 | 1.5TD Premium | 96520.00 | 101800.00 | Not stated / live page | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/mi4dqgcv/all-new-proton-x50-pricelist_pm.pdf) |
| Proton | All New X50 | 1.5TD Flagship | 107820.00 | 113300.00 | Not stated / live page | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/mi4dqgcv/all-new-proton-x50-pricelist_pm.pdf) |
| Proton | X70 | 1.5TD Executive | 106123.00 | 106800.00 | 2026-01-28 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/y52ki4nr/pm_pricelist-2026-proton-x70-28-jan.pdf) |
| Proton | X70 | 1.5TD Premium | 117323.00 | 119800.00 | 2026-01-28 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/y52ki4nr/pm_pricelist-2026-proton-x70-28-jan.pdf) |
| Proton | X90 | 1.5TD Lite | 106093.00 | 106800.00 | 2026-03-11 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/lzlh4qil/pm_pricelist-2026-proton-x90-11-mar.pdf) |
| Proton | X90 | 1.5TD Prime | 114293.00 | 116800.00 | 2026-03-11 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/lzlh4qil/pm_pricelist-2026-proton-x90-11-mar.pdf) |
| Proton | X90 | 1.5TD Prime X | 119544.00 | 122800.00 | 2026-03-11 | Individual Private | [Manufacturer](https://cms-assets.proton.com/proton-cms-blob/media/lzlh4qil/pm_pricelist-2026-proton-x90-11-mar.pdf) |
| Proton | e.MAS 5 | Prime | 59322.00 | 59800.00 | 2026-05-17 | Individual Private | [Manufacturer](https://emas.proton.com/wp-content/uploads/2026/08/PROTON-eMAS-5-Price-List-Peninsular-Malaysia.pdf) |
| Proton | e.MAS 5 | Premium | 72292.00 | 72800.00 | 2026-05-17 | Individual Private | [Manufacturer](https://emas.proton.com/wp-content/uploads/2026/08/PROTON-eMAS-5-Price-List-Peninsular-Malaysia.pdf) |
| Proton | e.MAS 7 | Prime | 103172.00 | 103800.00 | 2026-06-11 | Individual Private | [Manufacturer](https://emas.proton.com/wp-content/uploads/2026/06/PROTON-e.MAS-7-Price-List-Peninsular-Malaysia.pdf) |
| Proton | e.MAS 7 | Premium | 119172.00 | 119800.00 | 2026-06-11 | Individual Private | [Manufacturer](https://emas.proton.com/wp-content/uploads/2026/06/PROTON-e.MAS-7-Price-List-Peninsular-Malaysia.pdf) |
| Proton | e.MAS 7 | Premium Plus | 125172.00 | 125800.00 | 2026-06-11 | Individual Private | [Manufacturer](https://emas.proton.com/wp-content/uploads/2026/06/PROTON-e.MAS-7-Price-List-Peninsular-Malaysia.pdf) |
| Proton | e.MAS 7 PHEV | Prime | 109430.00 | 109800.00 | 2026-08-26 | Individual Private | [Manufacturer](https://emas.proton.com/wp-content/uploads/2026/08/PROTON-e.MAS-7-PHEV-Price-List-Peninsular-Malaysia.pdf) |
| Proton | e.MAS 7 PHEV | Premium | 123430.00 | 123800.00 | 2026-08-26 | Individual Private | [Manufacturer](https://emas.proton.com/wp-content/uploads/2026/08/PROTON-e.MAS-7-PHEV-Price-List-Peninsular-Malaysia.pdf) |
| Proton | e.MAS 7 PHEV | Premium Plus | 129430.00 | 129800.00 | 2026-08-26 | Individual Private | [Manufacturer](https://emas.proton.com/wp-content/uploads/2026/08/PROTON-e.MAS-7-PHEV-Price-List-Peninsular-Malaysia.pdf) |
| Perodua | Axia | 1.0L E (5MT) | - | 22000.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Axia | 1.0L G (D-CVT) | - | 33900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Axia | 1.0L X (D-CVT) | - | 38500.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Axia | 1.0L SE (D-CVT) | - | 43000.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Axia | 1.0L AV (D-CVT) | - | 49000.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Bezza | 1.0 G Manual | - | 34580.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Bezza | 1.0 G Auto | - | 36580.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Bezza | 1.3 X Auto | - | 43980.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Bezza | 1.3 AV Auto | - | 49980.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Myvi | 1.3L G CVT (Without PSDA) | - | 46500.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Myvi | 1.3L G CVT (With PSDA) | - | 48500.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Myvi | 1.5L X CVT | - | 50900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Myvi | 1.5L H CVT | - | 54900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Myvi | 1.5L AV CVT | - | 59900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Ativa | 1.0L X Turbo CVT - Metallic | - | 62500.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Ativa | 1.0L H Turbo CVT - Metallic | - | 67300.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Ativa | 1.0L H Turbo CVT - Special Metallic | - | 67800.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Ativa | 1.0L AV Turbo CVT - Metallic | - | 72600.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Ativa | 1.0L AV Turbo CVT - Special Metallic | - | 73100.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Ativa | 1.0L AV Turbo CVT - 2 Tone Special Metallic | - | 73400.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Alza | 1.5L X D-CVT | - | 62500.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Alza | 1.5L H D-CVT | - | 68000.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Alza | 1.5L AV D-CVT | - | 75500.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Aruz | 1.5 X Auto | - | 68900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Aruz | 1.5 AV Auto | - | 73900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Traz | 1.5 X D-CVT - Metallic / Solid | - | 76100.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Traz | 1.5 H D-CVT - Metallic / Solid | - | 81100.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | Traz | 1.5 H D-CVT - 2-Tone Metallic | - | 82000.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.perodua.com.my/loan-calculator) |
| Perodua | QV-E | Battery-as-a-Service (BaaS) | 69551.00 | 69999.00 | 2026-09-15 | Individual Private | [Manufacturer](https://ev.perodua.com.my/assets/Peninsular_Malaysia_New_QV-E_Price_list-DpT2PuSS.pdf) |
| Perodua | QV-E | Full Purchase (Battery Included) | 93551.00 | 93999.00 | 2026-09-15 | Individual Private | [Manufacturer](https://ev.perodua.com.my/assets/Peninsular_Malaysia_New_QV-E_Price_list-DpT2PuSS.pdf) |
| Honda | City | 1.5L E | 89560.00 | 89900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/city/pricing) |
| Honda | City | 1.5L V | 94560.00 | 94900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/city/pricing) |
| Honda | City | 1.5L RS | 99560.00 | 99900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/city/pricing) |
| Honda | City | 1.5L e:HEV RS | 111560.00 | 111900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/city/pricing) |
| Honda | City Hatchback | 1.5L S | 85560.00 | 85900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/city-hatchback/pricing) |
| Honda | City Hatchback | 1.5L E | 90560.00 | 90900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/city-hatchback/pricing) |
| Honda | City Hatchback | 1.5L V | 95560.00 | 95900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/city-hatchback/pricing) |
| Honda | City Hatchback | 1.5L RS | 100560.00 | 100900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/city-hatchback/pricing) |
| Honda | City Hatchback | 1.5L e:HEV RS | 112560.00 | 112900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/city-hatchback/pricing) |
| Honda | Civic | 1.5L E | 133560.00 | 133900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/civic/pricing) |
| Honda | Civic | 1.5L V | 144560.00 | 144900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/civic/pricing) |
| Honda | Civic | 1.5L RS | 149560.00 | 149900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/civic/pricing) |
| Honda | Civic | 2.0L e:HEV RS | 167123.50 | 167900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/civic/pricing) |
| Honda | CR-V | 2.0L e:HEV E | 177362.80 | 178200.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/crv/pricing) |
| Honda | CR-V | 1.5L V | 181530.00 | 181900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/crv/pricing) |
| Honda | CR-V | 2.0L e:HEV RS | 195062.80 | 195900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/crv/pricing) |
| Honda | HR-V | 1.5L S | 115530.00 | 115900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/hrv/pricing) |
| Honda | HR-V | 1.5L T E | 130530.00 | 130900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/hrv/pricing) |
| Honda | HR-V | 1.5L T V | 137530.00 | 137900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/hrv/pricing) |
| Honda | HR-V | 1.5L e:HEV RS | 143530.00 | 143900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/hrv/pricing) |
| Honda | WR-V | 1.5L E | 94560.00 | 94900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/wr-v/pricing) |
| Honda | WR-V | 1.5L V | 98560.00 | 98900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/wr-v/pricing) |
| Honda | WR-V | 1.5L RS | 104560.00 | 104900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/wr-v/pricing) |
| Honda | Civic Type R | 2.0L VTEC Turbo 6MT | 399072.00 | 399900.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/type-r/pricing) |
| Honda | e:N1 | EV | 149402.00 | 150060.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/en1/pricing) |
| Honda | Prelude | 2.0L e:HEV | 277173.50 | 278000.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.honda.com.my/model/prelude/pricing) |
| Toyota | Vios | 1.5E AT | 90310.00 | 90600.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/vios-hev/july-2026/1.0-pm(ip)-vios.pdf) |
| Toyota | Vios | 1.5G AT | 96310.00 | 96600.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/vios-hev/july-2026/1.0-pm(ip)-vios.pdf) |
| Toyota | Vios | 1.5 HEV AT | 103610.00 | 103900.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/vios-hev/july-2026/1.0-pm(ip)-vios.pdf) |
| Toyota | Vios | 1.5 HEV GR-S AT | 109610.00 | 109900.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/vios-hev/july-2026/1.0-pm(ip)-vios.pdf) |
| Toyota | Yaris | 1.5E AT | 87710.00 | 88000.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/yaris/july-2026/1.0-pm(ip)-yaris-price-list.pdf) |
| Toyota | Yaris | 1.5G AT | 91310.00 | 91600.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/yaris/july-2026/1.0-pm(ip)-yaris-price-list.pdf) |
| Toyota | Yaris Cross | 1.5S | 99580.00 | 99900.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/toyota-yaris-cros-and-hev/july-2026/1.0-pm(ip)-yaris-cross.pdf) |
| Toyota | Yaris Cross | 1.5S HEV | 109580.00 | 109900.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/toyota-yaris-cros-and-hev/july-2026/1.0-pm(ip)-yaris-cross.pdf) |
| Toyota | Corolla | 1.8G AT | 144120.80 | 144800.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/corolla/july-2026/1.0-pm-(ipte)-corolla.pdf) |
| Toyota | Corolla | 1.8 GR Sport AT | 149120.80 | 149800.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/corolla/july-2026/1.0-pm-(ipte)-corolla.pdf) |
| Toyota | Corolla Cross | 1.8V AT | 133090.60 | 133800.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/corolla-cross/july-2026/v2/1.0-pm(ip)-corolla-cross-price-list.pdf) |
| Toyota | Corolla Cross | 1.8 HEV AT | 140090.60 | 140800.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/corolla-cross/july-2026/v2/1.0-pm(ip)-corolla-cross-price-list.pdf) |
| Toyota | Corolla Cross | 1.8 HEV GR-S AT | 148090.60 | 148800.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/corolla-cross/july-2026/v2/1.0-pm(ip)-corolla-cross-price-list.pdf) |
| Toyota | Camry | 2.5V AT | 220533.00 | 221800.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/camry-hev-and-ice/july-2026/1.0-pm-(ipte)-camry.pdf) |
| Toyota | Camry | 2.5 HEV | 247533.00 | 248800.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/camry-hev-and-ice/july-2026/1.0-pm-(ipte)-camry.pdf) |
| Toyota | Veloz | 1.5 AT | 94710.00 | 95000.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/veloz/july-2026/1.0-pm-veloz-price-list.pdf) |
| Toyota | Innova Zenix | 2.0V | 164226.50 | 165000.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/zenix/july-2026/1.0-pm-(ipte)-innova-zenix.pdf) |
| Toyota | Innova Zenix | 2.0 HEV | 201226.50 | 202000.00 | 2026-07-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/zenix/july-2026/1.0-pm-(ipte)-innova-zenix.pdf) |
| Toyota | Harrier | 2.5 HEV | 287770.40 | 289000.00 | 2026-03-02 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/harrier-hev/february-2026/1.0-pm-harrier-hev-price-list.pdf) |
| Toyota | Alphard | 2.4T AT Executive Lounge | 546845.60 | 548000.00 | 2026-08-03 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/alphard/august-2026/1.0-pm-toyota-alphard-price-list.pdf) |
| Toyota | Vellfire | 2.5 AT | 446764.80 | 448000.00 | 2026-08-03 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/vellfire/august-2026/1.0-pm-toyota-vellfire-price-list.pdf) |
| Toyota | Vellfire | 2.5 HEV AT Executive Lounge | 548670.40 | 549900.00 | 2026-08-03 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/vellfire/august-2026/1.0-pm-toyota-vellfire-price-list.pdf) |
| Toyota | Fortuner | 2.4 AT 4x4 | 194775.60 | 195880.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/fortuner/july-2026/v4/1.0-pm-(ipte)-fortuner-price-list.pdf) |
| Toyota | Fortuner | 2.8 VRZ AT 4x4 | 240282.00 | 241880.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/fortuner/july-2026/v4/1.0-pm-(ipte)-fortuner-price-list.pdf) |
| Toyota | Fortuner | 2.7 SRZ AT 4x4 | 201379.60 | 202880.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/fortuner/july-2026/v4/1.0-pm-(ipte)-fortuner-price-list.pdf) |
| Toyota | Hilux | Single Cab 2.4 MT 4x4 | 103775.60 | 104880.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/hilux/july-2026/v3/1.0-pm-(ipte)-hilux-price-list.pdf) |
| Toyota | Hilux | Double Cab 2.4E MT 4x4 | 116775.60 | 117880.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/hilux/july-2026/v3/1.0-pm-(ipte)-hilux-price-list.pdf) |
| Toyota | Hilux | Double Cab 2.4E AT 4x4 | 118775.60 | 119880.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/hilux/july-2026/v3/1.0-pm-(ipte)-hilux-price-list.pdf) |
| Toyota | Hilux | Double Cab 2.4V AT 4x4 | 148475.60 | 149580.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/hilux/july-2026/v3/1.0-pm-(ipte)-hilux-price-list.pdf) |
| Toyota | Hilux | Double Cab 2.8 Rogue AT 4x4 | 161482.00 | 163080.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/hilux/july-2026/v3/1.0-pm-(ipte)-hilux-price-list.pdf) |
| Toyota | Hilux | Double Cab 2.8 GR-S AT 4x4 | 171682.00 | 173280.00 | 2026-07-22 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/hilux/july-2026/v3/1.0-pm-(ipte)-hilux-price-list.pdf) |
| Toyota | Hilux BEV | Double Cab BEV 4x4 | 225740.00 | 226300.00 | 2026-03-30 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/hilux-bev/march-2026/v2/1.0-pm-(ipte-cpte)-hilux-bev-price-list.pdf) |
| Toyota | Hiace Panel Van | 3.0D MT | 126948.00 | 127800.00 | 2026-07-01 | Company Commercial | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/hiace/july-2026/v2/1.0-pm-hiace-pv-price-list.pdf) |
| Toyota | Hiace SLWB | 2.8D AT Window Van | 170352.00 | 172000.00 | 2026-09-02 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/all-new-hiace/september-2026/v2/1.0-pm-(ipte)(cpte)-hiace-slwb.pdf) |
| Toyota | bZ4X | EV | 219400.00 | 220000.00 | 2026-03-30 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/bz4x/march-2026/1.0-pm-bz4x-price-list.pdf) |
| Toyota | Urban Cruiser | EV | 197480.00 | 198000.00 | 2026-03-30 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/urban-cruiser/march-2026/1.0-pm-urban-cruiser-price-list.pdf) |
| Toyota | GR86 | 2.4 MT | 294833.00 | 296000.00 | 2026-08-20 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/gr-86/august-2026/1.0-pm(ip)-gr86-26.pdf) |
| Toyota | GR86 | 2.4 AT | 304833.00 | 306000.00 | 2026-08-20 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/gr-86/august-2026/1.0-pm(ip)-gr86-26.pdf) |
| Toyota | GR Corolla | 1.6T MT | 368342.80 | 368950.00 | 2026-01-10 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/gr-corolla/jan-2026/1.0-pm(ip)-gr-corolla-price-list.pdf) |
| Toyota | GR Corolla | 1.6T AT | 378342.80 | 378950.00 | 2026-01-10 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/gr-corolla/jan-2026/1.0-pm(ip)-gr-corolla-price-list.pdf) |
| Toyota | GR Yaris | 1.6L MT | 314992.80 | 315600.00 | 2026-04-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/gr-yaris/march-2026/1.0-pm(ip)-gr-yaris-price-list.pdf) |
| Toyota | GR Yaris | 1.6L AT | 324992.80 | 325600.00 | 2026-04-01 | Individual Private | [Manufacturer](https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/gr-yaris/march-2026/1.0-pm(ip)-gr-yaris-price-list.pdf) |
| Jaecoo | J5 | 1.5 TCI 2WD | 107600.00 | 108000.00 | 2026-03-05 | Individual Private | [Manufacturer](https://www.omodajaecoo.com.my/themes/demo/assets/price-list/J5_pricelist_2WD_PM.pdf) |
| Jaecoo | J5 EV | 155kW FWD | 118092.00 | 118800.00 | 2026-09-02 | Individual Private | [Manufacturer](https://www.omodajaecoo.com.my/themes/demo/assets/price-list/J5EV-Pricelist-PM.pdf) |
| Jaecoo | J7 | 1.6 TGDI 2WD | 138250.00 | 138800.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.omodajaecoo.com.my/themes/demo/assets/price-list/J7_pricelist_2WD_PM.pdf) |
| Jaecoo | J7 | 1.6 TGDI AWD | 148250.00 | 148800.00 | Not stated / live page | Individual Private | [Manufacturer](https://www.omodajaecoo.com.my/themes/demo/assets/price-list/J7%20pricelist-AWD-PM.pdf) |
| Jaecoo | J7 PHEV | 1.5 TGDI SHS-P FWD | 158400.00 | 158800.00 | 2026-08-01 | Individual Private | [Manufacturer](https://www.omodajaecoo.com.my/themes/demo/assets/price-list/J7_PHEV_Pricelist_PM_August.pdf) |
| Jaecoo | J8 | 2.0 TGDI 2WD | 177930.80 | 178800.00 | 2025-07-18 | Individual Private | [Manufacturer](https://www.omodajaecoo.com.my/themes/demo/assets/price-list/J8_2WD_Price_List.pdf) |
| Jaecoo | J8 | 2.0 TGDI AWD | 197930.80 | 198800.00 | 2025-07-18 | Individual Private | [Manufacturer](https://www.omodajaecoo.com.my/themes/demo/assets/price-list/J8_AWD_Price_List.pdf) |
| Chery | Tiggo Cross | 1.5 Turbo | 88400.00 | 88800.00 | 2025-07-09 | Individual Private | [Manufacturer](https://www.chery.my/wp-content/uploads/2025/07/PM_Tiggo-Cross-Pricelists.pdf) |
| Chery | Tiggo Cross | 1.5 Hybrid CSH | 99400.00 | 99800.00 | 2025-07-09 | Individual Private | [Manufacturer](https://www.chery.my/wp-content/uploads/2025/07/PM_Tiggo-Cross-Pricelists.pdf) |
| Chery | Chery O5 | 1.5 Turbo | 116400.00 | 116800.00 | 2025-09-10 | Individual Private | [Manufacturer](https://www.chery.my/wp-content/uploads/2025/09/CHERY.MY_Chery-O5-Pricelist_PM.pdf) |
| Chery | Omoda E5 | 150kW | 146370.00 | 146978.00 | 2026-01-01 | Individual Private | [Manufacturer](https://www.chery.my/wp-content/uploads/2026/01/Omoda-E5_PM_-Pricelist_-01012026.pdf) |
| Chery | Tiggo 7 Pro | 1.6 TGDI | 123250.00 | 123800.00 | 2024-06-21 | Individual Private | [Manufacturer](https://www.chery.my/wp-content/uploads/2025/01/T7P_PM_Pricelist_22122024.pdf) |
| Chery | Tiggo 7 PHEV | 1.5 TGDI + DHT CSH | 129400.00 | 129800.00 | 2025-10-03 | Individual Private | [Manufacturer](https://www.chery.my/wp-content/uploads/2025/10/PM_Tiggo-7-Phev-Pricelist.pdf) |
| Chery | Tiggo 8 | 1.6 TGDI | 129250.00 | 129800.00 | 2026-01-16 | Individual Private | [Manufacturer](https://www.chery.my/wp-content/uploads/2026/01/CHERY-TIGGO-8_PM-Pricelist.pdf) |
| Chery | Tiggo 8 PHEV | 1.5 TGDI + DHT CSH | 159400.00 | 159800.00 | 2025-10-03 | Individual Private | [Manufacturer](https://www.chery.my/wp-content/uploads/2025/10/PM_Tiggo-8-Phev-Pricelist.pdf) |
| Chery | Tiggo 9 | 2.0 TGDI 7DCT AWD | 178930.80 | 179800.00 | 2026-06-23 | Individual Private | [Manufacturer](https://www.chery.my/wp-content/uploads/2026/06/CHERY.MY_Tiggo-9-PM-Pricelist_2026.pdf) |
| Jetour | Dashing | 1.5 TCI Comfort | 109800.00 | 110200.00 | 2025-06-15 | Individual Private | [Manufacturer](https://jetour.com.my/models/wp-content/uploads/2026/01/JETOUR0005-Jetour-Dashing-Spec-Flyer-A4-Vertical-Peninsular.pdf) |
| Jetour | Dashing | 1.5 TCI Prime | 116800.00 | 117200.00 | 2025-06-15 | Individual Private | [Manufacturer](https://jetour.com.my/models/wp-content/uploads/2026/01/JETOUR0005-Jetour-Dashing-Spec-Flyer-A4-Vertical-Peninsular.pdf) |
| Jetour | VT9 | 1.5 TCI Comfort | 118800.00 | 119200.00 | Not stated / live page | Individual Private | [Manufacturer](https://jetour.com.my/models/wp-content/uploads/2026/01/JETOUR0008-JETOUR-VT9-POSM_Spec-Sheet-Flyer_A4_Peninsular_Malaysia_Jan2026.pdf) |
| Jetour | VT9 | 1.5 TCI Prime | 123800.00 | 124200.00 | Not stated / live page | Individual Private | [Manufacturer](https://jetour.com.my/models/wp-content/uploads/2026/01/JETOUR0008-JETOUR-VT9-POSM_Spec-Sheet-Flyer_A4_Peninsular_Malaysia_Jan2026.pdf) |
| Jetour | T2 | 2.0 TGDI XWD | 156800.00 | 157669.20 | 2026-03-13 | Individual Private | [Manufacturer](https://jetour.com.my/models/wp-content/uploads/2026/03/JETOUR0041-Jetour-T2-Flyer_A4_Vertical.pdf) |
| Jetour | T1 (estimated) | 1.5 TGDI 2WD | 129800.00 | 130200.00 | 2026-07-22 | Individual Private | [Manufacturer](https://jetour.com.my/models/t1/assets/files/t1/T1%20Est%20Price%20List%20PM%2022072026.pdf) |
| Jetour | T1 (estimated) | 2.0 TGDI XWD | 146800.00 | 147669.20 | 2026-07-22 | Individual Private | [Manufacturer](https://jetour.com.my/models/t1/assets/files/t1/T1%20Est%20Price%20List%20PM%2022072026.pdf) |
| Jetour | T2 i-DM | 1.5TD i-DM FWD | 162800.00 | 163200.00 | 2026-09-19 | Individual Private | [Manufacturer](https://jetour.com.my/models/t2-phev/assets/temp/JETOUR%20T2%20i-DM%20Price%20List%20(Peninsular%20Malaysia).pdf) |
