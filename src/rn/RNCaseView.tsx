// src/rn/RNCaseView.tsx

import React from "react";

/**
 * Reconcile C.A.R.E.™
 * RN Case Detail View – Sample Layout (Mock Only)
 *
 * IMPORTANT:
 *  - This file is PURELY a UI shell for a single case.
 *  - It does NOT use AppState, workflows, or the 10-Vs engine yet.
 *  - All data is mocked for layout and training purposes.
 *  - Later, your devs can wire this to real case data, 10-Vs results,
 *    flags, tasks, and timelines.
 */

type RagStatus = "Red" | "Amber" | "Green";

interface MockFlag {
  id: string;
  label: string;
  severity: "Low" | "Moderate" | "High" | "Critical";
  type: string;
  status: "Open" | "Resolved";
  createdAt: string;
}

interface MockCaseDetail {
  caseId: string;
  clientName: string;
  dob: string;
  injuryDate: string;
  primaryInjury: string;
  attorneyName: string;
  employer: string;
  severityLevel: string;
  vitalityScore: number;
  ragStatus: RagStatus;
  cmAccepted: boolean;
  voice: string;
  view: string;
  fourPsSummary: string;
  sdohSummary: string;
  nextFollowUp: string;
  lastFollowUp: string;
}

const mockCase: MockCaseDetail = {
  caseId: "RC-2025-001",
  clientName: "Sample Client A",
  dob: "1984-06-12",
  injuryDate: "2025-09-01",
  primaryInjury: "Lumbar strain with radicular pain",
  attorneyName: "Sample Law Group, PLLC",
  employer: "Sample Logistics Co.",
  severityLevel: "Level 4 – Severely Complex",
  vitalityScore: 3.2,
  ragStatus: "Red",
  cmAccepted: true,
  voice:
    "I just want to be able to walk without this sharp pain and get back to work safely.",
  view:
    "Client sees current situation as unstable; fears losing job and income, wants clear plan and timeline.",
  fourPsSummary:
    "Physical: Severe pain 8/10, difficulty standing >10 min. Psychological: High stress, mild depression. Psychosocial: Transportation and financial strain. Professional: Currently off work; job requires heavy lifting.",
  sdohSummary:
    "SDOH: Limited transportation, rent instability risk, intermittent food insecurity, no local family support.",
  nextFollowUp: "2025-11-18",
  lastFollowUp: "2025-10-18",
};

const mockFlags: MockFlag[] = [
  {
    id: "F-001",
    label: "Severe pain ≥ 7/10 for > 2 weeks",
    severity: "Critical",
    type: "Clinical / Pain / 4Ps",
    status: "Open",
    createdAt: "2025-10-01",
  },
  {
    id: "F-002",
    label: "Transportation barrier – cannot reliably attend PT",
    severity: "High",
    type: "SDOH / Access",
    status: "Open",
    createdAt: "2025-10-01",
  },
  {
    id: "F-003",
    label: "Financial strain with risk of housing instability",
    severity: "High",
    type: "SDOH / Financial / Housing",
    status: "Open",
    createdAt: "2025-10-03",
  },
];

