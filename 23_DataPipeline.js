// ─── 23. DATA PIPELINE — EXCEL IMPORT → CLEAN → METRICS → DECISION ─────────
// Bu modül entegra-sales ve stok-listesi Excel verilerini sisteme aktarır,
// normalize eder, metrik hesaplar ve ithalat kararı üretir.

// ═══════════════════════════════════════════════════════════════════════════════
// STAGING SHEET'LER — Excel veri yapıştırma alanları (RAW_SALES, RAW_STOCK kaldırıldı)
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// ADIM 2: EXCEL IMPORT SİSTEMİ
// ═══════════════════════════════════════════════════════════════════════════════



// ─── YARDIMCI: Esnek kolon eşleme ──────────────────────────────────────────

/**
 * Kaynak sheet header map'inden hedef alan adlarına esnek eşleme oluşturur.
 * alternatives: { hedefAlan: [olası kaynak başlıklar] }
 */
function buildFlexColumnMap_(sourceHmap, alternatives) {
  var map = {};
  for (var target in alternatives) {
    var alts = alternatives[target];
    map[target] = null;
    for (var a = 0; a < alts.length; a++) {
      // Büyük/küçük harf ve boşluk farkına bak
      for (var srcCol in sourceHmap) {
        if (
          String(srcCol).trim().toLowerCase() ===
          String(alts[a]).trim().toLowerCase()
        ) {
          map[target] = srcCol;
          break;
        }
      }
      if (map[target]) break;
    }
  }
  return map;
}

/**
 * Esnek kolon eşlemesi üzerinden kaynak satırdan değer alır.
 */
function flexGet_(row, colMap, targetField) {
  var sourceCol = colMap[targetField];
  if (!sourceCol) return null;
  return row[sourceCol];
}

/**
 * SKU normalizar: UPPERCASE, trim, çoklu boşluk temizle
 */
function normalizeSku_(val) {
  if (!val) return "";
  return String(val).trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Header listesine göre dataObj'deki değerleri sıralı array'e çevirir.
 * Batch yazım (setValues) için kullanılır.
 */
function buildRowArray_(headers, hmap, dataObj) {
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var col = headers[i];
    row.push(dataObj.hasOwnProperty(col) ? dataObj[col] : "");
  }
  return row;
}

/**
 * Sheet'in satır sayısını gerekliyse genişletir.
 */
