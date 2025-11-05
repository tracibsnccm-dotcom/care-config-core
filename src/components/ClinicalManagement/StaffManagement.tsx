import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Users, Mail, Phone, Briefcase } from "lucide-react";
import { useStaffMembers, StaffMember } from "@/hooks/useStaffMembers";
import { StaffFormDialog } from "./StaffManagement/StaffFormDialog";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function StaffManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const { staff, isLoading, createStaff, updateStaff, isCreating, isUpdating } = 
    useStaffMembers({ role: roleFilter, search });

  const handleSubmit = (data: Partial<StaffMember>) => {
    if (selectedStaff) {
      updateStaff({ id: selectedStaff.id, ...data });
    } else {
      createStaff(data);
    }
    setDialogOpen(false);
    setSelectedStaff(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Staff Directory Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "PPP")}`, 14, 22);

    const tableData = (staff || []).map(s => [
      s.full_name,
      s.role,
      s.department,
      s.caseload_count.toString(),
      s.employment_status
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["Name", "Role", "Department", "Caseload", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [15, 42, 106] }
    });

    doc.save(`staff-directory-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: { variant: "default" as const },
      on_leave: { variant: "secondary" as const },
      terminated: { variant: "destructive" as const }
    };
    const style = styles[status as keyof typeof styles] || styles.active;
    return (
      <Badge variant={style.variant}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  // Filter by status on client side since hook doesn't have status filter
  const filteredStaff = statusFilter 
    ? staff?.filter(s => s.employment_status === statusFilter)
    : staff;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Staff Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage team members, assignments, and performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button size="sm" onClick={() => { setSelectedStaff(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            <SelectItem value="RN Case Manager">RN Case Manager</SelectItem>
            <SelectItem value="RN Supervisor">RN Supervisor</SelectItem>
            <SelectItem value="RN Director">RN Director</SelectItem>
            <SelectItem value="Social Worker">Social Worker</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading staff...
          </CardContent>
        </Card>
      ) : filteredStaff && filteredStaff.length > 0 ? (
        <div className="grid gap-3">
          {filteredStaff.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedStaff(member); setDialogOpen(true); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-semibold">{member.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{member.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{member.department}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Caseload: </span>
                        <span className="font-medium">{member.caseload_count}</span>
                        {member.performance_score && (
                          <span className="text-muted-foreground ml-2">• Score: {member.performance_score}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span>Hired: {format(new Date(member.hire_date), "MMM dd, yyyy")}</span>
                      {member.notes && <span className="line-clamp-1">• {member.notes}</span>}
                    </div>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(member.employment_status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No staff members found. Add your first staff member to get started.
          </CardContent>
        </Card>
      )}

      <StaffFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={selectedStaff}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
}
