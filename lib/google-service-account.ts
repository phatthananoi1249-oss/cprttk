import crypto from "crypto";
import fs from "fs";
import path from "path";
import { TimeRecord } from "@/types/sheets";

/**
 * MEGA Code Clock - Google Cloud Service Account Authentication
 *
 * ทำการตรวจสอบสิทธิ์ผ่านไฟล์ key.json โดยใช้ OAuth 2.0 JWT Bearer Token
 * โดยใช้ Node.js built-in `crypto` 100% (ไม่ต้องติดตั้งแพ็กเกจภายนอกเพิ่ม)
 */

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export function hasServiceAccountKey(): boolean {
  try {
    const keyPath = path.join(process.cwd(), "key.json");
    return fs.existsSync(keyPath);
  } catch {
    return false;
  }
}

export function getServiceAccountEmail(): string | null {
  try {
    const keyPath = path.join(process.cwd(), "key.json");
    if (!fs.existsSync(keyPath)) return null;
    const key: ServiceAccountKey = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    return key.client_email || null;
  } catch {
    return null;
  }
}

export async function getGoogleServiceAccountToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // ใช้ Token ที่แคชไว้ถ้ายังไม่หมดอายุ
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const keyPath = path.join(process.cwd(), "key.json");
  if (!fs.existsSync(keyPath)) {
    throw new Error("ไม่พบไฟล์ key.json ในโฟลเดอร์โปรเจกต์");
  }

  const key: ServiceAccountKey = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  if (!key.client_email || !key.private_key) {
    throw new Error("ไฟล์ key.json ไม่สมบูรณ์ (ขาด client_email หรือ private_key)");
  }

  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Url = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsignedToken = `${base64Url(header)}.${base64Url(claimSet)}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsignedToken);
  const signature = sign
    .sign(key.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const assertion = `${unsignedToken}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description || data.error || "ไม่สามารถขอ Access Token จาก Google ได้");
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600),
  };

  return data.access_token;
}

const SHEET_NAME = "TimeRecords";
const HEADERS = [
  "ID",
  "ลำดับ",
  "วันที่",
  "เวลา",
  "รอบ (Round)",
  "ชื่อ",
  "นามสกุล",
  "ชื่อ-นามสกุล",
  "รหัสประจำตัว",
  "การกระทำ",
  "เวลาสะสมในรอบ",
  "หมายเหตุ",
  "เวลาที่บันทึกลงระบบ"
];

/**
 * ตรวจสอบและสร้างหัวตาราง (Headers) หากชีตยังว่างเปล่า
 */
export async function ensureSheetSetup(spreadsheetId: string): Promise<void> {
  const token = await getGoogleServiceAccountToken();
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAME)}!A1:M1`;
  const res = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 404) {
    throw new Error(`ไม่พบ Google Spreadsheet ID: ${spreadsheetId}`);
  }

  const data = await res.json();
  if (!data.values || data.values.length === 0) {
    // ใส่ Headers
    const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAME)}!A1:M1?valueInputOption=USER_ENTERED`;
    await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [HEADERS] }),
    });
  }
}

/**
 * ดึงข้อมูลทั้งหมดจาก Google Sheet ผ่าน Service Account
 */
export async function fetchAllFromServiceAccount(spreadsheetId: string): Promise<TimeRecord[]> {
  const token = await getGoogleServiceAccountToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAME)}!A2:M`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Google Sheets API Error ${res.status}`);
  }

  const data = await res.json();
  const rows: (string | number)[][] = data.values || [];

  return rows.map((r, i) => ({
    id: String(r[0] || ""),
    no: Number(r[1]) || i + 1,
    date: String(r[2] || ""),
    time: String(r[3] || ""),
    timestamp: 0,
    round: String(r[4] || ""),
    firstName: String(r[5] || ""),
    lastName: String(r[6] || ""),
    fullName: String(r[7] || ""),
    code: String(r[8] || ""),
    actionType: (r[9] as TimeRecord["actionType"]) || "check_in",
    actionLabel: String(r[9] || ""),
    elapsedInRound: String(r[10] || ""),
    note: String(r[11] || ""),
    synced: true,
    syncTime: String(r[12] || ""),
  }));
}

/**
 * เพิ่มรายการแถวข้อมูลลงใน Google Sheet
 */
export async function appendRecordsWithServiceAccount(
  spreadsheetId: string,
  records: Partial<TimeRecord>[]
) {
  await ensureSheetSetup(spreadsheetId);
  const token = await getGoogleServiceAccountToken();
  const nowStr = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

  const values = records.map((r) => [
    r.id || `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    r.no || "",
    r.date || "",
    r.time || "",
    r.round || "รอบที่ 1",
    r.firstName || "",
    r.lastName || "",
    r.fullName || `${r.firstName || ""} ${r.lastName || ""}`.trim(),
    r.code || "",
    r.actionLabel || r.actionType || "บันทึกเวลา",
    r.elapsedInRound || "-",
    r.note || "",
    r.syncTime || nowStr,
  ]);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAME)}!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Append row failed with HTTP ${res.status}`);
  }

  return await res.json();
}
