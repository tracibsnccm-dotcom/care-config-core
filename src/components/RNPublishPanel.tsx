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
import { supabase } from "@/integrations/supabase/client";

const FOUR_PS_DRAFT_KEY = "rcms_fourPs_draft";
const TEN_VS_DRAFT_KEY = "rcms_tenVs_draft";
const SDOH_DRAFT_KEY = "rcms_sdoh_draft";
const CRISIS_DRAFT_KEY = "rcms_crisis_draft";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeCaseId(raw: string | null): string | null {
  if (!raw) return null;
  const v = String(raw).trim().replace(/^"+|"+$/g, "");
  if (!v) return null;
  return UUID_RE.test(v) ? v : null;
}

interface StoredVersion {
  version: number;
  publishedAt: string;
  summary: CaseSummary;
}

interface RCCase {
  id: string;
  case_status: string | null;
  fourps: any;
  incident: any;
  revision_of_case_id: string | null;
  rn_cm_id: string | null;
  case_type: string | null;
  date_of_injury: string | null;
  jurisdiction: string | null;
  released_at: string | null;
  client_id: string | null;
  attorney_id: string | null;
  created_at: string;
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
  const [currentCase, setCurrentCase] = useState<RCCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const loadAllDrafts = () => {
    setFourPsDraft(loadFourPsDraft());
    setTenVsDraft(loadTenVsDraft());
    setSdohDraft(loadSdohDraft());
    setCrisisDraft(loadCrisisDraft());
  };

