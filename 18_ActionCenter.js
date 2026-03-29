// ─── 17. ACTION CENTER RENDERER ─────────────────────────────────────────────

function renderActionCenter_() {
  var ss = getSS_();
  var sheet = ensureSheetExists_(ss, CONFIG.sheets.aksiyon);
  var t = today_();

  var actions = [];

  // --- Debt actions ---
  var borcRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.borc) || createDummySheet_(),
  );
  // Collect payments by date for cluster detection
  var odemeTarihleri = {};
  for (var b = 0; b < borcRows.length; b++) {
    var br = borcRows[b];
    var bDurum = String(br["Durum"] || "").trim();
    if (bDurum === "Ödendi" || bDurum === "İptal") continue;
    var vade = parseTurkishDate_(br["Vade"]);
    var bTip = String(br["Borç Türü"] || "").trim();
    var tutar = parseCurrency_(br["Tutar"]);

    if (bDurum === "Gecikmiş") {
      actions.push({
        prio: 100,
        text:
          "GECİKMİŞ BORÇ: " +
          (br["Kurum / Kişi"] || br["Borç Kodu"]) +
          " — " +
          formatTL_(tutar) +
          " TL — Hemen öde!",
        kategori: "Borç",
      });
    } else if (vade && daysBetween_(t, vade) <= 3) {
      actions.push({
        prio: 85,
        text:
          bTip +
          " ödeme yaklaşıyor: " +
          (br["Kurum / Kişi"] || "") +
          " — " +
          formatTL_(tutar) +
          " TL — " +
          dateKey_(vade),
        kategori: "Borç",
      });
    } else if (
      vade &&
      daysBetween_(t, vade) <= 7 &&
      (bTip === "Vergi" ||
        bTip === "Maaş" ||
        bTip === "Kredi Taksidi" ||
        bTip === "Kredi Kartı")
    ) {
      actions.push({
        prio: 80,
        text:
          bTip +
          " öncelikli: " +
          (br["Kurum / Kişi"] || "") +
          " — " +
          formatTL_(tutar) +
          " TL — " +
          dateKey_(vade),
        kategori: "Borç",
      });
    }
    // Track high-value payments for cluster detection
    if (vade && tutar > 5000) {
      var vKey = dateKey_(vade);
      if (!odemeTarihleri[vKey]) odemeTarihleri[vKey] = { toplam: 0, adet: 0 };
      odemeTarihleri[vKey].toplam += tutar;
      odemeTarihleri[vKey].adet++;
    }
  }

  // --- Payment cluster warning (3-day window overlap) ---
  var sortedDates = Object.keys(odemeTarihleri).sort();
  for (var d1 = 0; d1 < sortedDates.length; d1++) {
    var clusterTotal = odemeTarihleri[sortedDates[d1]].toplam;
    var clusterDays = [sortedDates[d1]];
    for (var d2 = d1 + 1; d2 < sortedDates.length; d2++) {
      var dt1 = parseTurkishDate_(sortedDates[d1]);
      var dt2 = parseTurkishDate_(sortedDates[d2]);
      if (dt1 && dt2 && daysBetween_(dt1, dt2) <= 3) {
        clusterTotal += odemeTarihleri[sortedDates[d2]].toplam;
        clusterDays.push(sortedDates[d2]);
      }
    }
    if (clusterDays.length > 1 && clusterTotal > 10000) {
      actions.push({
        prio: 82,
        text:
          "ÖDEME ÇAKIŞMASI: " +
          clusterDays.join(", ") +
          " aralığında toplam " +
          formatTL_(clusterTotal) +
          " TL ödeme kümelenmesi!",
        kategori: "Borç",
      });
      break;
    }
  }

  // --- Receivable actions ---
  var alacakRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.alacak) || createDummySheet_(),
  );
  var toplamAcikAlacak = 0;
  var musteriAlacak = {};
  for (var a = 0; a < alacakRows.length; a++) {
    var ar = alacakRows[a];
    var aDurum = String(ar["Durum"] || "").trim();
    if (aDurum === "Tahsil Edildi" || aDurum === "İptal") continue;
    var aTarih = parseTurkishDate_(ar["Tahsil Tarihi"]);
    var gecikme = parseCurrency_(ar["Gecikme Gün"]);
    var aNet = parseCurrency_(ar["Beklenen Net Tahsilat"]);
    toplamAcikAlacak += aNet;
    var aKanal = String(ar["Kanal"] || "Bilinmeyen");
    musteriAlacak[aKanal] = (musteriAlacak[aKanal] || 0) + aNet;

    if (gecikme > 14) {
      actions.push({
        prio: 90,
        text:
          "GECİKMİŞ ALACAK: " +
          (ar["Kanal"] || ar["Alacak Kodu"]) +
          " — " +
          formatTL_(aNet) +
          " TL — " +
          gecikme +
          " gün gecikmiş!",
        kategori: "Tahsilat",
      });
    } else if (gecikme > 0) {
      actions.push({
        prio: 70,
        text:
          "Tahsilat hatırlat: " +
          (ar["Kanal"] || "") +
          " — " +
          formatTL_(aNet) +
          " TL",
        kategori: "Tahsilat",
      });
    } else if (aTarih && daysBetween_(t, aTarih) <= 3) {
      actions.push({
        prio: 50,
        text:
          "Bugün tahsilat takibi yap: " +
          (ar["Kanal"] || "") +
          " — yaklaşan ödeme",
        kategori: "Tahsilat",
      });
    }
  }

  // --- Tahsilat yoğunlaşma riski ---
  if (toplamAcikAlacak > 0) {
    var kanallar = Object.keys(musteriAlacak);
    for (var mk = 0; mk < kanallar.length; mk++) {
      var oran = musteriAlacak[kanallar[mk]] / toplamAcikAlacak;
      if (oran > 0.5) {
        actions.push({
          prio: 65,
          text:
            "TAHSİLAT YOĞUNLAŞMA: " +
            kanallar[mk] +
            " toplam açık alacağın %" +
            Math.round(oran * 100) +
            "'ini oluşturuyor. Tek müşteri riski!",
          kategori: "Tahsilat",
        });
      }
    }
  }

  // --- Stock/import actions ---
  var stokRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.stok) || createDummySheet_(),
  );
  var maxDevirGun =
    (CONFIG.params && CONFIG.params.max_acceptable_inventory_turn_days) || 90;
  for (var s = 0; s < stokRows.length; s++) {
    var sr = stokRows[s];
    var stokDurum = String(sr["Stok Durumu"] || "").trim();
    var sku = sr["SKU"] || "";
    if (stokDurum === "Kritik") {
      actions.push({
        prio: 95,
        text:
          "ACİL İTHALAT: " +
          sku +
          " (" +
          (sr["Ürün Adı"] || "") +
          ") — Stok " +
          parseCurrency_(sr["Stok Gün Sayısı"]) +
          " gün — Sipariş VER!",
        kategori: "İthalat",
      });
    } else if (stokDurum === "Düşük") {
      actions.push({
        prio: 60,
        text:
          "İthalat planla: " +
          sku +
          " — Stok " +
          parseCurrency_(sr["Stok Gün Sayısı"]) +
          " gün kaldı",
        kategori: "İthalat",
      });
    } else if (stokDurum === "Fazla") {
      actions.push({
        prio: 30,
        text: "FAZLA STOK: " + sku + " — Alım yapma! Satış hızlandır.",
        kategori: "Stok",
      });
    } else if (stokDurum === "Ölü Stok") {
      actions.push({
        prio: 35,
        text: "ÖLÜ STOK: " + sku + " — Tasfiye planı yap. Sermaye bağlı.",
        kategori: "Stok",
      });
    }
    // Yaşlanan stok uyarısı
    var stokGun = parseCurrency_(sr["Stok Gün Sayısı"]);
    if (stokGun > maxDevirGun && stokDurum !== "Ölü Stok") {
      actions.push({
        prio: 45,
        text:
          "YAŞLANAN STOK: " +
          sku +
          " — " +
          stokGun +
          " gün (eşik: " +
          maxDevirGun +
          ") — Stok yaşlanıyor, tasfiye veya indirim düşün.",
        kategori: "Stok",
      });
    }
  }

  // --- Finansman sonrası negatif verim ---
  var skuKarSheet = ss.getSheetByName(CONFIG.sheets.skuKar);
  if (skuKarSheet) {
    var skuKarRows = getAllRows_(skuKarSheet);
    for (var fk = 0; fk < skuKarRows.length; fk++) {
      var fNet = parseCurrency_(skuKarRows[fk]["Finansman Sonrası Net Getiri"]);
      if (fNet < 0) {
        actions.push({
          prio: 78,
          text:
            "NEGATİF VERİM: " +
            (skuKarRows[fk]["SKU"] || "") +
            " — Finansman sonrası net getiri: " +
            formatTL_(fNet) +
            " TL — Bu ürün zarar ettiriyor!",
          kategori: "Stok",
        });
      }
    }
  }

  // --- Cash pressure actions ---
  var cashData = buildCashProjection_();
  var proj = cashData.projection;
  var negatifUyariVerildi = false;
  var tamponUyariVerildi = false;
  for (var c = 0; c < Math.min(90, proj.length); c++) {
    if (proj[c].kapanis < 0 && !negatifUyariVerildi) {
      actions.push({
        prio: 99,
        text:
          "NAKİT AÇIĞI: " +
          dateKey_(proj[c].date) +
          " tarihinde " +
          formatTL_(Math.abs(proj[c].kapanis)) +
          " TL açık! Gider ertele veya tahsilat hızlandır.",
        kategori: "Nakit",
      });
      negatifUyariVerildi = true;
    } else if (
      proj[c].kapanis < cashData.minCashReserve &&
      !tamponUyariVerildi &&
      !negatifUyariVerildi
    ) {
      actions.push({
        prio: 75,
        text:
          "GÜVENLİ NAKİT ALTI: " +
          dateKey_(proj[c].date) +
          " — bakiye " +
          formatTL_(proj[c].kapanis) +
          " TL (limit: " +
          formatTL_(cashData.minCashReserve) +
          ")",
        kategori: "Nakit",
      });
      tamponUyariVerildi = true;
    }
  }

  // --- Nakit tampon erimesi (trend) ---
  if (proj.length >= 14) {
    var ilkHafta = proj.length >= 7 ? proj[6].kapanis : 0;
    var ikinciHafta = proj.length >= 14 ? proj[13].kapanis : 0;
    if (ikinciHafta < ilkHafta * 0.7 && ilkHafta > 0) {
      actions.push({
        prio: 68,
        text:
          "TAMPON ERİMESİ: Nakit tamponu 2 haftalık trendde hızla azalıyor (" +
          formatTL_(ilkHafta) +
          " → " +
          formatTL_(ikinciHafta) +
          ")",
        kategori: "Nakit",
      });
    }
  }

  // --- Sabit gider karşılama oranı ---
  var thresholds = buildMarginTurnoverThresholds_();
  if (
    thresholds.toplamAylikCiro > 0 &&
    thresholds.aylikSabitGider > thresholds.toplamAylikCiro * 0.8
  ) {
    actions.push({
      prio: 92,
      text:
        "SABİT GİDER BASKISI: Aylık sabit gider (" +
        formatTL_(thresholds.aylikSabitGider) +
        ") ciro kapasitesinin %80'ini aşıyor!",
      kategori: "Gider",
    });
  }

  // --- Kredi kartı uyarıları (Borç Takibi'ndeki Kredi Kartı türü) ---
  for (var kr = 0; kr < borcRows.length; kr++) {
    var kbr = borcRows[kr];
    if (String(kbr["Borç Türü"] || "").trim() !== "Kredi Kartı") continue;
    var kbDurum = String(kbr["Durum"] || "").trim();
    if (kbDurum === "Ödendi" || kbDurum === "İptal") continue;
    var sonOdeme = parseTurkishDate_(kbr["Vade"]);
    if (sonOdeme) {
      var kartGun = daysBetween_(t, sonOdeme);
      if (kartGun >= 0 && kartGun <= 7) {
        actions.push({
          prio: 83,
          text:
            "KREDİ KARTI: " +
            (kbr["Kurum / Kişi"] || kbr["Borç Kodu"]) +
            " son ödeme " +
            kartGun +
            " gün sonra — " +
            formatTL_(parseCurrency_(kbr["Tutar"])) +
            " TL",
          kategori: "Borç",
        });
      }
    }
  }

  // --- İthalat ödeme takvimi baskısı ---
  var ithalatCikis30 = 0;
  var ithalatRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.ithalat) || createDummySheet_(),
  );
  for (var it = 0; it < ithalatRows.length; it++) {
    var ir = ithalatRows[it];
    var iDurum = String(ir["Durum"] || "").trim();
    // İthalat gecikme riski
    if (
      (iDurum === "Yolda" || iDurum === "Gümrükte") &&
      ir["Tahmini Varış Tarihi"]
    ) {
      var tahVaris = parseTurkishDate_(ir["Tahmini Varış Tarihi"]);
      if (tahVaris && daysBetween_(t, tahVaris) < 0) {
        actions.push({
          prio: 58,
          text:
            "İTHALAT GECİKME: " +
            (ir["SKU"] || ir["Plan Kodu"] || "") +
            " — Tahmini varış geçti ama durum hâlâ " +
            iDurum,
          kategori: "İthalat",
        });
      }
    }
    // İthalat karar tabanlı aksiyonlar
    var karar = String(ir["Sipariş Kararı"] || "").trim();
    if (karar === "Şimdi Sipariş Ver") {
      actions.push({
        prio: 88,
        text:
          "SİPARİŞ VER: " +
          (ir["SKU"] || "") +
          " — " +
          (ir["Ürün"] || "") +
          " — Yatırım: " +
          formatTL_(parseCurrency_(ir["Toplam Yatırım Tutarı TL"])) +
          " TL — ROI: " +
          (ir["ROI"] || ""),
        kategori: "İthalat",
      });
    } else if (karar === "Yakında Sipariş Ver") {
      actions.push({
        prio: 55,
        text: "YAKINDA SİPARİŞ: " + (ir["SKU"] || "") + " — Uygun gün bekle",
        kategori: "İthalat",
      });
    } else if (karar === "Alma") {
      actions.push({
        prio: 20,
        text: "ALMA: " + (ir["SKU"] || "") + " — " + (ir["Gerekçe"] || ""),
        kategori: "İthalat",
      });
    }
    // 30 gün ithalat çıkış toplamı (3 aşamalı ödeme)
    var odemeTarihleri30 = [
      { tarih: ir["Mal Bedeli Ödeme Tarihi"], tutar: ir["Mal Bedeli Tutarı"] },
      { tarih: ir["Navlun Ödeme Tarihi"], tutar: ir["Navlun Tutarı"] },
      { tarih: ir["Gümrük Ödeme Tarihi"], tutar: ir["Gümrük Tutarı"] },
    ];
    for (var od = 0; od < odemeTarihleri30.length; od++) {
      var iOdemeTarih = parseTurkishDate_(odemeTarihleri30[od].tarih);
      if (
        iOdemeTarih &&
        daysBetween_(t, iOdemeTarih) >= 0 &&
        daysBetween_(t, iOdemeTarih) <= 30
      ) {
        ithalatCikis30 += parseCurrency_(odemeTarihleri30[od].tutar);
      }
    }
  }
  if (ithalatCikis30 > cashData.minCashReserve * 0.8) {
    actions.push({
      prio: 77,
      text:
        "İTHALAT ÖDEME BASKISI: 30 gün içinde " +
        formatTL_(ithalatCikis30) +
        " TL ithalat ödemesi — güvenli tamponun %80'ini aşıyor!",
      kategori: "İthalat",
    });
  }

  // --- Kredi kartı aksiyonları ---
  var kartRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.krediKarti) || createDummySheet_(),
  );
  for (var kra = 0; kra < kartRows.length; kra++) {
    var krar = kartRows[kra];
    if (String(krar["Durum"] || "").trim() !== "Aktif") continue;
    var kartSonOd = parseTurkishDate_(krar["Sonraki Son Ödeme Tarihi"]);
    var kartBakiye = parseCurrency_(krar["Güncel Bakiye"]);
    var kartLimitPct = parseCurrency_(krar["Limit Kullanım %"]);
    var kartAdi = krar["Kart Adı"] || krar["Kart ID"] || "";
    var beklOdeme = parseCurrency_(krar["Beklenen Ödeme Tutarı"]);

    if (kartSonOd) {
      var kartGunKaldi = daysBetween_(t, kartSonOd);
      if (kartGunKaldi < 0) {
        actions.push({
          prio: 96,
          text: "GECİKMİŞ KART ÖDEMESİ: " + kartAdi + " — Son ödeme " + Math.abs(kartGunKaldi) + " gün geçti! " + formatTL_(beklOdeme) + " TL — Hemen öde!",
          kategori: "Kredi Kartı",
        });
      } else if (kartGunKaldi <= 3) {
        actions.push({
          prio: 87,
          text: "KART SON ÖDEME: " + kartAdi + " — " + kartGunKaldi + " gün kaldı — " + formatTL_(beklOdeme) + " TL",
          kategori: "Kredi Kartı",
        });
      } else if (kartGunKaldi <= 7) {
        actions.push({
          prio: 72,
          text: "Kart ödeme yaklaşıyor: " + kartAdi + " — " + dateKey_(kartSonOd) + " — " + formatTL_(beklOdeme) + " TL",
          kategori: "Kredi Kartı",
        });
      }
    }

    if (kartLimitPct >= 100) {
      actions.push({
        prio: 91,
        text: "KART LİMİT AŞIMI: " + kartAdi + " — Limit aşıldı! Bakiye: " + formatTL_(kartBakiye) + " TL",
        kategori: "Kredi Kartı",
      });
    } else if (kartLimitPct >= 90) {
      actions.push({
        prio: 73,
        text: "KART LİMİT UYARISI: " + kartAdi + " — %" + kartLimitPct + " kullanım. Harcama sınırla!",
        kategori: "Kredi Kartı",
      });
    }
  }

  // --- Açık hesap müşteri aksiyonları ---
  var acikHesapRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.acikHesap) || createDummySheet_(),
  );
  var ahMusteriTop = {};
  var ahToplamBakiye = 0;
  for (var aha = 0; aha < acikHesapRows.length; aha++) {
    var ahar = acikHesapRows[aha];
    var ahaDurum = String(ahar["Tahsil Durumu"] || "").trim();
    if (ahaDurum === "Tahsil Edildi") continue;
    var ahaKalan = parseCurrency_(ahar["Kalan Bakiye"]) || parseCurrency_(ahar["Tutar"]);
    var ahaMusteri = String(ahar["Müşteri Adı"] || "").trim();
    ahToplamBakiye += ahaKalan;
    ahMusteriTop[ahaMusteri] = (ahMusteriTop[ahaMusteri] || 0) + ahaKalan;
    var ahaGecikme = parseCurrency_(ahar["Gecikme Günü"]);

    if (ahaGecikme > 30) {
      actions.push({
        prio: 89,
        text: "AĞIR GECİKME: " + ahaMusteri + " — " + formatTL_(ahaKalan) + " TL — " + ahaGecikme + " gün gecikmiş! Hukuki takip değerlendir.",
        kategori: "Açık Hesap",
      });
    } else if (ahaGecikme > 14) {
      actions.push({
        prio: 76,
        text: "GECİKEN TAHSİLAT: " + ahaMusteri + " — " + formatTL_(ahaKalan) + " TL — " + ahaGecikme + " gün",
        kategori: "Açık Hesap",
      });
    } else if (ahaGecikme > 0) {
      actions.push({
        prio: 55,
        text: "Tahsilat hatırlat: " + ahaMusteri + " — " + formatTL_(ahaKalan) + " TL — " + ahaGecikme + " gün gecikmiş",
        kategori: "Açık Hesap",
      });
    } else {
      var ahaVade = parseTurkishDate_(ahar["Vade Tarihi"]);
      if (ahaVade && daysBetween_(t, ahaVade) <= 3 && daysBetween_(t, ahaVade) >= 0) {
        actions.push({
          prio: 50,
          text: "Tahsilat yaklaşıyor: " + ahaMusteri + " — " + formatTL_(ahaKalan) + " TL — " + dateKey_(ahaVade),
          kategori: "Açık Hesap",
        });
      }
    }
  }
  // Müşteri yoğunlaşma uyarısı
  if (ahToplamBakiye > 0) {
    var ahMKeys = Object.keys(ahMusteriTop);
    for (var ahm = 0; ahm < ahMKeys.length; ahm++) {
      var ahOran = ahMusteriTop[ahMKeys[ahm]] / ahToplamBakiye;
      if (ahOran > 0.5) {
        actions.push({
          prio: 64,
          text: "MÜŞTERİ YOĞUNLAŞMA: " + ahMKeys[ahm] + " toplam açık bakiyenin %" + Math.round(ahOran * 100) + "'ini oluşturuyor. Vadeli satışı sınırla!",
          kategori: "Açık Hesap",
        });
      }
    }
  }

  // Sort by priority descending
  actions.sort(function (a, b) {
    return b.prio - a.prio;
  });

  // ---- RENDER ----
  sheet.clear();
  if (sheet.getMaxColumns() < 4) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 4 - sheet.getMaxColumns());
  }
  sheet
    .getRange("A1")
    .setValue("AKSİYON MERKEZİ — Öncelik Sıralı Görevler")
    .setFontSize(14)
    .setFontWeight("bold");
  sheet
    .getRange("A2")
    .setValue(
      "Güncelleme: " +
        dateKey_(t) +
        " " +
        Utilities.formatDate(new Date(), CONFIG.timezone, "HH:mm"),
    )
    .setFontColor("#666666");

  sheet
    .getRange(3, 1, 1, 4)
    .setValues([["#", "Kategori", "Aksiyon", "Öncelik"]])
    .setFontWeight("bold");

  var maxActions = Math.min(actions.length, 50);
  if (maxActions === 0) {
    sheet
      .getRange(4, 1, 1, 4)
      .setValues([["—", "—", "Şu an bekleyen aksiyon yok.", "—"]]);
  } else {
    var actionRows = [];
    for (var ai = 0; ai < maxActions; ai++) {
      var act = actions[ai];
      var prioLabel =
        act.prio >= 90
          ? "KRİTİK"
          : act.prio >= 70
            ? "YÜKSEK"
            : act.prio >= 40
              ? "ORTA"
              : "DÜŞÜK";
      actionRows.push([ai + 1, act.kategori, act.text, prioLabel]);
    }
    sheet.getRange(4, 1, actionRows.length, 4).setValues(actionRows);

    // Color coding for priority column
    for (var ci = 0; ci < actionRows.length; ci++) {
      var cell = sheet.getRange(4 + ci, 4);
      var label = actionRows[ci][3];
      if (label === "KRİTİK") cell.setBackground("#f4cccc");
      else if (label === "YÜKSEK") cell.setBackground("#fce5cd");
      else if (label === "ORTA") cell.setBackground("#fff2cc");
      else cell.setBackground("#d9ead3");
    }
  }

  sheet.setColumnWidth(3, 600);
  return { ok: true, actions: maxActions };
}
