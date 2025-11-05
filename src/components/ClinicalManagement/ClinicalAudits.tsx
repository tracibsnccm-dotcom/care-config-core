import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Calendar, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuditItem {
  id: string;
  auditType: "documentation" | "chart_review" | "compliance" | "billing";
  title: string;
  auditor: string;
  scheduledDate: string;
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  completionRate?: number;
  findingsCount?: number;
  severity: "low" | "medium" | "high" | "critical";
  correctiveActionsDue?: string;
}

export function ClinicalAudits() {
  const { toast } = useToast();
  const [audits] = useState<AuditItem[]>([
    {
      id: "audit-001",
      auditType: "documentation",
      title: "Weekly Chart Documentation Audit",
      auditor: "Sarah Johnson, RN",
      scheduledDate: "2025-01-12",
      status: "in_progress",
      completionRate: 65,
      findingsCount: 8,
      severity: "medium",
      correctiveActionsDue: "2025-01-19"
    },
    {
      id: "audit-002",
      auditType: "compliance",
      title: "HIPAA Compliance Audit - Q4",
      auditor: "Compliance Team",
      scheduledDate: "2025-01-08",
      status: "overdue",
      findingsCount: 3,
      severity: "high",
      correctiveActionsDue: "2025-01-15"
    },
    {
      id: "audit-003",
      auditType: "chart_review",
      title: "High-Risk Case Chart Review",
      auditor: "Michael Chen, RN",
      scheduledDate: "2025-01-15",
      status: "scheduled",
      severity: "low"
    },
    {
      id: "audit-004",
      auditType: "billing",
      title: "Billing Code Accuracy Audit",
      auditor: "Finance Department",
      scheduledDate: "2025-01-20",
      status: "scheduled",
      severity: "medium"
    },
    {
      id: "audit-005",
      auditType: "documentation",
      title: "Medication Administration Records Audit",
      auditor: "Emily Rodriguez, RN",
      scheduledDate: "2025-01-05",
      status: "completed",
      completionRate: 100,
      findingsCount: 2,
      severity: "low"
    }
  ]);

  const getStatusColor = (status: AuditItem["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "overdue":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "";
    }
  };

  const getSeverityColor = (severity: AuditItem["severity"]) => {
    switch (severity) {
      case "low":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "";
    }
  };

  const handleViewAudit = (auditId: string) => {
    toast({
      title: "Audit Details",
      description: `Opening audit report for ${audits.find(a => a.id === auditId)?.title}`,
    });
  };

  const overdueCount = audits.filter(a => a.status === "overdue").length;
  const completedCount = audits.filter(a => a.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clinical Audits</h2>
          <p className="text-muted-foreground">Track audits and corrective actions</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Audit
        </Button>
      </div>

      {overdueCount > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-500">Overdue Audits</CardTitle>
            </div>
            <CardDescription>
              {overdueCount} audit{overdueCount > 1 ? 's are' : ' is'} overdue and require immediate attention
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {audits
          .sort((a, b) => {
            const statusOrder = { overdue: 0, in_progress: 1, scheduled: 2, completed: 3 };
            return statusOrder[a.status] - statusOrder[b.status];
          })
          .map((audit) => (
            <Card key={audit.id} className={audit.status === "overdue" ? "border-red-500/50 bg-red-500/5" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{audit.title}</CardTitle>
                    <CardDescription>{audit.auditor}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getStatusColor(audit.status)}>
                      {audit.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={getSeverityColor(audit.severity)}>
                      {audit.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Scheduled Date</div>
                      <div className="text-sm font-medium mt-1">{audit.scheduledDate}</div>
                    </div>
                    {audit.findingsCount !== undefined && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Findings</div>
                        <div className="text-sm font-medium mt-1">{audit.findingsCount} issues</div>
                      </div>
                    )}
                    {audit.correctiveActionsDue && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Actions Due</div>
                        <div className="text-sm font-medium mt-1">{audit.correctiveActionsDue}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Type</div>
                      <div className="text-sm font-medium mt-1">
                        {audit.auditType.replace("_", " ").toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {audit.completionRate !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-medium">{audit.completionRate}%</span>
                      </div>
                      <Progress value={audit.completionRate} />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleViewAudit(audit.id)}>
                      View Report
                    </Button>
                    {audit.status !== "completed" && (
                      <>
                        <Button size="sm" variant="outline">
                          Update Status
                        </Button>
                        <Button size="sm" variant="outline">
                          Add Findings
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
