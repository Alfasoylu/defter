# CURRENT RISKS

## Amaç

Projede şu anda görülen ana riskleri, etkilerini ve öncelik seviyelerini kayıt altına almak.

## Risk sınıfları

- P0: kritik
- P1: yüksek
- P2: orta

## P0 Riskler

### 1. Mevcut canlı yapı doğrulanmamış

Risk:

- Dokümantasyon ilerledi ancak gerçek Google Sheets ve Apps Script yapısı henüz denetlenmedi.

Etkisi:

- uygulama ile dokümantasyon farklı olabilir
- yanlış dosyaya veya yanlış mantığa geliştirme yapılabilir

Öneri:

- sheet envanteri ve script denetimi yapılmalı

### 2. Duplicate riski teknik olarak henüz uygulamada doğrulanmadı

Risk:

- Belgelerde upsert ve iş anahtarı kuralı var, fakat mevcut kodda gerçekten uygulanıp uygulanmadığı bilinmiyor.

Etkisi:

- nakit akışı bozulur
- dashboard yanlış karar üretir

Öneri:

- mevcut scriptte duplicate üretim noktaları aranmalı

### 3. Gerçek ve tahmini veri uygulamada karışıyor olabilir

Risk:

- Belgelerde ayrım net, ama mevcut sheet yapısında ayrım olmayabilir.

Etkisi:

- sahte iyimserlik
- yanlış ithalat ve kredi kararı

Öneri:

- mevcut kaynak tablolar ve dashboard okumaları denetlenmeli

## P1 Riskler

### 4. Mevcut formül ve veri kaynakları bilinmiyor

Risk:

- hangi KPI hangi kaynaktan hesaplanıyor net değil

Etkisi:

- görünüm doğru sanılır ama yanlış olabilir

Öneri:

- kritik dashboard formülleri çıkarılmalı

### 5. Trigger ve onEdit akışı bilinmiyor

Risk:

- görünmez otomasyonlar veri çoğaltıyor veya yanlış yere yazıyor olabilir

Etkisi:

- sessiz veri bozulması

Öneri:

- trigger listesi ve onEdit davranışı incelenmeli

### 6. Tarih format bozulması riski

Risk:

- Google Sheets tarafında tarih alanları tutarsız olabilir

Etkisi:

- ödeme ve tahsilat yanlış tarihlere kayar

Öneri:

- tüm kritik tarih alanları tek tek doğrulanmalı

### 7. Parametrelerin dağınık olma riski

Risk:

- kur, transit, güvenli nakit gibi değerler farklı sayfalara dağılmış olabilir

Etkisi:

- karar motoru aynı varsayımı tutarsız okuyabilir

Öneri:

- Parametreler sayfası gerçek yapıda kontrol edilmeli

## P2 Riskler

### 8. Dokümantasyon kapsamı uygulamadan daha ileri olabilir

Risk:

- Fazlar dokümanda güçlü, uygulamada ise geride olabilir

Etkisi:

- yanlış ilerleme algısı oluşur

Öneri:

- her faz için gerçek durum karşılaştırması yapılmalı

### 9. Mobil kullanım hedefi pratikte doğrulanmamış

Risk:

- Hızlı Veri Girişi ve Dashboard mobil odaklı tanımlandı ama mevcut ekranlar test edilmedi

Etkisi:

- operasyonel kullanım düşebilir

Öneri:

- mobil kullanım akışı test edilmeli

### 10. Test katmanı henüz süreçte değil

Risk:

- test senaryoları yazıldı ama otomatik veya düzenli çalışma akışına bağlanmadı

Etkisi:

- aynı hatalar tekrar eder

Öneri:

- smoke test akışı ve test kayıt disiplini kurulmalı

## Risk özeti (güncelleme: 2026-03-27)

Faz 9 tamamlandı. Tüm 9 faz deploy edildi (@41).

### Kapanan riskler

- P0-1: Canlı yapı doğrulandı — 16 sheet, 136 test PASS
- P0-2: Duplicate riski doğrulandı — upsert mantığı çalışıyor, Giriş ID tekil
- P0-3: Gerçek/tahmini veri ayrımı — Durum alanı ve güven skoru ile korunuyor
- P1-4: KPI kaynakları — tüm hesaplamalar tanımlı kaynak tablolardan okuyor
- P1-5: Trigger/onEdit — onEdit routeInputRow\_ akışı denetlendi
- P1-7: Parametreler — 37 parametre tek Parametreler sayfasında yükleniyor
- P2-8: Dokümantasyon uygulamadan ileri — artık eşleşiyor
- P2-10: Test katmanı — 29 test grubu, CLI çalıştırılabilir
- P1-6: Tarih formatı — giriş doğrulaması ve sayfa validation kuralları sertleştirildi
- P2-9: Mobil kullanım — ilk ekran okunabilirliği için mobil UAT yardımcıları eklendi ve senaryo bazlı doğrulama başlatıldı

### Devam eden riskler

- Mobil okunabilirlik regresyonu — panel blok sırası her büyük dashboard/anapanel değişikliğinden sonra tekrar kontrol edilmeli
- Test hedefinde veri üretimi paralel koşturulursa tutarsız sonuç alınabilir; UAT ve smoke ardışık çalıştırılmalı
- Nakit açılış bakiyesi 0 — opening_cash_balance parametresi set edilmeli
