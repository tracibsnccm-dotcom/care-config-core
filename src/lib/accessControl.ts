import { Case, Role, RCMS_CONFIG } from "@/config/rcms";

export function canSeeSensitive(
  theCase: Case,
  role: Role,
  userId: string = "user-001"
): boolean {
  if (!theCase?.consent?.restrictedAccess) return true;
  if ((RCMS_CONFIG.sensitiveAccessRoles as readonly Role[]).includes(role)) return true;
  if (theCase.designatedAttorneyId === userId) return true;
  return false;
}
