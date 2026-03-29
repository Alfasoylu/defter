# IMPORT FINANCE MODEL

## Amaç
İthalatı tek seferlik bir ödeme değil, zaman içinde nakit etkisi üreten çok aşamalı bir finansal olay olarak modellemek.

## Temel ilke
İthalat kararı yalnızca toplam kar potansiyeline göre verilmez.

Aşağıdaki unsurlar birlikte değerlendirilir:
- mal bedeli ödeme tarihi
- navlun ödeme tarihi
- vergi/gümrük ödeme tarihi
- kur etkisi
- transit süresi
- satış başlangıç gecikmesi
- stok devir süresi
- tahsilat süresi
- finansman maliyeti
- güvenli nakit tamponu etkisi

## Aşamalar

### 1. Mal bedeli
- Sipariş anında veya siparişe yakın tarihte oluşur.
- Genellikle nakdin en erken çıktığı aşamadır.

### 2. Navlun
- Yükleme veya taşıma sürecinde oluşur.
- Hava ve deniz ithalatında zaman ve maliyet profili farklıdır.

### 3. Vergi / gümrük
- Varışa yakın veya gümrükte oluşur.
- Nakit baskısı çoğu zaman bu aşamada yeniden yükselir.

## Zaman modeli

### Hava kargo
- transit varsayımı: 5-15 gün
- daha hızlı satış başlangıcı
- daha yüksek navlun maliyeti

### Deniz yükü
- transit varsayımı: 45-60 gün
- daha geç nakit dönüşü
- daha düşük navlun birim maliyeti

Transit süreleri sabit değer değil, Parametreler sayfasından gelen ayarlanabilir girdilerdir.

## Girdi alanları
- sipariş tarihi
- tedarikçi
- taşıma tipi
- ürün grubu
- kur
- mal bedeli ödeme tarihi ve tutarı
- navlun ödeme tarihi ve tutarı
- vergi/gümrük ödeme tarihi ve tutarı
- tahmini varış tarihi
- tahmini satış başlangıç tarihi
- beklenen stok devir süresi
- beklenen tahsil süresi
- iptal/gecikme durumu

## Hesaplama mantığı

### Toplam ithalat maliyeti
Toplam ithalat maliyeti şu bileşenlerden oluşur:
- mal bedeli
- navlun
- vergi/gümrük
- varsa iç lojistik ve ek masraflar
- kur farkı etkisi

Not:
- Vergi/gümrük için tek bir sabit oran varsayılmaz.
- Oran veya tutar parametre veya gerçek veri ile belirlenmelidir.

### Nakit baskısı profili
İthalatın nakit üzerindeki etkisi tek tarihli değil, olay bazlı hesaplanır:
- T1: mal bedeli çıkışı
- T2: navlun çıkışı
- T3: vergi/gümrük çıkışı
- T4: satış başlangıcı
- T5: tahsilat başlangıcı

Bu yüzden değerlendirme toplam kardan önce minimum bakiye eğrisine bakmalıdır.

### Finansman sonrası net getiri
Basit ROI yeterli değildir.

Değerlendirilmesi gerekenler:
- brüt kar
- net kar
- finansman maliyeti
- bekleme süresi maliyeti
- tahsilat gecikmesi etkisi

Karar için kullanılacak özet mantık:
- finansman sonrası net getiri pozitif olmalı
- ithalatın nakit baskısı güvenli tamponu kırmamalı
- satışa dönüş süresi kabul edilebilir eşikte olmalı

## Karar eşikleri

### Güvenli ithalat
- 30 günlük görünümde güvenli nakit alt limiti korunuyor
- 60 günlük görünümde ithalatın tüm parçalı ödemeleri karşılanabiliyor
- ürün grubu finansman sonrası pozitif katkı veriyor
- tahmini satış katkısı güven skoru eşiğini geçiyor

### Temkinli ithalat
- toplam getiri olumlu
- ancak tampon daralıyor veya tahsilat görünürlüğü zayıf
- sipariş tutarı azaltılarak veya kısmi sevkiyatla ilerlenmeli

### Uygun olmayan ithalat
- toplam getiri pozitif görünse bile nakit tamponu kırılıyor
- tahsilat süresi uzun ve belirsiz
- stok devir süresi sabit gider baskısını artırıyor

## Hava vs deniz seçimi
Seçim sadece navlun maliyetine göre yapılmaz.

Karşılaştırma kriterleri:
- ek navlun maliyeti
- transit kazanımı
- satış başlangıcını öne çekme etkisi
- güvenli nakit tamponuna etkisi
- finansman maliyetinden tasarruf

Hava kargo tercih edilebilir:
- stoksuz kalma maliyeti yüksekse
- daha erken tahsilat toplam finansman maliyetini düşürüyorsa
- deniz transit süresi 60/90 gün görünümünü bozuyorsa

Deniz tercih edilebilir:
- tampon güçlü ise
- talep görünürlüğü yeterliyse
- hacim avantajı net biçimde pozitife dönüyorsa

## Risk senaryoları

### Kur riski
- sipariş anı kuru ile ödeme anı kuru farklı olabilir
- model, minimum bazda bir kur stresi senaryosu taşımalıdır

### Gecikme riski
- varış tarihi gecikirse satış başlangıcı ötelenir
- bu durumda tahsilat eğrisi de kayar

### İptal riski
- sipariş iptal, revizyon veya kısmi teslim durumları ayrı statü ile yönetilmelidir

### Talep riski
- ürün geldiğinde beklenen hızda satılmayabilir
- bu risk stok devir süresi ve tahsilat süresi üzerinden modele yansıtılmalıdır

## Çıktılar
- ithalatın toplam maliyeti
- ithalatın zamanlanmış nakit etkisi
- en riskli ödeme tarihi
- tahmini satış başlangıcı
- finansman sonrası net verim
- güvenli / temkinli / ertele kararı
