# DECISION ENGINE

## Amaç
Karar motorunun amacı, veriyi sadece göstermek değil, yönetim aksiyonuna çevirmektir.

Bu motor aşağıdaki sorulara cevap üretmelidir:
- bugün ne yapmalıyım
- güvenli şekilde ithalat yapmalı mıyım
- kredi kullanmalı mıyım
- tahsilat baskısı mı, stok baskısı mı daha kritik
- büyüme mi, temkin mi, küçülme mi daha doğru

## Girdiler
- Nakit Akışı
- Yaklaşan Ödemeler
- Yaklaşan Tahsilatlar
- Borç Takibi
- Sabit Ödemeler
- İthalat Siparişleri
- Ürün / Stok Karlılık
- Tahmini Satışlar
- Parametreler

## Karar üretim ilkeleri
- Tek metrikle karar verilmez.
- Nakit riski, büyüme fırsatından daha yüksek önceliğe sahiptir.
- Tahsil edilmemiş alacak nakit sayılmaz.
- Tahmini veri yalnızca güven katsayısı eşiğini geçerse karar destek unsuru olabilir.
- Karar çıktısı mutlaka veri dayanağı ile birlikte gösterilmelidir.

## Değerlendirme ufukları
- 7 gün: operasyonel risk
- 30 gün: kısa vadeli nakit riski
- 60 gün: ithalat ve tahsilat uyumsuzluğu
- 90 gün: büyüme / küçülme yönü

## Öncelik sırası
Kararlar çelişirse şu öncelik uygulanır:
1. Nakit çöküşünü engelle
2. Güvenli tamponu koru
3. Borç servis aksamasını önle
4. Pozitif net getirili ithalatı seç
5. Sermaye verimi düşük stoğu azalt
6. Büyüme fırsatını değerlendir

## Ana skorlar

### 1. Nakit risk skoru
Girdi bileşenleri:
- 7/30/60/90 gün içindeki minimum bakiye
- güvenli nakit alt limiti
- yaklaşan sabit ödemeler
- borç servis yükü
- kart ödeme baskısı

Yorum:
- güvenli alt limit altına düşüş yoksa düşük risk
- 30 gün içinde altına düşüş varsa yüksek risk
- 7 gün içinde negatif bakiye varsa kritik risk

### 2. İthalat uygunluk skoru
Girdi bileşenleri:
- ithalatın parçalı ödeme tarihleri
- tahmini varış tarihi
- satış başlangıç tarihi
- ürün grubu bazlı marj
- devir süresi
- finansman maliyeti
- güvenli nakit tamponu etkisi

Yorum:
- net getiri pozitif olsa bile güvenli tamponu deliyorsa uygun değildir
- tampon korunuyor ve sermaye verimi yeterliyse uygundur

### 3. Kredi uygunluk skoru
Girdi bileşenleri:
- kredi faizi
- kredi tutarı
- vade
- krediyle finanse edilecek ithalat veya açık
- kredi sonrası DSCR etkisi
- kredi sonrası 30/60 gün minimum bakiye

Yorum:
- yalnızca açığı erteleyen kredi düşük puan alır
- net pozitif getiri üreten ve tamponu koruyan kredi yüksek puan alır

### 4. Stok kalite skoru
Girdi bileşenleri:
- brüt marj
- net marj
- transit süresi
- stok devir süresi
- tahsil süresi
- finansman sonrası yıllıklandırılmış getiri

Yorum:
- yavaş dönen düşük verimli ürünler azaltılır
- hızlı dönen ve finansman sonrası pozitif ürünler artırılır

## Karar kuralları

### 1. Nakit koruma kuralları
- Eğer 7 gün içinde negatif bakiye varsa -> `KRITIK: ALIM DURDUR`
- Eğer 30 gün içinde güvenli nakit alt limiti kırılıyorsa -> `TEMKINLI MOD`
- Eğer 60 gün içinde tampon kırılıyorsa ama 30 gün güvenliyse -> `SINIRLI ALIM / YAKIN IZLEME`
- Eğer 90 gün görünümü de pozitifse -> diğer kurallara geç

### 2. İthalat kuralları
İthalat için aşağıdaki şartların birlikte sağlanması beklenir:
- 30 gün minimum bakiye güvenli tamponun üstünde kalmalı
- 60 gün görünümünde ithalatın parçalı ödemeleri finanse edilebilmeli
- ürün grubu finansman sonrası net verimi pozitif olmalı
- tahmini satış katkısı güven skoru eşiğini geçmeli

Karar:
- Tümü sağlanıyorsa -> `GUVENLI ITHALAT YAP`
- Marj iyi ama tampon sınırdaysa -> `TEMKINLI ITHALAT YAP`
- Nakit baskısı yüksekse -> `ITHALATI ERTELE`
- Hava kargo toplam verimi denizden yüksekse -> `DENIZ YERINE HAVA DEGERLENDIR`

### 3. Kredi kuralları
- Kredi sonrası 30 gün minimum bakiye hâlâ negatifse -> `KREDI KULLANMA`
- Kredi sadece mevcut açığı kapatıp pozitif üretim sağlamıyorsa -> `KREDIYI REDDET`
- Kredi faizi, ürün grubu finansman sonrası net getirinin altında kalıyorsa ve tampon korunuyorsa -> `KREDI KULLAN`
- Kredi faizi eşik seviyeye çok yakınsa -> `SINIRLI / KISA VADELI KULLAN`

### 4. Stok kuralları
- düşük marj + yavaş devir + yüksek finansman baskısı -> `FIYAT KIR / STOK ERIT`
- yüksek marj + yavaş devir + tampon baskısı -> `ALIMI YAVASLAT`
- düşük marj + hızlı devir + pozitif net katkı -> `ARTTIR`
- yüksek marj + hızlı devir + güvenli nakit -> `ONCELIKLENDIR`

### 5. Gider kuralları
- sabit gider karşılama oranı eşik altındaysa -> `GIDER AZALT`
- peş peşe birden fazla dönemde negatif gün üretiliyorsa -> `KUCULME SENARYOSU DEGERLENDIR`
- ithalat ve kredi olmadan yapı yaşamıyorsa -> `OPERASYON BOYUTUNU GOZDEN GECIR`

## Çakışma çözüm kuralları
- `ALIM DURDUR` kararı varken aynı anda `BUYU` önerisi verilemez.
- `KREDI KULLAN` çıktısı ancak kredi sonrası tampon korunuyorsa gösterilir.
- `STOK ARTTIR` ile `GIDER AZALT` aynı anda verilebilir; bunlar çelişmez.
- Kritik nakit riski varken ürün bazlı fırsat kararları ikincil seviyeye düşer.

## Çıktı formatı
Her karar şu yapıda üretilmelidir:
- karar başlığı
- öncelik seviyesi
- veri dayanağı
- zaman ufku
- önerilen aksiyon

Örnek:
- `ITHALATI ERTELE`
- öncelik: yüksek
- dayanak: 30 gün içinde güvenli nakit alt limiti kırılıyor, navlun ve gümrük tarihi üst üste geliyor
- aksiyon: siparişi 14 gün ertele veya tutarı azalt

## Standart çıktı seti
- Güvenli şekilde ithalat yap
- Temkinli ithalat yap
- İthalatı ertele
- Bu faiz seviyesine kadar kredi kullan
- Bu faizle kredi kullanma
- Tahsilatı hızlandır
- Fiyat kırıp stok erit
- Giderleri azalt
- Temkinli büyü
- Operasyonu koru
- Küçülme moduna geç
