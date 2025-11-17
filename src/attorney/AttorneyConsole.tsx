// src/attorney/AttorneyConsole.tsx

import React, { useState } from "react";

/**
 * Reconcile C.A.R.E.™
 * Attorney Case Dashboard – MOCK ONLY
 *
 * IMPORTANT:
 * - This dashboard is currently backed by MOCK data only.
 * - It does NOT use AppState, 10-Vs engine, or live workflows yet.
 * - It is SAFE: purely a visual prototype for how attorneys will see value.
 * - Main view shows ACTIVE + PENDING SETTLEMENT cases.
 * - Closed cases appear only as summarized counts (not in the main work list).
 *
 * Later, your dev team can:
 * - Replace `mockCases` with real API results (e.g., GET /attorney/cases).
 * - Wire RAG, Vitality, and “Value Summary” to your engines and reports.
 * - Hook row-click → full AttorneyCaseView with proper routing.
 */

type RagStatus = "Red" | "Amber" | "Green";
type CaseLifecycleStatus =
  | "Active"
  | "PendingSettlement"
  | "Closed_Finalized"
  | "Closed_Admin";

interface AttorneyCaseSummary {
  id: string;
  clientName: string;
  caseStatus: CaseLifecycleStatus;
  rag: RagStatus;
  severityLevel: string;
  vitalityScore: number;
  valueTier: "High" | "Moderate" | "Emerging";
  nextKeyEvent: string; // mediation, IME, deposition, etc.
  lastRnUpdate: string;
  rnLead: string;
  painPointSummary: string;
  sdohRiskSummary: string;
  projectedLodWeeks: number; // from ODG/MCG in future
  notesForAttorney: string;
}

const mockCases: AttorneyCaseSummary[] = [
  {
    id: "RC-2025-001",
    clientName: "Sample Client A",
    caseStatus: "Active",
    rag: "Red",
    severityLevel: "Level 4 – Severely Complex",
    vitalityScore: 3.2,
    valueTier: "High",
    nextKeyEvent: "Mediation – 2025-12-05",
    lastRnUpdate: "2025-11-12",
    rnLead: "RN CM – Johnson",
    painPointSummary: "Uncontrolled lumbar pain, difficulty ambulating, sleep disruption.",
    sdohRiskSummary:
      "Transportation barrier to PT, financial strain, risk for housing instability.",
    projectedLodWeeks: 40,
    notesForAttorney:
      "Recommend reinforcing need for structured pain management and transportation support in negotiations.",
  },
  {
    id: "RC-2025-002",
    clientName: "Sample Client B",
    caseStatus: "Active",
    rag: "Amber",
    severityLevel: "Level 3 – Complex",
    vitalityScore: 6.0,
    valueTier: "Moderate",
    nextKeyEvent: "IME – 2025-11-28",
    lastRnUpdate: "2025-11-10",
    rnLead: "RN CM – Patel",
    painPointSummary: "Moderate shoulder pain with improved ROM.",
    sdohRiskSummary: "Mild financial stress, stable housing, strong family support.",
    projectedLodWeeks: 22,
    notesForAttorney:
      "Client progressing but still has functional limits impacting full-duty work.",
  },
  {
    id: "RC-2025-003",
    clientName: "Sample Client C",
    caseStatus: "PendingSettlement",
    rag: "Green",
    severityLevel: "Level 2 – Moderate",
    vitalityScore: 8.4,
    valueTier: "Emerging",
    nextKeyEvent: "Settlement Conference – 2025-11-30",
    lastRnUpdate: "2025-11-08",
    rnLead: "RN CM – Lewis",
    painPointSummary: "Mild residual pain, largely functional with restrictions.",
    sdohRiskSummary: "No significant SDOH barriers at this time.",
    projectedLodWeeks: 12,
    notesForAttorney:
      "Case clinically stable and nearing closure; recommend summary of improvement and current restrictions.",
  },
  {
    id: "RC-2025-004",
    clientName: "Closed Example D",
    caseStatus: "Closed_Finalized",
    rag: "Green",
    severityLevel: "Level 1 – Simple",
    vitalityScore: 9.3,
    valueTier: "Emerging",
    nextKeyEvent: "—",
    lastRnUpdate: "2025-09-15",
    rnLead: "RN CM – Johnson",
    painPointSummary: "Pain resolved, full functional recovery.",
    sdohRiskSummary: "No significant SDOH barriers documented.",
    projectedLodWeeks: 6,
    notesForAttorney: "Settlement completed; case closed.",
  },
  {
    id: "RC-2025-005",
    clientName: "Closed Example E",
    caseStatus: "Closed_Admin",
    rag: "Amber",
    severityLevel: "Level 2 – Moderate",
    vitalityScore: 5.2,
    valueTier: "Moderate",
    nextKeyEvent: "—",
    lastRnUpdate: "2025-08-30",
    rnLead: "RN CM – Patel",
    painPointSummary: "Incomplete clinical follow-up; client lost to follow-up.",
    sdohRiskSummary: "Financial stress, difficulty with consistent contact.",
    projectedLodWeeks: 18,
    notesForAttorney:
      "Administrative closure; document attempts and lost-to-follow-up status.",
  },
];

