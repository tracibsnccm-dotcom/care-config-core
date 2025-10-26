import React, { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";

/* ───────────────────────── Config (keep in one place) ───────────────────────── */
const CONFIG = {
  noteSLA: { greenHours: 24, yellowHours: 48 },
  requiredCallBizDays: 2,
  rolesExportAllowed: ["RN_CCM", "SUPER_USER", "SUPER_ADMIN"] as const,
  colors: {
    onTime: "#16a34a",
    late: "#f59e0b",
    overdue: "#dc2626",
    teal: "#128f8b",
    card: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.18)",
  },
};
type AllowedExportRole = typeof CONFIG.rolesExportAllowed[number];

/* ───────────────────────── Types ───────────────────────── */
type Role = "CLIENT"|"ATTORNEY"|"RN_CCM"|"STAFF"|"SUPER_USER"|"SUPER_ADMIN";

type RNVisitNote = {
  caseId: string;
  rn: string;                 // RN name
  visitDateISO: string;       // appointment date/time
  noteSubmittedAtISO?: string;// when note was saved (missing = not yet)
};

type CarePlanEvent = {
  caseId: string;
  rn: string;
  initiatedAtISO: string;     // when care plan set to "Initiated"
  callCompletedAtISO?: string;// required client call completion time
};

type MedsBlock = {
  caseId: string;
  rn: string;
  dateISO: string;
  conditions?: string;
  meds?: string;
  allergies?: string;
  attested?: boolean;         // nurse/client attestation
  shareWithPCP?: boolean | null;
  pcpName?: string;
  clientLabel?: string;       // initials/masked
};

/* A single row per case for the dashboard; you can merge real data into this shape */
type CaseQualityRow = {
  caseId: string;
  rn: string;
  clientLabel?: string;

  // Timeliness (per most recent visit)
  lastVisitDateISO?: string;
  noteSubmittedAtISO?: string;

  // Care plan lifecycle
  planInitiatedAtISO?: string;
  callCompletedAtISO?: string;

  // Meds block
  conditions?: string;
  meds?: string;
  allergies?: string;
  attested?: boolean;
  shareWithPCP?: boolean | null;

  // Optional tags
  firm?: string;
};

/* ───────────────────────── Helpers ───────────────────────── */
const hoursBetween = (a?: string, b?: string) => {
  if (!a || !b) return Infinity;
  return (new Date(b).getTime() - new Date(a).getTime()) / 36e5;
};
const sinceHours = (iso?: string) => {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 36e5;
};
const isNone = (s?: string) => (s ?? "").trim().toLowerCase() === "none";
const hasText = (s?: string) => (s ?? "").trim().length > 0;
const exportAllowed = (role?: Role) =>
  !!role && (CONFIG.rolesExportAllowed as readonly string[]).includes(role);

