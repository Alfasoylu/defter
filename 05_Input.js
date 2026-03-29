// ─── 6. INPUT NORMALIZATION & ROUTING ───────────────────────────────────────

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu("Muhasebe Sistemi");

  menu.addItem("📋 Başlangıç Rehberini Göster", "menuBaslangicGoster");
  menu.addSeparator();

  menu.addSubMenu(
    ui
      .createMenu("⚙️ Sistem Kurulum")
      .addItem("Tam Sistem Kurulumu", "menuTamSistemKurulumu")
      .addItem("Tüm Şemaları Yeniden Kur", "menuSemalariKur")
      .addItem("Veri Doğrulamalarını Uygula", "menuDogrulamalariUygula")
      .addItem("Parametreleri Yükle / Güncelle", "menuParametrelerYukle")
      .addItem("UX Formatını Uygula", "menuUxUygula"),
  );

  menu.addSubMenu(
    ui
      .createMenu("📊 Hesapla / Yenile")
      .addItem("Dashboard Yenile", "menuDashboardYenile")
      .addItem("Nakit Akışını Hesapla", "menuNakitAkisiHesapla")
      .addItem("Stok Zekasını Güncelle", "menuStokZekasi")
      .addItem("İthalat Karar Motorunu Çalıştır", "menuIthalatKarar")
      .addItem("Sabit Giderleri Oluştur", "menuSabitGiderOlustur")
      .addItem("Tahmini Satışları Güncelle", "menuTahminGuncelle")
      .addItem("Karar Motorunu Çalıştır", "menuKararMotoru"),
  );

  menu.addSubMenu(
    ui
      .createMenu("� Veri Pipeline")
      .addItem("Satış Verisi İçe Aktar", "menuImportSales")
      .addItem("Stok Verisi İçe Aktar", "menuImportStock")
      .addItem("CLEAN_DATA Oluştur", "menuBuildCleanData")
      .addItem("Tam Pipeline Çalıştır", "menuFullPipeline")
      .addItem("Pipeline Doğrulama Testi", "menuPipelineValidation"),
  );

  menu.addSubMenu(
    ui
      .createMenu("�🔧 Bakım")
      .addItem("Kayıt ID Bakımı", "menuKayitIdBakimi")
      .addItem("Tarih Formatlarını Düzelt", "menuTarihDuzelt")
      .addItem("Risk Panelini Yenile", "menuRiskYenile")
      .addItem("Uyarıları Güncelle", "menuUyarilarGuncelle")
      .addItem("Aksiyon Merkezini Yenile", "menuAksiyonYenile")
      .addItem("Ana Kontrol Panelini Güncelle", "menuAnaKontrolGuncelle"),
  );

  menu.addSeparator();
  menu.addItem("🧪 Smoke Test Çalıştır", "menuSmokeTest");

  menu.addToUi();
}

function onEdit(e) {
  if (!e || !e.range || !e.source) return;
  var sheet = e.range.getSheet();
  var name = sheet.getName();

  if (name === CONFIG.sheets.giris) {
    var row = e.range.getRow();
    if (row < CONFIG.dataStartRow) return;
    var lock = LockService.getDocumentLock();
    lock.waitLock(CONFIG.lockTimeoutMs);
    try {
      normalizeInputRow_(sheet, row);
      routeInputRow_(e.source, sheet, row);
    } finally {
      lock.releaseLock();
    }
  }
}

function normalizeInputRow_(sheet, row) {
  var hmap = getHeaderMap_(sheet);
  var obj = getRowAsMap_(sheet, row, hmap);
  if (!obj) return;

  var updates = {};
  var now = Utilities.formatDate(
    new Date(),
    CONFIG.timezone,
    CONFIG.dateFormat + " HH:mm",
  );

  // Auto-generate ID
  if (!obj["Kayıt ID"]) {
    updates["Kayıt ID"] = generateId_(CONFIG.prefixes.giris);
  }

  // Auto-calc Tutar TL
  var tutar = parseCurrency_(obj["Tutar"]);
  var kur = parseCurrency_(obj["Kur"]);
  var pb = String(obj["Para Birimi"] || "").trim();
  if (pb && pb !== "TRY" && kur > 0) {
    updates["Tutar TL"] = tutar * kur;
  } else if (!pb || pb === "TRY") {
    updates["Tutar TL"] = tutar;
    updates["Kur"] = 1;
  }

  var dateCols = getInputDateColumns_();
  for (var d = 0; d < dateCols.length; d++) {
    var colName = dateCols[d];
    if (!obj[colName] || obj[colName] instanceof Date) continue;
    var parsedDate = parseTurkishDate_(obj[colName]);
    if (parsedDate) {
      updates[colName] = parsedDate;
    }
  }

  // Timestamps
  if (!obj["Oluşturulma"]) {
    updates["Oluşturulma"] = now;
  }
  updates["Güncellenme"] = now;

  if (Object.keys(updates).length > 0) {
    setRowValues_(sheet, row, hmap, updates);
  }
}

