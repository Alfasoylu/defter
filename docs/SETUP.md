# SETUP

## 1. Gereksinimler

- Node.js >= 18
- Google Cloud'da oluşturulmuş bir **service account** ve indirilmiş JSON anahtar dosyası
- Google Sheet'in, service account'ın `client_email` adresiyle paylaşılmış olması

## 2. Ortam Değişkenleri (.env)

Aşağıdaki anahtarları .env dosyanıza ekleyin:

```
SERVICE_ACCOUNT_FILE=service-account.json
SHEET_ID=
TEST_SHEET_ID=
DRY_RUN=true
ALLOW_PROD_WRITE=false
```

## 3. Güvenlik

- `creds.json` (OAuth client credentials) **sadece Apps Script geliştirme/deploy** için kullanılır, runtime'da kullanılmaz.
- Service account JSON dosyası repoya konmaz, .env ile path olarak referans verilir.
- .env ve tüm secret dosyalar .gitignore ile korunur.

## 4. İlk Kurulum

```bash
git clone <repo-url>
cd defter
cp .env.example .env
npm install
```

## 5. Test Çalıştırma

Service account dosyası ve test sheet id geldikten sonra:

```bash
node scripts/upload-excel.js
```

### Beklenen Loglar

- Çalıştırma başında özet log çıkar:
  - mode: dry-run / real-run
  - target spreadsheet id
  - service account file exists: yes/no
  - prod write allowed: yes/no
- DRY_RUN=true ise hiçbir gerçek yazma yapılmaz, sadece log çıkar.
- Service account dosyası yoksa veya sheet erişilemiyorsa [FATAL] ile fail verir.
- `[SUCCESS] ... yazıldı.` logu çıkarsa bağlantı ve yazma başarılıdır.

### Fail Durumları

- Service account dosyası yoksa veya okunamıyorsa: `[FATAL] SERVICE_ACCOUNT_FILE bulunamadı veya erişilemiyor`
- Sheet paylaşılmamışsa: `[FATAL] PERMISSION_DENIED` veya benzeri hata
- DRY_RUN tanımsızsa: `[FATAL] DRY_RUN env zorunlu (true/false)`
- ALLOW_PROD_WRITE=false ise canlı sheet'e yazılamaz.

Daha fazla bilgi için docs/TROUBLESHOOTING.md dosyasına bakın.
