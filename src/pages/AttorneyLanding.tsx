import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPI } from "@/components/KPI";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/store";
import { RCMS_CONFIG } from "@/config/rcms";
import { Case, CaseStatus } from "@/config/rcms";
import { Users, UserPlus, Stethoscope, FolderOpen, FileDown, AlertTriangle, Clock, BarChart3, Shield } from "lucide-react";
import { differenceInHours, differenceInDays } from "date-fns";
import { PendingIntakesWidget, sendImmediateNudge } from "@/modules/rcms-intake-extras";
import { AttorneyInvitePanel, ExportButton } from "@/components/AttorneyActions";
import { PreSettlementDossier, DossierReadiness } from "@/components/PreSettlementDossier";
import { useAuth } from "@/auth/supabaseAuth";

// Consent + CSV helpers (keep PHI out)
function consentAllowsAttorney(caseObj: Case) {
  const signed = !!caseObj?.consent?.signed;
  const share = caseObj?.consent?.scope?.shareWithAttorney !== false;
  const difficultShare = (caseObj as any)?.difficult_block?.share_with_attorney !== false;
  return signed && share && difficultShare;
}

function buildCsvRowsFromCase(caseObj: Case) {
  if (!caseObj) return [];
  return [{
    case_id: caseObj.id || (caseObj as any).case_id || "",
    status: caseObj.status || "",
    onset_date: caseObj.intake?.incidentDate || "",
    incident_type: caseObj.intake?.incidentType || "",
    initial_treatment: caseObj.intake?.initialTreatment || "",
    flags: (caseObj.flags || []).join("|"),
    provider_id: caseObj.assignedProviderId || "",
    p_physical: (caseObj as any).fourPs?.physical ?? "",
    p_psychological: (caseObj as any).fourPs?.psychological ?? "",
    p_psychosocial: (caseObj as any).fourPs?.psychosocial ?? "",
    p_professional: (caseObj as any).fourPs?.professional ?? "",
    consent_signed: caseObj.consent?.signed ? "yes" : "no",
    restricted: caseObj.consent?.restrictedAccess ? "yes" : "no",
  }];
}

// Status color coding helper
function getStatusColor(status: CaseStatus): {
  bg: string;
  text: string;
  border: string;
  icon?: React.ReactNode;
} {
  switch (status) {
    case "HOLD_SENSITIVE":
      return {
        bg: "bg-destructive/10",
        text: "text-destructive",
        border: "border-destructive/50",
        icon: <Shield className="w-3 h-3" />,
      };
    case "AWAITING_CONSENT":
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-500",
        border: "border-orange-500/50",
        icon: <AlertTriangle className="w-3 h-3" />,
      };
    case "IN_PROGRESS":
      return {
        bg: "bg-green-500/10",
        text: "text-green-500",
        border: "border-green-500/50",
      };
    case "ROUTED":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-500",
        border: "border-blue-500/50",
      };
    case "NEW":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-500",
        border: "border-yellow-500/50",
      };
    case "CLOSED":
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
      };
    default:
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
      };
  }
}

export default function AttorneyLanding() {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
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

        {/* Pending Intakes Widget */}
        <PendingIntakesWidget
          currentFirmId="firm-001"
          cases={cases as any}
          onNudge={async (c) => {
            await sendImmediateNudge(undefined, c);
            log("NUDGE_SENT", c.id);
          }}
        />

        {/* Attorney Invite Panel */}
        <div className="mb-6">
          <AttorneyInvitePanel 
            defaultCaseId="" 
            session={{ 
              role: roles[0] || "ATTORNEY", 
              userId: user?.id || "" 
            }} 
          />
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

  const statusColors = getStatusColor(c.status);

  const { user, roles } = useAuth();
  const rows = buildCsvRowsFromCase(c);
  const okByConsent = consentAllowsAttorney(c);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        urgent
          ? "border-destructive/50 bg-destructive/10"
          : `${statusColors.border} ${statusColors.bg}`
      }`}
    >
      <div className="flex-1 cursor-pointer" onClick={() => navigate(`/case/${c.id}`)}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{c.client.rcmsId}</span>
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
          >
            {statusColors.icon}
            {c.status.replace(/_/g, " ")}
          </span>
          <DossierReadiness caseObj={c} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {c.intake.incidentType} • {c.intake.injuries.slice(0, 2).join(", ")}
          {c.intake.injuries.length > 2 && "..."}
        </p>
      </div>
      <div className="flex items-center gap-3">
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
        <ExportButton
          role={roles[0] || "ATTORNEY"}
          caseId={c?.id || (c as any)?.case_id}
          consentAllows={okByConsent}
          rows={rows}
          filename={`rcms_case_${c?.id || (c as any)?.case_id}.csv`}
          userId={user?.id || ""}
          caseData={c}
        />
        <PreSettlementDossier caseObj={c} />
      </div>
    </div>
  );
}