// Helpers
function isWorkListStatus(status: CaseLifecycleStatus): boolean {
  // Work list = Active + Pending Settlement only
  return status === "Active" || status === "PendingSettlement";
}

function filterWorkList(cases: AttorneyCaseSummary[]): AttorneyCaseSummary[] {
  return cases.filter((c) => isWorkListStatus(c.caseStatus));
}

function countByRag(cases: AttorneyCaseSummary[], status: RagStatus): number {
  return cases.filter((c) => c.rag === status).length;
}

function countByLifecycleStatus(
  cases: AttorneyCaseSummary[],
  status: CaseLifecycleStatus
): number {
  return cases.filter((c) => c.caseStatus === status).length;
}

const AttorneyConsole: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    mockCases[0]?.id ?? null
  );

  const workList = filterWorkList(mockCases);
  const selectedCase =
    workList.find((c) => c.id === selectedCaseId) ?? workList[0] ?? null;

  const totalWorkList = workList.length;
  const redCount = countByRag(workList, "Red");
  const amberCount = countByRag(workList, "Amber");
  const greenCount = countByRag(workList, "Green");

  const closedFinal = countByLifecycleStatus(mockCases, "Closed_Finalized");
  const closedAdmin = countByLifecycleStatus(mockCases, "Closed_Admin");

  const highValueCases = workList.filter((c) => c.valueTier === "High").length;
  const moderateValueCases = workList.filter(
    (c) => c.valueTier === "Moderate"
  ).length;
  const emergingValueCases = workList.filter(
    (c) => c.valueTier === "Emerging"
  ).length;

  const today = new Date().toISOString().slice(0, 10);
  const nearEvents = workList.filter((c) => {
    // crude check: any event date containing 2025-11 is treated as “near”
    return c.nextKeyEvent.includes("2025-11");
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">
            Reconcile C.A.R.E.™ – Attorney Case Dashboard
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Clinical clarity you can negotiate with. This dashboard provides a
            high-level view of your Active and Pending Settlement cases. All
            data shown is sample/mock only and will be replaced with live case
            data in production.
          </p>
        </header>

        {/* Top summary tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Active & Pending Settlement Cases
            </div>
            <div className="mt-2 text-3xl font-bold">{totalWorkList}</div>
            <p className="mt-1 text-[11px] text-slate-600">
              Cases currently in play for you. Closed cases remain accessible in
              your archive but are not shown in this work list.
            </p>
            <p className="mt-2 text-[10px] text-slate-500">
              Closed (Finalized): {closedFinal} · Closed (Admin): {closedAdmin}
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Settlement Posture – Value Mix
            </div>
            <div className="mt-2 text-base font-semibold">
              High: {highValueCases} · Moderate: {moderateValueCases} · Emerging:{" "}
              {emergingValueCases}
            </div>
            <p className="mt-1 text-[11px] text-slate-600">
              Indicates where Reconcile C.A.R.E. expects the greatest clinical
              leverage and negotiation impact based on complexity, risk, and
              functional limitations.
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Key Events Coming Up (Mock)
            </div>
            <div className="mt-2 text-3xl font-bold">{nearEvents}</div>
            <p className="mt-1 text-[11px] text-slate-600">
              Number of Active or Pending Settlement cases with significant
              events in the near term (e.g., IME, mediation, settlement
              conference).
            </p>
            <p className="mt-2 text-[10px] text-slate-500">
              Today: {today}
            </p>
          </div>
        </div>

        {/* Middle row: RAG & Value context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* RAG distribution */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-2">
              RAG Distribution – Active & Pending Settlement (Mock)
            </div>
            <p className="text-[11px] text-slate-600 mb-2 max-w-md">
              RAG blends clinical risk, stability, and plan momentum into a
              simple color code so you can see where your attention (or
              settlement strategy) is most needed.
            </p>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                <span>Red: {redCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-amber-400" />
                <span>Amber: {amberCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                <span>Green: {greenCount}</span>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              In production, these values will be driven directly by the
              Reconcile C.A.R.E. 10-Vs engine, Vitality score, and vigilance
              flags.
            </p>
          </section>

          {/* Narrative value explanation */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-2">
              How Reconcile C.A.R.E. Supports Your Negotiations
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700">
              <li>
                Converts complex pain, SDOH, and clinical data into clear case
                narratives.
              </li>
              <li>
                Identifies where guideline-supported care has been delayed,
                denied, or partially implemented.
              </li>
              <li>
                Documents functional impact and realistic timelines (e.g., ODG /
                MCG-informed length of disability) without over- or
                under-stating severity.
              </li>
              <li>
                Creates a defensible, nurse-led record of advocacy, adherence
                efforts, and barriers.
              </li>
            </ul>
            <p className="mt-2 text-[10px] text-slate-500">
              This dashboard is a mock layout; all language and structure are
              designed to be attorney-facing and settlement-focused while
              remaining clinically responsible.
            </p>
          </section>
        </div>

        {/* Bottom row: Worklist + Case Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Worklist table (3/5 width on large screens) */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">My Cases in Play</div>
              <div className="text-[10px] text-slate-500">
                Showing Active + Pending Settlement only. Click a row to preview
                case details.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px] border-t border-slate-100">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="text-left px-3 py-2 font-semibold">
                      Client
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Case ID
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">Status</th>
                    <th className="text-left px-3 py-2 font-semibold">RAG</th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Severity
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Vitality
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Next Key Event
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workList.map((c) => {
                    const isSelected = c.id === selectedCase?.id;
                    return (
                      <tr
                        key={c.id}
                        className={`border-t border-slate-100 cursor-pointer ${
                          isSelected ? "bg-sky-50" : "hover:bg-slate-50"
                        }`}
                        onClick={() => setSelectedCaseId(c.id)}
                      >
                        <td className="px-3 py-2">{c.clientName}</td>
                        <td className="px-3 py-2 text-slate-600">{c.id}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {c.caseStatus === "Active"
                            ? "Active"
                            : "Pending Settlement"}
                        </td>
                        <td className="px-3 py-2">
                          {c.rag === "Red" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
                              Red
                            </span>
                          )}
                          {c.rag === "Amber" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                              Amber
                            </span>
                          )}
                          {c.rag === "Green" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                              Green
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {c.severityLevel}
                        </td>
                        <td className="px-3 py-2">{c.vitalityScore.toFixed(1)}</td>
                        <td className="px-3 py-2 text-slate-700 max-w-[10rem]">
                          {c.nextKeyEvent}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Case preview (2/5 width on large screens) */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">
                Case Preview – Attorney View
              </div>
              {selectedCase && (
                <span className="text-[10px] text-slate-500">
                  Case ID:{" "}
                  <span className="font-mono font-semibold">
                    {selectedCase.id}
                  </span>
                </span>
              )}
            </div>

            {!selectedCase ? (
              <p className="text-[11px] text-slate-600">
                Select a case from the table to see a preview of the clinical
                and functional story.
              </p>
            ) : (
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    Client & RN Lead
                  </div>
                  <div className="text-[11px] text-slate-800">
                    {selectedCase.clientName} · {selectedCase.rnLead}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-semibold">Status:</span>
                  <span className="text-slate-800">
                    {selectedCase.caseStatus === "Active"
                      ? "Active"
                      : "Pending Settlement"}
                  </span>
                  <span className="mx-2 text-slate-400">|</span>
                  <span className="font-semibold">Value Tier:</span>
                  <span className="text-slate-800">
                    {selectedCase.valueTier} Impact
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-semibold">RAG:</span>
                  {selectedCase.rag === "Red" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
                      Red
                    </span>
                  )}
                  {selectedCase.rag === "Amber" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      Amber
                    </span>
                  )}
                  {selectedCase.rag === "Green" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Green
                    </span>
                  )}
                  <span className="mx-2 text-slate-400">|</span>
                  <span className="font-semibold">Vitality:</span>
                  <span className="text-slate-800">
                    {selectedCase.vitalityScore.toFixed(1)} / 10
                  </span>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    Pain & Functional Story
                  </div>
                  <p className="text-[11px] text-slate-800">
                    {selectedCase.painPointSummary}
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    Social & Practical Barriers (SDOH)
                  </div>
                  <p className="text-[11px] text-slate-800">
                    {selectedCase.sdohRiskSummary}
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    Projected Length of Disability (Clinical Estimate)
                  </div>
                  <p className="text-[11px] text-slate-800">
                    Approximately{" "}
                    <span className="font-semibold">
                      {selectedCase.projectedLodWeeks} weeks
                    </span>{" "}
                    based on clinical course and guideline-informed expectations.
                    (In live use, this will be supported by ODG/MCG references.)
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    RN Case Note for Attorney
                  </div>
                  <p className="text-[11px] text-slate-800">
                    {selectedCase.notesForAttorney}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Last RN Update: {selectedCase.lastRnUpdate} · Next Key Event:{" "}
                    {selectedCase.nextKeyEvent}
                  </p>
                </div>

                <p className="text-[10px] text-slate-500 mt-2">
                  In production, this preview panel can expand into a full
                  Attorney Case View, including downloadable clinical summaries
                  and negotiation-ready reports, all pulled directly from the
                  Reconcile C.A.R.E. 10-Vs and care management engine.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AttorneyConsole;

