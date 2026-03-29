# DEPLOYMENT RUNBOOK

## Amaç

Sheets ve Apps Script tarafına geçildiğinde değişikliklerin kontrollü, geri alınabilir ve izlenebilir şekilde canlıya alınmasını tanımlamak.

## Temel ilke

- Test edilmemiş değişiklik doğrudan canlıya gitmez.
- Canlıda destructive işlem öncesi onay alınır.
- Doküman-kod uyumu kontrol edilmeden deploy tamamlanmış sayılmaz.

## Ön koşullar

- ilgili faz dokümantasyonu güncel
- temel testler tamamlandı
- riskli alanlar not edildi
- canlı ve test ortamı ayrımı net

## Bu repo için standart komut seti

- Push: `echo y | npx clasp push`
- Smoke test: `npx clasp run runSmokeTestsCLI`
- Mobile UAT: `npx clasp run runMobileUatCLI`
- Sheet bütünlük: `npx clasp run verifySheetIntegrityCLI`
- Post-deploy check: `npx clasp run postDeployCheckCLI`
- Emniyet kapısı: `npx clasp run runSafetyGateCLI`
- Deploy: `npx clasp deploy --description "<surum-notu>"`
- Hedef ID görüntüleme: `npx clasp run getSpreadsheetTargetsCLI`
- Test hedefi oluşturma: `npx clasp run ensureTestSpreadsheetCLI`
- Test smoke: `npx clasp run runSmokeTestsTestCLI`
- Test safety gate: `npx clasp run runSafetyGateTestCLI`

## Script ile tek komut akışı

- Test akışı: `powershell -ExecutionPolicy Bypass -File .\\scripts\\release-test.ps1`
- Live akışı: `powershell -ExecutionPolicy Bypass -File .\\scripts\\release-live.ps1 -Description "vXX-aciklama"`

## Deploy öncesi checklist

- backlog’daki ilgili faz gözden geçirildi mi
- ilgili md belgeleri güncel mi
- duplicate riski değerlendirildi mi
- gerçek/tahmini veri ayrımı korunuyor mu
- sheet isimleri ve başlık satırları doğrulandı mı
- smoke test senaryoları geçti mi
- dashboard veya ana panel değiştiyse `runMobileUatCLI` PASS mi
- `runSafetyGateCLI` PASS mi

## Test ortamı akışı

1. Değişiklik test sheet veya test script üzerinde uygulanır.
2. Veri akışı ve duplicate davranışı kontrol edilir.
3. Dashboard / karar çıktısı bozulmadığı ve `runMobileUatCLI` PASS olduğu doğrulanır.
4. Sonuç Test Sonuçları veya raporda kayıt altına alınır.

### Test ortamı önerisi

- Canlıdan bağımsız bir test spreadsheet ID kullan.
- `_SS_OVERRIDE` kullanan CLI wrapper'ların test ID'li varyantını üret.
- Testte PASS almadan canlı komutları çalıştırma.
- Test ID yoksa otomatik oluştur:
  - `npx clasp run ensureTestSpreadsheetCLI`

## Canlı öncesi karar kapısı

Canlıya geçmeden önce şu sorulara net cevap olmalı:

- hangi dosya veya sayfa etkileniyor
- veri silme veya overwrite riski var mı
- geri alma yöntemi var mı
- kullanıcı onayı gerekiyor mu

## Canlı deploy akışı

1. Son risk değerlendirmesi yapılır.
2. Gerekirse yedek alınır.
3. Değişiklik kontrollü şekilde uygulanır (`echo y | npx clasp push`).
4. Zorunlu test kapısı çalıştırılır:

- `npx clasp run runSmokeTestsCLI`
- `npx clasp run runMobileUatCLI`
- `npx clasp run runSafetyGateCLI`

5. Safety gate PASS ise deploy yapılır.
6. Deploy sonrası `npx clasp run postDeployCheckCLI` çalıştırılır.
7. Sonuç kısa raporla kayıt altına alınır.

## Kritik sonrası kontroller

- Hızlı Veri Girişi çalışıyor mu
- Nakit Akışı doğru güncelleniyor mu
- duplicate oluştu mu
- Dashboard veya Ana Kontrol Paneli değiştiyse mobil ilk ekran blokları görünür mü
- Dashboard temel blokları veri gösteriyor mu
- Karar Motoru çıktısı mantıklı mı

## Geri alma yaklaşımı

- büyük değişiklik öncesi mevcut yapı yedeklenmeli
- canlıda sorun çıkarsa son güvenli sürüme dönülebilmeli
- geri alma adımı deploy planında önceden yazılmalı

### Pratik rollback akışı

1. Son güvenli deployment notunu bul.
2. Sorunlu sürümde safety gate çıktısını kaydet.
3. Önceki güvenli sürüm için yeni deploy al.
4. `postDeployCheckCLI` ile doğrula.

## Yüksek riskli işlemler

- mevcut başlık satırını değiştirmek
- mevcut sheet ismini değiştirmek
- onEdit mantığına müdahale
- yansıtma tablolarını toplu yeniden üretmek
- veri silme veya taşıma işlemi

## Kabul kriterleri

- Deploy sonrası temel akışlar bozulmamış olmalı.
- Değişiklik geri alınabilir olmalı.
- Rapor ve test kaydı olmadan deploy tamamlandı denmemeli.
- `runSafetyGateCLI` sonucu PASS olmalı.
