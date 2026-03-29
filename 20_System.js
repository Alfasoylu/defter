// ─── 19. ORCHESTRATION & MENU ACTIONS ───────────────────────────────────────

function fullSystemSetup_() {
  var results = {};
  results.schemas = setupAllSchemas_();
  results.defaultParams = seedDefaultParams_();
  applyParams_();
  results.validations = applyValidations_();
  results.keys = repairKeys_();
  results.dates = fixDates_();
  results.recurringExpenses = generateRecurringExpenses_();
  results.borcFields = updateBorcComputedFields_();
  results.alacakFields = updateAlacakComputedFields_();
  results.krediKartiFields = updateKrediKartiComputedFields_();
  results.acikHesapFields = updateAcikHesapComputedFields_();
  results.inventory = buildInventoryMetrics_();
  results.skuProfit = buildSkuProfitability_();
  results.demandPressure = buildDemandPressure_();
  results.importDecision = buildImportDecisionEngine_();
  results.salesForecast = buildSalesForecast_();
  var cashData = buildCashProjection_();
  results.cashProjection = writeCashProjection_(cashData);
  results.riskPanel = buildRiskPanel_();
  results.alerts = buildAlerts_();
  results.dashboard = renderDashboard_();
  results.actionCenter = renderActionCenter_();
  results.anaPanel = renderAnaKontrolPaneli_();
  results.ux = applySheetUx_();
  return results;
}

function refreshAllCalculations_() {
  applyParams_();
  updateBorcComputedFields_();
  updateAlacakComputedFields_();
  updateKrediKartiComputedFields_();
  updateAcikHesapComputedFields_();
  buildInventoryMetrics_();
  buildSkuProfitability_();
  buildDemandPressure_();
  buildImportDecisionEngine_();
  buildSalesForecast_();
  var cashData = buildCashProjection_();
  writeCashProjection_(cashData);
  buildRiskPanel_();
  buildAlerts_();
  renderDashboard_();
  renderActionCenter_();
  renderAnaKontrolPaneli_();
}

// ─── LOG ACTION ─────────────────────────────────────────────────────────────

function logAction_(aksiyon, detay) {
  try {
    var ss = getSS_();
    var sheet = ss.getSheetByName(CONFIG.sheets.sistemLog);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.sheets.sistemLog);
      sheet
        .getRange("A1:D1")
        .setValues([["Tarih", "Kullanıcı", "Aksiyon", "Detay"]])
        .setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    var user = "";
    try {
      user = Session.getActiveUser().getEmail();
    } catch (e) {
      user = "sistem";
    }
    var row = sheet.getLastRow() + 1;
    sheet
      .getRange(row, 1, 1, 4)
      .setValues([[new Date(), user, aksiyon, detay || ""]]);
  } catch (e) {
    Logger.log("logAction_ hata: " + e.message);
  }
}
