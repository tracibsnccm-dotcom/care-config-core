import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, FileText, Download } from "lucide-react";
import { useClinicalAudits, ClinicalAudit } from "@/hooks/useClinicalAudits";
import { FilterBar } from "./shared/FilterBar";
import { LoadingState } from "./shared/LoadingState";
import { EmptyState } from "./shared/EmptyState";
import { AuditFormDialog } from "./ClinicalAudits/AuditFormDialog";
import { AuditDetailView } from "./ClinicalAudits/AuditDetailView";
import { DeleteConfirmDialog } from "./QualityImprovement/DeleteConfirmDialog";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function ClinicalAudits() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<ClinicalAudit | null>(null);

  const filters = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    search: searchQuery || undefined,
  };

  const {
    audits,
    isLoading,
    error,
    createAudit,
    updateAudit,
    isCreating,
    isUpdating,
  } = useClinicalAudits(filters);

  const handleCreateNew = () => {
    setSelectedAudit(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (audit: ClinicalAudit) => {
    setSelectedAudit(audit);
    setDetailViewOpen(false);
    setFormDialogOpen(true);
  };

  const handleViewDetails = (audit: ClinicalAudit) => {
    setSelectedAudit(audit);
    setDetailViewOpen(true);
  };

  const handleFormSubmit = (data: Partial<ClinicalAudit>) => {
    if (selectedAudit?.id) {
      updateAudit(data as ClinicalAudit & { id: string });
    } else {
      createAudit(data);
    }
    setFormDialogOpen(false);
    setSelectedAudit(null);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Clinical Audits Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${format(new Date(), "PPP")}`, 14, 28);
    
    const tableData = audits?.map((audit) => [
      audit.audit_name,
      audit.audit_type.replace("_", " "),
      audit.status.replace("_", " "),
      format(new Date(audit.scheduled_date), "MM/dd/yyyy"),
      audit.cases_reviewed.toString(),
      audit.compliance_rate !== null ? `${audit.compliance_rate.toFixed(1)}%` : "N/A",
    ]) || [];

    autoTable(doc, {
      head: [["Audit Name", "Type", "Status", "Date", "Cases", "Compliance"]],
      body: tableData,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [15, 42, 106] },
    });

    doc.save(`clinical-audits-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <div className="text-center py-8 text-destructive">Error loading audits</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Clinical Audits</h2>
          <p className="text-muted-foreground">Schedule and track clinical quality audits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} disabled={!audits?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Audit
          </Button>
        </div>
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
              { label: "Scheduled", value: "scheduled" },
              { label: "In Progress", value: "in_progress" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ],
          },
          {
            name: "type",
            value: typeFilter,
            onChange: setTypeFilter,
            placeholder: "Type",
            options: [
              { label: "Documentation", value: "documentation" },
              { label: "Clinical Quality", value: "clinical_quality" },
              { label: "Compliance", value: "compliance" },
              { label: "Safety", value: "safety" },
              { label: "Process", value: "process" },
            ],
          },
        ]}
      />

      {!audits || audits.length === 0 ? (
        <EmptyState
          title="No Clinical Audits"
          description="Schedule your first clinical audit to track quality and compliance"
          actionLabel="Schedule Audit"
          onAction={handleCreateNew}
        />
      ) : (
        <div className="grid gap-4">
          {audits.map((audit) => (
            <Card
              key={audit.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(audit)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{audit.audit_name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{audit.audit_type.replace("_", " ")}</Badge>
                      <Badge
                        variant={
                          audit.status === "completed"
                            ? "default"
                            : audit.status === "in_progress"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {audit.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline">{audit.priority}</Badge>
                    </div>
                  </div>
                  {audit.compliance_rate !== null && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {audit.compliance_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Compliance</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(audit.scheduled_date), "MM/dd/yyyy")}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {audit.cases_reviewed} cases reviewed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AuditFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        audit={selectedAudit}
        onSubmit={handleFormSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <AuditDetailView
        open={detailViewOpen}
        onOpenChange={setDetailViewOpen}
        audit={selectedAudit}
        onEdit={() => handleEdit(selectedAudit!)}
        onDelete={() => {
          setDetailViewOpen(false);
          setDeleteDialogOpen(true);
        }}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => setDeleteDialogOpen(false)}
        isDeleting={false}
        projectName={selectedAudit?.audit_name || ""}
      />
    </div>
  );
}
