// src/App.tsx
// RN Case Engine with Timeline + Crisis Mode + Dev Role Switcher

import React, { useState } from "react";
import { useMockDB } from "./lib/mockDB";
import RNFollowUpForm from "./rn/RNFollowUpForm";
import { RNCaseTimeline } from "./components/RNCaseTimeline";
import CrisisModeButton from "./components/CrisisModeButton";
import RNCrisisScreen from "./rn/RNCrisisScreen";
import BuddyCrisisScreen from "./buddy/BuddyCrisisScreen";
import SupervisorCrisisScreen from "./supervisor/SupervisorCrisisScreen";

const App: React.FC = () => {
  const { activeCase } = useMockDB() as any;

  // Which role's view are we looking at? (dev-only switcher)
  const [viewMode, setViewMode] = useState<"rn" | "buddy" | "supervisor">("rn");

  // RN Crisis Mode state
  const [isCrisisActive, setIsCrisisActive] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);

  if (!activeCase) {
    return (
      <div className="border rounded-xl bg-white p-4 text-[11px] text-slate-600">
        No active case is selected. Go to the RN Dashboard, choose a case, then
        return to the RN Case Engine view.
      </div>
    );
  }

  const client = activeCase.client ?? activeCase.clientProfile ?? {};
  const clientName: string = client.name ?? activeCase.clientName ?? "Client";
  const caseId: string =
    activeCase.id ?? activeCase.caseId ?? client.id ?? "case-001";

  const handleCrisisStart = (newIncidentId: string) => {
    setIncidentId(newIncidentId);
    setIsCrisisActive(true);
  };

  const handleCrisisExit = () => {
    setIsCrisisActive(false);
    // We keep incidentId so Buddy/Supervisor can still use it.
  };

  return (
    <div className="space-y-3 text-[11px]">
      {/* Header */}
      <section className="border rounded-xl bg-white p-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            RN Case Engine – Crisis Mode Dev View
          </div>
          <p className="text-[10px] text-slate-500">
            Case: <span className="font-mono">{caseId}</span> · Client:{" "}
            <span className="font-semibold">{clientName}</span>
          </p>
          {incidentId && (
            <p className="text-[10px] text-slate-500">
              Active incident ID:{" "}
              <span className="font-mono">{incidentId}</span>
            </p>
          )}
        </div>

        {/* Right side: view selector + RN Crisis button */}
        <div className="flex flex-col items-end gap-2">
          {/* Role/view selector (dev only) */}
          <div className="flex gap-1">
            <button
              type="button"
              className={`px-2 py-1 rounded text-[10px] border ${
                viewMode === "rn"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-700"
              }`}
              onClick={() => setViewMode("rn")}
            >
              RN View
            </button>
            <button
              type="button"
              className={`px-2 py-1 rounded text-[10px] border ${
                viewMode === "buddy"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-700"
              }`}
              onClick={() => setViewMode("buddy")}
            >
              Buddy View
            </button>
            <button
              type="button"
              className={`px-2 py-1 rounded text-[10px] border ${
                viewMode === "supervisor"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-700"
              }`}
              onClick={() => setViewMode("supervisor")}
            >
              Supervisor View
            </button>
          </div>

          {/* RN Crisis button only shows in RN non-crisis mode */}
          {viewMode === "rn" && !isCrisisActive && (
            <CrisisModeButton caseId={caseId} onStart={handleCrisisStart} />
          )}
        </div>
      </section>

      {/* Main Content based on viewMode */}
      {viewMode === "rn" && (
        <>
          {isCrisisActive ? (
            // Crisis Mode RN view
            <section className="border rounded-xl bg-white p-3">
              <RNCrisisScreen
                caseId={caseId}
                incidentId={incidentId ?? undefined}
                onExit={handleCrisisExit}
              />
            </section>
          ) : (
            // Normal RN Case Engine layout: Follow-Up + Timeline
            <section className="grid md:grid-cols-[2fr,1.5fr] gap-3">
              <div>
                <RNFollowUpForm />
              </div>
              <div>
                <RNCaseTimeline />
              </div>
            </section>
          )}
        </>
      )}

      {viewMode === "buddy" && (
        <section className="border rounded-xl bg-white p-3">
          <BuddyCrisisScreen
            caseId={caseId}
            incidentId={incidentId ?? undefined}
          />
        </section>
      )}

      {viewMode === "supervisor" && (
        <section className="border rounded-xl bg-white p-3">
          <SupervisorCrisisScreen
            caseId={caseId}
            incidentId={incidentId ?? undefined}
          />
        </section>
      )}
    </div>
  );
};

export default App;

