// src/rn/RNCaseView.tsx

import React from "react";
import { useMockDB } from "../lib/mockDB";

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
};

// --- Simple mock-level helpers for Vulnerability / Volatility ----------------

// These are *not* the final engine rules — they are a visual prototype so you
// can see how Vulnerability / Volatility will look on the RN Case View.
// Later we will replace this with real 10-Vs meta-scores.

type Level = "Low" | "Moderate" | "High" | "Critical";

function computeVulnerabilityLevel(opts: {
  ragStatus?: string;
  severityLevel?: number;
  openFlags: any[];
}) {
  const { ragStatus, severityLevel, openFlags } = opts;
  const rag = (ragStatus || "").toLowerCase();

  const highOrCriticalFlags = openFlags.filter(
    (f) =>
      f.severity === "High" ||
      f.severity === "Critical"
  );

  if (highOrCriticalFlags.length > 0) {
    // Any High/Critical flags → treat as Critical vulnerability in this mock
    return "Critical" as Level;
  }

  if (rag === "red") {
    return "High";
  }

  if (rag === "amber" || rag === "yellow") {
    return "Moderate";
  }

  if ((severityLevel ?? 1) >= 3) {
    return "Moderate";
  }

  return "Low";
}

function computeVolatilityLevel(opts: {
  ragStatus?: string;
  severityLevel?: number;
  openFlags: any[];
}) {
  const { ragStatus, severityLevel, openFlags } = opts;
  const rag = (ragStatus || "").toLowerCase();

  // More than 3 open flags of any type → feels "busy/unstable"
  if (openFlags.length >= 4) {
    return "High";
  }

  // Red RAG but not many flags yet → this is "about to move"
  if (rag === "red") {
    return "High";
  }

  // Amber + mid-range severity → moderate volatility
  if (
    (rag === "amber" || rag === "yellow") &&
    (severityLevel ?? 1) >= 2
  ) {
    return "Moderate";
  }

  return "Low";
}

const badgeClassForVulnerability = (level: Level) => {
  switch (level) {
    case "Critical":
      return "bg-red-100 text-red-800 border border-red-200";
    case "High":
      return "bg-rose-100 text-rose-800 border border-rose-200";
    case "Moderate":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "Low":
    default:
      return "bg-emerald-50 text-emerald-800 border border-emerald-200";
  }
};

const badgeClassForVolatility = (level: Exclude<Level, "Critical"> | Level) => {
  switch (level) {
    case "High":
      return "bg-orange-100 text-orange-800 border border-orange-200";
    case "Moderate":
      return "bg-amber-50 text-amber-900 border border-amber-200";
    case "Low":
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200";
  }
};

