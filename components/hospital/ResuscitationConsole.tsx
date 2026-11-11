"use client";

import React from "react";
import { RoundInfo } from "@/types/sheets";

interface ResuscitationConsoleProps {
  currentTime: Date | null;
  codeStatus: "standby" | "active" | "rosc" | "ended";
  totalCodeElapsed: string;
  totalCodeSeconds: number;
  cycleElapsed: string;
  cycleSeconds: number;
  activeRound: string;
  rounds: RoundInfo[];
  onSelectRound: (roundName: string) => void;
  onNextCycle: () => void;
  // Epinephrine Tracker
  lastEpiSeconds: number | null;
  totalEpiDoses: number;
  totalShocks: number;
  // Quick Actions Trigger
  onQuickAction: (actionType: string, label: string, note?: string) => void;
  activeStaffName: string;
}

export function ResuscitationConsole({
  currentTime,
  codeStatus,
  totalCodeElapsed,
  totalCodeSeconds,
  cycleElapsed,
  cycleSeconds,
  activeRound,
  rounds,
  onSelectRound,
  onNextCycle,
  lastEpiSeconds,
  totalEpiDoses,
  totalShocks,
  onQuickAction,
  activeStaffName,
}: ResuscitationConsoleProps) {
  const formatClock = (d: Date | null) => {
    if (!d) return "00:00:00";
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const formatThaiDate = (d: Date | null) => {
    if (!d) return "--:--:--";
    const days = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return `${days[d.getDay()]}ที่ ${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  };

  // คำนวณเปอร์เซ็นต์ของรอบ 2 นาที (120 วินาที)
  const cyclePercent = Math.min(100, Math.round((cycleSeconds / 120) * 100));
  const isNearCycleEnd = cycleSeconds >= 90 && cycleSeconds < 120; // 1:30 - 2:00
  const isCycleExceeded = cycleSeconds >= 120; // >= 2:00
  const remainingSeconds = Math.max(0, 120 - cycleSeconds);

  // Epinephrine (3-5 min guideline)
  const epiMinutes = lastEpiSeconds !== null ? Math.floor(lastEpiSeconds / 60) : null;
  const epiSecs = lastEpiSeconds !== null ? lastEpiSeconds % 60 : null;
  const isEpiDue = lastEpiSeconds !== null && lastEpiSeconds >= 180; // >= 3 min
  const isEpiOverdue = lastEpiSeconds !== null && lastEpiSeconds >= 300; // >= 5 min

  return (
    <section className="flex flex-col gap-4">
      {/* =========================================================================
          EXPANDED FULL-WIDTH 2-MINUTE CPR CYCLE & MASTER RESUSCITATION COMMAND CENTER
          ========================================================================= */}
      <div
        className={`w-full rounded-2xl shadow-xl p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 border border-white/20 ${
          isCycleExceeded
            ? "bg-gradient-to-br from-[#7f1313] via-[#991b1b] to-[#b91c1c] text-white animate-pulse"
            : isNearCycleEnd
            ? "bg-gradient-to-br from-[#78350f] via-[#92400e] to-[#b45309] text-white"
            : "bg-gradient-to-br from-[#071d36] via-[#0b2545] to-[#13325f] text-white"
        }`}
      >
        <div>
          {/* Header Row: Title, Round Badge, Status Alert & Master Clock */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3.5 border-b border-white/20">
            {/* Left: Cycle Title & Round */}
            <div className="flex items-center flex-wrap gap-2.5">
              <span className="flex items-center gap-2 font-black tracking-wider uppercase text-sm sm:text-base">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isCycleExceeded
                      ? "bg-yellow-300 animate-ping"
                      : isNearCycleEnd
                      ? "bg-yellow-300"
                      : "bg-emerald-400"
                  }`}
                />
                <span>รอบ CPR 2 นาที (ACLS 2-MIN RESUSCITATION CYCLE)</span>
              </span>

              <span className="bg-white/20 text-white font-mono font-bold px-3 py-1 rounded-full text-xs border border-white/30 shadow-xs">
                {activeRound}
              </span>

              {/* Status Pill Indicator */}
              <div
                className={`px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  isCycleExceeded
                    ? "bg-yellow-300 text-red-950 font-black animate-bounce"
                    : isNearCycleEnd
                    ? "bg-amber-300 text-amber-950 font-bold"
                    : "bg-emerald-500/30 text-emerald-200 border border-emerald-400/30"
                }`}
              >
                <span>{isCycleExceeded ? "🚨" : isNearCycleEnd ? "⚡" : "🟢"}</span>
                <span>
                  {isCycleExceeded
                    ? "ครบ 2 นาที! หยุดกดตรวจชีพจร & สลับคนกด"
                    : isNearCycleEnd
                    ? `อีก ${remainingSeconds} วินาที เตรียมตรวจจังหวะหัวใจ`
                    : "กำลังกดหน้าอกต่อเนื่อง 100-120 ครั้ง/นาที"}
                </span>
              </div>
            </div>

            {/* Right: Real-time Hospital Wall Clock & Total Code Duration */}
            <div className="flex items-center gap-4 text-right">
              {/* Total Code Elapsed */}
              <div className="bg-white/10 border border-white/15 px-3 py-1 rounded-lg">
                <div className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">
                  เวลากู้ชีพสะสม (TOTAL CODE)
                </div>
                <div className="font-mono-tabular text-xl sm:text-2xl font-black text-amber-300 leading-tight">
                  {totalCodeElapsed}
                </div>
              </div>

              {/* Hospital Wall Clock */}
              <div className="hidden sm:block">
                <div className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">
                  เวลามาตรฐานโรงพยาบาล
                </div>
                <div className="font-mono-tabular text-lg sm:text-xl font-black text-white leading-tight">
                  {formatClock(currentTime)}
                </div>
                <div className="text-[10px] text-slate-300">{formatThaiDate(currentTime)}</div>
              </div>
            </div>
          </div>

          {/* Central Hero Stage: Massive CPR Digits & Clinical KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-5 items-center">
            {/* Left/Center (7 cols): Giant Digits & Clinical Instructions */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-baseline gap-4">
                {/* Massive 2-Min Digits */}
                <div className="font-mono-tabular text-6xl sm:text-8xl md:text-9xl font-black tracking-tight leading-none text-white drop-shadow-md">
                  {cycleElapsed}
                </div>

                {/* Percentage Circle / Badge */}
                <div className="flex flex-col items-start justify-end pb-2">
                  <div className="font-mono font-black text-3xl sm:text-5xl text-amber-300 leading-none">
                    {cyclePercent}%
                  </div>
                  <div className="text-xs text-slate-300 font-bold uppercase tracking-wider mt-1">
                    {isCycleExceeded ? (
                      <span className="text-yellow-200">เกินรอบ +{cycleSeconds - 120}s</span>
                    ) : (
                      <span>เหลือ {remainingSeconds}s</span>
                    )}
                  </div>
                </div>
              </div>

              {/* CPR Coaching Banner */}
              <div className="mt-3">
                <div
                  className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-2 border ${
                    isCycleExceeded
                      ? "bg-yellow-300 text-red-950 border-yellow-400 font-black"
                      : isNearCycleEnd
                      ? "bg-amber-400/30 text-amber-100 border-amber-300/40"
                      : "bg-white/10 text-slate-200 border-white/20"
                  }`}
                >
                  <span className="text-base">{isCycleExceeded ? "⚠️" : isNearCycleEnd ? "⏳" : "💓"}</span>
                  <span>
                    {isCycleExceeded
                      ? "ครบ 2 นาทีตามแนวทาง ACLS! สลับผู้กดหน้าอกทันทีและประเมิน Rhythm / Pulse"
                      : isNearCycleEnd
                      ? `เตรียมตรวจ Rhythm และสลับคนกดหน้าอกในอีก ${remainingSeconds} วินาที`
                      : "กดหน้าอกลึก 2 - 2.4 นิ้ว ความเร็ว 100-120 bpm และปล่อยให้หน้าอกคืนตัวสุด"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right (5 cols): 4 High-Visibility Clinical Metric Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
              {/* 1. Defibrillation Shocks */}
              <div className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl p-3 backdrop-blur-xs transition">
                <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
                  <span>⚡ ช็อกไฟฟ้า (DEFIB)</span>
                </div>
                <div className="font-mono-tabular text-2xl sm:text-3xl font-black text-white mt-0.5">
                  {totalShocks} <span className="text-xs font-normal text-slate-300">ครั้ง</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5 truncate">
                  {totalShocks > 0 ? "Biphasic 200J" : "ยังไม่มีการ Shock"}
                </div>
              </div>

              {/* 2. Adrenaline / Epi Doses */}
              <div
                className={`border rounded-xl p-3 backdrop-blur-xs transition ${
                  isEpiDue
                    ? "bg-amber-500/25 border-amber-400/50"
                    : "bg-white/10 hover:bg-white/15 border-white/20"
                }`}
              >
                <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between">
                  <span>💉 ADRENALINE</span>
                  {isEpiDue && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>
                <div className="font-mono-tabular text-2xl sm:text-3xl font-black text-white mt-0.5">
                  {totalEpiDoses} <span className="text-xs font-normal text-slate-300">doses</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5 truncate">
                  {isEpiOverdue
                    ? "⚠️ เกิน 5 นาทีแล้ว"
                    : isEpiDue
                    ? "⚡ ถึงช่วงให้ยา 3-5 min"
                    : "ฉีดทุก 3-5 นาที"}
                </div>
              </div>

              {/* 3. Last Epinephrine Time */}
              <div className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl p-3 backdrop-blur-xs transition">
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  ยาครั้งล่าสุด (EPI ELAPSED)
                </div>
                <div className="font-mono-tabular text-2xl sm:text-3xl font-black text-amber-300 mt-0.5">
                  {lastEpiSeconds !== null
                    ? `${String(epiMinutes).padStart(2, "0")}:${String(epiSecs).padStart(2, "0")}`
                    : "-"}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  {lastEpiSeconds !== null ? "นาทีที่แล้ว" : "ยังไม่ได้ให้ยา"}
                </div>
              </div>

              {/* 4. Active Case / Code Status */}
              <div className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl p-3 backdrop-blur-xs transition">
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  สถานะเคส (STATUS)
                </div>
                <div className="font-bold text-lg sm:text-xl text-emerald-300 mt-1 truncate flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span>{codeStatus === "rosc" ? "ROSC ได้ชีพจร" : "กำลังกู้ชีพ"}</span>
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5 truncate">
                  รอบที่ {rounds.length} ของเคสนี้
                </div>
              </div>
            </div>
          </div>

          {/* Panoramic Progress Bar (Full-Width) */}
          <div className="space-y-1.5">
            <div className="w-full bg-black/40 rounded-full h-4 sm:h-5 p-0.5 overflow-hidden border border-white/20 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCycleExceeded
                    ? "bg-yellow-300 shadow-[0_0_12px_#fde047]"
                    : isNearCycleEnd
                    ? "bg-gradient-to-r from-amber-400 to-yellow-300"
                    : "bg-gradient-to-r from-emerald-400 to-teal-300"
                }`}
                style={{ width: `${cyclePercent}%` }}
              />
            </div>

            {/* Progress Milestones Tick Marks */}
            <div className="flex justify-between text-[10px] text-slate-300 font-mono font-bold px-1">
              <span>00:00 (เริ่มรอบ)</span>
              <span className="hidden sm:inline">00:30</span>
              <span>01:00 (1 นาที)</span>
              <span className="text-amber-300">01:30 (เตรียมตรวจ Rhythm)</span>
              <span className={isCycleExceeded ? "text-yellow-200 font-black" : "text-slate-200"}>
                02:00 (ครบ 2 นาที / สลับคนกด)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Row (Expansive Button Bar) */}
        <div className="pt-4 border-t border-white/20 mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Big Primary Action: Next 2-Min Cycle */}
          <button
            type="button"
            onClick={onNextCycle}
            className="flex-1 bg-white hover:bg-slate-100 active:scale-98 text-[#0b2545] font-black px-6 py-3.5 rounded-xl text-base tracking-wide shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer border border-white"
          >
            <span className="text-xl">🔄</span>
            <span>จบรอบ 2 นาที / เริ่มรอบใหม่ (NEXT CPR CYCLE & RHYTHM CHECK)</span>
          </button>

          {/* Round Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-bold hidden sm:inline whitespace-nowrap">
              สลับรอบ:
            </span>
            <select
              value={activeRound}
              onChange={(e) => onSelectRound(e.target.value)}
              className="bg-white/15 hover:bg-white/20 border border-white/30 text-white font-bold rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              title="สลับรอบการทำงาน"
            >
              {rounds.map((r) => (
                <option key={r.id} value={r.name} className="bg-[#0b2545] text-white">
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          EMERGENCY ONE-TOUCH ACTION PAD (10 CLINICAL PRESET BUTTONS)
          ========================================================================= */}
      <div className="bg-white rounded-xl border border-[#d0d8e2] shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3e8ef] pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <h2 className="font-extrabold text-sm text-[#0b2545] uppercase tracking-wider">
              แผงกดบันทึกหัตถการฉุกเฉิน (EMERGENCY ONE-TOUCH ACTION PAD)
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            ผู้ปฏิบัติการปัจจุบัน: <b className="text-[#0c4a8e]">{activeStaffName || "ทีมกู้ชีพ"}</b> (แตะเพื่อบันทึกทันที)
          </div>
        </div>

        {/* Grid of Hospital Emergency Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {/* 1. Start CPR / Code Blue */}
          <button
            type="button"
            onClick={() => onQuickAction("cpr_start", "⚡ เริ่ม CPR / Code Blue", "เริ่มกดหน้าอกช่วยฟื้นคืนชีพ")}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-sm transition border border-rose-700 cursor-pointer text-center"
          >
            <span className="text-2xl mb-1">⚡</span>
            <span className="font-extrabold text-xs leading-tight">เริ่ม CPR / Code Blue</span>
            <span className="text-[10px] text-rose-100 mt-0.5">Start Compressions</span>
          </button>

          {/* 2. Rhythm Check / 2-Min Next */}
          <button
            type="button"
            onClick={onNextCycle}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#0c4a8e] hover:bg-[#08305d] active:scale-95 text-white shadow-sm transition border border-[#08305d] cursor-pointer text-center"
          >
            <span className="text-2xl mb-1">🔄</span>
            <span className="font-extrabold text-xs leading-tight">จบรอบ 2 min / ตรวจจังหวะ</span>
            <span className="text-[10px] text-sky-100 mt-0.5">Rhythm & Pulse Check</span>
          </button>

          {/* 3. Adrenaline 1 mg IV */}
          <button
            type="button"
            onClick={() =>
              onQuickAction(
                "cpr_drug",
                `💉 Adrenaline 1 mg IV (Dose #${totalEpiDoses + 1})`,
                "ฉีดเข้าหลอดเลือดดำตามด้วย NSS 20 ml"
              )
            }
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-purple-700 hover:bg-purple-800 active:scale-95 text-white shadow-sm transition border border-purple-800 cursor-pointer text-center relative"
          >
            <span className="text-2xl mb-1">💉</span>
            <span className="font-extrabold text-xs leading-tight">Adrenaline 1 mg IV</span>
            <span className="text-[10px] text-purple-200 mt-0.5">Dose #{totalEpiDoses + 1} (ทุก 3-5 นาที)</span>
            {isEpiDue && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
            )}
          </button>

          {/* 4. Defibrillation Shock 200J */}
          <button
            type="button"
            onClick={() =>
              onQuickAction(
                "cpr_shock",
                `⚡ Shock Defib 200J (ครั้งที่ ${totalShocks + 1})`,
                "ช็อกไฟฟ้าหัวใจพลังงาน 200J Biphasic สำเร็จ"
              )
            }
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-red-700 hover:bg-red-800 active:scale-95 text-white shadow-sm transition border border-red-800 cursor-pointer text-center"
          >
            <span className="text-2xl mb-1">⚡</span>
            <span className="font-extrabold text-xs leading-tight">Shock Defib 200J</span>
            <span className="text-[10px] text-red-200 mt-0.5">ครั้งที่ {totalShocks + 1} (VF/pVT)</span>
          </button>

          {/* 5. Intubation / ETT */}
          <button
            type="button"
            onClick={() =>
              onQuickAction("cpr_airway", "🫁 ใส่ท่อช่วยหายใจ (ETT)", "ใส่ท่อช่วยหายใจสำเร็จ ยืนยันตำแหน่งด้วยฟังปอด 2 ข้าง")
            }
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-sky-700 hover:bg-sky-800 active:scale-95 text-white shadow-sm transition border border-sky-800 cursor-pointer text-center"
          >
            <span className="text-2xl mb-1">🫁</span>
            <span className="font-extrabold text-xs leading-tight">ใส่ท่อช่วยหายใจ ETT</span>
            <span className="text-[10px] text-sky-200 mt-0.5">Airway Management</span>
          </button>

          {/* 6. Amiodarone 300 mg / 150 mg */}
          <button
            type="button"
            onClick={() =>
              onQuickAction(
                "cpr_drug",
                "💊 Amiodarone 300 mg IV",
                "ให้ Amiodarone 300 mg IV หลัง Shock ครั้งที่ 3"
              )
            }
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white shadow-sm transition border border-indigo-800 cursor-pointer text-center"
          >
            <span className="text-2xl mb-1">💊</span>
            <span className="font-extrabold text-xs leading-tight">Amiodarone 300 mg</span>
            <span className="text-[10px] text-indigo-200 mt-0.5">Antiarrhythmic Drug</span>
          </button>

          {/* 7. Rhythm: Asystole / PEA */}
          <button
            type="button"
            onClick={() =>
              onQuickAction(
                "cpr_rhythm",
                "🩺 ตรวจจังหวะ: Asystole / PEA",
                "Non-shockable rhythm ดำเนินการ CPR ต่อทันที"
              )
            }
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-700 hover:bg-slate-800 active:scale-95 text-white shadow-sm transition border border-slate-800 cursor-pointer text-center"
          >
            <span className="text-2xl mb-1">🩺</span>
            <span className="font-extrabold text-xs leading-tight">Rhythm: Asystole / PEA</span>
            <span className="text-[10px] text-slate-300 mt-0.5">Non-shockable</span>
          </button>

          {/* 8. Lab / DTX / ABG */}
          <button
            type="button"
            onClick={() =>
              onQuickAction(
                "checkpoint",
                "🧪 เจาะ DTX / Blood Gas",
                "ตรวจน้ำตาลปลายนิ้วและเจาะเลือดส่งตรวจฉุกเฉิน"
              )
            }
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-teal-700 hover:bg-teal-800 active:scale-95 text-white shadow-sm transition border border-teal-800 cursor-pointer text-center"
          >
            <span className="text-2xl mb-1">🧪</span>
            <span className="font-extrabold text-xs leading-tight">เจาะ DTX / Lab / ABG</span>
            <span className="text-[10px] text-teal-200 mt-0.5">Lab & Diagnostics</span>
          </button>

          {/* 9. ROSC (Return of Spontaneous Circulation) */}
          <button
            type="button"
            onClick={() =>
              onQuickAction(
                "cpr_rosc",
                "💚 ROSC สัญญาณชีพกลับมา",
                "คลำชีพจร Carotid ได้ ความดันโลหิตและสัญญาณชีพกลับมา"
              )
            }
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm transition border border-emerald-700 cursor-pointer text-center"
          >
            <span className="text-2xl mb-1">💚</span>
            <span className="font-extrabold text-xs leading-tight">ROSC สัญญาณชีพกลับมา</span>
            <span className="text-[10px] text-emerald-100 mt-0.5">Return of Spontaneous Circulation</span>
          </button>

          {/* 10. End Code / Post-Resuscitation Care */}
          <button
            type="button"
            onClick={() =>
              onQuickAction(
                "cpr_end",
                "🏁 สิ้นสุดการกู้ชีพ / ย้าย ICU",
                "สิ้นสุดขั้นตอนกู้ชีพ ส่งต่อหอผู้ป่วยวิกฤต ICU หรือยุติการกู้ชีพ"
              )
            }
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#0b2545] hover:bg-[#13325f] active:scale-95 text-white shadow-sm transition border border-[#08203e] cursor-pointer text-center"
          >
            <span className="text-2xl mb-1">🏁</span>
            <span className="font-extrabold text-xs leading-tight">สิ้นสุดการกู้ชีพ / ย้าย ICU</span>
            <span className="text-[10px] text-slate-300 mt-0.5">Post-Code Care</span>
          </button>
        </div>
      </div>
    </section>
  );
}
