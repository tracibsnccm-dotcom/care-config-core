import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  User,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquareWarning
} from "lucide-react";

interface ReviewItem {
  id: string;
  type: "performance_review" | "documentation_review" | "case_review" | "compliance_review" | "quality_metrics" | "complaint" | "concern" | "emergency_alert";
  title: string;
  assignedTo: string;
  dueDate: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "overdue" | "due_today" | "upcoming";
  daysOverdue?: number;
  roleRestriction?: "director" | "supervisor" | "manager" | "all";
}

interface ManagementReviewQueueProps {
  roleLevel: "executive" | "leadership" | "operational";
}

export function ManagementReviewQueue({ roleLevel }: ManagementReviewQueueProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      // Mock data - in real app, fetch from database and filter by role
      const mockReviews: ReviewItem[] = [
        {
          id: "1",
          type: "performance_review",
          title: "Annual Performance Review - Sarah Johnson (RN CM)",
          assignedTo: "Sarah Johnson",
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "critical",
          status: "overdue",
          daysOverdue: 2,
          roleRestriction: "all"
        },
        {
          id: "2",
          type: "emergency_alert",
          title: "Emergency Alert Follow-Up - Client Suicidal Ideation",
          assignedTo: "Emily Rodriguez",
          dueDate: new Date().toISOString(),
          priority: "critical",
          status: "due_today",
          roleRestriction: "all"
        },
        {
          id: "3",
          type: "complaint",
          title: "Staff Complaint - Unprofessional Conduct",
          assignedTo: "Team Wide",
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "high",
          status: "upcoming",
          roleRestriction: "director"
        },
        {
          id: "4",
          type: "concern",
          title: "Client Concern - Care Coordinator Communication",
          assignedTo: "Case Management Team",
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "high",
          status: "overdue",
          daysOverdue: 1,
          roleRestriction: "director"
        },
        {
          id: "5",
          type: "quality_metrics",
          title: "Monthly Quality Metrics Review - Documentation Compliance",
          assignedTo: "Clinical Management",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "high",
          status: "upcoming",
          roleRestriction: "all"
        },
        {
          id: "6",
          type: "documentation_review",
          title: "Documentation Quality Review - Case #12345",
          assignedTo: "Michael Chen",
          dueDate: new Date().toISOString(),
          priority: "high",
          status: "due_today",
          roleRestriction: "all"
        },
        {
          id: "7",
          type: "case_review",
          title: "Complex Case Review - Patient Transfer",
          assignedTo: "Emily Rodriguez",
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "high",
          status: "upcoming",
          roleRestriction: "all"
        },
        {
          id: "8",
          type: "compliance_review",
          title: "HIPAA Compliance Audit - Q4",
          assignedTo: "Team Wide",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "medium",
          status: "upcoming",
          roleRestriction: "all"
        },
        {
          id: "9",
          type: "performance_review",
          title: "90-Day Performance Review - David Martinez",
          assignedTo: "David Martinez",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          priority: "medium",
          status: "upcoming",
          roleRestriction: "all"
        },
        {
          id: "10",
          type: "emergency_alert",
          title: "Emergency Alert Verification - High Pain Score",
          assignedTo: "Jessica Wong",
          dueDate: new Date().toISOString(),
          priority: "critical",
          status: "due_today",
          roleRestriction: "all"
        },
      ];

      // Filter by role level
      const filtered = mockReviews.filter(review => {
        if (!review.roleRestriction || review.roleRestriction === "all") return true;
        if (roleLevel === "executive") return true; // Directors see everything
        if (roleLevel === "leadership" && review.roleRestriction !== "director") return true;
        if (roleLevel === "operational" && review.roleRestriction === "manager") return true;
        return false;
      });

      // Sort by priority and due date
      const sorted = filtered.sort((a, b) => {
        // First by status (overdue > due_today > upcoming)
        const statusOrder = { overdue: 0, due_today: 1, upcoming: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        
        // Then by priority
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        // Finally by due date
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setReviews(sorted);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: ReviewItem["priority"]) => {
    const variants = {
      critical: { className: "bg-red-100 text-red-700 border-red-200", label: "Critical" },
      high: { className: "bg-orange-100 text-orange-700 border-orange-200", label: "High" },
      medium: { className: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Medium" },
      low: { className: "bg-blue-100 text-blue-700 border-blue-200", label: "Low" },
    };
    const variant = variants[priority];
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
  };

  const getStatusBadge = (status: ReviewItem["status"], daysOverdue?: number) => {
    if (status === "overdue") {
      return (
        <Badge variant="destructive" className="animate-pulse">
          {daysOverdue} {daysOverdue === 1 ? "day" : "days"} overdue
        </Badge>
      );
    }
    if (status === "due_today") {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Due Today</Badge>;
    }
    return <Badge variant="outline">Upcoming</Badge>;
  };

  const getTypeIcon = (type: ReviewItem["type"]) => {
    const icons = {
      performance_review: User,
      documentation_review: FileText,
      case_review: AlertTriangle,
      compliance_review: CheckCircle,
      quality_metrics: TrendingUp,
      complaint: MessageSquareWarning,
      concern: AlertCircle,
      emergency_alert: AlertTriangle,
    };
    const Icon = icons[type];
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading reviews...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review Queue</h3>
          <p className="text-sm text-muted-foreground">
            Items requiring review, sorted by urgency and due date
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {reviews.length} items
        </Badge>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className={
            review.type === "emergency_alert" ? "border-red-500 bg-red-50/50 shadow-md" :
            review.type === "complaint" || review.type === "concern" ? "border-orange-400 bg-orange-50/50" :
            review.status === "overdue" ? "border-red-300 bg-red-50/50" : ""
          }>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  review.type === "emergency_alert" ? "bg-red-200 animate-pulse" :
                  review.type === "complaint" || review.type === "concern" ? "bg-orange-200" :
                  review.status === "overdue" ? "bg-red-100" : 
                  review.status === "due_today" ? "bg-yellow-100" : 
                  "bg-blue-100"
                }`}>
                  {getTypeIcon(review.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{review.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Assigned to: {review.assignedTo}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(review.priority)}
                      {getStatusBadge(review.status, review.daysOverdue)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {format(new Date(review.dueDate), "MMM d, yyyy")}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm">
                        Complete Review
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No pending reviews at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
