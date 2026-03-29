// ─── 14. DEMAND & STOCK PRESSURE ────────────────────────────────────────────

function buildDemandPressure_() {
  var ss = getSS_();
  var stokSheet = ss.getSheetByName(CONFIG.sheets.stok);
  var talepSheet = ss.getSheetByName(CONFIG.sheets.talep);
  if (!stokSheet || !talepSheet) return { ok: false, error: "Sheets missing" };

  var stokRows = getAllRows_(stokSheet);
  var thmap = getHeaderMap_(talepSheet);

  // Clear old
  if (talepSheet.getLastRow() >= CONFIG.dataStartRow) {
    talepSheet
      .getRange(
        CONFIG.dataStartRow,
        1,
        talepSheet.getLastRow() - CONFIG.dataStartRow + 1,
        talepSheet.getLastColumn(),
      )
      .clearContent();
  }

  var written = 0;
  for (var i = 0; i < stokRows.length; i++) {
    var r = stokRows[i];
    if (!r["SKU"]) continue;

    var mevcut = parseCurrency_(r["Mevcut Adet"]);
    var maliyet = parseCurrency_(r["Birim Tam Maliyet TL"]);
    var stokDegeri = mevcut * maliyet;
    var s30 = parseCurrency_(r["Son 30 Gün Satış Adedi"]);
    var s90 = parseCurrency_(r["Son 90 Gün Satış Adedi"]);
    var gunlukSatis = safeDivide_(s30, 30, safeDivide_(s90, 90, 0));
    var gunlukCiro = parseCurrency_(r["Günlük Ortalama Net Ciro"]);
    var stokGun =
      parseCurrency_(r["Stok Gün Sayısı"]) ||
      safeDivide_(mevcut, gunlukSatis, 9999);
    var leadTime =
      parseCurrency_(r["İthalat Lead Time Gün"]) || CONFIG.defaultLeadTimeDays;
    var guvenlik =
      parseCurrency_(r["Güvenlik Stoğu Gün"]) || CONFIG.safetyStockDays;

    // Trend: s30 monthly rate vs s90 monthly rate
    var m30rate = s30;
    var m90rate = s90 / 3;
    var trendKat = m90rate > 0 ? m30rate / m90rate : 1;
    trendKat = Math.round(trendKat * 100) / 100;

    var stokAcikRiski = stokGun - (leadTime + guvenlik);
    var ciro30 = gunlukCiro * 30;
    var ciro60 = gunlukCiro * 60;
    var stockoutDays = Math.max(0, leadTime - stokGun);
    var kayipCiro = stockoutDays * gunlukCiro;
    var kayipKar = kayipCiro * 0.3;

    // Import priority score
    var skor = 0;
    if (stokAcikRiski < 0) skor += Math.min(50, Math.abs(stokAcikRiski) * 2);
    skor += clamp_(gunlukCiro / 50, 0, 25);
    skor += clamp_(trendKat > 1 ? (trendKat - 1) * 50 : 0, 0, 25);
    skor = Math.round(clamp_(skor, 0, 100));

    var karar;
    if (skor >= 70) karar = "Şimdi Sipariş Ver";
    else if (skor >= 40) karar = "Yakında Sipariş Ver";
    else if (skor >= 15) karar = "Bekle";
    else karar = "Stok Yeterli";

    var row = CONFIG.dataStartRow + written;
    setRowValues_(talepSheet, row, thmap, {
      SKU: r["SKU"],
      "Mevcut Stok Değeri": stokDegeri,
      "Son 30 Gün Net Satış": s30,
      "Son 90 Gün Net Satış": s90,
      "Satış Trend Katsayısı": trendKat,
      "Stok Gün Sayısı": Math.round(stokGun),
      "Lead Time": leadTime,
      "Güvenlik Stoğu": guvenlik,
      "Stok Açık Riski": Math.round(stokAcikRiski),
      "30 Günlük Tahmini Ciro": Math.round(ciro30),
      "60 Günlük Tahmini Ciro": Math.round(ciro60),
      "Stok Yetmezse Kaybedilecek Ciro": Math.round(kayipCiro),
      "Stok Yetmezse Kaybedilecek Kar": Math.round(kayipKar),
      "İthalat Öncelik Skoru": skor,
      Karar: karar,
    });
    written++;
  }

  return { ok: true, written: written };
}

