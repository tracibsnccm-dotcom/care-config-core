// src/rn/RNConsole.tsx

import React from "react";

/**
 * Reconcile C.A.R.E.™
 * RN Care Management Portal – Dashboard
 *
 * NOTE (IMPORTANT):
 *  - This version still uses MOCK data only.
 *  - It is SAFE: does not touch AppState, workflows, or the 10-Vs engine.
 *  - It is now designed to show ONLY ACTIVE (non-closed) assigned clients.
 *  - Later, your dev team can wire this to real RN + case data, using the same
 *    "active only" rule: exclude fully closed cases from the main RN dashboard.
 */

type RagStatus = "Red" | "Amber" | "Green";
type CaseStatus = "Active" | "PendingSettlement" | "Closed";

interface MockCase {
  id: string;
  clientName: string;
  rag: RagStatus;
  vitality: number;
  severity: string;
  nextFollowUp: string;
  hasHighRiskFlags: boolean;
  notes: string;
  status: CaseStatus;
}

const mockCases: MockCase[] = [
  {
    id: "RC-2025-001",
    clientName: "Sample Client A",
    rag: "Red",
    vitality: 3.2,
    severity: "Level 4 – Severely Complex",
    nextFollowUp: "2025-11-18",
    hasHighRiskFlags: true,
    notes: "High pain + SDOH barriers · CM accepted.",
    status: "Active",
  },
  {
    id: "RC-2025-002",
    clientName: "Sample Client B",
    rag: "Amber",
    vitality: 6.1,
    severity: "Level 3 – Complex",
    nextFollowUp: "2025-11-20",
    hasHighRiskFlags: false,
    notes: "Return-to-work planning in progress.",
    status: "Active",
  },
  {
    id: "RC-2025-003",
    clientName: "Sample Client C",
    rag: "Green",
    vitality: 8.4,
    severity: "Level 2 – Moderate",
    nextFollowUp: "2025-11-25",
    hasHighRiskFlags: false,
    notes: "Goals largely met; nearing closure recommendation.",
    status: "PendingSettlement",
  },
  {
    id: "RC-2025-004",
    clientName: "Closed Example D",
    rag: "Green",
    vitality: 9.1,
    severity: "Level 1 – Simple",
    nextFollowUp: "2025-10-01",
    hasHighRiskFlags: false,
    notes: "Completed; closure type: Finalized Settlement.",
    status: "Closed",
  },
];

// Helper: filter ACTIVE assigned clients (non-closed)
function getActiveCases(cases: MockCase[]): MockCase[] {
  return cases.filter((c) => c.status === "Active");
}

function countByRag(cases: MockCase[], status: RagStatus): number {
  return cases.filter((c) => c.rag === status).length;
}

