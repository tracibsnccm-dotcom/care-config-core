// src/components/rn/RnViabilitySummary.tsx
// Simple RN viability snapshot based on 10-V scores

import React from "react";
import type { TenVId } from "./TenVsAssessment";

type Props = {
  scores: Partial<Record<TenVId, number>>;
};

const V_LABELS: Record<TenVId, string> = {
  voice_view: "V1 – Voice / View",
  viability: "V2 – Viability",
  vision: "V3 – Vision",
  veracity: "V4 – Veracity",
  versatility: "V5 – Versatility",
  vitality: "V6 – Vitality",
  vigilance: "V7 – Vigilance",
  verification: "V8 – Verification",
  value: "V9 – Value",
  validation: "V10 – Validation",
};

function classifyViability(avg: number | null) {
  if (avg == null) return { label: "Not scored yet", color: "text-slate-500" };
  if (avg >= 4.0)
    return {
      label: "High Viability / Strong Recovery Momentum",
      color: "text-emerald-700",
    };
  if (avg >= 3.0)
    return {
      label: "Moderate Viability / Watch Key Domains",
      color: "text-amber-700",
    };
  return {
    label: "Low Viability / High Risk – Requires RN Focus",
    color: "text-rose-700",
  };
}

const RnViabilitySummary: React.FC<Props> = ({ scores }) => {
  const entries = (Object.keys(scores) as TenVId[])
    .map((id) => ({ id, value: scores[id] }))
    .filter((x): x is { id: TenVId; value: number } => typeof x.value === "number");

  const avg =
    entries.length > 0
      ? entries.reduce((sum, x) => sum + x.value, 0) / entries.length
      : null;

  const classification = classifyViability(avg);

  // Find up to 3 lowest V domains to highlight
  const lowest = [...entries]
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);

  return (
    <div className="mt-4 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-900 mb-1">
        RN Case Viability Snapshot (10-Vs)
      </h2>
      <p className="text-[11px] text-slate-600 mb-2">
        This snapshot summarizes the 10-V scoring into a quick RN viability view
        for the case. It&apos;s not a legal opinion — it&apos;s your clinical
        lens on how viable this case is for recovery and stabilization with
        appropriate support.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wide">
            Overall 10-V average
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-semibold text-slate-900">
              {avg != null ? avg.toFixed(1) : "—"}
            </div>
            <div className={"text-[11px] font-medium " + classification.color}>
              {classification.label}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            1 = very poor / high risk • 5 = very strong / low risk.
          </div>
        </div>

        <div className="sm:text-right">
          <div className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">
            Lowest-scoring V domains
          </div>
          {lowest.length === 0 ? (
            <div className="text-[11px] text-slate-500">
              No V domains scored yet.
            </div>
          ) : (
            <ul className="text-[11px] text-slate-700 space-y-1">
              {lowest.map((x) => (
                <li key={x.id}>
                  <span className="font-medium">{V_LABELS[x.id]}:</span>{" "}
                  score {x.value.toFixed(1)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-slate-500">
        Documentation tip: Your narrative and plan should explain{" "}
        <span className="font-semibold">why</span> the lowest V domains are
        scoring where they are, and what interventions you are putting in place
        to address them.
      </p>
    </div>
  );
};

export default RnViabilitySummary;
