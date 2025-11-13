// src/components/forms/ClientIntakeForm.tsx

import React, { useState } from "react";
import { AppState } from "../../lib/models";

/**
 * Reconcile C.A.R.E.™
 * Minimal Client Intake Form (Temporary Stub)
 *
 * This is a SAFE placeholder so the app can compile and run.
 * It:
 *  - Captures a basic client name
 *  - Creates an initial AppState with empty flags/tasks/injuries
 *  - Hands that state back to <App> via onSaved(...)
 *
 * Later, we’ll replace/extend this with the full 4Ps + SDOH intake.
 */

interface ClientIntakeFormProps {
  onSaved: (state: AppState) => void;
}

const ClientIntakeForm: React.FC<ClientIntakeFormProps> = ({ onSaved }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Very lightweight initial AppState – rest can be added over time.
    const initialState: AppState = {
      client: {
        id: crypto.randomUUID ? crypto.randomUUID() : "temp-client",
        name: name || "Unnamed Client",
        viabilityScore: undefined,
        viabilityStatus: undefined,
        cmDeclined: false,
        voiceView: undefined,
        fourPs: undefined,
        sdoh: undefined,
        lastFollowupDate: undefined,
        nextFollowupDue: undefined,
      } as any,
      flags: [],
      tasks: [],
      // injuries field may or may not exist on AppState in your models;
      // we add it defensively and let TS accept via 'as any'.
      injuries: [],
    } as any;

    onSaved(initialState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-sm font-semibold mb-1">Initial Client Intake</h2>
      <p className="text-xs text-slate-600">
        This is a temporary minimal intake. It creates an initial case so you
        can test flags, follow-ups, ODG/ICD mapping, and audit views.
      </p>

      <div>
        <label className="block text-xs font-semibold mb-1">
          Client Name
        </label>
        <input
          type="text"
          className="w-full border rounded px-2 py-1 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter client name"
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 text-xs border rounded-md bg-slate-900 text-slate-50 hover:bg-slate-800"
      >
        Start Case
      </button>
    </form>
  );
};

export default ClientIntakeForm;
