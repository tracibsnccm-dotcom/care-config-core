// src/components/SupervisorAuditPanel.tsx

import React from "react";
import { AppState, Flag, Task } from "../lib/models";
import { evaluateTenVs, FourPsSnapshot } from "../lib/vEngine";
import { exportCurrentAuditCSV } from "../lib/export";

/**
 * SupervisorAuditPanel
 *
 * Quick Audit View for Supervisors / QMP:
 * - Shows Viability Score + Status
 * - Severity Level (L1–L4) from 10-Vs engine
 * - Vitality Score (1–10) + RAG status
 * - Summary of open flags and tasks (including SDOH/support)
 * - Priority Review badge (high-risk, overdue, or random audit)
 * - Download Audit CSV for external/QMP review
 */

// Helpers mirrored from export logic so the signals stay consistent
const todayISO = (): string => new Date().toISOString().slice(0, 10);

function summarizeFlags(flags: Flag) {
  const open = (flags || []).filter((f) => f.status === "Open");
  const bySeverity = {
    Critical: open.filter((f) => f.severity === "Critical").length,
    High: open.filter((f) => f.severity === "High").length,
    Moderate: open.filter((f) => f.severity === "Moderate").length,
    Low: open.filter((f) => f.severity === "Low").length,
  };
  const sdoh = open.filter((f) => (f.type || "").toLowerCase().includes("sdoh")).length;
  const support = open.filter((f) => (f.type || "").toLowerCase().includes("support")).length;
  return { openCount: open.length, bySeverity, sdoh, support, openFlags: open };
}

function summarizeTasks(tasks: Task[]) {
  const open = (tasks || []).filter((t) => t.status === "Open");
  const today = todayISO();
  const overdue = open.filter((t) => t.due_date && t.due_date < today).length;
  return { openCount: open.length, overdue };
}

// Basic 4Ps snapshot from flags only (for supervisor view)
// NOTE: Intake/Follow-Up will pass richer 4Ps later; this keeps the
// supervisor panel in sync in the meantime.
const buildFourPsFromStateForAudit = (flags: Flag[]): FourPsSnapshot => {
  const openHighCrit = (flags || []).some(
    (f) => f.status === "Open" && (f.severity === "High" || f.severity === "Critical")
  );
  const sdohBarrier = (flags || []).some(
    (f) =>
      f.status === "Open" &&
      (f.type || "").toLowerCase().includes("sdoh")
  );
  return {
    physical: {
      painScore: undefined,
      uncontrolledChronicCondition: false,
    },
    psychological: {
      positiveDepressionAnxiety: false,
      highStress: false,
    },
    psychosocial: {
      hasSdohBarrier: sdohBarrier,
      limitedSupport: false,
    },
    professional: {
      unableToWork: false,
      accommodationsNeeded: false,
    },
    anyHighRiskOrUncontrolled: openHighCrit || sdohBarrier,
  };
};

function isPriorityReview(state: AppState): boolean {
  const { client, flags, tasks } = state;
  const flagSummary = summarizeFlags(flags as any);
  const taskSummary = summarizeTasks(tasks);

  const highOrCritical =
    flagSummary.bySeverity.High + flagSummary.bySeverity.Critical > 0;

  const hasRiskAndDeclined = Boolean(
    client.cmDeclined && (flagSummary.sdoh > 0 || flagSummary.support > 0)
  );

  const followupOverdue = Boolean(
    client.nextFollowupDue && client.nextFollowupDue < todayISO()
  );

  const hasOverdueWork = followupOverdue || taskSummary.overdue > 0;

  // Simple deterministic "random pick" for routine QC when risk is low
  let hash = 0;
  for (let i = 0; i < client.id.length; i++) {
    hash = (hash * 31 + client.id.charCodeAt(i)) | 0;
  }
  const randomPick =
    !highOrCritical &&
    !hasRiskAndDeclined &&
    !hasOverdueWork &&
    Math.abs(hash % 1000) / 1000 < 0.15;

  return highOrCritical || hasRiskAndDeclined || hasOverdueWork || randomPick;
}

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

interface SupervisorAuditPanelProps {
  state: AppState;
}

