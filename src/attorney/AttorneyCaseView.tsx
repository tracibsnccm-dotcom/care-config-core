// src/attorney/AttorneyCaseView.tsx

import React from "react";

/**
 * Reconcile C.A.R.E.™
 * Attorney Case Detail – MOCK ONLY
 *
 * IMPORTANT:
 * - This view currently uses MOCK data only.
 * - It is SAFE: no engines, no workflows, no API calls.
 * - Later, this will be driven by:
 *   - 10-Vs engine
 *   - Vitality / RAG
 *   - Case closure engine
 *   - Legal lock-down checks
 *   - Real case + timeline APIs
 *
 * ATTORNEY-FACING GOALS:
 * - Tell the clinical and functional story clearly.
 * - Highlight barriers (SDOH), adherence, and advocacy.
 * - Show guideline-aligned care vs delays/denials.
 * - Provide negotiation-ready talking points.
 */

type RagStatus = "Red" | "Amber" | "Green";

interface AttorneyCaseDetailMock {
  caseId: string;
  clientName: string;
  dateOfInjury: string;
  primaryInjury: string;
  severityLevel: string;
  rag: RagStatus;
  vitalityScore: number;
  valueTier: "High" | "Moderate" | "Emerging";
  casePosture: "Active" | "Pending Settlement" | "Closed";
  attorneyName: string;
  rnLead: string;
  lastRnUpdate: string;

  // Clinical + functional story
  painNarrative: string;
  functionalImpact: string;
  workStatus: string;
  restrictions: string;

  // SDOH & psychosocial
  sdohSummary: string;
  mentalHealthSummary: string;
  adherenceSummary: string;

  // ODG/MCG-style expectations (mock)
  projectedLodWeeks: number;
  lodComment: string;

  // V8 (Verification) – guideline / payer issues
  verificationFindings: {
    title: string;
    description: string;
  }[];

  // V9 (Value) – where Reconcile C.A.R.E. adds leverage
  valueHighlights: {
    title: string;
    description: string;
  }[];

  // V6/V7 – plan momentum & vigilance
  vitalityComments: string;
  vigilanceFlags: string[];

  // Negotiation summary
  negotiationSummary: string;
  recommendedTalkingPoints: string[];

  // Simple mock timeline
  timeline: {
    date: string;
    label: string;
    detail: string;
  }[];
}

