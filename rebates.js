// Official-source snapshot, not a live feed. Cutoffs require revalidation, not assumed renewal.
const REBATE_CHECKED_AT = "2026-09-30";
const rebateOffer = (amount, source, note, options = {}) => ({ amount, source, note, validFrom: "2026-09-01", verifiedThrough: REBATE_CHECKED_AT, ...options });
const hondaRebate = (amount, note = "") => rebateOffer(amount, "https://www.honda.com.my/happening/", "Model 2026; pendaftaran 1–30 Sep 2026, varian/tahun eksais terpilih dan stok tersedia. " + note, { year: "2026", endsAt: "2026-09-30" });
const cheryPriceOffer = (retail, promotion, year) => rebateOffer(retail - promotion, "https://www.chery.my/promotion/", "YOM " + year + "; beza retail dengan harga promosi OTR tanpa insurans rasmi. Stok terhad, tertakluk syarat.", { year, kind: "priceDifference", retail, promotion });
// Preserve the September snapshot; undated launch offers are not assumed valid all October.
const recheckedOctober = offer => [offer, { ...offer, validFrom: "2026-10-04", verifiedThrough: "2026-10-04", checkedAt: "2026-10-04", note: offer.note + " Disahkan semula di laman HQ pada 4 Okt 2026; tarikh tamat tidak diterbitkan." }];
const OFFICIAL_REBATES = {
  Proton: {
    "NEW S70 1.5 i-GT": {
      Lite: recheckedOctober(rebateOffer(3000, "https://www.proton.com/models/s70-prime-lite", "Harga pengenalan rasmi: RM59,800 → RM56,800. Tertakluk syarat dan stok.", { validFrom: "2026-09-22" })),
      Prime: rebateOffer(3000, "https://www.proton.com/models/s70-prime-lite", "Harga pengenalan rasmi: RM62,800 → RM59,800. Tertakluk syarat dan stok.", { validFrom: "2026-09-22" }),
    },
    "e.MAS 5": {
      Prime: recheckedOctober(rebateOffer(3000, "https://emas.proton.com/e-mas-5/", "Beza retail RM59,800 dengan Special Launch Price RM56,800. Tawaran terhad; tidak termasuk trade-in.")),
      Premium: recheckedOctober(rebateOffer(3000, "https://emas.proton.com/e-mas-5/", "Beza retail RM72,800 dengan Special Launch Price RM69,800. Tawaran terhad; tidak termasuk trade-in.")),
    },
    "e.MAS 7": {
      Prime: recheckedOctober(rebateOffer(7000, "https://emas.proton.com/e-mas-7/", "Launch Rebate rasmi RM7,000; tawaran terhad. Tidak termasuk trade-in.")),
      Premium: recheckedOctober(rebateOffer(7000, "https://emas.proton.com/e-mas-7/", "Launch Rebate rasmi RM7,000; tawaran terhad. Tidak termasuk trade-in.")),
      "Premium Plus": recheckedOctober(rebateOffer(7000, "https://emas.proton.com/e-mas-7/", "Launch Rebate rasmi RM7,000; tawaran terhad. Tidak termasuk trade-in.")),
    },
    "e.MAS 7 PHEV": {
      Prime: rebateOffer(4000, "https://emas.proton.com/wp-content/uploads/2026/08/PROTON-e.MAS-7-PHEV-Price-List-Peninsular-Malaysia.pdf", "Special Launch Price rasmi; tawaran terhad. Tidak termasuk trade-in.", { validFrom: "2026-08-26" }),
      Premium: rebateOffer(4000, "https://emas.proton.com/wp-content/uploads/2026/08/PROTON-e.MAS-7-PHEV-Price-List-Peninsular-Malaysia.pdf", "Special Launch Price rasmi; tawaran terhad. Tidak termasuk trade-in.", { validFrom: "2026-08-26" }),
      "Premium Plus": rebateOffer(4000, "https://emas.proton.com/wp-content/uploads/2026/08/PROTON-e.MAS-7-PHEV-Price-List-Peninsular-Malaysia.pdf", "Special Launch Price rasmi; tawaran terhad. Tidak termasuk trade-in.", { validFrom: "2026-08-26" }),
    },
  },
  Perodua: {
    "QV-E": {
      "Battery-as-a-Service (BaaS)": rebateOffer(16500, "https://ev.perodua.com.my/assets/Peninsular_Malaysia_New_QV-E_Price_list-DpT2PuSS.pdf", "Special Rebate Price rasmi RM53,499; sewaan bateri masih berasingan. Tawaran masa terhad.", { validFrom: "2026-09-15" }),
      "Full Purchase (Battery Included)": rebateOffer(16500, "https://ev.perodua.com.my/assets/Peninsular_Malaysia_New_QV-E_Price_list-DpT2PuSS.pdf", "Special Rebate Price rasmi RM77,499. Tawaran masa terhad.", { validFrom: "2026-09-15" }),
    },
  },
  Honda: {
    "City Hatchback": { "1.5L S": hondaRebate(6000), "1.5L E": hondaRebate(6000), "1.5L V": hondaRebate(6000), "1.5L RS": hondaRebate(6000), "1.5L e:HEV RS": hondaRebate(6000, "Service voucher bukan cash rebate.") },
    Civic: { "1.5L E": hondaRebate(8000), "1.5L V": hondaRebate(8000), "1.5L RS": hondaRebate(12000), "2.0L e:HEV RS": hondaRebate(12000, "Service voucher bukan cash rebate.") },
    "HR-V": { "1.5L S": hondaRebate(8000), "1.5L T E": hondaRebate(8000), "1.5L T V": hondaRebate(6000), "1.5L e:HEV RS": hondaRebate(9000, "Cash rebate RM7,000 + Hybrid Support cash RM2,000.") },
    "CR-V": { "2.0L e:HEV E": hondaRebate(7000, "Cash rebate RM5,000 + Hybrid Support cash RM2,000."), "1.5L V": hondaRebate(10000), "2.0L e:HEV RS": hondaRebate(7000, "Cash rebate RM5,000 + Hybrid Support cash RM2,000.") },
    "WR-V": { "1.5L E": hondaRebate(5000), "1.5L V": hondaRebate(5000), "1.5L RS": hondaRebate(5000) },
  },
  Chery: {
    "Chery O5": { "1.5 Turbo": [cheryPriceOffer(116800, 105800, "2026"), cheryPriceOffer(116800, 99800, "2025")] },
    "Omoda E5": { "150kW": [cheryPriceOffer(146978, 108800, "2026"), cheryPriceOffer(146978, 99800, "2025")] },
    "Tiggo Cross": { "1.5 Hybrid CSH": rebateOffer(7888, "https://www.chery.my/promotion/", "Rebate rasmi YOM 2025 sahaja; stok terhad. Tidak ditambah pada harga promosi lain.", { year: "2025" }) },
    "Tiggo 8 PHEV": { "1.5 TGDI + DHT CSH": cheryPriceOffer(159800, 138800, "2025") },
  },
};
const REBATE_AUDIT_SOURCES = {
  Proton: { checkedAt: "2026-10-04", source: "https://www.proton.com/offers/current-promotion/", note: "Kempen ICE masih bertarikh tamat 30 Sep. S70 Prime belum dipadankan tepat; e.MAS 7 PHEV terhad kepada 5,000 tempahan pertama, bukan rebate umum." },
  Perodua: { checkedAt: "2026-10-04", source: "https://www.perodua.com.my/", note: "QV-E: harga laman HQ RM63,499/RM87,499 bercanggah dengan PDF RM53,499/RM77,499. Tiada default sehingga disahkan; model lain belum mempunyai rebate Oktober tepat." },
  Honda: { checkedAt: "2026-10-04", source: "https://www.honda.com.my/happening/", note: "Kempen 1–31 Okt: jumlah rewards tidak memisahkan cash rebate setiap varian daripada bonus pemilik, early-bird dan kelayakan khas. Amaun September tidak dibawa ke Oktober." },
  Toyota: { checkedAt: "2026-10-04", source: "https://www.toyota.com.my/en/promotions/monthly-promo.html", note: "Kempen Oktober: kebanyakan promosi sehingga/from atau voucher. Yaris Cross menawarkan pilihan pakej RM2,000 + voucher atau RM3,500; bukan satu rebate universal." },
  Mitsubishi: { checkedAt: "2026-10-04", source: "https://www.mitsubishi-motors.com.my/current-offers/", note: "Kempen 1–31 Okt: Xforce/XPANDER mempunyai pakej alternatif warranty/servis/cash. Triton menyebut Diesel Support dan tahun model bercanggah; tidak dianggap rebate umum." },
  Mazda: { checkedAt: "2026-10-04", source: "https://mazda.com.my/offers", note: "Tiada rebate tepat setiap varian disahkan. Poster limited-period bertarikh 6 Okt memaparkan harga from sahaja, bukan cash rebate universal." },
  GWM: { checkedAt: "2026-10-04", source: "https://www.gwm.com.my/en/deal", note: "Halaman offers tidak memberikan cash rebate Oktober tepat. Loyalty, pakej dan kempen tamat September tidak dimasukkan." },
  BYD: { checkedAt: "2026-10-04", source: "https://byd.simemotors.my/news-events", note: "Tiada rebate HQ Oktober tepat setiap varian dapat disahkan. Hadiah, cabutan bertuah dan promosi tamat September tidak digunakan." },
  Jaecoo: { checkedAt: "2026-10-04", source: "https://www.omodajaecoo.com.my/", note: "Program affiliate memerlukan organisasi/kelayakan dan kelulusan HQ; bukan cash rebate umum. Amaun Oktober tepat belum disahkan." },
  OMODA: { checkedAt: "2026-10-04", source: "https://www.omodajaecoo.com.my/", note: "Program affiliate bersyarat; amaun cash rebate Oktober tepat C9/C9 PHEV belum disahkan. Default kosong." },
  Chery: { checkedAt: "2026-10-04", source: "https://www.chery.my/promotion/", note: "Laman masih berjudul kempen Merdeka/Malaysia Day; kesahan Oktober bagi tawaran YOM 2025/2026 belum disahkan. Tidak menyambung snapshot September." },
  Jetour: { checkedAt: "2026-10-04", source: "https://jetour.com.my/discover/events-campaigns/", note: "Senarai kempen masih menawarkan promosi Januari dan diskaun penjawat awam bersyarat. Tiada rebate umum Oktober tepat disahkan." },
};
function findOfficialRebate(brand, model, variant, year, date) {
  const entry = OFFICIAL_REBATES[brand]?.[model]?.[variant];
  return (Array.isArray(entry) ? entry : entry ? [entry] : []).find(offer => (!offer.year || offer.year === year) && date >= offer.validFrom && date <= offer.verifiedThrough && (!offer.endsAt || date <= offer.endsAt)) || null;
}
