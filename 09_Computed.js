// ─── 10. DEBT & RECEIVABLE COMPUTED FIELDS ──────────────────────────────────

function updateBorcComputedFields_() {
  var ss = getSS_();
  var sheet = ss.getSheetByName(CONFIG.sheets.borc);
  if (!sheet) return { ok: false };
  var hmap = getHeaderMap_(sheet);
  var t = today_();
  var rows = getAllRows_(sheet);
  var updated = 0;

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var durum = String(r["Durum"] || "").trim();
    if (durum === "Ödendi" || durum === "İptal") continue;

    var vade = parseTurkishDate_(r["Vade"]);
    var gecikme = 0;
    var risk = "";
    var aksiyon = "";
    var updates = {};

    // Gecikme hesabı
    if (vade) {
      gecikme = daysBetween_(vade, t);
      if (gecikme > 0) {
        risk = gecikme > 14 ? "Kritik" : "Yüksek";
        if (durum !== "Gecikmiş") {
          updates["Durum"] = "Gecikmiş";
        }
        aksiyon = gecikme > 14 ? "Acil ödeme yap" : "Ödeme takibi yap";
      } else if (gecikme >= -3) {
        risk = "Orta";
        aksiyon = "Yakın vadeli ödeme — hazırlık yap";
      } else if (gecikme >= -7) {
        risk = "Düşük";
        aksiyon = "";
      } else {
        risk = "Düşük";
      }
    }

    // Finansman hesapları (kredi taksidi / banka kredisi için)
    var borcTuru = String(r["Borç Türü"] || "").trim();
    var anapara = parseCurrency_(r["Anapara"]);
    var aylikFaiz = parseCurrency_(r["Aylık Faiz Oranı"]);
    var taksitTutari = parseCurrency_(r["Taksit Tutarı"]);
    var kalanAnapara = parseCurrency_(r["Kalan Anapara"]);
    var kalanTaksit = parseCurrency_(r["Kalan Taksit Sayısı"]);

    if (
      (borcTuru === "Kredi Taksidi" ||
        borcTuru === "Banka Kredisi" ||
        borcTuru === "Ticari Borç") &&
      anapara > 0
    ) {
      // Calculate remaining principal if not set
      if (!kalanAnapara && anapara > 0) {
        kalanAnapara = anapara;
        updates["Kalan Anapara"] = kalanAnapara;
      }
      // Calculate total financing cost
      if (aylikFaiz > 0 && kalanTaksit > 0) {
        var toplamMaliyet = taksitTutari * kalanTaksit - kalanAnapara;
        updates["Toplam Finansman Maliyeti"] = Math.max(0, toplamMaliyet);
      } else if (aylikFaiz > 0 && anapara > 0) {
        // Estimate: simple interest
        var vadeTarih = parseTurkishDate_(r["Vade"]);
        if (vadeTarih && vadeTarih > t) {
          var kalanAy = Math.max(1, Math.ceil(daysBetween_(t, vadeTarih) / 30));
          updates["Toplam Finansman Maliyeti"] =
            kalanAnapara * aylikFaiz * kalanAy;
        }
      }
    }

    updates["Gecikme Gün"] = Math.max(0, gecikme);
    updates["Risk"] = risk;
    if (aksiyon) updates["Sonraki Aksiyon"] = aksiyon;

    setRowValues_(sheet, r._row, hmap, updates);
    updated++;
  }
  return { ok: true, updated: updated };
}

