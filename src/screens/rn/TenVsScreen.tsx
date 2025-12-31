import React, { useState, ChangeEvent, useEffect } from "react";
import {
  TEN_VS,
  SeverityScore,
  TenVsSummary,
} from "../../constants/reconcileFramework";

const DRAFT_STORAGE_KEY = "rcms_tenVs_draft";

function loadDraft(): TenVsSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TenVsSummary;
  } catch (e) {
    console.error("Failed to load 10-Vs draft", e);
    return null;
  }
}

function saveDraft(summary: TenVsSummary) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(summary));
  } catch (e) {
    console.error("Failed to save 10-Vs draft", e);
  }
}

interface TenVDimensionState {
  id: string;
  score: SeverityScore;
  note: string;
}

function computeOverallScore(dimensions: TenVDimensionState[]): SeverityScore {
  if (!dimensions || dimensions.length === 0) return 3;
  const sum = dimensions.reduce((acc, d) => acc + d.score, 0);
  const avg = sum / dimensions.length;
  const rounded = Math.round(avg);
  if (rounded <= 1) return 1;
  if (rounded >= 5) return 5;
  return rounded as SeverityScore;
}

const TenVsScreen: React.FC = () => {
  const [dimensions, setDimensions] = useState<TenVDimensionState[]>(
    TEN_VS.map((v) => ({
      id: v.id,
      score: 3,
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

  const overallScore: SeverityScore = computeOverallScore(dimensions);

  const handleScoreChange = (id: string, score: SeverityScore) => {
    setDimensions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, score } : d))
    );
    setStatus(null);
  };

  const handleNoteChange =
    (id: string) => (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDimensions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, note: value } : d))
      );
      setStatus(null);
    };

  const handleNarrativeChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNarrative(e.target.value);
    setStatus(null);
  };

  const handleSave = () => {
    const summary: TenVsSummary = {
      overallScore,
      dimensions: dimensions.map((d) => ({
        id: d.id,
        score: d.score,
        note: d.note.trim() || undefined,
      })),
      narrative: narrative.trim() || undefined,
    };

    saveDraft(summary);
    setStatus("10-Vs draft saved. This will be available for RN summaries and publishing.");
  };

  const severityOptions: { score: SeverityScore; label: string }[] = [
    { score: 1, label: "1 – Critical / Very Poor" },
    { score: 2, label: "2 – High Concern" },
    { score: 3, label: "3 – Moderate" },
    { score: 4, label: "4 – Mild / Mostly Stable" },
    { score: 5, label: "5 – Stable / Strong / Good" },
  ];

  const overallColor =
    overallScore === 1
      ? "#b91c1c"
      : overallScore === 2
      ? "#b45309"
      : overallScore === 3
      ? "#92400e"
      : overallScore === 4
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
            10-Vs Clinical Logic Engine™
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Score each V from 1 (critical / very poor) to 5 (stable / strong /
            good) using the same 1–5 scale as the 4Ps and SDOH.
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
            Overall 10-Vs Score
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: overallColor,
            }}
          >
            {overallScore} / 5
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 2fr)",
          gap: "1rem",
          alignItems: "flex-start",
        }}
      >
        {/* Left: per-V scoring */}
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
              fontSize: "0.78rem",
              fontWeight: 600,
              marginBottom: "0.4rem",
            }}
          >
            10-Vs Scoring (1–5)
          </div>

          <div
            style={{
              maxHeight: "360px",
              overflowY: "auto",
              paddingRight: "0.25rem",
            }}
          >
            {TEN_VS.map((vDef) => {
              const dim = dimensions.find((d) => d.id === vDef.id)!;
              return (
                <div
                  key={vDef.id}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: "0.45rem",
                    marginBottom: "0.45rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      {vDef.label}
                    </span>
                    <select
                      value={dim.score}
                      onChange={(e) =>
                        handleScoreChange(
                          vDef.id,
                          Number(e.target.value) as SeverityScore
                        )
                      }
                      style={{
                        fontSize: "0.78rem",
                        borderRadius: "999px",
                        border: "1px solid #cbd5e1",
                        padding: "0.15rem 0.55rem",
                      }}
                    >
                      {severityOptions.map((opt) => (
                        <option key={opt.score} value={opt.score}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      marginBottom: "0.2rem",
                    }}
                  >
                    {vDef.definition}
                  </div>
                  <textarea
                    value={dim.note}
                    onChange={handleNoteChange(vDef.id)}
                    rows={2}
                    placeholder="Optional RN note on this V."
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      padding: "0.35rem",
                      fontSize: "0.78rem",
                      resize: "vertical",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: global RN narrative */}
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
              fontSize: "0.78rem",
              fontWeight: 600,
              marginBottom: "0.3rem",
            }}
          >
            RN 10-Vs Narrative (Attorney-Facing)
          </div>
          <textarea
            value={narrative}
            onChange={handleNarrativeChange}
            rows={10}
            placeholder="Describe how the 10-Vs scores (1–5) affect care engagement and the clinical story for this client."
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
            This narrative appears in the Attorney Console as part of the
            clinically informed care narrative.
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
            The 10-Vs scores and narrative will feed into the Clinical Intelligence
            Engine and Attorney Console. Overall 10-Vs score is the average of all
            10 Vs (1–5).
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
          Save 10-Vs Draft
        </button>
      </div>
    </div>
  );
};

export default TenVsScreen;
