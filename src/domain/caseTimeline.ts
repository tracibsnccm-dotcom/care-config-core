// src/domain/caseTimeline.ts

// Who generated the event or communication
export type CaseActorRole =
  | "RN"
  | "ATTORNEY"
  | "CLIENT"
  | "SUPERVISOR"
  | "DIRECTOR"
  | "SYSTEM";

// What kind of event happened on the case timeline
export type CaseEventType =
  | "INTAKE_STARTED"
  | "INTAKE_COMPLETED"
  | "FOLLOWUP_COMPLETED"
  | "TEN_VS_UPDATE"
  | "FOUR_PS_UPDATE"
  | "SDOH_FLAG_ADDED"
  | "APPT_SCHEDULED"
  | "APPT_COMPLETED"
  | "RN_NOTE"
  | "ATTORNEY_NOTE"
  | "CASE_ESCALATED"
  | "CASE_CLOSURE_STARTED"
  | "CASE_CLOSED"
  | "LEGAL_LOCK_APPLIED"
  | "LEGAL_LOCK_RELEASED"
  | "OVERRIDE_APPLIED"
  | "OVERRIDE_CLEARED"
  | "WORKLOAD_REALLOCATED"
  | "CLIENT_CONTACT_ATTEMPT"
  | "CLIENT_CONTACT_SUCCESS";

// High-level group of the event
export type CaseEventCategory =
  | "CLINICAL"
  | "LEGAL"
  | "WORKLOAD"
  | "SYSTEM"
  | "COMMUNICATION"
  | "OTHER";

// Snapshot of clinical risk at that moment
export interface TenVsSnapshot {
  painScore?: number;
  functionScore?: number;
  medicationRisk?: "LOW" | "MODERATE" | "HIGH";
  mentalHealthRisk?: "LOW" | "MODERATE" | "HIGH";
  abuseRisk?: "LOW" | "MODERATE" | "HIGH";
  sdohRisk?: "LOW" | "MODERATE" | "HIGH";
  // You can extend this to all 10-Vs later
}

// One row on the RN case timeline
export interface CaseTimelineEvent {
  id: string;
  caseId: string;
  createdAt: string; // ISO timestamp (e.g. "2025-11-01T09:15:00Z")

  actorRole: CaseActorRole;
  actorName?: string;

  eventType: CaseEventType;
  category: CaseEventCategory;

  summary: string;      // short one-line summary
  details?: string;     // longer text, optional

  // Which internal engine created it (if any)
  sourceEngine?:
    | "INTAKE"
    | "FOLLOWUP"
    | "TEN_VS_ENGINE"
    | "CASE_CLOSURE_ENGINE"
    | "WORKLOAD_ENGINE"
    | "LEGAL_LOCK_ENGINE"
    | "MANUAL_NOTE";

  // Optional risk snapshot and 4Ps info
  tenVsSnapshot?: TenVsSnapshot;
  fourPsSummary?: string;

  // Governance / flags
  isCritical?: boolean;        // e.g. SI, safety, high risk
  isLegalLocked?: boolean;     // part of Legal Lock-Down
  visibleToAttorney?: boolean;
  visibleToClient?: boolean;

  // Supervisor Audit Panel hook-ins
  requiresAudit?: boolean;
  auditStatus?: "PENDING" | "REVIEWED" | "FLAGGED";

  // Tagging (e.g. "SI", "opioid risk", "non-compliance")
  tags?: string[];
}

// How we classify communication channel
export type CommunicationChannel =
  | "PHONE"
  | "EMAIL"
  | "PORTAL_MESSAGE"
  | "VIDEO_VISIT"
  | "TEXT"
  | "IN_PERSON"
  | "OTHER";

// Direction of the communication
export type CommunicationDirection = "INBOUND" | "OUTBOUND" | "INTERNAL";

// Confidentiality level
export type CommunicationConfidentiality =
  | "STANDARD"
  | "SENSITIVE"
  | "PRIVILEGED";

// One entry in the Attorney Communications Log
export interface CaseCommunicationEntry {
  id: string;
  caseId: string;

  createdAt: string;       // ISO timestamp
  createdByRole: CaseActorRole;
  createdByName?: string;

  channel: CommunicationChannel;
  direction: CommunicationDirection;

  subject: string;
  bodyPreview: string;
  body?: string;

  participants: string[];  // e.g. ["Attorney Smith", "RN Johnson", "Client Doe"]
  relatedEventIds?: string[];

  // Follow-up task info
  followUpDueAt?: string;
  followUpOwnerName?: string;
  followUpStatus?: "OPEN" | "COMPLETED" | "CANCELLED";

  confidentiality: CommunicationConfidentiality;
  isLegalHold?: boolean;   // used by Legal Lock-Down
  attachmentsCount?: number;
}
