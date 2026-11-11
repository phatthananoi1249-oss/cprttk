"use client";

import React, { useState } from "react";
import { PatientCaseInfo } from "@/types/sheets";

interface PatientInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseInfo: PatientCaseInfo;
  onSave: (updated: PatientCaseInfo) => void;
}

export function PatientInfoModal({
  isOpen,
  onClose,
  caseInfo,
  onSave,
}: PatientInfoModalProps) {
  const [hn, setHn] = useState(caseInfo.hn);
  const [name, setName] = useState(caseInfo.name);
  const [bed, setBed] = useState(caseInfo.bed);
  const [teamLeader, setTeamLeader] = useState(caseInfo.teamLeader);
  const [recorder, setRecorder] = useState(caseInfo.recorder);
  const [diagnosis, setDiagnosis] = useState(caseInfo.diagnosis);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      hn: hn.trim(),
      name: name.trim(),
      bed: bed.trim(),
      teamLeader: teamLeader.trim(),
      recorder: recorder.trim(),
      diagnosis: diagnosis.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-[#cbd5e1] max-w-lg w-full p-6 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#0c4a8e] text-white flex items-center justify-center font-bold text-sm">
              🏥
            </span>
            <div>
              <h3 className="font-extrabold text-[#0b2545] text-base leading-tight">
                ข้อมูลผู้ป่วยและเคสกู้ชีพ (Patient Case Details)
              </h3>
              <p className="text-xs text-slate-500">สำหรับบันทึกและออกใบบันทึกการช่วยฟื้นคืนชีพ (Code Record)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                เลขประจำตัวผู้ป่วย (HN)
              </label>
              <input
                type="text"
                value={hn}
                onChange={(e) => setHn(e.target.value)}
                placeholder="เช่น HN 67-12345"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                เตียง / ห้องตรวจ / โซน (Bed / Bay)
              </label>
              <input
                type="text"
                value={bed}
                onChange={(e) => setBed(e.target.value)}
                placeholder="เช่น เตียงฉุกเฉิน 1, ICU-2"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              ชื่อ - นามสกุล ผู้ป่วย (Patient Full Name)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น นาย สมศักดิ์ มีชัย หรือ ชายไทยไม่ทราบชื่อ"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#0c4a8e] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              การวินิจฉัยเบื้องต้น / สาเหตุ (Diagnosis / Primary Cause)
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="เช่น Cardiac Arrest, STEMI, Sepsis, Polytrauma..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#0c4a8e] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                แพทย์หัวหน้าทีม (Team Leader MD)
              </label>
              <input
                type="text"
                value={teamLeader}
                onChange={(e) => setTeamLeader(e.target.value)}
                placeholder="เช่น นพ. วัฒนา สุขเกษม"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                พยาบาลผู้บันทึก (Recorder RN)
              </label>
              <input
                type="text"
                value={recorder}
                onChange={(e) => setRecorder(e.target.value)}
                placeholder="เช่น พย. ศิริพร ใจงาม"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-[#0c4a8e] hover:bg-[#08305d] transition shadow"
            >
              บันทึกข้อมูลเคส
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
