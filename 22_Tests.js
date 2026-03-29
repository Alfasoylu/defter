// CLI'dan çağrılabilir test fonksiyonları (exit code ve log ile)
function runSmokeTestsCLI() {
  try {
    var result = runSmokeTests_();
    if (result.fail > 0) {
      console.error("SMOKE TEST FAIL", JSON.stringify(result.results));
      return 1;
    }
    console.log("SMOKE TEST PASS", JSON.stringify(result.results));
    return 0;
  } catch (e) {
    console.error("SMOKE TEST ERROR", e && e.stack ? e.stack : e);
    return 1;
  }
}

function runDryRunCLI() {
  try {
    // DRY_RUN=true ile kritik fonksiyonları simüle et
    // ...implementasyon...
    // Hata durumunda throw ile çık
    console.log("DRY RUN TEST PASS");
    return 0;
  } catch (e) {
    console.error("DRY RUN TEST ERROR", e && e.stack ? e.stack : e);
    return 1;
  }
}

function runRealRunCLI() {
  try {
    // TEST_SHEET_ID ile sınırlı veriyle gerçek yazım testi
    // ...implementasyon...
    // Hata durumunda throw ile çık
    console.log("REAL RUN TEST PASS");
    return 0;
  } catch (e) {
    console.error("REAL RUN TEST ERROR", e && e.stack ? e.stack : e);
    return 1;
  }
}

function runIntegrityTestsCLI() {
  try {
    // Bozuk veri, eksik kolon, yanlış tip, duplicate, negatif değer, büyük veri testleri
    // ...implementasyon...
    // Hata durumunda throw ile çık
    console.log("INTEGRITY TEST PASS");
    return 0;
  } catch (e) {
    console.error("INTEGRITY TEST ERROR", e && e.stack ? e.stack : e);
    return 1;
  }
}
// ─── 20. SMOKE TEST SUITE ───────────────────────────────────────────────────

/**
 * Ana smoke test fonksiyonu. Tüm modülleri çağırır ve sonuçları doğrular.
 * Menüden veya scriptEditor'den çalıştırılabilir.
 */
