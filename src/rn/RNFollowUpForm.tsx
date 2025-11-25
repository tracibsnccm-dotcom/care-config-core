// src/rn/RNFollowUpForm.tsx

import * as React from "react";
import { useMockDB } from "../lib/mockDB";
import { useCaseEvents } from "../lib/caseEventsContext";
import type { CaseTimelineEvent, FourPsProfile } from "../domain/caseTimeline";
import {
  STUDENT_LENS_ROWS,
  type StudentLensRow,
} from "../domain/fourPsStudentLens";

// --- Helpers -----------------------------------------------------------------

// Determine if this case should be treated as a "student lens" case (18–24)
const isStudentCaseFromClient = (client: any): boolean => {
  if (!client) return false;
  const age = typeof client.age === "number" ? client.age : null;
  const tags: string[] = Array.isArray(client.tags) ? client.tags : [];

  if (client.isStudent === true) return true;
  if (client.studentStatus === "student") return true;

  if (
    tags.some((t) =>
      String(t).toLowerCase().match(/student|college|campus|young_adult/)
    )
  ) {
    return true;
  }

  if (age !== null && age >= 18 && age <= 24) return true;

  return false;
};

// Determine if this adult has minor dependents
const hasMinorDependentsForCase = (client: any, activeCase: any): boolean => {
  if (!client && !activeCase) return false;

  if (client?.hasMinorDependents === true) return true;
  if (activeCase?.hasMinorDependents === true) return true;

  const tags: string[] = Array.isArray(client?.tags)
    ? client.tags
    : Array.isArray(activeCase?.tags)
    ? activeCase.tags
    : [];

  if (
    tags.some((t) =>
      String(t).toLowerCase().match(/parent|caregiver|has_kids|children/)
    )
  ) {
    return true;
  }

  return false;
};

