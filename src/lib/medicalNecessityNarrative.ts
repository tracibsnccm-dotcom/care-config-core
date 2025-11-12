// src/lib/medicalNecessityNarrative.ts
import { AppState, InjurySelection, Flag, Task } from "./models";

/**
 * Builds a plain-text medical necessity narrative suitable for
 * demand packages, provider summaries, or supervisor review.
 *
 * - Uses client Voice/View + Viability
 * - Lists primary/secondary injuries with ICD-10
 * - Highlights open High/Critical flags
 * - Summarizes follow-up cadence from tasks
 * - Includes compliance statement about ODG/MCG usage
 */
export function buildMedicalNarrative(state: AppState): string {
  const { client, injuries = [], flags = [], tasks = [] } = state;

  const primaryInjury = injuries.find((i) => i.primary);
  const secondaryInjuries = injuries.filter((i) => !i.primary);

  const openHighCritical = flags
    .filter((f) => f.status === "Open" && (f.severity === "High" || f.severity === "Critical"))
    .sort(sortByCreatedAt);

  const openOther = flags
    .filter(
      (f) =>
        f.status === "Open" && !(f.severity === "High" || f.severity === "Critical")
    )
    .sort(sortByCreatedAt);

  const followUps = tasks
    .filter((t) => (t.type || "").toLowerCase().includes("follow"))
    .sort(sortByDueDate);

  const lines: string[] = [];

  lines.push("RECONCILE C.A.R.E. — Medical Necessity Narrative");
  lines.push("=================================================");
  lines.push("");
  lines.push(`Client: ${client.name || "N/A"}   (ID: ${client.id || "N/A"})`);
  lines.push(
    `Viability: ${valueOrNA(client.viabilityStatus)}${scoreSuffix(client.viabilityScore)}`
  );
  lines.push(
    `Last Follow-Up: ${client.lastFollowupDate ? fmtDate(client.lastFollowupDate) : "N/A"}`
  );
  lines.push(
    `Next Due: ${client.nextFollowupDue ? fmtDate(client.nextFollowupDue) : "Not scheduled"}`
  );
  lines.push("");

  // Voice / View
  if (client.voiceView?.voice || client.voiceView?.view) {
    lines.push("Client Voice / View");
    lines.push("-------------------");
    if (client.voiceView?.voice) lines.push(`Voice (client words): ${client.voiceView.voice}`);
    if (client.voiceView?.view) lines.push(`View (goals/trajectory): ${client.voiceView.view}`);
    lines.push("");
  }

  // Injuries
  lines.push("Injury Profile (Primary + Related)");
  lines.push("-----------------------------------");
  if (primaryInjury) {
    lines.push(`PRIMARY: ${injLine(primaryInjury)}`);
  } else {
    lines.push("PRIMARY: Not selected");
  }
  if (secondaryInjuries.length > 0) {
    secondaryInjuries.forEach((inj, idx) =>
      lines.push(`Related ${idx + 1}: ${injLine(inj)}`)
    );
  } else {
    lines.push("Related: None listed");
  }
  lines.push("");

  // High/Critical flags
  lines.push("Open High / Critical Risk Items (Must Address)");
  lines.push("-----------------------------------------------");
  if (openHighCritical.length === 0) {
    lines.push("None open.");
  } else {
    openHighCritical.forEach((f) => lines.push(flagLine(f)));
  }
  lines.push("");

  // Other open flags
  lines.push("Other Open Care Items");
  lines.push("---------------------");
  if (openOther.length === 0) {
    lines.push("No additional open items.");
  } else {
    openOther.forEach((f) => lines.push(flagLine(f)));
  }
  lines.push("");

  // Follow-up cadence
  lines.push("Follow-Up Cadence & Timeliness");
  lines.push("------------------------------");
  if (followUps.length === 0) {
    lines.push("No follow-up tasks recorded.");
  } else {
    followUps.forEach((t) => lines.push(taskLine(t)));
  }
  lines.push("");

  // Compliance & methodology statement
  lines.push("Clinical Methodology & Compliance Statement");
  lines.push("-------------------------------------------");
  lines.push(
    "Reconcile C.A.R.E. utilizes standardized injury templates, ICD-10 coding, and evidence-based references (e.g., ODG/MCG) to guide care coordination."
  );
  lines.push(
    "These references are used to inform expected recovery timelines and appropriate interventions; they are NOT used to deny services based on race, gender, socioeconomic status, or other protected characteristics."
  );
  lines.push(
    "The RN Case Manager documents clinical findings, functional impact, and treatment response to demonstrate medical necessity and support legal strategy."
  );
  lines.push("");

  lines.push("Plan & Rationale (RN CM)");
  lines.push("-------------------------");
  lines.push(
    "• Summary: (RN to enter structured rationale tying symptoms, objective findings, function, and guideline-supported care.)"
  );
  lines.push("• Safety: (Address pain, MH, meds, SDOH confirmations and education.)");
  lines.push("• Coordination: (Referrals, imaging, specialist consults, therapy progress.)");
  lines.push("• Next Steps: (Specific actions + timeframe; barriers and mitigation.)");
  lines.push("");

  return lines.join("\n");
}

// helpers

function valueOrNA(v?: string | null): string {
  return v ? v : "N/A";
}

function scoreSuffix(score?: number | null): string {
  if (score === null || score === undefined) return "";
  return ` (Score: ${score})`;
}

function injLine(i: InjurySelection): string {
  return `${i.label}${i.icd10Code ? ` — ICD-10: ${i.icd10Code}` : ""}`;
}

function flagLine(f: Flag): string {
  const when = f.createdAt ? ` @ ${fmtDate(f.createdAt)}` : "";
  const type = f.type ? ` [${f.type}]` : "";
  return `• ${f.severity}${type}: ${f.label}${when}`;
}

function taskLine(t: Task): string {
  const due = t.due_date ? fmtDate(t.due_date) : "N/A";
  return `• ${t.title} — Type: ${t.type} — Due: ${due} — Status: ${t.status}`;
}

function fmtDate(isoLike: string): string {
  // tolerant formatting; assumes YYYY-MM-DD or ISO
  const d = new Date(isoLike);
  if (isNaN(d.getTime())) return isoLike;
  return d.toISOString().slice(0, 10);
}

function sortByCreatedAt(a: Flag, b: Flag): number {
  const ax = a.createdAt || "";
  const bx = b.createdAt || "";
  return ax.localeCompare(bx);
}

function sortByDueDate(a: Task, b: Task): number {
  const ax = a.due_date || "";
  const bx = b.due_date || "";
  return ax.localeCompare(bx);
}
