import React, { useState, ChangeEvent, useEffect } from "react";
import {
  SeverityScore,
  CrisisSummary,
} from "../../constants/reconcileFramework";

const DRAFT_STORAGE_KEY = "rcms_crisis_draft";

function loadDraft(): CrisisSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CrisisSummary;
  } catch (e) {
    console.error("Failed to load Crisis draft", e);
    return null;
  }
}

function saveDraft(summary: CrisisSummary) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(summary));
  } catch (e) {
    console.error("Failed to save Crisis draft", e);
  }
}

type CrisisPhase =
  | "Baseline / No Current Crisis"
  | "Monitoring"
  | "Escalating"
  | "Active Crisis"
  | "Post-Crisis";

const CRISIS_PHASE_OPTIONS: CrisisPhase[] = [
  "Baseline / No Current Crisis",
  "Monitoring",
  "Escalating",
  "Active Crisis",
  "Post-Crisis",
];

function crisisPhaseToSeverity(phase: CrisisPhase): SeverityScore {
  switch (phase) {
    case "Active Crisis":
      return 1; // worst
    case "Escalating":
      return 2;
    case "Post-Crisis":
      return 3;
    case "Monitoring":
      return 4;
    case "Baseline / No Current Crisis":
    default:
      return 5; // best
  }
}

function severityToCrisisPhase(score: SeverityScore): CrisisPhase {
  switch (score) {
    case 1:
      return "Active Crisis";
    case 2:
      return "Escalating";
    case 3:
      return "Post-Crisis";
    case 4:
      return "Monitoring";
    case 5:
    default:
      return "Baseline / No Current Crisis";
  }
}

const CrisisModeScreen: React.FC = () => {
  const [phase, setPhase] = useState<CrisisPhase>(
    "Baseline / No Current Crisis"
  );
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  // Load existing draft on mount
  useEffect(() => {
    const existing = loadDraft();
    if (existing) {
      setPhase(severityToCrisisPhase(existing.severityScore));
    }
  }, []);

  const severityScore: SeverityScore = crisisPhaseToSeverity(phase);

  const handlePhaseChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPhase(e.target.value as CrisisPhase);
    setStatus(null);
  };

  const handleNoteChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    setStatus(null);
  };

  const handleSave = () => {
    const summary: CrisisSummary = {
      severityScore,
    };

    saveDraft(summary);
    setStatus("Crisis draft saved. This will be available for RN summaries and publishing.");
  };

  const severityColor =
    severityScore === 1
      ? "#b91c1c"
      : severityScore === 2
      ? "#b45309"
      : severityScore === 3
      ? "#92400e"
      : severityScore === 4
      ? "#15803d"
      : "#166534";

  return (
    <div>
      {/* Back to Dashboard button */}
      <button
        type="button"
        onClick={() => {
          window.history.pushState({}, "", "/rn");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
        style={{
          padding: "0.4rem 0.8rem",
          borderRadius: "999px",
          border: "1px solid #cbd5e1",
          background: "#ffffff",
          color: "#0f172a",
          fontSize: "0.75rem",
          fontWeight: 500,
          cursor: "pointer",
          marginBottom: "0.75rem",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f8fafc";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#ffffff";
        }}
      >
        ← Back to Dashboard
      </button>
      {/* Header */}
      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              marginBottom: "0.15rem",
            }}
          >
            Crisis Mode
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Track the current crisis phase and map it onto the same 1–5 scale
            used by the Ps, Vs, and SDOH so the Attorney sees a consistent
            severity story.
          </p>
        </div>

        <div
          style={{
            textAlign: "right",
            padding: "0.5rem 0.75rem",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Crisis Severity (1–5)
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: severityColor,
            }}
          >
            {severityScore} / 5
          </div>
        </div>
      </div>

      {/* Main card */}
      <div
        style={{
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          padding: "0.75rem",
        }}
      >
        <div
          style={{
            marginBottom: "0.6rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                marginBottom: "0.2rem",
              }}
            >
              Crisis Phase
            </div>
            <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Phase language is RN-facing, but it is always translated to the
              same 1–5 severity scale so the Attorney Console can compare
              crisis risk to the Ps, Vs, and SDOH.
            </p>
          </div>
          <select
            value={phase}
            onChange={handlePhaseChange}
            style={{
              fontSize: "0.8rem",
              borderRadius: "999px",
              border: "1px solid #cbd5e1",
              padding: "0.2rem 0.7rem",
              maxWidth: "260px",
            }}
          >
            {CRISIS_PHASE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            marginTop: "0.6rem",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            RN Crisis Note (Internal Use)
          </div>
          <textarea
            value={note}
            onChange={handleNoteChange}
            rows={8}
            placeholder="Briefly describe the crisis context, triggers, and any EMS/buddy/supervisor actions taken or considered. This is primarily for RN reference, not attorney-facing narrative."
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              padding: "0.45rem",
              fontSize: "0.8rem",
              resize: "vertical",
            }}
          />
          <p
            style={{
              fontSize: "0.72rem",
              color: "#64748b",
              marginTop: "0.3rem",
            }}
          >
            The numeric crisis severity (1–5) is what flows to the Attorney
            Console. Detailed crisis notes will later be surfaced selectively in
            reports, not as a live feed.
          </p>
        </div>
      </div>

      {/* Save row */}
      <div
        style={{
          marginTop: "0.85rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#64748b",
            }}
          >
            Crisis severity is aligned to the same 1–5 scale as the Ps, Vs, and
            SDOH so the Attorney Console can show the worst clinical concern at a
            glance.
          </div>
          {status && (
            <div
              style={{
                fontSize: "0.75rem",
                color: status.startsWith("Please") ? "#b45309" : "#16a34a",
                marginTop: "0.25rem",
                fontWeight: 500,
              }}
            >
              {status}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: "999px",
            border: "none",
            background: "#0f2a6a",
            color: "#ffffff",
            fontSize: "0.8rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Save Crisis Severity
        </button>
      </div>
    </div>
  );
};

export default CrisisModeScreen;
