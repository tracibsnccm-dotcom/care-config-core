// src/pages/rn/Rn10VsPage.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type VKey =
  | "value"
  | "visibility"
  | "variability"
  | "velocity"
  | "volume"
  | "verification"
  | "viability"
  | "vulnerability"
  | "voice"
  | "visit";

interface VState {
  label: string;
  severity: number;
  note: string;
}

const makeInitial = (): Record<VKey, VState> => ({
  value: { label: "Value / Damages", severity: 0, note: "" },
  visibility: { label: "Visibility / Documentation", severity: 0, note: "" },
  variability: { label: "Variability / Stability", severity: 0, note: "" },
  velocity: { label: "Velocity / Trajectory", severity: 0, note: "" },
  volume: { label: "Volume / Complexity", severity: 0, note: "" },
  verification: { label: "Verification / Evidence", severity: 0, note: "" },
  viability: { label: "Case Viability", severity: 0, note: "" },
  vulnerability: { label: "Client Vulnerability", severity: 0, note: "" },
  voice: { label: "Client Voice / Goals", severity: 0, note: "" },
  visit: { label: "Visit Logistics / Access", severity: 0, note: "" },
});

const Rn10VsPage: React.FC = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [vs, setVs] = useState<Record<VKey, VState>>(makeInitial);

  const keys: VKey[] = [
    "value",
    "visibility",
    "variability",
    "velocity",
    "volume",
    "verification",
    "viability",
    "vulnerability",
    "voice",
    "visit",
  ];

  const compositeScore =
    keys.reduce((sum, key) => sum + vs[key].severity, 0) / keys.length;

  const handleSeverityChange = (key: VKey, value: number) => {
    setVs((prev) => ({
      ...prev,
      [key]: { ...prev[key], severity: value },
    }));
  };

  const handleNoteChange = (key: VKey, value: string) => {
    setVs((prev) => ({
      ...prev,
      [key]: { ...prev[key], note: value },
    }));
  };

  const handleSave = () => {
    console.log("10-Vs assessment submitted", {
      caseId,
      data: vs,
      compositeScore,
    });
    alert(
      `10-Vs assessment captured for Case ${caseId || "N/A"}.\n\nDraft composite: ${compositeScore.toFixed(
        1
      )}`
    );
  };

  const handleBackToDashboard = () => {
    navigate("/rn-dashboard");
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <button
        type="button"
        onClick={handleBackToDashboard}
        className="text-xs text-slate-600 mb-4 hover:underline"
      >
        ← Back to RN Dashboard
      </button>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          10-V Clinical Logic Engine — Pilot
        </h1>
        <p className="text-sm text-slate-700 mt-1">
          Case:{" "}
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
            {caseId || "Unknown Case ID"}
          </span>
        </p>
        <p className="mt-2 text-xs text-slate-600 max-w-3xl">
          This draft screen lets you score each of the{" "}
          <strong>10-V dimensions</strong> and capture reasoning. Later, these
          scores will feed a structured <strong>Case Viability Score</strong> for
          your attorneys, while preserving your nursing narrative.
        </p>
      </header>

      <section className="mb-4">
        <div className="inline-flex items-baseline gap-3 rounded-md bg-slate-50 border border-slate-200 px-4 py-3">
          <span className="text-xs font-semibold text-slate-700">
            Draft Composite Case Signal:
          </span>
          <span className="text-xl font-bold text-slate-900">
            {compositeScore.toFixed(1)}
          </span>
          <span className="text-[11px] text-slate-500">
            (0 = lower concern, 10 = high-concern / complex)
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {keys.map((key) => {
          const v = vs[key];
          return (
            <div
              key={key}
              className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-slate-900 mb-1">
                {v.label}
              </h2>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Intensity / Concern (0–10)
              </label>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={v.severity}
                  onChange={(e) =>
                    handleSeverityChange(key, Number(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="w-8 text-xs text-right font-medium text-slate-800">
                  {v.severity}
                </span>
              </div>

              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Clinical Reasoning
              </label>
              <textarea
                value={v.note}
                onChange={(e) => handleNoteChange(key, e.target.value)}
                rows={4}
                placeholder={`Why did you score ${v.label.toLowerCase()} at this level?`}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-slate-900/70 focus:border-slate-900 resize-vertical"
              />
            </div>
          );
        })}
      </section>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800"
        >
          Save 10-Vs Assessment (Pilot)
        </button>
      </div>
    </div>
  );
};

export default Rn10VsPage;