// ─── 14b. SALES FORECAST ENGINE ─────────────────────────────────────────────

function buildSalesForecast_() {
  var ss = getSS_();
  var stokSheet = ss.getSheetByName(CONFIG.sheets.stok);
  if (!stokSheet) return { ok: false, error: "Stok Envanter not found" };

  var tahminSheet = ensureSheetExists_(ss, CONFIG.sheets.tahmin);
  setupSheetSchema_(ss, CONFIG.sheets.tahmin);
  var thmap = getHeaderMap_(tahminSheet);
  var t = today_();

  // Senaryo katsayıları
  var muhafazakar = getParam_("conservative_sales_factor", 0.7);
  var normal = getParam_("normal_sales_factor", 1.0);
  var agresif = getParam_("aggressive_sales_factor", 1.3);
  var collectionDelayFactor = getParam_("collection_delay_factor", 1.2);
  var defaultCollectionDays = getParam_("default_collection_days", 21);
  var confThreshold = getParam_("forecast_confidence_threshold", 0.7);

  // Stok verisinden ürün grubu bazlı trailing average topla
  var stokRows = getAllRows_(stokSheet);
  var grupMap = {};
  for (var i = 0; i < stokRows.length; i++) {
    var r = stokRows[i];
    var grup = String(r["Kategori"] || "Genel").trim();
    if (!grupMap[grup]) {
      grupMap[grup] = {
        s30: 0,
        s90: 0,
        ciro30: 0,
        skuCount: 0,
        hasData: false,
      };
    }
    var s30 = parseCurrency_(r["Son 30 Gün Satış Adedi"]);
    var s90 = parseCurrency_(r["Son 90 Gün Satış Adedi"]);
    var ciro = parseCurrency_(r["Günlük Ortalama Net Ciro"]) * 30;
    grupMap[grup].s30 += s30;
    grupMap[grup].s90 += s90;
    grupMap[grup].ciro30 += ciro;
    grupMap[grup].skuCount++;
    if (s30 > 0 || s90 > 0) grupMap[grup].hasData = true;
  }

  // Clear old forecast data
  if (tahminSheet.getLastRow() >= CONFIG.dataStartRow) {
    tahminSheet
      .getRange(
        CONFIG.dataStartRow,
        1,
        tahminSheet.getLastRow() - CONFIG.dataStartRow + 1,
        tahminSheet.getLastColumn(),
      )
      .clearContent();
  }

  var scenarioList = [
    { ad: "Muhafazakâr", faktor: muhafazakar },
    { ad: "Normal", faktor: normal },
    { ad: "Agresif", faktor: agresif },
  ];

  var written = 0;
  var grupNames = Object.keys(grupMap);
  for (var g = 0; g < grupNames.length; g++) {
    var gName = grupNames[g];
    var gData = grupMap[gName];
    if (!gData.hasData) continue;

    // Aylık ciro bazı (gerçek trailing 30 gün)
    var aylikBaz = gData.ciro30;
    var gunlukBaz = aylikBaz / 30;

    // Güven skoru: veri kalitesi
    var guven = 0.5;
    if (gData.s30 > 0 && gData.s90 > 0) guven = 0.8;
    else if (gData.s30 > 0) guven = 0.65;
    // Trend kararlılığı: s30 vs s90/3
    var m90rate = gData.s90 / 3;
    if (m90rate > 0) {
      var trendKat = gData.s30 / m90rate;
      if (trendKat < 0.5 || trendKat > 2.0) guven -= 0.15; // oynak
    }
    guven = Math.round(Math.max(0.1, Math.min(1.0, guven)) * 100) / 100;

    // 30 günlük bloklar halinde tahmin üret (30/60/90)
    var blocks = [
      { start: 0, end: 30 },
      { start: 30, end: 60 },
      { start: 60, end: 90 },
    ];

    for (var sc = 0; sc < scenarioList.length; sc++) {
      var senaryo = scenarioList[sc];
      for (var bl = 0; bl < blocks.length; bl++) {
        var block = blocks[bl];
        var tahminTarih = addDays_(t, block.start);
        var gunSayisi = block.end - block.start;
        var tahminTutar = gunlukBaz * gunSayisi * senaryo.faktor;
        var tahsilatTarih = addDays_(
          t,
          block.end + Math.round(defaultCollectionDays * collectionDelayFactor),
        );

        // Blok uzadıkça güven azalır
        var blokGuven =
          Math.round(guven * (1 - block.start * 0.003) * 100) / 100;
        blokGuven = Math.max(0.1, blokGuven);

        var durum = "Aktif";

        var row = CONFIG.dataStartRow + written;
        setRowValues_(tahminSheet, row, thmap, {
          "Tahmin Kodu":
            "FCT-" +
            gName.substring(0, 3).toUpperCase() +
            "-" +
            senaryo.ad.substring(0, 3).toUpperCase() +
            "-" +
            block.end,
          "Tahmin Tarihi": tahminTarih,
          "Ürün Grubu": gName,
          Senaryo: senaryo.ad,
          "Tahmini Satış Tutarı": Math.round(tahminTutar),
          "Tahmini Tahsilat Tarihi": tahsilatTarih,
          "Güven Skoru": blokGuven,
          Durum: durum,
        });
        written++;
      }
    }
  }

  return { ok: true, written: written, groups: grupNames.length };
}

