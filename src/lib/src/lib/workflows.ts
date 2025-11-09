// src/lib/workflows.ts

import { Client, Flag, Task, Effect } from "./models";

/**
 * Follow-up workflow:
 * - Requires RN CM to confirm high/critical flags were reviewed
 * - Allows client to Accept or Decline Care Management
 * - Schedules the next 30-day follow-up task
 */
export function onFollowUpSubmit(
  client: Client,
  flags: Flag[],
  tasks: Task[],
  options: {
    reviewedAllHighCritical: boolean;
    clientDecision: "Accept" | "Decline";
  }
): Effect[] {
  const effects: Effect[] = [];

  // Enforce: must review all open high/critical flags
  const hasHighCriticalOpen = flags.some(
    (f) =>
      f.status === "Open" &&
      (f.severity === "High" || f.severity === "Critical")
  );

  if (hasHighCriticalOpen && !options.reviewedAllHighCritical) {
    effects.push({
      type: "validationError",
      payload: {
        message:
          "All open High/Critical items must be reviewed with the client before saving this follow-up.",
      },
    });
    return effects;
  }

  // Update client CM decision
  if (options.clientDecision === "Accept") {
    effects.push({
      type: "updateClient",
      payload: {
        cmDeclined: false,
        viabilityStatus: "Engaged",
      },
    });
  } else {
    effects.push({
      type: "updateClient",
      payload: {
        cmDeclined: true,
        viabilityStatus: "Client Declined",
        cmDeclineLastDate: new Date().toISOString(),
      },
    });
  }

  // Update follow-up dates + schedule next 30 days
  const now = new Date();
  const next = new Date();
  next.setDate(now.getDate() + 30);

  effects.push({
    type: "updateClient",
    payload: {
      lastFollowupDate: now.toISOString(),
      nextFollowupDue: next.toISOString().slice(0, 10),
    },
  });

  effects.push({
    type: "createTask",
    payload: {
      type: "FollowUp30Day",
      title: "Monthly Check-In / Readiness Review",
      assigned_to: "RN_CM",
      due_date: next.toISOString().slice(0, 10),
    },
  });

  return effects;
}
