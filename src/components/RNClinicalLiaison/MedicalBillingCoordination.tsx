import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, FileText, AlertCircle, Download } from "lucide-react";
import { useState } from "react";

interface MedicalBillingCoordinationProps {
  caseId: string;
}

interface BillingRecord {
  id: string;
  service: string;
  provider: string;
  date: string;
  amount: number;
  status: "pending" | "approved" | "denied" | "paid";
  insuranceClaim: string;
}

export default function MedicalBillingCoordination({ caseId }: MedicalBillingCoordinationProps) {
  const [records] = useState<BillingRecord[]>([
    {
      id: "1",
      service: "Physical Therapy Session",
      provider: "ABC Physical Therapy",
      date: "2025-01-15",
      amount: 150.0,
      status: "approved",
      insuranceClaim: "CLM-2025-001",
    },
    {
      id: "2",
      service: "MRI Scan",
      provider: "City Imaging Center",
      date: "2025-01-10",
      amount: 1200.0,
      status: "pending",
      insuranceClaim: "CLM-2025-002",
    },
    {
      id: "3",
      service: "Orthopedic Consultation",
      provider: "Dr. Smith Orthopedics",
      date: "2025-01-05",
      amount: 250.0,
      status: "paid",
      insuranceClaim: "CLM-2025-003",
    },
  ]);

  const getStatusBadge = (status: BillingRecord["status"]) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      denied: { variant: "destructive", label: "Denied" },
      paid: { variant: "outline", label: "Paid" },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalBilled = records.reduce((sum, record) => sum + record.amount, 0);
  const totalApproved = records.filter((r) => r.status === "approved" || r.status === "paid").reduce((sum, record) => sum + record.amount, 0);
  const pendingAmount = records.filter((r) => r.status === "pending").reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Billed</p>
              <p className="text-2xl font-bold">${totalBilled.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved/Paid</p>
              <p className="text-2xl font-bold">${totalApproved.toFixed(2)}</p>
            </div>
            <FileText className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">${pendingAmount.toFixed(2)}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Billing Records</h3>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Claim #</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.service}</TableCell>
                <TableCell>{record.provider}</TableCell>
                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                <TableCell>${record.amount.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-sm">{record.insuranceClaim}</TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Insurance Coordination</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              All billing claims are automatically coordinated with the client's insurance provider. Updates are reflected in real-time.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
