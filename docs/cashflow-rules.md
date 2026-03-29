# CASHFLOW RULES

## Amaç
Nakit akışının doğru, izlenebilir ve karar üretimine uygun şekilde yönetilmesini sağlamak.

Bu modülün temel görevi:
- bugünkü gerçek nakdi göstermek
- gelecekteki baskıyı tarih bazında görünür kılmak
- güvenli nakit tamponunun kırıldığı noktayı erken tespit etmek

## Ana ilkeler
- Kar ile nakit aynı şey değildir.
- Tahsil edilmemiş satış nakit değildir.
- Tahmini veri, gerçek verinin yerine geçmez.
- Nakit etkisi olan her olay tarih bazında işlenmelidir.
- Kaynak kayıt değiştiğinde nakit görünümü duplicate üretmeden güncellenmelidir.

## Veri sınıfı kuralları

### 1. Gerçek nakit
Gerçekleşmiş giriş/çıkışlardan oluşur.

Örnek:
- kasaya/bankaya giren tahsilat
- ödenen borç taksidi
- kesilmiş kart ekstresi sonrası yapılan ödeme
- ödenmiş ithalat kalemi

### 2. Planlı gerçek yükümlülük
Tarihi ve tutarı belli olan, henüz ödenmemiş ama yüksek güvenilirlik taşıyan çıkışlardır.

Örnek:
- sabit ödemeler
- kredi taksitleri
- kesilmiş kredi kartı ekstresi
- tarihi belirlenmiş gümrük ödemesi

### 3. Tahmini nakit
Model tarafından üretilen, güven katsayısı taşıyan ama henüz gerçekleşmemiş etkidir.

Örnek:
- tahmini satış tahsilatı
- ithalat sonrası beklenen satış dönüşü

## Hesap kuralları

### Günlük bakiye
Her tarih için en az şu alanlar hesaplanmalıdır:
- açılış bakiyesi
- gerçek giriş
- gerçek çıkış
- planlı çıkış
- güven katsayılı tahmini giriş
- kapanış bakiyesi

### Görünüm katmanları
En az üç ayrı görünüm korunmalıdır:
- yalnız gerçek bakiye
- gerçek + planlı yükümlülük
- gerçek + planlı yükümlülük + güven katsayılı tahmin

Bu ayrım yapılmadan tek bakiye göstermek karar kalitesini bozar.

### Güvenli nakit tamponu
- Parametrelerden gelen minimum güvenli seviye kullanılır.
- Bakiye bu seviyenin altına düştüğünde sistem bunu kritik olay olarak işaretler.
- Tampon altı ve negatif bakiye ayrı risk sınıfıdır.

## Gerçek ve tahmini veri etkileşimi

### Ayrım kuralı
- Tahmini kayıtlar `forecast` statüsü taşır.
- Gerçek kayıtlar `actual` statüsü taşır.
- Aynı satır veya aynı hücre içinde görünmez biçimde birleştirilmez.

### Gerçek veri geldiğinde ne olur
- Tahmin fiziksel olarak silinmek zorunda değildir.
- İlgili tahmin `override edildi`, `pasif`, `kapanmış` benzeri bir statü almalıdır.
- Tarihsel iz korunmalı, ancak karar hesaplarında ikinci kez sayılmamalıdır.

### Güven skoru kuralı
- Güven skoru eşik altındaki tahminler Dashboard ana kararlarında kullanılmaz.
- Düşük güvenli tahminler yalnızca yardımcı görünümde gösterilebilir.

## Olay bazlı nakit etkisi

### Sabit ödemeler
- Tek kayıtla tanımlanır
- İlgili dönemlere planlı çıkış olarak yayılır

### Borç ve kredi
- Taksit tarihine göre planlı çıkış oluşur
- Faiz ve anapara ayrıştırılabiliyorsa ayrı izlenir

### Kredi kartları
- Ekstre kesimi bilgi üretir
- Son ödeme tarihi nakit baskısı üretir

### İthalat
- mal bedeli
- navlun
- vergi/gümrük

Bu üç aşama ayrı nakit olayı olarak işlenir.

### Açık hesap alacaklar
- tahsil edilene kadar nakit değildir
- vade tarihi tahmini giriş değil, beklenen tahsilat sinyalidir

## Negatif bakiye ve kritik tarih kuralları

### Negatif bakiye
- Gün sonu bakiyesinin sıfırın altına düşmesidir.
- Her negatif tarih ayrı kaydedilmelidir.

### Tampon kırılımı
- Gün sonu bakiyesinin güvenli nakit alt limitinin altına düşmesidir.
- Negatif olmasa bile risklidir.

### En riskli tarih
- En düşük bakiye görülen tarihtir.
- Karar motoru için öncelikli girdidir.

## Duplicate önleme kuralları
- Nakit akışı bir giriş tablosu değil, yansıtma tablosudur.
- Kaynak kayıt tekrar işlendiğinde yeni satır üretilmez.
- Her nakit satırı `source_module + source_record_id + event_type + flow_date` benzeri bir iş anahtarı ile izlenmelidir.

## Dashboard kullanım kuralları
- Dashboard tek bakiye değil, bağlamlı bakiye göstermelidir.
- 7/30/60/90 gün görünümü ayrı satır veya blokta sunulmalıdır.
- Gerçek ve tahmini katkı görsel olarak ayrılmalıdır.

## Çıktılar
- bugünkü gerçek nakit
- 7/30/60/90 gün görünümü
- güvenli nakit tamponu durumu
- negatif gün sayısı
- en riskli tarih
- kritik ödeme çakışmaları

## Amaç
- nakit çöküşünü önlemek
- kararları doğru tarihte vermek
- sahte iyimserliği engellemek
