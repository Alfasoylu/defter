# ALERTS AND AUTOMATIONS

## Amaç
Finansal risklerin kullanıcı fark etmeden büyümesini engellemek, tekrarlı operasyonel işleri otomatikleştirmek ve sessiz çöküş riskini kapatmak.

## Temel ilke
Uyarı sistemi, kullanıcının her gün her sayfayı kontrol etmesini gerektirmeyen bir erken uyarı katmanı olmalıdır.

Otomasyon sistemi ise tekrarlı veri üretim ve güncelleme işlerini güvenli biçimde yürütmelidir.

---

## Uyarılar

### 1. Nakit güvenliği uyarıları

#### Güvenli nakit altı uyarısı
Tetikleme koşulu:
- Herhangi bir gün için projeksiyon bakiyesi `safe_cash_floor` parametresinin altına düşüyor.

Öncelik: yüksek

Çıktı:
- en riskli tarih
- bakiye tutarı
- güvenli alt limitten sapma

#### Negatif bakiye uyarısı
Tetikleme koşulu:
- Herhangi bir gün için projeksiyon bakiyesi sıfırın altına düşüyor.

Öncelik: kritik

Çıktı:
- negatif bakiye tarihi
- negatif tutar
- negatif gün sayısı

#### Nakit tampon erimesi uyarısı
Tetikleme koşulu:
- Ardışık dönemlerde güvenli tampon daralıyor (trend negatif).

Öncelik: orta

### 2. Ödeme uyarıları

#### Yaklaşan yüksek tutarlı ödeme
Tetikleme koşulu:
- 7 gün içinde tutarı belirli bir eşiğin üstünde ödeme var.

Kaynak:
- Sabit Ödemeler
- Borç Takibi
- Kredi Kartları
- İthalat Siparişleri

#### Ödeme çakışması uyarısı
Tetikleme koşulu:
- Aynı tarihte veya 3 günlük pencerede birden fazla yüksek tutarlı ödeme üst üste geliyor.

Öncelik: yüksek

#### Geciken ödeme uyarısı
Tetikleme koşulu:
- Vadesi geçmiş borç taksidi veya sabit ödeme.

Öncelik: kritik

### 3. Tahsilat uyarıları

#### Geciken alacak uyarısı
Tetikleme koşulu:
- Açık hesap müşteri alacağının vade tarihi geçmiş ve tahsil durumu hâlâ açık.

Öncelik: yüksek

Çıktı:
- müşteri adı
- gecikme gün sayısı
- bakiye tutarı

#### Tahsilat yoğunlaşma riski
Tetikleme koşulu:
- Toplam açık alacağın büyük kısmı tek müşteride yoğunlaşmış.

Öncelik: orta

#### Tahsilat görünürlüğü zayıflığı
Tetikleme koşulu:
- 30+ gün ufkunda beklenen tahsilat verisi yetersiz veya güven skoru düşük.

Öncelik: orta

### 4. Kredi kartı uyarıları

#### Son ödeme yaklaşıyor
Tetikleme koşulu:
- Son ödeme tarihine 7 gün kala ödeme henüz yapılmamış.

Öncelik: yüksek

#### Limit baskısı
Tetikleme koşulu:
- Limit kullanım oranı %80 üstünde.

Öncelik: orta (%80), yüksek (%90+)

### 5. Borç ve finansman uyarıları

#### Borç servisi baskısı yükseliyor
Tetikleme koşulu:
- Toplam aylık borç servisi / aylık net nakit yaratımı oranı eşik üstüne çıkıyor.

Öncelik: yüksek

#### Faiz yükü artış trendi
Tetikleme koşulu:
- Aylık toplam finansman maliyeti artış eğiliminde.

Öncelik: orta

### 6. Stok ve verim uyarıları

#### Yaşlanan stok uyarısı
Tetikleme koşulu:
- Stok devir süresi `stock_aging_warning_days` parametresini aşıyor.

Öncelik: orta

#### Finansman sonrası negatif verim
Tetikleme koşulu:
- Ürün grubu bazında finansman maliyeti çıkarıldıktan sonra net getiri negatif.

Öncelik: yüksek

### 7. Sabit gider uyarıları

