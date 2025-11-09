// src/components/forms/ClientIntakeForm.tsx

import {
  Client,
  FourPs,
  SDOH,
  RiskLevel,
  AppState,
} from "../../lib/models";
import { onIntakeSubmit } from "../../lib/workflows";
import { applyEffects } from "../../lib/executor";


interface ClientIntakeFormProps {
  onSaved: (state: AppState) => void;
}

/**
 * Reconcile C.A.R.E.™
 * Client Intake Form
 *
 * - Captures Voice/View (client story + desired direction)
 * - Captures 4 Ps of Wellness (1–5)
 * - Captures core SDOH domains
 * - Records initial decision about Care Management
 * - Computes a simple initial ViabilityScore (1–5)
 */
const ClientIntakeForm: React.FC<ClientIntakeFormProps> = ({ onSaved }) => {
  const [name, setName] = useState("");
  const [voice, setVoice] = useState("");
  const [view, setView] = useState("");

  const [fourPs, setFourPs] = useState<FourPs>({
    physical: 3,
    psychological: 3,
    professional: 3,
    personal: 3,
  });

  const [sdoh, setSdoh] = useState<SDOH>({
    housing: "None",
    food: "None",
    transport: "None",
    finances: "None",
    support: "None",
  });

  const [cmDeclined, setCmDeclined] = useState(false);
  const [cmDeclineReason, setCmDeclineReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const riskOptions: RiskLevel[] = [
    "None",
    "Low",
    "Moderate",
    "High",
    "Critical",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!voice.trim() || !view.trim()) {
      setError("Please complete both the Voice and View sections.");
      return;
    }
    if (cmDeclined && !cmDeclineReason.trim()) {
      setError(
        "Please document the client's reason for declining Care Management in their own words."
      );
      return;
    }

    setSaving(true);

    try {
      const viabilityScore = calculateInitialViability(fourPs, sdoh);

      const client: Client = {
        id: crypto.randomUUID(),
        name: name.trim(),
        voiceView: { voice: voice.trim(), view: view.trim() },
        fourPs,
        sdoh,
        cmDeclined,
        cmDeclineReason: cmDeclined ? cmDeclineReason.trim() : undefined,
        cmDeclineLastDate: cmDeclined
          ? new Date().toISOString()
          : undefined,
        viabilityScore,
        viabilityStatus: cmDeclined ? "Client Declined" : "Engaged",
        createdAt: new Date().toISOString(),
      };

      // Start with empty flags/tasks
      const initialState: AppState = {
        client,
        flags: [],
        tasks: [],
      };

      // Run intake workflow to auto-create flags based on SDOH + 4Ps
      const effects = onIntakeSubmit(client);
      const finalState = applyEffects(initialState, effects);

      onSaved(finalState);

      console.error(err);
      setError("Unable to save intake. Please review required fields.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="font-semibold text-lg">Reconcile C.A.R.E.™ Intake</h2>

      {/* Basic Info */}
      <section>
        <label className="block text-sm font-medium mb-1">
          Client Name <span className="text-red-500">*</span>
        </label>
        <input
          className="border rounded px-2 py-1 w-full text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter client's full name"
        />
      </section>

      {/* Voice / View */}
      <section>
        <h3 className="font-semibold text-sm mb-1">Voice / View</h3>
        <p className="text-xs text-gray-600 mb-1">
          Voice: client's own words about what happened / what is happening.
        </p>
        <textarea
          className="border rounded px-2 py-1 w-full text-sm mb-3"
          rows={3}
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          placeholder="In your own words, tell us what has happened and what is happening now."
        />

        <p className="text-xs text-gray-600 mb-1">
          View: how they see themselves and how they want the plan to progress.
        </p>
        <textarea
          className="border rounded px-2 py-1 w-full text-sm"
          rows={3}
          value={view}
          onChange={(e) => setView(e.target.value)}
          placeholder="How do you see yourself right now, and what would you like to see happen with your care or recovery?"
        />
      </section>

      {/* 4 Ps of Wellness */}
      <section>
        <h3 className="font-semibold text-sm mb-1">4 Ps of Wellness (1–5)</h3>
        <p className="text-xs text-gray-600 mb-2">
          1 = severe concern / unstable, 5 = very stable.
        </p>
        {(["physical", "psychological", "professional", "personal"] as const).map(
          (key) => (
            <div key={key} className="mb-2">
              <label className="block text-xs capitalize mb-1">
                {key}
              </label>
              <input
                type="number"
                min={1}
                max={5}
                className="border rounded px-2 py-1 w-24 text-sm"
                value={fourPs[key]}
                onChange={(e) =>
                  setFourPs((prev) => ({
                    ...prev,
                    [key]: Number(e.target.value || 1),
                  }))
                }
                required
              />
            </div>
          )
        )}
      </section>

      {/* SDOH */}
      <section>
        <h3 className="font-semibold text-sm mb-1">
          Social Determinants of Health
        </h3>
        <p className="text-xs text-gray-600 mb-2">
          Select the level that best reflects the client's current situation.
        </p>
        {(["housing", "food", "transport", "finances", "support"] as const).map(
          (field) => (
            <div key={field} className="mb-2">
              <label className="block text-xs capitalize mb-1">
                {field} risk
              </label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={sdoh[field]}
                onChange={(e) =>
                  setSdoh((prev) => ({
                    ...prev,
                    [field]: e.target.value as RiskLevel,
                  }))
                }
              >
                {riskOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )
        )}
      </section>

      {/* Care Management Participation */}
      <section>
        <h3 className="font-semibold text-sm mb-1">
          Care Management Participation
        </h3>
        <p className="text-xs text-gray-600 mb-2">
          After explaining the RN CM role, record the client's decision.
        </p>
        <label className="flex items-center gap-2 text-xs mb-1">
          <input
            type="checkbox"
            checked={cmDeclined}
            onChange={(e) => setCmDeclined(e.target.checked)}
          />
          Client declines Care Management services at this time.
        </label>
        {cmDeclined && (
          <textarea
            className="border rounded px-2 py-1 w-full text-xs"
            rows={2}
            value={cmDeclineReason}
            onChange={(e) => setCmDeclineReason(e.target.value)}
            placeholder="Document client's reason in their own words."
          />
        )}
      </section>

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
        {saving ? "Saving..." : "Save Intake"}
      </button>
    </form>
  );
};

function calculateInitialViability(fourPs: FourPs, sdoh: SDOH): number {
  const base =
    (fourPs.physical +
      fourPs.psychological +
      fourPs.professional +
      fourPs.personal) /
    4;

  const risks = [
    sdoh.housing,
    sdoh.food,
    sdoh.transport,
    sdoh.finances,
    sdoh.support,
  ];

  const hasHigh = risks.includes("High") || risks.includes("Critical");
  const hasModerate = risks.includes("Moderate");

  let score = base;
  if (hasHigh) score -= 1;
  else if (hasModerate) score -= 0.5;

  return Math.max(1, Math.min(5, score));
}

export default ClientIntakeForm;