const RNFollowUpForm: React.FC = () => {
  const { activeCase } = useMockDB() as any;
  const { events, addEvent } = useCaseEvents();

  if (!activeCase) {
    return (
      <div className="border rounded-xl bg-white p-4 text-[11px] text-slate-600">
        No active case selected. Open a case from the RN Dashboard first, then
        return to this RN Follow-Up view.
      </div>
    );
  }

  const caseId: string =
    activeCase.id ??
    activeCase.caseId ??
    activeCase.client?.id ??
    "case-001";

  const client =
    activeCase.client ??
    activeCase.clientProfile ??
    activeCase.clientInfo ??
    {};

  const clientName: string =
    client.name ?? activeCase.clientName ?? "Client";

  const rnName: string =
    activeCase.rnName ?? activeCase.assignedRN ?? "RN Care Manager";

  const isStudentCase = isStudentCaseFromClient(client);
  const hasMinorDependents = hasMinorDependentsForCase(client, activeCase);

  // Student Lens prompts grouped by pillar
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

  // All events for this case
  const caseEvents: CaseTimelineEvent[] = React.useMemo(
    () => events.filter((e) => e.caseId === caseId),
    [events, caseId]
  );

  // Flags on the case (from mockDB)
  const flags = Array.isArray(activeCase.flags) ? activeCase.flags : [];
  const openFlags = flags.filter(
    (f: any) => !f.status || f.status === "Open"
  );

  // Safety / high-risk events in the timeline
  const safetyEvents = caseEvents.filter(
    (e) =>
      e.abuseRisk ||
      e.suicideRisk ||
      e.tags?.includes("safety-critical")
  );

  const hasFlagsNeedingResponse =
    openFlags.length > 0 || safetyEvents.length > 0;

  // --- 4Ps snapshot this contact ---------------------------------------------

  const [p1Physical, setP1Physical] = React.useState(false);
  const [p2Psychological, setP2Psychological] = React.useState(false);
  const [p3Psychosocial, setP3Psychosocial] = React.useState(false);
  const [p4Professional, setP4Professional] = React.useState(false);

  // Contact + clinical notes
  const [contactReason, setContactReason] = React.useState("");
  const [changesSinceLast, setChangesSinceLast] = React.useState("");
  const [rnImpression, setRnImpression] = React.useState("");

  // Medication reconciliation (MUST be addressed)
  const [medsReviewed, setMedsReviewed] = React.useState(false);
  const [medsNotes, setMedsNotes] = React.useState("");

  // Flag follow-up (MUST be addressed when flags exist)
  const [flagFollowUpNotes, setFlagFollowUpNotes] = React.useState("");
  const [flagsAddressedConfirm, setFlagsAddressedConfirm] =
    React.useState(false);

  // Safety identified at this contact
  const [abuseRisk, setAbuseRisk] = React.useState(false);
  const [suicideRisk, setSuicideRisk] = React.useState(false);

  // --- Adult 4Ps Dependent Overlay (for adults with minor children) ----------

  // These questions appear when hasMinorDependents === true
  const [p1DependentsRisk, setP1DependentsRisk] = React.useState<"yes" | "no" | "">("");
  const [p1DependentsNotes, setP1DependentsNotes] = React.useState("");

  const [p2DependentsRisk, setP2DependentsRisk] = React.useState<"yes" | "no" | "">("");
  const [p2DependentsNotes, setP2DependentsNotes] = React.useState("");

  const [p3DependentsRisk, setP3DependentsRisk] = React.useState<"yes" | "no" | "">("");
  const [p3DependentsNotes, setP3DependentsNotes] = React.useState("");

  const [p4DependentsRisk, setP4DependentsRisk] = React.useState<"yes" | "no" | "">("");
  const [p4DependentsNotes, setP4DependentsNotes] = React.useState("");

  const anyDependentRisk =
    hasMinorDependents &&
    [p1DependentsRisk, p2DependentsRisk, p3DependentsRisk, p4DependentsRisk].some(
      (v) => v === "yes"
    );

  // Caregiver & Child Support Options (shown when anyDependentRisk === true)
  const CAREGIVER_OPTIONS: { id: string; label: string }[] = [
    { id: "childcare", label: "Childcare / respite support" },
    { id: "transport", label: "Transportation help for appointments" },
    { id: "chips_medicaid", label: "CHIPs / Medicaid or insurance help for children" },
    { id: "immunizations", label: "Immunization / well-child visit resources" },
    { id: "food_support", label: "Food support (WIC / SNAP / local programs)" },
    { id: "parenting_support", label: "Parenting / family support programs" },
    { id: "school_coord", label: "School / IEP / school nurse coordination" },
    { id: "child_mental_health", label: "Behavioral health resources for children/teens" },
    { id: "already_connected", label: "Already connected to needed supports" },
    { id: "declined_today", label: "Declined additional support today" },
    { id: "not_needed", label: "No additional support needed today" },
  ];

  const [caregiverResourceSelections, setCaregiverResourceSelections] =
    React.useState<string[]>([]);
  const [caregiverResourceNotes, setCaregiverResourceNotes] =
    React.useState("");

  const toggleCaregiverOption = (id: string) => {
    setCaregiverResourceSelections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const caregiverSupportValid = !anyDependentRisk
    ? true
    : caregiverResourceSelections.length > 0 &&
      caregiverResourceNotes.trim().length > 0;

  // Submission state
  const [submitting, setSubmitting] = React.useState(false);

  const hasAnyP =
    p1Physical || p2Psychological || p3Psychosocial || p4Professional;

  const anyNarrative =
    contactReason.trim() ||
    changesSinceLast.trim() ||
    rnImpression.trim() ||
    medsNotes.trim();

  // --- Validation rules ------------------------------------------------------

  const medsValid = medsReviewed;

  const flagsValid = !hasFlagsNeedingResponse
    ? true
    : flagFollowUpNotes.trim().length > 0 && flagsAddressedConfirm;

  const canSubmit =
    (anyNarrative || hasAnyP || abuseRisk || suicideRisk) &&
    medsValid &&
    flagsValid &&
    caregiverSupportValid &&
    !submitting;

  // --- Submit handler --------------------------------------------------------

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

    if (contactReason.trim()) {
      pieces.push(
        `Reason for contact / focus of this follow-up:\n${contactReason.trim()}`
      );
    }

    if (changesSinceLast.trim()) {
      pieces.push(
        `Client report / changes since last contact:\n${changesSinceLast.trim()}`
      );
    }

    if (rnImpression.trim()) {
      pieces.push(
        `RN clinical impression and plan:\n${rnImpression.trim()}`
      );
    }

    // Med reconciliation
    if (medsReviewed) {
      pieces.push(
        `Medication reconciliation: Completed this contact.`
      );
      if (medsNotes.trim()) {
        pieces.push(
          `Medication notes (changes / issues / adherence / side effects):\n${medsNotes.trim()}`
        );
      }
    } else {
      pieces.push(
        `Medication reconciliation: Not documented as completed.`
      );
    }

    // Flags requiring follow-up
    if (hasFlagsNeedingResponse) {
      const flagLabels: string[] = [];

      for (const f of openFlags) {
        const label = f.label || f.type || "Open flag";
        flagLabels.push(label);
      }

      for (const se of safetyEvents) {
        if (se.suicideRisk) {
          flagLabels.push("Timeline event marked: suicide/self-harm risk");
        }
        if (se.abuseRisk) {
          flagLabels.push("Timeline event marked: abuse / unsafe environment");
        }
      }

      const uniqueFlagLabels = Array.from(new Set(flagLabels));

      pieces.push(
        `Flags requiring RN follow-up this contact:\n${
          uniqueFlagLabels.length
            ? "- " + uniqueFlagLabels.join("\n- ")
            : "Flags present but not labeled in mock data."
        }`
      );

      if (flagFollowUpNotes.trim()) {
        pieces.push(
          `RN action / plan for current flags:\n${flagFollowUpNotes.trim()}`
        );
      }

      if (flagsAddressedConfirm) {
        pieces.push(
          "RN attestation: All listed flags were addressed during this contact, or a specific plan was established and documented."
        );
      }
    }

    // Safety identified during THIS call
    if (abuseRisk) {
      pieces.push(
        "RN identified concerns about possible abuse, coercion, or unsafe environment during this contact. Safety protocols and escalation steps were reviewed / initiated per policy."
      );
    }

    if (suicideRisk) {
      pieces.push(
        "RN identified current or recent self-harm / suicide risk during this contact. Suicide/safety protocol followed (assessment, escalation, and warm handoff as appropriate)."
      );
    }

    // Adult 4Ps Dependent Overlay (if applicable)
    if (hasMinorDependents) {
      const depLines: string[] = [];

      const addDepLine = (
        pLabel: string,
        risk: "yes" | "no" | "",
        notes: string
      ) => {
        if (!risk) return;
        const riskText = risk === "yes" ? "Yes" : "No";
        let line = `${pLabel}: ${riskText}`;
        if (notes.trim()) {
          line += ` – ${notes.trim()}`;
        }
        depLines.push(line);
      };

      addDepLine(
        "P1 – Physical impact on caregiving",
        p1DependentsRisk,
        p1DependentsNotes
      );
      addDepLine(
        "P2 – Psychological / mental health impact on caregiving",
        p2DependentsRisk,
        p2DependentsNotes
      );
      addDepLine(
        "P3 – Home / financial stability impact on dependents",
        p3DependentsRisk,
        p3DependentsNotes
      );
      addDepLine(
        "P4 – Work / role strain affecting dependents",
        p4DependentsRisk,
        p4DependentsNotes
      );

      if (depLines.length > 0) {
        pieces.push(
          `Dependents & caregiving risk (adult 4Ps overlay):\n- ${depLines.join(
            "\n- "
          )}`
        );
      }

      if (anyDependentRisk && caregiverResourceSelections.length > 0) {
        const chosenLabels = CAREGIVER_OPTIONS.filter((opt) =>
          caregiverResourceSelections.includes(opt.id)
        ).map((opt) => opt.label);

        pieces.push(
          `Caregiver & child support options discussed this contact:\n- ${chosenLabels.join(
            "\n- "
          )}`
        );

        if (caregiverResourceNotes.trim()) {
          pieces.push(
            `Caregiver & child support notes:\n${caregiverResourceNotes.trim()}`
          );
        }
      }
    }

    const details =
      pieces.length > 0
        ? pieces.join("\n\n")
        : "RN completed a follow-up contact without additional narrative.";

    const summaryParts: string[] = ["RN follow-up"];

    if (p1Physical) summaryParts.push("P1");
    if (p2Psychological) summaryParts.push("P2");
    if (p3Psychosocial) summaryParts.push("P3");
    if (p4Professional) summaryParts.push("P4");

    const summary = summaryParts.join(" – ");

    const tags: string[] = ["rn-follow-up"];
    if (medsReviewed) tags.push("meds-reconciled");
    if (hasFlagsNeedingResponse) tags.push("flags-addressed");
    if (abuseRisk) tags.push("abuse-risk", "safety-critical");
    if (suicideRisk) tags.push("suicide-risk", "safety-critical");
    if (hasMinorDependents) tags.push("has-minor-dependents");
    if (anyDependentRisk) tags.push("dependent-risk-present");

    const isCritical = abuseRisk || suicideRisk;

    const activePsLabels: string[] = [];
    if (p1Physical) activePsLabels.push("P1 Physical");
    if (p2Psychological) activePsLabels.push("P2 Psychological");
    if (p3Psychosocial) activePsLabels.push("P3 Psychosocial");
    if (p4Professional) activePsLabels.push("P4 Professional");

    const newEvent: CaseTimelineEvent = {
      id: `rn-followup-${now.getTime()}`,
      caseId,
      category: "CLINICAL",
      summary,
      details,
      actorRole: "RN",
      actorName: rnName,
      createdAt: now.toISOString(),
      isCritical,
      requiresAudit: isCritical,
      auditStatus: isCritical ? "FLAGGED" : undefined,
      fourPsProfile: profile,
      abuseRisk,
      suicideRisk,
      fourPsSummary: activePsLabels.join(", "),
      tags,
    };

    addEvent(newEvent);

    // Reset core fields
    setP1Physical(false);
    setP2Psychological(false);
    setP3Psychosocial(false);
    setP4Professional(false);

    setContactReason("");
    setChangesSinceLast("");
    setRnImpression("");

    setMedsReviewed(false);
    setMedsNotes("");

    setFlagFollowUpNotes("");
    setFlagsAddressedConfirm(false);

    setAbuseRisk(false);
    setSuicideRisk(false);

    // Reset dependent overlay
    setP1DependentsRisk("");
    setP1DependentsNotes("");
    setP2DependentsRisk("");
    setP2DependentsNotes("");
    setP3DependentsRisk("");
    setP3DependentsNotes("");
    setP4DependentsRisk("");
    setP4DependentsNotes("");
    setCaregiverResourceSelections([]);
    setCaregiverResourceNotes("");

    setSubmitting(false);
  };

  // --- Student Lens hints renderer ------------------------------------------

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
          Student Lens (18–24) prompts for today&apos;s contact
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

  // --- Render ----------------------------------------------------------------

  return (
    <div className="border rounded-xl bg-white p-4 text-[11px] space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            RN Follow-Up – Clinical Touchpoint
          </div>
          <p className="text-[10px] text-slate-600 max-w-md">
            This form records RN follow-up contacts, enforces medication
            reconciliation, and requires documentation when flags (safety or
            SDOH) are present. Each submission updates the case timeline and
            feeds the 10-Vs engine for Attorney and Director views.
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Case: <span className="font-mono">{caseId}</span> · Client:{" "}
            <span className="font-semibold">{clientName}</span> · RN:{" "}
            <span className="font-semibold">{rnName}</span>
          </p>
          {isStudentCase && (
            <p className="text-[10px] text-sky-800 mt-1">
              Student Lens active: this client is being treated as a
              college/young adult (18–24). Use the Student Lens prompts in
              the 4Ps section as you document.
            </p>
          )}
          {hasMinorDependents && (
            <p className="text-[10px] text-amber-800 mt-1">
              Dependents Overlay active: client has minor children. Use the
              dependents & caregiving risk questions and, when risks are
              present, document caregiver/child supports offered or arranged.
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Contact reason & changes */}
        <section className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold">
              Reason for contact / focus today
            </div>
            <textarea
              rows={3}
              className="w-full border rounded-md px-2 py-1 text-[11px]"
              value={contactReason}
              onChange={(e) => setContactReason(e.target.value)}
              placeholder="Example: scheduled follow-up, new symptom, post-ED visit, medication questions, transportation issue, etc."
            />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-semibold">
              Client report / changes since last contact
            </div>
            <textarea
              rows={3}
              className="w-full border rounded-md px-2 py-1 text-[11px]"
              value={changesSinceLast}
              onChange={(e) => setChangesSinceLast(e.target.value)}
              placeholder="Pain, function, mood, home situation, work status, access to care, new barriers, etc."
            />
          </div>
        </section>

        {/* RN impression */}
        <section className="space-y-1">
          <div className="text-[11px] font-semibold">
            RN clinical impression &amp; plan
          </div>
          <textarea
            rows={3}
            className="w-full border rounded-md px-2 py-1 text-[11px]"
            value={rnImpression}
            onChange={(e) => setRnImpression(e.target.value)}
            placeholder="Brief summary of your clinical impression, teaching provided, referrals, and next steps."
          />
        </section>

        {/* 4Ps snapshot + Student Lens */}
        <section className="border rounded-lg p-2 bg-slate-50/60 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-800">
            4Ps snapshot this contact (RN view)
          </div>
          <p className="text-[10px] text-slate-600">
            Mark which of the 4Ps are materially affected based on today&apos;s
            conversation or assessment. This feeds the 4Ps → 10-Vs mapping.
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

        {/* Adult 4Ps Dependent Overlay (only when minor children exist) */}
        {hasMinorDependents && (
          <section className="border rounded-lg p-2 bg-amber-50/70 space-y-1.5">
            <div className="text-[11px] font-semibold text-amber-900">
              Dependents &amp; caregiving risk (Adult 4Ps overlay)
            </div>
            <p className="text-[10px] text-amber-900">
              For adult clients with minor children, document how today&apos;s
              contact suggests the injury/condition is affecting their ability
              to care for and support their children across the 4Ps. Answer
              Yes/No and add notes when relevant.
            </p>

            {/* P1 */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold">
                P1 – Physical impact on caregiving
              </div>
              <p className="text-[10px] text-amber-900">
                Is the client&apos;s physical condition making it hard to safely
                care for or supervise their child(ren)? (lifting, responding in
                emergencies, chasing active toddlers, managing stairs, etc.)
              </p>
              <div className="flex flex-wrap gap-3 text-[11px] mt-1">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="p1DependentsRisk"
                    value="yes"
                    checked={p1DependentsRisk === "yes"}
                    onChange={() => setP1DependentsRisk("yes")}
                  />
                  <span>Yes</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="p1DependentsRisk"
                    value="no"
                    checked={p1DependentsRisk === "no"}
                    onChange={() => setP1DependentsRisk("no")}
                  />
                  <span>No</span>
                </label>
              </div>
              <textarea
                rows={2}
                className="w-full border rounded-md px-2 py-1 text-[11px]"
                value={p1DependentsNotes}
                onChange={(e) => setP1DependentsNotes(e.target.value)}
                placeholder="Briefly describe any physical limitations affecting caregiving (or note 'no concerns discussed today')."
              />
            </div>

            {/* P2 */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold">
                P2 – Psychological / mental health impact on caregiving
              </div>
              <p className="text-[10px] text-amber-900">
                Is mood, stress, or mental health making it hard to keep up
                with the child(ren)&apos;s needs (staying engaged, routines,
                getting out of bed, memory issues affecting safety)?
              </p>
              <div className="flex flex-wrap gap-3 text-[11px] mt-1">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="p2DependentsRisk"
                    value="yes"
                    checked={p2DependentsRisk === "yes"}
                    onChange={() => setP2DependentsRisk("yes")}
                  />
                  <span>Yes</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="p2DependentsRisk"
                    value="no"
                    checked={p2DependentsRisk === "no"}
                    onChange={() => setP2DependentsRisk("no")}
                  />
                  <span>No</span>
                </label>
              </div>
              <textarea
                rows={2}
                className="w-full border rounded-md px-2 py-1 text-[11px]"
                value={p2DependentsNotes}
                onChange={(e) => setP2DependentsNotes(e.target.value)}
                placeholder="Briefly describe how mood/stress/cognition is impacting caregiving (or note 'no concerns discussed today')."
              />
            </div>

            {/* P3 */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold">
                P3 – Home / financial stability impact on dependents
              </div>
              <p className="text-[10px] text-amber-900">
                Are housing, money, or home situation problems making things
                unstable for the child(ren)? (eviction risk, food insecurity,
                utilities, frequent moves, unsafe environment).
              </p>
              <div className="flex flex-wrap gap-3 text-[11px] mt-1">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="p3DependentsRisk"
                    value="yes"
                    checked={p3DependentsRisk === "yes"}
                    onChange={() => setP3DependentsRisk("yes")}
                  />
                  <span>Yes</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="p3DependentsRisk"
                    value="no"
                    checked={p3DependentsRisk === "no"}
                    onChange={() => setP3DependentsRisk("no")}
                  />
                  <span>No</span>
                </label>
              </div>
              <textarea
                rows={2}
                className="w-full border rounded-md px-2 py-1 text-[11px]"
                value={p3DependentsNotes}
                onChange={(e) => setP3DependentsNotes(e.target.value)}
                placeholder="Briefly describe housing/financial/home stability concerns affecting children (or 'no concerns discussed today')."
              />
            </div>

            {/* P4 */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold">
                P4 – Work / role strain affecting dependents
              </div>
              <p className="text-[10px] text-amber-900">
                Do work schedules or other responsibilities make it hard to get
                the child(ren) to appointments or support their needs (no PTO,
                risk of job loss, missed school meetings/IEPs, caregiving for
                another family member)?
              </p>
              <div className="flex flex-wrap gap-3 text-[11px] mt-1">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="p4DependentsRisk"
                    value="yes"
                    checked={p4DependentsRisk === "yes"}
                    onChange={() => setP4DependentsRisk("yes")}
                  />
                  <span>Yes</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="p4DependentsRisk"
                    value="no"
                    checked={p4DependentsRisk === "no"}
                    onChange={() => setP4DependentsRisk("no")}
                  />
                  <span>No</span>
                </label>
              </div>
              <textarea
                rows={2}
                className="w-full border rounded-md px-2 py-1 text-[11px]"
                value={p4DependentsNotes}
                onChange={(e) => setP4DependentsNotes(e.target.value)}
                placeholder="Briefly describe work/role strain impacting children (or 'no concerns discussed today')."
              />
            </div>

            {anyDependentRisk && (
              <div className="mt-2 border-t border-amber-200 pt-2 space-y-1.5">
                <div className="text-[11px] font-semibold text-amber-900">
                  Caregiver &amp; child support options (required when risk is present)
                </div>
                <p className="text-[10px] text-amber-900">
                  Many families in similar situations find these helpful. Check
                  all that were discussed or offered today, including whether
                  supports are already in place or were declined.
                </p>
                <div className="grid md:grid-cols-2 gap-1 text-[10px]">
                  {CAREGIVER_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className="inline-flex items-start gap-1"
                    >
                      <input
                        type="checkbox"
                        className="mt-[2px] h-3 w-3"
                        checked={caregiverResourceSelections.includes(opt.id)}
                        onChange={() => toggleCaregiverOption(opt.id)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  rows={3}
                  className="w-full border rounded-md px-2 py-1 text-[11px]"
                  value={caregiverResourceNotes}
                  onChange={(e) =>
                    setCaregiverResourceNotes(e.target.value)
                  }
                  placeholder="Document what was offered, accepted, already in place, or declined (e.g., 'Referred to CHIPs navigator; caregiver declined additional parenting support today.')."
                />
                {!caregiverSupportValid && (
                  <p className="text-[10px] text-red-700 mt-1">
                    To save this note, select at least one caregiver/child
                    support option and document what was offered, accepted,
                    already in place, or declined.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Medication reconciliation (MANDATORY) */}
        <section className="border rounded-lg p-2 bg-slate-50/80 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-800">
            Medication reconciliation (required)
          </div>
          <p className="text-[10px] text-slate-600">
            Medication reconciliation must be addressed every RN follow-up. The
            form cannot be saved until this is confirmed.
          </p>
          <label className="inline-flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={medsReviewed}
              onChange={(e) => setMedsReviewed(e.target.checked)}
            />
            <span className="text-[11px]">
              Medication list reviewed and reconciled with client / caregiver
              during this contact.
            </span>
          </label>
          <textarea
            rows={3}
            className="w-full border rounded-md px-2 py-1 text-[11px] mt-1"
            value={medsNotes}
            onChange={(e) => setMedsNotes(e.target.value)}
            placeholder="List changes, adherence issues, access problems (cannot afford meds, pharmacy issues), side effects, or education provided."
          />
          {!medsValid && (
            <p className="text-[10px] text-red-700 mt-1">
              You must confirm that medication reconciliation was completed to
              save this note.
            </p>
          )}
        </section>

        {/* Flags & SDOH follow-up (MANDATORY when present) */}
        <section className="border rounded-lg p-2 bg-amber-50/70 space-y-1.5">
          <div className="text-[11px] font-semibold text-amber-900">
            Flags &amp; SDOH follow-up this contact
          </div>
          {hasFlagsNeedingResponse ? (
            <>
              <p className="text-[10px] text-amber-900">
                This case has open flags and/or safety-marked events (for
                example: suicidal ideation, homelessness, transportation
                barriers, no money for medications, unsafe environment). You
                must document how you addressed these during this contact, or
                the plan you established.
              </p>
              <div className="border border-amber-200 rounded-md bg-white p-2 text-[10px] text-amber-900 space-y-1 max-h-40 overflow-y-auto">
                {openFlags.length > 0 && (
                  <>
                    <div className="font-semibold">
                      Open case flags:
                    </div>
                    <ul className="list-disc pl-4">
                      {openFlags.map((f: any) => (
                        <li key={f.id || f.label || f.type}>
                          {f.label || f.type || "Flag"}{" "}
                          {f.severity && `(${f.severity})`}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {safetyEvents.length > 0 && (
                  <>
                    <div className="font-semibold mt-1">
                      Safety / high-risk timeline events:
                    </div>
                    <ul className="list-disc pl-4">
                      {safetyEvents.map((e) => (
                        <li key={e.id}>
                          {e.summary || "Safety-marked event"} on{" "}
                          {new Date(e.createdAt).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <textarea
                rows={3}
                className="w-full border rounded-md px-2 py-1 text-[11px]"
                value={flagFollowUpNotes}
                onChange={(e) =>
                  setFlagFollowUpNotes(e.target.value)
                }
                placeholder="Describe how you addressed these flags (safety planning, referrals, housing support, transportation resources, medication access support, etc.) or the plan you established."
              />
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={flagsAddressedConfirm}
                  onChange={(e) =>
                    setFlagsAddressedConfirm(e.target.checked)
                  }
                />
                <span className="text-[11px]">
                  I confirm that each flag listed above was addressed during
                  this contact, or a specific plan was documented and
                  scheduled.
                </span>
              </label>
              {!flagsValid && (
                <p className="text-[10px] text-red-700">
                  To save this note, you must document follow-up for these
                  flags and confirm that they were addressed or planned.
                </p>
              )}
            </>
          ) : (
            <p className="text-[10px] text-amber-900">
              No open high-risk or SDOH flags are currently recorded for this
              case in the mock data. If you discover new concerns (suicidal
              ideation, homelessness, transportation, inability to afford
              meds, abuse, etc.), mark them below and document your plan.
            </p>
          )}
        </section>

        {/* Safety identified this contact */}
        <section className="border rounded-lg p-2 bg-red-50/80 space-y-1.5">
          <div className="text-[11px] font-semibold text-red-800">
            Safety identified during this contact
          </div>
          <p className="text-[10px] text-red-800">
            Use this section when new safety concerns emerge at this follow-up.
            These entries are heavily weighted in the engine and appear on the
            Director safety queue.
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
                New or ongoing concerns about abuse, coercion, or unsafe
                environment disclosed this contact.
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
                New or ongoing self-harm / suicide risk identified this
                contact.
              </span>
            </label>
          </div>
        </section>

        {/* Footer / submit */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[10px] text-slate-500 max-w-xs">
            This follow-up note is added to the case timeline as an RN clinical
            event. It supports the 10-Vs engine, Attorney negotiation view, and
            Director oversight while protecting clients through required med
            reconciliation, flag follow-up, and family-focused support when
            minor children are impacted.
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "px-3 py-1 rounded-full text-[11px] font-semibold border",
              !canSubmit
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-sky-700 text-white border-sky-700 hover:bg-sky-800",
            ].join(" ")}
          >
            {submitting ? "Saving…" : "Save RN Follow-Up"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RNFollowUpForm;

