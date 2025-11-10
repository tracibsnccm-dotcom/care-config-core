// src/lib/models.ts

/**
 * Core domain models for Reconcile C.A.R.E.
 * Keep this file as the single source of truth for types
 * used across forms, flags, injuries, exports, etc.
 */

/* ---------- Client & Core ---------- */

export interface VoiceView {
  voice: string; // client's words: what happened / how they feel
  view: string; // client's goals / expectations
}

export interface Client {
  id: string;
  name: string;

  // Viability / 4Ps / SDOH mapping
  viabilityScore?: number;
  viabilityStatus?: string;
  cmDeclined?: boolean;

  voiceView?: VoiceView;
  fourPs?: any; // placeholder for structured 4Ps object
  sdoh?: any; // placeholder for structured SDOH object

  lastFollowupDate?: string; // ISO date
  nextFollowupDue?: string; // ISO date
}

/* ---------- Flags ---------- */

export type FlagSeverity = "Low" | "Medium" | "High" | "Critical";
export type FlagStatus = "Open" | "Closed";

export interface Flag {
  id: string;
  type?: string; // e.g. "SDOH", "Pain", "MentalHealth"
  label: string;
  severity: FlagSeverity;
  status: FlagStatus;
  createdAt?: string; // ISO
  resolvedAt?: string | null; // ISO
}

/* ---------- Tasks ---------- */

export type TaskStatus = "Open" | "Completed" | "Cancelled";

export interface Task {
  task_id: string;
  type: string; // e.g. "followup", "education", etc.
  title: string;
  due_date?: string; // ISO
  status: TaskStatus;
  created_at?: string; // ISO
  assigned_to?: string;
}

/* ---------- Injury / Medical Necessity ---------- */

/**
 * IDs for supported injury templates.
 * Expand as new templates are added.
 */
export type InjuryTemplateId =
  | "GENERIC"
  | "MVA"
  | "SPRAIN_STRAIN"
  | "SLIP_TRIP_FALL"
  | "STRUCK_CAUGHT"
  | "LAC_PUNCTURE"
  | "OVEREXERTION"
  | "CRUSH"
  | "DOG_BITE"
  | "PRODUCT_LIABILITY"
  | "MALPRACTICE";

/**
 * Simple guideline-style profile for ODG/MCG-like logic.
 * These numbers are illustrative only and can be tuned later.
 */
export interface ODGProfile {
  templateId: InjuryTemplateId;
  baseLodWeeksMin?: number;
  baseLodWeeksMax?: number;
  comorbidityAdjustmentsWeeks?: number; // added time if DM/HTN/etc.
  surgeryAddedWeeks?: number;
  rehabAddedWeeks?: number;
}

/**
 * One injury instance attached to a client case.
 */
export interface InjuryInstance {
  id: string;
  templateId: InjuryTemplateId;
  title: string; // human-readable label
  primary: boolean;

  bodyRegion?: string; // e.g. "Lumbar spine", "Right hand"
  laterality?: "Right" | "Left" | "Bilateral" | "Unspecified";

  icd10Codes?: string[];

  // Optional richer clinical detail; useful later for narratives.
  mechanismSummary?: string;
  keyFindings?: string;
  redFlags?: string[];

  // Optional guideline profile if/when computed
  odgProfile?: ODGProfile;

  // Whether RN flagged this as key for necessity narrative
  keyForNecessity?: boolean;
}

/* ---------- App State ---------- */

export interface AppState {
  client: Client;
  flags: Flag[];
  tasks: Task[];
  injuries?: InjuryInstance[];
}
