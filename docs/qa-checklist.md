# QA CHECKLIST

## Amaç

Sistemin yanlış veri akışı, duplicate üretimi veya hatalı finansal karar üretmesi riskini canlıya çıkmadan önce kontrol etmek.

## Kullanım şekli

Her test şu dört başlıkla doğrulanmalıdır:

- ön koşul
- aksiyon
- beklenen sonuç
- test sonucu

Bu checklist, hızlı gözden geçirme içindir. Detaylı senaryolar [test-scenarios.md](C:/muhasebe-live/docs/test-scenarios.md) içinde tutulur.

## Kritik geçiş kriterleri

- Gerçek ve tahmini veri karışmıyor olmalı.
- Aynı kaynak kayıt ikinci kez işlendiğinde duplicate oluşmamalı.
- Nakit akışı doğru tarihe doğru etkiyi yazmalı.
- Dashboard ve Karar Motoru yalnızca tanımlı kaynaklardan veri okumalı.
- Kritik kararlar veri dayanağı ile izah edilebilir olmalı.

## Test checklisti

### 1. Veri akışı güvenliği

- Aynı manuel kayıt tekrar işlendiğinde duplicate oluşmuyor mu?
- Kayıt güncellendiğinde eski yansıma yerine doğru satır güncelleniyor mu?
- Kayıt silinirse veya iptal olursa bağlı görünüm düzeliyor mu?
- Yanlış sayfaya yazım veya yanlış kaynak okuma riski var mı?

### 2. Tarih ve format güvenliği

- Tüm kritik tarih alanları tek formatta mı?
- Gün/ay kayması nedeniyle yanlış tarihe yazım oluşuyor mu?
- Para birimi ve kur dönüşümü tutarlı mı?

### 3. Nakit akışı doğruluğu

- Gerçek bakiye doğru hesaplanıyor mu?
- Planlı yükümlülükler ayrı izleniyor mu?
- Tahmini nakit katkısı ayrı statü ile gösteriliyor mu?
- En riskli tarih doğru bulunuyor mu?
- Güvenli nakit alt limiti kırıldığında alarm çıkıyor mu?

### 4. Sabit ödemeler

- Tek kayıt gelecekteki dönemlere doğru yayılıyor mu?
- Artış tarihi sonrası yeni tutar ileri dönemlerde doğru uygulanıyor mu?
- Dondurma veya iptal sonrası gelecekteki satırlar duruyor mu?

### 5. Borç ve kredi

- Taksit planı doğru tarihlere yayılıyor mu?
- Faiz ve ödeme baskısı nakit akışına doğru yansıyor mu?
- Kredi sonrası nakit görünümü ve karar çıktısı tutarlı mı?

### 6. Kredi kartları

- Ekstre ve son ödeme tarihi mantığı doğru çalışıyor mu?
- Limit baskısı uyarısı doğru eşikte üretiliyor mu?
- Kart borcu, gerçek nakit çıkışı ile karıştırılmıyor mu?

### 7. Açık hesap ve tahsilat

- Tahsil edilmemiş alacak nakit gibi sayılmıyor mu?
- Geciken alacak gün sayısı doğru hesaplanıyor mu?
- Tahsilat riski Dashboard'a doğru yansıyor mu?

### 8. İthalat modeli

- Mal bedeli, navlun ve gümrük ayrı olaylar olarak işleniyor mu?
- Gecikme senaryosu satış başlangıcını doğru öteliyor mu?
- İthalat tek satır toplam olarak yanlış sadeleştirilmiyor mu?

### 9. Tahmini satışlar

- Tahminler gerçek veriden ayrı statü taşıyor mu?
- Gerçek veri geldiğinde tahmin override/pasif duruma geçiyor mu?
- Düşük güvenli tahminler karar motoruna yanlış katkı vermiyor mu?

### 10. Karar motoru

- 7 gün içinde negatif bakiye varsa kritik karar üretiyor mu?
- Güvenli nakit tamponu kırıldığında temkinli mod devreye giriyor mu?
- ROI pozitif ama tampon kırılıyorsa ithalatı yanlışlıkla onaylamıyor mu?
- Kredi yalnızca açığı ertelediğinde `kullan` kararı üretmiyor mu?
- Çakışan kararlar öncelik kurallarına göre çözülüyor mu?

### 11. Dashboard

- 7/30/60/90 gün görünümü doğru kaynaklardan besleniyor mu?
- Gerçek ve tahmini katkılar görsel olarak ayrılıyor mu?
- Kritik ödeme ve tahsilat blokları doğru tarihlerle listeleniyor mu?

### 12. Mobil ilk ekran kontrolü

- Dashboard değişikliğinden sonra `runMobileUatCLI` PASS veriyor mu?
- Ana Kontrol Paneli değişikliğinden sonra `runMobileUatCLI` PASS veriyor mu?
- İlk 25-35 satır içinde üst özet, bugün ne yapmalı, zaman ufku ve sistem durumu blokları görünür mü?

## Çıkış şartı

Kritik maddelerden biri başarısızsa ilgili faz tamamlanmış sayılmaz.
