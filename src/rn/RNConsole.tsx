// src/rn/RNConsole.tsx
// RN-facing case dashboard (prototype).
// Currently uses SAMPLE_CASES only. Later we will replace with Supabase-backed data.

import { useMemo, useState } from "react";

type FourPsSnapshot = {
  physical: number;
  psychological: number;
  psychosocial: number;
  professional: number;
};

type SdohSnapshot = {
  housing: "ok" | "issue" | "unknown";
  food: "ok" | "issue" | "unknown";
  transport: "ok" | "issue" | "unknown";
  finances: "ok" | "issue" | "unknown";
  safety: "ok" | "issue" | "unknown";
};

type SensitiveFlags = {
  homeSafety?: boolean;
  partnerViolence?: boolean;
  pastAbuse?: boolean;
  selfHarm?: boolean;
  substanceUse?: boolean;
};

// Prototype structure for your 10 Vs of Care Management
type TenVsSnapshot = {
  v1: number;
  v2: number;
  v3: number;
  v4: number;
  v5: number;
  v6: number;
  v7: number;
  v8: number;
  v9: number;
  v10: number;
};

type CaseStatus =
  | "INTAKE_PENDING"
  | "INTAKE_IN_PROGRESS"
  | "ACTIVE_MONITORING"
  | "READY_FOR_ATTORNEY_SUMMARY";

type CaseTimelineCategory =
  | "INTAKE"
  | "TREATMENT"
  | "SDOH"
  | "ADMIN"
  | "SAFETY";

type CaseTimelineEvent = {
  id: string;
  dateLabel: string; // e.g. "Day 0", "Week 2", "Month 1"
  category: CaseTimelineCategory;
  summary: string;
};

type RNCaseSummary = {
  id: string;
  displayId: string;
  initials: string;
  age?: number;
  injuryType?: string;
  fourPs: FourPsSnapshot;
  sdoh: SdohSnapshot;
  sensitive: SensitiveFlags;
  shortTermGoal?: string;
  mediumTermGoal?: string;
  longTermGoal?: string;

  status: CaseStatus;
  nextRNAction: string;
  dueInDays: number; // negative values = overdue

  tenVs?: TenVsSnapshot;
  timeline?: CaseTimelineEvent[];
};

