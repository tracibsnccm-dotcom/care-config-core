// src/lib/models.ts

/**
 * Core shared types for Reconcile C.A.R.E. platform
 * These are intentionally a bit flexible (optional fields) so we don't break UI
 * while iterating. As we stabilize, we can tighten them.
 */

/** Client Voice/View: client's own words & perspective */
export interface VoiceView {
  voice: string; // what happened / what is happening (client words)
  view: string; // how they see themselves & what they want
}

/** Simple placeholder for 4Ps & SDOH structured data */
export interface FourPsData {
  // You can refine later (e.g., per-domain scores & rationales)
  totalScore?: number;
  details?: Record<string, any>;
}

export interface SDOHData {
  // Flexible structure to hold your SDOH answers/flags
  domains?: Record<string, any>;
}

/** Core Client model */
export interface Client {
  id: string;
  name: string;

  // Viability index derived from 4Ps, SDOH, etc.
  viabilityScore?: number;
  viabilityStatus?: string;

  // Care Management participation
  cmDeclined?: boolean;

  // Client-centered narrative
  voiceView?: VoiceView;

  // Structured contributors
  fourPs?: FourPsData;
  sdoh?: SDOHData;

  // Follow-up
  lastFollowupDate?: string; // ISO date
  nextFollowupDue?: string; // ISO date
}

/** Flags: risk, required follow-up, guideline variance, etc. */
export type FlagSeverity = "Low" | "Moderate" | "High" | "Critical";
export type FlagStatus = "Open" | "Closed";

export interface Flag {
  id: string;
  type?: string; // e.g. "SDOH", "Pain", "GuidelineVariance"
  label: string;
  severity: FlagSeverity;
  status: FlagStatus;
  createdAt?: string; // ISO timestamp
  resolvedAt?: string | null;
}

/** Tasks: follow-ups, outreach, documentation, etc. */
export type TaskStatus = "Open" | "Completed" | "Cancelled";

export interface Task {
  task_id: string;
  type: string; // e.g. "FollowUp", "Education", "AuditReview"
  title: string;
  due_date?: string; // ISO date
  status: TaskStatus;
  created_at?: string; // ISO timestamp
  assigned_to?: string; // RN id / role
}

/** Injury template IDs (aligned with Medical Necessity Driver) */
export type InjuryTemplateId =
  | "MVA"
  | "SprainStrainMSD"
  | "SlipTripFall"
  | "StruckByCaughtIn"
  | "LacerationPuncture"
  | "Overexertion"
  | "CrushInjury"
  | "DogBite"
  | "ProductLiability"
  | "MedMal"
  | "WrongfulDeath"
  | "Generic";

/** ODG/MCG snapshot used for advocacy (not auto-denial) */
export interface ODGProfileSnapshot {
  guidelineName?: string;
  baseLodWeeksMin?: number;
  baseLodWeeksMax?: number;
  comorbidityAdjustmentsWeeks?: number;
  surgeryAddedWeeks?: number;
  rehabAddedWeeks?: number;
  notes?: string; // explanation in human language
}

/** A specific injury attached to a case */
export interface InjuryInstance {
  id: string; // unique per injury
  templateId: InjuryTemplateId;
  title: string; // e.g. "Crush injury – Right hand"
  primary: boolean;

  bodyRegion?: string; // free text or enum later
  laterality?: "Right" | "Left" | "Bilateral" | "Unspecified";

  // Coded representation (ICD-10 set)
  icd10Codes: string[];

  // Forensic clinical summary
  mechanismSummary?: string;
  keyFindings?: string; // objective + functional
  redFlags?: string[];

  // ODG / MCG perspective (advocacy use only)
  odgProfile?: ODGProfileSnapshot;

  // Marked by RN as especially important for necessity narrative
  keyForNecessity?: boolean;
}

/** Global app state (for this prototype) */
export interface AppState {
  client: Client;
  flags: Flag[];
  tasks: Task[];
  injuries?: InjuryInstance[]; // populated by Medical Necessity Driver UI
}
