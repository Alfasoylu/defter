# LOCAL DEV WORKFLOW

## Amaç

Bu proje için yerel geliştirme, test ve canlıya alma akışını standartlaştırmak.

## Proje özeti

- Çalışma klasörü: `c:\muhasebe-live`
- Apps Script dosyaları: `00_Config.js` ... `22_Tests.js`
- Manifest: `appsscript.json`
- clasp ayarı: `.clasp.json`
- Ana test komutu: `npx clasp run runSmokeTestsCLI`
- Mobil UAT komutu: `npx clasp run runMobileUatCLI`
- Emniyet kapısı: `npx clasp run runSafetyGateCLI`

## İlk kurulum

1. Node.js ve npm kurulu olmalı.
2. Proje klasörüne geç:
   - `cd c:\muhasebe-live`
3. Kimlik doğrulama:
   - `clasp login --creds creds.json --use-project-scopes --include-clasp-scopes`
4. Proje bağlı mı kontrol et:
   - `.clasp.json` içindeki `scriptId` dolu olmalı.

## Standart geliştirme döngüsü

1. Faz seçimi:
   - `docs/backlog.md` üzerinden sıradaki faz belirlenir.
2. Analiz:
   - İlgili dokümanlar (`docs/*.md`) ve ilgili modüller okunur.
3. Küçük kapsamlı değişiklik:
   - Tek seferde dar bir mantık bloğu değiştirilir.
4. Yerel doğrulama:
   - Statik kontrol + şema/alan tutarlılığı gözden geçirilir.
5. Push:
   - `echo y | npx clasp push`
6. Test:
   - `npx clasp run runSmokeTestsCLI`
   - Dashboard veya Ana Panel değiştiyse `npx clasp run runMobileUatCLI`
   - `npx clasp run runSafetyGateCLI`
7. Rapor:
   - Ne değişti, neden değişti, hangi test geçti.

## Push öncesi zorunlu kapılar

Tüm koşullar sağlanmadan görev tamamlanmış sayılmaz:

1. Smoke test:
   - `PASS>0` ve `FAIL=0`
2. Safety gate:
   - `SAFETY_GATE=PASS`
3. Mobil panel görünürlüğü:
   - Dashboard veya Ana Panel değiştiyse `MOBILE_UAT=PASS`
4. Sheet bütünlük:
   - `MISSING:` veya `HEADER_MISSING` olmamalı
5. Post-deploy check:
   - `FAIL:` satırı olmamalı

## Test hedefi hazırlama (otomatik)

Test spreadsheet ID manuel girilmemişse aşağıdaki komut test ortamını otomatik oluşturur:

1. `npx clasp run ensureTestSpreadsheetCLI`
2. `npx clasp run getSpreadsheetTargetsCLI`

Beklenen çıktı:

- `LIVE=<id>`
- `TEST=<id>`

Test hedefi doğrulama komutları:

- `npx clasp run runSmokeTestsTestCLI`
- `npx clasp run runSafetyGateTestCLI`
- `npx clasp run verifySheetIntegrityTestCLI`

## Tek komutlu akışlar

- Test gate: `powershell -ExecutionPolicy Bypass -File .\\scripts\\release-test.ps1`
- Live release: `powershell -ExecutionPolicy Bypass -File .\\scripts\\release-live.ps1 -Description "vXX-aciklama"`

## Canlı / test ayrımı

- Varsayılan CLI fonksiyonları canlı spreadsheet ID'sine bağlıdır (`_SS_OVERRIDE`).
- Test ortamı kullanımı için öneri:
  1. Ayrı bir test spreadsheet aç.
  2. İlgili CLI wrapper fonksiyonunun kopyasını test ID ile oluştur.
  3. Önce testte doğrula, sonra canlıda çalıştır.
- Not: Test/live ayrımı kodda sabit ID ile yönetildiği için ID değişikliği kontrollü yapılmalıdır.

## Yedekleme prosedürü

1. Büyük değişiklik öncesi kod yedeği al:
   - Örnek: `Kod.js.presplit` benzeri arşivleme
2. Deployment numarası ve ID not et.
3. Son güvenli sürüm etiketini dokümana yaz.

## Rollback prosedürü

1. Sorun doğrula:
   - `npx clasp run runSafetyGateCLI`
2. Son güvenli deployment'ı tespit et.
3. Gerekirse önceki sürümü yeniden deploy et.
4. Post-check koş:
   - `npx clasp run postDeployCheckCLI`

## Faz 18 kabul kriteri

Bu dosya kapsamında Faz 18 tamamlanmış kabulü için:

- Yerel kurulum adımları net olmalı.
- Push öncesi test kapıları komut bazlı yazılmış olmalı.
- Rollback ve yedekleme adımları net olmalı.
- Canlı/test ayrımı için uygulanabilir yöntem tanımlanmış olmalı.
