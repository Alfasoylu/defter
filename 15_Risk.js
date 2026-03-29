// ─── 15. RISK PANEL ─────────────────────────────────────────────────────────

function buildRiskPanel_() {
  var ss = getSS_();
  var riskSheet = ensureSheetExists_(ss, CONFIG.sheets.risk);
  setupSheetSchema_(ss, CONFIG.sheets.risk);
  var rhmap = getHeaderMap_(riskSheet);
  var headers = riskSheet
    .getRange(CONFIG.headerRow, 1, 1, riskSheet.getLastColumn())
    .getValues()[0];
  var t = today_();
  var risks = [];

  // Cash risks from projection
  var cashData = buildCashProjection_();
  for (var i = 0; i < cashData.projection.length; i++) {
    var p = cashData.projection[i];
    if (p.kapanis < 0) {
      risks.push({
        "Risk Tipi": "Nakit Sıkışıklığı",
        "İlgili SKU / İşlem": dateKey_(p.date) + " nakit açığı",
        "Tutar Etkisi": Math.abs(p.kapanis),
        "Etki Tarihi": p.date,
        Olasılık: "Yüksek",
        "Beklenen Zarar": Math.abs(p.kapanis),
        Aksiyon: "Tahsilat hızlandır veya gider ertele",
        Durum: "Açık",
      });
    }
  }

  // Overdue receivables
  var alacakRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.alacak) || createDummySheet_(),
  );
  for (var a = 0; a < alacakRows.length; a++) {
    var ar = alacakRows[a];
    if (String(ar["Durum"]).trim() === "Gecikmeli") {
      risks.push({
        "Risk Tipi": "Gecikmiş Alacak",
        "İlgili SKU / İşlem": ar["Alacak Kodu"] + " - " + (ar["Kanal"] || ""),
        "Tutar Etkisi": parseCurrency_(ar["Beklenen Net Tahsilat"]),
        "Etki Tarihi": parseTurkishDate_(ar["Tahsil Tarihi"]) || t,
        Olasılık: "Orta",
        "Beklenen Zarar": parseCurrency_(ar["Beklenen Net Tahsilat"]) * 0.1,
        Aksiyon: "Tahsilat takibi yap",
        Durum: "Açık",
      });
    }
  }

  // Overdue debts
  var borcRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.borc) || createDummySheet_(),
  );
  for (var b = 0; b < borcRows.length; b++) {
    var br = borcRows[b];
    if (String(br["Durum"]).trim() === "Gecikmiş") {
      risks.push({
        "Risk Tipi": "Gecikmiş Borç",
        "İlgili SKU / İşlem":
          br["Borç Kodu"] + " - " + (br["Kurum / Kişi"] || ""),
        "Tutar Etkisi": parseCurrency_(br["Tutar"]),
        "Etki Tarihi": parseTurkishDate_(br["Vade"]) || t,
        Olasılık: "Yüksek",
        "Beklenen Zarar": parseCurrency_(br["Tutar"]),
        Aksiyon: "Ödeme planı yap",
        Durum: "Açık",
      });
    }
  }

  // Stock risks
  var stokRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.stok) || createDummySheet_(),
  );
  for (var s = 0; s < stokRows.length; s++) {
    var sr = stokRows[s];
    var stokDurum = String(sr["Stok Durumu"] || "").trim();
    if (stokDurum === "Kritik") {
      risks.push({
        "Risk Tipi": "Stok Tükenmesi",
        "İlgili SKU / İşlem": sr["SKU"] + " - " + (sr["Ürün Adı"] || ""),
        "Tutar Etkisi": parseCurrency_(sr["Olası 30 Gün Ciro Kaybı"]),
        "Etki Tarihi": parseTurkishDate_(sr["Tahmini Stok Bitiş Tarihi"]) || t,
        Olasılık: "Yüksek",
        "Beklenen Zarar": parseCurrency_(sr["Olası 30 Gün Kar Kaybı"]),
        Aksiyon: "Acil ithalat siparişi ver",
        Durum: "Açık",
      });
    } else if (stokDurum === "Ölü Stok") {
      risks.push({
        "Risk Tipi": "Ölü Stok",
        "İlgili SKU / İşlem": sr["SKU"] + " - " + (sr["Ürün Adı"] || ""),
        "Tutar Etkisi": parseCurrency_(sr["Mevcut Stok Değeri TL"]),
        "Etki Tarihi": t,
        Olasılık: "Orta",
        "Beklenen Zarar": parseCurrency_(sr["Mevcut Stok Değeri TL"]) * 0.5,
        Aksiyon: "İndirimli satış veya tasfiye planı",
        Durum: "Açık",
      });
    }
  }

  // Credit card limit pressure risks
  var kartRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.krediKarti) || createDummySheet_(),
  );
  for (var krt = 0; krt < kartRows.length; krt++) {
    var kr = kartRows[krt];
    if (String(kr["Durum"] || "").trim() !== "Aktif") continue;
    var lPct = parseCurrency_(kr["Limit Kullanım %"]);
    if (lPct >= 90) {
      risks.push({
        "Risk Tipi": "Kredi Kartı Limit Baskısı",
        "İlgili SKU / İşlem": (kr["Kart Adı"] || kr["Kart ID"]) + " - " + (kr["Banka"] || ""),
        "Tutar Etkisi": parseCurrency_(kr["Güncel Bakiye"]),
        "Etki Tarihi": parseTurkishDate_(kr["Sonraki Son Ödeme Tarihi"]) || t,
        Olasılık: lPct >= 100 ? "Yüksek" : "Orta",
        "Beklenen Zarar": parseCurrency_(kr["Güncel Bakiye"]) * 0.05,
        Aksiyon: "Kart borcunu azalt, limit aşımı riskini engelle",
        Durum: "Açık",
      });
    }
  }

  // Open account receivable risks
  var acikHesapRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.acikHesap) || createDummySheet_(),
  );
  var musteriToplam = {};
  var toplamAcikBak = 0;
  for (var ah = 0; ah < acikHesapRows.length; ah++) {
    var ahr = acikHesapRows[ah];
    if (String(ahr["Tahsil Durumu"] || "").trim() === "Tahsil Edildi") continue;
    var ahKalan = parseCurrency_(ahr["Kalan Bakiye"]) || parseCurrency_(ahr["Tutar"]);
    toplamAcikBak += ahKalan;
    var mn = String(ahr["Müşteri Adı"] || "").trim();
    musteriToplam[mn] = (musteriToplam[mn] || 0) + ahKalan;

    // Geciken tek alacak riski
    if (String(ahr["Tahsil Durumu"] || "").trim() === "Geciken" && ahKalan > 0) {
      risks.push({
        "Risk Tipi": "Gecikmiş Alacak",
        "İlgili SKU / İşlem": (ahr["Müşteri Adı"] || "") + " - " + (ahr["Belge / Sipariş No"] || ahr["Alacak ID"]),
        "Tutar Etkisi": ahKalan,
        "Etki Tarihi": parseTurkishDate_(ahr["Vade Tarihi"]) || t,
        Olasılık: parseCurrency_(ahr["Gecikme Günü"]) > 30 ? "Yüksek" : "Orta",
        "Beklenen Zarar": ahKalan * 0.1,
        Aksiyon: "Tahsilat takibi yap",
        Durum: "Açık",
      });
    }
  }
  // Müşteri yoğunlaşma riski
  if (toplamAcikBak > 0) {
    var mKeys = Object.keys(musteriToplam);
    for (var mk = 0; mk < mKeys.length; mk++) {
      var yogunOran = musteriToplam[mKeys[mk]] / toplamAcikBak;
      if (yogunOran > 0.5) {
        risks.push({
          "Risk Tipi": "Açık Hesap Yoğunlaşması",
          "İlgili SKU / İşlem": mKeys[mk] + " (%" + Math.round(yogunOran * 100) + ")",
          "Tutar Etkisi": musteriToplam[mKeys[mk]],
          "Etki Tarihi": t,
          Olasılık: "Orta",
          "Beklenen Zarar": musteriToplam[mKeys[mk]] * 0.15,
          Aksiyon: "Müşteri çeşitliliğini artır, tek müşteriye bağımlılığı azalt",
          Durum: "Açık",
        });
      }
    }
  }

  // Write risks
  if (riskSheet.getLastRow() >= CONFIG.dataStartRow) {
    riskSheet
      .getRange(
        CONFIG.dataStartRow,
        1,
        riskSheet.getLastRow() - CONFIG.dataStartRow + 1,
        riskSheet.getLastColumn(),
      )
      .clearContent();
  }

  if (risks.length > 0) {
    var rows = [];
    for (var ri = 0; ri < risks.length; ri++) {
      risks[ri]["Risk Kodu"] = generateId_(CONFIG.prefixes.risk);
      rows.push(buildRowArray_(headers, rhmap, risks[ri]));
    }
    ensureRows_(riskSheet, CONFIG.dataStartRow + rows.length - 1);
    riskSheet
      .getRange(CONFIG.dataStartRow, 1, rows.length, headers.length)
      .setValues(rows);
  }

  return { ok: true, risks: risks.length };
}

// ─── 15b. ALERT ENGINE ──────────────────────────────────────────────────────

/**
 * Konsolide uyarı motoru. alerts-and-automations.md şartnamesi kapsamında
 * tüm alt sistemleri tarar ve {kategori, seviye, mesaj, etki, aksiyon} listesi üretir.
 */
