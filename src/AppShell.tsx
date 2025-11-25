// src/AppShell.tsx

import React, { useState } from "react";

// Core role views
import RNConsole from "./rn/RNConsole";
import RNCaseView from "./rn/RNCaseView";
import AttorneyConsole from "./attorney/AttorneyConsole";
import AttorneyCaseView from "./attorney/AttorneyCaseView";
import ClientHome from "./client/ClientHome";
import DirectorDashboard from "./director/DirectorDashboard";

// Single-case RN console (intake + follow-up + Supervisor audit panel)
import App from "./App";

// Provider visit note (Traci-optimized)
import ProviderVisitNoteForm from "./provider/ProviderVisitNoteForm";

// Shared mock DB (3–5 archetype cases)
import { MockDBProvider, useMockDB } from "./lib/mockDB";
// 🔹 NEW: wrap the whole shell in the case events provider
import { CaseEventsProvider } from "./lib/caseEventsContext";

type RoleView =
  | "rn"
  | "rnCase"
  | "caseDemo"
  | "provider"
  | "attorney"
  | "attorneyCase"
  | "client"
  | "director";

const ShellInner: React.FC = () => {
  const [view, setView] = useState<RoleView>("rn");
  const { setActiveIndex } = useMockDB();

  const navButton = (id: RoleView, label: string, sub?: string) => {
    const isActive = view === id;
    return (
      <button
        type="button"
        onClick={() => setView(id)}
        className={[
          "px-3 py-1 rounded-full text-[11px] border transition",
          isActive
            ? "bg-sky-600 text-white border-sky-600 shadow-sm"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
        ].join(" ")}
      >
        <div className="font-semibold">{label}</div>
        {sub && (
          <div className="text-[9px] text-slate-300">
            {sub}
          </div>
        )}
      </button>
    );
  };

  const handleOpenRNCase = (caseIndex: number) => {
    if (caseIndex < 0) return;
    setActiveIndex(caseIndex);
    setView("rnCase");
  };

  const handleOpenAttorneyCase = (caseIndex: number) => {
    if (caseIndex < 0) return;
    setActiveIndex(caseIndex);
    setView("attorneyCase");
  };

  const renderContent = () => {
    switch (view) {
      case "rn":
        return (
          <>
            <p className="text-[11px] text-slate-600 mb-3">
              This is the RN Care Manager dashboard mock, modeled after your
              Lovable RN portal: active cases only, with workload, flags, and
              10-Vs / Vitality context.
            </p>
            <RNConsole onOpenCase={handleOpenRNCase} />
          </>
        );
      case "rnCase":
        return (
          <>
            <p className="text-[11px] text-slate-600 mb-3">
              RN case detail mock view, aligned with 10-Vs, 4Ps, SDOH, and
              flag/task history. Opened when an RN selects a case on the
              dashboard.
            </p>
            <RNCaseView />
          </>
        );
      case "caseDemo":
        return (
          <>
            <p className="text-[11px] text-slate-600 mb-3">
              Single-case RN console (intake + follow-up) with Supervisor audit
              panel, 10-Vs engine, Vitality/RAG, workload enforcement, legal
              lock-down, and case closure recommendations all working together.
            </p>
            <App />
          </>
        );
      case "provider":
        return (
          <>
            <p className="text-[11px] text-slate-600 mb-3">
              Provider-facing visit note mock, optimized for the 10-Vs engine.
              Each submission becomes a Provider event on the timeline and
              strengthens utilization (V7) and validation (V9) for the
              Attorney and RN views.
            </p>
            <ProviderVisitNoteForm />
          </>
        );
      case "attorney":
        return (
          <>
            <p className="text-[11px] text-slate-600 mb-3">
              Attorney dashboard mock: shows active / pending cases with
              negotiation-ready signals (risk level, Vitality, red flags,
              documentation status).
            </p>
            <AttorneyConsole onOpenCase={handleOpenAttorneyCase} />
          </>
        );
      case "attorneyCase":
        return (
          <>
            <p className="text-[11px] text-slate-600 mb-3">
              Attorney case detail mock: tells the clinical and functional story
              using Reconcile C.A.R.E. language (pain, function, SDOH, 10-Vs,
              projected LOD, negotiation talking points).
            </p>
            <AttorneyCaseView />
          </>
        );
      case "client":
        return (
          <>
            <p className="text-[11px] text-slate-600 mb-3">
              Client-facing mock home. Later this will be wired to your
              client portal (4Ps, SDOH, pain diary, education, etc.).
            </p>
            <ClientHome />
          </>
        );
      case "director":
        return (
          <>
            <p className="text-[11px] text-slate-600 mb-3">
              Director dashboard mock: used for RN workload limits, override
              approvals, and governance/QMP style oversight.
            </p>
            <DirectorDashboard />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Global header */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <div className="text-sm font-semibold tracking-tight">
              Reconcile C.A.R.E.™ Platform Shell
            </div>
            <div className="text-[11px] text-slate-500 max-w-xl">
              Mock navigation between RN, Provider, Client, Attorney, Supervisor, and
              Director experiences. No APIs yet — this is your clickable
              blueprint before we wire real data.
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
            {navButton("rn", "RN Dashboard", "RN Case List")}
            {navButton("rnCase", "RN Case View", "Single Case Detail")}
            {navButton("caseDemo", "RN Case Engine", "10-Vs & Audit")}
            {navButton("provider", "Provider Visit Note", "Provider View")}
            {navButton("attorney", "Attorney Dashboard", "Case Worklist")}
            {navButton(
              "attorneyCase",
              "Attorney Case View",
              "Negotiation View"
            )}
            {navButton("client", "Client Portal", "Client Experience")}
            {navButton("director", "Director Console", "Overrides & Limits")}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        {renderContent()}
      </main>
    </div>
  );
};

const AppShell: React.FC = () => {
  return (
    <MockDBProvider>
      <CaseEventsProvider>
        <ShellInner />
      </CaseEventsProvider>
    </MockDBProvider>
  );
};

export default AppShell;

