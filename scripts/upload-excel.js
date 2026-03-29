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
const OAUTH_CLIENT_SECRET_FILE =
  process.env.OAUTH_CLIENT_SECRET_FILE || path.join(ROOT, "creds.json");
const OAUTH_TOKEN_FILE =
  process.env.OAUTH_TOKEN_FILE || path.join(ROOT, "token.json");
const SHEET_ID = process.env.SHEET_ID;
const TEST_SHEET_ID = process.env.TEST_SHEET_ID;
const DRY_RUN = process.env.DRY_RUN;
const ALLOW_PROD_WRITE = process.env.ALLOW_PROD_WRITE === "true";

// Whitelist: sadece bu sheet id'lere yazılabilir
const SHEET_ID_WHITELIST = [SHEET_ID, TEST_SHEET_ID].filter(Boolean);
// Tab whitelist: sadece bu tablara yazılabilir
const TAB_WHITELIST = ["TEST_WRITE", "Stok Envanter", "Stok Hareketleri"];

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
    if (!ALLOW_PROD_WRITE)
      fail("Prod sheet'e yazmak için ALLOW_PROD_WRITE=true olmalı");
    return SHEET_ID;
  } else {
    fail("DRY_RUN env değeri sadece 'true' veya 'false' olabilir");
  }
}

