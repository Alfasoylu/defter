# TROUBLESHOOTING

## 1. Auth Hataları

- `SERVICE_ACCOUNT_FILE bulunamadı veya erişilemiyor`: .env dosyanızda path doğru mu? Dosya mevcut mu?
- `client_email ile paylaşılmamış`: Google Sheet paylaşım ayarlarını kontrol edin. Service account'ın client_email adresiyle paylaşılmalı.
- `DRY_RUN tanımsız`: .env dosyanızda DRY_RUN anahtarı var mı?
- `ALLOW_PROD_WRITE=false` ise canlı sheet'e yazılamaz.
- `creds.json` ile runtime auth çalışmaz, sadece Apps Script geliştirme/deploy için kullanılır.

## 2. Ortam Değişkeni Eksikliği

- .env dosyanızda SERVICE_ACCOUNT_FILE, SHEET_ID, TEST_SHEET_ID, DRY_RUN anahtarları eksikse script çalışmaz.

## 3. Sheet Erişim Hataları

- Service account'ın erişim yetkisi yoksa, Google Sheets API "PERMISSION_DENIED" hatası verir.
- Sheet id yanlışsa veya paylaşılmamışsa erişim sağlanamaz.

## 4. Diğer

- Excel dosya yolu yanlışsa veya dosya yoksa script başında hata verir.
- Node.js sürümünüz eskiyse, güncelleyin.

Daha fazla bilgi için README.md ve docs/SETUP.md dosyalarına bakın.