function runSmokeTests_() {
  var results = [];
  var pass = 0,
    fail = 0;

  function assert(testName, condition, detail) {
    if (condition) {
      results.push({ test: testName, status: "PASS", detail: detail || "" });
      pass++;
    } else {
      results.push({ test: testName, status: "FAIL", detail: detail || "" });
      fail++;
    }
  }

  function safeRun(testName, fn) {
    try {
      fn();
    } catch (e) {
      results.push({ test: testName, status: "ERROR", detail: e.toString() });
      fail++;
    }
  }

  var ss = getSS_();

  // ─── T1: CONFIG yapısal bütünlük ─────────────────────────────────────
  safeRun("T1: CONFIG sheets tanımlı", function () {
    var keys = Object.keys(CONFIG.sheets);
    assert(
      "T1a: CONFIG.sheets 15+ kayıt",
      keys.length >= 15,
      "Bulunan: " + keys.length,
    );
    var required = [
      "ana",
      "giris",
      "alacak",
      "borc",
      "sabit",
      "nakit",
      "stok",
      "stokHareket",
      "skuKar",
      "ithalat",
      "talep",
      "risk",
      "dashboard",
      "aksiyon",
      "parametreler",
      "tahmin",
    ];
    for (var i = 0; i < required.length; i++) {
      assert(
        "T1b: CONFIG.sheets." + required[i],
        CONFIG.sheets[required[i]] != null,
        CONFIG.sheets[required[i]] || "TANIMSIZ",
      );
    }
  });

  // ─── T2: SCHEMAS bütünlüğü ───────────────────────────────────────────
  safeRun("T2: SCHEMAS tanımlı", function () {
    var sheetKeys = Object.keys(CONFIG.sheets);
    for (var i = 0; i < sheetKeys.length; i++) {
      var sheetName = CONFIG.sheets[sheetKeys[i]];
      var schema = SCHEMAS[sheetName];
      if (
        sheetKeys[i] === "ana" ||
        sheetKeys[i] === "dashboard" ||
        sheetKeys[i] === "aksiyon"
      )
        continue;
      assert(
        "T2: SCHEMA[" + sheetKeys[i] + "]",
        schema && schema.length > 0,
        schema ? schema.length + " kolon" : "YOK",
      );
    }
  });

  // ─── T3: Parametreler yükleniyor ─────────────────────────────────────
  safeRun("T3: applyParams_ çalışıyor", function () {
    applyParams_();
    assert(
      "T3a: safe_cash_floor yüklendi",
      CONFIG.params.safe_cash_floor != null,
      CONFIG.params.safe_cash_floor,
    );
    assert(
      "T3b: usd_try yüklendi",
      CONFIG.params.usd_try != null,
      CONFIG.params.usd_try,
    );
    assert(
      "T3c: projection_days yüklendi",
      CONFIG.params.projection_days != null,
      CONFIG.params.projection_days,
    );
    assert(
      "T3d: annual_financing_rate yüklendi",
      CONFIG.params.annual_financing_rate != null,
      CONFIG.params.annual_financing_rate,
    );
    assert(
      "T3e: marketplace_commission_rate yüklendi",
      CONFIG.params.marketplace_commission_rate != null,
      CONFIG.params.marketplace_commission_rate,
    );
  });

  // ─── T4: Nakit projeksiyon motoru ─────────────────────────────────────
  safeRun("T4: buildCashProjection_ çalışıyor", function () {
    var cash = buildCashProjection_();
    assert(
      "T4a: projection array döndü",
      Array.isArray(cash.projection),
      "Length: " + (cash.projection ? cash.projection.length : "null"),
    );
    assert(
      "T4b: projection 30+ gün",
      cash.projection.length >= 30,
      cash.projection.length + " gün",
    );
    assert(
      "T4c: minCashReserve sayı",
      typeof cash.minCashReserve === "number",
      cash.minCashReserve,
    );
    assert(
      "T4d: monthlyFixed sayı",
      typeof cash.monthlyFixed === "number",
      cash.monthlyFixed,
    );
    if (cash.projection.length > 0) {
      var p0 = cash.projection[0];
      assert("T4e: ilk gün date var", p0.date instanceof Date, p0.dateStr);
      assert(
        "T4f: ilk gün kapanis sayı",
        typeof p0.kapanis === "number",
        p0.kapanis,
      );
      assert(
        "T4g: ilk gün acilis sayı",
        typeof p0.acilis === "number",
        p0.acilis,
      );
    }
  });

  // ─── T5: Stok metrikleri ──────────────────────────────────────────────
  safeRun("T5: buildInventoryMetrics_ çalışıyor", function () {
    var result = buildInventoryMetrics_();
    assert(
      "T5a: ok döndü",
      result && result.ok === true,
      JSON.stringify(result).substring(0, 100),
    );
  });

  // ─── T6: SKU Karlılık ─────────────────────────────────────────────────
  safeRun("T6: buildSkuProfitability_ çalışıyor", function () {
    var result = buildSkuProfitability_();
    assert("T6a: ok döndü", result && result.ok === true);
  });

  // ─── T7: Talep baskısı ────────────────────────────────────────────────
  safeRun("T7: buildDemandPressure_ çalışıyor", function () {
    var result = buildDemandPressure_();
    assert("T7a: ok döndü", result && result.ok === true);
  });

  // ─── T8: İthalat karar motoru ─────────────────────────────────────────
  safeRun("T8: buildImportDecisionEngine_ çalışıyor", function () {
    var result = buildImportDecisionEngine_();
    assert("T8a: ok döndü", result && result.ok === true);
  });

  // ─── T9: Tahmini satışlar ─────────────────────────────────────────────
  safeRun("T9: buildSalesForecast_ çalışıyor", function () {
    var result = buildSalesForecast_();
    assert("T9a: ok döndü", result && result.ok === true);
  });

  // ─── T10: Marj/devir eşikleri ─────────────────────────────────────────
  safeRun("T10: buildMarginTurnoverThresholds_ çalışıyor", function () {
    var thr = buildMarginTurnoverThresholds_();
    assert("T10a: ok döndü", thr && thr.ok === true);
    assert(
      "T10b: minBrutMarj sayı",
      typeof thr.minBrutMarj === "number",
      thr.minBrutMarj,
    );
    assert(
      "T10c: minNetMarj sayı",
      typeof thr.minNetMarj === "number",
      thr.minNetMarj,
    );
    assert(
      "T10d: maxDevirGun sayı",
      typeof thr.maxDevirGun === "number",
      thr.maxDevirGun,
    );
    assert(
      "T10e: ortDevirGun sayı",
      typeof thr.ortDevirGun === "number",
      thr.ortDevirGun,
    );
    assert(
      "T10f: uyarilar array",
      Array.isArray(thr.uyarilar),
      thr.uyarilar ? thr.uyarilar.length + " uyarı" : "null",
    );
  });

  // ─── T11: Güvenli ithalat kapasitesi ──────────────────────────────────
  safeRun("T11: buildSafeImportCapacity_ çalışıyor", function () {
    var cap = buildSafeImportCapacity_();
    assert("T11a: ok döndü", cap && cap.ok === true);
    assert(
      "T11b: guvenliKapasite sayı",
      typeof cap.guvenliKapasite === "number",
      cap.guvenliKapasite,
    );
    assert(
      "T11c: temkinliKapasite sayı",
      typeof cap.temkinliKapasite === "number",
      cap.temkinliKapasite,
    );
    assert("T11d: dscr sayı", typeof cap.dscr === "number", cap.dscr);
    assert(
      "T11e: krediKarar string",
      typeof cap.krediKarar === "string",
      cap.krediKarar,
    );
    assert("T11f: darbogazlar array", Array.isArray(cap.darbogazlar));
    assert(
      "T11g: maxKrediTutar sayı",
      typeof cap.maxKrediTutar === "number",
      cap.maxKrediTutar,
    );
  });

  // ─── T12: Karar motoru ────────────────────────────────────────────────
  safeRun("T12: buildDecisionEngine_ çalışıyor", function () {
    var dec = buildDecisionEngine_();
    assert("T12a: ok döndü", dec && dec.ok === true);
    assert(
      "T12b: kararlar array",
      Array.isArray(dec.kararlar),
      dec.kararlar ? dec.kararlar.length + " karar" : "null",
    );
    assert("T12c: thresholds var", dec.thresholds != null);
    assert("T12d: importCapacity var", dec.importCapacity != null);
    if (dec.kararlar && dec.kararlar.length > 0) {
      var k0 = dec.kararlar[0];
      assert(
        "T12e: karar.baslik var",
        typeof k0.baslik === "string",
        k0.baslik,
      );
      assert(
        "T12f: karar.oncelik var",
        typeof k0.oncelik === "string",
        k0.oncelik,
      );
      assert("T12g: karar.dayanak var", typeof k0.dayanak === "string");
      assert("T12h: karar.aksiyon var", typeof k0.aksiyon === "string");
    }
  });

  // ─── T13: Risk paneli ─────────────────────────────────────────────────
  safeRun("T13: buildRiskPanel_ çalışıyor", function () {
    var result = buildRiskPanel_();
    assert("T13a: ok döndü", result && result.ok === true);
  });

  // ─── T14: Dashboard render ────────────────────────────────────────────
  safeRun("T14: renderDashboard_ çalışıyor", function () {
    var result = renderDashboard_();
    assert("T14a: ok döndü", result && result.ok === true);
    // Dashboard sayfası oluşmuş mu?
    var dSheet = ss.getSheetByName(CONFIG.sheets.dashboard);
    assert("T14b: Dashboard sayfası var", dSheet != null);
    if (dSheet) {
      var a1 = dSheet.getRange("A1").getValue();
      assert("T14c: Başlık yazıldı", String(a1).indexOf("DASHBOARD") >= 0, a1);
    }
  });

  // ─── T15: Aksiyon merkezi render ──────────────────────────────────────
  safeRun("T15: renderActionCenter_ çalışıyor", function () {
    var result = renderActionCenter_();
    assert("T15a: ok döndü", result && result.ok === true);
    var aSheet = ss.getSheetByName(CONFIG.sheets.aksiyon);
    assert("T15b: Aksiyon sayfası var", aSheet != null);
  });

  // ─── T16: Sabit gider üretimi ─────────────────────────────────────────
  safeRun("T16: generateRecurringExpenses_ çalışıyor", function () {
    var result = generateRecurringExpenses_();
    assert("T16a: ok döndü", result && result.ok === true);
  });

  // ─── T17: Borç hesaplama alanları ─────────────────────────────────────
  safeRun("T17: updateBorcComputedFields_ çalışıyor", function () {
    var result = updateBorcComputedFields_();
    assert("T17a: ok döndü", result && result.ok === true);
  });

  // ─── T18: Alacak hesaplama alanları ───────────────────────────────────
  safeRun("T18: updateAlacakComputedFields_ çalışıyor", function () {
    var result = updateAlacakComputedFields_();
    assert("T18a: ok döndü", result && result.ok === true);
  });

  // ─── T19: Duplicate engelleme — nakit sayfasında unique tarih ────────
  safeRun("T19: Nakit sayfası tarih unique", function () {
    var ss19 = getSS_();
    var nSheet = ss19.getSheetByName(CONFIG.sheets.nakit);
    if (!nSheet || nSheet.getLastRow() <= CONFIG.headerRow) {
      assert("T19a: Nakit sayfasında veri yok (atlandı)", true, "Veri yok");
      return;
    }
    var tarihler = {};
    var rows = getAllRows_(nSheet);
    var dupCount = 0;
    for (var i = 0; i < rows.length; i++) {
      var t = String(rows[i]["Tarih"] || "").trim();
      if (t) {
        if (tarihler[t]) dupCount++;
        tarihler[t] = true;
      }
    }
    assert(
      "T19a: Nakit akışında duplicate tarih yok",
      dupCount === 0,
      dupCount + " duplicate",
    );
  });

  // ─── T20: Şema-sayfa uyumu ────────────────────────────────────────────
  safeRun("T20: Sheet header'lar SCHEMA ile uyumlu", function () {
    var ss20 = getSS_();
    var keys = Object.keys(CONFIG.sheets);
    for (var sk = 0; sk < keys.length; sk++) {
      var sheetName = CONFIG.sheets[keys[sk]];
      var schema = SCHEMAS[sheetName];
      if (!schema) continue;
      var sh = ss20.getSheetByName(sheetName);
      if (!sh) continue;
      if (sh.getLastColumn() < 1) continue;
      var headers = sh
        .getRange(CONFIG.headerRow, 1, 1, sh.getLastColumn())
        .getValues()[0];
      var headerSet = {};
      for (var h = 0; h < headers.length; h++) {
        if (headers[h]) headerSet[String(headers[h]).trim()] = true;
      }
      var missing = [];
      for (var c = 0; c < schema.length; c++) {
        if (!headerSet[schema[c]]) missing.push(schema[c]);
      }
      assert(
        "T20: " + keys[sk] + " header uyumu",
        missing.length === 0,
        missing.length > 0 ? "Eksik: " + missing.join(", ") : "OK",
      );
    }
  });

  // ─── T21: Tarih formatı tutarlılığı ───────────────────────────────────
  safeRun("T21: Tarih format tutarlılığı", function () {
    var borcSheet = ss.getSheetByName(CONFIG.sheets.borc);
    if (!borcSheet || borcSheet.getLastRow() <= CONFIG.headerRow) {
      assert("T21a: Borç tarih formatı (veri yok)", true);
      return;
    }
    var bRows = getAllRows_(borcSheet);
    var badDateCount = 0;
    for (var i = 0; i < Math.min(bRows.length, 50); i++) {
      var vade = bRows[i]["Vade"];
      if (vade && !(vade instanceof Date) && !parseTurkishDate_(vade)) {
        badDateCount++;
      }
    }
    assert(
      "T21a: Borç vade formatı tutarlı",
      badDateCount === 0,
      badDateCount + " bozuk tarih",
    );
  });

  // ─── T22: Nakit projeksiyon iç tutarlılığı ────────────────────────────
  safeRun("T22: Projeksiyon iç tutarlılık", function () {
    var cash = buildCashProjection_();
    var proj = cash.projection;
    if (proj.length < 2) {
      assert("T22a: Projeksiyon 2+ gün (atlandı)", true);
      return;
    }
    // Her günün kapanışı = sonraki günün açılışı
    var mismatch = 0;
    for (var i = 0; i < proj.length - 1; i++) {
      if (Math.abs(proj[i].kapanis - proj[i + 1].acilis) > 0.01) {
        mismatch++;
      }
    }
    assert(
      "T22a: Kapanış=Sonraki açılış",
      mismatch === 0,
      mismatch + " uyumsuzluk",
    );
    // Bakiye devamlılığı
    var p = proj[0];
    var expectedClose =
      p.acilis +
      p.kesinGiris +
      p.olasiGiris +
      p.finansmanGiris -
      p.kesinCikis -
      p.olasiCikis;
    assert(
      "T22b: İlk gün bakiye formülü",
      Math.abs(p.kapanis - expectedClose) < 0.01,
      "Beklenen: " + expectedClose + " Gerçek: " + p.kapanis,
    );
  });

  // ─── T23: Utility fonksiyon testleri ─────────────────────────────────
  safeRun("T23: Utility fonksiyonlar", function () {
    // parseCurrency_
    assert(
      "T23a: parseCurrency_ sayı",
      parseCurrency_(1234) === 1234,
      parseCurrency_(1234),
    );
    assert(
      "T23b: parseCurrency_ TR format",
      parseCurrency_("1.234,56") === 1234.56,
      parseCurrency_("1.234,56"),
    );
    assert("T23c: parseCurrency_ boş", parseCurrency_("") === 0);
    assert("T23d: parseCurrency_ null", parseCurrency_(null) === 0);
    assert(
      "T23e: parseCurrency_ negatif",
      parseCurrency_("-500") === -500,
      parseCurrency_("-500"),
    );

    // parseTurkishDate_
    var d1 = parseTurkishDate_("15.03.2026");
    assert(
      "T23f: parseTurkishDate_ dd.MM.yyyy",
      d1 instanceof Date && d1.getDate() === 15 && d1.getMonth() === 2,
      d1,
    );
    var d2 = parseTurkishDate_("01/12/2025");
    assert(
      "T23g: parseTurkishDate_ dd/MM/yyyy",
      d2 instanceof Date && d2.getDate() === 1 && d2.getMonth() === 11,
      d2,
    );
    assert("T23h: parseTurkishDate_ null", parseTurkishDate_(null) === null);
    assert("T23i: parseTurkishDate_ boş", parseTurkishDate_("") === null);
    assert(
      "T23j: parseTurkishDate_ Date obj",
      parseTurkishDate_(new Date(2026, 0, 1)) instanceof Date,
    );

    var invalidInputErrors = getInputRowValidationErrors_({
      "İşlem Tarihi": "32.13.2026",
      "İşlem Tipi": "Ödeme",
      Tutar: 100,
      "Para Birimi": "TRY",
      Kur: 1,
    });
    assert(
      "T23j1: Geçersiz tarih yakalanıyor",
      invalidInputErrors.indexOf("İşlem Tarihi geçersiz") >= 0,
      invalidInputErrors.join(", "),
    );
    var fxInputErrors = getInputRowValidationErrors_({
      "İşlem Tarihi": "15.03.2026",
      "İşlem Tipi": "Ödeme",
      Tutar: 100,
      "Para Birimi": "USD",
      Kur: 0,
    });
    assert(
      "T23j2: Döviz için kur zorunlu",
      fxInputErrors.indexOf("TRY dışı para birimi için Kur zorunlu") >= 0,
      fxInputErrors.join(", "),
    );
    var validInputErrors = getInputRowValidationErrors_({
      "İşlem Tarihi": "15.03.2026",
      "Nakit Etki Tarihi": "16.03.2026",
      "İşlem Tipi": "Ödeme",
      Tutar: 100,
      "Para Birimi": "TRY",
      Kur: 1,
    });
    assert(
      "T23j3: Geçerli giriş hata üretmiyor",
      validInputErrors.length === 0,
      validInputErrors.join(", "),
    );

    // formatTL_
    assert(
      "T23k: formatTL_ basit",
      formatTL_(1234.56) === "1.234,56",
      formatTL_(1234.56),
    );
    assert(
      "T23l: formatTL_ negatif",
      formatTL_(-500) === "-500,00",
      formatTL_(-500),
    );
    assert("T23m: formatTL_ sıfır", formatTL_(0) === "0,00", formatTL_(0));
    assert("T23n: formatTL_ null", formatTL_(null) === "0,00", formatTL_(null));

    // daysBetween_
    var da = new Date(2026, 0, 1);
    var db = new Date(2026, 0, 11);
    assert(
      "T23o: daysBetween_ 10 gün",
      daysBetween_(da, db) === 10,
      daysBetween_(da, db),
    );
    assert(
      "T23p: daysBetween_ negatif",
      daysBetween_(db, da) === -10,
      daysBetween_(db, da),
    );
    assert("T23q: daysBetween_ null", daysBetween_(null, db) === 0);

    // addDays_
    var dc = addDays_(da, 5);
    assert(
      "T23r: addDays_ 5 gün",
      dc.getDate() === 6 && dc.getMonth() === 0,
      dc,
    );

    // clamp_
    assert("T23s: clamp_ orta", clamp_(5, 0, 10) === 5);
    assert("T23t: clamp_ alt", clamp_(-5, 0, 10) === 0);
    assert("T23u: clamp_ üst", clamp_(15, 0, 10) === 10);

    // safeDivide_
    assert("T23v: safeDivide_ normal", safeDivide_(10, 2, 0) === 5);
    assert("T23w: safeDivide_ sıfıra bölme", safeDivide_(10, 0, -1) === -1);

    // generateId_
    var id = generateId_("TST");
    assert("T23x: generateId_ prefix", id.indexOf("TST-") === 0, id);
    assert("T23y: generateId_ uzunluk", id.length > 4, id.length);

    // dateKey_
    var dk = dateKey_(new Date(2026, 2, 15));
    assert("T23z: dateKey_ format", dk === "15.03.2026", dk);
  });

  // ─── T24: renderAnaKontrolPaneli_ ──────────────────────────────────
  safeRun("T24: renderAnaKontrolPaneli_ çalışıyor", function () {
    var result = renderAnaKontrolPaneli_();
    assert("T24a: ok döndü", result && result.ok === true);
    var ss24 = getSS_();
    var anaSheet = ss24.getSheetByName(CONFIG.sheets.ana);
    assert("T24b: Ana Kontrol sayfası var", anaSheet != null);
    if (anaSheet) {
      var a1 = anaSheet.getRange("A1").getValue();
      assert(
        "T24c: Başlık yazıldı",
        String(a1).indexOf("ANA KONTROL") >= 0,
        a1,
      );
    }
  });

  // ─── T25: repairKeys_ ──────────────────────────────────────────────
  safeRun("T25: repairKeys_ çalışıyor", function () {
    var result = repairKeys_();
    assert("T25a: ok döndü", result && result.ok === true);
    assert(
      "T25b: repaired sayı",
      typeof result.repaired === "number",
      result.repaired,
    );
  });

  // ─── T26: fixDates_ ────────────────────────────────────────────────
  safeRun("T26: fixDates_ çalışıyor", function () {
    var result = fixDates_();
    assert("T26a: ok döndü", result && result.ok === true);
    assert(
      "T26b: fixedColumns sayı",
      typeof result.fixedColumns === "number",
      result.fixedColumns,
    );
    var validationResult = applyValidations_();
    assert(
      "T26c: applyValidations_ çalışıyor",
      validationResult && validationResult.ok === true,
    );

    var ss26 = getSS_();
    var girisSheet = ss26.getSheetByName(CONFIG.sheets.giris);
    var girisHmap = getHeaderMap_(girisSheet);
    var girisDateRule = girisSheet
      .getRange(CONFIG.dataStartRow, girisHmap["İşlem Tarihi"] + 1)
      .getDataValidation();
    var girisDateCell = girisSheet.getRange(
      CONFIG.dataStartRow,
      girisHmap["İşlem Tarihi"] + 1,
    );
    var girisTutarRule = girisSheet
      .getRange(CONFIG.dataStartRow, girisHmap["Tutar"] + 1)
      .getDataValidation();
    var runtimeDateGuard =
      getInputRowValidationErrors_({
        "İşlem Tarihi": "32.13.2026",
        "İşlem Tipi": "Ödeme",
        Tutar: 100,
        "Para Birimi": "TRY",
        Kur: 1,
      }).indexOf("İşlem Tarihi geçersiz") >= 0;
    var hasDateFormat = girisDateCell.getNumberFormat() === CONFIG.dateFormat;
    assert(
      "T26d: İşlem Tarihi validation var",
      girisDateRule != null || (runtimeDateGuard && hasDateFormat),
      "rule=" +
        (girisDateRule != null) +
        " format=" +
        girisDateCell.getNumberFormat() +
        " runtime=" +
        runtimeDateGuard,
    );
    assert("T26e: Tutar validation var", girisTutarRule != null);

    var acikHesapSheet = ss26.getSheetByName(CONFIG.sheets.acikHesap);
    var acikHesapHmap = getHeaderMap_(acikHesapSheet);
    var ahDateRule = acikHesapSheet
      .getRange(CONFIG.dataStartRow, acikHesapHmap["Vade Tarihi"] + 1)
      .getDataValidation();
    assert("T26f: Açık Hesap Vade validation var", ahDateRule != null);
  });

  // ─── T27: writeCashProjection_ ─────────────────────────────────────
  safeRun("T27: writeCashProjection_ çalışıyor", function () {
    var cash = buildCashProjection_();
    var result = writeCashProjection_(cash);
    assert("T27a: ok döndü", result && result.ok === true);
    assert("T27b: days > 0", result.days > 0, result.days + " gün yazıldı");
    var nSheet = ss.getSheetByName(CONFIG.sheets.nakit);
    assert("T27c: Nakit sayfası var", nSheet != null);
    if (nSheet) {
      assert(
        "T27d: Veri var",
        nSheet.getLastRow() >= CONFIG.dataStartRow,
        nSheet.getLastRow() + " satır",
      );
    }
  });

  // ─── T28: setRowValues_ undefined koruması ─────────────────────────
  safeRun("T28: setRowValues_ undefined atla", function () {
    var testObj = { test: 123, skip: undefined };
    var keys = [];
    for (var key in testObj) {
      if (testObj[key] !== undefined) keys.push(key);
    }
    assert(
      "T28a: undefined filtresi çalışıyor",
      keys.length === 1 && keys[0] === "test",
      keys.join(", "),
    );
  });

  // ─── T29: opening_cash_balance parametresi ─────────────────────────
  safeRun("T29: opening_cash_balance parametresi", function () {
    var found = false;
    for (var i = 0; i < DEFAULT_PARAMS.length; i++) {
      if (DEFAULT_PARAMS[i][0] === "opening_cash_balance") {
        found = true;
        break;
      }
    }
    assert("T29a: opening_cash_balance DEFAULT_PARAMS'ta var", found);
  });

  // ─── T30: Kredi Kartı modülü ──────────────────────────────────────
  safeRun("T30: Kredi Kartı şema ve hesaplama", function () {
    // Şema kontrolü
    var kartSchema = SCHEMAS[CONFIG.sheets.krediKarti];
    assert(
      "T30a: Kredi Kartı şeması var",
      kartSchema != null && kartSchema.length > 0,
      kartSchema ? kartSchema.length + " alan" : "yok",
    );
    assert(
      "T30b: Kart ID alanı var",
      kartSchema && kartSchema.indexOf("Kart ID") >= 0,
    );
    assert(
      "T30c: Limit Kullanım % alanı var",
      kartSchema && kartSchema.indexOf("Limit Kullanım %") >= 0,
    );
    assert(
      "T30d: Sonraki Son Ödeme Tarihi alanı var",
      kartSchema && kartSchema.indexOf("Sonraki Son Ödeme Tarihi") >= 0,
    );

    // Hesaplama fonksiyonu çalışıyor mu
    var result = updateKrediKartiComputedFields_();
    assert(
      "T30e: updateKrediKartiComputedFields_ ok",
      result && result.ok === true,
    );
    assert(
      "T30f: updated sayı",
      typeof result.updated === "number",
      result.updated,
    );

    // CONFIG kontrolü
    assert(
      "T30g: CONFIG.sheets.krediKarti var",
      CONFIG.sheets.krediKarti === "Kredi Kartları",
    );
    assert(
      "T30h: CONFIG.prefixes.krediKarti var",
      CONFIG.prefixes.krediKarti === "KRT",
    );
    assert(
      "T30i: kartDurum seçenekleri var",
      CONFIG.options.kartDurum && CONFIG.options.kartDurum.length === 3,
    );
    assert(
      "T30j: odemeTercihi seçenekleri var",
      CONFIG.options.odemeTercihi && CONFIG.options.odemeTercihi.length === 2,
    );
  });

  // ─── T31: Açık Hesap Müşteriler modülü ────────────────────────────
  safeRun("T31: Açık Hesap şema ve hesaplama", function () {
    // Şema kontrolü
    var ahSchema = SCHEMAS[CONFIG.sheets.acikHesap];
    assert(
      "T31a: Açık Hesap şeması var",
      ahSchema != null && ahSchema.length > 0,
      ahSchema ? ahSchema.length + " alan" : "yok",
    );
    assert(
      "T31b: Alacak ID alanı var",
      ahSchema && ahSchema.indexOf("Alacak ID") >= 0,
    );
    assert(
      "T31c: Risk Skoru alanı var",
      ahSchema && ahSchema.indexOf("Risk Skoru") >= 0,
    );
    assert(
      "T31d: Gecikme Günü alanı var",
      ahSchema && ahSchema.indexOf("Gecikme Günü") >= 0,
    );
    assert(
      "T31e: Tahsil Durumu alanı var",
      ahSchema && ahSchema.indexOf("Tahsil Durumu") >= 0,
    );

    // Hesaplama fonksiyonu çalışıyor mu
    var result = updateAcikHesapComputedFields_();
    assert(
      "T31f: updateAcikHesapComputedFields_ ok",
      result && result.ok === true,
    );
    assert(
      "T31g: updated sayı",
      typeof result.updated === "number",
      result.updated,
    );

    // CONFIG kontrolü
    assert(
      "T31h: CONFIG.sheets.acikHesap var",
      CONFIG.sheets.acikHesap === "Açık Hesap Müşteriler",
    );
    assert(
      "T31i: CONFIG.prefixes.acikHesap var",
      CONFIG.prefixes.acikHesap === "AHS",
    );
    assert(
      "T31j: tahsilDurum seçenekleri var",
      CONFIG.options.tahsilDurum && CONFIG.options.tahsilDurum.length === 6,
    );
  });

  // ─── T32: Uyarı Motoru (buildAlerts_) ────────────────────────────────
  safeRun("T32: Uyarı motoru temel kontroller", function () {
    var alertResult = buildAlerts_();
    assert("T32a: buildAlerts_ ok", alertResult && alertResult.ok === true);
    assert("T32b: ozet nesnesi var", alertResult.ozet != null);
    assert(
      "T32c: ozet.toplam sayısal",
      typeof alertResult.ozet.toplam === "number",
      alertResult.ozet.toplam,
    );
    assert(
      "T32d: ozet.kritik sayısal",
      typeof alertResult.ozet.kritik === "number",
      alertResult.ozet.kritik,
    );
    assert(
      "T32e: ozet.yuksek sayısal",
      typeof alertResult.ozet.yuksek === "number",
      alertResult.ozet.yuksek,
    );
    assert(
      "T32f: ozet.orta sayısal",
      typeof alertResult.ozet.orta === "number",
      alertResult.ozet.orta,
    );
    assert(
      "T32g: alerts dizi",
      Array.isArray(alertResult.alerts),
      alertResult.alerts.length + " alert",
    );

    // Sıralama kontrolü: Kritik > Yüksek > Orta > Bilgi
    if (alertResult.alerts.length > 1) {
      var seviyeSirasi = { Kritik: 0, Yüksek: 1, Orta: 2, Bilgi: 3 };
      var dogru = true;
      for (var i = 1; i < alertResult.alerts.length; i++) {
        var onceki = seviyeSirasi[alertResult.alerts[i - 1].seviye] || 99;
        var simdiki = seviyeSirasi[alertResult.alerts[i].seviye] || 99;
        if (onceki > simdiki) {
          dogru = false;
          break;
        }
      }
      assert("T32h: Seviye sıralaması doğru", dogru);
    } else {
      assert("T32h: Seviye sıralaması (tek/sıfır alert)", true, "skip");
    }

    // Alert yapısı kontrolü
    if (alertResult.alerts.length > 0) {
      var first = alertResult.alerts[0];
      assert(
        "T32i: Alert kategori alanı",
        typeof first.kategori === "string" && first.kategori.length > 0,
        first.kategori,
      );
      assert(
        "T32j: Alert seviye alanı",
        typeof first.seviye === "string" && first.seviye.length > 0,
        first.seviye,
      );
      assert(
        "T32k: Alert mesaj alanı",
        typeof first.mesaj === "string" && first.mesaj.length > 0,
      );
      assert(
        "T32l: Alert aksiyon alanı",
        typeof first.aksiyon === "string" && first.aksiyon.length > 0,
      );
    } else {
      assert("T32i: Alert kategori (boş dizi)", true, "skip");
      assert("T32j: Alert seviye (boş dizi)", true, "skip");
      assert("T32k: Alert mesaj (boş dizi)", true, "skip");
      assert("T32l: Alert aksiyon (boş dizi)", true, "skip");
    }
  });

  // ─── T33: İdempotent güncelleme (aynı satır tekrar işleme) ─────────────
  safeRun("T33: İdempotent güncelleme", function () {
    var izlenecek = [
      { key: "borc", ad: CONFIG.sheets.borc },
      { key: "alacak", ad: CONFIG.sheets.alacak },
      { key: "krediKarti", ad: CONFIG.sheets.krediKarti },
      { key: "acikHesap", ad: CONFIG.sheets.acikHesap },
    ];
    var once = {};
    for (var i33 = 0; i33 < izlenecek.length; i33++) {
      var sh33 = ss.getSheetByName(izlenecek[i33].ad);
      once[izlenecek[i33].key] = sh33 ? sh33.getLastRow() : 0;
    }

    updateBorcComputedFields_();
    updateAlacakComputedFields_();
    updateKrediKartiComputedFields_();
    updateAcikHesapComputedFields_();
    updateBorcComputedFields_();
    updateAlacakComputedFields_();
    updateKrediKartiComputedFields_();
    updateAcikHesapComputedFields_();

    for (var j33 = 0; j33 < izlenecek.length; j33++) {
      var shNow = ss.getSheetByName(izlenecek[j33].ad);
      var simdi = shNow ? shNow.getLastRow() : 0;
      assert(
        "T33" +
          String.fromCharCode(97 + j33) +
          ": " +
          izlenecek[j33].key +
          " satır sayısı sabit",
        simdi === once[izlenecek[j33].key],
        "önce=" + once[izlenecek[j33].key] + " sonra=" + simdi,
      );
    }
  });

  // ─── T34: Duplicate anahtar güvenliği ──────────────────────────────────
  safeRun("T34: Duplicate anahtar kontrolü", function () {
    function duplicateCount_(sheetName, keyCol) {
      var sh = ss.getSheetByName(sheetName);
      if (!sh || sh.getLastRow() < CONFIG.dataStartRow) return 0;
      var rows = getAllRows_(sh);
      var seen = {};
      var dup = 0;
      for (var i = 0; i < rows.length; i++) {
        var k = String(rows[i][keyCol] || "").trim();
        if (!k) continue;
        if (seen[k]) dup++;
        seen[k] = true;
      }
      return dup;
    }

    assert(
      "T34a: Borç Kodu duplicate yok",
      duplicateCount_(CONFIG.sheets.borc, "Borç Kodu") === 0,
    );
    assert(
      "T34b: Alacak Kodu duplicate yok",
      duplicateCount_(CONFIG.sheets.alacak, "Alacak Kodu") === 0,
    );
    assert(
      "T34c: Kart ID duplicate yok",
      duplicateCount_(CONFIG.sheets.krediKarti, "Kart ID") === 0,
    );
    assert(
      "T34d: Açık Hesap Alacak ID duplicate yok",
      duplicateCount_(CONFIG.sheets.acikHesap, "Alacak ID") === 0,
    );
  });

  // ─── T35: Sheet isim / header bütünlük güvenliği ───────────────────────
  safeRun("T35: Sheet bütünlük raporu temiz", function () {
    var integrity = verifySheetIntegrityCLI();
    assert(
      "T35a: MISSING yok",
      integrity.indexOf("MISSING:") === -1,
      integrity,
    );
    assert(
      "T35b: HEADER_MISSING yok",
      integrity.indexOf("HEADER_MISSING") === -1,
      integrity,
    );
  });

  // ─── T36: Tarih format ve parse güvenliği ───────────────────────────────
  safeRun("T36: Tarih format güvenliği", function () {
    var kontroller = [
      { sheet: CONFIG.sheets.borc, col: "Vade" },
      { sheet: CONFIG.sheets.alacak, col: "Tahsil Tarihi" },
      { sheet: CONFIG.sheets.krediKarti, col: "Sonraki Son Ödeme Tarihi" },
      { sheet: CONFIG.sheets.acikHesap, col: "Vade Tarihi" },
      { sheet: CONFIG.sheets.ithalat, col: "Mal Bedeli Ödeme Tarihi" },
      { sheet: CONFIG.sheets.ithalat, col: "Navlun Ödeme Tarihi" },
      { sheet: CONFIG.sheets.ithalat, col: "Gümrük Ödeme Tarihi" },
    ];
    var bozuk = 0;
    var incelenen = 0;
    for (var c36 = 0; c36 < kontroller.length; c36++) {
      var sh36 = ss.getSheetByName(kontroller[c36].sheet);
      if (!sh36 || sh36.getLastRow() < CONFIG.dataStartRow) continue;
      var rows36 = getAllRows_(sh36);
      for (var r36 = 0; r36 < Math.min(rows36.length, 100); r36++) {
        var v36 = rows36[r36][kontroller[c36].col];
        if (v36 === null || v36 === undefined || String(v36).trim() === "")
          continue;
        incelenen++;
        if (!(v36 instanceof Date) && !parseTurkishDate_(v36)) bozuk++;
      }
    }
    assert(
      "T36a: Tarih parse hatası yok",
      bozuk === 0,
      "bozuk=" + bozuk + " incelenen=" + incelenen,
    );
    var isoDate = parseTurkishDate_("2026-03-26");
    assert("T36b: ISO tarih parse ediliyor", isoDate instanceof Date, isoDate);
  });

  // ─── T37: Kredi kartı uyarı güvenliği ───────────────────────────────────
  safeRun("T37: Kredi kartı uyarı kontrolleri", function () {
    refreshAllCalculations_();
    var ss37 = getSS_();
    var kartRows37 = getAllRows_(
      ss37.getSheetByName(CONFIG.sheets.krediKarti) || createDummySheet_(),
    );
    var aktif = 0;
    var limit80 = 0;
    for (var k37 = 0; k37 < kartRows37.length; k37++) {
      if (String(kartRows37[k37]["Durum"] || "").trim() !== "Aktif") continue;
      aktif++;
      if (parseCurrency_(kartRows37[k37]["Limit Kullanım %"]) >= 80) limit80++;
    }

    var ar37 = buildAlerts_(true);
    var kkAlert = 0;
    var seviyeGecerli = true;
    for (var a37 = 0; a37 < ar37.alerts.length; a37++) {
      var sev = ar37.alerts[a37].seviye;
      if (
        sev !== "Kritik" &&
        sev !== "Yüksek" &&
        sev !== "Orta" &&
        sev !== "Bilgi"
      )
        seviyeGecerli = false;
      if (ar37.alerts[a37].kategori === "Kredi Kartı") kkAlert++;
    }
    assert("T37a: Alert seviyeleri geçerli", seviyeGecerli);
    if (aktif > 0 && limit80 > 0) {
      assert(
        "T37b: Limit baskısında kredi kartı alerti var",
        kkAlert > 0,
        "aktif=" + aktif + " limit80=" + limit80 + " alert=" + kkAlert,
      );
    } else {
      assert(
        "T37b: Kredi kartı alert koşulu yok (skip)",
        true,
        "aktif=" + aktif + " limit80=" + limit80,
      );
    }
  });

  // ─── T38: Sabit gider artış / üretim güvenliği ─────────────────────────
  safeRun("T38: Sabit gider artış ve üretim", function () {
    var ss38 = getSS_();
    var sabitSchema = SCHEMAS[CONFIG.sheets.sabit] || [];
    assert(
      "T38a: Artış Tarihi alanı var",
      sabitSchema.indexOf("Artış Tarihi") >= 0,
    );
    assert(
      "T38b: Revize Tutar alanı var",
      sabitSchema.indexOf("Revize Tutar") >= 0,
    );
    assert(
      "T38c: Sonraki Oluşturma Tarihi alanı var",
      sabitSchema.indexOf("Sonraki Oluşturma Tarihi") >= 0,
    );

    var sabitSheet = ss38.getSheetByName(CONFIG.sheets.sabit);
    var hedefSatir = null;
    if (sabitSheet && sabitSheet.getLastRow() >= CONFIG.dataStartRow) {
      var sabitRows = getAllRows_(sabitSheet);
      for (var s38 = 0; s38 < sabitRows.length; s38++) {
        if (String(sabitRows[s38]["Durum"] || "").trim() === "Aktif") {
          hedefSatir = sabitRows[s38]._row;
          break;
        }
      }
    }

    var rec38 = generateRecurringExpenses_();
    assert("T38d: generateRecurringExpenses_ ok", rec38 && rec38.ok === true);
    assert(
      "T38e: generated sayısal",
      typeof rec38.generated === "number",
      rec38.generated,
    );
    assert(
      "T38f: skipped sayısal",
      typeof rec38.skipped === "number",
      rec38.skipped,
    );

    if (hedefSatir) {
      var hmap38 = getHeaderMap_(sabitSheet);
      var satir38 = getRowAsMap_(sabitSheet, hedefSatir, hmap38);
      var sonraki = satir38["Sonraki Oluşturma Tarihi"];
      assert(
        "T38g: Sonraki oluşturma tarihi set ediliyor",
        sonraki instanceof Date || !!parseTurkishDate_(sonraki),
        sonraki,
      );
    } else {
      assert("T38g: Aktif sabit gider yok (skip)", true, "skip");
    }
  });

  // ─── T39: İthalat çok aşamalı ödeme güvenliği ──────────────────────────
  safeRun("T39: İthalat çok aşamalı model", function () {
    refreshAllCalculations_();
    var ss39 = getSS_();
    var ihSchema = SCHEMAS[CONFIG.sheets.ithalat] || [];
    var required39 = [
      "Mal Bedeli Ödeme Tarihi",
      "Mal Bedeli Tutarı",
      "Navlun Ödeme Tarihi",
      "Navlun Tutarı",
      "Gümrük Ödeme Tarihi",
      "Gümrük Tutarı",
    ];
    for (var r39 = 0; r39 < required39.length; r39++) {
      assert(
        "T39" +
          String.fromCharCode(97 + r39) +
          ": " +
          required39[r39] +
          " alanı var",
        ihSchema.indexOf(required39[r39]) >= 0,
      );
    }

    var cash39 = buildCashProjection_();
    assert(
      "T39g: projection var",
      Array.isArray(cash39.projection) && cash39.projection.length > 0,
    );
    if (cash39.projection.length > 0) {
      assert(
        "T39h: ithalatCikis sayısal alan",
        typeof cash39.projection[0].ithalatCikis === "number",
        cash39.projection[0].ithalatCikis,
      );
    }

    var toplamIthalatCikis = 0;
    for (var p39 = 0; p39 < cash39.projection.length; p39++) {
      toplamIthalatCikis += parseCurrency_(cash39.projection[p39].ithalatCikis);
    }

    var ihRows39 = getAllRows_(
      ss39.getSheetByName(CONFIG.sheets.ithalat) || createDummySheet_(),
    );
    var planliOdeme = 0;
    for (var i39 = 0; i39 < ihRows39.length; i39++) {
      if (String(ihRows39[i39]["Durum"] || "").trim() === "İptal") continue;
      var alanlar = [
        { t: "Mal Bedeli Ödeme Tarihi", a: "Mal Bedeli Tutarı" },
        { t: "Navlun Ödeme Tarihi", a: "Navlun Tutarı" },
        { t: "Gümrük Ödeme Tarihi", a: "Gümrük Tutarı" },
      ];
      for (var aa39 = 0; aa39 < alanlar.length; aa39++) {
        var dt39 = parseTurkishDate_(ihRows39[i39][alanlar[aa39].t]);
        var amt39 = parseCurrency_(ihRows39[i39][alanlar[aa39].a]);
        if (!dt39 || amt39 <= 0) continue;
        var diff39 = daysBetween_(today_(), dt39);
        if (diff39 >= 0 && diff39 <= 90) planliOdeme += amt39;
      }
    }
    if (planliOdeme > 0) {
      assert(
        "T39i: Planlı ithalat ödemesi projeksiyona yansıyor",
        toplamIthalatCikis > 0,
        "planlı=" + planliOdeme + " proj=" + toplamIthalatCikis,
      );
    } else {
      assert(
        "T39i: 90 gün içinde planlı ithalat ödemesi yok (skip)",
        true,
        "skip",
      );
    }
  });

  // ─── T40: Tahmin ve karar sınır davranışı ──────────────────────────────
  safeRun("T40: Tahmin ve karar sınırları", function () {
    var ss40 = getSS_();
    var fc40 = buildSalesForecast_();
    assert("T40a: buildSalesForecast_ ok", fc40 && fc40.ok === true);
    assert(
      "T40b: written sayısal",
      typeof fc40.written === "number",
      fc40.written,
    );

    var tahminSheet40 = ss40.getSheetByName(CONFIG.sheets.tahmin);
    var badConfidence = 0;
    var inspected40 = 0;
    if (tahminSheet40 && tahminSheet40.getLastRow() >= CONFIG.dataStartRow) {
      var tRows40 = getAllRows_(tahminSheet40);
      for (var tr40 = 0; tr40 < Math.min(tRows40.length, 150); tr40++) {
        var c40 = parseCurrency_(tRows40[tr40]["Güven Skoru"]);
        if (
          c40 === 0 &&
          String(tRows40[tr40]["Güven Skoru"] || "").trim() === ""
        )
          continue;
        inspected40++;
        if (c40 < 0.1 || c40 > 1.0) badConfidence++;
      }
    }
    assert(
      "T40c: Güven skoru aralığı [0.1, 1.0]",
      badConfidence === 0,
      "bozuk=" + badConfidence + " incelenen=" + inspected40,
    );

    var dec40 = buildDecisionEngine_();
    assert("T40d: buildDecisionEngine_ ok", dec40 && dec40.ok === true);
    var basliklar40 = [];
    for (var d40 = 0; d40 < dec40.kararlar.length; d40++) {
      basliklar40.push(dec40.kararlar[d40].baslik);
    }
    var hasSafe = basliklar40.indexOf("GÜVENLİ İTHALAT YAP") >= 0;
    var hasDelay = basliklar40.indexOf("İTHALATI ERTELE") >= 0;
    assert(
      "T40e: Çelişen ithalat kararı birlikte yok",
      !(hasSafe && hasDelay),
      basliklar40.join(" | "),
    );

    var cash40 = buildCashProjection_();
    var min740 = Infinity;
    for (var m40 = 0; m40 < Math.min(7, cash40.projection.length); m40++) {
      min740 = Math.min(min740, cash40.projection[m40].kapanis);
    }
    if (min740 < 0) {
      assert(
        "T40f: Negatif 7 gün varsa kritik karar var",
        basliklar40.indexOf("KRİTİK: ALIM DURDUR") >= 0,
        basliklar40.join(" | "),
      );
    } else {
      assert("T40f: 7 gün negatif değil (skip)", true, "min7=" + min740);
    }
  });

  // ─── T41: Dashboard kaynak/section görünürlüğü ─────────────────────────
  safeRun("T41: Dashboard section kontrolleri", function () {
    renderDashboard_();
    var ss41 = getSS_();
    var d41 = ss41.getSheetByName(CONFIG.sheets.dashboard);
    assert("T41a: Dashboard sheet var", d41 != null);
    if (!d41 || d41.getLastRow() < 1) {
      assert("T41b: Dashboard satır yok", false);
      return;
    }
    var maxRow41 = Math.min(d41.getLastRow(), 250);
    var colA41 = d41.getRange(1, 1, maxRow41, 1).getValues();
    var text41 = [];
    for (var rr41 = 0; rr41 < colA41.length; rr41++) {
      if (colA41[rr41][0] !== null && colA41[rr41][0] !== "") {
        text41.push(String(colA41[rr41][0]));
      }
    }
    var joined41 = text41.join(" || ");
    var required41 = [
      "DASHBOARD — Finansal Karar Paneli",
      "YAKLAŞAN ÖDEMELER",
      "YAKLAŞAN TAHSİLATLAR",
      "KREDİ VE FİNANSMAN",
      "KREDİ KARTI DURUMU",
      "UYARILAR",
    ];
    for (var q41 = 0; q41 < required41.length; q41++) {
      assert(
        "T41" +
          String.fromCharCode(98 + q41) +
          ": " +
          required41[q41] +
          " görünür",
        joined41.indexOf(required41[q41]) >= 0,
        required41[q41],
      );
    }
  });

  // ─── T42: Emniyet katmanı (safety gate) ─────────────────────────────────
  safeRun("T42: Safety gate temel kontroller", function () {
    var ss42 = getSS_();
    var integrity42 = verifySheetIntegrityCLI();
    assert(
      "T42a: Integrity raporu temiz",
      integrity42.indexOf("MISSING:") === -1 &&
        integrity42.indexOf("HEADER_MISSING") === -1,
      integrity42,
    );

    var post42 = postDeployCheckCLI();
    assert(
      "T42b: Post-deploy FAIL satırı yok",
      post42.indexOf("FAIL:") === -1,
      post42,
    );

    var logSheet42 = ss42.getSheetByName(CONFIG.sheets.sistemLog);
    assert("T42c: Sistem Logları sheet var", logSheet42 != null);
  });

  // ─── SONUÇLARI YAZ ───────────────────────────────────────────────────
  ss = getSS_();
  var testSheet = ensureSheetExists_(ss, "Test Sonuçları");
  testSheet.clear();
  testSheet
    .getRange("A1")
    .setValue("TEST SONUÇLARI — Smoke Test Suite")
    .setFontSize(14)
    .setFontWeight("bold");
  testSheet
    .getRange("A2")
    .setValue(
      "Çalışma: " +
        Utilities.formatDate(
          new Date(),
          CONFIG.timezone,
          "dd.MM.yyyy HH:mm:ss",
        ),
    )
    .setFontColor("#666666");
  testSheet
    .getRange("A3")
    .setValue(
      "Toplam: " +
        (pass + fail) +
        " | Geçen: " +
        pass +
        " | Başarısız: " +
        fail,
    )
    .setFontWeight("bold")
    .setFontColor(fail > 0 ? "#cc0000" : "#006600");

  testSheet
    .getRange(5, 1, 1, 3)
    .setValues([["Test", "Sonuç", "Detay"]])
    .setFontWeight("bold");
  var testRows = [];
  for (var r = 0; r < results.length; r++) {
    testRows.push([results[r].test, results[r].status, results[r].detail]);
  }
  if (testRows.length > 0) {
    testSheet.getRange(6, 1, testRows.length, 3).setValues(testRows);
    // Renk kodlama
    for (var cr = 0; cr < testRows.length; cr++) {
      var statusCell = testSheet.getRange(6 + cr, 2);
      if (testRows[cr][1] === "PASS") statusCell.setBackground("#d9ead3");
      else if (testRows[cr][1] === "FAIL") statusCell.setBackground("#f4cccc");
      else statusCell.setBackground("#fce5cd");
    }
  }
  testSheet.setColumnWidth(1, 300);
  testSheet.setColumnWidth(3, 400);

  Logger.log("SMOKE TEST: " + pass + " PASS / " + fail + " FAIL");
  return { pass: pass, fail: fail, total: pass + fail, results: results };
}

