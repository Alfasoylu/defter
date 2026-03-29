# BORC MODELI

## Amaç
Borç yükünü kayıt seviyesinden karar seviyesine taşımak ve finansman baskısını ölçülebilir hale getirmek.

## Temel ilke
Borç yalnızca kalan anapara değildir.

Borç modeli şu bileşenleri birlikte izlemelidir:
- anapara
- faiz
- taksit tarihi
- aylık ödeme baskısı
- kalan borç
- finanse edilen işin niteliği

## Borç türleri
- banka kredisi
- ticari borç
- tedarikçi borcu
- kısa vadeli işletme kredisi
- taksitli yükümlülük

## Zorunlu alanlar
- `debt_id`
- `debt_type`
- `lender`
- `principal_amount`
- `currency`
- `start_date`
- `maturity_date`
- `installment_amount`
- `interest_rate_monthly`
- `remaining_principal`
- `payment_day`
- `purpose`
- `status`

## Hesap alanları
- aylık borç servisi
- toplam finansman maliyeti
- kalan anapara
- kalan vade
- gecikmiş ödeme var/yok
- borç servis karşılama oranı

## Karar açısından önemli ayrım

### Değer yaratan borç
- pozitif net verimli ithalatı veya hızlı dönen ürünü finanse eder

### Koruyucu borç
- kısa vadeli çakışmayı yönetir

### Yapısal zayıflık borcu
- sürekli açık kapatır
- sabit gider veya zarar baskısını gizler

## Nakit etkisi
- Her borç kaydı ödeme tarihine göre planlı çıkış üretir.
- Faiz ve anapara mümkünse ayrı izlenir.
- Geciken borç yükümlülükleri kritik risk olarak işaretlenir.

## Karar motoru ilişkisi
- borç servis baskısı yüksekse temkinli mod
- yeni kredi eşiği hesaplarında mevcut borç ana girdi
- borç büyürken sermaye eriyorsa küçülme sinyali güçlenir

## Uyarılar
- artan borç servis oranı
- vadesi yaklaşan yüksek tutarlı ödeme
- kalan anapara düşmeden toplam yükün büyümesi
- yeni kredi için taşıma kapasitesinin zayıflaması

## Kabul kriterleri
- Borç takvimi Nakit Akışı’na doğru yansımış olmalı.
- Kalan anapara ve aylık baskı izlenebilir olmalı.
- Borç, tek toplam sayı olarak değil zamanlanmış yükümlülük olarak görünmeli.
