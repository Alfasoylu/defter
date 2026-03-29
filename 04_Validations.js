// ─── 5. VALIDATIONS ────────────────────────────────────────────────────────

function applyValidations_() {
  var ss = getSS_();
  var maxRows = 500;

  applyDropdown_(
    ss,
    CONFIG.sheets.giris,
    "İşlem Tipi",
    CONFIG.options.islemTipi,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.giris,
    "Para Birimi",
    CONFIG.options.paraBirimi,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.giris,
    "Durum",
    CONFIG.options.durum,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.giris,
    "Öncelik",
    CONFIG.options.oncelik,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.giris,
    "Alt Kategori",
    CONFIG.options.giderKategori,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.giris,
    "Kanal / Karşı Taraf",
    CONFIG.options.kanal,
    maxRows,
  );

  applyDropdown_(
    ss,
    CONFIG.sheets.borc,
    "Borç Türü",
    CONFIG.options.borcTuru,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.borc,
    "Durum",
    CONFIG.options.borcDurum,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.borc,
    "Öncelik",
    CONFIG.options.oncelik,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.borc,
    "Amaç",
    ["Değer Yaratan", "Koruyucu", "Yapısal"],
    maxRows,
  );

  applyDropdown_(
    ss,
    CONFIG.sheets.alacak,
    "Kanal",
    CONFIG.options.kanal,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.alacak,
    "Durum",
    CONFIG.options.alacakDurum,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.alacak,
    "Öncelik",
    CONFIG.options.oncelik,
    maxRows,
  );

  applyDropdown_(
    ss,
    CONFIG.sheets.sabit,
    "Kategori",
    CONFIG.options.giderKategori,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.sabit,
    "Para Birimi",
    CONFIG.options.paraBirimi,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.sabit,
    "Zorunlu mu",
    CONFIG.options.evetHayir,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.sabit,
    "Kesilebilir mi",
    CONFIG.options.evetHayir,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.sabit,
    "Durum",
    CONFIG.options.sabitDurum,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.sabit,
    "Tekrarlama Tipi",
    CONFIG.options.tekrarlamaTipi,
    maxRows,
  );

  applyDropdown_(
    ss,
    CONFIG.sheets.stok,
    "Stok Durumu",
    CONFIG.options.stokDurum,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.stokHareket,
    "İşlem Türü",
    CONFIG.options.hareketTuru,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.ithalat,
    "Sipariş Kararı",
    CONFIG.options.siparisKarari,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.ithalat,
    "Durum",
    CONFIG.options.ithalatDurum,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.ithalat,
    "Taşıma Tipi",
    CONFIG.options.tasimaType,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.risk,
    "Risk Tipi",
    CONFIG.options.riskTipi,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.risk,
    "Durum",
    ["Açık", "İzleniyor", "Kapandı"],
    maxRows,
  );

  // Kredi Kartları validasyonları
  applyDropdown_(
    ss,
    CONFIG.sheets.krediKarti,
    "Para Birimi",
    CONFIG.options.paraBirimi,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.krediKarti,
    "Ödeme Tercihi",
    CONFIG.options.odemeTercihi,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.krediKarti,
    "Durum",
    CONFIG.options.kartDurum,
    maxRows,
  );

  // Açık Hesap Müşteriler validasyonları
  applyDropdown_(
    ss,
    CONFIG.sheets.acikHesap,
    "Para Birimi",
    CONFIG.options.paraBirimi,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.acikHesap,
    "Tahsil Durumu",
    CONFIG.options.tahsilDurum,
    maxRows,
  );
  applyDropdown_(
    ss,
    CONFIG.sheets.acikHesap,
    "Öncelik",
    CONFIG.options.oncelik,
    maxRows,
  );

  var dateValidations = [
    {
      sheet: CONFIG.sheets.giris,
      cols: ["İşlem Tarihi", "Nakit Etki Tarihi", "Vade Tarihi"],
    },
    { sheet: CONFIG.sheets.borc, cols: ["Vade", "Nakit Etki"] },
    {
      sheet: CONFIG.sheets.alacak,
      cols: ["Sipariş Dönemi", "Tahsil Tarihi"],
    },
    {
      sheet: CONFIG.sheets.sabit,
      cols: [
        "Başlangıç Tarihi",
        "Bitiş Tarihi",
        "Artış Tarihi",
        "Sonraki Oluşturma Tarihi",
      ],
    },
    { sheet: CONFIG.sheets.stokHareket, cols: ["Tarih"] },
    {
      sheet: CONFIG.sheets.ithalat,
      cols: [
        "Sipariş Tarihi",
        "Mal Bedeli Ödeme Tarihi",
        "Navlun Ödeme Tarihi",
        "Gümrük Ödeme Tarihi",
        "Tahmini Varış Tarihi",
        "Tahmini Satış Başlangıcı",
      ],
    },
    { sheet: CONFIG.sheets.risk, cols: ["Etki Tarihi"] },
    {
      sheet: CONFIG.sheets.tahmin,
      cols: ["Tahmin Tarihi", "Tahmini Tahsilat Tarihi"],
    },
    {
      sheet: CONFIG.sheets.krediKarti,
      cols: ["Son Ödeme Tarihi", "Sonraki Son Ödeme Tarihi"],
    },
    {
      sheet: CONFIG.sheets.acikHesap,
      cols: ["Kesim Tarihi", "Vade Tarihi"],
    },
  ];
  for (var d = 0; d < dateValidations.length; d++) {
    for (var dc = 0; dc < dateValidations[d].cols.length; dc++) {
      applyDateValidation_(
        ss,
        dateValidations[d].sheet,
        dateValidations[d].cols[dc],
        maxRows,
      );
    }
  }

  var numberValidations = [
    { sheet: CONFIG.sheets.giris, cols: ["Tutar", "Kur", "Tutar TL"] },
    {
      sheet: CONFIG.sheets.borc,
      cols: [
        "Tutar",
        "Anapara",
        "Aylık Faiz Oranı",
        "Taksit Tutarı",
        "Kalan Anapara",
        "Kalan Taksit Sayısı",
        "Toplam Finansman Maliyeti",
      ],
    },
    {
      sheet: CONFIG.sheets.alacak,
      cols: [
        "Brüt Satış",
        "Komisyon",
        "Kargo Kesintisi",
        "Reklam Kesintisi",
        "Diğer Kesinti",
        "Beklenen Net Tahsilat",
      ],
    },
    {
      sheet: CONFIG.sheets.sabit,
      cols: ["Aylık Tutar", "Kur", "Tutar TL", "Ayın Günü", "Revize Tutar"],
    },
    {
      sheet: CONFIG.sheets.stokHareket,
      cols: [
        "Giriş Adet",
        "Çıkış Adet",
        "Birim Maliyet TL",
        "Toplam Maliyet TL",
      ],
    },
    {
      sheet: CONFIG.sheets.ithalat,
      cols: [
        "RMB Alış Fiyatı",
        "USD Alış Fiyatı",
        "Sipariş Kuru",
        "Ağırlık KG",
        "Kargo USD/KG",
        "Gümrük Oranı",
        "Toplam Birim Maliyet TL",
        "MOQ",
        "Sipariş Adedi",
        "Toplam Yatırım Tutarı TL",
        "Mal Bedeli Tutarı",
        "Navlun Tutarı",
        "Gümrük Tutarı",
        "Lead Time Gün",
        "Beklenen Satış Fiyatı",
        "Pazaryeri Net Satışı",
        "Birim Net Kar",
        "Toplam Net Kar",
        "ROI",
        "Tahmini Satış Süresi Gün",
        "Tahmini Nakit Dönüş Günü",
      ],
    },
    {
      sheet: CONFIG.sheets.tahmin,
      cols: ["Tahmini Satış Tutarı", "Güven Skoru"],
    },
    {
      sheet: CONFIG.sheets.krediKarti,
      cols: [
        "Kredi Limiti",
        "Ekstre Kesim Günü",
        "Son Ödeme Günü",
        "Güncel Bakiye",
        "Asgari Ödeme Tutarı",
        "Son Ekstre Tutarı",
        "Son Ödeme Tutarı",
        "Limit Kullanım %",
        "Beklenen Ödeme Tutarı",
      ],
    },
    {
      sheet: CONFIG.sheets.acikHesap,
      cols: [
        "Tutar",
        "Tahsil Edilen Tutar",
        "Kalan Bakiye",
        "Gecikme Günü",
        "Risk Skoru",
      ],
    },
  ];
  for (var n = 0; n < numberValidations.length; n++) {
    for (var nc = 0; nc < numberValidations[n].cols.length; nc++) {
      applyNumberValidation_(
        ss,
        numberValidations[n].sheet,
        numberValidations[n].cols[nc],
        maxRows,
        0,
      );
    }
  }

  return { ok: true };
}

