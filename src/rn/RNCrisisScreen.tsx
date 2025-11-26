import React from "react";

type RNCrisisScreenProps = {
  caseId: string;
  incidentId?: string;
  onExit?: () => void;
};

const RNCrisisScreen: React.FC<RNCrisisScreenProps> = ({
  caseId,
  incidentId,
  onExit,
}) => {
  // For now this is a static UI shell.
  // Later, your dev (or we) can wire it to real data from Supabase.
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="border-b pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-red-700">
            🚨 Crisis Mode Active
          </h1>
          <p className="text-sm text-gray-700">
            Stay with the client. Buddy/Supervisor will handle EMS and
            escalation.
          </p>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-1">
          <div>Case ID: {caseId}</div>
          {incidentId && <div>Incident ID: {incidentId}</div>}
          {onExit && (
            <button
              type="button"
              className="mt-2 px-3 py-1 rounded-md text-[10px] font-semibold bg-slate-700 text-white"
              onClick={onExit}
            >
              Exit Crisis View (for now)
            </button>
          )}
        </div>
      </header>

      {/* RN Instructions */}
      <section className="bg-red-50 border border-red-200 rounded-md p-3">
        <h2 className="font-semibold text-red-800 text-sm">
          Your role right now
        </h2>
        <ul className="mt-2 text-sm text-red-900 list-disc pl-5 space-y-1">
          <li>Stay with the client (on phone or in person).</li>
          <li>
            Keep your tone calm and clear. Avoid arguing, shaming, or
            minimizing.
          </li>
          <li>
            Do <span className="font-semibold">not</span> call EMS yourself
            unless the system is unavailable.
          </li>
          <li>
            Buddy or Supervisor will call EMS and law enforcement when needed.
          </li>
        </ul>
      </section>

      {/* Live Status Panels (placeholders for now) */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Buddy / Decision Owner */}
        <div className="border rounded-md p-3 bg-white shadow-sm">
          <h3 className="font-semibold text-sm mb-1">Buddy / Decision Owner</h3>
          <p className="text-xs text-gray-500">
            This section will show who is handling EMS decisions for this
            crisis.
          </p>
          <ul className="mt-2 text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Decision Owner: (Buddy or Supervisor)</li>
            <li>Status: e.g. “Completing safety checklist”</li>
          </ul>
        </div>

        {/* EMS Status */}
        <div className="border rounded-md p-3 bg-white shadow-sm">
          <h3 className="font-semibold text-sm mb-1">EMS Status</h3>
          <p className="text-xs text-gray-500">
            This section will show whether EMS has been called and any ETA.
          </p>
          <ul className="mt-2 text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>EMS called: Yes/No</li>
            <li>Caller: Buddy / Supervisor</li>
            <li>ETA: (if known)</li>
          </ul>
        </div>

        {/* Supervisor Status */}
        <div className="border rounded-md p-3 bg-white shadow-sm">
          <h3 className="font-semibold text-sm mb-1">Supervisor Involvement</h3>
          <p className="text-xs text-gray-500">
            This section will show whether a Supervisor is involved or has taken
            over.
          </p>
          <ul className="mt-2 text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Supervisor: (Name)</li>
            <li>Role: Monitoring / Lead decision-maker</li>
          </ul>
        </div>
      </section>

      {/* RN Status Updates */}
      <section className="border rounded-md p-3 bg-white shadow-sm">
        <h3 className="font-semibold text-sm mb-1">RN Status Updates</h3>
        <p className="text-xs text-gray-500 mb-2">
          Use this area to record brief updates every few minutes during the
          crisis (e.g., changes in mood, statements, environment).
        </p>
        <textarea
          className="w-full border rounded-md p-2 text-sm"
          rows={4}
          placeholder="Example: 14:32 - Client crying, reports firearm is in bedroom closet, children are with grandmother..."
        />
        <div className="mt-2 flex justify-end">
          <button className="px-3 py-1 rounded-md text-sm font-semibold bg-gray-800 text-white">
            Save Update (placeholder)
          </button>
        </div>
      </section>
    </div>
  );
};

export default RNCrisisScreen;
