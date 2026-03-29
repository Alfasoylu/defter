// ─── 16. DASHBOARD RENDERER ─────────────────────────────────────────────────

function renderDashboard_() {
  var ss = getSS_();
  var sheet = ensureSheetExists_(ss, CONFIG.sheets.dashboard);
  var t = today_();

  // Gather all data
  var cashData = buildCashProjection_();
  var proj = cashData.projection;
  var decisions = buildDecisionEngine_();
  var importCap = decisions.importCapacity;
  var thresholds = decisions.thresholds;

  var stokRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.stok) || createDummySheet_(),
  );
  var borcRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.borc) || createDummySheet_(),
  );
  var alacakRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.alacak) || createDummySheet_(),
  );

  // Cash metrics
  var currentCash = proj.length > 0 ? proj[0].acilis : 0;

  // En riskli tarih ve negatif gün sayısı
  var minBakiye = Infinity,
    enRiskliTarih = "";
  var negatifGun = 0;
  for (var i = 0; i < proj.length; i++) {
    if (proj[i].kapanis < minBakiye) {
      minBakiye = proj[i].kapanis;
      enRiskliTarih = proj[i].dateStr;
    }
    if (proj[i].kapanis < 0) negatifGun++;
  }
  if (minBakiye === Infinity) minBakiye = 0;

  // Tampon durumu
  var tamponDurum =
    currentCash >= cashData.minCashReserve
      ? "GÜVENLİ"
      : currentCash >= 0
        ? "DİKKAT"
        : "KRİTİK";

  // Zaman ufku metrikleri
  var horizons = [
    { label: "7 Gün", days: 7 },
    { label: "30 Gün", days: 30 },
    { label: "60 Gün", days: 60 },
    { label: "90 Gün", days: 90 },
  ];
  var horizonData = [];
  for (var h = 0; h < horizons.length; h++) {
    var hMin = Infinity,
      hNeg = 0,
      hTamponKir = false;
    for (var hi = 0; hi < Math.min(horizons[h].days, proj.length); hi++) {
      if (proj[hi].kapanis < hMin) hMin = proj[hi].kapanis;
      if (proj[hi].kapanis < 0) hNeg++;
      if (proj[hi].kapanis < cashData.minCashReserve) hTamponKir = true;
    }
    if (hMin === Infinity) hMin = 0;
    horizonData.push({
      label: horizons[h].label,
      minBakiye: hMin,
      negatifGun: hNeg,
      tamponKirildi: hTamponKir ? "EVET" : "Hayır",
    });
  }

  // Stock summary metrics
  var toplamStok = 0,
    kritikSKU = 0;
  for (var s = 0; s < stokRows.length; s++) {
    toplamStok += parseCurrency_(stokRows[s]["Mevcut Stok Değeri TL"]);
    if (String(stokRows[s]["Stok Durumu"] || "").trim() === "Kritik")
      kritikSKU++;
  }

  // Yaklaşan ödemeler (7 gün & 30 gün)
  var odeme7 = 0,
    odeme30 = 0;
  var yaklasanOdemeler = [];
  for (var b = 0; b < borcRows.length; b++) {
    var br = borcRows[b];
    if (
      String(br["Durum"]).trim() === "Ödendi" ||
      String(br["Durum"]).trim() === "İptal"
    )
      continue;
    var vade = parseTurkishDate_(br["Vade"]);
    if (!vade) continue;
    var gun = daysBetween_(t, vade);
    var tutar = parseCurrency_(br["Tutar"]);
    if (gun >= 0 && gun <= 7) odeme7 += tutar;
    if (gun >= 0 && gun <= 30) odeme30 += tutar;
    if (gun >= 0 && gun <= 30) {
      yaklasanOdemeler.push({
        kod: br["Borç Kodu"] || "",
        kurum: br["Kurum / Kişi"] || "",
        tutar: tutar,
        gun: gun,
      });
    }
  }
  yaklasanOdemeler.sort(function (a, b) {
    return a.gun - b.gun;
  });

  // Yaklaşan tahsilatlar
  var tahsilat7 = 0,
    gecikenTop = 0,
    riskliAlacakSayisi = 0;
  var yaklasanTahsilatlar = [];
  for (var a = 0; a < alacakRows.length; a++) {
    var ar = alacakRows[a];
    var aDurum = String(ar["Durum"] || "").trim();
    if (aDurum === "Tahsil Edildi" || aDurum === "İptal") continue;
    var tahsTarih = parseTurkishDate_(ar["Tahsil Tarihi"]);
    var net = parseCurrency_(ar["Beklenen Net Tahsilat"]);
    if (aDurum === "Gecikmeli") {
      gecikenTop += net;
      riskliAlacakSayisi++;
    }
    if (tahsTarih) {
      var gKaldi = daysBetween_(t, tahsTarih);
      if (gKaldi >= 0 && gKaldi <= 7) tahsilat7 += net;
      if (gKaldi >= -30 && gKaldi <= 30) {
        yaklasanTahsilatlar.push({
          kod: ar["Alacak Kodu"] || "",
          kanal: ar["Kanal"] || "",
          tutar: net,
          gun: gKaldi,
        });
      }
    }
  }
  yaklasanTahsilatlar.sort(function (a, b) {
    return a.gun - b.gun;
  });

  // ---- RENDER ----
  if (sheet.getMaxColumns() < 14) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 14 - sheet.getMaxColumns());
  }
  sheet.clear();
  var row = 1;

  // Title
  sheet
    .getRange(row, 1)
    .setValue("DASHBOARD — Finansal Karar Paneli")
    .setFontSize(14)
    .setFontWeight("bold");
  row++;
  sheet
    .getRange(row, 1)
    .setValue(
      "Güncelleme: " +
        dateKey_(t) +
        " " +
        Utilities.formatDate(new Date(), CONFIG.timezone, "HH:mm"),
    )
    .setFontColor("#666666");
  row += 2;

  // ━━━ BLOK 1: ÜST ÖZET ━━━
  sheet
    .getRange(row, 1)
    .setValue("ÜST ÖZET")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  var ozetData = [
    ["Bugünkü Gerçek Nakit", currentCash],
    ["Güvenli Nakit Alt Limiti", cashData.minCashReserve],
    ["Tampon Durumu", tamponDurum],
    ["En Riskli Tarih", enRiskliTarih],
    ["En Riskli Min Bakiye", minBakiye],
    ["Negatif Gün Sayısı (90g)", negatifGun],
  ];
  sheet.getRange(row, 1, ozetData.length, 2).setValues(ozetData);
  row += ozetData.length + 1;

  // ━━━ BLOK 2: BUGÜN NE YAPMALI ━━━
  sheet
    .getRange(row, 1)
    .setValue("BUGÜN NE YAPMALI")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  var kararlar = decisions.kararlar;
  sheet
    .getRange(row, 1, 1, 4)
    .setValues([["Karar", "Öncelik", "Dayanak", "Aksiyon"]])
    .setFontWeight("bold");
  row++;
  for (var k = 0; k < Math.min(kararlar.length, 8); k++) {
    sheet
      .getRange(row, 1, 1, 4)
      .setValues([
        [
          kararlar[k].baslik,
          kararlar[k].oncelik,
          kararlar[k].dayanak,
          kararlar[k].aksiyon,
        ],
      ]);
    row++;
  }
  row++;

  // ━━━ BLOK 3: ZAMAN UFKU ━━━
  sheet
    .getRange(row, 1)
    .setValue("ZAMAN UFKU GÖRÜNÜMܠ")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  sheet
    .getRange(row, 1, 1, 4)
    .setValues([["Ufuk", "Min Bakiye", "Negatif Gün", "Tampon Kırıldı"]])
    .setFontWeight("bold");
  row++;
  for (var hz = 0; hz < horizonData.length; hz++) {
    sheet
      .getRange(row, 1, 1, 4)
      .setValues([
        [
          horizonData[hz].label,
          horizonData[hz].minBakiye,
          horizonData[hz].negatifGun,
          horizonData[hz].tamponKirildi,
        ],
      ]);
    row++;
  }
  row++;

  // ━━━ BLOK 4: YAKLAŞAN ÖDEMELER ━━━
  sheet
    .getRange(row, 1)
    .setValue("YAKLAŞAN ÖDEMELER")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  sheet.getRange(row, 1, 1, 2).setValues([["7 Gün Ödeme Yükü", odeme7]]);
  row++;
  sheet.getRange(row, 1, 1, 2).setValues([["30 Gün Ödeme Yükü", odeme30]]);
  row++;
  sheet
    .getRange(row, 1, 1, 4)
    .setValues([["Kod", "Kurum", "Tutar", "Gün Kaldı"]])
    .setFontWeight("bold");
  row++;
  for (var o = 0; o < Math.min(5, yaklasanOdemeler.length); o++) {
    sheet
      .getRange(row, 1, 1, 4)
      .setValues([
        [
          yaklasanOdemeler[o].kod,
          yaklasanOdemeler[o].kurum,
          yaklasanOdemeler[o].tutar,
          yaklasanOdemeler[o].gun,
        ],
      ]);
    row++;
  }
  row++;

  // ━━━ BLOK 5: YAKLAŞAN TAHSİLATLAR ━━━
  sheet
    .getRange(row, 1)
    .setValue("YAKLAŞAN TAHSİLATLAR")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  sheet
    .getRange(row, 1, 1, 2)
    .setValues([["7 Gün Tahsilat Beklentisi", tahsilat7]]);
  row++;
  sheet
    .getRange(row, 1, 1, 2)
    .setValues([["Geciken Tahsilat Toplamı", gecikenTop]]);
  row++;
  sheet
    .getRange(row, 1, 1, 2)
    .setValues([["Yüksek Riskli Alacak Sayısı", riskliAlacakSayisi]]);
  row++;
  sheet
    .getRange(row, 1, 1, 4)
    .setValues([["Kod", "Kanal", "Tutar", "Gün"]])
    .setFontWeight("bold");
  row++;
  for (var ta = 0; ta < Math.min(5, yaklasanTahsilatlar.length); ta++) {
    sheet
      .getRange(row, 1, 1, 4)
      .setValues([
        [
          yaklasanTahsilatlar[ta].kod,
          yaklasanTahsilatlar[ta].kanal,
          yaklasanTahsilatlar[ta].tutar,
          yaklasanTahsilatlar[ta].gun,
        ],
      ]);
    row++;
  }
  row++;

  // ━━━ BLOK 6: GÜVENLİ İTHALAT KAPASİTESİ ━━━
  sheet
    .getRange(row, 1)
    .setValue("GÜVENLİ İTHALAT KAPASİTESİ")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  var ithalatData = [
    ["Güvenli Kapasite", importCap.guvenliKapasite],
    ["Temkinli Kapasite", importCap.temkinliKapasite],
    ["30g Min Bakiye", importCap.min30],
    ["60g Min Bakiye", importCap.min60],
    ["90g Min Bakiye", importCap.min90],
    [
      "Ana Darboğaz",
      importCap.darbogazlar.length > 0
        ? importCap.darbogazlar.join("; ")
        : "Yok",
    ],
  ];
  sheet.getRange(row, 1, ithalatData.length, 2).setValues(ithalatData);
  row += ithalatData.length + 1;

  // ━━━ BLOK 7: KREDİ VE FİNANSMAN ━━━
  sheet
    .getRange(row, 1)
    .setValue("KREDİ VE FİNANSMAN")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  var krediData = [
    ["Kredi Kararı", importCap.krediKarar],
    ["DSCR", importCap.dscr],
    ["Maks Kredi Tutarı", importCap.maxKrediTutar],
    ["Maks Aylık Faiz", "%" + importCap.maxFaiz * 100],
    ["Aylık Nakit Yaratımı", importCap.aylikNakitYaratimi],
  ];
  sheet.getRange(row, 1, krediData.length, 2).setValues(krediData);
  row += krediData.length + 1;

  // ━━━ BLOK 8: MARJ VE DEVİR EŞİKLERİ ━━━
  sheet
    .getRange(row, 1)
    .setValue("MARJ VE DEVİR EŞİKLERİ")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  var marjData = [
    ["Min Gerekli Brüt Marj", "%" + thresholds.minBrutMarj],
    ["Min Gerekli Net Marj", "%" + thresholds.minNetMarj],
    ["Maks Kabul Edilebilir Devir", thresholds.maxDevirGun + " gün"],
    ["Mevcut Ort. Devir", thresholds.ortDevirGun + " gün"],
    ["Mevcut Ort. Marj", "%" + thresholds.ortMarj],
    ["Aylık Sabit Gider", thresholds.aylikSabitGider],
    ["Aylık Finansman Baskısı", thresholds.aylikFinansmanBaskisi],
  ];
  sheet.getRange(row, 1, marjData.length, 2).setValues(marjData);
  row += marjData.length + 1;

  // ━━━ BLOK 9: STOK VE VERİM ━━━
  sheet
    .getRange(row, 1)
    .setValue("STOK VE VERİM")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  sheet.getRange(row, 1, 1, 2).setValues([["Toplam Stok Değeri", toplamStok]]);
  row++;
  sheet
    .getRange(row, 1, 1, 2)
    .setValues([["Kritik Stoklu SKU Sayısı", kritikSKU]]);
  row++;

  // Top 5 en verimli + bottom 5 zayıf (from SKU Karlılık)
  var skuSheet = ss.getSheetByName(CONFIG.sheets.skuKar);
  if (skuSheet) {
    var skuRows = getAllRows_(skuSheet);
    var verimli = skuRows
      .filter(function (r) {
        return r["Ürün Sınıfı"] === "A";
      })
      .slice(0, 5);
    var zayif = skuRows
      .filter(function (r) {
        return r["Ürün Sınıfı"] === "C";
      })
      .slice(0, 5);
    if (verimli.length > 0) {
      row++;
      sheet
        .getRange(row, 1)
        .setValue("En Verimli Ürünler (A Sınıfı)")
        .setFontWeight("bold");
      row++;
      sheet
        .getRange(row, 1, 1, 4)
        .setValues([["SKU", "Ürün", "Sermaye Verim", "Karar"]])
        .setFontWeight("bold");
      row++;
      for (var v = 0; v < verimli.length; v++) {
        sheet
          .getRange(row, 1, 1, 4)
          .setValues([
            [
              verimli[v]["SKU"],
              verimli[v]["Ürün Adı"] || "",
              verimli[v]["Sermaye Verim Puanı"] || "",
              verimli[v]["Stok Politika Kararı"] || "",
            ],
          ]);
        row++;
      }
    }
    if (zayif.length > 0) {
      row++;
      sheet
        .getRange(row, 1)
        .setValue("Zayıf Ürünler (C Sınıfı)")
        .setFontWeight("bold");
      row++;
      sheet
        .getRange(row, 1, 1, 4)
        .setValues([["SKU", "Ürün", "Sermaye Verim", "Karar"]])
        .setFontWeight("bold");
      row++;
      for (var z = 0; z < zayif.length; z++) {
        sheet
          .getRange(row, 1, 1, 4)
          .setValues([
            [
              zayif[z]["SKU"],
              zayif[z]["Ürün Adı"] || "",
              zayif[z]["Sermaye Verim Puanı"] || "",
              zayif[z]["Stok Politika Kararı"] || "",
            ],
          ]);
        row++;
      }
    }
  }

  // ━━━ BLOK 10: KREDİ KARTI DURUMU ━━━
  row++;
  sheet
    .getRange(row, 1)
    .setValue("KREDİ KARTI DURUMU")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  var kartSheet = ss.getSheetByName(CONFIG.sheets.krediKarti);
  if (kartSheet) {
    var kartRowsD = getAllRows_(kartSheet);
    var toplamKartBorc = 0;
    var enYakinOdeme = null;
    var enYakinKart = "";
    var maxLimitPct = 0;
    for (var kd = 0; kd < kartRowsD.length; kd++) {
      var kdr = kartRowsD[kd];
      if (String(kdr["Durum"] || "").trim() !== "Aktif") continue;
      toplamKartBorc += parseCurrency_(kdr["Güncel Bakiye"]);
      var lp = parseCurrency_(kdr["Limit Kullanım %"]);
      if (lp > maxLimitPct) maxLimitPct = lp;
      var kSonOd = parseTurkishDate_(kdr["Sonraki Son Ödeme Tarihi"]);
      if (kSonOd && (!enYakinOdeme || kSonOd < enYakinOdeme)) {
        enYakinOdeme = kSonOd;
        enYakinKart = kdr["Kart Adı"] || kdr["Kart ID"] || "";
      }
    }
    var kartBaskiDurum = maxLimitPct >= 90 ? "KRİTİK" : maxLimitPct >= 80 ? "DİKKAT" : "GÜVENLİ";
    var kartData = [
      ["Toplam Kart Borcu", formatTL_(toplamKartBorc) + " TL"],
      ["En Yakın Son Ödeme", enYakinOdeme ? dateKey_(enYakinOdeme) + " (" + enYakinKart + ")" : "Yok"],
      ["Maks Limit Kullanımı", "%" + maxLimitPct],
      ["Ödeme Baskısı", kartBaskiDurum],
    ];
    sheet.getRange(row, 1, kartData.length, 2).setValues(kartData);
    row += kartData.length;
  } else {
    sheet.getRange(row, 1).setValue("Kredi kartı verisi yok");
    row++;
  }
  row++;

  // ━━━ BLOK 11: AÇIK HESAP TAHSİLAT ━━━
  sheet
    .getRange(row, 1)
    .setValue("AÇIK HESAP TAHSİLAT")
    .setFontWeight("bold")
    .setFontSize(11);
  row++;
  var ahSheet = ss.getSheetByName(CONFIG.sheets.acikHesap);
  if (ahSheet) {
    var ahRowsD = getAllRows_(ahSheet);
    var ahToplamAcik = 0;
    var ahGecikenTop = 0;
    var ahGecikenSayisi = 0;
    var ahYaklasan7 = 0;
    for (var ad = 0; ad < ahRowsD.length; ad++) {
      var adr = ahRowsD[ad];
      var adDurum = String(adr["Tahsil Durumu"] || "").trim();
      if (adDurum === "Tahsil Edildi") continue;
      var adKalan = parseCurrency_(adr["Kalan Bakiye"]) || parseCurrency_(adr["Tutar"]);
      ahToplamAcik += adKalan;
      if (adDurum === "Geciken" || adDurum === "Riskli / İhtilaflı") {
        ahGecikenTop += adKalan;
        ahGecikenSayisi++;
      }
      var adVade = parseTurkishDate_(adr["Vade Tarihi"]);
      if (adVade && daysBetween_(t, adVade) >= 0 && daysBetween_(t, adVade) <= 7) {
        ahYaklasan7 += adKalan;
      }
    }
    var ahData = [
      ["Toplam Açık Bakiye", formatTL_(ahToplamAcik) + " TL"],
      ["Geciken Tahsilat", formatTL_(ahGecikenTop) + " TL (" + ahGecikenSayisi + " kayıt)"],
      ["7 Gün Tahsilat Beklentisi", formatTL_(ahYaklasan7) + " TL"],
    ];
    sheet.getRange(row, 1, ahData.length, 2).setValues(ahData);
    row += ahData.length;
    // Yüksek riskli müşteriler
    var riskliMusteri = ahRowsD.filter(function(r) {
      return parseCurrency_(r["Risk Skoru"]) > 60 && String(r["Tahsil Durumu"] || "").trim() !== "Tahsil Edildi";
    });
    if (riskliMusteri.length > 0) {
      row++;
      sheet.getRange(row, 1).setValue("Yüksek Riskli Müşteriler").setFontWeight("bold");
      row++;
      sheet.getRange(row, 1, 1, 4).setValues([["Müşteri", "Kalan Bakiye", "Gecikme Gün", "Risk Skoru"]]).setFontWeight("bold");
      row++;
      for (var rm = 0; rm < Math.min(5, riskliMusteri.length); rm++) {
        sheet.getRange(row, 1, 1, 4).setValues([[
          riskliMusteri[rm]["Müşteri Adı"] || "",
          parseCurrency_(riskliMusteri[rm]["Kalan Bakiye"]) || parseCurrency_(riskliMusteri[rm]["Tutar"]),
          parseCurrency_(riskliMusteri[rm]["Gecikme Günü"]),
          parseCurrency_(riskliMusteri[rm]["Risk Skoru"]),
        ]]);
        row++;
      }
    }
  } else {
    sheet.getRange(row, 1).setValue("Açık hesap verisi yok");
    row++;
  }

  // ━━━ BLOK 12: UYARILAR ━━━
  row++;
  sheet.getRange(row, 1).setValue("UYARILAR").setFontWeight("bold").setFontSize(11);
  row++;
  var alertResult = buildAlerts_();
  var aOzet = alertResult.ozet;
  sheet.getRange(row, 1, 1, 4).setValues([["Kritik: " + aOzet.kritik, "Yüksek: " + aOzet.yuksek, "Orta: " + aOzet.orta, "Toplam: " + aOzet.toplam]]);
  row++;
  if (alertResult.alerts.length > 0) {
    sheet.getRange(row, 1, 1, 4).setValues([["Seviye", "Kategori", "Uyarı", "Aksiyon"]]).setFontWeight("bold");
    row++;
    var maxUyari = Math.min(alertResult.alerts.length, 15);
    for (var ua = 0; ua < maxUyari; ua++) {
      var al = alertResult.alerts[ua];
      sheet.getRange(row, 1, 1, 4).setValues([[al.seviye, al.kategori, al.mesaj, al.aksiyon]]);
      var uyariCell = sheet.getRange(row, 1);
      if (al.seviye === "Kritik") uyariCell.setBackground("#f4cccc");
      else if (al.seviye === "Yüksek") uyariCell.setBackground("#fce5cd");
      else uyariCell.setBackground("#fff2cc");
      row++;
    }
  } else {
    sheet.getRange(row, 1).setValue("Aktif uyarı yok — sistem güvenli durumda.");
    row++;
  }

  return { ok: true };
}