function updateAlacakComputedFields_() {
  var ss = getSS_();
  var sheet = ss.getSheetByName(CONFIG.sheets.alacak);
  if (!sheet) return { ok: false };
  var hmap = getHeaderMap_(sheet);
  var t = today_();
  var rows = getAllRows_(sheet);
  var updated = 0;

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var durum = String(r["Durum"] || "").trim();
    if (durum === "Tahsil Edildi" || durum === "İptal") continue;

    // Calculate net tahsilat from deductions
    var brut = parseCurrency_(r["Brüt Satış"]);
    var komisyon = parseCurrency_(r["Komisyon"]);
    var kargo = parseCurrency_(r["Kargo Kesintisi"]);
    var reklam = parseCurrency_(r["Reklam Kesintisi"]);
    var diger = parseCurrency_(r["Diğer Kesinti"]);
    var net = brut - komisyon - kargo - reklam - diger;

    var tahsilTarihi = parseTurkishDate_(r["Tahsil Tarihi"]);
    var gunKaldi = tahsilTarihi ? daysBetween_(t, tahsilTarihi) : 0;
    var gecikmeGun = 0;
    if (tahsilTarihi && t > tahsilTarihi) {
      gecikmeGun = daysBetween_(tahsilTarihi, t);
      if (durum !== "Gecikmeli") {
        setRowValues_(sheet, r._row, hmap, { Durum: "Gecikmeli" });
      }
    }

    // Risk score 0-100
    var riskPuani = 0;
    riskPuani += clamp_(gecikmeGun * 3, 0, 40);
    riskPuani += net > 50000 ? 20 : net > 20000 ? 10 : 0;
    if (gecikmeGun > 30) riskPuani += 30;

    var oncelik =
      riskPuani > 60
        ? "Kritik"
        : riskPuani > 30
          ? "Yüksek"
          : riskPuani > 10
            ? "Orta"
            : "Düşük";

    var aksiyon = "";
    if (gecikmeGun > 14) aksiyon = "Acil tahsilat takibi yap";
    else if (gecikmeGun > 0) aksiyon = "Tahsilat hatırlat";
    else if (gunKaldi <= 3) aksiyon = "Tahsilat yaklaşıyor, kontrol et";

    setRowValues_(sheet, r._row, hmap, {
      "Beklenen Net Tahsilat": net > 0 ? net : brut,
      "Gün Kaldı": Math.max(0, gunKaldi),
      "Gecikme Gün": gecikmeGun,
      "Risk Puanı": riskPuani,
      Öncelik: oncelik,
      "Sonraki Aksiyon": aksiyon,
    });
    updated++;
  }
  return { ok: true, updated: updated };
}

// ─── 10b. CREDIT CARD COMPUTED FIELDS ───────────────────────────────────────

function updateKrediKartiComputedFields_() {
  var ss = getSS_();
  var sheet = ss.getSheetByName(CONFIG.sheets.krediKarti);
  if (!sheet) return { ok: true, updated: 0 };
  var hmap = getHeaderMap_(sheet);
  var t = today_();
  var rows = getAllRows_(sheet);
  var updated = 0;

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var durum = String(r["Durum"] || "").trim();
    if (durum === "İptal") continue;

    var limit = parseCurrency_(r["Kredi Limiti"]);
    var bakiye = parseCurrency_(r["Güncel Bakiye"]);
    var eksGun = parseInt(r["Ekstre Kesim Günü"]) || 1;
    var sonOdGun = parseInt(r["Son Ödeme Günü"]) || 15;
    var tercih = String(r["Ödeme Tercihi"] || "Tam Ödeme").trim();
    var asgari = parseCurrency_(r["Asgari Ödeme Tutarı"]);
    var ekstreTutar = parseCurrency_(r["Son Ekstre Tutarı"]);

    var updates = {};

    // Limit kullanım yüzdesi
    var limitPct = limit > 0 ? Math.round((bakiye / limit) * 100) : 0;
    updates["Limit Kullanım %"] = limitPct;

    // Risk seviyesi
    var riskSev = "Düşük";
    if (limitPct >= 100) riskSev = "Kritik";
    else if (limitPct >= 90) riskSev = "Yüksek";
    else if (limitPct >= 80) riskSev = "Orta";
    updates["Risk Seviyesi"] = riskSev;

    // Sonraki son ödeme tarihi hesapla
    var sonrakiSonOdeme = new Date(t.getFullYear(), t.getMonth(), sonOdGun);
    if (sonrakiSonOdeme <= t) {
      sonrakiSonOdeme = new Date(t.getFullYear(), t.getMonth() + 1, sonOdGun);
    }
    updates["Sonraki Son Ödeme Tarihi"] = sonrakiSonOdeme;

    // Beklenen ödeme tutarı
    var beklenenOdeme = 0;
    if (tercih === "Tam Ödeme") {
      beklenenOdeme = ekstreTutar > 0 ? ekstreTutar : bakiye;
    } else {
      beklenenOdeme = asgari > 0 ? asgari : bakiye * 0.03;
    }
    updates["Beklenen Ödeme Tutarı"] = beklenenOdeme;

    setRowValues_(sheet, r._row, hmap, updates);
    updated++;
  }
  return { ok: true, updated: updated };
}

