import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Search, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface CPTCodeTrackerProps {
  caseId: string;
}

interface CPTCode {
  id: string;
  code: string;
  description: string;
  category: string;
  units: number;
  date_of_service: string;
  provider: string;
  billed_amount?: number;
  status: "pending" | "billed" | "paid";
}

export default function CPTCodeTracker({ caseId }: CPTCodeTrackerProps) {
  const [codes] = useState<CPTCode[]>([
    {
      id: "1",
      code: "97110",
      description: "Therapeutic exercises",
      category: "Physical Therapy",
      units: 2,
      date_of_service: "2025-01-25",
      provider: "ABC Physical Therapy",
      billed_amount: 150.0,
      status: "billed",
    },
    {
      id: "2",
      code: "72148",
      description: "MRI lumbar spine without contrast",
      category: "Diagnostic Imaging",
      units: 1,
      date_of_service: "2025-01-20",
      provider: "City Imaging Center",
      billed_amount: 1200.0,
      status: "paid",
    },
    {
      id: "3",
      code: "99214",
      description: "Office visit, established patient, moderate complexity",
      category: "Evaluation & Management",
      units: 1,
      date_of_service: "2025-01-28",
      provider: "Dr. Smith",
      billed_amount: 175.0,
      status: "pending",
    },
    {
      id: "4",
      code: "97140",
      description: "Manual therapy",
      category: "Physical Therapy",
      units: 1,
      date_of_service: "2025-01-25",
      provider: "ABC Physical Therapy",
      billed_amount: 75.0,
      status: "billed",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredCodes = codes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: CPTCode["status"]) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      billed: { variant: "default", label: "Billed" },
      paid: { variant: "outline", label: "Paid" },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const totalBilled = codes.reduce((sum, code) => sum + (code.billed_amount || 0), 0);
  const paidAmount = codes.filter((c) => c.status === "paid").reduce((sum, code) => sum + (code.billed_amount || 0), 0);
  const pendingAmount = codes.filter((c) => c.status === "pending").reduce((sum, code) => sum + (code.billed_amount || 0), 0);

  const codesByCategory = codes.reduce((acc, code) => {
    acc[code.category] = (acc[code.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold">${paidAmount.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">${pendingAmount.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3">Procedures by Category</h4>
          <div className="space-y-2">
            {Object.entries(codesByCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span>{category}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3">Billing Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Total Procedures</span>
              <span className="font-semibold">{codes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Units</span>
              <span className="font-semibold">{codes.reduce((sum, c) => sum + c.units, 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg per Procedure</span>
              <span className="font-semibold">${(totalBilled / codes.length).toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">CPT Procedure Codes</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Code
            </Button>
          </div>
        </div>

        {filteredCodes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? "No codes match your search" : "No CPT codes recorded"}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Date of Service</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <span className="font-mono font-semibold">{code.code}</span>
                  </TableCell>
                  <TableCell className="max-w-md">{code.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{code.category}</Badge>
                  </TableCell>
                  <TableCell>{code.units}</TableCell>
                  <TableCell>{new Date(code.date_of_service).toLocaleDateString()}</TableCell>
                  <TableCell>{code.provider}</TableCell>
                  <TableCell>
                    {code.billed_amount ? (
                      <span className="font-semibold">${code.billed_amount.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(code.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
        <div className="flex gap-3">
          <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">CPT Code Reference</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Current Procedural Terminology (CPT) codes are used to document medical procedures and services for billing purposes. Ensure accurate coding for proper reimbursement.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