function getInputDateColumns_() {
  return ["İşlem Tarihi", "Nakit Etki Tarihi", "Vade Tarihi"];
}

function getInputRowValidationErrors_(obj) {
  var errors = [];
  var islemTarihiRaw = obj["İşlem Tarihi"];
  var islemTarihi = parseTurkishDate_(islemTarihiRaw);
  if (!islemTarihiRaw) {
    errors.push("İşlem Tarihi zorunlu");
  } else if (!islemTarihi) {
    errors.push("İşlem Tarihi geçersiz");
  }

  var dateCols = getInputDateColumns_();
  for (var d = 0; d < dateCols.length; d++) {
    var colName = dateCols[d];
    var value = obj[colName];
    if (!value || colName === "İşlem Tarihi") continue;
    if (!parseTurkishDate_(value)) {
      errors.push(colName + " geçersiz");
    }
  }

  var tip = String(obj["İşlem Tipi"] || "").trim();
  if (!tip) {
    errors.push("İşlem Tipi zorunlu");
  } else if (CONFIG.options.islemTipi.indexOf(tip) < 0) {
    errors.push("İşlem Tipi geçersiz");
  }

  var tutar = parseCurrency_(obj["Tutar"]);
  if (!(tutar > 0)) {
    errors.push("Tutar 0'dan büyük olmalı");
  }

  var paraBirimi = String(obj["Para Birimi"] || "").trim();
  if (!paraBirimi) {
    errors.push("Para Birimi zorunlu");
  } else if (CONFIG.options.paraBirimi.indexOf(paraBirimi) < 0) {
    errors.push("Para Birimi geçersiz");
  }

  var kur = parseCurrency_(obj["Kur"]);
  if (paraBirimi && paraBirimi !== "TRY" && !(kur > 0)) {
    errors.push("TRY dışı para birimi için Kur zorunlu");
  }

  return errors;
}

function setInputRowValidationState_(sheet, row, hmap, errors) {
  var statusCol = hmap["Kayıt ID"] != null ? hmap["Kayıt ID"] + 1 : 1;
  var statusCell = sheet.getRange(row, statusCol);
  if (!errors || errors.length === 0) {
    statusCell.clearNote();
    return;
  }
  statusCell.setNote("VALIDATION_ERROR\n" + errors.join("\n"));
}

/**
 * Zorunlu alanları kontrol eder. Eksik varsa routing yapılmaz.
 */
function validateInputRow_(sheet, row, hmap) {
  var obj = getRowAsMap_(sheet, row, hmap);
  if (!obj) return ["Satır okunamadı"];
  return getInputRowValidationErrors_(obj);
}

function routeInputRow_(ss, sheet, row) {
  var hmap = getHeaderMap_(sheet);

  // Validation gate — skip routing if mandatory fields are missing
  var validationErrors = validateInputRow_(sheet, row, hmap);
  setInputRowValidationState_(sheet, row, hmap, validationErrors);
  if (validationErrors.length > 0) return;

  var obj = getRowAsMap_(sheet, row, hmap);
  if (!obj) return;

  var tip = String(obj["İşlem Tipi"]).trim();
  var durum = String(obj["Durum"] || "").trim();
  var tutarTL = parseCurrency_(obj["Tutar TL"]) || parseCurrency_(obj["Tutar"]);

  // İptal propagation — cancel mirror records
  if (durum === "İptal") {
    propagateCancel_(ss, obj);
    return;
  }

  // Route to Borç Takibi
  if (
    tip === "Ödeme" ||
    tip === "Masraf" ||
    tip === "Kart Harcaması" ||
    tip === "Sabit Gider" ||
    tip === "Vergi" ||
    tip === "Finansman" ||
    tip === "İthalat Siparişi" ||
    tip === "Pazaryeri Kesintisi"
  ) {
    routeToBorc_(ss, obj, tutarTL);
  }

  // Borç Ödemesi → find & update linked borç
  if (tip === "Borç Ödemesi") {
    routeBorcOdemesi_(ss, obj, tutarTL);
  }

  // Route to Alacak Takibi
  if (tip === "Tahsilat") {
    routeToAlacak_(ss, obj, tutarTL);
  }


}

/**
 * İptal edilen kaydın yansımalarını Borç ve Alacak'ta günceller.
 */
