import React, { useMemo, useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ROLES, FEATURE } from "@/lib/rcms-core";
import { canAccess } from "@/lib/access";
import { AppLayout } from "@/components/AppLayout";
import { AlertCircle } from "lucide-react";
import { RNNotesMedConditionsSection } from "@/components/MedsConditionsSection";

/* ───────────────────────────── CONFIG (edit in one place) ───────────────────────────── */
const RNCM_CONFIG = {
  // SLAs / deadlines
  noteSLA: { greenHours: 24, yellowHours: 48 },     // visit note submission window
  requiredCall: { dueBizDays: 2 },                  // after initial care plan = Initiated
  // Verification code rules
  code: { minLen: 3, maxLen: 8 },                   // random-length digits
  // Colors
  colors: {
    onTime: "#16a34a",  // green-600
    late: "#f59e0b",    // amber-500
    overdue: "#dc2626", // red-600
    teal: "#128f8b",    // divider accent
  },
  // Mandatory fields for Intake (minimum necessary; expand as needed)
  intakeRequired: [
    "incidentType", "incidentDate", "initialTreatment",
    "consent_shareWithAttorney", "consent_shareWithProviders"
  ],
  // Mandatory fields for Follow-up / Subsequent Care Plan
  carePlanRequired: [
    "goals", "interventions", "expectedOutcomes",
    "nextReviewDate"
  ]
};

