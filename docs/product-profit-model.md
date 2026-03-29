# PRODUCT PROFIT MODEL

## Amaç
Ürün veya ürün grubu bazında gerçek değer üretimini ölçmek ve karar motoruna kaliteli veri sağlamak.

## Temel ilke
Brüt marj tek başına ürün kalitesini göstermez.

Bir ürün şu bileşenlerle değerlendirilmelidir:
- brüt marj
- net marj
- transit süresi
- stok devir süresi
- tahsilat süresi
- finansman maliyeti

## Zorunlu alanlar
- `product_id`
- `product_group`
- `gross_margin_pct`
- `estimated_net_margin_pct`
- `transit_days`
- `inventory_turn_days`
- `collection_days`
- `financing_cost_pct`
- `annualized_return_pct`
- `capital_efficiency_score`

## Hesap yaklaşımı

### Brüt karlılık
- satış fiyatı ile temel maliyet farkı

### Net karlılık
- brüt katkı
- eksi finansman etkisi
- eksi bekleme ve tahsil gecikmesi etkisi

### Sermaye verimi
- bir çevrimdeki net katkı
- çevrim süresi
- yıl içi tekrar sayısı

## Ürün kalite sınıfları

### Güçlü ürün
- pozitif net katkı
- hızlı veya dengeli devir
- finansman sonrası hâlâ anlamlı getiri

### Nötr ürün
- katkı var ama sınırlı
- sıkı takip gerektirir

### Zayıf ürün
- düşük net katkı
- yavaş devir
- sermaye bağlama etkisi yüksek

## Karar motoru çıktılarıyla ilişki
- güçlü ürün -> önceliklendir / artır
- nötr ürün -> izle / seçici artır
- zayıf ürün -> azalt / fiyat kır / stok erit

## Uyarılar
- yüksek marj ama çok yavaş devir
- düşük marj ama finansman sonrası negatife düşen hızlı ürün
- uzun transit yüzünden sermaye bağlayan grup

## Kabul kriterleri
- Model ürün kararını yalnız marja göre vermemeli.
- Finansman ve tahsilat etkisi dikkate alınmalı.
- Karar Motoru’na ürün kalite sinyali üretebilmeli.
