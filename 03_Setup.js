// ─── 4. SHEET SETUP & SCHEMA ────────────────────────────────────────────────

function ensureSheetExists_(ss, name) {
  var sheet = null;
  try {
    sheet = ss.getSheetByName(name);
  } catch (e) {
    ss = SpreadsheetApp.openById(ss.getId());
    sheet = ss.getSheetByName(name);
  }
  if (!sheet) {
    try {
      sheet = ss.insertSheet(name);
    } catch (e2) {
      ss = SpreadsheetApp.openById(ss.getId());
      sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    }
  }
  return sheet;
}

function setupSheetSchema_(ss, sheetName, forceRebuild) {
  var headers = SCHEMAS[sheetName];
  if (!headers || headers.length === 0) return null;
  var sheet = ensureSheetExists_(ss, sheetName);

  // Check if first header matches expected schema
  var existing =
    sheet.getLastColumn() > 0
      ? sheet
          .getRange(CONFIG.headerRow, 1, 1, Math.max(1, sheet.getLastColumn()))
          .getValues()[0]
      : [];

  var firstMatch =
    existing.length > 0 && String(existing[0]).trim() === headers[0];

  if (
    forceRebuild ||
    !firstMatch ||
    existing.length === 0 ||
    (existing.length === 1 && !existing[0])
  ) {
    // Full rebuild — clear everything, set correct column count, write headers
    sheet.clearContents();
    sheet
      .getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns())
      .clearDataValidations();
    if (sheet.getMaxColumns() > headers.length) {
      sheet.deleteColumns(
        headers.length + 1,
        sheet.getMaxColumns() - headers.length,
      );
    } else if (sheet.getMaxColumns() < headers.length) {
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        headers.length - sheet.getMaxColumns(),
      );
    }
    SpreadsheetApp.flush();
    sheet.getRange(CONFIG.headerRow, 1, 1, headers.length).setValues([headers]);
    sheet
      .getRange(CONFIG.headerRow, 1, 1, headers.length)
      .setFontWeight("bold");
    sheet.setFrozenRows(CONFIG.headerRow);
  } else {
    // Headers exist in correct schema, only add missing columns
    var existingSet = {};
    for (var ei = 0; ei < existing.length; ei++) {
      if (existing[ei]) existingSet[String(existing[ei]).trim()] = true;
    }
    var needed = [];
    for (var ni = 0; ni < headers.length; ni++) {
      if (!existingSet[headers[ni]]) needed.push(headers[ni]);
    }
    if (needed.length > 0) {
      var startCol = existing.length + 1;
      var endCol = startCol + needed.length - 1;
      if (sheet.getMaxColumns() < endCol) {
        sheet.insertColumnsAfter(
          sheet.getMaxColumns(),
          endCol - sheet.getMaxColumns(),
        );
      }
      sheet
        .getRange(CONFIG.headerRow, startCol, 1, needed.length)
        .setValues([needed]);
      sheet
        .getRange(CONFIG.headerRow, startCol, 1, needed.length)
        .setFontWeight("bold");
    }
  }
  return sheet;
}

function setupAllSchemas_(forceRebuild) {
  var ss = getSS_();
  var results = {};
  for (var name in SCHEMAS) {
    if (SCHEMAS[name].length > 0) {
      setupSheetSchema_(ss, name, forceRebuild);
      results[name] = "ok";
    } else {
      ensureSheetExists_(ss, name);
      results[name] = "exists";
    }
  }
  return results;
}

// ─── UX REFACTOR ────────────────────────────────────────────────────────────

/**
 * Ana UX fonksiyonu — tab renkleri, başlık renkleri, notlar, korumalar,
 * Başlangıç sayfası ve sayfa sıralamasını uygular.
 */
function applySheetUx_() {
  var ss = getSS_();
  applyTabColors_(ss);
  applyHeaderColors_(ss);
  applySystemProtections_(ss);
  createStartSheet_(ss);
  reorderSheets_(ss);
  return { ok: true };
}

function applyTabColors_(ss) {
  var colors = SHEET_UX.tabColors;
  var classes = SHEET_UX.classifications;
  for (var key in classes) {
    var name = CONFIG.sheets[key];
    if (!name) continue;
    var sheet = ss.getSheetByName(name);
    if (!sheet) continue;
    var c = colors[classes[key]];
    if (c) sheet.setTabColor(c);
  }
}

