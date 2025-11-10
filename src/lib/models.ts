// src/lib/models.ts
// Reconcile C.A.R.E. Core Data Models

export interface Client {
  id: string;
  name: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  cmDeclined?: boolean;
  cmDeclineLastDate?: string;
  lastFollowupDate?: string;
  nextFollowupDue?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Flag {
  id: string;
  clientId: string;
  type: string;
  label: string;
  severity: "Low" | "Moderate" | "High" | "Critical";
  status: "Open" | "Closed";
  createdAt: string;
  resolvedAt?: string;
  note?: string;
}

export interface Task {
  task_id: string;
  client_id: string;
  type: "FollowUp30Day" | "SupervisorReview" | string;
  title: string;
  assigned_to: string;
  due_date: string; // ISO date
  status: "Open" | "Completed" | "Cancelled";
  created_at: string; // ISO datetime
}

export interface Effect {
  type: string;
  payload?: any;
}

export interface AppState {
  client: Client;
  flags: Flag[];
  tasks: Task[];
}
// Extend your existing models with:

export interface InjuryInstance {
  id: string; // unique per injury entry
  templateId: InjuryTemplateId;
  title: string; // e.g. "Crush injury - Right hand"
  primary: boolean;
  bodyRegion?: string;
  laterality?: "Right" | "Left" | "Bilateral" | "Unspecified";
  icd10Codes: string[];
  mechanismSummary?: string;
  keyFindings?: string; // objective + functional summary
  redFlags?: string[];
  odgProfile?: ODGProfileSnapshot; // optional, see below
  keyForNecessity?: boolean; // RN marks as important
}

export interface ODGProfileSnapshot {
  guidelineName?: string;
  baseLodWeeksMin?: number;
  baseLodWeeksMax?: number;
  comorbidityAdjustmentsWeeks?: number;
  surgeryAddedWeeks?: number;
  rehabAddedWeeks?: number;
  notes?: string; // human-readable explanation
}

// In AppState:
export interface AppState {
  client: Client;
  flags: Flag[];
  tasks: Task[];
  injuries?: InjuryInstance[]; // 👈 new field
}
