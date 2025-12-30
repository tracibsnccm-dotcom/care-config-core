import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Clock, CheckCircle2, XCircle, Plus } from "lucide-react";
import { useState } from "react";

interface InsuranceAuthTrackingProps {
  caseId: string;
}

interface AuthRequest {
  id: string;
  service: string;
  provider: string;
  submitted_date: string;
  status: "pending" | "approved" | "denied" | "expired";
  auth_number?: string;
  valid_through?: string;
  units_approved?: number;
  decision_date?: string;
}

export default function InsuranceAuthTracking({ caseId }: InsuranceAuthTrackingProps) {
  const [requests] = useState<AuthRequest[]>([
    {
      id: "1",
      service: "Physical Therapy",
      provider: "ABC Physical Therapy",
      submitted_date: "2025-01-15",
      status: "approved",
      auth_number: "AUTH-2025-12345",
      valid_through: "2025-03-15",
      units_approved: 12,
      decision_date: "2025-01-18",
    },
    {
      id: "2",
      service: "MRI - Cervical Spine",
      provider: "City Imaging Center",
      submitted_date: "2025-01-20",
      status: "pending",
    },
    {
      id: "3",
      service: "Pain Management Consultation",
      provider: "Dr. Johnson Pain Clinic",
      submitted_date: "2025-01-10",
      status: "approved",
      auth_number: "AUTH-2025-12340",
      valid_through: "2025-02-10",
      units_approved: 3,
      decision_date: "2025-01-12",
    },
    {
      id: "4",
      service: "Chiropractic Care",
      provider: "Smith Chiropractic",
      submitted_date: "2024-12-01",
      status: "expired",
      auth_number: "AUTH-2024-11200",
      valid_through: "2025-01-01",
      units_approved: 10,
      decision_date: "2024-12-05",
    },
  ]);

  const getStatusIcon = (status: AuthRequest["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "denied":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "expired":
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: AuthRequest["status"]) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      approved: { variant: "default", label: "Approved" },
      denied: { variant: "destructive", label: "Denied" },
      pending: { variant: "secondary", label: "Pending" },
      expired: { variant: "outline", label: "Expired" },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const activeAuths = requests.filter((r) => r.status === "approved" && r.valid_through && new Date(r.valid_through) > new Date());
  const pendingAuths = requests.filter((r) => r.status === "pending");
  const expiredAuths = requests.filter((r) => r.status === "expired" || (r.valid_through && new Date(r.valid_through) < new Date()));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Authorizations</p>
              <p className="text-2xl font-bold">{activeAuths.length}</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold">{pendingAuths.length}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expired / Denied</p>
              <p className="text-2xl font-bold">{expiredAuths.length}</p>
            </div>
            <XCircle className="h-8 w-8 text-gray-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Authorization Requests</h3>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Auth Number</TableHead>
              <TableHead>Valid Through</TableHead>
              <TableHead>Units Approved</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className="font-medium">{request.service}</span>
                  </div>
                </TableCell>
                <TableCell>{request.provider}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  {request.auth_number ? (
                    <span className="font-mono text-sm">{request.auth_number}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {request.valid_through ? (
                    new Date(request.valid_through).toLocaleDateString()
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {request.units_approved ? (
                    <span>{request.units_approved} visits</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{new Date(request.submitted_date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
