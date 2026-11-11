"use client";

import React, { useState } from "react";

export interface TeamMember {
  id: string;
  role: string;
  roleIcon: string;
  name: string;
  count: number;
}

interface TeamRosterPanelProps {
  activeRound: string;
  teamMembers: TeamMember[];
  activeMemberId: string;
  onSelectMember: (member: TeamMember) => void;
  onStampMember: (member: TeamMember) => void;
  onUpdateMemberName: (id: string, name: string) => void;
  onAddCustomMember: (name: string, role: string) => void;
}

export function TeamRosterPanel({
  activeRound,
  teamMembers,
  activeMemberId,
  onSelectMember,
  onStampMember,
  onUpdateMemberName,
  onAddCustomMember,
}: TeamRosterPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("สมาชิกทีม");

  const startEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setEditName(m.name);
  };

  const saveEdit = (id: string) => {
    onUpdateMemberName(id, editName.trim());
    setEditingId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCustomMember(newName.trim(), newRole.trim());
    setNewName("");
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-[#d0d8e2] shadow-sm p-4 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between border-b border-[#e3e8ef] pb-2.5 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base">👥</span>
            <h3 className="font-extrabold text-sm text-[#0b2545] uppercase tracking-wider">
              ทีมกู้ชีพประจำรอบ ({activeRound})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[11px] font-bold text-[#0c4a8e] hover:text-[#08305d] flex items-center gap-1 cursor-pointer bg-[#e5eef9] px-2 py-0.5 rounded"
          >
            {showAddForm ? "✕ ปิด" : "+ เพิ่มสมาชิก"}
          </button>
        </div>

        {/* Add Member Inline Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="mb-3 p-2.5 rounded-lg bg-[#f0f4f9] border border-[#d0d8e2] space-y-2 text-xs"
          >
            <div>
              <label className="font-bold text-slate-700 block mb-1">ชื่อ - นามสกุล หรือตำแหน่ง</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="เช่น นพ. เอกชัย, พย. อัจฉรา..."
                className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">บทบาทหน้าที่ (Role)</label>
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="เช่น ผู้ช่วยกดหน้าอก, ช่วยดูดเสมหะ..."
                className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white"
              />
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 text-slate-600 bg-white border border-slate-300 rounded font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-white bg-[#0c4a8e] rounded font-bold"
              >
                เพิ่มเข้าทีม
              </button>
            </div>
          </form>
        )}

        <p className="text-[11px] text-slate-500 mb-2.5 leading-snug">
          แตะชื่อเพื่อเลือกเป็นผู้ปฏิบัติการ หรือกด <b className="text-[#0c4a8e]">แสตมป์</b> เพื่อลงเวลาหัตถการให้สมาชิกคนนั้นทันที
        </p>

        {/* Member Cards List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {teamMembers.map((m) => {
            const isSelected = m.id === activeMemberId;
            return (
              <div
                key={m.id}
                className={`p-2.5 rounded-lg border transition flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-[#e5eef9] border-[#0c4a8e] ring-1 ring-[#0c4a8e]"
                    : "bg-[#f8fafc] border-[#e2e8f0] hover:bg-slate-100"
                }`}
              >
                <div
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onSelectMember(m)}
                >
                  <span className="text-xl shrink-0">{m.roleIcon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <span>{m.role}</span>
                      {isSelected && (
                        <span className="text-[9px] bg-[#0c4a8e] text-white px-1 rounded font-bold">
                          กำลังเลือก
                        </span>
                      )}
                    </div>

                    {editingId === m.id ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-1.5 py-0.5 text-xs border rounded bg-white w-full"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(m.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(m.id)}
                          className="text-xs bg-[#0c4a8e] text-white px-2 py-0.5 rounded font-bold"
                        >
                          บันทึก
                        </button>
                      </div>
                    ) : (
                      <div className="font-bold text-xs text-[#0c1727] truncate flex items-center gap-1.5">
                        <span className="truncate">{m.name || "แตะเพื่อระบุชื่อ"}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(m);
                          }}
                          className="text-slate-400 hover:text-slate-700 text-[10px]"
                          title="แก้ไขชื่อผู้ปฏิบัติงาน"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stamp Action Button */}
                <button
                  type="button"
                  onClick={() => onStampMember(m)}
                  className="bg-[#0c4a8e] hover:bg-[#08305d] text-white text-[11px] font-bold px-2.5 py-1.5 rounded shadow-sm transition active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
                  title={`บันทึกเวลาให้ ${m.name || m.role}`}
                >
                  ⏱️ แสตมป์
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
