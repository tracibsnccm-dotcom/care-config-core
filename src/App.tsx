// src/App.tsx

import React, { useState } from "react";
import ClientIntakeForm from "./components/forms/ClientIntakeForm";
import FollowUpForm from "./components/forms/FollowUpForm";
import FlagsPanel from "./components/FlagsPanel";
import SupervisorAuditPanel from "./components/SupervisorAuditPanel";
import { AppState, Flag } from "./lib/models";
import { evaluateTenVs, FourPsSnapshot } from "./lib/vEngine";

/**
 * Helper: basic 4Ps snapshot for engine when only flags/tasks are available.
 * For now, we infer high-level risk from open flags, similar to the
 * SupervisorAuditPanel, so the RN and Supervisor views stay aligned.
 */
const buildFourPsFromStateForAudit = (flags: Flag[]): FourPsSnapshot => {
  const open = (flags || []).filter((f) => f.status === "Open");
  const hasHighCrit = open.some(
    (f) => f.severity === "High" || f.severity === "Critical"
  );
  const hasSdoh = open.some(
    (f) => (f.type || "").toLowerCase().includes("sdoh")
  );

  return {
    physical: {
      painScore: undefined,
      uncontrolledChronicCondition: false,
    },
    psychological: {
      positiveDepressionAnxiety: false,
      highStress: false,
    },
    psychosocial: {
      hasSdohBarrier: hasSdoh,
      limitedSupport: false,
    },
    professional: {
      unableToWork: false,
      accommodationsNeeded: false,
    },
    anyHighRiskOrUncontrolled: hasHighCrit || hasSdoh,
  };
};

const severityLabel = (level: 1 | 2 | 3 | 4): string => {
  switch (level) {
    case 1:
      return "Level 1 – Simple";
    case 2:
      return "Level 2 – Moderate";
    case 3:
      return "Level 3 – Complex";
    case 4:
    default:
      return "Level 4 – Severely Complex";
  }
};

const vitalityBadgeClass = (score: number): string => {
  if (score <= 3.9) return "bg-red-100 text-red-700 border-red-300";
  if (score <= 7.9) return "bg-amber-100 text-amber-700 border-amber-300";
  return "bg-green-100 text-green-700 border-green-300";
};

const ragBadgeClass = (rag: string): string => {
  switch (rag) {
    case "Red":
      return "bg-red-100 text-red-700 border-red-300";
    case "Amber":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "Green":
    default:
      return "bg-green-100 text-green-700 border-green-300";
  }
};

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

  // Pre-compute 10-Vs evaluation for RN Snapshot when we have a client
  let tenVsEval: ReturnType<typeof evaluateTenVs> | null = null;
  if (state) {
    const fourPs = buildFourPsFromStateForAudit(state.flags as any);
    tenVsEval = evaluateTenVs({
      appState: state,
      client: state.client,
      flags: state.flags,
      tasks: state.tasks,
      fourPs,
    });
  }

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

        {/* Once intake is done → show snapshot + flags + follow-up + supervisor view */}
        {state && tenVsEval && (
          <>
            {/* Client Snapshot (RN CM View) */}
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
                    <span className="font-semibold">Viability:</span>{" "}
                    {state.client.viabilityScore}{" "}
                    <span className="text-slate-500">
                      ({state.client.viabilityStatus || "N/A"})
                    </span>
                  </div>
                )}

                <div>
                  <span className="font-semibold">Severity Level:</span>{" "}
                  {severityLabel(tenVsEval.suggestedSeverity)}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${vitalityBadgeClass(
                      tenVsEval.vitalityScore
                    )}`}
                  >
                    <span className="font-semibold">Vitality:</span>
                    <span>{tenVsEval.vitalityScore.toFixed(1)}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${ragBadgeClass(
                      tenVsEval.ragStatus
                    )}`}
                  >
                    <span className="font-semibold">RAG:</span>
                    <span>{tenVsEval.ragStatus}</span>
                  </span>
                </div>

                {state.client.voiceView && (
                  <div className="mt-2 space-y-1">
                    <div>
                      <span className="font-semibold">Voice:</span>{" "}
                      {state.client.voiceView.voice}
                    </div>
                    <div>
                      <span className="font-semibold">View:</span>{" "}
                      {state.client.voiceView.view}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Flags Panel (RN CM Risk View) */}
            <FlagsPanel flags={state.flags} />

            {/* Follow-Up Form (RN CM Workflow) */}
            <section className="bg-white border rounded-xl p-4 shadow-sm mt-4">
              <FollowUpForm
                client={state.client}
                flags={state.flags}
                tasks={state.tasks}
                onSaved={handleFollowUpSaved}
              />
            </section>

            {/* Supervisor / QMP Quick Audit View */}
            <SupervisorAuditPanel state={state} />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
