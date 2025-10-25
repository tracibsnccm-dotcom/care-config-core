// RCMS C.A.R.E. Configuration

export const ROLES = {
  CLIENT: "CLIENT",
  ATTORNEY: "ATTORNEY",
  RN_CCM: "RN_CCM",
  STAFF: "STAFF",
  RCMS_STAFF: "RCMS_STAFF",
  SUPER_USER: "SUPER_USER",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const RCMS_CONFIG = {
  appName: "Reconcile C.A.R.E.",
  featureFlags: {
    enableSensitiveCase: true,
    requireConsentBeforeShare: true,
    exportAllowedForRoles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN],
  },
  quarterResets: ["01-01", "04-01", "07-01", "10-01"],
  tiers: {
    Trial: {
      price: 0,
      seats: { attorneys: 1, staff: 1, rnCcm: 0 },
      providers: { slots: 5, swapsPerQuarter: 2 },
      routerEnabled: false,
    },
    Basic: {
      price: 9500,
      seats: { attorneys: 2, staff: 0, rnCcm: 0 },
      providers: { slots: 0, swapsPerQuarter: 0 },
      routerEnabled: false,
    },
    Solo: {
      price: 24000,
      seats: { attorneys: 3, staff: 3, rnCcm: 0 },
      providers: { slots: 20, swapsPerQuarter: 5 },
      routerEnabled: true,
    },
    "Mid-Sized": {
      price: 42000,
      seats: { attorneys: 15, staff: 8, rnCcm: 1 },
      providers: { slots: 40, swapsPerQuarter: 5 },
      routerEnabled: true,
    },
    Enterprise: {
      price: 85000,
      seats: { attorneys: 50, staff: 20, rnCcm: 2 },
      providers: { slots: 80, swapsPerQuarter: 5 },
      routerEnabled: true,
    },
  },
  billing: {
    setupFee: 0,
    firstMonthDueAtSigning: true,
    annualPrepayDiscountPct: 10,
    quarterlyBillingOptional: true,
    minimumCommitMonths: 3,
    providerSwaps: {
      policy: "Full allowance available immediately; first reset on next quarter date; no proration.",
    },
  },
  sensitiveAccessRoles: [ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN],
};

export type Gender = "female" | "male" | "nonbinary" | "prefer_not_to_say";
export type IncidentType = "MVA" | "WorkComp" | "Other";
export type InitialTreatment = "ED" | "UrgentCare" | "PCP" | "Chiro" | "None";
export type CaseStatus = "NEW" | "AWAITING_CONSENT" | "ROUTED" | "IN_PROGRESS" | "HOLD_SENSITIVE" | "CLOSED";
export type RiskLevel = "stable" | "at_risk" | "critical";
export type SDOHFlag = 
  | "Transportation"
  | "Money/Cost"
  | "Child/Elder Care"
  | "Work Schedule"
  | "Illness"
  | "Housing Instability"
  | "Language/Interpreter"
  | "Technology/Access"
  | "Safety/Violence"
  | "Other";

export interface Client {
  rcmsId: string;
  attyRef: string;
  dobMasked: string;
  gender?: Gender;
  state?: string;
  fullName?: string;            // stored but RBAC-gated in UI
  displayNameMasked?: string;   // masked fallback (e.g., "A*** B***")
}

export interface Intake {
  incidentType: IncidentType;
  incidentDate: string;
  initialTreatment: InitialTreatment;
  injuries: string[];
  severitySelfScore: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
}

export interface FourPs {
  physical: number;
  psychological: number;
  psychosocial: number;
  professional: number;
}

export interface SDOH {
  housing: boolean;
  food: boolean;
  transport: boolean;
  insuranceGap: boolean;
}

export interface Consent {
  signed: boolean;
  signedAt?: string;
  scope: {
    shareWithAttorney: boolean;
    shareWithProviders: boolean;
  };
  restrictedAccess?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  city: string;
  state: string;
  distanceMiles?: number;
  schedulingUrl?: string;
  active: boolean;
}

export interface Checkin {
  ts: string;
  pain: number;
  note?: string;
  fourPs?: Partial<FourPs>;
}

export interface Case {
  id: string;
  firmId: string;               // owner firm
  designatedUserIds?: string[]; // case-level allow list
  onsetOfService?: string;
  client: Client;
  intake: Intake;
  fourPs?: FourPs;
  sdoh?: SDOH;
  demographics?: Demographics;
  consent: Consent;
  flags: string[];
  sdohFlags?: SDOHFlag[];
  riskLevel?: RiskLevel;
  assignedProviderId?: string;
  status: CaseStatus;
  designatedAttorneyId?: string;
  checkins?: Checkin[];
  createdAt: string;
  updatedAt: string;
}

export interface Demographics {
  zip3?: string;
  ageBand?: string;
  gender?: string;
  raceEthnicity?: string[];
  education?: string;
  incomeBand?: string;
  consentForDeidentifiedUse?: boolean;
}

export interface AuditEntry {
  ts: string;
  actorRole: string;
  actorId: string;
  action: string;
  caseId: string;
}
