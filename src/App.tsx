// src/App.tsx
// RN Case Engine with Timeline + Crisis Mode + Dev Role Switcher
// Includes working localStorage persistence after refresh

import React, { useState, useEffect } from "react";
import { useMockDB } from "./lib/mockDB";
import RNFollowUpForm from "./rn/RNFollowUpForm";
import { RNCaseTimeline } from "./components/RNCaseTimeline";
import CrisisModeButton from "./components/CrisisModeButton";
import RNCrisisScreen from "./rn/RNCrisisScreen";
import BuddyCrisisScreen from "./buddy/BuddyCrisisScreen";
import SupervisorCrisisScreen from "./supervisor/SupervisorCrisisScreen";
import { CrisisState } from "./domain/crisisState";
import {
  CrisisCategory,
  CRISIS_CATEGORY_LABELS,
} from "./domain/crisisCategory";

const STORAGE_KEY = "rcms_crisis_session_v1";

const App: React.FC = () => {
  const { activeCase } = useMockDB() as any;

  // View selector for dev simulation
  const [viewMode, setViewMode] = useState<"rn" | "buddy" | "supervisor">("rn");

  // Crisis session state (starts empty, loads after mount)
  const [isCrisisActive, setIsCrisisActive] = useState<boolean>(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [crisisState, setCrisisState] = useState<CrisisState>("crisis_detected");
  const [crisisCategory, setCrisisCategory] = useState<CrisisCategory | null>(
    null
  );
  const [systemUrgency, setSystemUrgency] = useState<
    "low" | "moderate" | "high" | null
  >(null);

  // Load stored crisis session after mount
  useEffect(() => {
    const storedRaw = localStorage.getItem(STORAGE_KEY);
    if (!storedRaw) return;

    try {
      const stored = JSON.parse(storedRaw);
      if (stored?.isCrisisActive) setIsCrisisActive(true);
      if (stored?.incidentId) setIncidentId(stored.incidentId);
      if (stored?.crisisState) setCrisisState(stored.crisisState);
      if (stored?.crisisCategory) setCrisisCategory(stored.crisisCategory);
      if (stored?.systemUrgency) setSystemUrgency(stored.systemUrgency);
    } catch (err) {
      console.warn("Failed to load crisis session:", err);
    }
  }, []);

  // Save session whenever it changes
  useEffect(() => {
    if (isCrisisActive) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isCrisisActive,
          incidentId,
          crisisState,
          crisisCategory,
          systemUrgency,
        })
      );
    }
  }, [isCrisisActive, incidentId, crisisState, crisisCategory, systemUrgency]);

  // Clear session and storage
  const handleCrisisExit = () => {
    setIsCrisisActive(false);
    setIncidentId(null);
    setCrisisCategory(null);
    setSystemUrgency(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!activeCase) {
    return (
      <div className="border rounded-xl bg-white p-4 text-[11px] text-slate-600">
        No active case selected. Choose a case from RN dashboard.
      </div>
    );
  }

  const client = activeCase.client ?? activeCase.clientProfile ?? {};
  const clientName: string = client.name ?? activeCase.clientName ?? "Client";
  const caseId: string =
    activeCase.id ?? activeCase.caseId ?? client.id ?? "case-001";

  const handleCrisisStart = (newIncidentId: string) => {
    setIncidentId(newIncidentId);
    setCrisisState("crisis_detected");
    setSystemUrgency(null);
    setIsCrisisActive(true);
  };

  const renderSystemUrgencyBadge = () => {
    if (!systemUrgency) return null;

    let bgClass = "bg-gray-200 text-gray-800 border-gray-300";
    if (systemUrgency === "low") bgClass = "bg-green-100 text-green-800 border-green-300";
    if (systemUrgency === "moderate") bgClass = "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (systemUrgency === "high") bgClass = "bg-red-100 text-red-800 border-red-300";

    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase border ${bgClass}`}>
        Buddy System Urgency: {systemUrgency}
      </span>
    );
  };

  const renderCrisisCategoryBadge = () => {
    if (!isCrisisActive || !crisisCategory) return null;

    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 text-[10px] font-semibold uppercase">
        Crisis Type: {CRISIS_CATEGORY_LABELS[crisisCategory]}
      </span>
    );
  };

  return (
    <div className="space-y-3 text-[11px]">
      {/* Header */}
      <section className="border rounded-xl bg-white p-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            RN Case Engine – Crisis Mode Dev View
          </div>
          <p className="text-[10px] text-slate-500">
            Case: <span className="font-mono">{caseId}</span> · Client:{" "}
            <span className="font-semibold">{clientName}</span>
          </p>
          {incidentId && (
            <p className="text-[10px] text-slate-500">
              Active incident ID: <span className="font-mono">{incidentId}</span>
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-1 items-center">
            {renderCrisisCategoryBadge()}
            {renderSystemUrgencyBadge()}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex flex-col items-end gap-2">

          {/* View selector */}
          <div className="flex gap-1">
            <button
              className={`px-2 py-1 rounded text-[10px] border ${
                viewMode === "rn"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-700"
              }`}
              onClick={() => setViewMode("rn")}
            >
              RN View
            </button>
            <button
              className={`px-2 py-1 rounded text-[10px] border ${
                viewMode === "buddy"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-700"
              }`}
              onClick={() => setViewMode("buddy")}
            >
              Buddy View
            </button>
            <button
              className={`px-2 py-1 rounded text-[10px] border ${
                viewMode === "supervisor"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-700"
              }`}
              onClick={() => setViewMode("supervisor")}
            >
              Supervisor View
            </button>
          </div>

          {/* Crisis type picker + start */}
          {viewMode === "rn" && !isCrisisActive && (
            <div className="flex flex-col items-end gap-1">
              <label className="text-[10px] text-slate-700 flex flex-col items-end">
                Crisis Type
                <select
                  className="mt-0.5 border rounded px-1 py-0.5 text-[10px] bg-white"
                  value={crisisCategory ?? ""}
                  onChange={(e) => {
                    const value = e.target.value as CrisisCategory | "";
                    setCrisisCategory(
                      value === "" ? null : (value as CrisisCategory)
                    );
                  }}
                >
                  <option value="">-- Choose crisis type --</option>
                  <option value="behavioral_suicide">
                    Behavioral / Suicide / Self-harm
                  </option>
                  <option value="medical">Medical Emergency</option>
                  <option value="violence_assault">
                    Violence / Assault / Safety
                  </option>
                  <option value="other">Other / Unsure</option>
                </select>
              </label>

              <CrisisModeButton
                caseId={caseId}
                crisisCategory={crisisCategory}
                onStart={handleCrisisStart}
              />
            </div>
          )}

          {/* Exit Crisis Mode */}
          {isCrisisActive && (
            <button
              className="px-2 py-1 rounded text-[10px] bg-gray-300 text-gray-800 border"
              onClick={handleCrisisExit}
            >
              Exit Crisis Mode
            </button>
          )}
        </div>
      </section>

      {/* Main Content */}
      {viewMode === "rn" && (
        <>
          {isCrisisActive ? (
            <section className="border rounded-xl bg-white p-3">
              <RNCrisisScreen
                caseId={caseId}
                incidentId={incidentId ?? undefined}
                state={crisisState}
                onExit={handleCrisisExit}
              />
            </section>
          ) : (
            <section className="grid md:grid-cols-[2fr,1.5fr] gap-3">
              <div>
                <RNFollowUpForm />
              </div>
              <div>
                <RNCaseTimeline />
              </div>
            </section>
          )}
        </>
      )}

      {viewMode === "buddy" && (
        <section className="border rounded-xl bg-white p-3">
          <BuddyCrisisScreen
            caseId={caseId}
            incidentId={incidentId ?? undefined}
            onSystemUrgencyChange={setSystemUrgency}
          />
        </section>
      )}

      {viewMode === "supervisor" && (
        <section className="border rounded-xl bg-white p-3">
          <SupervisorCrisisScreen
            caseId={caseId}
            incidentId={incidentId ?? undefined}
          />
        </section>
      )}
    </div>
  );
};

export default App;
