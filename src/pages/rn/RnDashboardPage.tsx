// src/pages/rn/RnDashboardPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RnDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState("");

  const handleOpen4Ps = () => {
    if (!caseId.trim()) {
      alert("Please enter a Case ID first.");
      return;
    }
    navigate(`/rn/case/${caseId.trim()}/4ps`);
  };

  const handleOpen10Vs = () => {
    if (!caseId.trim()) {
      alert("Please enter a Case ID first.");
      return;
    }
    navigate(`/rn/case/${caseId.trim()}/10vs`);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          RN Case Engine — Pilot Workspace
        </h1>
        <p className="mt-2 text-sm text-slate-700 max-w-2xl">
          This dashboard is your starting point for testing the{" "}
          <strong>4Ps of Wellness Holistic Insight Model™</strong> and the{" "}
          <strong>10-V of Care Management Framework™</strong> on real or pilot cases.
          For now, paste a Case ID and jump into the assessment screens.
        </p>
      </header>

      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Open a Case for Assessment
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          You can use any valid <code className="font-mono">rc_cases.id</code> from
          Supabase (for example, your Dev Case) to test the workflow. Later this
          will be wired to your real case list and notifications.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Case ID
            </label>
            <input
              type="text"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="Paste or type the Case ID (e.g. rc_cases.id)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/70 focus:border-slate-900"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpen4Ps}
              className="whitespace-nowrap px-4 py-2 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800"
            >
              Open 4Ps Assessment
            </button>
            <button
              type="button"
              onClick={handleOpen10Vs}
              className="whitespace-nowrap px-4 py-2 rounded-md text-xs font-medium border border-slate-300 text-slate-800 bg-white hover:bg-slate-50"
            >
              Open 10-Vs Engine
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-800 mb-1 uppercase tracking-wide">
            Phase I — Orientation & Intake
          </h3>
          <p className="text-xs text-slate-600">
            Future: automatic list of new intakes awaiting RN review, with quick
            links into 4Ps and 10-Vs for each client.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-800 mb-1 uppercase tracking-wide">
            Phase II — Active Cases
          </h3>
          <p className="text-xs text-slate-600">
            Future: snapshot of your current caseload, status, and key barriers
            from the 4Ps / 10-Vs scoring.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-800 mb-1 uppercase tracking-wide">
            Signal & Safety Flags
          </h3>
          <p className="text-xs text-slate-600">
            Future: single view of crisis flags, SDOH risks, and escalation
            thresholds across your panel.
          </p>
        </div>
      </section>
    </div>
  );
};

export default RnDashboardPage;