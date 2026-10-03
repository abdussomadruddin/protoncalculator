// Snapshot of official Malaysian sources checked on 30 September 2026.
// Rows preserve published selling prices for audit; app Body Price uses retail/OTR excluding insurance.
const CATALOG_CHECKED_AT = "2026-09-30";
function catalogModel(name, source, rows, options = {}) {
  return {
    name, source, checkedAt: CATALOG_CHECKED_AT, ...options,
    variants: rows.map(([name, sellingPrice, otrPrice, extra = {}]) => ({
      name, sellingPrice, bodyPrice: otrPrice, otrPrice, ...extra,
    })),
  };
}
const protonPdf = (media, file) => `https://cms-assets.proton.com/proton-cms-blob/media/${media}/${file}.pdf`;
const emasPdf = (month, file) => `https://emas.proton.com/wp-content/uploads/2026/${month}/${file}.pdf`;
const toyotaPdf = (path) => `https://www.toyota.com.my/content/dam/malaysia/price-list-maintenance-packages/${path}.pdf`;
const cheryPdf = (date, file) => `https://www.chery.my/wp-content/uploads/${date}/${file}.pdf`;
const jaecooPdf = (file) => `https://www.omodajaecoo.com.my/themes/demo/assets/price-list/${file}.pdf`;
const hondaPrice = (slug) => `https://www.honda.com.my/model/${slug}/pricing`;
const mitsubishiPdf = (file) => `https://www.mitsubishi-motors.com.my/wp-content/uploads/pricelist/${file}-pricelist-pm.pdf`;
const mazdaPdf = (year, file) => `https://kentico.mazda.com.my/PriceList/WestMalaysia/${year}/${file}_Price(W).pdf`;
const bydPdf = (file) => `https://byd.simemotors.my/pub/media/wysiwyg/2026-spec-price/BYD_26_${file}_Brochure_WM.pdf`;
const NEW_BRAND_CHECKED_AT = "2026-10-02";
// verifiedThrough is our revalidation cutoff, not an advertised promotion expiry.
const launchOffer = (amount, source) => ({ rebate: { amount, source, label: "Harga pengenalan rasmi; tertakluk syarat dan stok.", verifiedThrough: "2026-09-30" } });
const CAR_CATALOG = {
  Proton: [
    catalogModel("NEW S70 1.5 i-GT", protonPdf("wzjbgkbt", "proton-s70mc2_pm_22092026"), [
      ["Lite", 59165, 59800], ["Prime", 62165, 62800],
    ], { effectiveAt: "2026-09-22", ...launchOffer(3000, "https://www.proton.com/models/s70-prime-lite") }),
    catalogModel("S70 Turbo", protonPdf("5o1jezwa", "proton-s70mc_pm_22092026"), [
      ["1.5TD Premium", 79165, 79800], ["1.5TD Flagship", 87565, 89800], ["1.5TD Flagship X", 88686, 94800],
    ], { effectiveAt: "2026-09-22" }),
    catalogModel("All New Saga", protonPdf("ip4lyxes", "all-new-proton-saga-pricelist_pm"), [
      ["1.5 Standard", 38405, 38990], ["1.5 Executive", 44405, 44990], ["1.5 Premium", 49405, 49990],
    ], { effectiveAt: "2025-11-27" }),
    catalogModel("Persona", "https://www.proton.com/models/persona", [
      ["1.6 Standard CVT", 47215, 47800, { source: protonPdf("5lifygov", "pm-persona-standard") }],
      ["1.6 Executive CVT", 52715, 53300, { source: protonPdf("jewb1kp0", "pm-persona-executive") }],
      ["1.6 Premium CVT", 57715, 58300, { source: protonPdf("dwslx0px", "pm-persona-premium") }],
    ]),
    catalogModel("Iriz", "https://www.proton.com/models/iriz", [
      ["1.3 Standard CVT", 42385, 42800, { source: protonPdf("ohdf145c", "pm-iriz-standard") }],
      ["1.6 Executive CVT", 49715, 50300, { source: protonPdf("5rxbyokc", "pm-iriz-executive") }],
      ["1.6 Active CVT", 56715, 57300, { source: protonPdf("aejax1dj", "pm-iriz-active") }],
    ], { effectiveAt: "2022-08-02" }),
    catalogModel("All New X50", protonPdf("mi4dqgcv", "all-new-proton-x50-pricelist_pm"), [
      ["1.5TD Executive", 89120, 89800], ["1.5TD Premium", 96520, 101800], ["1.5TD Flagship", 107820, 113300],
    ]),
    catalogModel("X70", protonPdf("y52ki4nr", "pm_pricelist-2026-proton-x70-28-jan"), [
      ["1.5TD Executive", 106123, 106800], ["1.5TD Premium", 117323, 119800],
    ], { effectiveAt: "2026-01-28", ...launchOffer(7000, "https://www.proton.com/models/x70") }),
    catalogModel("X90", protonPdf("lzlh4qil", "pm_pricelist-2026-proton-x90-11-mar"), [
      ["1.5TD Lite", 106093, 106800], ["1.5TD Prime", 114293, 116800], ["1.5TD Prime X", 119544, 122800],
    ], { effectiveAt: "2026-03-11", ...launchOffer(7000, "https://www.proton.com/models/x90") }),
    catalogModel("e.MAS 5", emasPdf("08", "PROTON-eMAS-5-Price-List-Peninsular-Malaysia"), [
      ["Prime", 59322, 59800], ["Premium", 72292, 72800],
    ], { powertrain: "EV", effectiveAt: "2026-05-17", ...launchOffer(3000, "https://emas.proton.com/e-mas-5/") }),
    catalogModel("e.MAS 7", emasPdf("06", "PROTON-e.MAS-7-Price-List-Peninsular-Malaysia"), [
      ["Prime", 103172, 103800], ["Premium", 119172, 119800], ["Premium Plus", 125172, 125800],
    ], { powertrain: "EV", effectiveAt: "2026-06-11", ...launchOffer(7000, "https://emas.proton.com/e-mas-7/") }),
    catalogModel("e.MAS 7 PHEV", emasPdf("08", "PROTON-e.MAS-7-PHEV-Price-List-Peninsular-Malaysia"), [
      ["Prime", 109430, 109800], ["Premium", 123430, 123800], ["Premium Plus", 129430, 129800],
    ], { powertrain: "PHEV", effectiveAt: "2026-08-26", ...launchOffer(4000, "https://emas.proton.com/e-mas-7-phev/") }),
  ],
  Perodua: [
    catalogModel("Axia", "https://www.perodua.com.my/loan-calculator", [
      ["1.0L E (5MT)", null, 22000], ["1.0L G (D-CVT)", null, 33900], ["1.0L X (D-CVT)", null, 38500],
      ["1.0L SE (D-CVT)", null, 43000], ["1.0L AV (D-CVT)", null, 49000],
    ]),
    catalogModel("Bezza", "https://www.perodua.com.my/loan-calculator", [
      ["1.0 G Manual", null, 34580], ["1.0 G Auto", null, 36580], ["1.3 X Auto", null, 43980], ["1.3 AV Auto", null, 49980],
    ]),
    catalogModel("Myvi", "https://www.perodua.com.my/loan-calculator", [
      ["1.3L G CVT (Without PSDA)", null, 46500], ["1.3L G CVT (With PSDA)", null, 48500],
      ["1.5L X CVT", null, 50900], ["1.5L H CVT", null, 54900], ["1.5L AV CVT", null, 59900],
    ]),
    catalogModel("Ativa", "https://www.perodua.com.my/loan-calculator", [
      ["1.0L X Turbo CVT - Metallic", null, 62500], ["1.0L H Turbo CVT - Metallic", null, 67300],
      ["1.0L H Turbo CVT - Special Metallic", null, 67800], ["1.0L AV Turbo CVT - Metallic", null, 72600],
      ["1.0L AV Turbo CVT - Special Metallic", null, 73100], ["1.0L AV Turbo CVT - 2 Tone Special Metallic", null, 73400],
    ]),
    catalogModel("Alza", "https://www.perodua.com.my/loan-calculator", [
      ["1.5L X D-CVT", null, 62500], ["1.5L H D-CVT", null, 68000], ["1.5L AV D-CVT", null, 75500],
    ]),
    catalogModel("Aruz", "https://www.perodua.com.my/loan-calculator", [
      ["1.5 X Auto", null, 68900], ["1.5 AV Auto", null, 73900],
    ]),
    catalogModel("Traz", "https://www.perodua.com.my/loan-calculator", [
      ["1.5 X D-CVT - Metallic / Solid", null, 76100], ["1.5 H D-CVT - Metallic / Solid", null, 81100],
      ["1.5 H D-CVT - 2-Tone Metallic", null, 82000],
    ]),
    catalogModel("QV-E", "https://ev.perodua.com.my/assets/Peninsular_Malaysia_New_QV-E_Price_list-DpT2PuSS.pdf", [
      ["Battery-as-a-Service (BaaS)", 69551, 69999, { batteryMonthly: 215, batteryMonths: 108 }],
      ["Full Purchase (Battery Included)", 93551, 93999],
    ], { powertrain: "EV", effectiveAt: "2026-09-15", ...launchOffer(16500, "https://ev.perodua.com.my/assets/Peninsular_Malaysia_New_QV-E_Price_list-DpT2PuSS.pdf") }),
  ],
  Honda: [
    catalogModel("City", hondaPrice("city"), [
      ["1.5L E", 89560, 89900], ["1.5L V", 94560, 94900], ["1.5L RS", 99560, 99900], ["1.5L e:HEV RS", 111560, 111900],
    ], { paintNote: "Platinum White Pearl / Blazing Red Pearl: +RM400." }),
    catalogModel("City Hatchback", hondaPrice("city-hatchback"), [
      ["1.5L S", 85560, 85900], ["1.5L E", 90560, 90900], ["1.5L V", 95560, 95900],
      ["1.5L RS", 100560, 100900], ["1.5L e:HEV RS", 112560, 112900],
    ], { paintNote: "Platinum White Pearl / Ignite Red Metallic: +RM400.", note: "Jadual rasmi ada percanggahan caj number plate; jumlah selling dan retail rasmi digunakan tanpa menambah caj itu sekali lagi." }),
    catalogModel("Civic", hondaPrice("civic"), [
      ["1.5L E", 133560, 133900], ["1.5L V", 144560, 144900], ["1.5L RS", 149560, 149900], ["2.0L e:HEV RS", 167123.5, 167900],
    ], { paintNote: "Platinum White Pearl / Ignite Red / Canyon River Blue: +RM800." }),
    catalogModel("CR-V", hondaPrice("crv"), [
      ["2.0L e:HEV E", 177362.8, 178200], ["1.5L V", 181530, 181900], ["2.0L e:HEV RS", 195062.8, 195900],
    ], { paintNote: "Platinum White Pearl / Blazing Red / Canyon River Blue: +RM800." }),
    catalogModel("HR-V", hondaPrice("hrv"), [
      ["1.5L S", 115530, 115900], ["1.5L T E", 130530, 130900], ["1.5L T V", 137530, 137900], ["1.5L e:HEV RS", 143530, 143900],
    ], { paintNote: "Platinum White Pearl: +RM800." }),
    catalogModel("WR-V", hondaPrice("wr-v"), [
      ["1.5L E", 94560, 94900], ["1.5L V", 98560, 98900], ["1.5L RS", 104560, 104900],
    ], { paintNote: "Platinum White Pearl / Blazing Red: +RM400; warna 2-tone RS: +RM1,800." }),
    catalogModel("Civic Type R", hondaPrice("type-r"), [["2.0L VTEC Turbo 6MT", 399072, 399900]]),
    catalogModel("e:N1", hondaPrice("en1"), [["EV", 149402, 150060]], { powertrain: "EV" }),
    catalogModel("Prelude", hondaPrice("prelude"), [["2.0L e:HEV", 277173.5, 278000]], { powertrain: "Hybrid" }),
  ],
  Toyota: [
    catalogModel("Vios", toyotaPdf("vios-hev/july-2026/1.0-pm(ip)-vios"), [
      ["1.5E AT", 90310, 90600], ["1.5G AT", 96310, 96600], ["1.5 HEV AT", 103610, 103900], ["1.5 HEV GR-S AT", 109610, 109900],
    ], { effectiveAt: "2026-07-01", paintNote: "Warna premium / 2-tone mengikut varian: +RM400 hingga RM1,800; rujuk pricelist." }),
    catalogModel("Yaris", toyotaPdf("yaris/july-2026/1.0-pm(ip)-yaris-price-list"), [["1.5E AT", 87710, 88000], ["1.5G AT", 91310, 91600]], { effectiveAt: "2026-07-01" }),
    catalogModel("Yaris Cross", toyotaPdf("toyota-yaris-cros-and-hev/july-2026/1.0-pm(ip)-yaris-cross"), [["1.5S", 99580, 99900], ["1.5S HEV", 109580, 109900]], { effectiveAt: "2026-07-01", paintNote: "Platinum Pearl White: +RM400." }),
    catalogModel("Corolla", toyotaPdf("corolla/july-2026/1.0-pm-(ipte)-corolla"), [["1.8G AT", 144120.8, 144800], ["1.8 GR Sport AT", 149120.8, 149800]], { effectiveAt: "2026-07-01", paintNote: "Premium / 2-tone: +RM800 hingga RM2,000 mengikut varian; rujuk pricelist." }),
    catalogModel("Corolla Cross", toyotaPdf("corolla-cross/july-2026/v2/1.0-pm(ip)-corolla-cross-price-list"), [
      ["1.8V AT", 133090.6, 133800], ["1.8 HEV AT", 140090.6, 140800], ["1.8 HEV GR-S AT", 148090.6, 148800],
    ], { effectiveAt: "2026-07-22", paintNote: "Premium / 2-tone: +RM800 hingga RM2,000 mengikut varian; rujuk pricelist." }),
    catalogModel("Camry", toyotaPdf("camry-hev-and-ice/july-2026/1.0-pm-(ipte)-camry"), [["2.5V AT", 220533, 221800], ["2.5 HEV", 247533, 248800]], { effectiveAt: "2026-07-01", paintNote: "Emotional Red 2 / Platinum White Pearl / Precious Metal: +RM800." }),
    catalogModel("Veloz", toyotaPdf("veloz/july-2026/1.0-pm-veloz-price-list"), [["1.5 AT", 94710, 95000]], { effectiveAt: "2026-07-01" }),
    catalogModel("Innova Zenix", toyotaPdf("zenix/july-2026/1.0-pm-(ipte)-innova-zenix"), [["2.0V", 164226.5, 165000], ["2.0 HEV", 201226.5, 202000]], { effectiveAt: "2026-07-01", paintNote: "Platinum White Pearl: +RM1,000." }),
    catalogModel("Harrier", toyotaPdf("harrier-hev/february-2026/1.0-pm-harrier-hev-price-list"), [["2.5 HEV", 287770.4, 289000]], { powertrain: "Hybrid", effectiveAt: "2026-03-02" }),
    catalogModel("Alphard", toyotaPdf("alphard/august-2026/1.0-pm-toyota-alphard-price-list"), [["2.4T AT Executive Lounge", 546845.6, 548000]], { effectiveAt: "2026-08-03", paintNote: "Platinum White Pearl / Precious Metal / Precious Leo-Blond: +RM1,000." }),
    catalogModel("Vellfire", toyotaPdf("vellfire/august-2026/1.0-pm-toyota-vellfire-price-list"), [["2.5 AT", 446764.8, 448000], ["2.5 HEV AT Executive Lounge", 548670.4, 549900]], { effectiveAt: "2026-08-03", paintNote: "Platinum White Pearl / Precious Metal: +RM1,000." }),
    catalogModel("Fortuner", toyotaPdf("fortuner/july-2026/v4/1.0-pm-(ipte)-fortuner-price-list"), [
      ["2.4 AT 4x4", 194775.6, 195880], ["2.8 VRZ AT 4x4", 240282, 241880], ["2.7 SRZ AT 4x4", 201379.6, 202880],
    ], { effectiveAt: "2026-07-22" }),
    catalogModel("Hilux", toyotaPdf("hilux/july-2026/v3/1.0-pm-(ipte)-hilux-price-list"), [
      ["Single Cab 2.4 MT 4x4", 103775.6, 104880], ["Double Cab 2.4E MT 4x4", 116775.6, 117880],
      ["Double Cab 2.4E AT 4x4", 118775.6, 119880], ["Double Cab 2.4V AT 4x4", 148475.6, 149580],
      ["Double Cab 2.8 Rogue AT 4x4", 161482, 163080], ["Double Cab 2.8 GR-S AT 4x4", 171682, 173280],
    ], { effectiveAt: "2026-07-22" }),
    catalogModel("Hilux BEV", toyotaPdf("hilux-bev/march-2026/v2/1.0-pm-(ipte-cpte)-hilux-bev-price-list"), [["Double Cab BEV 4x4", 225740, 226300]], { powertrain: "EV", effectiveAt: "2026-03-30" }),
    catalogModel("Hiace Panel Van", toyotaPdf("hiace/july-2026/v2/1.0-pm-hiace-pv-price-list"), [["3.0D MT", 126948, 127800]], { registration: "Company Commercial", effectiveAt: "2026-07-01", note: "Pricelist ini untuk pendaftaran syarikat komersial sahaja, bukan individu persendirian. Insurans komersial perlu sebut harga insurer." }),
    catalogModel("Hiace SLWB", toyotaPdf("all-new-hiace/september-2026/v2/1.0-pm-(ipte)(cpte)-hiace-slwb"), [["2.8D AT Window Van", 170352, 172000]], { effectiveAt: "2026-09-02" }),
    catalogModel("bZ4X", toyotaPdf("bz4x/march-2026/1.0-pm-bz4x-price-list"), [["EV", 219400, 220000]], { powertrain: "EV", effectiveAt: "2026-03-30" }),
    catalogModel("Urban Cruiser", toyotaPdf("urban-cruiser/march-2026/1.0-pm-urban-cruiser-price-list"), [["EV", 197480, 198000]], { powertrain: "EV", effectiveAt: "2026-03-30" }),
    catalogModel("GR86", toyotaPdf("gr-86/august-2026/1.0-pm(ip)-gr86-26"), [["2.4 MT", 294833, 296000], ["2.4 AT", 304833, 306000]], { effectiveAt: "2026-08-20" }),
    catalogModel("GR Corolla", toyotaPdf("gr-corolla/jan-2026/1.0-pm(ip)-gr-corolla-price-list"), [["1.6T MT", 368342.8, 368950], ["1.6T AT", 378342.8, 378950]], { effectiveAt: "2026-01-10" }),
    catalogModel("GR Yaris", toyotaPdf("gr-yaris/march-2026/1.0-pm(ip)-gr-yaris-price-list"), [["1.6L MT", 314992.8, 315600], ["1.6L AT", 324992.8, 325600]], { effectiveAt: "2026-04-01" }),
  ],
  Jaecoo: [
    catalogModel("J5", jaecooPdf("J5_pricelist_2WD_PM"), [["1.5 TCI 2WD", 107600, 108000]], { effectiveAt: "2026-03-05" }),
    catalogModel("J5 EV", jaecooPdf("J5EV-Pricelist-PM"), [["155kW FWD", 118092, 118800]], { powertrain: "EV", effectiveAt: "2026-09-02" }),
    catalogModel("J7", "https://www.omodajaecoo.com.my/modelj7", [
      ["1.6 TGDI 2WD", 138250, 138800, { source: jaecooPdf("J7_pricelist_2WD_PM") }],
      ["1.6 TGDI AWD", 148250, 148800, { source: jaecooPdf("J7%20pricelist-AWD-PM") }],
    ]),
    catalogModel("J7 PHEV", jaecooPdf("J7_PHEV_Pricelist_PM_August"), [["1.5 TGDI SHS-P FWD", 158400, 158800]], { powertrain: "PHEV", effectiveAt: "2026-08-01" }),
    catalogModel("J8", "https://www.omodajaecoo.com.my/modelj8", [
      ["2.0 TGDI 2WD", 177930.8, 178800, { source: jaecooPdf("J8_2WD_Price_List") }],
      ["2.0 TGDI AWD", 197930.8, 198800, { source: jaecooPdf("J8_AWD_Price_List") }],
    ], { effectiveAt: "2025-07-18" }),
  ],
  OMODA: [
    catalogModel("C9", "https://www.omodajaecoo.com.my/modelc9", [
      ["2.0 TGDI 2WD", 167930.8, 168800, { source: jaecooPdf("C9_pricelist_2WD_PM"), note: "Matte Grey: +RM3,000." }],
      ["2.0 TGDI AWD", 187930.8, 188800, { source: jaecooPdf("C9_pricelist_AWD_PM_new"), note: "Matte Grey / Matte Black: +RM3,000." }],
    ], { checkedAt: "2026-10-03", effectiveAt: "2024-12-06" }),
    catalogModel("C9 PHEV", jaecooPdf("C9_PHEV_Pricelist_PM_August"), [
      ["1.5T SHS-P 3 DHT AWD", 208400, 208800],
    ], { checkedAt: "2026-10-03", effectiveAt: "2026-08-01", powertrain: "PHEV", paintNote: "Matte Grey: +RM3,000." }),
  ],
  Chery: [
    catalogModel("Tiggo Cross", cheryPdf("2025/07", "PM_Tiggo-Cross-Pricelists"), [["1.5 Turbo", 88400, 88800], ["1.5 Hybrid CSH", 99400, 99800]], { effectiveAt: "2025-07-09" }),
    catalogModel("Chery O5", cheryPdf("2025/09", "CHERY.MY_Chery-O5-Pricelist_PM"), [["1.5 Turbo", 116400, 116800]], { effectiveAt: "2025-09-10" }),
    catalogModel("Omoda E5", cheryPdf("2026/01", "Omoda-E5_PM_-Pricelist_-01012026"), [["150kW", 146370, 146978]], { powertrain: "EV", effectiveAt: "2026-01-01", paintNote: "Aqua Green / Khaki White dengan Black Roof: +RM2,000." }),
    catalogModel("Tiggo 7 Pro", cheryPdf("2025/01", "T7P_PM_Pricelist_22122024"), [["1.6 TGDI", 123250, 123800]], { effectiveAt: "2024-06-21" }),
    catalogModel("Tiggo 7 PHEV", cheryPdf("2025/10", "PM_Tiggo-7-Phev-Pricelist"), [["1.5 TGDI + DHT CSH", 129400, 129800]], { powertrain: "PHEV", effectiveAt: "2025-10-03", paintNote: "Bloodstone Red dengan Black Roof: +RM2,000." }),
    catalogModel("Tiggo 8", cheryPdf("2026/01", "CHERY-TIGGO-8_PM-Pricelist"), [["1.6 TGDI", 129250, 129800]], { effectiveAt: "2026-01-16" }),
    catalogModel("Tiggo 8 PHEV", cheryPdf("2025/10", "PM_Tiggo-8-Phev-Pricelist"), [["1.5 TGDI + DHT CSH", 159400, 159800]], { powertrain: "PHEV", effectiveAt: "2025-10-03" }),
    catalogModel("Tiggo 9", cheryPdf("2026/06", "CHERY.MY_Tiggo-9-PM-Pricelist_2026"), [["2.0 TGDI 7DCT AWD", 178930.8, 179800]], { effectiveAt: "2026-06-23" }),
  ],
  Jetour: [
    catalogModel("Dashing", "https://jetour.com.my/models/wp-content/uploads/2026/01/JETOUR0005-Jetour-Dashing-Spec-Flyer-A4-Vertical-Peninsular.pdf", [["1.5 TCI Comfort", 109800, 110200], ["1.5 TCI Prime", 116800, 117200]], { effectiveAt: "2025-06-15" }),
    catalogModel("VT9", "https://jetour.com.my/models/wp-content/uploads/2026/01/JETOUR0008-JETOUR-VT9-POSM_Spec-Sheet-Flyer_A4_Peninsular_Malaysia_Jan2026.pdf", [["1.5 TCI Comfort", 118800, 119200], ["1.5 TCI Prime", 123800, 124200]]),
    catalogModel("T2", "https://jetour.com.my/models/wp-content/uploads/2026/03/JETOUR0041-Jetour-T2-Flyer_A4_Vertical.pdf", [["2.0 TGDI XWD", 156800, 157669.2]], { effectiveAt: "2026-03-13" }),
    catalogModel("T1", "https://jetour.com.my/models/t1/assets/files/t1/T1%20Est%20Price%20List%20PM%2022072026.pdf", [["1.5 TGDI 2WD", 129800, 130200], ["2.0 TGDI XWD", 146800, 147669.2]], { effectiveAt: "2026-07-22", estimated: true, note: "Pricelist rasmi bertanda Estimated. Sahkan harga akhir dengan pengedar sebelum mengeluarkan quotation." }),
    catalogModel("T2 i-DM", "https://jetour.com.my/models/t2-phev/assets/temp/JETOUR%20T2%20i-DM%20Price%20List%20(Peninsular%20Malaysia).pdf", [["1.5TD i-DM FWD", 162800, 163200]], { powertrain: "PHEV", effectiveAt: "2026-09-19", needsConfirmation: true, note: "PDF PM mempunyai label East Malaysia yang bercanggah; footer menyatakan kedua-dua wilayah. Harga bersih rasmi digunakan; sahkan caj pendaftaran dengan pengedar." }),
  ],
  Mitsubishi: [
    catalogModel("Xforce", mitsubishiPdf("xforce"), [
      ["1.5 Urban CVT", 109610, 109980], ["1.5 Ultimate CVT", 119610, 119980],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-04-08", paintNote: "Quartz White Pearl: +RM400." }),
    catalogModel("XPANDER", mitsubishiPdf("xpander"), [
      ["1.5 4AT", 99640, 99980], ["1.5 Plus 4AT", 109640, 109980],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-04-15", paintNote: "Quartz White Pearl: +RM400." }),
    catalogModel("Triton", mitsubishiPdf("triton"), [
      ["2.4 Athlete Enhanced 6AT 4x4", 158606.4, 159980],
      ["2.4 AT Premium 4x4", 144606.4, 145980],
      ["2.4 AT GL 4x4", 115606.4, 116980],
      ["2.4 MT GL 4x4", 113606.4, 114980],
      ["2.4 Athlete Championship Edition 6AT 4x4", 168606.4, 169980, { source: mitsubishiPdf("triton-championship-edition"), effectiveAt: "2026-03-11" }],
      ["2.4 AT Premium Championship Edition 4x4", 154606.4, 155980, { source: mitsubishiPdf("triton-championship-edition"), effectiveAt: "2026-03-11" }],
      ["2.4 Athlete Before Enhancement 6AT 4x4", 164606.4, 165980, { source: mitsubishiPdf("triton-ne"), effectiveAt: "2025-01-09", needsConfirmation: true, note: "Pricelist Before Enhancement masih disenaraikan rasmi; sahkan stok dan harga akhir dengan pengedar." }],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, note: "Harga Individual Private. Pendaftaran Company Commercial mempunyai jumlah berbeza; rujuk PDF. Tarikh kuat kuasa berbeza mengikut varian." }),
    catalogModel("Triton Single Cab", mitsubishiPdf("triton-single-cab-mt"), [
      ["2.4 6AT 4x4", 106606.4, 107980, { source: mitsubishiPdf("triton-single-cab-at") }],
      ["2.4 6MT 4x4 MY26", 103606.4, 104980],
      ["2.4 6MT 4x4 MY25", 100606.4, 101980, { effectiveAt: "2025-01-09" }],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-08-28", note: "Harga Individual Private, bukan Company Commercial. MY25 dan MY26 ialah baris berasingan dalam pricelist rasmi; tertakluk stok." }),
  ],
  Mazda: [
    catalogModel("Mazda3 Sedan", mazdaPdf(2026, "Mazda3"), [
      ["1.5G High Plus", 119900, 120620, { effectiveAt: "2026-07-01" }],
      ["2.0G High Plus", 164900, 166059, { effectiveAt: "2026-05-01" }],
    ], { checkedAt: NEW_BRAND_CHECKED_AT }),
    catalogModel("Mazda3 Liftback", mazdaPdf(2026, "Mazda3"), [
      ["1.5G High Plus", 119900, 120620, { effectiveAt: "2026-07-01" }],
      ["2.0G High Plus", 164900, 166059, { effectiveAt: "2026-05-01" }],
      ["2.0G Ignite Edition", 173900, 175059, { effectiveAt: "2026-05-01" }],
    ], { checkedAt: NEW_BRAND_CHECKED_AT }),
    catalogModel("MX-5 RF", mazdaPdf(2025, "MazdaMX5"), [
      ["2.0G Manual", 293000, 294154], ["2.0G Auto", 295000, 296154],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2025-04-09" }),
    catalogModel("CX-30", mazdaPdf(2026, "MazdaCX30"), [
      ["2.0G Standard 2WD MY25", 121300, 122409],
      ["2.0G High 2WD MY26", 129300, 130409],
      ["2.0G High Plus 2WD MY26", 137300, 138409],
      ["2.0G High Plus Premium 2WD MY26", 145300, 146409],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-05-12", paintNote: "Soul Red Crystal / Machine Gray: +RM2,000.", note: "OTR rasmi sebelum pakej Accessories Installed RM3,410 yang disenaraikan berasingan; tambah pakej jika dipilih dalam aksesori tambahan." }),
    catalogModel("All New CX-5", mazdaPdf(2026, "MazdaCX5"), [
      ["2.5G High CBU", 169900, 171510.4],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-09-01" }),
    catalogModel("CX-5 CKD", mazdaPdf(2026, "MazdaCX5"), [
      ["2.0G Mid 2WD MY26", 134300, 135469.2],
      ["2.0G High 2WD MY26", 146300, 147469.2],
      ["2.5G High 2WD MY26", 163400, 164960.4],
      ["2.5G High 2WD MY25", 153400, 154960.4, { effectiveAt: "2026-01-01" }],
      ["2.5G Turbo High AWD MY25", 165200, 166760.4, { effectiveAt: "2026-01-01" }],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-05-12", paintNote: "Soul Red Crystal / Machine Gray: +RM3,300 (kecuali Mid).", note: "OTR sebelum pakej Accessories Installed berasingan: Mid MY26 RM3,060; High MY26 RM6,160; MY25 RM3,160. Tambah jika dipilih. Harga 2.2D High dan MS Limited Edition belum dapat disahkan dalam PDF terkini." }),
    catalogModel("CX-8", mazdaPdf(2025, "MazdaCX8"), [
      ["2.5G Mid 2WD", 163800, 165360.4],
      ["2.5G High 2WD", 169800, 171360.4],
      ["2.5G High Plus 2WD", 184800, 186360.4],
      ["2.5G Turbo High Plus AWD", 199800, 201360.4],
      ["2.2D High Plus 2WD", 191800, 193122.8],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2025-11-01", paintNote: "Soul Red Crystal / Machine Gray: +RM3,000.", note: "OTR rasmi sebelum pakej Accessories Installed RM2,600 berasingan; tambah jika dipilih dalam aksesori tambahan." }),
    catalogModel("CX-60", mazdaPdf(2026, "MazdaCX60"), [
      ["2.5G High 2WD", 198900, 200510.4, { effectiveAt: "2025-07-16" }],
      ["3.3G M Hybrid AWD Black / Black", 250000, 252872.8, { effectiveAt: "2026-09-18" }],
      ["3.3G M Hybrid AWD Black / Tan", 250000, 252872.8, { effectiveAt: "2026-09-18" }],
      ["3.3G M Hybrid AWD Black / Pure White", 250000, 252872.8, { effectiveAt: "2026-09-18" }],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, note: "3.3G menggunakan mild hybrid; 2.5G petrol. Padanan warna badan/dalaman mengikut PDF rasmi." }),
    catalogModel("CX-80", mazdaPdf(2025, "MazdaCX80"), [
      ["2.5G PHEV AWD", 295000, 296610.4],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2025-09-15", powertrain: "PHEV" }),
    catalogModel("BT-50 Double Cab", mazdaPdf(2026, "Mazda_BT50"), [
      ["3.0D High Plus 6AT 4x4 MY25", 138000, 140418.4],
      ["3.0D High Plus 6AT 4x4 MY26", 138000, 140418.4],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-07-01", note: "Private OTR; kod MY25 ZS82 RAA dan MY26 ZS82 RAW diterbitkan dalam PDF yang sama." }),
  ],
  GWM: [
    catalogModel("WEY G9 Hi4 PHEV", "https://www.gwm.com.my/content/dam/gwm/pages/my/en/models/wey-g9/gwm_wey_g9_wm_a4_flyer.pdf", [
      ["Hi4 Ultra", 269380, 269800],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, powertrain: "PHEV" }),
    catalogModel("HAVAL H6 HEV", "https://www.gwm.com.my/content/dam/gwm/pages/my/en/models/haval-h6-hev/gwm_h6_flyer_wm_fa4.pdf", [
      ["Ultra", 139380, 139800],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, powertrain: "Hybrid" }),
    catalogModel("ORA GOOD CAT", "https://www.gwm.com.my/content/dam/gwm/pages/my/en/models/ora-good-cat/ora_flyer_west_malaysia_0326.pdf", [
      ["Ultra", 109800, 110580],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, powertrain: "EV" }),
    catalogModel("ORA GOOD CAT GT", "https://www.gwm.com.my/content/dam/gwm/pages/my/en/models/ora-good-cat/ora_flyer_west_malaysia_0326.pdf", [
      ["Performance", 119800, 120620],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, powertrain: "EV" }),
    catalogModel("TANK 300", "https://www.gwm.com.my/content/dam/gwm/pages/my/en/models/tank-300/tank300-wm.pdf", [
      ["Ultra 2.0 Turbo", 248873.2, 250000],
    ], { checkedAt: NEW_BRAND_CHECKED_AT }),
    catalogModel("TANK 300 HEV", "https://www.gwm.com.my/content/dam/gwm/pages/my/en/models/tank-300-hev/west_malaysia_gwm_tank_300_hev_updated.pdf", [
      ["Ultra 2.0 Turbo Hybrid", null, 259800],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, powertrain: "Hybrid" }),
    catalogModel("TANK 500 HEV", "https://www.gwm.com.my/content/dam/gwm/pages/my/en/models/tank-500-hev/tank-500-west.pdf", [
      ["Ultra 2.0 Turbo Hybrid", 327660.8, 328800],
      ["Black Edition 2.0 Turbo Hybrid", null, 336800, { source: "https://www.gwm.com.my/en/news-list/2025/50-release", effectiveAt: "2025-10-31" }],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, powertrain: "Hybrid" }),
  ],
  BYD: [
    catalogModel("SEAL 6", bydPdf("SEAL_6"), [
      ["Dynamic", 100000, 100770], ["Premium", 115800, 116680],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-01-01", powertrain: "EV" }),
    catalogModel("The New SEAL", bydPdf("NEW_SEAL"), [
      ["Premium", 171800, 172835], ["Performance", 191800, 193465],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-01-01", powertrain: "EV" }),
    catalogModel("ATTO 2", bydPdf("ATTO_2"), [["ATTO 2", 100000, 100820]],
      { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-01-01", powertrain: "EV" }),
    catalogModel("2026 ATTO 3", "https://drive.google.com/file/d/1Qy3WraoV9PIa4085AiZG-kW7zm6fk0Qh/view", [
      ["Ultra", 125800, 126660], ["Premium", 138800, 139835], ["Performance", 149800, 151165],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-01-01", powertrain: "EV", note: "PDF PM dipautkan terus oleh pengedar rasmi di byd.simemotors.my/byd-atto-3." }),
    catalogModel("DOLPHIN", bydPdf("DOLPHIN"), [
      ["Standard", 100000, 100740], ["Extended", 124900, 125760],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-01-01", powertrain: "EV" }),
    catalogModel("M6", bydPdf("M6"), [
      ["Standard", 109800, 110600], ["Extended", 123800, 124660],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-01-01", powertrain: "EV" }),
    catalogModel("2026 SEALION 7", "https://byd.simemotors.my/pub/media/wysiwyg/2026-spec-price/BYD_26_2026_SEALION_7_Brochure_Final_WM.pdf", [
      ["Dynamic", 163800, 164700], ["Premium", 188800, 189835], ["Performance", 203800, 205465],
    ], { checkedAt: NEW_BRAND_CHECKED_AT, effectiveAt: "2026-01-01", powertrain: "EV" }),
  ],
};
