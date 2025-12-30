import React, { useState, useEffect } from "react";

import RNConsole from "./screens/RNConsole";
import AttorneyConsole from "./screens/AttorneyConsole";
import BuddyCrisisScreen from "./screens/BuddyCrisisScreen";
import SupervisorCrisisScreen from "./screens/SupervisorCrisisScreen";
import { ActiveCaseProvider } from "./context/ActiveCaseContext";
import { isDemoUnlocked, isDemoMode } from "./lib/demoModeGuard";


type TabKey = "rn" | "attorney" | "buddy" | "supervisor";

const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("rn");

  // CRITICAL: AppShell cannot bypass demo gating
  // If demo is not unlocked, redirect to /demo to show gate
  useEffect(() => {
    const unlocked = isDemoUnlocked();
    if (!unlocked) {
      // Redirect to /demo to show gate
      window.location.replace("/demo");
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "rn":
        return <RNConsole />;
      case "attorney":
        return <AttorneyConsole />;
      case "buddy":
        return <BuddyCrisisScreen />;
      case "supervisor":
        return <SupervisorCrisisScreen />;
      default:
        return <RNConsole />;
    }
  };

  const resetDemo = () => {
    // Reset demo: clear unlock state and return to gated state
    try {
      window.localStorage.removeItem("rcms_demo_unlocked_v1");
    } catch {
      // ignore
    }
    // Force reload to /demo to show gate
    window.location.href = "/demo";
  };

  const goToDemoHub = () => {
    // Navigate to demo hub
    window.location.href = "/demo";
  };

  // Show demo navigation buttons if in demo mode
  const inDemoMode = isDemoMode();

  return (
    <div className="min-h-screen bg-slate-100 text-[11px] text-slate-800">
      {/* Top nav */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="text-[12px] font-semibold tracking-wide uppercase">
            Reconcile C.A.R.E. | RCMS Trial Shell
          </div>

          <div className="flex items-center gap-2">
            {/* Demo navigation buttons - only show in demo mode */}
            {inDemoMode && (
              <div className="flex gap-2 mr-2 pl-2 border-l border-gray-300">
                <button
                  onClick={goToDemoHub}
                  className="px-2 py-1 rounded-md text-[10px] border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  title="Return to Demo Hub"
                >
                  Back to Demo Hub
                </button>
                {isDemoUnlocked() && (
                  <button
                    onClick={resetDemo}
                    className="px-2 py-1 rounded-md text-[10px] border border-red-300 bg-white text-red-600 hover:bg-red-50"
                    title="Reset demo to initial gated state (for presenter)"
                  >
                    Reset Demo
                  </button>
                )}
              </div>
            )}

            <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab("rn")}
              className={
                "px-2 py-1 rounded-md text-[10px] border " +
                (activeTab === "rn"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700")
              }
            >
              RN Case Engine
            </button>

            <button
              onClick={() => setActiveTab("attorney")}
              className={
                "px-2 py-1 rounded-md text-[10px] border " +
                (activeTab === "attorney"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700")
              }
            >
              Attorney Console
            </button>

            <button
              onClick={() => setActiveTab("buddy")}
              className={
                "px-2 py-1 rounded-md text-[10px] border " +
                (activeTab === "buddy"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700")
              }
            >
              Buddy Crisis Screen
            </button>

            <button
              onClick={() => setActiveTab("supervisor")}
              className={
                "px-2 py-1 rounded-md text-[10px] border " +
                (activeTab === "supervisor"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700")
              }
            >
              Supervisor Crisis Screen
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-3 py-3">
        <ActiveCaseProvider>
          {renderContent()}
        </ActiveCaseProvider>
      </main>
    </div>
  );
};

export default AppShell;
