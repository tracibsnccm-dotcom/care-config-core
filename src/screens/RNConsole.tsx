import React, { useState, useEffect } from "react";
import RNCaseEngine from "../components/RNCaseEngine";
// RN module screens
import FourPsScreen from "./rn/FourPsScreen";
import TenVsScreen from "./rn/TenVsScreen";
import SDOHScreen from "./rn/SDOHScreen";
import CrisisModeScreen from "./rn/CrisisModeScreen";
import RnDashboardPage from "../pages/rn/RnDashboardPage";
import RNCaseRouter from "./RNCaseRouter";
import {
  FourPsSummary,
  TenVsSummary,
  SdohSummary,
  CrisisSummary,
} from "../constants/reconcileFramework";
import { supabaseGet } from "@/lib/supabaseRest";
// RNCaseEngine renders all required RN screens:
// - FourPsScreen, TenVsScreen, SDOHScreen, CrisisModeScreen (via tabs)
// - RNPublishPanel (at bottom, accessible via "Publish / Review Drafts" button)

function loadActiveCaseId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("rcms_active_case_id");
  } catch (e) {
    console.error("Failed to load active case ID", e);
    return null;
  }
}

function loadFourPsDraft(): FourPsSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("rcms_fourPs_draft");
    if (!raw) return null;
    return JSON.parse(raw) as FourPsSummary;
  } catch (e) {
    console.error("Failed to load 4Ps draft", e);
    return null;
  }
}

function loadTenVsDraft(): TenVsSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("rcms_tenVs_draft");
    if (!raw) return null;
    return JSON.parse(raw) as TenVsSummary;
  } catch (e) {
    console.error("Failed to load 10-Vs draft", e);
    return null;
  }
}

function loadSdohDraft(): SdohSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("rcms_sdoh_draft");
    if (!raw) return null;
    return JSON.parse(raw) as SdohSummary;
  } catch (e) {
    console.error("Failed to load SDOH draft", e);
    return null;
  }
}

function loadCrisisDraft(): CrisisSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("rcms_crisis_draft");
    if (!raw) return null;
    return JSON.parse(raw) as CrisisSummary;
  } catch (e) {
    console.error("Failed to load Crisis draft", e);
    return null;
  }
}

interface RCCaseOption {
  id: string;
  case_status: string | null;
  created_at: string;
  case_number: string | null;
}

