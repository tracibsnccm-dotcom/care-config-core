import { useApp } from "@/context/AppContext";
import { ROLES } from "@/config/rcms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RNDashboard() {
  const { role } = useApp();

  // Role-based access check
  const allowedRoles: string[] = [ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN];
  const hasAccess = allowedRoles.includes(role);

  if (!hasAccess) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 px-6">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-semibold mb-4">
            <span>Restricted</span>
            <span className="opacity-70">RCMS Staff Only</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            This page is restricted to RCMS Nurse Case Managers and Supervisors.
            If you believe this is an error, contact your RCMS administrator.
          </p>
        </div>
      </section>
    );
  }

  const isSupervisor = role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN;

  return (
    <main className="py-10 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
            <span>RCMS Internal</span>
            <span className="opacity-70">RN &amp; Supervisor View</span>
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
            RN Case Management Dashboard
          </h1>
          <p className="mt-2 text-[#0f2a6a]/80 max-w-2xl">
            Private workspace for RCMS staff. Track timeliness of notes, follow-ups,
            medication reconciliation, and care plan updates. No PHI in the URL.
          </p>
        </header>

        {/* Two columns: My Metrics (RN) and Team Metrics (Supervisor) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Metrics (individual RN) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0f2a6a]">My Quality Metrics</CardTitle>
              <CardDescription>
                Your weekly and monthly performance vs. RCMS targets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Notes ≤ 24h", value: 95, target: "≥ 95%", color: "bg-green-500" },
                  { label: "Follow-Up Calls", value: 88, target: "≥ 92%", color: "bg-yellow-400" },
                  { label: "Med Reconciliation", value: 90, target: "≥ 90%", color: "bg-green-500" },
                  { label: "Care Plans Current", value: 92, target: "≥ 92%", color: "bg-green-500" },
                ].map((m, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">{m.label}</div>
                    <div className="mt-1 text-2xl font-extrabold text-foreground">{m.value}%</div>
                    <div className="mt-2 h-2 rounded bg-muted">
                      <div className={`h-2 rounded ${m.color}`} style={{ width: `${m.value}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Target {m.target}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                Trend charts will appear here (week vs. last week • month vs. last month).
              </div>
            </CardContent>
          </Card>

          {/* Team Metrics (supervisor) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0f2a6a]">
                {isSupervisor ? "Team Quality Metrics" : "Team Overview"}
              </CardTitle>
              <CardDescription>
                {isSupervisor 
                  ? "Supervisor view — compare RN performance and drill into details."
                  : "Team performance summary (full details available to supervisors)."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold">RN</th>
                      <th className="text-left px-4 py-2 font-semibold">Notes ≤24h</th>
                      <th className="text-left px-4 py-2 font-semibold">Follow-Ups</th>
                      <th className="text-left px-4 py-2 font-semibold">Med Rec</th>
                      <th className="text-left px-4 py-2 font-semibold">Care Plans</th>
                      <th className="text-left px-4 py-2 font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "RN A", notes: 97, fu: 93, med: 91, cp: 95, score: 94 },
                      { name: "RN B", notes: 92, fu: 88, med: 90, cp: 89, score: 90 },
                      { name: "RN C", notes: 89, fu: 85, med: 87, cp: 86, score: 87 },
                    ].map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-4 py-2">{r.name}</td>
                        <td className="px-4 py-2">{r.notes}%</td>
                        <td className="px-4 py-2">{r.fu}%</td>
                        <td className="px-4 py-2">{r.med}%</td>
                        <td className="px-4 py-2">{r.cp}%</td>
                        <td className="px-4 py-2 font-semibold">{r.score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-sm text-muted-foreground">
                Alerts for &gt; 48h overdue notes will surface here. Drill-down planned.
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Implementation notes */}
        <section className="mt-8">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Implementation TODO:</strong> Wire these tiles to your data source:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Apps Script or API endpoint returns per-RN metrics JSON.</li>
                  <li>Role-gate the Team view to supervisors and admins.</li>
                  <li>Never expose PHI in URLs; only aggregate/derived metrics here.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
