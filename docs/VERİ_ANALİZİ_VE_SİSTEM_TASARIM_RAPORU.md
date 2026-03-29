# VERİ ANALİZİ VE SİSTEM TASARIM RAPORU
**Tarih:** 29 Mart 2026  
**Dosya:** entegra-sales-0101.2025-27.03.2026.xlsx + stok-listesi-29.03.2026.xlsx

---

## 1. VERİ ÖZETI

### 1.1 Sözcüklü Dosyalar
```
Dosya 1: entegra-sales-0101.2025-27.03.2026.xlsx (12.5 KB)
         → Ciro raporu (Satış verileri: 01.01.2025 - 27.03.2026)
         → Beklenen kolonlar: Ürün, Satış Adedi, Birim Fiyat, Ciro, Tarih, Kategorisi vb.

Dosya 2: stok-listesi-29.03.2026.xlsx (408.6 KB)
         → Güncel stok listesi (29.03.2026 tarih)
         → Beklenen kolonlar: SKU, Ürün Adı, Mevcut Adet, Toplam Maliyet, Satış Verileri, Lead Time vb.
```

### 1.2 Mevcut Sistem Mimarisinde Tanımlı Kolonlar

#### **Satış/Ciro Verileri İçin (entegra-sales)**
Kod referansı: `12_Import.js` ve `10_Inventory.js`'den çıkartılan:

| Kolon Adı | Veri Tipi | Anlamı | Zorunlu |
|-----------|-----------|--------|---|
| SKU | String | Ürün kodu | ✓ |
| Ürün Adı / Kategori | String | Ürün tanımı | ✓ |
| Satış Adedi | Number | Toplam satış miktarı | ✓ |
| Birim Satış Fiyatı | Currency | Müşteriye satış fiyatı | ✓ |
| Toplam Ciro | Currency | Satış Adedi × Birim Fiyat | ✓ |
| Tarih | Date | İşlem tarihi (YYYY-MM-DD) | ✓ |
| Kur (USD TRY) | Decimal | Dış ticaret işlemleri için | ✗ |
| Kategori Grubu | String | Ürün sınıflandırılması | ✗ |
| Pazaryeri | String | Satış kanalı (Direkt/A Pazaryeri/B Pazaryeri) | ✗ |
| Komisyon Oranı | Percentage | Pazaryeri komisyonu | ✗ |

---

#### **Stok Verileri İçin (stok-listesi)**
Kod referansı: `10_Inventory.js`'deki `buildInventoryMetrics_()` fonksiyonundan:

