# CREDIT CARD POLICY

## Amaç
Kredi kartı ekstre kesim ve son ödeme tarihlerini kontrol altına almak, gecikme faizi riskini ortadan kaldırmak ve kart borç baskısını nakit akışı ile karar motoruna doğru taşımak.

## Temel ilke
Kredi kartı borcu, ödenmediği sürece artan maliyetli kısa vadeli finansman kaynağıdır.

Bu yüzden:
- ekstre kesimi yapıldığında borç tutarı kesinleşir
- son ödeme tarihine kadar faiz işlemez (tam ödeme tercihi varsa)
- son ödeme tarihi geçtiğinde maliyet hızla yükselir
- asgari ödeme, borcun ertelenmesidir; çözülmesi değildir

## Veri alanları

### Zorunlu alanlar
- `card_id`
- `card_name`
- `bank_name`
- `credit_limit`
- `statement_cut_day`
- `due_day`
- `current_balance`
- `minimum_payment`
- `currency`
- `payment_preference`
- `status`

### Yardımcı alanlar
- `last_statement_amount`
- `last_payment_date`
- `last_payment_amount`
- `notes`

## Durum alanları
- aktif
- donduruldu
- iptal

## Ödeme tercihi alanları
- tam ödeme
- asgari ödeme

## Ekstre ve ödeme döngüsü

### Ekstre kesim günü
- Her ay belirlenen günde o döneme ait harcamalar kesinleşir.
- Kesinleşen tutar `last_statement_amount` olarak kaydedilir.
- Ekstre kesim tarihi Nakit Akışı'nda bilgi niteliğinde işaretlenebilir.

### Son ödeme günü
- Ekstre kesiminden sonra belirlenen takvimde ödeme beklenir.
- Bu tarih, nakit çıkışı baskısı üreten kritik tarihtir.
- Yaklaşan Ödemeler görünümünde gösterilmelidir.

### Ödeme sonrası
- Tam ödeme yapıldıysa dönem kapanır.
- Asgari ödeme yapıldıysa kalan bakiye faizle birlikte devam eder.
- Ödeme yapılmadıysa gecikme faizi ve ceza riski oluşur.

## Nakit akışı etkisi

### Planlı çıkış kuralı
- Son ödeme tarihinde beklenen tutar planlı yükümlülük olarak Nakit Akışı'na yansítılır.
- Ödeme tercihi `tam` ise ekstre tutarı; `asgari` ise asgari tutar baz alınır.
- Ödeme gerçekleştiğinde planlı çıkış gerçek çıkışa dönüşür.

### Kart borcu gerçek nakit değildir
- Harcama yapılmış olsa bile henüz ödenmemiş kart borcu nakit çıkışı olarak değil, beklenen yükümlülük olarak izlenir.
- Ekstre kesilmeden önceki harcamalar tahmini baskı olarak gösterilebilir.

## Limit baskısı

### Hesap mantığı
- `limit_usage_pct = current_balance / credit_limit`

### Eşikler
- %80 üstü: uyarı
- %90 üstü: yüksek risk
- %100: limit aşımı / bloke riski

### Karar etkisi
- Limit baskısı yüksekse yeni harcama kapasitesi sınırlıdır.
- Bu bilgi finansman baskısı hesabına dahil edilmelidir.

## Uyarı koşulları
- Son ödeme tarihine 7 gün kala: ödeme hatırlatma
- Son ödeme tarihine 3 gün kala ve ödeme yapılmamışsa: kritik uyarı
- Limit kullanım oranı %80 üstü: kapasite uyarısı
- Asgari ödeme tercihi ardışık 2+ ay devam ediyorsa: borç büyüme riski

## Karar motoru ilişkisi
Kredi kartı verileri şu karar çıktılarını etkiler:
- kısa vadeli nakit baskısı yüksekse → `TEMKINLI MOD`
- kart borcu büyürken yeni ithalat isteniyorsa → `ITHALATI ERTELE` veya `KART BORCUNU KAPAT`
- toplam finansman baskısında kart payı yüksekse → Dashboard'da belirtilmeli

## Dashboard ilişkisi
Dashboard'da kredi kartı bloğu en az şunları göstermelidir:
- toplam kart borcu
- en yakın son ödeme tarihi
- limit kullanım oranı
- ödeme baskısı durumu (güvenli / dikkat / kritik)

## Veri akışı
1. Kullanıcı kart bilgilerini ve ekstre verilerini girer.
2. Son ödeme tarihi Yaklaşan Ödemeler'e düşer.
3. Nakit Akışı planlı çıkış olarak yansıtır.
4. Dashboard ve Karar Motoru baskı seviyesini değerlendirir.

## Diğer modüllerle ilişki
- Nakit Akışı: planlı çıkış kaynağı
- Yaklaşan Ödemeler: son ödeme tarihi
- Dashboard: finansman baskısı bloğu
- Karar Motoru: kısa vadeli risk girdisi
- Parametreler: uyarı eşikleri

## Kabul kriterleri
- Ekstre kesim ve son ödeme takvimi doğru çalışmalı.
- Limit baskısı uyarısı doğru eşikte üretilmeli.
- Kart borcu gerçek nakit çıkışı ile karıştırılmamalı.
- Asgari ödeme tercihi borç büyüme riski olarak izlenebilmeli.
- Dashboard'da kart baskısı görünür olmalı.