  const loadCase = async () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("rcms_active_case_id");
    const caseId = normalizeCaseId(raw);
    if (!caseId) {
      setStatus("No active case selected.");
      setCurrentCase(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("rc_cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (error) throw error;
      if (!data) {
        setStatus("Case not found.");
        setCurrentCase(null);
        return;
      }

      setCurrentCase(data as RCCase);
      setStatus(null);
    } catch (e: any) {
      console.error("Failed to load case", e);
      const msg = typeof e?.message === "string" ? e.message : "Unknown error";
      setStatus(`Error loading case: ${msg}`);
      setCurrentCase(null);
    }
  };

  useEffect(() => {
    loadAllDrafts();
    loadCase();
  }, []);

  const buildCaseSummary = (): CaseSummary => {
    const latestFourPs = loadFourPsDraft();
    const latestTenVs = loadTenVsDraft();
    const latestSdoh = loadSdohDraft();
    const latestCrisis = loadCrisisDraft();

    return {
      fourPs: latestFourPs ?? undefined,
      tenVs: latestTenVs ?? undefined,
      sdoh: latestSdoh ?? undefined,
      crisis: latestCrisis ?? undefined,
      updatedAt: new Date().toISOString(),
    };
  };

  const updateLocalStorageHistory = (summary: CaseSummary) => {
    if (typeof window === "undefined") return;

    try {
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

      window.localStorage.setItem(
        "rcms_case_summary",
        JSON.stringify(summary)
      );

      window.localStorage.setItem(
        "rcms_case_summary_versions",
        JSON.stringify(newHistory)
      );
    } catch (e) {
      console.error("Failed to update localStorage history", e);
    }
  };

  const handleRelease = async () => {
    if (!currentCase) {
      setStatus("No active case.");
      return;
    }

    if (currentCase.case_status === "released" || currentCase.case_status === "closed") {
      setStatus("Cannot release: case is already released or closed.");
      return;
    }

    setBusy(true);
    setBanner(null);
    setLoading(true);
    try {
      const caseIdToUpdate = currentCase?.id;

      console.log("RELEASE_CLICK", {
        currentCaseId: currentCase?.id,
        currentCaseStatus: currentCase?.case_status,
        revisionOf: currentCase?.revision_of_case_id,
      });

      if (!caseIdToUpdate) {
        setBanner({ type: "error", message: "Release failed: no active case loaded." });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setBanner({ type: "info", message: `Releasing case ${currentCase?.id} (status=${currentCase?.case_status})...` });

      const summary = buildCaseSummary();
      const isRevision = currentCase.case_status === "revised";

      // Get current version from incident or default to 1
      const currentIncident = currentCase.incident || {};
      const currentVersion = currentIncident.rn_publish_version || 0;
      const nextVersion = currentVersion + 1;

      const updatedIncident = {
        ...currentIncident,
        rn_summary: summary,
        rn_publish_version: nextVersion,
        rn_last_published_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("rc_cases")
        .update({
          case_status: "released",
          fourps: summary.fourPs || null,
          incident: updatedIncident,
          released_at: new Date().toISOString(),
        })
        .eq("id", caseIdToUpdate)
        .in("case_status", ["draft", "working", "revised"])
        .select("id, case_status, released_at");

      if (error) {
        const msg = typeof error?.message === "string" ? error.message : "Unknown error";
        setBanner({ type: "error", message: `Release failed: ${msg}` });
        window.scrollTo({ top: 0, behavior: "smooth" });
        setStatus("Error releasing case. Check console.");
        return;
      }

      if (!data || data.length !== 1) {
        const count = data?.length ?? 0;
        setBanner({ type: "error", message: `Release failed: expected 1 row updated, got ${count}` });
        window.scrollTo({ top: 0, behavior: "smooth" });
        setStatus("Error releasing case. No rows updated.");
        return;
      }

      const updatedCase = data[0];

      if (updatedCase.case_status !== "released") {
        setBanner({ type: "error", message: "Release failed: Release did not set status to released" });
        window.scrollTo({ top: 0, behavior: "smooth" });
        setStatus("Error releasing case. Status not updated.");
        return;
      }

      updateLocalStorageHistory(summary);

      setBanner({ type: "success", message: "Released successfully. Attorney view is now synced." });
      window.scrollTo({ top: 0, behavior: "smooth" });

      setStatus(
        isRevision
          ? `Revision released successfully as version v${nextVersion}.`
          : `Released successfully as version v${nextVersion}.`
      );

      await loadCase();
      window.location.reload();
    } catch (e: any) {
      console.error("Failed to release case", e);
      const msg = typeof e?.message === "string" ? e.message : "Unknown error";
      setBanner({ type: "error", message: `Release failed: ${msg}` });
      window.scrollTo({ top: 0, behavior: "smooth" });
      setStatus("Error releasing case. Check console.");
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  const handleRevise = async () => {
    if (!currentCase) {
      setStatus("No active case.");
      return;
    }

    if (currentCase.case_status !== "released") {
      setStatus("Can only revise released cases.");
      return;
    }

    setLoading(true);
    try {
      const { data: newCase, error } = await supabase
        .from("rc_cases")
        .insert({
          case_status: "draft",
          revision_of_case_id: currentCase.id,
          rn_cm_id: currentCase.rn_cm_id,
          case_type: currentCase.case_type,
          date_of_injury: currentCase.date_of_injury,
          jurisdiction: currentCase.jurisdiction,
          fourps: currentCase.fourps,
          incident: currentCase.incident,
          client_id: currentCase.client_id || null,
          attorney_id: currentCase.attorney_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      if (!newCase) throw new Error("Failed to create revision");

      const newCaseId = newCase.id;

      // Update active case for RN session
      if (typeof window !== "undefined") {
        window.localStorage.setItem("rcms_active_case_id", newCaseId);
      }

      // Show banner and reload to switch to new revision
      setBanner({ type: "success", message: `Revision created. Switching to ${newCaseId.slice(0, 8)}…` });
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Force reload so RNCaseEngine re-reads case status and unlocks
      setTimeout(() => window.location.reload(), 250);
    } catch (e) {
      console.error("Failed to create revision", e);
      setStatus("Error creating revision. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!currentCase) {
      setStatus("No active case.");
      return;
    }

    if (currentCase.case_status !== "released") {
      setStatus("Can only close released cases.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("rc_cases")
        .update({
          case_status: "closed",
        })
        .eq("id", currentCase.id);

      if (error) throw error;

      setStatus("Case closed. No further edits allowed.");
      await loadCase();
    } catch (e) {
      console.error("Failed to close case", e);
      setStatus("Error closing case. Check console.");
    } finally {
      setLoading(false);
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

  const caseStatus = currentCase?.case_status || "unknown";
  const releasedAt = currentCase?.released_at
    ? new Date(currentCase.released_at).toLocaleString()
    : null;

  const isDraft = currentCase?.case_status === "draft";
  const isRevision = currentCase?.revision_of_case_id != null;

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
            RN Case Workflow
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
          Workflow: <strong>working → released → revised → released → closed</strong>
        </div>
      </div>

      {/* Case Status Display */}
      {currentCase && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
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
            Case Status
          </div>
          <div style={{ color: "#0f172a", fontWeight: 500 }}>
            Status: <strong>{caseStatus}</strong>
          </div>
          {releasedAt && (
            <div style={{ color: "#64748b", marginTop: "0.2rem" }}>
              Released: {releasedAt}
            </div>
          )}
        </div>
      )}

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

      {/* Banner */}
      {banner && (
        <div
          style={{
            marginBottom: "0.85rem",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: `1px solid ${
              banner.type === "success"
                ? "#10b981"
                : banner.type === "error"
                ? "#ef4444"
                : "#6b7280"
            }`,
            background:
              banner.type === "success"
                ? "#d1fae5"
                : banner.type === "error"
                ? "#fee2e2"
                : "#f3f4f6",
            color:
              banner.type === "success"
                ? "#065f46"
                : banner.type === "error"
                ? "#991b1b"
                : "#374151",
            fontSize: "0.85rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div style={{ flex: 1 }}>{banner.message}</div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              border: "none",
              background: "rgba(0, 0, 0, 0.1)",
              color: "inherit",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.1)";
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Buttons + status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["draft", "working", "revised"].includes(caseStatus) && (
            <button
              type="button"
              onClick={handleRelease}
              disabled={busy}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "999px",
                border: "none",
                background: busy ? "#94a3b8" : "#0f2a6a",
                color: "#ffffff",
                fontSize: "0.8rem",
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy
                ? "Releasing..."
                : isDraft
                ? "Release Draft"
                : isRevision
                ? "Release Revision"
                : "Release"}
            </button>
          )}

          {caseStatus === "released" && (
            <>
              <button
                type="button"
                onClick={handleRevise}
                disabled={loading}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "999px",
                  border: "none",
                  background: loading ? "#94a3b8" : "#0f2a6a",
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Revise
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "999px",
                  border: "none",
                  background: loading ? "#94a3b8" : "#dc2626",
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Close
              </button>
            </>
          )}

          {caseStatus !== "closed" && (
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
          )}
        </div>
        {status && (
          <div
            style={{
              fontSize: "0.76rem",
              color: status.startsWith("Error")
                ? "#b91c1c"
                : status.startsWith("Unable") || status.startsWith("Cannot") || status.startsWith("Can only")
                ? "#b45309"
                : "#16a34a",
              textAlign: "right",
              maxWidth: "400px",
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
