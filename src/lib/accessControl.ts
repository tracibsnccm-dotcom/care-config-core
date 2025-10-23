// Access control helpers for privacy-by-design
import { Case, Role, RCMS_CONFIG, ROLES } from "@/config/rcms";

/**
 * Determines if a user has access to view full identity information (names, full DOB)
 * @param role - User's role
 * @param theCase - The case being accessed
 * @param userId - Current user's ID (for designated attorney check)
 */
export function hasIdentityAccess(
  role: Role,
  theCase?: Case,
  userId: string = "user-001"
): boolean {
  // Elevated roles always have access
  const elevatedRoles: Role[] = [ROLES.SUPER_USER, ROLES.SUPER_ADMIN, ROLES.RN_CCM];
  if (elevatedRoles.includes(role)) {
    return true;
  }

  // Designated attorney for this case has access
  if (role === ROLES.ATTORNEY && theCase?.designatedAttorneyId === userId) {
    return true;
  }

  return false;
}

/**
 * Checks if user can view sensitive/clinical information
 * @param role - User's role
 * @param theCase - The case being accessed
 * @param userId - Current user's ID
 */
export function canSeeSensitive(
  theCase: Case,
  role: Role,
  userId: string = "user-001"
): boolean {
  if (!theCase?.consent?.restrictedAccess) return true;
  
  // Sensitive access roles
  if ((RCMS_CONFIG.sensitiveAccessRoles as readonly Role[]).includes(role)) {
    return true;
  }

  // Designated attorney
  if (theCase.designatedAttorneyId === userId) {
    return true;
  }

  return false;
}

/**
 * Masks a full name for display (e.g., "Alice Barnes" → "A*** B***")
 */
export function maskName(fullName: string): string {
  if (!fullName) return "—";
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((part) => (part.length > 0 ? `${part[0]}${"*".repeat(3)}` : ""))
    .join(" ");
}

/**
 * Gets the display name based on user's access level
 */
export function getDisplayName(
  role: Role,
  theCase: Case,
  userId?: string
): string {
  if (hasIdentityAccess(role, theCase, userId)) {
    return theCase.client.fullName || theCase.client.displayNameMasked || "—";
  }
  return theCase.client.displayNameMasked || "Restricted";
}