function applyHeaderColors_(ss) {
  var sysCols = SHEET_UX.systemColumns;
  var userBg = "#e8f5e9"; // light green
  var sysBg = "#f3f3f3"; // light gray
  var sysNote = "Sistem tarafından hesaplanır — düzenlemeyin";

  for (var key in sysCols) {
    var name = CONFIG.sheets[key];
    if (!name) continue;
    var sheet = ss.getSheetByName(name);
    if (!sheet || sheet.getLastColumn() === 0) continue;
    var hmap = getHeaderMap_(sheet);
    var sysSet = {};
    for (var s = 0; s < sysCols[key].length; s++) {
      sysSet[sysCols[key][s]] = true;
    }
    for (var col in hmap) {
      var idx = hmap[col] + 1; // 1-based
      var cell = sheet.getRange(CONFIG.headerRow, idx);
      if (sysSet[col]) {
        cell.setBackground(sysBg);
        cell.setNote(sysNote);
      } else {
        cell.setBackground(userBg);
        cell.clearNote();
      }
    }
  }

  // Fully system-generated sheets — all headers gray
  var fullSystem = [
    "nakit",
    "skuKar",
    "talep",
    "tahmin",
    "risk",
    "dashboard",
    "aksiyon",
    "ana",
    "sistemLog",
  ];
  for (var f = 0; f < fullSystem.length; f++) {
    var fName = CONFIG.sheets[fullSystem[f]];
    if (!fName) continue;
    var fSheet = ss.getSheetByName(fName);
    if (!fSheet || fSheet.getLastColumn() === 0) continue;
    var lastCol = fSheet.getLastColumn();
    fSheet.getRange(CONFIG.headerRow, 1, 1, lastCol).setBackground(sysBg);
  }
}

function applySystemProtections_(ss) {
  var fullSystem = [
    "nakit",
    "skuKar",
    "talep",
    "tahmin",
    "risk",
    "dashboard",
    "aksiyon",
    "ana",
    "sistemLog",
  ];
  for (var i = 0; i < fullSystem.length; i++) {
    var name = CONFIG.sheets[fullSystem[i]];
    if (!name) continue;
    var sheet = ss.getSheetByName(name);
    if (!sheet) continue;
    // Remove existing protections to avoid duplicates
    var existing = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    for (var e = 0; e < existing.length; e++) {
      if (existing[e].getDescription() === "Sistem sayfası — salt okunur") {
        existing[e].remove();
      }
    }
    sheet
      .protect()
      .setDescription("Sistem sayfası — salt okunur")
      .setWarningOnly(true);
  }
}

