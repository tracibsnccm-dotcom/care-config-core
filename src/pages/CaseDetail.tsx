import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/store";
import { canSeeSensitive, isBlockedForAttorney, getDisplayName, FEATURE, canAccess, exportAllowed as checkExportAllowed } from "@/lib/access";
import { exportCSV } from "@/lib/export";
import { generateCaseSummaryPDF } from "@/lib/pdfCaseSummary";
import { ProviderConfirmationButton } from "@/components/ProviderConfirmationButton";
import { CaseHealthMeter } from "@/components/CaseHealthMeter";
import { CaseNotesTasksDrawer } from "@/components/CaseNotesTasksDrawer";
import { CaseTimelineView } from "@/components/CaseTimelineView";
import { AICaseSummarizer } from "@/components/AICaseSummarizer";
import { SensitiveDataAuditView } from "@/components/SensitiveDataAuditView";
import { ProviderNotesDisplay } from "@/components/cases/ProviderNotesDisplay";
import { DocumentShareRequest } from "@/components/rn/DocumentShareRequest";
import { RNCaseRequestsPanel } from "@/components/rn/RNCaseRequestsPanel";
import { ConsentDocumentViewer } from "@/components/ConsentDocumentViewer";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Activity, 
  FileText, 
  Heart, 
  Home,
  Download,
  FileDown,
  ShieldAlert,
  XCircle,
  Stethoscope,
  StickyNote,
  MessageSquare
} from "lucide-react";
import { AttorneyCommunicationCenter } from "@/components/attorney/AttorneyCommunicationCenter";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAttorneyRoute = location.pathname.startsWith("/attorney");
  const { cases, role, log, revokeConsent, providers } = useApp();
  const caseData = cases.find((c) => c.id === caseId);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);

  // Context lock: when switching cases, close any open side panels (doc/note/report)
  useEffect(() => {
    setNotesDrawerOpen(false);
  }, [caseId]);

  if (!caseData) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-muted-foreground">Case not found</p>
        </div>
      </AppLayout>
    );
  }

  const canView = canSeeSensitive(caseData, role);
  const canExport = checkExportAllowed(role, caseData);
  const canViewIdentity = canAccess(role, caseData, FEATURE.VIEW_IDENTITY);
  const canViewClinical = canAccess(role, caseData, FEATURE.VIEW_CLINICAL);
  const { blocked, reason } = isBlockedForAttorney(role, caseData);
  const displayName = getDisplayName(role, caseData);
  
  // Find assigned provider if exists
  const assignedProvider = caseData.assignedProviderId 
    ? providers.find(p => p.id === caseData.assignedProviderId)
    : undefined;

  const handleExportCSV = () => {
    exportCSV(caseData);
    log("EXPORT_CSV", caseData.id);
  };

  const handleExportPDF = async () => {
    try {
      // Prepare timeline data
      const timeline = [
        { date: caseData.consent.signedAt || caseData.createdAt, event: "Case Created" },
        ...(caseData.checkins?.map(c => ({ date: c.ts, event: `Check-in (Pain: ${c.pain}/10)` })) || [])
      ];

      // Prepare reports data (stub - replace with actual reports if available)
      const reports = [
        { title: "Intake Assessment", date: caseData.createdAt, status: "Complete" }
      ];

      // Prepare follow-ups data (stub - replace with actual follow-ups if available)
      const followUps = [
        { title: "Initial Follow-up", dueDate: caseData.createdAt, status: "Pending" }
      ];

      // Prepare messages summary (stub - replace with actual message data if available)
      const messagesSummary = {
        total: 0,
        lastMessageDate: caseData.createdAt
      };

      await generateCaseSummaryPDF({
        caseId: caseData.id,
        clientLabel: displayName,
        status: caseData.status,
        attyRef: caseData.client.attyRef,
        timeline,
        reports,
        followUps,
        messagesSummary,
        viewerRole: role // Pass the viewer's role for filtering sensitive data
      });

      log("EXPORT_PDF", caseData.id);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleRevokeConsent = () => {
    if (confirm(`Are you sure you want to revoke consent for ${caseData.id}? This will immediately place the case on hold.`)) {
      revokeConsent(caseData.id);
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate(isAttorneyRoute ? "/attorney/cases" : "/cases")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cases
        </Button>

        {/* Consent Blocked Banner for Attorneys */}
        {blocked && (
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              <strong>Access Blocked:</strong> {reason}
            </AlertDescription>
          </Alert>
        )}

        {/* Sensitive Access Warning */}
        {!canView && (
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              This is a sensitive case with restricted access. You do not have permission to view full details.
            </AlertDescription>
          </Alert>
        )}

        {/* Hold/Revoked Consent Banner */}
        {caseData.status === "HOLD_SENSITIVE" && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Case on Hold:</strong> Consent has been revoked or case requires special handling. Exports are disabled.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{caseData.id}</h1>
            <p className="text-muted-foreground mt-1">
              Client: {canViewIdentity ? displayName : caseData.client.rcmsId}
              {!canViewIdentity && <span className="text-xs ml-2">(Identity restricted)</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setNotesDrawerOpen(true)}
              className="bg-[hsl(var(--gold))] text-foreground hover:bg-foreground hover:text-[hsl(var(--gold))]"
            >
              <StickyNote className="w-4 h-4 mr-2" />
              Notes & Tasks
            </Button>
            <Badge className="text-sm px-3 py-1">
              Status: {caseData.status.replace(/_/g, " ")}
            </Badge>
            {canExport && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </>
            )}
            {caseData.consent.signed && (
              <Button variant="destructive" size="sm" onClick={handleRevokeConsent}>
                <XCircle className="w-4 h-4 mr-2" />
                Revoke Consent
              </Button>
            )}
          </div>
        </div>

        {/* Case Health Meter */}
        {role === "ATTORNEY" && (
          <Card className="p-6 border-border mb-6">
            <CaseHealthMeter status={caseData.status} />
          </Card>
        )}

        {!canView ? (
          <Card className="p-8 text-center border-border">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Restricted Access</h2>
            <p className="text-muted-foreground">
              You do not have permission to view the details of this sensitive case.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Information */}
            <Card className="p-6 border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Client Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">RCMS ID</p>
                  <p className="font-medium text-foreground">{caseData.client.rcmsId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attorney Reference</p>
                  <p className="font-medium text-foreground">{caseData.client.attyRef}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DOB (Masked)</p>
                  <p className="font-medium text-foreground">{caseData.client.dobMasked}</p>
                </div>
                {caseData.client.gender && (
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium text-foreground capitalize">{caseData.client.gender}</p>
                  </div>
                )}
                {caseData.client.state && (
                  <div>
                    <p className="text-sm text-muted-foreground">State</p>
                    <p className="font-medium text-foreground">{caseData.client.state}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Intake Information */}
            <Card className="p-6 border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Intake Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Incident Type</p>
                  <p className="font-medium text-foreground">{caseData.intake.incidentType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Incident Date</p>
                  <p className="font-medium text-foreground">{fmtDate(caseData.intake.incidentDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Initial Treatment</p>
                  <p className="font-medium text-foreground">{caseData.intake.initialTreatment}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Severity Score</p>
                  <p className="font-medium text-foreground text-2xl">{caseData.intake.severitySelfScore}/10</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Injuries</p>
                  <div className="flex flex-wrap gap-2">
                    {caseData.intake.injuries.map((injury) => (
                      <Badge key={injury} variant="outline">
                        {injury}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Consent Status */}
            <Card className="p-6 border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Consent Status
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Signed</p>
                  <Badge variant={caseData.consent.signed ? "default" : "destructive"}>
                    {caseData.consent.signed ? "Yes" : "No"}
                  </Badge>
                </div>
                {caseData.consent.signedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Signed At</p>
                    <p className="font-medium text-foreground">{fmtDate(caseData.consent.signedAt)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Share with Attorney</p>
                  <Badge variant={caseData.consent.scope.shareWithAttorney ? "default" : "secondary"}>
                    {caseData.consent.scope.shareWithAttorney ? "Authorized" : "Not Authorized"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Share with Providers</p>
                  <Badge variant={caseData.consent.scope.shareWithProviders ? "default" : "secondary"}>
                    {caseData.consent.scope.shareWithProviders ? "Authorized" : "Not Authorized"}
                  </Badge>
                </div>
                {caseData.consent.restrictedAccess && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Restricted Access
                  </Badge>
                )}
              </div>
            </Card>

            {/* 4 P's Assessment */}
            {caseData.fourPs && (
              <Card className="p-6 border-border lg:col-span-2">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  4 P's Assessment
                </h2>
                <div className="space-y-4">
                  {Object.entries(caseData.fourPs).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-foreground capitalize">{key}</span>
                        <span className="text-sm text-muted-foreground">{value}/10</span>
                      </div>
                      <Progress value={value * 10} className="h-2" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* SDOH */}
            {caseData.sdoh && (
              <Card className="p-6 border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  Social Determinants
                </h2>
                <div className="space-y-3">
                  {Object.entries(caseData.sdoh).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <Badge variant={value ? "destructive" : "default"}>
                        {value ? "Concern" : "Stable"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Assigned Provider */}
            {assignedProvider && (
              <Card className="p-6 border-border lg:col-span-3">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Assigned Provider
                </h2>
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Provider Name</p>
                      <p className="font-medium text-foreground text-lg">{assignedProvider.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Specialty</p>
                      <Badge variant="outline">{assignedProvider.specialty}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium text-foreground">
                        {assignedProvider.city}, {assignedProvider.state}
                        {assignedProvider.distanceMiles && ` (${assignedProvider.distanceMiles} mi)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <ProviderConfirmationButton
                      caseData={caseData}
                      provider={assignedProvider}
                      confirmationType="appointment_confirmed"
                      onSuccess={() => log("PROVIDER_CONFIRMED", caseData.id)}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Check-ins */}
            {caseData.checkins && caseData.checkins.length > 0 && (
              <Card className="p-6 border-border lg:col-span-3">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Check-ins
                </h2>
                <div className="space-y-4">
                  {caseData.checkins.map((checkin, idx) => (
                    <div key={idx} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">{fmtDate(checkin.ts)}</p>
                        <Badge>Pain: {checkin.pain}/10</Badge>
                      </div>
                      {checkin.note && (
                        <p className="text-sm text-muted-foreground">{checkin.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Timeline View */}
        {canView && caseId && (
          <div className="mt-6">
            <CaseTimelineView caseId={caseId} />
          </div>
        )}

        {/* AI Case Summarizer */}
        {canView && caseId && (role === "ATTORNEY" || role === "RN_CM" || role === "RCMS_CLINICAL_MGMT" || role === "STAFF" || role === "SUPER_USER" || role === "SUPER_ADMIN") && (
          <div className="mt-6">
            <AICaseSummarizer caseId={caseId} caseData={caseData} />
          </div>
        )}

        {/* Sensitive Data Audit View - RN CM Only */}
        {canView && caseId && (role === "RN_CM" || role === "RCMS_CLINICAL_MGMT" || role === "STAFF" || role === "SUPER_USER" || role === "SUPER_ADMIN") && (
          <div className="mt-6">
            <SensitiveDataAuditView caseId={caseId} />
          </div>
        )}

        {/* Provider Notes Display */}
        {canView && caseId && (role === "RN_CM" || role === "ATTORNEY" || role === "RCMS_CLINICAL_MGMT" || role === "STAFF" || role === "SUPER_USER" || role === "SUPER_ADMIN") && (
          <div className="mt-6">
            <ProviderNotesDisplay caseId={caseId} />
          </div>
        )}

        {/* Document Share Request - RN CM Only */}
        {canView && caseId && (role === "RN_CM" || role === "RCMS_CLINICAL_MGMT" || role === "STAFF" || role === "SUPER_USER" || role === "SUPER_ADMIN") && (
          <div className="mt-6 flex justify-end">
            <DocumentShareRequest caseId={caseId} clientId={caseData.client.rcmsId} />
          </div>
        )}

        {/* Clinical Requests & Updates - RN: respond to attorney requests */}
        {canView && caseId && (role === "RN_CM" || role === "RCMS_CLINICAL_MGMT" || role === "STAFF" || role === "SUPER_USER" || role === "SUPER_ADMIN") && (
          <div className="mt-6">
            <RNCaseRequestsPanel caseId={caseId} />
          </div>
        )}

        {/* Attorney: Requests (create and view case-linked requests to RN) */}
        {canView && caseId && (role === "ATTORNEY" || role === "SUPER_USER" || role === "SUPER_ADMIN") && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Requests
            </h2>
            <AttorneyCommunicationCenter caseId={caseId} />
          </div>
        )}

        {/* Consent Documents - Attorney and RN */}
        {canView && caseId && (role === "ATTORNEY" || role === "RN_CM" || role === "RCMS_CLINICAL_MGMT" || role === "STAFF" || role === "SUPER_USER" || role === "SUPER_ADMIN") && (
          <div className="mt-6">
            <ConsentDocumentViewer caseId={caseId} showPrintButton={true} />
          </div>
        )}
      </div>

      {/* Notes & Tasks Drawer */}
      {caseId && (
        <CaseNotesTasksDrawer
          caseId={caseId}
          open={notesDrawerOpen}
          onOpenChange={setNotesDrawerOpen}
        />
      )}
    </AppLayout>
  );
}
