// src/rn/RNCris

// RN Crisis Screen — simplified stable version
// Uses real onExit from App.tsx and no longer shows placeholder messaging

import React from "react";

type RNCrisisScreenProps = {
  caseId: string;
  incidentId?: string;
  state: string;
  onExit: () => void;
};

const RNCrisisScreen: React.FC<RNCrisisScreenProps> = ({
  caseId,
  incidentId,
  state,
  onExit,
}) => {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="border-b pb-3">
        <h1 className="text-xl font-semibold text-red-700">
          🚨 RN Crisis Response Active
        </h1>
        <p className="text-sm text-gray-700">
          You have initiated a crisis safety protocol for this client.
        </p>

        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div>Case ID: {caseId}</div>
          {incidentId && <div>Incident ID: {incidentId}</div>}
          <div>Crisis State: {state}</div>
        </div>
      </header>

      {/* RN Guidance */}
      <section className="border rounded-md p-3 bg-white shadow-sm space-y-2">
        <h2 className="font-semibold text-sm">RN Immediate Actions</h2>
        <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
          <li>Stay on the line with the client.</li>
          <li>Ensure the client is not left alone.</li>
          <li>Maintain calm, steady communication.</li>
          <li>Prepare to hand off to Buddy/Supervisor flow.</li>
        </ul>
      </section>

      {/* Exit Button */}
      <section className="pt-2">
        <button
          type="button"
          className="px-4 py-2 rounded-md text-sm font-semibold bg-gray-300 text-gray-800 border"
          onClick={onExit}
        >
          Exit Crisis Mode
        </button>
      </section>
    </div>
  );
};

export default RNCrisisScreen;
