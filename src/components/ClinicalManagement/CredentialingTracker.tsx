import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Credential {
  id: string;
  staffMember: string;
  type: "license" | "certification" | "ceu" | "training";
  credentialName: string;
  issueDate: string;
  expirationDate: string;
  status: "current" | "expiring_soon" | "expired";
  daysUntilExpiration: number;
  renewalRequired: boolean;
}

export function CredentialingTracker() {
  const { toast } = useToast();
  const [credentials] = useState<Credential[]>([
    {
      id: "cred-001",
      staffMember: "Sarah Johnson, RN",
      type: "license",
      credentialName: "RN License - State of CA",
      issueDate: "2023-03-15",
      expirationDate: "2025-03-15",
      status: "expiring_soon",
      daysUntilExpiration: 64,
      renewalRequired: true
    },
    {
      id: "cred-002",
      staffMember: "Michael Chen, RN",
      type: "certification",
      credentialName: "Certified Hospice and Palliative Nurse (CHPN)",
      issueDate: "2022-06-01",
      expirationDate: "2026-06-01",
      status: "current",
      daysUntilExpiration: 512,
      renewalRequired: false
    },
    {
      id: "cred-003",
      staffMember: "Emily Rodriguez, RN",
      type: "ceu",
      credentialName: "Continuing Education Units - 20 Hours",
      issueDate: "2024-01-01",
      expirationDate: "2025-01-01",
      status: "expired",
      daysUntilExpiration: -10,
      renewalRequired: true
    },
    {
      id: "cred-004",
      staffMember: "David Kim, RN",
      type: "certification",
      credentialName: "CPR/BLS Certification",
      issueDate: "2023-11-15",
      expirationDate: "2025-11-15",
      status: "current",
      daysUntilExpiration: 309,
      renewalRequired: false
    },
    {
      id: "cred-005",
      staffMember: "Lisa Martinez, RN",
      type: "training",
      credentialName: "Advanced Wound Care Certification",
      issueDate: "2024-08-20",
      expirationDate: "2025-02-20",
      status: "expiring_soon",
      daysUntilExpiration: 40,
      renewalRequired: true
    }
  ]);

  const getStatusColor = (status: Credential["status"]) => {
    switch (status) {
      case "current":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "expiring_soon":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "expired":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: Credential["status"]) => {
    switch (status) {
      case "current":
        return <CheckCircle2 className="h-4 w-4" />;
      case "expiring_soon":
        return <Clock className="h-4 w-4" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const handleViewCredential = (credId: string) => {
    toast({
      title: "Credential Details",
      description: `Opening details for ${credentials.find(c => c.id === credId)?.credentialName}`,
    });
  };

  const expiredCount = credentials.filter(c => c.status === "expired").length;
  const expiringSoonCount = credentials.filter(c => c.status === "expiring_soon").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Credentialing Tracker</h2>
          <p className="text-muted-foreground">Monitor licenses, certifications, and renewals</p>
        </div>
        <Button>
          <Award className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-500">Credential Action Required</CardTitle>
            </div>
            <CardDescription>
              {expiredCount > 0 && `${expiredCount} credential${expiredCount > 1 ? 's have' : ' has'} expired. `}
              {expiringSoonCount > 0 && `${expiringSoonCount} credential${expiringSoonCount > 1 ? 's are' : ' is'} expiring soon.`}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credentials</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credentials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {credentials.filter(c => c.status === "current").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{expiringSoonCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{expiredCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {credentials
          .sort((a, b) => {
            const statusOrder = { expired: 0, expiring_soon: 1, current: 2 };
            return statusOrder[a.status] - statusOrder[b.status];
          })
          .map((cred) => (
            <Card 
              key={cred.id} 
              className={cred.status === "expired" || cred.status === "expiring_soon" ? "border-red-500/50 bg-red-500/5" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{cred.credentialName}</CardTitle>
                    <CardDescription>{cred.staffMember}</CardDescription>
                  </div>
                  <Badge variant="outline" className={getStatusColor(cred.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(cred.status)}
                      {cred.status.replace("_", " ").toUpperCase()}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Type</div>
                      <div className="text-sm font-medium mt-1">
                        {cred.type.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Issue Date</div>
                      <div className="text-sm font-medium mt-1">{cred.issueDate}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Expiration</div>
                      <div className="text-sm font-medium mt-1">{cred.expirationDate}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Days Remaining</div>
                      <div className={`text-sm font-medium mt-1 ${
                        cred.daysUntilExpiration < 0 ? "text-red-500" :
                        cred.daysUntilExpiration < 90 ? "text-yellow-500" :
                        "text-green-500"
                      }`}>
                        {cred.daysUntilExpiration < 0 ? 
                          `${Math.abs(cred.daysUntilExpiration)} days overdue` :
                          `${cred.daysUntilExpiration} days`
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleViewCredential(cred.id)}>
                      View Details
                    </Button>
                    {cred.renewalRequired && (
                      <Button size="sm" variant="outline">
                        Start Renewal
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      Upload Document
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
