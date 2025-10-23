import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPI } from "@/components/KPI";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/store";
import { RCMS_CONFIG } from "@/config/rcms";
import { Case } from "@/config/rcms";
import { Users, UserPlus, Stethoscope, FolderOpen, FileDown, AlertTriangle, Clock, BarChart3 } from "lucide-react";
import { differenceInHours, differenceInDays } from "date-fns";

export default function AttorneyLanding() {
  const navigate = useNavigate();
  const {
    currentTier,
    tierCaps,
    providers,
    providerSlots,
    nextReset,
    swapsCap,
    swapsUsed,
    routerEnabled,
    exportAllowed,
    cases,
    log,
  } = useApp();

  const usedProviders = providers.filter((p) => p.active).length;
  const providerRemain = Math.max(0, providerSlots - usedProviders);

  // Filter cases for different tracking needs
  const now = new Date();
  
  // Critical: New cases without attorney intervention in 72+ hours
  const criticalCases = cases.filter((c) => {
    const hoursOld = differenceInHours(now, new Date(c.createdAt));
    return hoursOld >= 72 && c.status === "NEW";
  });

  // Recently opened (last 7 days)
  const recentCases = cases.filter((c) => {
    const daysOld = differenceInDays(now, new Date(c.createdAt));
    return daysOld <= 7;
  });

  // Cases needing attention (30+ days since last checkin)
  const needsAttentionCases = cases.filter((c) => {
    if (!c.checkins || c.checkins.length === 0) {
      const daysOld = differenceInDays(now, new Date(c.createdAt));
      return daysOld >= 30;
    }
    const lastCheckin = c.checkins[c.checkins.length - 1];
    const daysSinceCheckin = differenceInDays(now, new Date(lastCheckin.ts));
    return daysSinceCheckin >= 30;
  });

  function inviteClient() {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    alert(`Invite token generated (mock): ${token}\n\nTODO: send via secure channel.`);
    log("INVITE_CLIENT");
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Attorney Landing</h1>
          <p className="text-muted-foreground mt-1">Manage your practice and client cases</p>
        </div>

        <Card className="p-6 border-border mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                Tier: {currentTier}
              </span>
              <span className="text-sm text-muted-foreground">
                Price: ${RCMS_CONFIG.tiers[currentTier].price.toLocaleString()}/mo
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Next reset: <b className="text-foreground">{fmtDate(nextReset)}</b> &middot; Swaps
              remaining:{" "}
              <b className="text-foreground">{Math.max(0, swapsCap - swapsUsed)}</b>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <KPI
              label="Attorney Seats"
              value={`${tierCaps.seats.attorneys}`}
              note="Configured in tier"
            />
            <KPI
              label="Staff Seats"
              value={`${tierCaps.seats.staff}`}
              note="Configured in tier"
            />
            <KPI
              label="Provider Slots"
              value={`${usedProviders}/${providerSlots}`}
              note={`${providerRemain} remaining`}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={inviteClient} aria-label="Invite client">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Client
            </Button>
            <Button onClick={() => navigate("/reports")} variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </Button>
            <Button
              onClick={() => navigate("/providers")}
              disabled={!routerEnabled}
              aria-disabled={!routerEnabled}
              title={!routerEnabled ? "Provider router not included in this tier" : ""}
              variant="outline"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              View Providers
            </Button>
            <Button
              onClick={() => navigate("/router")}
              disabled={!routerEnabled}
              aria-disabled={!routerEnabled}
              title={!routerEnabled ? "Provider router not included in this tier" : ""}
              variant="outline"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              Route Cases
            </Button>
            <Button onClick={() => navigate("/cases")} variant="outline">
              <FolderOpen className="w-4 h-4 mr-2" />
              View Cases
            </Button>
            <Button
              onClick={() =>
                alert("Exports index (stub). Use per-case exports in Dashboard.")
              }
              disabled={!exportAllowed}
              aria-disabled={!exportAllowed}
              title={!exportAllowed ? "Your role cannot export" : ""}
              variant="outline"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exports
            </Button>
          </div>

          <Card className="mt-6 p-4 bg-muted border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Billing Information</h3>
            <p className="text-sm text-muted-foreground">
              No setup fee. First month due at signing. Annual prepay{" "}
              <b className="text-foreground">-10%</b>, quarterly billing optional,{" "}
              <b className="text-foreground">3-month minimum</b>. Provider swaps:{" "}
              {RCMS_CONFIG.billing.providerSwaps.policy}
            </p>
          </Card>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Seats</p>
                <p className="text-2xl font-bold text-foreground">
                  {tierCaps.seats.attorneys + tierCaps.seats.staff + tierCaps.seats.rnCcm}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-accent/10">
                <Stethoscope className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Providers</p>
                <p className="text-2xl font-bold text-foreground">{usedProviders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-success/10">
                <FolderOpen className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Router Status</p>
                <p className="text-sm font-semibold text-foreground">
                  {routerEnabled ? "Enabled" : "Not Available"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Case Tracking Sections */}
        <div className="space-y-6">
          {/* CRITICAL: 72-hour cases */}
          {criticalCases.length > 0 && (
            <Card className="p-6 border-destructive bg-destructive/5">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-destructive mb-1">
                    Critical: Attorney Action Required
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {criticalCases.length} case{criticalCases.length !== 1 ? "s" : ""} pending 72+ hours. 
                    Will be deleted/tagged as attorney refusal in 72 more hours.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {criticalCases.map((c) => (
                  <CaseListItem key={c.id} case={c} navigate={navigate} urgent />
                ))}
              </div>
            </Card>
          )}

          {/* Recently Opened Cases */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-4">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Recently Opened Cases (Last 7 Days)
              </h3>
              <span className="ml-auto text-sm text-muted-foreground">
                {recentCases.length} case{recentCases.length !== 1 ? "s" : ""}
              </span>
            </div>
            {recentCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cases opened in the last 7 days</p>
            ) : (
              <div className="space-y-2">
                {recentCases.slice(0, 5).map((c) => (
                  <CaseListItem key={c.id} case={c} navigate={navigate} />
                ))}
                {recentCases.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/cases")}
                    className="w-full mt-2"
                  >
                    View all {recentCases.length} cases
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Cases Needing Attention */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-warning" />
              <h3 className="text-lg font-semibold text-foreground">
                Cases Needing Attention (30+ Days)
              </h3>
              <span className="ml-auto text-sm text-muted-foreground">
                {needsAttentionCases.length} case{needsAttentionCases.length !== 1 ? "s" : ""}
              </span>
            </div>
            {needsAttentionCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">All cases have recent check-ins</p>
            ) : (
              <div className="space-y-2">
                {needsAttentionCases.slice(0, 5).map((c) => (
                  <CaseListItem key={c.id} case={c} navigate={navigate} showLastCheckin />
                ))}
                {needsAttentionCases.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/cases")}
                    className="w-full mt-2"
                  >
                    View all {needsAttentionCases.length} cases
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

// Helper component for case list items
function CaseListItem({
  case: c,
  navigate,
  urgent = false,
  showLastCheckin = false,
}: {
  case: Case;
  navigate: (path: string) => void;
  urgent?: boolean;
  showLastCheckin?: boolean;
}) {
  const hoursOld = differenceInHours(new Date(), new Date(c.createdAt));
  const lastCheckin = c.checkins?.[c.checkins.length - 1];
  const daysSinceCheckin = lastCheckin
    ? differenceInDays(new Date(), new Date(lastCheckin.ts))
    : differenceInDays(new Date(), new Date(c.createdAt));

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
        urgent
          ? "border-destructive/50 bg-destructive/10 hover:bg-destructive/20"
          : "border-border hover:bg-muted/50"
      }`}
      onClick={() => navigate(`/case/${c.id}`)}
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
          {c.intake.injuries.length > 2 && "..."}
        </p>
      </div>
      <div className="text-right">
        {urgent && (
          <p className="text-sm font-semibold text-destructive">
            {Math.floor(hoursOld)}h old
          </p>
        )}
        {showLastCheckin && (
          <p className="text-sm text-muted-foreground">
            {daysSinceCheckin} days ago
          </p>
        )}
        {!urgent && !showLastCheckin && (
          <p className="text-sm text-muted-foreground">
            {fmtDate(c.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}
