import { Case } from "@/config/rcms";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/store";
import { Clock, AlertCircle, CheckCircle, User, ShieldAlert, Ban } from "lucide-react";
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
      className={cn(
        "p-5 hover:shadow-lg transition-all cursor-pointer border-border relative",
        blockStatus.blocked && "border-destructive/50 bg-destructive/5"
      )}
      onClick={onClick}
    >
      {/* Red Circle with Line Through - No Access Indicator */}
      {blockStatus.blocked && (
        <div className="absolute top-4 right-4">
          <div className="relative">
            <Ban className="w-12 h-12 text-destructive" strokeWidth={2.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[10px] font-bold text-destructive leading-tight text-center">
                NO<br/>ACCESS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consent Blocked Banner */}
      {blockStatus.blocked && blockStatus.reason && (
        <ConsentBlockedBanner reason={blockStatus.reason} />
      )}
      
      <div className="flex items-start justify-between mb-4 pr-14">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-semibold text-lg",
              blockStatus.blocked ? "text-destructive line-through" : "text-foreground"
            )}>
              {caseData.id}
            </h3>
            {blockStatus.blocked && (
              <Ban className="w-5 h-5 text-destructive flex-shrink-0" />
            )}
          </div>
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
          <span className={cn(
            "font-medium",
            blockStatus.blocked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {allowClinical ? caseData.intake.incidentType : "Hidden"}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Incident Date:</span>
          <span className={cn(
            "font-medium",
            blockStatus.blocked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {allowClinical ? fmtDate(caseData.intake.incidentDate) : "Hidden"}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Severity:</span>
          <span className={cn(
            "font-medium",
            blockStatus.blocked ? "text-muted-foreground/50" : "text-foreground"
          )}>
            {allowClinical ? `${caseData.intake.severitySelfScore}/10` : "Hidden"}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground w-32">Consent:</span>
          <span className={cn(
            "font-medium",
            caseData.consent.signed ? "text-green-600" : "text-destructive"
          )}>
            {caseData.consent.signed ? "✓ Signed" : "✗ Not Signed"}
          </span>
        </div>
        {blockStatus.blocked && (
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground w-32">Attorney Access:</span>
            <span className="font-medium text-destructive flex items-center gap-1">
              <Ban className="w-3 h-3" />
              Blocked
            </span>
          </div>
        )}
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
