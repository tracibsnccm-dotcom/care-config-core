// src/pages/rn/Rn4PsPage.tsx
import React, { useState } from "react";

type PKey = "physical" | "psychological" | "psychosocial" | "professional";

interface PState {
  label: string;
  severity: number;
  notes: string;
}

const initialState: Record<PKey, PState> = {
  physical: {
    label: "Physical",
    severity: 0,
    notes: "",
  },
  psychological: {
    label: "Psychological",
    severity: 0,
    notes: "",
  },
  psychosocial: {
    label: "Psychosocial",
    severity: 0,
    notes: "",
  },
  professional: {
    label: "Professional",
    severity: 0,
    notes: "",
  },
};

const Rn4PsPage: React.FC = () => {
  // Get caseId from localStorage or URL pathname (not using react-router params)
  const getCaseId = (): string | null => {
    if (typeof window === "undefined") return null;
    // Try to get from localStorage first
    const stored = window.localStorage.getItem("rcms_active_case_id");
    if (stored) return stored;
    // Fallback: try to parse from pathname if it contains caseId pattern
    const pathMatch = window.location.pathname.match(/\/case\/([^/]+)/);
    return pathMatch ? pathMatch[1] : null;
  };
  const caseId = getCaseId();
  const [ps, setPs] = useState<Record<PKey, PState>>(initialState);

  const overallScore =
    (ps.physical.severity +
      ps.psychological.severity +
      ps.psychosocial.severity +
      ps.professional.severity) / 4;

  const handleSeverityChange = (key: PKey, value: number) => {
    setPs((prev) => ({
      ...prev,
      [key]: { ...prev[key], severity: value },
    }));
  };

  const handleNotesChange = (key: PKey, value: string) => {
    setPs((prev) => ({
      ...prev,
      [key]: { ...prev[key], notes: value },
    }));
  };

  const handleSave = () => {
    // For now just log; later this will call Supabase RPC
    console.log("4Ps assessment submitted", {
      caseId,
      data: ps,
      overallScore,
    });
    alert(
      `4Ps assessment captured for Case ${caseId || "N/A"}.\n\nDraft score: ${overallScore.toFixed(
        1
      )}`
    );
  };

  const handleBackToDashboard = () => {
    window.history.pushState({}, "", "/rn/dashboard");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const cards: PKey[] = [
    "physical",
    "psychological",
    "psychosocial",
    "professional",
  ];

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
          4Ps of Wellness Assessment
        </h1>
        <p className="text-sm text-slate-700 mt-1">
          Case:{" "}
          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
            {caseId || "Unknown Case ID"}
          </span>
        </p>
        <p className="mt-2 text-xs text-slate-600 max-w-3xl">
          This screen is your structured lens for the{" "}
          <strong>4Ps of Wellness Holistic Insight Model™</strong>. Use your
          clinical judgment to rate each domain, then capture narrative notes
          that explain what is helping, what is harming, and what might change
          the trajectory of this case.
        </p>
      </header>

      <section className="mb-4">
        <div className="inline-flex items-baseline gap-3 rounded-md bg-slate-50 border border-slate-200 px-4 py-3">
          <span className="text-xs font-semibold text-slate-700">
            Draft 4Ps Intensity Index:
          </span>
          <span className="text-xl font-bold text-slate-900">
            {overallScore.toFixed(1)}
          </span>
          <span className="text-[11px] text-slate-500">
            (0 = minimal concern, 10 = severe / high-risk)
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((key) => {
          const p = ps[key];
          return (
            <div
              key={key}
              className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-slate-900 mb-1">
                {p.label} Domain
              </h2>
              <p className="text-[11px] text-slate-600 mb-3">
                Use the slider to rate current severity or level of concern for
                this domain, then document the key drivers, barriers, and
                protective factors.
              </p>

              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Severity (0–10)
              </label>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={p.severity}
                  onChange={(e) =>
                    handleSeverityChange(key, Number(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="w-8 text-xs text-right font-medium text-slate-800">
                  {p.severity}
                </span>
              </div>

              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Narrative Notes
              </label>
              <textarea
                value={p.notes}
                onChange={(e) => handleNotesChange(key, e.target.value)}
                rows={5}
                placeholder={`Clinical story for the ${p.label.toLowerCase()} domain...`}
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
          Save 4Ps Assessment (Pilot)
        </button>
      </div>
    </div>
  );
};

export default Rn4PsPage;