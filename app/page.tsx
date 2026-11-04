"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
<div className="navbar bg-base-100 shadow-sm">
  <div className="navbar-start">
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <svg aria-label="Menu" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /> </svg>
      </div>
      <ul
        tabIndex={-1}
        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
        <li><a>Homepage</a></li>
        <li><a>Portfolio</a></li>
        <li><a>About</a></li>
      </ul>
    </div>
  </div>
  <div className="navbar-center">
    <a className="btn btn-ghost text-xl">daisyUI</a>
  </div>
  <div className="navbar-end">
    <button className="btn btn-ghost btn-circle">
      <svg aria-label="Search" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> </svg>
    </button>
    <button className="btn btn-ghost btn-circle">
      <div className="indicator">
        <svg aria-label="Notifications" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> </svg>
        <span className="badge badge-xs badge-primary indicator-item"></span>
      </div>
    </button>
  </div>
</div>
// ประเภทข้อมูลบันทึกเวลา
interface TimeRecord {
  id: string;
  no: number;
  date: string;
  time: string;
  timestamp: number;
  round: string;
  firstName: string;
  lastName: string;
  fullName: string;
  code: string;
  actionType: "check_in" | "checkpoint" | "check_out" | "note";
  actionLabel: string;
  elapsedInRound: string;
  note: string;
  synced: boolean;
  syncTime?: string;
}

// ข้อมูลของแต่ละรอบ (Round)
interface RoundInfo {
  id: string;
  name: string;
  startedAt: number;
  endedAt?: number;
}

const LOCAL_STORAGE_KEY = "mega_code_clock_records_v2";
const ROUNDS_STORAGE_KEY = "mega_code_clock_rounds_v2";
const ACTIVE_ROUND_KEY = "mega_code_clock_active_round_v2";
const SHEETS_URL_KEY = "mega_code_clock_sheets_url_v2";
const SOUND_KEY = "mega_code_clock_sound_v2";

