import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClinicalAudit } from "@/hooks/useClinicalAudits";
import { Calendar, FileText, AlertCircle, CheckCircle2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AuditDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: ClinicalAudit | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function AuditDetailView({
  open,
  onOpenChange,
  audit,
  onEdit,
  onDelete,
}: AuditDetailViewProps) {
  if (!audit) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{audit.audit_name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(audit.status)}>
                  {audit.status.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge variant="outline">{audit.audit_type.replace("_", " ")}</Badge>
                <Badge variant="outline">{audit.priority}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Scheduled Date
                </div>
                <div className="font-semibold">
                  {format(new Date(audit.scheduled_date), "MMM dd, yyyy")}
                </div>
              </CardContent>
            </Card>

            {audit.completed_date && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed
                  </div>
                  <div className="font-semibold">
                    {format(new Date(audit.completed_date), "MMM dd, yyyy")}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="text-muted-foreground text-sm mb-1">Cases Reviewed</div>
                <div className="font-semibold text-2xl">{audit.cases_reviewed}</div>
              </CardContent>
            </Card>

            {audit.compliance_rate !== null && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm mb-1">Compliance Rate</div>
                  <div className="font-semibold text-2xl text-green-600">
                    {audit.compliance_rate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {audit.findings && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Findings
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {audit.findings}
                </p>
              </CardContent>
            </Card>
          )}

          {audit.recommendations && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Recommendations
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {audit.recommendations}
                </p>
              </CardContent>
            </Card>
          )}

          {audit.follow_up_required && audit.follow_up_date && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-semibold">Follow-up Required</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {format(new Date(audit.follow_up_date), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
