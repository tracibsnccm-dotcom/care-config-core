import { Case } from "@/config/rcms";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/store";
import { Clock, AlertCircle, CheckCircle, User, ShieldAlert } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { isBlockedForAttorney, canAccess, FEATURE, getDisplayName } from "@/lib/accessControl";
import { ConsentBlockedBanner } from "./ConsentBlockedBanner";

interface CaseCardProps {
  case: Case;
  onClick?: () => void;
}

const statusConfig = {
  NEW: { label: "New", className: "bg-status-new/10 text-status-new border-status-new/20", icon: Clock },
  AWAITING_CONSENT: { label: "Awaiting Consent", className: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
  ROUTED: { label: "Routed", className: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle },
  IN_PROGRESS: { label: "In Progress", className: "bg-status-active/10 text-status-active border-status-active/20", icon: CheckCircle },
  HOLD_SENSITIVE: { label: "Hold (Sensitive)", className: "bg-destructive/10 text-destructive border-destructive/20", icon: ShieldAlert },
  CLOSED: { label: "Closed", className: "bg-status-closed/10 text-status-closed border-status-closed/20", icon: CheckCircle },
};

export function CaseCard({ case: caseData, onClick }: CaseCardProps) {
  const { role } = useApp();
  const statusInfo = statusConfig[caseData.status];
  const StatusIcon = statusInfo.icon;
  
  const blockStatus = isBlockedForAttorney(role, caseData);
  const allowIdentity = canAccess(role, caseData, FEATURE.VIEW_IDENTITY);
  const allowClinical = canAccess(role, caseData, FEATURE.VIEW_CLINICAL);
  const displayName = getDisplayName(role, caseData);

  return (
    <Card
      className="p-5 hover:shadow-lg transition-all cursor-pointer border-border"
      onClick={onClick}
    >
      {/* Consent Blocked Banner */}
      {blockStatus.blocked && blockStatus.reason && (
        <ConsentBlockedBanner reason={blockStatus.reason} />
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{caseData.id}</h3>
          <p className="text-sm text-muted-foreground">
            Client: {allowIdentity ? (
              <span className="select-none relative inline-block">
                <span className="absolute -top-3 right-0 text-[8px] text-muted-foreground/60">
                  IDENTITY
                </span>
                {displayName}
              </span>
            ) : (
              <span className="select-none">{displayName}</span>
            )}
          </p>
        </div>
        <Badge className={cn("border", statusInfo.className)}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusInfo.label}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Incident Type:</span>
          <span className="font-medium text-foreground">
            {allowClinical ? caseData.intake.incidentType : "Hidden"}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Incident Date:</span>
          <span className="font-medium text-foreground">
            {allowClinical ? fmtDate(caseData.intake.incidentDate) : "Hidden"}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Severity:</span>
          <span className="font-medium text-foreground">
            {allowClinical ? `${caseData.intake.severitySelfScore}/10` : "Hidden"}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Consent:</span>
          <span className="font-medium text-foreground">
            {caseData.consent.signed ? "✓ Signed" : "Pending"}
          </span>
        </div>
      </div>

      {allowClinical && caseData.flags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {caseData.flags.map((flag) => (
            <Badge key={flag} variant="outline" className="text-xs">
              {flag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {caseData.client.state || "N/A"}
        </div>
        <div>Updated {fmtDate(caseData.updatedAt)}</div>
      </div>
    </Card>
  );
}
