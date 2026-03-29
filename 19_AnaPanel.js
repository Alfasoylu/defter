// ─── 18. ANA KONTROL PANELİ ─────────────────────────────────────────────────

function renderAnaKontrolPaneli_() {
  var ss = SpreadsheetApp.openById(getSS_().getId());
  var sheet = ensureSheetExists_(ss, CONFIG.sheets.ana);
  var t = today_();

  sheet.clear();
  if (sheet.getMaxColumns() < 6) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 6 - sheet.getMaxColumns());
  }

  sheet
    .getRange("A1")
    .setValue("ANA KONTROL PANELİ")
    .setFontSize(16)
    .setFontWeight("bold");
  sheet
    .getRange("A2")
    .setValue("Muhasebe & İthalat Karar Sistemi v3.0")
    .setFontColor("#666666");
  sheet
    .getRange("A3")
    .setValue(
      "Son güncelleme: " +
        dateKey_(t) +
        " " +
        Utilities.formatDate(new Date(), CONFIG.timezone, "HH:mm"),
    );

  // Navigation first so mobile users see actions without scrolling.
  sheet
    .getRange("A5")
    .setValue("MENÜ KISA YOLLARI")
    .setFontWeight("bold")
    .setFontSize(12);
  var menuItems = [
    "Tam Sistem Kurulumu → Muhasebe Sistemi menüsünden çalıştırın",
    "Dashboard Yenile → Tüm finansal metrikleri günceller",
    "Nakit Akışını Hesapla → 90 günlük projeksiyon oluşturur",
    "Stok Zekasını Güncelle → Envanter metriklerini hesaplar",
    "İthalat Karar Motoru → Sipariş önceliklerini belirler",
    "Sabit Giderleri Oluştur → Borç Takibine gelecek giderleri yazar",
    "Aksiyon Merkezi → Öncelik sıralı görev listesi",
  ];
  for (var m = 0; m < menuItems.length; m++) {
    sheet.getRange(6 + m, 1).setValue("• " + menuItems[m]);
  }

  // System health
  sheet
    .getRange(14, 1)
    .setValue("SİSTEM DURUMU")
    .setFontWeight("bold")
    .setFontSize(12);
  var sheetNames = Object.keys(CONFIG.sheets);
  var healthRows = [];
  for (var i = 0; i < sheetNames.length; i++) {
    var name = CONFIG.sheets[sheetNames[i]];
    var exists = ss.getSheetByName(name) != null;
    var sh = ss.getSheetByName(name);
    var rowCount = 0;
    if (sh) {
      try {
        rowCount =
          sh.getLastRow() > CONFIG.headerRow
            ? sh.getLastRow() - CONFIG.headerRow
            : 0;
      } catch (e) {
        ss = SpreadsheetApp.openById(ss.getId());
        sh = ss.getSheetByName(name);
        rowCount =
          sh && sh.getLastRow() > CONFIG.headerRow
            ? sh.getLastRow() - CONFIG.headerRow
            : 0;
      }
    }
    healthRows.push([
      name,
      exists ? "✓ Mevcut" : "✗ Eksik",
      rowCount + " kayıt",
    ]);
  }
  sheet
    .getRange(15, 1, 1, 3)
    .setValues([["Sayfa", "Durum", "Kayıt"]])
    .setFontWeight("bold");
  sheet.getRange(16, 1, healthRows.length, 3).setValues(healthRows);

  return { ok: true };
}