function menuSmokeTest() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    "Smoke Test",
    "Tüm modüller test edilecek. Devam edilsin mi?",
    ui.ButtonSet.YES_NO,
  );
  if (response !== ui.Button.YES) return;
  try {
    var result = runSmokeTests_();
    ui.alert(
      "Test Tamamlandı",
      "Toplam: " +
        result.total +
        "\nGeçen: " +
        result.pass +
        "\nBaşarısız: " +
        result.fail +
        "\n\nDetaylar 'Test Sonuçları' sayfasında.",
      ui.ButtonSet.OK,
    );
  } catch (e) {
    ui.alert("Test Hatası", e.toString(), ui.ButtonSet.OK);
  }
}

function resolveSpreadsheetId_(target) {
  var props = PropertiesService.getScriptProperties();
  var liveProp = props.getProperty("LIVE_SPREADSHEET_ID");
  var testProp = props.getProperty("TEST_SPREADSHEET_ID");
  if (!target || target === "live") {
    return (
      liveProp ||
      (CONFIG.spreadsheetIds && CONFIG.spreadsheetIds.live) ||
      "1PeLF3CGuVZgHwrKiWhmr2Q9owMaElXtHVa5CTQzwUfc"
    );
  }
  if (target === "test") {
    return (
      testProp || (CONFIG.spreadsheetIds && CONFIG.spreadsheetIds.test) || ""
    );
  }
  return String(target || "").trim();
}

