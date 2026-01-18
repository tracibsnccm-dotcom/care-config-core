// ============================================================================
// RN CARE PLAN WORKFLOW - ROUTES AND NAVIGATION
// ============================================================================
// 
// INSTRUCTIONS FOR CURSOR:
//
// 1. Add these imports to main.tsx (near the top with other imports):
// 
//    import FourPsScreen from "./screens/rn/FourPsScreen";
//    import SDOHScreen from "./screens/rn/SDOHScreen";
//    import OverlaySelectionScreen from "./screens/rn/OverlaySelectionScreen";
//    import GuidelinesReferenceScreen from "./screens/rn/GuidelinesReferenceScreen";
//    import FinalizeCarePlanScreen from "./screens/rn/FinalizeCarePlanScreen";
//    import CarePlanWorkflow from "./components/rn/CarePlanWorkflow";
//
// 2. Add these routes inside <Routes> in main.tsx (after the /rn/case/:caseId/ten-vs route):
//
//    {/* RN Care Plan Workflow Routes */}
//    <Route path="/rn/case/:caseId/workflow" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow />
//        </AppProvider>
//      </AuthProvider>
//    } />
//    <Route path="/rn/case/:caseId/4ps" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow initialStep="4ps" />
//        </AppProvider>
//      </AuthProvider>
//    } />
//    <Route path="/rn/case/:caseId/sdoh" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow initialStep="sdoh" />
//        </AppProvider>
//      </AuthProvider>
//    } />
//    <Route path="/rn/case/:caseId/overlays" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow initialStep="overlays" />
//        </AppProvider>
//      </AuthProvider>
//    } />
//    <Route path="/rn/case/:caseId/guidelines" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow initialStep="guidelines" />
//        </AppProvider>
//      </AuthProvider>
//    } />
//    <Route path="/rn/case/:caseId/finalize" element={
//      <AuthProvider>
//        <AppProvider>
//          <CarePlanWorkflow initialStep="finalize" />
//        </AppProvider>
//      </AuthProvider>
//    } />
//
// ============================================================================

// This is the CarePlanWorkflow component that wraps all the screens
// Save this as: src/components/rn/CarePlanWorkflow.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FourPsScreen from "../../screens/rn/FourPsScreen";
import SDOHScreen from "../../screens/rn/SDOHScreen";
import OverlaySelectionScreen from "../../screens/rn/OverlaySelectionScreen";
import GuidelinesReferenceScreen from "../../screens/rn/GuidelinesReferenceScreen";
import TenVsBuilder from "./TenVsBuilder";
import FinalizeCarePlanScreen from "../../screens/rn/FinalizeCarePlanScreen";

type WorkflowStep = "4ps" | "sdoh" | "overlays" | "guidelines" | "10vs" | "finalize";

interface CarePlanWorkflowProps {
  initialStep?: WorkflowStep;
}

const STEPS: { id: WorkflowStep; label: string; number: number }[] = [
  { id: "4ps", label: "4Ps Assessment", number: 1 },
  { id: "sdoh", label: "SDOH Assessment", number: 2 },
  { id: "overlays", label: "Condition Overlays", number: 3 },
  { id: "guidelines", label: "Guidelines Reference", number: 4 },
  { id: "10vs", label: "10-Vs Assessment", number: 5 },
  { id: "finalize", label: "Finalize Care Plan", number: 6 },
];

