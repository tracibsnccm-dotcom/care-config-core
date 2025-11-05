import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, FileWarning, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RiskItem {
  id: string;
  type: "near_miss" | "safety_concern" | "incident" | "hazard";
  title: string;
  reportedBy: string;
  reportedDate: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "reported" | "investigating" | "mitigating" | "resolved";
  riskScore: number;
  mitigationPlan?: string;
}

export function RiskManagement() {
  const { toast } = useToast();
  const [risks] = useState<RiskItem[]>([
    {
      id: "risk-001",
      type: "near_miss",
      title: "Medication Near-Miss - Dosage Confusion",
      reportedBy: "Sarah Johnson, RN",
      reportedDate: "2025-01-09",
      severity: "high",
      status: "investigating",
      riskScore: 75,
      mitigationPlan: "Implement double-check protocol for similar medications"
    },
    {
      id: "risk-002",
      type: "safety_concern",
      title: "Home Safety Hazard - Client Fall Risk",
      reportedBy: "Michael Chen, RN",
      reportedDate: "2025-01-08",
      severity: "medium",
      status: "mitigating",
      riskScore: 55,
      mitigationPlan: "Coordinating with family for home safety modifications"
    },
    {
      id: "risk-003",
      type: "hazard",
      title: "Staff Safety - Aggressive Client Behavior",
      reportedBy: "Emily Rodriguez, RN",
      reportedDate: "2025-01-07",
      severity: "high",
      status: "reported",
      riskScore: 80
    },
    {
      id: "risk-004",
      type: "incident",
      title: "Documentation Error - Missing Signature",
      reportedBy: "David Kim, RN",
      reportedDate: "2025-01-06",
      severity: "low",
      status: "resolved",
      riskScore: 25,
      mitigationPlan: "Additional training on documentation requirements"
    }
  ]);

  const getSeverityColor = (severity: RiskItem["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "";
    }
  };

  const getStatusColor = (status: RiskItem["status"]) => {
    switch (status) {
      case "reported":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "investigating":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "mitigating":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "resolved":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "";
    }
  };

  const getTypeIcon = (type: RiskItem["type"]) => {
    switch (type) {
      case "near_miss":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "safety_concern":
        return <Shield className="h-5 w-5 text-orange-500" />;
      case "incident":
        return <FileWarning className="h-5 w-5 text-red-500" />;
      case "hazard":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const handleViewRisk = (riskId: string) => {
    toast({
      title: "Risk Details",
      description: `Opening details for ${risks.find(r => r.id === riskId)?.title}`,
    });
  };

  const activeRisks = risks.filter(r => r.status !== "resolved");
  const highSeverityCount = risks.filter(r => (r.severity === "high" || r.severity === "critical") && r.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Risk Management</h2>
          <p className="text-muted-foreground">Track and mitigate safety concerns</p>
        </div>
        <Button>
          <FileWarning className="h-4 w-4 mr-2" />
          Report Risk
        </Button>
      </div>

      {highSeverityCount > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-500">High-Risk Items</CardTitle>
            </div>
            <CardDescription>
              {highSeverityCount} high or critical severity risk{highSeverityCount > 1 ? 's' : ''} require attention
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRisks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{highSeverityCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {risks.filter(r => r.status === "resolved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(activeRisks.reduce((sum, r) => sum + r.riskScore, 0) / activeRisks.length)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {risks
          .sort((a, b) => {
            const statusOrder = { reported: 0, investigating: 1, mitigating: 2, resolved: 3 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
              return statusOrder[a.status] - statusOrder[b.status];
            }
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
          })
          .map((risk) => (
            <Card key={risk.id} className={risk.severity === "high" || risk.severity === "critical" ? "border-red-500/50 bg-red-500/5" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getTypeIcon(risk.type)}
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{risk.title}</CardTitle>
                      <CardDescription>
                        Reported by {risk.reportedBy} on {risk.reportedDate}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                      {risk.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(risk.status)}>
                      {risk.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Risk Score</div>
                      <div className="text-2xl font-bold">{risk.riskScore}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Type</div>
                      <div className="text-sm font-medium mt-1">
                        {risk.type.replace("_", " ").toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Status</div>
                      <div className="text-sm font-medium mt-1">
                        {risk.status.replace("_", " ").toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {risk.mitigationPlan && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-sm font-medium text-blue-900 mb-1">Mitigation Plan</div>
                      <div className="text-sm text-blue-700">{risk.mitigationPlan}</div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleViewRisk(risk.id)}>
                      View Full Report
                    </Button>
                    {risk.status !== "resolved" && (
                      <>
                        <Button size="sm" variant="outline">
                          Update Status
                        </Button>
                        <Button size="sm" variant="outline">
                          Add Mitigation
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