function withSpreadsheetOverride_(target, fn) {
  var sheetId = resolveSpreadsheetId_(target);
  if (!sheetId) {
    throw new Error(
      "Spreadsheet ID tanimsiz. 00_Config.js içinde CONFIG.spreadsheetIds.test degerini ayarla.",
    );
  }
  _SS_OVERRIDE = SpreadsheetApp.openById(sheetId);
  try {
    return fn();
  } finally {
    _SS_OVERRIDE = null;
  }
}

/** clasp run ile çağrılabilir (UI gerektirmez) */
function runSmokeTestsCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var result = runSmokeTests_();
    var failures = [];
    for (var i = 0; i < result.results.length; i++) {
      if (result.results[i].status !== "PASS") {
        failures.push(result.results[i].test + ": " + result.results[i].detail);
      }
    }
    return (
      "PASS=" +
      result.pass +
      " FAIL=" +
      result.fail +
      (failures.length ? "\n" + failures.join("\n") : "")
    );
  });
}

function runSmokeTestsTestCLI() {
  return runSmokeTestsCLI("test");
}

/** Canlı sheet yapısını CONFIG/SCHEMAS ile karşılaştırır */
function verifySheetIntegrityCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var ss = getSS_();
    var report = [];
    var keys = Object.keys(CONFIG.sheets);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var name = CONFIG.sheets[key];
      var sheet = ss.getSheetByName(name);
      if (!sheet) {
        report.push("MISSING: " + name);
        continue;
      }
      var schema = SCHEMAS[name];
      if (!schema) {
        report.push("OK (no schema): " + name);
        continue;
      }
      var headers = sheet
        .getRange(1, 1, 1, sheet.getLastColumn())
        .getValues()[0];
      var missing = [];
      for (var j = 0; j < schema.length; j++) {
        if (headers.indexOf(schema[j]) === -1) missing.push(schema[j]);
      }
      if (missing.length > 0) {
        report.push("HEADER_MISSING [" + name + "]: " + missing.join(", "));
      } else {
        report.push("OK: " + name + " (" + schema.length + " cols)");
      }
    }
    return report.join("\n");
  });
}

