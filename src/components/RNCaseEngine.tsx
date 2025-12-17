// src/components/RNCaseEngine.tsx

import React, { useState } from "react";
import RNAssessmentNav from "./RNAssessmentNav";
import RNCaseSummaryPanel from "./RNCaseSummaryPanel";
import RNPublishPanel from "./RNPublishPanel";

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

  const renderTab = () => {
    switch (activeTab) {
      case "4ps":
        return <FourPsScreen />;
      case "10vs":
        return <TenVsScreen />;
      case "pain":
        return <PainDiaryScreen />;
      case "sdoh":
        return <SDOHScreen />;
      case "crisis":
        return <CrisisModeScreen />;
      case "timeline":
        return <TimelineScreen />;
      case "providers":
        return <ProviderToolsScreen />;
      default:
        return <FourPsScreen />;
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
