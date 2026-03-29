/**
 * Parametreler sayfasından tüm parametreleri okuyup CONFIG.params'a yükler.
 * Sayfa yoksa veya boşsa CONFIG'deki hardcoded değerler korunur.
 */
function loadParams_() {
  var ss = getSS_();
  var sheet = ss.getSheetByName(CONFIG.sheets.parametreler);
  if (!sheet || sheet.getLastRow() < CONFIG.dataStartRow) return;

  var hmap = getHeaderMap_(sheet);
  var rows = getAllRows_(sheet, hmap);
  var params = {};
  for (var i = 0; i < rows.length; i++) {
    var key = String(rows[i]["Parametre Anahtarı"] || "").trim();
    var val = String(rows[i]["Değer"] || "").trim();
    var vtype = String(rows[i]["Değer Tipi"] || "")
      .trim()
      .toLowerCase();
    if (!key) continue;
    if (vtype === "number") {
      params[key] = parseFloat(val) || 0;
    } else {
      params[key] = val;
    }
  }
  CONFIG.params = params;
}

/**
 * Tek parametre değerini döndürür. Önce CONFIG.params, sonra fallback.
 */
function getParam_(key, fallback) {
  if (CONFIG.params && CONFIG.params.hasOwnProperty(key)) {
    return CONFIG.params[key];
  }
  return fallback;
}

/**
 * CONFIG'deki hardcoded değerleri Parametreler sayfasından okunan değerlerle günceller.
 * loadParams_() çalıştıktan sonra çağrılmalıdır.
 */
function applyParams_() {
  loadParams_();
  // Projeksiyon
  CONFIG.projectionDays = getParam_("projection_days", CONFIG.projectionDays);
  CONFIG.cashReserveMultiplier = getParam_(
    "cash_reserve_multiplier",
    CONFIG.cashReserveMultiplier,
  );
  CONFIG.debtReserveMultiplier = getParam_(
    "debt_reserve_multiplier",
    CONFIG.debtReserveMultiplier,
  );
  CONFIG.delayBufferDays = getParam_(
    "delay_buffer_days",
    CONFIG.delayBufferDays,
  );
  // Stok
  CONFIG.defaultTurnoverCoeff = getParam_(
    "default_turnover_coeff",
    CONFIG.defaultTurnoverCoeff,
  );
  CONFIG.safetyStockDays = getParam_(
    "safety_stock_days",
    CONFIG.safetyStockDays,
  );
  CONFIG.defaultLeadTimeDays = getParam_(
    "default_lead_time_days",
    CONFIG.defaultLeadTimeDays,
  );
  // İthalat ağırlıkları
  CONFIG.importWeights.roi = getParam_(
    "import_w_roi",
    CONFIG.importWeights.roi,
  );
  CONFIG.importWeights.salesVelocity = getParam_(
    "import_w_sales_velocity",
    CONFIG.importWeights.salesVelocity,
  );
  CONFIG.importWeights.stockoutUrgency = getParam_(
    "import_w_stockout_urgency",
    CONFIG.importWeights.stockoutUrgency,
  );
  CONFIG.importWeights.demandConfidence = getParam_(
    "import_w_demand_confidence",
    CONFIG.importWeights.demandConfidence,
  );
  CONFIG.importWeights.cashPressure = getParam_(
    "import_w_cash_pressure",
    CONFIG.importWeights.cashPressure,
  );
  CONFIG.importWeights.leadTimeRisk = getParam_(
    "import_w_lead_time_risk",
    CONFIG.importWeights.leadTimeRisk,
  );
  CONFIG.importWeights.slowMoving = getParam_(
    "import_w_slow_moving",
    CONFIG.importWeights.slowMoving,
  );
}

/**
 * Parametreler sayfasına DEFAULT_PARAMS'taki varsayılan değerleri yazar.
 * Mevcut parametreleri korur — sadece eksik anahtarları ekler.
 */
function seedDefaultParams_() {
  var ss = getSS_();
  setupSheetSchema_(ss, CONFIG.sheets.parametreler, false);
  var sheet = ss.getSheetByName(CONFIG.sheets.parametreler);
  var hmap = getHeaderMap_(sheet);

  // Mevcut anahtarları topla
  var existingKeys = {};
  if (sheet.getLastRow() >= CONFIG.dataStartRow) {
    var rows = getAllRows_(sheet, hmap);
    for (var i = 0; i < rows.length; i++) {
      var k = String(rows[i]["Parametre Anahtarı"] || "").trim();
      if (k) existingKeys[k] = true;
    }
  }

  // Eksik parametreleri ekle
  var now = Utilities.formatDate(
    new Date(),
    CONFIG.timezone,
    CONFIG.dateFormat + " HH:mm",
  );
  var added = 0;
  for (var j = 0; j < DEFAULT_PARAMS.length; j++) {
    var p = DEFAULT_PARAMS[j];
    if (existingKeys[p[0]]) continue;
    var nextRow = sheet.getLastRow() + 1;
    var vals = [p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], now, "Sistem"];
    sheet.getRange(nextRow, 1, 1, vals.length).setValues([vals]);
    added++;
  }
  return { added: added, total: DEFAULT_PARAMS.length };
}
