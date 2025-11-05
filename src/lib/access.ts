// src/lib/access.ts
// Reconcile C.A.R.E. — Centralized Access Control (RBAC)
// Single drop-in file. Import these helpers anywhere you need permission checks.

/** ===== Roles & Features ===== */
export const ROLES = {
  CLIENT: "CLIENT",
  ATTORNEY: "ATTORNEY",
  RN_CM: "RN_CM",                        // RCMS Internal Nurses (more clinical/care management capabilities)
  CLINICAL_STAFF_EXTERNAL: "CLINICAL_STAFF_EXTERNAL",  // External clinical staff (restricted access)
  RCMS_CLINICAL_MGMT: "RCMS_CLINICAL_MGMT",  // RCMS Clinical Supervisors/Managers
  RN_CM_DIRECTOR: "RN_CM_DIRECTOR",      // RN Clinical Directors
  COMPLIANCE: "COMPLIANCE",              // Compliance staff
  STAFF: "STAFF",                        // firm staff (external)
  RCMS_STAFF: "RCMS_STAFF",              // RCMS internal ops (administrative)
  SUPER_USER: "SUPER_USER",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const FEATURE = {
  VIEW_IDENTITY: "VIEW_IDENTITY",
  VIEW_CLINICAL: "VIEW_CLINICAL",
  EXPORT: "EXPORT",
  ROUTE_PROVIDER: "ROUTE_PROVIDER",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type Feature = typeof FEATURE[keyof typeof FEATURE];

/** ===== Minimal models used by access checks ===== */
export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
  orgType: "RCMS" | "FIRM";     // who they work for
  orgId: string;                // "rcms" or firm id
  designatedCaseIds?: string[]; // optional per-user allow list
}

export interface CaseConsent {
  signed: boolean;
  scope: { shareWithAttorney: boolean; shareWithProviders: boolean };
}

export interface RcmsCase {
  id: string;
  firmId: string;               // owner firm
  designatedUserIds?: string[]; // case-level allow list
  consent: CaseConsent;
  // (Other fields exist but are not needed by RBAC.)
}

/** ===== Helpers ===== */
export function isDesignated(user: User | undefined, theCase: RcmsCase | undefined): boolean {
  if (!user || !theCase) return false;
  // Allow designation by user.id OR by case.id on the user (supports both patterns)
  const merged = new Set([
    ...(user.designatedCaseIds || []),
    ...(theCase.designatedUserIds || []),
  ]);
  return merged.has(user.id) || merged.has(theCase.id);
}

export function sameFirm(user: User | undefined, theCase: RcmsCase | undefined): boolean {
  return !!(user && theCase && user.orgType === "FIRM" && user.orgId === theCase.firmId);
}

/** ===== Core Guard =====
 * Enforces least-privilege + consent:
 * - SUPER_USER / SUPER_ADMIN can access everything (still audit separately).
 * - RCMS_STAFF is NOT a backdoor to firm cases: must be designated AND provider-sharing consent to see clinical/identity/route/export.
 * - ATTORNEY (firm): same firm + consent.shareWithAttorney (routing also requires provider consent).
 * - RN_CCM (firm): same firm + designated + consent (providers) for clinical/identity/route; never export.
 * - STAFF (firm): same firm + designated + consent (providers); no identity, no export; can view clinical/route.
 */
export function canAccess(role: Role, theCase: RcmsCase, feature: Feature, user?: User): boolean {
  const signed = !!theCase?.consent?.signed;
  const shareWithAttorney = !!theCase?.consent?.scope?.shareWithAttorney;
  const shareWithProviders = !!theCase?.consent?.scope?.shareWithProviders;

  // Super oversight (always audited elsewhere)
  if (role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN) return true;

  // RCMS internal ops — never a backdoor to firm cases
  if (role === ROLES.RCMS_STAFF) {
    if ([FEATURE.VIEW_IDENTITY, FEATURE.VIEW_CLINICAL, FEATURE.ROUTE_PROVIDER, FEATURE.EXPORT].includes(feature)) {
      return !!user && isDesignated(user, theCase) && signed && shareWithProviders;
    }
    return false;
  }

  // Attorneys — firm users
  if (role === ROLES.ATTORNEY) {
    if (!sameFirm(user, theCase)) return false;
    if (!signed || !shareWithAttorney) return false;
    if (feature === FEATURE.ROUTE_PROVIDER) return shareWithProviders;
    return true; // identity + clinical allowed when attorney sharing is true
  }

  // RN CM — RCMS Internal Nurses: full clinical/care management capabilities
  if (role === ROLES.RN_CM) {
    if (!signed) return false;
    if (feature === FEATURE.VIEW_CLINICAL || feature === FEATURE.ROUTE_PROVIDER) return shareWithProviders;
    if (feature === FEATURE.VIEW_IDENTITY) return shareWithProviders;
    if (feature === FEATURE.EXPORT) return false;  // Still no export for RN CM
    return false;
  }

  // RCMS Clinical Management — RCMS Clinical Supervisors/Managers/Directors: full access
  if (role === ROLES.RCMS_CLINICAL_MGMT) {
    return true;  // Full access for clinical management
  }

  // CLINICAL_STAFF_EXTERNAL — External clinical staff (restricted): same as old RN_CCM
  if (role === ROLES.CLINICAL_STAFF_EXTERNAL) {
    if (!sameFirm(user, theCase) || !isDesignated(user, theCase)) return false;
    if (!signed) return false;
    if (feature === FEATURE.VIEW_CLINICAL || feature === FEATURE.ROUTE_PROVIDER) return shareWithProviders;
    if (feature === FEATURE.VIEW_IDENTITY) return shareWithProviders;
    if (feature === FEATURE.EXPORT) return false;
    return false;
  }

  // STAFF — firm users (minimal)
  if (role === ROLES.STAFF) {
    if (!sameFirm(user, theCase) || !isDesignated(user, theCase)) return false;
    if (!signed || !shareWithProviders) return false;
    if (feature === FEATURE.VIEW_IDENTITY || feature === FEATURE.EXPORT) return false;
    if (feature === FEATURE.VIEW_CLINICAL || feature === FEATURE.ROUTE_PROVIDER) return true;
    return false;
  }

  return false;
}

/** ===== Export helper (role + clinical permission) ===== */
export function exportAllowed(role: Role, theCase: RcmsCase, user?: User): boolean {
  const exportRoles: Role[] = [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN];
  if (!exportRoles.includes(role)) return false;
  return canAccess(role, theCase, FEATURE.VIEW_CLINICAL, user);
}

/** ===== Backward compatibility helpers ===== */

/**
 * Check if a user has access to view full identity information
 */
export function hasIdentityAccess(role: Role, theCase?: RcmsCase, user?: User): boolean {
  if (!theCase) return false;
  return canAccess(role, theCase, FEATURE.VIEW_IDENTITY, user);
}

/**
 * Check if a user can see sensitive clinical information
 */
export function canSeeSensitive(theCase: RcmsCase, role: Role, user?: User): boolean {
  return canAccess(role, theCase, FEATURE.VIEW_CLINICAL, user);
}

/**
 * Check if a case is blocked for attorneys or staff due to consent issues
 */
export function isBlockedForAttorney(role: Role, theCase: RcmsCase, user?: User): { blocked: boolean; reason?: string } {
  if (role !== ROLES.ATTORNEY && role !== ROLES.STAFF && role !== ROLES.RCMS_STAFF) return { blocked: false };
  
  const consentSigned = !!theCase.consent?.signed;
  const shareWithAttorney = !!theCase.consent?.scope?.shareWithAttorney;
  const shareWithProviders = !!theCase.consent?.scope?.shareWithProviders;
  
  if (!consentSigned) {
    return { blocked: true, reason: "Client consent is not signed" };
  }
  
  if (role === ROLES.ATTORNEY && !shareWithAttorney) {
    return { blocked: true, reason: "Client consent does not authorize sharing with attorneys" };
  }
  
  if (role === ROLES.RCMS_STAFF) {
    if (!user || !isDesignated(user, theCase)) {
      return { blocked: true, reason: "Not designated for this case" };
    }
    if (!shareWithProviders) {
      return { blocked: true, reason: "Client consent does not authorize provider sharing" };
    }
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
 * NOTE: Assumes theCase has a .client property (from full Case type)
 */
export function getDisplayName(role: Role, theCase: any, user?: User): string {
  if (hasIdentityAccess(role, theCase, user)) {
    return theCase.client?.fullName || theCase.client?.displayNameMasked || "Unknown";
  }
  return theCase.client?.displayNameMasked || maskName(theCase.client?.fullName || "") || "Restricted";
}

/**
 * Check if a role can search by name
 */
export function canSearchByName(role: Role): boolean {
  const searchRoles: Role[] = [ROLES.ATTORNEY, ROLES.RN_CM, ROLES.RCMS_CLINICAL_MGMT, ROLES.SUPER_USER, ROLES.SUPER_ADMIN];
  return searchRoles.includes(role);
}
