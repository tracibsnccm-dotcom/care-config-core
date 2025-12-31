// src/screens/rn/FourPsScreen.tsx

import React, { useEffect, useState } from "react";
import {
  FOUR_PS,
  FourPsSummary,
  SeverityScore,
  SEVERITY_SCALE,
  getSeverityLabel,
} from "../../constants/reconcileFramework";

const SCORE_OPTIONS: SeverityScore[] = [1, 2, 3, 4, 5];
// TODO: localStorage draft key used - "rcms_fourPs_draft" stores the DRAFT (unpublished) FourPsSummary object.
// This is a GLOBAL localStorage key (not case-scoped). In production, should be scoped by caseId.
const DRAFT_STORAGE_KEY = "rcms_fourPs_draft";

interface DimensionDraft {
  id: string;
  score: SeverityScore | null;
  note: string;
}

function loadDraft(): FourPsSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FourPsSummary;
  } catch (e) {
    console.error("Failed to load 4Ps draft", e);
    return null;
  }
}

function saveDraft(summary: FourPsSummary) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(summary));
  } catch (e) {
    console.error("Failed to save 4Ps draft", e);
  }
}

function computeOverallScore(dimensions: DimensionDraft[]): SeverityScore | null {
  const scores = dimensions
    .map((d) => d.score)
    .filter((s): s is SeverityScore => typeof s === "number");
  if (scores.length === 0) return null;
  // Maslow logic: overall follows the WORST (lowest) score
  return scores.reduce((min, s) => (s < min ? s : min), scores[0]);
}

