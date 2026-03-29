# DATA OWNERSHIP MATRIX

## Renk Kodları

- 🟢 `USER_INPUT` — Operatör girer
- ⚙️ `AUTO_KEY` — Sistem otomatik üretir (tek seferlik)
- 🔶 `SYSTEM_CALC` — Sistem her yenilemede hesaplar/üzerine yazar
- 📋 `SYSTEM_TIMESTAMP` — Sistem zaman damgası

---

## Hızlı Veri Girişi

| Sütun                   | Sahiplik            | Not                                   |
| ----------------------- | ------------------- | ------------------------------------- |
| Kayıt ID                | ⚙️ AUTO_KEY         | `repairKeys_()` ile HVG-xxxx üretilir |
| İşlem Tarihi            | 🟢 USER_INPUT       | Zorunlu                               |
| Nakit Etki Tarihi       | 🟢 USER_INPUT       |                                       |
| İşlem Tipi              | 🟢 USER_INPUT       | Dropdown — zorunlu                    |
| Alt Kategori            | 🟢 USER_INPUT       | Dropdown                              |
| Kanal / Karşı Taraf     | 🟢 USER_INPUT       | Dropdown                              |
| Ürün Grubu              | 🟢 USER_INPUT       |                                       |
| SKU                     | 🟢 USER_INPUT       |                                       |
| Tutar                   | 🟢 USER_INPUT       | Zorunlu, > 0                          |
| Para Birimi             | 🟢 USER_INPUT       | Dropdown — zorunlu                    |
| Kur                     | 🟢 USER_INPUT       | TRY dışı için zorunlu                 |
| Tutar TL                | 🔶 SYSTEM_CALC      | Tutar × Kur                           |
| Vade Tarihi             | 🟢 USER_INPUT       |                                       |
| Durum                   | 🟢 USER_INPUT       | Dropdown                              |
| Öncelik                 | 🟢 USER_INPUT       | Dropdown                              |
| Bağlı Plan Kodu         | 🟢 USER_INPUT       | Borç ödemesi bağlantısı               |
| Açıklama                | 🟢 USER_INPUT       |                                       |
| Kaynak Belge / Referans | 🟢 USER_INPUT       |                                       |
| Oluşturulma             | 📋 SYSTEM_TIMESTAMP | İlk kayıtta set edilir                |
| Güncellenme             | 📋 SYSTEM_TIMESTAMP | Her düzenlemede güncellenir           |

---

## Borç Takibi

| Sütun                     | Sahiplik       | Not                                   |
| ------------------------- | -------------- | ------------------------------------- |
| Borç Kodu                 | ⚙️ AUTO_KEY    | `repairKeys_()` ile BRC-xxxx üretilir |
| Borç Türü                 | 🟢 USER_INPUT  | Dropdown                              |
| Kurum / Kişi              | 🟢 USER_INPUT  |                                       |
| Vade                      | 🟢 USER_INPUT  | Tarih                                 |
| Tutar                     | 🟢 USER_INPUT  |                                       |
| Anapara                   | 🟢 USER_INPUT  | Finansman borçları için               |
| Aylık Faiz Oranı          | 🟢 USER_INPUT  |                                       |
| Taksit Tutarı             | 🟢 USER_INPUT  |                                       |
| Kalan Anapara             | 🔶 SYSTEM_CALC | `updateBorcComputedFields_()`         |
| Kalan Taksit Sayısı       | 🟢 USER_INPUT  |                                       |
| Toplam Finansman Maliyeti | 🔶 SYSTEM_CALC | Faiz × kalan taksit                   |
| Amaç                      | 🟢 USER_INPUT  | Dropdown                              |
| Durum                     | 🟢 USER_INPUT  | Dropdown (sistem Gecikmiş yapabilir)  |
| Öncelik                   | 🔶 SYSTEM_CALC | Risk seviyesine göre                  |
| Nakit Etki                | 🔶 SYSTEM_CALC |                                       |
| Gecikme Gün               | 🔶 SYSTEM_CALC | max(0, bugün − vade)                  |
| Risk                      | 🔶 SYSTEM_CALC | Kritik/Yüksek/Orta/Düşük              |
| Sonraki Aksiyon           | 🔶 SYSTEM_CALC | Aksiyon metni                         |
| Açıklama                  | 🟢 USER_INPUT  |                                       |