const CarePlanWorkflow: React.FC<CarePlanWorkflowProps> = ({ initialStep = "4ps" }) => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(initialStep);
  const [caseInfo, setCaseInfo] = useState<{ caseNumber?: string; clientName?: string }>({});

  // Store caseId in localStorage for the screens to use
  useEffect(() => {
    if (caseId && typeof window !== "undefined") {
      window.localStorage.setItem("rcms_active_case_id", caseId);
    }
  }, [caseId]);

  // Load case info
  useEffect(() => {
    async function loadCaseInfo() {
      if (!caseId) return;
      
      try {
        const SUPABASE_URL = 'https://zmjxyspizdqhrtdcgkwk.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptanh5c3BpemRxaHJ0ZGNna3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjgxODMsImV4cCI6MjA3OTcwNDE4M30.i5rqJXZPSHYFeaA8E26Vh69UPzgCmhrU9zL2kdE8jrM';
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rc_cases?id=eq.${caseId}&select=case_number,client_id`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });
        
        const caseData = await response.json();
        if (caseData && caseData.length > 0) {
          let clientName = "Unknown Client";
          
          if (caseData[0].client_id) {
            const clientResponse = await fetch(
              `${SUPABASE_URL}/rest/v1/rc_clients?id=eq.${caseData[0].client_id}&select=first_name,last_name`,
              {
                headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${SUPABASE_KEY}`,
                },
              }
            );
            const clientData = await clientResponse.json();
            if (clientData && clientData.length > 0) {
              clientName = `${clientData[0].first_name || ''} ${clientData[0].last_name || ''}`.trim();
            }
          }
          
          setCaseInfo({
            caseNumber: caseData[0].case_number,
            clientName,
          });
        }
      } catch (error) {
        console.error("Failed to load case info:", error);
      }
    }
    
    loadCaseInfo();
  }, [caseId]);

  const goToStep = (step: WorkflowStep) => {
    setCurrentStep(step);
    // Update URL without full page reload
    const stepPath = step === "10vs" ? "ten-vs" : step;
    window.history.pushState({}, "", `/rn/case/${caseId}/${stepPath}`);
  };

  const goBack = () => {
    navigate("/rn/dashboard");
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const renderCurrentScreen = () => {
    switch (currentStep) {
      case "4ps":
        return <FourPsScreen />;
      case "sdoh":
        return <SDOHScreen />;
      case "overlays":
        return <OverlaySelectionScreen />;
      case "guidelines":
        return <GuidelinesReferenceScreen />;
      case "10vs":
        return <TenVsBuilder />;
      case "finalize":
        return <FinalizeCarePlanScreen />;
      default:
        return <FourPsScreen />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0.75rem 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={goBack}
              style={{
                padding: "0.3rem 0.6rem",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              ← Back to RN Portal
            </button>
            <div>
              <h1 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>Care Plan Workflow</h1>
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
                {caseInfo.clientName || "Loading..."} • {caseInfo.caseNumber || ""}
              </p>
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>
        </div>

        {/* Step Navigation */}
        <div style={{
          display: "flex",
          gap: "0.25rem",
          overflowX: "auto",
          paddingBottom: "0.25rem",
        }}>
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isPast = index < currentStepIndex;
            
            return (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                style={{
                  flex: "1 0 auto",
                  minWidth: "120px",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: isActive ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                  background: isActive ? "#f0f9ff" : isPast ? "#f0fdf4" : "#ffffff",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <span style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: isActive ? "#0ea5e9" : isPast ? "#22c55e" : "#e2e8f0",
                    color: isActive || isPast ? "#ffffff" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                  }}>
                    {isPast ? "✓" : step.number}
                  </span>
                  <span style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#0369a1" : isPast ? "#166534" : "#64748b",
                  }}>
                    {step.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        {renderCurrentScreen()}
      </div>

      {/* Footer Navigation */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#ffffff",
        borderTop: "1px solid #e2e8f0",
        padding: "0.75rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <button
          onClick={() => currentStepIndex > 0 && goToStep(STEPS[currentStepIndex - 1].id)}
          disabled={currentStepIndex === 0}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            background: currentStepIndex === 0 ? "#f1f5f9" : "#ffffff",
            color: currentStepIndex === 0 ? "#94a3b8" : "#0f172a",
            fontSize: "0.85rem",
            cursor: currentStepIndex === 0 ? "not-allowed" : "pointer",
          }}
        >
          ← Previous Step
        </button>
        
        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
          {STEPS[currentStepIndex].label}
        </div>

        <button
          onClick={() => currentStepIndex < STEPS.length - 1 && goToStep(STEPS[currentStepIndex + 1].id)}
          disabled={currentStepIndex === STEPS.length - 1}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "none",
            background: currentStepIndex === STEPS.length - 1 ? "#94a3b8" : "#0ea5e9",
            color: "#ffffff",
            fontSize: "0.85rem",
            cursor: currentStepIndex === STEPS.length - 1 ? "not-allowed" : "pointer",
          }}
        >
          Next Step →
        </button>
      </div>

      {/* Bottom padding to account for fixed footer */}
      <div style={{ height: "60px" }} />
    </div>
  );
};

export default CarePlanWorkflow;