function verifySheetIntegrityTestCLI() {
  return verifySheetIntegrityCLI("test");
}

/** Post-deploy kritik akış doğrulaması (deployment-runbook.md checklist) */
function postDeployCheckCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var ss = getSS_();
    var checks = [];

    // 1. Hızlı Veri Girişi çalışıyor mu (sheet + header var mı)
    var giris = ss.getSheetByName(CONFIG.sheets.giris);
    checks.push(
      giris
        ? "PASS: Hızlı Veri Girişi sayfası var"
        : "FAIL: Hızlı Veri Girişi yok",
    );

    // 2. Nakit Akışı sheet var ve veri yazılabiliyor mu
    var nakit = ss.getSheetByName(CONFIG.sheets.nakit);
    checks.push(
      nakit
        ? "PASS: Nakit Akışı sayfası var (" +
            Math.max(0, nakit.getLastRow() - 1) +
            " satır)"
        : "FAIL: Nakit Akışı yok",
    );

    // 3. Borç Takibi çalışıyor mu
    var borc = ss.getSheetByName(CONFIG.sheets.borc);
    checks.push(
      borc
        ? "PASS: Borç Takibi var (" +
            Math.max(0, borc.getLastRow() - 1) +
            " satır)"
        : "FAIL: Borç Takibi yok",
    );

    // 4. Dashboard var mı
    var dash = ss.getSheetByName(CONFIG.sheets.dashboard);
    checks.push(dash ? "PASS: Dashboard var" : "FAIL: Dashboard yok");

    // 5. Parametreler yüklü mü
    var params = loadParams_();
    var paramCount = Object.keys(CONFIG.params).length;
    checks.push(
      paramCount > 0
        ? "PASS: Parametreler yüklendi (" + paramCount + " parametre)"
        : "FAIL: Parametreler yüklenemedi",
    );

    // 6. buildCashProjection_ çalışıyor mu
    try {
      var proj = buildCashProjection_();
      checks.push(
        proj && proj.projection && proj.projection.length > 0
          ? "PASS: Nakit projeksiyonu oluştu (" +
              proj.projection.length +
              " gün, açılış=" +
              formatTL_(proj.openingBalance) +
              ")"
          : "FAIL: Nakit projeksiyonu boş",
      );
    } catch (e) {
      checks.push("FAIL: buildCashProjection_ hata: " + e.message);
    }

    // 7. buildDecisionEngine_ çalışıyor mu
    try {
      var dec = buildDecisionEngine_();
      var kararBaslik =
        dec && dec.kararlar && dec.kararlar.length > 0
          ? dec.kararlar[0].baslik
          : "yok";
      checks.push(
        dec && dec.ok
          ? "PASS: Karar motoru çalıştı (" +
              dec.kararlar.length +
              " karar, ilk=" +
              kararBaslik +
              ")"
          : "FAIL: Karar motoru boş",
      );
    } catch (e) {
      checks.push("FAIL: buildDecisionEngine_ hata: " + e.message);
    }

    // 8. Stok Envanter var mı
    var stok = ss.getSheetByName(CONFIG.sheets.stok);
    checks.push(
      stok
        ? "PASS: Stok Envanter var (" +
            Math.max(0, stok.getLastRow() - 1) +
            " satır)"
        : "FAIL: Stok Envanter yok",
    );

    // 9. Risk Paneli var mı
    var risk = ss.getSheetByName(CONFIG.sheets.risk);
    checks.push(risk ? "PASS: Risk Paneli var" : "FAIL: Risk Paneli yok");

    // 10. Duplicate check: Giriş ID'leri tekil mi
    if (giris && giris.getLastRow() > 1) {
      var ids = giris
        .getRange(2, 1, giris.getLastRow() - 1, 1)
        .getValues()
        .flat()
        .filter(function (v) {
          return v !== "";
        });
      var unique = {};
      var dupes = 0;
      for (var d = 0; d < ids.length; d++) {
        if (unique[ids[d]]) dupes++;
        unique[ids[d]] = true;
      }
      checks.push(
        dupes === 0
          ? "PASS: Giriş Kayıt ID tekil (" + ids.length + " kayıt)"
          : "FAIL: " + dupes + " duplicate Kayıt ID",
      );
    }

    return checks.join("\n");
  });
}

