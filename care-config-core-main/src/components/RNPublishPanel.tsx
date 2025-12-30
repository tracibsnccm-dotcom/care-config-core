// src/components/RNPublishPanel.tsx

import React, { useEffect, useState } from "react";
import {
  CaseSummary,
  FourPsSummary,
  TenVsSummary,
  SdohSummary,
  CrisisSummary,
  getSeverityLabel,
} from "../constants/reconcileFramework";

const FOUR_PS_DRAFT_KEY = "rcms_fourPs_draft";
const TEN_VS_DRAFT_KEY = "rcms_tenVs_draft";
const SDOH_DRAFT_KEY = "rcms_sdoh_draft";
const CRISIS_DRAFT_KEY = "rcms_crisis_draft";

interface StoredVersion {
  version: number;
  publishedAt: string;
  summary: CaseSummary;
}

function loadFourPsDraft(): FourPsSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FOUR_PS_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FourPsSummary;
  } catch (e) {
    console.error("Failed to load 4Ps draft in publish panel", e);
    return null;
  }
}

function loadTenVsDraft(): TenVsSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TEN_VS_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TenVsSummary;
  } catch (e) {
    console.error("Failed to load 10-Vs draft in publish panel", e);
    return null;
  }
}

function loadSdohDraft(): SdohSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SDOH_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SdohSummary;
  } catch (e) {
    console.error("Failed to load SDOH draft in publish panel", e);
    return null;
  }
}

function loadCrisisDraft(): CrisisSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CRISIS_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CrisisSummary;
  } catch (e) {
    console.error("Failed to load Crisis draft in publish panel", e);
    return null;
  }
}