const SAMPLE_CASES: RNCaseSummary[] = [
  {
    id: "case-1",
    displayId: "CASE-00123",
    initials: "J.S.",
    age: 42,
    injuryType: "MVC – neck & low back pain",
    fourPs: {
      physical: 2,
      psychological: 3,
      psychosocial: 3,
      professional: 1,
    },
    sdoh: {
      housing: "ok",
      food: "ok",
      transport: "issue",
      finances: "issue",
      safety: "ok",
    },
    sensitive: {
      homeSafety: false,
      partnerViolence: false,
      pastAbuse: true,
      selfHarm: false,
      substanceUse: false,
    },
    shortTermGoal: "Make it to PT twice a week and sleep at least 5–6 hours.",
    mediumTermGoal:
      "Walk 20 minutes without stopping and reduce flare-ups at work.",
    longTermGoal:
      "Return to full-time work with tolerable pain and independence at home.",
    status: "ACTIVE_MONITORING",
    nextRNAction: "Review missed PT visits and update recovery plan.",
    dueInDays: -1,
    tenVs: {
      v1: 2,
      v2: 3,
      v3: 3,
      v4: 2,
      v5: 3,
      v6: 2,
      v7: 3,
      v8: 2,
      v9: 3,
      v10: 2,
    },
    timeline: [
      {
        id: "c1-e1",
        dateLabel: "Day 0",
        category: "INTAKE",
        summary:
          "Client intake completed – baseline pain, function, and 4Ps documented.",
      },
      {
        id: "c1-e2",
        dateLabel: "Week 1",
        category: "TREATMENT",
        summary:
          "Physical therapy started; RN reviewed initial PT plan and goals.",
      },
      {
        id: "c1-e3",
        dateLabel: "Week 3",
        category: "TREATMENT",
        summary:
          "Two PT sessions missed; RN flagged adherence concern and added follow-up task.",
      },
      {
        id: "c1-e4",
        dateLabel: "Week 4",
        category: "SDOH",
        summary:
          "Client reported difficulty with transportation to PT; RN exploring transport options.",
      },
    ],
  },
  {
    id: "case-2",
    displayId: "CASE-00124",
    initials: "M.L.",
    age: 36,
    injuryType: "Workers’ comp – shoulder injury",
    fourPs: {
      physical: 3,
      psychological: 4,
      psychosocial: 4,
      professional: 2,
    },
    sdoh: {
      housing: "ok",
      food: "ok",
      transport: "ok",
      finances: "issue",
      safety: "ok",
    },
    sensitive: {
      homeSafety: false,
      partnerViolence: false,
      pastAbuse: false,
      selfHarm: false,
      substanceUse: false,
    },
    shortTermGoal: "Complete home exercises 4 days/week.",
    mediumTermGoal: "Lift light objects for daily tasks without severe pain.",
    longTermGoal: "Return to modified duty with safe restrictions.",
    status: "READY_FOR_ATTORNEY_SUMMARY",
    nextRNAction: "Draft updated attorney summary with current function.",
    dueInDays: 3,
    tenVs: {
      v1: 4,
      v2: 4,
      v3: 4,
      v4: 3,
      v5: 4,
      v6: 3,
      v7: 4,
      v8: 3,
      v9: 4,
      v10: 3,
    },
    timeline: [
      {
        id: "c2-e1",
        dateLabel: "Day 0",
        category: "INTAKE",
        summary:
          "Client intake completed – injury details, work role, and baseline function recorded.",
      },
      {
        id: "c2-e2",
        dateLabel: "Week 2",
        category: "TREATMENT",
        summary:
          "Home exercise program established; client reports strong adherence.",
      },
      {
        id: "c2-e3",
        dateLabel: "Week 4",
        category: "ADMIN",
        summary:
          "RN sent interim progress note to attorney with early functional gains.",
      },
      {
        id: "c2-e4",
        dateLabel: "Week 6",
        category: "TREATMENT",
        summary:
          "Range of motion and pain scores improved; RN indicates case is approaching demand-ready.",
      },
    ],
  },
  {
    id: "case-3",
    displayId: "CASE-00125",
    initials: "T.R.",
    age: 55,
    injuryType: "Slip and fall – hip fracture",
    fourPs: {
      physical: 2,
      psychological: 2,
      psychosocial: 2,
      professional: 3,
    },
    sdoh: {
      housing: "issue",
      food: "issue",
      transport: "issue",
      finances: "issue",
      safety: "unknown",
    },
    sensitive: {
      homeSafety: true,
      partnerViolence: false,
      pastAbuse: false,
      selfHarm: false,
      substanceUse: false,
    },
    shortTermGoal: "Be able to transfer safely with assistance.",
    mediumTermGoal: "Walk indoors with a device and minimal help.",
    longTermGoal:
      "Return to living at home safely with support in place.",
    status: "INTAKE_IN_PROGRESS",
    nextRNAction: "Complete intake review and confirm home safety resources.",
    dueInDays: 1,
    tenVs: {
      v1: 2,
      v2: 2,
      v3: 2,
      v4: 2,
      v5: 2,
      v6: 2,
      v7: 2,
      v8: 2,
      v9: 2,
      v10: 2,
    },
    timeline: [
      {
        id: "c3-e1",
        dateLabel: "Day 0",
        category: "INTAKE",
        summary:
          "Initial intake started; mobility and home layout concerns identified.",
      },
      {
        id: "c3-e2",
        dateLabel: "Week 1",
        category: "SAFETY",
        summary:
          "RN flagged home safety concerns; recommended home health and equipment evaluation.",
      },
      {
        id: "c3-e3",
        dateLabel: "Week 2",
        category: "SDOH",
        summary:
          "Challenges with food access and transportation documented; RN coordinating community resources.",
      },
    ],
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

function fourPsPill(label: string, value: number) {
  let color: "green" | "yellow" | "red";
  if (value >= 4) color = "green";
  else if (value === 3) color = "yellow";
  else color = "red";

  return (
    <span key={label} className={pillClass(color)}>
      <span className="mr-1 text-[9px] uppercase tracking-wide">{label}</span>
      <span>{value}/5</span>
    </span>
  );
}

function sdohPill(domain: string, status: SdohSnapshot[keyof SdohSnapshot]) {
  let color: "green" | "yellow" | "red" | "gray";
  if (status === "ok") color = "green";
  else if (status === "issue") color = "red";
  else color = "gray";

  return (
    <span key={domain} className={pillClass(color)}>
      <span className="mr-1 text-[9px] uppercase tracking-wide">
        {domain}
      </span>
      <span>
        {status === "ok"
          ? "OK"
          : status === "issue"
          ? "Needs support"
          : "Unknown"}
      </span>
    </span>
  );
}

function sensitiveBadges(flags: SensitiveFlags) {
  const items: string[] = [];
  if (flags.homeSafety) items.push("Home safety");
  if (flags.partnerViolence) items.push("Partner/family violence");
  if (flags.pastAbuse) items.push("History of abuse");
  if (flags.selfHarm) items.push("Self-harm / SI concerns");
  if (flags.substanceUse) items.push("Substance use impact");

  if (!items.length) {
    return (
      <span className={pillClass("green")}>
        No active safety flags documented
      </span>
    );
  }

  return items.map((label) => (
    <span key={label} className={pillClass("red")}>
      {label}
    </span>
  ));
}

function statusBadge(status: CaseStatus) {
  switch (status) {
    case "INTAKE_PENDING":
      return <span className={pillClass("gray")}>Intake pending</span>;
    case "INTAKE_IN_PROGRESS":
      return <span className={pillClass("blue")}>Intake in progress</span>;
    case "ACTIVE_MONITORING":
      return <span className={pillClass("yellow")}>Active monitoring</span>;
    case "READY_FOR_ATTORNEY_SUMMARY":
      return (
        <span className={pillClass("green")}>Ready for attorney summary</span>
      );
  }
}

function dueBadge(dueInDays: number) {
  let label: string;
  let color: "green" | "yellow" | "red" | "gray";

  if (dueInDays < 0) {
    label = `Overdue by ${Math.abs(dueInDays)}d`;
    color = "red";
  } else if (dueInDays === 0) {
    label = "Due today";
    color = "red";
  } else if (dueInDays <= 2) {
    label = `Due in ${dueInDays}d`;
    color = "yellow";
  } else {
    label = `Due in ${dueInDays}d`;
    color = "gray";
  }

  return <span className={pillClass(color)}>{label}</span>;
}

// Prototype helper for 10 Vs – just visual structure for now.
function tenVsPill(label: string, value: number) {
  let color: "green" | "yellow" | "red";
  if (value >= 4) color = "green";
  else if (value === 3) color = "yellow";
  else color = "red";

  return (
    <span key={label} className={pillClass(color)}>
      <span className="mr-1 text-[9px] uppercase tracking-wide">{label}</span>
      <span>{value}/5</span>
    </span>
  );
}

function timelineCategoryPill(category: CaseTimelineCategory) {
  switch (category) {
    case "INTAKE":
      return <span className={pillClass("blue")}>Intake</span>;
    case "TREATMENT":
      return <span className={pillClass("green")}>Treatment</span>;
    case "SDOH":
      return <span className={pillClass("yellow")}>SDOH</span>;
    case "SAFETY":
      return <span className={pillClass("red")}>Safety</span>;
    case "ADMIN":
    default:
      return <span className={pillClass("gray")}>Admin / updates</span>;
  }
}

type StatusFilter = "ALL" | CaseStatus;
type RiskFilter = "ALL" | "STABLE" | "MILD" | "MODERATE" | "HIGH";

export default function RNConsole() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    SAMPLE_CASES[0]?.id ?? ""
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [searchText, setSearchText] = useState("");

  const selectedCase =
    SAMPLE_CASES.find((c) => c.id === selectedCaseId) ?? SAMPLE_CASES[0];

  // Dashboard-level summary counts
  const summary = useMemo(() => {
    const total = SAMPLE_CASES.length;
    const overdue = SAMPLE_CASES.filter((c) => c.dueInDays <= 0).length;
    const withSafetyFlags = SAMPLE_CASES.filter((c) =>
      Boolean(
        c.sensitive.homeSafety ||
          c.sensitive.partnerViolence ||
          c.sensitive.pastAbuse ||
          c.sensitive.selfHarm ||
          c.sensitive.substanceUse
      )
    ).length;
    const readyForSummary = SAMPLE_CASES.filter(
      (c) => c.status === "READY_FOR_ATTORNEY_SUMMARY"
    ).length;

    return { total, overdue, withSafetyFlags, readyForSummary };
  }, []);

  const filteredCases = useMemo(() => {
    return SAMPLE_CASES.filter((c) => {
      // status filter
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;

      // risk filter
      const riskPoints =
        (c.fourPs.physical <= 2 ? 1 : 0) +
        (c.sdoh.finances === "issue" ? 1 : 0) +
        (c.sdoh.transport === "issue" ? 1 : 0) +
        (c.sensitive.homeSafety ? 1 : 0);
      let riskCategory: RiskFilter = "STABLE";
      if (riskPoints >= 3) riskCategory = "HIGH";
      else if (riskPoints === 2) riskCategory = "MODERATE";
      else if (riskPoints === 1) riskCategory = "MILD";
      else riskCategory = "STABLE";

      if (riskFilter !== "ALL" && riskFilter !== riskCategory) return false;

      // text search (case id or initials)
      if (searchText.trim()) {
        const term = searchText.trim().toLowerCase();
        const haystack =
          `${c.displayId} ${c.initials} ${c.injuryType ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [statusFilter, riskFilter, searchText]);

  // If the selected case is filtered out, gently switch to the first filtered one
  const safeSelectedCase =
    filteredCases.find((c) => c.id === selectedCase.id) ??
    filteredCases[0] ??
    SAMPLE_CASES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              RN Case Dashboard (Prototype)
            </h2>
            <p className="text-xs text-gray-600">
              This view is designed for RN Care Managers to see which cases need
              attention today, which intakes are in progress, and where social
              or safety factors may impact the plan of care. Sample data only –
              no live PHI.
            </p>
          </div>
          <div className="text-right text-[11px] text-gray-500">
            Prototype only – safe for design decisions.
            <br />
            Later: connect to Supabase with RN-only access.
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-2">
          <div className="rounded-lg border bg-gray-50 px-3 py-2">
            <div className="text-[10px] uppercase text-gray-500">
              Active cases
            </div>
            <div className="text-base font-semibold text-gray-900">
              {summary.total}
            </div>
          </div>
          <div className="rounded-lg border bg-rose-50 px-3 py-2">
            <div className="text-[10px] uppercase text-rose-700">
              Due today / overdue
            </div>
            <div className="text-base font-semibold text-rose-800">
              {summary.overdue}
            </div>
          </div>
          <div className="rounded-lg border bg-amber-50 px-3 py-2">
            <div className="text-[10px] uppercase text-amber-700">
              Safety / sensitive flags
            </div>
            <div className="text-base font-semibold text-amber-800">
              {summary.withSafetyFlags}
            </div>
          </div>
          <div className="rounded-lg border bg-emerald-50 px-3 py-2">
            <div className="text-[10px] uppercase text-emerald-700">
              Ready for attorney summary
            </div>
            <div className="text-base font-semibold text-emerald-800">
              {summary.readyForSummary}
            </div>
          </div>
        </div>
      </section>

      {/* Layout: Case list (left) + detail (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px,minmax(0,1fr)] gap-4">
        {/* Case list */}
        <section className="rounded-xl border bg-white p-3 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold">Active Cases (Sample)</h3>
            <div className="text-[11px] text-gray-500">
              Filter by status, risk, or search
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2 text-[11px]">
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-gray-600 font-medium">Status:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-2 py-0.5 rounded-full border ${
                    statusFilter === "ALL"
                      ? "bg-blue-50 border-blue-400 text-blue-800"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("INTAKE_IN_PROGRESS")}
                  className={`px-2 py-0.5 rounded-full border ${
                    statusFilter === "INTAKE_IN_PROGRESS"
                      ? "bg-blue-50 border-blue-400 text-blue-800"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  Intake in progress
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ACTIVE_MONITORING")}
                  className={`px-2 py-0.5 rounded-full border ${
                    statusFilter === "ACTIVE_MONITORING"
                      ? "bg-blue-50 border-blue-400 text-blue-800"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  Active monitoring
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("READY_FOR_ATTORNEY_SUMMARY")}
                  className={`px-2 py-0.5 rounded-full border ${
                    statusFilter === "READY_FOR_ATTORNEY_SUMMARY"
                      ? "bg-blue-50 border-blue-400 text-blue-800"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  Ready for attorney
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-gray-600 font-medium">Risk:</span>
                <button
                  type="button"
                  onClick={() => setRiskFilter("ALL")}
                  className={`px-2 py-0.5 rounded-full border ${
                    riskFilter === "ALL"
                      ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setRiskFilter("STABLE")}
                  className={`px-2 py-0.5 rounded-full border ${
                    riskFilter === "STABLE"
                      ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  Stable
                </button>
                <button
                  type="button"
                  onClick={() => setRiskFilter("MILD")}
                  className={`px-2 py-0.5 rounded-full border ${
                    riskFilter === "MILD"
                      ? "bg-amber-50 border-amber-400 text-amber-800"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  Mild
                </button>
                <button
                  type="button"
                  onClick={() => setRiskFilter("MODERATE")}
                  className={`px-2 py-0.5 rounded-full border ${
                    riskFilter === "MODERATE"
                      ? "bg-amber-50 border-amber-400 text-amber-800"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  Moderate
                </button>
                <button
                  type="button"
                  onClick={() => setRiskFilter("HIGH")}
                  className={`px-2 py-0.5 rounded-full border ${
                    riskFilter === "HIGH"
                      ? "bg-rose-50 border-rose-400 text-rose-800"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  High complexity
                </button>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by case ID, initials, or injury…"
                className="w-full border rounded-lg px-2 py-1 text-[11px]"
              />
            </div>
          </div>

          <div className="space-y-2 text-sm mt-2">
            {filteredCases.length === 0 && (
              <div className="text-[11px] text-gray-500 border rounded-lg bg-gray-50 px-3 py-2">
                No cases match the current filters. Try clearing filters or
                search.
              </div>
            )}

            {filteredCases.map((c) => {
              const isSelected = c.id === safeSelectedCase.id;

              const riskPoints =
                (c.fourPs.physical <= 2 ? 1 : 0) +
                (c.sdoh.finances === "issue" ? 1 : 0) +
                (c.sdoh.transport === "issue" ? 1 : 0) +
                (c.sensitive.homeSafety ? 1 : 0);
              let riskLabel = "Stable";
              let riskColor: "green" | "yellow" | "red" = "green";
              if (riskPoints >= 3) {
                riskLabel = "High complexity";
                riskColor = "red";
              } else if (riskPoints === 2) {
                riskLabel = "Moderate";
                riskColor = "yellow";
              } else if (riskPoints === 1) {
                riskLabel = "Mild";
                riskColor = "yellow";
              }

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                    isSelected
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold">
                        {c.displayId} · {c.initials}
                      </div>
                      {c.injuryType && (
                        <div className="text-[11px] text-gray-600">
                          {c.injuryType}
                        </div>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {statusBadge(c.status)}
                        {dueBadge(c.dueInDays)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={pillClass(riskColor)}>{riskLabel}</span>
                      <div className="flex flex-wrap gap-1">
                        {fourPsPill("Physical", c.fourPs.physical)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-600 line-clamp-2">
                    Next RN step: {c.nextRNAction}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Case detail */}
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
          {safeSelectedCase ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">
                    {safeSelectedCase.displayId} · {safeSelectedCase.initials}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {safeSelectedCase.age
                      ? `${safeSelectedCase.age} y/o`
                      : "Age not specified"}
                    {safeSelectedCase.injuryType
                      ? ` · ${safeSelectedCase.injuryType}`
                      : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {statusBadge(safeSelectedCase.status)}
                    {dueBadge(safeSelectedCase.dueInDays)}
                  </div>
                </div>
                <div className="text-right text-[11px] text-gray-500">
                  RN Case Detail View
                  <br />
                  Sample data only
                </div>
              </div>

              {/* Next RN action */}
              <div className="rounded-lg border bg-blue-50/70 p-3 space-y-1">
                <div className="text-[11px] font-semibold text-blue-900">
                  Next RN Action
                </div>
                <div className="text-xs text-blue-950">
                  {safeSelectedCase.nextRNAction}
                </div>
                <p className="text-[11px] text-blue-900/80 mt-1">
                  In the full build, this section will be driven by workflow
                  rules (e.g., intake completed, missed appointments, new
                  safety flags, or attorney requests).
                </p>
              </div>

              {/* Case Timeline */}
              {safeSelectedCase.timeline &&
                safeSelectedCase.timeline.length > 0 && (
                  <div className="rounded-lg border bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold">
                        Case Timeline (Prototype)
                      </h4>
                      <span className="text-[11px] text-gray-500">
                        Key intake, treatment, SDOH, and safety milestones.
                      </span>
                    </div>
                    <div className="space-y-2">
                      {safeSelectedCase.timeline.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-2 text-[11px]"
                        >
                          <div className="mt-[3px] h-2 w-2 rounded-full bg-blue-500" />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-gray-800">
                                {event.dateLabel}
                              </span>
                              {timelineCategoryPill(event.category)}
                            </div>
                            <p className="text-gray-700 leading-snug">
                              {event.summary}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      In the full system, this timeline will be generated from
                      client check-ins, RN actions, safety flags, and attorney
                      communication, giving a quick story of the case.
                    </p>
                  </div>
                )}

              {/* 4Ps snapshot */}
              <div className="rounded-lg border bg-gray-50/80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">
                    4Ps Snapshot (Client-Facing Scale 1–5)
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    Higher scores = more stable
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fourPsPill("Physical", safeSelectedCase.fourPs.physical)}
                  {fourPsPill("Psych", safeSelectedCase.fourPs.psychological)}
                  {fourPsPill(
                    "Psychosocial",
                    safeSelectedCase.fourPs.psychosocial
                  )}
                  {fourPsPill(
                    "Professional",
                    safeSelectedCase.fourPs.professional
                  )}
                </div>
              </div>

              {/* SDOH & safety */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border bg-gray-50/80 p-3 space-y-2">
                  <h4 className="text-xs font-semibold">
                    Social Needs Snapshot (SDOH)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {sdohPill("Housing", safeSelectedCase.sdoh.housing)}
                    {sdohPill("Food", safeSelectedCase.sdoh.food)}
                    {sdohPill("Transport", safeSelectedCase.sdoh.transport)}
                    {sdohPill("Finances", safeSelectedCase.sdoh.finances)}
                    {sdohPill("Safety", safeSelectedCase.sdoh.safety)}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Use this view to decide if the RN plan is realistic in the
                    client&apos;s actual environment (transport, housing, money).
                  </p>
                </div>

                <div className="rounded-lg border bg-gray-50/80 p-3 space-y-2">
                  <h4 className="text-xs font-semibold">
                    Safety &amp; Sensitive Experiences
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {sensitiveBadges(safeSelectedCase.sensitive)}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Flags here should drive RN follow-up, warm handoffs,
                    and documentation – not judgment. Details belong in
                    protected notes, not broad summaries.
                  </p>
                </div>
              </div>

              {/* 10 Vs Snapshot – PROTOTYPE STRUCTURE ONLY */}
              {safeSelectedCase.tenVs && (
                <div className="rounded-lg border bg-gray-50/80 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold">
                      10 Vs Snapshot (Prototype Structure)
                    </h4>
                    <span className="text-[11px] text-gray-500">
                      Placeholder – will be aligned to your 10 Vs definitions.
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tenVsPill("V1", safeSelectedCase.tenVs.v1)}
                    {tenVsPill("V2", safeSelectedCase.tenVs.v2)}
                    {tenVsPill("V3", safeSelectedCase.tenVs.v3)}
                    {tenVsPill("V4", safeSelectedCase.tenVs.v4)}
                    {tenVsPill("V5", safeSelectedCase.tenVs.v5)}
                    {tenVsPill("V6", safeSelectedCase.tenVs.v6)}
                    {tenVsPill("V7", safeSelectedCase.tenVs.v7)}
                    {tenVsPill("V8", safeSelectedCase.tenVs.v8)}
                    {tenVsPill("V9", safeSelectedCase.tenVs.v9)}
                    {tenVsPill("V10", safeSelectedCase.tenVs.v10)}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    This panel is here to reserve space and behavior for your
                    10 Vs of Care Management. In a later step, each V will be
                    labeled and scored according to your framework and fed by
                    real client + RN data.
                  </p>
                </div>
              )}

              {/* Goals */}
              <div className="rounded-lg border bg-white p-3 space-y-2">
                <h4 className="text-xs font-semibold">Client Goals Snapshot</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <div className="font-semibold text-gray-700 mb-0.5">
                      Short-term (≈30 days)
                    </div>
                    <div className="text-gray-700">
                      {safeSelectedCase.shortTermGoal || "Not documented yet."}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 mb-0.5">
                      Medium-term (≈60–90 days)
                    </div>
                    <div className="text-gray-700">
                      {safeSelectedCase.mediumTermGoal ||
                        "Not documented yet."}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 mb-0.5">
                      Longer-term (&gt;90 days)
                    </div>
                    <div className="text-gray-700">
                      {safeSelectedCase.longTermGoal || "Not documented yet."}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  In the full build, these goals will come directly from
                  the client-facing intake and be updated as the RN refines
                  the plan with the client and the attorney.
                </p>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600">
              No case selected. Choose a case from the left to view RN details.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
