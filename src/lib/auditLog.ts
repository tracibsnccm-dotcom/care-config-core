import { AuditEntry, Role } from "@/config/rcms";

export function createAuditEntry(
  action: string,
  caseId: string,
  actorRole: Role,
  actorId: string = "user-001"
): AuditEntry {
  return {
    ts: new Date().toISOString(),
    actorRole,
    actorId,
    action,
    caseId,
  };
}

export function logAudit(
  audit: AuditEntry[],
  action: string,
  caseId: string,
  actorRole: Role,
  actorId?: string
): AuditEntry[] {
  const entry = createAuditEntry(action, caseId, actorRole, actorId);
  return [...audit, entry];
}
