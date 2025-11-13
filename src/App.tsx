// src/App.tsx

import React, { useState } from "react";

import ClientIntakeForm from "./components/ClientIntakeForm";
import FollowUpForm from "./components/FollowUpForm";
import FlagsPanel from "./components/FlagsPanel";
import SupervisorAuditPanel from "./components/SupervisorAuditPanel";
import InjurySelector from "./components/injuries/InjurySelector";

import { AppState } from "./lib/models";
import { buildCaseSummaryForExport } from "./lib/exportHelpers";
import { buildMedicalNarrative } from "./lib/medicalNecessityNarrative";

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);

  const handleIntakeSaved = (next: AppState) => setState(next);
  const handleFollowUpSaved = (next: AppState) => setState(next);

  const handleDownloadSummary = () => {
    if (!state) return;
    const summary = buildCaseSummaryForExport(state);
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rcms-case-summary-${state.client?.id || "client"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadNarrative = () => {
    if (!state) return;
    const narrative = buildMedicalNarrative(state);
    const blob = new Blob([narrative], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rcms-medical-narrative-${state.client?.id || "client"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <header className="mb-2">
          <h1 className="text-2xl font-semibold">
            Reconcile C.A.R.E.™ Care Management Console
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Integrating Clinical Precision with Compassionate Advocacy.
          </p>
        </header>

        {/* If no intake yet -> show initial client intake */}
        {!state && (
          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <ClientIntakeForm onSaved={handleIntakeSaved} />
          </section>
        )}

        {/* When we have state -> show snapshot, injuries, flags, follow-ups, audit */}
        {state && (
          <>
            {/* Snapshot */}
            <section className="bg-white border rounded-xl p-4 shadow-sm space-y-1">
              <h2 className="text-sm font-semibold mb-1">
                Current Client Snapshot
              </h2>
              <div className="text-xs">
                <div>
                  <span className="font-semibold">Name:</span>{" "}
                  {state.client.name || "N/A"}
                </div>

                {state.client.viabilityScore !== undefined && (
                  <div>
                    <span className="font-semibold">Viability Score:</span>{" "}
                    {state.client.viabilityScore}{" "}
                    <span className="text-slate-500">
                      {state.client.viabilityStatus
                        ? `(${state.client.viabilityStatus})`
                        : ""}
                    </span>
                  </div>
                )}

                {state.client.voiceView && (
                  <>
                    <div>
                      <span className="font-semibold">Voice:</span>{" "}
                      {state.client.voiceView.voice}
                    </div>
                    <div>
                      <span className="font-semibold">View:</span>{" "}
                      {state.client.voiceView.view}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Injury & ICD-10 Mapping (Medical Necessity Driver) */}
            <InjurySelector
              selected={state.injuries || []}
              onChange={(injuries) =>
                setState({
                  ...state,
                  injuries,
                })
              }
            />

            {/* Flags Panel */}
            <FlagsPanel flags={state.flags} />

            {/* Follow-Up Form */}
            <section className="bg-white border rounded-xl p-4 shadow-sm">
              <FollowUpForm
                client={state.client}
                flags={state.flags}
                tasks={state.tasks}
                onSaved={handleFollowUpSaved}
              />
            </section>

            {/* Supervisor / QMP Quick Audit View */}
            <SupervisorAuditPanel state={state} />

            {/* Exports */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDownloadSummary}
                className="mt-2 px-3 py-1.5 text-[10px] border rounded-md text-slate-700 hover:bg-slate-100"
              >
                Download Case Summary (JSON)
              </button>
              <button
                type="button"
                onClick={handleDownloadNarrative}
                className="mt-2 ml-2 px-3 py-1.5 text-[10px] border rounded-md text-slate-700 hover:bg-slate-100"
              >
                Download Medical Narrative (TXT)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;

