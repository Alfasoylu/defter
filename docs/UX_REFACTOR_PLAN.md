# UX REFACTOR PLAN

## Amaç

Spreadsheet bilgi mimarisini, teknik olmayan operatörün ilk bakışta anlayacağı hale getirmek:

- Nereye veri girer?
- Nereyi sistem yazar?
- Hangi sayfalar operasyonel girdi, hangisi hesaplama çıktısı, hangisi dashboard?

## Uygulanan Değişiklikler

### 1. Sayfa Sekme Renkleri

Her sayfanın sekme rengi, sayfanın türünü gösterir.

| Renk                   | Tür    | Anlam                      |
| ---------------------- | ------ | -------------------------- |
| 🟢 Yeşil (`#34a853`)   | INPUT  | Operatör veri girer        |
| 🔵 Mavi (`#4285f4`)    | HYBRID | Operatör + sistem birlikte |
| 🟠 Turuncu (`#ff8f00`) | SYSTEM | Sistem otomatik oluşturur  |
| 🟣 Mor (`#9334e6`)     | PANEL  | Dashboard / kontrol paneli |
| ⚙️ Gri (`#5f6368`)     | CONFIG | Parametre ayarları         |
| Açık Gri (`#80868b`)   | LOG    | Sistem logları             |
| 🔴 Kırmızı (`#ea4335`) | START  | Başlangıç rehberi          |

### 2. Sütun Başlık Renkleri (HYBRID sayfalar)

- **Yeşil başlık** (`#e8f5e9`): Operatör bu sütuna veri girer
- **Gri başlık** (`#f3f3f3`): Sistem hesaplar — dokunmayın

Her sistem sütununda note: `"Sistem tarafından hesaplanır — düzenlemeyin"`

### 3. Sayfa Korumaları

Tüm SYSTEM, PANEL ve LOG sayfalarına uyarı seviyesinde koruma eklendi.
Operatör yanlışlıkla düzenlemeye çalışırsa uyarı alır.

### 4. Başlangıç Sayfası

İlk sekme olarak "Başlangıç" rehber sayfası eklendi:

- Renk kodu açıklaması
- Her sayfanın amacı ve kimin kullandığı
- Sütun renk kodları açıklaması

### 5. Sayfa Sıralaması

Sayfalar mantıksal gruplar halinde sıralandı:

1. Başlangıç (rehber)
2. Ana Kontrol Paneli, Dashboard (yönetici görselleri)
3. Hızlı Veri Girişi (ana giriş noktası)
4. Takip sayfaları (Borç, Alacak, Sabit, Stok, Stok Har., İthalat, Kredi Kartı, Açık Hesap)
5. Sistem hesaplama sayfaları (Nakit, SKU Kar, Talep, Tahmin, Risk)
6. Aksiyon Merkezi
7. Parametreler, Sistem Logları

### 6. Menü Yeniden Yapılandırması

Menü 3 alt menüye ayrıldı:

- **⚙️ Sistem Kurulum**: tam kurulum, şema, doğrulama, parametreler, UX formatı
- **📊 Hesapla / Yenile**: dashboard, nakit, stok, ithalat, sabit gider, tahmin, karar
- **🔧 Bakım**: ID bakımı, tarih düzeltme, risk, uyarı, aksiyon, ana panel

## Teknik Detaylar

### Yeni Fonksiyonlar

- `applySheetUx_()` — ana UX orkestratörü
- `applyTabColors_(ss)` — sekme renklerini uygular
- `applyHeaderColors_(ss)` — başlık renklerini ve notlarını uygular
- `applySystemProtections_(ss)` — salt okunur korumaları koyar
- `createStartSheet_(ss)` — Başlangıç rehberini oluşturur/günceller
- `reorderSheets_(ss)` — sayfa sırasını düzenler

### Yeni Metadata

`SHEET_UX` objesi 00_Config.js'e eklendi:

- `classifications`: her sayfa için tür (INPUT/HYBRID/SYSTEM/PANEL/CONFIG/LOG)
- `tabColors`: tür başına renk kodu
- `sheetOrder`: hedef sayfa sıralaması
- `systemColumns`: HYBRID sayfalarda sistem tarafından hesaplanan sütunlar

### Entegrasyon

- `fullSystemSetup_()` sonunda `applySheetUx_()` çağrılır
- Menüden "UX Formatını Uygula" ile manuel tetiklenebilir
- İdempotent — birden fazla çalıştırma güvenlidir

## Risk Değerlendirmesi

- ✅ Sayfa isimleri DEĞİŞTİRİLMEDİ (CONFIG.sheets referansları korundu)
- ✅ Sütun isimleri DEĞİŞTİRİLMEDİ (getHeaderMap\_ referansları korundu)
- ✅ Veri DEĞİŞTİRİLMEDİ (sadece format ve metadata)
- ✅ Mevcut testler etkilenmez
- ⚠️ Başlangıç sayfası yeni eklendi (CONFIG.sheets'te yok — bilinçli karar)
