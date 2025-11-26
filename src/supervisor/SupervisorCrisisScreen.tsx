// src/supervisor/SupervisorCrisisScreen.tsx
// Supervisor view for active crisis incidents (display-only for now)

import React from "react";

type SupervisorCrisisScreenProps = {
  caseId: string;
  incidentId?: string;
};

const SupervisorCrisisScreen: React.FC<SupervisorCrisisScreenProps> = ({
  caseId,
  incidentId,
}) => {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="border-b pb-3">
        <h1 className="text-xl font-semibold text-purple-700">
          🛡 Crisis Oversight — Supervisor View
        </h1>
        <p className="text-sm text-gray-700">
          Your role: review information and make the final determination
          regarding EMS activation and crisis resolution.
        </p>

        <div className="mt-2 text-xs text-gray-500">
          <div>Case ID: {caseId}</div>
          {incidentId && <div>Incident ID: {incidentId}</div>}
        </div>
      </header>

      {/* Crisis Type */}
      <section className="border rounded-md p-3 bg-white shadow-sm">
        <h2 className="font-semibold text-sm">Crisis Type</h2>
        <p className="text-xs text-gray-600">
          Displayed here based on RN selection. (Final wiring to App header
          happens automatically — no Supervisor actions required yet.)
        </p>
        <p className="mt-1 p-2 rounded bg-slate-100 text-slate-800 text-xs border border-slate-300">
          Crisis type will be shown in header above (using RN selected value).
        </p>
      </section>

      {/* System Urgency */}
      <section className="border rounded-md p-3 bg-white shadow-sm">
        <h2 className="font-semibold text-sm">System Urgency</h2>
        <p className="text-xs text-gray-600">
          Calculated automatically from Buddy checklist, displayed in header.
        </p>
        <p className="mt-1 p-2 rounded bg-yellow-50 text-yellow-800 text-xs border border-yellow-200">
          Supervisor uses this urgency level to guide EMS decision-making.
        </p>
      </section>

      {/* Supervisor Decision Placeholder */}
      <section className="border rounded-md p-3 bg-white shadow-sm space-y-3">
        <h2 className="font-semibold text-sm">Supervisor Decision</h2>
        <p className="text-xs text-gray-600">
          In a later update, these will become interactive and write to the
          crisis incident record. For now, they are placeholders only.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-red-700 text-white">
            Confirm EMS Activation (placeholder)
          </button>
          <button className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-green-700 text-white">
            Override — No EMS Needed (placeholder)
          </button>
          <button className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-gray-200 text-gray-800">
            Resolve Crisis & Close Incident (placeholder)
          </button>
        </div>
      </section>
    </div>
  );
};

export default SupervisorCrisisScreen;