const RNConsole: React.FC = () => {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [path, setPath] = useState<string>(() => window.location.pathname);
  const [fourPsDraft, setFourPsDraft] = useState<FourPsSummary | null>(null);
  const [tenVsDraft, setTenVsDraft] = useState<TenVsSummary | null>(null);
  const [sdohDraft, setSdohDraft] = useState<SdohSummary | null>(null);
  const [crisisDraft, setCrisisDraft] = useState<CrisisSummary | null>(null);
  const [rcCases, setRcCases] = useState<RCCaseOption[]>([]);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [intakeData, setIntakeData] = useState<any>(null);

  // Sync path with pathname changes
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const loadAllDrafts = () => {
    setFourPsDraft(loadFourPsDraft());
    setTenVsDraft(loadTenVsDraft());
    setSdohDraft(loadSdohDraft());
    setCrisisDraft(loadCrisisDraft());
  };

  // Load cases from Supabase on mount
  useEffect(() => {
    const loadCases = async () => {
      try {
        const { data, error } = await supabaseGet<RCCaseOption[]>(
          'rc_cases',
          'select=id,case_status,created_at,case_number&order=created_at.desc&limit=25'
        );

        if (error) throw error;
        setRcCases(data || []);
        setCaseError(null);
      } catch (e: any) {
        console.error("Failed to load cases", e);
        setCaseError(e?.message || "Failed to load cases");
      }
    };

    loadCases();

    // Preselect if localStorage already has a case ID
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("rcms_active_case_id");
      if (stored) {
        setSelectedCaseId(stored);
      }
    }
  }, []);

  // Load intake data when a case is selected
  useEffect(() => {
    if (!selectedCaseId) {
      setIntakeData(null);
      return;
    }
    
    const loadIntakeData = async () => {
      try {
        const { data, error } = await supabaseGet(
          'rc_client_intakes',
          `select=intake_json,intake_submitted_at,attorney_attested_at&case_id=eq.${selectedCaseId}&limit=1`
        );
        
        if (error) {
          console.error('RNConsole: Failed to load intake data:', error);
          setIntakeData(null);
          return;
        }
        
        const intake = Array.isArray(data) ? data[0] : data;
        setIntakeData(intake);
        console.log('RNConsole: Loaded intake data', intake);
      } catch (err) {
        console.error('RNConsole: Error loading intake data:', err);
        setIntakeData(null);
      }
    };
    
    loadIntakeData();
  }, [selectedCaseId]);

  useEffect(() => {
    setActiveCaseId(loadActiveCaseId());
    loadAllDrafts();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "rcms_active_case_id") {
        setActiveCaseId(loadActiveCaseId());
      } else if (
        e.key === "rcms_fourPs_draft" ||
        e.key === "rcms_tenVs_draft" ||
        e.key === "rcms_sdoh_draft" ||
        e.key === "rcms_crisis_draft"
      ) {
        loadAllDrafts();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleRefreshDrafts = () => {
    loadAllDrafts();
  };

  const handleClearAllDrafts = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem("rcms_fourPs_draft");
      window.localStorage.removeItem("rcms_tenVs_draft");
      window.localStorage.removeItem("rcms_sdoh_draft");
      window.localStorage.removeItem("rcms_crisis_draft");
      loadAllDrafts();
    } catch (e) {
      console.error("Failed to clear drafts", e);
    }
  };

  // If pathname starts with "/rn/case/", use RNCaseRouter instead of normal RNConsole UI
  if (path.startsWith("/rn/case/")) {
    return <RNCaseRouter />;
  }

  // If pathname is "/rn-dashboard" or "/rn", render the dashboard
  if (path === "/rn-dashboard" || path === "/rn") {
    return <RnDashboardPage />;
  }

  // Only require activeCaseId if we're showing the default RNCaseEngine view
  // Pathname-based routes (4ps, 10vs, sdoh, crisis) don't need activeCaseId
  const activeTab: "4ps" | "10vs" | "sdoh" | "crisis" | null =
    path === "/rn/4ps"
      ? "4ps"
      : path === "/rn/10vs"
      ? "10vs"
      : path === "/rn/sdoh"
      ? "sdoh"
      : path === "/rn/crisis"
      ? "crisis"
      : null;

  // Always render RNCaseEngine - show warning banner if no active case but don't block UI
  const showNoCaseWarning = !activeCaseId && activeTab === null;

  const handleShowPublishPanel = () => {
    // Scroll to the bottom of the page where RNPublishPanel is rendered in RNCaseEngine
    setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const handleTabClick = (tab: "4ps" | "10vs" | "sdoh" | "crisis") => {
    // Fallback to non-case route (for backwards compatibility)
    window.history.pushState({}, "", `/rn/${tab}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleBackToHome = () => {
    window.history.pushState({}, "", "/rn");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const renderActiveScreen = () => {
    if (path === "/rn" || path === "/rn/dashboard") {
      return <RnDashboardPage />;
    } else if (path === "/rn/4ps") {
      // Legacy routes (for backwards compatibility)
      return <FourPsScreen />;
    } else if (path === "/rn/10vs") {
      return <TenVsScreen />;
    } else if (path === "/rn/sdoh") {
      return <SDOHScreen />;
    } else if (path === "/rn/crisis") {
      return <CrisisModeScreen />;
    } else {
      // Default to RNCaseEngine (always render tabs/screens + publish panel)
      return <RNCaseEngine />;
    }
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {/* Case Picker */}
      <div style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 12, background: "#ffffff" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
          Select a case
        </div>

        <select
          value={selectedCaseId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedCaseId(id);
            if (typeof window !== "undefined" && id) {
              window.localStorage.setItem("rcms_active_case_id", id);
              window.location.reload();
            }
          }}
          style={{
            width: "100%",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            padding: "0.55rem 0.75rem",
            fontSize: "0.9rem",
            background: "#ffffff",
            color: "#0f172a",
          }}
        >
          <option value="">Select a case...</option>
          {rcCases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.case_number || c.id.slice(0, 8) + '…'} — {c.case_status ?? "unknown"} — {new Date(c.created_at).toLocaleDateString()}
            </option>
          ))}
        </select>

        {caseError && (
          <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#b91c1c" }}>
            {caseError}
          </div>
        )}
      </div>

      {/* Warning banner if no active case (non-blocking) */}
      {showNoCaseWarning && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "#fef3c7",
            borderBottom: "1px solid #fbbf24",
            fontSize: "0.85rem",
            color: "#92400e",
            textAlign: "center",
          }}
        >
          No active case selected
        </div>
      )}
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e2e8f0", background: "#ffffff" }}>
        {/* Only show tab buttons if we're in pathname-based routing mode */}
        {activeTab !== null && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <button
              type="button"
              onClick={() => handleTabClick("4ps")}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: activeTab === "4ps" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
                background: activeTab === "4ps" ? "#0f2a6a" : "#ffffff",
                color: activeTab === "4ps" ? "#ffffff" : "#0f172a",
                fontSize: "0.75rem",
                fontWeight: activeTab === "4ps" ? 600 : 500,
                cursor: "pointer",
              }}
            >
              4Ps
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("10vs")}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: activeTab === "10vs" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
                background: activeTab === "10vs" ? "#0f2a6a" : "#ffffff",
                color: activeTab === "10vs" ? "#ffffff" : "#0f172a",
                fontSize: "0.75rem",
                fontWeight: activeTab === "10vs" ? 600 : 500,
                cursor: "pointer",
              }}
            >
              10-Vs
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("sdoh")}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: activeTab === "sdoh" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
                background: activeTab === "sdoh" ? "#0f2a6a" : "#ffffff",
                color: activeTab === "sdoh" ? "#ffffff" : "#0f172a",
                fontSize: "0.75rem",
                fontWeight: activeTab === "sdoh" ? 600 : 500,
                cursor: "pointer",
              }}
            >
              SDOH
            </button>
            <button
              type="button"
              onClick={() => handleTabClick("crisis")}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: activeTab === "crisis" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
                background: activeTab === "crisis" ? "#0f2a6a" : "#ffffff",
                color: activeTab === "crisis" ? "#ffffff" : "#0f172a",
                fontSize: "0.75rem",
                fontWeight: activeTab === "crisis" ? 600 : 500,
                cursor: "pointer",
              }}
            >
              Crisis
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={handleShowPublishPanel}
          style={{
            padding: "0.4rem 0.8rem",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            fontSize: "0.75rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f8fafc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ffffff";
          }}
        >
          Publish / Review Drafts
        </button>
      </div>
      <div style={{ padding: "1.5rem" }}>
        {renderActiveScreen()}

        {/* RN Publish Panel - only show when in pathname-based routing mode */}
        {activeTab !== null && (
        <div
          style={{
            marginTop: "2rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "1rem",
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "0.75rem",
            }}
          >
            RN Publish Panel
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
            {/* 4Ps Draft */}
            <div
              style={{
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "0.25rem",
                }}
              >
                4Ps
              </div>
              {fourPsDraft ? (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", marginBottom: "0.25rem" }}>
                    Overall Score: {fourPsDraft.overallScore}/5
                  </div>
                  {fourPsDraft.narrative && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        marginTop: "0.25rem",
                      }}
                    >
                      {fourPsDraft.narrative}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                  No draft saved
                </div>
              )}
            </div>

            {/* 10-Vs Draft */}
            <div
              style={{
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "0.25rem",
                }}
              >
                10-Vs
              </div>
              {tenVsDraft ? (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", marginBottom: "0.25rem" }}>
                    Overall Score: {tenVsDraft.overallScore}/5
                  </div>
                  {tenVsDraft.narrative && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        marginTop: "0.25rem",
                      }}
                    >
                      {tenVsDraft.narrative}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                  No draft saved
                </div>
              )}
            </div>

            {/* SDOH Draft */}
            <div
              style={{
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "0.25rem",
                }}
              >
                SDOH
              </div>
              {sdohDraft ? (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", marginBottom: "0.25rem" }}>
                    Overall Score: {sdohDraft.overallScore}/5
                  </div>
                  {sdohDraft.narrative && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        marginTop: "0.25rem",
                      }}
                    >
                      {sdohDraft.narrative}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                  No draft saved
                </div>
              )}
            </div>

            {/* Crisis Draft */}
            <div
              style={{
                padding: "0.75rem",
                background: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "0.25rem",
                }}
              >
                Crisis
              </div>
              {crisisDraft ? (
                <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                  Severity Score: {crisisDraft.severityScore}/5
                </div>
              ) : (
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                  No draft saved
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={handleRefreshDrafts}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "0.75rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              Refresh drafts
            </button>
            <button
              type="button"
              onClick={handleClearAllDrafts}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid #dc2626",
                background: "#ffffff",
                color: "#dc2626",
                fontSize: "0.75rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fef2f2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              Clear all drafts
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default RNConsole;
