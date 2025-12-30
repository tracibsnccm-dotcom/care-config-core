import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  UserCheck, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApprovalItem {
  id: string;
  type: "case_reassignment" | "pto_request" | "overtime_approval" | "schedule_change" | "resource_request";
  title: string;
  requestedBy: string;
  requestedAt: string;
  priority: "high" | "medium" | "low";
  details: string;
}

interface ManagementApprovalQueueProps {
  roleLevel: "executive" | "leadership" | "operational";
}

export function ManagementApprovalQueue({ roleLevel }: ManagementApprovalQueueProps) {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      // Mock data - in real app, fetch from database
      const mockApprovals: ApprovalItem[] = [
        {
          id: "1",
          type: "case_reassignment",
          title: "Case Reassignment Request - Case #12345",
          requestedBy: "Sarah Johnson, RN",
          requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          priority: "high",
          details: "High-complexity patient requiring immediate attention. Current caseload at 95% capacity."
        },
        {
          id: "2",
          type: "pto_request",
          title: "PTO Request - Michael Chen",
          requestedBy: "Michael Chen, RN",
          requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          priority: "medium",
          details: "Requesting 3 days PTO from Dec 20-22, 2024. Coverage arranged with Emily Rodriguez."
        },
        {
          id: "3",
          type: "overtime_approval",
          title: "Overtime Request - Emily Rodriguez",
          requestedBy: "Emily Rodriguez, RN",
          requestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          priority: "high",
          details: "Requesting 4 hours overtime to complete urgent documentation and follow-up calls."
        },
        {
          id: "4",
          type: "schedule_change",
          title: "Schedule Change Request - David Martinez",
          requestedBy: "David Martinez, RN",
          requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          priority: "low",
          details: "Requesting to swap Friday shift with Alex Thompson due to family commitment."
        },
        {
          id: "5",
          type: "resource_request",
          title: "Additional Training Request - Team",
          requestedBy: "Sarah Johnson, RN",
          requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          priority: "medium",
          details: "Request for advanced wound care training course for 3 team members. Est. cost: $1,200."
        },
      ];

      // Sort by priority and requested date
      const sorted = mockApprovals.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
      });

      setApprovals(sorted);
    } catch (error) {
      console.error("Failed to load approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    toast({
      title: "Approved",
      description: "The request has been approved.",
    });
    setApprovals(prev => prev.filter(a => a.id !== approvalId));
  };

  const handleDeny = async (approvalId: string) => {
    toast({
      title: "Denied",
      description: "The request has been denied.",
      variant: "destructive"
    });
    setApprovals(prev => prev.filter(a => a.id !== approvalId));
  };

  const getPriorityColor = (priority: ApprovalItem["priority"]) => {
    const colors = {
      high: "border-orange-300 bg-orange-50/50",
      medium: "border-yellow-300 bg-yellow-50/50",
      low: "border-blue-300 bg-blue-50/50",
    };
    return colors[priority];
  };

  const getPriorityBadge = (priority: ApprovalItem["priority"]) => {
    const variants = {
      high: { className: "bg-orange-100 text-orange-700 border-orange-200", label: "High Priority" },
      medium: { className: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Medium Priority" },
      low: { className: "bg-blue-100 text-blue-700 border-blue-200", label: "Low Priority" },
    };
    const variant = variants[priority];
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
  };

  const getTypeIcon = (type: ApprovalItem["type"]) => {
    const icons = {
      case_reassignment: UserCheck,
      pto_request: Calendar,
      overtime_approval: Clock,
      schedule_change: Calendar,
      resource_request: FileText,
    };
    const Icon = icons[type] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading approvals...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Approval Queue</h3>
          <p className="text-sm text-muted-foreground">
            Pending approvals requiring your decision
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {approvals.length} pending
        </Badge>
      </div>

      <div className="space-y-3">
        {approvals.map((approval) => (
          <Card key={approval.id} className={getPriorityColor(approval.priority)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  approval.priority === "high" ? "bg-orange-100" : 
                  approval.priority === "medium" ? "bg-yellow-100" : 
                  "bg-blue-100"
                }`}>
                  {getTypeIcon(approval.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{approval.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested by: {approval.requestedBy}
                      </p>
                    </div>
                    {getPriorityBadge(approval.priority)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {approval.details}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(approval.requestedAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeny(approval.id)}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Deny
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleApprove(approval.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {approvals.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No pending approvals at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
