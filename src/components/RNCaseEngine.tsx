// src/components/RNCaseEngine.tsx

import React, { useEffect, useState } from "react";
import RNAssessmentNav from "./RNAssessmentNav";
import RNCaseSummaryPanel from "./RNCaseSummaryPanel";
import RNPublishPanel from "./RNPublishPanel";
import { supabase } from "@/integrations/supabase/client";
import { isEditableRNStatus, isReleasedOrClosed, getRNStatusLabel } from "@/lib/rnCaseStatus";

// RN module screens
import FourPsScreen from "../screens/rn/FourPsScreen";
import TenVsScreen from "../screens/rn/TenVsScreen";
import PainDiaryScreen from "../screens/rn/PainDiaryScreen";
import SDOHScreen from "../screens/rn/SDOHScreen";
import CrisisModeScreen from "../screens/rn/CrisisModeScreen";
import TimelineScreen from "../screens/rn/TimelineScreen";
import ProviderToolsScreen from "../screens/rn/ProviderToolsScreen";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeCaseId(raw: string | null): string | null {
  if (!raw) return null;
  const v = String(raw).trim().replace(/^"+|"+$/g, "");
  if (!v) return null;
  return UUID_RE.test(v) ? v : null;
}

const RNCaseEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState("4ps");
  const [caseStatus, setCaseStatus] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load case status from Supabase to enforce read-only mode for released/closed cases
  const loadCaseStatus = async () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("rcms_active_case_id");
    const caseId = normalizeCaseId(raw);
    if (!caseId) {
      setCaseStatus(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("rc_cases")
        .select("case_status")
        .eq("id", caseId)
        .single();

      if (error) throw error;
      setCaseStatus(data?.case_status || null);
    } catch (e) {
      console.error("Failed to load case status", e);
      setCaseStatus(null);
    }
  };

  useEffect(() => {
    loadCaseStatus();
  }, [refreshKey]);

  // Enforce read-only mode when case is released or closed (mirrors DB constraints)
  // Force immutable check: case_status must be explicitly checked
  const isImmutable = caseStatus === "released" || caseStatus === "closed";
  const isReadOnly = isImmutable; // Non-bypassable read-only for immutable cases
  const isEditable = isEditableRNStatus(caseStatus);

  const renderTab = () => {
    // Pass readOnly prop to enforce read-only mode for released/closed cases (screens will accept this prop in future updates)
    const readOnlyProps = { readOnly: isReadOnly } as any;
    switch (activeTab) {
      case "4ps":
        return <FourPsScreen {...readOnlyProps} />;
      case "10vs":
        return <TenVsScreen {...readOnlyProps} />;
      case "pain":
        return <PainDiaryScreen {...readOnlyProps} />;
      case "sdoh":
        return <SDOHScreen {...readOnlyProps} />;
      case "crisis":
        return <CrisisModeScreen {...readOnlyProps} />;
      case "timeline":
        return <TimelineScreen {...readOnlyProps} />;
      case "providers":
        return <ProviderToolsScreen {...readOnlyProps} />;
      default:
        return <FourPsScreen {...readOnlyProps} />;
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
        RN Case Engine
      </h1>

      {/* RN summary card (reads latest published summary) */}
      <div style={{ marginBottom: "1rem" }}>
        <RNCaseSummaryPanel />
      </div>

      {/* RN tab navigation */}
      <RNAssessmentNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* RN-only workflow banner */}
      {caseStatus && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            background: isReadOnly ? "#fef3c7" : "#dbeafe",
            border: isReadOnly ? "1px solid #fbbf24" : "1px solid #3b82f6",
            borderRadius: "8px",
            color: isReadOnly ? "#92400e" : "#1e40af",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {isReadOnly ? (
            <>This is a released snapshot and cannot be edited. Click &apos;Revise&apos; to create an editable revision.</>
          ) : (
            <>You are editing a draft. Attorneys will not see changes until you click &apos;Release to Attorney&apos;.</>
          )}
        </div>
      )}

      {/* Active tab content */}
      <div
        style={{
          marginTop: "1.5rem",
          background: "#ffffff",
          borderRadius: "8px",
          padding: "1.5rem",
          border: "1px solid #e2e8f0",
          minHeight: "400px",
        }}
      >
        <div style={{ pointerEvents: isReadOnly ? "none" : "auto", opacity: isReadOnly ? 0.65 : 1 }}>
          {renderTab()}
        </div>
      </div>

      {/* RN → Attorney publish panel */}
      <div style={{ marginTop: "1.5rem" }}>
        <RNPublishPanel onCaseChange={() => setRefreshKey(prev => prev + 1)} />
      </div>
    </div>
  );
};

export default RNCaseEngine;
