import React, { useState, useEffect } from "react";
import FourPsScreen from "./FourPsScreen";
import TenVsScreen from "./TenVsScreen";
import SDOHScreen from "./SDOHScreen";
import CrisisModeScreen from "./CrisisModeScreen";

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
  const routeMatch = pathname.match(/^\/rn\/case\/([^/]+)\/(4ps|10vs|sdoh|crisis)$/);

  if (routeMatch) {
    const caseId = routeMatch[1];
    const screen = routeMatch[2];

    // Store caseId in localStorage for other components to use
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("rcms_active_case_id", caseId);
      } catch (e) {
        console.error("Failed to save case ID", e);
      }
    }

    // Render the appropriate screen
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
        break;
    }
  }

  // Unknown route - show error message
  const handleGoToDashboard = () => {
    // Try /demo first, fallback to /rn/dashboard
    if (typeof window !== "undefined") {
      window.location.pathname = "/demo";
    }
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
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default RNCaseRouter;

