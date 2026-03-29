# CREDIT THRESHOLD MODEL

## Amaç
Hangi faiz seviyesine, hangi kredi tutarına ve hangi kullanım amacına kadar kredinin mantıklı olduğunu hesaplamak.

## Temel ilke
Kredi eşiği, tek başına piyasa faizi veya banka limiti değildir.

Kredi eşiği şu soruların ortak cevabıdır:
- kredi sonrası nakit tamponu korunuyor mu
- kredi finanse ettiği işten net pozitif katkı çıkarıyor mu
- borç servis baskısı yönetilebilir kalıyor mu
- kredi sadece sorunu erteliyor mu, yoksa değer mi yaratıyor

## Kullanım alanı
Bu model aşağıdaki kararları besler:
- bu faiz seviyesine kadar kredi kullan
- bu faizle kredi kullanma
- kredi yerine ithalatı küçült
- kredi yerine gider azalt / tahsilatı hızlandır

## Girdiler
- mevcut gerçek nakit
- güvenli nakit alt limiti
- mevcut borç taksitleri
- kredi kartı ödeme baskısı
- planlı sabit ödemeler
- açık hesap tahsilat görünürlüğü
- kredi tutarı
- aylık faiz oranı
- vade
- krediyle finanse edilecek ithalat veya ürün grubu
- ilgili ürün grubunun net verimi
- stok devir süresi
- tahsilat süresi

## Ana hesaplar

### 1. Aylık kredi yükü
- aylık faiz etkisi
- aylık anapara etkisi
- varsa dosya/komisyon etkisi

### 2. Toplam finansman maliyeti
- vade boyunca ödenecek toplam tutar
- toplam faiz yükü

### 3. Kredi sonrası minimum bakiye
- 30 gün
- 60 gün
- 90 gün

### 4. Kredi sonrası DSCR etkisi
Mantık:
- faaliyet kaynaklı nakit yaratımı / borç servis yükü

### 5. Finansman sonrası net katkı
Mantık:
- krediyle finanse edilen işin net getirisi
- eksi toplam finansman maliyeti

## Eşik katmanları

### Güvenli faiz eşiği
Bu eşik altında:
- finansman sonrası net katkı pozitiftir
- 30 gün tamponu korunur
- 60 gün görünüm bozulmaz

### Temkinli faiz eşiği
Bu aralıkta:
- net katkı zayıflar
- tampon daralır
- yalnız kısa vadeli veya düşük tutarlı kullanım mantıklı olabilir

### Uygun olmayan faiz eşiği
Bu eşikten sonra:
- net katkı kaybolur
- tampon kırılır veya negatif gün artar
- kredi büyüme yerine yük üretir

## Karar mantığı

### Kredi mantıklı
- kredi sonrası minimum bakiye negatif değil
- güvenli tampon mümkünse korunuyor
- finanse edilen ithalat veya ürün net pozitif katkı bırakıyor
- faiz, ilgili ürün/iş verimini aşmıyor

### Kredi sınırlı mantıklı
- kredi sonrası yapı ayakta kalıyor
- ancak tampon zayıflıyor
- daha küçük tutar veya daha kısa vade gerekli

### Kredi mantıksız
- kredi sonrası 30 gün görünümü negatif kalıyor
- faiz, net verimi aşıyor
- kredi yalnızca eski açığı döndürüyor
- DSCR kabul edilemez seviyeye düşüyor

## Uygulama yaklaşımı
Model tek rakam yerine senaryo tablosu üretmelidir:
- X tutar / Y faiz / Z vade
- minimum bakiye etkisi
- net katkı
- karar

## Çıktılar
- maksimum mantıklı kredi tutarı
- maksimum mantıklı aylık faiz oranı
- önerilen vade bandı
- kredi kullan / sınırlı kullan / kullanma kararı
- darboğaz nedeni

## Darboğaz örnekleri
- mevcut borç servis yükü yüksek
- tahsilat döngüsü yavaş
- stok devri yetersiz
- sabit gider baskısı fazla
- ithalat getirisi finansman maliyetini taşımıyor

## Kabul kriterleri
- Kredi eşiği yalnızca faiz oranısına bakarak üretilmemeli.
- 30/60/90 gün etkisi mutlaka hesapta olmalı.
- Kredi sonrası net katkı negatifse öneri üretilmemeli.
- Sonuç, karar motoruna açıklanabilir dayanakla gitmeli.
