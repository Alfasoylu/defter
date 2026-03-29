# DATA FLOW

## Amaç
Bu belge, verinin sisteme nereden girdiğini, hangi aşamalardan geçtiğini ve hangi çıktıları ürettiğini netleştirir.

Ana ilke:
- Giriş katmanı, hesap katmanı ve karar katmanı birbirine karıştırılmaz.

## Katmanlar

### 1. Giriş katmanı
Bu katmanda kullanıcı veya operasyonel süreç veri üretir.

Kaynaklar:
- Hızlı Veri Girişi
- Sabit Ödemeler
- Borç Takibi
- Kredi Kartları
- Açık Hesap Müşteriler
- İthalat Siparişleri
- Parametreler

### 2. Hesap katmanı
Bu katmanda ham veri, tarih ve senaryo bazlı görünür hale getirilir.

Bileşenler:
- Nakit Akışı
- Yaklaşan Ödemeler
- Yaklaşan Tahsilatlar
- Tahmini Satışlar
- Ürün / Stok Karlılık

### 3. Karar katmanı
Bu katmanda hesaplanan veri, yönetim aksiyonuna çevrilir.

Bileşenler:
- Dashboard
- Karar Motoru
- Ana Kontrol Paneli

## Akışlar

### Akış 1. Günlük manuel işlem -> nakit görünümü
1. Kullanıcı Hızlı Veri Girişi'ne kayıt girer.
2. Kayıt türüne göre ilgili sınıflandırma yapılır.
3. Script veya formül mantığı kaydı Nakit Akışı'na güvenli şekilde yansıtır.
4. Dashboard güncel bakiye ve risk görünümünü okur.

### Akış 2. Sabit ödeme -> gelecek nakit baskısı
1. Kullanıcı Sabit Ödemeler'e tek kayıt tanımlar.
2. Sistem tekrarlama kuralına göre gelecek satırları üretir.
3. Yaklaşan Ödemeler görünümü kritik tarihleri listeler.
4. Nakit Akışı, ödeme tarihine göre planlı çıkışları gösterir.

### Akış 3. Borç/kredi -> finansman baskısı
1. Borç Takibi kaydı oluşturulur.
2. Kalan anapara, taksit, faiz ve vade yapısı hesaplanır.
3. Yaklaşan Ödemeler borç servis tarihlerini çıkarır.
4. Dashboard ve Karar Motoru finansman baskısını değerlendirir.

### Akış 4. Kredi kartı -> kısa vadeli ödeme riski
1. Kart limiti, ekstre günü ve son ödeme günü tanımlanır.
2. Güncel borç ve dönem bilgisi işlenir.
3. Yaklaşan Ödemeler kart baskısını listeler.
4. Dashboard limit aşımı ve ödeme yakınlığı uyarısı üretir.

### Akış 5. Açık hesap -> tahsilat görünümü
1. Açık Hesap Müşteriler'e vadeli satış/alacak girilir.
2. Vade ve gecikme günleri hesaplanır.
3. Yaklaşan Tahsilatlar tahsilat takvimini üretir.
4. Tahsil edilmemiş kayıtlar gerçek nakit sayılmaz.

### Akış 6. İthalat siparişi -> çok aşamalı nakit etkisi
1. İthalat Siparişleri'nde sipariş açılır.
2. Mal bedeli, navlun ve gümrük tarihi/tutarı ayrı olaylar olarak işlenir.
3. Nakit Akışı bu olayları tarih bazlı çıkış olarak gösterir.
4. Tahmini varış ve satış başlangıcı, Tahmini Satışlar'a sinyal üretir.
5. Dashboard ithalat baskısı ve potansiyel katkıyı birlikte görür.

### Akış 7. Tahmini satış -> kontrollü öngörü
1. Geçmiş sinyal ve ithalat durumu kullanılarak Tahmini Satışlar üretilir.
2. Her tahmine senaryo tipi ve güven skoru atanır.
3. Yalnızca güven eşiğini geçen tahminler Nakit Akışı ve Karar Motoru tarafından dikkate alınır.
4. Gerçek veri geldiğinde tahmin pasiflenir veya override edilir.

### Akış 8. Dashboard -> Karar Motoru
1. Dashboard 7/30/60/90 gün görünümünü ve risk bloklarını üretir.
2. Karar Motoru nakit, ithalat, finansman, tahsilat ve stok verisini birlikte okur.
3. Sistem aksiyon önerisi üretir.
4. Ana Kontrol Paneli kısa yönetim özetini gösterir.

## Kritik ayrımlar

### Gerçek ve tahmini ayrımı
- Gerçek veri, belgeye veya fiili işleme dayanır.
- Tahmini veri, ayrı statü taşır.
- Tahmini veriler raporlarda gerçek veri gibi toplanmaz.

### Kaynak ve görünüm ayrımı
- Hızlı Veri Girişi, kaynak tablodur.
- Nakit Akışı ve Dashboard, görünüm tablosudur.
- Görünüm tablolarına manuel müdahale veri sahipliğini bozar.

### Update ve duplicate ayrımı
- Aynı iş olayı yeniden işlendiğinde yeni kayıt açılmaz.
- Kayıtlar iş anahtarı ile güncellenir.
- Duplicate testi tüm otomasyonlarda zorunludur.

## Başarısız olursa en büyük riskler
- Gerçek ve tahmini nakdin karışması
- Aynı işlemin iki kez nakit etkisi üretmesi
- İthalatın tek satırlı model yüzünden eksik görünmesi
- Tahsil edilmemiş alacağın nakit gibi değerlendirilmesi
- Dashboard'un yanlış kaynaktan veri okuması