const FourPsScreen: React.FC = () => {
  const [dimensions, setDimensions] = useState<DimensionDraft[]>(
    FOUR_PS.map((p) => ({
      id: p.id,
      score: null,
      note: "",
    }))
  );
  const [narrative, setNarrative] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  // Load existing draft on mount
  useEffect(() => {
    const existing = loadDraft();
    if (existing) {
      setNarrative(existing.narrative ?? "");
      setDimensions((prev) =>
        prev.map((d) => {
          const match = existing.dimensions.find((x) => x.id === d.id);
          if (!match) return d;
          return {
            id: d.id,
            score: match.score,
            note: match.note ?? "",
          };
        })
      );
    }
  }, []);

  const overallScore = computeOverallScore(dimensions);
  const severityLabel = overallScore ? getSeverityLabel(overallScore) : null;

  const handleScoreChange = (id: string, value: string) => {
    const num = Number(value);
    const valid = SCORE_OPTIONS.includes(num as SeverityScore)
      ? (num as SeverityScore)
      : null;

    setDimensions((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              score: valid,
            }
          : d
      )
    );
    setStatus(null);
  };

  const handleNoteChange = (id: string, value: string) => {
    setDimensions((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              note: value,
            }
          : d
      )
    );
    setStatus(null);
  };

  // TODO: Data shape saved - saveDraft() writes a FourPsSummary object to localStorage:
  //   - overallScore: SeverityScore (1-5, computed as the lowest/worst dimension score using Maslow logic)
  //   - dimensions: Array of { id: string, score: SeverityScore, note?: string } (only dimensions with non-null scores are included)
  //   - narrative?: string (optional RN care narrative summarizing how 4Ps interact)
  // TODO: What is attorney-facing vs RN-only:
  //   - Attorney-facing (published to Attorney Console): overallScore, dimensions scores, narrative
  //   - RN-only (internal notes): dimension notes (per-domain clinical notes, not included in published summary)
  //   The narrative field is explicitly labeled as "attorney-facing" in the UI and will be displayed in Attorney Console.
  // TODO: How RNPublishPanel is expected to consume it - RNPublishPanel.loadFourPsDraft() reads from "rcms_fourPs_draft"
  //   and includes the entire FourPsSummary (overallScore, dimensions array, narrative) in the published CaseSummary.
  //   When RN publishes, RNPublishPanel collects this draft and includes it as summary.fourPs in the published summary.
  const handleSaveDraft = () => {
    const score = overallScore;
    if (!score) {
      setStatus("Please score at least one P before saving the draft.");
      return;
    }

    const summary: FourPsSummary = {
      overallScore: score,
      dimensions: dimensions
        .filter((d) => d.score !== null)
        .map((d) => ({
          id: d.id,
          score: d.score as SeverityScore,
          note: d.note || undefined,
        })),
      narrative: narrative || undefined,
    };

    saveDraft(summary);
    setStatus("4Ps draft saved. This will be available for RN summaries and publishing.");
  };

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
      <div
        style={{
          marginBottom: "0.75rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            marginBottom: "0.2rem",
          }}
        >
          4Ps of Wellness – RN Assessment
        </h2>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#64748b",
            maxWidth: "46rem",
          }}
        >
          Score each P on the 1–5 severity scale, where{" "}
          <strong>1 = Critical / Very Poor</strong> and{" "}
          <strong>5 = Stable / Strong / Good</strong>. Use the notes to capture
          key clinical details in each domain. The overall 4Ps score will follow
          the <strong>worst (lowest) P score</strong>, consistent with Maslow
          logic.
        </p>
      </div>

      {/* Overall score badge */}
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.6rem 0.8rem",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.8rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#64748b",
              marginBottom: "0.1rem",
            }}
          >
            Overall 4Ps Severity
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {overallScore ? (
              <>
                {severityLabel
                  ? `${severityLabel} (${overallScore}/5)`
                  : `Overall score: ${overallScore}/5`}
              </>
            ) : (
              "No overall score yet – score at least one P."
            )}
          </div>
        </div>
        <div
          style={{
            fontSize: "0.72rem",
            color: "#64748b",
            textAlign: "right",
          }}
        >
          The overall score is the lowest-scored P. A single critical domain can
          destabilize the whole picture.
        </div>
      </div>

      {/* 4Ps grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {dimensions.map((dim) => {
          const def = FOUR_PS.find((p) => p.id === dim.id);
          const label = def ? def.label : dim.id;
          const description = def ? def.definition : "";

          return (
            <div
              key={dim.id}
              style={{
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                padding: "0.75rem 0.9rem",
                fontSize: "0.8rem",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "0.15rem",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  marginBottom: "0.4rem",
                }}
              >
                {description}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "#0f172a",
                    minWidth: "6rem",
                  }}
                >
                  Severity (1–5)
                </label>
                <select
                  value={dim.score ?? ""}
                  onChange={(e) => handleScoreChange(dim.id, e.target.value)}
                  style={{
                    padding: "0.25rem 0.4rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.78rem",
                  }}
                >
                  <option value="">Select…</option>
                  {SCORE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {dim.score && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "#64748b",
                    }}
                  >
                    {getSeverityLabel(dim.score)}
                  </span>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#0f172a",
                    marginBottom: "0.2rem",
                  }}
                >
                  RN note for this P
                </label>
                <textarea
                  value={dim.note}
                  onChange={(e) => handleNoteChange(dim.id, e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    padding: "0.35rem 0.4rem",
                    fontSize: "0.78rem",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Narrative + Save */}
      <div
        style={{
          marginBottom: "0.75rem",
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: "0.78rem",
            fontWeight: 600,
            marginBottom: "0.3rem",
          }}
        >
          RN 4Ps Narrative (attorney-facing)
        </label>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#64748b",
            marginBottom: "0.25rem",
          }}
        >
          Summarize how the 4Ps interact: where the client is most vulnerable,
          where they are strongest, and what this means for recovery, adherence,
          and function.
        </p>
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            padding: "0.4rem 0.45rem",
            fontSize: "0.78rem",
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={handleSaveDraft}
          style={{
            padding: "0.45rem 1rem",
            borderRadius: "999px",
            border: "none",
            background: "#0f2a6a",
            color: "#ffffff",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Save 4Ps draft
        </button>
        {status && (
          <div
            style={{
              fontSize: "0.76rem",
              color: status.startsWith("Please") ? "#b45309" : "#16a34a",
              textAlign: "right",
            }}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default FourPsScreen;
