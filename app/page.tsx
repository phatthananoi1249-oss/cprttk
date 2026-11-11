"use client";

import React, { useState, useEffect, useRef } from "react";
import { TimeRecord, RoundInfo, RecordActionType, PatientCaseInfo } from "@/types/sheets";
import {
  pingGoogleSheets,
  addRecordToSheets as apiAddRecord,
  batchAddRecordsToSheets as apiBatchAddRecords,
  updateRecordInSheets as apiUpdateRecord,
  deleteRecordFromSheets as apiDeleteRecord,
} from "@/lib/google-sheets";
import { hospitalAudio } from "@/lib/audio";
import { HospitalHeader } from "@/components/hospital/HospitalHeader";
import { ResuscitationConsole } from "@/components/hospital/ResuscitationConsole";
import { TeamRosterPanel, TeamMember } from "@/components/hospital/TeamRosterPanel";
import { ManualEntryForm } from "@/components/hospital/ManualEntryForm";
import { ClinicalHistoryTable } from "@/components/hospital/ClinicalHistoryTable";
import { PatientInfoModal } from "@/components/hospital/PatientInfoModal";
import { MedicalReportModal } from "@/components/hospital/MedicalReportModal";
import { SheetsConfigModal } from "@/components/hospital/SheetsConfigModal";
import { EditRecordModal } from "@/components/hospital/EditRecordModal";

function generateRecordId(timestamp: number): string {
  return `REC_${timestamp}_${Math.floor(Math.random() * 1000)}`;
}

const LOCAL_STORAGE_KEY = "mega_code_hospital_records_v3";
const ROUNDS_STORAGE_KEY = "mega_code_hospital_rounds_v3";
const ACTIVE_ROUND_KEY = "mega_code_hospital_active_round_v3";
const CASE_STORAGE_KEY = "mega_code_hospital_case_v3";
const SHEETS_URL_KEY = "mega_code_hospital_sheets_url_v3";
const SOUND_KEY = "mega_code_hospital_sound_v3";
const TEAM_STORAGE_KEY = "mega_code_hospital_team_v3";

const DEFAULT_TEAM: TeamMember[] = [
  { id: "leader", role: "แพทย์หัวหน้าทีม (Leader MD)", roleIcon: "👨‍⚕️", name: "", count: 0 },
  { id: "comp1", role: "ผู้กดหน้าอก 1 (Compressor 1)", roleIcon: "🫀", name: "", count: 0 },
  { id: "comp2", role: "ผู้กดหน้าอก 2 (Compressor 2)", roleIcon: "🫀", name: "", count: 0 },
  { id: "airway", role: "ทางเดินหายใจ (Airway / ETT)", roleIcon: "🫁", name: "", count: 0 },
  { id: "med", role: "พยาบาลให้ยา (Medication RN)", roleIcon: "💊", name: "", count: 0 },
  { id: "recorder", role: "ผู้บันทึกเวลา (Recorder RN)", roleIcon: "📋", name: "", count: 0 },
];

