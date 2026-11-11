"use client";

import React, { useState } from "react";

interface SheetsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetsUrl: string;
  onSaveUrl: (url: string) => void;
  onTestConnection: (url: string) => Promise<void>;
  syncStatus: "idle" | "testing" | "success" | "error" | "syncing";
  syncMessage: string;
}

export function SheetsConfigModal({
  isOpen,
  onClose,
  sheetsUrl,
  onSaveUrl,
  onTestConnection,
  syncStatus,
  syncMessage,
}: SheetsConfigModalProps) {
  const [url, setUrl] = useState(sheetsUrl);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUrl(url.trim());
    await onTestConnection(url.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-lg w-full p-6 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              ☁️
            </span>
            <div>
              <h3 className="font-extrabold text-[#0b2545] text-base leading-tight">
                ตั้งค่าเชื่อมต่อฐานข้อมูล Google Sheets
              </h3>
              <p className="text-xs text-slate-500">บันทึกข้อมูลถาวรขึ้นคลาวด์อัตโนมัติ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveAndTest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Google Apps Script Web App URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-[#0c4a8e] focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              💡 นำ URL ที่ได้จากการ Deploy ใน Google Apps Script (โฟลเดอร์ <code className="bg-slate-100 px-1 py-0.5 rounded text-[#0c4a8e]">google-apps-script/Code.gs</code>) มาวางที่นี่
            </p>
          </div>

          {/* Sync Status Feedback */}
          {syncMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold ${
                syncStatus === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                  : syncStatus === "error"
                  ? "bg-rose-50 text-rose-800 border border-rose-300"
                  : "bg-sky-50 text-sky-800 border border-sky-300"
              }`}
            >
              {syncMessage}
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              ปิด
            </button>
            <button
              type="submit"
              disabled={syncStatus === "testing"}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-[#0c4a8e] hover:bg-[#08305d] transition shadow disabled:opacity-50 flex items-center gap-1.5"
            >
              {syncStatus === "testing" ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>กำลังทดสอบ...</span>
                </>
              ) : (
                <>
                  <span>🔗</span>
                  <span>บันทึกและทดสอบเชื่อมต่อ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
