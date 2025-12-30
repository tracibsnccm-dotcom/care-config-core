// src/screens/rn/SDOHScreen.tsx

import React, { useEffect, useState } from "react";
import {
  SeverityScore,
  SdohSummary,
  getSeverityLabel,
} from "../../constants/reconcileFramework";

const SCORE_OPTIONS: SeverityScore[] = [1, 2, 3, 4, 5];

// Where the attorney-facing summary lives (what Publish Panel + Attorney Console use)
const SDOH_DRAFT_KEY = "rcms_sdoh_draft";

// Where the detailed RN answers live so the RN can come back and see what they scored
const SDOH_RAW_KEY = "rcms_sdoh_raw";

type SdohDomainId =
  | "economic"
  | "education"
  | "healthcare"
  | "neighborhood"
  | "social";

interface SdohQuestion {
  id: string;
  domainId: SdohDomainId;
  label: string;
}

interface DomainConfig {
  id: SdohDomainId;
  title: string;
  description: string;
  questions: SdohQuestion[];
}

const DOMAINS: DomainConfig[] = [
  {
    id: "economic",
    title: "Economic Stability",
    description:
      "Income, employment, and ability to afford basic needs that support treatment and recovery.",
    questions: [
      {
        id: "econ_basic_needs",
        domainId: "economic",
        label:
          "Are they able to afford basic needs such as food, utilities, and personal essentials?",
      },
      {
        id: "econ_delay_care",
        domainId: "economic",
        label:
          "Have financial concerns caused them to delay or skip medical care?",
      },
      {
        id: "econ_job_stability",
        domainId: "economic",
        label:
          "Is their employment stable enough to support ongoing treatment needs?",
      },
    ],
  },
  {
    id: "education",
    title: "Education Access & Quality",
    description:
      "Literacy, language, and ability to understand and act on health information.",
    questions: [
      {
        id: "edu_health_literacy",
        domainId: "education",
        label:
          "Do they feel confident understanding medical instructions and health information?",
      },
      {
        id: "edu_language_barrier",
        domainId: "education",
        label:
          "Are language or literacy barriers affecting their ability to follow care recommendations?",
      },
      {
        id: "edu_system_navigation",
        domainId: "education",
        label:
          "Does their level of education or training limit their ability to navigate medical or legal processes?",
      },
    ],
  },
  {
    id: "healthcare",
    title: "Health Care Access & Quality",
    description:
      "Access to providers, treatments, and medications in a way that supports the plan of care.",
    questions: [
      {
        id: "hc_access_providers",
        domainId: "healthcare",
        label:
          "Do they have reliable access to primary care and needed specialists?",
      },
      {
        id: "hc_treatment_barriers",
        domainId: "healthcare",
        label:
          "Have they been unable to obtain treatments, medications, or referrals due to insurance or cost?",
      },
      {
        id: "hc_transport_impact",
        domainId: "healthcare",
        label:
          "Do transportation issues cause missed or delayed appointments?",
      },
    ],
  },
  {
    id: "neighborhood",
    title: "Neighborhood & Built Environment",
    description:
      "Housing safety, environmental hazards, and neighborhood factors that help or hinder recovery.",
    questions: [
      {
        id: "nb_housing_safety",
        domainId: "neighborhood",
        label:
          "Is their housing safe, stable, and free of hazards (mold, pests, violence)?",
      },
      {
        id: "nb_environment_impact",
        domainId: "neighborhood",
        label:
          "Do environmental factors (noise, pollution, unsafe area) limit sleep, mobility, or recovery?",
      },
      {
        id: "nb_transport_support",
        domainId: "neighborhood",
        label:
          "Is transportation in their area reliable enough to support treatment adherence?",
      },
    ],
  },
  {
    id: "social",
    title: "Social & Community Context",
    description:
      "Support, relationships, stressors, and discrimination that affect their ability to engage in care.",
    questions: [
      {
        id: "soc_support",
        domainId: "social",
        label:
          "Do they have reliable social support for daily needs and recovery?",
      },
      {
        id: "soc_conflict",
        domainId: "social",
        label:
          "Are there conflicts or stressors at home or work affecting their ability to engage in care?",
      },
      {
        id: "soc_discrimination",
        domainId: "social",
        label:
          "Have they experienced discrimination or bias that affects their care or well-being?",
      },
    ],
  },
];

interface QuestionState {
  id: string;
  domainId: SdohDomainId;
  score: SeverityScore | null;
}

interface RawSdohDraft {
  questions: QuestionState[];
  narrative: string;
}

function loadRawSdohDraft(): RawSdohDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SDOH_RAW_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RawSdohDraft;
  } catch (e) {
    console.error("Failed to load raw SDOH draft", e);
    return null;
  }
}

function saveRawSdohDraft(data: RawSdohDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SDOH_RAW_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save raw SDOH draft", e);
  }
}

function saveSdohSummary(summary: SdohSummary) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SDOH_DRAFT_KEY, JSON.stringify(summary));
  } catch (e) {
    console.error("Failed to save SDOH summary draft", e);
  }
}

// Average of scores for a domain (1–5), or null if none selected
function computeDomainScore(
  domainId: SdohDomainId,
  questions: QuestionState[]
): number | null {
  const scores = questions
    .filter((q) => q.domainId === domainId && typeof q.score === "number")
    .map((q) => q.score as SeverityScore);
  if (scores.length === 0) return null;
  const total = scores.reduce((sum, s) => sum + s, 0);
  const avg = total / scores.length;
  return Math.round(avg * 10) / 10; // one decimal place
}