/* ───────────────────────────── UTILITIES ───────────────────────────── */
function randomDigits(len: number): string {
  const chars = "0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function randomLen(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function generateVerificationCode(): string {
  // variable length 3–8 digits (configurable)
  return randomDigits(randomLen(RNCM_CONFIG.code.minLen, RNCM_CONFIG.code.maxLen));
}
function hoursSince(ts: string | number | Date): number {
  const t = new Date(ts).getTime();
  return (Date.now() - t) / 36e5;
}
function businessDaysFrom(start: Date, bizDays: number): Date {
  // simple business-day adder (Mon–Fri). Good enough for prototype.
  const d = new Date(start);
  let added = 0;
  while (added < bizDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0=Sun ... 6=Sat
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}
function classNames(...arr: (string | false | null | undefined)[]) {
  return arr.filter(Boolean).join(" ");
}

/* ───────────────────────────── MOCKS / STUBS ───────────────────────────── */
// TODO: wire to your SMS provider (Apps Script, Twilio, etc.)
// await fetch(import.meta.env.VITE_GAS_URL + '?action=sendCode', { method:'POST', body: JSON.stringify({...}) })
async function sendSMSMock(phone: string, message: string): Promise<{ ok: boolean }> {
  console.log("MOCK SMS →", phone, message);
  return new Promise((res) => setTimeout(() => res({ ok: true }), 350));
}
// TODO: persist audit trail (e.g., to Google Sheet or your backend)
async function logAuditMock(entry: any): Promise<void> {
  console.log("AUDIT:", entry);
}

/* ───────────────────────────── WIDGET: Mandatory Badge ───────────────────────────── */
const MandatoryBadge = () => (
  <span className="ml-2 inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200">
    Required
  </span>
);

/* ───────────────────────────── WIDGET: Intake Form (Required Fields) ───────────────────────────── */
export function IntakeRequiredForm({
  initial = {},
  onSubmit
}: {
  initial?: any;
  onSubmit: (values: any) => void;
}) {
  const [values, setValues] = useState<any>({
    incidentType: initial.incidentType || "",
    incidentDate: initial.incidentDate || "",
    initialTreatment: initial.initialTreatment || "",
    consent_shareWithAttorney: initial.consent_shareWithAttorney ?? false,
    consent_shareWithProviders: initial.consent_shareWithProviders ?? false,
    // optional PCP + meds/allergies/chronic conditions
    shareWithPCP: initial.shareWithPCP ?? null,     // null=not answered, true/false if answered
    pcpName: initial.pcpName || "",
    chronicConditions: initial.chronicConditions || [],
    medList: initial.medList || "",
    allergies: initial.allergies || "",
    wantsPreventiveInfo: initial.wantsPreventiveInfo ?? null,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const missing = useMemo(() => {
    return RNCM_CONFIG.intakeRequired.filter((k) => !values[k] && values[k] !== false); // treat false as valid for checkbox
  }, [values]);

  const hasErrors = missing.length > 0;

  function update<K extends keyof typeof values>(k: K, v: any) {
    setValues((old: any) => ({ ...old, [k]: v }));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched((t) => {
          const all: any = { ...t };
          RNCM_CONFIG.intakeRequired.forEach((k) => (all[k] = true));
          return all;
        });
        if (!hasErrors) onSubmit(values);
      }}
      aria-label="Client Intake (Required Fields)"
    >
      {/* Incident Type (Required) */}
      <label className="block text-sm font-semibold text-foreground">
        Incident Type <MandatoryBadge />
        <select
          className={classNames(
            "mt-1 w-full rounded-md border px-3 py-2 bg-background",
            touched.incidentType && !values.incidentType && "border-red-500"
          )}
          value={values.incidentType}
          onChange={(e) => update("incidentType", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, incidentType: true }))}
          aria-required="true"
        >
          <option value="">Select…</option>
          <option value="MVA">Motor Vehicle Accident</option>
          <option value="WorkComp">Workers' Compensation</option>
          <option value="Other">Other</option>
        </select>
      </label>

      {/* Incident Date (Required) */}
      <label className="block text-sm font-semibold text-foreground">
        Incident Date <MandatoryBadge />
        <input
          type="date"
          className={classNames(
            "mt-1 w-full rounded-md border px-3 py-2 bg-background",
            touched.incidentDate && !values.incidentDate && "border-red-500"
          )}
          value={values.incidentDate}
          onChange={(e) => update("incidentDate", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, incidentDate: true }))}
          aria-required="true"
        />
      </label>

      {/* Initial Treatment (Required) */}
      <label className="block text-sm font-semibold text-foreground">
        Initial Treatment <MandatoryBadge />
        <select
          className={classNames(
            "mt-1 w-full rounded-md border px-3 py-2 bg-background",
            touched.initialTreatment && !values.initialTreatment && "border-red-500"
          )}
          value={values.initialTreatment}
          onChange={(e) => update("initialTreatment", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, initialTreatment: true }))}
          aria-required="true"
        >
          <option value="">Select…</option>
          <option value="ED">ED</option>
          <option value="UrgentCare">Urgent Care</option>
          <option value="PCP">PCP</option>
          <option value="Chiro">Chiropractic</option>
          <option value="None">None</option>
        </select>
      </label>

      {/* Consent (Required checkboxes) */}
      <fieldset className="mt-2">
        <legend className="text-sm font-semibold text-foreground">
          Consent Scope <MandatoryBadge />
        </legend>
        <div className="mt-2 space-y-2 bg-muted/50 p-3 rounded-lg">
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="checkbox"
              checked={!!values.consent_shareWithAttorney}
              onChange={(e) => update("consent_shareWithAttorney", e.target.checked)}
              onBlur={() => setTouched((t) => ({ ...t, consent_shareWithAttorney: true }))}
              aria-required="true"
            />
            Share limited info with my attorney
          </label>
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="checkbox"
              checked={!!values.consent_shareWithProviders}
              onChange={(e) => update("consent_shareWithProviders", e.target.checked)}
              onBlur={() => setTouched((t) => ({ ...t, consent_shareWithProviders: true }))}
              aria-required="true"
            />
            Share limited info with providers involved in my care
          </label>
        </div>
      </fieldset>

      {/* PCP Sharing (Optional) */}
      <fieldset className="mt-2">
        <legend className="text-sm font-semibold text-foreground">Primary Care Coordination (optional)</legend>
        <div className="mt-2 space-y-2 bg-muted/50 p-3 rounded-lg">
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="radio"
              name="shareWithPCP"
              checked={values.shareWithPCP === true}
              onChange={() => update("shareWithPCP", true)}
            />
            Yes, share relevant treatment & medication info with my PCP
          </label>
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="radio"
              name="shareWithPCP"
              checked={values.shareWithPCP === false}
              onChange={() => update("shareWithPCP", false)}
            />
            No, do not share with my PCP
          </label>
          <input
            type="text"
            placeholder="PCP name or clinic (optional)"
            className="w-full rounded-md border px-3 py-2 bg-background"
            value={values.pcpName}
            onChange={(e) => update("pcpName", e.target.value)}
            aria-describedby="pcpHelp"
          />
          <p id="pcpHelp" className="text-xs text-muted-foreground">
            We will only share the minimum necessary information, if you opt in.
          </p>
        </div>
      </fieldset>

      {/* Med Reconciliation + Allergies (Optional now; can be required later) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-foreground">
          Current Medications (free text or list)
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2 bg-background min-h-[80px]"
            value={values.medList}
            onChange={(e) => update("medList", e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-foreground">
          Allergies (medications / foods)
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2 bg-background min-h-[80px]"
            value={values.allergies}
            onChange={(e) => update("allergies", e.target.value)}
          />
        </label>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={hasErrors}
          className={classNames(
            "w-full rounded-lg px-4 py-2 font-semibold text-white",
            hasErrors ? "bg-gray-400 cursor-not-allowed" : "bg-[hsl(var(--primary))] hover:brightness-110"
          )}
          aria-disabled={hasErrors}
        >
          Save Intake (Required fields enforced)
        </button>
        {hasErrors && (
          <p className="mt-2 text-sm text-yellow-600">
            Please complete all required items before continuing.
          </p>
        )}
      </div>
    </form>
  );
}

/* ───────────────────────────── WIDGET: Care Plan (Required Fields) ───────────────────────────── */
export function CarePlanRequiredForm({
  initial = {},
  visitDateISO, // date of appointment; used for SLA coloring
  onSubmit
}: {
  initial?: any;
  visitDateISO?: string;
  onSubmit: (values: any) => void;
}) {
  const [values, setValues] = useState<any>({
    goals: initial.goals || "",
    interventions: initial.interventions || "",
    expectedOutcomes: initial.expectedOutcomes || "",
    nextReviewDate: initial.nextReviewDate || ""
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const missing = useMemo(
    () => RNCM_CONFIG.carePlanRequired.filter((k) => !values[k]),
    [values]
  );
  const hasErrors = missing.length > 0;

  const color = useMemo(() => {
    if (!visitDateISO) return RNCM_CONFIG.colors.onTime;
    const h = hoursSince(visitDateISO);
    if (h <= RNCM_CONFIG.noteSLA.greenHours) return RNCM_CONFIG.colors.onTime;
    if (h <= RNCM_CONFIG.noteSLA.yellowHours) return RNCM_CONFIG.colors.late;
    return RNCM_CONFIG.colors.overdue;
  }, [visitDateISO]);

  function update<K extends keyof typeof values>(k: K, v: any) {
    setValues((old: any) => ({ ...old, [k]: v }));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched((t) => {
          const all: any = { ...t };
          RNCM_CONFIG.carePlanRequired.forEach((k) => (all[k] = true));
          return all;
        });
        if (!hasErrors) onSubmit(values);
      }}
      aria-label="Care Plan (Required Items)"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-foreground font-bold text-lg">Care Plan</h3>
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ background: color, color: "#fff" }}
          aria-label="Note timeliness status"
        >
          {color === RNCM_CONFIG.colors.onTime
            ? "On time (≤24h)"
            : color === RNCM_CONFIG.colors.late
            ? "Late (>24h)"
            : "Overdue (>48h)"}
        </span>
      </div>

      <label className="block text-sm font-semibold text-foreground">
        Goals <MandatoryBadge />
        <textarea
          className={classNames(
            "mt-1 w-full rounded-md border px-3 py-2 bg-background min-h-[80px]",
            touched.goals && !values.goals && "border-red-500"
          )}
          value={values.goals}
          onChange={(e) => update("goals", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, goals: true }))}
          aria-required="true"
        />
      </label>

      <label className="block text-sm font-semibold text-foreground">
        Interventions <MandatoryBadge />
        <textarea
          className={classNames(
            "mt-1 w-full rounded-md border px-3 py-2 bg-background min-h-[80px]",
            touched.interventions && !values.interventions && "border-red-500"
          )}
          value={values.interventions}
          onChange={(e) => update("interventions", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, interventions: true }))}
          aria-required="true"
        />
      </label>

      <label className="block text-sm font-semibold text-foreground">
        Expected Outcomes <MandatoryBadge />
        <textarea
          className={classNames(
            "mt-1 w-full rounded-md border px-3 py-2 bg-background min-h-[80px]",
            touched.expectedOutcomes && !values.expectedOutcomes && "border-red-500"
          )}
          value={values.expectedOutcomes}
          onChange={(e) => update("expectedOutcomes", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, expectedOutcomes: true }))}
          aria-required="true"
        />
      </label>

      <label className="block text-sm font-semibold text-foreground">
        Next Review Date <MandatoryBadge />
        <input
          type="date"
          className={classNames(
            "mt-1 w-full rounded-md border px-3 py-2 bg-background",
            touched.nextReviewDate && !values.nextReviewDate && "border-red-500"
          )}
          value={values.nextReviewDate}
          onChange={(e) => update("nextReviewDate", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, nextReviewDate: true }))}
          aria-required="true"
        />
      </label>

      <div className="pt-1">
        <button
          type="submit"
          disabled={hasErrors}
          className={classNames(
            "w-full rounded-lg px-4 py-2 font-semibold text-white",
            hasErrors ? "bg-gray-400 cursor-not-allowed" : "bg-[hsl(var(--primary))] hover:brightness-110"
          )}
          aria-disabled={hasErrors}
        >
          Save Care Plan (Required items enforced)
        </button>
        {hasErrors && (
          <p className="mt-2 text-sm text-yellow-600">
            Please complete all required items before saving.
          </p>
        )}
      </div>
    </form>
  );
}

