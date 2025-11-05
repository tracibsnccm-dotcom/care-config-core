import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { useQualityProjects } from "@/hooks/useQualityProjects";
import { FilterBar } from "./shared/FilterBar";
import { LoadingState } from "./shared/LoadingState";
import { EmptyState } from "./shared/EmptyState";

export function QualityImprovement() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    search: searchQuery || undefined,
  }), [statusFilter, categoryFilter, searchQuery]);

  const { projects, isLoading } = useQualityProjects(filters);

  const activeProjects = useMemo(() => 
    projects?.filter(p => p.status !== "completed") || []
  , [projects]);

  const completedProjects = useMemo(() => 
    projects?.filter(p => p.status === "completed") || []
  , [projects]);

  const inProgressProjects = useMemo(() => 
    projects?.filter(p => p.status === "implementing" || p.status === "measuring") || []
  , [projects]);

  const avgProgress = useMemo(() => {
    if (!projects || projects.length === 0) return 0;
    const total = projects.reduce((sum, p) => {
      const progress = p.improvement_percentage || 0;
      return sum + progress;
    }, 0);
    return Math.round(total / projects.length);
  }, [projects]);

  const getCategoryColor = (category: string) => {
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

  const getStatusColor = (status: string) => {
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

  if (isLoading) {
    return <LoadingState />;
  }

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

      <FilterBar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            name: "status",
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: "Status",
            options: [
              { label: "Planning", value: "planning" },
              { label: "Implementing", value: "implementing" },
              { label: "Measuring", value: "measuring" },
              { label: "Completed", value: "completed" },
            ],
          },
          {
            name: "category",
            value: categoryFilter,
            onChange: setCategoryFilter,
            placeholder: "Category",
            options: [
              { label: "Documentation", value: "documentation" },
              { label: "Patient Safety", value: "patient_safety" },
              { label: "Clinical Outcomes", value: "clinical_outcomes" },
              { label: "Efficiency", value: "efficiency" },
            ],
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {!projects || projects.length === 0 ? (
        <EmptyState
          title="No quality improvement projects"
          description="Start tracking quality improvement initiatives by creating your first project."
          actionLabel="New QI Project"
          onAction={() => {}}
        />
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.project_name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
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
                      <div className="text-sm font-medium mt-1">{project.baseline_metric || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Current</div>
                      <div className="text-sm font-medium mt-1">{project.current_metric || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Goal</div>
                      <div className="text-sm font-medium mt-1">{project.target_metric || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Priority</div>
                      <div className="text-sm font-medium mt-1">{project.priority.toUpperCase()}</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.improvement_percentage || 0}%</span>
                    </div>
                    <Progress value={project.improvement_percentage || 0} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Started: {new Date(project.start_date).toLocaleDateString()}</span>
                    {project.target_completion && (
                      <span>Target: {new Date(project.target_completion).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">View Details</Button>
                    <Button size="sm" variant="outline">Update Progress</Button>
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
