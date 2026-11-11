"use client";

import React, { useState } from "react";
import { RecordActionType } from "@/types/sheets";

interface ManualEntryFormProps {
  activeRound: string;
  onStampManual: (
    firstName: string,
    lastName: string,
    code: string,
    actionType: RecordActionType,
    customLabel: string,
    note: string
  ) => void;
}

export function ManualEntryForm({
  activeRound,
  onStampManual,
}: ManualEntryFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [actionCategory, setActionCategory] = useState<RecordActionType>("note");
  const [customLabel, setCustomLabel] = useState("");
  const [note, setNote] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() && !customLabel.trim()) {
      alert("กรุณากรอกชื่อผู้ปฏิบัติงาน หรือชื่อหัตถการ");
      return;
    }

    const label = customLabel.trim() || "บันทึกข้อมูลทั่วไป";
    onStampManual(
      firstName.trim(),
      lastName.trim(),
      code.trim(),
      actionCategory,
      label,
      note.trim()
    );

    setFirstName("");
    setLastName("");
    setCustomLabel("");
    setNote("");
  };

  return (
    <div className="bg-white rounded-xl border border-[#d0d8e2] shadow-sm p-4">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📝</span>
          <h3 className="font-extrabold text-sm text-[#0b2545] uppercase tracking-wider">
            ฟอร์มกรอกบันทึกเวลาและหัตถการแบบละเอียด (DETAILED MANUAL ENTRY)
          </h3>
          <span className="text-[11px] bg-[#e5eef9] text-[#0c4a8e] font-bold px-2 py-0.5 rounded">
            รอบ: {activeRound}
          </span>
        </div>
        <button
          type="button"
          className="text-xs font-bold text-[#0c4a8e] hover:text-[#08305d] flex items-center gap-1"
        >
          {isExpanded ? "▲ ย่อแบบฟอร์ม" : "▼ ขยายแบบฟอร์มละเอียด"}
        </button>
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-[#e3e8ef] space-y-3">
          {/* Row 1: Name and Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ชื่อผู้ปฏิบัติงาน / แพทย์ / พยาบาล <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="เช่น สมชาย, นพ. เอกชัย..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                นามสกุล
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="เช่น ใจดี, วัฒนา..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                รหัส / สังกัด / HN
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น ER-01, RN, MD, HN 67-xxx"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Action Category & Custom Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ประเภทหัตถการ / การบันทึก
              </label>
              <select
                value={actionCategory}
                onChange={(e) => setActionCategory(e.target.value as RecordActionType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none bg-white"
              >
                <option value="note">บันทึกเหตุการณ์ / หัตถการทั่วไป</option>
                <option value="cpr_drug">ให้ยาฉุกเฉิน (Emergency Medication)</option>
                <option value="cpr_shock">ช็อกไฟฟ้าหัวใจ (Defibrillation)</option>
                <option value="cpr_airway">ทางเดินหายใจ (Airway / Intubation)</option>
                <option value="cpr_rhythm">ประเมิน Rhythm / ชีพจร</option>
                <option value="checkpoint">จุดตรวจ / สัญญาณชีพ / Vital Signs</option>
                <option value="check_in">เข้าเวร / เริ่มต้นปฏิบัติงาน</option>
                <option value="check_out">ออกเวร / สิ้นสุดปฏิบัติงาน</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ชื่อการกระทำ / หัตถการ (Custom Action)
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="เช่น ให้ Sodium Bicarb 50 ml, สวนสาย Foley, เจาะ Lab..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              หมายเหตุเพิ่มเติม / ค่าที่วัดได้ (Note & Observations)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น SpO2 98%, BP 110/70, ผล DTX 142 mg/dL, สั่งการโดยอาจารย์แพทย์..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-[#0c4a8e] hover:bg-[#08305d] active:scale-98 text-white font-extrabold px-6 py-2.5 rounded-lg text-xs tracking-wide shadow transition flex items-center gap-2 cursor-pointer"
            >
              <span>⏱️ บันทึกเวลารายการนี้ (STAMP RECORD)</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
