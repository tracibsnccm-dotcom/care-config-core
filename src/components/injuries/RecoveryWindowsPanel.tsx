// src/components/injuries/RecoveryWindowsPanel.tsx
import React from "react";
import { AppState } from "../../lib/models";
import { estimateAllRecoveryWindows } from "../../lib/odg";

type Props = {
  state: AppState;
};

function fmtRange(d: { min: number; max: number }) {
  return d.min === d.max ? `${d.min} days` : `${d.min}–${d.max} days`;
}

function fmtDelta(d: { min: number; max: number }) {
  const signMin = d.min > 0 ? "+" : "";
  const signMax = d.max > 0 ? "+" : "";
  if (d.min === d.max) return `${signMin}${d.min} days`;
  return `${signMin}${d.min}–${signMax}${d.max} days`;
}

function deltaTone(d: { min: number; max: number }) {
  // Positive = longer than baseline → warn; Negative = better than baseline → success
  if (d.max > 0) return "bg-amber-100 text-amber-800 border-amber-300";
  if (d.min < 0 && d.max <= 0) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  return "bg-slate-100 text-slate-700 border-slate-300";
}

const RecoveryWindowsPanel: React.FC<Props> = ({ state }) => {
  const windows = estimateAllRecoveryWindows(state);

  return (
    <section className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Expected Recovery Window (ODG/MCG-style)</h3>
        <span className="text-[10px] text-slate-500">
          Generated: {new Date().toLocaleString()}
        </span>
      </div>

      {(!windows || windows.length === 0) && (
        <p className="text-xs text-slate-600">
          No injuries recorded yet or not enough information to estimate.
        </p>
      )}

      <div className="space-y-3">
        {windows.map((w, idx) => (
          <div key={`${w.conditionKey}-${idx}`} className="border rounded-lg p-3 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{w.description}</div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {w.source}
              </span>
            </div>

            {/* Ranges */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs mt-2">
              <div className="bg-white border rounded p-2">
                <div className="font-semibold">Baseline</div>
                <div>{fmtRange(w.baselineDays)}</div>
              </div>

              <div className="bg-white border rounded p-2">
                <div className="font-semibold">Adjusted</div>
                <div>{fmtRange(w.totalDays)}</div>
              </div>

              {/* NEW: Live Difference Calculator */}
              <div className={`border rounded p-2 ${deltaTone(w.deltaDays)}`}>
                <div className="font-semibold">Δ vs Baseline</div>
                <div className="font-mono">{fmtDelta(w.deltaDays)}</div>
                <div className="text-[10px]">
                  {w.deltaDays.max > 0
                    ? "Longer than baseline"
                    : w.deltaDays.min < 0 && w.deltaDays.max <= 0
                    ? "Shorter than baseline"
                    : "Same as baseline"}
                </div>
              </div>

              <div className="bg-white border rounded p-2">
                <div className="font-semibold">Assumptions</div>
                {w.assumptions && w.assumptions.length > 0 ? (
                  <ul className="list-disc pl-4">
                    {w.assumptions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-500">None listed</div>
                )}
              </div>
            </div>

            {/* Modifiers */}
            <div className="mt-2">
              <div className="text-xs font-semibold mb-1">Adjustments</div>
              {w.modifiers && w.modifiers.length > 0 ? (
                <ul className="text-xs list-disc pl-5">
                  {w.modifiers.map((m, i) => (
                    <li key={i}>
                      <span className="font-semibold">{m.name}:</span>{" "}
                      {m.effectDays >= 0 ? "+" : ""}
                      {m.effectDays}d — {m.rationale}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-600">(No risk/comorbidity adjustments)</div>
              )}
            </div>

            {w.notes && <div className="mt-2 text-[11px] text-slate-600">{w.notes}</div>}
          </div>
        ))}
      </div>

      <div className="text-[10px] text-slate-500 mt-3">
        Estimates are curated guidance for planning/communication. Actual recovery depends on clinical response.
        Post-op time is only appended once surgery occurs.
      </div>
    </section>
  );
};

export default RecoveryWindowsPanel;
