// src/components/forms/FollowUpForm.tsx

import React, { useState } from "react";
import { Client, Flag, Task, AppState } from "../../lib/models";
import { onFollowUpSubmit } from "../../lib/workflows";
import { applyEffects } from "../../lib/executor";
import ClientAcknowledgement, {
  ClientAcknowledgementValue,
} from "../ClientAcknowledgement";

interface FollowUpFormProps {
  client: Client;
  flags: Flag[];
  tasks: Task[];
  onSaved: (state: AppState) => void;
}

/**
 * Reconcile C.A.R.E.™
 * 30-Day Follow-Up Form
 *
 * - RN CM must confirm review of all open High/Critical flags.
 * - Client can change decision: Accept or Decline Care Management.
 * - Next 30-day follow-up task is auto-created by workflow.
 * - Client Acknowledgment & Consent is required or refusal documented.
 */
const FollowUpForm: React.FC<FollowUpFormProps> = ({
  client,
  flags,
  tasks,
  onSaved,
}) => {
  const [reviewed, setReviewed] = useState(false);
  const [clientDecision, setClientDecision] = useState<"Accept" | "Decline">(
    client.cmDeclined ? "Decline" : "Accept"
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Client acknowledgment state
  const [ack, setAck] = useState<ClientAcknowledgementValue>({
    understood: false,
    hadChanceToAskQuestions: false,
    receivedEducation: false,
    consentChoice: "",
    clientName: "",
    clientRefused: false,
  });

  const highCriticalFlags = flags.filter(
    (f) =>
      f.status === "Open" &&
      (f.severity === "High" || f.severity === "Critical")
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Require explicit confirmation if there are serious flags
    if (highCriticalFlags.length > 0 && !reviewed) {
      setError(
        "You must confirm all open High/Critical items were reviewed with the client."
      );
      return;
    }

    // Require client acknowledgment OR documented refusal
    if (!ack.clientRefused) {
      if (
        !ack.understood ||
        !ack.hadChanceToAskQuestions ||
        !ack.receivedEducation ||
        !ack.consentChoice ||
        !ack.clientName.trim()
      ) {
        setError(
          "Complete the Client Acknowledgment section or mark that the client refused."
        );
        return;
      }
    }

    setSaving(true);
    try {
      const effects = onFollowUpSubmit(client, flags, tasks, {
        reviewedAllHighCritical: reviewed || highCriticalFlags.length === 0,
        clientDecision,
      });

      const initialState: AppState = { client, flags, tasks };
      const newState = applyEffects(initialState, effects);

      // Optional: attach RN CM note into audit/log
      if (note.trim()) {
        console.log(`[RN_CM_NOTE][${client.id}]: ${note.trim()}`);
      }

      // Optional: capture acknowledgment for backend persistence later
      console.log("[CLIENT_ACKNOWLEDGEMENT]", {
        clientId: client.id,
        followupAt: new Date().toISOString(),
        acknowledgment: ack,
      });

      onSaved(newState);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to save follow-up. Please review all required items."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="font-semibold text-lg">
        30-Day Follow-Up / Readiness Review
      </h2>

      {highCriticalFlags.length > 0 && (
        <section className="border rounded p-3 bg-gray-50">
          <div className="font-semibold text-sm mb-1">
            Open High / Critical Items (Must Be Addressed)
          </div>
          <ul className="list-disc pl-5 text-sm">
            {highCriticalFlags.map((f) => (
              <li key={f.id}>
                {f.label} ({f.severity})
              </li>
            ))}
          </ul>
          <label className="flex items-center gap-2 mt-3 text-sm">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I have reviewed and discussed all open High/Critical items with the
            client.
          </label>
        </section>
      )}

      {/* Client decision about Care Management */}
      <section>
        <div className="font-semibold text-sm mb-1">
          Client’s Current Decision About Care Management
        </div>
        <p className="text-xs text-gray-600 mb-2">
          The client may change their mind at any time. Record today’s
          decision.
        </p>
        <label className="flex items-center gap-2 text-sm mb-1">
          <input
            type="radio"
            name="cmDecision"
            value="Accept"
            checked={clientDecision === "Accept"}
            onChange={() => setClientDecision("Accept")}
          />
          Client ACCEPTS Care Management services.
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="cmDecision"
            value="Decline"
            checked={clientDecision === "Decline"}
            onChange={() => setClientDecision("Decline")}
          />
          Client DECLINES Care Management at this time.
        </label>
      </section>

      {/* RN CM Note */}
      <section>
        <div className="font-semibold text-sm mb-1">
          RN CM Clinical Summary
        </div>
        <p className="text-xs text-gray-600 mb-1">
          Summarize changes, education provided, SDOH/4Ps updates, and
          rationale.
        </p>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Example: Reviewed pain, meds, transportation, and financial barriers. Client understands options and confirms current decision."
        />
      </section>

      {/* Client Acknowledgment & Consent */}
      <ClientAcknowledgement value={ack} onChange={setAck} />

      {error && (
        <div className="text-red-600 text-xs">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 border rounded text-sm"
      >
        {saving ? "Saving..." : "Save Follow-Up"}
      </button>
    </form>
  );
};

export default FollowUpForm;
