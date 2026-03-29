# TEST SCENARIOS

## Amaç
Bu belge, sistemin en kritik finansal ve teknik risklerine karşı uygulanacak test senaryolarını tanımlar.

## Senaryo 1. Duplicate engelleme
Ön koşul:
- Hızlı Veri Girişi'nde tek bir kayıt oluşturulmuş olsun.

Aksiyon:
- Aynı kayıt tekrar işlenir veya aynı satır güncellenir.

Beklenen sonuç:
- Nakit Akışı'nda ikinci bir satır oluşmaz.
- Mevcut satır güncellenir.
- İş anahtarı aynı kalır.

Hata etkisi:
- Bakiye sahte biçimde bozulur.

## Senaryo 2. Yanlış kaynak sayfaya yazma
Ön koşul:
- Sistem kaynak tablo ve görünüm tablo ayrımıyla kurulu olsun.

Aksiyon:
- Manuel giriş sonrası script yansıtması çalıştırılır.

Beklenen sonuç:
- Veri yalnızca tanımlı hedef görünüm/satırlara yazılır.
- Dashboard kaynak dışı bir sayfadan veri okumaz.

Hata etkisi:
- Karar motoru yanlış veriyle çalışır.

## Senaryo 3. Tarih formatı kayması
Ön koşul:
- Birden fazla tarih alanı içeren kayıt hazır olsun.

Aksiyon:
- Tarihler farklı formatlarda girilir.

Beklenen sonuç:
- Sistem tek tarih standardına normalize eder veya hatayı açıkça işaretler.
- Gün/ay kayması oluşmaz.

Hata etkisi:
- Ödemeler ve tahsilatlar yanlış tarihe kayar.

## Senaryo 4. Gerçek ve tahmini verinin ayrılması
Ön koşul:
- Aynı dönem için hem gerçek tahsilat hem tahmini satış katkısı bulunsun.

Aksiyon:
- Dashboard ve Nakit Akışı görünümü kontrol edilir.

Beklenen sonuç:
- Gerçek ve tahmini etkiler ayrı statü veya blokta görünür.
- Tek bakiye altında izsiz biçimde birleşmez.

Hata etkisi:
- Kullanıcı sahte nakit güveni kazanır.

## Senaryo 5. Tahmin override davranışı
Ön koşul:
- İleri tarihli tahmini satış kaydı mevcut olsun.

Aksiyon:
- Aynı döneme ait gerçek tahsilat sisteme girilir.

Beklenen sonuç:
- Tahmin pasiflenir veya override edildi statüsüne geçer.
- Karar hesaplarında ikinci kez sayılmaz.

Hata etkisi:
- Çifte gelir etkisi oluşur.

## Senaryo 6. Sabit ödeme yayılımı
Ön koşul:
- Aylık tekrarlı bir sabit ödeme tanımlanmış olsun.

Aksiyon:
- İleri 3 dönemin görünümü kontrol edilir.

Beklenen sonuç:
- Ödeme her döneme doğru tarih ve tutarla yansır.
- Nakit Akışı ve Yaklaşan Ödemeler aynı mantığı görür.

Hata etkisi:
- Gelecek nakit baskısı eksik görünür.

## Senaryo 7. Sabit ödeme artış tarihi
Ön koşul:
- Artış tarihi ve revize tutarı tanımlı sabit ödeme bulunsun.

Aksiyon:
- Artış öncesi ve sonrası dönemler karşılaştırılır.

Beklenen sonuç:
- Eski dönemler eski tutarı korur.
- Yeni dönemler revize tutarı kullanır.

Hata etkisi:
- Geçmiş ve gelecek giderler karışır.

## Senaryo 8. Borç servisi baskısı
Ön koşul:
- Taksitli kredi kaydı oluşturulmuş olsun.

Aksiyon:
- Aylık ödeme takvimi ve Nakit Akışı görünümü kontrol edilir.

Beklenen sonuç:
- Taksit tarihleri doğru yansır.
- Borç servisi baskısı Dashboard'a taşınır.

Hata etkisi:
- Finansman yükü olduğundan düşük görünür.

