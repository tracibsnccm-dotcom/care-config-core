// src/App.tsx

import React, { useState } from "react";
import ClientIntakeForm from "./components/forms/ClientIntakeForm";
import FollowUpForm from "./components/forms/FollowUpForm";
import FlagsPanel from "./components/FlagsPanel";
import SupervisorAuditPanel from "./components/SupervisorAuditPanel";
import InjurySelector from "./components/injuries/InjurySelector";
import { AppState, InjuryInstance } from "./lib/models";
import { buildCaseSummaryForExport } from "./lib/exportHelpers";

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);

  // TODO: Replace in-memory AppState with real API calls.
  // - On intake submit: POST /clients
  // - On follow-up: POST /clients/:id/followups
  // - Load initial data: GET /clients/:id

  const handleIntakeSaved = (newState: AppState) => {
    setState({
      ...newState,
      injuries: newState.injuries || [],
    });
  };

  const handleFollowUpSaved = (newState: AppState) => {
    setState((prev) => {
      // Preserve injuries unless newState explicitly provides them
      const merged: AppState = {
        ...(prev || newState),
        ...newState,
        injuries: newState.injuries || prev?.injuries || [],
      };
      return merged;
    });
  };

  const handleInjuriesChange = (injuries: InjuryInstance[]) => {
    setState((prev) => (prev ? { ...prev, injuries } : prev));
  };

  const handleDownloadSummary = () => {
    if (!state) return;
    const summary = buildCaseSummaryForExport(state);
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rcms-case-summary-${state.client.id || "client"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">
            Reconcile C.A.R.E.™ Care Management Console
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Integrating Clinical Precision with Compassionate Advocacy.
          </p>
        </header>

        {/* If no intake saved yet → show Intake Form */}
        {!state && (
          <section className="bg-white border rounded-xl p-4 shadow-sm">
            <ClientIntakeForm onSaved={handleIntakeSaved} />
          </section>
        )}

        {/* Once intake is done → show snapshot + injury builder + flags + follow-up + audit */}
        {state && (
          <>
            {/* Client Snapshot */}
            <section className="bg-white border rounded-xl p-4 shadow-sm mb-4">
              <h2 className="text-sm font-semibold mb-2">
                Current Client Snapshot
              </h2>
              <div className="text-xs space-y-1">
                <div>
                  <span className="font-semibold">Name:</span>{" "}
                  {state.client.name}
                </div>

                {state.client.viabilityScore !== undefined && (
                  <div>
                    <span className="font-semibold">Viability Score:</span>{" "}
                    {state.client.viabilityScore}{" "}
                    <span className="text-slate-500">
                      ({state.client.viabilityStatus || "N/A"})
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

            {/* Injury Selector: drives Medical Necessity Driver */}
            <InjurySelector
              injuries={state.injuries || []}
              onChange={handleInjuriesChange}
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

            {/* Dev/Demo: Download export-ready case summary */}
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleDownloadSummary}
                className="px-3 py-1 border rounded text-[10px] text-slate-700 bg-white hover:bg-slate-100"
              >
                Download Case Summary (JSON)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
