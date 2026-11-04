/**
 * =========================================================================
 * MEGA Code Clock - Time Tracker & Google Sheets Database Backend
 * ระบบบันทึกเวลาปฏิบัติงานและกิจกรรม เชื่อมต่อ Google Sheets
 * =========================================================================
 * 
 * วิธีการติดตั้งและใช้งาน:
 * 1. เปิด Google Sheets เปล่าขึ้นมา
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. ลบโค้ดเดิมทั้งหมดใน Code.gs แล้ววางโค้ดนี้ลงไปทั้งหมด
 * 4. บันทึก (กด Ctrl+S หรือไอคอนแผ่นดิสก์)
 * 5. กดปุ่ม "การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้ใหม่" (New deployment)
 * 6. เลือกประเภทเป็น "เว็บแอป" (Web app)
 * 7. ตั้งค่า:
 *    - คำอธิบาย: MEGA Code Clock API
 *    - ปฏิบัติการในฐานะ: ฉัน (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง: ทุกคน (Anyone)  *** สำคัญมาก! ต้องเลือก Anyone เพื่อให้เว็บส่งข้อมูลได้โดยไม่ต้องล็อกอิน
 * 8. กด "ทำให้ใช้งานได้" (Deploy) แล้วคัดลอก "URL ของเว็บแอป" (Web App URL)
 * 9. นำ URL ไปวางในช่อง "ตั้งค่า Google Sheets" ในหน้าเว็บไซต์
 */

var SHEET_NAME = "TimeRecords";

// จัดการคำขอ GET (เช่น ดึงประวัติทั้งหมด หรือ ทดสอบเชื่อมต่อ)
function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";

    if (action === "ping") {
      return responseJson({
        status: "success",
        message: "Google Sheets API พร้อมใช้งาน",
        sheetName: sheet.getName(),
        totalRows: Math.max(0, sheet.getLastRow() - 1),
        timestamp: new Date().toISOString()
      });
    }

    // ดึงข้อมูลทั้งหมด
    var data = getAllRecords(sheet);
    return responseJson({
      status: "success",
      total: data.length,
      data: data
    });
  } catch (err) {
    return responseJson({ status: "error", message: err.toString() });
  }
}

// จัดการคำขอ POST (เพิ่ม, อัปเดต, ลบข้อมูล)
function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var body = {};

    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    var action = body.action || "add";

    if (action === "add") {
      var record = body.record || body;
      var newRow = addRecord(sheet, record);
      return responseJson({ status: "success", message: "บันทึกข้อมูลเรียบร้อยแล้ว", record: newRow });
    }

    if (action === "batchAdd") {
      var records = body.records || [];
      var added = [];
      for (var i = 0; i < records.length; i++) {
        added.push(addRecord(sheet, records[i]));
      }
      return responseJson({ status: "success", message: "บันทึกแบบกลุ่มเรียบร้อย " + added.length + " รายการ", count: added.length });
    }

    if (action === "update") {
      var updateId = body.id;
      var updatedData = body.record || body;
      var updated = updateRecord(sheet, updateId, updatedData);
      if (updated) {
        return responseJson({ status: "success", message: "แก้ไขข้อมูลสำเร็จ", id: updateId });
      } else {
        return responseJson({ status: "error", message: "ไม่พบรหัสข้อมูลที่ต้องการแก้ไข: " + updateId });
      }
    }

    if (action === "delete") {
      var deleteId = body.id;
      var deleted = deleteRecord(sheet, deleteId);
      if (deleted) {
        return responseJson({ status: "success", message: "ลบข้อมูลสำเร็จ", id: deleteId });
      } else {
        return responseJson({ status: "error", message: "ไม่พบรหัสข้อมูลที่ต้องการลบ: " + deleteId });
      }
    }

    return responseJson({ status: "error", message: "ไม่รู้จักคำสั่ง action: " + action });
  } catch (err) {
    return responseJson({ status: "error", message: err.toString() });
  }
}

// ค้นหาหรือสร้างแท็บ TimeRecords และหัวตาราง
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    initSheetHeaders(sheet);
  } else if (sheet.getLastRow() === 0) {
    initSheetHeaders(sheet);
  }
  return sheet;
}

