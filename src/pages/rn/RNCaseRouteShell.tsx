import React, { useEffect } from "react";
import { useParams, useLocation, Link, NavLink } from "react-router-dom";
import FourPsScreen from "../../screens/rn/FourPsScreen";
import TenVsScreen from "../../screens/rn/TenVsScreen";
import SDOHScreen from "../../screens/rn/SDOHScreen";
import CrisisModeScreen from "../../screens/rn/CrisisModeScreen";

const RNCaseRouteShell: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation();

  // Store caseId in localStorage for the screens to use
  useEffect(() => {
    if (caseId && typeof window !== "undefined") {
      try {
        window.localStorage.setItem("rcms_active_case_id", caseId);
      } catch (e) {
        console.error("Failed to save case ID", e);
      }
    }
  }, [caseId]);

  // Determine which screen to show based on the current path
  const getCurrentScreen = () => {
    const path = location.pathname;
    if (path.endsWith("/4ps")) {
      return "4ps";
    } else if (path.endsWith("/10vs")) {
      return "10vs";
    } else if (path.endsWith("/sdoh")) {
      return "sdoh";
    } else if (path.endsWith("/crisis")) {
      return "crisis";
    }
    return "4ps"; // default
  };

  const renderScreen = () => {
    const currentScreen = getCurrentScreen();
    switch (currentScreen) {
      case "4ps":
        return <FourPsScreen />;
      case "10vs":
        return <TenVsScreen />;
      case "sdoh":
        return <SDOHScreen />;
      case "crisis":
        return <CrisisModeScreen />;
      default:
        return <FourPsScreen />;
    }
  };

  // Error state: missing caseId
  if (!caseId) {
    return (
      <div className="p-6 max-w-md mx-auto mt-8">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Case ID Required
          </h2>
          <p className="text-xs text-slate-600 mb-4">
            No case ID was provided in the URL. Please select a case from your caseload.
          </p>
          <div className="flex gap-2">
            <Link
              to="/rn/caseload"
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Go to Caseload
            </Link>
            <Link
              to="/rn/dashboard"
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              RN Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 px-3 py-2 bg-white border-b border-slate-200">
        <h1 className="text-sm font-semibold text-slate-900">
          RN Case Engine — Case: <span className="font-mono">{caseId}</span>
        </h1>
      </div>

      {/* Navigation links */}
      <div className="mb-4 flex gap-2 px-3">
        <NavLink
          to={`/rn/case/${caseId}/4ps`}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-[10px] font-medium border transition-colors ${
              isActive
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`
          }
        >
          4Ps
        </NavLink>
        <NavLink
          to={`/rn/case/${caseId}/10vs`}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-[10px] font-medium border transition-colors ${
              isActive
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`
          }
        >
          10-Vs
        </NavLink>
        <NavLink
          to={`/rn/case/${caseId}/sdoh`}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-[10px] font-medium border transition-colors ${
              isActive
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`
          }
        >
          SDOH
        </NavLink>
        <NavLink
          to={`/rn/case/${caseId}/crisis`}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-[10px] font-medium border transition-colors ${
              isActive
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`
          }
        >
          Crisis
        </NavLink>
        <NavLink
          to={`/rn/case/${caseId}/requests`}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-[10px] font-medium border transition-colors ${
              isActive
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`
          }
        >
          Requests
        </NavLink>
      </div>

      {/* Screen content */}
      <div>{renderScreen()}</div>
    </div>
  );
};

export default RNCaseRouteShell;

