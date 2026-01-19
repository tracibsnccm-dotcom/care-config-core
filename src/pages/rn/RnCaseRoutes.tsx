import React, { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import FourPsScreen from "../../screens/rn/FourPsScreen";
import TenVsScreen from "../../screens/rn/TenVsScreen";
import SDOHScreen from "../../screens/rn/SDOHScreen";
import CrisisModeScreen from "../../screens/rn/CrisisModeScreen";

const RnCaseRoutes: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Store caseId in localStorage when component mounts
  useEffect(() => {
    if (caseId && typeof window !== "undefined") {
      try {
        window.localStorage.setItem("rcms_active_case_id", caseId);
      } catch (e) {
        console.error("Failed to save case ID", e);
      }
    }
  }, [caseId]);

  // Determine current screen from pathname
  const currentScreen = location.pathname.split("/").pop() || "";

  const navigateToScreen = (screen: "4ps" | "10vs" | "sdoh" | "crisis") => {
    navigate(`/rn/case/${caseId}/${screen}`);
  };

  const navigateToHub = () => {
    navigate("/");
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {/* Header row */}
      <div
        style={{
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
          RN Case: <code style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "0.125rem 0.25rem", borderRadius: "3px" }}>{caseId || "—"}</code>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigateToScreen("4ps")}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "6px",
              border: currentScreen === "4ps" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
              background: currentScreen === "4ps" ? "#0f2a6a" : "#ffffff",
              color: currentScreen === "4ps" ? "#ffffff" : "#0f172a",
              fontSize: "0.75rem",
              fontWeight: currentScreen === "4ps" ? 600 : 500,
              cursor: "pointer",
            }}
          >
            4Ps
          </button>
          <button
            type="button"
            onClick={() => navigateToScreen("10vs")}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "6px",
              border: currentScreen === "10vs" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
              background: currentScreen === "10vs" ? "#0f2a6a" : "#ffffff",
              color: currentScreen === "10vs" ? "#ffffff" : "#0f172a",
              fontSize: "0.75rem",
              fontWeight: currentScreen === "10vs" ? 600 : 500,
              cursor: "pointer",
            }}
          >
            10-Vs
          </button>
          <button
            type="button"
            onClick={() => navigateToScreen("sdoh")}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "6px",
              border: currentScreen === "sdoh" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
              background: currentScreen === "sdoh" ? "#0f2a6a" : "#ffffff",
              color: currentScreen === "sdoh" ? "#ffffff" : "#0f172a",
              fontSize: "0.75rem",
              fontWeight: currentScreen === "sdoh" ? 600 : 500,
              cursor: "pointer",
            }}
          >
            SDOH
          </button>
          <button
            type="button"
            onClick={() => navigateToScreen("crisis")}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "6px",
              border: currentScreen === "crisis" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
              background: currentScreen === "crisis" ? "#0f2a6a" : "#ffffff",
              color: currentScreen === "crisis" ? "#ffffff" : "#0f172a",
              fontSize: "0.75rem",
              fontWeight: currentScreen === "crisis" ? 600 : 500,
              cursor: "pointer",
            }}
          >
            Crisis
          </button>
          <button
            type="button"
            onClick={() => caseId && navigate(`/rn/case/${caseId}/requests`)}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "6px",
              border: currentScreen === "requests" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
              background: currentScreen === "requests" ? "#0f2a6a" : "#ffffff",
              color: currentScreen === "requests" ? "#ffffff" : "#0f172a",
              fontSize: "0.75rem",
              fontWeight: currentScreen === "requests" ? 600 : 500,
              cursor: "pointer",
            }}
          >
            Requests
          </button>
          <button
            type="button"
            onClick={navigateToHub}
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
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Screen content */}
      <div style={{ width: "100%" }}>
        {currentScreen === "4ps" && <FourPsScreen />}
        {currentScreen === "10vs" && <TenVsScreen />}
        {currentScreen === "sdoh" && <SDOHScreen />}
        {currentScreen === "crisis" && <CrisisModeScreen />}
        {!["4ps", "10vs", "sdoh", "crisis"].includes(currentScreen) && (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            Unknown route. Please use the navigation buttons above.
          </div>
        )}
      </div>
    </div>
  );
};

export default RnCaseRoutes;

