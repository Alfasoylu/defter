// ─── 7. KEY REPAIR & DATE FIX ───────────────────────────────────────────────

function repairKeys_() {
  var ss = getSS_();
  var count = 0;

  var pairs = [
    {
      name: CONFIG.sheets.giris,
      col: "Kayıt ID",
      prefix: CONFIG.prefixes.giris,
    },
    {
      name: CONFIG.sheets.borc,
      col: "Borç Kodu",
      prefix: CONFIG.prefixes.borc,
    },
    {
      name: CONFIG.sheets.alacak,
      col: "Alacak Kodu",
      prefix: CONFIG.prefixes.alacak,
    },
    {
      name: CONFIG.sheets.sabit,
      col: "Gider Kodu",
      prefix: CONFIG.prefixes.sabit,
    },
    {
      name: CONFIG.sheets.stokHareket,
      col: "Hareket ID",
      prefix: CONFIG.prefixes.hareket,
    },
    {
      name: CONFIG.sheets.ithalat,
      col: "Plan Kodu",
      prefix: CONFIG.prefixes.ithalat,
    },
    {
      name: CONFIG.sheets.risk,
      col: "Risk Kodu",
      prefix: CONFIG.prefixes.risk,
    },
  ];

  for (var p = 0; p < pairs.length; p++) {
    var sheet = ss.getSheetByName(pairs[p].name);
    if (!sheet) continue;
    var hmap = getHeaderMap_(sheet);
    var keyIdx = hmap[pairs[p].col];
    if (keyIdx == null) continue;
    var lastRow = sheet.getLastRow();
    if (lastRow < CONFIG.dataStartRow) continue;
    var data = sheet
      .getRange(
        CONFIG.dataStartRow,
        1,
        lastRow - CONFIG.dataStartRow + 1,
        sheet.getLastColumn(),
      )
      .getValues();
    for (var i = 0; i < data.length; i++) {
      var hasContent = data[i].some(function (v) {
        return v !== "" && v != null;
      });
      if (hasContent && !data[i][keyIdx]) {
        sheet
          .getRange(CONFIG.dataStartRow + i, keyIdx + 1)
          .setValue(generateId_(pairs[p].prefix));
        count++;
      }
    }
  }
  return { ok: true, repaired: count };
}

function fixDates_() {
  var ss = getSS_();
  ss.setSpreadsheetTimeZone(CONFIG.timezone);

  var dateColumns = [
    {
      sheet: CONFIG.sheets.giris,
      cols: ["İşlem Tarihi", "Nakit Etki Tarihi", "Vade Tarihi"],
    },
    { sheet: CONFIG.sheets.borc, cols: ["Vade", "Nakit Etki"] },
    { sheet: CONFIG.sheets.alacak, cols: ["Sipariş Dönemi", "Tahsil Tarihi"] },
    {
      sheet: CONFIG.sheets.sabit,
      cols: [
        "Başlangıç Tarihi",
        "Bitiş Tarihi",
        "Artış Tarihi",
        "Sonraki Oluşturma Tarihi",
      ],
    },
    { sheet: CONFIG.sheets.stokHareket, cols: ["Tarih"] },
    {
      sheet: CONFIG.sheets.ithalat,
      cols: [
        "Sipariş Tarihi",
        "Mal Bedeli Ödeme Tarihi",
        "Navlun Ödeme Tarihi",
        "Gümrük Ödeme Tarihi",
        "Tahmini Varış Tarihi",
        "Tahmini Satış Başlangıcı",
      ],
    },
    { sheet: CONFIG.sheets.risk, cols: ["Etki Tarihi"] },
    {
      sheet: CONFIG.sheets.tahmin,
      cols: ["Tahmin Tarihi", "Tahmini Tahsilat Tarihi"],
    },
    {
      sheet: CONFIG.sheets.krediKarti,
      cols: ["Son Ödeme Tarihi", "Sonraki Son Ödeme Tarihi"],
    },
    {
      sheet: CONFIG.sheets.acikHesap,
      cols: ["Kesim Tarihi", "Vade Tarihi"],
    },
  ];

  var fixed = 0;
  for (var d = 0; d < dateColumns.length; d++) {
    var sheet = ss.getSheetByName(dateColumns[d].sheet);
    if (!sheet) continue;
    var hmap = getHeaderMap_(sheet);
    for (var c = 0; c < dateColumns[d].cols.length; c++) {
      var colName = dateColumns[d].cols[c];
      var idx = hmap[colName];
      if (idx == null) continue;
      var lastRow = sheet.getLastRow();
      if (lastRow < CONFIG.dataStartRow) continue;
      sheet
        .getRange(
          CONFIG.dataStartRow,
          idx + 1,
          lastRow - CONFIG.dataStartRow + 1,
          1,
        )
        .setNumberFormat(CONFIG.dateFormat);
      fixed++;
    }
  }
  return { ok: true, fixedColumns: fixed };
}
