// src/pages/DemoHub.tsx

import React, { useEffect, useMemo, useState } from "react";
import AttorneyConsole from "../screens/AttorneyConsole";
import ClientIntakeScreen from "../screens/ClientIntakeScreen";

type DemoView = "hub" | "attorney" | "client";

const ACCESS_CODE = "RCMS-DEMO-2025";
const STORAGE_KEY = "rcms_demo_unlocked_v1";

const DemoHub: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<DemoView>("hub");

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === "true") setUnlocked(true);
    } catch {
      // ignore
    }
  }, []);

  const setUnlockedPersist = (next: boolean) => {
    setUnlocked(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  };

  const polish = useMemo(() => {
    const page: React.CSSProperties = { minHeight: "100vh", background: "#f8fafc" };

    const shell: React.CSSProperties = {
      maxWidth: "980px",
      margin: "0 auto",
      padding: "1.25rem",
    };

    const topBar: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      padding: "0.95rem 1.1rem",
      borderRadius: "14px",
      border: "1px solid #e2e8f0",
      background: "#ffffff",
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
    };

    const brandTitle: React.CSSProperties = {
      fontSize: "1.05rem",
      fontWeight: 900,
      color: "#0f172a",
      letterSpacing: "-0.01em",
      marginBottom: "0.15rem",
    };

    const brandSub: React.CSSProperties = {
      fontSize: "0.85rem",
      color: "#64748b",
      lineHeight: 1.45,
      fontWeight: 600,
    };

    const card: React.CSSProperties = {
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      background: "#ffffff",
      padding: "1rem",
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
    };

    const pill: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      padding: "0.22rem 0.65rem",
      borderRadius: "999px",
      border: "1px solid #e2e8f0",
      background: "#f8fafc",
      color: "#475569",
      fontSize: "0.78rem",
      fontWeight: 800,
      whiteSpace: "nowrap",
    };

    const primaryBtn: React.CSSProperties = {
      width: "100%",
      textAlign: "left",
      padding: "0.75rem 0.95rem",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      background: "#ffffff",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      gap: "0.15rem",
    };

    const primaryCta: React.CSSProperties = {
      padding: "0.6rem 1.05rem",
      borderRadius: "999px",
      border: "1px solid #0f2a6a",
      background: "#0f2a6a",
      color: "#ffffff",
      fontSize: "0.9rem",
      fontWeight: 800,
      cursor: "pointer",
      whiteSpace: "nowrap",
    };

    const secondaryCta: React.CSSProperties = {
      padding: "0.6rem 1.05rem",
      borderRadius: "999px",
      border: "1px solid #cbd5e1",
      background: "#ffffff",
      color: "#0f172a",
      fontSize: "0.9rem",
      fontWeight: 800,
      cursor: "pointer",
      whiteSpace: "nowrap",
    };

    const goldRule: React.CSSProperties = {
      height: "1px",
      background: "#b09837",
      width: "48px",
      marginTop: "0.35rem",
      marginBottom: "0.85rem",
    };

    const label: React.CSSProperties = {
      fontSize: "0.78rem",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "#64748b",
      fontWeight: 900,
    };

    const h2: React.CSSProperties = {
      fontSize: "0.98rem",
      fontWeight: 900,
      color: "#0f172a",
      letterSpacing: "-0.01em",
      marginBottom: "0.2rem",
    };

    const body: React.CSSProperties = {
      fontSize: "0.9rem",
      color: "#475569",
      lineHeight: 1.6,
      fontWeight: 500,
    };

    const foot: React.CSSProperties = {
      marginTop: "1.25rem",
      paddingTop: "0.85rem",
      borderTop: "1px solid #e2e8f0",
      fontSize: "0.82rem",
      color: "#64748b",
      lineHeight: 1.5,
    };

    return {
      page,
      shell,
      topBar,
      brandTitle,
      brandSub,
      card,
      pill,
      primaryBtn,
      primaryCta,
      secondaryCta,
      goldRule,
      label,
      h2,
      body,
      foot,
    };
  }, []);

  const tryUnlock = () => {
    setError(null);
    const normalized = code.trim();
    if (!normalized) {
      setError("Enter your access code.");
      return;
    }
    if (normalized !== ACCESS_CODE) {
      setError("Invalid access code. Please check your email and try again.");
      return;
    }
    setUnlockedPersist(true);
    setView("hub");
    setCode("");
    setError(null);
  };

  const lock = () => {
    setUnlockedPersist(false);
    setView("hub");
    setCode("");
    setError(null);
  };

  // Render selected demo view
  if (unlocked && view === "attorney") {
    return (
      <div style={polish.page}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "#0f172a" }}>
                Attorney Console (Demo)
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Interactive navigation • Read-only • No PHI
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setView("hub")} style={polish.secondaryCta}>
                Back to Demo Hub
              </button>
              <button type="button" onClick={lock} style={polish.secondaryCta}>
                Lock demo
              </button>
            </div>
          </div>

          <AttorneyConsole />
        </div>
      </div>
    );
  }

  if (unlocked && view === "client") {
    return (
      <div style={polish.page}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "#0f172a" }}>
                Client Experience (Demo)
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Representative intake flow • Demo-only • No PHI
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setView("hub")} style={polish.secondaryCta}>
                Back to Demo Hub
              </button>
              <button type="button" onClick={lock} style={polish.secondaryCta}>
                Lock demo
              </button>
            </div>
          </div>

          <ClientIntakeScreen />
        </div>
      </div>
    );
  }

  // Gate + Hub
  return (
    <div style={polish.page}>
      <div style={polish.shell}>
        <div style={polish.topBar}>
          <div>
            <div style={polish.brandTitle}>Reconcile C.A.R.E.™ Demo</div>
            <div style={polish.brandSub}>
              Secure, read-only preview of the client experience and attorney console.
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={polish.pill}>Navy: #0f2a6a</span>
            <span style={polish.pill}>Gold: #b09837</span>
            {unlocked ? (
              <span style={{ ...polish.pill, borderColor: "#22c55e", background: "#dcfce7", color: "#166534" }}>
                Access: Unlocked
              </span>
            ) : (
              <span style={{ ...polish.pill, borderColor: "#cbd5e1" }}>Access: Locked</span>
            )}
          </div>
        </div>

        <div style={{ marginTop: "0.85rem", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "0.85rem" }}>
          {/* Main card */}
          <div style={polish.card}>
            <div style={polish.label}>Welcome</div>
            <div style={polish.goldRule} />
            <div style={polish.h2}>Boutique, clinically serious demo environment</div>
            <div style={polish.body}>
              This preview is designed for attorney evaluation. It is <b>interactive for navigation</b>, but
              <b> read-only</b>—no live submissions, no PHI stored or displayed, and all content is representative.
            </div>

            {!unlocked ? (
              <div style={{ marginTop: "0.9rem" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.35rem" }}>
                  Enter access code
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Access code"
                    style={{
                      flex: "1 1 260px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "12px",
                      padding: "0.65rem 0.75rem",
                      fontSize: "0.95rem",
                      outline: "none",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") tryUnlock();
                    }}
                  />
                  <button type="button" onClick={tryUnlock} style={polish.primaryCta}>
                    Unlock Demo
                  </button>
                </div>

                {error && (
                  <div
                    style={{
                      marginTop: "0.55rem",
                      borderRadius: "12px",
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#991b1b",
                      padding: "0.65rem 0.75rem",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      lineHeight: 1.45,
                    }}
                  >
                    {error}
                  </div>
                )}

                <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                  Tip: Your access code is typically provided via your professional email after requesting demo access.
                </div>
              </div>
            ) : (
              <div style={{ marginTop: "0.9rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setView("attorney")} style={polish.primaryCta}>
                    Open Attorney Console
                  </button>
                  <button type="button" onClick={() => setView("client")} style={polish.secondaryCta}>
                    Open Client Experience
                  </button>
                  <button type="button" onClick={lock} style={polish.secondaryCta}>
                    Lock demo
                  </button>
                </div>

                <div style={{ marginTop: "0.85rem", fontSize: "0.86rem", color: "#475569", lineHeight: 1.55 }}>
                  Recommended path: start with <b>Attorney Console</b> → review the care snapshot and reports →
                  then preview the <b>Client Experience</b> flow.
                </div>
              </div>
            )}
          </div>

          {/* Notes card */}
          <div style={polish.card}>
            <div style={polish.label}>Evaluation notes</div>
            <div style={polish.goldRule} />
            <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#475569", lineHeight: 1.55, fontSize: "0.88rem" }}>
              <li>
                Read-only demo: navigation is interactive; <b>no PHI</b> is stored or displayed.
              </li>
              <li>Demo screens are representative and not final production scope.</li>
              <li>
                Access is controlled by code for safe outreach and controlled evaluation.
              </li>
            </ul>

            <div style={polish.foot}>
              <strong style={{ color: "#0f172a" }}>Demo access provided for evaluation purposes.</strong>
              <br />
              This preview is read-only and contains representative data only. For firm-specific walkthroughs,
              implementation details, or next steps, please contact us.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoHub;
