# OPERATÖR REHBERİ

Bu rehber, Muhasebe Sistemini günlük kullanan operatör için hazırlanmıştır.

---

## 🚀 Başlangıç

1. Spreadsheet'i açtığınızda ilk sayfa **"Başlangıç"** rehberidir
2. Her sekmenin rengi o sayfanın türünü gösterir (aşağıdaki tabloya bakın)
3. Her sayfada **yeşil başlıklı** sütunlara siz veri girersiniz
4. **Gri başlıklı** sütunlar sisteme aittir — dokunmayın

---

## 🎨 Renk Kodları

| Sekme Rengi | Ne Demektir        | Ne Yaparsınız                                   |
| ----------- | ------------------ | ----------------------------------------------- |
| 🟢 Yeşil    | Veri giriş sayfası | Veri girin                                      |
| 🔵 Mavi     | Karma sayfa        | Yeşil sütunlara girin, gri sütunlara dokunmayın |
| 🟠 Turuncu  | Sistem hesaplaması | Sadece okuyun — dokunmayın                      |
| 🟣 Mor      | Dashboard / Panel  | Sadece okuyun — dokunmayın                      |
| ⚙️ Gri      | Ayar / Log         | Parametreleri güncelleyin, logları okuyun       |

---

## 📝 Günlük İşlemler

### Yeni işlem girme

1. **Hızlı Veri Girişi** sayfasına gidin (yeşil sekme)
2. Son satırın altına yeni satır ekleyin
3. Zorunlu alanları doldurun:
   - **İşlem Tarihi** (gg.aa.yyyy)
   - **İşlem Tipi** (dropdown'dan seçin)
   - **Tutar** (0'dan büyük)
   - **Para Birimi** (dropdown'dan seçin)
   - TRY dışı para birimi için **Kur** da girin
4. Diğer alanları ihtiyaca göre doldurun
5. Kayıt ID ve Tutar TL otomatik hesaplanır
6. İşlem otomatik olarak ilgili takip sayfasına yansır

### Sabit gider tanımlama

1. **Sabit Giderler** sayfasına gidin
2. Yeni satır ekleyin: Gider Adı, Kategori, Aylık Tutar, Ayın Günü, Tekrarlama Tipi
3. Durum: "Aktif" yapın
4. Sistem her ay otomatik olarak Borç Takibi'ne ödeme kaydı oluşturur

### Stok güncelleme

1. **Stok Envanter** sayfasında ilgili SKU satırını bulun
2. **Mevcut Adet**, **Birim Tam Maliyet TL**, **Son 30/90 Gün Satış Adedi** güncelleyin
3. Geri kalan metrikler (stok durumu, risk puanları) sistem tarafından hesaplanır

### Kredi kartı güncelleme

1. **Kredi Kartları** sayfasında kart satırını bulun
2. **Güncel Bakiye**, **Son Ekstre Tutarı** sütunlarını güncelleyin
3. Limit kullanımı ve risk seviyesi sistem tarafından hesaplanır

### Açık hesap alacak girme

1. **Açık Hesap Müşteriler** sayfasına yeni satır ekleyin
2. Müşteri adı, tutar, vade tarihi girin
3. Tahsilat yapıldıkça **Tahsil Edilen Tutar**'ı güncelleyin
4. Kalan bakiye, gecikme günü ve risk puanı sistem tarafından hesaplanır

### İthalat planı girme

1. **İthalat Planı** sayfasına yeni satır ekleyin
2. SKU, fiyat, nakliye ve ödeme detaylarını girin
3. ROI, sipariş kararı ve risk seviyesi sistem tarafından hesaplanır

---

## 🔄 Sistem Yenileme

Verileri girdikten sonra sistemin hesaplamaları güncellemesi gerekir:

### Menüden yenileme

**Muhasebe Sistemi** menüsü → **📊 Hesapla / Yenile** → **Dashboard Yenile**

Bu tek komut tüm hesaplamaları, nakit projeksiyonunu, risk panelini, dashboard'u ve aksiyonları günceller.

### Tek tek modül yenileme

- Nakit Akışı: **📊 Hesapla / Yenile** → **Nakit Akışını Hesapla**
- Stok metrikleri: **📊 Hesapla / Yenile** → **Stok Zekasını Güncelle**
- İthalat kararları: **📊 Hesapla / Yenile** → **İthalat Karar Motorunu Çalıştır**

---

## 📊 Dashboard Okuma

### Ana Kontrol Paneli (mobil optimize)

- İlk sayfada günlük özet
- Nakit durumu, yaklaşan ödemeler, kritik uyarılar
- Mobilde yatay kaydırma olmadan görünür

### Dashboard (detaylı)

- Nakit durumu: mevcut bakiye, güvenli alt limit, tampon durumu
- Zaman ufku: 7/30/60/90 gün önceden bakış
- Stok: toplam değer, kritik SKU'lar
- Finansman: borç kapasitesi, DSCR
- Verimlilik: en iyi/en kötü ürün grupları

### Aksiyon Merkezi

- Öncelik sırasına göre yapılacaklar
- En üstteki aksiyon en acil
- Gecikmiş borçlar, stok tükenmeleri, tahsilat riskleri burada görünür

---

## ⚠️ Yapmamanız Gerekenler

1. **Turuncu veya mor sekmeli sayfalara veri GİRMEYİN** — sistem üzerine yazar
2. **Gri başlıklı sütunlara veri GİRMEYİN** — formül bozulur
3. **Sayfa isimlerini DEĞİŞTİRMEYİN** — sistem referansları kopar
4. **Sütun başlıklarını DEĞİŞTİRMEYİN** — header-map sistemi bozulur
5. **Satır veya sütun SİLMEYİN** — kayıt ID referansları kopar
6. **Sistem Logları sayfasını temizlemeyin** — denetim izi kaybedilir

---

## 🆘 Sorun Giderme

| Sorun                   | Çözüm                                                     |
| ----------------------- | --------------------------------------------------------- |
| Sütun başlığı kayboldu  | Menü → ⚙️ Sistem Kurulum → Tüm Şemaları Yeniden Kur       |
| Renk kodları bozuldu    | Menü → ⚙️ Sistem Kurulum → UX Formatını Uygula            |
| Dashboard güncellenmedi | Menü → 📊 Hesapla / Yenile → Dashboard Yenile             |
| Kayıt ID eksik          | Menü → 🔧 Bakım → Kayıt ID Bakımı                         |
| Tarih formatı bozuk     | Menü → 🔧 Bakım → Tarih Formatlarını Düzelt               |
| Parametreler kayıp      | Menü → ⚙️ Sistem Kurulum → Parametreleri Yükle / Güncelle |
| Sistem hata verdi       | Sistem Logları sayfasını kontrol edin                     |

---

## 📱 Mobil Kullanım

- **Ana Kontrol Paneli** mobil için optimize edilmiştir
- İlk 3 satırda günlük durum özeti
- Telefonda yatay kaydırma olmadan okunabilir
- Detay için bilgisayardan Dashboard'a geçin