---

## Alacak Takibi

| Sütun                 | Sahiplik       | Not                           |
| --------------------- | -------------- | ----------------------------- |
| Alacak Kodu           | ⚙️ AUTO_KEY    | ALC-xxxx                      |
| Kanal                 | 🟢 USER_INPUT  | Dropdown                      |
| Sipariş Dönemi        | 🟢 USER_INPUT  | Tarih                         |
| Tahsil Tarihi         | 🟢 USER_INPUT  | Tarih                         |
| Brüt Satış            | 🟢 USER_INPUT  |                               |
| Komisyon              | 🟢 USER_INPUT  |                               |
| Kargo Kesintisi       | 🟢 USER_INPUT  |                               |
| Reklam Kesintisi      | 🟢 USER_INPUT  |                               |
| Diğer Kesinti         | 🟢 USER_INPUT  |                               |
| Beklenen Net Tahsilat | 🔶 SYSTEM_CALC | Brüt − tüm kesintiler         |
| Durum                 | 🟢 USER_INPUT  | Dropdown                      |
| Gün Kaldı             | 🔶 SYSTEM_CALC | Tahsil tarihi − bugün         |
| Gecikme Gün           | 🔶 SYSTEM_CALC | max(0, bugün − tahsil tarihi) |
| Risk Puanı            | 🔶 SYSTEM_CALC | 0-100                         |
| Öncelik               | 🔶 SYSTEM_CALC | Kritik/Yüksek/Orta/Düşük      |
| Sonraki Aksiyon       | 🔶 SYSTEM_CALC | Aksiyon metni                 |

---

## Sabit Giderler

| Sütun                    | Sahiplik       | Not                                      |
| ------------------------ | -------------- | ---------------------------------------- |
| Gider Kodu               | ⚙️ AUTO_KEY    | SBT-xxxx                                 |
| Gider Adı                | 🟢 USER_INPUT  |                                          |
| Kategori                 | 🟢 USER_INPUT  | Dropdown                                 |
| Aylık Tutar              | 🟢 USER_INPUT  |                                          |
| Para Birimi              | 🟢 USER_INPUT  | Dropdown                                 |
| Kur                      | 🟢 USER_INPUT  |                                          |
| Tutar TL                 | 🔶 SYSTEM_CALC | Aylık Tutar × Kur                        |
| Ayın Günü                | 🟢 USER_INPUT  | 1-31                                     |
| Tekrarlama Tipi          | 🟢 USER_INPUT  | Dropdown                                 |
| Başlangıç Tarihi         | 🟢 USER_INPUT  | Tarih                                    |
| Bitiş Tarihi             | 🟢 USER_INPUT  | Tarih                                    |
| Artış Tarihi             | 🟢 USER_INPUT  | Tarih                                    |
| Revize Tutar             | 🟢 USER_INPUT  |                                          |
| Zorunlu mu               | 🟢 USER_INPUT  | Dropdown                                 |
| Kesilebilir mi           | 🟢 USER_INPUT  | Dropdown                                 |
| Departman                | 🟢 USER_INPUT  |                                          |
| Sonraki Oluşturma Tarihi | 🔶 SYSTEM_CALC | `generateRecurringExpenses_()` günceller |
| Durum                    | 🟢 USER_INPUT  | Dropdown                                 |

---

## Stok Envanter