// Overall SDOH score = worst (lowest) domain score
function computeOverallSdohScore(questions: QuestionState[]): SeverityScore | null {
  const domainScores: number[] = [];
  for (const d of DOMAINS) {
    const ds = computeDomainScore(d.id, questions);
    if (ds != null) domainScores.push(ds);
  }
  if (domainScores.length === 0) return null;
  const worst = domainScores.reduce((min, s) => (s < min ? s : min), domainScores[0]);
  // clamp to nearest SeverityScore
  const rounded = Math.round(worst);
  const valid = [1, 2, 3, 4, 5].includes(rounded) ? (rounded as SeverityScore) : null;
  return valid;
}

const SDOHScreen: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionState[]>(() =>
    DOMAINS.flatMap((d) =>
      d.questions.map((q) => ({
        id: q.id,
        domainId: q.domainId,
        score: null,
      }))
    )
  );

  const [narrative, setNarrative] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  // Hydrate from raw draft so RN can see prior selections
  useEffect(() => {
    const raw = loadRawSdohDraft();
    if (!raw) return;

    setNarrative(raw.narrative || "");
    setQuestions((prev) =>
      prev.map((q) => {
        const match = raw.questions.find((r) => r.id === q.id);
        if (!match) return q;
        return { ...q, score: match.score };
      })
    );
  }, []);

  const overallScore = computeOverallSdohScore(questions);
  const severityLabel = overallScore ? getSeverityLabel(overallScore) : null;

  const domainScores = DOMAINS.map((d) => {
    const score = computeDomainScore(d.id, questions);
    return {
      id: d.id,
      title: d.title,
      score,
      label: score ? getSeverityLabel(Math.round(score) as SeverityScore) : null,
    };
  });

  const handleScoreChange = (questionId: string, value: string) => {
    const num = Number(value);
    const valid = SCORE_OPTIONS.includes(num as SeverityScore)
      ? (num as SeverityScore)
      : null;

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              score: valid,
            }
          : q
      )
    );
    setStatus(null);
  };

  const handleSaveDraft = () => {
    const finalOverall = overallScore;
    if (!finalOverall) {
      setStatus("Please score at least one SDOH item before saving.");
      return;
    }

    const raw: RawSdohDraft = {
      questions,
      narrative,
    };

    const summary: SdohSummary = {
      overallScore: finalOverall,
      narrative: narrative || undefined,
    };

    saveRawSdohDraft(raw);
    saveSdohSummary(summary);

    setStatus(
      "SDOH draft saved. This will be used in the RN publish panel and Attorney Console."
    );
  };

  return (
    <div>
      {/* Header */}
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
          Social Determinants of Health (SDOH) – RN Assessment
        </h2>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#64748b",
            maxWidth: "52rem",
          }}
        >
          Score SDOH on the same 1–5 severity scale as the Ps and Vs, where{" "}
          <strong>1 = Critical / Very Poor</strong> and{" "}
          <strong>5 = Stable / Strong / Good</strong>. SDOH does{" "}
          <strong>not change</strong> clinical Ps or Vs scores, but it{" "}
          <strong>does</strong> change overall risk and priority. The overall
          SDOH score follows the <strong>worst (lowest) domain score</strong>.
        </p>
      </div>

      {/* Overall + domain summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.2fr)",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            padding: "0.6rem 0.75rem",
            fontSize: "0.8rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#64748b",
              marginBottom: "0.15rem",
            }}
          >
            Overall SDOH Severity
          </div>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "0.2rem",
            }}
          >
            {overallScore ? (
              <>
                {severityLabel
                  ? `${severityLabel} (${overallScore}/5)`
                  : `Overall SDOH: ${overallScore}/5`}
              </>
            ) : (
              "No overall SDOH score yet – score at least one domain."
            )}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#64748b",
            }}
          >
            A single severely compromised domain (1–2/5) can undermine an
            otherwise strong plan. Use this score when explaining environmental
            risk to the attorney.
          </div>
        </div>

        <div
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "0.6rem 0.75rem",
            fontSize: "0.78rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#64748b",
              marginBottom: "0.2rem",
            }}
          >
            Domain-level Snapshot
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.1rem",
              color: "#0f172a",
            }}
          >
            {domainScores.map((d) => (
              <li key={d.id} style={{ marginBottom: "0.12rem" }}>
                <strong>{d.title}:</strong>{" "}
                {d.score
                  ? `${d.score}/5${d.label ? ` – ${d.label}` : ""}`
                  : "not yet scored"}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Domain cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {DOMAINS.map((domain) => (
          <div
            key={domain.id}
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
              {domain.title}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                marginBottom: "0.4rem",
              }}
            >
              {domain.description}
            </div>

            {domain.questions.map((q) => {
              const state = questions.find((qs) => qs.id === q.id);
              const value = state?.score ?? null;

              return (
                <div
                  key={q.id}
                  style={{
                    marginBottom: "0.4rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.76rem",
                      color: "#0f172a",
                      marginBottom: "0.15rem",
                    }}
                  >
                    {q.label}
                  </div>
                  <select
                    value={value ?? ""}
                    onChange={(e) => handleScoreChange(q.id, e.target.value)}
                    style={{
                      padding: "0.25rem 0.4rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem",
                    }}
                  >
                    <option value="">Select severity (1–5)…</option>
                    {SCORE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Narrative + save */}
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
          RN SDOH Narrative (attorney-facing)
        </label>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#64748b",
            marginBottom: "0.25rem",
          }}
        >
          Summarize how SDOH is affecting the case: which domains are most
          compromised, where there is support, and how this environment may help
          or hurt adherence, recovery, and case viability.
        </p>
        <textarea
          value={narrative}
          onChange={(e) => {
            setNarrative(e.target.value);
            setStatus(null);
          }}
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
          Save SDOH draft
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

export default SDOHScreen;