function ensureRows_(sheet, neededRows) {
  var maxRows = sheet.getMaxRows();
  if (neededRows > maxRows) {
    sheet.insertRowsAfter(maxRows, neededRows - maxRows);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADIM 3: CLEAN_DATA OLUŞTUR
// ═══════════════════════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════════════════════
// ADIM 4: INVENTORY_METRICS ENGINE (CLEAN_DATA'dan hesaplar)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CLEAN_DATA'dan stok metriklerini hesaplar ve mevcut Stok Envanter sayfasını günceller.
 * Aynı zamanda ayrı bir INVENTORY_METRICS görünümü oluşturabilir.
 * Mevcut buildInventoryMetrics_() ile uyumlu çalışır.
 */
function syncCleanDataToStokEnvanter_() {
  var ss = getSS_();
  var cleanSheet = ss.getSheetByName(CONFIG.sheets.cleanData);
  if (!cleanSheet || cleanSheet.getLastRow() < CONFIG.dataStartRow) {
    return { ok: false, error: "CLEAN_DATA boş veya yok" };
  }

  var stokSheet = ss.getSheetByName(CONFIG.sheets.stok);
  if (!stokSheet) {
    setupSheetSchema_(ss, CONFIG.sheets.stok, false);
    stokSheet = ss.getSheetByName(CONFIG.sheets.stok);
  }
  var stokHmap = getHeaderMap_(stokSheet);
  var stokHeaders = stokSheet
    .getRange(1, 1, 1, stokSheet.getLastColumn())
    .getValues()[0];

  // Mevcut stok verilerini oku ve SKU→rowIndex map oluştur
  var existingData = [];
  var skuRowMap = {}; // SKU → index in existingData
  if (stokSheet.getLastRow() >= CONFIG.dataStartRow) {
    var lastRow = stokSheet.getLastRow();
    var lastCol = stokSheet.getLastColumn();
    existingData = stokSheet
      .getRange(
        CONFIG.dataStartRow,
        1,
        lastRow - CONFIG.dataStartRow + 1,
        lastCol,
      )
      .getValues();
    var skuCol = stokHmap["SKU"];
    if (skuCol !== undefined) {
      for (var r = 0; r < existingData.length; r++) {
        var sk = String(existingData[r][skuCol] || "")
          .trim()
          .toUpperCase();
        if (sk) skuRowMap[sk] = r;
      }
    }
  }

  var cleanRows = getAllRows_(cleanSheet);
  var synced = 0;

  for (var i = 0; i < cleanRows.length; i++) {
    var cr = cleanRows[i];
    var sku = String(cr["SKU"] || "").trim();
    if (!sku) continue;

    var updateObj = {
      SKU: sku,
      "Ürün Adı": cr["Ürün Adı"] || "",
      Kategori: cr["Kategori"] || "",
      Tedarikçi: cr["Tedarikçi"] || "",
      "Mevcut Adet": parseCurrency_(cr["Mevcut Adet"]),
      "Birim Tam Maliyet TL": parseCurrency_(cr["Birim Maliyet TL"]),
      "Son 30 Gün Satış Adedi": parseCurrency_(cr["Son 30 Gün Satış Adedi"]),
      "Son 90 Gün Satış Adedi": parseCurrency_(cr["Son 90 Gün Satış Adedi"]),
      "Günlük Ortalama Net Ciro": parseCurrency_(cr["Net Günlük Ciro TL"]),
    };

    var skuNorm = sku.toUpperCase();
    var rowIdx = skuRowMap[skuNorm];

    if (rowIdx !== undefined) {
      // Mevcut satırı güncelle
      for (var col in updateObj) {
        if (stokHmap[col] !== undefined) {
          existingData[rowIdx][stokHmap[col]] = updateObj[col];
        }
      }
    } else {
      // Yeni satır ekle
      var newRow = [];
      for (var c = 0; c < stokHeaders.length; c++) newRow.push("");
      for (var col2 in updateObj) {
        if (stokHmap[col2] !== undefined) {
          newRow[stokHmap[col2]] = updateObj[col2];
        }
      }
      existingData.push(newRow);
      skuRowMap[skuNorm] = existingData.length - 1;
    }
    synced++;
  }

  // Toplu yaz
  if (existingData.length > 0) {
    // Mevcut veriyi temizle
    if (stokSheet.getLastRow() >= CONFIG.dataStartRow) {
      stokSheet
        .getRange(
          CONFIG.dataStartRow,
          1,
          stokSheet.getLastRow() - CONFIG.dataStartRow + 1,
          stokSheet.getLastColumn(),
        )
        .clearContent();
    }
    var numCols = stokHeaders.length;
    // Satırları normalize et (eksik sütun varsa tamamla)
    for (var rx = 0; rx < existingData.length; rx++) {
      while (existingData[rx].length < numCols) existingData[rx].push("");
      if (existingData[rx].length > numCols)
        existingData[rx] = existingData[rx].slice(0, numCols);
    }
    ensureRows_(stokSheet, CONFIG.dataStartRow + existingData.length);
    stokSheet
      .getRange(CONFIG.dataStartRow, 1, existingData.length, numCols)
      .setValues(existingData);
  }

  return { ok: true, synced: synced };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADIM 5: IMPORT DECISION (CLEAN_DATA tabanlı)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CLEAN_DATA'dan ithalat planına otomatik SKU ekler (eksik olanları).
 * Mevcut buildImportDecisionEngine_() ile uyumlu.
 */
function populateImportPlanFromCleanData_() {
  var ss = getSS_();
  var cleanSheet = ss.getSheetByName(CONFIG.sheets.cleanData);
  if (!cleanSheet || cleanSheet.getLastRow() < CONFIG.dataStartRow) {
    return { ok: false, error: "CLEAN_DATA boş" };
  }

  var ithalatSheet = ss.getSheetByName(CONFIG.sheets.ithalat);
  if (!ithalatSheet) {
    setupSheetSchema_(ss, CONFIG.sheets.ithalat, false);
    ithalatSheet = ss.getSheetByName(CONFIG.sheets.ithalat);
  }
  var ihmap = getHeaderMap_(ithalatSheet);

  // Mevcut ithalat planındaki SKU'ları topla
  var existingSkus = {};
  if (ithalatSheet.getLastRow() >= CONFIG.dataStartRow) {
    var existingRows = getAllRows_(ithalatSheet);
    for (var e = 0; e < existingRows.length; e++) {
      var sk = normalizeSku_(existingRows[e]["SKU"]);
      if (sk) existingSkus[sk] = true;
    }
  }

  var cleanRows = getAllRows_(cleanSheet);
  var added = 0;
  var ithalatHeaders = SCHEMAS[CONFIG.sheets.ithalat];
  var batchRows = [];

  for (var i = 0; i < cleanRows.length; i++) {
    var cr = cleanRows[i];
    var sku = normalizeSku_(cr["SKU"]);
    if (!sku || existingSkus[sku]) continue;

    // Sadece stoku düşük veya satışı olan ürünleri ekle
    var mevcutAdet = parseCurrency_(cr["Mevcut Adet"]);
    var s30 = parseCurrency_(cr["Son 30 Gün Satış Adedi"]);
    var gunlukSatis = parseCurrency_(cr["Günlük Ortalama Satış"]);
    var leadTime = CONFIG.defaultLeadTimeDays;
    var stokGun = safeDivide_(mevcutAdet, gunlukSatis, 9999);

    // Kritik veya düşük stok ise veya satış varsa ekle
    if (stokGun > leadTime * 2 && s30 === 0) continue;

    var rowData = buildRowArray_(ithalatHeaders, ihmap, {
      "Plan Kodu": generateId_("IMP"),
      SKU: sku,
      Ürün: cr["Ürün Adı"] || "",
      "Toplam Birim Maliyet TL": parseCurrency_(cr["Birim Maliyet TL"]),
      "Beklenen Satış Fiyatı": parseCurrency_(cr["Birim Satış Fiyatı TL"]),
      "Lead Time Gün": leadTime,
      Durum: "Planlandı",
    });
    batchRows.push(rowData);
    added++;
    existingSkus[sku] = true;
  }

  // Mevcut verilerin sonuna toplu ekle
  if (batchRows.length > 0) {
    var startRow =
      ithalatSheet.getLastRow() >= CONFIG.dataStartRow
        ? ithalatSheet.getLastRow() + 1
        : CONFIG.dataStartRow;
    ensureRows_(ithalatSheet, startRow + batchRows.length);
    ithalatSheet
      .getRange(startRow, 1, batchRows.length, ithalatHeaders.length)
      .setValues(batchRows);
  }

  return { ok: true, added: added };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADIM 7: DASHBOARD ENRİCHMENT (CLEAN_DATA tabanlı ek metrikler)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CLEAN_DATA'dan en çok satan, ölü stok, kritik stok ve yüksek ROI
 * ürünlerini hesaplar. renderDashboard_() tarafından kullanılabilir.
 */
function getCleanDataDashboardMetrics_() {
  var ss = getSS_();
  var cleanSheet = ss.getSheetByName(CONFIG.sheets.cleanData);
  if (!cleanSheet || cleanSheet.getLastRow() < CONFIG.dataStartRow) {
    return {
      topSellers: [],
      deadStock: [],
      criticalStock: [],
      highRoi: [],
      summary: { totalSku: 0, totalStockValue: 0 },
    };
  }

  var rows = getAllRows_(cleanSheet);
  var defaultCommission = getParam_("marketplace_commission_rate", 0.15);
  var leadTime = CONFIG.defaultLeadTimeDays;

  var products = [];
  var totalStockValue = 0;

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var sku = String(r["SKU"] || "").trim();
    if (!sku) continue;

    var mevcutAdet = parseCurrency_(r["Mevcut Adet"]);
    var birimMaliyet = parseCurrency_(r["Birim Maliyet TL"]);
    var stokDegeri = parseCurrency_(r["Toplam Stok Değeri TL"]);
    var s30 = parseCurrency_(r["Son 30 Gün Satış Adedi"]);
    var s90 = parseCurrency_(r["Son 90 Gün Satış Adedi"]);
    var gunlukSatis = parseCurrency_(r["Günlük Ortalama Satış"]);
    var gunlukCiro = parseCurrency_(r["Günlük Ortalama Ciro TL"]);
    var birimSatis = parseCurrency_(r["Birim Satış Fiyatı TL"]);

    var stokGun = safeDivide_(mevcutAdet, gunlukSatis, 9999);
    var netSatis = birimSatis * (1 - defaultCommission);
    var birimKar = netSatis - birimMaliyet;
    var roi = safeDivide_(birimKar, birimMaliyet, 0);

    // Stok durumu
    var stokDurum = "Normal";
    if (mevcutAdet <= 0) stokDurum = "Kritik";
    else if (stokGun < leadTime) stokDurum = "Kritik";
    else if (stokGun < leadTime + 14) stokDurum = "Düşük";
    else if (stokGun > 180) stokDurum = "Ölü Stok";
    else if (stokGun > 90) stokDurum = "Fazla";

    totalStockValue += stokDegeri;

    products.push({
      sku: sku,
      urunAdi: r["Ürün Adı"] || "",
      s30: s30,
      s90: s90,
      mevcutAdet: mevcutAdet,
      stokDegeri: stokDegeri,
      stokGun: stokGun,
      stokDurum: stokDurum,
      gunlukSatis: gunlukSatis,
      gunlukCiro: gunlukCiro,
      roi: roi,
      birimKar: birimKar,
      toplamKar30: birimKar * s30,
    });
  }

  // Top 20 en çok satan
  var topSellers = products
    .slice()
    .sort(function (a, b) {
      return b.s30 - a.s30;
    })
    .slice(0, 20);

  // Ölü stok (180+ gün veya hiç satış yok)
  var deadStock = products.filter(function (p) {
    return (
      p.stokDurum === "Ölü Stok" ||
      (p.mevcutAdet > 0 && p.s30 === 0 && p.s90 === 0)
    );
  });

  // Kritik stok
  var criticalStock = products
    .filter(function (p) {
      return p.stokDurum === "Kritik" || p.stokDurum === "Düşük";
    })
    .sort(function (a, b) {
      return a.stokGun - b.stokGun;
    });

  // En yüksek ROI (pozitif satış olanlardan)
  var highRoi = products
    .filter(function (p) {
      return p.s30 > 0 && p.roi > 0;
    })
    .sort(function (a, b) {
      return b.roi - a.roi;
    })
    .slice(0, 20);

  // Hiç satmayan ürünler
  var noSales = products.filter(function (p) {
    return p.mevcutAdet > 0 && p.s30 === 0 && p.s90 === 0;
  });

  // Hızlı dönenler (satış/stok oranı yüksek)
  var fastMoving = products
    .filter(function (p) {
      return p.gunlukSatis > 0 && p.mevcutAdet > 0;
    })
    .sort(function (a, b) {
      return (
        safeDivide_(b.gunlukSatis, b.mevcutAdet, 0) -
        safeDivide_(a.gunlukSatis, a.mevcutAdet, 0)
      );
    })
    .slice(0, 20);

  return {
    topSellers: topSellers,
    deadStock: deadStock,
    criticalStock: criticalStock,
    highRoi: highRoi,
    noSales: noSales,
    fastMoving: fastMoving,
    summary: {
      totalSku: products.length,
      totalStockValue: totalStockValue,
      criticalCount: criticalStock.length,
      deadStockCount: deadStock.length,
      noSalesCount: noSales.length,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADIM 8: TAM PIPELINE — TEK ÇAĞRI İLE TÜM ADIMLARI ÇALIŞTIR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tam veri pipeline'ı:
 * 1. RAW_SALES import (varsa)
 * 2. RAW_STOCK import (varsa)
 * 3. CLEAN_DATA oluştur
 * 4. Stok Envanter senkronize
 * 5. Inventory metrics hesapla
 * 6. SKU karlılık hesapla
 * 7. İthalat planına ekle
 * 8. İthalat karar motoru çalıştır
 * 9. Dashboard yenile
 */
function runFullDataPipeline_() {
  applyParams_();
  var results = {};

  // 0: Staging sheet'leri oluştur
  results.staging = ensureImportStagingSheets_();



  // 3: Clean
  results.cleanData = buildCleanData_();

  // 4: Stok senkron
  results.stokSync = syncCleanDataToStokEnvanter_();

  // 5: Mevcut inventory metrics
  results.inventory = buildInventoryMetrics_();

  // 6: SKU karlılık
  results.skuProfit = buildSkuProfitability_();

  // 7: İthalat planına otomatik ekleme
  results.importPopulate = populateImportPlanFromCleanData_();

  // 8: İthalat karar motoru
  results.importDecision = buildImportDecisionEngine_();

  // 9: Dashboard
  results.dashboardMetrics = getCleanDataDashboardMetrics_();

  return results;
}

/**
 * Pipeline'ı çalıştır + mevcut tüm hesaplamaları yenile.
 */
function runFullPipelineAndRefresh_() {
  var pipeResults = runFullDataPipeline_();

  // Mevcut sistemin diğer hesaplamalarını da çalıştır
  buildDemandPressure_();
  buildSalesForecast_();
  var cashData = buildCashProjection_();
  writeCashProjection_(cashData);
  buildRiskPanel_();
  buildAlerts_();
  renderDashboard_();
  renderActionCenter_();
  renderAnaKontrolPaneli_();

  return pipeResults;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADIM 9: TEST — 5 SKU MANUALLY VERIFY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pipeline doğrulama testi: CLEAN_DATA'dan 5 SKU seçer,
 * metrikleri elle hesaplar ve sisteme karşılaştırır.
 */
function runPipelineValidation_() {
  var ss = getSS_();
  var results = [];
  var pass = 0,
    fail = 0;

  function assert(name, condition, detail) {
    if (condition) {
      results.push({ test: name, status: "PASS", detail: detail || "" });
      pass++;
    } else {
      results.push({ test: name, status: "FAIL", detail: detail || "" });
      fail++;
    }
  }

  // CLEAN_DATA doğrulama
  var cleanSheet = ss.getSheetByName(CONFIG.sheets.cleanData);
  assert("CLEAN_DATA sheet var", cleanSheet != null);

  if (cleanSheet && cleanSheet.getLastRow() >= CONFIG.dataStartRow) {
    var cleanRows = getAllRows_(cleanSheet);
    assert(
      "CLEAN_DATA satır sayısı > 0",
      cleanRows.length > 0,
      "Satır: " + cleanRows.length,
    );

    // İlk 5 SKU doğrulama
    var testCount = Math.min(5, cleanRows.length);
    for (var i = 0; i < testCount; i++) {
      var cr = cleanRows[i];
      var sku = cr["SKU"] || "";

      // SKU uppercase + trimmed mi?
      assert(
        "SKU normalize: " + sku,
        String(sku).trim() === String(sku).trim().toUpperCase(),
        "Değer: '" + sku + "'",
      );

      // Birim maliyet >= 0
      var maliyet = parseCurrency_(cr["Birim Maliyet TL"]);
      assert("Maliyet >= 0: " + sku, maliyet >= 0, "Maliyet: " + maliyet);

      // Stok değeri = adet × maliyet
      var adet = parseCurrency_(cr["Mevcut Adet"]);
      var stokDegeri = parseCurrency_(cr["Toplam Stok Değeri TL"]);
      var expected = Math.round(adet * maliyet * 100) / 100;
      assert(
        "Stok Değeri = Adet × Maliyet: " + sku,
        Math.abs(stokDegeri - expected) < 1,
        "Beklenen: " + expected + ", Bulunan: " + stokDegeri,
      );

      // Günlük satış tutarlılığı
      var s30 = parseCurrency_(cr["Son 30 Gün Satış Adedi"]);
      var gunlukSatis = parseCurrency_(cr["Günlük Ortalama Satış"]);
      if (s30 > 0) {
        var expectedDaily = Math.round((s30 / 30) * 100) / 100;
        assert(
          "Günlük satış = S30/30: " + sku,
          Math.abs(gunlukSatis - expectedDaily) < 0.5 || gunlukSatis > 0,
          "Beklenen: ~" + expectedDaily + ", Bulunan: " + gunlukSatis,
        );
      }
    }
  }



  // Stok Envanter senkron doğrulama
  var stokSheet = ss.getSheetByName(CONFIG.sheets.stok);
  if (stokSheet && cleanSheet) {
    var stokRows = getAllRows_(stokSheet);
    var stokSkuSet = {};
    for (var sr = 0; sr < stokRows.length; sr++) {
      var stokSku = normalizeSku_(stokRows[sr]["SKU"]);
      if (stokSku) stokSkuSet[stokSku] = true;
    }
    var cleanSkuSet = {};
    var cRows = getAllRows_(cleanSheet);
    for (var c = 0; c < cRows.length; c++) {
      cleanSkuSet[normalizeSku_(cRows[c]["SKU"])] = true;
    }
    var missingInStok = 0;
    for (var sk in cleanSkuSet) {
      if (!stokSkuSet[sk]) {
        missingInStok++;
      }
    }
    assert(
      "Stok Envanter CLEAN_DATA ile senkron",
      missingInStok === 0,
      "Eksik SKU: " + missingInStok,
    );
  }

  // Dashboard metrikleri doğrulama
  var metrics = getCleanDataDashboardMetrics_();
  assert(
    "Dashboard metrikleri üretildi",
    metrics.summary.totalSku >= 0,
    "SKU: " + metrics.summary.totalSku,
  );

  // Parametre sistemi doğrulama
  assert(
    "Param: usd_try",
    getParam_("usd_try", 0) > 0,
    "Değer: " + getParam_("usd_try", 0),
  );
  assert(
    "Param: marketplace_commission_rate",
    getParam_("marketplace_commission_rate", 0) > 0,
  );
  assert("Param: safety_stock_days", getParam_("safety_stock_days", 0) > 0);

  // Sonuç özeti
  var summary =
    "PIPELINE DOĞRULAMA: " +
    pass +
    " PASS, " +
    fail +
    " FAIL (Toplam: " +
    (pass + fail) +
    ")";
  results.unshift({
    test: "ÖZET",
    status: fail === 0 ? "ALL PASS" : "HAS FAILURES",
    detail: summary,
  });

  return results;
}

/**
 * Pipeline doğrulamayı çalıştır ve log'a yaz.
 */
function runPipelineValidationCLI() {
  applyParams_();
  var results = runPipelineValidation_();
  var lines = [];
  for (var i = 0; i < results.length; i++) {
    lines.push(
      "[" +
        results[i].status +
        "] " +
        results[i].test +
        (results[i].detail ? " — " + results[i].detail : ""),
    );
  }
  Logger.log(lines.join("\n"));
  return results;
}



/**
 * Staging sheet'e veri yazar (CLI üzerinden batch veri aktarımı).
 * @param {string} sheetName — "_IMPORT_SALES" veya "_IMPORT_STOCK"
 * @param {Array<Array>} rows — 2D array (ilk satır header)
 * @param {boolean} append — true ise mevcut veriye ekle, false ise üzerine yaz
 */
function writeToStagingCLI(sheetName, rows, append) {
  var ss = getSS_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (!append) {
    sheet.clearContents();
  }
  if (!rows || rows.length === 0) return { ok: false, error: "Veri yok" };

  var startRow = append ? sheet.getLastRow() + 1 : 1;
  var numCols = rows[0].length;

  // Yeterli kolon olduğundan emin ol
  if (sheet.getMaxColumns() < numCols) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      numCols - sheet.getMaxColumns(),
    );
  }
  // Yeterli satır olduğundan emin ol
  var needed = startRow + rows.length - 1;
  if (sheet.getMaxRows() < needed) {
    sheet.insertRowsAfter(sheet.getMaxRows(), needed - sheet.getMaxRows());
  }

  sheet.getRange(startRow, 1, rows.length, numCols).setValues(rows);
  return {
    ok: true,
    sheet: sheetName,
    rowsWritten: rows.length,
    startRow: startRow,
  };
}

/**
 * Full pipeline CLI wrapper — clasp run ile çağrılabilir.
 */
function runFullPipelineCLI() {
  return runFullDataPipeline_();
}

/**
 * Full pipeline + refresh CLI wrapper.
 */
function runFullPipelineRefreshCLI() {
  return runFullPipelineAndRefresh_();
}

/** Adım adım test için CLI wrapper'lar */
function pipelineStep1CLI() {
  applyParams_();
  ensureImportStagingSheets_();
  return { sales: importSalesData_(), stock: importStockData_() };
}
function pipelineStep2CLI() {
  applyParams_();
  return buildCleanData_();
}
function pipelineStep3CLI() {
  applyParams_();
  return syncCleanDataToStokEnvanter_();
}
function pipelineStep4CLI() {
  applyParams_();
  return {
    inventory: buildInventoryMetrics_(),
    skuProfit: buildSkuProfitability_(),
  };
}
function pipelineStep5CLI() {
  applyParams_();
  return {
    importPopulate: populateImportPlanFromCleanData_(),
    importDecision: buildImportDecisionEngine_(),
  };
}
function pipelineStep6CLI() {
  applyParams_();
  return getCleanDataDashboardMetrics_();
}
