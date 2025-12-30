// src/components/reports/MedicalNarrativePreview.tsx

import React, { useMemo } from "react";
import { AppState, InjuryInstance, Flag, Task } from "../../lib/models";
import { buildOdgProfileForInjury, isVarianceFromGuideline } from "../../lib/necessityDriver";

interface MedicalNarrativePreviewProps {
  state: AppState;
}

/**
 * MedicalNarrativePreview
 *
 * Generates a structured, attorney-ready narrative from:
 * - Client profile (Voice/View, viability)
 * - Injuries + ICD-10 selections
 * - Flags (risk, SDOH, adherence)
 * - Tasks / follow-up behavior
 *
 * This is a *preview only* — safe to share, no PHI leakage beyond this case.
 */
const MedicalNarrativePreview: React.FC<MedicalNarrativePreviewProps> = ({
  state,
}) => {
  const { client, injuries = [], flags, tasks } = state;

  const narrative = useMemo(() => {
    const openFlags = flags.filter((f) => f.status === "Open");
    const highCritFlags = openFlags.filter(
      (f) => f.severity === "High" || f.severity === "Critical"
    );

    const followUps = tasks.filter((t) =>
      t.type.toLowerCase().includes("followup")
    );

    const primaryInjury = injuries.find((i) => i.primary) || injuries[0];

    const lines: string[] = [];

    // 1. Case header
    lines.push(
      `Reconcile C.A.R.E.™ Medical Necessity & Case Strength Narrative`,
      `Client: ${client.name || "N/A"}    ID: ${client.id || "N/A"}`,
      client.viabilityScore !== undefined
        ? `Viability Index: ${client.viabilityScore} (${client.viabilityStatus || "Not categorized"})`
        : `Viability Index: Not yet calculated`
    );

    // 2. Voice/View – client-centered framing
    if (client.voiceView) {
      lines.push(
        `Client Voice (In Their Words): ${safeOneLine(
          client.voiceView.voice
        )}`,
        `Client View (Goals & Expectations): ${safeOneLine(
          client.voiceView.view
        )}`
      );
    }

    // 3. Injury summary
    if (injuries.length) {
      lines.push(`Injury Profile:`);
      injuries.forEach((inj, idx) => {
        const tag = inj.primary || inj === primaryInjury ? "Primary" : "Secondary";
        const codes = inj.icd10Codes?.length
          ? ` | ICD-10: ${inj.icd10Codes.join(", ")}`
          : "";
        const regionBits = [
          inj.bodyRegion || "",
          inj.laterality || "",
        ]
          .filter(Boolean)
          .join(" · ");

        const odg = buildOdgProfileForInjury(inj);
        const windowText =
          odg.baseLodWeeksMin && odg.baseLodWeeksMax
            ? ` | Illustrative LOD Window: ${odg.baseLodWeeksMin}-${odg.baseLodWeeksMax} weeks (plus documented adjustments as applicable)`
            : "";

        lines.push(
          `  ${idx + 1}. ${tag}: ${inj.title}${
            regionBits ? ` (${regionBits})` : ""
          }${codes}${windowText}`
        );
      });
    } else {
      lines.push(
        `Injury Profile: Not yet structured. RN CM should complete Injury Selector to power narrative and ICD-10 mapping.`
      );
    }

    // 4. Risk & SDOH / flags
    if (flags.length) {
      const sdohFlags = flags.filter((f) =>
        (f.type || "").toLowerCase().includes("sdoh")
      );
      lines.push(
        `Risk & Determinants Snapshot:`,
        `  Open Flags: ${openFlags.length} (High/Critical: ${highCritFlags.length})`,
        sdohFlags.length
          ? `  SDOH Concerns Present: Yes (${sdohFlags.length} active). Care plan includes targeted interventions; these factors strengthen the necessity for coordinated care.`
          : `  SDOH Concerns Present: Not currently flagged or addressed.`
      );
    }

    // 5. Follow-up & engagement behavior
    if (followUps.length || client.nextFollowupDue || client.lastFollowupDate) {
      lines.push(`Care Management Engagement & Follow-Up:`);
      if (client.lastFollowupDate) {
        lines.push(`  Last RN CM Contact: ${client.lastFollowupDate}`);
      }
      if (client.nextFollowupDue) {
        lines.push(`  Next Planned Contact: ${client.nextFollowupDue}`);
      }
      lines.push(
        `  Follow-up tasks created/completed: ${followUps.length} (see detailed log in platform).`
      );
    }

    // 6. Medical necessity positioning
    if (primaryInjury) {
      const odg = buildOdgProfileForInjury(primaryInjury);
      const maxWindow =
        (odg.baseLodWeeksMax || 0) +
        (odg.comorbidityAdjustmentsWeeks || 0) +
        (odg.surgeryAddedWeeks || 0) +
        (odg.rehabAddedWeeks || 0);

      lines.push(
        `Medical Necessity Summary:`,
        `  • Treatment and coordination are aligned with recognized guideline frameworks (ODG/MCG-style) but applied as *supportive benchmarks*, not rigid denial tools.`,
        `  • The RN Care Manager documents objective findings, functional limits, and SDOH barriers to support each requested or completed service.`,
        maxWindow
          ? `  • If care duration exceeds the illustrative ${maxWindow}-week horizon, the platform prompts additional documentation rather than suggesting reduction or denial of care.`
          : `  • When care extends beyond typical windows, the platform prompts the RN CM to document clear clinical justification, keeping the case defensible.`
      );
    }

    // 7. Legal-medical bridge
    lines.push(
      `Legal-Medical Bridge:`,
      `  • This narrative is generated from structured Reconcile C.A.R.E.™ data (Voice/View, 4Ps, SDOH, injury templates, flags, and follow-ups).`,
      `  • It is designed to drop directly into demand packages, mediation summaries, or provider communications to illustrate causation, necessity, and impact.`,
      `  • Final legal strategy remains with counsel; clinical content remains within RN/MD scope.`
    );

    return lines.join("\n");
  }, [state, client, injuries, flags, tasks]);

  const handleCopy = () => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(narrative).catch(() => {});
    }
  };

  return (
    <section className="bg-white border rounded-xl p-4 shadow-sm mt-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-sm font-semibold">
          Medical Necessity Narrative (Preview)
        </h2>
        <button
          type="button"
          onClick={handleCopy}
          className="px-2 py-1 border rounded text-[10px] text-slate-700 bg-slate-50 hover:bg-slate-100"
        >
          Copy Narrative
        </button>
      </div>
      <p className="text-[10px] text-slate-500 mb-2">
        Auto-generated from the client’s structured record. RN CM and attorney
        may edit before final use. This does not replace independent clinical
        judgment or legal advice.
      </p>
      <pre className="whitespace-pre-wrap text-[10px] text-slate-800 bg-slate-50 border rounded p-2 max-h-80 overflow-auto">
        {narrative}
      </pre>
    </section>
  );
};

function safeOneLine(text: string | undefined): string {
  if (!text) return "Not documented.";
  return text.replace(/\s+/g, " ").trim();
}

export default MedicalNarrativePreview;