// Single rich mock case for now
const mockCase: AttorneyCaseDetailMock = {
  caseId: "RC-2025-001",
  clientName: "Sample Client A",
  dateOfInjury: "2025-06-10",
  primaryInjury: "Lumbar strain with radicular symptoms",
  severityLevel: "Level 4 – Severely Complex",
  rag: "Red",
  vitalityScore: 3.2,
  valueTier: "High",
  casePosture: "Active",
  attorneyName: "Attorney Smith",
  rnLead: "RN CM – Johnson",
  lastRnUpdate: "2025-11-12",

  painNarrative:
    "Client reports constant low back pain with intermittent shooting pain down the right leg. Pain worsens with standing, walking more than 5–10 minutes, and prolonged sitting. Sleep is interrupted most nights due to pain.",
  functionalImpact:
    "Client can perform light self-care but needs assistance with heavier tasks, bending, lifting, and prolonged standing. Difficulty completing a full workday in prior role that required extended standing and repetitive bending.",
  workStatus:
    "Out of work since 2025-06-15 due to functional limitations and safety concerns.",
  restrictions:
    "No lifting > 10 lbs, no repetitive bending or twisting, limited standing and walking tolerance, needs ability to change position frequently.",

  sdohSummary:
    "Transportation barrier to PT visits (relies on family or rideshares). Financial strain due to lost wages and outstanding medical bills. Risk for housing instability if income disruption continues.",
  mentalHealthSummary:
    "Screening indicates mild–moderate depressive symptoms and high stress related to pain, finances, and uncertainty about recovery. No current suicidal ideation reported.",
  adherenceSummary:
    "Client attempts to stay adherent but has missed PT and follow-up appointments due to transportation and childcare barriers, not lack of motivation. Medication adherence affected by cost and side effects (drowsiness).",

  projectedLodWeeks: 40,
  lodComment:
    "Expected length of disability is approximately 40 weeks based on current status and injury type in a guideline-informed model. Ongoing SDOH barriers and pain control issues may extend this if not adequately addressed.",

  verificationFindings: [
    {
      title: "Delay in Initiation of Physical Therapy",
      description:
        "Initial PT was ordered within two weeks of injury, but start was delayed by an additional four weeks due to authorization and scheduling issues. This is longer than typical guideline expectations.",
    },
    {
      title: "Limited Access to Multimodal Pain Management",
      description:
        "Client has not yet been evaluated for comprehensive pain management despite ongoing high pain scores. Guideline-based care often includes a combination of physical therapy, medication optimization, and behavioral support.",
    },
  ],

  valueHighlights: [
    {
      title: "Documented Impact on Work and Daily Function",
      description:
        "Clear description of functional limits supports the position that client cannot safely return to pre-injury role without meaningful clinical improvement and accommodations.",
    },
    {
      title: "Barriers Beyond the Client’s Control",
      description:
        "Transportation and financial barriers—rather than lack of effort—explain missed appointments. This strengthens the argument that outcomes are not due to non-compliance.",
    },
    {
      title: "Realistic, Guideline-Consistent Recovery Expectations",
      description:
        "Projected recovery timeline and recommended interventions are consistent with a guideline-informed, non-exaggerated view of the case.",
    },
  ],

  vitalityComments:
    "Plan vitality is low at this time. Key interventions have been delayed or only partially implemented, and SDOH barriers remain active. Without targeted restructuring of care and support, progress is likely to remain stalled.",
  vigilanceFlags: [
    "High pain with incomplete multimodal management.",
    "Transportation barrier impacting treatment adherence.",
    "Financial stress increasing risk for lost to follow-up.",
  ],

  negotiationSummary:
    "This is a severely complex case with high pain burden, meaningful functional limitations, and active SDOH barriers. The client’s challenges are consistent with the injury pattern and are not explained by lack of effort. Guideline-consistent care has been delayed in key areas, and ongoing barriers affect both recovery trajectory and length of disability. These factors should be explicitly considered when evaluating settlement value, future care needs, and the client’s realistic return-to-work options.",

  recommendedTalkingPoints: [
    "Highlight the documented delays in initiating and sustaining guideline-consistent care, and the impact on pain and function.",
    "Clarify that missed appointments stem from transportation and financial barriers, not disregard for care.",
    "Emphasize realistic recovery timelines and the continued need for treatment and support to restore function.",
    "Frame settlement terms to include resources for transportation, pain management, and ongoing functional rehabilitation.",
  ],

  timeline: [
    {
      date: "2025-06-10",
      label: "Date of Injury",
      detail:
        "Client injured lumbar spine while lifting at work. Immediate pain and difficulty standing upright.",
    },
    {
      date: "2025-06-15",
      label: "Work Leave Begins",
      detail:
        "Client taken off work due to pain and functional limitations impacting safe performance of duties.",
    },
    {
      date: "2025-06-24",
      label: "Initial Evaluation",
      detail:
        "Primary provider documents low back pain with radicular symptoms. Basic imaging ordered. Work restrictions initiated.",
    },
    {
      date: "2025-07-05",
      label: "PT Ordered",
      detail:
        "Physical therapy ordered; however, authorization and scheduling delays push start date back several weeks.",
    },
    {
      date: "2025-08-01",
      label: "PT Begins (Delayed)",
      detail:
        "Client begins PT. Attendance inconsistent due to transportation and childcare barriers, not lack of willingness.",
    },
    {
      date: "2025-10-15",
      label: "Reconcile C.A.R.E. Intake",
      detail:
        "RN CM intake completed. 4Ps and SDOH assessments indicate high pain, functional limits, and significant SDOH risk.",
    },
    {
      date: "2025-11-12",
      label: "Latest RN Review",
      detail:
        "Case reviewed. Recommendations include multimodal pain management, transportation support, and closer SDOH coordination.",
    },
  ],
};

