// src/director/DirectorDashboard.tsx

import React from "react";
import {
  OverrideRequest,
  OverrideStatus,
  OverrideType,
} from "../lib/overrides";

/**
 * Reconcile C.A.R.E.™
 * Director Dashboard (Step 1 — Prototype)
 *
 * Purpose:
 * - Give the Director a single view of pending overrides.
 * - Show the type, origin, case, and reason at a glance.
 * - Provide Approve / Deny / More Info buttons (console-log only for now).
 *
 * This component is intentionally self-contained and not yet wired
 * into your main routing. You can render it from App.tsx, AppShell,
 * or a dedicated Director route later.
 */

export interface DirectorDashboardProps {
  /**
   * All override requests visible to the Director.
   * If not provided, the dashboard will render with mock data.
   */
  overrides?: OverrideRequest[];
}

const typeLabel = (t: OverrideType): string => {
  switch (t) {
    case "SEVERITY_CHANGE_REQUEST":
      return "RN → Sup: Severity Change";
    case "WORKLOAD_LIMIT_OVERRIDE":
      return "RN → Sup: Workload Override";
    case "V_TRIGGER_EXCEPTION":
      return "RN → Sup: V-Trigger Exception";
    case "HIGH_RISK_SDOH_UNRESOLVED":
      return "RN → Sup: High-Risk SDOH";
    case "LATE_ASSESSMENT_DOCUMENTATION":
      return "RN → Sup: Late Documentation";
    case "FOLLOWUP_OVERDUE":
      return "RN → Sup: Follow-Up Overdue";
    case "TASK_OVERDUE":
      return "RN → Sup: Task Overdue";
    case "CASE_CLOSURE_REQUEST":
      return "RN → Sup: Case Closure";
    case "CASE_REOPEN_REQUEST":
      return "RN → Sup: Case Re-Open";
    case "VARIANCE_USE_REQUEST":
      return "RN → Sup: Variance (V8) Request";
    case "ADMIN_CLOSURE_REASON_OVERRIDE":
      return "RN → Sup: Admin Closure Override";
    case "CRISIS_ESCALATION":
      return "RN → Sup: Crisis Escalation";

    case "SEVERITY_CHANGE_APPROVAL":
      return "Sup → Dir: Severity Approval";
    case "WORKLOAD_OVERRIDE_APPROVAL":
      return "Sup → Dir: Workload Override";
    case "VARIANCE_APPROVAL":
      return "Sup → Dir: Variance (V8) Approval";
    case "LEGAL_LOCKDOWN_APPROVAL":
      return "Sup → Dir: Legal Lock-Down";
    case "COVERAGE_HANDOFF_APPROVAL":
      return "Sup → Dir: Coverage / Handoff";
    case "EXTENDED_FOLLOWUP_APPROVAL":
      return "Sup → Dir: Extended Follow-Up";
    case "OVERRIDE_RAG_BLOCK":
      return "Sup → Dir: Override RAG Block";
    default:
      return t;
  }
};

