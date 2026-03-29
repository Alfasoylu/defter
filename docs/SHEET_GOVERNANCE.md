# SHEET GOVERNANCE

## Sayfa Sınıflandırma Sistemi

Her sayfa 6 kategoriden birine ait:

| Kategori | Sekme Rengi | Kim Yazar         | Korunuyor mu |
| -------- | ----------- | ----------------- | ------------ |
| INPUT    | 🟢 Yeşil    | Operatör          | Hayır        |
| HYBRID   | 🔵 Mavi     | Operatör + Sistem | Kısmen       |
| SYSTEM   | 🟠 Turuncu  | Yalnızca Sistem   | Evet (uyarı) |
| PANEL    | 🟣 Mor      | Yalnızca Sistem   | Evet (uyarı) |
| CONFIG   | ⚙️ Gri      | Operatör          | Hayır        |
| LOG      | Açık Gri    | Yalnızca Sistem   | Evet (uyarı) |

## Sayfa Envanteri

### INPUT (Veri Giriş) Sayfaları

| Sayfa             | CONFIG Anahtarı | Amaç                                                         |
| ----------------- | --------------- | ------------------------------------------------------------ |
| Hızlı Veri Girişi | `giris`         | Ana operasyonel giriş noktası — tüm işlemler buradan girilir |

### HYBRID (Karma) Sayfalar

| Sayfa                 | CONFIG Anahtarı | Operatör Girer                | Sistem Hesaplar          |
| --------------------- | --------------- | ----------------------------- | ------------------------ |
| Borç Takibi           | `borc`          | Borç detayları, vade, tutar   | Risk, gecikme, aksiyon   |
| Alacak Takibi         | `alacak`        | Kanal, brüt satış, kesintiler | Net tahsilat, risk puanı |
| Sabit Giderler        | `sabit`         | Gider adı, tutar, takvim      | Sonraki oluşturma tarihi |
| Stok Envanter         | `stok`          | SKU, adet, maliyet, satış     | Tüm stok metrikleri      |
| Stok Hareketleri      | `stokHareket`   | Hareket detayları             | Toplam maliyet           |
| İthalat Planı         | `ithalat`       | Sipariş detayları, fiyatlar   | ROI, karar, risk         |
| Kredi Kartları        | `krediKarti`    | Kart bilgileri, bakiye        | Limit %, risk seviyesi   |
| Açık Hesap Müşteriler | `acikHesap`     | Müşteri, tutar, vade          | Gecikme, risk, aksiyon   |

### SYSTEM (Otomatik Hesaplama) Sayfalar

| Sayfa                 | CONFIG Anahtarı | Veri Kaynağı          | Davranış                    |
| --------------------- | --------------- | --------------------- | --------------------------- |
| Nakit Akışı           | `nakit`         | Tüm kaynak tablolar   | Silinip yeniden oluşturulur |
| SKU Karlılık          | `skuKar`        | Stok Envanter         | Silinip yeniden oluşturulur |
| Talep ve Stok Baskısı | `talep`         | Stok Envanter         | Silinip yeniden oluşturulur |
| Tahmini Satışlar      | `tahmin`        | Stok Envanter geçmişi | Silinip yeniden oluşturulur |
| Risk Paneli           | `risk`          | Tüm kaynak tablolar   | Silinip yeniden oluşturulur |

### PANEL (Dashboard) Sayfalar

| Sayfa              | CONFIG Anahtarı | Açıklama                        |
| ------------------ | --------------- | ------------------------------- |
| Ana Kontrol Paneli | `ana`           | Mobil optimize yönetici özeti   |
| Dashboard          | `dashboard`     | Kapsamlı finansal durum         |
| Aksiyon Merkezi    | `aksiyon`       | Önceliklendirilmiş yapılacaklar |

### CONFIG ve LOG

| Sayfa          | CONFIG Anahtarı | Açıklama                |
| -------------- | --------------- | ----------------------- |
| Parametreler   | `parametreler`  | 37+ sistem parametresi  |
| Sistem Logları | `sistemLog`     | Append-only denetim izi |

## Yeni Sayfa Ekleme Kuralları

1. `CONFIG.sheets` objesine anahtar ekle
2. `SCHEMAS` objesine sütun tanımı ekle (boş dizi = rendered sayfa)
3. `SHEET_UX.classifications` objesine sınıf ata
4. `SHEET_UX.sheetOrder` dizisine sıra ekle
5. HYBRID ise `SHEET_UX.systemColumns` objesine sistem sütunlarını listele
6. Bu dosyayı (SHEET_GOVERNANCE.md) güncelle
7. DATA_OWNERSHIP_MATRIX.md'yi güncelle

## Sayfa Silme/Yeniden Adlandırma Kuralları

- Sayfa isimleri `CONFIG.sheets` üzerinden merkezi yönetilir
- Bir sayfa silinirse TÜM referansları güncellenmeli:
  - `CONFIG.sheets`, `SCHEMAS`, `SHEET_UX.*`, `applyValidations_()`, `routeInputRow_()`
- Yeniden adlandırma = CONFIG.sheets değerini değiştirmek (kod otomatik uyum sağlar)
- ⚠️ Canlıda yeniden adlandırma önce test ortamında doğrulanmalı

## Veri Akışı Özeti

```
Operatör Girişi:
  Hızlı Veri Girişi ──→ routeInputRow_() ──→ Borç Takibi
                                          ──→ Alacak Takibi
                                          ──→ Stok Hareketleri

  Sabit Giderler ──→ generateRecurringExpenses_() ──→ Borç Takibi

Sistem Hesaplamaları:
  Borç/Alacak/Stok/Kredi/Açık Hesap ──→ updateXxxComputedFields_()
  Stok Envanter ──→ buildInventoryMetrics_() ──→ SKU Karlılık
                                              ──→ Talep ve Stok Baskısı
                                              ──→ Tahmini Satışlar
  Tüm kaynaklar ──→ buildCashProjection_() ──→ Nakit Akışı
  Tüm kaynaklar ──→ buildRiskPanel_() ──→ Risk Paneli
  Tüm kaynaklar ──→ buildDecisionEngine_() ──→ Karar metriğleri

Çıktılar:
  Dashboard ←── renderDashboard_()
  Aksiyon Merkezi ←── renderActionCenter_()
  Ana Kontrol Paneli ←── renderAnaKontrolPaneli_()
```
