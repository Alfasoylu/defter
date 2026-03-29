# RECEIVABLES POLICY

## Amaç
Vadeli müşteri alacaklarını gerçek nakitten ayırmak, gecikme riskini erken görünür kılmak ve tahsilat hızını artırmak.

## Temel ilke
Tahsil edilmemiş satış nakit değildir.

Bu yüzden Açık Hesap Müşteriler modülü:
- satış performansı göstergesi değil
- tahsilat riski ve beklenen nakit takvimi modülü olarak ele alınmalıdır

## Veri alanları
- müşteri adı
- belge/sipariş numarası
- kesim tarihi
- vade tarihi
- tutar
- para birimi
- tahsil durumu
- gecikme günü
- risk skoru
- son tahsilat notu

## Tahsilat durumları
- vadesi gelmedi
- bugün tahsil edilmeli
- geciken
- kısmi tahsil edildi
- tahsil edildi
- riskli / ihtilaflı

## Risk değerlendirmesi

### Riski artıran unsurlar
- uzun vade
- geçmişte tekrar eden gecikme
- yüksek tutarlı açık bakiye
- müşteride tahsilat davranışının bozulması
- belirli müşteri veya kanal yoğunlaşması

### Risk skoru mantığı
Risk skoru en az şu bileşenlerle üretilmelidir:
- vade uzunluğu
- gecikme gün sayısı
- tekrar gecikme geçmişi
- bakiye büyüklüğü
- tahsilat güven katsayısı

Skor sınıfları:
- düşük risk
- orta risk
- yüksek risk

## Nakit etkisi kuralları
- Vade tarihi, gerçek tahsilat tarihi değildir.
- Vadesi gelmiş alacak otomatik olarak nakde yazılmaz.
- Tahsil edilene kadar Nakit Akışı gerçek girişine eklenmez.
- Yalnızca ayrı tahsilat görünümünde beklenen/planlı sinyal olarak taşınabilir.

## Tahsilat görünümü
Sistem en az şu listeleri üretmelidir:
- 7 gün içinde beklenen tahsilatlar
- geciken alacaklar
- yüksek riskli müşteriler
- kısmi tahsil edilmiş kayıtlar

## Karar motoru ile ilişki
Aşağıdaki durumlar karar üretimini etkiler:
- geciken alacaklar artıyorsa -> `TAHSILATI HIZLANDIR`
- tahsilat görünürlüğü zayıfsa -> `TEMKINLI ITHALAT`
- müşteri riski yükseliyorsa -> `VADELI SATISI SINIRLA`
- alacak tahsil edilmeden nakit güveni oluşuyorsa -> `BUYUMEYI YAVASLAT`

## Operasyon kuralları
- Tahsil edildi durumu olmadan kayıt kapanmaz.
- Kısmi tahsilat varsa kalan bakiye ayrı izlenir.
- Aynı belge numarası için duplicate kayıt oluşmamalıdır.
- Gecikme günü günlük olarak veya görünüm düzeyinde yeniden hesaplanmalıdır.

## Standart aksiyonlar
- geciken kaydı öne çıkar
- tahsilat takibi başlat
- yüksek riskli müşteriye yeni vade verme
- tahsilat gelmeden büyüme varsayımını düşür

## Amaç
- nakit dönüş hızını artırmak
- tahsilat kör noktasını kapatmak
- alacak kalitesini karar motoruna taşımak
