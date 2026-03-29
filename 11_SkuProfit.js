// ─── 12. SKU PROFITABILITY ──────────────────────────────────────────────────

function buildSkuProfitability_() {
  var ss = getSS_();
  var stokSheet = ss.getSheetByName(CONFIG.sheets.stok);
  var skuSheet = ss.getSheetByName(CONFIG.sheets.skuKar);
  if (!stokSheet || !skuSheet) return { ok: false, error: "Sheets missing" };

  var stokRows = getAllRows_(stokSheet);
  var skuHmap = getHeaderMap_(skuSheet);

  // Clear old data
  if (skuSheet.getLastRow() >= CONFIG.dataStartRow) {
    skuSheet
      .getRange(
        CONFIG.dataStartRow,
        1,
        skuSheet.getLastRow() - CONFIG.dataStartRow + 1,
        skuSheet.getLastColumn(),
      )
      .clearContent();
  }

  // Params
  var commissionRate = getParam_("marketplace_commission_rate", 0.15);
  var collectionDays = getParam_("default_collection_days", 21);
  var annualFinRate = getParam_("annual_financing_rate", 0.5);
  var minNetMargin = getParam_("minimum_net_margin_threshold", 0.1);

  var written = 0;
  var skuHeaders = skuSheet.getRange(1, 1, 1, skuSheet.getLastColumn()).getValues()[0];
  var batchRows = [];

  for (var i = 0; i < stokRows.length; i++) {
    var r = stokRows[i];
    if (!r["SKU"]) continue;

    var s30 = parseCurrency_(r["Son 30 Gün Satış Adedi"]);
    var s90 = parseCurrency_(r["Son 90 Gün Satış Adedi"]);
    var gunlukSatis = safeDivide_(s30, 30, safeDivide_(s90, 90, 0));
    var maliyet = parseCurrency_(r["Birim Tam Maliyet TL"]);
    var gunlukCiro = parseCurrency_(r["Günlük Ortalama Net Ciro"]);
    var ortSatisFiyati = gunlukSatis > 0 ? gunlukCiro / gunlukSatis : 0;
    var ortNetSatis = ortSatisFiyati * (1 - commissionRate);
    var brutKar = ortSatisFiyati - maliyet;
    var brutMarj = safeDivide_(brutKar, ortSatisFiyati, 0);
    var netKar = ortNetSatis - maliyet;
    var netKarMarji = safeDivide_(netKar, ortNetSatis, 0);
    var roi = safeDivide_(netKar, maliyet, 0);

    // Stok ve süre verileri
    var stokGun = parseCurrency_(r["Stok Gün Sayısı"]);
    var transitGun =
      parseCurrency_(r["İthalat Lead Time Gün"]) || CONFIG.defaultLeadTimeDays;

    // Toplam sermaye çevrim süresi
    var toplamCevrim = transitGun + stokGun + collectionDays;
    if (toplamCevrim < 1) toplamCevrim = 1;

    // Çevrim başına finansman maliyeti
    var finansmanMaliyetBirim = maliyet * annualFinRate * (toplamCevrim / 365);
    var finansmanMaliyetPct = safeDivide_(finansmanMaliyetBirim, maliyet, 0);

    // Finansman sonrası net getiri (birim başı)
    var finansSonrasiNet = netKar - finansmanMaliyetBirim;

    // Yıllıklandırılmış sermaye verimi
    var cevrimSayisi = 365 / toplamCevrim;
    var yillikVerimOran =
      safeDivide_(finansSonrasiNet, maliyet, 0) * cevrimSayisi;

    // Sermaye verim puanı (0-100)
    var sermayeVerimPuani = clamp_(Math.round(yillikVerimOran * 100), 0, 100);

    // Ürün sınıfı (A/B/C)
    var urunSinifi;
    if (sermayeVerimPuani >= 60) urunSinifi = "A";
    else if (sermayeVerimPuani >= 25) urunSinifi = "B";
    else urunSinifi = "C";

    // Ölü stok riski
    var oluStokRiski =
      stokGun > 120 ? "Yüksek" : stokGun > 60 ? "Orta" : "Düşük";

    // Yeniden sipariş önceliği
    var sipOncelik = "Normal";
    if (stokGun < 14) sipOncelik = "Acil";
    else if (stokGun < 30) sipOncelik = "Yüksek";
    else if (stokGun > 90) sipOncelik = "Düşük";

    // Stok politika kararı (inventory-policy.md karar kuralları)
    var karar;
    if (urunSinifi === "A" && stokGun <= 60) {
      karar = "ÖNCELİKLENDİR";
    } else if (urunSinifi === "A" && stokGun > 60) {
      karar = "DİKKATLİ YÖNET";
    } else if (urunSinifi === "B" && netKarMarji >= minNetMargin) {
      karar = "SEÇİCİ ARTIR";
    } else if (urunSinifi === "B") {
      karar = "İZLE";
    } else if (urunSinifi === "C" && stokGun > 90) {
      karar = "STOK ERİT";
    } else if (urunSinifi === "C") {
      karar = "ALIMI YAVAŞLAT";
    } else {
      karar = "İZLE";
    }

    var rowData = [];
    for (var c = 0; c < skuHeaders.length; c++) rowData.push("");
    var dataObj = {
      SKU: r["SKU"],
      "Ürün Adı": r["Ürün Adı"] || "",
      Kategori: r["Kategori"] || "",
      "Son 30 Gün Satış": s30,
      "Son 90 Gün Satış": s90,
      "Ortalama Satış Fiyatı": Math.round(ortSatisFiyati * 100) / 100,
      "Ortalama Net Satış": Math.round(ortNetSatis * 100) / 100,
      "Birim Tam Maliyet": maliyet,
      "Brüt Marj %": Math.round(brutMarj * 10000) / 100 + "%",
      "Net Kar": Math.round(netKar * 100) / 100,
      "Net Kar Marjı %": Math.round(netKarMarji * 10000) / 100 + "%",
      ROI: Math.round(roi * 10000) / 100 + "%",
      "Günlük Satış Hızı": Math.round(gunlukSatis * 100) / 100,
      "Stok Gün Sayısı": stokGun,
      "Transit Gün": transitGun,
      "Tahsilat Gün": collectionDays,
      "Toplam Çevrim Süresi": Math.round(toplamCevrim),
      "Finansman Maliyeti %":
        Math.round(finansmanMaliyetPct * 10000) / 100 + "%",
      "Finansman Sonrası Net Getiri": Math.round(finansSonrasiNet * 100) / 100,
      "Yıllıklandırılmış Sermaye Verimi %":
        Math.round(yillikVerimOran * 10000) / 100 + "%",
      "Sermaye Verim Puanı": sermayeVerimPuani,
      "Ürün Sınıfı": urunSinifi,
      "Ölü Stok Riski": oluStokRiski,
      "Yeniden Sipariş Önceliği": sipOncelik,
      "Stok Politika Kararı": karar,
    };
    for (var col in dataObj) {
      if (skuHmap[col] !== undefined) {
        rowData[skuHmap[col]] = dataObj[col];
      }
    }
    batchRows.push(rowData);
    written++;
  }

  // Tek seferde toplu yaz
  if (batchRows.length > 0) {
    var numCols = skuHeaders.length;
    // Yeterli satır olduğundan emin ol
    var needed = CONFIG.dataStartRow + batchRows.length;
    if (skuSheet.getMaxRows() < needed) {
      skuSheet.insertRowsAfter(skuSheet.getMaxRows(), needed - skuSheet.getMaxRows());
    }
    skuSheet.getRange(CONFIG.dataStartRow, 1, batchRows.length, numCols)
      .setValues(batchRows);
  }

  return { ok: true, written: written };
}