// ─── 14c. MIN MARGIN & TURNOVER THRESHOLDS ──────────────────────────────────

function buildMarginTurnoverThresholds_() {
  var ss = getSS_();

  // Aylık sabit gider toplamı
  var sabitRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.sabit) || createDummySheet_(),
  );
  var aylikSabit = 0;
  for (var s = 0; s < sabitRows.length; s++) {
    if (String(sabitRows[s]["Durum"] || "").trim() !== "Aktif") continue;
    aylikSabit +=
      parseCurrency_(sabitRows[s]["Tutar TL"]) ||
      parseCurrency_(sabitRows[s]["Aylık Tutar"]);
  }

  // Stok bazlı metrikler
  var stokRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.stok) || createDummySheet_(),
  );
  var toplamStokDegeri = 0;
  var toplamAylikCiro = 0;
  var totalDevir = 0;
  var skuCount = 0;
  for (var i = 0; i < stokRows.length; i++) {
    var sv = parseCurrency_(stokRows[i]["Mevcut Stok Değeri TL"]);
    var ciro = parseCurrency_(stokRows[i]["Günlük Ortalama Net Ciro"]) * 30;
    var devir = parseCurrency_(stokRows[i]["Stok Gün Sayısı"]);
    toplamStokDegeri += sv;
    toplamAylikCiro += ciro;
    if (devir > 0) {
      totalDevir += devir;
      skuCount++;
    }
  }
  var ortDevir = skuCount > 0 ? totalDevir / skuCount : 60;

  // Finansman ve tahsilat parametreleri
  var annualFinRate = getParam_("annual_financing_rate", 0.5);
  var collectionDays = getParam_("default_collection_days", 21);

  // Minimum gerekli brüt marj
  // Sabit gider + aylık finansman baskısı = minimum aylık katkı gereksinimi
  var aylikFinansmanBaskisi = toplamStokDegeri * (annualFinRate / 12);
  var minAylikKatki = aylikSabit + aylikFinansmanBaskisi;
  var minBrutMarj =
    toplamAylikCiro > 0 ? safeDivide_(minAylikKatki, toplamAylikCiro, 1) : 1;

  // Minimum gerekli net marj (komisyon sonrası)
  var commissionRate = getParam_("marketplace_commission_rate", 0.15);
  var minNetMarj = minBrutMarj / (1 - commissionRate);

  // Maksimum kabul edilebilir devir süresi
  // Devir uzadıkça finansman maliyeti artar → marj tükenir
  // maxDevir: çevrim başına net getirinin sıfıra düştüğü nokta
  var ortMarj =
    toplamAylikCiro > 0 && toplamStokDegeri > 0
      ? safeDivide_(
          toplamAylikCiro - (toplamStokDegeri * 0.25) / (ortDevir / 30),
          toplamAylikCiro,
          0.2,
        )
      : 0.2;
  // netGetiri(devir) = marj - (annualRate * (devir + collectionDays) / 365) ≥ 0
  var maxDevir =
    ortMarj > 0
      ? Math.floor((ortMarj / annualFinRate) * 365 - collectionDays)
      : 90;
  maxDevir = Math.max(14, Math.min(365, maxDevir));

  // Uyarılar
  var uyarilar = [];
  if (minBrutMarj > 0.5) {
    uyarilar.push(
      "Sabit gider baskısı çok yüksek. Minimum gerekli marj %50'nin üstünde.",
    );
  }
  if (ortDevir > maxDevir) {
    uyarilar.push(
      "Ortalama stok devir süresi (" +
        Math.round(ortDevir) +
        " gün) kabul edilebilir eşiğin (" +
        maxDevir +
        " gün) üstünde.",
    );
  }
  if (minBrutMarj > ortMarj && toplamAylikCiro > 0) {
    uyarilar.push(
      "Mevcut marj yapısı sabit giderleri taşımıyor. Fiyatlama veya ürün karması gözden geçirilmeli.",
    );
  }

  return {
    ok: true,
    aylikSabitGider: aylikSabit,
    aylikFinansmanBaskisi: Math.round(aylikFinansmanBaskisi),
    minBrutMarj: Math.round(minBrutMarj * 10000) / 100,
    minNetMarj: Math.round(minNetMarj * 10000) / 100,
    maxDevirGun: maxDevir,
    ortDevirGun: Math.round(ortDevir),
    ortMarj: Math.round(ortMarj * 10000) / 100,
    toplamAylikCiro: Math.round(toplamAylikCiro),
    uyarilar: uyarilar,
  };
}

