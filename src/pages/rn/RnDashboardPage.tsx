// src/pages/rn/RnDashboardPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useMockDB } from "../../lib/mockDB";

const RnDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { cases, activeIndex, setActiveIndex, activeCase } = useMockDB();

  const handleOpen4Ps = () => {
    if (!activeCase) {
      alert("Select a case first.");
      return;
    }
    navigate(`/rn/case/${activeCase.id}/4ps`);
  };

  const handleOpen10Vs = () => {
    if (!activeCase) {
      alert("Select a case first.");
      return;
    }
    navigate(`/rn/case/${activeCase.id}/10vs`);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          RN Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-700 max-w-2xl">
          Access your RN portal, caseload, and clinical management tools from this dashboard.
        </p>
      </header>

      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
        <div className="mb-4">
          <label htmlFor="caseSelector" className="block text-sm font-medium text-slate-700 mb-2">
            Select Active Case
          </label>
          {cases.length > 0 ? (
            <select
              id="caseSelector"
              value={activeIndex}
              onChange={(e) => setActiveIndex(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              {cases.map((case_, index) => (
                <option key={case_.id} value={index}>
                  {case_.shortId} — {case_.client.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-slate-600">No cases available</div>
          )}
        </div>

        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Case Assessments
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleOpen4Ps}
            className="flex-1 px-6 py-3 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Open 4Ps
          </button>
          <button
            type="button"
            onClick={handleOpen10Vs}
            className="flex-1 px-6 py-3 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Open 10-Vs
          </button>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Primary Navigation
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/rn/dashboard";
            }}
            className="flex-1 px-6 py-3 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Open RN Portal
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/rn/caseload";
            }}
            className="flex-1 px-6 py-3 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Open RN Caseload
          </button>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/rn-diary";
            }}
            className="px-4 py-2 rounded-md text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            RN Diary
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/rn/settings";
            }}
            className="px-4 py-2 rounded-md text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            RN Settings
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/rn-clinical-liaison";
            }}
            className="px-4 py-2 rounded-md text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            RN Clinical Liaison
          </button>
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