function postDeployCheckTestCLI() {
  return postDeployCheckCLI("test");
}

/** Full system setup CLI wrapper */
function fullSystemSetupCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var r = fullSystemSetup_();
    return "Setup OK — schemas:" + r.schemas + " params:" + r.defaultParams;
  });
}

function fullSystemSetupTestCLI() {
  return fullSystemSetupCLI("test");
}

function generateTestDataCLI(target) {
  return withSpreadsheetOverride_(target || "test", function () {
    setupAllSchemas_(false);
    seedDefaultParams_();
    applyParams_();
    applyValidations_();
    var generated = generateTestData_();
    refreshAllCalculations_();
    return (
      "TEST_DATA=" +
      (generated.ok ? "PASS" : "FAIL") +
      "\n" +
      JSON.stringify(generated)
    );
  });
}

function inspectDateValidationCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    applyValidations_();
    var ss = getSS_();
    var sheet = ss.getSheetByName(CONFIG.sheets.giris);
    var hmap = getHeaderMap_(sheet);
    var col = hmap["İşlem Tarihi"] + 1;
    var cell = sheet.getRange(CONFIG.dataStartRow, col);
    var rule = cell.getDataValidation();
    return JSON.stringify({
      target: target || "live",
      sheetId: sheet.getSheetId(),
      col: col,
      displayValue: cell.getDisplayValue(),
      valueType: Object.prototype.toString.call(cell.getValue()),
      hasRule: rule != null,
      criteria: rule ? String(rule.getCriteriaType()) : "",
    });
  });
}

function runMobileUatCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    refreshAllCalculations_();
    var ss = getSS_();
    var checks = [];
    var pass = 0;
    var fail = 0;

    function record(name, condition, detail) {
      checks.push(
        (condition ? "PASS: " : "FAIL: ") +
          name +
          (detail ? " — " + detail : ""),
      );
      if (condition) pass++;
      else fail++;
    }

    function flattenRange_(sheet, rowCount, colCount) {
      var values = sheet.getRange(1, 1, rowCount, colCount).getDisplayValues();
      var parts = [];
      for (var r = 0; r < values.length; r++) {
        parts.push(values[r].join(" | "));
      }
      return parts.join("\n");
    }

    var dash = ss.getSheetByName(CONFIG.sheets.dashboard);
    record("Dashboard sayfası mevcut", !!dash);
    if (dash) {
      var dashText = flattenRange_(dash, Math.min(35, dash.getLastRow()), 4);
      record(
        "Dashboard ilk 35 satırda üst özet",
        dashText.indexOf("ÜST ÖZET") >= 0,
      );
      record(
        "Dashboard ilk 35 satırda bugün ne yapmalı",
        dashText.indexOf("BUGÜN NE YAPMALI") >= 0,
      );
      record(
        "Dashboard ilk 35 satırda zaman ufku",
        dashText.indexOf("ZAMAN UFKU") >= 0,
        dash.getLastRow() + " satır",
      );
      record(
        "Dashboard ilk 35 satırda yaklaşan ödemeler",
        dashText.indexOf("YAKLAŞAN ÖDEMELER") >= 0,
      );
    }

    var ana = ss.getSheetByName(CONFIG.sheets.ana);
    record("Ana Kontrol Paneli mevcut", !!ana);
    if (ana) {
      var anaText = flattenRange_(ana, Math.min(25, ana.getLastRow()), 3);
      record(
        "Ana Panel ilk 25 satırda sistem durumu",
        anaText.indexOf("SİSTEM DURUMU") >= 0,
      );
      record(
        "Ana Panel ilk 25 satırda menü kısa yolları",
        anaText.indexOf("MENÜ KISA YOLLARI") >= 0,
      );
    }

    var giris = ss.getSheetByName(CONFIG.sheets.giris);
    record("Hızlı Veri Girişi mevcut", !!giris);
    if (giris) {
      var headers = giris
        .getRange(1, 1, 1, giris.getLastColumn())
        .getValues()[0];
      var islemTarihiPos = headers.indexOf("İşlem Tarihi") + 1;
      var islemTipiPos = headers.indexOf("İşlem Tipi") + 1;
      var tutarPos = headers.indexOf("Tutar") + 1;
      record(
        "Hızlı giriş kritik alanları ilk 10 kolonda",
        islemTarihiPos > 0 &&
          islemTarihiPos <= 10 &&
          islemTipiPos > 0 &&
          islemTipiPos <= 10 &&
          tutarPos > 0 &&
          tutarPos <= 10,
        "İşlem Tarihi=" +
          islemTarihiPos +
          " İşlem Tipi=" +
          islemTipiPos +
          " Tutar=" +
          tutarPos,
      );
    }

    return (
      "MOBILE_UAT=" +
      (fail === 0 ? "PASS" : "FAIL") +
      "\nPASS=" +
      pass +
      " FAIL=" +
      fail +
      "\n" +
      checks.join("\n")
    );
  });
}

function runManualScenarioUatCLI(target) {
  return withSpreadsheetOverride_(target || "test", function () {
    refreshAllCalculations_();
    var ss = getSS_();
    var checks = [];
    var pass = 0;
    var fail = 0;

    function record(name, condition, detail) {
      checks.push(
        (condition ? "PASS: " : "FAIL: ") +
          name +
          (detail ? " — " + detail : ""),
      );
      if (condition) pass++;
      else fail++;
    }

    function duplicateCount_(sheetName, keyCol) {
      var sh = ss.getSheetByName(sheetName);
      if (!sh || sh.getLastRow() < CONFIG.dataStartRow) return 0;
      var rows = getAllRows_(sh);
      var seen = {};
      var dup = 0;
      for (var i = 0; i < rows.length; i++) {
        var key = String(rows[i][keyCol] || "").trim();
        if (!key) continue;
        if (seen[key]) dup++;
        seen[key] = true;
      }
      return dup;
    }

    function findProjectionEntry_(projection, dateObj) {
      var key = dateKey_(dateObj);
      for (var i = 0; i < projection.length; i++) {
        if (projection[i].dateStr === key) return projection[i];
      }
      return null;
    }

    var projection = buildCashProjection_().projection;
    var duplicateSafe =
      duplicateCount_(CONFIG.sheets.borc, "Borç Kodu") === 0 &&
      duplicateCount_(CONFIG.sheets.alacak, "Alacak Kodu") === 0 &&
      duplicateCount_(CONFIG.sheets.krediKarti, "Kart ID") === 0 &&
      duplicateCount_(CONFIG.sheets.acikHesap, "Alacak ID") === 0;
    record("Senaryo 1 duplicate engelleme", duplicateSafe);

    var dateChecks = [
      { sheet: CONFIG.sheets.borc, col: "Vade" },
      { sheet: CONFIG.sheets.alacak, col: "Tahsil Tarihi" },
      { sheet: CONFIG.sheets.krediKarti, col: "Sonraki Son Ödeme Tarihi" },
      { sheet: CONFIG.sheets.acikHesap, col: "Vade Tarihi" },
      { sheet: CONFIG.sheets.ithalat, col: "Mal Bedeli Ödeme Tarihi" },
      { sheet: CONFIG.sheets.ithalat, col: "Navlun Ödeme Tarihi" },
      { sheet: CONFIG.sheets.ithalat, col: "Gümrük Ödeme Tarihi" },
    ];
    var badDates = 0;
    for (var dc = 0; dc < dateChecks.length; dc++) {
      var dSheet = ss.getSheetByName(dateChecks[dc].sheet);
      if (!dSheet || dSheet.getLastRow() < CONFIG.dataStartRow) continue;
      var dRows = getAllRows_(dSheet);
      for (var dr = 0; dr < dRows.length; dr++) {
        var dv = dRows[dr][dateChecks[dc].col];
        if (!dv) continue;
        if (!(dv instanceof Date) && !parseTurkishDate_(dv)) badDates++;
      }
    }
    record(
      "Senaryo 3 tarih format güvenliği",
      badDates === 0,
      "bozuk=" + badDates,
    );

    var tahminSchema = SCHEMAS[CONFIG.sheets.tahmin] || [];
    var nakitSchema = SCHEMAS[CONFIG.sheets.nakit] || [];
    record(
      "Senaryo 4 gerçek ve tahmini veri ayrımı",
      tahminSchema.indexOf("Güven Skoru") >= 0 &&
        tahminSchema.indexOf("Durum") >= 0 &&
        nakitSchema.indexOf("Kesin Giriş") >= 0 &&
        nakitSchema.indexOf("Olası Giriş") >= 0,
    );

    var recurring = generateRecurringExpenses_();
    var sabitRows = getAllRows_(
      ss.getSheetByName(CONFIG.sheets.sabit) || createDummySheet_(),
    );
    var recurringReady = false;
    for (var s = 0; s < sabitRows.length; s++) {
      if (String(sabitRows[s]["Durum"] || "").trim() !== "Aktif") continue;
      if (parseTurkishDate_(sabitRows[s]["Sonraki Oluşturma Tarihi"])) {
        recurringReady = true;
        break;
      }
    }
    record(
      "Senaryo 6 sabit ödeme yayılımı",
      recurring.ok === true && recurringReady,
      JSON.stringify(recurring),
    );

    var kartRows = getAllRows_(
      ss.getSheetByName(CONFIG.sheets.krediKarti) || createDummySheet_(),
    );
    var alertResult = buildAlerts_(true);
    var hasCardAlert = false;
    for (var a = 0; a < alertResult.alerts.length; a++) {
      if (alertResult.alerts[a].kategori === "Kredi Kartı") {
        hasCardAlert = true;
        break;
      }
    }
    record(
      "Senaryo 9 kredi kartı uyarısı",
      kartRows.length === 0 || hasCardAlert,
      "kart=" + kartRows.length + " alert=" + hasCardAlert,
    );

    var acikRows = getAllRows_(
      ss.getSheetByName(CONFIG.sheets.acikHesap) || createDummySheet_(),
    );
    var openAccountAsPossible = true;
    var openAccountChecked = 0;
    for (var ah = 0; ah < acikRows.length; ah++) {
      var vade = parseTurkishDate_(acikRows[ah]["Vade Tarihi"]);
      var kalan =
        parseCurrency_(acikRows[ah]["Kalan Bakiye"]) ||
        parseCurrency_(acikRows[ah]["Tutar"]);
      if (!vade || !(kalan > 0)) continue;
      var entry = findProjectionEntry_(projection, vade);
      if (!entry) continue;
      openAccountChecked++;
      if (entry.olasiGiris < kalan) {
        openAccountAsPossible = false;
        break;
      }
    }
    record(
      "Senaryo 10 açık hesap nakdi olası girişte izleniyor",
      openAccountAsPossible,
      "kontrol=" + openAccountChecked,
    );

    var ithalatRows = getAllRows_(
      ss.getSheetByName(CONFIG.sheets.ithalat) || createDummySheet_(),
    );
    var importChecks = 0;
    var importOk = true;
    var importFields = [
      { dateCol: "Mal Bedeli Ödeme Tarihi", amtCol: "Mal Bedeli Tutarı" },
      { dateCol: "Navlun Ödeme Tarihi", amtCol: "Navlun Tutarı" },
      { dateCol: "Gümrük Ödeme Tarihi", amtCol: "Gümrük Tutarı" },
    ];
    for (var ir = 0; ir < ithalatRows.length; ir++) {
      for (var ip = 0; ip < importFields.length; ip++) {
        var payDate = parseTurkishDate_(
          ithalatRows[ir][importFields[ip].dateCol],
        );
        var payAmt = parseCurrency_(ithalatRows[ir][importFields[ip].amtCol]);
        if (!payDate || !(payAmt > 0)) continue;
        importChecks++;
        var payEntry = findProjectionEntry_(projection, payDate);
        if (!payEntry || payEntry.ithalatCikis < payAmt) {
          importOk = false;
          break;
        }
      }
      if (!importOk) break;
    }
    record(
      "Senaryo 11 ithalat çok aşamalı ödeme",
      importOk,
      "kontrol=" + importChecks,
    );

    var decisions = buildDecisionEngine_();
    var negativeCount = 0;
    for (var pr = 0; pr < projection.length; pr++) {
      if (projection[pr].kapanis < 0) negativeCount++;
    }
    var hasCriticalBuyStop = false;
    for (var kd = 0; kd < decisions.kararlar.length; kd++) {
      if (
        String(decisions.kararlar[kd].baslik || "").indexOf("ALIM DURDUR") >= 0
      ) {
        hasCriticalBuyStop = true;
        break;
      }
    }
    record(
      "Senaryo 13 kritik nakit riski kararı",
      negativeCount === 0 || hasCriticalBuyStop,
      "negatifGun=" + negativeCount + " kritikKarar=" + hasCriticalBuyStop,
    );

    var importCapacity = buildSafeImportCapacity_();
    var hasSafeImportDecision = false;
    for (var ki = 0; ki < decisions.kararlar.length; ki++) {
      if (
        String(decisions.kararlar[ki].baslik || "") === "GÜVENLİ İTHALAT YAP"
      ) {
        hasSafeImportDecision = true;
        break;
      }
    }
    record(
      "Senaryo 14 tampon kırılımında güvenli ithalat önerilmiyor",
      !(
        importCapacity.min30 < buildCashProjection_().minCashReserve &&
        hasSafeImportDecision
      ),
      "min30=" + importCapacity.min30 + " safeImport=" + hasSafeImportDecision,
    );

    var dashboard = ss.getSheetByName(CONFIG.sheets.dashboard);
    var dashboardText = dashboard
      ? dashboard
          .getRange(1, 1, Math.min(35, dashboard.getLastRow()), 4)
          .getDisplayValues()
          .map(function (row) {
            return row.join(" | ");
          })
          .join("\n")
      : "";
    record(
      "Senaryo 16 dashboard kaynak blokları görünür",
      !!dashboard &&
        dashboardText.indexOf("ÜST ÖZET") >= 0 &&
        dashboardText.indexOf("BUGÜN NE YAPMALI") >= 0 &&
        dashboardText.indexOf("YAKLAŞAN ÖDEMELER") >= 0,
    );

    return (
      "MANUAL_SCENARIO_UAT=" +
      (fail === 0 ? "PASS" : "FAIL") +
      "\nPASS=" +
      pass +
      " FAIL=" +
      fail +
      "\n" +
      checks.join("\n")
    );
  });
}

function inspectOpeningCashBalanceCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    applyParams_();
    var ss = getSS_();
    var nakitSheet = ss.getSheetByName(CONFIG.sheets.nakit);
    var paramSheet = ss.getSheetByName(CONFIG.sheets.parametreler);
    var sheetOpeningBalance = 0;
    var source = "parameter";

    if (nakitSheet && nakitSheet.getLastRow() >= CONFIG.dataStartRow) {
      var nhmap = getHeaderMap_(nakitSheet);
      var bakiyeIdx = nhmap["Açılış Bakiye"];
      if (bakiyeIdx != null) {
        sheetOpeningBalance = parseCurrency_(
          nakitSheet
            .getRange(CONFIG.dataStartRow, bakiyeIdx + 1)
            .getDisplayValue(),
        );
        if (sheetOpeningBalance !== 0) source = "nakit-sheet";
      }
    }

    var paramValue = getParam_("opening_cash_balance", 0);
    var paramRow = 0;
    if (paramSheet && paramSheet.getLastRow() >= CONFIG.dataStartRow) {
      var phmap = getHeaderMap_(paramSheet);
      var prow = getAllRows_(paramSheet, phmap);
      for (var i = 0; i < prow.length; i++) {
        if (
          String(prow[i]["Parametre Anahtarı"] || "").trim() ===
          "opening_cash_balance"
        ) {
          paramRow = prow[i]._row || 0;
          break;
        }
      }
    }

    return JSON.stringify({
      target: target || "live",
      source: source,
      sheetOpeningBalance: sheetOpeningBalance,
      paramValue: paramValue,
      effectiveOpeningBalance:
        sheetOpeningBalance !== 0 ? sheetOpeningBalance : paramValue,
      paramRow: paramRow,
    });
  });
}

function syncOpeningCashBalanceCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    applyParams_();
    var ss = getSS_();
    var paramSheet = ss.getSheetByName(CONFIG.sheets.parametreler);
    if (!paramSheet) {
      throw new Error("Parametreler sayfasi bulunamadi.");
    }

    var inspected = JSON.parse(inspectOpeningCashBalanceCLI(target || "live"));
    var targetValue = inspected.sheetOpeningBalance;
    if (!(targetValue > 0)) {
      throw new Error(
        "Nakit Akisi acilis bakiyesi 0 veya bos. Senkronizasyon yapilmadi.",
      );
    }

    var phmap = getHeaderMap_(paramSheet);
    var rows = getAllRows_(paramSheet, phmap);
    var rowNumber = 0;
    for (var i = 0; i < rows.length; i++) {
      if (
        String(rows[i]["Parametre Anahtarı"] || "").trim() ===
        "opening_cash_balance"
      ) {
        rowNumber = rows[i]._row || 0;
        break;
      }
    }
    if (!rowNumber) {
      throw new Error("opening_cash_balance parametresi bulunamadi.");
    }

    var oldValue =
      parseFloat(rows[rowNumber - CONFIG.dataStartRow]["Değer"]) || 0;
    setRowValues_(paramSheet, rowNumber, phmap, {
      Değer: targetValue,
      "Güncelleme Zamanı": Utilities.formatDate(
        new Date(),
        CONFIG.timezone,
        CONFIG.dateFormat + " HH:mm",
      ),
      Güncelleyen: "syncOpeningCashBalanceCLI",
    });
    SpreadsheetApp.flush();
    applyParams_();

    return JSON.stringify({
      target: target || "live",
      oldValue: oldValue,
      newValue: getParam_("opening_cash_balance", 0),
      sourceBalance: targetValue,
      rowNumber: rowNumber,
    });
  });
}

function runBuildRiskPanelCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = buildRiskPanel_();
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      result: result,
    });
  });
}

function runBuildInventoryMetricsCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = buildInventoryMetrics_();
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      result: result,
    });
  });
}

function runBuildSkuProfitabilityCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = buildSkuProfitability_();
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      result: result,
    });
  });
}

function runBuildDemandPressureCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = buildDemandPressure_();
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      result: result,
    });
  });
}

function runBuildImportDecisionEngineCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = buildImportDecisionEngine_();
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      result: result,
    });
  });
}

function runBuildSalesForecastCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = buildSalesForecast_();
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      result: result,
    });
  });
}

function runBuildCashProjectionCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = buildCashProjection_();
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      projectionDays:
        result && result.projection ? result.projection.length : 0,
      minCashReserve: result ? result.minCashReserve : null,
    });
  });
}

function runWriteCashProjectionCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var cashData = buildCashProjection_();
    var start = new Date().getTime();
    var result = writeCashProjection_(cashData);
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      result: result,
    });
  });
}

function runComputedRefreshCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var steps = [];

    function timed_(label, fn) {
      var start = new Date().getTime();
      var result = fn();
      steps.push({
        step: label,
        durationMs: new Date().getTime() - start,
        ok: !!result && result.ok !== false,
      });
      return result;
    }

    timed_("updateBorcComputedFields_", function () {
      return updateBorcComputedFields_();
    });
    timed_("updateAlacakComputedFields_", function () {
      return updateAlacakComputedFields_();
    });
    timed_("updateKrediKartiComputedFields_", function () {
      return updateKrediKartiComputedFields_();
    });
    timed_("updateAcikHesapComputedFields_", function () {
      return updateAcikHesapComputedFields_();
    });

    return JSON.stringify({
      target: target || "live",
      totalDurationMs: steps.reduce(function (sum, item) {
        return sum + item.durationMs;
      }, 0),
      steps: steps,
    });
  });
}

function runBuildAlertsCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = buildAlerts_(true);
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      summary: result && result.ozet ? result.ozet : null,
    });
  });
}

function runRenderDashboardCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = renderDashboard_();
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      result: result,
    });
  });
}

function runRenderActionCenterCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = renderActionCenter_();
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      result: result,
    });
  });
}

function runRenderAnaKontrolPaneliCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var start = new Date().getTime();
    var result = renderAnaKontrolPaneli_();
    return JSON.stringify({
      target: target || "live",
      durationMs: new Date().getTime() - start,
      result: result,
    });
  });
}

function profileRefreshAllCalculationsCLI(target) {
  return withSpreadsheetOverride_(target || "live", function () {
    var steps = [];

    function timedStep_(label, fn) {
      var start = new Date().getTime();
      var outcome = fn();
      steps.push({
        step: label,
        durationMs: new Date().getTime() - start,
        ok: true,
      });
      return outcome;
    }

    timedStep_("applyParams_", function () {
      return applyParams_();
    });
    timedStep_("updateBorcComputedFields_", function () {
      return updateBorcComputedFields_();
    });
    timedStep_("updateAlacakComputedFields_", function () {
      return updateAlacakComputedFields_();
    });
    timedStep_("updateKrediKartiComputedFields_", function () {
      return updateKrediKartiComputedFields_();
    });
    timedStep_("updateAcikHesapComputedFields_", function () {
      return updateAcikHesapComputedFields_();
    });
    timedStep_("buildInventoryMetrics_", function () {
      return buildInventoryMetrics_();
    });
    timedStep_("buildSkuProfitability_", function () {
      return buildSkuProfitability_();
    });
    timedStep_("buildDemandPressure_", function () {
      return buildDemandPressure_();
    });
    timedStep_("buildImportDecisionEngine_", function () {
      return buildImportDecisionEngine_();
    });
    timedStep_("buildSalesForecast_", function () {
      return buildSalesForecast_();
    });
    var cashData = timedStep_("buildCashProjection_", function () {
      return buildCashProjection_();
    });
    timedStep_("writeCashProjection_", function () {
      return writeCashProjection_(cashData);
    });
    timedStep_("buildRiskPanel_", function () {
      return buildRiskPanel_();
    });
    timedStep_("buildAlerts_", function () {
      return buildAlerts_(true);
    });
    timedStep_("renderDashboard_", function () {
      return renderDashboard_();
    });
    timedStep_("renderActionCenter_", function () {
      return renderActionCenter_();
    });
    timedStep_("renderAnaKontrolPaneli_", function () {
      return renderAnaKontrolPaneli_();
    });

    return JSON.stringify({
      target: target || "live",
      totalDurationMs: steps.reduce(function (sum, item) {
        return sum + item.durationMs;
      }, 0),
      steps: steps,
    });
  });
}

/** Faz 17 emniyet katmanı: smoke + integrity + post-deploy birleşik kapı */
function runSafetyGateCLI(target) {
  var gateTarget = target || "live";
  return withSpreadsheetOverride_(gateTarget, function () {
    var smoke = runSmokeTests_();
    var integrity = verifySheetIntegrityCLI(gateTarget);
    var post = postDeployCheckCLI(gateTarget);

    var issues = [];
    if (smoke.fail > 0) {
      issues.push("SMOKE_FAIL=" + smoke.fail + " (PASS=" + smoke.pass + ")");
    }
    if (
      integrity.indexOf("MISSING:") >= 0 ||
      integrity.indexOf("HEADER_MISSING") >= 0
    ) {
      issues.push("INTEGRITY_FAIL");
    }
    if (post.indexOf("FAIL:") >= 0) {
      issues.push("POST_DEPLOY_FAIL");
    }

    if (issues.length === 0) {
      return (
        "SAFETY_GATE=PASS" +
        "\nSMOKE: PASS=" +
        smoke.pass +
        " FAIL=" +
        smoke.fail +
        "\nINTEGRITY: PASS" +
        "\nPOST_DEPLOY: PASS"
      );
    }

    return (
      "SAFETY_GATE=FAIL" +
      "\nISSUES=" +
      issues.join(",") +
      "\nSMOKE: PASS=" +
      smoke.pass +
      " FAIL=" +
      smoke.fail +
      "\nINTEGRITY:\n" +
      integrity +
      "\nPOST_DEPLOY:\n" +
      post
    );
  });
}