/* ───────────────────────────── WIDGET: RN–Client Contact Verification ───────────────────────────── */
export function ContactVerification({
  caseId,
  nurseName,
  clientPhone
}: {
  caseId: string;
  nurseName: string;
  clientPhone: string; // E.164 preferred; mock OK for now
}) {
  const [code, setCode] = useState<string>("");
  const [sentCode, setSentCode] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying" | "verified" | "error">("idle");
  const [error, setError] = useState<string>("");

  async function handleSend() {
    try {
      setStatus("sending");
      const newCode = generateVerificationCode(); // variable length (3–8)
      const msg = `RCMS: Your verification code is ${newCode}. Share this code with your nurse during today's call.`;
      const res = await sendSMSMock(clientPhone, msg);
      if (!res.ok) throw new Error("SMS failed");
      setSentCode(newCode);
      setStatus("sent");
      await logAuditMock({
        ts: new Date().toISOString(),
        action: "VERIFY_CODE_SENT",
        caseId,
        actor: nurseName,
        details: { len: newCode.length }
      });
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Unable to send code");
    }
  }

  async function handleVerify() {
    setStatus("verifying");
    await new Promise((r) => setTimeout(r, 250));
    const ok = code.trim() === sentCode;
    if (!ok) {
      setStatus("error");
      setError("The code does not match. Please confirm with the client and try again.");
      return;
    }
    setStatus("verified");
    await logAuditMock({
      ts: new Date().toISOString(),
      action: "VERIFY_CODE_CONFIRMED",
      caseId,
      actor: nurseName
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-foreground font-bold">RN–Client Contact Verification</h4>
        <span className="text-xs text-muted-foreground">Case #{caseId}</span>
      </div>

      <ol className="list-decimal list-inside text-muted-foreground text-sm space-y-1 mb-3">
        <li>Click <strong>Send Code</strong> to text the client a random code (3–8 digits).</li>
        <li>Ask the client to read the code back to you during the call.</li>
        <li>Enter the code below to confirm proof of contact.</li>
      </ol>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSend}
          disabled={status === "sending" || status === "sent" || status === "verified"}
          className={classNames(
            "rounded-md px-3 py-2 text-white font-semibold",
            status === "sent" || status === "verified" ? "bg-gray-400 cursor-not-allowed" : "bg-[hsl(var(--primary))] hover:brightness-110"
          )}
        >
          {status === "sending" ? "Sending…" : status === "sent" || status === "verified" ? "Code Sent" : "Send Code"}
        </button>

        <input
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Enter code"
          className="rounded-md border px-3 py-2 bg-background w-40"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          disabled={!sentCode || status === "verified"}
          aria-label="Enter client verification code"
        />

        <button
          onClick={handleVerify}
          disabled={!sentCode || !code || status === "verified"}
          className={classNames(
            "rounded-md px-3 py-2 text-white font-semibold",
            !sentCode || !code || status === "verified" ? "bg-gray-400 cursor-not-allowed" : "bg-[hsl(var(--primary))] hover:brightness-110"
          )}
        >
          Verify
        </button>
      </div>

      {status === "verified" && (
        <p className="mt-2 text-sm text-green-600">
          Verified — proof of contact recorded to audit log.
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-yellow-600">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        <strong>Privacy:</strong> Codes are random and variable length. Do not store codes in notes; proof of contact is recorded in the audit trail only.
      </p>
    </div>
  );
}

/* ───────────────────────────── WIDGET: Required Client Call Task ───────────────────────────── */
export function RequiredCallTask({
  carePlanInitiatedAtISO
}: {
  carePlanInitiatedAtISO: string; // when plan status changed to "Initiated"
}) {
  const due = useMemo(
    () => businessDaysFrom(new Date(carePlanInitiatedAtISO), RNCM_CONFIG.requiredCall.dueBizDays),
    [carePlanInitiatedAtISO]
  );
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const overdue = now > due;
  const color = overdue ? RNCM_CONFIG.colors.overdue : RNCM_CONFIG.colors.onTime;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-foreground font-bold">Required Client Call</h4>
        <span className="text-xs rounded-full px-2 py-0.5 font-semibold" style={{ background: color, color: "#fff" }}>
          {overdue ? "Overdue" : "On time"}
        </span>
      </div>
      <p className="text-muted-foreground text-sm mt-1">
        Call the client to review findings and expectations. Due by{" "}
        <strong>{due.toLocaleString()}</strong>.
      </p>
      <p className="text-muted-foreground text-xs mt-1">
        If the client reports barriers (confusion, not being heard by providers), document and escalate. RCMS will intercede when needed.
      </p>
    </div>
  );
}

/* ───────────────────────────── ACCESS DENIED COMPONENT ───────────────────────────── */
function AccessDenied() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You do not have permission to access this page. This page is restricted to RN Care Managers and administrators.
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:brightness-110 transition-all"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ───────────────────────────── MAIN PAGE COMPONENT ───────────────────────────── */
export default function RNCM_Compliance_Demo() {
  const { role, cases } = useApp();

  // Access control: Only RN_CCM, SUPER_USER, SUPER_ADMIN
  const hasAccess = role === ROLES.RN_CCM || role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN;

  if (!hasAccess) {
    return <AccessDenied />;
  }

  // Get the first case for demo purposes (in production, use a case selector)
  const demoCase = cases.length > 0 ? cases[0] : null;

  // Extract initial values from the demo case if available
  const initialIntake = demoCase ? {
    incidentType: demoCase.intake?.incidentType || "",
    incidentDate: demoCase.intake?.incidentDate || "",
    initialTreatment: demoCase.intake?.initialTreatment || "",
    consent_shareWithAttorney: demoCase.consent?.scope?.shareWithAttorney ?? false,
    consent_shareWithProviders: demoCase.consent?.scope?.shareWithProviders ?? false,
  } : {};

  // Mock data for demo
  const caseId = demoCase?.id || "RCMS-DEMO";
  const nurse = "RN Jane Doe";
  // TODO: Add phone field to Client interface when available
  const clientPhone = "+15555551234"; // Mock phone for verification demo
  const visitDateISO = new Date(Date.now() - 26 * 3600 * 1000).toISOString(); // 26h ago → Yellow
  const carePlanInitiatedAtISO = new Date().toISOString();

  // State for RN meds/conditions section
  const [rnMedsBlock, setRnMedsBlock] = useState({ 
    conditions: "",
    meds: "",
    allergies: "",
    attested: false,
    valid: false 
  });

  return (
    <AppLayout>
      <div className="p-6 bg-background min-h-screen">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-foreground mb-2">
              RN Case Management — Compliance & Verification
            </h1>
            <p className="text-muted-foreground">
              Manage required intake items, care plans, and client contact verification with built-in SLA tracking.
            </p>
          </div>

          {/* 1) Intake Required */}
          <div className="rounded-2xl border border-border p-6 bg-card">
            <h2 className="text-foreground font-bold text-xl mb-4">Intake — Required Items</h2>
            <IntakeRequiredForm
              initial={initialIntake}
              onSubmit={(vals) => {
                console.log("INTAKE SAVED", vals);
                // TODO: persist; trigger next-step routing
              }}
            />
          </div>

          {/* 2) Care Plan Required + SLA coloring */}
          <div className="rounded-2xl border border-border p-6 bg-card">
            <CarePlanRequiredForm
              visitDateISO={visitDateISO}
              onSubmit={(vals) => {
                console.log("CARE PLAN SAVED", vals);
                // TODO: persist; set status=Initiated
              }}
            />
          </div>

          {/* 2.5) RN Notes — Conditions, Medications & Allergies */}
          <div className="rounded-2xl border border-border p-6 bg-card">
            <RNNotesMedConditionsSection
              initial={rnMedsBlock}
              required={true}
              onValidChange={setRnMedsBlock}
            />
            {rnMedsBlock.valid && (
              <div className="mt-4">
                <button
                  className="rounded-lg px-4 py-2 font-semibold text-white bg-[hsl(var(--primary))] hover:brightness-110"
                  onClick={() => {
                    console.log("RN MEDS/CONDITIONS SAVED", rnMedsBlock);
                    // TODO: persist to case
                  }}
                >
                  Save RN Documentation
                </button>
              </div>
            )}
          </div>

          {/* 3) Required Call Task after plan initiation */}
          <RequiredCallTask carePlanInitiatedAtISO={carePlanInitiatedAtISO} />

          {/* 4) RN–Client contact verification via random-length code */}
          <ContactVerification caseId={caseId} nurseName={nurse} clientPhone={clientPhone} />
        </div>
      </div>
    </AppLayout>
  );
}
