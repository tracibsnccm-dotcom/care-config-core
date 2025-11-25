// src/App.tsx
// RN Case Engine with Timeline only (Attorney Comm Log removed for now)

import React from "react";
import { useMockDB } from "./lib/mockDB";
import RNFollowUpForm from "./rn/RNFollowUpForm";
import { RNCaseTimeline } from "./components/RNCaseTimeline";

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

  return (
    <div className="space-y-3 text-[11px]">
      {/* Header */}
      <section className="border rounded-xl bg-white p-3">
        <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
          RN Case Engine – Timeline View
        </div>
        <p className="text-[10px] text-slate-500">
          Case: <span className="font-mono">{caseId}</span> · Client:{" "}
          <span className="font-semibold">{clientName}</span>
        </p>
      </section>

      {/* Layout: RN Follow-Up stub + Timeline */}
      <section className="grid md:grid-cols-[2fr,1.5fr] gap-3">
        <div>
          <RNFollowUpForm />
        </div>
        <div>
          <RNCaseTimeline />
        </div>
      </section>
    </div>
  );
};

export default App;
