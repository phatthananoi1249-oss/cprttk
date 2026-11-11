"use client";

import React from "react";
import { PatientCaseInfo } from "@/types/sheets";

interface HospitalHeaderProps {
  currentTime: Date | null;
  codeStatus: "standby" | "active" | "rosc" | "ended";
  metronomeActive: boolean;
  onToggleMetronome: () => void;
  metronomeBeat: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  sheetsUrl: string;
  unsyncedCount: number;
  onOpenSheetsModal: () => void;
  onOpenPatientModal: () => void;
  onOpenReportModal: () => void;
  caseInfo: PatientCaseInfo;
}

export function HospitalHeader({
  currentTime,
  codeStatus,
  metronomeActive,
  onToggleMetronome,
  metronomeBeat,
  soundEnabled,
  onToggleSound,
  sheetsUrl,
  unsyncedCount,
  onOpenSheetsModal,
  onOpenPatientModal,
  onOpenReportModal,
  caseInfo,
}: HospitalHeaderProps) {
  const formatThaiDate = (d: Date | null) => {
    if (!d) return "--:--:--";
    const days = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return `${days[d.getDay()]}ที่ ${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  };

  const getStatusBadge = () => {
    switch (codeStatus) {
      case "active":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/90 text-white text-xs font-black tracking-wider uppercase shadow-sm animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            <span>🚨 CPR IN PROGRESS</span>
          </div>
        );
      case "rosc":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black tracking-wider uppercase shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-200" />
            <span>💚 ROSC ACHIEVED</span>
          </div>
        );
      case "ended":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 text-slate-200 text-xs font-bold tracking-wider uppercase">
            <span>🏁 CODE COMPLETED</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-200 border border-white/20 text-xs font-semibold tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>READY / STANDBY</span>
          </div>
        );
    }
  };

  return (
    <header className="bg-gradient-to-b from-[#0b2545] to-[#13325f] text-white border-b border-[#08203e] shadow-md px-3 sm:px-6 py-2.5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & ER Department Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md border border-slate-200 shrink-0 overflow-hidden p-0.5">
            <img
              src="/thatakiab-logo.png"
              alt="ตราสัญลักษณ์โรงพยาบาลท่าตะเกียบ (Thatakiab Hospital)"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base tracking-wide text-white leading-tight flex items-center gap-2">
              <span>Thatakiab Hospital</span>
              <span className="text-[10px] bg-red-600/80 text-white px-2 py-0.5 rounded font-black tracking-wider uppercase">
                ER CODE CLOCK
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              โรงพยาบาลท่าตะเกียบ · ระบบบันทึกเวลาช่วยฟื้นคืนชีพและเหตุการณ์ฉุกเฉิน (ER & Code Blue)
            </div>
          </div>
        </div>

        {/* Center / Patient Badge Quick Click */}
        <button
          onClick={onOpenPatientModal}
          className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer text-left"
          title="แก้ไขข้อมูลผู้ป่วยและเคส"
        >
          <span className="text-base">🏥</span>
          <div>
            <div className="font-bold text-slate-100 flex items-center gap-1.5 leading-none">
              <span>{caseInfo.name || "ระบุผู้ป่วย"}</span>
              {caseInfo.hn && <span className="text-amber-300 font-mono text-[11px]">({caseInfo.hn})</span>}
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              เตียง: {caseInfo.bed || "-"} | ผู้นำทีม: {caseInfo.teamLeader || "-"}
            </div>
          </div>
        </button>

        {/* Right Toolbar: Live Status, Metronome, Sound, Sheets, Print */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status Badge */}
          {getStatusBadge()}

          {/* CPR Metronome 110 BPM */}
          <button
            onClick={onToggleMetronome}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              metronomeActive
                ? "bg-amber-500 text-[#0b2545] border-amber-400 shadow-[0_0_12px_#f59e0b]"
                : "bg-white/10 text-slate-200 border-white/20 hover:bg-white/20"
            }`}
            title="เครื่องเคาะจังหวะ CPR 110 ครั้ง/นาที (AHA Guideline 100-120 bpm)"
          >
            <span className={`text-sm ${metronomeActive && metronomeBeat % 2 === 0 ? "scale-125" : "scale-100"} transition-transform`}>
              💓
            </span>
            <span className="text-[11px] font-mono">110 BPM</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 px-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition text-xs flex items-center gap-1 cursor-pointer"
            title={soundEnabled ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
          >
            <span>{soundEnabled ? "🔊" : "🔇"}</span>
          </button>

          {/* Patient Info Modal Trigger (Mobile) */}
          <button
            onClick={onOpenPatientModal}
            className="md:hidden p-1.5 px-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition text-xs flex items-center gap-1 cursor-pointer"
            title="ข้อมูลผู้ป่วย"
          >
            <span>🏥 เคส</span>
          </button>

          {/* Google Sheets Sync Status */}
          <button
            onClick={onOpenSheetsModal}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
              sheetsUrl
                ? unsyncedCount > 0
                  ? "bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30"
                : "bg-white/10 text-slate-200 border-white/20 hover:bg-white/20"
            }`}
            title="ตั้งค่าเชื่อมต่อ Google Sheets"
          >
            <span>{sheetsUrl ? (unsyncedCount > 0 ? "⏳" : "☁️") : "⚙️"}</span>
            <span className="hidden sm:inline">
              {sheetsUrl ? (unsyncedCount > 0 ? `ค้าง ${unsyncedCount}` : "Sheets พร้อม") : "ตั้งค่า Sheets"}
            </span>
          </button>

          {/* Print Report */}
          <button
            onClick={onOpenReportModal}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="พิมพ์ใบบันทึกการช่วยฟื้นคืนชีพ (A4)"
          >
            <span>🖨️</span>
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>
        </div>
      </div>
    </header>
  );
}
