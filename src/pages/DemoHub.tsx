// src/pages/DemoHub.tsx

import React, { useMemo, useState } from "react";
import { DEMO_ACCESS_CODE, DEMO_ACCESS_HINT } from "../config/demoAccess";

type Props = {
  onEnterAttorneyDemo: () => void;
  onEnterClientDemo: () => void;
};

const DemoHub: React.FC<Props> = ({ onEnterAttorneyDemo, onEnterClientDemo }) => {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUnlock = useMemo(() => code.trim().length > 0, [code]);

  const tryUnlock = () => {
    const entered = code.trim();
    if (!entered) return;

    if (entered === DEMO_ACCESS_CODE) {
      setUnlocked(true);
      setError(null);
      return;
    }

    setUnlocked(false);
    setError("Invalid access code.");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#0f2a6a",
          color: "#ffffff",
          borderBottom: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "0.85rem 1.15rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <div style={{ fontSize: "0.98rem", fontWeight: 950, letterSpacing: "0.2px" }}>
              Reconcile C.A.R.E.™
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, opacity: 0.92 }}>
              Attorney Demo Hub
            </div>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.22rem 0.6rem",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.10)",
              fontSize: "0.8rem",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            🔒 Demo only • No PHI • Read-only content
          </span>
        </div>
      </div>

      <div style={{ padding: "1.25rem", maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "1.15rem",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ minWidth: 260 }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 950, color: "#0f172a" }}>
                Access the Demo
              </div>
              <div style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.55, marginTop: "0.25rem" }}>
                This is a controlled preview for attorneys evaluating the platform.
                The demo is interactive for navigation, but it does not accept live data entry and stores no PHI.
              </div>
            </div>

            <div style={{ minWidth: 320, flex: 1 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.35rem" }}>
                Access code
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={DEMO_ACCESS_HINT}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") tryUnlock();
                  }}
                  style={{
                    flex: 1,
                    minWidth: 220,
                    border: "1px solid #cbd5e1",
                    borderRadius: 12,
                    padding: "0.65rem 0.75rem",
                    fontSize: "0.95rem",
                  }}
                />
                <button
                  type="button"
                  onClick={tryUnlock}
                  disabled={!canUnlock}
                  style={{
                    padding: "0.65rem 0.95rem",
                    borderRadius: 999,
                    border: "1px solid rgba(176,152,55,0.55)",
                    background: canUnlock ? "#b09837" : "#e2e8f0",
                    color: canUnlock ? "#0f172a" : "#64748b",
                    fontSize: "0.9rem",
                    fontWeight: 950,
                    cursor: canUnlock ? "pointer" : "not-allowed",
                    whiteSpace: "nowrap",
                  }}
                >
                  Unlock
                </button>
              </div>

              {error && (
                <div style={{ marginTop: "0.45rem", color: "#b91c1c", fontSize: "0.88rem", fontWeight: 800 }}>
                  {error}
                </div>
              )}

              {unlocked && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.85rem",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontSize: "0.9rem", fontWeight: 950, color: "#0f172a", marginBottom: "0.45rem" }}>
                    Choose a demo view
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                    <button
                      type="button"
                      onClick={onEnterAttorneyDemo}
                      style={{
                        padding: "0.8rem",
                        borderRadius: 14,
                        border: "1px solid #0f2a6a",
                        background: "#0f2a6a",
                        color: "#ffffff",
                        fontSize: "0.95rem",
                        fontWeight: 950,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      Attorney Console
                      <div style={{ marginTop: "0.15rem", fontSize: "0.82rem", fontWeight: 800, opacity: 0.9 }}>
                        Navigate the console, reports, and read-only care signals.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={onEnterClientDemo}
                      style={{
                        padding: "0.8rem",
                        borderRadius: 14,
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#0f172a",
                        fontSize: "0.95rem",
                        fontWeight: 950,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      Client Experience
                      <div style={{ marginTop: "0.15rem", fontSize: "0.82rem", fontWeight: 800, color: "#64748b" }}>
                        Preview the client intake flow (demo-only).
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 950, color: "#0f172a" }}>
              Important notes
            </div>
            <ul style={{ margin: "0.45rem 0 0 0", paddingLeft: "1.1rem", color: "#475569", lineHeight: 1.55 }}>
              <li>Read-only demo: navigation is interactive; no PHI is stored or displayed.</li>
              <li>Demo data and screens are representative, not final production scope.</li>
              <li>Access is controlled via code so you can share this safely during outreach.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoHub;
