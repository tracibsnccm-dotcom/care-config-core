import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { useCredentials, Credential } from "@/hooks/useCredentials";
import { CredentialFormDialog } from "./CredentialingTracker/CredentialFormDialog";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function CredentialingTracker() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);

  const { credentials, isLoading, createCredential, updateCredential, isCreating, isUpdating } = 
    useCredentials({ status: statusFilter, type: typeFilter, search });

  const handleSubmit = (data: Partial<Credential>) => {
    if (selectedCredential) {
      updateCredential({ id: selectedCredential.id, ...data });
    } else {
      createCredential(data);
    }
    setDialogOpen(false);
    setSelectedCredential(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Credentials Tracking Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "PPP")}`, 14, 22);

    const tableData = (credentials || []).map(c => [
      c.credential_name,
      c.credential_type,
      c.license_number || "N/A",
      c.expiration_date ? format(new Date(c.expiration_date), "MM/dd/yyyy") : "N/A",
      c.status
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["Credential", "Type", "License #", "Expires", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [15, 42, 106] }
    });

    doc.save(`credentials-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      expiring_soon: { variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
      expired: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
      pending_renewal: { variant: "secondary" as const, icon: Clock, color: "text-blue-600" }
    };
    const style = styles[status as keyof typeof styles] || styles.active;
    const Icon = style.icon;
    return (
      <Badge variant={style.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const days = Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Credentials Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Monitor staff credentials, licenses, and certifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button size="sm" onClick={() => { setSelectedCredential(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credential
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search credentials..."
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
            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="RN License">RN License</SelectItem>
            <SelectItem value="NP Certification">NP Certification</SelectItem>
            <SelectItem value="BCLS">BCLS</SelectItem>
            <SelectItem value="ACLS">ACLS</SelectItem>
            <SelectItem value="CCM Certification">CCM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Credentials List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading credentials...
          </CardContent>
        </Card>
      ) : credentials && credentials.length > 0 ? (
        <div className="grid gap-3">
          {credentials.map((credential) => {
            const daysUntilExpiration = getDaysUntilExpiration(credential.expiration_date);
            return (
              <Card key={credential.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setSelectedCredential(credential); setDialogOpen(true); }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-semibold">{credential.credential_name}</h4>
                          <p className="text-sm text-muted-foreground">{credential.credential_type}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                        <div>
                          <span className="text-muted-foreground">License #:</span>
                          <p className="font-medium">{credential.license_number || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Organization:</span>
                          <p className="font-medium">{credential.issuing_organization || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expires:</span>
                          <p className="font-medium">
                            {format(new Date(credential.expiration_date), "MM/dd/yyyy")}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Days Left:</span>
                          <p className={`font-medium ${daysUntilExpiration < 30 ? "text-red-600" : daysUntilExpiration < 90 ? "text-yellow-600" : "text-green-600"}`}>
                            {daysUntilExpiration > 0 ? `${daysUntilExpiration} days` : "Expired"}
                          </p>
                        </div>
                      </div>
                      {credential.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{credential.notes}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(credential.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No credentials found. Add your first credential to get started.
          </CardContent>
        </Card>
      )}

      <CredentialFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        credential={selectedCredential}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
}
