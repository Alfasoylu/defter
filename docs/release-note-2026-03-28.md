# RELEASE NOTE — 2026-03-28

## Önerilen sürüm etiketi

- `v40-opening-balance-mobile-uat-gate`

## Kapsam

- `opening_cash_balance` canlı parametresi ile Nakit Akışı açılışı senkron doğrulandı.
- Mobil ilk ekran regresyon kontrolü release kapısına zorunlu adım olarak eklendi.
- `Ana Kontrol Paneli` render akışında, `Nakit Akışı` sayfası yeniden üretildikten sonra oluşan stale sheet referansı sertleştirildi.
- Live/test release scriptleri mobil UAT adımını içerecek şekilde güncellendi.
- Deploy runbook ve QA checklist mobil UAT kapısı ile hizalandı.

## Doğrulama özeti

- `npx clasp run syncOpeningCashBalanceCLI`
  - Sonuç: `{"target":"live","oldValue":200000,"newValue":200000,"sourceBalance":200000,"rowNumber":38}`
- `npx clasp run runSmokeTestsCLI`
  - Durum: terminalde son çalıştırma `exit 0`
- `npx clasp run runMobileUatCLI`
  - Durum: terminalde son çalıştırma `exit 0`
- `npx clasp run verifySheetIntegrityCLI`
  - Durum: terminalde son çalıştırma `exit 0`
- `npx clasp run runSafetyGateCLI`
  - Durum: terminalde son başarılı çalıştırma `exit 0`

## Operasyon notu

- Bu not release adayı içindir; bu dosya yazılırken yeni bir deploy alınmadı.
- Rollback referansı için son güvenli deployment notu ve `postDeployCheckCLI` çıktısı saklanmalıdır.

## Çalıştırmaya hazır canlı deploy komutu

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-live.ps1 -Description "v40-opening-balance-mobile-uat-gate"
```

## Deploy sonrası beklenen kapılar

- `runSmokeTestsCLI` başarılı olmalı
- `runMobileUatCLI` başarılı olmalı
- `runSafetyGateCLI` başarılı olmalı
- `postDeployCheckCLI` çıktısında `FAIL:` satırı olmamalı
