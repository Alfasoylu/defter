// Google Sheets'te hedef sekmeleri ve header'ları otomatik oluşturur.
// Sadece whitelist sekmeler ve başlıklar, formül veya veri yok.
// Satış pipeline'ı için güvenli setup scripti.

const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const SHEET_ID =
  process.env.DRY_RUN === "true"
    ? process.env.TEST_SHEET_ID
    : process.env.SHEET_ID;
const OAUTH_CLIENT_SECRET_FILE = path.join(__dirname, "../creds.json");
const OAUTH_TOKEN_FILE = path.join(__dirname, "../token.json");

const TAB_HEADERS = {
  "Ham Siparişler": [], // Kaynak dosyadan alınacak
  "Temiz Satış Verisi": [
    "Sipariş Tarihi",
    "Satış Ayı",
    "Pazaryeri",
    "Stok Kodu",
    "Ürün Adı",
    "Miktar",
    "Satış Fiyatı TL",
    "USD Kuru",
    "Satış Fiyatı USD",
    "Unique Key",
  ],
  "Aylık USD Kurları": ["Ay (YYYY-MM)", "USDTRY", "Manuel Giriş"],
  "Ürün Satış Özeti": [
    "Stok Kodu",
    "Ürün Adı",
    "Toplam Satış Adet",
    "Aylık Ortalama",
    "Son 3 Ay",
    "Son 6 Ay",
    "Ortalama Fiyat TL",
    "Ortalama Fiyat USD",
    "Satış Pazaryerleri",
    "Satış Olmayan Pazaryerleri",
    "Son Satış Tarihi",
  ],
  "Pazaryeri Performansı": [
    "Pazaryeri",
    "Toplam Adet",
    "Toplam Ciro TL",
    "Toplam Ciro USD",
    "Aktif SKU",
    "SKU Başına Satış",
    "Hiç Satış Olmayan SKU",
  ],
  "Satışsız Stok Analizi": [
    "Stok Kodu",
    "Ürün Adı",
    "Stok Adedi",
    "Son Satış Tarihi",
    "Son X Ay Satış",
    "Yüksek Stok Düşük Satış",
    "İlgilenilmesi Gereken Skor",
  ],
  "Aksiyon Merkezi": ["Stok Kodu", "Ürün Adı", "Kriter", "Açıklama"],
};

async function getAuth() {
  const credsRaw = fs.readFileSync(OAUTH_CLIENT_SECRET_FILE, "utf8");
  const creds =
    JSON.parse(credsRaw).installed ||
    JSON.parse(credsRaw).web ||
    JSON.parse(credsRaw);
  const { client_id, client_secret, redirect_uris } = creds;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    (redirect_uris && redirect_uris[0]) || "http://localhost",
  );
  const token = JSON.parse(fs.readFileSync(OAUTH_TOKEN_FILE, "utf8"));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function setupSheets() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  for (const tab of Object.keys(TAB_HEADERS)) {
    // Tab var mı kontrol et, yoksa oluştur
    let tabId = null;
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const found = meta.data.sheets.find((s) => s.properties.title === tab);
    if (!found) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: tab } } }],
        },
      });
      console.log(`[CREATE] Sekme oluşturuldu: ${tab}`);
    } else {
      tabId = found.properties.sheetId;
      console.log(`[EXISTS] Sekme zaten var: ${tab}`);
    }
    // Header yaz
    if (TAB_HEADERS[tab].length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${tab}!A1:${String.fromCharCode(65 + TAB_HEADERS[tab].length - 1)}1`,
        valueInputOption: "RAW",
        requestBody: { values: [TAB_HEADERS[tab]] },
      });
      console.log(`[HEADER] ${tab} başlıkları yazıldı.`);
    }
  }
}

setupSheets()
  .then(() => console.log("Tüm sekmeler ve başlıklar hazır."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