| Sütun                     | Sahiplik       | Not                                   |
| ------------------------- | -------------- | ------------------------------------- |
| SKU                       | 🟢 USER_INPUT  | Benzersiz ürün kodu                   |
| Ürün Adı                  | 🟢 USER_INPUT  |                                       |
| Kategori                  | 🟢 USER_INPUT  |                                       |
| Tedarikçi                 | 🟢 USER_INPUT  |                                       |
| Mevcut Adet               | 🟢 USER_INPUT  | Fiziksel sayım                        |
| Birim Tam Maliyet TL      | 🟢 USER_INPUT  |                                       |
| Mevcut Stok Değeri TL     | 🔶 SYSTEM_CALC | Adet × Birim Maliyet                  |
| Son 30 Gün Satış Adedi    | 🟢 USER_INPUT  |                                       |
| Son 90 Gün Satış Adedi    | 🟢 USER_INPUT  |                                       |
| Günlük Ortalama Satış     | 🔶 SYSTEM_CALC | buildInventoryMetrics\_()             |
| Günlük Ortalama Net Ciro  | 🔶 SYSTEM_CALC |                                       |
| Aylık Dönüş Katsayısı     | 🔶 SYSTEM_CALC |                                       |
| Stok Gün Sayısı           | 🔶 SYSTEM_CALC | Adet / Günlük Satış                   |
| Güvenlik Stoğu Gün        | 🔶 SYSTEM_CALC | Parametreden                          |
| İthalat Lead Time Gün     | 🔶 SYSTEM_CALC | Parametreden                          |
| Yeniden Sipariş Noktası   | 🔶 SYSTEM_CALC | (Güvenlik + Lead Time) × Günlük Satış |
| Tahmini Stok Bitiş Tarihi | 🔶 SYSTEM_CALC |                                       |
| Stok Durumu               | 🔶 SYSTEM_CALC | Kritik/Düşük/Normal/Fazla/Ölü Stok    |
| Stok Yaşlanma Puanı       | 🔶 SYSTEM_CALC | 0-100                                 |
| Sermaye Verim Puanı       | 🔶 SYSTEM_CALC | 0-100                                 |
| Olası 30 Gün Ciro Kaybı   | 🔶 SYSTEM_CALC |                                       |
| Olası 30 Gün Kar Kaybı    | 🔶 SYSTEM_CALC |                                       |
| Öncelik Skoru             | 🔶 SYSTEM_CALC |                                       |

---

## Stok Hareketleri

| Sütun             | Sahiplik       | Not                  |
| ----------------- | -------------- | -------------------- |
| Hareket ID        | ⚙️ AUTO_KEY    | HRK-xxxx             |
| Tarih             | 🟢 USER_INPUT  |                      |
| SKU               | 🟢 USER_INPUT  |                      |
| İşlem Türü        | 🟢 USER_INPUT  | Dropdown             |
| Giriş Adet        | 🟢 USER_INPUT  |                      |
| Çıkış Adet        | 🟢 USER_INPUT  |                      |
| Birim Maliyet TL  | 🟢 USER_INPUT  |                      |
| Toplam Maliyet TL | 🔶 SYSTEM_CALC | Adet × Birim Maliyet |
| Kanal             | 🟢 USER_INPUT  |                      |
| Referans          | 🟢 USER_INPUT  |                      |
| Açıklama          | 🟢 USER_INPUT  |                      |

---

## İthalat Planı

