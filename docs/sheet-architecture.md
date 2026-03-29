# SHEET ARCHITECTURE

## Amaç
Sheet yapısının amacı, veri girişini basit tutarken karar üretimini güvenli kaynak tablolara dayandırmaktır.

Temel kurallar:
- Her sayfanın tek bir ana sorumluluğu vardır.
- Giriş sayfaları ile hesaplama/görünüm sayfaları ayrılır.
- Dashboard ve Karar Motoru mümkün olduğunca yalnızca özet ve kontrol edilmiş tablolardan veri okur.
- Tahmini ve gerçek veri aynı sayfada tutulsa bile ayrı blok, alan veya statü ile ayrılır.

## Ana sayfalar ve sahiplik

### 1. Ana Kontrol Paneli
Amaç:
- Mobilde ilk bakışta günlük durumu göstermek

Okuduğu kaynaklar:
- Dashboard
- Yaklaşan Ödemeler
- Yaklaşan Tahsilatlar
- Karar Motoru

Ürettiği çıktı:
- Yönetici özet görünümü

### 2. Hızlı Veri Girişi
Amaç:
- Kullanıcının manuel işlem girdiği tek operasyon ekranı

Okuduğu kaynaklar:
- Parametreler
- Dropdown listeleri

Ürettiği çıktı:
- Ham işlem kayıtları

Tek sahip olduğu veri:
- Manuel operasyon girişi

### 3. Nakit Akışı
Amaç:
- Tarih bazlı birleşik nakit görünümünü üretmek

Okuduğu kaynaklar:
- Hızlı Veri Girişi
- Sabit Ödemeler
- Borç Takibi
- Kredi Kartları
- İthalat Siparişleri
- Tahmini Satışlar

Ürettiği çıktı:
- Günlük giriş/çıkış/bakiye görünümü
- En riskli tarih

### 4. Sabit Ödemeler
Amaç:
- Tekrarlı giderlerin tek merkezden yönetimi

Okuduğu kaynaklar:
- Parametreler

Ürettiği çıktı:
- Gelecek dönem ödeme planı
- Nakit akışına yansıyacak planlı çıkışlar

### 5. Borç Takibi
Amaç:
- Kredi, taksit ve diğer borç baskısını izlemek

Okuduğu kaynaklar:
- Parametreler

Ürettiği çıktı:
- Taksit planı
- Borç servis yükü

### 6. Kredi Kartları
Amaç:
- Ekstre dönemi ve son ödeme baskısını takip etmek

Okuduğu kaynaklar:
- Parametreler

Ürettiği çıktı:
- Yaklaşan kart ödemeleri
- Limit baskısı uyarıları

### 7. Açık Hesap Müşteriler
Amaç:
- Vadeli alacakları tahsil edilmiş nakitten ayırmak

Okuduğu kaynaklar:
- Parametreler

Ürettiği çıktı:
- Tahsilat takvimi
- Gecikme ve risk görünümü

### 8. İthalat Siparişleri
Amaç:
- Çok aşamalı ithalat maliyetinin zaman etkisini modellemek

Okuduğu kaynaklar:
- Parametreler
- Ürün / Stok Karlılık

Ürettiği çıktı:
- Parçalı ödeme etkisi
- Tahmini varış ve satış başlangıcı

### 9. Ürün / Stok Karlılık
Amaç:
- Ürün bazlı sermaye verimini ölçmek

Okuduğu kaynaklar:
- Parametreler
- İthalat Siparişleri

Ürettiği çıktı:
- Marj + devir + finansman sonrası verim

### 10. Tahmini Satışlar
Amaç:
- Uzun vadeli görünürlük üretmek

Okuduğu kaynaklar:
- Parametreler
- geçmiş gerçek satış sinyalleri
- İthalat Siparişleri

Ürettiği çıktı:
- Senaryo bazlı tahmini satış ve tahsilat

