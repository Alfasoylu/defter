#!/usr/bin/env node
/**
 * entegra-tum-siparisler.xlsx dosyasından satış verisini Google Sheets'e güvenli şekilde import eder.
 * - Batch/chunk ile çalışır, full import yapmaz.
 * - Temizleme, duplicate, mapping, header guard, readback, loglama içerir.
 * - Stok pipeline'ına dokunmaz.
 */

const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const { google } = require("googleapis");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const ROOT = path.resolve(__dirname, "..");
const SALES_FILE = path.join(ROOT, "docs", "entegra-tum-siparisler.xlsx");
const OAUTH_CLIENT_SECRET_FILE = path.join(ROOT, "creds.json");
const OAUTH_TOKEN_FILE = path.join(ROOT, "token.json");
const SHEET_ID = process.env.SHEET_ID;
const TEST_SHEET_ID = process.env.TEST_SHEET_ID;
const DRY_RUN = process.env.DRY_RUN;
const ALLOW_PROD_WRITE = process.env.ALLOW_PROD_WRITE === "true";

// Whitelist: sadece bu sheet id'lere yazılabilir
const SHEET_ID_WHITELIST = [SHEET_ID, TEST_SHEET_ID].filter(Boolean);
// Tab whitelist: sadece bu tablara yazılabilir
const TAB_WHITELIST = [
  "Ham Siparişler",
  "Temiz Satış Verisi",
  "Aylık USD Kurları",
  "Ürün Satış Özeti",
  "Pazaryeri Performansı",
  "Satışsız Stok Analizi",
  "Aksiyon Merkezi",
];

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
  if (fs.existsSync(OAUTH_TOKEN_FILE)) {
    const token = JSON.parse(fs.readFileSync(OAUTH_TOKEN_FILE, "utf8"));
    oAuth2Client.setCredentials(token);
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

function readExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
}

// ŞABLON: Temiz Satış Verisi header
const CLEAN_SALES_HEADER = [
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
];

// ŞABLON: Aylık USD Kurları header
const USD_RATES_HEADER = ["Ay (YYYY-MM)", "USDTRY", "Manuel Giriş"];

// ŞABLON: Ham Siparişler header (ilk 60 satırdan otomatik alınacak)

module.exports = {
  getAuth,
  readExcel,
  CLEAN_SALES_HEADER,
  USD_RATES_HEADER,
  SHEET_ID_WHITELIST,
  TAB_WHITELIST,
  fail,
};
