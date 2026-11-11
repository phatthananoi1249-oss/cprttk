import { NextRequest, NextResponse } from "next/server";
import { SheetApiRequestPayload, SheetApiResponse } from "@/types/sheets";
import {
  hasServiceAccountKey,
  fetchAllFromServiceAccount,
  appendRecordsWithServiceAccount,
  ensureSheetSetup,
} from "@/lib/google-service-account";

/**
 * Next.js Server-Side Proxy Route for Google Sheets API / Apps Script
 * Path: /api/sheets
 *
 * รองรับ 2 โหมดการเชื่อมต่ออัตโนมัติ:
 * 1. Google Cloud Service Account (เมื่อมีไฟล์ key.json และกำหนด GOOGLE_SHEET_ID ใน .env.local)
 * 2. Google Apps Script Web App (เมื่อมี GOOGLE_SHEETS_WEBAPP_URL หรือผู้ใช้ระบุ URL ในหน้าเว็บ)
 */

function resolveTargetUrl(clientUrl?: string): string {
  return (
    process.env.GOOGLE_SHEETS_WEBAPP_URL?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL?.trim() ||
    clientUrl?.trim() ||
    ""
  );
}

function getSpreadsheetId(): string {
  return (
    process.env.GOOGLE_SHEET_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID?.trim() ||
    ""
  );
}

// GET: ทดสอบการเชื่อมต่อ (ping) หรือดึงข้อมูลทั้งหมด (getAll)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "getAll";
    const clientUrl = searchParams.get("webAppUrl") || undefined;
    const spreadsheetId = getSpreadsheetId();

    // 1. ตรวจสอบว่าเปิดใช้ Service Account ผ่าน key.json หรือไม่
    if (spreadsheetId && hasServiceAccountKey()) {
      if (action === "ping") {
        await ensureSheetSetup(spreadsheetId);
        return NextResponse.json<SheetApiResponse>({
          status: "success",
          message: "Google Sheets Service Account API พร้อมใช้งาน",
          sheetName: "TimeRecords",
          timestamp: new Date().toISOString(),
        });
      }

      const records = await fetchAllFromServiceAccount(spreadsheetId);
      return NextResponse.json<SheetApiResponse>({
        status: "success",
        total: records.length,
        data: records,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. ใช้ Google Apps Script Web App Proxy
    const targetUrl = resolveTargetUrl(clientUrl);

    if (!targetUrl) {
      return NextResponse.json<SheetApiResponse>(
        {
          status: "error",
          message: "ยังไม่ได้ตั้งค่าการเชื่อมต่อ (กรุณาระบุ GOOGLE_SHEET_ID หรือ GOOGLE_SHEETS_WEBAPP_URL ใน .env.local)",
        },
        { status: 400 }
      );
    }

    const separator = targetUrl.includes("?") ? "&" : "?";
    const remoteUrl = `${targetUrl}${separator}action=${encodeURIComponent(action)}`;

    const response = await fetch(remoteUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json<SheetApiResponse>(
        {
          status: "error",
          message: `Google Sheets API ตอบกลับสถานะ HTTP ${response.status}: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets";
    return NextResponse.json<SheetApiResponse>(
      { status: "error", message },
      { status: 500 }
    );
  }
}

// POST: เพิ่ม (add, batchAdd), แก้ไข (update), ลบ (delete)
export async function POST(request: NextRequest) {
  try {
    const body: SheetApiRequestPayload = await request.json();
    const spreadsheetId = getSpreadsheetId();

    // 1. โหมด Service Account
    if (spreadsheetId && hasServiceAccountKey()) {
      if (body.action === "add" && body.record) {
        await appendRecordsWithServiceAccount(spreadsheetId, [body.record]);
        return NextResponse.json<SheetApiResponse>({
          status: "success",
          message: "บันทึกข้อมูลลง Google Sheet ผ่าน Service Account สำเร็จ",
        });
      }

      if (body.action === "batchAdd" && body.records && body.records.length > 0) {
        await appendRecordsWithServiceAccount(spreadsheetId, body.records);
        return NextResponse.json<SheetApiResponse>({
          status: "success",
          count: body.records.length,
          message: `บันทึกข้อมูล ${body.records.length} รายการลง Google Sheet สำเร็จ`,
        });
      }
    }

    // 2. โหมด Google Apps Script Web App
    const targetUrl = resolveTargetUrl(body.webAppUrl);

    if (!targetUrl) {
      return NextResponse.json<SheetApiResponse>(
        {
          status: "error",
          message: "ยังไม่ได้ระบุ Google Sheets Web App URL หรือ GOOGLE_SHEET_ID",
        },
        { status: 400 }
      );
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(body),
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json<SheetApiResponse>(
        {
          status: "error",
          message: `Google Sheets API ตอบกลับสถานะ HTTP ${response.status}`,
        },
        { status: response.status }
      );
    }

    const text = await response.text();
    let resultJson: SheetApiResponse;
    try {
      resultJson = JSON.parse(text);
    } catch {
      // กรณี Google ตอบกลับเป็นข้อความล้วนหรือ redirect
      resultJson = {
        status: "success",
        message: "ส่งข้อมูลไปยัง Google Sheets สำเร็จ",
      };
    }

    return NextResponse.json(resultJson);
  } catch (error) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Google Sheets";
    return NextResponse.json<SheetApiResponse>(
      { status: "error", message },
      { status: 500 }
    );
  }
}