/* ───────────────────────── CSV Export ───────────────────────── */
function toCSV(rows: CaseQualityRow[]) {
  const headers = [
    "case_id","rn","client_label","firm",
    "last_visit","note_submitted",
    "plan_initiated","call_completed",
    "conditions","meds","allergies","attested","pcp_share"
  ];
  const esc = (v:any) => {
    if (v==null) return "";
    const s = String(v);
    return (/[",\n]/.test(s)) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.caseId, r.rn, r.clientLabel ?? "", r.firm ?? "",
      r.lastVisitDateISO ?? "", r.noteSubmittedAtISO ?? "",
      r.planInitiatedAtISO ?? "", r.callCompletedAtISO ?? "",
      r.conditions ?? "", r.meds ?? "", r.allergies ?? "",
      r.attested === true ? "YES" : r.attested === false ? "NO" : "",
      r.shareWithPCP === true ? "YES" : r.shareWithPCP === false ? "NO" : ""
    ].map(esc).join(","));
  }
  return lines.join("\n");
}
function downloadCSV(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name.endsWith(".csv")? name : `${name}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* ───────────────────────── Metrics ───────────────────────── */
function computeMetrics(rows: CaseQualityRow[]) {
  const total = rows.length || 0;

  // Note timeliness (use most recent visit per row)
  let onTime = 0, late = 0, overdue = 0, missing = 0;
  for (const r of rows) {
    if (!r.lastVisitDateISO) { missing++; continue; }
    if (!r.noteSubmittedAtISO) {
      const h = sinceHours(r.lastVisitDateISO);
      if (h <= CONFIG.noteSLA.greenHours) onTime++;
      else if (h <= CONFIG.noteSLA.yellowHours) late++;
      else overdue++;
    } else {
      const h = hoursBetween(r.lastVisitDateISO, r.noteSubmittedAtISO);
      if (h <= CONFIG.noteSLA.greenHours) onTime++;
      else if (h <= CONFIG.noteSLA.yellowHours) late++;
      else overdue++;
    }
  }

  // Care plan required client call
  let callsRequired = 0, callsCompletedOnTime = 0, callsOverdue = 0;
  for (const r of rows) {
    if (r.planInitiatedAtISO) {
      callsRequired++;
      const due = addBizDays(new Date(r.planInitiatedAtISO), CONFIG.requiredCallBizDays);
      const done = r.callCompletedAtISO ? new Date(r.callCompletedAtISO) : undefined;
      if (done) {
        if (done.getTime() <= due.getTime()) callsCompletedOnTime++;
      } else {
        if (new Date().getTime() > due.getTime()) callsOverdue++;
      }
    }
  }

  // Med reconciliation completeness
  let medsComplete = 0, allergiesDocumented = 0, pcpOptIn = 0;
  for (const r of rows) {
    const medsOk = hasText(r.meds) && !isNone(r.meds) && r.attested === true;
    const allergiesOk = hasText(r.allergies); // allow "None" if you prefer: || isNone(r.allergies)
    const pcpOk = r.shareWithPCP === true;
    if (medsOk) medsComplete++;
    if (allergiesOk) allergiesDocumented++;
    if (pcpOk) pcpOptIn++;
  }

  const pct = (n:number) => total ? Math.round((n/total)*100) : 0;

  return {
    total,
    noteOnTime: onTime, noteLate: late, noteOverdue: overdue, noteMissing: missing,
    noteOnTimePct: pct(onTime), noteLatePct: pct(late), noteOverduePct: pct(overdue),

    callsRequired, callsCompletedOnTime, callsOverdue,
    callsCompletedOnTimePct: callsRequired ? Math.round((callsCompletedOnTime/callsRequired)*100) : 0,

    medsComplete, medsCompletePct: pct(medsComplete),
    allergiesDocumented, allergiesDocumentedPct: pct(allergiesDocumented),
    pcpOptIn, pcpOptInPct: pct(pcpOptIn),
  };
}

/* simple business-day adder */
function addBizDays(start: Date, bizDays: number) {
  const d = new Date(start);
  let added = 0;
  while (added < bizDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

/* ───────────────────────── Mock Data (replace with real) ───────────────────────── */
// TODO: Replace with real AppContext / API data
const MOCK_ROWS: CaseQualityRow[] = [
  {
    caseId:"RCMS-001", rn:"RN Jane", clientLabel:"A.B.",
    firm:"Smith Law", lastVisitDateISO:isoHoursAgo(26), // late
    // noteSubmittedAtISO: undefined (still missing)
    planInitiatedAtISO: isoHoursAgo(40), callCompletedAtISO: undefined,
    conditions:"Back pain; T2DM", meds:"Metformin 500mg; Ibuprofen 200mg PRN", allergies:"Penicillin", attested:true, shareWithPCP:true
  },
  {
    caseId:"RCMS-002", rn:"RN Jane", clientLabel:"B.C.",
    firm:"Smith Law", lastVisitDateISO:isoHoursAgo(10), noteSubmittedAtISO:isoHoursAgo(8), // on time
    planInitiatedAtISO: isoHoursAgo(60), callCompletedAtISO: isoHoursAgo(20),
    conditions:"Concussion", meds:"Acetaminophen; Omega-3", allergies:"None", attested:true, shareWithPCP:false
  },
  {
    caseId:"RCMS-003", rn:"RN Alex", clientLabel:"C.D.",
    firm:"Lopez Injury", lastVisitDateISO:isoHoursAgo(54), noteSubmittedAtISO:isoHoursAgo(2), // overdue (note submitted very late)
    planInitiatedAtISO: isoHoursAgo(8), callCompletedAtISO: undefined,
    conditions:"Whiplash", meds:"None", allergies:"Shellfish", attested:false, shareWithPCP:null
  },
];
function isoHoursAgo(h:number){ return new Date(Date.now()-h*3600*1000).toISOString(); }

/* ───────────────────────── UI ───────────────────────── */
function StatCard({label, value, sub, color}:{label:string; value:string|number; sub?:string; color?:string}) {
  return (
    <div className="rounded-xl p-4 border" style={{background:CONFIG.colors.card, borderColor:CONFIG.colors.border}}>
      <div className="text-white/80 text-sm">{label}</div>
      <div className="text-white font-extrabold text-2xl">{value}</div>
      {sub && <div className="text-white/70 text-xs mt-1">{sub}</div>}
      {color && <div className="mt-2 h-1.5 w-16 rounded-full" style={{background:color}} />}
    </div>
  );
}

export default function RNQualityDashboard({
  currentRole = "RN_CCM",
  initialData
}: {
  currentRole?: Role;
  initialData?: CaseQualityRow[]; // pass real data here later
}) {
  // Filters
  const [rn, setRN] = useState<string>("All");
  const [firm, setFirm] = useState<string>("All");

  // Data source (mock now)
  const data = useMemo(() => initialData ?? MOCK_ROWS, [initialData]);

  // Build filter lists
  const rnList = ["All", ...Array.from(new Set(data.map(d=>d.rn)))];
  const firmList = ["All", ...Array.from(new Set(data.map(d=>d.firm).filter(Boolean) as string[]))];

  const filtered = data.filter(d =>
    (rn==="All" || d.rn===rn) &&
    (firm==="All" || d.firm===firm)
  );

  const m = computeMetrics(filtered);

  return (
    <AppLayout>
      <div className="p-6 bg-background min-h-screen">
        <section className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-white text-2xl font-extrabold">RN Quality Dashboard</h2>
              <p className="text-white/80 text-sm">Live metrics for timeliness, reconciliation, and coordination.</p>
            </div>
            <div className="flex gap-2">
              <select className="rounded-md bg-white px-3 py-2" value={rn} onChange={e=>setRN(e.target.value)}>
                {rnList.map(x=><option key={x} value={x}>{x}</option>)}
              </select>
              <select className="rounded-md bg-white px-3 py-2" value={firm} onChange={e=>setFirm(e.target.value)}>
                {firmList.map(x=><option key={x} value={x}>{x}</option>)}
              </select>

              {/* CSV Export (role-gated) */}
              <button
                className={exportAllowed(currentRole) ? "rounded-md bg-[#0f2a6a] text-white px-3 py-2 font-semibold hover:brightness-110" :
                  "rounded-md bg-gray-400 text-white px-3 py-2 font-semibold cursor-not-allowed"}
                disabled={!exportAllowed(currentRole)}
                onClick={()=> downloadCSV("rcms_rn_quality.csv", toCSV(filtered))}
                title={exportAllowed(currentRole) ? "Download CSV" : "Export restricted to RN_CCM / SUPER_USER / SUPER_ADMIN"}
              >
                Export CSV
              </button>
            </div>
          </header>

          {/* Top stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Cases" value={m.total} />
            <StatCard label="Notes ≤24h" value={`${m.noteOnTime} (${m.noteOnTimePct}%)`} color={CONFIG.colors.onTime} />
            <StatCard label="Notes 24–48h" value={`${m.noteLate} (${m.noteLatePct}%)`} color={CONFIG.colors.late} />
            <StatCard label="Notes >48h" value={`${m.noteOverdue} (${m.noteOverduePct}%)`} color={CONFIG.colors.overdue} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard label="Calls Due (Initiated)" value={m.callsRequired} />
            <StatCard label="Calls On Time" value={`${m.callsCompletedOnTime} (${m.callsCompletedOnTimePct}%)`} color={CONFIG.colors.onTime} />
            <StatCard label="Calls Overdue" value={m.callsOverdue} color={CONFIG.colors.overdue} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard label="Med Reconciliation Complete" value={`${m.medsComplete} (${m.medsCompletePct}%)`} />
            <StatCard label="Allergies Documented" value={`${m.allergiesDocumented} (${m.allergiesDocumentedPct}%)`} />
            <StatCard label="PCP Opt-In" value={`${m.pcpOptIn} (${m.pcpOptInPct}%)`} />
          </div>

          {/* Table */}
          <div className="rounded-2xl border" style={{background:CONFIG.colors.card, borderColor:CONFIG.colors.border}}>
            <div className="px-4 py-3 border-b" style={{borderColor:CONFIG.colors.border}}>
              <h3 className="text-white font-bold">Case Detail</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-white/80">
                  <tr>
                    <th className="text-left px-4 py-2">Case</th>
                    <th className="text-left px-4 py-2">RN</th>
                    <th className="text-left px-4 py-2">Firm</th>
                    <th className="text-left px-4 py-2">Last Visit</th>
                    <th className="text-left px-4 py-2">Note Submitted</th>
                    <th className="text-left px-4 py-2">Call Due/Done</th>
                    <th className="text-left px-4 py-2">Meds / Allergies / PCP</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {filtered.map((r)=> {
                    const h = r.lastVisitDateISO && (r.noteSubmittedAtISO
                      ? hoursBetween(r.lastVisitDateISO, r.noteSubmittedAtISO)
                      : sinceHours(r.lastVisitDateISO));
                    const status =
                      h===Infinity ? "—" :
                      h <= CONFIG.noteSLA.greenHours ? "On time" :
                      h <= CONFIG.noteSLA.yellowHours ? "Late" : "Overdue";
                    const statusColor =
                      h===Infinity ? CONFIG.colors.card :
                      h <= CONFIG.noteSLA.greenHours ? CONFIG.colors.onTime :
                      h <= CONFIG.noteSLA.yellowHours ? CONFIG.colors.late : CONFIG.colors.overdue;

                    const due = r.planInitiatedAtISO ? addBizDays(new Date(r.planInitiatedAtISO), CONFIG.requiredCallBizDays) : undefined;
                    const call = r.callCompletedAtISO ? new Date(r.callCompletedAtISO) : undefined;
                    const callBadge = r.planInitiatedAtISO ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5" style={{background: (!call && due && Date.now()>due.getTime()) ? CONFIG.colors.overdue : CONFIG.colors.onTime, color:"#fff"}}>
                        {call ? "Done" : (due ? (Date.now()>due.getTime()? "Overdue" : "Due") : "—")}
                      </span>
                    ) : "—";

                    return (
                      <tr key={r.caseId} className="border-t" style={{borderColor:CONFIG.colors.border}}>
                        <td className="px-4 py-2"><div className="font-semibold text-white">{r.caseId}</div><div className="text-xs text-white/70">{r.clientLabel ?? ""}</div></td>
                        <td className="px-4 py-2">{r.rn}</td>
                        <td className="px-4 py-2">{r.firm ?? "—"}</td>
                        <td className="px-4 py-2">
                          <div>{r.lastVisitDateISO ? new Date(r.lastVisitDateISO).toLocaleString() : "—"}</div>
                          <div className="text-xs mt-1 inline-flex items-center rounded-full px-2 py-0.5" style={{background:statusColor, color:"#fff"}}>{status}</div>
                        </td>
                        <td className="px-4 py-2">{r.noteSubmittedAtISO ? new Date(r.noteSubmittedAtISO).toLocaleString() : "—"}</td>
                        <td className="px-4 py-2">{callBadge}</td>
                        <td className="px-4 py-2">
                          <div className="truncate max-w-[260px]">{r.meds ?? "—"}</div>
                          <div className="text-xs text-white/70">
                            Allergies: {r.allergies ?? "—"} • PCP: {r.shareWithPCP===true?"Yes":r.shareWithPCP===false?"No":"—"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!filtered.length && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-white/70">No cases match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
