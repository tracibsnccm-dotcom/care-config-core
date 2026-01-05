// src/components/RNCaseEngine.tsx

import React, { useEffect, useState } from "react";
import RNAssessmentNav from "./RNAssessmentNav";
import RNCaseSummaryPanel from "./RNCaseSummaryPanel";
import RNPublishPanel from "./RNPublishPanel";
import { supabase } from "@/integrations/supabase/client";

// RN module screens
import FourPsScreen from "../screens/rn/FourPsScreen";
import TenVsScreen from "../screens/rn/TenVsScreen";
import PainDiaryScreen from "../screens/rn/PainDiaryScreen";
import SDOHScreen from "../screens/rn/SDOHScreen";
import CrisisModeScreen from "../screens/rn/CrisisModeScreen";
import TimelineScreen from "../screens/rn/TimelineScreen";
import ProviderToolsScreen from "../screens/rn/ProviderToolsScreen";

const RNCaseEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState("4ps");
  const [caseStatus, setCaseStatus] = useState<string | null>(null);

  // Load case status from Supabase to enforce read-only mode for released/closed cases
  useEffect(() => {
    const loadCaseStatus = async () => {
      if (typeof window === "undefined") return;
      const activeCaseId = window.localStorage.getItem("rcms_active_case_id");
      if (!activeCaseId) {
        setCaseStatus(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("rc_cases")
          .select("case_status")
          .eq("id", activeCaseId)
          .single();

        if (error) throw error;
        setCaseStatus(data?.case_status || null);
      } catch (e) {
        console.error("Failed to load case status", e);
        setCaseStatus(null);
      }
    };

    loadCaseStatus();
  }, []);

  // Enforce read-only mode when case is released or closed (mirrors DB constraints)
  const isReadOnly = caseStatus === "released" || caseStatus === "closed";

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
        {renderTab()}
      </div>

      {/* RN → Attorney publish panel */}
      <div style={{ marginTop: "1.5rem" }}>
        <RNPublishPanel />
      </div>
    </div>
  );
};

export default RNCaseEngine;