const SupervisorAuditPanel: React.FC<SupervisorAuditPanelProps> = ({ state }) => {
  const { client, flags, tasks } = state;
  const flagSummary = summarizeFlags(flags as any);
  const taskSummary = summarizeTasks(tasks);
  const priorityReview = isPriorityReview(state);

  const fourPs = buildFourPsFromStateForAudit(flags as any);
  const tenVsEval = evaluateTenVs({
    appState: state,
    client,
    flags,
    tasks,
    fourPs,
  });

  return (
    <section className="mt-4 bg-white border rounded-xl p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide mb-2">
        Quick Audit View (Supervisor / QMP)
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-xs">
          <div>
            <span className="font-semibold">Client:</span> {client.name}
          </div>
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
        </div>

        <div className="flex flex-col items-end gap-1 text-xs">
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${vitalityBadgeClass(
              tenVsEval.vitalityScore
            )}`}
          >
            <span className="font-semibold">Vitality:</span>
            <span>{tenVsEval.vitalityScore.toFixed(1)}</span>
          </div>
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${ragBadgeClass(
              tenVsEval.ragStatus
            )}`}
          >
            <span className="font-semibold">RAG:</span>
            <span>{tenVsEval.ragStatus}</span>
          </div>
          {priorityReview && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-purple-100 text-purple-700 border-purple-300 text-[11px]">
              Priority Review
            </div>
          )}
        </div>
      </div>

      {/* Flags & Tasks Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
        <div className="border rounded p-2 bg-slate-50">
          <div className="font-semibold mb-1">Open Flags</div>
          <div>Total: {flagSummary.openCount}</div>
          <div className="text-[11px] mt-1">
            Critical: {flagSummary.bySeverity.Critical} &nbsp;|&nbsp; High:{" "}
            {flagSummary.bySeverity.High}
            <br />
            Moderate: {flagSummary.bySeverity.Moderate} &nbsp;|&nbsp; Low:{" "}
            {flagSummary.bySeverity.Low}
            <br />
            SDOH-related: {flagSummary.sdoh} &nbsp;|&nbsp; Support-related:{" "}
            {flagSummary.support}
          </div>
        </div>
        <div className="border rounded p-2 bg-slate-50">
          <div className="font-semibold mb-1">Tasks & Timelines</div>
          <div>Total Open Tasks: {taskSummary.openCount}</div>
          <div>Overdue Tasks: {taskSummary.overdue}</div>
          <div className="text-[11px] mt-1">
            Last Follow-Up: {client.lastFollowupDate || "N/A"}
            <br />
            Next Follow-Up Due: {client.nextFollowupDue || "N/A"}
          </div>
        </div>
      </div>

      {/* Triggered Vs Overview */}
      <div className="border rounded p-2 bg-slate-50 text-xs mb-3">
        <div className="font-semibold mb-1">Triggered V-Domains (10-Vs)</div>
        {tenVsEval.triggeredVs.length === 0 ? (
          <div className="text-[11px] text-slate-500">
            No active V-domain triggers based on current data.
          </div>
        ) : (
          <ul className="list-disc pl-5 text-[11px]">
            {tenVsEval.triggeredVs.map((v) => (
              <li key={v.vCode}>
                <span className="font-semibold">{v.label}:</span>{" "}
                {v.reasonSummary}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Required Actions Overview */}
      <div className="border rounded p-2 bg-amber-50 text-xs mb-3">
        <div className="font-semibold mb-1">
          Required V-Domain Actions (for RN CM)
        </div>
        {tenVsEval.requiredActions.length === 0 ? (
          <div className="text-[11px] text-slate-600">
            No outstanding required actions from the 10-Vs engine at this time.
          </div>
        ) : (
          <ul className="list-disc pl-5 text-[11px]">
            {tenVsEval.requiredActions.map((a) => (
              <li key={a.vCode}>
                <span className="font-semibold">{a.label}:</span>{" "}
                {a.reasonSummary}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => exportCurrentAuditCSV(state)}
          className="px-3 py-1 border rounded text-xs hover:bg-slate-50"
        >
          Download Audit CSV
        </button>
      </div>
    </section>
  );
};

export default SupervisorAuditPanel;

