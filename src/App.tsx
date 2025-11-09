// src/App.tsx

import React, { useState } from "react";
import ClientIntakeForm from "./components/forms/ClientIntakeForm";
import FollowUpForm from "./components/forms/FollowUpForm";
import { AppState } from "./lib/models";

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
    // TODO: Replace in-memory AppState with real API calls.
  // - On intake submit: POST /clients
  // - On follow-up: POST /clients/:id/followups
  // - Load initial data: GET /clients/:id


  const handleIntakeSaved = (newState: AppState) => {
    setState(newState);
  };

  const handleFollowUpSaved = (newState: AppState) => {
    setState(newState);
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

        {/* Once intake is done → show summary + Follow-Up Form */}
        {state && (
          <>
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

            <section className="bg-white border rounded-xl p-4 shadow-sm">
              <FollowUpForm
                client={state.client}
                flags={state.flags}
                tasks={state.tasks}
                onSaved={handleFollowUpSaved}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
