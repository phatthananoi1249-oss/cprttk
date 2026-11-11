/**
 * TypeScript Data Contracts for MEGA Code Clock & Google Sheets API
 */

export type RecordActionType =
  | "check_in"
  | "checkpoint"
  | "check_out"
  | "note"
  | "cpr_start"
  | "cpr_cycle"
  | "cpr_shock"
  | "cpr_drug"
  | "cpr_airway"
  | "cpr_rhythm"
  | "cpr_rosc"
  | "cpr_end";

export interface TimeRecord {
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
  actionType: RecordActionType;
  actionLabel: string;
  elapsedInRound: string;
  note: string;
  synced: boolean;
  syncTime?: string;
  patientHn?: string;
  role?: string;
}

export interface PatientCaseInfo {
  hn: string;
  name: string;
  bed: string;
  teamLeader: string;
  recorder: string;
  diagnosis: string;
}

export interface RoundInfo {
  id: string;
  name: string;
  startedAt: number;
  endedAt?: number;
}

export type SheetApiAction = "ping" | "getAll" | "add" | "batchAdd" | "update" | "delete";

export interface SheetApiRequestPayload {
  action: SheetApiAction;
  webAppUrl?: string;
  record?: Partial<TimeRecord>;
  records?: Partial<TimeRecord>[];
  id?: string;
}

export interface SheetApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  sheetName?: string;
  totalRows?: number;
  total?: number;
  data?: T;
  record?: TimeRecord;
  count?: number;
  timestamp?: string;
  id?: string;
}