## Senaryo 9. Kredi kartı son ödeme uyarısı
Ön koşul:
- Kart ekstre günü, son ödeme günü ve güncel borç tanımlı olsun.

Aksiyon:
- Son ödeme tarihine 7 gün kala görünüm kontrol edilir.

Beklenen sonuç:
- Uyarı tetiklenir.
- Limit baskısı varsa ayrıca işaretlenir.

Hata etkisi:
- Faiz ve gecikme cezası riski büyür.

## Senaryo 10. Açık hesap alacağın nakit sayılmaması
Ön koşul:
- Vadeli müşteri alacağı girilmiş, tahsil edilmemiş olsun.

Aksiyon:
- Dashboard ve Nakit Akışı kontrol edilir.

Beklenen sonuç:
- Alacak tahsilat görünümünde görünür.
- Gerçek nakit bakiyesine eklenmez.

Hata etkisi:
- Sistem olduğundan daha sağlıklı görünür.

## Senaryo 11. İthalatın çok aşamalı yansıması
Ön koşul:
- Mal bedeli, navlun ve gümrük tarihleri ayrı tanımlı ithalat siparişi bulunsun.

Aksiyon:
- İthalatın 60 günlük nakit görünümüne etkisi incelenir.

Beklenen sonuç:
- Üç farklı nakit olayı doğru tarihlerde görünür.
- Tek satırlı toplam çıkış gibi davranmaz.

Hata etkisi:
- En riskli tarih yanlış hesaplanır.

## Senaryo 12. İthalat gecikme senaryosu
Ön koşul:
- Tahmini varış ve satış başlangıç tarihi tanımlı ithalat kaydı bulunsun.

Aksiyon:
- Varış tarihi geciktirilir.

Beklenen sonuç:
- Satış başlangıcı ve tahsilat görünümü ötelenir.
- Karar motoru daha temkinli sonuç üretir.

Hata etkisi:
- Sistem gereğinden iyimser kalır.

## Senaryo 13. Karar motoru kritik nakit riski
Ön koşul:
- 7 gün içinde negatif bakiye yaratacak veri seti hazırlanmış olsun.

Aksiyon:
- Karar motoru çıktısı çalıştırılır.

Beklenen sonuç:
- `KRITIK: ALIM DURDUR` veya eşdeğer yüksek öncelikli çıktı oluşur.
- Aynı anda agresif büyüme önerisi verilmez.

Hata etkisi:
- Finansal olarak tehlikeli karar üretilir.

## Senaryo 14. ROI pozitif ama tampon kırılıyor
Ön koşul:
- Karlı görünen fakat 30 günlük güvenli tamponu delerek çalışan ithalat senaryosu hazır olsun.

Aksiyon:
- İthalat kararı üretilir.

Beklenen sonuç:
- Sonuç `güvenli ithalat yap` olmaz.
- En az `temkinli` veya `ertele` kararı çıkar.

Hata etkisi:
- Sistem sadece kara bakarak yanlış yönlendirir.

## Senaryo 15. Kredi açığı erteliyor ama değer üretmiyor
Ön koşul:
- Kredi sonrası nakit kısa süreli rahatlıyor ama net getiri oluşmuyor olsun.

Aksiyon:
- Kredi kararı hesaplanır.

Beklenen sonuç:
- `kredi kullan` kararı çıkmaz.

Hata etkisi:
- Borç yükü büyür, sorun ötelenir.

## Senaryo 16. Dashboard kaynak doğruluğu
Ön koşul:
- Kaynak tablolarda kontrollü test verisi bulunsun.

Aksiyon:
- Dashboard KPI ve blokları kontrol edilir.

Beklenen sonuç:
- 7/30/60/90 gün görünümü tanımlı kaynaklardan beslenir.
- Gerçek ve tahmini veriler ayrı görünür.

Hata etkisi:
- Yönetim yanlış bilgiye bakar.

## Minimum canlı öncesi kapsam
Canlı öncesi en az şu senaryolar geçmelidir:
- Senaryo 1
- Senaryo 4
- Senaryo 5
- Senaryo 6
- Senaryo 8
- Senaryo 10
- Senaryo 11
- Senaryo 13
- Senaryo 14
- Senaryo 16
