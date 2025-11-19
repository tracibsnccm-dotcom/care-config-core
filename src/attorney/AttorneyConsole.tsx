// src/attorney/AttorneyConsole.tsx

import React, { useMemo } from "react";
import { useMockDB } from "../lib/mockDB";
import { AppState } from "../lib/models";

interface AttorneyConsoleProps {
  onOpenCase?: (index: number) => void;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
};

const AttorneyConsole: React.FC<AttorneyConsoleProps> = ({ onOpenCase }) => {
  const { cases } = useMockDB();

  // Only show cases that are not closed / archived
  const activeCases: AppState[] = useMemo(() => {
    return cases.filter((c) => {
      const client: any = c.client || {};
      const status = (client.caseStatus || "Active").toLowerCase();
      return !["closed", "archived"].includes(status);
    });
  }, [cases]);

  const stats = useMemo(() => {
    let total = activeCases.length;
    let red = 0;
    let amber = 0;
    let green = 0;
    let highRisk = 0;
    let critical = 0;

    activeCases.forEach((c) => {
      const client: any = c.client || {};
      const rag = client.ragStatus || "";

      if (rag === "Red") red += 1;
      else if (rag === "Amber") amber += 1;
      else if (rag === "Green") green += 1;

      (c.flags || []).forEach((f: any) => {
        if (f.status === "Open") {
          if (f.severity === "High") highRisk += 1;
          if (f.severity === "Critical") critical += 1;
        }
      });
    });

    return { total, red, amber, green, highRisk, critical };
  }, [activeCases]);

  return (
    <div className="space-y-4 text-[11px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Attorney Case Worklist
          </h2>
          <p className="text-[11px] text-slate-600">
            Live view of active and pending cases flowing through Reconcile
            C.A.R.E.™. This is where counsel sees which cases are negotiation-ready,
            which need more development, and where SDOH/4Ps make the story
            stronger.
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-500">
          <div>Active / Pending Cases: {stats.total}</div>
          <div>
            RAG Mix: {stats.red} Red · {stats.amber} Amber · {stats.green} Green
          </div>
          <div>
            High-Risk Flags: {stats.highRisk} High / {stats.critical} Critical
          </div>
        </div>
      </div>

      {/* Worklist table */}
      <section className="border rounded-xl bg-white px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Active / Pending Case List
          </div>
          <div className="text-[10px] text-slate-500">
            Click a row to open the Attorney Case View.
          </div>
        </div>

        {activeCases.length === 0 ? (
          <div className="text-[11px] text-slate-600">
            There are currently no active or pending cases in the mock data.
            Once real cases are flowing from intake and RN case management,
            they will appear here with full negotiation context.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px]">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-1 pr-2">Client</th>
                  <th className="py-1 pr-2">Severity</th>
                  <th className="py-1 pr-2">RAG</th>
                  <th className="py-1 pr-2">Viability / Vitality</th>
                  <th className="py-1 pr-2">Open Flags</th>
                  <th className="py-1 pr-2">Negotiation Signal</th>
                </tr>
              </thead>
              <tbody>
                {activeCases.map((c, idx) => {
                  const client: any = c.client || {};
                  const name = client.name || client.id || "Unknown client";
                  const sev = client.severityLevel ?? 1;
                  const rag = client.ragStatus || "—";
                  const viab = client.viabilityScore ?? "—";
                  const viabStatus = client.viabilityStatus || "";
                  const vital = client.vitalityScore ?? "—";

                  const openFlags = (c.flags || []).filter(
                    (f: any) => f.status === "Open"
                  );
                  const openCount = openFlags.length;
                  const highCritCount = openFlags.filter(
                    (f: any) =>
                      f.severity === "High" || f.severity === "Critical"
                  ).length;

                  // Very simple mock "negotiation readiness" signal
                  const isHot =
                    (rag === "Red" || rag === "Amber") && highCritCount > 0;
                  const isStable =
                    rag === "Green" && openCount === 0 && sev <= 2;

                  const signalLabel = isHot
                    ? "High leverage – story developing"
                    : isStable
                    ? "Stable – monitor / ready when settlement moves"
                    : "Active – continue clinical build-out";

                  // Map to global index in MockDB so we can set active case
                  const { cases: allCases } = useMockDB();
                  const globalIndex = allCases.indexOf(c);

                  return (
                    <tr
                      key={client.id || idx}
                      className="border-b last:border-0 hover:bg-slate-50 cursor-pointer"
                      onClick={() =>
                        onOpenCase && globalIndex >= 0
                          ? onOpenCase(globalIndex)
                          : undefined
                      }
                    >
                      <td className="py-1 pr-2">
                        <div className="font-semibold text-slate-800">
                          {name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Case ID: {client.id || "—"} · Status:{" "}
                          {client.caseStatus || "Active"}
                        </div>
                      </td>
                      <td className="py-1 pr-2">
                        Level {sev}
                      </td>
                      <td className="py-1 pr-2">
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
                      </td>
                      <td className="py-1 pr-2">
                        <div>
                          Viability: {viab}{" "}
                          {viabStatus && (
                            <span className="text-[10px] text-slate-500">
                              ({viabStatus})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Vitality: {vital}
                        </div>
                      </td>
                      <td className="py-1 pr-2">
                        <div>{openCount} open</div>
                        {highCritCount > 0 && (
                          <div className="text-[10px] text-red-600">
                            {highCritCount} High/Critical
                          </div>
                        )}
                      </td>
                      <td className="py-1 pr-2">
                        <div className="text-[10px] text-slate-700">
                          {signalLabel}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          This will later be driven by your real ODG/MCG,
                          return-to-work, and functional progress data.
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AttorneyConsole;