// ─── 14d. SAFE IMPORT CAPACITY & CREDIT THRESHOLD ───────────────────────────

function buildSafeImportCapacity_() {
  var cashData = buildCashProjection_();
  var proj = cashData.projection;
  var minReserve = cashData.minCashReserve;

  // 30/60/90 gün minimum bakiye
  var min30 = Infinity,
    min60 = Infinity,
    min90 = Infinity;
  for (var i = 0; i < proj.length; i++) {
    var bak = proj[i].kapanis;
    if (i < 30) min30 = Math.min(min30, bak);
    if (i < 60) min60 = Math.min(min60, bak);
    if (i < 90) min90 = Math.min(min90, bak);
  }
  if (min30 === Infinity) min30 = 0;
  if (min60 === Infinity) min60 = 0;
  if (min90 === Infinity) min90 = 0;

  // Güvenli kapasite: 30 gün minimum bakiye - güvenli tampon
  var guvenliKapasite = Math.max(0, min30 - minReserve);

  // Temkinli kapasite: 60 gün minimum bakiye (tampon koruması gevşemiş)
  var temkinliKapasite = Math.max(0, min60 - minReserve * 0.5);

  // Riskli eşik: negatif bakiye başlangıcı
  var riskliEsik = Math.max(0, min90);

  // Darboğaz analizi
  var darbogazlar = [];
  if (min30 < minReserve) darbogazlar.push("30 günde nakit tamponu kırılıyor");
  if (cashData.monthlyFixed > cashData.openingBalance * 0.3)
    darbogazlar.push("Sabit gider baskısı yüksek");

  // Kredi eşiği hesabı
  var maxFaiz = getParam_("max_acceptable_monthly_interest", 0.035);
  var annualFinRate = getParam_("annual_financing_rate", 0.5);
  var minDSCR = getParam_("minimum_dscr_threshold", 1.2);

  // Aylık nakit yaratımı (kesin girişler toplamı / ay)
  var totalKesinGiris30 = 0;
  var totalKesinCikis30 = 0;
  for (var j = 0; j < Math.min(30, proj.length); j++) {
    totalKesinGiris30 += proj[j].kesinGiris;
    totalKesinCikis30 += proj[j].kesinCikis;
  }
  var aylikNakitYaratimi = totalKesinGiris30 - totalKesinCikis30;

  // Mevcut borç servisi
  var borcServisi = cashData.monthlyFixed * 0.3; // yaklaşım

  // DSCR
  var dscr =
    borcServisi > 0
      ? safeDivide_(Math.max(0, aylikNakitYaratimi), borcServisi, 0)
      : 99;

  // Maksimum mantıklı kredi tutarı
  // Aylık taksit = güvenli nakit yaratımı fazlası / minimum DSCR oranı
  var aylikFazla = Math.max(0, aylikNakitYaratimi - borcServisi);
  var maxAylikTaksit = aylikFazla / minDSCR;
  var maxKrediTutar =
    maxAylikTaksit > 0
      ? Math.round(maxAylikTaksit * 12) // 12 aylık vade varsayımı
      : 0;

  // Kredi kararı
  var krediKarar;
  if (dscr < 1.0) {
    krediKarar = "KREDİ KULLANMA";
  } else if (dscr < minDSCR) {
    krediKarar = "SINIRLI / KISA VADELİ KULLAN";
  } else if (maxKrediTutar > 0) {
    krediKarar = "KREDİ KULLANILABİLİR";
  } else {
    krediKarar = "KREDİ GEREKMİYOR";
  }

  return {
    ok: true,
    guvenliKapasite: Math.round(guvenliKapasite),
    temkinliKapasite: Math.round(temkinliKapasite),
    riskliEsik: Math.round(riskliEsik),
    min30: Math.round(min30),
    min60: Math.round(min60),
    min90: Math.round(min90),
    minReserve: Math.round(minReserve),
    darbogazlar: darbogazlar,
    dscr: Math.round(dscr * 100) / 100,
    maxKrediTutar: maxKrediTutar,
    maxFaiz: maxFaiz,
    krediKarar: krediKarar,
    aylikNakitYaratimi: Math.round(aylikNakitYaratimi),
  };
}

