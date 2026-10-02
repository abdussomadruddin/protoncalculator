// Official-source snapshot, not a live feed. Cutoffs require revalidation, not assumed renewal.
const REBATE_CHECKED_AT = "2026-09-30";
const rebateOffer = (amount, source, note, options = {}) => ({ amount, source, note, validFrom: "2026-09-01", verifiedThrough: REBATE_CHECKED_AT, ...options });
const hondaRebate = (amount, note = "") => rebateOffer(amount, "https://www.honda.com.my/happening/", "Model 2026; pendaftaran 1–30 Sep 2026, varian/tahun eksais terpilih dan stok tersedia. " + note, { year: "2026", endsAt: "2026-09-30" });
const cheryPriceOffer = (retail, promotion, year) => rebateOffer(retail - promotion, "https://www.chery.my/promotion/", "YOM " + year + "; beza retail dengan harga promosi OTR tanpa insurans rasmi. Stok terhad, tertakluk syarat.", { year, kind: "priceDifference", retail, promotion });
const OFFICIAL_REBATES = {
  Proton: {
    "NEW S70 1.5 i-GT": {
      Lite: rebateOffer(3000, "https://www.proton.com/models/s70-prime-lite", "Harga pengenalan rasmi: RM59,800 → RM56,800. Tertakluk syarat dan stok.", { validFrom: "2026-09-22" }),
      Prime: rebateOffer(3000, "https://www.proton.com/models/s70-prime-lite", "Harga pengenalan rasmi: RM62,800 → RM59,800. Tertakluk syarat dan stok.", { validFrom: "2026-09-22" }),
    },
    "e.MAS 5": {
      Prime: rebateOffer(3000, "https://emas.proton.com/e-mas-5/", "Beza retail RM59,800 dengan Special Launch Price RM56,800. Tawaran terhad; tidak termasuk trade-in."),
      Premium: rebateOffer(3000, "https://emas.proton.com/e-mas-5/", "Beza retail RM72,800 dengan Special Launch Price RM69,800. Tawaran terhad; tidak termasuk trade-in."),
    },
    "e.MAS 7": {
      Prime: rebateOffer(7000, "https://emas.proton.com/e-mas-7/", "Launch Rebate rasmi RM7,000; tawaran terhad. Tidak termasuk trade-in."),
      Premium: rebateOffer(7000, "https://emas.proton.com/e-mas-7/", "Launch Rebate rasmi RM7,000; tawaran terhad. Tidak termasuk trade-in."),
      "Premium Plus": rebateOffer(7000, "https://emas.proton.com/e-mas-7/", "Launch Rebate rasmi RM7,000; tawaran terhad. Tidak termasuk trade-in."),
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
  Mitsubishi: { checkedAt: "2026-10-02", source: "https://www.mitsubishi-motors.com.my/brochures/", note: "Rebate Oktober tepat mengikut varian belum disahkan. Pakej ansuran, trade-in dan tawaran bersyarat tidak dianggap cash rebate umum." },
  Mazda: { checkedAt: "2026-10-02", source: "https://www.mazda.com.my/vehicles", note: "Rebate Oktober tepat mengikut varian/tahun belum disahkan; tidak disimpulkan daripada beza harga MY25/MY26." },
  GWM: { checkedAt: "2026-10-02", source: "https://www.gwm.com.my/en/models", note: "RM3,000 dalam risalah ialah GWM Owners Loyalty Offer, bukan rebate semua pembeli. Tawaran bersyarat tidak dimasukkan sebagai default." },
  BYD: { checkedAt: "2026-10-02", source: "https://byd.simemotors.my/", note: "Rebate Oktober tepat mengikut varian belum disahkan. Harga RRP dan OTR tidak dikurangkan menggunakan promosi tidak disahkan." },
  Proton: { source: "https://www.proton.com/offers/current-promotion/", note: "Kempen September menyatakan cash rebate sehingga RM9,000 tanpa amaun tepat setiap varian. Trade-in dan bonus tidak dimasukkan secara automatik." },
  Perodua: { source: "https://www.perodua.com.my/", note: "Tiada amaun rebate pembelian tepat yang dapat disahkan untuk varian ini. Diskaun servis bukan rebate pembelian." },
  Honda: { source: "https://www.honda.com.my/happening/", note: "Varian/tahun ini tidak mempunyai amaun tepat dalam jadual promosi yang disemak. Shared Rewards, One Nation dan bonus first-500 tidak dimasukkan secara automatik." },
  Toyota: { source: "https://www.toyota.com.my/en/promotions/monthly-promo.html", note: "Promosi September yang diterbitkan tidak menyatakan cash rebate tepat mengikut varian. Ansuran EZ Beli dan servis bukan cash rebate." },
  Jaecoo: { source: "https://www.omodajaecoo.com.my/merdeka-sales", note: "Kempen rasmi menyebut rebate sehingga atau overtrade; kelayakan/amaun tepat setiap varian tidak diterbitkan. Tidak digunakan sebagai rebate tetap." },
  Chery: { source: "https://www.chery.my/promotion/", note: "Tawaran tepat untuk tahun/varian ini belum dapat dipadankan dengan pasti. Tawaran YOM 2025 dan pakej Tiggo 9 tidak digabungkan dengan tawaran lain." },
  Jetour: { source: "https://jetour.com.my/discover/events-campaigns/", note: "Tiada amaun rebate pembelian September tepat untuk varian ini yang dapat disahkan. Promosi Januari, pertandingan dan kelayakan khas tidak digunakan." },
};
function findOfficialRebate(brand, model, variant, year, date) {
  const entry = OFFICIAL_REBATES[brand]?.[model]?.[variant];
  return (Array.isArray(entry) ? entry : entry ? [entry] : []).find(offer => (!offer.year || offer.year === year) && date >= offer.validFrom && date <= offer.verifiedThrough && (!offer.endsAt || date <= offer.endsAt)) || null;
}
