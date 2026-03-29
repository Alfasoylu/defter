// ─── 11. STOCK INTELLIGENCE ─────────────────────────────────────────────────

function buildInventoryMetrics_() {
  var ss = getSS_();
  var stokSheet = ss.getSheetByName(CONFIG.sheets.stok);
  if (!stokSheet) return { ok: false, error: "Stok Envanter not found" };

  var hmap = getHeaderMap_(stokSheet);
  var rows = getAllRows_(stokSheet);
  var t = today_();
  var updated = 0;

  if (rows.length === 0) return { ok: true, updated: 0 };

  // Tüm veriyi oku
  var lastCol = stokSheet.getLastColumn();
  var dataRange = stokSheet.getRange(CONFIG.dataStartRow, 1, rows.length, lastCol);
  var allValues = dataRange.getValues();

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var mevcut = parseCurrency_(r["Mevcut Adet"]);
    var maliyet = parseCurrency_(r["Birim Tam Maliyet TL"]);
    var s30 = parseCurrency_(r["Son 30 Gün Satış Adedi"]);
    var s90 = parseCurrency_(r["Son 90 Gün Satış Adedi"]);
    var gunlukCiro = parseCurrency_(r["Günlük Ortalama Net Ciro"]);
    var turnover =
      parseCurrency_(r["Aylık Dönüş Katsayısı"]) || CONFIG.defaultTurnoverCoeff;
    var leadTime =
      parseCurrency_(r["İthalat Lead Time Gün"]) || CONFIG.defaultLeadTimeDays;
    var guvenlik =
      parseCurrency_(r["Güvenlik Stoğu Gün"]) || CONFIG.safetyStockDays;

    // Calculations
    var stokDegeri = mevcut * maliyet;
    var gunlukSatis = safeDivide_(s30, 30, safeDivide_(s90, 90, 0));
    var stokGun = safeDivide_(mevcut, gunlukSatis, 9999);
    var reorderPoint = Math.ceil((leadTime + guvenlik) * gunlukSatis);
    var bitisTarihi = gunlukSatis > 0 ? addDays_(t, Math.floor(stokGun)) : "";

    // Stock status
    var stokDurum = "Normal";
    if (mevcut <= 0) stokDurum = "Kritik";
    else if (stokGun < leadTime) stokDurum = "Kritik";
    else if (stokGun < leadTime + guvenlik) stokDurum = "Düşük";
    else if (stokGun > 180) stokDurum = "Ölü Stok";
    else if (stokGun > 90) stokDurum = "Fazla";

    // Revenue/profit loss if stockout occurs before new stock
    var stockoutDays = Math.max(0, leadTime - stokGun);
    var ciroKaybi = stockoutDays * gunlukCiro;
    var karKaybi = ciroKaybi * 0.3; // ~30% margin assumption

    // Stok yaşlanma puanı (0-100, yüksek = kötü)
    var maxDevir = getParam_("max_acceptable_inventory_turn_days", 90);
    var yaslanma = clamp_(Math.round((stokGun / maxDevir) * 100), 0, 100);

    // Sermaye verim puanı (basit yaklaşım: ciro dönüşü vs bağlı sermaye)
    var aylikCiro = gunlukCiro * 30;
    var sermayeVerim =
      stokDegeri > 0
        ? clamp_(Math.round((aylikCiro / stokDegeri) * 100), 0, 100)
        : 0;

    // Priority score (0-100)
    var skor = 0;
    skor += clamp_(stockoutDays * 2, 0, 40);
    skor += clamp_(gunlukCiro / 100, 0, 30);
    skor += stokDurum === "Kritik" ? 30 : stokDurum === "Düşük" ? 15 : 0;

    // Hafızadaki array'e yaz
    var updateFields = {
      "Mevcut Stok Değeri TL": stokDegeri,
      "Günlük Ortalama Satış": Math.round(gunlukSatis * 100) / 100,
      "Aylık Dönüş Katsayısı": turnover,
      "Stok Gün Sayısı": Math.round(stokGun),
      "Güvenlik Stoğu Gün": guvenlik,
      "İthalat Lead Time Gün": leadTime,
      "Yeniden Sipariş Noktası": reorderPoint,
      "Tahmini Stok Bitiş Tarihi": bitisTarihi,
      "Stok Durumu": stokDurum,
      "Stok Yaşlanma Puanı": yaslanma,
      "Sermaye Verim Puanı": sermayeVerim,
      "Olası 30 Gün Ciro Kaybı": ciroKaybi,
      "Olası 30 Gün Kar Kaybı": karKaybi,
      "Öncelik Skoru": Math.round(skor),
    };
    for (var col in updateFields) {
      if (hmap[col] !== undefined) {
        allValues[i][hmap[col]] = updateFields[col];
      }
    }
    updated++;
  }

  // Tek seferde toplu yaz
  dataRange.setValues(allValues);

  return { ok: true, updated: updated };
}
