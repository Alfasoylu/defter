// ─── 13. IMPORT DECISION ENGINE ─────────────────────────────────────────────

function buildImportDecisionEngine_() {
  var ss = getSS_();
  var ithalatSheet = ss.getSheetByName(CONFIG.sheets.ithalat);
  if (!ithalatSheet) return { ok: false, error: "İthalat Planı not found" };

  var ihmap = getHeaderMap_(ithalatSheet);
  var rows = getAllRows_(ithalatSheet);

  // Get cash context
  var cashData = buildCashProjection_();
  var todayCapacity =
    cashData.projection.length > 0 ? cashData.projection[0].capacity : 0;

  // Get stock context
  var stokSheet = ss.getSheetByName(CONFIG.sheets.stok);
  var stokMap = {};
  if (stokSheet) {
    var stokRows = getAllRows_(stokSheet);
    for (var s = 0; s < stokRows.length; s++) {
      stokMap[String(stokRows[s]["SKU"]).trim()] = stokRows[s];
    }
  }

  var updated = 0;

  if (rows.length === 0) return { ok: true, updated: 0 };

  // Tüm veriyi oku
  var lastCol = ithalatSheet.getLastColumn();
  var dataRange = ithalatSheet.getRange(CONFIG.dataStartRow, 1, rows.length, lastCol);
  var allValues = dataRange.getValues();

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r["SKU"]) continue;

    var sku = String(r["SKU"]).trim();
    var stokInfo = stokMap[sku] || {};
    var siparisAdet =
      parseCurrency_(r["Sipariş Adedi"]) || parseCurrency_(r["MOQ"]);
    var birimMaliyet = parseCurrency_(r["Toplam Birim Maliyet TL"]);
    var toplamYatirim = siparisAdet * birimMaliyet;
    var satiFiyati = parseCurrency_(r["Beklenen Satış Fiyatı"]);
    var netSatis = satiFiyati * 0.85; // after marketplace fees
    var birimNetKar = netSatis - birimMaliyet;
    var toplamNetKar = birimNetKar * siparisAdet;
    var roi = safeDivide_(birimNetKar, birimMaliyet, 0);

    var gunlukSatis = parseCurrency_(stokInfo["Günlük Ortalama Satış"]) || 1;
    var satisGun = safeDivide_(siparisAdet, gunlukSatis, 120);
    var leadTime =
      parseCurrency_(r["Lead Time Gün"]) || CONFIG.defaultLeadTimeDays;
    var nakitDonusGun = leadTime + Math.round(satisGun * 0.5);
    var stokGun = parseCurrency_(stokInfo["Stok Gün Sayısı"]) || 9999;

    // Scoring
    var W = CONFIG.importWeights;
    var roiScore = clamp_(roi * 100, 0, 100);
    var velScore = clamp_(gunlukSatis * 10, 0, 100);
    var urgency =
      stokGun < leadTime
        ? 100
        : clamp_((1 - stokGun / (leadTime * 3)) * 100, 0, 100);
    var demandScore =
      parseCurrency_(stokInfo["Son 30 Gün Satış Adedi"]) > 0 ? 70 : 30;
    var cashPress =
      todayCapacity > 0
        ? clamp_((toplamYatirim / todayCapacity) * 100, 0, 100)
        : 100;
    var leadRisk = clamp_((leadTime / 60) * 100, 0, 100);
    var slowScore = stokGun > 90 ? 80 : stokGun > 60 ? 40 : 0;

    var score =
      roiScore * W.roi +
      velScore * W.salesVelocity +
      urgency * W.stockoutUrgency +
      demandScore * W.demandConfidence +
      cashPress * W.cashPressure +
      leadRisk * W.leadTimeRisk +
      slowScore * W.slowMoving;
    score = Math.round(clamp_(score, 0, 100));

    var karar, gerekce;
    if (score >= 70 && todayCapacity >= toplamYatirim) {
      karar = "Şimdi Sipariş Ver";
      gerekce = "Stok acil, nakit uygun, ROI yüksek";
    } else if (score >= 50) {
      karar = "Yakında Sipariş Ver";
      gerekce = "İyi fırsat, uygun gün bekle";
    } else if (score >= 25) {
      karar = "Bekle";
      gerekce = "Stok yeterli veya nakit baskısı var";
    } else {
      karar = "Alma";
      gerekce = "Düşük ROI veya yavaş satış";
    }

    var riskSeviye = score >= 60 ? "Düşük" : score >= 40 ? "Orta" : "Yüksek";

    var updateFields = {
      "Toplam Birim Maliyet TL": birimMaliyet,
      "Sipariş Adedi": siparisAdet,
      "Toplam Yatırım Tutarı TL": toplamYatirim,
      "Pazaryeri Net Satışı": netSatis,
      "Birim Net Kar": Math.round(birimNetKar * 100) / 100,
      "Toplam Net Kar": Math.round(toplamNetKar * 100) / 100,
      ROI: Math.round(roi * 10000) / 100 + "%",
      "Tahmini Satış Süresi Gün": Math.round(satisGun),
      "Tahmini Nakit Dönüş Günü": nakitDonusGun,
      "Risk Seviyesi": riskSeviye,
      "Sipariş Kararı": karar,
      Gerekçe: gerekce,
    };
    for (var col in updateFields) {
      if (ihmap[col] !== undefined) {
        allValues[i][ihmap[col]] = updateFields[col];
      }
    }
    updated++;
  }

  // Tek seferde toplu yaz
  dataRange.setValues(allValues);

  return { ok: true, updated: updated };
}
