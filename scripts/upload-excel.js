#!/usr/bin/env node
/**
 * Excel dosyalarini Google Sheets staging alanlarina yazar.
 * clasp OAuth tokenlarini kullanarak Google Sheets API ile dogrudan yazar.
 * Kullanim: node scripts/upload-excel.js
 */

const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const { google } = require("googleapis");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const ROOT = path.resolve(__dirname, "..");
const SALES_FILE =
  process.env.SALES_REPORT_PATH ||
  path.join(ROOT, "docs", "entegra-sales-0101.2025-27.03.2026.xlsx");
const STOCK_FILE =
  process.env.STOCK_FILE_PATH ||
  path.join(ROOT, "docs", "stok-listesi-29.03.2026.xlsx");
const OAUTH_CLIENT_SECRET_FILE = process.env.OAUTH_CLIENT_SECRET_FILE || path.join(ROOT, "creds.json");
const OAUTH_TOKEN_FILE = process.env.OAUTH_TOKEN_FILE || path.join(ROOT, "token.json");
const SHEET_ID = process.env.SHEET_ID;
const TEST_SHEET_ID = process.env.TEST_SHEET_ID;
const DRY_RUN = process.env.DRY_RUN;
const ALLOW_PROD_WRITE = process.env.ALLOW_PROD_WRITE === "true";

// Whitelist: sadece bu sheet id'lere yazılabilir
const SHEET_ID_WHITELIST = [SHEET_ID, TEST_SHEET_ID].filter(Boolean);




// Güvenlik: DRY_RUN, TEST_SHEET_ID, OAUTH_CLIENT_SECRET_FILE zorunlu
function fail(msg) {
  console.error("[FATAL] " + msg);
  process.exit(1);
}


function getTargetSheetId() {
  if (typeof DRY_RUN === "undefined") fail("DRY_RUN env zorunlu (true/false)");
  if (DRY_RUN === "true") {
    if (!TEST_SHEET_ID) fail("TEST_SHEET_ID env zorunlu (DRY_RUN=true)");
    return TEST_SHEET_ID;
  } else if (DRY_RUN === "false") {
    if (!SHEET_ID) fail("SHEET_ID env zorunlu (DRY_RUN=false)");
    if (!ALLOW_PROD_WRITE) fail("Prod sheet'e yazmak için ALLOW_PROD_WRITE=true olmalı");
    return SHEET_ID;
  } else {
    fail("DRY_RUN env değeri sadece 'true' veya 'false' olabilir");
  }
}



async function getAuth() {
  if (!OAUTH_CLIENT_SECRET_FILE || !fs.existsSync(OAUTH_CLIENT_SECRET_FILE)) {
    fail("OAUTH_CLIENT_SECRET_FILE bulunamadı veya erişilemiyor: " + OAUTH_CLIENT_SECRET_FILE);
  }
  const credsRaw = fs.readFileSync(OAUTH_CLIENT_SECRET_FILE, "utf8");
  const creds = JSON.parse(credsRaw).installed || JSON.parse(credsRaw).web || JSON.parse(credsRaw);
  const { client_id, client_secret, redirect_uris } = creds;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    (redirect_uris && redirect_uris[0]) || "http://localhost"
  );

  // Token varsa yükle
  if (fs.existsSync(OAUTH_TOKEN_FILE)) {
    const token = JSON.parse(fs.readFileSync(OAUTH_TOKEN_FILE, "utf8"));
    oAuth2Client.setCredentials(token);
    // Token expire ise refresh et
    if (token.expiry_date && token.expiry_date < Date.now()) {
      try {
        const newToken = await oAuth2Client.refreshAccessToken();
        oAuth2Client.setCredentials(newToken.credentials);
        fs.writeFileSync(OAUTH_TOKEN_FILE, JSON.stringify(newToken.credentials, null, 2));
        console.log("[INFO] Token otomatik yenilendi.");
      } catch (e) {
        fail("Refresh token ile otomatik yenileme başarısız: " + e.message);
      }
    }
    return oAuth2Client;
  }

  // İlk login: kullanıcıdan yetki al
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
    prompt: "consent"
  });
  console.log("Yetkilendirme için şu linki açın:", authUrl);
  const readline = require("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise((resolve) => rl.question("Kodu girin: ", resolve));
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(OAUTH_TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log("[INFO] Token kaydedildi: ", OAUTH_TOKEN_FILE);
    return oAuth2Client;
  } catch (e) {
    fail("Token alma başarısız: " + e.message);
  }


// (Service account getAuth fonksiyonu tamamen kaldırıldı, sadece OAuth2 client ile çalışan fonksiyon yukarıda var)


function readExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
}

