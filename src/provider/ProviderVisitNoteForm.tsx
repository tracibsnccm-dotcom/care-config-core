// src/provider/ProviderVisitNoteForm.tsx

import * as React from "react";
import { useMockDB } from "../lib/mockDB";
import { useCaseEvents } from "../lib/caseEventsContext";
import type { CaseTimelineEvent, FourPsProfile } from "../domain/caseTimeline";
import {
  STUDENT_LENS_ROWS,
  type StudentLensRow,
} from "../domain/fourPsStudentLens";

const ProviderVisitNoteForm: React.FC = () => {
  const { activeCase } = useMockDB() as any;
  const { addEvent } = useCaseEvents();

  if (!activeCase) {
    return (
      <div className="border rounded-xl bg-white p-4 text-[11px] text-slate-600">
        No active case selected. The provider note form will appear once a case
        is chosen from the Provider or RN dashboard.
      </div>
    );
  }

  const caseId: string =
    activeCase.id ?? activeCase.client?.id ?? "case-001";
  const client =
    activeCase.client ?? activeCase.clientProfile ?? activeCase.clientInfo ?? {};
  const clientName: string =
    client.name ?? client.displayName ?? "Client";
  const providerName: string =
    activeCase.providerName ?? "Treating Provider";

  const age =
    typeof client.age === "number" ? (client.age as number) : undefined;

  const isStudentCase = React.useMemo(() => {
    if (typeof age === "number" && age >= 18 && age <= 24) return true;
    if (client.isStudent === true) return true;
    if (client.studentStatus === "student") return true;
    if (
      Array.isArray(client.tags) &&
      client.tags.some((t: string) =>
        String(t).toLowerCase().includes("student")
      )
    ) {
      return true;
    }
    return false;
  }, [age, client]);

  const studentLensByPillar = React.useMemo(() => {
    if (!isStudentCase) return null;
    const byP: Record<"P1" | "P2" | "P3" | "P4", StudentLensRow[]> = {
      P1: [],
      P2: [],
      P3: [],
      P4: [],
    };
    for (const row of STUDENT_LENS_ROWS) {
      byP[row.pillar].push(row);
    }
    return byP;
  }, [isStudentCase]);

  // Clinical focus toggles
  const [focusPain, setFocusPain] = React.useState(false);
  const [focusFunction, setFocusFunction] = React.useState(false);
  const [focusMood, setFocusMood] = React.useState(false);
  const [focusWork, setFocusWork] = React.useState(false);
  const [focusEnvironment, setFocusEnvironment] = React.useState(false);
  const [focusSafety, setFocusSafety] = React.useState(false);

  // 4Ps profile (provider perspective)
  const [p1Physical, setP1Physical] = React.useState(false);
  const [p2Psychological, setP2Psychological] = React.useState(false);
  const [p3Psychosocial, setP3Psychosocial] = React.useState(false);
  const [p4Professional, setP4Professional] = React.useState(false);

  // Safety overlays
  const [abuseRisk, setAbuseRisk] = React.useState(false);
  const [suicideRisk, setSuicideRisk] = React.useState(false);
  const [redFlag, setRedFlag] = React.useState(false);

  // Narrative fields
  const [objectiveFindings, setObjectiveFindings] = React.useState("");
  const [functionImpact, setFunctionImpact] = React.useState("");
  const [trajectoryComments, setTrajectoryComments] = React.useState("");
  const [recommendation, setRecommendation] = React.useState("");
  const [ordersReferrals, setOrdersReferrals] = React.useState("");
  const [barriers, setBarriers] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);

  const anyFocus =
    focusPain ||
    focusFunction ||
    focusMood ||
    focusWork ||
    focusEnvironment ||
    focusSafety;

  const anyNarrative =
    objectiveFindings.trim() ||
    functionImpact.trim() ||
    trajectoryComments.trim() ||
    recommendation.trim() ||
    ordersReferrals.trim() ||
    barriers.trim();

  const hasAnyP =
    p1Physical || p2Psychological || p3Psychosocial || p4Professional;

  const canSubmit =
    anyFocus || anyNarrative || hasAnyP || abuseRisk || suicideRisk || redFlag;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    const now = new Date();

    const profile: FourPsProfile = {
      p1Physical,
      p2Psychological,
      p3Psychosocial,
      p4Professional,
    };

    const pieces: string[] = [];

    const focusParts: string[] = [];
    if (focusPain) focusParts.push("pain");
    if (focusFunction) focusParts.push("function / ADLs");
    if (focusMood) focusParts.push("mood / coping");
    if (focusWork) focusParts.push("work capacity / role");
    if (focusEnvironment) focusParts.push("home / environment");
    if (focusSafety) focusParts.push("safety / red-flag screening");

    if (focusParts.length > 0) {
      pieces.push(
        `Clinical focus this visit: ${focusParts.join(", ")}.`
      );
    }

    if (objectiveFindings.trim()) {
      pieces.push(
        `Objective clinical findings (exam / testing):\n${objectiveFindings.trim()}`
      );
    }

    if (functionImpact.trim()) {
      pieces.push(
        `Impact on daily function and ADLs:\n${functionImpact.trim()}`
      );
    }

    if (trajectoryComments.trim()) {
      pieces.push(
        `Provider view of clinical trajectory (V10):\n${trajectoryComments.trim()}`
      );
    }

    if (recommendation.trim()) {
      pieces.push(
        `Provider assessment and recommendation (validation / alignment):\n${recommendation.trim()}`
      );
    }

    if (ordersReferrals.trim() || barriers.trim()) {
      const subParts: string[] = [];
      if (ordersReferrals.trim()) {
        subParts.push(
          `Orders / referrals / plan:\n${ordersReferrals.trim()}`
        );
      }
      if (barriers.trim()) {
        subParts.push(
          `Barriers to executing plan (transport, finances, authorization, etc.):\n${barriers.trim()}`
        );
      }
      pieces.push(subParts.join("\n\n"));
    }

    if (abuseRisk) {
      pieces.push(
        "Provider identified concerns about possible abuse, coercion, or unsafe environment. Followed organizational safety/abuse protocol."
      );
    }

    if (suicideRisk) {
      pieces.push(
        "Provider identified current or past self-harm or suicide risk. Followed organizational suicide/safety protocol."
      );
    }

    if (redFlag) {
      pieces.push(
        "Provider identified clinical red-flag findings that may warrant escalation, urgent imaging, or specialist review."
      );
    }

    const details =
      pieces.length > 0
        ? pieces.join("\n\n")
        : "Provider submitted a visit note without additional narrative.";

    const summaryFocusLabels: string[] = [];
    if (focusPain) summaryFocusLabels.push("pain");
    if (focusFunction) summaryFocusLabels.push("function");
    if (focusMood) summaryFocusLabels.push("mood");
    if (focusWork) summaryFocusLabels.push("work");
    if (focusEnvironment) summaryFocusLabels.push("environment");
    if (focusSafety) summaryFocusLabels.push("safety");

    const summary =
      summaryFocusLabels.length > 0
        ? `Provider visit – ${summaryFocusLabels.join(", ")}`
        : "Provider visit note";

    const activePsLabels: string[] = [];
    if (p1Physical) activePsLabels.push("P1 Physical");
    if (p2Psychological) activePsLabels.push("P2 Psychological");
    if (p3Psychosocial) activePsLabels.push("P3 Psychosocial");
    if (p4Professional) activePsLabels.push("P4 Professional");

    const tags: string[] = ["provider-visit"];
    if (p3Psychosocial || p4Professional || focusEnvironment || focusWork) {
      tags.push("sdoh");
    }
    if (abuseRisk) tags.push("abuse-risk", "safety-critical");
    if (suicideRisk) tags.push("suicide-risk", "safety-critical");
    if (redFlag) tags.push("clinical-red-flag");

    const isCritical = abuseRisk || suicideRisk || redFlag;

    const newEvent: CaseTimelineEvent = {
      id: `provider-visit-${now.getTime()}`,
      caseId,
      category: "CLINICAL",
      summary,
      details,
      actorRole: "PROVIDER",
      actorName: providerName,
      createdAt: now.toISOString(),
      isCritical,
      requiresAudit: isCritical,
      auditStatus: isCritical ? "FLAGGED" : undefined,
      fourPsProfile: profile,
      abuseRisk,
      suicideRisk,
      tags,
      fourPsSummary: activePsLabels.join(", "),
    };

    addEvent(newEvent);

    // Reset form
    setFocusPain(false);
    setFocusFunction(false);
    setFocusMood(false);
    setFocusWork(false);
    setFocusEnvironment(false);
    setFocusSafety(false);

    setP1Physical(false);
    setP2Psychological(false);
    setP3Psychosocial(false);
    setP4Professional(false);

    setAbuseRisk(false);
    setSuicideRisk(false);
    setRedFlag(false);

    setObjectiveFindings("");
    setFunctionImpact("");
    setTrajectoryComments("");
    setRecommendation("");
    setOrdersReferrals("");
    setBarriers("");

    setSubmitting(false);
  };

  const renderStudentLensHints = () => {
    if (!isStudentCase || !studentLensByPillar) return null;

    const pickStages = (rows: StudentLensRow[], stages: number[]) =>
      stages
        .map((stage) => rows.find((r) => r.stage === stage))
        .filter(Boolean) as StudentLensRow[];

    const p1Rows = pickStages(studentLensByPillar.P1, [1, 3, 5]);
    const p2Rows = pickStages(studentLensByPillar.P2, [1, 3, 5]);
    const p3Rows = pickStages(studentLensByPillar.P3, [1, 3, 5]);
    const p4Rows = pickStages(studentLensByPillar.P4, [1, 3, 5]);

    return (
      <div className="mt-2 rounded-md border border-sky-100 bg-sky-50 px-2 py-1.5">
        <div className="text-[10px] font-semibold text-sky-900 mb-1">
          Student Lens (18–24) prompts for this visit
        </div>
        <div className="grid md:grid-cols-2 gap-2 text-[10px] text-sky-900">
          <div>
            <div className="font-semibold mb-0.5">
              P1 – Physical
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {p1Rows.map((row) => (
                <li key={`P1-${row.stage}`}>
                  <span className="font-semibold">
                    {row.stageLabel}:
                  </span>{" "}
                  {row.studentDescription}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-0.5">
              P2 – Psychological
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {p2Rows.map((row) => (
                <li key={`P2-${row.stage}`}>
                  <span className="font-semibold">
                    {row.stageLabel}:
                  </span>{" "}
                  {row.studentDescription}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-0.5 mt-1">
              P3 – Psychosocial
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {p3Rows.map((row) => (
                <li key={`P3-${row.stage}`}>
                  <span className="font-semibold">
                    {row.stageLabel}:
                  </span>{" "}
                  {row.studentDescription}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-0.5 mt-1">
              P4 – Professional
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {p4Rows.map((row) => (
                <li key={`P4-${row.stage}`}>
                  <span className="font-semibold">
                    {row.stageLabel}:
                  </span>{" "}
                  {row.studentDescription}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-xl bg-white p-4 text-[11px] space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Provider Visit Note – Traci-Optimized
          </div>
          <p className="text-[10px] text-slate-600 max-w-md">
            This visit note is designed to feed the 10-Vs engine and the
            Attorney view. It captures clinical focus, function, trajectory,
            and provider alignment with the client story.
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Case: <span className="font-mono">{caseId}</span> · Client:{" "}
            <span className="font-semibold">{clientName}</span> · Provider:{" "}
            <span className="font-semibold">{providerName}</span>
          </p>
          {isStudentCase && (
            <p className="text-[10px] text-sky-800 mt-1">
              Student Lens active: this client is being treated as a
              college/young adult (18–24). The prompts under the 4Ps section
              highlight what to look for in student life, academics, and
              campus context.
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Clinical focus */}
        <section className="border rounded-lg p-2 bg-slate-50/70 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-800">
            Clinical focus this visit
          </div>
          <p className="text-[10px] text-slate-600">
            Select the main areas you addressed today. This drives how the
            engine interprets the visit.
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={focusPain}
                onChange={(e) => setFocusPain(e.target.checked)}
              />
              <span>Pain / symptoms</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={focusFunction}
                onChange={(e) => setFocusFunction(e.target.checked)}
              />
              <span>Function / ADLs</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={focusMood}
                onChange={(e) => setFocusMood(e.target.checked)}
              />
              <span>Mood / coping</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={focusWork}
                onChange={(e) => setFocusWork(e.target.checked)}
              />
              <span>Work capacity / role</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={focusEnvironment}
                onChange={(e) => setFocusEnvironment(e.target.checked)}
              />
              <span>Home / environment</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={focusSafety}
                onChange={(e) => setFocusSafety(e.target.checked)}
              />
              <span>Safety / red-flag screening</span>
            </label>
          </div>
        </section>

        {/* Objective findings */}
        <section className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold">
              Objective clinical findings
            </div>
            <textarea
              rows={3}
              className="w-full border rounded-md px-2 py-1 text-[11px]"
              value={objectiveFindings}
              onChange={(e) => setObjectiveFindings(e.target.value)}
              placeholder="Exam findings, imaging results, test data, range of motion, strength, gait, etc."
            />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-semibold">
              Impact on daily function (V2)
            </div>
            <textarea
              rows={3}
              className="w-full border rounded-md px-2 py-1 text-[11px]"
              value={functionImpact}
              onChange={(e) => setFunctionImpact(e.target.value)}
              placeholder="How today’s findings affect ADLs, mobility, endurance, and ability to complete usual roles."
            />
          </div>
        </section>

        {/* Trajectory + recommendation */}
        <section className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold">
              Trajectory comments (V10)
            </div>
            <textarea
              rows={3}
              className="w-full border rounded-md px-2 py-1 text-[11px]"
              value={trajectoryComments}
              onChange={(e) => setTrajectoryComments(e.target.value)}
              placeholder="Is the client improving, plateauing, or regressing? What is the likely course without further intervention?"
            />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-semibold">
              Provider assessment &amp; alignment (V9)
            </div>
            <textarea
              rows={3}
              className="w-full border rounded-md px-2 py-1 text-[11px]"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="Your assessment of the condition and how well the client’s report aligns with objective findings."
            />
          </div>
        </section>

        {/* Orders / referrals / barriers */}
        <section className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold">
              Orders, referrals, and plan
            </div>
            <textarea
              rows={3}
              className="w-full border rounded-md px-2 py-1 text-[11px]"
              value={ordersReferrals}
              onChange={(e) => setOrdersReferrals(e.target.value)}
              placeholder="Therapies, diagnostics, medications, specialist referrals, and follow-up plan."
            />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-semibold">
              Barriers to executing plan
            </div>
            <textarea
              rows={3}
              className="w-full border rounded-md px-2 py-1 text-[11px]"
              value={barriers}
              onChange={(e) => setBarriers(e.target.value)}
              placeholder="Transportation, finances, approvals, caregiving, language, or other barriers affecting adherence."
            />
          </div>
        </section>

        {/* 4Ps from provider perspective + Student Lens */}
        <section className="border rounded-lg p-2 bg-slate-50/60 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-800">
            4Ps profile from provider’s perspective
          </div>
          <p className="text-[10px] text-slate-600">
            Mark which of the 4Ps are materially affected based on today&apos;s
            encounter. This feeds the 4Ps → 10-Vs engine.
          </p>
          <div className="grid md:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={p1Physical}
                onChange={(e) => setP1Physical(e.target.checked)}
              />
              <span>P1 – Physical (pain, mobility, body)</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={p2Psychological}
                onChange={(e) => setP2Psychological(e.target.checked)}
              />
              <span>P2 – Psychological (mood, stress, coping)</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={p3Psychosocial}
                onChange={(e) => setP3Psychosocial(e.target.checked)}
              />
              <span>P3 – Psychosocial (home, support, environment)</span>
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={p4Professional}
                onChange={(e) => setP4Professional(e.target.checked)}
              />
              <span>P4 – Professional (work, income, role)</span>
            </label>
          </div>
          {renderStudentLensHints()}
        </section>

        {/* Safety / red flags */}
        <section className="border rounded-lg p-2 bg-amber-50/70 space-y-1.5">
          <div className="text-[11px] font-semibold text-amber-900">
            Safety &amp; red-flag findings
          </div>
          <p className="text-[10px] text-amber-900">
            Use this section only when there are meaningful safety or red-flag
            concerns. These entries are heavily weighted in the engine and
            flagged for audit.
          </p>
          <div className="space-y-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={abuseRisk}
                onChange={(e) => setAbuseRisk(e.target.checked)}
              />
              <span className="text-[11px]">
                Concerns about possible abuse, coercion, or unsafe environment.
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={suicideRisk}
                onChange={(e) => setSuicideRisk(e.target.checked)}
              />
              <span className="text-[11px]">
                Current or past self-harm / suicide risk requiring safety
                protocol.
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={redFlag}
                onChange={(e) => setRedFlag(e.target.checked)}
              />
              <span className="text-[11px]">
                Clinical red-flag findings (neurologic changes, red-flag
                symptoms, rapid regression) requiring escalation or urgent
                review.
              </span>
            </label>
          </div>
        </section>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[10px] text-slate-500 max-w-xs">
            This note is stored on the case timeline as a Provider event. It
            increases utilization (V7), validation strength (V9), and updates
            the Attorney and RN views automatically.
          </p>
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className={[
              "px-3 py-1 rounded-full text-[11px] font-semibold border",
              submitting || !canSubmit
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-sky-700 text-white border-sky-700 hover:bg-sky-800",
            ].join(" ")}
          >
            {submitting ? "Saving…" : "Save Provider Visit Note"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProviderVisitNoteForm;

