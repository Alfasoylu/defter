// ─── 9. CASH PROJECTION ENGINE ──────────────────────────────────────────────

function buildCashProjection_() {
  var ss = getSS_();
  var t = today_();

  // Collect all debt and receivable records
  var borcRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.borc) || createDummySheet_(),
  );
  var alacakRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.alacak) || createDummySheet_(),
  );
  var sabitRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.sabit) || createDummySheet_(),
  );

  // Calculate dynamic minimum cash reserve
  var monthlyFixed = 0;
  var monthlyMandatory = 0;
  for (var s = 0; s < sabitRows.length; s++) {
    if (String(sabitRows[s]["Durum"] || "").trim() !== "Aktif") continue;
    var amt =
      parseCurrency_(sabitRows[s]["Tutar TL"]) ||
      parseCurrency_(sabitRows[s]["Aylık Tutar"]);
    monthlyFixed += amt;
    if (String(sabitRows[s]["Zorunlu mu"]).trim() === "Evet") {
      monthlyMandatory += amt;
    }
  }

  // Add upcoming mandatory debts (Vergi, Kredi Taksidi, Maaş)
  var mandatoryTypes = {
    Vergi: true,
    "Kredi Taksidi": true,
    Maaş: true,
    "Kredi Kartı": true,
  };
  var monthlyDebtObligations = 0;
  for (var b = 0; b < borcRows.length; b++) {
    var bd = borcRows[b];
    if (String(bd["Durum"]).trim() === "Ödendi") continue;
    if (mandatoryTypes[String(bd["Borç Türü"]).trim()]) {
      var vade = parseTurkishDate_(bd["Vade"]);
      if (vade && vade >= t && vade <= addDays_(t, 30)) {
        monthlyDebtObligations += parseCurrency_(bd["Tutar"]);
      }
    }
  }

  var minCashReserve =
    monthlyFixed * CONFIG.cashReserveMultiplier +
    monthlyDebtObligations * CONFIG.debtReserveMultiplier +
    (monthlyFixed / 30) * CONFIG.delayBufferDays;

  // Build day-by-day map of kesin/olası giriş/çıkış
  var dayMap = {};
  for (var d = 0; d < CONFIG.projectionDays; d++) {
    var day = addDays_(t, d);
    var dk = dateKey_(day);
    dayMap[dk] = {
      date: day,
      kesinGiris: 0,
      olasiGiris: 0,
      kesinCikis: 0,
      olasiCikis: 0,
      operasyonelCikis: 0,
      ithalatCikis: 0,
      finansmanGiris: 0,
    };
  }

  // Receivables → kesin or olası giriş
  for (var a = 0; a < alacakRows.length; a++) {
    var ar = alacakRows[a];
    var durum = String(ar["Durum"] || "").trim();
    if (durum === "Tahsil Edildi" || durum === "İptal") continue;
    var tarih = parseTurkishDate_(ar["Tahsil Tarihi"]);
    if (!tarih) continue;
    var key = dateKey_(tarih);
    if (!dayMap[key]) continue;
    var net =
      parseCurrency_(ar["Beklenen Net Tahsilat"]) ||
      parseCurrency_(ar["Brüt Satış"]);
    if (durum === "Bekleniyor") {
      dayMap[key].kesinGiris += net; // marketplace payouts are near-certain
    } else {
      dayMap[key].olasiGiris += net;
    }
  }

  // İthalat çok aşamalı ödemeler → ithalatCikis
  var ithalatRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.ithalat) || createDummySheet_(),
  );
  var ithalatPaymentFields = [
    { dateCol: "Mal Bedeli Ödeme Tarihi", amtCol: "Mal Bedeli Tutarı" },
    { dateCol: "Navlun Ödeme Tarihi", amtCol: "Navlun Tutarı" },
    { dateCol: "Gümrük Ödeme Tarihi", amtCol: "Gümrük Tutarı" },
  ];
  for (var imp = 0; imp < ithalatRows.length; imp++) {
    var ir = ithalatRows[imp];
    var ithalatDurum = String(ir["Durum"] || "").trim();
    if (ithalatDurum === "İptal" || ithalatDurum === "Teslim Alındı") continue;
    for (var pf = 0; pf < ithalatPaymentFields.length; pf++) {
      var payDate = parseTurkishDate_(ir[ithalatPaymentFields[pf].dateCol]);
      var payAmt = parseCurrency_(ir[ithalatPaymentFields[pf].amtCol]);
      if (payDate && payAmt > 0) {
        var payKey = dateKey_(payDate);
        if (dayMap[payKey]) {
          dayMap[payKey].ithalatCikis += payAmt;
          dayMap[payKey].kesinCikis += payAmt;
        }
      }
    }
  }

  // Tahmini Satışlar → olası giriş (güven katsayılı, sadece muhafazakâr senaryo)
  var confThreshold = getParam_("forecast_confidence_threshold", 0.7);
  var tahminSheet = ss.getSheetByName(CONFIG.sheets.tahmin);
  if (tahminSheet) {
    var tahminRows = getAllRows_(tahminSheet);
    for (var tf = 0; tf < tahminRows.length; tf++) {
      var tr = tahminRows[tf];
      if (String(tr["Durum"] || "").trim() !== "Aktif") continue;
      if (String(tr["Senaryo"] || "").indexOf("Muhafazak") < 0) continue;
      var guven = parseCurrency_(tr["Güven Skoru"]);
      if (guven < confThreshold) continue;
      var tahsTarih = parseTurkishDate_(tr["Tahmini Tahsilat Tarihi"]);
      if (!tahsTarih) continue;
      var tKey = dateKey_(tahsTarih);
      if (!dayMap[tKey]) continue;
      var tahsTutar = parseCurrency_(tr["Tahmini Satış Tutarı"]) * guven;
      dayMap[tKey].olasiGiris += tahsTutar;
    }
  }

  // Credit card due payments → kesinCikis
  var kartRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.krediKarti) || createDummySheet_(),
  );
  for (var krt = 0; krt < kartRows.length; krt++) {
    var kr = kartRows[krt];
    if (String(kr["Durum"] || "").trim() !== "Aktif") continue;
    var kartSonOdeme = parseTurkishDate_(kr["Sonraki Son Ödeme Tarihi"]);
    var beklenenOdeme = parseCurrency_(kr["Beklenen Ödeme Tutarı"]);
    if (kartSonOdeme && beklenenOdeme > 0) {
      var krtKey = dateKey_(kartSonOdeme);
      if (dayMap[krtKey]) {
        dayMap[krtKey].kesinCikis += beklenenOdeme;
      }
    }
  }

  // Open account receivables → olası giriş
  var acikHesapRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.acikHesap) || createDummySheet_(),
  );
  for (var ah = 0; ah < acikHesapRows.length; ah++) {
    var ahr = acikHesapRows[ah];
    var ahDurum = String(ahr["Tahsil Durumu"] || "").trim();
    if (ahDurum === "Tahsil Edildi") continue;
    var ahVade = parseTurkishDate_(ahr["Vade Tarihi"]);
    var ahKalan =
      parseCurrency_(ahr["Kalan Bakiye"]) || parseCurrency_(ahr["Tutar"]);
    if (ahVade && ahKalan > 0) {
      var ahKey = dateKey_(ahVade);
      if (dayMap[ahKey]) {
        dayMap[ahKey].olasiGiris += ahKalan;
      }
    }
  }

  // Debts → kesin or olası çıkış
  var operasyonelTypes = {
    Maaş: true,
    Kira: true,
    Fatura: true,
    Sigorta: true,
  };
  var ithalatTypes = {
    "İthalat Ödemesi": true,
    Gümrük: true,
    Kargo: true,
    Tedarikçi: true,
  };
  for (var b2 = 0; b2 < borcRows.length; b2++) {
    var br = borcRows[b2];
    var bDurum = String(br["Durum"] || "").trim();
    if (bDurum === "Ödendi") continue;
    var bVade =
      parseTurkishDate_(br["Vade"]) || parseTurkishDate_(br["Nakit Etki"]);
    if (!bVade) continue;
    var bKey = dateKey_(bVade);
    if (!dayMap[bKey]) continue;
    var bTutar = parseCurrency_(br["Tutar"]);
    var bTip = String(br["Borç Türü"] || "").trim();

    if (bDurum === "Planlandı" || bDurum === "Gecikmiş") {
      dayMap[bKey].kesinCikis += bTutar;
    } else {
      dayMap[bKey].olasiCikis += bTutar;
    }

    if (operasyonelTypes[bTip]) dayMap[bKey].operasyonelCikis += bTutar;
    if (ithalatTypes[bTip]) dayMap[bKey].ithalatCikis += bTutar;
  }

  // Read current opening balance from Nakit Akışı or default to 0
  var nakitSheet = ss.getSheetByName(CONFIG.sheets.nakit);
  var openingBalance = 0;
  if (nakitSheet) {
    try {
      var nhmap = getHeaderMap_(nakitSheet);
      var bakiyeIdx = nhmap["Açılış Bakiye"];
      if (bakiyeIdx != null && nakitSheet.getLastRow() >= CONFIG.dataStartRow) {
        var lastBakiye = nakitSheet
          .getRange(CONFIG.dataStartRow, bakiyeIdx + 1)
          .getDisplayValue();
        openingBalance = parseCurrency_(lastBakiye);
      }
    } catch (e) {
      openingBalance = 0;
    }
  }
  // If no balance found from sheet, fall back to parameter
  if (openingBalance === 0) {
    openingBalance = getParam_("opening_cash_balance", 0);
  }

  // Build projection array
  var projection = [];
  var balance = openingBalance;
  for (var d2 = 0; d2 < CONFIG.projectionDays; d2++) {
    var day2 = addDays_(t, d2);
    var dk2 = dateKey_(day2);
    var entry = dayMap[dk2] || {
      kesinGiris: 0,
      olasiGiris: 0,
      kesinCikis: 0,
      olasiCikis: 0,
      operasyonelCikis: 0,
      ithalatCikis: 0,
      finansmanGiris: 0,
    };
    var totalIn = entry.kesinGiris + entry.olasiGiris + entry.finansmanGiris;
    var totalOut = entry.kesinCikis + entry.olasiCikis;
    var closing = balance + totalIn - totalOut;
    var capacity = Math.max(0, closing - minCashReserve);

    var alarm = "";
    if (closing < 0) alarm = "NAKİT AÇIĞI";
    else if (closing < minCashReserve) alarm = "DİKKAT";
    else if (capacity > minCashReserve) alarm = "ALIMLARA UYGUN";

    projection.push({
      date: day2,
      dateStr: dateKey_(day2),
      acilis: balance,
      kesinGiris: entry.kesinGiris,
      olasiGiris: entry.olasiGiris,
      kesinCikis: entry.kesinCikis,
      olasiCikis: entry.olasiCikis,
      operasyonelCikis: entry.operasyonelCikis,
      ithalatCikis: entry.ithalatCikis,
      finansmanGiris: entry.finansmanGiris,
      kapanis: closing,
      minReserve: minCashReserve,
      capacity: capacity,
      alarm: alarm,
    });

    balance = closing;
  }

  return {
    projection: projection,
    openingBalance: openingBalance,
    minCashReserve: minCashReserve,
    monthlyFixed: monthlyFixed,
    monthlyMandatory: monthlyMandatory,
  };
}

