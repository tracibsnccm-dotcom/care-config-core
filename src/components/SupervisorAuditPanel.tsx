// src/components/SupervisorAuditPanel.tsx

import React from "react";
import { AppState, Flag, Task } from "../lib/models";
import { exportCurrentAuditCSV } from "../lib/export";

interface SupervisorAuditPanelProps {
  state: AppState;
}

/**
 * Reconcile C.A.R.E.™ Quick Audit View
 *
 * For Supervisors / QMP:
 * - Snapshot of risk, follow-up, and documentation behavior.
 * - Highlights Priority Review candidates (no favoritism, clear rules).
 */
const SupervisorAuditPanel: React.FC<SupervisorAuditPanelProps> = ({
  state,
}) => {
  const { client, flags, tasks } = state;

  const openFlags = flags.filter((f) => f.status === "Open");
  const highOrCritical = openFlags.filter(
    (f) => f.severity === "High" || f.severity === "Critical"
  );

  const sdohFlags = openFlags.filter((f) =>
    (f.type || "").toLowerCase().includes("sdoh")
  );
  const supportFlags = openFlags.filter((f) =>
    (f.type || "").toLowerCase().includes("support")
  );

  const today = new Date().toISOString().slice(0, 10);
  const openTasks = tasks.filter((t) => t.status === "Open");
  const overdueTasks = openTasks.filter(
    (t) => t.due_date && t.due_date < today
  );

  const followupOverdue =
    client.nextFollowupDue !== undefined &&
    client.nextFollowupDue < today;

  // --- Priority Review Logic ---

  const isHighRiskCase = highOrCritical.length > 0;
  const hasRiskAndDeclined =
    client.cmDeclined && (sdohFlags.length > 0 || supportFlags.length > 0);
  const hasOverdueWork = followupOverdue || overdueTasks.length > 0;

  // Deterministic pseudo-random: ensures some "clean" cases are still chosen
  const randomBucket = pseudoRandomFromId(client.id);
  const isRandomPick =
    !isHighRiskCase && !hasRiskAndDeclined && !hasOverdueWork && randomBucket < 0.15; // ~15%

  const isPriorityReview =
    isHighRiskCase || hasRiskAndDeclined || hasOverdueWork || isRandomPick;

  return (
    <section className="bg-slate-900 text-slate-50 rounded-xl p-4 mt-4">
      {/* Header + Export Button */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold uppercase tracking-wide">
          Quick Audit View (Supervisor / QMP)
        </div>
        <button
          type="button"
          onClick={() => exportCurrentAuditCSV(state)}
          className="text-[10px] px-2 py-1 border rounded bg-white/10 hover:bg-white/20"
          title="Download a one-line CSV summary for this case"
        >
          Download Audit CSV
        </button>
      </div>

      {/* Priority Review Banner */}
      <div
        className={
          "mb-3 px-3 py-2 rounded text-[10px] " +
          (isPriorityReview
            ? "bg-red-700/30 border border-red-400 text-red-100"
            : "bg-emerald-800/30 border border-emerald-500 text-emerald-100")
        }
      >
        {isPriorityReview ? (
          <>
            <div className="font-semibold">Priority Review Candidate</div>
            <div>
              This case is selected for focused supervisor/QMP review based on
              risk, timeliness, client decisions, or random audit sampling.
            </div>
          </>
        ) : (
          <>
            <div className="font-semibold">Standard Review</div>
            <div>
              No urgent audit triggers. Case remains eligible for routine
              random sampling.
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-[10px]">
        {/* Viability Snapshot */}
        <div>
          <div className="font-semibold text-slate-200 mb-1">
            Viability &amp; Engagement
          </div>
          <div>
            Viability Score:{" "}
            <span className="font-semibold">
              {client.viabilityScore ?? "N/A"}
            </span>
          </div>
          <div>
            Status:{" "}
            <span className="font-semibold">
              {client.viabilityStatus || "Not set"}
            </span>
          </div>
          <div className="text-slate-400 mt-1">
            Check alignment with 4Ps, SDOH, Voice/View, and V-framework.
          </div>
        </div>

        {/* Flag Summary */}
        <div>
          <div className="font-semibold text-slate-200 mb-1">
            Active Flags Summary
          </div>
          <div>Total Open Flags: {openFlags.length}</div>
          <div>
            High/Critical:{" "}
            <span className={highOrCritical.length ? "text-red-300" : ""}>
              {highOrCritical.length}
            </span>
          </div>
          <div>SDOH-related: {sdohFlags.length}</div>
          <div>Support/Viability: {supportFlags.length}</div>
          <div className="text-slate-400 mt-1">
            Expect RN CM notes for High/Critical & structured interventions.
          </div>
        </div>

        {/* Follow-Up / Timeliness */}
        <div>
          <div className="font-semibold text-slate-200 mb-1">
            Follow-Up Timeliness
          </div>
          <div>Last Follow-Up: {client.lastFollowupDate || "N/A"}</div>
          <div>Next Due: {client.nextFollowupDue || "Not scheduled"}</div>
          <div>
            Overdue Tasks:{" "}
            <span className={overdueTasks.length ? "text-red-300" : ""}>
              {overdueTasks.length}
            </span>
          </div>
          {followupOverdue && (
            <div className="text-red-300 mt-1">
              ⚠ Follow-up past due. Supervisor review strongly recommended.
            </div>
          )}
        </div>

        {/* Quality Prompts */}
        <div>
          <div className="font-semibold text-slate-200 mb-1">
            Quality Prompts
          </div>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              Confirm High/Critical flags have RN CM rationale &amp; actions.
            </li>
            <li>
              Verify follow-up cadence meets policy (e.g., 30-day minimum).
            </li>
            <li>
              Ensure client decisions on CM are documented &amp; revisited.
            </li>
            <li>
              For Priority Review: capture findings in QMP log.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

// Deterministic pseudo-random function based on client ID.
// This makes "random" audit selection stable and unbiased.
function pseudoRandomFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  // Convert hash to 0–1
  return Math.abs(hash % 1000) / 1000;
}

export default SupervisorAuditPanel;