const RNPublishPanel: React.FC = () => {
  const [fourPsDraft, setFourPsDraft] = useState<FourPsSummary | null>(null);
  const [tenVsDraft, setTenVsDraft] = useState<TenVsSummary | null>(null);
  const [sdohDraft, setSdohDraft] = useState<SdohSummary | null>(null);
  const [crisisDraft, setCrisisDraft] = useState<CrisisSummary | null>(null);

  const [status, setStatus] = useState<string | null>(null);

  const loadAllDrafts = () => {
    setFourPsDraft(loadFourPsDraft());
    setTenVsDraft(loadTenVsDraft());
    setSdohDraft(loadSdohDraft());
    setCrisisDraft(loadCrisisDraft());
  };

  // Load drafts when panel mounts
  useEffect(() => {
    loadAllDrafts();
  }, []);

  const handlePublish = () => {
    // Always grab the freshest drafts right before publishing
    const latestFourPs = loadFourPsDraft();
    const latestTenVs = loadTenVsDraft();
    const latestSdoh = loadSdohDraft();
    const latestCrisis = loadCrisisDraft();

    const summary: CaseSummary = {
      fourPs: latestFourPs ?? undefined,
      tenVs: latestTenVs ?? undefined,
      sdoh: latestSdoh ?? undefined,
      crisis: latestCrisis ?? undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (typeof window === "undefined") {
        setStatus("Unable to publish (no window).");
        return;
      }

      const rawHistory = window.localStorage.getItem(
        "rcms_case_summary_versions"
      );
      let history: StoredVersion[] = [];

      if (rawHistory) {
        try {
          history = JSON.parse(rawHistory) as StoredVersion[];
        } catch (e) {
          console.error("Failed to parse existing summary versions", e);
          history = [];
        }
      }

      const nextVersion =
        history.length > 0 ? history[history.length - 1].version + 1 : 1;

      const record: StoredVersion = {
        version: nextVersion,
        publishedAt: new Date().toISOString(),
        summary,
      };

      const newHistory = [...history, record];

      // Save latest summary (what Attorney Console + RN summary card read)
      window.localStorage.setItem(
        "rcms_case_summary",
        JSON.stringify(summary)
      );

      // Save version history
      window.localStorage.setItem(
        "rcms_case_summary_versions",
        JSON.stringify(newHistory)
      );

      setStatus(
        `Published as version v${nextVersion}. Attorney Console is now up to date.`
      );
    } catch (e) {
      console.error("Failed to publish RN case summary", e);
      setStatus("Error publishing summary. Check console.");
    }
  };

  const renderScoreLine = (
    label: string,
    score: number | null | undefined
  ) => {
    if (!score) {
      return (
        <div
          style={{
            fontSize: "0.78rem",
            color: "#94a3b8",
          }}
        >
          {label}: not yet scored
        </div>
      );
    }
    const sevLabel = getSeverityLabel(score as any);
    return (
      <div
        style={{
          fontSize: "0.78rem",
          color: "#0f172a",
        }}
      >
        {label}:{" "}
        <strong>
          {score}/5{sevLabel ? ` – ${sevLabel}` : ""}
        </strong>
      </div>
    );
  };

  const fourPsOverall = fourPsDraft?.overallScore ?? null;
  const tenVsOverall = tenVsDraft?.overallScore ?? null;
  const sdohOverall = sdohDraft?.overallScore ?? null;
  const crisisSeverity = crisisDraft?.severityScore ?? null;

  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        background: "#ffffff",
        padding: "1rem 1.1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.75rem",
          marginBottom: "0.5rem",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#64748b",
              marginBottom: "0.15rem",
            }}
          >
            RN → Attorney Publish Panel
          </div>
          <div
            style={{
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Publish latest RN drafts to Attorney Console
          </div>
        </div>
        <div
          style={{
            fontSize: "0.72rem",
            color: "#64748b",
            textAlign: "right",
          }}
        >
          4Ps, 10-Vs, SDOH, and Crisis scores & narratives are taken directly
          from the RN screens. Update them there, save drafts, then publish
          here.
        </div>
      </div>

      {/* Snapshot of what will be published */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.2fr)",
          gap: "0.75rem",
          marginBottom: "0.75rem",
          fontSize: "0.78rem",
        }}
      >
        <div
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            padding: "0.6rem 0.75rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: "0.25rem",
            }}
          >
            4Ps & 10-Vs Snapshot
          </div>
          {renderScoreLine("4Ps overall", fourPsOverall)}
          {renderScoreLine("10-Vs overall", tenVsOverall)}
          {!fourPsOverall && !tenVsOverall && (
            <div
              style={{
                fontSize: "0.76rem",
                color: "#94a3b8",
                marginTop: "0.2rem",
              }}
            >
              Complete the 4Ps and 10-Vs tabs in the RN engine and save drafts
              to populate these scores.
            </div>
          )}
        </div>

        <div
          style={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "0.6rem 0.75rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: "0.25rem",
            }}
          >
            SDOH & Crisis Snapshot
          </div>
          {renderScoreLine("SDOH overall", sdohOverall)}
          {renderScoreLine("Crisis severity (max)", crisisSeverity)}
          {!sdohOverall && !crisisSeverity && (
            <div
              style={{
                fontSize: "0.76rem",
                color: "#94a3b8",
                marginTop: "0.2rem",
              }}
            >
              Complete the SDOH and Crisis tabs in the RN engine and save drafts
              to populate these scores.
            </div>
          )}
        </div>
      </div>

      {/* Narratives info */}
      <div
        style={{
          marginBottom: "0.85rem",
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
            color: "#64748b",
            marginBottom: "0.25rem",
          }}
        >
          Narratives that will be sent
        </div>
        <ul
          style={{
            paddingLeft: "1.1rem",
            margin: 0,
            listStyle: "disc",
            color: "#0f172a",
          }}
        >
          <li>
            <strong>4Ps narrative:</strong>{" "}
            {fourPsDraft?.narrative
              ? "present (from 4Ps screen)."
              : "not provided yet."}
          </li>
          <li>
            <strong>10-Vs narrative:</strong>{" "}
            {tenVsDraft?.narrative
              ? "present (from 10-Vs screen)."
              : "not provided yet."}
          </li>
          <li>
            <strong>SDOH narrative:</strong>{" "}
            {sdohDraft?.narrative
              ? "present (from SDOH screen)."
              : "not provided yet."}
          </li>
        </ul>
        <div
          style={{
            marginTop: "0.3rem",
            fontSize: "0.74rem",
            color: "#64748b",
          }}
        >
          To change these narratives, edit them directly in the RN 4Ps / 10-Vs /
          SDOH screens and save the drafts again.
        </div>
      </div>

      {/* Buttons + status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={handlePublish}
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
            Publish latest drafts to Attorney Console
          </button>
          <button
            type="button"
            onClick={() => {
              loadAllDrafts();
              setStatus("Reloaded latest RN drafts.");
            }}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            Reload drafts
          </button>
        </div>
        {status && (
          <div
            style={{
              fontSize: "0.76rem",
              color: status.startsWith("Error")
                ? "#b91c1c"
                : status.startsWith("Unable")
                ? "#b45309"
                : "#16a34a",
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

export default RNPublishPanel;
