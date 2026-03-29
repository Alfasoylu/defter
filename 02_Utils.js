// ─── 3. UTILITY HELPERS ─────────────────────────────────────────────────────

/** CLI/Execution API uyumluluğu: override varsa onu, yoksa active spreadsheet'i döndürür */
var _SS_OVERRIDE = null;
function getSS_() {
  return _SS_OVERRIDE || SpreadsheetApp.getActiveSpreadsheet();
}

function today_() {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey_(d) {
  if (!d) return "";
  var dd = d.getDate(),
    mm = d.getMonth() + 1,
    yy = d.getFullYear();
  return (dd < 10 ? "0" : "") + dd + "." + (mm < 10 ? "0" : "") + mm + "." + yy;
}

function parseTurkishDate_(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  var s = String(v).trim();
  var m = s.match(/^(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})$/);
  if (m) {
    var day = Number(m[1]);
    var month = Number(m[2]);
    var year = Number(m[3]);
    var parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }
    return parsed;
  }
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseCurrency_(v) {
  if (typeof v === "number") return v;
  if (!v) return 0;
  var s = String(v)
    .replace(/[^\d,.\-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function formatTL_(n) {
  if (n == null || isNaN(n)) return "0,00";
  var fixed = Math.abs(n).toFixed(2);
  var parts = fixed.split(".");
  var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (n < 0 ? "-" : "") + intPart + "," + parts[1];
}

function generateId_(prefix) {
  return prefix + "-" + Utilities.getUuid().substr(0, 8);
}

function daysBetween_(a, b) {
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addDays_(d, n) {
  var r = new Date(d.getTime());
  r.setDate(r.getDate() + n);
  return r;
}

function clamp_(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function safeDivide_(num, den, fallback) {
  return den === 0 ? fallback || 0 : num / den;
}

function columnToLetter_(columnNumber) {
  var dividend = columnNumber;
  var columnName = "";
  while (dividend > 0) {
    var modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return columnName;
}

function getHeaderMap_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) return {};
  var headers = sheet
    .getRange(CONFIG.headerRow, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    if (headers[i]) map[String(headers[i]).trim()] = i;
  }
  return map;
}

function getRowAsMap_(sheet, row, hmap) {
  if (row < CONFIG.dataStartRow || row > sheet.getLastRow()) return null;
  var cols = Object.keys(hmap).length;
  if (cols < 1) return null;
  var vals = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var obj = {};
  for (var key in hmap) {
    obj[key] = vals[hmap[key]];
  }
  obj._row = row;
  return obj;
}

function getAllRows_(sheet) {
  var hmap = getHeaderMap_(sheet);
  var rows = [];
  var lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.dataStartRow) return rows;
  var data = sheet
    .getRange(
      CONFIG.dataStartRow,
      1,
      lastRow - CONFIG.dataStartRow + 1,
      sheet.getLastColumn(),
    )
    .getValues();
  for (var i = 0; i < data.length; i++) {
    var obj = {};
    var hasData = false;
    for (var key in hmap) {
      obj[key] = data[i][hmap[key]];
      if (data[i][hmap[key]] !== "" && data[i][hmap[key]] != null)
        hasData = true;
    }
    obj._row = CONFIG.dataStartRow + i;
    if (hasData) rows.push(obj);
  }
  return rows;
}

function setRowValues_(sheet, row, hmap, obj) {
  var maxCol = sheet.getLastColumn();
  var vals = sheet.getRange(row, 1, 1, maxCol).getValues()[0];
  for (var key in obj) {
    if (key === "_row") continue;
    if (obj[key] === undefined) continue;
    if (hmap[key] != null && hmap[key] < maxCol) {
      vals[hmap[key]] = obj[key];
    }
  }
  sheet.getRange(row, 1, 1, maxCol).setValues([vals]);
}

function findFirstEmptyRow_(sheet) {
  var last = sheet.getLastRow();
  return last < CONFIG.dataStartRow ? CONFIG.dataStartRow : last + 1;
}

function findRowByKey_(sheet, hmap, keyCol, keyVal) {
  if (!keyVal) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.dataStartRow) return -1;
  var idx = hmap[keyCol];
  if (idx == null) return -1;
  var data = sheet
    .getRange(
      CONFIG.dataStartRow,
      idx + 1,
      lastRow - CONFIG.dataStartRow + 1,
      1,
    )
    .getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(keyVal).trim()) {
      return CONFIG.dataStartRow + i;
    }
  }
  return -1;
}