const RNConsole: React.FC = () => {
  // Apply your rule: only ACTIVE assigned clients
  const activeCases = getActiveCases(mockCases);

  const totalActiveCases = activeCases.length;
  const redCount = countByRag(activeCases, "Red");
  const amberCount = countByRag(activeCases, "Amber");
  const greenCount = countByRag(activeCases, "Green");

  const today = new Date().toISOString().slice(0, 10);
  const dueToday = activeCases.filter((c) => c.nextFollowUp <= today).length;
  const highRisk = activeCases.filter((c) => c.hasHighRiskFlags).length;

  // For now, we hard-code a “max points” and a mock current workload
  const maxWorkloadPoints = 15;
  const currentWorkloadPoints = 11; // pretend this RN is near capacity
  const workloadPercent = Math.min(
    100,
    Math.round((currentWorkloadPoints / maxWorkloadPoints) * 100)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">
            Reconcile C.A.R.E.™ – RN Care Management Portal
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Your centralized view of active cases, follow-ups, high-risk flags,
            and plan momentum. This dashboard currently uses mock data only, but
            is structured to show only ACTIVE (non-closed) assigned clients.
          </p>
        </header>

        {/* Top summary tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Active Cases Needing Attention Today
            </div>
            <div className="mt-2 text-3xl font-bold">{dueToday}</div>
            <p className="mt-1 text-[11px] text-slate-600">
              Follow-ups due today or overdue among ACTIVE assigned clients.
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Active Cases with High-Risk / Critical Flags
            </div>
            <div className="mt-2 text-3xl font-bold">{highRisk}</div>
            <p className="mt-1 text-[11px] text-slate-600">
              ACTIVE clients with pain, safety, mental health or SDOH risks
              needing priority review.
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Total Active Assigned Cases (Mock)
            </div>
            <div className="mt-2 text-3xl font-bold">{totalActiveCases}</div>
            <p className="mt-1 text-[11px] text-slate-600">
              This is a sample count. In production, this will reflect the RN’s
              real ACTIVE caseload, excluding fully closed cases.
            </p>
          </div>
        </div>

        {/* RAG + workload row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* RAG distribution */}
          <div className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold mb-2">
              RAG Distribution – Active Cases (Mock)
            </div>
            <p className="text-[11px] text-slate-600 mb-2">
              At-a-glance risk view across your ACTIVE caseload only.
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
            <p className="mt-2 text-[11px] text-slate-500">
              RAG is derived from vitality, vigilance, and severity. Here we use
              mock values for layout only. When wired to the 10-Vs engine, only
              ACTIVE cases will be counted.
            </p>
          </div>

          {/* Workload bar */}
          <div className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold mb-2">
              My Workload (Complexity Points)
            </div>
            <p className="text-[11px] text-slate-600 mb-2">
              This reflects a mock view of the Director-controlled workload
              engine. In production, these values will come from your 10-Vs
              severity scores and the Director’s RN limits, based only on ACTIVE
              caseload.
            </p>

            <div className="flex items-center justify-between text-[11px] mb-1">
              <span>
                Current:{" "}
                <span className="font-semibold">
                  {currentWorkloadPoints} pts
                </span>
              </span>
              <span>
                Max:{" "}
                <span className="font-semibold">
                  {maxWorkloadPoints} pts
                </span>
              </span>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-3 ${
                  workloadPercent < 70
                    ? "bg-emerald-500"
                    : workloadPercent < 100
                    ? "bg-amber-400"
                    : "bg-red-500"
                }`}
                style={{ width: `${workloadPercent}%` }}
              />
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              When wired to live data, this will help the Director avoid
              overloading any single RN while still prioritizing high-risk
              ACTIVE clients.
            </p>
          </div>
        </div>

        {/* Active case list */}
        <div className="bg-white border rounded-xl p-4 shadow-sm text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">My Active Cases (Sample)</div>
            <div className="text-[11px] text-slate-500">
              This table shows only ACTIVE assigned clients. Later, each row
              will link into the RN case view (snapshot, flags, follow-up).
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px] border-t border-slate-100">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-left px-3 py-2 font-semibold">Client</th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Case ID
                  </th>
                  <th className="text-left px-3 py-2 font-semibold">RAG</th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Vitality
                  </th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Severity
                  </th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Next Follow-Up
                  </th>
                  <th className="text-left px-3 py-2 font-semibold">
                    Alerts / Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeCases.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2">{c.clientName}</td>
                    <td className="px-3 py-2 text-slate-600">{c.id}</td>
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
                    <td className="px-3 py-2">{c.vitality.toFixed(1)}</td>
                    <td className="px-3 py-2">{c.severity}</td>
                    <td className="px-3 py-2">{c.nextFollowUp}</td>
                    <td className="px-3 py-2 text-slate-600 max-w-xs">
                      {c.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[10px] text-slate-500">
            Future Enhancements: filter by RAG, search by client name, quick
            jump into case view, and live indicators tied directly to the 10-Vs
            engine, Vitality, Vigilance, RN workload limits, and legal
            lock-down status—always limited to ACTIVE (non-closed) cases.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RNConsole;
