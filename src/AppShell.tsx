// src/AppShell.tsx
// Reconcile C.A.R.E. — Simple tabbed shell
//
// Tabs:
//  - RN Case Engine (App)
//  - Attorney Case Console
//  - Buddy Crisis Screen
//  - Supervisor Crisis Screen

import React, { useState } from "react";
import App from "./App";
import AttorneyConsole from "./attorney/AttorneyConsole";
import BuddyCrisisScreen from "./buddy/BuddyCrisisScreen";
import SupervisorCrisisScreen from "./supervisor/SupervisorCrisisScreen";

type TabKey = "rn" | "attorney" | "buddy" | "supervisor";

const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("rn");

  const renderContent = () => {
    switch (activeTab) {
      case "rn":
        return <App />;
      case "attorney":
        return <AttorneyConsole />;
      case "buddy":
        return <BuddyCrisisScreen />;
      case "supervisor":
        return <SupervisorCrisisScreen />;
      default:
        return <App />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-[11px] text-slate-800">
      {/* Top nav */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="text-[12px] font-semibold tracking-wide uppercase">
            Reconcile C.A.R.E. – RCMS Trial Shell
          </div>
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
        {renderContent()}
      </main>
    </div>
  );
};

export default AppShell;
