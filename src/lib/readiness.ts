/* =========================
   FILE: src/lib/readiness.ts
   ========================= */
export type CaseStatus = "NEW"|"AWAITING_CONSENT"|"ROUTED"|"IN_PROGRESS"|"HOLD_SENSITIVE"|"READY_FOR_MEDIATION";
export type FourPs = { physical?: number; psychological?: number; psychosocial?: number; professional?: number; };
export type Intake = {
  incidentType?: "MVA"|"WorkComp"|"Other";
  incidentDate?: string; // ISO
  initialTreatment?: "ED"|"UrgentCare"|"PCP"|"Chiro"|"None";
  injuries?: string[];
  severitySelfScore?: number; // 0-10
};
export type Consent = { signed: boolean; scope?: { shareWithAttorney: boolean; shareWithProviders: boolean } };
export type CaseLite = {
  id: string;
  status: CaseStatus;
  intake?: Intake;
  fourPs?: FourPs;
  sdoh?: { housing?: boolean; food?: boolean; transport?: boolean; insuranceGap?: boolean };
  consent: Consent;
  flags?: string[]; // e.g., ["HEAD_TRAUMA","MINOR"]
  providerRouted?: boolean; // assignedProviderId exists
  lastPainDiaryAt?: string; // ISO date of last check-in
  painDiaryCount30d?: number; // count of check-ins in last 30 days
  specialistReportUploaded?: boolean; // ENT/Neuro/Ortho etc
  odgBenchmarks?: { // minimal placeholder; true only when milestone met
    initialAssessment?: boolean;
    imagingAsIndicated?: boolean;
    conservativeCareTrial?: boolean;
    specialistEvaluation?: boolean;
    returnToFunctionPlan?: boolean;
  };
  documentation?: { // non-PHI document signal flags
    fourPsComplete?: boolean;
    intakeComplete?: boolean;
    incidentNarrativeCaptured?: boolean;
  };
  sdohResolved?: { housing?: boolean; food?: boolean; transport?: boolean; insuranceGap?: boolean }; // mark resolved
};

/** Clamp helper */
const clamp = (v: number, min=0, max=100) => Math.max(min, Math.min(max, v));

/** Days since ISO date (fallback large if missing) */
const daysSince = (iso?: string) => {
  if (!iso) return 999;
  const d = new Date(iso).getTime();
  if (isNaN(d)) return 999;
  const now = Date.now();
  return Math.floor((now - d) / (1000*60*60*24));
};

/** Weighted scoring model (v1) — tweak weights safely in one place
 * Weights sum to 100. Each sub-score 0..1 scaled by weight.
 * - Medical Milestones (ODG/MCG proxy): 35
 * - Documentation Strength (diary + 4Ps + intake + narrative): 30
 * - Routing/Flow (consent + provider routing + specialist report): 20
 * - SDOH Stability (unresolved risk): 15  (penalty model)
 */
export function computeSettlementReadinessScore(kase: CaseLite) {
  // 1) Medical Milestones (max 35)
  const m = kase.odgBenchmarks || {};
  const medBits = [
    m.initialAssessment, m.imagingAsIndicated, m.conservativeCareTrial,
    m.specialistEvaluation, m.returnToFunctionPlan
  ].filter(Boolean).length;
  const medScore = (medBits / 5) * 35;

  // 2) Documentation Strength (max 30)
  const doc = kase.documentation || {};
  const diaryFreshDays = daysSince(kase.lastPainDiaryAt);
  // diary freshness: 0-7 days ideal (1.0), 8-14 (0.7), 15-30 (0.4), >30 (0.1), none (0)
  const diaryFreshFactor =
    kase.painDiaryCount30d && kase.painDiaryCount30d > 0
      ? (diaryFreshDays <= 7 ? 1 : diaryFreshDays <= 14 ? 0.7 : diaryFreshDays <= 30 ? 0.4 : 0.1)
      : 0;
  const fourPsComplete = doc.fourPsComplete ? 1 : scoreFourPsCompleteness(kase.fourPs);
  const intakeOk = doc.intakeComplete ? 1 : 0;
  const narrativeOk = doc.incidentNarrativeCaptured ? 1 : 0;
  // weights inside Documentation bucket: diary .4, 4Ps .3, intake .2, narrative .1
  const docComposite = (diaryFreshFactor*0.4 + fourPsComplete*0.3 + intakeOk*0.2 + narrativeOk*0.1) * 30;

  // 3) Routing & Flow (max 20)
  const consentOk = kase.consent?.signed && kase.consent?.scope?.shareWithAttorney ? 1 : 0;
  const routedOk = kase.providerRouted ? 1 : 0;
  const specialistOk = kase.specialistReportUploaded ? 1 : 0;
  const flowComposite = (consentOk*0.45 + routedOk*0.3 + specialistOk*0.25) * 20;

  // 4) SDOH Stability (max 15 via penalty)
  const sd = kase.sdoh || {};
  const res = kase.sdohResolved || {};
  const unresolvedFlags =
    (sd.housing && !res.housing ? 1 : 0) +
    (sd.food && !res.food ? 1 : 0) +
    (sd.transport && !res.transport ? 1 : 0) +
    (sd.insuranceGap && !res.insuranceGap ? 1 : 0);
  // 0 unresolved = full 15; each unresolved subtracts 3.75 (4 flags -> 0)
  const sdohScore = clamp(15 - unresolvedFlags * 3.75, 0, 15);

  const raw = medScore + docComposite + flowComposite + sdohScore;
  const total = clamp(Math.round(raw), 0, 100);

  // Simple status hinting
  const blockers: string[] = [];
  if (!consentOk) blockers.push("Consent not attorney-shareable");
  if (!routedOk) blockers.push("Not routed to provider");
  if (!specialistOk) blockers.push("Specialist report missing");
  if (unresolvedFlags > 0) blockers.push("Unresolved SDOH risk");
  if (diaryFreshFactor === 0) blockers.push("Pain diary inactive");
  if (fourPsComplete < 1) blockers.push("4Ps not complete");
  if (!intakeOk) blockers.push("Intake not complete");
  if (!narrativeOk) blockers.push("Incident narrative missing");

  return {
    score: total,
    buckets: {
      medical: Math.round(medScore),
      documentation: Math.round(docComposite),
      routing: Math.round(flowComposite),
      sdoh: Math.round(sdohScore),
    },
    blockers,
  };
}

/** If 4Ps present, consider "complete" when all four exist; else 0.5 if partial */
function scoreFourPsCompleteness(p?: FourPs) {
  if (!p) return 0;
  const keys: (keyof FourPs)[] = ["physical","psychological","psychosocial","professional"];
  const present = keys.filter(k => typeof p[k] === "number").length;
  if (present === 4) return 1;
  if (present >= 2) return 0.5;
  return 0.2;
}