// ─── 10c. OPEN ACCOUNT RECEIVABLE COMPUTED FIELDS ───────────────────────────

function updateAcikHesapComputedFields_() {
  var ss = getSS_();
  var sheet = ss.getSheetByName(CONFIG.sheets.acikHesap);
  if (!sheet) return { ok: true, updated: 0 };
  var hmap = getHeaderMap_(sheet);
  var t = today_();
  var rows = getAllRows_(sheet);
  var updated = 0;

  // Müşteri bazlı gecikme geçmişi (tekrar gecikme tespiti)
  var musteriGecikme = {};
  for (var p = 0; p < rows.length; p++) {
    var md = String(rows[p]["Tahsil Durumu"] || "").trim();
    var mn = String(rows[p]["Müşteri Adı"] || "").trim();
    if (mn && (md === "Geciken" || md === "Riskli / İhtilaflı")) {
      musteriGecikme[mn] = (musteriGecikme[mn] || 0) + 1;
    }
  }

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var durum = String(r["Tahsil Durumu"] || "").trim();
    if (durum === "Tahsil Edildi") continue;

    var tutar = parseCurrency_(r["Tutar"]);
    var tahsilEdilen = parseCurrency_(r["Tahsil Edilen Tutar"]);
    var kalan = tutar - tahsilEdilen;
    var vadeTarih = parseTurkishDate_(r["Vade Tarihi"]);
    var musteri = String(r["Müşteri Adı"] || "").trim();

    var updates = {};
    updates["Kalan Bakiye"] = Math.max(0, kalan);

    // Gecikme günü
    var gecikme = 0;
    if (vadeTarih) {
      gecikme = Math.max(0, daysBetween_(vadeTarih, t));
    }
    updates["Gecikme Günü"] = gecikme;

    // Tahsil durumu otomatik güncelleme
    if (kalan <= 0 && tutar > 0) {
      updates["Tahsil Durumu"] = "Tahsil Edildi";
    } else if (tahsilEdilen > 0 && kalan > 0) {
      updates["Tahsil Durumu"] = "Kısmi Tahsil Edildi";
    } else if (gecikme > 0 && durum !== "Riskli / İhtilaflı") {
      updates["Tahsil Durumu"] = "Geciken";
    } else if (vadeTarih && daysBetween_(t, vadeTarih) === 0) {
      updates["Tahsil Durumu"] = "Bugün Tahsil Edilmeli";
    } else if (vadeTarih && daysBetween_(t, vadeTarih) > 0 && durum !== "Riskli / İhtilaflı") {
      updates["Tahsil Durumu"] = "Vadesi Gelmedi";
    }

    // Risk skoru (0-100)
    var riskSkoru = 0;
    riskSkoru += clamp_(gecikme * 2, 0, 40);                          // gecikme
    riskSkoru += kalan > 50000 ? 20 : kalan > 20000 ? 10 : 0;         // bakiye
    if (gecikme > 30) riskSkoru += 15;                                  // ağır gecikme
    var tekrar = musteriGecikme[musteri] || 0;
    riskSkoru += clamp_(tekrar * 5, 0, 15);                             // tekrar gecikme
    riskSkoru += (vadeTarih && daysBetween_(parseTurkishDate_(r["Kesim Tarihi"]), vadeTarih) > 60) ? 10 : 0; // uzun vade

    riskSkoru = clamp_(riskSkoru, 0, 100);
    updates["Risk Skoru"] = riskSkoru;

    // Risk seviyesi
    var riskSev = riskSkoru > 60 ? "Yüksek" : riskSkoru > 30 ? "Orta" : "Düşük";
    updates["Risk Seviyesi"] = riskSev;

    // Öncelik
    var oncelik = riskSkoru > 60 ? "Kritik" : riskSkoru > 30 ? "Yüksek" : riskSkoru > 10 ? "Orta" : "Düşük";
    updates["Öncelik"] = oncelik;

    // Sonraki aksiyon
    var aksiyon = "";
    if (gecikme > 14) aksiyon = "Acil tahsilat takibi yap";
    else if (gecikme > 0) aksiyon = "Tahsilat hatırlat";
    else if (vadeTarih && daysBetween_(t, vadeTarih) <= 3) aksiyon = "Tahsilat yaklaşıyor, kontrol et";
    updates["Sonraki Aksiyon"] = aksiyon;

    setRowValues_(sheet, r._row, hmap, updates);
    updated++;
  }
  return { ok: true, updated: updated };
}

