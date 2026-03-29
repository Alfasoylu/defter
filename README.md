
# defter

## 1. Projenin Amacı
Bu proje ithalat, stok, satış, finans ve karar destek süreçlerini Google Sheets + otomasyon + AI ajanları ile yönetmek için kuruldu.

## 2. Ana Özellikler
- Satış raporu analizi
- Stok listesi işleme
- Google Sheets’e veri aktarımı
- İthalat karar desteği
- Finans ve nakit akışı görünürlüğü
- Görev/backlog tabanlı ilerleme

## 3. Repo Yapısı
- `/docs` → sistem dokümantasyonu
- `/src` veya script dosyaları → uygulama/otomasyon kodları
- `/tests` → testler
- `/.env.example` → örnek ortam değişkenleri

## 4. Hızlı Başlangıç
```bash
git clone <repo-url>
cd defter
cp .env.example .env
npm install
npx clasp run runSmokeTestsCLI # test
npx clasp run runDryRunCLI     # dry-run
```

## 5. Ortam Değişkenleri
```env
GOOGLE_SHEETS_ID=
GOOGLE_SERVICE_ACCOUNT_FILE=
ENTEGRA_INPUT_PATH=
STOCK_FILE_PATH=
SALES_REPORT_PATH=
DRY_RUN=true
```

## 6. Güvenlik Notu
- Gerçek OAuth key, token, credentials ve .env dosyaları commit edilmez.
- Repo içinde sadece örnek env bulunur.

## 7. Örnek Veri Açıklaması
Gerçek müşteri/veri koyma. Sadece anonimleştirilmiş örnek kolon yapısı:

| ürün_kodu | ürün_adı | stok_adedi | son_30_gün_satış | alış_fiyatı | satış_fiyatı | kategori | tedarikçi | karar_notu |
|-----------|----------|------------|------------------|-------------|--------------|----------|-----------|------------|
| ...       | ...      | ...        | ...              | ...         | ...          | ...      | ...       | ...        |

## 8. Çalışma Mantığı
1. Önce veri oku
2. Sonra normalize et
3. Sonra Sheets ile eşleştir
4. Sonra karar motorunu çalıştır
5. Son olarak log ve test üret

## 9. Sorun Giderme
- OAuth/login tekrar isteme
- yetki hatası
- sheet erişim hatası
- eksik env
- bozuk veri formatı

## 10. Sonraki Dokümanlar
- docs/ai-agent-protocol.md
- docs/local-dev-workflow.md
- docs/backlog.md

