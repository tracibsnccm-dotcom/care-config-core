/* ========================== RCMS C.A.R.E. — rcmsApi.ts ==========================
 * Single client for your Google Apps Script (GAS) Web App.
 * - Uses one endpoint (VITE_GAS_URL) with an action switch.
 * - Sends a shared secret header (X-RCMS-Token).
 * - Adds timeouts, typed helpers, and consistent error handling.
 *
 * ENV REQUIRED (set in Lovable):
 *   VITE_GAS_URL        e.g. https://script.google.com/macros/s/AKfycb.../exec
 *   VITE_SHARED_SECRET  long random string (must match Apps Script CONFIG.SHARED_SECRET)
 * ============================================================================== */

export type Json = Record<string, any>;

const GAS_URL = import.meta.env.VITE_GAS_URL || "";
const SHARED_SECRET = import.meta.env.VITE_SHARED_SECRET || "";

// Fail fast if missing
if (!GAS_URL) console.warn("[rcmsApi] Missing VITE_GAS_URL");
if (!SHARED_SECRET) console.warn("[rcmsApi] Missing VITE_SHARED_SECRET");

/** Low-level POST with timeout + consistent errors */
async function postToGAS<T = any>(
  action: string,
  data: Json,
  opts?: { timeoutMs?: number }
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? 15000;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "X-RCMS-Token": SHARED_SECRET, // must match Apps Script check
      },
      body: JSON.stringify({ action, data }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`[rcmsApi] ${action} failed (${res.status}): ${text || res.statusText}`);
    }
    const json = (await res.json().catch(() => ({}))) as any;
    if (json?.ok === false) {
      throw new Error(`[rcmsApi] ${action} error: ${json?.error || "unknown"}`);
    }
    return (json ?? { ok: true }) as T;
  } finally {
    clearTimeout(t);
  }
}

/* ----------------------- Public, typed convenience calls ----------------------- */

export interface AuditEvent {
  ts?: string; // ISO; server can fill if absent
  actorRole: string;
  actorId: string;
  action:
    | "SIGN_IN"
    | "POLICY_ACK"
    | "INTAKE_SUBMIT"
    | "CHECKIN_SUBMIT"
    | "ACCESS_DENIED"
    | "VIEW_CASE"
    | "CONSENT_REVOKED"
    | "NUDGE_SENT"
    | "REMINDER_SCHEDULED"
    | "INVITE_CREATED"
    | "EXPORT_ATTEMPT"
    | "DOSSIER_MODAL_OPEN"
    | "DOSSIER_ACTION";
  caseId?: string;
  meta?: Json;
}

/** Intake envelope is whatever you built (serializeIntakeForExport) */
export async function postIntake(envelope: Json) {
  return postToGAS("intake", envelope);
}

/** Check-in payload: keep it small (caseId, pain, notes, optional 4Ps) */
export async function postCheckin(payload: {
  case_id: string;
  pain?: number;
  notes?: string;
  four_ps?: { physical?: number; psychological?: number; psychosocial?: number; professional?: number };
  ts?: string; // ISO
}) {
  return postToGAS("checkin", payload);
}

/** Write a single audit row */
export async function audit(ev: AuditEvent) {
  const body: AuditEvent = {
    ts: ev.ts || new Date().toISOString(),
    ...ev,
  };
  return postToGAS("audit", body, { timeoutMs: 8000 });
}

/** Attorney "nudge" (reminder for pending intake) */
export async function sendNudge(payload: { caseId: string; email?: string }) {
  const r = await postToGAS("sendNudge", payload);
  await audit({ actorRole: "ATTORNEY", actorId: "self", action: "NUDGE_SENT", caseId: payload.caseId });
  return r;
}

/** Schedule Day 1/3/5 reminders for intake completion */
export async function scheduleReminders(payload: { caseId: string; email?: string; phone?: string; days?: number[] }) {
  const r = await postToGAS("scheduleReminders", payload);
  await audit({ actorRole: "SYSTEM", actorId: "system", action: "REMINDER_SCHEDULED", caseId: payload.caseId });
  return r;
}

/** Notify system an intake expired (auto-purge flow) */
export async function notifyExpired(payload: { caseId: string; email?: string }) {
  return postToGAS("notifyExpired", payload);
}

/** Trigger RN Supervisor task when pre-settlement dossier is commissioned */
export async function notifyDossierCommissioned(payload: {
  caseId: string;
  attorneyId?: string;
  attorneyEmail?: string;
  clientLabel?: string;
}) {
  return postToGAS("dossierCommissioned", payload);
}

/* ----------------------- Helper: safe wrapper with toast ----------------------- */
/** Wrap a promise to surface user-friendly errors. */
export async function withUserNotice<T>(
  promise: Promise<T>,
  okMsg?: string,
  errorHandler?: (err: Error) => void
): Promise<T | null> {
  try {
    const out = await promise;
    return out;
  } catch (err: any) {
    console.error(err);
    if (errorHandler) {
      errorHandler(err);
    }
    return null;
  }
}
