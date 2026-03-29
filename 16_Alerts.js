var _alertsCache_ = null;
function buildAlerts_(forceRefresh) {
  if (_alertsCache_ && !forceRefresh) return _alertsCache_;
  var ss = getSS_();
  var t = today_();
  var alerts = [];

  function addAlert(kategori, seviye, mesaj, etki, aksiyon) {
    alerts.push({ kategori: kategori, seviye: seviye, mesaj: mesaj, etki: etki, aksiyon: aksiyon, tarih: t });
  }

  // ── Nakit güvenliği uyarıları ────────────────────────────────────────
  var cashData = buildCashProjection_();
  var proj = cashData.projection;
  var safeCash = getParam_("safe_cash_floor", 200000);

  // Negatif bakiye
  var ilkNegatif = null;
  var negatifGun = 0;
  for (var i = 0; i < proj.length; i++) {
    if (proj[i].kapanis < 0) { negatifGun++; if (!ilkNegatif) ilkNegatif = proj[i]; }
  }
  if (ilkNegatif) {
    addAlert("Nakit", "Kritik",
      "Negatif bakiye: " + dateKey_(ilkNegatif.date) + " tarihinde " + formatTL_(ilkNegatif.kapanis) + " TL. " + negatifGun + " gün negatif.",
      Math.abs(ilkNegatif.kapanis),
      "Tahsilat hızlandır, ödeme ertele, acil nakit planı yap");
  }

  // Güvenli nakit altı (ilk kırılma noktası)
  for (var sn = 0; sn < proj.length; sn++) {
    if (proj[sn].kapanis >= 0 && proj[sn].kapanis < safeCash) {
      addAlert("Nakit", "Yüksek",
        "Güvenli nakit altı: " + dateKey_(proj[sn].date) + " — " + formatTL_(proj[sn].kapanis) + " TL (limit: " + formatTL_(safeCash) + ")",
        safeCash - proj[sn].kapanis,
        "Nakit tamponunu koru, gereksiz harcamadan kaçın");
      break;
    }
  }

  // Nakit tampon erimesi (haftalık trend)
  if (proj.length >= 14) {
    var hafta1Ort = 0, hafta2Ort = 0;
    for (var h1 = 0; h1 < 7; h1++) hafta1Ort += proj[h1].kapanis;
    for (var h2 = 7; h2 < 14; h2++) hafta2Ort += proj[h2].kapanis;
    hafta1Ort /= 7; hafta2Ort /= 7;
    if (hafta1Ort > 0 && hafta2Ort < hafta1Ort * 0.85) {
      addAlert("Nakit", "Orta",
        "Nakit tampon erimesi: bakiye haftalık %" + Math.round((1 - hafta2Ort / hafta1Ort) * 100) + " azalıyor",
        hafta1Ort - hafta2Ort,
        "Harcama hızını yavaşlat, nakit planını revize et");
    }
  }

  // ── Ödeme uyarıları ─────────────────────────────────────────────────
  var borcRows = getAllRows_(ss.getSheetByName(CONFIG.sheets.borc) || createDummySheet_());
  var yuksekEsik = safeCash * 0.1;
  var odemeTarihleri = {};

  for (var b = 0; b < borcRows.length; b++) {
    var br = borcRows[b];
    var bDurum = String(br["Durum"] || "").trim();
    if (bDurum === "Ödendi" || bDurum === "İptal") continue;
    var vade = parseTurkishDate_(br["Vade"]);
    if (!vade) continue;
    var gun = daysBetween_(t, vade);
    var tutar = parseCurrency_(br["Tutar"]);

    // Geciken ödeme
    if (bDurum === "Gecikmiş") {
      addAlert("Ödeme", "Kritik",
        "Geciken ödeme: " + (br["Kurum / Kişi"] || br["Borç Kodu"]) + " — " + formatTL_(tutar) + " TL, " + Math.abs(gun) + " gün gecikme",
        tutar, "Ödeme planı oluştur, iletişim kur");
    }
    // Yaklaşan yüksek tutarlı ödeme
    if (gun >= 0 && gun <= 7 && tutar > yuksekEsik) {
      addAlert("Ödeme", "Yüksek",
        "Yaklaşan yüksek ödeme: " + (br["Kurum / Kişi"] || br["Borç Kodu"]) + " — " + formatTL_(tutar) + " TL, " + gun + " gün kaldı",
        tutar, "Ödeme kaynağını hazırla");
    }
    // Çakışma kontrolü biriktir
    if (gun >= 0 && gun <= 7) {
      var dKey = dateKey_(vade);
      odemeTarihleri[dKey] = (odemeTarihleri[dKey] || 0) + tutar;
    }
  }
  // Ödeme çakışması
  var cakismaKeys = Object.keys(odemeTarihleri);
  for (var ck = 0; ck < cakismaKeys.length; ck++) {
    if (odemeTarihleri[cakismaKeys[ck]] > yuksekEsik * 2) {
      addAlert("Ödeme", "Yüksek",
        "Ödeme çakışması: " + cakismaKeys[ck] + " tarihinde toplam " + formatTL_(odemeTarihleri[cakismaKeys[ck]]) + " TL",
        odemeTarihleri[cakismaKeys[ck]], "Ödemeleri farklı günlere dağıt veya ertele");
    }
  }

  // ── Tahsilat uyarıları ──────────────────────────────────────────────
  var acikHesapRows = getAllRows_(ss.getSheetByName(CONFIG.sheets.acikHesap) || createDummySheet_());
  var toplamAcikBakiye = 0;
  var musteriMap = {};
  for (var ah = 0; ah < acikHesapRows.length; ah++) {
    var ahr = acikHesapRows[ah];
    if (String(ahr["Tahsil Durumu"] || "").trim() === "Tahsil Edildi") continue;
    var ahKalan = parseCurrency_(ahr["Kalan Bakiye"]) || parseCurrency_(ahr["Tutar"]);
    toplamAcikBakiye += ahKalan;
    var mn = String(ahr["Müşteri Adı"] || "").trim();
    musteriMap[mn] = (musteriMap[mn] || 0) + ahKalan;
    var gecGun = parseCurrency_(ahr["Gecikme Günü"]);
    if (String(ahr["Tahsil Durumu"] || "").trim() === "Geciken" && gecGun > 0) {
      addAlert("Tahsilat", gecGun > 30 ? "Kritik" : "Yüksek",
        "Geciken alacak: " + (ahr["Müşteri Adı"] || "") + " — " + formatTL_(ahKalan) + " TL, " + gecGun + " gün",
        ahKalan, gecGun > 30 ? "Hukuki süreç değerlendir" : "Tahsilat takibini sıklaştır");
    }
  }
  // Yoğunlaşma
  if (toplamAcikBakiye > 0) {
    var mKeys = Object.keys(musteriMap);
    for (var mk = 0; mk < mKeys.length; mk++) {
      if (musteriMap[mKeys[mk]] / toplamAcikBakiye > 0.5) {
        addAlert("Tahsilat", "Orta",
          "Tahsilat yoğunlaşması: " + mKeys[mk] + " toplam açık alacağın %" + Math.round(musteriMap[mKeys[mk]] / toplamAcikBakiye * 100) + "'ini oluşturuyor",
          musteriMap[mKeys[mk]], "Müşteri çeşitliliğini artır, vadeli satışı sınırla");
      }
    }
  }
  // Tahsilat görünürlüğü
  var alacakRows = getAllRows_(ss.getSheetByName(CONFIG.sheets.alacak) || createDummySheet_());
  var tahminRows = getAllRows_(ss.getSheetByName(CONFIG.sheets.tahmin) || createDummySheet_());
  var yeterliTahmin = 0;
  for (var yt = 0; yt < tahminRows.length; yt++) { if (parseCurrency_(tahminRows[yt]["Güven Skoru"]) >= 0.7) yeterliTahmin++; }
  var alacak30 = 0;
  for (var a30 = 0; a30 < alacakRows.length; a30++) {
    var aTarih = parseTurkishDate_(alacakRows[a30]["Tahsil Tarihi"]);
    var aDurum = String(alacakRows[a30]["Durum"] || "").trim();
    if (aTarih && daysBetween_(t, aTarih) >= 0 && daysBetween_(t, aTarih) <= 30 && aDurum !== "Tahsil Edildi" && aDurum !== "İptal") alacak30++;
  }
  if (yeterliTahmin === 0 && alacak30 < 3) {
    addAlert("Tahsilat", "Orta",
      "Tahsilat görünürlüğü zayıf: 30 gün ufkunda yeterli tahsilat verisi yok",
      0, "Tahmini satış modelini güncelle, açık hesap vadelerini gir");
  }

  // ── Kredi kartı uyarıları ───────────────────────────────────────────
  var kartRows = getAllRows_(ss.getSheetByName(CONFIG.sheets.krediKarti) || createDummySheet_());
  for (var kk = 0; kk < kartRows.length; kk++) {
    var kr = kartRows[kk];
    if (String(kr["Durum"] || "").trim() !== "Aktif") continue;
    var sonOdeme = parseTurkishDate_(kr["Sonraki Son Ödeme Tarihi"]);
    var kartBakiye = parseCurrency_(kr["Güncel Bakiye"]);
    var limitPct = parseCurrency_(kr["Limit Kullanım %"]);
    var kartAdi = kr["Kart Adı"] || kr["Kart ID"] || "";
    if (sonOdeme && kartBakiye > 0) {
      var kartGun = daysBetween_(t, sonOdeme);
      if (kartGun < 0) {
        addAlert("Kredi Kartı", "Kritik",
          "Gecikmiş kart ödemesi: " + kartAdi + " — " + formatTL_(kartBakiye) + " TL, " + Math.abs(kartGun) + " gün gecikmiş",
          kartBakiye, "Hemen öde, gecikme faizi birikir");
      } else if (kartGun <= 7) {
        addAlert("Kredi Kartı", "Yüksek",
          "Son ödeme yaklaşıyor: " + kartAdi + " — " + formatTL_(kartBakiye) + " TL, " + kartGun + " gün kaldı",
          kartBakiye, "Kart ödemesini planla");
      }
    }
    if (limitPct >= 90) {
      addAlert("Kredi Kartı", limitPct >= 100 ? "Kritik" : "Yüksek",
        "Limit baskısı: " + kartAdi + " — %" + limitPct + " kullanım",
        kartBakiye, limitPct >= 100 ? "Acil borç azalt" : "Harcama sınırla, borcu azalt");
    } else if (limitPct >= 80) {
      addAlert("Kredi Kartı", "Orta",
        "Limit uyarısı: " + kartAdi + " — %" + limitPct + " kullanım", kartBakiye, "Limit kullanımını izle");
    }
  }

  // ── Borç ve finansman uyarıları ─────────────────────────────────────
  var aylikBorcServis = 0;
  for (var bs = 0; bs < borcRows.length; bs++) {
    var bsDurum = String(borcRows[bs]["Durum"] || "").trim();
    if (bsDurum === "Ödendi" || bsDurum === "İptal") continue;
    aylikBorcServis += parseCurrency_(borcRows[bs]["Taksit Tutarı"]) || parseCurrency_(borcRows[bs]["Tutar"]);
  }
  var sabitRows = getAllRows_(ss.getSheetByName(CONFIG.sheets.sabit) || createDummySheet_());
  var aylikSabitTop = 0;
  for (var sg = 0; sg < sabitRows.length; sg++) {
    if (String(sabitRows[sg]["Durum"] || "").trim() !== "Aktif") continue;
    aylikSabitTop += parseCurrency_(sabitRows[sg]["Tutar TL"]) || parseCurrency_(sabitRows[sg]["Aylık Tutar"]);
  }
  var aylikNakitYaratimi = 0;
  if (proj.length >= 30) {
    var girisTop = 0, cikisTop = 0;
    for (var pi = 0; pi < 30; pi++) {
      girisTop += (proj[pi].kesinGiris || 0) + (proj[pi].olasiGiris || 0);
      cikisTop += (proj[pi].kesinCikis || 0) + (proj[pi].olasiCikis || 0);
    }
    aylikNakitYaratimi = girisTop - cikisTop;
  }
  if (aylikBorcServis > 0 && aylikNakitYaratimi > 0) {
    var dscr = aylikNakitYaratimi / aylikBorcServis;
    if (dscr < 1.0) {
      addAlert("Finansman", "Kritik",
        "Borç servisi baskısı: DSCR=" + dscr.toFixed(2) + " — nakit yaratım borç servisini karşılamıyor",
        aylikBorcServis - aylikNakitYaratimi, "Borçlanmayı azalt, yeniden yapılandır");
    } else if (dscr < 1.2) {
      addAlert("Finansman", "Yüksek",
        "Borç servisi sınırda: DSCR=" + dscr.toFixed(2), 0, "Borç servis oranını izle, yeni borç alma");
    }
  }

  // ── Stok ve verim uyarıları ─────────────────────────────────────────
  var stokRows = getAllRows_(ss.getSheetByName(CONFIG.sheets.stok) || createDummySheet_());
  var stokYaslama = getParam_("stock_aging_warning_days", 60);
  for (var st = 0; st < stokRows.length; st++) {
    var sr = stokRows[st];
    var stokGun = parseCurrency_(sr["Stok Gün Sayısı"]);
    if (stokGun > stokYaslama) {
      addAlert("Stok", "Orta",
        "Yaşlanan stok: " + (sr["SKU"] || "") + " " + (sr["Ürün Adı"] || "") + " — " + stokGun + " gün (eşik: " + stokYaslama + ")",
        parseCurrency_(sr["Mevcut Stok Değeri TL"]), "İndirimli satış veya stok eritme planı yap");
    }
  }
  var skuRows = getAllRows_(ss.getSheetByName(CONFIG.sheets.skuKar) || createDummySheet_());
  for (var sk = 0; sk < skuRows.length; sk++) {
    var finGetiri = parseCurrency_(skuRows[sk]["Finansman Sonrası Net Getiri"]);
    if (finGetiri < 0 && parseCurrency_(skuRows[sk]["Son 30 Gün Satış"]) > 0) {
      addAlert("Stok", "Yüksek",
        "Negatif verim: " + (skuRows[sk]["SKU"] || "") + " — finansman sonrası: " + formatTL_(finGetiri),
        Math.abs(finGetiri), "Fiyatlamayı gözden geçir veya ürünü durdur");
    }
  }

  // ── Sabit gider uyarıları ───────────────────────────────────────────
  if (aylikSabitTop > 0 && aylikNakitYaratimi > 0 && aylikNakitYaratimi < aylikSabitTop) {
    addAlert("Sabit Gider", "Kritik",
      "Sabit gider karşılama: oran=" + (aylikNakitYaratimi / aylikSabitTop).toFixed(2) + " — nakit yaratım sabit giderleri karşılamıyor",
      aylikSabitTop - aylikNakitYaratimi, "Kesilebilir giderleri azalt, gelir artışı planla");
  }
  for (var sa = 0; sa < sabitRows.length; sa++) {
    if (String(sabitRows[sa]["Durum"] || "").trim() !== "Aktif") continue;
    var artis = parseTurkishDate_(sabitRows[sa]["Artış Tarihi"]);
    var revize = parseCurrency_(sabitRows[sa]["Revize Tutar"]);
    var mevcut = parseCurrency_(sabitRows[sa]["Aylık Tutar"]);
    if (artis && revize > mevcut && daysBetween_(t, artis) >= 0 && daysBetween_(t, artis) <= 30) {
      addAlert("Sabit Gider", "Orta",
        "Gider artışı yaklaşıyor: " + (sabitRows[sa]["Gider Adı"] || sabitRows[sa]["Gider Kodu"]) + " — " + formatTL_(mevcut) + " → " + formatTL_(revize) + " TL",
        revize - mevcut, "Bütçe planını güncelle");
    }
  }

  // ── İthalat uyarıları ───────────────────────────────────────────────
  var ithalatRows = getAllRows_(ss.getSheetByName(CONFIG.sheets.ithalat) || createDummySheet_());
  var ithalatCikis30 = 0;
  for (var it = 0; it < ithalatRows.length; it++) {
    var ir = ithalatRows[it];
    var itDurum = String(ir["Durum"] || "").trim();
    if (itDurum === "İptal" || itDurum === "Teslim Alındı") continue;
    // Gecikme riski
    var tahVaris = parseTurkishDate_(ir["Tahmini Varış Tarihi"]);
    if (tahVaris && daysBetween_(t, tahVaris) < -3 && (itDurum === "Yolda" || itDurum === "Gümrükte")) {
      addAlert("İthalat", "Orta",
        "Gecikme riski: " + (ir["Plan Kodu"] || "") + " " + (ir["Ürün"] || "") + " — varış " + dateKey_(tahVaris) + ", durum: " + itDurum,
        parseCurrency_(ir["Toplam Yatırım Tutarı TL"]), "Tedarikçi/kargo takibi yap");
    }
    // Yaklaşan ödemeler (7 gün)
    var malBedel = parseTurkishDate_(ir["Mal Bedeli Ödeme Tarihi"]);
    if (malBedel && daysBetween_(t, malBedel) >= 0 && daysBetween_(t, malBedel) <= 7) {
      addAlert("İthalat", "Yüksek",
        "Mal bedeli yaklaşıyor: " + (ir["Plan Kodu"] || "") + " — " + formatTL_(parseCurrency_(ir["Mal Bedeli Tutarı"])) + " TL, " + daysBetween_(t, malBedel) + " gün",
        parseCurrency_(ir["Mal Bedeli Tutarı"]), "Ödeme kaynağını hazırla");
    }
    var navlun = parseTurkishDate_(ir["Navlun Ödeme Tarihi"]);
    if (navlun && daysBetween_(t, navlun) >= 0 && daysBetween_(t, navlun) <= 7) {
      addAlert("İthalat", "Yüksek",
        "Navlun yaklaşıyor: " + (ir["Plan Kodu"] || "") + " — " + formatTL_(parseCurrency_(ir["Navlun Tutarı"])) + " TL",
        parseCurrency_(ir["Navlun Tutarı"]), "Ödeme kaynağını hazırla");
    }
    var gumrukT = parseTurkishDate_(ir["Gümrük Ödeme Tarihi"]);
    if (gumrukT && daysBetween_(t, gumrukT) >= 0 && daysBetween_(t, gumrukT) <= 7) {
      addAlert("İthalat", "Yüksek",
        "Gümrük yaklaşıyor: " + (ir["Plan Kodu"] || "") + " — " + formatTL_(parseCurrency_(ir["Gümrük Tutarı"])) + " TL",
        parseCurrency_(ir["Gümrük Tutarı"]), "Ödeme kaynağını hazırla");
    }
    // 30 gün toplam ithalat çıkışı
    var odTarihleri = [
      { tarih: ir["Mal Bedeli Ödeme Tarihi"], tutar: ir["Mal Bedeli Tutarı"] },
      { tarih: ir["Navlun Ödeme Tarihi"], tutar: ir["Navlun Tutarı"] },
      { tarih: ir["Gümrük Ödeme Tarihi"], tutar: ir["Gümrük Tutarı"] },
    ];
    for (var od = 0; od < odTarihleri.length; od++) {
      var odT = parseTurkishDate_(odTarihleri[od].tarih);
      if (odT && daysBetween_(t, odT) >= 0 && daysBetween_(t, odT) <= 30) {
        ithalatCikis30 += parseCurrency_(odTarihleri[od].tutar);
      }
    }
  }
  if (ithalatCikis30 > safeCash * 0.8) {
    addAlert("İthalat", "Yüksek",
      "İthalat ödeme baskısı: 30 gün içinde " + formatTL_(ithalatCikis30) + " TL — güvenli tamponun %80'ini aşıyor",
      ithalatCikis30, "Ödeme takvimini gözden geçir, aşamalı ödeme müzakere et");
  }

  // Severity sort: Kritik → Yüksek → Orta → Bilgi
  var seviyeSira = { "Kritik": 0, "Yüksek": 1, "Orta": 2, "Bilgi": 3 };
  alerts.sort(function (a, b) { return (seviyeSira[a.seviye] || 9) - (seviyeSira[b.seviye] || 9); });

  _alertsCache_ = {
    ok: true,
    alerts: alerts,
    ozet: {
      kritik: alerts.filter(function (a) { return a.seviye === "Kritik"; }).length,
      yuksek: alerts.filter(function (a) { return a.seviye === "Yüksek"; }).length,
      orta: alerts.filter(function (a) { return a.seviye === "Orta"; }).length,
      toplam: alerts.length,
    },
  };
  return _alertsCache_;
}
