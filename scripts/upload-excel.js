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
const SERVICE_ACCOUNT_FILE = process.env.SERVICE_ACCOUNT_FILE;
const SHEET_ID = process.env.SHEET_ID;
const TEST_SHEET_ID = process.env.TEST_SHEET_ID;
const DRY_RUN = process.env.DRY_RUN;
const ALLOW_PROD_WRITE = process.env.ALLOW_PROD_WRITE === "true";

// Güvenlik: DRY_RUN, TEST_SHEET_ID, SERVICE_ACCOUNT_FILE zorunlu
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
  if (!SERVICE_ACCOUNT_FILE || !fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    fail("SERVICE_ACCOUNT_FILE bulunamadı veya erişilemiyor: " + SERVICE_ACCOUNT_FILE);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  return await auth.getClient();
}

function fail(msg) {
  console.error("[FATAL] " + msg);
  process.exit(1);
}

function getTargetSheetId() {
  if (!DRY_RUN) fail("DRY_RUN env zorunlu (true/false)");
  if (DRY_RUN === "true") {
    if (!TEST_SHEET_ID) fail("TEST_SHEET_ID env zorunlu (DRY_RUN=true)");
    return TEST_SHEET_ID;
  } else {
    if (!SHEET_ID) fail("SHEET_ID env zorunlu (DRY_RUN=false)");
    if (!ALLOW_PROD_WRITE)
      fail("Prod sheet'e yazmak için ALLOW_PROD_WRITE=true olmalı");
    return SHEET_ID;
  }
}

async function getAuth() {
  if (!SERVICE_ACCOUNT_FILE || !fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    fail(
      "SERVICE_ACCOUNT_FILE bulunamadı veya erişilemiyor: " +
        SERVICE_ACCOUNT_FILE,
    );
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return await auth.getClient();
}

function readExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
}

async function writeToSheet(sheets, spreadsheetId, sheetName, rows) {
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
      console.log(`[DRY RUN] ${sheetName} [${i + 1}-${Math.min(i + BATCH, rows.length)} / ${rows.length}] (yazma simülasyonu)`);
    } else {
      console.log(`Yaziliyor: ${sheetName} [${i + 1}-${Math.min(i + BATCH, rows.length)} / ${rows.length}]`);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: range,
        valueInputOption: "RAW",
        requestBody: { values: batch },
      });
    }
  }
  console.log(`  ✓ ${sheetName}: ${rows.length - 1} veri satiri ${DRY_RUN === "true" ? "(DRY RUN)" : "yazildi"}`);
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = getTargetSheetId();

  // ─── SATIS VERISI ─────────────────────────────────────────────────────
  console.log("\n═══ SATIS VERİSİ ═══");
  console.log(`Kaynak: ${path.basename(SALES_FILE)}`);
  const salesData = readExcel(SALES_FILE);
  console.log(`Satir: ${salesData.length - 1}, Kolon: ${salesData[0].length}`);
  await writeToSheet(sheets, spreadsheetId, "_IMPORT_SALES", salesData);

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
  await writeToSheet(sheets, spreadsheetId, "_IMPORT_STOCK", filteredStock);

  console.log("\n═══ TAMAMLANDI ═══\n");
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
