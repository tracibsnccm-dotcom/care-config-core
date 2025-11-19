// src/mock/mockTimeline.ts

import {
  CaseTimelineEvent,
  CaseCommunicationEntry,
} from "../domain/caseTimeline";

// Example timeline events for a single case (case-001)
export const mockTimelineEvents: CaseTimelineEvent[] = [
  {
    id: "evt-001",
    caseId: "case-001",
    createdAt: "2025-11-01T09:15:00Z",
    actorRole: "RN",
    actorName: "RN Johnson",
    eventType: "INTAKE_STARTED",
    category: "CLINICAL",
    summary: "Intake initiated via RN dashboard.",
    sourceEngine: "INTAKE",
    isCritical: false,
    visibleToAttorney: true,
    visibleToClient: false,
  },
  {
    id: "evt-002",
    caseId: "case-001",
    createdAt: "2025-11-01T10:05:00Z",
    actorRole: "SYSTEM",
    eventType: "TEN_VS_UPDATE",
    category: "CLINICAL",
    summary: "10-Vs engine flagged elevated mental health risk.",
    details:
      "Client endorsed passive SI in the last 2 weeks; mental health risk escalated to HIGH.",
    sourceEngine: "TEN_VS_ENGINE",
    tenVsSnapshot: {
      mentalHealthRisk: "HIGH",
      sdohRisk: "MODERATE",
    },
    isCritical: true,
    requiresAudit: true,
    auditStatus: "PENDING",
    tags: ["SI", "mental health"],
    visibleToAttorney: true,
    visibleToClient: false,
  },
  {
    id: "evt-003",
    caseId: "case-001",
    createdAt: "2025-11-02T14:30:00Z",
    actorRole: "DIRECTOR",
    actorName: "Director Lee",
    eventType: "LEGAL_LOCK_APPLIED",
    category: "LEGAL",
    summary: "Legal lock-down applied at attorney request.",
    details:
      "Attorney requested legal hold on mental health notes related to upcoming deposition.",
    sourceEngine: "LEGAL_LOCK_ENGINE",
    isLegalLocked: true,
    visibleToAttorney: true,
    visibleToClient: false,
  },
  {
    id: "evt-004",
    caseId: "case-001",
    createdAt: "2025-11-05T16:10:00Z",
    actorRole: "RN",
    actorName: "RN Johnson",
    eventType: "FOLLOWUP_COMPLETED",
    category: "CLINICAL",
    summary: "Telehealth RN follow-up completed.",
    details:
      "Reviewed pain diary, reinforced coping plan, coordinated psychiatry follow-up.",
    sourceEngine: "FOLLOWUP",
    tenVsSnapshot: {
      painScore: 6,
      mentalHealthRisk: "MODERATE",
    },
    visibleToAttorney: true,
    visibleToClient: true,
  },
];

// Example communication entries for the same case
export const mockCommunicationEntries: CaseCommunicationEntry[] = [
  {
    id: "comm-001",
    caseId: "case-001",
    createdAt: "2025-11-01T11:00:00Z",
    createdByRole: "ATTORNEY",
    createdByName: "Attorney Smith",
    channel: "PHONE",
    direction: "OUTBOUND",
    subject: "Initial case strategy discussion with RN",
    bodyPreview:
      "Discussed overall case goals, anticipated surgery timeline, and psych consult...",
    participants: ["Attorney Smith", "RN Johnson"],
    followUpDueAt: "2025-11-04T16:00:00Z",
    followUpOwnerName: "RN Johnson",
    followUpStatus: "OPEN",
    confidentiality: "PRIVILEGED",
    isLegalHold: true,
    attachmentsCount: 0,
  },
  {
    id: "comm-002",
    caseId: "case-001",
    createdAt: "2025-11-02T09:45:00Z",
    createdByRole: "RN",
    createdByName: "RN Johnson",
    channel: "PORTAL_MESSAGE",
    direction: "OUTBOUND",
    subject: "Client education: 4Ps pain plan + red flag instructions",
    bodyPreview:
      "Sent plain-language summary of pain plan, ER precautions, and mental health resources...",
    participants: ["RN Johnson", "Client Doe"],
    followUpStatus: "COMPLETED",
    confidentiality: "SENSITIVE",
    attachmentsCount: 1,
  },
];
