import { Role, Case } from "@/config/rcms";

/**
 * Feature constants for access checks
 */
export const FEATURE = {
  VIEW_IDENTITY: "VIEW_IDENTITY",
  VIEW_CLINICAL: "VIEW_CLINICAL",
  EXPORT: "EXPORT",
  ROUTE_PROVIDER: "ROUTE_PROVIDER",
} as const;

export type Feature = typeof FEATURE[keyof typeof FEATURE];

/**
 * Export allowed roles
 */
export const EXPORT_ALLOWED_ROLES: Role[] = ["ATTORNEY", "SUPER_USER", "SUPER_ADMIN"];

/**
 * Consent-aware access control:
 * - If consent not signed => block attorney/provider data access.
 * - If consent signed but scope doesn't include attorneys/providers => block accordingly.
 * - SUPER_USER / SUPER_ADMIN can always see (oversight).
 * - RN_CCM may view clinical/routing only if provider sharing is on.
 * - Identity remains stricter (privileged + consent scope).
 */
export function canAccess(
  role: Role,
  theCase: Case | undefined,
  feature: Feature,
  userId: string = "user-001"
): boolean {
  if (!theCase) return false;
  
  // SUPER_USER and SUPER_ADMIN have oversight access
  if (role === "SUPER_USER" || role === "SUPER_ADMIN") return true;

  const signed = !!theCase?.consent?.signed;
  const shareWithAttorney = !!theCase?.consent?.scope?.shareWithAttorney;
  const shareWithProviders = !!theCase?.consent?.scope?.shareWithProviders;

  if (role === "ATTORNEY") {
    if (!signed) return false;
    if (!shareWithAttorney) return false;
    // Optional: require designation: theCase.designatedAttorneyId === userId
    if (feature === FEATURE.EXPORT) return true;
    if (feature === FEATURE.VIEW_IDENTITY) return true;
    if (feature === FEATURE.VIEW_CLINICAL) return true;
    if (feature === FEATURE.ROUTE_PROVIDER) return shareWithProviders; // routing implies provider share
    return false;
  }

  if (role === "RN_CCM") {
    if (!signed) return false;
    if (feature === FEATURE.VIEW_CLINICAL || feature === FEATURE.ROUTE_PROVIDER) return shareWithProviders;
    if (feature === FEATURE.VIEW_IDENTITY) return shareWithProviders; // conservative
    if (feature === FEATURE.EXPORT) return false;
    return shareWithProviders;
  }

  if (role === "STAFF") {
    if (!signed) return false;
    if (feature === FEATURE.VIEW_IDENTITY) return false;
    if (feature === FEATURE.EXPORT) return false;
    return shareWithProviders; // e.g., scheduling
  }

  if (role === "CLIENT") {
    // Clients can always see their own data
    return true;
  }

  return false;
}

/**
 * Check if export is allowed for the given role and case
 */
export function exportAllowed(role: Role, theCase: Case | undefined, userId?: string): boolean {
  if (!theCase) return false;
  if (!EXPORT_ALLOWED_ROLES.includes(role)) return false;
  // Also require consent signed + sharing scope
  return canAccess(role, theCase, FEATURE.EXPORT, userId) && canAccess(role, theCase, FEATURE.VIEW_CLINICAL, userId);
}

/**
 * Check if a user has access to view full identity information
 */
export function hasIdentityAccess(role: Role, theCase?: Case, userId: string = "user-001"): boolean {
  if (!theCase) return false;
  return canAccess(role, theCase, FEATURE.VIEW_IDENTITY, userId);
}

/**
 * Check if a user can see sensitive clinical information
 */
export function canSeeSensitive(theCase: Case, role: Role, userId: string = "user-001"): boolean {
  return canAccess(role, theCase, FEATURE.VIEW_CLINICAL, userId);
}

/**
 * Check if a case is blocked for attorneys or staff due to consent issues
 */
export function isBlockedForAttorney(role: Role, theCase: Case): { blocked: boolean; reason?: string } {
  if (role !== "ATTORNEY" && role !== "STAFF") return { blocked: false };
  
  const consentSigned = !!theCase.consent?.signed;
  const shareWithAttorney = !!theCase.consent?.scope?.shareWithAttorney;
  
  if (!consentSigned) {
    return { blocked: true, reason: "Client consent is not signed" };
  }
  
  if (!shareWithAttorney) {
    return { blocked: true, reason: "Client consent does not authorize sharing with attorneys" };
  }
  
  return { blocked: false };
}

/**
 * Mask a full name for display purposes
 * e.g., "Alice Barnes" -> "A*** B***"
 */
export function maskName(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.split(/\s+/).filter(p => p.length > 0);
  return parts.map(p => p.length ? (p[0] + "*".repeat(Math.max(0, p.length - 1))) : "").join(" ");
}

/**
 * Get the display name for a client based on the user's access level
 */
export function getDisplayName(role: Role, theCase: Case, userId?: string): string {
  if (hasIdentityAccess(role, theCase, userId)) {
    return theCase.client.fullName || theCase.client.displayNameMasked || "Unknown";
  }
  return theCase.client.displayNameMasked || maskName(theCase.client.fullName) || "Restricted";
}

/**
 * Check if a role can search by name
 */
export function canSearchByName(role: Role): boolean {
  return ["ATTORNEY", "RN_CCM", "SUPER_USER", "SUPER_ADMIN"].includes(role);
}