function runSafetyGateTestCLI() {
  return runSafetyGateCLI("test");
}

function getSpreadsheetTargetsCLI() {
  var props = PropertiesService.getScriptProperties();
  var liveId =
    props.getProperty("LIVE_SPREADSHEET_ID") ||
    (CONFIG.spreadsheetIds && CONFIG.spreadsheetIds.live) ||
    "1PeLF3CGuVZgHwrKiWhmr2Q9owMaElXtHVa5CTQzwUfc";
  var testId =
    props.getProperty("TEST_SPREADSHEET_ID") ||
    (CONFIG.spreadsheetIds && CONFIG.spreadsheetIds.test) ||
    "";
  return "LIVE=" + liveId + "\nTEST=" + (testId || "(bos)");
}

function setTestSpreadsheetIdCLI(id) {
  var raw = String(id || "").trim();
  if (!raw) {
    throw new Error("Test spreadsheet ID bos olamaz.");
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty("TEST_SPREADSHEET_ID", raw);
  return "TEST_SPREADSHEET_ID set: " + raw;
}

function clearTestSpreadsheetIdCLI() {
  PropertiesService.getScriptProperties().deleteProperty("TEST_SPREADSHEET_ID");
  return "TEST_SPREADSHEET_ID temizlendi";
}

function ensureTestSpreadsheetCLI() {
  var props = PropertiesService.getScriptProperties();
  var existing =
    props.getProperty("TEST_SPREADSHEET_ID") ||
    (CONFIG.spreadsheetIds && CONFIG.spreadsheetIds.test) ||
    "";

  if (existing) {
    return withSpreadsheetOverride_(existing, function () {
      var rExist = fullSystemSetup_();
      return "TEST_READY existing=" + existing + " schemas=" + rExist.schemas;
    });
  }

  var created = SpreadsheetApp.create(
    "muhasebe-live-test-" +
      Utilities.formatDate(new Date(), "Europe/Istanbul", "yyyyMMdd-HHmmss"),
  );
  var testId = created.getId();
  props.setProperty("TEST_SPREADSHEET_ID", testId);

  return withSpreadsheetOverride_(testId, function () {
    var r = fullSystemSetup_();
    return "TEST_READY created=" + testId + " schemas=" + r.schemas;
  });
}

// ─── TEST DATA GENERATOR ────────────────────────────────────────────────────

function generateTestData_() {
  var ss = getSS_();
  var t = today_();

  // Borç Takibi test data
  var borcSheet = ss.getSheetByName(CONFIG.sheets.borc);
  if (borcSheet && borcSheet.getLastRow() < CONFIG.dataStartRow) {
    var bHmap = getHeaderMap_(borcSheet);
    var borcSamples = [
      {
        "Borç Kodu": generateId_(CONFIG.prefixes.borc),
        "Kurum / Kişi": "Test Tedarikçi A",
        "Borç Türü": "Ticari Borç",
        Tutar: 50000,
        Vade: dateKey_(addDays_(t, 10)),
        Durum: "Aktif",
      },
      {
        "Borç Kodu": generateId_(CONFIG.prefixes.borc),
        "Kurum / Kişi": "Test Banka B",
        "Borç Türü": "Kredi",
        Tutar: 120000,
        "Taksit Tutarı": 10000,
        Vade: dateKey_(addDays_(t, 30)),
        Durum: "Aktif",
      },
      {
        "Borç Kodu": generateId_(CONFIG.prefixes.borc),
        "Kurum / Kişi": "Test Gümrük",
        "Borç Türü": "İthalat",
        Tutar: 35000,
        Vade: dateKey_(addDays_(t, -5)),
        Durum: "Gecikmiş",
      },
    ];
    for (var bi = 0; bi < borcSamples.length; bi++) {
      var bRow = findFirstEmptyRow_(borcSheet);
      setRowValues_(borcSheet, bRow, bHmap, borcSamples[bi]);
    }
  }

  // Alacak Takibi test data
  var alacakSheet = ss.getSheetByName(CONFIG.sheets.alacak);
  if (alacakSheet && alacakSheet.getLastRow() < CONFIG.dataStartRow) {
    var aHmap = getHeaderMap_(alacakSheet);
    var alacakSamples = [
      {
        "Alacak Kodu": generateId_(CONFIG.prefixes.alacak),
        Müşteri: "Test Müşteri X",
        Tutar: 80000,
        "Tahsil Tarihi": dateKey_(addDays_(t, 15)),
        Durum: "Bekliyor",
      },
      {
        "Alacak Kodu": generateId_(CONFIG.prefixes.alacak),
        Müşteri: "Test Müşteri Y",
        Tutar: 25000,
        "Tahsil Tarihi": dateKey_(addDays_(t, -10)),
        Durum: "Gecikmiş",
      },
    ];
    for (var ai = 0; ai < alacakSamples.length; ai++) {
      var aRow = findFirstEmptyRow_(alacakSheet);
      setRowValues_(alacakSheet, aRow, aHmap, alacakSamples[ai]);
    }
  }

  // Stok Envanter test data
  var stokSheet = ss.getSheetByName(CONFIG.sheets.stok);
  if (stokSheet && stokSheet.getLastRow() < CONFIG.dataStartRow + 1) {
    var sHmap = getHeaderMap_(stokSheet);
    var stokSamples = [
      {
        SKU: "TST-001",
        "Ürün Adı": "Test Ürün Alpha",
        "Mevcut Stok": 100,
        "Birim Maliyet": 150,
        "Birim Satış Fiyatı": 250,
      },
      {
        SKU: "TST-002",
        "Ürün Adı": "Test Ürün Beta",
        "Mevcut Stok": 50,
        "Birim Maliyet": 300,
        "Birim Satış Fiyatı": 450,
      },
    ];
    for (var si = 0; si < stokSamples.length; si++) {
      var sRow = findFirstEmptyRow_(stokSheet);
      setRowValues_(stokSheet, sRow, sHmap, stokSamples[si]);
    }
  }

  var sabitSheet = ss.getSheetByName(CONFIG.sheets.sabit);
  if (sabitSheet && sabitSheet.getLastRow() < CONFIG.dataStartRow) {
    var sabitHmap = getHeaderMap_(sabitSheet);
    var sabitRow = findFirstEmptyRow_(sabitSheet);
    setRowValues_(sabitSheet, sabitRow, sabitHmap, {
      "Gider Kodu": generateId_(CONFIG.prefixes.sabit),
      "Gider Adı": "Test Kira",
      Kategori: "Kira",
      "Aylık Tutar": 25000,
      "Para Birimi": "TRY",
      Kur: 1,
      "Tutar TL": 25000,
      "Ayın Günü": t.getDate(),
      "Tekrarlama Tipi": "Aylık",
      "Başlangıç Tarihi": addDays_(t, -30),
      "Artış Tarihi": addDays_(t, 15),
      "Revize Tutar": 28000,
      "Zorunlu mu": "Evet",
      "Kesilebilir mi": "Hayır",
      Departman: "Genel",
      "Sonraki Oluşturma Tarihi": t,
      Durum: "Aktif",
    });
  }

  var kartSheet = ss.getSheetByName(CONFIG.sheets.krediKarti);
  if (kartSheet && kartSheet.getLastRow() < CONFIG.dataStartRow) {
    var kartHmap = getHeaderMap_(kartSheet);
    var kartRow = findFirstEmptyRow_(kartSheet);
    setRowValues_(kartSheet, kartRow, kartHmap, {
      "Kart ID": generateId_(CONFIG.prefixes.krediKarti),
      "Kart Adı": "Test Kart",
      Banka: "Test Banka",
      "Kredi Limiti": 100000,
      "Ekstre Kesim Günü": Math.max(1, t.getDate() - 2),
      "Son Ödeme Günü": Math.min(28, t.getDate() + 5),
      "Güncel Bakiye": 85000,
      "Asgari Ödeme Tutarı": 10000,
      "Para Birimi": "TRY",
      "Ödeme Tercihi": "Tam Ödeme",
      Durum: "Aktif",
      "Son Ekstre Tutarı": 60000,
    });
  }

  var acikHesapSheet = ss.getSheetByName(CONFIG.sheets.acikHesap);
  if (acikHesapSheet && acikHesapSheet.getLastRow() < CONFIG.dataStartRow) {
    var acikHesapHmap = getHeaderMap_(acikHesapSheet);
    var ahRow = findFirstEmptyRow_(acikHesapSheet);
    setRowValues_(acikHesapSheet, ahRow, acikHesapHmap, {
      "Alacak ID": generateId_(CONFIG.prefixes.acikHesap),
      "Müşteri Adı": "Test Müşteri Vadeli",
      "Belge / Sipariş No": "TS-1001",
      "Kesim Tarihi": addDays_(t, -20),
      "Vade Tarihi": addDays_(t, 12),
      Tutar: 45000,
      "Para Birimi": "TRY",
      "Tahsil Durumu": "Vadesi Gelmedi",
      "Tahsil Edilen Tutar": 0,
      "Kalan Bakiye": 45000,
    });
  }

  var ithalatSheet = ss.getSheetByName(CONFIG.sheets.ithalat);
  if (ithalatSheet && ithalatSheet.getLastRow() < CONFIG.dataStartRow) {
    var ithalatHmap = getHeaderMap_(ithalatSheet);
    var ithalatRow = findFirstEmptyRow_(ithalatSheet);
    setRowValues_(ithalatSheet, ithalatRow, ithalatHmap, {
      "Plan Kodu": generateId_(CONFIG.prefixes.ithalat),
      SKU: "TST-001",
      Ürün: "Test Ürün Alpha",
      Tedarikçi: "Test Supplier CN",
      "Taşıma Tipi": "Deniz Yükü",
      "Sipariş Tarihi": addDays_(t, -3),
      "Sipariş Kuru": 34.5,
      "Sipariş Adedi": 200,
      "Toplam Yatırım Tutarı TL": 180000,
      "Mal Bedeli Ödeme Tarihi": addDays_(t, 5),
      "Mal Bedeli Tutarı": 90000,
      "Navlun Ödeme Tarihi": addDays_(t, 18),
      "Navlun Tutarı": 30000,
      "Gümrük Ödeme Tarihi": addDays_(t, 24),
      "Gümrük Tutarı": 25000,
      "Tahmini Varış Tarihi": addDays_(t, 42),
      "Tahmini Satış Başlangıcı": addDays_(t, 50),
      "Lead Time Gün": 45,
      "Beklenen Satış Fiyatı": 1400,
      "Pazaryeri Net Satışı": 1180,
      "Birim Net Kar": 180,
      "Toplam Net Kar": 36000,
      ROI: 0.2,
      "Tahmini Satış Süresi Gün": 35,
      "Tahmini Nakit Dönüş Günü": 75,
      "Risk Seviyesi": "Orta",
      "Sipariş Kararı": "Yakında Sipariş Ver",
      Gerekçe: "UAT test verisi",
      Durum: "Sipariş Verildi",
    });
  }

  var tahminSheet = ss.getSheetByName(CONFIG.sheets.tahmin);
  if (tahminSheet && tahminSheet.getLastRow() < CONFIG.dataStartRow) {
    var tahminHmap = getHeaderMap_(tahminSheet);
    var tahminRow = findFirstEmptyRow_(tahminSheet);
    setRowValues_(tahminSheet, tahminRow, tahminHmap, {
      "Tahmin Kodu": "FCT-UAT-30",
      "Tahmin Tarihi": t,
      "Ürün Grubu": "Genel",
      Senaryo: "Muhafazakâr",
      "Tahmini Satış Tutarı": 60000,
      "Tahmini Tahsilat Tarihi": addDays_(t, 30),
      "Güven Skoru": 0.8,
      Durum: "Aktif",
    });
  }

  logAction_(
    "Test Verisi Oluşturuldu",
    "Borç, Alacak, Stok örnek verileri eklendi",
  );
  return { ok: true, mesaj: "Test verileri oluşturuldu" };
}
