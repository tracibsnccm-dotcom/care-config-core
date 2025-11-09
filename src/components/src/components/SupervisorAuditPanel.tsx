// src/components/SupervisorAuditPanel.tsx

import React from "react";
import { AppState, Flag, Task } from "../lib/models";

interface SupervisorAuditPanelProps {
  state: AppState;
}

/**
 * Reconcile C.A.R.E.™ Quick Audit View
 *
 * For Supervisors / QMP:
 * - Fast snapshot of risk, follow-up, and documentation behavior.
 * - Supports URAC-style quality monitoring and internal standards.
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

  const hasFollowupPlanned = !!client.nextFollowupDue;
  const followupOverdue =
    client.nextFollowupDue !== undefined &&
    client.nextFollowupDue < today;

  return (
    <section className="bg-slate-900 text-slate-50 rounded-xl p-4 mt-4">
      <div className="text-xs font-semibold uppercase tracking-wide mb-2">
        Quick Audit View (Supervisor / QMP)
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
            Check alignment with 4Ps, SDOH, and V-framework.
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
            Expect RN CM notes addressing High/Critical items.
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
              ⚠ Follow-up past due. Review required.
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
              Confirm High/Critical flags have clear RN CM rationale.
            </li>
            <li>
              Verify follow-up cadence matches policy (e.g., 30-day for
              active cases).
            </li>
            <li>
              Ensure client decisions (Accept/Decline CM) are documented
              & revisited appropriately.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SupervisorAuditPanel;