const RNCaseView: React.FC = () => {
  const { activeCase } = useMockDB();

  if (!activeCase) {
    return (
      <div className="border rounded-xl bg-white p-4 text-[11px] text-slate-600">
        No active case selected. Go back to the RN Dashboard and choose a case
        from the list to view full details.
      </div>
    );
  }

  const { client, flags = [], tasks = [] } = activeCase as any;
  const name = client.name || client.id || "Unknown client";
  const severity = client.severityLevel ?? 1;
  const rag = client.ragStatus || "—";
  const viabScore = client.viabilityScore ?? "—";
  const viabStatus = client.viabilityStatus || "—";
  const vitality = client.vitalityScore ?? "—";

  const openFlags = flags.filter((f: any) => f.status === "Open");
  const closedFlags = flags.filter((f: any) => f.status === "Closed");

  const highCritFlags = openFlags.filter(
    (f: any) => f.severity === "High" || f.severity === "Critical"
  );

  const openTasks = tasks.filter((t: any) => t.status === "Open");
  const completedTasks = tasks.filter((t: any) => t.status === "Completed");

  // --- Vulnerability / Volatility (mock meta-scores for now) -----------------

  const vulnerabilityLevel = computeVulnerabilityLevel({
    ragStatus: rag,
    severityLevel: severity,
    openFlags,
  });

  const volatilityLevel = computeVolatilityLevel({
    ragStatus: rag,
    severityLevel: severity,
    openFlags,
  });

  return (
    <div className="space-y-4 text-[11px]">
      {/* Case header */}
      <section className="border rounded-xl bg-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              RN Case Detail – {name}
            </h2>
            <div className="text-[11px] text-slate-500">
              Case ID:{" "}
              <span className="font-mono">{client.id || "—"}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Status: {client.caseStatus || "Active"}
            </div>
          </div>

          <div className="space-y-1 text-right">
            <div>
              <span className="text-[10px] uppercase text-slate-500 mr-1">
                Severity:
              </span>
              <span className="text-[11px] font-semibold">
                Level {severity}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 mr-1">
                RAG:
              </span>
              <span
                className={[
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                  rag === "Red"
                    ? "bg-red-100 text-red-700"
                    : rag === "Amber"
                    ? "bg-amber-100 text-amber-700"
                    : rag === "Green"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {rag}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 mr-1">
                Viability:
              </span>
              <span className="text-[11px] font-semibold">
                {viabScore} ({viabStatus})
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 mr-1">
                Vitality:
              </span>
              <span className="text-[11px] font-semibold">
                {vitality}
              </span>
            </div>
          </div>
        </div>

        {/* Vulnerability / Volatility badges */}
        <div className="mt-3 border-t border-slate-100 pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-[10px] text-slate-500">
            System-level read: how fragile and how “swingy” this case appears
            today based on RAG, severity, and active flags. These are
            prototype scores for the 10-Vs engine.
          </div>
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            <div
              className={[
                "px-2 py-1 rounded-full text-[10px] font-semibold inline-flex items-center gap-1",
                badgeClassForVulnerability(vulnerabilityLevel),
              ].join(" ")}
            >
              <span className="uppercase tracking-wide">
                Vulnerability
              </span>
              <span>· {vulnerabilityLevel}</span>
            </div>
            <div
              className={[
                "px-2 py-1 rounded-full text-[10px] font-semibold inline-flex items-center gap-1",
                badgeClassForVolatility(volatilityLevel),
              ].join(" ")}
            >
              <span className="uppercase tracking-wide">
                Volatility
              </span>
              <span>· {volatilityLevel}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Flags summary */}
      <section className="border rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Current Flags (Vigilance / 10-Vs Context)
          </div>
          <div className="text-[10px] text-slate-500">
            {openFlags.length} open · {closedFlags.length} closed
          </div>
        </div>

        {openFlags.length === 0 ? (
          <div className="text-[11px] text-slate-600">
            No open flags. Continue monitoring 4Ps, SDOH, meds, and mood on each
            touchpoint.
          </div>
        ) : (
          <div className="space-y-2">
            {openFlags.map((f: any) => (
              <div
                key={f.id}
                className="border rounded-lg px-2 py-1 flex justify-between items-start bg-slate-50"
              >
                <div>
                  <div className="text-[11px] font-semibold text-slate-800">
                    {f.label || "Flag"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Type: {f.type || "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={[
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                      f.severity === "Critical"
                        ? "bg-red-100 text-red-700"
                        : f.severity === "High"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700",
                    ].join(" ")}
                  >
                    {f.severity || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {highCritFlags.length > 0 && (
          <div className="mt-3 text-[10px] text-red-700">
            {highCritFlags.length} High/Critical flags require explicit RN
            documentation and plan. This will be enforced in the RN workflow
            forms (4Ps → 10-Vs engine → plan alignment).
          </div>
        )}
      </section>

      {/* Task / follow-up summary */}
      <section className="border rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Tasks & Follow-Ups
          </div>
          <div className="text-[10px] text-slate-500">
            {openTasks.length} open · {completedTasks.length} completed
          </div>
        </div>

        {openTasks.length === 0 ? (
          <div className="text-[11px] text-slate-600">
            No open tasks currently recorded in the mock data. In production,
            this section will show RN tasks, provider outreach, education,
            and administrative follow-ups.
          </div>
        ) : (
          <div className="space-y-1">
            {openTasks.map((t: any) => (
              <div
                key={t.id}
                className="border rounded-lg px-2 py-1 bg-slate-50 flex justify-between"
              >
                <div>
                  <div className="text-[11px] font-semibold text-slate-800">
                    {t.title || "Task"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Type: {t.type || "—"}
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <div>Due: {formatDate(t.due_date)}</div>
                  <div>Status: {t.status || "Open"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reminder on flow */}
      <section className="border rounded-xl bg-slate-50 p-3">
        <div className="text-[11px] text-slate-700">
          This RN Case Detail view is currently read-only and driven by the
          shared MockDB. As we finish wiring the 4Ps intake, V-Vs engine, and
          follow-up form, this view will become the live chart face for the RN,
          keeping your Lovable portal layout but powered by the 10-Vs /
          Vitality engine and meta-scores like Vulnerability and Volatility.
        </div>
      </section>
    </div>
  );
};

export default RNCaseView;
