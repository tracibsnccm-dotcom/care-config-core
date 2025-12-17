// src/App.tsx

import React, { useMemo, useState } from "react";

// Screens (adjust paths ONLY if your filenames differ)
import ClientIntakeScreen from "./screens/ClientIntakeScreen";
import AttorneyConsole from "./screens/AttorneyConsole";

// Optional: if you have a Home screen you still want to keep, import it here.
// import Home from "./screens/Home";

type AppTab = "clientDemo" | "attorneyDemo";

const App: React.FC = () => {
  // Demo mode by default for marketing links.
  // If you ever want to show the full internal shell later, we can add a toggle/flag.
  const tabs = useMemo(
    () =>
      [
        { key: "clientDemo" as const, label: "Client Demo" },
        { key: "attorneyDemo" as const, label: "Attorney Demo" },
      ] as const,
    []
  );

  const [activeTab, setActiveTab] = useState<AppTab>("clientDemo");

  const renderTab = () => {
    switch (activeTab) {
      case "clientDemo":
        return <ClientIntakeScreen />;
      case "attorneyDemo":
        return <AttorneyConsole />;
      default:
        return <ClientIntakeScreen />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Top bar */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "0.9rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
            Reconcile C.A.R.E.™ Demo
          </div>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Attorney-facing preview of the Client experience + Attorney Console.
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: "0.45rem 0.95rem",
                  borderRadius: "999px",
                  border: active ? "1px solid #0f2a6a" : "1px solid #cbd5e1",
                  background: active ? "#0f2a6a" : "#ffffff",
                  color: active ? "#ffffff" : "#0f172a",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1.25rem" }}>{renderTab()}</div>
    </div>
  );
};

export default App;