// Batch override: alacak alan guncellemesini tek setValues ile yazar.
function updateAlacakComputedFields_() {
  var ss = getSS_();
  var sheet = ss.getSheetByName(CONFIG.sheets.alacak);
  if (!sheet) return { ok: false };

  var hmap = getHeaderMap_(sheet);
  var t = today_();
  var rows = getAllRows_(sheet);
  if (rows.length === 0) return { ok: true, updated: 0 };

  var maxCol = sheet.getLastColumn();
  var data = sheet
    .getRange(CONFIG.dataStartRow, 1, rows.length, maxCol)
    .getValues();
  var updated = 0;

  function setCell_(rowIndex, columnName, value) {
    var colIndex = hmap[columnName];
    if (colIndex != null) data[rowIndex][colIndex] = value;
  }

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var durum = String(r["Durum"] || "").trim();
    if (durum === "Tahsil Edildi" || durum === "Ä°ptal") continue;

    var brut = parseCurrency_(r["BrÃ¼t SatÄ±ÅŸ"]);
    var komisyon = parseCurrency_(r["Komisyon"]);
    var kargo = parseCurrency_(r["Kargo Kesintisi"]);
    var reklam = parseCurrency_(r["Reklam Kesintisi"]);
    var diger = parseCurrency_(r["DiÄŸer Kesinti"]);
    var net = brut - komisyon - kargo - reklam - diger;

    var tahsilTarihi = parseTurkishDate_(r["Tahsil Tarihi"]);
    var gunKaldi = tahsilTarihi ? daysBetween_(t, tahsilTarihi) : 0;
    var gecikmeGun = 0;
    if (tahsilTarihi && t > tahsilTarihi) {
      gecikmeGun = daysBetween_(tahsilTarihi, t);
      if (durum !== "Gecikmeli") setCell_(i, "Durum", "Gecikmeli");
    }

    var riskPuani = 0;
    riskPuani += clamp_(gecikmeGun * 3, 0, 40);
    riskPuani += net > 50000 ? 20 : net > 20000 ? 10 : 0;
    if (gecikmeGun > 30) riskPuani += 30;

    var oncelik =
      riskPuani > 60
        ? "Kritik"
        : riskPuani > 30
          ? "YÃ¼ksek"
          : riskPuani > 10
            ? "Orta"
            : "DÃ¼ÅŸÃ¼k";

    var aksiyon = "";
    if (gecikmeGun > 14) aksiyon = "Acil tahsilat takibi yap";
    else if (gecikmeGun > 0) aksiyon = "Tahsilat hatÄ±rlat";
    else if (gunKaldi <= 3) aksiyon = "Tahsilat yaklaÅŸÄ±yor, kontrol et";

    setCell_(i, "Beklenen Net Tahsilat", net > 0 ? net : brut);
    setCell_(i, "GÃ¼n KaldÄ±", Math.max(0, gunKaldi));
    setCell_(i, "Gecikme GÃ¼n", gecikmeGun);
    setCell_(i, "Risk PuanÄ±", riskPuani);
    setCell_(i, "Ã–ncelik", oncelik);
    setCell_(i, "Sonraki Aksiyon", aksiyon);
    updated++;
  }

  sheet.getRange(CONFIG.dataStartRow, 1, data.length, maxCol).setValues(data);
  return { ok: true, updated: updated };
}
