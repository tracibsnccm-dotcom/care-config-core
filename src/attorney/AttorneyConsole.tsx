// src/attorney/AttorneyConsole.tsx
// Attorney-facing summary console (prototype only).
// Uses sample data aligned with RNConsole, but shows a high-level,
// attorney-appropriate view (no raw sensitive disclosures).

type AttorneyCaseSummary = {
  id: string;
  displayId: string;
  clientInitials: string;
  age?: number;
  injuryType?: string;

  rnSummary: string;
  treatmentAdherence: "high" | "moderate" | "low";
  painPattern: "improving" | "mixed" | "worsening" | "unclear";
  sdohRisk: "low" | "moderate" | "high";
  safetyConcerns: boolean;

  readyForDemand: boolean;
  lastRNUpdate: string;
};

// Sample-only, will be replaced by Supabase data later
const SAMPLE_ATTORNEY_CASES: AttorneyCaseSummary[] = [
  {
    id: "case-1",
    displayId: "CASE-00123",
    clientInitials: "J.S.",
    age: 42,
    injuryType: "MVC – neck & low back pain",
    rnSummary:
      "Consistently attending PT with some missed visits. Pain logs show a gradual trend toward fewer severe days but ongoing functional limits at work and home.",
    treatmentAdherence: "moderate",
    painPattern: "mixed",
    sdohRisk: "moderate",
    safetyConcerns: false,
    readyForDemand: false,
    lastRNUpdate: "RN update 5 days ago",
  },
  {
    id: "case-2",
    displayId: "CASE-00124",
    clientInitials: "M.L.",
    age: 36,
    injuryType: "Workers’ comp – shoulder injury",
    rnSummary:
      "Strong adherence to home exercise and therapy plan. Pain levels are trending down with improving range of motion and function; work restrictions still in place.",
    treatmentAdherence: "high",
    painPattern: "improving",
    sdohRisk: "low",
    safetyConcerns: false,
    readyForDemand: true,
    lastRNUpdate: "RN update 2 days ago",
  },
  {
    id: "case-3",
    displayId: "CASE-00125",
    clientInitials: "T.R.",
    age: 55,
    injuryType: "Slip and fall – hip fracture",
    rnSummary:
      "Recovery complicated by housing and transport barriers. Pain remains significant with slow gains in mobility. RN coordinating support services and follow-up.",
    treatmentAdherence: "low",
    painPattern: "worsening",
    sdohRisk: "high",
    safetyConcerns: true,
    readyForDemand: false,
    lastRNUpdate: "RN update 1 day ago",
  },
];

function pillClass(color: "green" | "yellow" | "red" | "gray" | "blue") {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium";
  switch (color) {
    case "green":
      return `${base} bg-emerald-50 text-emerald-800 border border-emerald-200`;
    case "yellow":
      return `${base} bg-amber-50 text-amber-800 border border-amber-200`;
    case "red":
      return `${base} bg-rose-50 text-rose-800 border border-rose-200`;
    case "blue":
      return `${base} bg-blue-50 text-blue-800 border border-blue-200`;
    default:
      return `${base} bg-gray-50 text-gray-700 border border-gray-200`;
  }
}

function adherencePill(level: AttorneyCaseSummary["treatmentAdherence"]) {
  switch (level) {
    case "high":
      return <span className={pillClass("green")}>High adherence</span>;
    case "moderate":
      return <span className={pillClass("yellow")}>Moderate adherence</span>;
    case "low":
      return <span className={pillClass("red")}>Low / inconsistent</span>;
  }
}

function painPatternPill(pattern: AttorneyCaseSummary["painPattern"]) {
  switch (pattern) {
    case "improving":
      return <span className={pillClass("green")}>Pain: improving</span>;
    case "mixed":
      return <span className={pillClass("yellow")}>Pain: mixed pattern</span>;
    case "worsening":
      return <span className={pillClass("red")}>Pain: worsening</span>;
    case "unclear":
    default:
      return <span className={pillClass("gray")}>Pain: unclear</span>;
  }
}

function sdohRiskPill(risk: AttorneyCaseSummary["sdohRisk"]) {
  switch (risk) {
    case "low":
      return <span className={pillClass("green")}>SDOH risk: low</span>;
    case "moderate":
      return <span className={pillClass("yellow")}>SDOH risk: moderate</span>;
    case "high":
      return <span className={pillClass("red")}>SDOH risk: high</span>;
  }
}

