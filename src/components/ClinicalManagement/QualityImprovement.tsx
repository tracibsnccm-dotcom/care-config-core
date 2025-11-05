import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Target, Download, BarChart3 } from "lucide-react";
import { useQualityProjects, QualityProject } from "@/hooks/useQualityProjects";
import { FilterBar } from "./shared/FilterBar";
import { LoadingState } from "./shared/LoadingState";
import { EmptyState } from "./shared/EmptyState";
import { ProjectFormDialog } from "./QualityImprovement/ProjectFormDialog";
import { ProjectDetailView } from "./QualityImprovement/ProjectDetailView";
import { DeleteConfirmDialog } from "./QualityImprovement/DeleteConfirmDialog";
import { QualityMetricsDashboard } from "./QualityImprovement/QualityMetricsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export function QualityImprovement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<QualityProject | null>(null);

  const filters = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    search: searchQuery || undefined,
  };

  const {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    isCreating,
    isUpdating,
    isDeleting,
  } = useQualityProjects(filters);

  const handleCreateNew = () => {
    setSelectedProject(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (project: QualityProject) => {
    setSelectedProject(project);
    setDetailViewOpen(false);
    setFormDialogOpen(true);
  };

  const handleViewDetails = (project: QualityProject) => {
    setSelectedProject(project);
    setDetailViewOpen(true);
  };

  const handleDeleteClick = (project: QualityProject) => {
    setSelectedProject(project);
    setDetailViewOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = (data: Partial<QualityProject>) => {
    if (selectedProject?.id) {
      updateProject(data as QualityProject & { id: string });
    } else {
      createProject(data);
    }
    setFormDialogOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteConfirm = () => {
    if (selectedProject?.id) {
      deleteProject(selectedProject.id);
      setDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Quality Improvement Projects Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${format(new Date(), "PPP")}`, 14, 28);
    
    const tableData = projects?.map((project) => [
      project.project_name,
      project.category,
      project.status,
      project.priority,
      format(new Date(project.start_date), "MM/dd/yyyy"),
      project.improvement_percentage !== null
        ? `${project.improvement_percentage.toFixed(1)}%`
        : "N/A",
    ]) || [];

    autoTable(doc, {
      head: [["Project Name", "Category", "Status", "Priority", "Start Date", "Improvement"]],
      body: tableData,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [15, 42, 106] },
    });

    doc.save(`quality-improvement-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading projects. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quality Improvement Projects</h2>
          <p className="text-muted-foreground">
            Track and manage continuous quality improvement initiatives
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} disabled={!projects?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4 mt-6">
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
                  { label: "Planning", value: "Planning" },
                  { label: "In Progress", value: "In Progress" },
                  { label: "On Hold", value: "On Hold" },
                  { label: "Under Review", value: "Under Review" },
                  { label: "Completed", value: "Completed" },
                ],
              },
              {
                name: "category",
                value: categoryFilter,
                onChange: setCategoryFilter,
                placeholder: "Category",
                options: [
                  { label: "Clinical Outcomes", value: "Clinical Outcomes" },
                  { label: "Patient Safety", value: "Patient Safety" },
                  { label: "Care Coordination", value: "Care Coordination" },
                  { label: "Documentation", value: "Documentation" },
                  { label: "Response Time", value: "Response Time" },
                  { label: "Client Satisfaction", value: "Client Satisfaction" },
                  { label: "Process Improvement", value: "Process Improvement" },
                ],
              },
            ]}
          />

          {!projects || projects.length === 0 ? (
            <EmptyState
              title="No Quality Improvement Projects"
              description="Start tracking quality improvements by creating your first project"
              actionLabel="Create Project"
              onAction={handleCreateNew}
            />
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(project)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{project.project_name}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{project.category}</Badge>
                          <Badge
                            variant={
                              project.status === "Completed"
                                ? "default"
                                : project.status === "In Progress"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {project.status}
                          </Badge>
                          <Badge
                            variant={
                              project.priority === "Critical" || project.priority === "High"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {project.priority}
                          </Badge>
                        </div>
                      </div>
                      {project.improvement_percentage !== null && (
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-semibold">
                            {project.improvement_percentage > 0 ? "+" : ""}
                            {project.improvement_percentage.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-muted-foreground">
                          Started: {format(new Date(project.start_date), "MM/dd/yyyy")}
                        </span>
                        {project.project_lead && (
                          <span className="text-muted-foreground">Lead: {project.project_lead}</span>
                        )}
                      </div>
                      {project.baseline_metric !== null &&
                        project.target_metric !== null &&
                        project.current_metric !== null && (
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">
                              {project.current_metric.toFixed(1)}% /{" "}
                              {project.target_metric.toFixed(1)}%
                            </span>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {projects && projects.length > 0 ? (
            <QualityMetricsDashboard projects={projects} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  title="No Analytics Available"
                  description="Create quality improvement projects to view analytics and insights"
                  actionLabel="Create Project"
                  onAction={handleCreateNew}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ProjectFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        project={selectedProject}
        onSubmit={handleFormSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <ProjectDetailView
        open={detailViewOpen}
        onOpenChange={setDetailViewOpen}
        project={selectedProject}
        onEdit={() => handleEdit(selectedProject!)}
        onDelete={() => handleDeleteClick(selectedProject!)}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        projectName={selectedProject?.project_name || ""}
      />
    </div>
  );
}