const statusBadgeClass = (status: OverrideStatus): string => {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-800";
    case "Approved":
      return "bg-emerald-100 text-emerald-800";
    case "Denied":
      return "bg-red-100 text-red-800";
    case "MoreInfoRequested":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

const truncate = (s: string, max: number): string =>
  s.length <= max ? s : s.slice(0, max - 1) + "…";

/**
 * If no overrides prop is provided, show a small mock list so you
 * can visually inspect the dashboard without needing backend wiring yet.
 */
const buildMockOverrides = (): OverrideRequest[] => {
  const now = new Date().toISOString();
  return [
    {
      id: "mock-ovr-1",
      caseId: "case-1001",
      clientName: "Jane Doe",
      rnId: "rn-01",
      supervisorId: "sup-01",
      origin: "RN_TO_SUPERVISOR",
      type: "WORKLOAD_LIMIT_OVERRIDE",
      category: "Workload",
      reasonCategory: "High Complexity Caseload",
      narrative:
        "RN workload would exceed Director-defined max points if this L3 case is added. Requesting review to keep continuity with existing attorney relationship.",
      status: "Pending",
      createdAt: now,
      updatedAt: now,
      currentSeverityLevel: 3,
      requestedSeverityLevel: 3,
      currentRagStatus: "Amber",
      currentVitalityScore: 6.2,
      currentWorkloadPercent: 98,
      rnWorkloadStatus: "Red",
      relatedVs: ["V2-Viability", "V6-Vitality", "V10-Validation"],
      metadata: {
        source: "IntakeWorkloadEnforcement",
      },
      decisionLog: [
        {
          actorRole: "RN",
          actorId: "rn-01",
          action: "REQUESTED",
          reason:
            "Client is legally and clinically complex, but RN already has rapport; requesting exception.",
          at: now,
        },
      ],
    },
    {
      id: "mock-ovr-2",
      caseId: "case-1042",
      clientName: "John Smith",
      rnId: "rn-02",
      supervisorId: "sup-01",
      directorId: "dir-01",
      origin: "SUPERVISOR_TO_DIRECTOR",
      type: "SEVERITY_CHANGE_APPROVAL",
      category: "Severity",
      reasonCategory: "New Comorbidity",
      narrative:
        "Supervisor supports RN request to move from Level 2 → Level 3 severity due to new uncontrolled diabetes and SDOH barriers.",
      status: "Pending",
      createdAt: now,
      updatedAt: now,
      currentSeverityLevel: 2,
      requestedSeverityLevel: 3,
      currentRagStatus: "Red",
      currentVitalityScore: 4.1,
      currentWorkloadPercent: 72,
      rnWorkloadStatus: "Amber",
      relatedVs: ["V2-Viability", "V3-Vision", "V7-Vigilance"],
      metadata: {
        source: "SupervisorSeverityReview",
      },
      decisionLog: [
        {
          actorRole: "RN",
          actorId: "rn-02",
          action: "REQUESTED",
          reason:
            "Client recently hospitalized twice with worsening A1C; SDOH barriers now present.",
          at: now,
        },
        {
          actorRole: "SUPERVISOR",
          actorId: "sup-01",
          action: "REQUESTED",
          reason:
            "Agree with RN; requesting Director approval for higher level and additional RN hours.",
          at: now,
        },
      ],
    },
  ];
};

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  overrides,
}) => {
  const list = overrides && overrides.length > 0 ? overrides : buildMockOverrides();

  const handleAction = (
    ov: OverrideRequest,
    action: "APPROVE" | "DENY" | "MORE_INFO"
  ) => {
    console.log("[DIRECTOR_OVERRIDE_ACTION]", {
      overrideId: ov.id,
      caseId: ov.caseId,
      clientName: ov.clientName,
      type: ov.type,
      action,
    });

    // In a future step, this will call your backend API:
    // - PATCH /overrides/:id { status, directorReason }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">
          Director Oversight Console (Prototype)
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Central view of pending overrides, workload exceptions, severity
          changes, and legal lock-down approvals. Actions are currently logged
          to the console only.
        </p>
      </header>

      {/* High-level configuration summary (static for now) */}
      <section className="bg-white border rounded-xl p-4 shadow-sm mb-6">
        <h2 className="text-sm font-semibold mb-2">Global Director Controls</h2>
        <ul className="text-xs text-slate-700 space-y-1">
          <li>
            <span className="font-semibold">RN Max Workload:</span> 15
            complexity points (example; configured by Director).
          </li>
          <li>
            <span className="font-semibold">Severity Levels:</span> 1–4 (Simple
            → Severely Complex), used by 10-Vs engine and workload model.
          </li>
          <li>
            <span className="font-semibold">Vitality Bands (RAG):</span>{" "}
            Red&nbsp;1.0–3.9, Amber&nbsp;4.0–7.9, Green&nbsp;8.0–10.0.
          </li>
          <li>
            <span className="font-semibold">Override Sources:</span> RN →
            Supervisor, Supervisor → Director (severity, workload, variance,
            legal lock-down, RAG overrides).
          </li>
        </ul>
      </section>

      {/* Pending Overrides */}
      <section className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Pending Overrides</h2>
          <span className="text-xs text-slate-500">
            Showing {list.length} override
            {list.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border px-2 py-1 text-left">Case / Client</th>
                <th className="border px-2 py-1 text-left">Type</th>
                <th className="border px-2 py-1 text-left">Origin</th>
                <th className="border px-2 py-1 text-left">Severity</th>
                <th className="border px-2 py-1 text-left">Workload</th>
                <th className="border px-2 py-1 text-left">Status</th>
                <th className="border px-2 py-1 text-left">Summary</th>
                <th className="border px-2 py-1 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((ov) => (
                <tr key={ov.id} className="hover:bg-slate-50">
                  <td className="border px-2 py-1 align-top">
                    <div className="font-semibold">
                      {ov.clientName || "Unknown Client"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Case: {ov.caseId}
                    </div>
                  </td>
                  <td className="border px-2 py-1 align-top">
                    <div>{typeLabel(ov.type)}</div>
                    {ov.category && (
                      <div className="text-[10px] text-slate-500">
                        {ov.category}
                        {ov.reasonCategory ? ` · ${ov.reasonCategory}` : ""}
                      </div>
                    )}
                  </td>
                  <td className="border px-2 py-1 align-top">
                    <div className="text-[10px] text-slate-600">
                      {ov.origin === "RN_TO_SUPERVISOR"
                        ? "RN → Supervisor"
                        : "Supervisor → Director"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      RN: {ov.rnId || "n/a"}
                      <br />
                      Sup: {ov.supervisorId || "n/a"}
                      <br />
                      Dir: {ov.directorId || "n/a"}
                    </div>
                  </td>
                  <td className="border px-2 py-1 align-top">
                    <div className="text-[11px]">
                      Current:{" "}
                      {ov.currentSeverityLevel
                        ? `L${ov.currentSeverityLevel}`
                        : "n/a"}
                    </div>
                    <div className="text-[11px]">
                      Requested:{" "}
                      {ov.requestedSeverityLevel
                        ? `L${ov.requestedSeverityLevel}`
                        : "n/a"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      RAG: {ov.currentRagStatus || "n/a"}
                    </div>
                  </td>
                  <td className="border px-2 py-1 align-top">
                    <div className="text-[11px]">
                      Utilization:{" "}
                      {ov.currentWorkloadPercent !== undefined
                        ? `${ov.currentWorkloadPercent}%`
                        : "n/a"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      RN Load: {ov.rnWorkloadStatus || "n/a"}
                    </div>
                  </td>
                  <td className="border px-2 py-1 align-top">
                    <span
                      className={
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold " +
                        statusBadgeClass(ov.status)
                      }
                    >
                      {ov.status}
                    </span>
                  </td>
                  <td className="border px-2 py-1 align-top">
                    <div className="text-[11px]">
                      {truncate(ov.narrative || "", 120)}
                    </div>
                    {ov.relatedVs && ov.relatedVs.length > 0 && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Vs: {ov.relatedVs.join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="border px-2 py-1 align-top">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        className="border border-emerald-500 text-emerald-700 rounded px-2 py-0.5 text-[10px] hover:bg-emerald-50"
                        onClick={() => handleAction(ov, "APPROVE")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="border border-red-500 text-red-700 rounded px-2 py-0.5 text-[10px] hover:bg-red-50"
                        onClick={() => handleAction(ov, "DENY")}
                      >
                        Deny
                      </button>
                      <button
                        type="button"
                        className="border border-slate-400 text-slate-700 rounded px-2 py-0.5 text-[10px] hover:bg-slate-50"
                        onClick={() => handleAction(ov, "MORE_INFO")}
                      >
                        More Info
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="border px-2 py-4 text-center text-xs text-slate-500"
                  >
                    No override requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-slate-500 mt-3">
          Note: This is a prototype view. Actions are logged to the browser
          console. In production, each action will call an API and be written
          into the audit log as part of the V10 (Validation) framework.
        </p>
      </section>
    </div>
  );
};

export default DirectorDashboard;
