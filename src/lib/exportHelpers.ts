// src/lib/exportHelpers.ts
import { AppState, Flag, Task, InjurySelection } from "./models";

/**
 * Build a concise, export-ready summary of a case.
 * Safe for: attorney/provider summaries, QMP/URAC audits, EHR integrations.
 */
export function buildCaseSummaryForExport(state: AppState) {
  const { client, flags, tasks } = state;

  const openFlags = flags.filter((f) => f.status === "Open");
  const closedFlags = flags.filter((f) => f.status === "Closed");
  const followUpTasks = tasks.filter((t) =>
    (t.type || "").toLowerCase().includes("follow")
  );

  return {
    client: {
      id: client.id,
      name: client.name,
      cmDeclined: client.cmDeclined ?? false,
      viabilityScore: client.viabilityScore ?? null,
      viabilityStatus: client.viabilityStatus ?? null,
      voiceView: client.voiceView ?? null,
      fourPs: client.fourPs ?? null,
      sdoh: client.sdoh ?? null,
      lastFollowupDate: client.lastFollowupDate ?? null,
      nextFollowupDue: client.nextFollowupDue ?? null,
    },
    injuries: sanitizeInjuries(state.injuries || []),
    flags: {
      open: sanitizeFlags(openFlags),
      closed: sanitizeFlags(closedFlags),
    },
    tasks: {
      followUps: sanitizeTasks(followUpTasks),
      all: sanitizeTasks(tasks),
    },
    meta: {
      generatedAt: new Date().toISOString(),
      note:
        "Summary derived from Reconcile C.A.R.E.™ structured data (injuries, flags, tasks, 4Ps/SDOH).",
    },
  };
}

function sanitizeFlags(flags: Flag[]) {
  return flags.map((f) => ({
    id: f.id,
    type: f.type || null,
    label: f.label,
    severity: f.severity,
    status: f.status,
    createdAt: f.createdAt || null,
    resolvedAt: f.resolvedAt ?? null,
  }));
}

function sanitizeTasks(tasks: Task[]) {
  return tasks.map((t) => ({
    id: t.task_id,
    type: t.type,
    title: t.title,
    due_date: t.due_date ?? null,
    status: t.status,
    created_at: t.created_at ?? null,
    assigned_to: t.assigned_to ?? null,
  }));
}

function sanitizeInjuries(injuries: InjurySelection[]) {
  return injuries.map((i) => ({
    id: i.id,
    templateId: i.templateId,
    label: i.label,
    icd10Code: i.icd10Code || null,
    primary: !!i.primary,
  }));
}
