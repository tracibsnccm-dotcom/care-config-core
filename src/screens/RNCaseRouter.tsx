import React, { useState, useEffect } from "react";
import FourPsScreen from "./rn/FourPsScreen";
import TenVsScreen from "./rn/TenVsScreen";
import SDOHScreen from "./rn/SDOHScreen";
import CrisisModeScreen from "./rn/CrisisModeScreen";

const RNCaseRouter: React.FC = () => {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);

  // Listen for pathname changes (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Parse the route: /rn/case/:caseId/4ps, /rn/case/:caseId/10vs, etc.
  // Also handle /rn/case/:caseId (no last segment) -> default to 4ps
  const caseIdMatch = pathname.match(/^\/rn\/case\/([^/]+)(?:\/(.*))?$/);
  
  if (!caseIdMatch) {
    // Unknown route - show error message
    const handleGoToDashboard = () => {
      window.location.href = "/rn-dashboard";
    };

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "1.5rem",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "0.75rem",
            }}
          >
            Unknown RN route
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#64748b",
              marginBottom: "1rem",
            }}
          >
            Go back to RN Dashboard.
          </p>
          <button
            type="button"
            onClick={handleGoToDashboard}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#0f172a",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1e293b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0f172a";
            }}
          >
            Back to RN Dashboard
          </button>
        </div>
      </div>
    );
  }

  const caseId = caseIdMatch[1];
  const screen = caseIdMatch[2] || "4ps"; // Default to 4ps if no last segment

  // Store caseId in localStorage for other components to use
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("rcms_active_case_id", caseId);
    } catch (e) {
      console.error("Failed to save case ID", e);
    }
  }

  // Navigation handlers
  const navigateToScreen = (screenType: string) => {
    window.location.href = `/rn/case/${caseId}/${screenType}`;
  };

  const navigateToDashboard = () => {
    window.location.href = "/rn-dashboard";
  };

  // Determine which screen to render
  const renderScreen = () => {
    switch (screen) {
      case "4ps":
        return <FourPsScreen />;
      case "10vs":
        return <TenVsScreen />;
      case "sdoh":
        return <SDOHScreen />;
      case "crisis":
        return <CrisisModeScreen />;
      default:
        // Unknown screen type - redirect to 4ps
        window.location.href = `/rn/case/${caseId}/4ps`;
        return null;
    }
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
        }}
      >
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
          RN Case: <code style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "0.125rem 0.25rem", borderRadius: "3px" }}>{caseId}</code>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigateToScreen("4ps")}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "6px",
              border: screen === "4ps" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
              background: screen === "4ps" ? "#0f2a6a" : "#ffffff",
              color: screen === "4ps" ? "#ffffff" : "#0f172a",
              fontSize: "0.75rem",
              fontWeight: screen === "4ps" ? 600 : 500,
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
              border: screen === "10vs" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
              background: screen === "10vs" ? "#0f2a6a" : "#ffffff",
              color: screen === "10vs" ? "#ffffff" : "#0f172a",
              fontSize: "0.75rem",
              fontWeight: screen === "10vs" ? 600 : 500,
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
              border: screen === "sdoh" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
              background: screen === "sdoh" ? "#0f2a6a" : "#ffffff",
              color: screen === "sdoh" ? "#ffffff" : "#0f172a",
              fontSize: "0.75rem",
              fontWeight: screen === "sdoh" ? 600 : 500,
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
              border: screen === "crisis" ? "2px solid #0f2a6a" : "1px solid #cbd5e1",
              background: screen === "crisis" ? "#0f2a6a" : "#ffffff",
              color: screen === "crisis" ? "#ffffff" : "#0f172a",
              fontSize: "0.75rem",
              fontWeight: screen === "crisis" ? 600 : 500,
              cursor: "pointer",
            }}
          >
            Crisis
          </button>
          <button
            type="button"
            onClick={navigateToDashboard}
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
      <div style={{ width: "100%", height: "calc(100% - 50px)" }}>
        {renderScreen()}
      </div>
    </div>
  );
};

export default RNCaseRouter;