interface AttorneyCaseViewProps {
  caseId?: string; // reserved for future routing; currently unused (mock)
}

const AttorneyCaseView: React.FC<AttorneyCaseViewProps> = () => {
  const c = mockCase;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">
            Reconcile C.A.R.E.™ – Attorney Case Detail
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            This is a mock Attorney-facing view of a single case. In production,
            this page will load the actual case data, Vitality/Vigilance scores,
            and guideline-supported findings directly from the Reconcile C.A.R.E.
            care management engine.
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Today: {today} · Case ID:{" "}
            <span className="font-mono font-semibold">{c.caseId}</span>
          </p>
        </header>

        {/* Case header summary */}
        <section className="bg-white border rounded-xl p-4 shadow-sm mb-4 text-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">
                Client & Case
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {c.clientName}
              </div>
              <div className="text-[11px] text-slate-700">
                Primary Injury: {c.primaryInjury}
              </div>
              <div className="text-[11px] text-slate-700">
                Date of Injury: {c.dateOfInjury}
              </div>
            </div>

            <div className="flex flex-col gap-1 md:items-end">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold">Status:</span>
                <span className="text-slate-900">{c.casePosture}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold">Severity:</span>
                <span className="text-slate-900">{c.severityLevel}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold">RAG:</span>
                {c.rag === "Red" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
                    Red
                  </span>
                )}
                {c.rag === "Amber" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                    Amber
                  </span>
                )}
                {c.rag === "Green" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    Green
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold">Vitality:</span>
                <span className="text-slate-900">
                  {c.vitalityScore.toFixed(1)} / 10
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold">Value Tier:</span>
                <span className="text-slate-900">
                  {c.valueTier} Impact Case
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-[11px]">
            <div>
              <span className="font-semibold">Attorney:</span> {c.attorneyName}
            </div>
            <div>
              <span className="font-semibold">RN Case Lead:</span> {c.rnLead}
            </div>
            <div>
              <span className="font-semibold">Last RN Update:</span>{" "}
              {c.lastRnUpdate}
            </div>
          </div>
        </section>

        {/* Middle layout: Clinical story + SDOH/Adherence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Clinical & functional story */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-2">
              Clinical & Functional Story
            </div>
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-slate-500">
                Pain Narrative
              </div>
              <p className="text-[11px] text-slate-800">{c.painNarrative}</p>
            </div>
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-slate-500">
                Functional Impact
              </div>
              <p className="text-[11px] text-slate-800">
                {c.functionalImpact}
              </p>
            </div>
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-slate-500">
                Work Status & Restrictions
              </div>
              <p className="text-[11px] text-slate-800">
                <span className="font-semibold">Work Status: </span>
                {c.workStatus}
              </p>
              <p className="text-[11px] text-slate-800 mt-1">
                <span className="font-semibold">Restrictions: </span>
                {c.restrictions}
              </p>
            </div>
          </section>

          {/* SDOH, mental health, adherence */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-2">
              Barriers, Mental Health, and Adherence Context
            </div>
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-slate-500">
                Social Determinants of Health (SDOH)
              </div>
              <p className="text-[11px] text-slate-800">{c.sdohSummary}</p>
            </div>
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-slate-500">
                Mental Health & Stress
              </div>
              <p className="text-[11px] text-slate-800">
                {c.mentalHealthSummary}
              </p>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500">
                Treatment & Medication Adherence
              </div>
              <p className="text-[11px] text-slate-800">
                {c.adherenceSummary}
              </p>
            </div>
          </section>
        </div>

        {/* Vitality, Vigilance, Verification, Value */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* V6 / Vitality */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-1">
              Plan Vitality (V6) – Momentum & Progress
            </div>
            <p className="text-[11px] text-slate-800">{c.vitalityComments}</p>
            <p className="mt-2 text-[10px] text-slate-500">
              In production, this section will be directly calculated from
              Reconcile C.A.R.E. plan Vitality scores, goal progress, and trend
              data.
            </p>
          </section>

          {/* V7 / Vigilance */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-1">
              Vigilance (V7) – Active Watch Areas
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-800">
              {c.vigilanceFlags.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-slate-500">
              These represent the issues the RN CM team is actively monitoring
              to prevent deterioration, loss to follow-up, or missed treatment
              opportunities.
            </p>
          </section>

          {/* V8/V9 – Verification & Value */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-1">
              Verification (V8) & Value (V9)
            </div>
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-slate-500">
                Guideline & Payer-Related Findings (V8)
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-800">
                {c.verificationFindings.map((item) => (
                  <li key={item.title}>
                    <span className="font-semibold">{item.title}: </span>
                    {item.description}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500">
                Where Reconcile C.A.R.E. Adds Value (V9)
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-800">
                {c.valueHighlights.map((item) => (
                  <li key={item.title}>
                    <span className="font-semibold">{item.title}: </span>
                    {item.description}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Projected LOD + Negotiation Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* LOD */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-1">
              Projected Length of Disability (LOD)
            </div>
            <p className="text-[11px] text-slate-800">
              Estimated{" "}
              <span className="font-semibold">
                {c.projectedLodWeeks} weeks
              </span>{" "}
              of disability based on the current clinical picture and guideline-
              informed expectations.
            </p>
            <p className="mt-1 text-[11px] text-slate-800">{c.lodComment}</p>
            <p className="mt-2 text-[10px] text-slate-500">
              In live use, this section will reference ODG/MCG ranges and
              clearly indicate when the client’s recovery course is shorter,
              similar, or longer than typical expectations, without inflating or
              minimizing the clinical reality.
            </p>
          </section>

          {/* Negotiation Summary */}
          <section className="bg-white border rounded-xl p-4 shadow-sm text-xs">
            <div className="font-semibold text-sm mb-1">
              Negotiation-Ready Summary
            </div>
            <p className="text-[11px] text-slate-800">{c.negotiationSummary}</p>
            <div className="mt-2">
              <div className="text-[10px] font-semibold text-slate-500 mb-1">
                Recommended Talking Points
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-800">
                {c.recommendedTalkingPoints.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Timeline */}
        <section className="bg-white border rounded-xl p-4 shadow-sm text-xs mb-4">
          <div className="font-semibold text-sm mb-2">Clinical Timeline</div>
          <p className="text-[11px] text-slate-600 mb-2">
            This timeline summarizes key clinical and functional milestones.
            When connected to the live system, items here will come directly
            from RN documentation, client-reported outcomes, and provider
            updates.
          </p>
          <ol className="relative border-l border-slate-200 ml-2 mt-2 space-y-3">
            {c.timeline.map((item) => (
              <li key={item.date} className="ml-4">
                <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-sky-500 border border-white" />
                <div className="text-[10px] text-slate-500">{item.date}</div>
                <div className="font-semibold text-[11px] text-slate-800">
                  {item.label}
                </div>
                <div className="text-[11px] text-slate-700">
                  {item.detail}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="text-[10px] text-slate-500 mt-2">
          This Attorney Case Detail view is a mock layout only. Once wired to
          your live Reconcile C.A.R.E. data and engines, it will provide
          negotiation-ready, clinically grounded case narratives that align
          with your care management, CMSA/CCMC standards, and legal
          defensibility requirements.
        </p>
      </div>
    </div>
  );
};

export default AttorneyCaseView;
