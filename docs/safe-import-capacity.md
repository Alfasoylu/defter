# SAFE IMPORT CAPACITY

## Amaç
Bugünkü finansal yapıya göre ne kadar ithalatın güvenli, ne kadarının temkinli, ne kadarının riskli olduğunu hesaplamak.

## Temel ilke
Güvenli ithalat kapasitesi, sadece eldeki nakit tutarı değildir.

Şu bileşenlerin birlikte değerlendirilmesi gerekir:
- mevcut gerçek nakit
- 30/60/90 günlük ödeme baskısı
- sabit giderler
- borç servis yükü
- kart ödeme baskısı
- açık hesap tahsilat görünürlüğü
- ithalatın parçalı ödeme takvimi
- güven katsayılı tahmini satış katkısı
- güvenli nakit tamponu

## Kapasite seviyeleri

### 1. Güvenli kapasite
İthalat sonrası:
- 30 gün görünümünde güvenli nakit tamponu korunur
- 60 gün görünümünde ciddi kırılma oluşmaz
- finansman sonrası net katkı pozitiftir

### 2. Temkinli kapasite
İthalat mümkündür ancak:
- tampon daralır
- tahsilat görünürlüğü sınırlıdır
- kısmi sipariş veya aşamalı alım tercih edilmelidir

### 3. Riskli kapasite
İthalat sonrası:
- güvenli tampon kırılır veya negatif bakiye oluşur
- borç servis baskısı artar
- tahsilat görünürlüğü yetersizdir

## Girdi seti
- bugünkü gerçek nakit
- güvenli nakit alt limiti
- 7/30/60/90 gün ödeme planı
- sabit ödemeler
- borç ve kredi taksitleri
- kredi kartı ödemeleri
- açık hesap tahsilat takvimi
- tahmini satış katkısı ve güven skoru
- ithalatın mal bedeli, navlun ve gümrük takvimi
- ürün grubu bazlı finansman sonrası net verim

## Hesap yaklaşımı

### Adım 1. Mevcut görünüm
İthalat eklenmeden önce:
- 30 gün minimum bakiye
- 60 gün minimum bakiye
- 90 gün minimum bakiye

çıkarılır.

### Adım 2. İthalat yükünü ekle
Her ithalat senaryosu için:
- mal bedeli çıkışı
- navlun çıkışı
- gümrük çıkışı

ayrı tarihlerde nakit eğrisine eklenir.

### Adım 3. Koruyucu katkıları ekle
- güven katsayısı eşiğini geçen tahmini tahsilatlar
- açık hesaplardan beklenen tahsilatlar

Not:
- Düşük güvenli tahminler güvenli kapasite hesabına tam katkı vermez.

### Adım 4. Net baskıyı ölç
Sorulacak soru:
- ithalat senaryosu eklendiğinde minimum bakiye ne oluyor
- güvenli tampon korunuyor mu
- negatif gün sayısı artıyor mu

### Adım 5. Net verim kontrolü
Yalnız nakde değil, getirisine de bakılır:
- finansman sonrası net getiri pozitif mi
- stok devir süresi kabul edilebilir mi
- tahsilat süresi baskıyı taşıyor mu

## Karar kuralları

### Güvenli ithalat
- 30 günlük tampon korunuyor
- 60 günlük görünüm yönetilebilir
- ürün verimi pozitif
- tahmini katkı güvenli

### Temkinli ithalat
- tampon korunmasa bile kritik kırılma yok
- sipariş boyutu azaltılırsa yapı çalışıyor
- kısmi sevkiyat veya tarih kaydırma ile ilerlenebilir

### İthalatı ertele
- negatif bakiye oluşuyor
- güvenli tampon belirgin şekilde kırılıyor
- tahsilat görünürlüğü zayıf
- kredi olmadan yapı taşıyamıyor

## Çıktılar
- bugün güvenli ithalat kapasitesi
- temkinli ithalat kapasitesi
- riskli eşik
- ana darboğaz nedeni
- önerilen aksiyon

## Darboğaz nedenleri
Sistem kapasiteyi sınırlayan başlıca nedeni gösterebilmelidir:
- yetersiz gerçek nakit
- sabit gider baskısı
- borç servis yükü
- tahsilat gecikmesi
- yavaş stok devri
- yüksek finansman maliyeti

## Dashboard ilişkisi
Dashboard üzerinde en az şu özet görünmelidir:
- güvenli kapasite
- temkinli kapasite
- darboğaz nedeni
- ithalatı artır / azalt / ertele kararı

## Kabul kriterleri
- İthalat tek toplam rakamla değerlendirilmemeli.
- 30/60/90 gün görünümü hesapta kullanılmalı.
- Güvenli tampon koruması kapasite hesabının ana parçası olmalı.
- Net verimi negatif olan ürün için kapasite önerisi yapılmamalı.
