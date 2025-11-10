// src/components/SupervisorAuditPanel.tsx

import React from "react";
import { AppState, InjuryInstance } from "../lib/models";
import { buildCaseSummaryForExport } from "../lib/exportHelpers";
import { isVarianceFromGuideline } from "../lib/necessityDriver";

interface SupervisorAuditPanelProps {
  state: AppState;
}

/**
 * Reconcile C.A.R.E.™ Quick Audit View
 *
 * For Supervisors / QMP:
 * - Snapshot of risk, follow-up, and documentation behavior.
 * - Highlights Priority Review candidates (no favoritism, clear rules).
 * - Includes soft ODG-style variance prompts (documentation only, never denial).
 */
const SupervisorAuditPanel: React.FC<SupervisorAuditPanelProps> = ({
  state,
}) => {
  const { client, flags, tasks, injuries = [] } = state;

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

  const hasFollowupPlanned = !!client.nextFollowupDue;
  const followupOverdue =
    !!client.nextFollowupDue && client.nextFollowupDue < today;

  // --- Soft guideline variance detection (documentation only) ---

  const varianceInjuries: InjuryInstance[] = injuries.filter((inj) => {
    if (typeof inj.weeksSinceInjury !== "number") return false;
    return isVarianceFromGuideline(inj, inj.weeksSinceInjury);
  });

  const hasGuidelineVariance = varianceInjuries.length > 0;

  // --- Priority Review Logic ---

  const isHighRiskCase = highOrCritical.length > 0;
  const hasRiskAndDeclined =
    !!client.cmDeclined && (sdohFlags.length > 0 || supportFlags.length > 0);
  const hasOverdueWork = followupOverdue || overdueTasks.length > 0;

  // Deterministic pseudo-random: ensures some “clean” cases are still chosen.
  const randomBucket = pseudoRandomFromId(client.id || "anon");
  const isRandomPick =
    !isHighRiskCase &&
    !hasRiskAndDeclined &&
    !hasOverdueWork &&
    !hasGuidelineVariance &&
    randomBucket < 0.15; // ~15%

  const isPriorityReview =
    isHighRiskCase ||
    hasRiskAndDeclined ||
    hasOverdueWork ||
    hasGuidelineVariance ||
    isRandomPick;

  // Build an export-ready snapshot (for devs / integrations).
  const exportSummary = buildCaseSummaryForExport(state);
  // console.log("[RCMS_EXPORT_PREVIEW]", exportSummary);

  return (
    <section className="bg-slate-900 text-slate-50 rounded-xl p-4 mt-4">
      <div className="text-xs font-semibold uppercase tracking-wide mb-2">
        Quick Audit View (Supervisor / QMP)
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
            <div className="font-semibold">
              Priority Review Candidate
            </div>
            <div>
              This case is selected for focused supervisor/QMP review based on
              defined criteria (risk, timeliness, documented complexity, or
              structured random sampling). Selection is rules-based to avoid
              favoritism or bias.
            </div>
          </>
        ) : (
          <>
            <div className="font-semibold">
              Standard Review
            </div>
            <div>
              No urgent audit triggers detected. Case remains eligible for
              routine sampling per QMP policy.
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
            Confirm consistency between Viability Index, 4Ps, SDOH, and
            Voice/View. Outliers should have a clear RN CM rationale.
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
            Expect RN CM documentation and concrete actions for High/Critical
            and SDOH-linked items.
          </div>
        </div>

        {/* Follow-Up / Timeliness */}
        <div>
          <div className="font-semibold text-slate-200 mb-1">
            Follow-Up Timeliness
          </div>
          <div>Last Follow-Up: {client.lastFollowupDate || "N/A"} </div>
          <div>Next Due: {client.nextFollowupDue || "Not scheduled"}</div>
          <div>
            Overdue Tasks:{" "}
            <span className={overdueTasks.length ? "text-red-300" : ""}>
              {overdueTasks.length}
            </span>
          </div>
          {followupOverdue && (
            <div className="text-red-300 mt-1">
              ⚠ Follow-up past due. Supervisor/QMP review recommended.
            </div>
          )}
        </div>

        {/* Quality Prompts & Variance */}
        <div>
          <div className="font-semibold text-slate-200 mb-1">
            Quality Prompts
          </div>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              Confirm High/Critical flags have RN CM rationale and linked plan
              items.
            </li>
            <li>
              Verify follow-up cadence meets policy (e.g., minimum every 30
              days while case is active).
            </li>
            <li>
              Ensure client decisions (accept/decline CM) are revisited and
              respected, especially when SDOH needs are flagged.
            </li>
            {hasGuidelineVariance && (
              <li className="text-amber-200">
                One or more injuries appear beyond illustrative guideline
                windows. Confirm the RN CM documented clinical justification
                (complexity, comorbidities, access barriers). Used for
                advocacy—not to reduce care.
              </li>
            )}
            <li>
              For Priority Review cases, document findings in the QMP log
              (no retroactive score manipulation without clear rationale).
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

// Deterministic pseudo-random function based on client ID.
// Ensures "random" audit selection remains stable and unbiased.
function pseudoRandomFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 1000) / 1000; // 0–1
}

export default SupervisorAuditPanel;



