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
   * Attorney Attestation Title
   * Displayed at the top of the attorney confirmation/attestation screen
   */
  attorneyAttestationTitle: "HIPAA Compliance Attestation Required",

  /**
   * Attorney Attestation Checkbox Text
   * Hard-hitting language covering HIPAA compliance, data deletion consequences,
   * and the requirement to restart intake if not confirmed within window
   */
  attorneyAttestationCheckboxText:
    "I understand that by confirming this case, I am certifying compliance with HIPAA regulations. I acknowledge that if I do not confirm within 48 hours, all client intake data will be permanently deleted and the intake process must start again from the beginning. This action cannot be undone.",

  /**
   * Attorney Attestation Warning Top
   * Short, hard-hitting warning displayed prominently at the top of the attestation screen
   */
  attorneyAttestationWarningTop:
    "⚠️ Your response is required within 48 hours. Failure to confirm will result in permanent deletion of all intake data and require restarting the entire intake process.",

  /**
   * Deadline Explainer
   * Copy explaining the time remaining before expiration
   */
  deadlineExplainer:
    "Time remaining before automatic data deletion and intake restart requirement:",

  /**
   * Expired Copy
   * Message displayed when the confirmation window has expired
   * Emphasizes hard delete and mandatory restart
   */
  expiredCopy:
    "⚠️ The 48-hour confirmation window has expired. All client intake data has been permanently deleted. The intake process must be restarted from the beginning. This action cannot be undone.",

  /**
   * Client Pending Attorney Copy
   * Message shown to client when attorney has not yet confirmed
   * Clarifies that RCMS is not at fault and explains restart requirement
   */
  clientPendingAttorneyCopy:
    "Your attorney has not yet confirmed this case. While waiting for attorney confirmation, your intake data is protected. However, if your attorney does not confirm within 48 hours, all intake data will be permanently deleted and you will need to restart the intake process. RCMS is not responsible for delays caused by attorney non-response.",
} as const;