function safetyPill(hasConcerns: boolean) {
  if (!hasConcerns) {
    return <span className={pillClass("green")}>No active safety concern</span>;
  }
  return (
    <span className={pillClass("red")}>
      RN monitoring safety / stability closely
    </span>
  );
}

function readyForDemandPill(ready: boolean) {
  if (ready) {
    return (
      <span className={pillClass("green")}>
        RN indicates ready for demand/summary
      </span>
    );
  }
  return (
    <span className={pillClass("gray")}>
      Additional recovery time / documentation recommended
    </span>
  );
}

export default function AttorneyConsole() {
  const activeCases = SAMPLE_ATTORNEY_CASES;
  const total = activeCases.length;
  const readyForDemand = activeCases.filter((c) => c.readyForDemand).length;
  const highSdohRisk = activeCases.filter((c) => c.sdohRisk === "high").length;
  const safetyWatch = activeCases.filter((c) => c.safetyConcerns).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Attorney Case Console (Prototype)
            </h2>
            <p className="text-xs text-gray-600">
              High-level view of client recovery, treatment adherence, and
              social risk factors. This prototype uses sample data only and is
              safe for layout and wording decisions.
            </p>
          </div>
          <div className="text-right text-[11px] text-gray-500">
            Prototype only – no live PHI.
            <br />
            Final build will show RN-filtered, attorney-appropriate summaries.
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-2">
          <div className="rounded-lg border bg-gray-50 px-3 py-2">
            <div className="text-[10px] uppercase text-gray-500">
              Active cases
            </div>
            <div className="text-base font-semibold text-gray-900">
              {total}
            </div>
          </div>
          <div className="rounded-lg border bg-emerald-50 px-3 py-2">
            <div className="text-[10px] uppercase text-emerald-700">
              Ready for demand / summary
            </div>
            <div className="text-base font-semibold text-emerald-800">
              {readyForDemand}
            </div>
          </div>
          <div className="rounded-lg border bg-amber-50 px-3 py-2">
            <div className="text-[10px] uppercase text-amber-700">
              High SDOH risk
            </div>
            <div className="text-base font-semibold text-amber-800">
              {highSdohRisk}
            </div>
          </div>
          <div className="rounded-lg border bg-rose-50 px-3 py-2">
            <div className="text-[10px] uppercase text-rose-700">
              Under RN safety watch
            </div>
            <div className="text-base font-semibold text-rose-800">
              {safetyWatch}
            </div>
          </div>
        </div>
      </section>

      {/* Case table */}
      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Case Summaries (Sample)</h3>
          <p className="text-[11px] text-gray-500">
            Designed for quick review; full narrative reports will be generated
            separately.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-[11px] text-gray-600">
                <th className="border-b px-3 py-2 text-left font-semibold">
                  Case / Client
                </th>
                <th className="border-b px-3 py-2 text-left font-semibold">
                  RN Summary (High-Level)
                </th>
                <th className="border-b px-3 py-2 text-left font-semibold">
                  Clinical Signals
                </th>
                <th className="border-b px-3 py-2 text-left font-semibold">
                  Readiness
                </th>
                <th className="border-b px-3 py-2 text-left font-semibold">
                  Last RN Update
                </th>
              </tr>
            </thead>
            <tbody>
              {activeCases.map((c) => (
                <tr
                  key={c.id}
                  className="align-top border-b last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="font-semibold text-gray-800">
                      {c.displayId}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      {c.clientInitials}
                      {c.age ? ` · ${c.age} y/o` : ""}{" "}
                      {c.injuryType ? `· ${c.injuryType}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2 max-w-xs">
                    <p className="text-gray-800 leading-snug">{c.rnSummary}</p>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap gap-1.5">
                        {adherencePill(c.treatmentAdherence)}
                        {painPatternPill(c.painPattern)}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sdohRiskPill(c.sdohRisk)}
                        {safetyPill(c.safetyConcerns)}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      {readyForDemandPill(c.readyForDemand)}
                      <p className="text-[11px] text-gray-500">
                        In the full system, this will link to a structured
                        attorney report with RN narrative, function, and
                        recovery trajectory.
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                    {c.lastRNUpdate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-gray-500">
          Note: Attorneys see patterns and high-level signals only. Detailed
          safety, mental health, or trauma content remains in RN-only views and
          protected clinical notes.
        </p>
      </section>
    </div>
  );
}
