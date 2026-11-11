import { TimeRecord, SheetApiResponse } from "@/types/sheets";

/**
 * MEGA Code Clock - Google Sheets Client Library
 *
 * ทำหน้าที่เป็นศูนย์กลางการสื่อสารกับ Google Sheets:
 * 1. เรียกผ่าน Server Proxy `/api/sheets` (ป้องกัน CORS และติดตาม redirect ได้ 100%)
 * 2. หากรันในโหมด Static Export หรือ Offline จะ Fallback ไปยัง Direct Fetch ให้อัตโนมัติ
 */

export async function pingGoogleSheets(webAppUrl?: string): Promise<SheetApiResponse> {
  const query = new URLSearchParams({ action: "ping" });
  if (webAppUrl?.trim()) {
    query.set("webAppUrl", webAppUrl.trim());
  }

  try {
    const res = await fetch(`/api/sheets?${query.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    return await res.json();
  } catch {
    // Fallback direct request
    if (webAppUrl?.trim()) {
      const sep = webAppUrl.includes("?") ? "&" : "?";
      const fallbackRes = await fetch(`${webAppUrl}${sep}action=ping`, {
        method: "GET",
      });
      return await fallbackRes.json();
    }
    throw new Error("ไม่สามารถเชื่อมต่อ Google Sheets ได้");
  }
}

export async function fetchAllRecordsFromSheets(webAppUrl?: string): Promise<TimeRecord[]> {
  const query = new URLSearchParams({ action: "getAll" });
  if (webAppUrl?.trim()) {
    query.set("webAppUrl", webAppUrl.trim());
  }

  const res = await fetch(`/api/sheets?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  const data: SheetApiResponse<TimeRecord[]> = await res.json();
  if (data.status === "success" && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

export async function addRecordToSheets(
  record: TimeRecord,
  webAppUrl?: string
): Promise<SheetApiResponse> {
  try {
    const res = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", record, webAppUrl }),
    });
    return await res.json();
  } catch {
    // Direct Fallback with no-cors for client-only environments
    if (webAppUrl?.trim()) {
      await fetch(webAppUrl.trim(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "add", record }),
      });
      return { status: "success", message: "ส่งข้อมูลแล้ว (Direct fallback)" };
    }
    throw new Error("ไม่มี URL สำหรับส่งข้อมูลเข้า Google Sheets");
  }
}

export async function batchAddRecordsToSheets(
  records: TimeRecord[],
  webAppUrl?: string
): Promise<SheetApiResponse> {
  try {
    const res = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "batchAdd", records, webAppUrl }),
    });
    return await res.json();
  } catch {
    if (webAppUrl?.trim()) {
      await fetch(webAppUrl.trim(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "batchAdd", records }),
      });
      return { status: "success", message: "ส่งข้อมูลแบบกลุ่มแล้ว (Direct fallback)" };
    }
    throw new Error("ไม่มี URL สำหรับส่งข้อมูลเข้า Google Sheets");
  }
}

export async function updateRecordInSheets(
  record: TimeRecord,
  webAppUrl?: string
): Promise<SheetApiResponse> {
  try {
    const res = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: record.id, record, webAppUrl }),
    });
    return await res.json();
  } catch {
    if (webAppUrl?.trim()) {
      await fetch(webAppUrl.trim(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "update", id: record.id, record }),
      });
      return { status: "success", message: "อัปเดตข้อมูลแล้ว (Direct fallback)" };
    }
    throw new Error("ไม่มี URL สำหรับอัปเดตข้อมูล");
  }
}

export async function deleteRecordFromSheets(
  id: string,
  webAppUrl?: string
): Promise<SheetApiResponse> {
  try {
    const res = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id, webAppUrl }),
    });
    return await res.json();
  } catch {
    if (webAppUrl?.trim()) {
      await fetch(webAppUrl.trim(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "delete", id }),
      });
      return { status: "success", message: "ลบข้อมูลแล้ว (Direct fallback)" };
    }
    throw new Error("ไม่มี URL สำหรับลบข้อมูล");
  }
}
