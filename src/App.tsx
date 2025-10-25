// src/App.tsx — Reconcile C.A.R.E. (Single-file TypeScript, ONE BLOCK)
// Tabs: Attorney Portal • Client Intake • Client Portal
// Features: Intake progress + redirect, Pending Intakes w/ Nudge, Auto-purge, GAS hooks.
// No other files required. Tailwind assumed. No backend; uses localStorage mocks.

import React from "react";

// ================== CONFIG ==================
const COMPANY_NAME = "Reconcile Care Management Services";
const APP_NAME = "Reconcile C.A.R.E.";

const PURGE_AFTER_DAYS = 7;                 // auto-delete incomplete intakes after N days
const REMINDER_DAYS: readonly number[] = [1, 3, 5];
const GAS_WEBAPP_URL = import.meta.env?.VITE_GAS_URL as string | undefined; // optional

// ================== TYPES ==================
type IntakeRequired = { incident: boolean; injuries: boolean; consent: boolean; };
type IntakeOptional = { fourPs: boolean; sdoh: boolean; };
type IntakeMeta = { startedAt: string; completedAt?: string | null; required: IntakeRequired; optional: IntakeOptional; };
type Consent = { signed: boolean; scope?: { shareWithAttorney?: boolean; shareWithProviders?: boolean } };
type ClientContact = { email?: string; phone?: string; fullName?: string; };

type Checkin = { ts: string; pain: number; note: string; fourPs?: number; };
type CaseStatus = "PENDING" | "READY" | "EXPIRED" | "ACTIVE";

type CaseRecord = {
  id: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  firmId: string;
  intake: IntakeMeta;
  consent: Consent;
  clientContact: ClientContact;
  status: CaseStatus;
  checkins: Checkin[];
};

// ================== STORAGE & UTILS ==================
const ls = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : d; } catch { return d; } },
  set<T>(k: string, v: T) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function uid() { return Math.random().toString(36).slice(2, 10); }
function daysSince(iso?: string) { if (!iso) return 0; return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); }
function maskName(full?: string) {
  if (!full) return "Client";
  const [f = "", l = ""] = full.split(" ");
  const mask = (s: string) => (s ? s[0] + "•".repeat(Math.max(0, s.length - 1)) : "");
  return `${mask(f)} ${mask(l)}`.trim();
}