function propagateCancel_(ss, obj) {
  var kayitId = String(obj["Kayıt ID"] || "").trim();
  if (!kayitId) return;

  // Borç Takibi
  var borcSheet = ss.getSheetByName(CONFIG.sheets.borc);
  if (borcSheet) {
    var bh = getHeaderMap_(borcSheet);
    var r = findRowByKey_(borcSheet, bh, "Borç Kodu", kayitId);
    if (r > 0) setRowValues_(borcSheet, r, bh, { Durum: "İptal" });
  }

  // Alacak Takibi
  var alacakSheet = ss.getSheetByName(CONFIG.sheets.alacak);
  if (alacakSheet) {
    var ah = getHeaderMap_(alacakSheet);
    var r2 = findRowByKey_(alacakSheet, ah, "Alacak Kodu", kayitId);
    if (r2 > 0) setRowValues_(alacakSheet, r2, ah, { Durum: "İptal" });
  }
}

/**
 * Borç Ödemesi: Bağlı Plan Kodu ile bağlı borcu Ödendi yapar,
 * ödeme kaydını da Borç'a yazar.
 */
function routeBorcOdemesi_(ss, obj, tutarTL) {
  var sheet = ss.getSheetByName(CONFIG.sheets.borc);
  if (!sheet) return;
  var hmap = getHeaderMap_(sheet);

  // Mark linked borç as paid
  var linkedKey = String(obj["Bağlı Plan Kodu"] || "").trim();
  if (linkedKey) {
    var linkedRow = findRowByKey_(sheet, hmap, "Borç Kodu", linkedKey);
    if (linkedRow > 0) {
      setRowValues_(sheet, linkedRow, hmap, { Durum: "Ödendi" });
    }
  }

  // Also record the payment itself
  routeToBorc_(ss, obj, tutarTL);
}

function routeToBorc_(ss, obj, tutarTL) {
  var sheet = ss.getSheetByName(CONFIG.sheets.borc);
  if (!sheet) return;
  var hmap = getHeaderMap_(sheet);
  var tip = String(obj["İşlem Tipi"]).trim();

  // Map İşlem Tipi → Borç Türü
  var borcTuru;
  if (tip === "Sabit Gider" || tip === "Masraf") {
    borcTuru = String(obj["Alt Kategori"] || "Diğer");
  } else if (tip === "Kart Harcaması") {
    borcTuru = "Kredi Kartı";
  } else if (tip === "Pazaryeri Kesintisi") {
    borcTuru = "Tedarikçi";
  } else if (tip === "Borç Ödemesi") {
    borcTuru = String(obj["Alt Kategori"] || "Diğer");
  } else {
    borcTuru = tip;
  }

  // Check if already routed
  var existingRow = findRowByKey_(sheet, hmap, "Borç Kodu", obj["Kayıt ID"]);
  var data = {
    "Borç Kodu": obj["Kayıt ID"],
    "Borç Türü": borcTuru,
    "Kurum / Kişi": obj["Kanal / Karşı Taraf"] || "",
    Vade: obj["Vade Tarihi"] || obj["Nakit Etki Tarihi"] || "",
    Tutar: tutarTL,
    Durum: obj["Durum"] === "Gerçekleşti" ? "Ödendi" : "Planlandı",
    Öncelik: obj["Öncelik"] || "Orta",
    "Nakit Etki": obj["Nakit Etki Tarihi"] || "",
    Açıklama: obj["Açıklama"] || "",
  };

  if (existingRow > 0) {
    setRowValues_(sheet, existingRow, hmap, data);
  } else {
    var newRow = findFirstEmptyRow_(sheet);
    setRowValues_(sheet, newRow, hmap, data);
  }
}

function routeToAlacak_(ss, obj, tutarTL) {
  var sheet = ss.getSheetByName(CONFIG.sheets.alacak);
  if (!sheet) return;
  var hmap = getHeaderMap_(sheet);

  var existingRow = findRowByKey_(sheet, hmap, "Alacak Kodu", obj["Kayıt ID"]);
  var data = {
    "Alacak Kodu": obj["Kayıt ID"],
    Kanal: obj["Kanal / Karşı Taraf"] || "",
    "Sipariş Dönemi": obj["İşlem Tarihi"] || "",
    "Tahsil Tarihi": obj["Vade Tarihi"] || obj["Nakit Etki Tarihi"] || "",
    "Brüt Satış": tutarTL,
    "Beklenen Net Tahsilat": tutarTL,
    Durum: obj["Durum"] === "Gerçekleşti" ? "Tahsil Edildi" : "Bekleniyor",
    Öncelik: obj["Öncelik"] || "Orta",
  };

  if (existingRow > 0) {
    setRowValues_(sheet, existingRow, hmap, data);
  } else {
    var newRow = findFirstEmptyRow_(sheet);
    setRowValues_(sheet, newRow, hmap, data);
  }
}