function applyDropdown_(ss, sheetName, headerName, values, maxRows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var hmap = getHeaderMap_(sheet);
  if (hmap[headerName] == null) return;
  var col = hmap[headerName] + 1;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(CONFIG.dataStartRow, col, maxRows, 1).setDataValidation(rule);
}

function applyDateValidation_(ss, sheetName, headerName, maxRows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var hmap = getHeaderMap_(sheet);
  if (hmap[headerName] == null) return;
  var col = hmap[headerName] + 1;
  var range = sheet.getRange(CONFIG.dataStartRow, col, maxRows, 1);
  var rule = SpreadsheetApp.newDataValidation()
    .requireDateBetween(new Date(2000, 0, 1), new Date(2100, 11, 31))
    .setAllowInvalid(false)
    .build();
  range.clearDataValidations();
  var rules = [];
  for (var r = 0; r < maxRows; r++) {
    rules.push([rule]);
  }
  range.setDataValidations(rules);
  range.setNumberFormat(CONFIG.dateFormat);
}

function applyNumberValidation_(ss, sheetName, headerName, maxRows, minValue) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var hmap = getHeaderMap_(sheet);
  if (hmap[headerName] == null) return;
  var col = hmap[headerName] + 1;
  var floor = minValue == null ? 0 : minValue;
  var rule = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(floor)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(CONFIG.dataStartRow, col, maxRows, 1).setDataValidation(rule);
}
