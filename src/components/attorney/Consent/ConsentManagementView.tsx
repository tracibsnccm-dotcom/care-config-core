import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/auth/supabaseAuth";
import { Case } from "@/config/rcms";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  User,
  Shield,
  Eye,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { getDisplayName } from "@/lib/rcms-core";

export function ConsentManagementView() {
  const { cases, role } = useApp();
  const { user } = useAuth();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleViewConsent = (caseData: Case) => {
    setSelectedCase(caseData);
    setDetailsOpen(true);
  };

  const getConsentStatus = (caseData: Case) => {
    if (!caseData.consent.signed) {
      return {
        status: "unsigned",
        label: "Not Signed",
        color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        icon: AlertTriangle,
      };
    }

    if (!caseData.consent.scope.shareWithAttorney) {
      return {
        status: "restricted",
        label: "Signed - Attorney Access Restricted",
        color: "bg-destructive/10 text-destructive border-destructive/20",
        icon: Shield,
      };
    }

    return {
      status: "active",
      label: "Active",
      color: "bg-green-500/10 text-green-600 border-green-500/20",
      icon: CheckCircle2,
    };
  };

  const stats = {
    total: cases.length,
    signed: cases.filter((c) => c.consent.signed).length,
    unsigned: cases.filter((c) => !c.consent.signed).length,
    restricted: cases.filter((c) => c.consent.signed && !c.consent.scope.shareWithAttorney).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Client Consent Management</h2>
        <p className="text-muted-foreground">View and manage consent forms and authorization status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Cases</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-muted-foreground opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Signed</p>
              <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.unsigned}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Restricted</p>
              <p className="text-2xl font-bold text-destructive">{stats.restricted}</p>
            </div>
            <Shield className="w-8 h-8 text-destructive opacity-20" />
          </div>
        </Card>
      </div>

      {/* Consent List */}
      <div className="space-y-3">
        {cases.map((caseData) => {
          const consentStatus = getConsentStatus(caseData);
          const StatusIcon = consentStatus.icon;
          const displayName = getDisplayName(role, caseData);

          return (
            <Card key={caseData.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-foreground">{caseData.id}</h3>
                      <p className="text-sm text-muted-foreground">{displayName}</p>
                    </div>
                    <Badge className={`border ml-auto ${consentStatus.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {consentStatus.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>RCMS ID: {caseData.client.rcmsId}</span>
                    </div>
                    {caseData.consent.signedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Signed: {format(new Date(caseData.consent.signedAt), "MMM d, yyyy")}</span>
                      </div>
                    )}
                  </div>
                  {caseData.consent.signed && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {caseData.consent.scope.shareWithAttorney ? "✓" : "✗"} Attorney Access
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {caseData.consent.scope.shareWithProviders ? "✓" : "✗"} Provider Access
                      </Badge>
                      {caseData.consent.restrictedAccess && (
                        <Badge variant="outline" className="text-xs border-destructive text-destructive">
                          <Shield className="w-3 h-3 mr-1" />
                          Restricted Access
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewConsent(caseData)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  {caseData.consent.signed && (
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Consent Details</DialogTitle>
            <DialogDescription>
              View consent information and authorization scope
            </DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="font-semibold mb-2">Case Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Case ID</p>
                    <p className="font-medium">{selectedCase.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">RCMS ID</p>
                    <p className="font-medium">{selectedCase.client.rcmsId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Client Name</p>
                    <p className="font-medium">{getDisplayName(role, selectedCase)}</p>
                  </div>
                  {selectedCase.consent.signedAt && (
                    <div>
                      <p className="text-muted-foreground">Signed Date</p>
                      <p className="font-medium">
                        {format(new Date(selectedCase.consent.signedAt), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Consent Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Consent Form Signed</span>
                    {selectedCase.consent.signed ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        No
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedCase.consent.signed && (
                <div>
                  <h4 className="font-semibold mb-2">Authorization Scope</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">Share with Attorney</span>
                      {selectedCase.consent.scope.shareWithAttorney ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Authorized
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                          <Shield className="w-3 h-3 mr-1" />
                          Not Authorized
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">Share with Providers</span>
                      {selectedCase.consent.scope.shareWithProviders ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Authorized
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                          <Shield className="w-3 h-3 mr-1" />
                          Not Authorized
                        </Badge>
                      )}
                    </div>
                    {selectedCase.consent.restrictedAccess && (
                      <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <span className="text-sm text-destructive font-medium">Restricted Access Case</span>
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                          <Shield className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!selectedCase.consent.signed && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-600 mb-1">Consent Required</p>
                      <p className="text-sm text-muted-foreground">
                        Client consent must be obtained before accessing case information. 
                        Please send consent form to client for signature.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
