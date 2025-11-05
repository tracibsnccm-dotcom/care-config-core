import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QualityProject } from "@/hooks/useQualityProjects";
import {
  Calendar,
  User,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface ProjectDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: QualityProject | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectDetailView({
  open,
  onOpenChange,
  project,
  onEdit,
  onDelete,
}: ProjectDetailViewProps) {
  if (!project) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Planning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "On Hold":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Under Review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const calculateProgress = () => {
    if (!project.baseline_metric || !project.target_metric || !project.current_metric) {
      return 0;
    }
    const total = project.target_metric - project.baseline_metric;
    const current = project.current_metric - project.baseline_metric;
    return Math.round((current / total) * 100);
  };

  const progress = calculateProgress();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{project.project_name}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                <Badge variant="outline">{project.category}</Badge>
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
          {/* Key Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </div>
                <div className="font-semibold">
                  {format(new Date(project.start_date), "MMM dd, yyyy")}
                </div>
              </CardContent>
            </Card>

            {project.target_completion && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    Target Date
                  </div>
                  <div className="font-semibold">
                    {format(new Date(project.target_completion), "MMM dd, yyyy")}
                  </div>
                </CardContent>
              </Card>
            )}

            {project.project_lead && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <User className="h-4 w-4" />
                    Project Lead
                  </div>
                  <div className="font-semibold">{project.project_lead}</div>
                </CardContent>
              </Card>
            )}

            {project.improvement_percentage !== null && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Improvement
                  </div>
                  <div className="font-semibold text-green-600">
                    {project.improvement_percentage > 0 ? "+" : ""}
                    {project.improvement_percentage.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Metrics Progress */}
          {project.baseline_metric !== null &&
            project.target_metric !== null &&
            project.current_metric !== null && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Metrics Progress
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Baseline</span>
                      <span className="font-semibold">{project.baseline_metric.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-semibold text-blue-600">
                        {project.current_metric.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-semibold text-green-600">
                        {project.target_metric.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Description */}
          {project.description && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Interventions */}
          {project.interventions && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Interventions & Strategies
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.interventions}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Barriers */}
          {project.barriers && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Barriers & Challenges
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.barriers}
                </p>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Metadata */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Created: {format(new Date(project.created_at), "PPP")}</span>
            <span>Last Updated: {format(new Date(project.updated_at), "PPP")}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
