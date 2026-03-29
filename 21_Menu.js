// --- Menu handlers ---

function menuTamSistemKurulumu() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    "Tam Sistem Kurulumu",
    "Tüm sayfalar oluşturulacak, şemalar kurulacak ve hesaplamalar çalıştırılacak. Devam edilsin mi?",
    ui.ButtonSet.YES_NO,
  );
  if (response !== ui.Button.YES) return;
  var result = fullSystemSetup_();
  ui.alert(
    "Tamamlandı",
    "Sistem kurulumu başarıyla tamamlandı.\n\n" +
      JSON.stringify(result, null, 2).substring(0, 800),
    ui.ButtonSet.OK,
  );
}

function menuSemalariKur() {
  menuAction_("Tüm şemalar kurulacak.", setupAllSchemas_);
}

function menuDogrulamalariUygula() {
  menuAction_("Veri doğrulamaları uygulanacak.", applyValidations_);
}

function menuParametrelerYukle() {
  menuAction_("Parametreler yüklenecek / eksikler eklenecek.", function () {
    var seedResult = seedDefaultParams_();
    applyParams_();
    return {
      seeded: seedResult.added,
      totalParams: seedResult.total,
      applied: true,
    };
  });
}

function menuDashboardYenile() {
  menuAction_("Dashboard yenilenecek.", function () {
    refreshAllCalculations_();
    return { ok: true };
  });
}

function menuNakitAkisiHesapla() {
  menuAction_("Nakit akışı hesaplanacak.", function () {
    var data = buildCashProjection_();
    return writeCashProjection_(data);
  });
}

function menuStokZekasi() {
  menuAction_("Stok zekası güncellenecek.", function () {
    var inv = buildInventoryMetrics_();
    var sku = buildSkuProfitability_();
    var dem = buildDemandPressure_();
    return { inventory: inv, sku: sku, demand: dem };
  });
}

function menuIthalatKarar() {
  menuAction_("İthalat karar motoru çalıştırılacak.", function () {
    buildInventoryMetrics_();
    buildDemandPressure_();
    return buildImportDecisionEngine_();
  });
}

function menuSabitGiderOlustur() {
  menuAction_("Sabit giderler oluşturulacak.", generateRecurringExpenses_);
}

function menuTahminGuncelle() {
  menuAction_("Tahmini satışlar güncellenecek.", buildSalesForecast_);
}

function menuKararMotoru() {
  menuAction_("Karar motoru çalıştırılacak.", function () {
    var result = buildDecisionEngine_();
    return { kararSayisi: result.kararlar.length, ok: true };
  });
}

function menuKayitIdBakimi() {
  menuAction_("Kayıt ID'leri kontrol edilecek.", repairKeys_);
}

function menuTarihDuzelt() {
  menuAction_("Tarih formatları düzeltilecek.", fixDates_);
}

function menuRiskYenile() {
  menuAction_("Risk paneli yenilenecek.", buildRiskPanel_);
}

function menuUyarilarGuncelle() {
  menuAction_("Uyarılar güncellenecek.", function () {
    applyParams_();
    var result = buildAlerts_(true);
    return {
      toplam: result.ozet.toplam,
      kritik: result.ozet.kritik,
      yuksek: result.ozet.yuksek,
    };
  });
}

function menuAksiyonYenile() {
  menuAction_("Aksiyon merkezi yenilenecek.", function () {
    refreshAllCalculations_();
    return { ok: true };
  });
}

function menuAnaKontrolGuncelle() {
  menuAction_("Ana kontrol paneli güncellenecek.", renderAnaKontrolPaneli_);
}

function menuUxUygula() {
  menuAction_(
    "Sayfa renkleri, başlık renkleri, korumalar ve Başlangıç rehberi uygulanacak.",
    applySheetUx_,
  );
}

// ─── VERİ PIPELINE MENÜ HANDLERLERİ ─────────────────────────────────────────

function menuImportStock() {
  menuAction_(
    "Stok verisi _IMPORT_STOCK sayfasından RAW_STOCK'a aktarılacak.",
    function () {
      applyParams_();
      return importStockData_();
    },
  );
}

function menuBuildCleanData() {
  menuAction_(
    "RAW_SALES ve RAW_STOCK verileri birleştirilip CLEAN_DATA oluşturulacak.",
    function () {
      applyParams_();
      var clean = buildCleanData_();
      var sync = syncCleanDataToStokEnvanter_();
      return { cleanData: clean, stokSync: sync };
    },
  );
}

function menuBaslangicGoster() {
  var ss = getSS_();
  var sheet = ss.getSheetByName("Başlangıç");
  if (!sheet) {
    SpreadsheetApp.getUi().alert(
      "Başlangıç sayfası bulunamadı. Önce UX formatını uygulayın.",
    );
    return;
  }
  ss.setActiveSheet(sheet);
}

function menuAction_(description, action) {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    "İşlem Onayı",
    description + "\n\nDevam edilsin mi?",
    ui.ButtonSet.YES_NO,
  );
  if (response !== ui.Button.YES) return;
  try {
    var result = action();
    ui.alert(
      "Tamamlandı",
      JSON.stringify(result, null, 2).substring(0, 800),
      ui.ButtonSet.OK,
    );
  } catch (err) {
    ui.alert("Hata", err.toString(), ui.ButtonSet.OK);
  }
}
