// src/App.tsx
// RN Case Engine with Timeline + Case Summary Card

import React from "react";
import { useMockDB } from "./lib/mockDB";
import RNFollowUpForm from "./rn/RNFollowUpForm";
import { RNCaseTimeline } from "./components/RNCaseTimeline";
import CaseSummaryCard from "./components/CaseSummaryCard";

const App: React.FC = () => {
  const { activeCase } = useMockDB() as any;

  if (!activeCase) {
    return (
      <div className="border rounded-xl bg-white p-4 text-[11px] text-slate-600">
        No active case is selected. Go to the RN Dashboard, choose a case, then
        return to the RN Case Engine view.
      </div>
    );
  }

  const client = activeCase.client ?? activeCase.clientProfile ?? {};
  const clientName: string =
    client.name ?? activeCase.clientName ?? "Client";
  const caseId: string =
    activeCase.id ?? activeCase.caseId ?? client.id ?? "case-001";

  // Crisis Mode state (mock for now)
  const crisisActive = false; // until wired to state store

  return (
    <div className="space-y-3 text-[11px]">
      {/* Header */}
      <section className="border rounded-xl bg-white p-3">
        <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
          RN Case Engine – Timeline & Summary
        </div>
        <p className="text-[10px] text-slate-500">
          Case: <span className="font-mono">{caseId}</span> · Client:{" "}
          <span className="font-semibold">{clientName}</span>
        </p>
      </section>

      {/* Layout: RN Follow-Up + Timeline + Summary */}
      <section className="grid md:grid-cols-[2fr,1.5fr] gap-3">
        {/* Left side: RN Follow-Up + Summary stacked */}
        <div className="space-y-3">
          <RNFollowUpForm />

          <CaseSummaryCard
            caseId={caseId}
            clientName={clientName}
            crisisActive={crisisActive}
          />
        </div>

        {/* Right side: Timeline */}
        <div>
          <RNCaseTimeline />
        </div>
      </section>
    </div>
  );
};

export default App;
