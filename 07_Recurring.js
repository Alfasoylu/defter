// ─── 8. FIXED EXPENSE GENERATION ────────────────────────────────────────────

function generateRecurringExpenses_() {
  var ss = getSS_();
  var sabitSheet = ss.getSheetByName(CONFIG.sheets.sabit);
  var borcSheet = ss.getSheetByName(CONFIG.sheets.borc);
  if (!sabitSheet || !borcSheet) return { ok: false, error: "Sheets missing" };

  var sabitRows = getAllRows_(sabitSheet);
  var sabitHmap = getHeaderMap_(sabitSheet);
  var borcHmap = getHeaderMap_(borcSheet);
  var t = today_();
  var generated = 0;
  var skipped = 0;

  // Repeat type → month increment map
  var repeatMonths = {
    Aylık: 1,
    "İki Aylık": 2,
    "Üç Aylık": 3,
    Yıllık: 12,
  };

  for (var i = 0; i < sabitRows.length; i++) {
    var r = sabitRows[i];
    var durum = String(r["Durum"] || "").trim();

    // Skip frozen or cancelled
    if (durum === "Donduruldu" || durum === "İptal") {
      skipped++;
      continue;
    }
    if (durum !== "Aktif") {
      skipped++;
      continue;
    }

    // Determine month step from repeat type
    var repeatType = String(r["Tekrarlama Tipi"] || "Aylık").trim();
    var monthStep = repeatMonths[repeatType] || 1;

    // End date check
    var endDate = parseTurkishDate_(r["Bitiş Tarihi"]);
    if (endDate && endDate < t) {
      skipped++;
      continue;
    }

    // Start date
    var startDate = parseTurkishDate_(r["Başlangıç Tarihi"]);

    // Increase date and revised amount
    var increaseDate = parseTurkishDate_(r["Artış Tarihi"]);
    var revisedAmount = parseCurrency_(r["Revize Tutar"]);

    var nextDate = parseTurkishDate_(r["Sonraki Oluşturma Tarihi"]);
    if (!nextDate) {
      var gun = parseInt(r["Ayın Günü"]) || 1;
      nextDate = new Date(t.getFullYear(), t.getMonth(), gun);
      if (nextDate < t) nextDate.setMonth(nextDate.getMonth() + monthStep);
      // Respect start date
      if (startDate && nextDate < startDate) {
        nextDate = new Date(startDate.getFullYear(), startDate.getMonth(), gun);
        if (nextDate < startDate)
          nextDate.setMonth(nextDate.getMonth() + monthStep);
      }
    }

    // Generate up to 2 months ahead
    var horizon = addDays_(t, 60);
    while (nextDate <= horizon) {
      // End date boundary
      if (endDate && nextDate > endDate) break;

      // Determine effective amount (apply increase if applicable)
      var baseTutarTL =
        parseCurrency_(r["Tutar TL"]) || parseCurrency_(r["Aylık Tutar"]);
      if (increaseDate && revisedAmount > 0 && nextDate >= increaseDate) {
        baseTutarTL = revisedAmount;
      }

      var borcKod =
        (r["Gider Kodu"] || generateId_(CONFIG.prefixes.sabit)) +
        "-" +
        dateKey_(nextDate).replace(/\./g, "");
      var existing = findRowByKey_(borcSheet, borcHmap, "Borç Kodu", borcKod);
      if (existing < 0) {
        var newRow = findFirstEmptyRow_(borcSheet);
        setRowValues_(borcSheet, newRow, borcHmap, {
          "Borç Kodu": borcKod,
          "Borç Türü": r["Kategori"] || "Diğer",
          "Kurum / Kişi": r["Gider Adı"] || "",
          Vade: nextDate,
          Tutar: baseTutarTL,
          Durum: "Planlandı",
          Öncelik: r["Zorunlu mu"] === "Evet" ? "Yüksek" : "Orta",
          Açıklama: "Sabit gider otomatik üretildi (" + repeatType + ")",
        });
        generated++;
      }
      // Advance by repeat step
      nextDate = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth() + monthStep,
        nextDate.getDate(),
      );
    }

    // Update next generation date on sabit sheet
    setRowValues_(sabitSheet, r._row, sabitHmap, {
      "Sonraki Oluşturma Tarihi": nextDate,
    });
  }

  return { ok: true, generated: generated, skipped: skipped };
}