| Sütun                    | Sahiplik       | Not                      |
| ------------------------ | -------------- | ------------------------ |
| Plan Kodu                | ⚙️ AUTO_KEY    | IMP-xxxx                 |
| SKU                      | 🟢 USER_INPUT  |                          |
| Ürün                     | 🟢 USER_INPUT  |                          |
| Tedarikçi                | 🟢 USER_INPUT  |                          |
| Taşıma Tipi              | 🟢 USER_INPUT  | Dropdown                 |
| Sipariş Tarihi           | 🟢 USER_INPUT  |                          |
| RMB Alış Fiyatı          | 🟢 USER_INPUT  |                          |
| USD Alış Fiyatı          | 🟢 USER_INPUT  |                          |
| Sipariş Kuru             | 🟢 USER_INPUT  |                          |
| Ağırlık KG               | 🟢 USER_INPUT  |                          |
| Kargo USD/KG             | 🟢 USER_INPUT  |                          |
| Gümrük Oranı             | 🟢 USER_INPUT  |                          |
| Toplam Birim Maliyet TL  | 🔶 SYSTEM_CALC | Tam maliyet hesabı       |
| MOQ                      | 🟢 USER_INPUT  |                          |
| Sipariş Adedi            | 🟢 USER_INPUT  |                          |
| Toplam Yatırım Tutarı TL | 🔶 SYSTEM_CALC | Adet × Birim Maliyet     |
| Mal Bedeli Ödeme Tarihi  | 🟢 USER_INPUT  |                          |
| Mal Bedeli Tutarı        | 🟢 USER_INPUT  |                          |
| Navlun Ödeme Tarihi      | 🟢 USER_INPUT  |                          |
| Navlun Tutarı            | 🟢 USER_INPUT  |                          |
| Gümrük Ödeme Tarihi      | 🟢 USER_INPUT  |                          |
| Gümrük Tutarı            | 🟢 USER_INPUT  |                          |
| Tahmini Varış Tarihi     | 🟢 USER_INPUT  |                          |
| Tahmini Satış Başlangıcı | 🟢 USER_INPUT  |                          |
| Lead Time Gün            | 🟢 USER_INPUT  |                          |
| Beklenen Satış Fiyatı    | 🟢 USER_INPUT  |                          |
| Pazaryeri Net Satışı     | 🔶 SYSTEM_CALC | Satış − komisyon         |
| Birim Net Kar            | 🔶 SYSTEM_CALC | Net Satış − Maliyet      |
| Toplam Net Kar           | 🔶 SYSTEM_CALC | Birim Kar × Adet         |
| ROI                      | 🔶 SYSTEM_CALC | Net Kar / Yatırım        |
| Tahmini Satış Süresi Gün | 🔶 SYSTEM_CALC |                          |
| Tahmini Nakit Dönüş Günü | 🔶 SYSTEM_CALC |                          |
| Risk Seviyesi            | 🔶 SYSTEM_CALC | Düşük/Orta/Yüksek        |
| Sipariş Kararı           | 🔶 SYSTEM_CALC | Şimdi/Yakında/Bekle/Alma |
| Gerekçe                  | 🔶 SYSTEM_CALC | Karar açıklaması         |
| Durum                    | 🟢 USER_INPUT  | Dropdown                 |

---

## Kredi Kartları

| Sütun                    | Sahiplik       | Not                      |
| ------------------------ | -------------- | ------------------------ |
| Kart ID                  | ⚙️ AUTO_KEY    | KRT-xxxx                 |
| Kart Adı                 | 🟢 USER_INPUT  |                          |
| Banka                    | 🟢 USER_INPUT  |                          |
| Kredi Limiti             | 🟢 USER_INPUT  |                          |
| Ekstre Kesim Günü        | 🟢 USER_INPUT  |                          |
| Son Ödeme Günü           | 🟢 USER_INPUT  |                          |
| Güncel Bakiye            | 🟢 USER_INPUT  |                          |
| Asgari Ödeme Tutarı      | 🟢 USER_INPUT  |                          |
| Para Birimi              | 🟢 USER_INPUT  | Dropdown                 |
| Ödeme Tercihi            | 🟢 USER_INPUT  | Dropdown                 |
| Durum                    | 🟢 USER_INPUT  | Dropdown                 |
| Son Ekstre Tutarı        | 🟢 USER_INPUT  |                          |
| Son Ödeme Tarihi         | 🟢 USER_INPUT  |                          |
| Son Ödeme Tutarı         | 🟢 USER_INPUT  |                          |
| Limit Kullanım %         | 🔶 SYSTEM_CALC | Bakiye / Limit × 100     |
| Sonraki Son Ödeme Tarihi | 🔶 SYSTEM_CALC |                          |
| Beklenen Ödeme Tutarı    | 🔶 SYSTEM_CALC |                          |
| Risk Seviyesi            | 🔶 SYSTEM_CALC | Kritik/Yüksek/Orta/Düşük |
| Notlar                   | 🟢 USER_INPUT  |                          |

