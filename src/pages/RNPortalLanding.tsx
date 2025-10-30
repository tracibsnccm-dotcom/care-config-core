import { Link } from "react-router-dom";
import { FileText, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";

export default function RNPortalLanding() {
  return (
    <main className="max-w-6xl mx-auto p-6">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
          <span>RN Case Management</span>
          <span className="opacity-75">(Role: RN_CCM)</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-primary">RN Portal</h1>
        <p className="text-muted-foreground mt-1">
          Access your dashboard, compliance tasks, and quality metrics. 24h/48h note timeliness rules apply.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/rn-dashboard"
          className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">My Dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Assigned cases, overdue notes (yellow/red), upcoming appointments.
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/rn-cm/compliance"
          className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Compliance Tasks</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Required fields, random contact code, care plan timeliness.
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/rn-cm/quality"
          className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Quality Metrics</h3>
              <p className="text-sm text-muted-foreground mt-1">
                My Metrics vs Team Metrics (role-gated), weekly/monthly rollups.
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/concerns-complaints"
          className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition group border-warning/20"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Concerns & Complaints</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor and resolve client concerns and anonymous complaints.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
