/**
 * RCMS Compliance Constants
 * 
 * Single source of truth for:
 * - Time windows (client intake, attorney confirmation)
 * - Reminder thresholds
 * - HIPAA attestation and deletion/restart language
 * - Compliance messaging for Client + Attorney
 */

// Time Windows (in hours)
export const CLIENT_INTAKE_WINDOW_HOURS = 168; // 7 days
export const ATTORNEY_CONFIRM_WINDOW_HOURS = 48;

// Reminder thresholds for attorney confirmation window (in hours remaining)
export const ATTORNEY_REMINDER_THRESHOLDS_HOURS = [24, 8, 4, 1];

/**
 * Format milliseconds to HH:MM:SS string
 * - Zero-padded, floored (never negative)
 * - Returns "00:00:00" if negative input
 * 
 * @param ms - Milliseconds to format
 * @returns Formatted string "HH:MM:SS"
 */
export function formatHMS(ms: number): string {
  if (ms < 0) {
    return "00:00:00";
  }
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Compliance Copy
 * 
 * Centralized messaging for HIPAA attestation, deadlines, and data deletion warnings.
 * All strings are exact and must be used verbatim throughout the application.
 */
export const COMPLIANCE_COPY = {
  /**
   * Attorney Attestation - Initial Screen
   * FINAL copy for attorney attestation screen
   */
  attorneyAttestation: {
    title: "ATTORNEY ATTESTATION – REQUIRED",
    bodyLines: [
      "Before accessing any Protected Health Information (PHI), you must confirm that this individual is your client.",
      "Accessing Protected Health Information (PHI) for an individual who is not your client is a HIPAA violation and a reportable privacy breach.",
      "**If confirmation is not provided within 48 hours, all intake information will be permanently deleted and cannot be retrieved. The client will be required to complete the intake process again.**",
      "By proceeding, you attest that you are authorized to access this client's Protected Health Information (PHI) and that a valid attorney–client relationship exists.",
    ],
    primaryCta: "✅ Confirm Client Relationship",
    secondaryCta: "❌ This Is Not My Client",
  },

  /**
   * Attorney Follow-up Notices
   * Used for 24/8/4/1 hour notices; may appear in banners/cards/emails
   */
  attorneyFollowup: {
    title: "ACTION REQUIRED – CLIENT CONFIRMATION PENDING",
    bodyLines: [
      "A client has completed an intake and identified you as their attorney.",
      "Before any Protected Health Information (PHI) can be released, you must confirm that this individual is your client.",
      "If confirmation is not received within 48 hours, all intake information will be permanently deleted, cannot be retrieved, and the client will be required to complete the intake process again.",
    ],
  },

  /**
   * Attorney View After Expiration
   * Message displayed when intake has expired
   */
  attorneyExpired: {
    title: "INTAKE EXPIRED – DATA PERMANENTLY DELETED",
    bodyLines: [
      "The intake information associated with this individual has expired and has been permanently deleted in accordance with HIPAA data-minimization requirements.",
      "Deleted information cannot be retrieved. The client must complete the intake process again to proceed.",
    ],
  },

  /**
   * Deadline Explainer
   * Copy explaining the time remaining before expiration
   */
  deadlineExplainer:
    "Time remaining before automatic data deletion and intake restart requirement:",

  /**
   * Client Pending Attorney Copy
   * Message shown to client when attorney has not yet confirmed
   * Clarifies that RCMS is not at fault and explains restart requirement
   */
  clientPendingAttorneyCopy:
    "Your attorney has not yet confirmed this case. While waiting for attorney confirmation, your intake data is protected. However, if your attorney does not confirm within 48 hours, all intake data will be permanently deleted and you will need to restart the intake process. RCMS is not responsible for delays caused by attorney non-response.",
} as const;