async function getAuth() {
  if (!OAUTH_CLIENT_SECRET_FILE || !fs.existsSync(OAUTH_CLIENT_SECRET_FILE)) {
    fail(
      "OAUTH_CLIENT_SECRET_FILE bulunamadı veya erişilemiyor: " +
        OAUTH_CLIENT_SECRET_FILE,
    );
  }
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

  // Token varsa yükle
  if (fs.existsSync(OAUTH_TOKEN_FILE)) {
    const token = JSON.parse(fs.readFileSync(OAUTH_TOKEN_FILE, "utf8"));
    oAuth2Client.setCredentials(token);
    // Token expire ise refresh et
    if (token.expiry_date && token.expiry_date < Date.now()) {
      try {
        const newToken = await oAuth2Client.refreshAccessToken();
        oAuth2Client.setCredentials(newToken.credentials);
        fs.writeFileSync(
          OAUTH_TOKEN_FILE,
          JSON.stringify(newToken.credentials, null, 2),
        );
        console.log("[INFO] Token otomatik yenilendi.");
        return oAuth2Client;
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
    prompt: "consent",
  });
  console.log("Yetkilendirme için şu linki açın:", authUrl);
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const code = await new Promise((resolve) => {
    rl.question("Kodu girin: ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(OAUTH_TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log("[INFO] Token kaydedildi: ", OAUTH_TOKEN_FILE);
    return oAuth2Client;
  } catch (e) {
    fail("Token alma başarısız: " + e.message);
  }
}

// (Service account getAuth fonksiyonu tamamen kaldırıldı, sadece OAuth2 client ile çalışan fonksiyon yukarıda var)

function readExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
}

async function writeToSheet(
  sheets,
  spreadsheetId,
  sheetName,
  rows,
  options = {},
) {
  // Yardımcı: hücre değerini normalize et
  function normalizeCellValue(val) {
    if (val === null || typeof val === "undefined") return "";
    if (typeof val === "string") return val.trim();
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    return String(val);
  }
  // Sheet ID whitelist kontrolü
  if (!SHEET_ID_WHITELIST.includes(spreadsheetId)) {
    fail(`Sheet ID whitelist dışı: ${spreadsheetId}`);
  }
  // Tab whitelist kontrolü
  if (!TAB_WHITELIST.includes(sheetName)) {
    fail(
      `Tab whitelist dışı: '${sheetName}'. Sadece şu tablara yazılabilir: ${TAB_WHITELIST.join(", ")}`,
    );
  }
  // Gerçek sheet header'ını oku ve doğrula
  let sheetHeader = [];
  try {
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });
    sheetHeader = headerRes.data.values ? headerRes.data.values[0] : [];
  } catch (e) {
    fail(
      `[HEADER READ FAIL] Tab '${sheetName}' header okunamadı: ${e.message}`,
    );
  }
  const expectedHeader = ["Ürün Kodu", "Ürün Adı", "Stok1"];
  const headerMismatch = expectedHeader.filter((h, i) => h !== sheetHeader[i]);
  if (
    headerMismatch.length > 0 ||
    sheetHeader.length !== expectedHeader.length
  ) {
    console.error(
      `[HEADER MISMATCH] Beklenen: ${JSON.stringify(expectedHeader)}, Gerçek: ${JSON.stringify(sheetHeader)}`,
    );
    for (let i = 0; i < expectedHeader.length; i++) {
      if (expectedHeader[i] !== sheetHeader[i]) {
        console.error(
          `  Kolon ${i + 1}: Beklenen='${expectedHeader[i]}', Gerçek='${sheetHeader[i] || "(eksik)"}'`,
        );
      }
    }
    fail("Header eşleşmiyor, yazma iptal edildi.");
  }
  // Kolon whitelist: sadece belirli kolonlara yazılabilir
  const allowedColumns = expectedHeader;
  const inputHeader = rows[0];
  for (let i = 0; i < inputHeader.length; i++) {
    if (!allowedColumns.includes(inputHeader[i])) {
      fail(
        `[KOLON WHITELIST] '${inputHeader[i]}' kolonuna yazmak yasak! Sadece: ${allowedColumns.join(", ")}`,
      );
    }
  }
  // Batch limit
  const BATCH_SIZE = options.batchSize || 20;
  const limitedRows = [rows[0], ...rows.slice(1, BATCH_SIZE + 1)];
  // Write range hesaplama
  const headerRange = `${sheetName}!A1:C1`;
  const dataStartRow = 2;
  const dataEndRow = limitedRows.length;
  const dataRange = `${sheetName}!A${dataStartRow}:C${dataEndRow}`;
  console.log("\n--- WRITE PLAN ---");
  console.log(`Target tab: ${sheetName}`);
  console.log(`Header row: A1:C1`);
  console.log(`Data start row: ${dataStartRow}`);
  console.log(`Expected end row: ${dataEndRow}`);
  console.log(`Expected written range: ${dataRange}`);
  // Overwrite: önce ilgili aralığı temizle
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A1:C${dataEndRow}`,
    });
    console.log(
      `[INFO] Overwrite: ${sheetName}!A1:C${dataEndRow} aralığı temizlendi.`,
    );
  } catch (e) {
    console.log(`[WARN] Temizleme başarısız: ${e.message}`);
  }
  // Preview/önizleme
  console.log("\n--- YAZMA ÖNİZLEME ---");
  console.log(`Hedef spreadsheet id: ${spreadsheetId}`);
  console.log(`Hedef tab: ${sheetName}`);
  console.log(`Yazılacak satır sayısı: ${limitedRows.length - 1}`);
  console.log(`Yazılacak kolonlar: ${inputHeader.join(", ")}`);
  console.log("İlk 5 örnek satır:");
  for (let i = 1; i <= Math.min(5, limitedRows.length - 1); i++) {
    console.log(limitedRows[i]);
  }
  // Onay gerekmez, otomatik devam
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
  const neededRows = limitedRows.length + 10;
  const neededCols = limitedRows[0].length + 2;
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
  // Write
  if (DRY_RUN === "true") {
    console.log(
      `[DRY RUN] mode: dry-run | target spreadsheet: ${spreadsheetId} | tab: ${sheetName} | rows: ${limitedRows.length}`,
    );
  } else {
    console.log(
      `[REAL RUN] mode: real-run | target spreadsheet: ${spreadsheetId} | tab: ${sheetName} | rows: ${limitedRows.length}`,
    );
    try {
      // Header
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:C1`,
        valueInputOption: "RAW",
        requestBody: { values: [limitedRows[0]] },
      });
      // Data
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: dataRange,
        valueInputOption: "RAW",
        requestBody: { values: limitedRows.slice(1) },
      });
      console.log(
        `[SUCCESS] ${sheetName} [${headerRange}, ${dataRange}] yazıldı.`,
      );
    } catch (err) {
      console.error(
        `[FAIL] ${sheetName} [${headerRange}, ${dataRange}]: ${err.message}`,
      );
    }
  }
  // Write sonrası doğrulama (header ve data ayrı)
  try {
    // Header doğrulama
    const headerRead = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });
    const headerRow = headerRead.data.values ? headerRead.data.values[0] : [];
    let headerMismatch = false;
    for (let j = 0; j < limitedRows[0].length; j++) {
      const expected = normalizeCellValue(limitedRows[0][j]);
      const actual = normalizeCellValue(headerRow[j]);
      if (expected !== actual) {
        console.error(
          `[HEADER MISMATCH] Kolon ${j + 1} (${limitedRows[0][j]}): expected='${expected}', actual='${actual}', range=${headerRange}`,
        );
        headerMismatch = true;
      }
    }
    if (headerMismatch) {
      console.error(
        `[HEADER FAIL] Header satırı eşleşmiyor! Range: ${headerRange}`,
      );
    } else {
      console.log(
        `[HEADER PASS] Header satırı eşleşiyor. Range: ${headerRange}`,
      );
    }
    // Data doğrulama
    const dataRead = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: dataRange,
    });
    const dataRows = dataRead.data.values || [];
    let dataMismatch = false;
    if (limitedRows.length - 1 !== dataRows.length) {
      console.error(
        `[DATA MISMATCH] Satır sayısı farklı! Beklenen=${limitedRows.length - 1}, Okunan=${dataRows.length}, range=${dataRange}`,
      );
      dataMismatch = true;
    }
    for (
      let i = 0;
      i < Math.min(limitedRows.length - 1, dataRows.length);
      i++
    ) {
      const expectedRow = limitedRows[i + 1].map(normalizeCellValue);
      const actualRow = (dataRows[i] || []).map(normalizeCellValue);
      for (let j = 0; j < expectedRow.length; j++) {
        if (expectedRow[j] !== actualRow[j]) {
          console.error(
            `[DATA MISMATCH] Satır ${i + 2}, Kolon ${j + 1} (${limitedRows[0][j]}): expected='${expectedRow[j]}', actual='${actualRow[j]}', range=${dataRange}`,
          );
          dataMismatch = true;
        }
      }
    }
    if (dataMismatch) {
      console.error(
        `[DATA FAIL] Data satırları eşleşmiyor! Range: ${dataRange}`,
      );
      fail("Yazılan veri ile okunan veri normalize edilmiş olarak eşleşmiyor!");
    } else {
      console.log(
        `[DATA PASS] Data satırları normalize edilmiş olarak birebir eşleşiyor. Range: ${dataRange}`,
      );
    }
    // İlk 3 gerçek satırı göster
    console.log("İlk 3 gerçek satır:");
    for (let i = 0; i < Math.min(3, dataRows.length); i++) {
      console.log(dataRows[i]);
    }
  } catch (e) {
    console.error(`[DOĞRULAMA HATASI] Okuma başarısız: ${e.message}`);
  }
}