const RNCaseView: React.FC = () => {
  const { ragStatus, vitalityScore } = mockCase;

  const vitalityRagClass =
    ragStatus === "Red"
      ? "bg-red-100 text-red-800"
      : ragStatus === "Amber"
      ? "bg-amber-100 text-amber-800"
      : "bg-emerald-100 text-emerald-800";

  const vitalityBarClass =
    ragStatus === "Red"
      ? "bg-red-500"
      : ragStatus === "Amber"
      ? "bg-amber-400"
      : "bg-emerald-500";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">
            RN Case Detail – Reconcile C.A.R.E.™
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Sample case view layout for one client. In production, this will be
            populated with live data from intake, follow-ups, 10-Vs, 4Ps, SDOH,
            and legal workflows.
          </p>
        </header>

        {/* Top row: Snapshot + 10-Vs/Vitality */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Case snapshot */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">Case Snapshot</div>
              <span className="text-[10px] text-slate-500">
                Case ID:{" "}
                <span className="font-mono font-semibold">
                  {mockCase.caseId}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-1 gap-x-4">
              <div>
                <div className="text-[10px] font-semibold text-slate-500">
                  Client
                </div>
                <div className="text-sm">{mockCase.clientName}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500">
                  Attorney
                </div>
                <div className="text-sm">{mockCase.attorneyName}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500">
                  Date of Birth
                </div>
                <div>{mockCase.dob}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500">
                  Injury Date
                </div>
                <div>{mockCase.injuryDate}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500">
                  Employer
                </div>
                <div>{mockCase.employer}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500">
                  Primary Injury
                </div>
                <div>{mockCase.primaryInjury}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500">
                  Next Follow-Up
                </div>
                <div>{mockCase.nextFollowUp}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500">
                  Last Follow-Up
                </div>
                <div>{mockCase.lastFollowUp}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-500">
                  CM Participation
                </div>
                <div>
                  {mockCase.cmAccepted ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Accepting Services
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      Declined / Limited Participation
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 10-Vs / Vitality Summary */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">10-Vs & Vitality</div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${vitalityRagClass}`}
              >
                RAG: {mockCase.ragStatus}
              </span>
            </div>

            {/* Vitality bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span>Vitality Score</span>
                <span className="font-semibold">
                  {vitalityScore.toFixed(1)} / 10
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-3 ${vitalityBarClass}`}
                  style={{ width: `${Math.min(100, vitalityScore * 10)}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Vitality is your overall “plan momentum” indicator, combining
                engagement, progress toward goals, and risk/stability.
              </p>
            </div>

            {/* 10-Vs grid (labels only for now) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
              <div className="border rounded-lg px-2 py-1 bg-slate-50">
                <div className="font-semibold">V1 – Voice / View</div>
                <div className="text-[10px] text-slate-600">
                  Client’s words + how they see themselves and their path.
                </div>
              </div>
              <div className="border rounded-lg px-2 py-1 bg-slate-50">
                <div className="font-semibold">V2 – Viability</div>
                <div className="text-[10px] text-slate-600">
                  Is CM intervention needed, understood, and feasible?
                </div>
              </div>
              <div className="border rounded-lg px-2 py-1 bg-slate-50">
                <div className="font-semibold">V3 – Vision</div>
                <div className="text-[10px] text-slate-600">
                  Direction of care and realistic goals / outcomes.
                </div>
              </div>
              <div className="border rounded-lg px-2 py-1 bg-slate-50">
                <div className="font-semibold">V4 – Veracity</div>
                <div className="text-[10px] text-slate-600">
                  Integrity + vigor of advocacy and documentation.
                </div>
              </div>
              <div className="border rounded-lg px-2 py-1 bg-slate-50">
                <div className="font-semibold">V5 – Versatility</div>
                <div className="text-[10px] text-slate-600">
                  Individualized planning; no cookie-cutter care.
                </div>
              </div>
              <div className="border rounded-lg px-2 py-1 bg-slate-50">
                <div className="font-semibold">V6 – Vitality</div>
                <div className="text-[10px] text-slate-600">
                  Energy and momentum of the plan over time.
                </div>
              </div>
              <div className="border rounded-lg px-2 py-1 bg-slate-50">
                <div className="font-semibold">V7 – Vigilance</div>
                <div className="text-[10px] text-slate-600">
                  Ongoing monitoring of high-risk areas and change.
                </div>
              </div>
              <div className="border rounded-lg px-2 py-1 bg-slate-50">
                <div className="font-semibold">V8 – Verification</div>
                <div className="text-[10px] text-slate-600">
                  Guidelines, ODG/MCG, and payer-aligned evidence.
                </div>
              </div>
              <div className="border rounded-lg px-2 py-1 bg-slate-50">
                <div className="font-semibold">V9 – Value</div>
                <div className="text-[10px] text-slate-600">
                  Tangible outcomes and ROI for client and attorney.
                </div>
              </div>
              <div className="border rounded-lg px-2 py-1 bg-slate-50">
                <div className="font-semibold">V10 – Validation</div>
                <div className="text-[10px] text-slate-600">
                  RN quality review, lessons learned, and audit readiness.
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Second row: 4Ps / SDOH / Flags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* 4Ps + SDOH summary */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-2">
              4Ps & SDOH Summary (From Intake)
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              These are the core inputs that feed Viability and the 10-Vs
              engine. In production, this will be auto-populated from the 4Ps
              questionnaire and SDOH intake.
            </p>
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-slate-500 mb-1">
                4Ps of Wellness
              </div>
              <p className="text-[11px] text-slate-700">
                {mockCase.fourPsSummary}
              </p>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">
                SDOH Summary
              </div>
              <p className="text-[11px] text-slate-700">
                {mockCase.sdohSummary}
              </p>
            </div>
          </section>

          {/* High/Critical flags */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-2">
              Open High / Critical Flags
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              This is a sample of how pain, SDOH, and other high-risk areas show
              up for RN Vigilance and follow-up planning.
            </p>
            <ul className="space-y-2">
              {mockFlags.map((f) => (
                <li
                  key={f.id}
                  className="border rounded-lg px-3 py-2 bg-slate-50 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[11px]">
                      {f.label}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {f.createdAt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-600">{f.type}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                        f.severity === "Critical"
                          ? "bg-red-100 text-red-800"
                          : f.severity === "High"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {f.severity}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Third row: V1–V5 notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-2">
              V1 – Voice / View (Client)
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Capture the client’s own words (Voice) and how they see
              themselves, their injury, and the path forward (View).
            </p>
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-slate-500 mb-1">
                Voice (Client’s Words)
              </div>
              <p className="text-[11px] text-slate-700">{mockCase.voice}</p>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 mb-1">
                View (Client’s Perspective)
              </div>
              <p className="text-[11px] text-slate-700">{mockCase.view}</p>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs space-y-3">
            <div>
              <div className="font-semibold text-sm mb-1">
                V2 – Viability (Need & Fit for CM)
              </div>
              <p className="text-[11px] text-slate-600">
                In production, this section will reflect the Viability Index
                derived from the 4Ps, risk factors, and RN judgment, plus a
                short RN rationale.
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">
                V3 – Vision (Goals & Direction)
              </div>
              <p className="text-[11px] text-slate-600">
                This is where RN documents the care trajectory: near-term
                safety/stability steps, medium-term functional goals, and
                long-term return-to-work or quality-of-life targets.
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">
                V4 – Veracity (Advocacy & Integrity)
              </div>
              <p className="text-[11px] text-slate-600">
                Note where heightened advocacy is required (e.g., incorrect
                denial, gaps in provider communication) and how RN CM is
                pushing the ball forward for the client and attorney.
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">
                V5 – Versatility (Individualization)
              </div>
              <p className="text-[11px] text-slate-600">
                Document where this plan is uniquely tailored—not a copy-paste.
                For example, shift-work constraints, cultural considerations, or
                specific preferences the client expressed.
              </p>
            </div>
          </section>
        </div>

        {/* Fourth row: V6–V10 notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs space-y-3">
            <div>
              <div className="font-semibold text-sm mb-1">
                V6 – Vitality (Momentum Over Time)
              </div>
              <p className="text-[11px] text-slate-600">
                When wired to live data, this will show how the plan’s Vitality
                has changed over follow-ups, including the story behind major
                drops or improvements.
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">
                V7 – Vigilance (Ongoing Watch Points)
              </div>
              <p className="text-[11px] text-slate-600">
                Summarize the key watch areas: pain levels, mental health,
                medication adherence, SDOH, and any condition-specific red
                flags. This section aligns with your “always-ask” rules.
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">
                V8 – Verification (Guidelines & Evidence)
              </div>
              <p className="text-[11px] text-slate-600">
                In production, this will link to ODG/MCG references, document
                any variances, and show why recommended care is justified based
                on the client’s full picture.
              </p>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs space-y-3">
            <div>
              <div className="font-semibold text-sm mb-1">
                V9 – Value (Outcomes & ROI)
              </div>
              <p className="text-[11px] text-slate-600">
                This area will show how RN CM interventions reduced risk,
                supported adherence, or improved clarity for the attorney,
                including approximate time/$$ value where appropriate.
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">
                V10 – Validation (Quality & Lessons Learned)
              </div>
              <p className="text-[11px] text-slate-600">
                Supervisors and Directors can use this space during audits to
                highlight strong work, identify gaps, and tag lessons learned
                that may feed your broader “lessons learned” repository.
              </p>
            </div>
          </section>
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-slate-500 mt-4">
          This RN Case Detail View is currently a mock layout. It is designed to
          align with your 10-Vs framework, 4Ps/SDOH triggers, vigilance rules,
          and legal defensibility, and can be wired to live data once your
          backend case APIs are ready.
        </p>
      </div>
    </div>
  );
};

export default RNCaseView;
