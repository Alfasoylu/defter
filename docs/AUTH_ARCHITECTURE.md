# AUTH ARCHITECTURE

## Apps Script Auth

- Google Apps Script kodu SpreadsheetApp ile çalışır, kullanıcı OAuth ile yetkilendirilir.
- Kod Google hesabı ile çalışır, service account desteği yoktur.
- clasp sadece geliştirme/deploy için kullanılır, runtime auth değildir.


## Node/Scripts Auth

- Tüm dış scriptler (ör: upload-excel.js) Google Sheets API'ye **sadece service account** ile erişir.
- Kullanıcı OAuth/token veya OAuth client secret (creds.json) **runtime'da kullanılmaz**.
- Service account dosyası (JSON) ve env değişkeni ile kimlik doğrulama yapılır.

## Runtime vs Development Auth

- Development: clasp ile deploy, Apps Script edit, test için kullanıcı OAuth gerekir.
- Runtime: upload-excel.js ve benzeri scriptler sadece service account ile çalışır, kullanıcı tokenı kullanılmaz.
- Test ve prod ortamı env ile ayrılır, prod write için explicit flag gerekir.

# AUTH ARCHITECTURE

## 1. Apps Script Tarafı

- Google Apps Script kodu doğrudan SpreadsheetApp ve ilgili Google servislerini kullanır.
- Auth, Apps Script runtime tarafından otomatik olarak kullanıcı hesabı ile yönetilir (OAuth2, ScriptApp.getOAuthToken() veya service account kullanılmaz).
- Geliştirme ve deploy için clasp kullanılır, ancak runtime'da kullanıcıdan ek auth gerekmez.


## 2. Node/Scripts Tarafı

- Tüm dış scriptler (ör: upload-excel.js) Google Sheets API'ye erişmek için **yalnızca service account** kullanır.
- Auth için google.auth.GoogleAuth ve SERVICE_ACCOUNT_FILE (JSON) kullanılır.
- Kullanıcı OAuth tokenı, .clasprc.json veya OAuth client secret (creds.json) **kullanılmaz**.
- Tüm erişimler env ile belirlenen sheet id'lerine yapılır (SHEET_ID, TEST_SHEET_ID).

## 3. Runtime vs Development Auth

- Development: Kod geliştirme ve Apps Script deploy için clasp login gereklidir (kullanıcı OAuth ile).
- Runtime: Dış scriptler sadece service account ile çalışır, kullanıcı OAuth tokenı gerekmez.
- Service account dosyası ve env değişkenleri olmadan dış scriptler çalışmaz.


## 4. Güvenlik

- Service account dosyası ve sheet id'leri .env ve .gitignore ile korunur.
- creds.json (OAuth client credentials) **sadece Apps Script geliştirme/deploy** için kullanılır, repoda tutulmaz, runtime'da kullanılmaz.
- Production sheet'e yazmak için ALLOW_PROD_WRITE=true flag'i zorunludur.
- DRY_RUN, test ve prod ortam ayrımı env ile yönetilir.
