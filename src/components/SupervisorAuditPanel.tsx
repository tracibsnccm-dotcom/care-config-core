// src/components/SupervisorAuditPanel.tsx

import React from "react";
import { AppState, Flag, Task } from "../lib/models";
import { evaluateTenVs, FourPsSnapshot } from "../lib/vEngine";
import {
  computeRnWorkload,
  defaultWorkloadSettings,
} from "../lib/workload";
import { exportCurrentAuditCSV } from "../lib/export";

interface SupervisorAuditPanelProps {
  state: AppState;
}

/**
 * Build a basic 4Ps snapshot from flags only, for cases where
 * we don't have the raw intake questionnaire in this view.
 * This keeps Supervisor/QMP logic aligned with RN snapshot logic.
 */
const buildFourPsFromFlags = (flags: Flag[]): FourPsSnapshot => {
  const open = (flags || []).filter((f) => f.status === "Open");
  const hasHighCrit = open.some(
    (f) => f.severity === "High" || f.severity === "Critical"
  );
  const hasSdoh = open.some(
    (f) => (f.type || "").toLowerCase().includes("sdoh")
  );
  const hasPsych = open.some(
    (f) => (f.type || "").toLowerCase().includes("psych")
  );
  const hasWork = open.some(
    (f) => (f.type || "").toLowerCase().includes("work")
  );
  const hasSupport = open.some(
    (f) => (f.type || "").toLowerCase().includes("support")
  );

  return {
    physical: {
      painScore: undefined,
      uncontrolledChronicCondition: false,
    },
    psychological: {
      positiveDepressionAnxiety: hasPsych,
      highStress: false,
    },
    psychosocial: {
      hasSdohBarrier: hasSdoh,
      limitedSupport: hasSupport,
    },
    professional: {
      unableToWork: hasWork,
      accommodationsNeeded: false,
    },
    anyHighRiskOrUncontrolled: hasHighCrit || hasSdoh || hasPsych || hasWork,
  };
};

const severityLabel = (level: 1 | 2 | 3 | 4): string => {
  switch (level) {
    case 1:
      return "Level 1 – Simple";
    case 2:
      return "Level 2 – Moderate";
    case 3:
      return "Level 3 – Complex";
    case 4:
    default:
      return "Level 4 – Severely Complex";
  }
};

const vitalityBadgeClass = (score: number): string => {
  if (score <= 3.9) return "bg-red-100 text-red-700 border-red-300";
  if (score <= 7.9) return "bg-amber-100 text-amber-700 border-amber-300";
  return "bg-green-100 text-green-700 border-green-300";
};

const ragBadgeClass = (rag: string): string => {
  switch (rag) {
    case "Red":
      return "bg-red-100 text-red-700 border-red-300";
    case "Amber":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "Green":
    default:
      return "bg-green-100 text-green-700 border-green-300";
  }
};

const workloadBadgeClass = (status: "Green" | "Amber" | "Red"): string => {
  switch (status) {
    case "Red":
      return "bg-red-100 text-red-700 border-red-300";
    case "Amber":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "Green":
    default:
      return "bg-green-100 text-green-700 border-green-300";
  }
};

const summarizeFlags = (flags: Flag[]) => {
  const open = flags.filter((f) => f.status === "Open");
  const bySeverity = {
    Critical: open.filter((f) => f.severity === "Critical").length,
    High: open.filter((f) => f.severity === "High").length,
    Moderate: open.filter((f) => f.severity === "Moderate").length,
    Low: open.filter((f) => f.severity === "Low").length,
  };
  const sdoh = open.filter((f) =>
    (f.type || "").toLowerCase().includes("sdoh")
  ).length;
  const support = open.filter((f) =>
    (f.type || "").toLowerCase().includes("support")
  ).length;

  return {
    openCount: open.length,
    bySeverity,
    sdoh,
    support,
    openFlags: open,
  };
};

const summarizeTasks = (tasks: Task[]) => {
  const open = tasks.filter((t) => t.status === "Open");
  const today = new Date().toISOString().slice(0, 10);
  const overdue = open.filter(
    (t) => t.due_date && t.due_date < today
  ).length;

  return {
    openCount: open.length,
    overdue,
  };
};

const isPriorityReview = (state: AppState): boolean => {
  const { client, flags, tasks } = state;
  const flagSummary = summarizeFlags(flags);
  const taskSummary = summarizeTasks(tasks);

  const highOrCritical =
    flagSummary.bySeverity.High + flagSummary.bySeverity.Critical > 0;

  const hasRiskAndDeclined = Boolean(
    client.cmDeclined && (flagSummary.sdoh > 0 || flagSummary.support > 0)
  );

  const today = new Date().toISOString().slice(0, 10);
  const followupOverdue = Boolean(
    client.nextFollowupDue && client.nextFollowupDue < today
  );

  const hasOverdueWork = followupOverdue || taskSummary.overdue > 0;

  return highOrCritical || hasRiskAndDeclined || hasOverdueWork;
};