### 11. Parametreler
Amaç:
- Tüm ortak sistem ayarlarını merkezi yönetmek

Ürettiği çıktı:
- Modüllere dağıtılan referans değerler

### 12. Dashboard
Amaç:
- Yönetim için KPI ve risk görünümü üretmek

Okuduğu kaynaklar:
- Nakit Akışı
- Yaklaşan Ödemeler
- Yaklaşan Tahsilatlar
- Karar Motoru
- Ürün / Stok Karlılık

Ürettiği çıktı:
- 7/30/60/90 gün görünümü
- risk blokları
- güvenli ithalat kapasitesi özeti

### 13. Karar Motoru
Amaç:
- Veriyi aksiyon önerisine çevirmek

Okuduğu kaynaklar:
- Dashboard
- Nakit Akışı
- Borç Takibi
- Açık Hesap Müşteriler
- İthalat Siparişleri
- Ürün / Stok Karlılık
- Tahmini Satışlar
- Parametreler

Ürettiği çıktı:
- bugün ne yapmalıyım
- ithalat yap/yapma
- kredi kullan/kullanma
- stok erit/arttır
- gider azalt/büyü/küçül

### 14. Yaklaşan Ödemeler
Amaç:
- 7/30 gün ufkunda ödeme riskini ayrı görünür kılmak

Okuduğu kaynaklar:
- Sabit Ödemeler
- Borç Takibi
- Kredi Kartları
- İthalat Siparişleri

Ürettiği çıktı:
- ödeme takvimi
- kritik tarih listesi

### 15. Yaklaşan Tahsilatlar
Amaç:
- Beklenen nakit girişlerini gerçek/tahmini ayrımıyla göstermek

Okuduğu kaynaklar:
- Açık Hesap Müşteriler
- Tahmini Satışlar

Ürettiği çıktı:
- tahsilat takvimi
- geciken alacak görünümü

### 16. Test Sonuçları
Amaç:
- Test çıktılarının kayıt altına alınması

Okuduğu kaynaklar:
- Script testleri
- manuel test kayıtları

Ürettiği çıktı:
- son test sonucu
- hata listesi

### 17. Sistem Logları
Amaç:
- Otomasyon ve script davranışlarını izlemek

Okuduğu kaynaklar:
- Apps Script log üretimi

Ürettiği çıktı:
- hata ve işlem izi

## Veri akışı özeti
- Hızlı Veri Girişi -> Nakit Akışı
- Sabit Ödemeler -> Yaklaşan Ödemeler -> Nakit Akışı
- Borç Takibi -> Yaklaşan Ödemeler -> Nakit Akışı -> Dashboard
- Kredi Kartları -> Yaklaşan Ödemeler -> Dashboard
- Açık Hesap Müşteriler -> Yaklaşan Tahsilatlar -> Dashboard
- İthalat Siparişleri -> Nakit Akışı + Tahmini Satışlar + Dashboard
- Tahmini Satışlar -> Yaklaşan Tahsilatlar + Nakit Akışı + Karar Motoru
- Dashboard -> Karar Motoru

## Mobil öncelikli sayfalar
- Ana Kontrol Paneli
- Hızlı Veri Girişi
- Dashboard
- Yaklaşan Ödemeler
- Yaklaşan Tahsilatlar

## Masaüstü öncelikli sayfalar
- Parametreler
- İthalat Siparişleri
- Ürün / Stok Karlılık
- Karar Motoru detay görünümü
- Test Sonuçları
- Sistem Logları

## Mimari uyarılar
- Dashboard veri girişi yapılan bir sayfa olmamalıdır.
- Nakit Akışı manuel düzenleniyorsa kaynak sahipliği bozulur.
- Tahmini Satışlar, Açık Hesap Müşteriler ile aynı blokta tutulmamalıdır.
- İthalatın mal bedeli, navlun ve gümrük etkisi tek satır özetleştirilmemelidir.
