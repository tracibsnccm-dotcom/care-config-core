import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { Case } from "@/config/rcms";
import { fmtDate } from "@/lib/store";
import { differenceInDays, differenceInHours } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  Clock,
  Download,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function Reports() {
  const navigate = useNavigate();
  const { cases } = useApp();

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // New clients in past 30 days
  const newClients = cases.filter((c) => {
    const createdDate = new Date(c.createdAt);
    return createdDate >= thirtyDaysAgo;
  });

  // Unprocessed cases (6+ days old, still NEW status)
  const unprocessedCases = cases.filter((c) => {
    const daysOld = differenceInDays(now, new Date(c.createdAt));
    return daysOld >= 6 && c.status === "NEW";
  });

  // At-risk cases with time-based warnings
  // 144 hours (6 days) = deletion time
  // Show warnings at: 48h, 24h, 8h remaining
  const atRiskCases = cases
    .filter((c) => c.status === "NEW")
    .map((c) => {
      const hoursOld = differenceInHours(now, new Date(c.createdAt));
      const hoursRemaining = 144 - hoursOld; // 144 hours = 6 days
      return { ...c, hoursOld, hoursRemaining };
    })
    .filter((c) => c.hoursRemaining <= 48 && c.hoursRemaining > 0)
    .sort((a, b) => a.hoursRemaining - b.hoursRemaining);

  function getWarningLevel(hoursRemaining: number) {
    if (hoursRemaining <= 8) return "critical";
    if (hoursRemaining <= 24) return "urgent";
    if (hoursRemaining <= 48) return "warning";
    return "normal";
  }

  function getWarningColor(level: string) {
    switch (level) {
      case "critical":
        return "bg-destructive/20 border-destructive text-destructive";
      case "urgent":
        return "bg-orange-500/20 border-orange-500 text-orange-500";
      case "warning":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-500";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attorney Reports</h1>
            <p className="text-muted-foreground mt-1">
              Case activity and deletion warnings
            </p>
          </div>
          <Button variant="outline" onClick={() => alert("Export functionality (mock)")}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Clients</p>
                <p className="text-2xl font-bold text-foreground">{newClients.length}</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unprocessed</p>
                <p className="text-2xl font-bold text-foreground">{unprocessedCases.length}</p>
                <p className="text-xs text-muted-foreground">6+ days old</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold text-foreground">{atRiskCases.length}</p>
                <p className="text-xs text-muted-foreground">≤48h remaining</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold text-foreground">{cases.length}</p>
                <p className="text-xs text-muted-foreground">All statuses</p>
              </div>
            </div>
          </Card>
        </div>

        {/* At-Risk Cases (Critical Section) */}
        {atRiskCases.length > 0 && (
          <Card className="p-6 border-destructive bg-destructive/5 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-destructive mb-1">
                  Cases Approaching Deletion
                </h2>
                <p className="text-sm text-muted-foreground">
                  {atRiskCases.length} case{atRiskCases.length !== 1 ? "s" : ""} will be
                  deleted/tagged as attorney refusal without action
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-semibold text-sm text-foreground">Case ID</th>
                    <th className="pb-3 font-semibold text-sm text-foreground">Incident</th>
                    <th className="pb-3 font-semibold text-sm text-foreground">Created</th>
                    <th className="pb-3 font-semibold text-sm text-foreground">Time Remaining</th>
                    <th className="pb-3 font-semibold text-sm text-foreground">Warning Level</th>
                    <th className="pb-3 font-semibold text-sm text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskCases.map((c) => {
                    const level = getWarningLevel(c.hoursRemaining);
                    return (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="py-3 font-medium text-foreground">{c.client.rcmsId}</td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {c.intake.incidentType}
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {fmtDate(c.createdAt)}
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-destructive">
                            {c.hoursRemaining}h
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getWarningColor(
                              level
                            )}`}
                          >
                            {level === "critical" && "🔴"}
                            {level === "urgent" && "🟠"}
                            {level === "warning" && "🟡"}
                            {level.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/cases/${c.id}`)}
                          >
                            Review Case
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Clients (Last 30 Days) */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                New Clients (Last 30 Days)
              </h2>
              <span className="ml-auto text-sm text-muted-foreground">
                {newClients.length} total
              </span>
            </div>

            {newClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No new clients in the last 30 days</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {newClients.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/cases/${c.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{c.client.rcmsId}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {c.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {c.intake.incidentType} • {c.intake.injuries.slice(0, 2).join(", ")}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {fmtDate(c.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Unprocessed Cases (6+ Days) */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-foreground">
                Unprocessed Cases (6+ Days)
              </h2>
              <span className="ml-auto text-sm text-muted-foreground">
                {unprocessedCases.length} total
              </span>
            </div>

            {unprocessedCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unprocessed cases</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unprocessedCases.map((c) => {
                  const daysOld = differenceInDays(now, new Date(c.createdAt));
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20 cursor-pointer transition-colors"
                      onClick={() => navigate(`/cases/${c.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{c.client.rcmsId}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500">
                            {c.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {c.intake.incidentType} • {c.intake.injuries.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-orange-500">{daysOld} days old</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Info Box */}
        <Card className="mt-6 p-4 bg-muted border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Deletion Policy
          </h3>
          <p className="text-sm text-muted-foreground">
            Cases without attorney intervention are automatically deleted after{" "}
            <b className="text-foreground">144 hours (6 days)</b> and tagged as "attorney
            refusal/denial". Automated warnings are sent at{" "}
            <b className="text-foreground">48h, 24h, and 8h</b> remaining.
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