const SupervisorAuditPanel: React.FC<SupervisorAuditPanelProps> = ({
  state,
}) => {
  const { client, flags, tasks } = state;

  const fourPs = buildFourPsFromFlags(flags);
  const tenVsEval = evaluateTenVs({
    appState: state,
    client,
    flags,
    tasks,
    fourPs,
  });

  // For now, assume a placeholder RN id.
  // In production, this will be the actual RN assigned to the case.
  const rnId = "rn-1";
  const rnWorkloadSummary = computeRnWorkload(
    [
      {
        rnId,
        severityLevel: tenVsEval.suggestedSeverity,
      },
    ],
    rnId,
    defaultWorkloadSettings
  );

  const flagSummary = summarizeFlags(flags);
  const taskSummary = summarizeTasks(tasks);
  const priorityReview = isPriorityReview(state);

  const handleExport = () => {
    exportCurrentAuditCSV(state);
  };

  return (
    <section className="bg-white border rounded-xl p-4 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold uppercase tracking-wide">
          Quick Audit View (Supervisor / QMP)
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="text-[11px] border rounded px-2 py-1"
        >
          Download Audit CSV
        </button>
      </div>

      {/* Priority Review Banner */}
      {priorityReview && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-800">
          <span className="font-semibold">Priority Review Required.</span>{" "}
          At least one of the following is true: high/critical clinical risk,
          unresolved SDOH/support barriers with client declining CM, or overdue
          follow-up/tasks.
        </div>
      )}

      {/* 10-Vs Snapshot */}
      <div className="grid gap-3 md:grid-cols-2 mb-3">
        <div className="border rounded p-2">
          <div className="text-[11px] font-semibold mb-1">
            Viability / Severity / Vitality
          </div>
          <div className="text-[11px] space-y-1">
            {client.viabilityScore !== undefined && (
              <div>
                <span className="font-semibold">Viability:</span>{" "}
                {client.viabilityScore}{" "}
                <span className="text-slate-500">
                  ({client.viabilityStatus || "N/A"})
                </span>
              </div>
            )}
            <div>
              <span className="font-semibold">Severity Level:</span>{" "}
              {severityLabel(tenVsEval.suggestedSeverity)}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${vitalityBadgeClass(
                  tenVsEval.vitalityScore
                )}`}
              >
                <span className="font-semibold">Vitality:</span>
                <span>{tenVsEval.vitalityScore.toFixed(1)}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${ragBadgeClass(
                  tenVsEval.ragStatus
                )}`}
              >
                <span className="font-semibold">RAG:</span>
                <span>{tenVsEval.ragStatus}</span>
              </span>
            </div>
          </div>
        </div>

        {/* RN Workload View for Supervisors / Directors */}
        <div className="border rounded p-2">
          <div className="text-[11px] font-semibold mb-1">
            RN CM Workload (Director-Defined Limits)
          </div>
          <div className="text-[11px] space-y-1">
            <div>
              <span className="font-semibold">Case Complexity Points:</span>{" "}
              {rnWorkloadSummary.totalPoints} / {rnWorkloadSummary.maxPoints}{" "}
              <span className="text-slate-500">
                ({rnWorkloadSummary.utilizationPercent}% of limit)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${workloadBadgeClass(
                  rnWorkloadSummary.status
                )}`}
              >
                <span className="font-semibold">Status:</span>
                <span>{rnWorkloadSummary.status}</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Max RN complexity points are defined at the Director level and
              should be aligned with QMP staffing standards.
            </div>
          </div>
        </div>
      </div>

      {/* Flags & Tasks Summary */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="border rounded p-2">
          <div className="text-[11px] font-semibold mb-1">
            Open Clinical / SDOH Flags
          </div>
          <div className="text-[11px] space-y-1">
            <div>
              <span className="font-semibold">Total Open:</span>{" "}
              {flagSummary.openCount}
            </div>
            <div>
              <span className="font-semibold">By Severity:</span>{" "}
              Critical {flagSummary.bySeverity.Critical} · High{" "}
              {flagSummary.bySeverity.High} · Moderate{" "}
              {flagSummary.bySeverity.Moderate} · Low{" "}
              {flagSummary.bySeverity.Low}
            </div>
            <div>
              <span className="font-semibold">SDOH Flags:</span>{" "}
              {flagSummary.sdoh}
            </div>
            <div>
              <span className="font-semibold">Support Flags:</span>{" "}
              {flagSummary.support}
            </div>
          </div>
        </div>

        <div className="border rounded p-2">
          <div className="text-[11px] font-semibold mb-1">
            RN CM Tasks & Follow-Up
          </div>
          <div className="text-[11px] space-y-1">
            <div>
              <span className="font-semibold">Open Tasks:</span>{" "}
              {taskSummary.openCount}
            </div>
            <div>
              <span className="font-semibold">Overdue Tasks:</span>{" "}
              {taskSummary.overdue}
            </div>
            <div>
              <span className="font-semibold">Next 30-Day Follow-Up Due:</span>{" "}
              {client.nextFollowupDue || "Not set"}
            </div>
            <div>
              <span className="font-semibold">Client Declined CM:</span>{" "}
              {client.cmDeclined ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SupervisorAuditPanel;
