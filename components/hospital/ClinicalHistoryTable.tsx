"use client";

import React, { useState } from "react";
import { TimeRecord, RoundInfo } from "@/types/sheets";

interface ClinicalHistoryTableProps {
  records: TimeRecord[];
  rounds: RoundInfo[];
  onOpenEdit: (record: TimeRecord) => void;
  onDeleteRecord: (id: string) => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onSyncAllPending: () => void;
  unsyncedCount: number;
}

export function ClinicalHistoryTable({
  records,
  rounds,
  onOpenEdit,
  onDeleteRecord,
  onExportExcel,
  onExportPdf,
  onSyncAllPending,
  unsyncedCount,
}: ClinicalHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRound, setFilterRound] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const getActionBadge = (type: string, label: string) => {
    switch (type) {
      case "cpr_shock":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "cpr_drug":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "cpr_rosc":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold";
      case "cpr_airway":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "cpr_rhythm":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "cpr_start":
      case "cpr_cycle":
        return "bg-blue-100 text-blue-800 border-blue-300 font-bold";
      case "cpr_end":
        return "bg-slate-200 text-slate-800 border-slate-400";
      case "check_in":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "checkpoint":
        return "bg-teal-50 text-teal-700 border-teal-300";
      case "check_out":
        return "bg-rose-50 text-rose-700 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  // Filter & Search
  let filtered = [...records];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.actionLabel.toLowerCase().includes(q) ||
        r.note.toLowerCase().includes(q) ||
        r.round.toLowerCase().includes(q) ||
        r.time.includes(q) ||
        (r.code && r.code.toLowerCase().includes(q))
    );
  }

  if (filterRound !== "all") {
    filtered = filtered.filter((r) => r.round === filterRound);
  }

  if (filterType !== "all") {
    filtered = filtered.filter((r) => r.actionType === filterType);
  }

  filtered.sort((a, b) => {
    return sortOrder === "desc" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
  });

  return (
    <section className="bg-white rounded-xl border border-[#d0d8e2] shadow-sm p-4 sm:p-5">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#e3e8ef] pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#047857]"></span>
            <h2 className="font-extrabold text-base text-[#0b2545] uppercase tracking-wider">
              บันทึกเหตุการณ์และประวัติหัตถการ (RESUSCITATION EVENT LOG)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            เรียงตามลำดับเวลา บันทึกถาวรลง Google Sheets พร้อมส่งออก Excel หรือพิมพ์รายงาน A4
          </p>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportExcel}
            className="bg-[#166534] hover:bg-[#14532d] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="ดาวน์โหลดไฟล์ Excel (.csv รองรับภาษาไทย)"
          >
            <span>📊</span>
            <span>ส่งออก Excel</span>
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="bg-[#0b2545] hover:bg-[#13325f] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="พิมพ์รายงานสรุป A4 หรือบันทึก PDF"
          >
            <span>🖨️</span>
            <span>พิมพ์รายงาน A4</span>
          </button>

          <button
            type="button"
            onClick={onSyncAllPending}
            className="bg-[#0c4a8e] hover:bg-[#08305d] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="ซิงค์ข้อมูลกับ Google Sheets ทันที"
          >
            <span>🔄</span>
            <span>ซิงค์ Sheets {unsyncedCount > 0 ? `(${unsyncedCount})` : ""}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 mb-3 bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0]">
        {/* Search */}
        <div className="lg:col-span-5 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ค้นหาหัตถการ, ยา, ผู้ปฏิบัติงาน, หมายเหตุ..."
            className="w-full pl-3 pr-8 py-2 rounded-md border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0c4a8e]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Round Filter */}
        <div className="lg:col-span-3">
          <select
            value={filterRound}
            onChange={(e) => setFilterRound(e.target.value)}
            className="w-full py-2 px-2.5 rounded-md border border-slate-300 bg-white text-xs font-medium focus:outline-none"
          >
            <option value="all">ทุกลำดับรอบ ({rounds.length} รอบ)</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Type Filter */}
        <div className="lg:col-span-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full py-2 px-2.5 rounded-md border border-slate-300 bg-white text-xs font-medium focus:outline-none"
          >
            <option value="all">ทุกประเภทหัตถการ</option>
            <option value="cpr_shock">⚡ ช็อกไฟฟ้า Defib</option>
            <option value="cpr_drug">💉 ยา Adrenaline / อื่นๆ</option>
            <option value="cpr_cycle">🔄 รอบ CPR 2 นาที</option>
            <option value="cpr_airway">🫁 ทางเดินหายใจ (ETT)</option>
            <option value="cpr_rhythm">🩺 ประเมิน Rhythm</option>
            <option value="cpr_rosc">💚 ได้ ROSC</option>
            <option value="check_in">เข้างาน / ทั่วไป</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="lg:col-span-2">
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="w-full py-2 px-2 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{sortOrder === "desc" ? "⬇️ ล่าสุดก่อน" : "⬆️ เก่าสุดก่อน"}</span>
          </button>
        </div>
      </div>

      {/* Table Display */}
      <div className="overflow-x-auto rounded-lg border border-[#e2e8f0]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0b2545] text-white">
              <th className="py-2.5 px-3 text-center w-12 font-bold">#</th>
              <th className="py-2.5 px-3 font-bold w-24">รอบ</th>
              <th className="py-2.5 px-3 font-bold text-center w-24">เวลา</th>
              <th className="py-2.5 px-3 font-bold text-center w-20">เวลาในรอบ</th>
              <th className="py-2.5 px-3 font-bold">หัตถการ / การกระทำ</th>
              <th className="py-2.5 px-3 font-bold w-40">ผู้ปฏิบัติงาน / บทบาท</th>
              <th className="py-2.5 px-3 font-bold">หมายเหตุ</th>
              <th className="py-2.5 px-3 font-bold text-center w-20">Google Sheets</th>
              <th className="py-2.5 px-3 font-bold text-center w-24">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0] bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="text-base font-bold text-slate-600">ยังไม่มีประวัติการบันทึก</div>
                  <div className="text-xs mt-1">แตะปุ่มหัตถการฉุกเฉินด้านบนเพื่อเริ่มบันทึกเหตุการณ์</div>
                </td>
              </tr>
            ) : (
              filtered.map((r, index) => (
                <tr key={r.id} className="hover:bg-[#f8fafc] transition">
                  <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-semibold">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#0c4a8e]">
                    <span className="bg-[#e5eef9] text-[#0c4a8e] px-2 py-0.5 rounded text-[11px] font-bold">
                      {r.round}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono-tabular font-bold text-slate-900">
                    {r.time}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono-tabular text-slate-600 font-semibold">
                    {r.elapsedInRound}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${getActionBadge(
                        r.actionType,
                        r.actionLabel
                      )}`}
                    >
                      {r.actionLabel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900 text-xs">{r.fullName || "-"}</div>
                    {r.code && <div className="text-[10px] text-slate-500">{r.code}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 max-w-[220px] truncate" title={r.note}>
                    {r.note || "-"}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {r.synced ? (
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-center gap-1" title={`ซิงค์แล้ว (${r.syncTime || ""})`}>
                        <span>☁️</span>
                        <span>ซิงค์แล้ว</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold text-[11px]" title="รอดำเนินการส่งขึ้น Google Sheets">
                        ⏳ รอส่ง
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenEdit(r)}
                        className="text-slate-600 hover:text-[#0c4a8e] text-xs font-semibold p-1 hover:bg-slate-100 rounded"
                        title="แก้ไขข้อมูล"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(r.id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold p-1 hover:bg-rose-50 rounded"
                        title="ลบรายการนี้"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