#### Sabit gider karşılama oranı düşük
Tetikleme koşulu:
- Aylık net nakit yaratımı sabit giderleri karşılamaya yetmiyor.

Öncelik: kritik

#### Sabit gider artış etkisi
Tetikleme koşulu:
- Artış tarihi yaklaşan sabit ödemeler mevcut bakiye eğrisini bozuyor.

Öncelik: orta

### 8. İthalat uyarıları

#### İthalat ödeme takvimi baskısı
Tetikleme koşulu:
- 30 gün içinde ithalat kaynaklı toplam çıkış güvenli tamponu zorlayacak seviyede.

Öncelik: yüksek

#### İthalat gecikme riski
Tetikleme koşulu:
- Tahmini varış tarihi geçmiş ama durum hâlâ "yolda" veya "gümrükte".

Öncelik: orta

---

## Otomasyonlar

### 1. Sabit ödeme üretimi
Tetikleme: menü komutu veya zamanlı trigger
Davranış:
- Sabit Ödemeler kaynak tablosundaki aktif kayıtları tarar.
- Tekrarlama tipine göre gelecek dönemlerin planlı çıkışlarını üretir.
- Artış tarihi sonrası revize tutarı kullanır.
- Dondurulmuş/iptal kayıtları atlar.
- Duplicate kontrolü iş anahtarı ile yapılır.

### 2. Nakit projeksiyon güncelleme
Tetikleme: menü komutu veya zamanlı trigger
Davranış:
- Tüm kaynak modüllerden (borç, kart, sabit, ithalat, alacak, tahmin) nakit etkilerini toplar.
- Tarih bazlı birleşik projeksiyon oluşturur.
- En riskli tarih ve minimum bakiye hesaplar.

### 3. Dashboard yenileme
Tetikleme: menü komutu
Davranış:
- Tüm hesaplama motorlarını sırayla çalıştırır.
- Dashboard, Aksiyon Merkezi ve Ana Kontrol Paneli sayfalarını yeniden render eder.

### 4. Tahmini satış güncelleme
Tetikleme: menü komutu
Davranış:
- Geçmiş satış verisi ve ithalat siparişlerinden trailing average hesaplar.
- Senaryo katsayılarına göre muhafazakâr/normal/agresif tahminler üretir.
- Gerçek veri gelen dönemlerde tahmini override eder.

### 5. Duplicate engelleme
Tetikleme: her veri yazım işleminde
Davranış:
- İş anahtarı ile mevcut kayıt aranır.
- Varsa güncellenir, yoksa eklenir.
- appendRow yalnızca yeni kayıt için kullanılır.

### 6. Gecikme gün güncelleme
Tetikleme: günlük veya görünüm yenilendiğinde
Davranış:
- Açık hesap alacaklarının gecikme gün sayısını yeniden hesaplar.
- Risk skorunu günceller.

---

## Zamanlı trigger stratejisi

### Günlük trigger (önerilir)
- Nakit projeksiyon güncelleme
- Gecikme gün güncelleme
- Uyarı taraması

### Haftalık trigger
- Tahmini satış güncelleme
- Sabit ödeme üretimi (yeni dönem kontrolü)
- Stok yaşlanma kontrolü

### Manuel trigger (menü)
- Dashboard tam yenileme
- Tüm hesaplama motorları çalıştırma
- Veri onarım fonksiyonları

---

## Uyarı gösterim kuralları
- Kritik uyarılar Dashboard üst bölümünde kırmızı etiketle gösterilir.
- Yüksek öncelikli uyarılar sarı etiketle gösterilir.
- Orta öncelikli uyarılar yalnızca ilgili detay sayfasında gösterilir.
- Her uyarı, tetikleme nedenini ve önerilen aksiyonu içermelidir.

## Loglama
- Her otomasyon çalışması Sistem Logları'na kayıt bırakmalıdır.
- Başarılı çalışma: bilgi logu
- Hata: hata logu
- Veri eksikliği: uyarı logu

## Kabul kriterleri
- Yaklaşan ödemeler 7 gün öncesinden uyarı üretmeli.
- Geciken alacak otomatik tespit edilmeli.
- Negatif bakiye tarihi proaktif olarak gösterilmeli.
- Sabit ödeme üretimi duplicate oluşturmamalı.
- Otomasyon hataları sessizce yutulmamalı.
