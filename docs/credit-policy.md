# CREDIT POLICY

## Amaç
Kredi kullanımını rastgele değil, nakit tamponu, finansman maliyeti ve net değer üretimi üzerinden yönetmek.

Bu politikanın amacı:
- hangi koşulda kredi kullanılabileceğini tanımlamak
- hangi koşulda kredinin sadece sorunu ertelediğini ayırt etmek
- kredi kararını ithalat, stok devri ve tahsilat yapısı ile birlikte değerlendirmek

## Temel ilke
Kredi, yalnızca açığı geçici olarak kapatıyorsa güçlü karar değildir.

Kredi ancak şu durumda olumlu kabul edilir:
- güvenli nakit tamponunu koruyorsa
- finansman sonrası net katkı bırakıyorsa
- borç servis baskısı işletmeyi yeni bir kırılganlığa itmiyorsa

## Girdiler
- kredi tutarı
- aylık faiz oranı
- vade
- aylık ödeme yapısı
- krediyle finanse edilecek kullanım alanı
- ilgili ithalat veya ürün grubunun beklenen net verimi
- stok devir süresi
- tahsilat süresi
- mevcut borç servis yükü
- güvenli nakit alt limiti

## Hesap alanları

### Aylık finansman maliyeti
- kredi tutarı
- aylık faiz oranı
- varsa dosya/komisyon etkisi

### Toplam finansman maliyeti
- vade boyunca ödenecek toplam tutar
- anapara ve faiz ayrımı mümkünse ayrı izlenmeli

### Kredi sonrası minimum bakiye
- 30 gün görünümü
- 60 gün görünümü
- 90 gün görünümü

### Kredi sonrası borç servis karşılama oranı
- faaliyet kaynaklı nakit yaratımı / borç servis yükü

## Kredi kullanım amaçları

### 1. Değer yaratan kredi
Örnek:
- net pozitif ithalat fırsatı
- hızlı dönen ve finansman sonrası verimi pozitif ürün
- kısa süreli ama net getirili büyüme fırsatı

### 2. Koruyucu kredi
Örnek:
- kısa vadeli ödeme çakışmasını yönetmek
- geçici tahsilat kaymasını karşılamak

Not:
- Koruyucu kredi, pozitif büyüme kredisi kadar güçlü değildir.
- Ancak sistem çöküşünü önlüyorsa sınırlı ve kontrollü kullanılabilir.

### 3. Değer üretmeyen kredi
Örnek:
- sadece eski açığı çevirmek
- zarar eden yapıyı uzatmak
- sabit gider baskısını gizlemek

Bu tip kredi varsayılan olarak olumsuz değerlendirilir.

## Karar kuralları

### Kredi kullan
Aşağıdaki şartların çoğu birlikte sağlanmalıdır:
- kredi sonrası 30 günlük minimum bakiye negatif olmamalı
- güvenli nakit tamponu mümkünse korunmalı
- finanse edilen iş kalemi finansman sonrası net pozitif katkı vermeli
- borç servis baskısı kabul edilebilir seviyede kalmalı
- kredi yalnızca açığı ertelememeli, operasyonel veya ticari değer üretmeli

### Sınırlı kullan
- kredi sonrası yapı ayakta kalıyor
- ancak tampon daralıyor
- net katkı var ama güçlü değil
- daha kısa vade veya daha düşük tutar tercih edilmeli

### Kredi kullanma
- kredi sonrası 30 günlük görünüm hâlâ negatifse
- kredi yalnızca açık kapatıyorsa
- faiz, finanse edilen işin net getirisini yutuyorsa
- borç servis baskısı sistemi daha kırılgan hale getiriyorsa

## Uyarı koşulları
- kredi sonrası minimum bakiye güvenli eşik altına düşüyorsa uyarı
- kredi faizi, ilgili ürün/ithalat net verimine çok yaklaşıyorsa uyarı
- mevcut borcun üstüne yeni kredi eklendiğinde negatif gün sayısı artıyorsa uyarı

## Veri dayanakları
Bu belge aşağıdaki modüllerle birlikte çalışır:
- Nakit Akışı
- Borç Takibi
- İthalat Siparişleri
- Ürün / Stok Karlılık
- Parametreler
- Karar Motoru

## Standart çıktılar
- Bu faiz seviyesine kadar kredi kullan
- Bu tutarda sınırlı kredi kullan
- Bu faizle kredi kullanma
- Kredi yerine ithalatı ertele
- Kredi yerine gider azalt / tahsilatı hızlandır

## Riskler
- faiz yükünün görünenden hızlı büyümesi
- kredinin işletme sorununu gizlemesi
- borç servis baskısının nakit görünümünü bozması
- kısa vadeli rahatlığın uzun vadeli sermaye erimesine dönüşmesi
