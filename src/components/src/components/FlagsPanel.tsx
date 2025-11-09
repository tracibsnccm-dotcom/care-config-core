// src/components/FlagsPanel.tsx

import React from "react";
import { Flag } from "../lib/models";

interface FlagsPanelProps {
  flags: Flag[];
}

/**
 * Reconcile C.A.R.E.™ Flags Panel
 *
 * Surfaces active risk, support, and quality flags to guide RN CM vigilance.
 * This is where Vigilance + Viability + Verification become visible.
 */
const FlagsPanel: React.FC<FlagsPanelProps> = ({ flags }) => {
  const openFlags = flags.filter((f) => f.status === "Open");

  if (openFlags.length === 0) {
    return (
      <section className="bg-white border rounded-xl p-3 shadow-sm mb-4">
        <div className="text-xs font-semibold text-slate-700">
          Active Flags &amp; Alerts
        </div>
        <div className="text-xs text-slate-500 mt-1">
          No active risk or support flags at this time.
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border rounded-xl p-3 shadow-sm mb-4">
      <div className="text-xs font-semibold text-slate-700 mb-1">
        Active Flags &amp; Alerts
      </div>
      <div className="text-[10px] text-slate-500 mb-2">
        These are system and clinician prompts aligned with your V-framework:
        SDOH risk, viability concerns, support needs, and follow-up priorities.
      </div>
      <ul className="space-y-1">
        {openFlags.map((flag) => (
          <li
            key={flag.id}
            className={
              "text-xs px-2 py-1 rounded border flex items-start gap-2 " +
              flagSeverityClass(flag.severity)
            }
          >
            <span className="mt-[2px]">•</span>
            <div>
              <div className="font-semibold">
                {flag.label}
              </div>
              <div className="text-[10px] text-slate-600">
                Type: {flag.type} &nbsp;|&nbsp; Severity: {flag.severity}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

function flagSeverityClass(severity: Flag["severity"]): string {
  switch (severity) {
    case "Critical":
      return "border-red-500 bg-red-50 text-red-700";
    case "High":
      return "border-orange-400 bg-orange-50 text-orange-700";
    case "Moderate":
      return "border-amber-300 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default FlagsPanel;
