import React, { useState } from "react";

type SupervisorCrisisScreenProps = {
  caseId: string;
  incidentId?: string;
};

const SupervisorCrisisScreen: React.FC<SupervisorCrisisScreenProps> = ({
  caseId,
  incidentId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [finalDisposition, setFinalDisposition] = useState("");

  const resolvedIncidentId = incidentId ?? "stub-incident-id";

  const callSupervisorAction = async (
    actionType: "call_ems" | "override_no_ems" | "resolve_crisis",
    extras: Record<string, unknown> = {}
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/crisis-supervisor-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incident_id: resolvedIncidentId,
          supervisor_user_id: null, // later: real supervisor user ID
          action_type: actionType,
          final_disposition: finalDisposition || null,
          resolution_summary: resolutionSummary || null,
          ...extras,
        }),
      });

      if (!res.ok) {
        console.error("Supervisor action failed:", actionType);
        alert("Could not record the supervisor action. Please try again.");
        return;
      }

      const data = await res.json();
      console.log("Supervisor action result:", data);
      setLastAction(data.actionType ?? actionType);

      alert("Supervisor action recorded for this crisis incident.");
    } catch (err) {
      console.error("Error with supervisor action:", err);
      alert("Unexpected error performing supervisor action.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallEMS = () => {
    // For now, just send optional fields as null.
    // Later you can collect ETA, call notes, etc. from the UI.
    callSupervisorAction("call_ems", {
      ems_eta_text: null,
      call_notes: null,
      ems_case_reference: null,
    });
  };

  const handleOverrideNoEMS = () => {
    const overrideReason = window.prompt(
      "Briefly document why EMS is NOT being called (this will be saved):"
    );
    callSupervisorAction("override_no_ems", {
      override_reason: overrideReason ?? null,
    });
  };

  const handleResolveCrisis = () => {
    if (!finalDisposition) {
      alert("Please enter a final disposition before resolving the crisis.");
      return;
    }
    callSupervisorAction("resolve_crisis");
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <header className="border-b pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-red-700">
            🚨 Crisis Oversight — Supervisor View
          </h1>
          <p className="text-sm text-gray-700">
            Your role: review the safety information, confirm or override EMS
            decisions, and resolve the crisis incident.
          </p>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-1">
          <div>Case ID: {caseId}</div>
          {incidentId && <div>Incident ID: {incidentId}</div>}
          {lastAction && (
            <div className="mt-1">
              Last action:{" "}
              <span className="font-semibold uppercase">{lastAction}</span>
            </div>
          )}
        </div>
      </header>

      {/* Snapshot Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Severity / Type */}
        <div className="border rounded-md p-3 bg-white shadow-sm">
          <h2 className="font-semibold text-sm mb-1">Crisis Snapshot</h2>
          <p className="text-xs text-gray-500 mb-2">
            In the live system, this will summarize crisis category, subtype,
            and severity.
          </p>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Category: Safety / Medical / Vulnerable person</li>
            <li>Subtype: e.g., suicidal with weapon, chest pain, child at risk</li>
            <li>Severity: 🔴 Critical / 🟧 Urgent / 🟨 Elevated</li>
          </ul>
        </div>

        {/* EMS Status */}
        <div className="border rounded-md p-3 bg-white shadow-sm">
          <h2 className="font-semibold text-sm mb-1">EMS / Law Enforcement</h2>
          <p className="text-xs text-gray-500 mb-2">
            This will show real-time EMS status and ETA.
          </p>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>EMS called: Yes/No</li>
            <li>Called by: Buddy / Supervisor</li>
            <li>ETA: (if known)</li>
            <li>Law enforcement requested: Yes/No</li>
          </ul>
        </div>

        {/* RN / Buddy */}
        <div className="border rounded-md p-3 bg-white shadow-sm">
          <h2 className="font-semibold text-sm mb-1">RN & Buddy Status</h2>
          <p className="text-xs text-gray-500 mb-2">
            This will summarize who is with the client and who is decision-owner.
          </p>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>RN: Name, on phone or in person</li>
            <li>Buddy: Name (if assigned)</li>
            <li>Decision Owner: Buddy / Supervisor</li>
          </ul>
        </div>
      </section>

      {/* Safety Snapshot (from checklist) */}
      <section className="border rounded-md p-3 bg-white shadow-sm">
        <h2 className="font-semibold text-sm mb-1">Safety Snapshot</h2>
        <p className="text-xs text-gray-500 mb-2">
          In production, this will pull from the latest Buddy/Supervisor
          checklist for quick review.
        </p>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          <li>Firearm present in home: Yes/No/Unknown</li>
          <li>Other weapons: Yes/No/Unknown</li>
          <li>Children present or expected: Yes/No/Unknown</li>
          <li>Other vulnerable person: Yes/No/Unknown</li>
          <li>Drugs/ETOH involved: Yes/No/Unknown</li>
          <li>Immediate threat: Yes/No/Unknown</li>
          <li>Location confirmed: Yes/No</li>
          <li>RN requesting EMS: Yes/No</li>
        </ul>
      </section>

      {/* Supervisor Actions */}
      <section className="border rounded-md p-3 bg-white shadow-sm space-y-3">
        <h2 className="font-semibold text-sm mb-1">Supervisor Actions</h2>
        <p className="text-xs text-gray-500">
          These controls represent your authority during an active crisis. Each
          button calls the Supervisor Actions API and writes to the crisis
          incident and log tables.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-red-700 text-white"
            type="button"
            onClick={handleCallEMS}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Working..." : "Call EMS / Law Enforcement"}
          </button>
          <button
            className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-yellow-600 text-white"
            type="button"
            onClick={handleOverrideNoEMS}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Working..." : "Override: EMS Not Needed"}
          </button>
          <button
            className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-green-600 text-white"
            type="button"
            onClick={handleResolveCrisis}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Working..." : "Resolve Crisis"}
          </button>
        </div>
      </section>

      {/* Resolution Summary */}
      <section className="border rounded-md p-3 bg-white shadow-sm">
        <h3 className="font-semibold text-sm mb-1">Resolution Summary</h3>
        <p className="text-xs text-gray-500 mb-2">
          Document the final disposition (e.g., EMS transport vs. remained
          home, law enforcement involvement, and any key next steps).
        </p>
        <div className="mb-2">
          <label className="block text-xs font-semibold mb-1">
            Final disposition
          </label>
          <input
            type="text"
            className="w-full border rounded-md p-2 text-sm"
            value={finalDisposition}
            onChange={(e) => setFinalDisposition(e.target.value)}
            placeholder="Example: EMS transport to XYZ Hospital, voluntary; children left with aunt."
          />
        </div>
        <textarea
          className="w-full border rounded-md p-2 text-sm"
          rows={3}
          value={resolutionSummary}
          onChange={(e) => setResolutionSummary(e.target.value)}
          placeholder="Example: EMS arrived at 14:47, transported client voluntarily to XYZ Hospital ED. Law enforcement assisted clearing the weapon; family notified; safety plan updated."
        />
      </section>
    </div>
  );
};

export default SupervisorCrisisScreen;