async function writeToSheet(sheets, spreadsheetId, sheetName, rows) {
  // Whitelist kontrolü
  if (!SHEET_ID_WHITELIST.includes(spreadsheetId)) {
    fail(`Sheet ID whitelist dışı: ${spreadsheetId}`);
  }
  // Get sheet metadata to find sheetId and expand if needed
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });
  const sheetMeta = meta.data.sheets.find(
    (s) => s.properties.title === sheetName,
  );
  if (!sheetMeta) {
    fail(`  ✗ Sheet '${sheetName}' bulunamadi!`);
  }
  const sheetId = sheetMeta.properties.sheetId;
  const currentRows = sheetMeta.properties.gridProperties.rowCount;
  const currentCols = sheetMeta.properties.gridProperties.columnCount;
  const neededRows = rows.length + 10;
  const neededCols = rows[0].length + 2;

  // Expand grid if needed
  const requests = [];
  if (currentRows < neededRows) {
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: {
            rowCount: neededRows,
            columnCount: Math.max(currentCols, neededCols),
          },
        },
        fields: "gridProperties.rowCount,gridProperties.columnCount",
      },
    });
  }
  if (currentCols < neededCols) {
    requests.push({
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { columnCount: neededCols } },
        fields: "gridProperties.columnCount",
      },
    });
  }
  if (requests.length > 0) {
    console.log(
      `  Grid genisletiliyor: ${neededRows} satir x ${Math.max(currentCols, neededCols)} kolon`,
    );
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  // Clear existing data
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetName}'!A:ZZ`,
    });
  } catch (e) {
    console.log(`  (${sheetName} temizleme atlandi: ${e.message})`);
  }

  // Write in batches
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const startRow = i + 1;
    const range = `'${sheetName}'!A${startRow}`;
    if (DRY_RUN === "true") {
      console.log(`[DRY RUN] mode: dry-run | target spreadsheet: ${spreadsheetId} | tab: ${sheetName} | rows: ${batch.length}`);
    } else {
      console.log(`[REAL RUN] mode: real-run | target spreadsheet: ${spreadsheetId} | tab: ${sheetName} | rows: ${batch.length}`);
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: range,
          valueInputOption: "RAW",
          requestBody: { values: batch },
        });
        console.log(`[SUCCESS] ${sheetName} [${i + 1}-${Math.min(i + BATCH, rows.length)} / ${rows.length}] yazıldı.`);
      } catch (err) {
        console.error(`[FAIL] ${sheetName} [${i + 1}-${Math.min(i + BATCH, rows.length)} / ${rows.length}]: ${err.message}`);
      }
    }
  }
  console.log(`  ✓ ${sheetName}: ${rows.length - 1} veri satırı ${DRY_RUN === "true" ? "(DRY RUN)" : "yazıldı"}`);
}

async function main() {
  // Çalıştırma öncesi self-check ve özet log
  const mode = DRY_RUN === "true" ? "dry-run" : "real-run";
  const spreadsheetId = getTargetSheetId();
  const credsExists = OAUTH_CLIENT_SECRET_FILE && fs.existsSync(OAUTH_CLIENT_SECRET_FILE);
  const tokenExists = OAUTH_TOKEN_FILE && fs.existsSync(OAUTH_TOKEN_FILE);
  const prodWriteAllowed = ALLOW_PROD_WRITE === true;
  console.log("\n--- ÇALIŞTIRMA ÖZETİ ---");
  console.log(`mode: ${mode}`);
  console.log(`target spreadsheet id: ${spreadsheetId}`);
  console.log(`oauth client secret file exists: ${credsExists ? "yes" : "NO"}`);
  console.log(`token file exists: ${tokenExists ? "yes" : "NO"}`);
  console.log(`prod write allowed: ${prodWriteAllowed ? "yes" : "no"}`);
  if (!credsExists) {
    console.log("UYARI: OAuth client secret dosyası bulunamadı, gerçek çalışma yapılamaz.");
  }

    const auth = await getAuth(); // (Service account getAuth fonksiyonu kaldırıldı, bu satırda hata verecektir)
  const sheets = google.sheets({ version: "v4", auth });

  // --- TEST YAZMA SEKME KONTROLÜ ---
  const testTab = "TEST_WRITE";
  console.log(`\nHedef sheet/tab: ${testTab}`);

  // --- SATIS VERISI ---
  console.log("\n═══ SATIS VERİSİ (TEST) ═══");
  console.log(`Kaynak: ${path.basename(SALES_FILE)}`);
  const salesData = readExcel(SALES_FILE);
  console.log(`Satır: ${salesData.length - 1}, Kolon: ${salesData[0].length}`);
  await writeToSheet(sheets, spreadsheetId, testTab, salesData);

  // --- STOK VERISI ---
  console.log("\n═══ STOK VERİSİ (TEST) ═══");
  console.log(`Kaynak: ${path.basename(STOCK_FILE)}`);
  const stockData = readExcel(STOCK_FILE);
  console.log(`Satır: ${stockData.length - 1}, Kolon: ${stockData[0].length}`);

  // Filter to keep only relevant columns (reduce payload)
  const stockHeaders = stockData[0];
  const keepCols = [
    "Ürün Kodu", "Ürün Adı", "Barkod", "Kategori", "Grup", "Marka",
    "Stok1", "Stok2", "buying_price", "KDV", "Para Birimi",
    "Fiyat1", "Trendyol Satış Fiyatı", "HB Fiyat", "N11 Fiyat",
    "Kritik Stok", "Durum", "Menşei"
  ];
  const keepIdx = keepCols.map(name => stockHeaders.indexOf(name)).filter(i => i >= 0);
  const filteredStock = stockData.map(row => keepIdx.map(i => row[i] != null ? row[i] : ""));
  console.log(`Filtrelenmiş kolon: ${keepIdx.length} / ${stockHeaders.length}`);
  await writeToSheet(sheets, spreadsheetId, testTab, filteredStock);

  console.log("\n═══ TAMAMLANDI (TEST) ═══\n");
}

main().catch(e => fail(e.message));