export default function HospitalCodeClockPage() {
  // 1. นาฬิกาและสถานะเคสกู้ชีพ
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [codeStatus, setCodeStatus] = useState<"standby" | "active" | "rosc" | "ended">("standby");
  const [codeStartedAt, setCodeStartedAt] = useState<number | null>(null);
  const [totalCodeSeconds, setTotalCodeSeconds] = useState<number>(0);
  const [totalCodeElapsed, setTotalCodeElapsed] = useState<string>("00:00");

  // 2. รอบ CPR 2 นาที (ACLS 2-min Cycle)
  const [cycleStartedAt, setCycleStartedAt] = useState<number>(0);
  const [cycleSeconds, setCycleSeconds] = useState<number>(0);
  const [cycleElapsed, setCycleElapsed] = useState<string>("00:00");

  // 3. ข้อมูลรอบ
  const [rounds, setRounds] = useState<RoundInfo[]>([
    { id: "round-1", name: "รอบที่ 1 (CPR 2 min)", startedAt: 0 },
  ]);
  const [activeRound, setActiveRound] = useState<string>("รอบที่ 1 (CPR 2 min)");

  // 4. Clinical Trackers (Epi, Shocks, ROSC)
  const [lastEpiTimestamp, setLastEpiTimestamp] = useState<number | null>(null);
  const [lastEpiSeconds, setLastEpiSeconds] = useState<number | null>(null);
  const [totalEpiDoses, setTotalEpiDoses] = useState<number>(0);
  const [totalShocks, setTotalShocks] = useState<number>(0);
  const [hasRosc, setHasRosc] = useState<boolean>(false);

  // 5. Patient & Team Info
  const [caseInfo, setCaseInfo] = useState<PatientCaseInfo>({
    hn: "",
    name: "",
    bed: "",
    teamLeader: "",
    recorder: "",
    diagnosis: "Cardiac Arrest / Resuscitation",
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(DEFAULT_TEAM);
  const [activeMemberId, setActiveMemberId] = useState<string>("leader");

  // 6. CPR Metronome 110 BPM
  const [metronomeActive, setMetronomeActive] = useState<boolean>(false);
  const [metronomeBeat, setMetronomeBeat] = useState<number>(0);

  // 7. เสียงและการเชื่อมต่อ
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [sheetsUrl, setSheetsUrl] = useState<string>("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "testing" | "success" | "error" | "syncing">("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");

  // 8. รายการบันทึกประวัติ (History Records)
  const [records, setRecords] = useState<TimeRecord[]>([]);

  // 9. Modals
  const [showPatientModal, setShowPatientModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showSheetsModal, setShowSheetsModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);

  // 10. Toast Feedback
  const [toast, setToast] = useState<{ message: string; type: "ok" | "warn" | "err" } | null>(null);

  // Ref สำหรับป้องกันเสียงเตือนซ้ำในวินาทีเดียวกัน
  const lastAlertSecondRef = useRef<number>(-1);

  const showToast = (message: string, type: "ok" | "warn" | "err" = "ok") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // ==========================================
  // Load State from LocalStorage
  // ==========================================
  useEffect(() => {
    try {
      const storedRecords = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedRecords) {
        const parsed: TimeRecord[] = JSON.parse(storedRecords);
        setRecords(parsed);

        // คำนวณจำนวน dose และ shock จากประวัติเดิม
        const shocks = parsed.filter((r) => r.actionType === "cpr_shock").length;
        const epis = parsed.filter((r) => r.actionType === "cpr_drug" && r.actionLabel.includes("Adrenaline")).length;
        const rosc = parsed.some((r) => r.actionType === "cpr_rosc");
        setTotalShocks(shocks);
        setTotalEpiDoses(epis);
        setHasRosc(rosc);
        if (rosc) setCodeStatus("rosc");
        else if (parsed.length > 0) setCodeStatus("active");
      }

      const storedRounds = localStorage.getItem(ROUNDS_STORAGE_KEY);
      let loadedRounds: RoundInfo[] = [];
      if (storedRounds) {
        loadedRounds = JSON.parse(storedRounds);
        setRounds(loadedRounds);
      } else {
        const nowMs = Date.now();
        loadedRounds = [{ id: "round-1", name: "รอบที่ 1 (CPR 2 min)", startedAt: nowMs }];
        setRounds(loadedRounds);
      }

      const storedActiveRound = localStorage.getItem(ACTIVE_ROUND_KEY);
      const activeName = storedActiveRound || "รอบที่ 1 (CPR 2 min)";
      setActiveRound(activeName);

      const foundRound = loadedRounds.find((x) => x.name === activeName);
      if (foundRound && foundRound.startedAt > 0) {
        setCycleStartedAt(foundRound.startedAt);
      } else {
        setCycleStartedAt(Date.now());
      }

      const storedCase = localStorage.getItem(CASE_STORAGE_KEY);
      if (storedCase) {
        setCaseInfo(JSON.parse(storedCase));
      }

      const storedTeam = localStorage.getItem(TEAM_STORAGE_KEY);
      if (storedTeam) {
        setTeamMembers(JSON.parse(storedTeam));
      }

      const storedUrl = localStorage.getItem(SHEETS_URL_KEY);
      if (storedUrl) {
        setSheetsUrl(storedUrl);
      }

      const storedSound = localStorage.getItem(SOUND_KEY);
      if (storedSound !== null) {
        const enabled = storedSound === "true";
        setSoundEnabled(enabled);
        hospitalAudio.setSoundEnabled(enabled);
      }
    } catch (e) {
      console.error("Failed to restore hospital state from storage", e);
    }
  }, []);

  // Save changes to LocalStorage
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
  }, [activeRound]);

  useEffect(() => {
    localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(caseInfo));
  }, [caseInfo]);

  useEffect(() => {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  // ==========================================
  // Master Clock & Resuscitation Timers Tick
  // ==========================================
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nowMs = now.getTime();
      setCurrentTime(now);

      // Total Code Duration
      if (codeStartedAt && (codeStatus === "active" || codeStatus === "rosc")) {
        const totalSec = Math.max(0, Math.floor((nowMs - codeStartedAt) / 1000));
        setTotalCodeSeconds(totalSec);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        setTotalCodeElapsed(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }

      // 2-Minute CPR Cycle Timer
      if (cycleStartedAt) {
        const cSec = Math.max(0, Math.floor((nowMs - cycleStartedAt) / 1000));
        setCycleSeconds(cSec);
        const cm = Math.floor(cSec / 60);
        const cs = cSec % 60;
        setCycleElapsed(`${String(cm).padStart(2, "0")}:${String(cs).padStart(2, "0")}`);

        // เตือนเมื่อครบ 2 นาที (120 วินาที)
        if (cSec >= 120 && lastAlertSecondRef.current !== 120 && codeStatus === "active") {
          lastAlertSecondRef.current = 120;
          hospitalAudio.playCycleAlert();
          showToast("🚨 ครบ 2 นาที! หยุดกดตรวจชีพจร / สลับคนกดหน้าอก", "err");
        } else if (cSec < 120) {
          lastAlertSecondRef.current = -1;
        }
      }

      // Epinephrine Elapsed
      if (lastEpiTimestamp) {
        const eSec = Math.max(0, Math.floor((nowMs - lastEpiTimestamp) / 1000));
        setLastEpiSeconds(eSec);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [codeStartedAt, cycleStartedAt, codeStatus, lastEpiTimestamp]);

  // Formatters
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

  // ==========================================
  // Audio & Metronome Controls
  // ==========================================
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    hospitalAudio.setSoundEnabled(next);
    if (!next && metronomeActive) {
      hospitalAudio.stopMetronome();
      setMetronomeActive(false);
    }
    showToast(next ? "🔊 เปิดเสียงแจ้งเตือนทางการแพทย์" : "🔇 ปิดเสียงแจ้งเตือน", "ok");
  };

  const handleToggleMetronome = () => {
    if (metronomeActive) {
      hospitalAudio.stopMetronome();
      setMetronomeActive(false);
      showToast("หยุดเครื่องเคาะจังหวะ CPR", "warn");
    } else {
      if (!soundEnabled) {
        setSoundEnabled(true);
        hospitalAudio.setSoundEnabled(true);
      }
      hospitalAudio.startMetronome((beat) => {
        setMetronomeBeat(beat);
      });
      setMetronomeActive(true);
      showToast("💓 เริ่มเคาะจังหวะ CPR 110 ครั้ง/นาที (AHA Guideline)", "ok");
    }
  };

  // ==========================================
  // Next 2-Minute CPR Cycle
  // ==========================================
  const handleNextCycle = () => {
    const now = Date.now();
    const nextRoundNumber = rounds.length + 1;
    const nextRoundName = `รอบที่ ${nextRoundNumber} (CPR 2 min)`;

    const newRoundItem: RoundInfo = {
      id: `round-${now}`,
      name: nextRoundName,
      startedAt: now,
    };

    const updatedRounds = [...rounds, newRoundItem];
    setRounds(updatedRounds);
    setActiveRound(nextRoundName);
    setCycleStartedAt(now);
    setCycleElapsed("00:00");
    setCycleSeconds(0);
    lastAlertSecondRef.current = -1;

    // บันทึกหัตถการจบรอบลงตาราง
    const activeMember = teamMembers.find((m) => m.id === activeMemberId);
    const timeRecord: TimeRecord = {
      id: generateRecordId(now),
      no: records.length + 1,
      date: new Date(now).toISOString().split("T")[0],
      time: formatClock(new Date(now)),
      timestamp: now,
      round: activeRound,
      firstName: activeMember?.name || "ทีมกู้ชีพ ER",
      lastName: "",
      fullName: activeMember?.name || "ทีมกู้ชีพ ER",
      code: activeMember?.role || "CPR Team",
      actionType: "cpr_cycle",
      actionLabel: `🔄 จบ ${activeRound} (ตรวจจังหวะ & สลับคนกด)`,
      elapsedInRound: cycleElapsed,
      note: "หยุดกดหน้าอกเพื่อตรวจชีพจร / ตรวจคลื่นหัวใจ และสลับผู้กดหน้าอก",
      patientHn: caseInfo.hn,
      synced: false,
    };

    const updatedRecords = [timeRecord, ...records];
    setRecords(updatedRecords);

    hospitalAudio.playNewRoundChime();
    showToast(`🏁 เริ่ม ${nextRoundName} (สลับผู้กดหน้าอก & ตรวจ Rhythm เรียบร้อย)`, "ok");

    if (sheetsUrl.trim()) {
      syncRecordToSheets(timeRecord);
    }
  };

  // ==========================================
  // Quick Emergency Action Trigger
  // ==========================================
  const handleQuickAction = (actionTypeStr: string, label: string, customNote?: string) => {
    const now = Date.now();
    const nowDate = new Date(now);
    const actionType = actionTypeStr as RecordActionType;

    // 1. Initial State Transitions
    if (actionType === "cpr_start" && codeStatus !== "active") {
      setCodeStatus("active");
      if (!codeStartedAt) setCodeStartedAt(now);
      if (!cycleStartedAt) setCycleStartedAt(now);
    } else if (actionType === "cpr_rosc") {
      setCodeStatus("rosc");
      setHasRosc(true);
      hospitalAudio.playRoscChime();
    } else if (actionType === "cpr_end") {
      setCodeStatus("ended");
      if (metronomeActive) {
        hospitalAudio.stopMetronome();
        setMetronomeActive(false);
      }
    }

    // 2. Specialized Audio and Counters
    if (actionType === "cpr_shock") {
      setTotalShocks((prev) => prev + 1);
      hospitalAudio.playShockAlert();
    } else if (actionType === "cpr_drug") {
      if (label.includes("Adrenaline") || label.includes("Epinephrine")) {
        setTotalEpiDoses((prev) => prev + 1);
        setLastEpiTimestamp(now);
      }
      hospitalAudio.playDrugAlert();
    } else if (actionType !== "cpr_rosc") {
      hospitalAudio.playStampChime();
    }

    // 3. Current Performer
    const activeMember = teamMembers.find((m) => m.id === activeMemberId);
    const performerName = activeMember?.name || caseInfo.teamLeader || "ทีมกู้ชีพ ER";
    const performerRole = activeMember?.role || "ผู้ปฏิบัติงาน";

    // 4. Update Member Stamp Count
    if (activeMember) {
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === activeMember.id ? { ...m, count: m.count + 1 } : m))
      );
    }

    // 5. Build Time Record
    const newRecord: TimeRecord = {
      id: generateRecordId(now),
      no: records.length + 1,
      date: nowDate.toISOString().split("T")[0],
      time: formatClock(nowDate),
      timestamp: now,
      round: activeRound,
      firstName: performerName,
      lastName: "",
      fullName: performerName,
      code: performerRole,
      actionType,
      actionLabel: label,
      elapsedInRound: cycleElapsed,
      note: customNote || "",
      patientHn: caseInfo.hn,
      synced: false,
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    showToast(`✅ บันทึก: ${label} (${newRecord.time})`, "ok");

    if (sheetsUrl.trim()) {
      syncRecordToSheets(newRecord);
    }
  };

  // ==========================================
  // Manual Entry Form Submission
  // ==========================================
  const handleStampManual = (
    fn: string,
    ln: string,
    cd: string,
    actType: RecordActionType,
    customLabel: string,
    customNote: string
  ) => {
    const now = Date.now();
    const nowDate = new Date(now);
    const fullName = `${fn} ${ln}`.trim() || "ผู้ปฏิบัติงาน";

    const newRecord: TimeRecord = {
      id: generateRecordId(now),
      no: records.length + 1,
      date: nowDate.toISOString().split("T")[0],
      time: formatClock(nowDate),
      timestamp: now,
      round: activeRound,
      firstName: fn,
      lastName: ln,
      fullName,
      code: cd,
      actionType: actType,
      actionLabel: customLabel,
      elapsedInRound: cycleElapsed,
      note: customNote,
      patientHn: caseInfo.hn,
      synced: false,
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    hospitalAudio.playStampChime();
    showToast(`บันทึกเวลาสำเร็จ: ${customLabel}`, "ok");

    if (sheetsUrl.trim()) {
      syncRecordToSheets(newRecord);
    }
  };

  // ==========================================
  // Team Roster Quick Stamp
  // ==========================================
  const handleStampMember = (member: TeamMember) => {
    const now = Date.now();
    const nowDate = new Date(now);
    const name = member.name.trim() || member.role;

    const newRecord: TimeRecord = {
      id: generateRecordId(now),
      no: records.length + 1,
      date: nowDate.toISOString().split("T")[0],
      time: formatClock(nowDate),
      timestamp: now,
      round: activeRound,
      firstName: member.name || member.role,
      lastName: "",
      fullName: name,
      code: member.role,
      actionType: "checkpoint",
      actionLabel: `⏱️ ลงเวลาปฏิบัติหน้าที่: ${member.role}`,
      elapsedInRound: cycleElapsed,
      note: `ผู้ปฏิบัติงาน: ${name}`,
      patientHn: caseInfo.hn,
      synced: false,
    };

    setTeamMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, count: m.count + 1 } : m))
    );

    const updated = [newRecord, ...records];
    setRecords(updated);
    hospitalAudio.playStampChime();
    showToast(`แสตมป์เวลาให้ ${name} เรียบร้อย`, "ok");

    if (sheetsUrl.trim()) {
      syncRecordToSheets(newRecord);
    }
  };

  // ==========================================
  // Google Sheets Auto-Sync
  // ==========================================
  const syncRecordToSheets = async (rec: TimeRecord) => {
    if (!sheetsUrl.trim()) return;
    try {
      await apiAddRecord(rec, sheetsUrl.trim());
      setRecords((prev) =>
        prev.map((r) =>
          r.id === rec.id ? { ...r, synced: true, syncTime: formatClock(new Date()) } : r
        )
      );
    } catch (e) {
      console.warn("Auto-sync failed, queued for later", e);
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
      await apiBatchAddRecords(pending, sheetsUrl.trim());
      setRecords((prev) =>
        prev.map((r) => ({ ...r, synced: true, syncTime: formatClock(new Date()) }))
      );
      hospitalAudio.playStampChime();
      showToast(`ซิงค์ข้อมูล ${pending.length} รายการสำเร็จ!`, "ok");
      setSyncStatus("success");
    } catch (e) {
      showToast("เกิดข้อผิดพลาดในการซิงค์ข้อมูล", "err");
      console.error(e);
      setSyncStatus("error");
    }
  };

  const handleTestConnection = async (testUrl: string) => {
    if (!testUrl.trim()) {
      setSyncStatus("error");
      setSyncMessage("กรุณาวาง URL ของ Web App ก่อน");
      return;
    }

    setSyncStatus("testing");
    setSyncMessage("กำลังทดสอบการเชื่อมต่อไปยัง Google Sheets...");

    try {
      const data = await pingGoogleSheets(testUrl.trim());
      if (data && data.status === "success") {
        setSyncStatus("success");
        setSyncMessage(`เชื่อมต่อสำเร็จ! แผ่นงาน "${data.sheetName || "TimeRecords"}" พร้อมใช้งาน (${data.totalRows ?? 0} แถว)`);
        localStorage.setItem(SHEETS_URL_KEY, testUrl.trim());
        setSheetsUrl(testUrl.trim());
        hospitalAudio.playStampChime();
      } else {
        throw new Error(data.message || "ตอบกลับไม่ถูกต้อง");
      }
    } catch (err: unknown) {
      setSyncStatus("error");
      const errorMsg = err instanceof Error ? err.message : String(err);
      setSyncMessage(`เชื่อมต่อไม่สำเร็จ: ${errorMsg} (ตรวจดูว่าสิทธิ์เข้าถึงเป็น Anyone หรือยัง)`);
    }
  };

  // ==========================================
  // Edit & Delete Records
  // ==========================================
  const handleOpenEdit = (rec: TimeRecord) => {
    setEditingRecord({ ...rec });
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedRec: TimeRecord) => {
    const updated = records.map((r) => (r.id === updatedRec.id ? updatedRec : r));
    setRecords(updated);
    setShowEditModal(false);
    hospitalAudio.playStampChime();
    showToast("บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว", "ok");

    if (sheetsUrl.trim()) {
      apiUpdateRecord(updatedRec, sheetsUrl.trim()).catch((err) =>
        console.warn("Update sync failed", err)
      );
    }
  };

  const handleDeleteRecord = (id: string) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;

    if (confirm(`คุณต้องการลบข้อมูล "${rec.actionLabel}" (${rec.time}) ใช่หรือไม่?`)) {
      const updated = records.filter((r) => r.id !== id);
      setRecords(updated);
      showToast(`ลบข้อมูล ${rec.actionLabel} เรียบร้อยแล้ว`, "warn");

      if (sheetsUrl.trim()) {
        apiDeleteRecord(id, sheetsUrl.trim()).catch((err) =>
          console.warn("Delete sync failed", err)
        );
      }
    }
  };

  // ==========================================
  // Excel Export (CSV with UTF-8 BOM)
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
      "เวลาในรอบ",
      "หัตถการ / การกระทำ",
      "ผู้ปฏิบัติงาน",
      "บทบาท / รหัส",
      "หมายเหตุ",
      "HN ผู้ป่วย",
      "สถานะซิงค์"
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((r, index) => [
      index + 1,
      r.round,
      r.date,
      r.time,
      r.elapsedInRound,
      r.actionLabel,
      r.fullName,
      r.code,
      r.note,
      r.patientHn || caseInfo.hn || "-",
      r.synced ? "ซิงค์แล้ว" : "รอดำเนินการ",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const d = new Date();
    const dateStamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;

    link.setAttribute("href", url);
    link.setAttribute("download", `Thatakiab_Hospital_CPR_Report_${caseInfo.hn || "ER"}_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    hospitalAudio.playStampChime();
    showToast("ส่งออกไฟล์ Excel (CSV UTF-8) เรียบร้อยแล้ว", "ok");
  };

  const unsyncedCount = records.filter((r) => !r.synced).length;
  const activeMember = teamMembers.find((m) => m.id === activeMemberId);

  return (
    <div className="min-h-screen bg-[#eef2f6] text-[#0c1727] flex flex-col font-sans select-none pb-12">
      {/* 1. TOP HOSPITAL ER HEADER */}
      <HospitalHeader
        currentTime={currentTime}
        codeStatus={codeStatus}
        metronomeActive={metronomeActive}
        onToggleMetronome={handleToggleMetronome}
        metronomeBeat={metronomeBeat}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        sheetsUrl={sheetsUrl}
        unsyncedCount={unsyncedCount}
        onOpenSheetsModal={() => setShowSheetsModal(true)}
        onOpenPatientModal={() => setShowPatientModal(true)}
        onOpenReportModal={() => setShowReportModal(true)}
        caseInfo={caseInfo}
      />

      {/* 2. MAIN RESUSCITATION CONTAINER */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex-1 flex flex-col gap-4">
        {/* HERO SECTION: Wall Clock, 2-Min ACLS Cycle, and 1-Touch Emergency Buttons */}
        <ResuscitationConsole
          currentTime={currentTime}
          codeStatus={codeStatus}
          totalCodeElapsed={totalCodeElapsed}
          totalCodeSeconds={totalCodeSeconds}
          cycleElapsed={cycleElapsed}
          cycleSeconds={cycleSeconds}
          activeRound={activeRound}
          rounds={rounds}
          onSelectRound={(sel) => {
            setActiveRound(sel);
            const r = rounds.find((x) => x.name === sel);
            if (r && r.startedAt > 0) setCycleStartedAt(r.startedAt);
          }}
          onNextCycle={handleNextCycle}
          lastEpiSeconds={lastEpiSeconds}
          totalEpiDoses={totalEpiDoses}
          totalShocks={totalShocks}
          onQuickAction={handleQuickAction}
          activeStaffName={activeMember ? `${activeMember.name || activeMember.role}` : ""}
        />

        {/* TEAM ROSTER & DETAILED ENTRY ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Team Roster (5 cols) */}
          <div className="lg:col-span-5">
            <TeamRosterPanel
              activeRound={activeRound}
              teamMembers={teamMembers}
              activeMemberId={activeMemberId}
              onSelectMember={(m) => {
                setActiveMemberId(m.id);
                showToast(`เลือก: ${m.role} (${m.name || "ยังไม่ระบุชื่อ"})`, "ok");
              }}
              onStampMember={handleStampMember}
              onUpdateMemberName={(id, name) => {
                setTeamMembers((prev) =>
                  prev.map((m) => (m.id === id ? { ...m, name } : m))
                );
                showToast("อัปเดตชื่อผู้ปฏิบัติงานเรียบร้อย", "ok");
              }}
              onAddCustomMember={(name, role) => {
                const newMember: TeamMember = {
                  id: `member-${Date.now()}`,
                  role,
                  roleIcon: "🧑‍⚕️",
                  name,
                  count: 0,
                };
                setTeamMembers((prev) => [...prev, newMember]);
                showToast(`เพิ่ม ${name} (${role}) เข้าทีมเรียบร้อย`, "ok");
              }}
            />
          </div>

          {/* Detailed Manual Entry (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <ManualEntryForm
              activeRound={activeRound}
              onStampManual={handleStampManual}
            />

            {/* Quick Tips / Clinical Guideline Card */}
            <div className="bg-[#e5eef9] border border-[#aeb9c8] rounded-xl p-3.5 text-xs text-[#08305d] flex items-start gap-2.5">
              <span className="text-xl shrink-0">💡</span>
              <div className="leading-relaxed">
                <div className="font-bold text-sm text-[#0b2545] mb-0.5">
                  แนวทางกู้ชีพขั้นสูง ACLS 2020-2025
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700 mt-1">
                  <div>• <b>กดหน้าอก:</b> ลึก 2-2.4 นิ้ว เร็ว 100-120 bpm</div>
                  <div>• <b>ตรวจจังหวะหัวใจ:</b> ทุก 2 นาที (สลับคนกด)</div>
                  <div>• <b>Adrenaline:</b> 1 mg IV/IO ทุก 3-5 นาที</div>
                  <div>• <b>Shock VF/pVT:</b> 200J Biphasic ตามด้วย CPR ทันที 2 นาที</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHRONOLOGICAL CLINICAL HISTORY TABLE */}
        <ClinicalHistoryTable
          records={records}
          rounds={rounds}
          onOpenEdit={handleOpenEdit}
          onDeleteRecord={handleDeleteRecord}
          onExportExcel={exportToExcel}
          onExportPdf={() => setShowReportModal(true)}
          onSyncAllPending={syncAllPendingToSheets}
          unsyncedCount={unsyncedCount}
        />
      </main>

      {/* MODALS */}
      {/* 1. Patient Info Modal */}
      <PatientInfoModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        caseInfo={caseInfo}
        onSave={(updated) => {
          setCaseInfo(updated);
          showToast("บันทึกข้อมูลผู้ป่วยและเคสเรียบร้อย", "ok");
        }}
      />

      {/* 2. Medical Report Modal (A4 Print / PDF) */}
      <MedicalReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        caseInfo={caseInfo}
        records={records}
        totalCodeDuration={totalCodeElapsed}
        totalCycles={rounds.length}
        totalShocks={totalShocks}
        totalEpiDoses={totalEpiDoses}
        hasRosc={hasRosc}
        currentDateStr={formatThaiDate(currentTime)}
      />

      {/* 3. Google Sheets Config Modal */}
      <SheetsConfigModal
        isOpen={showSheetsModal}
        onClose={() => setShowSheetsModal(false)}
        sheetsUrl={sheetsUrl}
        onSaveUrl={(url) => {
          setSheetsUrl(url);
          localStorage.setItem(SHEETS_URL_KEY, url);
        }}
        onTestConnection={handleTestConnection}
        syncStatus={syncStatus}
        syncMessage={syncMessage}
      />

      {/* 4. Edit Record Modal */}
      <EditRecordModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        record={editingRecord}
        onSave={handleSaveEdit}
      />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg shadow-xl text-xs font-bold z-50 animate-in slide-in-from-bottom-4 flex items-center gap-2 border ${
            toast.type === "ok"
              ? "bg-[#0b2545] text-white border-sky-400"
              : toast.type === "warn"
              ? "bg-amber-600 text-white border-amber-400"
              : "bg-rose-700 text-white border-rose-400"
          }`}
        >
          <span>{toast.type === "ok" ? "ℹ️" : toast.type === "warn" ? "⚠️" : "🚨"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