---

## Açık Hesap Müşteriler

| Sütun               | Sahiplik       | Not                                |
| ------------------- | -------------- | ---------------------------------- |
| Alacak ID           | ⚙️ AUTO_KEY    | AHS-xxxx                           |
| Müşteri Adı         | 🟢 USER_INPUT  |                                    |
| Belge / Sipariş No  | 🟢 USER_INPUT  |                                    |
| Kesim Tarihi        | 🟢 USER_INPUT  |                                    |
| Vade Tarihi         | 🟢 USER_INPUT  |                                    |
| Tutar               | 🟢 USER_INPUT  |                                    |
| Para Birimi         | 🟢 USER_INPUT  |                                    |
| Tahsil Durumu       | 🔶 SYSTEM_CALC | `updateAcikHesapComputedFields_()` |
| Tahsil Edilen Tutar | 🟢 USER_INPUT  |                                    |
| Kalan Bakiye        | 🔶 SYSTEM_CALC | Tutar − Tahsil Edilen              |
| Gecikme Günü        | 🔶 SYSTEM_CALC | max(0, bugün − vade)               |
| Risk Skoru          | 🔶 SYSTEM_CALC | 0-100                              |
| Risk Seviyesi       | 🔶 SYSTEM_CALC |                                    |
| Öncelik             | 🔶 SYSTEM_CALC |                                    |
| Sonraki Aksiyon     | 🔶 SYSTEM_CALC |                                    |
| Son Tahsilat Notu   | 🟢 USER_INPUT  |                                    |

---

## Tam Sistem Sayfaları (Tüm Sütunlar Sistem)

Bu sayfalarda operatör sütunu yoktur. Tamamı sistem tarafından üretilir:

| Sayfa                 | Sütun Sayısı | Üretici Fonksiyon           | Davranış              |
| --------------------- | ------------ | --------------------------- | --------------------- |
| Nakit Akışı           | 14           | `writeCashProjection_()`    | Sil & yeniden oluştur |
| SKU Karlılık          | 25           | `buildSkuProfitability_()`  | Sil & yeniden oluştur |
| Talep ve Stok Baskısı | 15           | `buildDemandPressure_()`    | Sil & yeniden oluştur |
| Tahmini Satışlar      | 8            | `buildSalesForecast_()`     | Sil & yeniden oluştur |
| Risk Paneli           | 10           | `buildRiskPanel_()`         | Sil & yeniden oluştur |
| Dashboard             | Dinamik      | `renderDashboard_()`        | Temizle & render      |
| Aksiyon Merkezi       | 3            | `renderActionCenter_()`     | Temizle & render      |
| Ana Kontrol Paneli    | Dinamik      | `renderAnaKontrolPaneli_()` | Temizle & render      |
| Sistem Logları        | 4            | `logAction_()`              | Sadece append         |

---

## Parametreler (CONFIG Sayfası)

Tüm sütunlar operatör tarafından yönetilir:

| Sütun              | Not                                     |
| ------------------ | --------------------------------------- |
| Parametre Anahtarı | 🟢 Sistem tanımlayıcısı (ör: `usd_try`) |
| Grup               | 🟢 Kategori (Kur, Nakit, Stok…)         |
| Etiket             | 🟢 İnsan okunabilir ad                  |
| Değer              | 🟢 Sayı veya metin                      |
| Değer Tipi         | 🟢 `number` / `text`                    |
| Birim              | 🟢 TRY, %, gün…                         |
| Açıklama           | 🟢 Neyi kontrol ettiği                  |
| Kullanan Modüller  | 🟢 Hangi modüller okuyor                |
| Güncellenme Tarihi | 🟢 Son düzenleme                        |
| Güncelleyen        | 🟢 Kim düzenledi                        |

`seedDefaultParams_()` sadece eksik parametreleri ekler, mevcut değerleri değiştirmez.
