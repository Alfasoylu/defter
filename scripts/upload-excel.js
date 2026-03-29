#!/usr/bin/env node
/**
 * Excel dosyalarini Google Sheets staging alanlarina yazar.
 * clasp OAuth tokenlarini kullanarak Google Sheets API ile dogrudan yazar.
 * Kullanim: node scripts/upload-excel.js
 */

const path = require("path");
const os = require("os");
const XLSX = require("xlsx");
const { google } = require("googleapis");

const ROOT = path.resolve(__dirname, "..");
const SALES_FILE = path.join(ROOT, "docs", "entegra-sales-0101.2025-27.03.2026.xlsx");
const STOCK_FILE = path.join(ROOT, "docs", "stok-listesi-29.03.2026.xlsx");
const SPREADSHEET_ID = "1PeLF3CGuVZgHwrKiWhmr2Q9owMaElXtHVa5CTQzwUfc";

async function getAuth() {
  const clasprc = require(path.join(os.homedir(), ".clasprc.json"));
  const creds = clasprc.tokens.default;

  const oauth2Client = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret
  );
  oauth2Client.setCredentials({
    access_token: creds.access_token,
    refresh_token: creds.refresh_token,
    token_type: creds.token_type,
    expiry_date: creds.expiry_date,
  });
  return oauth2Client;
}

function readExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
}

async function writeToSheet(sheets, sheetName, rows) {
  // Get sheet metadata to find sheetId and expand if needed
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties",
  });
  const sheetMeta = meta.data.sheets.find(
    s => s.properties.title === sheetName
  );
  if (!sheetMeta) {
    console.log(`  ✗ Sheet '${sheetName}' bulunamadi!`);
    return;
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
        properties: { sheetId, gridProperties: { rowCount: neededRows, columnCount: Math.max(currentCols, neededCols) } },
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
    console.log(`  Grid genisletiliyor: ${neededRows} satir x ${Math.max(currentCols, neededCols)} kolon`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });
  }

  // Clear existing data
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
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
    console.log(`  Yaziliyor: ${sheetName} [${i + 1}-${Math.min(i + BATCH, rows.length)} / ${rows.length}]`);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "RAW",
      requestBody: { values: batch },
    });
  }
  console.log(`  ✓ ${sheetName}: ${rows.length - 1} veri satiri yazildi`);
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // ─── SATIS VERISI ─────────────────────────────────────────────────────
  console.log("\n═══ SATIS VERİSİ ═══");
  console.log(`Kaynak: ${path.basename(SALES_FILE)}`);
  const salesData = readExcel(SALES_FILE);
  console.log(`Satir: ${salesData.length - 1}, Kolon: ${salesData[0].length}`);
  await writeToSheet(sheets, "_IMPORT_SALES", salesData);

  // ─── STOK VERISI ──────────────────────────────────────────────────────
  console.log("\n═══ STOK VERİSİ ═══");
  console.log(`Kaynak: ${path.basename(STOCK_FILE)}`);
  const stockData = readExcel(STOCK_FILE);
  console.log(`Satir: ${stockData.length - 1}, Kolon: ${stockData[0].length}`);

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
  console.log(`Filtrelenmis kolon: ${keepIdx.length} / ${stockHeaders.length}`);
  await writeToSheet(sheets, "_IMPORT_STOCK", filteredStock);

  console.log("\n═══ TAMAMLANDI ═══\n");
}

main().catch(e => { console.error("HATA:", e.message); process.exit(1); });
