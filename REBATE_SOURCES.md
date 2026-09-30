# Official Rebate Audit

Checked 30 September 2026, Peninsular Malaysia, private registration unless the catalog explicitly says commercial. Covers all 67 model groups / 152 selections in the existing catalog. This is a manually checked snapshot, not a live monthly feed.

Exact eligible offers auto-fill on model/variant selection and reset. Honda and Chery expose a year selector, default 2026; 2025 offers never leak into 2026. Manual rebates stay editable and survive tenure, deposit and insurance changes. Empty means no exact applicable amount was verified, not a claim that no promotion exists.

All defaults require revalidation after 30 September 2026. This cutoff is not an invented manufacturer expiry. Honda's published registration deadline is separately recorded as 30 September. An open app removes stale automatic values on date change, foreground return or before copying; manual entries are not silently erased.

## Applied Matches

| Brand / model | Variants / amounts (RM) | Official evidence |
| --- | --- | --- |
| Proton NEW S70 i-GT | Lite / Prime: 3,000 each | [Current model page](https://www.proton.com/models/s70-prime-lite), its public comparison-data endpoint `https://www.proton.com/umbraco/api/content/getTree?id=ddd2c6b2-50fa-4fb2-9911-4275a5fe4638`: PM parent price / discountPrice = 59,800 / 56,800 and 62,800 / 59,800. These match the current 22 September retail PDF. Stale child component rows in the same CMS response are not used. |
| Proton e.MAS 5 | Prime / Premium: 3,000 each | [Official model page](https://emas.proton.com/e-mas-5/) and [August price PDF, page 2](https://emas.proton.com/wp-content/uploads/2026/08/PROTON-eMAS-5-Price-List-Peninsular-Malaysia.pdf). Retail minus Special Launch Price. No trade-in bonus added. |
| Proton e.MAS 7 | Prime / Premium / Premium Plus: 7,000 each | [Official model page](https://emas.proton.com/e-mas-7/) and [current June price PDF](https://emas.proton.com/wp-content/uploads/2026/06/PROTON-e.MAS-7-Price-List-Peninsular-Malaysia.pdf), explicitly labelled Launch Rebate. No Power Exchange allowance added. |
| Proton e.MAS 7 PHEV | Prime / Premium / Premium Plus: 4,000 each | [Current August price PDF, page 2](https://emas.proton.com/wp-content/uploads/2026/08/PROTON-e.MAS-7-PHEV-Price-List-Peninsular-Malaysia.pdf), effective 26 August, retail / launch pairs 109,800 / 105,800; 123,800 / 119,800; 129,800 / 125,800. Current PDF has limited-time terms; old hidden HTML first-5,000 launch terms are not substituted for the updated document. |
| Perodua QV-E | BaaS / Full Purchase: 16,500 each | [Official price PDF effective 15 September](https://ev.perodua.com.my/assets/Peninsular_Malaysia_New_QV-E_Price_list-DpT2PuSS.pdf). Special Rebate Prices 53,499 / 77,499 versus retail 69,999 / 93,999. Supersedes the older June 6,500 discount; battery rental stays separate. |
| Honda City Hatchback (2026) | S / E / V / RS / e:HEV RS: 6,000 each | [Official September variant table](https://www.honda.com.my/happening/). Base cash only; service vouchers are not cash. |
| Honda Civic (2026) | E / V: 8,000; RS / e:HEV RS: 12,000 | Same official table. |
| Honda HR-V (2026) | S / E: 8,000; V with 360 camera: 6,000; e:HEV RS with 360 camera: 9,000 | Same table. Hybrid total = 7,000 cash + 2,000 Hybrid Support cash. |
| Honda CR-V (2026) | e:HEV E / e:HEV RS: 7,000; V: 10,000 | Same table. Hybrid total = 5,000 cash + 2,000 Hybrid Support cash. |
| Honda WR-V (2026) | E / V / RS: 5,000 each | Same table. First-500 Malaysia Day allowance excluded. |
| Chery O5 | YOM 2026: 11,000; YOM 2025: 17,000 | [Official promotion page](https://www.chery.my/promotion/). Exact price differences from catalog retail 116,800 to published promo 105,800 / 99,800; not falsely described as separately published cash amounts. |
| Chery Omoda E5 | YOM 2026: 38,178; YOM 2025: 47,178 | Same page. Catalog retail 146,978 to exact OTR promo 108,800 / 99,800. Gifts and charging credits excluded. |
| Chery Tiggo Cross Hybrid | YOM 2025: 7,888 | Same page, explicit YOM 2025 rebate row. No stacking with the separate promotional price table. |
| Chery Tiggo 8 PHEV | YOM 2025: 21,000 | Same page, retail 159,800 less exact promo OTR 138,800. No inferred 2026 offer. |

Honda conditions include selected variants/excise years and stock availability, with registration 1–30 September. Shared Rewards requires an existing-owner/family relationship; One Nation Rewards requires participating dealers. Neither is applied automatically. The 1,000 service voucher is excluded, while the explicitly cash 2,000 hybrid support is included only for HR-V/CR-V hybrid variants. Current pricing pages were checked against the 360-camera variant descriptions.

## Remaining Coverage / Exclusions

| Brand | All remaining catalog model groups | Why no automatic amount |
| --- | --- | --- |
| Proton | S70 Turbo, All New Saga, Persona, Iriz, All New X50, X70, X90 | [September manufacturer campaign](https://www.proton.com/offers/current-promotion/) publishes cash **up to** 9,000, trade-in **up to** 2,000 and bonus **up to** 2,000, with no exact variant matrix. X70 January launch reward had a March registration deadline; X90 March launch was limited to early customers. Current starting-price headlines alone do not establish renewal for every variant. |
| Perodua | Axia, Bezza, Myvi, Ativa, Alza, Aruz, Traz | [Current manufacturer site](https://www.perodua.com.my/) and [September service campaign](https://www.perodua.com.my/promotions/servis-ihsan-madani) do not provide an exact universally applicable purchase rebate matrix. Axia's August permanent retail-price reduction is already included in body price and must not be subtracted again. |
| Honda | City, Civic Type R, e:N1, Prelude; 2025 selections | Not listed with exact current cash amounts in the manufacturer's 2026 campaign table. |
| Toyota | Vios, Yaris, Yaris Cross, Corolla, Corolla Cross, Camry, Veloz, Innova Zenix, Harrier, Alphard, Vellfire, Fortuner, Hilux, Hilux BEV, Hiace Panel Van, Hiace SLWB, bZ4X, Urban Cruiser, GR86, GR Corolla, GR Yaris | [Current September promo](https://www.toyota.com.my/en/promotions/monthly-promo.html) and the site's own public promo JSON/header image advertise EZ Beli initial instalments, service packages and telematics, not an exact purchase-cash rebate per variant. All variants remain blank. |
| Jaecoo | J5, J5 EV, J7 2WD/AWD, J7 PHEV, J8 2WD/AWD | [Official Merdeka Sales page](https://www.omodajaecoo.com.my/merdeka-sales) and its published poster say **up to** cash 9,000 / 11,500 / 7,000, and overtrade up to 14,000, without exact variant applicability. Professional Affiliate Programme requires eligibility. These are not universal cash defaults. |
| Chery | Tiggo Cross Turbo; Tiggo Cross Hybrid 2026; Tiggo 7 Pro, Tiggo 7 PHEV, Tiggo 8, Tiggo 9; Tiggo 8 PHEV 2026 | First promo table does not clearly assign a model year and differs from separate YOM tables for O5. Do not guess stock/year or combine prices. Tiggo 9 has alternative Prime/Flexi launch packages, not a universal sum of discount, petrol and insurance benefits. |
| Jetour | Dashing Comfort/Prime, VT9 Comfort/Prime, T2, T1 2WD/XWD, T2 i-DM | [Official campaign index](https://jetour.com.my/discover/events-campaigns/) / current model pages have no exact verified September purchase rebate per variant. January's **up to** 12,000 is not a September offer; government-employee eligibility and owner-story contest rewards are not universal rebates. |

No dealer listings, social reposts, aggregator figures or invented zero-rebate claims are used. A blanket official default for every variant cannot truthfully be provided from the published evidence. Unknowns deliberately remain editable blanks with a link to the official campaign.

## Regression Checks

Tests cover every catalog selection, default amount, year isolation, non-stacking of conditional rewards, switching/reset, manual overrides, insurance before rebate, source links, WhatsApp cleanliness, expiry and midnight behavior. Official price tables remain unchanged.
