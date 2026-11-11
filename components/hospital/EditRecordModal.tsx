"use client";

import React, { useState, useEffect } from "react";
import { TimeRecord, RecordActionType } from "@/types/sheets";

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TimeRecord | null;
  onSave: (updated: TimeRecord) => void;
}

export function EditRecordModal({
  isOpen,
  onClose,
  record,
  onSave,
}: EditRecordModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [round, setRound] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [actionType, setActionType] = useState<RecordActionType>("note");
  const [note, setNote] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (record) {
      setFirstName(record.firstName);
      setLastName(record.lastName);
      setCode(record.code || "");
      setRound(record.round);
      setActionLabel(record.actionLabel);
      setActionType(record.actionType);
      setNote(record.note || "");
      setTime(record.time);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();

    onSave({
      ...record,
      firstName: fn,
      lastName: ln,
      fullName: `${fn} ${ln}`.trim(),
      code: code.trim(),
      round: round.trim() || record.round,
      actionLabel: actionLabel.trim() || record.actionLabel,
      actionType,
      note: note.trim(),
      time: time.trim() || record.time,
      synced: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-md w-full p-6 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <div>
              <h3 className="font-extrabold text-[#0b2545] text-base leading-tight">
                แก้ไขข้อมูลบันทึกเวลา
              </h3>
              <p className="text-xs text-slate-500">ID: {record.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ชื่อผู้ปฏิบัติงาน
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
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
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                รอบ
              </label>
              <input
                type="text"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                เวลาที่บันทึก
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              หัตถการ / การกระทำ
            </label>
            <input
              type="text"
              value={actionLabel}
              onChange={(e) => setActionLabel(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              หมายเหตุ
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-[#0c4a8e] focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0c4a8e] hover:bg-[#08305d] transition shadow"
            >
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