// Batch override: talep sayfasini satir satir degil toplu setValues ile yazar.
function buildDemandPressure_() {
  var ss = getSS_();
  var stokSheet = ss.getSheetByName(CONFIG.sheets.stok);
  var talepSheet = ss.getSheetByName(CONFIG.sheets.talep);
  if (!stokSheet || !talepSheet) return { ok: false, error: "Sheets missing" };

  var stokRows = getAllRows_(stokSheet);
  var thmap = getHeaderMap_(talepSheet);
  var headers = talepSheet
    .getRange(CONFIG.headerRow, 1, 1, talepSheet.getLastColumn())
    .getValues()[0];

  if (talepSheet.getLastRow() >= CONFIG.dataStartRow) {
    talepSheet
      .getRange(
        CONFIG.dataStartRow,
        1,
        talepSheet.getLastRow() - CONFIG.dataStartRow + 1,
        talepSheet.getLastColumn(),
      )
      .clearContent();
  }

  var output = [];
  for (var i = 0; i < stokRows.length; i++) {
    var r = stokRows[i];
    if (!r["SKU"]) continue;

    var mevcut = parseCurrency_(r["Mevcut Adet"]);
    var maliyet = parseCurrency_(r["Birim Tam Maliyet TL"]);
    var stokDegeri = mevcut * maliyet;
    var s30 = parseCurrency_(r["Son 30 GÃ¼n SatÄ±ÅŸ Adedi"]);
    var s90 = parseCurrency_(r["Son 90 GÃ¼n SatÄ±ÅŸ Adedi"]);
    var gunlukSatis = safeDivide_(s30, 30, safeDivide_(s90, 90, 0));
    var gunlukCiro = parseCurrency_(r["GÃ¼nlÃ¼k Ortalama Net Ciro"]);
    var stokGun =
      parseCurrency_(r["Stok GÃ¼n SayÄ±sÄ±"]) ||
      safeDivide_(mevcut, gunlukSatis, 9999);
    var leadTime =
      parseCurrency_(r["Ä°thalat Lead Time GÃ¼n"]) || CONFIG.defaultLeadTimeDays;
    var guvenlik =
      parseCurrency_(r["GÃ¼venlik StoÄŸu GÃ¼n"]) || CONFIG.safetyStockDays;

    var m30rate = s30;
    var m90rate = s90 / 3;
    var trendKat = m90rate > 0 ? m30rate / m90rate : 1;
    trendKat = Math.round(trendKat * 100) / 100;

    var stokAcikRiski = stokGun - (leadTime + guvenlik);
    var ciro30 = gunlukCiro * 30;
    var ciro60 = gunlukCiro * 60;
    var stockoutDays = Math.max(0, leadTime - stokGun);
    var kayipCiro = stockoutDays * gunlukCiro;
    var kayipKar = kayipCiro * 0.3;

    var skor = 0;
    if (stokAcikRiski < 0) skor += Math.min(50, Math.abs(stokAcikRiski) * 2);
    skor += clamp_(gunlukCiro / 50, 0, 25);
    skor += clamp_(trendKat > 1 ? (trendKat - 1) * 50 : 0, 0, 25);
    skor = Math.round(clamp_(skor, 0, 100));

    var karar;
    if (skor >= 70) karar = "Åimdi SipariÅŸ Ver";
    else if (skor >= 40) karar = "YakÄ±nda SipariÅŸ Ver";
    else if (skor >= 15) karar = "Bekle";
    else karar = "Stok Yeterli";

    output.push(
      buildRowArray_(headers, thmap, {
        SKU: r["SKU"],
        "Mevcut Stok DeÄŸeri": stokDegeri,
        "Son 30 GÃ¼n Net SatÄ±ÅŸ": s30,
        "Son 90 GÃ¼n Net SatÄ±ÅŸ": s90,
        "SatÄ±ÅŸ Trend KatsayÄ±sÄ±": trendKat,
        "Stok GÃ¼n SayÄ±sÄ±": Math.round(stokGun),
        "Lead Time": leadTime,
        "GÃ¼venlik StoÄŸu": guvenlik,
        "Stok AÃ§Ä±k Riski": Math.round(stokAcikRiski),
        "30 GÃ¼nlÃ¼k Tahmini Ciro": Math.round(ciro30),
        "60 GÃ¼nlÃ¼k Tahmini Ciro": Math.round(ciro60),
        "Stok Yetmezse Kaybedilecek Ciro": Math.round(kayipCiro),
        "Stok Yetmezse Kaybedilecek Kar": Math.round(kayipKar),
        "Ä°thalat Ã–ncelik Skoru": skor,
        Karar: karar,
      }),
    );
  }

  if (output.length > 0) {
    ensureRows_(talepSheet, CONFIG.dataStartRow + output.length - 1);
    talepSheet
      .getRange(CONFIG.dataStartRow, 1, output.length, headers.length)
      .setValues(output);
  }

  return { ok: true, written: output.length };
}
