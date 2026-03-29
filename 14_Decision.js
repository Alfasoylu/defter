// ─── 14e. DECISION ENGINE ───────────────────────────────────────────────────

function buildDecisionEngine_() {
  var ss = getSS_();
  var cashData = buildCashProjection_();
  var proj = cashData.projection;
  var minReserve = cashData.minCashReserve;

  var thresholds = buildMarginTurnoverThresholds_();
  var importCap = buildSafeImportCapacity_();

  var kararlar = [];

  // 1. Nakit koruma kuralları
  var min7 = Infinity;
  for (var i = 0; i < Math.min(7, proj.length); i++) {
    min7 = Math.min(min7, proj[i].kapanis);
  }
  if (min7 === Infinity) min7 = 0;

  if (min7 < 0) {
    kararlar.push({
      baslik: "KRİTİK: ALIM DURDUR",
      oncelik: "Kritik",
      dayanak: "7 gün içinde negatif bakiye (" + formatTL_(min7) + " TL)",
      ufuk: "7 gün",
      aksiyon: "Tüm alımları durdur, tahsilatı hızlandır, acil ödeme planı yap",
    });
  } else if (importCap.min30 < minReserve) {
    kararlar.push({
      baslik: "TEMKİNLİ MOD",
      oncelik: "Yüksek",
      dayanak:
        "30 gün min bakiye (" +
        formatTL_(importCap.min30) +
        " TL) güvenli tamponun (" +
        formatTL_(minReserve) +
        " TL) altında",
      ufuk: "30 gün",
      aksiyon: "Yeni alımlardan kaçın, mevcut nakdi koru",
    });
  }

  // 2. İthalat kuralları
  if (min7 >= 0 && importCap.min30 >= minReserve) {
    if (importCap.guvenliKapasite > 0) {
      kararlar.push({
        baslik: "GÜVENLİ İTHALAT YAP",
        oncelik: "Orta",
        dayanak:
          "Güvenli kapasite: " +
          formatTL_(importCap.guvenliKapasite) +
          " TL, tampon korunuyor",
        ufuk: "30 gün",
        aksiyon:
          "A sınıfı ürünlere öncelik ver, kapasite: " +
          formatTL_(importCap.guvenliKapasite) +
          " TL",
      });
    }
  } else if (importCap.temkinliKapasite > 0 && min7 >= 0) {
    kararlar.push({
      baslik: "TEMKİNLİ İTHALAT YAP",
      oncelik: "Orta",
      dayanak: "Temkinli kapasite mevcut ama tampon daralıyor",
      ufuk: "60 gün",
      aksiyon:
        "Kısmi sipariş ver, aşamalı alım tercih et, kapasite: " +
        formatTL_(importCap.temkinliKapasite) +
        " TL",
    });
  } else if (min7 >= 0) {
    kararlar.push({
      baslik: "İTHALATI ERTELE",
      oncelik: "Yüksek",
      dayanak: "Nakit baskısı yüksek, tampon korunamıyor",
      ufuk: "30 gün",
      aksiyon: "Tahsilatları hızlandır, stok eritmeyi değerlendir",
    });
  }

  // 3. Kredi kuralları
  if (
    importCap.krediKarar === "KREDİ KULLANILABİLİR" &&
    importCap.maxKrediTutar > 0
  ) {
    kararlar.push({
      baslik: "KREDİ KULLANILABİLİR",
      oncelik: "Düşük",
      dayanak:
        "DSCR: " +
        importCap.dscr +
        ", max tutar: " +
        formatTL_(importCap.maxKrediTutar) +
        " TL, max faiz: %" +
        importCap.maxFaiz * 100,
      ufuk: "90 gün",
      aksiyon:
        "Aylık %" +
        importCap.maxFaiz * 100 +
        " faize kadar, " +
        formatTL_(importCap.maxKrediTutar) +
        " TL tutara kadar kullanılabilir",
    });
  } else if (importCap.krediKarar === "SINIRLI / KISA VADELİ KULLAN") {
    kararlar.push({
      baslik: "SINIRLI KREDİ KULLANILABİLİR",
      oncelik: "Orta",
      dayanak:
        "DSCR sınırda (" +
        importCap.dscr +
        "), kısa vadeli küçük tutar tercih edilmeli",
      ufuk: "30 gün",
      aksiyon: "Kısa vadeli küçük tutarlı kredi değerlendir",
    });
  } else if (importCap.krediKarar === "KREDİ KULLANMA") {
    kararlar.push({
      baslik: "KREDİ KULLANMA",
      oncelik: "Yüksek",
      dayanak:
        "DSCR yetersiz (" +
        importCap.dscr +
        "), borç servis baskısı taşınamıyor",
      ufuk: "90 gün",
      aksiyon: "Mevcut borçları yönet, yeni borçlanmadan kaçın",
    });
  }

  // 4. Marj ve devir uyarıları
  if (thresholds.uyarilar.length > 0) {
    for (var u = 0; u < thresholds.uyarilar.length; u++) {
      kararlar.push({
        baslik: "MARJ / DEVİR UYARISI",
        oncelik: "Orta",
        dayanak: thresholds.uyarilar[u],
        ufuk: "90 gün",
        aksiyon:
          "Min brüt marj: %" +
          thresholds.minBrutMarj +
          ", max devir: " +
          thresholds.maxDevirGun +
          " gün",
      });
    }
  }

  // 5. Gider kuralları
  var negatifGun = 0;
  for (var n = 0; n < proj.length; n++) {
    if (proj[n].kapanis < 0) negatifGun++;
  }
  if (negatifGun > 15) {
    kararlar.push({
      baslik: "KÜÇÜLME SENARYOSU DEĞERLENDİR",
      oncelik: "Yüksek",
      dayanak: "90 gün projeksiyonda " + negatifGun + " gün negatif bakiye",
      ufuk: "90 gün",
      aksiyon:
        "Gider azaltma, personel planlaması, operasyon boyutunu gözden geçir",
    });
  } else if (negatifGun > 5) {
    kararlar.push({
      baslik: "GİDER AZALT",
      oncelik: "Orta",
      dayanak: "90 gün projeksiyonda " + negatifGun + " gün negatif bakiye",
      ufuk: "60 gün",
      aksiyon:
        "Kesilebilir giderleri gözden geçir, sabit gider optimizasyonu yap",
    });
  }

  // 6. Kredi kartı baskısı kuralları
  var kartRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.krediKarti) || createDummySheet_(),
  );
  var toplamKartBorc = 0;
  var yuksekLimitKart = false;
  for (var kk = 0; kk < kartRows.length; kk++) {
    if (String(kartRows[kk]["Durum"] || "").trim() !== "Aktif") continue;
    toplamKartBorc += parseCurrency_(kartRows[kk]["Güncel Bakiye"]);
    var lPct = parseCurrency_(kartRows[kk]["Limit Kullanım %"]);
    if (lPct >= 80) yuksekLimitKart = true;
  }
  if (toplamKartBorc > 0 && yuksekLimitKart) {
    kararlar.push({
      baslik: "KART BORCUNU KAPAT",
      oncelik: "Yüksek",
      dayanak: "Toplam kart borcu: " + formatTL_(toplamKartBorc) + " TL, limit kullanımı %80+",
      ufuk: "30 gün",
      aksiyon: "Kart borcunu öncelikli öde, yeni harcamayı sınırla",
    });
  } else if (toplamKartBorc > cashData.minCashReserve * 0.5) {
    kararlar.push({
      baslik: "TEMKİNLİ MOD — KART BORCU",
      oncelik: "Orta",
      dayanak: "Toplam kart borcu (" + formatTL_(toplamKartBorc) + " TL) güvenli tamponun yarısını aşıyor",
      ufuk: "30 gün",
      aksiyon: "Kart ödemelerini planla, yeni ithalattan kaçın",
    });
  }

  // 7. Açık hesap müşteri tahsilat kuralları
  var acikHesapRows = getAllRows_(
    ss.getSheetByName(CONFIG.sheets.acikHesap) || createDummySheet_(),
  );
  var toplamGeciken = 0;
  var gecikenSayisi = 0;
  var toplamAcikBakiye = 0;
  for (var ah = 0; ah < acikHesapRows.length; ah++) {
    var ahd = String(acikHesapRows[ah]["Tahsil Durumu"] || "").trim();
    if (ahd === "Tahsil Edildi") continue;
    var ahKalan = parseCurrency_(acikHesapRows[ah]["Kalan Bakiye"]) || parseCurrency_(acikHesapRows[ah]["Tutar"]);
    toplamAcikBakiye += ahKalan;
    if (ahd === "Geciken" || ahd === "Riskli / İhtilaflı") {
      toplamGeciken += ahKalan;
      gecikenSayisi++;
    }
  }
  if (toplamGeciken > cashData.minCashReserve * 0.3) {
    kararlar.push({
      baslik: "TAHSİLATI HIZLANDIR",
      oncelik: "Yüksek",
      dayanak: gecikenSayisi + " geciken alacak, toplam: " + formatTL_(toplamGeciken) + " TL",
      ufuk: "30 gün",
      aksiyon: "Geciken müşterilerle iletişim kur, tahsilat takibini sıklaştır",
    });
  }
  if (toplamAcikBakiye > 0) {
    // Müşteri yoğunlaşma kontrolü
    var musteriMap = {};
    for (var ah2 = 0; ah2 < acikHesapRows.length; ah2++) {
      if (String(acikHesapRows[ah2]["Tahsil Durumu"] || "").trim() === "Tahsil Edildi") continue;
      var mn = String(acikHesapRows[ah2]["Müşteri Adı"] || "").trim();
      var mBak = parseCurrency_(acikHesapRows[ah2]["Kalan Bakiye"]) || parseCurrency_(acikHesapRows[ah2]["Tutar"]);
      musteriMap[mn] = (musteriMap[mn] || 0) + mBak;
    }
    var mKeys = Object.keys(musteriMap);
    for (var mk = 0; mk < mKeys.length; mk++) {
      if (musteriMap[mKeys[mk]] / toplamAcikBakiye > 0.5) {
        kararlar.push({
          baslik: "VADELİ SATIŞI SINIRLA",
          oncelik: "Orta",
          dayanak: mKeys[mk] + " toplam açık bakiyenin %" + Math.round(musteriMap[mKeys[mk]] / toplamAcikBakiye * 100) + "'ini oluşturuyor",
          ufuk: "60 gün",
          aksiyon: "Bu müşteriye yeni vadeli satış yapma, peşin veya kısa vade iste",
        });
        break;
      }
    }
  }

  // Hiç karar yoksa olumlu mesaj
  if (kararlar.length === 0) {
    kararlar.push({
      baslik: "OPERASYONU KORU",
      oncelik: "Düşük",
      dayanak: "Nakit durumu güvenli, yapı taşınabilir",
      ufuk: "90 gün",
      aksiyon: "Mevcut stratejiyi sürdür, fırsatları izle",
    });
  }

  return {
    ok: true,
    kararlar: kararlar,
    thresholds: thresholds,
    importCapacity: importCap,
  };
}