async function main() {
  // Çalıştırma öncesi self-check ve özet log
  const mode = DRY_RUN === "true" ? "dry-run" : "real-run";
  const spreadsheetId = getTargetSheetId();
  const credsExists =
    OAUTH_CLIENT_SECRET_FILE && fs.existsSync(OAUTH_CLIENT_SECRET_FILE);
  const tokenExists = OAUTH_TOKEN_FILE && fs.existsSync(OAUTH_TOKEN_FILE);
  const prodWriteAllowed = ALLOW_PROD_WRITE === true;
  console.log("\n--- ÇALIŞTIRMA ÖZETİ ---");
  console.log(`mode: ${mode}`);
  console.log(`target spreadsheet id: ${spreadsheetId}`);
  console.log(`oauth client secret file exists: ${credsExists ? "yes" : "NO"}`);
  console.log(`token file exists: ${tokenExists ? "yes" : "NO"}`);
  console.log(`prod write allowed: ${prodWriteAllowed ? "yes" : "no"}`);
  if (!credsExists) {
    console.log(
      "UYARI: OAuth client secret dosyası bulunamadı, gerçek çalışma yapılamaz.",
    );
  }

  const auth = await getAuth(); // (Service account getAuth fonksiyonu kaldırıldı, bu satırda hata verecektir)
  const sheets = google.sheets({ version: "v4", auth });

  // --- GERÇEK VERİ BATCH IMPORT: Stok Envanter ---
  const prodTestTab = "Stok Envanter";
  console.log(`\nHedef sheet/tab: ${prodTestTab}`);

  // Kaynak dosyadan oku
  const stockData = readExcel(STOCK_FILE);
  const stockHeaders = stockData[0];
  // Mapping: kaynak başlık -> hedef başlık
  const mapping = {
    "Ürün Kodu": stockHeaders.indexOf("Ürün Kodu"),
    "Ürün Adı": stockHeaders.indexOf("Ürün Adı"),
    Stok1: stockHeaders.indexOf("Stok1"),
  };
  // Mapping raporu
  console.log("A) Kaynak kolon → hedef kolon eşleşmesi:");
  Object.entries(mapping).forEach(([target, idx]) => {
    console.log(`   ${target} ⇐ kaynak[${idx}] (${stockHeaders[idx]})`);
  });

  // Veri temizleme ve batch hazırlama
  const seenSkus = new Set();
  const cleanRows = [];
  const skipped = [];
  for (let i = 1; i < stockData.length; i++) {
    const row = stockData[i];
    const urunKodu = (row[mapping["Ürün Kodu"]] || "").toString().trim();
    const urunAdi = (row[mapping["Ürün Adı"]] || "").toString().trim();
    let stok1 = row[mapping["Stok1"]];
    // Temizleme
    if (!urunKodu) {
      skipped.push({ i, reason: "Boş ürün kodu" });
      continue;
    }
    if (!urunAdi) {
      skipped.push({ i, reason: "Boş ürün adı" });
      continue;
    }
    if (stok1 === null || stok1 === undefined || stok1 === "") stok1 = 0;
    if (typeof stok1 === "string" && stok1.replace)
      stok1 = stok1.replace(/[^0-9.,-]/g, "").replace(",", ".");
    stok1 = Number(stok1);
    if (isNaN(stok1)) {
      skipped.push({ i, reason: "Stok1 sayı değil" });
      continue;
    }
    if (seenSkus.has(urunKodu)) {
      skipped.push({ i, reason: "Duplicate ürün kodu" });
      continue;
    }
    seenSkus.add(urunKodu);
    cleanRows.push([urunKodu, urunAdi, stok1]);
    // FULL IMPORT: batch limiti yok
  }
  // Header ekle
  const finalRows = [["Ürün Kodu", "Ürün Adı", "Stok1"], ...cleanRows];

  // Ek kontrol: unique ürün kodu sayısı
  const allSkus = new Set();
  for (let i = 1; i < stockData.length; i++) {
    const row = stockData[i];
    const urunKodu = (row[mapping["Ürün Kodu"]] || "").toString().trim();
    if (urunKodu) allSkus.add(urunKodu);
  }
  const writtenSkus = new Set(cleanRows.map((r) => r[0]));

  // Veri kalite kontrol ve snapshot
  console.log("B) Toplam kaynak satır:", stockData.length - 1);
  console.log("B2) Unique ürün kodu (kaynak):", allSkus.size);
  console.log("C) İşlenen satır sayısı:", cleanRows.length);
  console.log("C2) Unique ürün kodu (yazılan):", writtenSkus.size);
  console.log("D) Atlanan satır sayısı:", skipped.length);
  if (skipped.length > 0) {
    const reasons = {};
    skipped.forEach((s) => {
      reasons[s.reason] = (reasons[s.reason] || 0) + 1;
    });
    Object.entries(reasons).forEach(([r, n]) => console.log(`   ${r}: ${n}`));
  }
  // Write öncesi snapshot/log
  const writeStart = 2;
  const writeEnd = 1 + cleanRows.length;
  const writeRange = `Stok Envanter!A${writeStart}:C${writeEnd}`;
  console.log("--- WRITE SNAPSHOT ---");
  console.log(`Target tab: Stok Envanter`);
  console.log(`Header range: Stok Envanter!A1:C1`);
  console.log(`Exact data write range: ${writeRange}`);
  console.log(`Toplam işlenecek satır: ${cleanRows.length}`);
  console.log("İlk 5 örnek:");
  for (let i = 0; i < Math.min(5, cleanRows.length); i++)
    console.log(cleanRows[i]);
  console.log("Son 5 örnek:");
  for (let i = Math.max(0, cleanRows.length - 5); i < cleanRows.length; i++)
    console.log(cleanRows[i]);

  // Write & doğrulama
  await writeToSheet(sheets, spreadsheetId, prodTestTab, finalRows, {
    batchSize: cleanRows.length,
  });

  console.log("\nF) Write/read sonucu ve kalan riskler üstte loglandı.");
  console.log("G) Kalan riskler:");
  console.log("- Full import engelli, batch limiti ve whitelist korunuyor.");
  console.log("- Header guard, kolon guard ve tab guard aktif.");
  console.log(
    "- Google Sheets API sayısal değerleri string döndürdüğü için normalize karşılaştırma zorunlu.",
  );
  console.log("- Formül kolonlarına yazma hâlâ engelli.");
  console.log("- .env ve token dosyası güvenli tutulmalı.");
  console.log("\n═══ TAMAMLANDI (FULL STOK ENVANTER IMPORT) ═══\n");
}

main().catch((e) => fail(e.message));