// ตั้งค่าหัวตารางพร้อมตกแต่งสี Navy สวยงาม
function initSheetHeaders(sheet) {
  var headers = [
    "ID",
    "ลำดับ",
    "วันที่",
    "เวลา",
    "รอบ (Round)",
    "ชื่อ",
    "นามสกุล",
    "ชื่อ-นามสกุล",
    "รหัส/สังกัด",
    "ประเภทการบันทึก",
    "เวลาที่ใช้ในรอบ (Elapsed)",
    "หมายเหตุ",
    "เวลาที่ส่งเข้าชีต (Sync Time)"
  ];
  sheet.appendRow(headers);

  // ตกแต่งหัวตารางด้วยโทน Navy Blue & White
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setBackground("#0b2545");
  range.setFontColor("#ffffff");
  range.setFontWeight("bold");
  range.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  // ปรับความกว้างคอลัมน์อัตโนมัติ
  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

// เพิ่มแถวใหม่
function addRecord(sheet, r) {
  var rowCount = Math.max(1, sheet.getLastRow());
  var nextNo = rowCount; // ลำดับที่ 1, 2, ...
  var now = new Date();
  var syncTimeStr = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");

  var id = r.id || ("REC_" + now.getTime() + "_" + Math.floor(Math.random() * 1000));
  var dateStr = r.date || Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
  var timeStr = r.time || Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "HH:mm:ss");
  var round = r.round || "รอบที่ 1";
  var firstName = r.firstName || "";
  var lastName = r.lastName || "";
  var fullName = (firstName + " " + lastName).trim();
  var code = r.code || "";
  var actionType = r.actionType || "ลงเวลา";
  var elapsed = r.elapsed || "00:00";
  var note = r.note || "";

  var rowData = [
    id,
    nextNo,
    dateStr,
    timeStr,
    round,
    firstName,
    lastName,
    fullName,
    code,
    actionType,
    elapsed,
    note,
    syncTimeStr
  ];

  sheet.appendRow(rowData);
  return {
    id: id,
    no: nextNo,
    date: dateStr,
    time: timeStr,
    round: round,
    firstName: firstName,
    lastName: lastName,
    fullName: fullName,
    code: code,
    actionType: actionType,
    elapsed: elapsed,
    note: note,
    syncTime: syncTimeStr
  };
}

// แก้ไขแถวตาม ID
function updateRecord(sheet, id, r) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var rowNum = i + 1;
      if (r.firstName !== undefined) sheet.getRange(rowNum, 6).setValue(r.firstName);
      if (r.lastName !== undefined) sheet.getRange(rowNum, 7).setValue(r.lastName);
      if (r.firstName !== undefined || r.lastName !== undefined) {
        var fn = (r.firstName !== undefined ? r.firstName : data[i][5]);
        var ln = (r.lastName !== undefined ? r.lastName : data[i][6]);
        sheet.getRange(rowNum, 8).setValue((fn + " " + ln).trim());
      }
      if (r.round !== undefined) sheet.getRange(rowNum, 5).setValue(r.round);
      if (r.code !== undefined) sheet.getRange(rowNum, 9).setValue(r.code);
      if (r.actionType !== undefined) sheet.getRange(rowNum, 10).setValue(r.actionType);
      if (r.elapsed !== undefined) sheet.getRange(rowNum, 11).setValue(r.elapsed);
      if (r.note !== undefined) sheet.getRange(rowNum, 12).setValue(r.note);
      if (r.time !== undefined) sheet.getRange(rowNum, 4).setValue(r.time);
      if (r.date !== undefined) sheet.getRange(rowNum, 3).setValue(r.date);

      sheet.getRange(rowNum, 13).setValue("Updated " + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss"));
      return true;
    }
  }
  return false;
}

// ลบแถวตาม ID
function deleteRecord(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// ดึงข้อมูลทั้งหมด
function getAllRecords(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 13).getValues();
  var records = [];
  for (var i = 0; i < data.length; i++) {
    records.push({
      id: String(data[i][0]),
      no: data[i][1],
      date: formatDateCell(data[i][2]),
      time: formatTimeCell(data[i][3]),
      round: String(data[i][4]),
      firstName: String(data[i][5]),
      lastName: String(data[i][6]),
      fullName: String(data[i][7]),
      code: String(data[i][8]),
      actionType: String(data[i][9]),
      elapsed: String(data[i][10]),
      note: String(data[i][11]),
      syncTime: String(data[i][12])
    });
  }
  return records;
}

function formatDateCell(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
  }
  return String(val);
}

function formatTimeCell(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT+7", "HH:mm:ss");
  }
  return String(val);
}

// ส่งผลลัพธ์เป็น JSON พร้อมเปิด CORS
function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
