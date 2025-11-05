import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QIProject {
  id: string;
  title: string;
  category: "documentation" | "patient_safety" | "clinical_outcomes" | "efficiency";
  status: "planning" | "implementing" | "measuring" | "completed";
  owner: string;
  startDate: string;
  targetDate: string;
  progress: number;
  currentCycle: number;
  totalCycles: number;
  baseline: string;
  goal: string;
  currentMetric: string;
}

export function QualityImprovement() {
  const { toast } = useToast();
  const [projects] = useState<QIProject[]>([
    {
      id: "qi-001",
      title: "Reduce Documentation Errors by 25%",
      category: "documentation",
      status: "implementing",
      owner: "Sarah Johnson, RN",
      startDate: "2024-11-01",
      targetDate: "2025-02-28",
      progress: 60,
      currentCycle: 2,
      totalCycles: 4,
      baseline: "18% error rate",
      goal: "13.5% error rate",
      currentMetric: "15% error rate"
    },
    {
      id: "qi-002",
      title: "Improve Patient Satisfaction Scores",
      category: "clinical_outcomes",
      status: "measuring",
      owner: "Michael Chen, RN",
      startDate: "2024-10-15",
      targetDate: "2025-01-31",
      progress: 75,
      currentCycle: 3,
      totalCycles: 4,
      baseline: "82% satisfaction",
      goal: "90% satisfaction",
      currentMetric: "87% satisfaction"
    },
    {
      id: "qi-003",
      title: "Reduce Fall Risk Incidents",
      category: "patient_safety",
      status: "implementing",
      owner: "Emily Rodriguez, RN",
      startDate: "2024-12-01",
      targetDate: "2025-03-31",
      progress: 40,
      currentCycle: 1,
      totalCycles: 3,
      baseline: "8 incidents/month",
      goal: "4 incidents/month",
      currentMetric: "6 incidents/month"
    },
    {
      id: "qi-004",
      title: "Streamline Care Coordination Process",
      category: "efficiency",
      status: "planning",
      owner: "David Kim, RN",
      startDate: "2025-01-15",
      targetDate: "2025-04-30",
      progress: 15,
      currentCycle: 1,
      totalCycles: 3,
      baseline: "4.5 days avg",
      goal: "2 days avg",
      currentMetric: "4.2 days avg"
    }
  ]);

  const getCategoryColor = (category: QIProject["category"]) => {
    switch (category) {
      case "documentation":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "patient_safety":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "clinical_outcomes":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "efficiency":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "";
    }
  };

  const getStatusColor = (status: QIProject["status"]) => {
    switch (status) {
      case "planning":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "implementing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "measuring":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "";
    }
  };

  const handleViewProject = (projectId: string) => {
    toast({
      title: "Project Details",
      description: `Opening details for ${projects.find(p => p.id === projectId)?.title}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quality Improvement Projects</h2>
          <p className="text-muted-foreground">Track PDSA cycles and measure outcomes</p>
        </div>
        <Button>
          <Target className="h-4 w-4 mr-2" />
          New QI Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status !== "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === "implementing" || p.status === "measuring").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <CardDescription>{project.owner}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={getCategoryColor(project.category)}>
                    {project.category.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(project.status)}>
                    {project.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Baseline</div>
                    <div className="text-sm font-medium mt-1">{project.baseline}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Current</div>
                    <div className="text-sm font-medium mt-1">{project.currentMetric}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Goal</div>
                    <div className="text-sm font-medium mt-1">{project.goal}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">PDSA Cycle</div>
                    <div className="text-sm font-medium mt-1">
                      {project.currentCycle} of {project.totalCycles}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Started: {project.startDate}</span>
                  <span>Target: {project.targetDate}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleViewProject(project.id)}>
                    View Details
                  </Button>
                  <Button size="sm" variant="outline">
                    Document Cycle
                  </Button>
                  <Button size="sm" variant="outline">
                    Update Metrics
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
