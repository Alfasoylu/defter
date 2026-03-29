# INVENTORY POLICY

## Amaç
Stokun sadece kar değil, sermaye verimi ve nakit baskısı açısından değerlendirilmesini sağlamak.

## Temel ilke
Marj tek başına yeterli değildir.

Bir ürün veya ürün grubu şu değişkenlerle birlikte değerlendirilmelidir:
- brüt marj
- net marj
- transit süresi
- stok devir süresi
- tahsilat süresi
- finansman maliyeti
- sabit gider baskısı

## Ölçüm alanları
- ürün grubu
- brüt marj yüzdesi
- tahmini net marj yüzdesi
- transit gün sayısı
- stok devir gün sayısı
- tahsil gün sayısı
- finansman sonrası net getiri
- yıllıklandırılmış sermaye verimi
- stok yaşlanma puanı
- sermaye verim puanı

## Hesap mantığı

### Finansman sonrası net getiri
Basit yaklaşım:
- net katkı = net marj - finansman baskısı - bekleme süresi maliyeti

### Toplam sermaye çevrim süresi
- transit süresi
- rafta bekleme / devir süresi
- tahsilat süresi

Bu toplam süre uzadıkça aynı marj daha zayıf hale gelir.

### Yıllıklandırılmış sermaye verimi
Amaç:
- yavaş dönen yüksek marj ile hızlı dönen orta marjı karşılaştırabilmek

Mantık:
- bir çevrimdeki net getiri
- yıl içindeki çevrim sayısı

## Ürün sınıfları

### A sınıfı
- yüksek net getiri
- hızlı veya kabul edilebilir devir
- finansman sonrası güçlü katkı

Karar:
- artır
- önceliklendir

### B sınıfı
- orta getiri
- yönetilebilir devir
- tampon uygunsa korunabilir

Karar:
- izle
- seçici artır

### C sınıfı
- düşük net getiri
- yavaş devir
- finansman baskısı yüksek

Karar:
- alımı azalt
- gerekirse fiyat kırıp erit

## Karar kuralları
- yüksek marj + hızlı devir -> öncelikli ürün
- yüksek marj + yavaş devir -> dikkatli yönet, nakit baskısını ölç
- düşük marj + hızlı devir -> katkı pozitifse seçici artır
- düşük marj + yavaş devir -> sermaye tüketen ürün olarak işaretle

## Karar motoru ile ilişki
Stok politikası şu çıktıları besler:
- `STOK ERIT`
- `ALIMI YAVASLAT`
- `ONCELIKLENDIR`
- `HIZLI DONEN URUNU ARTIR`

Eğer ürün net pozitif görünse bile:
- güvenli nakit tamponunu zorluyorsa
- tahsilat süresi bozuluyorsa
- sabit gider baskısını taşıyamıyorsa

agresif büyüme önerisi verilmemelidir.

## Uyarılar
- yaşlanan stok artıyorsa uyarı
- yavaş dönen ama sermaye bağlayan grup görünür olmalı
- hızlı dönen ancak marjı finansman sonrası eriyen ürünler işaretlenmeli

## Amaç
- sermaye verimini maksimize etmek
- nakde dönüşü hızlandırmak
- yanlış büyümeyi azaltmak
