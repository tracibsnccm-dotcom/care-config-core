// src/domain/crisisState.ts
// Crisis Mode state machine for Reconcile C.A.R.E.

/**
 * All valid high-level states for a crisis incident.
 *
 * These should match the values stored in the
 * crisis_incidents.current_state column.
 */
export type CrisisState =
  | "crisis_detected"
  | "buddy_active"
  | "supervisor_review"
  | "resolution_pending"
  | "resolved";

/**
 * Human-friendly labels for each state.
 */
export const CRISIS_STATE_LABELS: Record<CrisisState, string> = {
  crisis_detected: "Crisis Detected",
  buddy_active: "Buddy Active",
  supervisor_review: "Supervisor Review",
  resolution_pending: "Resolution Pending",
  resolved: "Resolved",
};

/**
 * Optional: short descriptions that can be used in tooltips or headers.
 */
export const CRISIS_STATE_DESCRIPTIONS: Record<CrisisState, string> = {
  crisis_detected:
    "RN has identified a crisis and activated Crisis Mode. Buddy / Supervisor have not yet taken over.",
  buddy_active:
    "Buddy is completing the safety checklist and handling EMS decisions so the RN can stay with the client.",
  supervisor_review:
    "Supervisor is reviewing safety information, EMS decisions, and next steps.",
  resolution_pending:
    "The immediate crisis has been stabilized; final disposition and follow-up plan are being documented.",
  resolved:
    "Crisis incident is closed with final disposition and next steps documented.",
};

/**
 * Allowed transitions between states.
 * This is used to enforce a simple, predictable workflow.
 */
export const CRISIS_STATE_TRANSITIONS: Record<CrisisState, CrisisState[]> = {
  crisis_detected: ["buddy_active", "supervisor_review"],
  buddy_active: ["supervisor_review", "resolution_pending"],
  supervisor_review: ["resolution_pending", "resolved"],
  resolution_pending: ["resolved"],
  resolved: [],
};

/**
 * Checks if a transition from one state to another is allowed.
 */
export function canTransitionCrisisState(
  from: CrisisState,
  to: CrisisState
): boolean {
  if (from === to) return true;
  return CRISIS_STATE_TRANSITIONS[from].includes(to);
}

/**
 * Convenience function to get a label with the state value,
 * e.g. "Buddy Active (buddy_active)".
 */
export function formatCrisisStateWithCode(state: CrisisState): string {
  return `${CRISIS_STATE_LABELS[state]} (${state})`;
}
