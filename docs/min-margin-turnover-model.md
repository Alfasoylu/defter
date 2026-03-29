# MIN MARGIN TURNOVER MODEL

## Amaç
Firmanın sabit giderlerini ve finansman baskısını taşıyabilmesi için gerekli minimum marjı ve kabul edilebilir maksimum devir süresini tanımlamak.

## Temel ilke
Yalnız yüksek ciro yeterli değildir.

Eğer:
- marj düşükse
- devir yavaşsa
- tahsilat uzunsa

işletme büyür gibi görünürken sermaye eritebilir.

## Girdiler
- aylık sabit gider toplamı
- ortalama stok devir süresi
- ortalama tahsil süresi
- ortalama finansman maliyeti
- ürün grubu bazlı marj
- güvenli nakit alt limiti

## Temel sorular
- Bu yapı sabit giderleri taşır mı
- Ortalama marj ne kadar olmalı
- Devir süresi ne kadar uzarsa yapı bozulur

## Model mantığı

### Minimum gerekli marj
Amaç:
- sabit gider + finansman baskısı + operasyonel risk karşılandıktan sonra yapının pozitifte kalması

### Maksimum kabul edilebilir devir
Amaç:
- ürün rafta ve tahsilatta çok uzun süre kalmadan nakde dönmeli

### Etki bileşenleri
- sabit gider yüksekse gerekli marj yükselir
- tahsil süresi uzarsa kabul edilebilir devir süresi kısalır
- finansman maliyeti yükselirse eşikler sertleşir

## Karar kullanımı
- marj eşik altıysa -> fiyatlama veya ürün karması gözden geçir
- devir eşik üstündeyse -> alımı azalt / stok erit
- hem marj hem devir zayıfsa -> küçülme veya gider azaltma sinyali

## Çıktılar
- minimum gerekli brüt marj
- minimum gerekli net marj
- maksimum kabul edilebilir stok devir süresi
- ürün grubu bazlı uyarı

## Kabul kriterleri
- Model sabit gider baskısını hesaba katmalı.
- Devir süresi tek başına değil tahsilat ve finansmanla birlikte değerlendirilmeli.
- Dashboard’da eşik altına düşme uyarısı üretilebilmeli.