function createDummySheet_() {
  return {
    getLastRow: function () {
      return 0;
    },
    getLastColumn: function () {
      return 0;
    },
    getRange: function () {
      return {
        getValues: function () {
          return [[]];
        },
        getDisplayValues: function () {
          return [[]];
        },
      };
    },
  };
}

function writeCashProjection_(data) {
  var ss = getSS_();
  var headers = SCHEMAS[CONFIG.sheets.nakit];

  // Nakit Akışı is fully script-generated: delete & recreate for clean slate
  var old = null;
  try {
    old = ss.getSheetByName(CONFIG.sheets.nakit);
  } catch (e) {
    ss = SpreadsheetApp.openById(ss.getId());
    old = ss.getSheetByName(CONFIG.sheets.nakit);
  }
  if (old) {
    try {
      ss.deleteSheet(old);
    } catch (e2) {
      ss = SpreadsheetApp.openById(ss.getId());
      var retryOld = ss.getSheetByName(CONFIG.sheets.nakit);
      if (retryOld) ss.deleteSheet(retryOld);
    }
  }
  var sheet = null;
  try {
    sheet = ss.insertSheet(CONFIG.sheets.nakit);
  } catch (e3) {
    ss = SpreadsheetApp.openById(ss.getId());
    sheet =
      ss.getSheetByName(CONFIG.sheets.nakit) ||
      ss.insertSheet(CONFIG.sheets.nakit);
  }
  sheet.getRange(CONFIG.headerRow, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(CONFIG.headerRow, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(CONFIG.headerRow);

  var hmap = getHeaderMap_(sheet);
  var proj = data.projection;

  if (proj.length === 0) return { ok: true, days: 0 };

  var rows = [];
  for (var i = 0; i < proj.length; i++) {
    var p = proj[i];
    var row = new Array(Object.keys(hmap).length);
    for (var k = 0; k < row.length; k++) row[k] = "";
    row[hmap["Tarih"]] = p.date;
    row[hmap["Açılış Bakiye"]] = p.acilis;
    row[hmap["Kesin Giriş"]] = p.kesinGiris;
    row[hmap["Olası Giriş"]] = p.olasiGiris;
    row[hmap["Kesin Çıkış"]] = p.kesinCikis;
    row[hmap["Olası Çıkış"]] = p.olasiCikis;
    row[hmap["Operasyonel Çıkış"]] = p.operasyonelCikis;
    row[hmap["İthalat Çıkışı"]] = p.ithalatCikis;
    row[hmap["Finansman Girişi"]] = p.finansmanGiris;
    row[hmap["Tahmini Kapanış Bakiye"]] = p.kapanis;
    row[hmap["Min Güvenli Nakit"]] = p.minReserve;
    row[hmap["Kullanılabilir Alım Kapasitesi"]] = p.capacity;
    row[hmap["Alarm"]] = p.alarm;
    rows.push(row);
  }

  sheet
    .getRange(CONFIG.dataStartRow, 1, rows.length, rows[0].length)
    .setValues(rows);

  // Format
  if (hmap["Tarih"] != null) {
    sheet
      .getRange(CONFIG.dataStartRow, hmap["Tarih"] + 1, rows.length, 1)
      .setNumberFormat(CONFIG.dateFormat);
  }
  var moneyColumns = [
    "Açılış Bakiye",
    "Kesin Giriş",
    "Olası Giriş",
    "Kesin Çıkış",
    "Olası Çıkış",
    "Operasyonel Çıkış",
    "İthalat Çıkışı",
    "Finansman Girişi",
    "Tahmini Kapanış Bakiye",
    "Min Güvenli Nakit",
    "Kullanılabilir Alım Kapasitesi",
  ];
  for (var m = 0; m < moneyColumns.length; m++) {
    if (hmap[moneyColumns[m]] != null) {
      sheet
        .getRange(
          CONFIG.dataStartRow,
          hmap[moneyColumns[m]] + 1,
          rows.length,
          1,
        )
        .setNumberFormat("#,##0.00");
    }
  }

  return { ok: true, days: rows.length };
}
