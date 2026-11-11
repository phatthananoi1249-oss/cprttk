"use client";

import React from "react";
import { TimeRecord, PatientCaseInfo } from "@/types/sheets";

interface MedicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseInfo: PatientCaseInfo;
  records: TimeRecord[];
  totalCodeDuration: string;
  totalCycles: number;
  totalShocks: number;
  totalEpiDoses: number;
  hasRosc: boolean;
  currentDateStr: string;
}

export function MedicalReportModal({
  isOpen,
  onClose,
  caseInfo,
  records,
  totalCodeDuration,
  totalCycles,
  totalShocks,
  totalEpiDoses,
  hasRosc,
  currentDateStr,
}: MedicalReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) {
      alert("กรุณาอนุญาตป๊อปอัพ (Popup) บนเบราว์เซอร์เพื่อพิมพ์รายงาน");
      return;
    }

    // เรียงตามเวลาจากเก่าสุดไปใหม่สุดสำหรับรายงานลำดับเหตุการณ์ทางการแพทย์
    const chronologicalRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);

    const rowsHtml = chronologicalRecords
      .map(
        (r, idx) => `
        <tr>
          <td style="text-align:center; font-family:'JetBrains Mono', monospace;">${idx + 1}</td>
          <td style="text-align:center; font-family:'JetBrains Mono', monospace; font-weight:bold;">${r.time}</td>
          <td style="text-align:center; font-family:'JetBrains Mono', monospace; color:#0c4a8e;">${r.elapsedInRound}</td>
          <td style="text-align:center;"><b>${r.round}</b></td>
          <td><b>${r.actionLabel}</b></td>
          <td>${r.fullName || "-"} ${r.code ? `<span style="color:#64748b; font-size:11px;">(${r.code})</span>` : ""}</td>
          <td style="color:#334155;">${r.note || "-"}</td>
        </tr>
      `
      )
      .join("");

    const reportHtml = `
      <!doctype html>
      <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>ใบบันทึกการช่วยฟื้นคืนชีพและเหตุการณ์ฉุกเฉิน (CPR / MEGA Code Record)</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body {
            font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #0c1727;
            background: #ffffff;
            margin: 0;
            padding: 24px;
            font-size: 12.5px;
            line-height: 1.4;
          }
          .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0b2545;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .hosp-title h1 {
            margin: 0;
            font-size: 19px;
            color: #0b2545;
            font-weight: 800;
            letter-spacing: -0.2px;
          }
          .hosp-title h2 {
            margin: 2px 0 0;
            font-size: 13px;
            color: #0c4a8e;
            font-weight: 700;
          }
          .hosp-title p {
            margin: 2px 0 0;
            color: #64748b;
            font-size: 11px;
          }
          .status-badge {
            background: #0b2545;
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 6px;
            text-align: right;
          }
          .status-badge .main {
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .status-badge .sub {
            font-size: 10px;
            opacity: 0.85;
            font-family: 'JetBrains Mono', monospace;
          }
          
          /* Patient Box */
          .patient-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 14px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px 16px;
            font-size: 12px;
          }
          .patient-box .field-label {
            font-weight: 700;
            color: #475569;
            font-size: 11px;
            text-transform: uppercase;
          }
          .patient-box .field-value {
            font-weight: 600;
            color: #0c1727;
            margin-top: 1px;
          }

          /* Metrics Grid */
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }
          .metric-card {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 10px;
            background: #ffffff;
          }
          .metric-card .title {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
          }
          .metric-card .value {
            font-size: 17px;
            font-weight: 800;
            font-family: 'JetBrains Mono', monospace;
            margin-top: 2px;
            color: #0b2545;
          }

          /* Timeline Table */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            font-size: 11.5px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: left;
          }
          th {
            background: #0b2545;
            color: #ffffff;
            font-weight: 700;
            font-size: 11px;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }

          /* Signatures */
          .signature-area {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 36px;
            margin-top: 36px;
            page-break-inside: avoid;
          }
          .sig-card {
            text-align: center;
            border-top: 1px dashed #94a3b8;
            padding-top: 10px;
          }

          .print-toolbar {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #0b2545;
            padding: 10px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 18px rgba(0,0,0,0.3);
            display: flex;
            gap: 10px;
            z-index: 9999;
          }
          .print-toolbar button {
            background: #ffffff;
            color: #0b2545;
            border: 0;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 12px;
            cursor: pointer;
            font-family: inherit;
          }
          @media print {
            .print-toolbar { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-toolbar">
          <button onclick="window.print()">🖨️ พิมพ์รายงาน / บันทึก PDF</button>
          <button onclick="window.close()" style="background:#e2e8f0; color:#334155;">ปิดหน้าต่าง</button>
        </div>

        <div class="doc-header">
          <div class="hosp-title">
            <h1>THATAKIAB HOSPITAL · ER RESUSCITATION RECORD</h1>
            <h2>โรงพยาบาลท่าตะเกียบ · ใบบันทึกการช่วยฟื้นคืนชีพและเหตุการณ์ฉุกเฉิน (CPR Log Sheet)</h2>
            <p>กลุ่มงานการพยาบาลผู้ป่วยอุบัติเหตุและฉุกเฉิน (ER & Code Blue) · พิมพ์เมื่อ: ${currentDateStr}</p>
          </div>
          <div class="status-badge" style="background:${hasRosc ? "#047857" : "#0b2545"}">
            <div class="main">${hasRosc ? "💚 ROSC ACHIEVED" : "THATAKIAB HOSPITAL"}</div>
            <div class="sub">CONFIDENTIAL MEDICAL RECORD</div>
          </div>
        </div>

        <div class="patient-box">
          <div>
            <div class="field-label">เลขประจำตัวผู้ป่วย (HN)</div>
            <div class="field-value">${caseInfo.hn || "-"}</div>
          </div>
          <div>
            <div class="field-label">ชื่อ - นามสกุล ผู้ป่วย</div>
            <div class="field-value">${caseInfo.name || "-"}</div>
          </div>
          <div>
            <div class="field-label">เตียง / ห้องตรวจ (Bed / Bay)</div>
            <div class="field-value">${caseInfo.bed || "-"}</div>
          </div>
          <div>
            <div class="field-label">การวินิจฉัย / สภาพแรกรับ</div>
            <div class="field-value">${caseInfo.diagnosis || "Cardiac Arrest / Resuscitation"}</div>
          </div>
          <div>
            <div class="field-label">แพทย์หัวหน้าทีม (Leader MD)</div>
            <div class="field-value">${caseInfo.teamLeader || "-"}</div>
          </div>
          <div>
            <div class="field-label">พยาบาลผู้บันทึก (Recorder RN)</div>
            <div class="field-value">${caseInfo.recorder || "-"}</div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="title">เวลากู้ชีพรวมทั้งหมด</div>
            <div class="value" style="color:#0c4a8e;">${totalCodeDuration}</div>
          </div>
          <div class="metric-card">
            <div class="title">จำนวนรอบ CPR (2-min)</div>
            <div class="value">${totalCycles} รอบ</div>
          </div>
          <div class="metric-card">
            <div class="title">ช็อกไฟฟ้า Defibrillation</div>
            <div class="value" style="color:#b91c1c;">${totalShocks} ครั้ง</div>
          </div>
          <div class="metric-card">
            <div class="title">ยา Adrenaline / Epi</div>
            <div class="value" style="color:#6d28d9;">${totalEpiDoses} doses</div>
          </div>
          <div class="metric-card" style="background:${hasRosc ? "#ecfdf5" : "#f8fafc"}">
            <div class="title">ผลลัพธ์การกู้ชีพ</div>
            <div class="value" style="font-size:14px; color:${hasRosc ? "#047857" : "#0f172a"};">
              ${hasRosc ? "💚 ได้ ROSC" : "รอสรุปผล"}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:35px; text-align:center;">#</th>
              <th style="width:75px; text-align:center;">เวลา</th>
              <th style="width:75px; text-align:center;">เวลาในรอบ</th>
              <th style="width:85px; text-align:center;">รอบ</th>
              <th>หัตถการ / การกระทำ</th>
              <th style="width:160px;">ผู้ปฏิบัติงาน</th>
              <th>หมายเหตุ / รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="7" style="text-align:center; padding:20px; color:#94a3b8;">ยังไม่มีข้อมูลบันทึกหัตถการ</td></tr>`}
          </tbody>
        </table>

        <div class="signature-area">
          <div class="sig-card">
            <p style="margin-bottom:45px;">ลงชื่อ..............................................................</p>
            <p style="margin:0; font-weight:700;">( ${caseInfo.recorder || "........................................................"} )</p>
            <p style="margin:2px 0 0; color:#64748b; font-size:11px;">พยาบาล / ผู้บันทึกเวลา (Recorder RN)</p>
          </div>
          <div class="sig-card">
            <p style="margin-bottom:45px;">ลงชื่อ..............................................................</p>
            <p style="margin:0; font-weight:700;">( ${caseInfo.teamLeader || "........................................................"} )</p>
            <p style="margin:2px 0 0; color:#64748b; font-size:11px;">แพทย์หัวหน้าทีมผู้สั่งการ (Team Leader MD)</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWin.document.write(reportHtml);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-2xl w-full p-6 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-[#0c4a8e] text-white flex items-center justify-center font-bold text-base">
              🖨️
            </span>
            <div>
              <h3 className="font-extrabold text-[#0b2545] text-base leading-tight">
                พิมพ์ใบบันทึกการช่วยฟื้นคืนชีพ (Official Resuscitation Record)
              </h3>
              <p className="text-xs text-slate-500">เอกสารมาตรฐานสำหรับแนบเวชระเบียนผู้ป่วย (A4 Format)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Preview Summary */}
        <div className="space-y-3 mb-5">
          <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-3 text-xs grid grid-cols-2 gap-2">
            <div>
              <span className="font-bold text-slate-500">HN:</span>{" "}
              <span className="font-bold text-[#0c1727]">{caseInfo.hn || "ไม่ระบุ"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500">ผู้ป่วย:</span>{" "}
              <span className="font-bold text-[#0c1727]">{caseInfo.name || "ไม่ระบุ"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500">เตียง/ห้อง:</span>{" "}
              <span>{caseInfo.bed || "-"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500">แพทย์หัวหน้าทีม:</span>{" "}
              <span>{caseInfo.teamLeader || "-"}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#e5eef9] p-2 rounded-lg border border-[#aeb9c8]">
              <div className="text-[10px] text-[#0c4a8e] font-bold uppercase">เวลากู้ชีพรวม</div>
              <div className="text-base font-extrabold font-mono text-[#0b2545]">{totalCodeDuration}</div>
            </div>
            <div className="bg-slate-100 p-2 rounded-lg border border-slate-300">
              <div className="text-[10px] text-slate-600 font-bold uppercase">จำนวนรอบ</div>
              <div className="text-base font-extrabold font-mono text-slate-800">{totalCycles} รอบ</div>
            </div>
            <div className="bg-rose-50 p-2 rounded-lg border border-rose-200">
              <div className="text-[10px] text-rose-700 font-bold uppercase">ช็อกไฟฟ้า</div>
              <div className="text-base font-extrabold font-mono text-rose-800">{totalShocks} ครั้ง</div>
            </div>
            <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
              <div className="text-[10px] text-purple-700 font-bold uppercase">ยา Adrenaline</div>
              <div className="text-base font-extrabold font-mono text-purple-800">{totalEpiDoses} doses</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            ปิด
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-[#0b2545] hover:bg-[#13325f] transition shadow flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>เปิดพิมพ์รายงาน / บันทึก PDF (A4)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
