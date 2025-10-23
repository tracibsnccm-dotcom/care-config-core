import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPI } from "@/components/KPI";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/store";
import { RCMS_CONFIG } from "@/config/rcms";
import { Users, UserPlus, Stethoscope, FolderOpen, FileDown } from "lucide-react";

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
    log,
  } = useApp();

  const usedProviders = providers.filter((p) => p.active).length;
  const providerRemain = Math.max(0, providerSlots - usedProviders);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>
    </AppLayout>
  );
}