export default function TimeClockPage() {
  // นาฬิกาแบบเรียลไทม์
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // ข้อมูลรอบ
  const [rounds, setRounds] = useState<RoundInfo[]>([
    { id: "round-1", name: "รอบที่ 1", startedAt: 0 },
  ]);
  const [activeRound, setActiveRound] = useState<string>("รอบที่ 1");
  const [activeRoundStartedAt, setActiveRoundStartedAt] = useState<number>(0);
  const [roundElapsed, setRoundElapsed] = useState<string>("00:00");

  // ฟอร์มบันทึกเวลา
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [actionType, setActionType] = useState<"check_in" | "checkpoint" | "check_out" | "note">("check_in");
  const [note, setNote] = useState<string>("");

  // รายการประวัติ
  const [records, setRecords] = useState<TimeRecord[]>([]);

  // การค้นหาและกรอง
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterRound, setFilterRound] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Modal ต่างๆ
  const [showNewRoundModal, setShowNewRoundModal] = useState<boolean>(false);
  const [newRoundInput, setNewRoundInput] = useState<string>("");

  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);

  const [showSheetsModal, setShowSheetsModal] = useState<boolean>(false);
  const [sheetsUrl, setSheetsUrl] = useState<string>("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "testing" | "success" | "error" | "syncing">("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");

  // การตั้งค่าเสียง
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Toast แจ้งเตือน
  const [toast, setToast] = useState<{ message: string; type: "ok" | "warn" | "err" } | null>(null);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const firstNameInputRef = useRef<HTMLInputElement | null>(null);

  // ==========================================
  // Web Audio Sound Engine (สังเคราะห์เสียง Beep / Chime)
  // ==========================================
  const playBeep = (freq: number = 880, durationMs: number = 100, type: OscillatorType = "sine") => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
    } catch {
      // Audio not permitted yet
    }
  };

  const playSuccessChime = () => {
    playBeep(659, 100, "triangle"); // E5
    setTimeout(() => playBeep(880, 150, "sine"), 90); // A5
  };

  const playNewRoundChime = () => {
    playBeep(523, 120, "sine"); // C5
    setTimeout(() => playBeep(659, 120, "sine"), 110); // E5
    setTimeout(() => playBeep(784, 200, "sine"), 220); // G5
  };

  const showToast = (message: string, type: "ok" | "warn" | "err" = "ok") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // ==========================================
  // Initial Load from LocalStorage
  // ==========================================
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now);

    try {
      const storedRecords = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedRecords) {
        setRecords(JSON.parse(storedRecords));
      }

      const storedRounds = localStorage.getItem(ROUNDS_STORAGE_KEY);
      let loadedRounds: RoundInfo[] = [];
      if (storedRounds) {
        loadedRounds = JSON.parse(storedRounds);
        setRounds(loadedRounds);
      } else {
        loadedRounds = [{ id: "round-1", name: "รอบที่ 1", startedAt: now.getTime() }];
        setRounds(loadedRounds);
      }

      const storedActiveRound = localStorage.getItem(ACTIVE_ROUND_KEY);
      const activeName = storedActiveRound || "รอบที่ 1";
      setActiveRound(activeName);

      const foundRound = loadedRounds.find((x) => x.name === activeName);
      setActiveRoundStartedAt(foundRound ? foundRound.startedAt : now.getTime());

      const storedUrl = localStorage.getItem(SHEETS_URL_KEY);
      if (storedUrl) {
        setSheetsUrl(storedUrl);
      }

      const storedSound = localStorage.getItem(SOUND_KEY);
      if (storedSound !== null) {
        setSoundEnabled(storedSound === "true");
      }
    } catch (e) {
      console.error("Failed to restore from storage", e);
    }
  }, []);

  // บันทึกลง LocalStorage ทุกครั้งที่ state เปลี่ยน
  useEffect(() => {
    if (records.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    }
  }, [records]);

  useEffect(() => {
    localStorage.setItem(ROUNDS_STORAGE_KEY, JSON.stringify(rounds));
  }, [rounds]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_ROUND_KEY, activeRound);
    const r = rounds.find((x) => x.name === activeRound);
    if (r) {
      setActiveRoundStartedAt(r.startedAt);
    }
  }, [activeRound, rounds]);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  // ==========================================
  // Clock Tick & Round Stopwatch Timer
  // ==========================================
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (activeRoundStartedAt) {
        const diffSec = Math.max(0, Math.floor((now.getTime() - activeRoundStartedAt) / 1000));
        const m = Math.floor(diffSec / 60);
        const s = diffSec % 60;
        setRoundElapsed(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [activeRoundStartedAt]);

  // ==========================================
  // Formatters
  // ==========================================
  const formatThaiDate = (d: Date | null) => {
    if (!d) return "--:--:--";
    const days = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return `${days[d.getDay()]}ที่ ${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  };

  const formatClock = (d: Date | null) => {
    if (!d) return "00:00:00";
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case "check_in":
        return "เข้างาน / เริ่มต้น";
      case "checkpoint":
        return "จุดเช็คพอยท์ / รอบ";
      case "check_out":
        return "ออกงาน / สิ้นสุด";
      case "note":
        return "บันทึกเหตุการณ์";
      default:
        return type;
    }
  };

  const getActionBadgeClass = (type: string) => {
    switch (type) {
      case "check_in":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "checkpoint":
        return "bg-sky-50 text-sky-700 border-sky-300";
      case "check_out":
        return "bg-rose-50 text-rose-700 border-rose-300";
      case "note":
        return "bg-amber-50 text-amber-700 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  // ==========================================
  // บันทึกเวลาอัตโนมัติ (Stamp Time)
  // ==========================================
  const handleStampTime = (customFirstName?: string, customLastName?: string) => {
    const fn = (customFirstName !== undefined ? customFirstName : firstName).trim();
    const ln = (customLastName !== undefined ? customLastName : lastName).trim();

    if (!fn) {
      showToast("กรุณากรอกชื่อก่อนบันทึกเวลา", "warn");
      playBeep(300, 150);
      firstNameInputRef.current?.focus();
      return;
    }

    const now = new Date();
    const id = `REC_${now.getTime()}_${Math.floor(Math.random() * 1000)}`;
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const timeStr = formatClock(now);

    const newRecord: TimeRecord = {
      id,
      no: records.length + 1,
      date: dateStr,
      time: timeStr,
      timestamp: now.getTime(),
      round: activeRound,
      firstName: fn,
      lastName: ln,
      fullName: `${fn} ${ln}`.trim(),
      code: code.trim(),
      actionType,
      actionLabel: getActionLabel(actionType),
      elapsedInRound: roundElapsed,
      note: note.trim(),
      synced: false,
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    playSuccessChime();
    showToast(`✅ บันทึกเวลา ${newRecord.fullName} (${timeStr}) สำเร็จ!`, "ok");

    // ถ้าพิมพ์จากฟอร์ม ให้ล้างค่าเพื่อให้พิมพ์คนถัดไปได้ทันที
    if (customFirstName === undefined) {
      setFirstName("");
      setLastName("");
      setNote("");
      firstNameInputRef.current?.focus();
    }

    // ซิงค์ไปยัง Google Sheets ทันที (ถ้ามี URL)
    if (sheetsUrl.trim()) {
      syncRecordToSheets(newRecord);
    }
  };

  // ==========================================
  // การเริ่มรอบใหม่ (Start New Round)
  // ==========================================
  const handleStartNewRound = () => {
    const nextRoundNumber = rounds.length + 1;
    const defaultName = `รอบที่ ${nextRoundNumber}`;
    setNewRoundInput(defaultName);
    setShowNewRoundModal(true);
  };

  const confirmNewRound = () => {
    const name = newRoundInput.trim() || `รอบที่ ${rounds.length + 1}`;
    const now = Date.now();

    // เพิ่มรอบใหม่เข้าลิสต์ โดยไม่ลบรอบเดิม
    const newRoundItem: RoundInfo = {
      id: `round-${now}`,
      name,
      startedAt: now,
    };

    const updatedRounds = [...rounds, newRoundItem];
    setRounds(updatedRounds);
    setActiveRound(name);
    setActiveRoundStartedAt(now);
    setRoundElapsed("00:00");

    localStorage.setItem(ROUNDS_STORAGE_KEY, JSON.stringify(updatedRounds));
    localStorage.setItem(ACTIVE_ROUND_KEY, name);

    setShowNewRoundModal(false);
    playNewRoundChime();
    showToast(`🏁 เริ่ม ${name} เรียบร้อยแล้ว (ข้อมูลรอบก่อนหน้ายังคงอยู่ครบ)`, "ok");
  };

  // ==========================================
  // แก้ไขและลบข้อมูล (Edit & Delete)
  // ==========================================
  const handleOpenEdit = (rec: TimeRecord) => {
    setEditingRecord({ ...rec });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    const fn = editingRecord.firstName.trim();
    if (!fn) {
      showToast("ชื่อไม่สามารถเว้นว่างได้", "warn");
      return;
    }

    const updatedRec: TimeRecord = {
      ...editingRecord,
      firstName: fn,
      lastName: editingRecord.lastName.trim(),
      fullName: `${fn} ${editingRecord.lastName.trim()}`.trim(),
      actionLabel: getActionLabel(editingRecord.actionType),
      synced: false,
    };

    const newRecords = records.map((r) => (r.id === updatedRec.id ? updatedRec : r));
    setRecords(newRecords);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newRecords));

    setShowEditModal(false);
    playSuccessChime();
    showToast("บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว", "ok");

    if (sheetsUrl.trim()) {
      updateRecordInSheets(updatedRec);
    }
  };

  const handleDeleteRecord = (id: string) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;

    if (confirm(`คุณต้องการลบข้อมูลของ "${rec.fullName}" (เวลา ${rec.time}) ใช่หรือไม่?`)) {
      const newRecords = records.filter((r) => r.id !== id);
      setRecords(newRecords);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newRecords));
      playBeep(400, 150);
      showToast(`ลบข้อมูล ${rec.fullName} เรียบร้อยแล้ว`, "warn");

      if (sheetsUrl.trim()) {
        deleteRecordFromSheets(id);
      }
    }
  };

  // ==========================================
  // Google Sheets API Synchronization
  // ==========================================
  const testSheetsConnection = async () => {
    if (!sheetsUrl.trim()) {
      setSyncStatus("error");
      setSyncMessage("กรุณาวาง URL ของ Web App ก่อน");
      return;
    }

    setSyncStatus("testing");
    setSyncMessage("กำลังทดสอบการเชื่อมต่อไปยัง Google Sheets...");

    try {
      const pingUrl = `${sheetsUrl.trim()}${sheetsUrl.includes("?") ? "&" : "?"}action=ping`;
      const res = await fetch(pingUrl, { method: "GET" });
      const data = await res.json();

      if (data && data.status === "success") {
        setSyncStatus("success");
        setSyncMessage(`เชื่อมต่อสำเร็จ! แผ่นงาน "${data.sheetName}" พร้อมใช้งาน (${data.totalRows} แถว)`);
        localStorage.setItem(SHEETS_URL_KEY, sheetsUrl.trim());
        playSuccessChime();
      } else {
        throw new Error(data.message || "ตอบกลับไม่ถูกต้อง");
      }
    } catch (err: unknown) {
      setSyncStatus("error");
      const errorMsg = err instanceof Error ? err.message : String(err);
      setSyncMessage(`เชื่อมต่อไม่สำเร็จ: ${errorMsg} (ตรวจดูว่าสิทธิ์เข้าถึงเป็น Anyone หรือยัง)`);
      playBeep(300, 200);
    }
  };

  const syncRecordToSheets = async (rec: TimeRecord) => {
    if (!sheetsUrl.trim()) return;
    try {
      await fetch(sheetsUrl.trim(), {
        method: "POST",
        mode: "no-cors", // ใช้ no-cors เพื่อข้ามข้อจำกัด Google Redirect
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "add", record: rec }),
      });

      // อัปเดตสถานะเป็น synced
      setRecords((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, synced: true, syncTime: formatClock(new Date()) } : r))
      );
    } catch (e) {
      console.warn("Auto-sync failed, queued for later", e);
    }
  };

  const updateRecordInSheets = async (rec: TimeRecord) => {
    if (!sheetsUrl.trim()) return;
    try {
      await fetch(sheetsUrl.trim(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "update", id: rec.id, record: rec }),
      });
      setRecords((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, synced: true } : r))
      );
    } catch (e) {
      console.warn("Update sync failed", e);
    }
  };

  const deleteRecordFromSheets = async (id: string) => {
    if (!sheetsUrl.trim()) return;
    try {
      await fetch(sheetsUrl.trim(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "delete", id }),
      });
    } catch (e) {
      console.warn("Delete sync failed", e);
    }
  };

  const syncAllPendingToSheets = async () => {
    if (!sheetsUrl.trim()) {
      showToast("กรุณาตั้งค่า Google Sheets Web App URL ก่อน", "warn");
      setShowSheetsModal(true);
      return;
    }

    const pending = records.filter((r) => !r.synced);
    if (pending.length === 0) {
      showToast("ข้อมูลทั้งหมดซิงค์กับ Google Sheets เรียบร้อยแล้ว", "ok");
      return;
    }

    setSyncStatus("syncing");
    showToast(`กำลังส่งข้อมูล ${pending.length} รายการไปยัง Google Sheets...`, "ok");

    try {
      await fetch(sheetsUrl.trim(), {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "batchAdd", records: pending }),
      });

      setRecords((prev) =>
        prev.map((r) => ({ ...r, synced: true, syncTime: formatClock(new Date()) }))
      );
      playSuccessChime();
      showToast(`ซิงค์ข้อมูล ${pending.length} รายการสำเร็จ!`, "ok");
      setSyncStatus("success");
    } catch (e) {
      showToast("เกิดข้อผิดพลาดในการซิงค์ข้อมูล", "err");
      console.error(e);
      setSyncStatus("error");
    }
  };

  // ==========================================
  // ส่งออก Excel (.csv with UTF-8 BOM / .xlsx)
  // ==========================================
  const exportToExcel = () => {
    if (records.length === 0) {
      showToast("ยังไม่มีข้อมูลสำหรับส่งออก", "warn");
      return;
    }

    const headers = [
      "ลำดับ",
      "รอบ (Round)",
      "วันที่",
      "เวลา",
      "เวลาในรอบ (Elapsed)",
      "ชื่อ",
      "นามสกุล",
      "ชื่อ-นามสกุล",
      "รหัส/สังกัด",
      "ประเภทการบันทึก",
      "หมายเหตุ",
      "สถานะซิงค์"
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredRecords.map((r, index) => [
      index + 1,
      r.round,
      r.date,
      r.time,
      r.elapsedInRound,
      r.firstName,
      r.lastName,
      r.fullName,
      r.code,
      r.actionLabel,
      r.note,
      r.synced ? "ซิงค์แล้ว" : "รอดำเนินการ",
    ]);

    // เติม UTF-8 BOM (\uFEFF) เพื่อให้ Excel ภาษาไทยแสดงผลสระวรรณยุกต์ได้อย่างสมบูรณ์
    const csvContent =
      "\uFEFF" +
      [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const d = new Date();
    const dateStamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;

    link.setAttribute("href", url);
    link.setAttribute("download", `MEGA_CodeClock_Report_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    playSuccessChime();
    showToast("ส่งออกไฟล์ Excel (CSV UTF-8) เรียบร้อยแล้ว", "ok");
  };

  // ==========================================
  // ส่งออก PDF / พิมพ์สรุปรายงาน (Print Summary)
  // ==========================================
  const exportToPdf = () => {
    if (records.length === 0) {
      showToast("ยังไม่มีข้อมูลสำหรับพิมพ์รายงาน", "warn");
      return;
    }

    const printWin = window.open("", "_blank");
    if (!printWin) {
      showToast("โปรดอนุญาตหน้าต่างป๊อปอัพ (Popup) บนเบราว์เซอร์เพื่อพิมพ์รายงาน", "warn");
      return;
    }

    const totalParticipants = new Set(filteredRecords.map((r) => r.fullName)).size;
    const totalRounds = new Set(filteredRecords.map((r) => r.round)).size;
    const nowStr = currentTime ? `${formatThaiDate(currentTime)} เวลา ${formatClock(currentTime)} น.` : "";

    const tableRowsHtml = filteredRecords
      .map(
        (r, i) => `
        <tr>
          <td style="text-align:center;">${i + 1}</td>
          <td><b>${r.round}</b></td>
          <td style="font-family:'JetBrains Mono', monospace; text-align:center;">${r.time}</td>
          <td style="font-family:'JetBrains Mono', monospace; text-align:center;">${r.elapsedInRound}</td>
          <td><b>${r.fullName}</b> ${r.code ? `<span style="color:#64748b; font-size:11px;">(${r.code})</span>` : ""}</td>
          <td>${r.actionLabel}</td>
          <td>${r.note || "-"}</td>
        </tr>
      `
      )
      .join("");

    const reportHtml = `
      <!doctype html>
      <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>รายงานสรุปการบันทึกเวลา · MEGA Code Clock</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: 'Sarabun', -apple-system, sans-serif;
            color: #0c1727;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 13px;
            line-height: 1.45;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0b2545;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .title h1 {
            margin: 0;
            font-size: 20px;
            color: #0b2545;
            font-weight: 800;
          }
          .title p {
            margin: 4px 0 0;
            color: #475569;
            font-size: 12px;
          }
          .badge {
            background: #0b2545;
            color: #ffffff;
            padding: 6px 14px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 700;
            text-align: right;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .stat-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px 12px;
          }
          .stat-label {
            font-size: 10.5px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
          }
          .stat-value {
            font-size: 20px;
            font-weight: 800;
            color: #0b2545;
            font-family: 'JetBrains Mono', monospace;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 7px 9px;
            text-align: left;
          }
          th {
            background: #0b2545;
            color: #ffffff;
            font-weight: 700;
          }
          tr:nth-child(even) { background: #f8fafc; }
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
            page-break-inside: avoid;
          }
          .signature-box {
            text-align: center;
            border-top: 1px dashed #94a3b8;
            padding-top: 10px;
          }
          .toolbar {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #0b2545;
            padding: 10px 18px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.25);
            display: flex;
            gap: 10px;
          }
          .toolbar button {
            background: #ffffff;
            color: #0b2545;
            border: 0;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
          }
          @media print {
            .toolbar { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button onclick="window.print()">🖨️ พิมพ์รายงาน / บันทึก PDF</button>
          <button onclick="window.close()" style="background:#e2e8f0; color:#334155;">ปิดหน้าต่าง</button>
        </div>

        <div class="header">
          <div class="title">
            <h1>รายงานสรุปการบันทึกเวลา · MEGA CODE CLOCK</h1>
            <p>ระบบบันทึกเวลาปฏิบัติงานและกิจกรรมฐานข้อมูล Google Sheets</p>
            <p style="margin-top:2px; font-weight:600; color:#0c4a8e;">พิมพ์เมื่อ: ${nowStr}</p>
          </div>
          <div class="badge">
            <div>เอกสารสรุปผลเวลา</div>
            <div style="font-size:10px; opacity:0.8; font-weight:normal;">OFFICIAL TIME LOG</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">จำนวนรอบที่แสดง</div>
            <div class="stat-value">${totalRounds}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">รายการลงเวลาทั้งหมด</div>
            <div class="stat-value">${filteredRecords.length}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">จำนวนผู้เข้าร่วม</div>
            <div class="stat-value">${totalParticipants}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">เวลาที่เริ่มรายการแรก</div>
            <div class="stat-value" style="font-size:16px;">${filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1].time : "-"}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:40px; text-align:center;">#</th>
              <th style="width:100px;">รอบ</th>
              <th style="width:80px; text-align:center;">เวลา</th>
              <th style="width:80px; text-align:center;">เวลาในรอบ</th>
              <th>ชื่อ-นามสกุล</th>
              <th style="width:130px;">ประเภท</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-box">
            <p style="margin-bottom:45px;">ลงชื่อ..............................................................</p>
            <p style="margin:0; font-weight:700;">( ผู้บันทึกเวลา / Recorder )</p>
            <p style="margin:2px 0 0; color:#64748b; font-size:11px;">วันที่ ......./......./...........</p>
          </div>
          <div class="signature-box">
            <p style="margin-bottom:45px;">ลงชื่อ..............................................................</p>
            <p style="margin:0; font-weight:700;">( หัวหน้างาน / ผู้รับรองผล )</p>
            <p style="margin:2px 0 0; color:#64748b; font-size:11px;">วันที่ ......./......./...........</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWin.document.write(reportHtml);
    printWin.document.close();
  };

  // ==========================================
  // Filtered & Sorted Records
  // ==========================================
  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.round.toLowerCase().includes(q) ||
          r.note.toLowerCase().includes(q) ||
          r.time.includes(q)
      );
    }

    if (filterRound !== "all") {
      result = result.filter((r) => r.round === filterRound);
    }

    if (filterType !== "all") {
      result = result.filter((r) => r.actionType === filterType);
    }

    result.sort((a, b) => {
      return sortOrder === "desc" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return result;
  }, [records, searchQuery, filterRound, filterType, sortOrder]);

  // สรุปข้อมูลผู้เข้าร่วมในรอบปัจจุบันสำหรับ Quick Roster
  const currentRoundParticipants = useMemo(() => {
    const list: { firstName: string; lastName: string; fullName: string; count: number }[] = [];
    const seen = new Set<string>();

    records
      .filter((r) => r.round === activeRound)
      .forEach((r) => {
        if (!seen.has(r.fullName)) {
          seen.add(r.fullName);
          const count = records.filter((x) => x.round === activeRound && x.fullName === r.fullName).length;
          list.push({
            firstName: r.firstName,
            lastName: r.lastName,
            fullName: r.fullName,
            count,
          });
        }
      });
    return list;
  }, [records, activeRound]);

  const unsyncedCount = useMemo(() => records.filter((r) => !r.synced).length, [records]);

  return (
    <div className="min-h-screen bg-[#eef2f6] text-[#0c1727] flex flex-col font-sans select-none">
      {/* =========================================================================
          TOP HEADER (Navy Blue Gradient - Style MEGA Code Clock)
          ========================================================================= */}
      <header className="bg-gradient-to-b from-[#0b2545] to-[#13325f] text-white border-b border-[#0b2545] shadow-md px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-[#0b2545] flex items-center justify-center font-bold text-lg shadow-sm border border-slate-200">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide text-white leading-tight flex items-center gap-2">
                <span>MEGA Code Clock</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-slate-200 font-semibold tracking-wider uppercase">
                  Time Tracker
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium tracking-wide">
                ระบบบันทึกเวลาปฏิบัติงานและกิจกรรม · Google Sheets Database
              </div>
            </div>
          </div>

          {/* Real-time Digital Clock & Status Pill */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wider text-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot shadow-[0_0_8px_#34d399]" />
              <span>กำลังบันทึก (LIVE)</span>
            </div>

            {/* Google Sheets Sync Status Button */}
            <button
              onClick={() => setShowSheetsModal(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition border ${
                sheetsUrl
                  ? unsyncedCount > 0
                    ? "bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30"
                  : "bg-white/10 text-slate-200 border-white/20 hover:bg-white/20"
              }`}
              title="ตั้งค่าการเชื่อมต่อ Google Sheets"
            >
              <span>{sheetsUrl ? (unsyncedCount > 0 ? "⏳" : "☁️") : "⚙️"}</span>
              <span>
                {sheetsUrl
                  ? unsyncedCount > 0
                    ? `ค้างส่ง ${unsyncedCount} รายการ`
                    : "Sheets เชื่อมต่อแล้ว"
                  : "เชื่อมต่อ Google Sheets"}
              </span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition text-xs flex items-center gap-1 px-2.5"
              title="เปิด/ปิดเสียง"
            >
              <span>{soundEnabled ? "🔊" : "🔇"}</span>
              <span className="text-[11px] hidden sm:inline">{soundEnabled ? "เสียงเปิด" : "ปิดเสียง"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTAINER
          ========================================================================= */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex-1 flex flex-col gap-5">
        {/* ==========================================
            HERO PANEL: CLOCK & ROUND CONTROLS
            ========================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Real-time Clock Card (Left / 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#d0d8e2] shadow-[0_1px_3px_rgba(15,23,42,0.05)] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#e3e8ef] pb-2.5 mb-2">
                <span className="text-[11px] font-bold text-[#5a6a82] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0c4a8e]"></span>
                  เวลาปัจจุบัน (REAL-TIME CLOCK)
                </span>
                <span className="text-xs text-[#5a6a82] font-medium font-sans">
                  {formatThaiDate(currentTime)}
                </span>
              </div>

              {/* Massive Digital Display */}
              <div className="py-2">
                <div className="font-mono-tabular text-5xl sm:text-7xl md:text-8xl font-black text-[#0c1727] tracking-tight leading-none">
                  {formatClock(currentTime)}
                </div>
              </div>
            </div>

            {/* Bottom Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-3 border-t border-[#e3e8ef]">
              <div className="bg-[#f7f9fc] border border-[#d0d8e2] rounded-lg p-2.5">
                <div className="text-[10px] font-bold text-[#5a6a82] uppercase tracking-wider">รอบปัจจุบัน</div>
                <div className="font-mono-tabular text-lg font-bold text-[#0c4a8e] truncate" title={activeRound}>
                  {activeRound}
                </div>
              </div>
              <div className="bg-[#f7f9fc] border border-[#d0d8e2] rounded-lg p-2.5">
                <div className="text-[10px] font-bold text-[#5a6a82] uppercase tracking-wider">คนในรอบนี้</div>
                <div className="font-mono-tabular text-lg font-bold text-[#0c1727]">
                  {currentRoundParticipants.length} <span className="text-xs font-normal text-[#5a6a82]">คน</span>
                </div>
              </div>
              <div className="bg-[#f7f9fc] border border-[#d0d8e2] rounded-lg p-2.5">
                <div className="text-[10px] font-bold text-[#5a6a82] uppercase tracking-wider">บันทึกทั้งหมด</div>
                <div className="font-mono-tabular text-lg font-bold text-[#0c1727]">
                  {records.length} <span className="text-xs font-normal text-[#5a6a82]">ครั้ง</span>
                </div>
              </div>
              <div className="bg-[#f7f9fc] border border-[#d0d8e2] rounded-lg p-2.5">
                <div className="text-[10px] font-bold text-[#5a6a82] uppercase tracking-wider">สถานะชีต</div>
                <div className="text-sm font-bold text-emerald-700 truncate flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {sheetsUrl ? (unsyncedCount > 0 ? `ค้าง ${unsyncedCount}` : "ซิงค์ครบ") : "ออฟไลน์"}
                </div>
              </div>
            </div>
          </div>

          {/* Active Round Timer Card (Right / 5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0b2545] to-[#13325f] text-white rounded-xl shadow-md p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-300 text-xs font-semibold uppercase tracking-wider pb-2 border-b border-white/10">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  เวลารอบปัจจุบัน (ROUND STOPWATCH)
                </span>
                <span className="bg-white/10 text-white px-2 py-0.5 rounded text-[11px] font-mono">
                  {activeRound}
                </span>
              </div>

              {/* Stopwatch value */}
              <div className="my-3">
                <div className="font-mono-tabular text-5xl sm:text-6xl font-black text-amber-300 tracking-tight">
                  {roundElapsed}
                </div>
                <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
                  <span>เริ่มเมื่อ: {activeRoundStartedAt ? formatClock(new Date(activeRoundStartedAt)) : "-"}</span>
                  <span className="text-[11px] text-slate-400">นับเวลาต่อเนื่องในรอบนี้</span>
                </div>
              </div>
            </div>

            {/* Action Buttons for Rounds */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleStartNewRound}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-[#0b2545] font-extrabold px-4 py-2.5 rounded-lg text-sm tracking-wide shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>เริ่มรอบใหม่ (NEW ROUND)</span>
                </button>

                {/* Round Switcher Dropdown */}
                <select
                  value={activeRound}
                  onChange={(e) => {
                    const sel = e.target.value;
                    setActiveRound(sel);
                    const r = rounds.find((x) => x.name === sel);
                    if (r) setActiveRoundStartedAt(r.startedAt);
                    showToast(`สลับไปยัง ${sel}`, "ok");
                  }}
                  className="bg-white/10 border border-white/20 text-white rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  title="สลับรอบการทำงาน"
                >
                  {rounds.map((r) => (
                    <option key={r.id} value={r.name} className="bg-[#0b2545] text-white">
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-slate-300 text-center">
                💡 การเริ่มรอบใหม่จะไม่ลบข้อมูลเดิม ข้อมูลรอบก่อนหน้าจะถูกเก็บไว้อย่างถาวร
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            RECORDING FORM & QUICK ROSTER
            ========================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Time-Stamp Form (Left 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-[#d0d8e2] shadow-[0_1px_3px_rgba(15,23,42,0.05)] p-5">
            <div className="flex items-center justify-between border-b border-[#e3e8ef] pb-3 mb-4">
              <h2 className="font-extrabold text-base text-[#0b2545] flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#0c4a8e]"></span>
                กรอกข้อมูลและบันทึกเวลา (TIME STAMP ENTRY)
              </h2>
              <span className="text-xs bg-[#e5eef9] text-[#0c4a8e] font-bold px-2.5 py-1 rounded">
                รอบที่กำลังบันทึก: {activeRound}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStampTime();
              }}
              className="flex flex-col gap-3.5"
            >
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                    ชื่อ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    ref={firstNameInputRef}
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="เช่น สมชาย, วิภาดา..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#d0d8e2] bg-white text-[#0c1727] text-sm font-medium focus:outline-none focus:border-[#0c4a8e] focus:ring-2 focus:ring-[#e5eef9] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                    นามสกุล
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="เช่น ใจดี, รักชาติ..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#d0d8e2] bg-white text-[#0c1727] text-sm font-medium focus:outline-none focus:border-[#0c4a8e] focus:ring-2 focus:ring-[#e5eef9] transition"
                  />
                </div>
              </div>

              {/* Row 2: Code / Dept & Action Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                    รหัส / เลขประจำตัว / สังกัด (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="เช่น EMP-001, ทีม A, ER..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#d0d8e2] bg-white text-[#0c1727] text-sm font-medium focus:outline-none focus:border-[#0c4a8e] focus:ring-2 focus:ring-[#e5eef9] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                    ประเภทการบันทึก
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActionType("check_in")}
                      className={`px-2 py-2 rounded text-xs font-bold border transition ${
                        actionType === "check_in"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-[#f7f9fc] text-[#2c3a52] border-[#d0d8e2] hover:bg-emerald-50"
                      }`}
                    >
                      เข้างาน
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType("checkpoint")}
                      className={`px-2 py-2 rounded text-xs font-bold border transition ${
                        actionType === "checkpoint"
                          ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                          : "bg-[#f7f9fc] text-[#2c3a52] border-[#d0d8e2] hover:bg-sky-50"
                      }`}
                    >
                      เช็คพอยท์
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType("check_out")}
                      className={`px-2 py-2 rounded text-xs font-bold border transition ${
                        actionType === "check_out"
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "bg-[#f7f9fc] text-[#2c3a52] border-[#d0d8e2] hover:bg-rose-50"
                      }`}
                    >
                      ออกงาน
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType("note")}
                      className={`px-2 py-2 rounded text-xs font-bold border transition ${
                        actionType === "note"
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-[#f7f9fc] text-[#2c3a52] border-[#d0d8e2] hover:bg-amber-50"
                      }`}
                    >
                      เหตุการณ์
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Note */}
              <div>
                <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                  หมายเหตุเพิ่มเติม
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น ผ่านฐานทดสอบ 1, อุณหภูมิปกติ, ส่งต่อเวร..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#d0d8e2] bg-white text-[#0c1727] text-sm font-medium focus:outline-none focus:border-[#0c4a8e] focus:ring-2 focus:ring-[#e5eef9] transition"
                />
              </div>

              {/* Big Primary Stamp Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#0c4a8e] hover:bg-[#08305d] active:translate-y-0.5 text-white font-extrabold px-6 py-3.5 rounded-lg text-base tracking-wide shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>⚡ กดบันทึกเวลาอัตโนมัติ (STAMP TIME NOW)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Participant Roster (Right 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#d0d8e2] shadow-[0_1px_3px_rgba(15,23,42,0.05)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#e3e8ef] pb-3 mb-3">
                <h3 className="font-extrabold text-sm text-[#0b2545] uppercase tracking-wider flex items-center gap-1.5">
                  <span>👥 ผู้เข้าร่วมใน {activeRound}</span>
                </h3>
                <span className="text-xs font-bold text-[#0c4a8e] bg-[#e5eef9] px-2 py-0.5 rounded-full">
                  {currentRoundParticipants.length} คน
                </span>
              </div>

              <p className="text-xs text-[#5a6a82] mb-3 leading-relaxed">
                แตะปุ่มเพื่อบันทึกเวลาซ้ำให้อัตโนมัติ (สำหรับเช็คพอยท์หรือลงเวลาออกโดยไม่ต้องพิมพ์ชื่อใหม่)
              </p>

              {/* Participant List */}
              <div className="max-h-[250px] overflow-y-auto flex flex-col gap-2 pr-1">
                {currentRoundParticipants.length === 0 ? (
                  <div className="text-center py-8 text-[#8a96aa] text-xs">
                    ยังไม่มีผู้ลงเวลาในรอบนี้<br />
                    พิมพ์ชื่อและกดบันทึกเวลาเพื่อเริ่มรายชื่อ
                  </div>
                ) : (
                  currentRoundParticipants.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#e3e8ef] bg-[#f7f9fc] hover:bg-[#f0f4f9] transition"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-[#0c1727] truncate">{p.fullName}</div>
                        <div className="text-[10px] text-[#5a6a82]">บันทึกแล้ว {p.count} ครั้ง</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStampTime(p.firstName, p.lastName)}
                        className="bg-[#0c4a8e] hover:bg-[#08305d] text-white text-[11px] font-bold px-2.5 py-1.5 rounded shadow-sm transition active:scale-95 whitespace-nowrap"
                        title={`บันทึกเวลาให้ ${p.fullName}`}
                      >
                        ⏱️ แสตมป์
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#e3e8ef] mt-3">
              <button
                type="button"
                onClick={syncAllPendingToSheets}
                disabled={unsyncedCount === 0}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  unsyncedCount > 0
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>🔄 ซิงค์ข้อมูลค้างส่ง ({unsyncedCount} รายการ)</span>
              </button>
            </div>
          </div>
        </section>

        {/* ==========================================
            HISTORY TABLE & MANAGEMENT
            ========================================== */}
        <section className="bg-white rounded-xl border border-[#d0d8e2] shadow-[0_1px_3px_rgba(15,23,42,0.05)] p-5">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#e3e8ef] pb-4 mb-4">
            <div>
              <h2 className="font-extrabold text-base text-[#0b2545] flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#047857]"></span>
                ตารางประวัติการบันทึกเวลา (TIME LOG HISTORY)
              </h2>
              <p className="text-xs text-[#5a6a82] mt-0.5">
                เรียงตามเวลา สามารถค้นหา แก้ไข และส่งออกเป็น Excel หรือ PDF ได้
              </p>
            </div>

            {/* Export & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportToExcel}
                className="bg-[#166534] hover:bg-[#14532d] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                title="ดาวน์โหลดไฟล์ Excel (.csv รองรับภาษาไทย)"
              >
                <span>📊</span>
                <span>ส่งออก Excel</span>
              </button>

              <button
                type="button"
                onClick={exportToPdf}
                className="bg-[#0b2545] hover:bg-[#13325f] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                title="พิมพ์รายงานสรุป A4 หรือบันทึก PDF"
              >
                <span>🖨️</span>
                <span>พิมพ์ / ส่งออก PDF</span>
              </button>

              <button
                type="button"
                onClick={syncAllPendingToSheets}
                className="bg-[#0c4a8e] hover:bg-[#08305d] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                title="ซิงค์ข้อมูลกับ Google Sheets ทันที"
              >
                <span>🔄</span>
                <span>ซิงค์ Sheets</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 mb-4 bg-[#f7f9fc] p-3 rounded-lg border border-[#e3e8ef]">
            {/* Search Box (6 cols) */}
            <div className="lg:col-span-5 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 ค้นหาชื่อ, สกุล, รหัส, หมายเหตุ..."
                className="w-full pl-3 pr-8 py-2 rounded-md border border-[#d0d8e2] bg-white text-xs font-medium focus:outline-none focus:border-[#0c4a8e]"
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

            {/* Filter by Round (3 cols) */}
            <div className="lg:col-span-3">
              <select
                value={filterRound}
                onChange={(e) => setFilterRound(e.target.value)}
                className="w-full py-2 px-3 rounded-md border border-[#d0d8e2] bg-white text-xs font-medium focus:outline-none focus:border-[#0c4a8e]"
              >
                <option value="all">ทุกลำดับรอบ ({rounds.length} รอบ)</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Action Type (2 cols) */}
            <div className="lg:col-span-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full py-2 px-3 rounded-md border border-[#d0d8e2] bg-white text-xs font-medium focus:outline-none focus:border-[#0c4a8e]"
              >
                <option value="all">ทุกประเภท</option>
                <option value="check_in">เข้างาน</option>
                <option value="checkpoint">เช็คพอยท์</option>
                <option value="check_out">ออกงาน</option>
                <option value="note">เหตุการณ์</option>
              </select>
            </div>

            {/* Sort Toggle (2 cols) */}
            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="w-full py-2 px-3 rounded-md border border-[#d0d8e2] bg-white text-xs font-bold text-[#2c3a52] hover:bg-[#f0f4f9] transition flex items-center justify-center gap-1.5"
              >
                <span>{sortOrder === "desc" ? "⬇️ ล่าสุดก่อน" : "⬆️ เก่าสุดก่อน"}</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-lg border border-[#e3e8ef]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0b2545] text-white">
                  <th className="py-2.5 px-3 text-center w-12 font-bold">#</th>
                  <th className="py-2.5 px-3 font-bold w-28">รอบ</th>
                  <th className="py-2.5 px-3 font-bold text-center w-24">เวลา</th>
                  <th className="py-2.5 px-3 font-bold text-center w-20">เวลาในรอบ</th>
                  <th className="py-2.5 px-3 font-bold">ชื่อ - นามสกุล</th>
                  <th className="py-2.5 px-3 font-bold w-24">รหัส/สังกัด</th>
                  <th className="py-2.5 px-3 font-bold w-28 text-center">ประเภท</th>
                  <th className="py-2.5 px-3 font-bold">หมายเหตุ</th>
                  <th className="py-2.5 px-3 font-bold text-center w-20">ซิงค์ชีต</th>
                  <th className="py-2.5 px-3 font-bold text-center w-24">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ef] bg-white">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#8a96aa]">
                      <div className="text-base font-semibold">ไม่พบข้อมูลบันทึกเวลา</div>
                      <div className="text-xs mt-1">กดบันทึกเวลาในฟอร์มด้านบนเพื่อเริ่มบันทึกข้อมูล</div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, index) => (
                    <tr key={r.id} className="hover:bg-[#f7f9fc] transition">
                      <td className="py-2.5 px-3 text-center font-mono text-[#5a6a82] font-semibold">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#0c4a8e]">
                        <span className="bg-[#e5eef9] text-[#0c4a8e] px-2 py-0.5 rounded text-[11px] font-bold">
                          {r.round}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular font-bold text-[#0c1727]">
                        {r.time}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-tabular text-slate-500 font-semibold">
                        {r.elapsedInRound}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#0c1727] text-sm">{r.fullName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {r.code || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${getActionBadgeClass(
                            r.actionType
                          )}`}
                        >
                          {r.actionLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={r.note}>
                        {r.note || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.synced ? (
                          <span className="text-emerald-600 font-bold text-xs" title={`ซิงค์แล้ว (${r.syncTime || ""})`}>
                            ☁️ สำเร็จ
                          </span>
                        ) : (
                          <span className="text-amber-500 font-bold text-xs" title="รอดำเนินการซิงค์">
                            ⏳ รอซิงค์
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            className="p-1 text-[#0c4a8e] hover:bg-[#e5eef9] rounded transition"
                            title="แก้ไขข้อมูล"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                            title="ลบข้อมูล"
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

          {/* Table Summary Footer */}
          <div className="flex items-center justify-between text-xs text-[#5a6a82] mt-3 px-1">
            <span>
              แสดง {filteredRecords.length} จากทั้งหมด {records.length} รายการ
            </span>
            <span>
              {unsyncedCount > 0 ? (
                <span className="text-amber-600 font-bold">⚠️ มี {unsyncedCount} รายการรอซิงค์กับ Google Sheets</span>
              ) : (
                <span className="text-emerald-700 font-semibold">✓ ข้อมูลทั้งหมดซิงค์กับฐานข้อมูลเรียบร้อย</span>
              )}
            </span>
          </div>
        </section>
      </main>

      {/* =========================================================================
          MODAL: START NEW ROUND (เริ่มรอบใหม่)
          ========================================================================= */}
      {showNewRoundModal && (
        <div className="fixed inset-0 bg-[#0b2545]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#d0d8e2] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-[#0b2545] to-[#13325f] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span>➕ เริ่มรอบใหม่ (Start New Round)</span>
              </h3>
              <button
                onClick={() => setShowNewRoundModal(false)}
                className="text-slate-300 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                  ชื่อรอบใหม่
                </label>
                <input
                  type="text"
                  value={newRoundInput}
                  onChange={(e) => setNewRoundInput(e.target.value)}
                  placeholder="เช่น รอบที่ 2, รอบวิ่ง 100 เมตร สาย B..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#d0d8e2] text-sm font-bold focus:outline-none focus:border-[#0c4a8e] focus:ring-2 focus:ring-[#e5eef9]"
                  autoFocus
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 leading-relaxed">
                <b>หมายเหตุปลอดภัย:</b> ข้อมูลของรอบเดิมจะไม่ถูกลบ ข้อมูลทั้งหมดจะคงอยู่ในประวัติและส่งเข้า Google Sheets อย่างต่อเนื่อง
              </div>
            </div>

            <div className="bg-[#f7f9fc] px-5 py-3 border-t border-[#e3e8ef] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewRoundModal(false)}
                className="px-4 py-2 rounded-lg border border-[#d0d8e2] text-xs font-bold text-[#5a6a82] hover:bg-white cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmNewRound}
                className="px-5 py-2 rounded-lg bg-[#0c4a8e] hover:bg-[#08305d] text-white text-xs font-extrabold shadow cursor-pointer"
              >
                ยืนยันเริ่มรอบใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT RECORD (แก้ไขข้อมูล)
          ========================================================================= */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-[#0b2545]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#d0d8e2] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0b2545] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span>✏️ แก้ไขข้อมูลบันทึกเวลา</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-300 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                    ชื่อ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingRecord.firstName}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#d0d8e2] text-sm font-medium focus:outline-none focus:border-[#0c4a8e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                    นามสกุล
                  </label>
                  <input
                    type="text"
                    value={editingRecord.lastName}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#d0d8e2] text-sm font-medium focus:outline-none focus:border-[#0c4a8e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                    รอบ (Round)
                  </label>
                  <select
                    value={editingRecord.round}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, round: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#d0d8e2] text-sm font-medium focus:outline-none focus:border-[#0c4a8e]"
                  >
                    {rounds.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                    เวลาบันทึก (HH:mm:ss)
                  </label>
                  <input
                    type="text"
                    value={editingRecord.time}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, time: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#d0d8e2] font-mono text-sm font-medium focus:outline-none focus:border-[#0c4a8e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                    รหัส / สังกัด
                  </label>
                  <input
                    type="text"
                    value={editingRecord.code}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, code: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#d0d8e2] text-sm font-medium focus:outline-none focus:border-[#0c4a8e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                    ประเภทการบันทึก
                  </label>
                  <select
                    value={editingRecord.actionType}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        actionType: e.target.value as "check_in" | "checkpoint" | "check_out" | "note",
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#d0d8e2] text-sm font-medium focus:outline-none focus:border-[#0c4a8e]"
                  >
                    <option value="check_in">เข้างาน / เริ่มต้น</option>
                    <option value="checkpoint">จุดเช็คพอยท์ / รอบ</option>
                    <option value="check_out">ออกงาน / สิ้นสุด</option>
                    <option value="note">บันทึกเหตุการณ์</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                  หมายเหตุ
                </label>
                <input
                  type="text"
                  value={editingRecord.note}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, note: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#d0d8e2] text-sm font-medium focus:outline-none focus:border-[#0c4a8e]"
                />
              </div>
            </div>

            <div className="bg-[#f7f9fc] px-5 py-3 border-t border-[#e3e8ef] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg border border-[#d0d8e2] text-xs font-bold text-[#5a6a82] hover:bg-white cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-lg bg-[#0c4a8e] hover:bg-[#08305d] text-white text-xs font-extrabold shadow cursor-pointer"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: GOOGLE SHEETS SETUP & SYNC
          ========================================================================= */}
      {showSheetsModal && (
        <div className="fixed inset-0 bg-[#0b2545]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-[#d0d8e2] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0b2545] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span>☁️ ตั้งค่าฐานข้อมูล Google Sheets</span>
              </h3>
              <button
                onClick={() => setShowSheetsModal(false)}
                className="text-slate-300 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2c3a52] uppercase tracking-wider mb-1">
                  Google Apps Script Web App URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#d0d8e2] text-xs font-mono focus:outline-none focus:border-[#0c4a8e]"
                  />
                  <button
                    type="button"
                    onClick={testSheetsConnection}
                    className="bg-[#0c4a8e] hover:bg-[#08305d] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    {syncStatus === "testing" ? "กำลังตรวจ..." : "ทดสอบ"}
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {syncMessage && (
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
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

              {/* Instructions */}
              <div className="bg-[#f7f9fc] border border-[#d0d8e2] rounded-lg p-3.5 text-xs text-[#2c3a52] flex flex-col gap-2">
                <div className="font-extrabold text-[#0b2545] flex items-center gap-1.5">
                  <span>📋 วิธีเชื่อมต่อ Google Sheets แบบง่าย (ทำครั้งเดียว):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                  <li>เปิด Google Sheets ใหม่ที่ต้องการใช้เก็บข้อมูล</li>
                  <li>ไปที่เมนู <b>ส่วนขยาย (Extensions) &gt; Apps Script</b></li>
                  <li>นำโค้ดในโฟลเดอร์ <code>google-apps-script/Code.gs</code> ไปวางทับ</li>
                  <li>กด <b>การทำให้ใช้งานได้ (Deploy) &gt; การทำให้ใช้งานได้ใหม่ (New deployment)</b></li>
                  <li>เลือกประเภท <b>เว็บแอป (Web app)</b> และตั้งค่า <b>ผู้มีสิทธิ์เข้าถึง: ทุกคน (Anyone)</b></li>
                  <li>คัดลอก URL ของเว็บแอป (ลงท้ายด้วย <code>/exec</code>) มาวางในช่องด้านบน</li>
                </ol>
              </div>
            </div>

            <div className="bg-[#f7f9fc] px-5 py-3 border-t border-[#e3e8ef] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSheetsModal(false)}
                className="px-4 py-2 rounded-lg border border-[#d0d8e2] text-xs font-bold text-[#5a6a82] hover:bg-white cursor-pointer"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(SHEETS_URL_KEY, sheetsUrl.trim());
                  setShowSheetsModal(false);
                  showToast("บันทึกการตั้งค่า Google Sheets แล้ว", "ok");
                }}
                className="px-5 py-2 rounded-lg bg-[#0c4a8e] hover:bg-[#08305d] text-white text-xs font-extrabold shadow cursor-pointer"
              >
                บันทึก URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TOAST NOTIFICATION
          ========================================================================= */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-lg shadow-xl text-white text-xs font-extrabold z-50 transition-all transform animate-in fade-in slide-in-from-bottom-4 duration-150 flex items-center gap-2 ${
            toast.type === "ok"
              ? "bg-[#0b2545] border border-emerald-400"
              : toast.type === "warn"
              ? "bg-[#a16207] border border-amber-300"
              : "bg-[#b91c1c] border border-rose-300"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