// ================== SEED DATA ==================
function seedCases(): CaseRecord[] {
  const existing = ls.get<CaseRecord[] | null>("cases", null);
  if (existing) return existing;
  const now = Date.now();
  const demo: CaseRecord[] = [
    {
      id: "RCMS-2001",
      token: "tok_" + uid(),
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      firmId: "firmA",
      intake: { startedAt: new Date(now - 2 * 86400000).toISOString(), required: { incident: true, injuries: true, consent: false }, optional: { fourPs: false, sdoh: false }, completedAt: null },
      consent: { signed: false },
      clientContact: { email: "client1@example.com", phone: "", fullName: "" },
      status: "PENDING",
      checkins: [],
    },
    {
      id: "RCMS-2002",
      token: "tok_" + uid(),
      createdAt: new Date(now - 6 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      firmId: "firmA",
      intake: { startedAt: new Date(now - 6 * 86400000).toISOString(), required: { incident: true, injuries: true, consent: true }, optional: { fourPs: true, sdoh: true }, completedAt: new Date(now - 5 * 86400000).toISOString() },
      consent: { signed: true },
      clientContact: { email: "client2@example.com", phone: "5551234567", fullName: "Sue Smith" },
      status: "READY",
      checkins: [],
    },
  ];
  ls.set("cases", demo);
  return demo;
}

// ================== GOOGLE APPS SCRIPT HOOKS (no-op if no URL) ==================
async function gasPost(payload: unknown): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!GAS_WEBAPP_URL) return { ok: true, skipped: true };
  try {
    const res = await fetch(GAS_WEBAPP_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
async function scheduleClientReminders(c: CaseRecord, days = REMINDER_DAYS) {
  const { email, phone } = c.clientContact || {};
  if (!email && !phone) return { ok: true, skipped: true };
  return gasPost({ action: "scheduleReminders", caseId: c.id, email, phone, days });
}
async function sendImmediateNudge(c: CaseRecord) {
  const { email, phone } = c.clientContact || {};
  if (!email && !phone) return { ok: true, skipped: true };
  return gasPost({ action: "sendNudge", caseId: c.id, email, phone });
}
async function notifyIntakeExpired(c: CaseRecord) {
  const { email, phone } = c.clientContact || {};
  if (!email && !phone) return { ok: true, skipped: true };
  return gasPost({ action: "notifyExpired", caseId: c.id, email, phone });
}

// ================== MAIN APP ==================
export default function App() {
  const [cases, setCases] = React.useState<CaseRecord[]>(seedCases);
  const [tab, setTab] = React.useState<string>(location.hash.replace("#", "") || "Attorney Portal");
  const [activeToken, setActiveToken] = React.useState<string>("");

  // Auto-purge incomplete intakes on load
  React.useEffect(() => {
    const keep: CaseRecord[] = [];
    let changed = false;
    (async () => {
      for (const c of cases) {
        const incomplete = !c.intake?.completedAt;
        const age = daysSince(c.intake?.startedAt || c.createdAt);
        if (incomplete && age >= PURGE_AFTER_DAYS) {
          changed = true;
          await notifyIntakeExpired(c);
          // skip (delete)
        } else {
          keep.push(c);
        }
      }
      if (changed) { setCases(keep); ls.set("cases", keep); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const onHash = () => setTab(location.hash.replace("#", "") || "Attorney Portal");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => { ls.set("cases", cases); }, [cases]);

  function upsertCase(updated: CaseRecord) {
    setCases(prev => {
      const i = prev.findIndex(x => x.id === updated.id);
      const arr = i >= 0 ? [...prev.slice(0, i), updated, ...prev.slice(i + 1)] : [updated, ...prev];
      ls.set("cases", arr);
      return arr;
    });
  }

  // Simple firm selector for demo
  const firms = ["firmA", "firmB"];
  const [currentFirm, setCurrentFirm] = React.useState<string>("firmA");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-3 py-3 flex items-center gap-2">
          <h1 className="text-lg font-semibold">{APP_NAME}</h1>
          <span className="text-xs rounded bg-secondary px-2 py-1">ORG: FIRM ({currentFirm})</span>
          <nav className="ml-4">
            <ul className="flex flex-wrap gap-2">
              {["Attorney Portal", "Client Intake", "Client Portal"].map(t => (
                <li key={t}>
                  <a href={`#${t}`} className={`px-3 py-1.5 rounded-md text-sm ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}>{t}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Firm</label>
            <select className="rounded border px-2 py-1 text-sm bg-background" value={currentFirm} onChange={e => setCurrentFirm(e.target.value)}>
              {firms.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </header>

      {tab === "Attorney Portal" && (
        <AttorneyPortal
          currentFirm={currentFirm}
          cases={cases}
          onNudge={async (c) => { await sendImmediateNudge(c); alert("Nudge sent (if Apps Script URL configured)."); }}
        />
      )}

      {tab === "Client Intake" && (
        <ClientIntake
          cases={cases}
          setCases={setCases}
          upsertCase={upsertCase}
          onScheduledReminders={(c) => { scheduleClientReminders(c); }}
          onRedirectToPortal={(c) => { setActiveToken(c.token); location.hash = "Client Portal"; }}
        />
      )}

      {tab === "Client Portal" && (
        <ClientPortal
          cases={cases}
          token={activeToken}
          onSetToken={setActiveToken}
          onSave={(c) => upsertCase(c)}
        />
      )}

      <footer className="mx-auto max-w-6xl px-3 py-6 text-xs text-muted-foreground">
        {APP_NAME} by {COMPANY_NAME}. Minimum necessary data. No PHI in URLs. Consent-gated.
      </footer>
    </main>
  );
}

// ================== ATTORNEY PORTAL ==================
function AttorneyPortal({ currentFirm, cases, onNudge }: {
  currentFirm: string;
  cases: CaseRecord[];
  onNudge: (c: CaseRecord) => void | Promise<void>;
}) {
  const pending = cases
    .filter(c => c.firmId === currentFirm && !c.intake?.completedAt)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <section className="mx-auto max-w-6xl p-4 space-y-4">
      <h2 className="text-xl font-semibold">Attorney Portal</h2>

      <div className="rounded-lg border p-4">
        <h3 className="font-medium mb-2">Pending Intakes</h3>
        <p className="text-sm text-muted-foreground mb-3">Clients invited but not finished. Names are masked until consent is signed.</p>
        <div className="overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Case</th>
                <th className="text-left p-2">Client</th>
                <th className="text-left p-2">Days Since Start</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">No pending intakes.</td></tr>
              )}
              {pending.map(c => {
                const name = c.consent?.signed ? (c.clientContact?.fullName || "Client") : maskName(c.clientContact?.fullName);
                const age = daysSince(c.intake?.startedAt || c.createdAt);
                const atRisk = age >= 5;
                return (
                  <tr key={c.id} className="border-b">
                    <td className="p-2">{c.id}</td>
                    <td className="p-2">{name}</td>
                    <td className="p-2">{age} days</td>
                    <td className="p-2">
                      <span className={`text-xs rounded px-2 py-1 ${atRisk ? "bg-destructive/10 text-destructive" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"}`}>
                        {atRisk ? "At Risk" : "Pending"}
                      </span>
                    </td>
                    <td className="p-2">
                      <button className="rounded bg-primary px-3 py-1.5 text-primary-foreground text-sm hover:bg-primary/90" onClick={() => onNudge(c)}>
                        Nudge
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="font-medium mb-2">Notes</h3>
        <p className="text-sm text-muted-foreground">Add firm features here (case list, exports, etc.).</p>
      </div>
    </section>
  );
}

// ================== CLIENT INTAKE ==================
function ClientIntake({ cases, setCases, upsertCase, onScheduledReminders, onRedirectToPortal }: {
  cases: CaseRecord[];
  setCases: React.Dispatch<React.SetStateAction<CaseRecord[]>>;
  upsertCase: (c: CaseRecord) => void;
  onScheduledReminders?: (c: CaseRecord) => void | Promise<void>;
  onRedirectToPortal: (c: CaseRecord) => void;
}) {
  const [caseId, setCaseId] = React.useState<string>(cases[0]?.id || "");
  const theCase = cases.find(c => c.id === caseId);

  function createCase() {
    const now = new Date().toISOString();
    const c: CaseRecord = {
      id: "RCMS-" + (Math.floor(Math.random() * 9000) + 1000),
      token: "tok_" + uid(),
      createdAt: now,
      updatedAt: now,
      firmId: "firmA",
      intake: { startedAt: now, required: { incident: false, injuries: false, consent: false }, optional: { fourPs: false, sdoh: false }, completedAt: null },
      consent: { signed: false },
      clientContact: { email: "", phone: "", fullName: "" },
      status: "PENDING",
      checkins: [],
    };
    setCases(prev => [c, ...prev]);
    onScheduledReminders?.(c);
    setCaseId(c.id);
  }

  function markRequired<K extends keyof IntakeRequired>(key: K, val: boolean) {
    if (!theCase) return;
    const req: IntakeRequired = { ...(theCase.intake.required), [key]: val } as IntakeRequired;
    upsertCase({ ...theCase, intake: { ...theCase.intake, required: req }, updatedAt: new Date().toISOString() });
  }

  function markOptional<K extends keyof IntakeOptional>(key: K, val: boolean) {
    if (!theCase) return;
    const opt: IntakeOptional = { ...(theCase.intake.optional), [key]: val } as IntakeOptional;
    upsertCase({ ...theCase, intake: { ...theCase.intake, optional: opt }, updatedAt: new Date().toISOString() });
  }

  function updateContact(patch: Partial<ClientContact>) {
    if (!theCase) return;
    upsertCase({ ...theCase, clientContact: { ...(theCase.clientContact || {}), ...patch }, updatedAt: new Date().toISOString() });
  }

  function tryComplete() {
    if (!theCase) return;
    const r = theCase.intake.required;
    if (r.incident && r.injuries && r.consent) {
      const next: CaseRecord = { ...theCase, intake: { ...theCase.intake, completedAt: new Date().toISOString() }, status: "READY", updatedAt: new Date().toISOString() };
      upsertCase(next);
      alert("Intake complete. You'll be taken to your Client Portal.");
      onRedirectToPortal(next);
    } else {
      alert("Please complete all required sections before continuing.");
    }
  }

  const { percent, completedSteps, totalSteps } = useIntakeProgress(theCase?.intake);

  return (
    <section className="mx-auto max-w-3xl p-4 space-y-4">
      <h2 className="text-xl font-semibold">Client Intake</h2>
      <p className="text-sm text-muted-foreground">Please begin your case by completing this short intake. Your information is private and shared only with your care and legal team.</p>

      {/* Orientation video */}
      <div className="rounded-lg border p-3 bg-muted/50">
        <p className="text-sm font-medium mb-2">🎥 What to expect</p>
        <div className="aspect-video w-full bg-muted grid place-items-center text-muted-foreground text-sm">Embed Intake Orientation Video</div>
        <p className="text-xs text-muted-foreground mt-2">We'll ask about your incident, your injuries, and your consent. You can stop and return later using your secure link.</p>
      </div>

      {/* Case selector / create */}
      <div className="rounded-lg border p-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium">Select or create your case</label>
            <select className="mt-1 w-full rounded border px-3 py-2 text-sm bg-background" value={caseId} onChange={e => setCaseId(e.target.value)}>
              {cases.map(c => <option key={c.id} value={c.id}>{c.id} — {c.firmId} {c.intake?.completedAt ? "(complete)" : ""}</option>)}
            </select>
          </div>
          <button className="rounded bg-secondary px-3 py-2 text-sm hover:bg-secondary/80" onClick={createCase}>New Case</button>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-lg border p-3">
        <label className="text-sm font-medium">Progress</label>
        <div className="mt-2 h-2 w-full bg-secondary rounded"><div className="h-2 bg-primary rounded" style={{ width: `${percent}%` }} /></div>
        <div className="mt-1 text-xs text-muted-foreground">{completedSteps} of {totalSteps} steps complete</div>
      </div>

      {/* Incident */}
      <Section isDone={!!theCase?.intake.required.incident} title="Incident Details (required)">
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="rounded border px-3 py-2 text-sm bg-background" placeholder="Incident type (e.g., MVA, WorkComp)" onBlur={e => markRequired("incident", !!e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm bg-background" placeholder="Incident date (YYYY-MM-DD)" onBlur={e => markRequired("incident", !!e.target.value)} />
        </div>
      </Section>

      {/* Injuries */}
      <Section isDone={!!theCase?.intake.required.injuries} title="Injuries & Initial Treatment (required)">
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="rounded border px-3 py-2 text-sm bg-background" placeholder="Injuries (free text)" onBlur={e => markRequired("injuries", !!e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm bg-background" placeholder="Initial treatment (ED/PCP/Chiro/None)" onBlur={e => markRequired("injuries", !!e.target.value)} />
        </div>
      </Section>

      {/* Consent */}
      <Section isDone={!!theCase?.intake.required.consent} title="Consent (required)">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <input id={`consent_${theCase?.id || "new"}`} type="checkbox" onChange={e => markRequired("consent", e.target.checked)} />
            <label htmlFor={`consent_${theCase?.id || "new"}`}>I consent to share my information with my attorney and providers as described.</label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded border px-3 py-2 text-sm bg-background" placeholder="Your email (for secure link)" onBlur={e => updateContact({ email: e.target.value })} />
            <input className="rounded border px-3 py-2 text-sm bg-background" placeholder="Your phone (for SMS reminders)" onBlur={e => updateContact({ phone: e.target.value })} />
          </div>
        </div>
      </Section>

      {/* Optional */}
      <Section isDone={!!(theCase?.intake.optional.fourPs && theCase?.intake.optional.sdoh)} title="Optional 4Ps & SDOH (complete within 24–72 hours)">
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="rounded border px-3 py-2 text-sm bg-background" placeholder="4Ps quick score (0–100)" onBlur={e => markOptional("fourPs", !!e.target.value)} />
          <select className="rounded border px-3 py-2 text-sm bg-background" defaultValue="" onChange={e => markOptional("sdoh", !!e.target.value)}>
            <option value="" disabled>SDOH: any needs?</option>
            <option>Housing</option><option>Food</option><option>Transport</option><option>Insurance Gap</option>
          </select>
        </div>
      </Section>

      {/* Finish */}
      <div className="flex justify-end gap-2">
        <button className="rounded bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90" onClick={tryComplete}>
          Finish Intake & Go to Portal
        </button>
      </div>
    </section>
  );
}

// Intake progress helper (internal to this file)
function useIntakeProgress(intake?: IntakeMeta) {
  const totalSteps = 5; // 3 required + 2 optional
  const completed =
    (intake?.required?.incident ? 1 : 0) +
    (intake?.required?.injuries ? 1 : 0) +
    (intake?.required?.consent ? 1 : 0) +
    (intake?.optional?.fourPs ? 1 : 0) +
    (intake?.optional?.sdoh ? 1 : 0);
  const percent = Math.round((completed / totalSteps) * 100);
  return { percent, completedSteps: completed, totalSteps };
}

// ================== CLIENT PORTAL ==================
function ClientPortal({ cases, token, onSetToken, onSave }: {
  cases: CaseRecord[];
  token: string;
  onSetToken: (t: string) => void;
  onSave: (c: CaseRecord) => void;
}) {
  const [manualTok, setManualTok] = React.useState<string>("");
  const theCase = cases.find(c => c.token === token);

  return (
    <section className="mx-auto max-w-3xl p-4 space-y-4">
      <h2 className="text-xl font-semibold">Client Portal</h2>

      {!theCase && (
        <div className="rounded-lg border p-4 bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700">
          <p className="text-sm mb-2"><b>Welcome back!</b> If you already completed your intake, paste your secure portal token below (simulates your emailed link for demo).</p>
          <div className="flex gap-2">
            <input className="flex-1 rounded border px-3 py-2 text-sm bg-background" placeholder="Paste your portal token (e.g., tok_...)" value={manualTok} onChange={e => setManualTok(e.target.value)} />
            <button className="rounded bg-primary px-3 py-2 text-primary-foreground text-sm" onClick={() => onSetToken(manualTok)}>Open</button>
          </div>
        </div>
      )}

      {/* Explainer video */}
      <div className="rounded-lg border p-3 bg-muted/50">
        <p className="text-sm font-medium mb-2">🎥 How to use your Client Portal</p>
        <div className="aspect-video w-full bg-muted grid place-items-center text-muted-foreground text-sm">Embed Portal Explainer Video</div>
        <ul className="mt-2 text-xs text-muted-foreground list-disc ml-5">
          <li>Submit your check-ins regularly (pain scale + notes).</li>
          <li>Update your 4Ps when requested by your care team.</li>
          <li>Your information is private and shared only with your team.</li>
        </ul>
      </div>

      {theCase && !theCase.intake?.completedAt && (
        <div className="rounded-lg border p-4 bg-destructive/10 border-destructive/30 text-destructive">
          Your intake isn't complete yet. Please finish your intake to access the portal features.
        </div>
      )}

      {theCase && theCase.intake?.completedAt && (
        <>
          {/* Check-in */}
          <div className="rounded-lg border p-3">
            <label className="text-sm font-medium">Submit Check-In</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input id="pain" className="rounded border px-3 py-2 text-sm bg-background" placeholder="Pain (0–10)" />
              <input id="fourps" className="rounded border px-3 py-2 text-sm bg-background" placeholder="4Ps quick score (0–100)" />
            </div>
            <textarea id="note" className="mt-2 w-full rounded border px-3 py-2 text-sm bg-background" rows={3} placeholder="Notes (e.g., changes since last visit)" />
            <div className="mt-2 flex justify-end">
              <button
                className="rounded bg-primary px-3 py-2 text-primary-foreground text-sm hover:bg-primary/90"
                onClick={() => {
                  const pain = parseInt((document.getElementById("pain") as HTMLInputElement)?.value || "0", 10);
                  const fp = parseInt((document.getElementById("fourps") as HTMLInputElement)?.value || "0", 10);
                  const note = (document.getElementById("note") as HTMLTextAreaElement)?.value || "";
                  const next: CaseRecord = { ...theCase, checkins: [...theCase.checkins, { ts: new Date().toISOString(), pain, fourPs: fp, note }] };
                  onSave(next);
                  alert("Check-in saved (local).");
                }}
              >
                Submit Check-In
              </button>
            </div>
          </div>

          {/* History */}
          <div className="rounded-lg border p-3">
            <label className="text-sm font-medium">Recent Check-Ins</label>
            {theCase.checkins.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">No check-ins yet.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {theCase.checkins.slice().reverse().map((ch, i) => (
                  <li key={i} className="border rounded p-2">
                    <div className="text-xs text-muted-foreground">{new Date(ch.ts).toLocaleString()}</div>
                    <div>Pain: {ch.pain}/10 • 4Ps: {ch.fourPs ?? "—"}</div>
                    <div className="text-foreground">{ch.note}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

// ================== SMALL SECTION COMPONENT ==================
function Section({ isDone, title, children }: { isDone: boolean; title: string; children: React.ReactNode; }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{title}</label>
        <span className={`text-[11px] rounded px-2 py-0.5 ${isDone ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200" : "bg-secondary text-secondary-foreground"}`}>
          {isDone ? "Done" : "Pending"}
        </span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
