import React, { useState, ChangeEvent } from "react";
import {
  TEN_VS,
  SeverityScore,
  CaseSummary,
} from "../../constants/reconcileFramework";

function mergeCaseSummary(partial: Partial<CaseSummary>) {
  if (typeof window === "undefined") return;
  let existing: CaseSummary = {};
  try {
    const raw = window.localStorage.getItem("rcms_case_summary");
    if (raw) existing = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load case summary", e);
  }
  const updated: CaseSummary = {
    ...existing,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem("rcms_case_summary", JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save case summary", e);
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

  const overallScore: SeverityScore = computeOverallScore(dimensions);

  const handleScoreChange = (id: string, score: SeverityScore) => {
    setDimensions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, score } : d))
    );
  };

  const handleNoteChange =
    (id: string) => (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDimensions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, note: value } : d))
      );
    };

  const handleNarrativeChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNarrative(e.target.value);
  };

  const handleSave = () => {
    const tenVsSummary = {
      overallScore,
      dimensions: dimensions.map((d) => ({
        id: d.id,
        score: d.score,
        note: d.note.trim() || undefined,
      })),
      narrative: narrative.trim() || undefined,
    };

    mergeCaseSummary({ tenVs: tenVsSummary });

    console.log("10-Vs draft saved:", tenVsSummary);
    alert("10-Vs draft saved and shared with Attorney Console.");
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
