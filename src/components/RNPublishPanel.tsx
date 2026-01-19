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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  isEditableRNStatus,
  isReleasableRNStatus,
  isReleasedOrClosed,
  getRNStatusLabel,
} from "@/lib/rnCaseStatus";
import { getLatestReleasedForChain, getCurrentDraftInChain, type LatestReleasedCase } from "@/lib/rnCaseHelpers";

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
  released_by_rn_id: string | null;
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

interface RNPublishPanelProps {
  onCaseChange?: () => void;
}

const RNPublishPanel: React.FC<RNPublishPanelProps> = ({ onCaseChange }) => {
  const [fourPsDraft, setFourPsDraft] = useState<FourPsSummary | null>(null);
  const [tenVsDraft, setTenVsDraft] = useState<TenVsSummary | null>(null);
  const [sdohDraft, setSdohDraft] = useState<SdohSummary | null>(null);
  const [crisisDraft, setCrisisDraft] = useState<CrisisSummary | null>(null);
  const [currentCase, setCurrentCase] = useState<RCCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showMarkReadyDialog, setShowMarkReadyDialog] = useState(false);
  const [latestReleased, setLatestReleased] = useState<LatestReleasedCase | null>(null);
  const [viewingReleasedId, setViewingReleasedId] = useState<string | null>(null);
  const [originalDraftId, setOriginalDraftId] = useState<string | null>(null);
  const { toast } = useToast();

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
        .eq("is_superseded", false)
        .single();

      if (error) throw error;
      if (!data) {
        setStatus("Case not found.");
        setCurrentCase(null);
        return;
      }

      const loadedCase = data as RCCase;

      // Guardrail: If loaded case is released/closed, warn and suggest revising
      if (isReleasedOrClosed(loadedCase.case_status)) {
        setStatus(
          `Warning: Active case is ${loadedCase.case_status}. Released cases are read-only. Click 'Revise' to create an editable draft.`
        );
        // Still set the case so UI can show read-only state and Revise button
        setCurrentCase(loadedCase);
        // If we're viewing a released case and haven't set viewingReleasedId yet, set it
        // (this handles page reload or direct navigation to a released case)
        if (!viewingReleasedId && loadedCase.case_status === "released") {
          setViewingReleasedId(loadedCase.id);
          // Try to find the current draft in the chain to restore later
          getCurrentDraftInChain(loadedCase.id).then((draftId) => {
            if (draftId && !originalDraftId) {
              setOriginalDraftId(draftId);
            }
          });
        }
        return;
      }

      setCurrentCase(loadedCase);
      setStatus(null);
      
      // If we're now on a draft, clear viewingReleasedId if it was set
      if (viewingReleasedId && !isReleasedOrClosed(loadedCase.case_status)) {
        setViewingReleasedId(null);
        setOriginalDraftId(null);
      }
    } catch (e: any) {
      console.error("Failed to load case", e);
      const msg = typeof e?.message === "string" ? e.message : "Unknown error";
      setStatus(`Error loading case: ${msg}`);
      setCurrentCase(null);
    }
  };

  const loadLatestReleased = async () => {
    if (!currentCase?.id) {
      setLatestReleased(null);
      return;
    }

    try {
      const latest = await getLatestReleasedForChain(currentCase.id);
      setLatestReleased(latest);
    } catch (e) {
      console.error("Failed to load latest released case", e);
      setLatestReleased(null);
    }
  };

  useEffect(() => {
    loadAllDrafts();
    loadCase();
  }, []);

  useEffect(() => {
    // Load latest released when current case changes
    loadLatestReleased();
  }, [currentCase?.id]);

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
    console.log("[RN RELEASE] CONFIRM CLICKED");
    console.log("[RN RELEASE] clicked", { 
      activeCaseId: currentCase?.id, 
      case_status: currentCase?.case_status 
    });

    if (!currentCase) {
      toast({
        title: "Error",
        description: "No active case.",
        variant: "destructive",
      });
      setShowReleaseDialog(false);
      return;
    }

    if (currentCase.case_status === "released" || currentCase.case_status === "closed") {
      toast({
        title: "Cannot Release",
        description: "Case is already released or closed.",
        variant: "destructive",
      });
      setShowReleaseDialog(false);
      return;
    }

    setBusy(true);
    setBanner(null);
    setLoading(true);
    setShowReleaseDialog(false);

    console.log("[RN RELEASE] starting release...");

    try {
      // Get current RN user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const summary = buildCaseSummary();

      // Get current version from incident or default to 0
      const currentIncident = currentCase.incident || {};
      const currentVersion = currentIncident.rn_publish_version || 0;
      const nextVersion = currentVersion + 1;

      const updatedIncident = {
        ...currentIncident,
        rn_summary: summary,
        rn_publish_version: nextVersion,
        rn_last_published_at: new Date().toISOString(),
      };

      // Create a NEW released revision (immutable snapshot)
      // The released revision references the current case as its parent
      // This preserves the revision chain: draft -> released -> (new draft) -> released -> ...
      const releasedPayload = {
        case_status: "released",
        revision_of_case_id: currentCase.id,
        rn_cm_id: currentCase.rn_cm_id,
        case_type: currentCase.case_type,
        date_of_injury: currentCase.date_of_injury,
        jurisdiction: currentCase.jurisdiction,
        fourps: summary.fourPs || currentCase.fourps,
        incident: updatedIncident,
        client_id: currentCase.client_id,
        attorney_id: currentCase.attorney_id,
        released_at: new Date().toISOString(),
        released_by_rn_id: user.id,
      };

      console.log("[RN RELEASE] inserting released revision payload", releasedPayload);

      const { data: newReleasedCase, error } = await supabase
        .from("rc_cases")
        .insert(releasedPayload)
        .select("id, case_status, released_at, released_by_rn_id")
        .single();

      console.log("[RN RELEASE] insert result", { data: newReleasedCase, error });

      if (error) {
        throw error;
      }

      if (!newReleasedCase || newReleasedCase.case_status !== "released") {
        throw new Error(
          `Failed to create released revision. Status: ${newReleasedCase?.case_status || "null"}`
        );
      }

      updateLocalStorageHistory(summary);

      // Create a new draft for continued work
      // The new draft references the released revision as its parent
      // IMPORTANT: Must be created as "draft" (or "working"), NOT "ready"
      // The RN must explicitly mark it as ready before it can be released again
      
      // Build draft payload by removing fields that must not carry over
      const {
        case_status: _ignoreStatus,
        released_at: _ignoreReleasedAt,
        released_by_rn_id: _ignoreReleasedBy,
        id: _ignoreId,
        created_at: _ignoreCreatedAt,
        ...rest
      } = currentCase;

      const draftPayload = {
        ...rest,
        case_status: "draft", // MUST be "draft" - set after spread to override any accidental inheritance
        released_at: null, // MUST be null - never copy from currentCase
        released_by_rn_id: null, // MUST be null - never copy from currentCase
        revision_of_case_id: newReleasedCase.id, // Use released case as parent
      };

      // Hard guard: verify case_status is correct before insert
      if (draftPayload.case_status !== "draft") {
        throw new Error("Continuation must be draft");
      }

      console.log("[RN RELEASE] creating new draft payload", draftPayload);

      const { data: newDraft, error: draftError } = await supabase
        .from("rc_cases")
        .insert(draftPayload)
        .select("id, case_status")
        .single();

      console.log("[RN RELEASE] new draft inserted", newDraft);
      console.log("[RN RELEASE] new draft result", { draftData: newDraft, draftError });

      if (draftError) {
        throw draftError;
      }

      // Verify the new draft was created with correct status (should be "draft")
      if (newDraft && newDraft.case_status !== "draft") {
        console.error("[RN RELEASE] ERROR: New draft created with wrong status", {
          expected: "draft",
          actual: newDraft.case_status,
          draftPayload,
          returnedRow: newDraft,
        });
        
        // Safety net: correct the status if it's wrong (only for non-released rows)
        if (newDraft.case_status !== "released" && newDraft.case_status !== "closed") {
          console.warn("[RN RELEASE] Attempting to correct draft status...");
          const { error: updateError } = await supabase
            .from("rc_cases")
            .update({ case_status: "draft" })
            .eq("id", newDraft.id)
            .in("case_status", ["ready", "working", "revised"]); // Only update if not already immutable
          
          if (updateError) {
            console.error("[RN RELEASE] Failed to correct draft status", updateError);
          } else {
            // Reload to get corrected status
            newDraft.case_status = "draft";
          }
        }
      }
      
      // Note: released_at verification removed since select only returns id and case_status
      // The payload construction ensures released_at is null

      // Update active case to the new draft (if created) or keep current
      if (newDraft && typeof window !== "undefined") {
        window.localStorage.setItem("rcms_active_case_id", newDraft.id);
      }

      toast({
        title: "Released to Attorney",
        description: `Case released successfully. ${newDraft ? "New draft created for continued work." : ""}`,
      });

      setStatus(
        `Released to attorney on ${new Date(newReleasedCase.released_at).toLocaleString()}. ${
          newDraft ? "New draft created." : ""
        }`
      );

      // Reload case to show the new state (reactive update - no reload)
      await loadCase();
      
      // Notify parent component to refresh case status
      if (onCaseChange) {
        onCaseChange();
      }
      
      // Clear any existing drafts since we're on a new draft
      loadAllDrafts();
      
      console.log("[RN RELEASE] completed successfully", {
        releasedCaseId: newReleasedCase.id,
        newDraftId: newDraft?.id,
      });
    } catch (e: any) {
      console.error("[RN RELEASE] failed", e);

      const errorMessage = e?.message || e?.details || "Unknown error";
      
      toast({
        title: "Release Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setStatus(`Error releasing case: ${errorMessage}`);
      // Dialog already closed at start of function, but ensure state is consistent
    } finally {
      // ALWAYS reset in-flight state, even on error - prevents button from staying disabled
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

      // Show banner
      setBanner({ type: "success", message: `Revision created. Switching to ${newCaseId.slice(0, 8)}…` });
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Reload case to show the new state (reactive update - no reload)
      await loadCase();
      
      // Notify parent component to refresh case status
      if (onCaseChange) {
        onCaseChange();
      }
      
      // Clear any existing drafts since we're on a new draft
      loadAllDrafts();
    } catch (e) {
      console.error("Failed to create revision", e);
      setStatus("Error creating revision. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async () => {
    if (!currentCase) {
      toast({
        title: "Error",
        description: "No active case.",
        variant: "destructive",
      });
      return;
    }

    if (!isEditableRNStatus(currentCase.case_status)) {
      toast({
        title: "Cannot Mark Ready",
        description: "Case must be in an editable state (draft, working, or revised).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setShowMarkReadyDialog(false);

    try {
      const { error } = await supabase
        .from("rc_cases")
        .update({
          case_status: "ready",
        })
        .eq("id", currentCase.id)
        .in("case_status", ["draft", "working", "revised"]);

      if (error) throw error;

      toast({
        title: "Marked Ready",
        description: "Case is now ready for release to attorney.",
      });

      setStatus("Case marked as ready for release.");
      await loadCase();
      
      // Notify parent component to refresh case status
      if (onCaseChange) {
        onCaseChange();
      }
    } catch (e: any) {
      console.error("Failed to mark case as ready", e);
      const msg = typeof e?.message === "string" ? e.message : "Unknown error";
      toast({
        title: "Failed to Mark Ready",
        description: msg,
        variant: "destructive",
      });
      setStatus("Error marking case as ready. Check console.");
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
      
      // Notify parent component to refresh case status
      if (onCaseChange) {
        onCaseChange();
      }
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

  // Use status helpers for gating
  const isEditable = isEditableRNStatus(caseStatus);
  const isReleasable = isReleasableRNStatus(caseStatus);
  const isImmutable = isReleasedOrClosed(caseStatus);
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
          Workflow: <strong>draft/working → ready → released → closed</strong>
        </div>
      </div>

      {/* RN-only workflow banner - show immutable message prominently */}
      {currentCase && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: isImmutable || viewingReleasedId ? "1px solid #fbbf24" : "1px solid #3b82f6",
            background: isImmutable || viewingReleasedId ? "#fef3c7" : "#dbeafe",
            color: isImmutable || viewingReleasedId ? "#92400e" : "#1e40af",
            fontSize: "0.85rem",
            fontWeight: 500,
          }}
        >
          {isImmutable || viewingReleasedId ? (
            <>This is a released snapshot and cannot be edited.</>
          ) : (
            <>You are editing a draft. Attorneys will not see changes until you click &apos;Release to Attorney&apos;.</>
          )}
        </div>
      )}

      {/* Last Released Info - show when viewing draft and a released snapshot exists */}
      {!isImmutable && latestReleased && !viewingReleasedId && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid #10b981",
            background: "#d1fae5",
            color: "#065f46",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ marginBottom: "0.5rem", fontWeight: 500 }}>
            Last released to attorney on {new Date(latestReleased.released_at).toLocaleString()}
          </div>
          <button
            type="button"
            onClick={() => {
              // Store original draft ID
              if (currentCase?.id && typeof window !== "undefined") {
                setOriginalDraftId(currentCase.id);
                setViewingReleasedId(latestReleased.id);
                window.localStorage.setItem("rcms_active_case_id", latestReleased.id);
                // Trigger refresh
                if (onCaseChange) {
                  onCaseChange();
                }
                loadCase();
              }
            }}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid #059669",
              background: "#ffffff",
              color: "#059669",
              fontSize: "0.8rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            View released snapshot
          </button>
        </div>
      )}

      {/* Viewing Released Snapshot Banner */}
      {viewingReleasedId && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid #fbbf24",
            background: "#fef3c7",
            color: "#92400e",
            fontSize: "0.85rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ fontWeight: 500 }}>
            Viewing released snapshot (read-only)
          </div>
          <button
            type="button"
            onClick={() => {
              // Restore original draft
              if (originalDraftId && typeof window !== "undefined") {
                setViewingReleasedId(null);
                window.localStorage.setItem("rcms_active_case_id", originalDraftId);
                setOriginalDraftId(null);
                // Trigger refresh
                if (onCaseChange) {
                  onCaseChange();
                }
                loadCase();
              }
            }}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid #92400e",
              background: "#ffffff",
              color: "#92400e",
              fontSize: "0.8rem",
              cursor: "pointer",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Back to current draft
          </button>
        </div>
      )}

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
            Status: <strong>{getRNStatusLabel(caseStatus)}</strong>
          </div>
          {releasedAt && (
            <div style={{ color: "#64748b", marginTop: "0.2rem" }}>
              Released to Attorney: {releasedAt}
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

      {/* Release Confirmation Dialog */}
      <AlertDialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release to Attorney?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a released snapshot for attorneys. Further edits will require a new draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRelease} disabled={busy}>
              Release
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Ready Confirmation Dialog */}
      <AlertDialog open={showMarkReadyDialog} onOpenChange={setShowMarkReadyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Ready for Release?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the case as ready for release. You can then release it to attorneys.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkReady} disabled={loading}>
              Mark Ready
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Buttons + status */}
      {/* NEVER show workflow buttons for immutable cases or when viewing released snapshot */}
      {!isImmutable && !viewingReleasedId && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Release to Attorney - only for releasable statuses */}
            {isReleasable && (
              <button
                type="button"
                onClick={() => setShowReleaseDialog(true)}
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
                {busy ? "Releasing..." : "Release to Attorney"}
              </button>
            )}

            {/* Mark Ready for Release - for editable but not releasable */}
            {isEditable && !isReleasable && (
              <button
                type="button"
                onClick={() => setShowMarkReadyDialog(true)}
                disabled={loading}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "999px",
                  border: "none",
                  background: loading ? "#94a3b8" : "#059669",
                color: "#ffffff",
                fontSize: "0.8rem",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Marking..." : "Mark Ready for Release"}
            </button>
          )}

          {/* Note: Revise and Close buttons are NOT shown for immutable cases - they should only be accessible from other contexts if needed */}
          {/* Reload drafts - only for editable cases */}
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
      )}
    </div>
  );
};

export default RNPublishPanel;