| Kolon Adı | Veri Tipi | Anlamı | Zorunlu |
|-----------|-----------|--------|---|
| SKU | String | Ürün kodu (satışla eşleşmeli) | ✓ |
| Ürün Adı | String | Ürün tanımı | ✓ |
| Mevcut Adet | Number | Şu anda depoda olan miktar | ✓ |
| Birim Tam Maliyet TL | Currency | Ürünün kapanış maliyeti | ✓ |
| Mevcut Stok Değeri TL | Currency | Mevcut Adet × Birim Maliyet | (Hesaplanan) |
| Son 30 Gün Satış Adedi | Number | Son 30 günde satılan toplam | ✓ |
| Son 90 Gün Satış Adedi | Number | Son 90 günde satılan toplam | ✓ |
| Günlük Ortalama Satış | Number | Günlük satış (Hesaplanan) | (Hesaplanan) |
| Günlük Ortalama Net Ciro | Currency | Günlük ciro (maliyetten arındırılmış) | ✓ |
| Stok Gün Sayısı | Number | Mevcut stokla kaç gün gidebileceği | (Hesaplanan) |
| Güvenlik Stoğu Gün | Number | Minimum kritik stok gün sayısı | (Parametre) |
| İthalat Lead Time Gün | Number | Tedarikçi teslim süresi | ✓ |
| Aylık Dönüş Katsayısı | Decimal | Satış hızı metriği | (Hesaplanan) |
| Yeniden Sipariş Noktası | Number | Reorder point (Parametreler'den) | (Hesaplanan) |
| Tahmini Stok Bitiş Tarihi | Date | Ne zaman stok biter | (Hesaplanan) |
| Stok Durumu | Text | Kritik/Düşük/Normal/Fazla/Ölü Stok | (Hesaplanan) |
| Stok Yaşlanma Puanı | Score (0-100) | Stokun yaşlılığı (100=ne kadar kötü) | (Hesaplanan) |
| Sermaye Verim Puanı | Score (0-100) | ROI verimliliği | (Hesaplanan) |
| Olası 30 Gün Ciro Kaybı | Currency | Stok tükenmesi halinde kayıp | (Hesaplanan) |
| Olası 30 Gün Kar Kaybı | Currency | Net kar kaybı | (Hesaplanan) |
| Öncelik Skoru | Score (0-100) | Tedarik önceliği | (Hesaplanan) |

---

### 1.3 İthalat Kararı İçin Gerekli Kolonlar
Kod referansı: `12_Import.js`'deki `buildImportDecisionEngine_()` fonksiyonundan:

| Kolon | Tipi | Kaynak | Hesaplama |
|-------|------|--------|-----------|
| SKU | Text | İthalat Planı | - |
| Sipariş Adedi | Number | Plan | - |
| MOQ (Minimum Order Quantity) | Number | Tedarikçi | - |
| Toplam Birim Maliyet TL | Currency | Plan | - |
| Beklenen Satış Fiyatı | Currency | Plan | - |
| Lead Time Gün | Number | Plan | - |
| Toplam Yatırım Tutarı TL | Currency | - | `Sipariş Adedi × Birim Maliyet` |
| Pazaryeri Net Satışı (Komisyon -15%) | Currency | - | `Satış Fiyatı × 0.85` |
| Birim Net Kar | Currency | - | `Net Satış - Birim Maliyet` |
| Toplam Net Kar | Currency | - | `Birim Net Kar × Sipariş Adedi` |
| ROI | Percentage | - | `(Birim Net Kar / Birim Maliyet) × 100` |
| Tahmini Satış Süresi Gün | Number | - | `Sipariş Adedi / Günlük Satış` |
| Tahmini Nakit Dönüş Günü | Number | - | `Lead Time + (Satış Süresi × 0.5)` |
| Risk Seviyesi | Text | - | Scoring'e göre |
| Sipariş Kararı | Text | - | Score ≥70: Şimdi / ≥50: Yakında / ≥25: Bekle / <25: Alma |
| Gerekçe | Text | - | Karar açıklaması |

---

## 2. KRİTİK PROBLEMLER

### 2.1 Veri Kalitesi Sorunları
| Problem | Etki | Çözüm |
|---------|------|--------|
| **SKU Uyuşmazlığı** | Satış ve stok tablolarında farklı SKU kodlaması | SKU standardı belirle, mapping tablosu oluştur |
| **Ürün Adı Tutarsızlığı** | Aynı ürün farklı şekillerde yazılmış | Data cleaning: trim, case normalization, fuzzy match |
| **Tarih Formatı Karmaşası** | Excel'de DD/MM/YYYY, sistem'de YYYY-MM-DD | Tüm tarihleri ISO 8601'e dönüştür |
| **Eksik Para Birimi** | Ciro verisi hangi para biriminde? (TRY/USD/EUR?) | Tüm veriler TRY ile normalize et, kur bilgisi ekle |
| **Fibonacci Komisyon Oranları** | Pazaryeri başına farklı komisyon (+15% / -10% / +5%) | Her kanal için sabit oran tanımla veya granüler veri ekle |

### 2.2 Eksik Veri Alanları
| Eksik Alan | Neden Kritik | Geçici Çözüm |
|-----------|-----------|-----------|
| **Birim Maliyet** | Kar hesaplaması İçin | Stok tablosundan "Birim Tam Maliyet" alıp eş de |
| **Para Birimi** | Ciro gerçek TL değerini belirlemek için | USD/EUR satışlar için ortalama kur uygula |
| **Kategori/Ürün Grubu** | İçgüdülenç analizi ve yönetim için | Excel'deki SKU'dan tahmini kategori çıkar |
| **Satış Kanalı** | Profitabilite analizi için | Pazaryeri ile ilgili veriler '(Direct/Amazon/Trendyol vb.) |
| **İade/Ret** | Net ciro hesaplaması | Ciro negatif satışlar içeriyor mu kontrol et |

### 2.3 Veri Tutarlılığı Hataları
```
❌ Olası Sorunlar:
  - Satış ile stok son 30 gün verilerinin uyuşmaması
  - Same SKU'nun iki farklı "Birim Maliyet"inde çıkması
  - Tarih aralığı dışında kayıtlar (2024'ten veri vb.)
  - Negatif stok miktarları
  - Sıfır birim maliyet (dönem başı kayıt cevapları)
  - Gelecek tarihlı satışlar
```

---

## 3. ÖNERİLEN SİSTEM MİMARİSİ

### 3.1 Katmanlı Veri Yapısı
```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: RAW_DATA (Ham Veri - Excel İçe Aktarma)               │
│                                                                   │
│ ▸ entegra-sales (Ciro raporu - tarih aralığı)                  │
│ ▸ stok-listesi (Güncel stok - belirli tarih)                   │
│ ▸ Direkt Excel'den import edilmiş, hiçbir dönüşüm yok          │
│ ▸ Audit trail: İmam tarih + kimden geldiği                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Veri Temizliği
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: CLEAN_DATA (Normalize Edilmiş Veri)                   │
│                                                                   │
│ ▸ SKU standardı: UPPERCASE, trim()                             │
│ ▸ Ürün Adı: Fuzzy deduplicate, Ürün Master ID eşleme          │
│ ▸ Tarih: ISO 8601 (YYYY-MM-DD)                                  │
│ ▸ Para Birimi: Her satış TRY'de, kur versiyonlanmış           │
│ ▸ Negatif/Sıfır Satışlar: İade olarak işaretle               │
│ ▸ İmranlar: Kategorik validasyon + constraint checks          │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Metrik Hesaplama
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: DECISION_LAYER (Analitik & Metrikleri)                │
│                                                                   │
│ ▸ Satış Metrikleri:                                            │
│   - Son 30/90 gün satış (adet + TRY)                           │
│   - Günlük ortalama satış                                      │
│   - Satış hızı puanlaması (A/B/C SKU sınıflandırması)         │
│                                                                   │
│ ▸ Stok Metrikleri:                                             │
│   - Stok gün sayısı (Mevcut / Günlük Satış)                   │
│   - Stok durumu (Kritik/Düşük/Normal/Fazla/Ölü)              │
│   - Yeniden sipariş noktası (Lead Time + Güvenlik Stoğu)     │
│   - Stok yaşlanma puanı                                        │
│   - Sermaye verim puanı (Aylık Ciro / Stok Değeri)           │
│                                                                   │
│ ▸ Kar Metrikleri:                                              │
│   - Kar marjı (Ciro - Maliyet)                                │
│   - ROI (Net Kar / Yatırım)                                    │
│   - Olası ciro/kar kaybı (stok tükenmesi senaryosu)          │
│                                                                   │
│ ▸ İthalat Skoru (Ağırlıklı):                                  │
│   - ROI: %30 ağırlık                                           │
│   - Satış Hızı: %25 ağırlık                                    │
│   - Stok Aciliği: %20 ağırlık                                  │
│   - Nakit Baskısı: %15 ağırlık                                 │
│   - Lead Time Risk: %10 ağırlık                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Karar Üretimi
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 4: ACTION_OUTPUT (Operasyon Önerileri)                   │
│                                                                   │
│ ▸ İthalat Kararı: Şimdi Sipariş Ver / Yakında / Bekle / Alma   │
│ ▸ Fiyatlandırma Stratejisi: Hızlı satış / Normal / Indirim    │
│ ▸ Stok Yönetimi: Yeniden sipariş noktası öğün bekleyişi       │
│ ▸ Risk Uyarıları: Kritik stok, yavaş dönen ürünler            │
│ ▸ Tedarik Planlaması: Sonraki 30/60/90 gün planı              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Veri Akış Diyagramı

```
┌──────────────┐          ┌──────────────┐
│ Satış Raporu │          │ Stok Listesi │
│ (Excel)      │          │ (Excel)      │
└──────┬───────┘          └──────┬───────┘
       │                          │
       └──────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  DATA IMPORT & VALIDATE│
         │  (Apps Script)         │
         └────────────┬───────────┘
                      │
       ┌──────────────┴──────────────┐
       │                             │
       ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│  CLEAN_DATA      │        │  PARAMETERS      │
│  Sheet           │        │  Sheet           │
│  (Normalized)    │        │  (Kur, Lead Time)│
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         └──────────────┬────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │  METRICS ENGINE        │
           │  (10_Inventory.js      │
           │   12_Import.js)        │
           └────────────┬───────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
    ┌─────────────┐          ┌──────────────────┐
    │  DECISION   │          │  ACTION_CENTER   │
    │  LAYER      │          │  Öneriler       │
    └─────────────┘          └──────────────────┘
         │                             │
         ▼                             ▼
    ┌─────────────┐          ┌──────────────────┐
    │  DASHBOARD  │          │  ALERTS & AUDIT  │
    │  KPI View   │          │  Trail           │
    └─────────────┘          └──────────────────┘
```

---

## 4. SHEETS ENTEGRASYONUnun Mapping Planı

### 4.1 Import Stratejisi

#### **Adım 1: Data Hazırlama (Excel'de)**
```
entegra-sales-0101.2025-27.03.2026.xlsx
├─ Tüm NaN/boş satırları sil
├─ Tarihler ISO 8601'e dönüştür
├─ SKU'ları UPPERCASE yap
├─ Ciro hangi para biriminde? (TRY/USD/EUR) belirl
└─ Export: CSV (UTF-8, comma-separated)

stok-listesi-29.03.2026.xlsx
├─ Tüm NaN/boş satırları sil
├─ SKU'ları UPPERCASE yap
├─ Birim Maliyet'in tarihi kayıt et
├─ Tarihler ISO 8601'e dönüştür
└─ Export: CSV (UTF-8, comma-separated)
```

#### **Adım 2: Apps Script'te Import Handle**
```javascript
// Pseudo-kod
function importSalesData_() {
  var csvData = readCSV("entegra-sales.csv");
  
  // Cleanup
  csvData = csvData.filter(row => row.SKU && row.Tarih);
  
  // Normalize
  csvData = csvData.map(row => ({
    SKU: row.SKU.trim().toUpperCase(),
    Tarih: parseISODate(row.Tarih),
    SatisAdedi: parseNumber(row["Satış Adedi"]),
    Ciro: parseNumber(row.Ciro),
    ParaBirimi: row["Para Birimi"] || "TRY",
    CiroTL: parseNumber(row.Ciro) * getKur(row["Para Birimi"], row.Tarih),
    KayitID: generateId(),
    Durum: "valid"
  }));
  
  // Write to CLEAN_DATA sheet (upsert by SKU + Tarih)
  writeToSheet(csvData, "CLEAN_DATA_SALES");
}
```

#### **Adım 3: Kolon Mapping**

| Excel Satış Raporu | → | Apps Script Sheet | Dönüşüm |
|-----------------|---|------------------------|---------|
| SKU | → | SKU | `UPPERCASE, TRIM` |
| Ürün Adı | → | Ürün Adı | `deduplicate via master ID` |
| Adet | → | Satış Adedi | `parseCurrency_()` |
| Birim Fiyat | → | Birim Net Fiyat | `Komisyon Oranı uygulanır` |
| Toplam Ciro | → | Toplam Ciro TL | `Para Birimi kontrol → Kur çarp` |
| Tarih | → | Satış Tarihi | `parseTurkishDate_()` |
| Kategorisi | → | SKU Kategorisi | `Lookup table` |
| Pazaryeri | → | Satış Kanalı | `Direct / Amazon / Trendyol` |

| Excel Stok Listesi | → | Apps Script Sheet | Dönüşüm |
|-----------------|---|------------------------|---------|
| SKU | → | SKU | `UPPERCASE, TRIM` |
| Ürün Adı | → | Ürün Adı | `Master Product ID` |
| Mevcut Adet | → | Mevcut Adet | `parseCurrency_()` |
| Birim Maliyeti | → | Birim Tam Maliyet TL | `Tarih sürümü ekle` |
| Son 30 Gün Satış | → | Son 30 Gün Satış Adedi | `CLEAN_DATA'dan hesapla` |
| Günlük Ciro | → | Günlük Ortalama Net Ciro | `CLEAN_DATA'dan hesapla` |
| Lead Time | → | İthalat Lead Time Gün | `CONFIG.defaultLeadTimeDays` |
| *(Hesaplanan)* | ← | Stok Durumu | `buildInventoryMetrics_()` |
| *(Hesaplanan)* | ← | Öncelik Skoru | `buildImportDecisionEngine_()` |

---

### 4.2 Veri Kalite Kontrolleri

#### **Veri Doğrulaması (validation_level_1)**
```
✓ SKU boş değildir
✓ Satış Adedi > 0 (iş değilse işaretle)
✓ Ciro >= 0
✓ Tarih <= Bugün
✓ Para Birimi tanımlı
✓ Birim Maliyet >= 0
```

#### **İş Kuralları Doğrulaması (validation_level_2)**
```
✓ SKU stok listesinde bulunuyor mu?
✓ Ürün Adı tutarlı mı (aynı SKU'nun farklı adları kontrol)
✓ 30 günlük satış son 90 günlük satıştan küçük mü?
✓ Stok Gün Sayısı geçerlemi? (Mevcut Adet / Günlük Satış)
✓ ROI hesaplaması geçerli (çok büyük/küçük değerler var mı?)
```

#### **Tamlık Doğrulaması (validation_level_3)**
```
❓ Tarih aralığında kayıp gün var mı? (hafta sonları hariç)
❓ Ödeme Haft hangi ürünler hiç satış yapamamış?
❓ Stok 180+ gün ölü mı?
❓ ROI %1000+ üzerinde mi (yanlış maliyet)?
```

---

## 5. KRİTİK 5 İŞLEM ÖNERİSİ

### **Öncelik 1: SKU Standardizasyonu**
**Yapılacak:** Tüm SKU'ları standardize et
- Excel'de tüm SKU'ları UPPERCASE + TRIM yap
- SKU Master Listesi oluştur (SKU ↔ Ürün Adı ↔ Kategori)
- Import öncesinde SKU validation yapıldığını sağla
- **Zaman:** 2 saat | **Etki:** Yüksek

### **Öncelik 2: Tarih ve Para Birimi Normalizasyonu**
**Yapılacak:** Tüm tarih ve para birimi verilerini standardize et
- Excel'deki tüm tarihleri ISO 8601'e dönüştür
- Ciro verisi TRY mi, USD mi açıkça belli hale getir
- İthalat verilerine kur nutzlaştır (Parametreler şemasına)
- **Zaman:** 1.5 saat | **Etki:** Çok Yüksek

### **Öncelik 3: Eksik Veri Çıkarma & Veri Boşluk İlanı**
**Yapılacak:** Stok ve Satış arasındaki uyuşmazlıkları tespit et
- Son 30 gün satış verisi ile mevcut stok tutarlılığını kontrol et
- SKU'lar arası "İade" kategorisi var mı kontrol et
- "Birim Tam Maliyet" kapalı fiyattı mı, satış komissyonu içeriyor mu açıkla
- **Zaman:** 3 saat | **Etki:** Yüksek

### **Öncelik 4: CLEAN_DATA Sheet Migrasyonu**
**Yapılacak:** Temizlenen veriyi ayrı bir sheet'e taşı
- Import Script yazılıştır ve test et
- Duplicate SKU + Tarih kontrolü ekle (upsert mantığı)
- Veri doğrulama kurallarını CLEAN_DATA'ya uygula
- **Zaman:** 4 saat | **Etki:** Yüksek

### **Öncelik 5: Metrik Hesaplama Doğrulamacı**
**Yapılacak:** 10_Inventory.js ve 12_Import.js fonksiyonlarını test et
- Bilinmiş test satırları ile metrik hesaplamasını doğrula
- ROI, Satış Hızı, Stok Gün Sayısı el hesaplamalarını doğrula
- İthalat kararı skoru (70/50/25 eşikleri) uygunmu kontrol et
- **Zaman:** 5 saat | **Etki:** Çok Yüksek

---

## 6. VERILERDE ŞU AN YAPILAN SAYILABILECEK SORUNLAR

> **Not:** Gerçek Excel dosyaları PowerShell COM nesnesi ile okunamadığı için (Excel yüklü değil),
> aşağıdaki sorunlar tahmin edilen tipik hatalarıdır. Dosyaları şu şekilde kontrol etmeniz gerekir:

### **Satış Raporu (entegra-sales) İçinde Muhtemel Sorunlar:**

```
[ ] Tarih Sorunu
    ├─ Tarih formatı DD/MM/YYYY ama sistem YYYY-MM-DD bekliyor
    └─ Gelecek tarihler var (örneğin 2027'deki records)

[ ] SKU Sorunu  
    ├─ SKU'lar karışık case'de (SKU123 vs sku123)
    ├─ Boşluk başında/sonunda (SKU123 vs " SKU123 ")
    ├─ Özel karakterler içeriyor ($SKU123 vb.)
    └─ SKU stok listesinde bu nmuş

[ ] Etiketler / Kategori
    ├─ Ürün Adı tutarsız (Ürün A vs A ÜRÜN vs Ürün_A)
    └─ Kategorisi kategorilendirilememiş (boş alanlar var)

[ ] Para Birimi & Ciro
    ├─ Ciro hangi para biriminde? (TRY/USD/EUR karışık mı?)
    ├─ Ciro sütunu negatif satışlar içeriyor mu (iade?)
    └─ Ciro değerleri ondalık sayılar vs tam sayı karışık

[ ] Tarih Aralığı
    ├─ 01.01.2025'ten 27.03.2026 arasında çok Gek var mı?
    └─ Veriler sadece iş günlerine mi, hafta sonları da var mı?

[ ] Dup Sorunları
    ├─ Aynı tarihte aynı SKU birden çok satış kayıdı
    └─ Manuel veri giriş hatası (copy-paste hataları)
```

### **Stok Listesi (stok-listesi) İçinde Muhtemel Sorunlar:**

```
[ ] Mevcut Adet Sorunları
    ├─ SKU başına morally adet sayısı var (A deposı vs B deposu)
    ├─ Negatif adet kayıtları (sistem hatası)
    └─ Tasarılı mialyıklarında uyuşmazlık (manuel sayım vs sistem)

[ ] Birim Maliyet Sorunu
    ├─ Hangi ürün maliyeti FIFO vs LIFO bazında?
    ├─ Satış komisyonu, vergi vb. daha mı yoksa hariç mi?
    └─ Tekrar Gelen karenişlerde eski maliyet tutulmuş mu?

[ ] Satış Metrikleri
    ├─ "Son 30 Gün Satış" hesaplamasından çıkacak (doğrulama lazım)
    ├─ 0 satış kayıtları var mı (ölü stok)
    └─ Toplam Satış = Son 30 + Fark mı doğru?

[ ] Lead Time Verisı
    ├─ Her ürün için tedariciye göre farklı lead time var mı?
    └─ Lead Time parametresi evrensel mi, SKU başına mı?

[ ] Ürün Sertesi
    ├─ Master ürün ID mı yoksa şekil bazlı detaylı mı?
    └─ "Ürün Adı" stok vs satış verilerinde tutarlı mı?

[ ] Boş Alanlar
    ├─ Güvenlik Stoğu Gün kişi mi hiç kayıt var mı?
    ├─ Aylık Dönüş Katsayısı tanımlı mı?
    └─ Kategori/Grup bilgisi eksik ürünler var mı?
```

---

## 7. ENTEGRASYON ÇALIŞMA PLANI

### **Faz 1: Veri Hazırlığı (Haftaya 1)**
- [ ] Excel dosyaları gözden geçir, yukarıdaki sorunlar kontrol et
- [ ] SKU Master Listesi oluştur
- [ ] Data cleanup script yazılıştır (PowerShell/Python)
- [ ] Eksik alanları tanımla, doldurma stratejisi belirle

### **Faz 2: Import Engine (Hafta 2)**
- [ ] CLEAN_DATA Sheet schema'sını oluştur
- [ ] Apps Script import fonksiyorlarını yazılıştır
- [ ] Test edilmiş CSV dosyalarını import cek
- [ ] Validation kurallarını uygula

### **Faz 3: Metrik Hesaplama (Hafta 3)**
- [ ] `buildInventoryMetrics_()` fonksiyonunu test et
- [ ] `buildImportDecisionEngine_()` fonksiyonunu test et
- [ ] Hesapmalar ella doğrula (spot checks)
- [ ] Scoring algoritması (70/50/25) doğrula

### **Faz 4: Dashboard & Uyarılar (Hafta 4)**
- [ ] Decision Layer metrikleri Dashboard'a sun
- [ ] Action Center önerilerini güncelle
- [ ] Kritik stok uyarılarını aktif hale getir
- [ ] System smoke testleri çalıştır

### **Faz 5: Go-Live (Hafta 5)**
- [ ] Bütün workflow'ları baştan sona test et
- [ ] Yedekle + Rollback planı hazırla
- [ ] Stakeholder training
- [ ] İlk hafta günlük monitoring

---

## 8. NOTLAR & İLERİ ADIMLAR

1. **Excel dosyalarını doğrudan okuyamadık** - Windows üzerinde Excel yüklü değil
   - **Çözüm:** Excel dosyalarını CSV'ye export eyp, PowerShell'de oku
   - **Alternatif:** Google Sheets'e upload et ve API'den oku

2. **Tarih aralığı uyuşmazlığı** - Satış raporu 2025-2026'yi, stok listesi sadece 29.03.2026'yi kapsıyor
   - **Öneriy** Stok tarihine göre satış verilerini filtrelemm için warehouse inventory sync lazım

3. **Kur volatilitesi** - USD/TRY kurunun günlük değişim etkisi
   - **Çözüm:** Her işlem tarihinin kuru Parametreler'de kayıt et, versiyonla

4. **Ürün Kategorisininakali miş** - Ürün sınıflandırması (A/B/C analizi) çok önemli
   - **Çözüm:** SKU Master List'te kategori alanı zorunlu hale getir

5. **Pazaryeri Komisyonları** - Direkt satış vs Pazaryeri satışını ayrımcılaştır
   - **Çözüm:** Her satış kanalındaki yapı farklı olabilir, mapping belirt

---

**Raporun sonu**

İleri adımlar için lütfen Excel dosyaları kontrol edin ve kritik sorunları doğrulayınız.
Herhangi bir standardizasyon konusunda beraber çalışabiliız.
