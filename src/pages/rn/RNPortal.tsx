import { RCMS } from "../../constants/brand";
import { RNIndividualMetricsDashboard } from "@/components/RNClinicalLiaison/RNIndividualMetricsDashboard";

export default function RNPortal() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold" style={{color: RCMS.brandNavy}}>RN Case Management Portal</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Access your dashboards, compliance checks, and quality metrics.
      </p>

      <div className="mt-6 mb-8">
        <RNIndividualMetricsDashboard />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <a href="/rn/dashboard" className="rounded-2xl border border-border bg-card p-5 hover:bg-accent block">
          <h2 className="font-semibold">My Dashboard</h2>
          <p className="text-sm text-muted-foreground">Today's tasks, recent cases, reminders.</p>
        </a>
        <a href="/rn/compliance" className="rounded-2xl border border-border bg-card p-5 hover:bg-accent block">
          <h2 className="font-semibold">Compliance Checklist</h2>
          <p className="text-sm text-muted-foreground">Verification codes, mandatory fields, SLAs.</p>
        </a>
        <a href="/rn/quality" className="rounded-2xl border border-border bg-card p-5 hover:bg-accent block">
          <h2 className="font-semibold">Quality Metrics</h2>
          <p className="text-sm text-muted-foreground">Weekly/monthly scores and trends.</p>
        </a>
      </div>
    </div>
  );
}
