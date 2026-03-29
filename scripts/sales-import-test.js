// Türkçe tarih stringini Date nesnesine çevirir (örn. 31.12.2025)
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }
    return parsed;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Date nesnesinden "YYYY-MM" formatında ay bilgisini döndürür
function getMonth(date) {
  if (!date || !(date instanceof Date)) return "";
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
}
// Excel'den belirli aralıktaki satırları batch olarak döndürür
function* excelBatchRowsRange(startRow, batchSize) {
  const wb = XLSX.readFile(SALES_FILE, {sheetStubs:true});
  const ws = wb.Sheets[wb.SheetNames[0]];
  let i = startRow; // 1-based, 1. satır header
  let count = 0;
  while (count < batchSize) {
    let r = [];
    for (let c = 0; c < 80; c++) {
      r.push(ws[String.fromCharCode(65 + c) + i] ? ws[String.fromCharCode(65 + c) + i].v : "");
    }
    if (r.every(x => x === "")) break;
    yield r;
    i++;
    count++;
  }
}
// 500 satırlık test batch import: entegra-tum-siparisler.xlsx -> Temiz Satış Verisi
// Tüm veri temizleme, mapping, duplicate, skip reason, header guard, readback, loglama aktif

const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const { google } = require("googleapis");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const ROOT = path.resolve(__dirname, "..");
const SALES_FILE = path.join(ROOT, "docs", "entegra-tum-siparisler.xlsx");
const OAUTH_CLIENT_SECRET_FILE = path.join(ROOT, "creds.json");
const OAUTH_TOKEN_FILE = path.join(ROOT, "token.json");
const SHEET_ID = process.env.DRY_RUN === "true" ? process.env.TEST_SHEET_ID : process.env.SHEET_ID;

const TAB = "Temiz Satış Verisi";
const HEADER = [
  "Sipariş Tarihi","Satış Ayı","Pazaryeri","Stok Kodu","Ürün Adı","Miktar","Satış Fiyatı TL","USD Kuru","Satış Fiyatı USD","Unique Key"
];

function fail(msg) { console.error("[FATAL] "+msg); process.exit(1); }


async function getAuth() {
  const credsRaw = fs.readFileSync(OAUTH_CLIENT_SECRET_FILE, "utf8");
  const creds = JSON.parse(credsRaw).installed || JSON.parse(credsRaw).web || JSON.parse(credsRaw);
  const { client_id, client_secret, redirect_uris } = creds;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, (redirect_uris && redirect_uris[0]) || "http://localhost",
  );
  const token = JSON.parse(fs.readFileSync(OAUTH_TOKEN_FILE, "utf8"));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const batchSize = 100;
  let batchIndex = 0;
  let totalRows = 0;
  let totalWritten = 0;
  let totalSkipped = 0;
  let rowOffset = 2; // A2'den başla
  let excelRow = 2; // Excel'de veri satırı
  let done = false;
  const wb = XLSX.readFile(SALES_FILE, {sheetStubs:true});
  const ws = wb.Sheets[wb.SheetNames[0]];
  while (!done) {
    const cleanRows = [];
    const skipped = [];
    let i = 0;
    for (const r of excelBatchRowsRange(excelRow, batchSize)) {
      const tarih = parseDate(r[0]); // A (tarih)
      const ay = getMonth(tarih);
      const pazar = r[1] ? String(r[1]).trim() : ""; // B
      let fiyatTL = Number(r[2]); // C
      if (!isNaN(fiyatTL)) fiyatTL = fiyatTL.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2});
      const stok = r[3] ? String(r[3]).trim() : ""; // D
      const urun = r[4] ? String(r[4]).trim() : ""; // E
      const miktar = 1;
      if (!stok) { skipped.push({i, reason:"Boş stok kodu"}); i++; continue; }
      if (!tarih) { skipped.push({i, reason:"Boş/geçersiz tarih"}); i++; continue; }
      if (!fiyatTL || isNaN(Number(r[2]))) { skipped.push({i, reason:"Fiyat parse edilemez"}); i++; continue; }
      cleanRows.push([tarih, ay, pazar, stok, urun, miktar, fiyatTL, "", "", ""]);
      i++;
    }
    if (cleanRows.length === 0 && skipped.length === 0) break;
    // Header guard (ilk batch'te kontrol et)
    if (batchIndex === 0) {
      const sheetHeader = (await sheets.spreadsheets.values.get({spreadsheetId:SHEET_ID,range:`${TAB}!A1:J1`})).data.values[0];
      for (let i=0;i<HEADER.length;i++) if (HEADER[i]!==sheetHeader[i]) fail(`[HEADER MISMATCH] ${HEADER[i]} != ${sheetHeader[i]}`);
    }
    // Write
    const writeRange = `${TAB}!A${rowOffset}:J${rowOffset+cleanRows.length-1}`;
    if (cleanRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: writeRange,
        valueInputOption: "RAW",
        requestBody: { values: cleanRows }
      });
      // Readback
      const readRows = (await sheets.spreadsheets.values.get({spreadsheetId:SHEET_ID,range:writeRange})).data.values;
      let pass = true;
      for (let i=0;i<cleanRows.length;i++) {
        for (let j=0;j<HEADER.length;j++) {
          let expected = String(cleanRows[i][j]);
          let actual = String((readRows[i]||[])[j]||"");
          if (HEADER[j]==="Satış Fiyatı TL") {
            expected = expected.replace(".", ",");
            actual = actual.replace(".", ",");
          }
          if (expected!==actual) {
            console.error(`[MISMATCH] Row ${rowOffset+i} Col ${HEADER[j]}: ${expected} != ${actual}`);
            pass = false;
          }
        }
      }
      console.log(`[BATCH ${batchIndex+1}] Write range: ${writeRange} | Satır: ${cleanRows.length} | Readback: ${pass?"PASS":"FAIL"}`);
    }
    totalRows += cleanRows.length + skipped.length;
    totalWritten += cleanRows.length;
    totalSkipped += skipped.length;
    rowOffset += cleanRows.length;
    excelRow += batchSize;
    batchIndex++;
    if (cleanRows.length < batchSize && skipped.length < batchSize) done = true;
    await new Promise(res=>setTimeout(res, 1000)); // Her batch arası 1sn bekle
  }
  // Özet log
  console.log(`TAMAM: Toplam okunan: ${totalRows}, yazılan: ${totalWritten}, atlanan: ${totalSkipped}`);
}

main().catch(e=>{console.error(e);process.exit(1);});