function createStartSheet_(ss) {
  var startName = "Başlangıç";
  var sheet = ss.getSheetByName(startName);
  if (!sheet) {
    sheet = ss.insertSheet(startName, 0);
  }
  sheet.clear();
  sheet.setTabColor(SHEET_UX.tabColors.START);

  var rows = [
    ["MUHASEBE SİSTEMİ — BAŞLANGIÇ REHBERİ", "", ""],
    ["", "", ""],
    [
      "Bu çalışma kitabı 19 sayfa içerir. Her sekmenin rengi sayfanın türünü gösterir.",
      "",
      "",
    ],
    ["", "", ""],
    ["RENK", "TÜR", "AÇIKLAMA"],
    ["🟢 Yeşil", "VERİ GİRİŞİ", "Siz veri girersiniz"],
    [
      "🔵 Mavi",
      "TAKİP / KARMA",
      "Bir kısmını siz girersiniz, bir kısmını sistem hesaplar",
    ],
    [
      "🟠 Turuncu",
      "SİSTEM HESAPLAMASI",
      "Sistem otomatik oluşturur — dokunmayın",
    ],
    ["🟣 Mor", "PANEL / DASHBOARD", "Sistem render eder — sadece okuyun"],
    ["⚙️ Gri", "AYAR / LOG", "Parametreler ve sistem logları"],
    ["", "", ""],
    ["SÜTUN BAŞLIK RENKLERİ", "", ""],
    ["Yeşil başlık", "→", "Siz girersiniz"],
    ["Gri başlık", "→", "Sistem hesaplar, dokunmayın"],
    ["", "", ""],
    ["═══ VERİ GİRİŞ SAYFALARI (Yeşil Sekme) ═══", "", ""],
    [
      "Hızlı Veri Girişi",
      "→",
      "Günlük işlemler: tahsilat, ödeme, masraf, ithalat…",
    ],
    ["", "", ""],
    ["═══ TAKİP SAYFALARI (Mavi Sekme) ═══", "", ""],
    ["Borç Takibi", "→", "Borç kayıtları + sistem risk hesabı"],
    ["Alacak Takibi", "→", "Alacak kayıtları + sistem tahsilat risk hesabı"],
    ["Sabit Giderler", "→", "Tekrarlayan giderler (kira, maaş, fatura…)"],
    [
      "Stok Envanter",
      "→",
      "Ürün kartları, adet, maliyet + sistem stok metrikleri",
    ],
    ["Stok Hareketleri", "→", "Stok giriş/çıkış kayıtları"],
    ["İthalat Planı", "→", "İthalat sipariş detayları + sistem karar motoru"],
    ["Kredi Kartları", "→", "Kart bilgileri + sistem limit/risk hesabı"],
    [
      "Açık Hesap Müşteriler",
      "→",
      "Vadeli alacaklar + sistem gecikme/risk hesabı",
    ],
    ["", "", ""],
    ["═══ SİSTEM HESAPLAMA SAYFALARI (Turuncu Sekme) ═══", "", ""],
    ["Nakit Akışı", "→", "90 günlük nakit projeksiyonu"],
    ["SKU Karlılık", "→", "Ürün bazlı karlılık analizi"],
    ["Talep ve Stok Baskısı", "→", "Stok tükenme risk analizi"],
    ["Tahmini Satışlar", "→", "3 senaryolu satış tahmini"],
    ["Risk Paneli", "→", "Tüm aktif riskler"],
    ["", "", ""],
    ["═══ PANEL SAYFALARI (Mor Sekme) ═══", "", ""],
    ["Ana Kontrol Paneli", "→", "Günlük yönetici özeti (mobil optimize)"],
    ["Dashboard", "→", "Detaylı finansal durum"],
    ["Aksiyon Merkezi", "→", "Önceliklendirilmiş yapılacaklar"],
    ["", "", ""],
    ["═══ AYAR VE LOG (Gri Sekme) ═══", "", ""],
    ["Parametreler", "→", "Kur, eşik, katsayı ayarları"],
    ["Sistem Logları", "→", "Otomatik işlem geçmişi (dokunmayın)"],
  ];

  sheet.getRange(1, 1, rows.length, 3).setValues(rows);

  // Format title
  sheet.getRange(1, 1).setFontSize(16).setFontWeight("bold");
  sheet.getRange(3, 1).setFontStyle("italic");

  // Format section headers
  var sectionRows = [5, 12, 16, 19, 29, 36, 40];
  for (var s = 0; s < sectionRows.length; s++) {
    sheet.getRange(sectionRows[s], 1, 1, 3).setFontWeight("bold");
  }

  // Color legend
  sheet.getRange(6, 1).setBackground("#e8f5e9"); // green
  sheet.getRange(7, 1).setBackground("#e3f2fd"); // blue
  sheet.getRange(8, 1).setBackground("#fff3e0"); // orange
  sheet.getRange(9, 1).setBackground("#f3e5f5"); // purple
  sheet.getRange(10, 1).setBackground("#f5f5f5"); // gray

  // Column widths
  sheet.setColumnWidth(1, 280);
  sheet.setColumnWidth(2, 30);
  sheet.setColumnWidth(3, 420);

  sheet.setFrozenRows(0);

  // Protect start sheet
  var prots = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  for (var p = 0; p < prots.length; p++) {
    if (prots[p].getDescription() === "Başlangıç rehberi — salt okunur") {
      prots[p].remove();
    }
  }
  sheet
    .protect()
    .setDescription("Başlangıç rehberi — salt okunur")
    .setWarningOnly(true);
}

function reorderSheets_(ss) {
  var order = SHEET_UX.sheetOrder;
  var pos = 0;
  // Başlangıç first
  var start = ss.getSheetByName("Başlangıç");
  if (start) {
    ss.setActiveSheet(start);
    ss.moveActiveSheet(1);
    pos = 1;
  }
  for (var i = 0; i < order.length; i++) {
    if (order[i] === "START_HERE") continue;
    var name = CONFIG.sheets[order[i]];
    if (!name) continue;
    var sheet = ss.getSheetByName(name);
    if (!sheet) continue;
    pos++;
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(pos);
  }
  // Return to Başlangıç
  if (start) ss.setActiveSheet(start);
}
