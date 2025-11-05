import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface TrainingItem {
  id: string;
  staffMember: string;
  course: string;
  type: "mandatory" | "certification" | "continuing_ed";
  status: "completed" | "in_progress" | "overdue" | "upcoming";
  dueDate: string;
  completionDate?: string;
  progress: number;
}

export function TrainingCompliance() {
  const [trainings] = useState<TrainingItem[]>([
    {
      id: "train-001",
      staffMember: "Sarah Johnson, RN",
      course: "Annual HIPAA Compliance",
      type: "mandatory",
      status: "overdue",
      dueDate: "2025-01-05",
      progress: 60
    },
    {
      id: "train-002",
      staffMember: "Michael Chen, RN",
      course: "CPR Recertification",
      type: "certification",
      status: "upcoming",
      dueDate: "2025-02-15",
      progress: 0
    },
    {
      id: "train-003",
      staffMember: "Emily Rodriguez, RN",
      course: "Advanced Wound Care",
      type: "continuing_ed",
      status: "in_progress",
      dueDate: "2025-03-01",
      progress: 45
    },
    {
      id: "train-004",
      staffMember: "David Kim, RN",
      course: "Infection Control Update",
      type: "mandatory",
      status: "completed",
      dueDate: "2024-12-31",
      completionDate: "2024-12-28",
      progress: 100
    },
    {
      id: "train-005",
      staffMember: "Lisa Martinez, RN",
      course: "Medication Management",
      type: "mandatory",
      status: "overdue",
      dueDate: "2025-01-01",
      progress: 30
    }
  ]);

  const getStatusColor = (status: TrainingItem["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "overdue":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "upcoming":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: TrainingItem["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4" />;
      case "upcoming":
        return <Award className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const overdueCount = trainings.filter(t => t.status === "overdue").length;
  const completionRate = Math.round(
    (trainings.filter(t => t.status === "completed").length / trainings.length) * 100
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Training & Compliance</h2>
          <p className="text-muted-foreground">Monitor staff training and certification requirements</p>
        </div>
        <Button>
          <Award className="h-4 w-4 mr-2" />
          Schedule Training
        </Button>
      </div>

      {overdueCount > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-500">Overdue Training Alert</CardTitle>
            </div>
            <CardDescription>
              {overdueCount} staff member{overdueCount > 1 ? 's have' : ' has'} overdue training requirements
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
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
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainings.filter(t => t.status === "in_progress").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {trainings
          .sort((a, b) => {
            const priorityOrder = { overdue: 0, in_progress: 1, upcoming: 2, completed: 3 };
            return priorityOrder[a.status] - priorityOrder[b.status];
          })
          .map((training) => (
            <Card key={training.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{training.course}</CardTitle>
                    <CardDescription>{training.staffMember}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getStatusColor(training.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(training.status)}
                        {training.status.replace("_", " ").toUpperCase()}
                      </span>
                    </Badge>
                    <Badge variant="secondary">
                      {training.type.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Due Date</div>
                      <div className="text-sm font-medium mt-1">{training.dueDate}</div>
                    </div>
                    {training.completionDate && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Completed</div>
                        <div className="text-sm font-medium mt-1">{training.completionDate}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Progress</div>
                      <div className="text-sm font-medium mt-1">{training.progress}%</div>
                    </div>
                  </div>
                  <Progress value={training.progress} />
                  <div className="flex gap-2">
                    <Button size="sm">View Details</Button>
                    {training.status !== "completed" && (
                      <Button size="sm" variant="outline">
                        Send Reminder
                      </Button>
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
