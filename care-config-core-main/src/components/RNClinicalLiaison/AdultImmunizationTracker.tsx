import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Syringe, CheckCircle2, XCircle, Clock, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";

interface AdultImmunizationTrackerProps {
  caseId: string;
}

interface Immunization {
  id: string;
  vaccine: string;
  last_dose_date?: string;
  next_due_date?: string;
  status: "up-to-date" | "due" | "overdue" | "not-recorded";
  doses_received?: number;
  doses_required?: number;
  lot_number?: string;
  administrator?: string;
}

export default function AdultImmunizationTracker({ caseId }: AdultImmunizationTrackerProps) {
  const [immunizations] = useState<Immunization[]>([
    {
      id: "1",
      vaccine: "Influenza (Flu)",
      last_dose_date: "2024-10-15",
      next_due_date: "2025-10-01",
      status: "up-to-date",
      doses_received: 1,
      doses_required: 1,
      lot_number: "FLU2024-A123",
      administrator: "CVS Pharmacy",
    },
    {
      id: "2",
      vaccine: "COVID-19",
      last_dose_date: "2024-09-20",
      next_due_date: "2025-09-01",
      status: "up-to-date",
      doses_received: 5,
      doses_required: 5,
      lot_number: "COVID-2024-B456",
      administrator: "Walgreens",
    },
    {
      id: "3",
      vaccine: "Tdap (Tetanus, Diphtheria, Pertussis)",
      last_dose_date: "2020-03-15",
      next_due_date: "2025-03-15",
      status: "due",
      doses_received: 1,
      doses_required: 1,
      administrator: "Primary Care Clinic",
    },
    {
      id: "4",
      vaccine: "Pneumococcal (Pneumonia)",
      status: "overdue",
      next_due_date: "2024-01-01",
      doses_received: 0,
      doses_required: 1,
    },
    {
      id: "5",
      vaccine: "Shingles (Shingrix)",
      status: "not-recorded",
      doses_required: 2,
    },
    {
      id: "6",
      vaccine: "Hepatitis B",
      last_dose_date: "2015-06-10",
      status: "up-to-date",
      doses_received: 3,
      doses_required: 3,
      administrator: "Travel Clinic",
    },
  ]);

  const getStatusIcon = (status: Immunization["status"]) => {
    switch (status) {
      case "up-to-date":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "due":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "not-recorded":
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Immunization["status"]) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      "up-to-date": { variant: "default", label: "Up to Date" },
      due: { variant: "secondary", label: "Due Soon" },
      overdue: { variant: "destructive", label: "Overdue" },
      "not-recorded": { variant: "outline", label: "Not Recorded" },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const upToDate = immunizations.filter((i) => i.status === "up-to-date").length;
  const due = immunizations.filter((i) => i.status === "due").length;
  const overdue = immunizations.filter((i) => i.status === "overdue").length;
  const notRecorded = immunizations.filter((i) => i.status === "not-recorded").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Up to Date</p>
              <p className="text-2xl font-bold">{upToDate}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Due Soon</p>
              <p className="text-2xl font-bold">{due}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold">{overdue}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Not Recorded</p>
              <p className="text-2xl font-bold">{notRecorded}</p>
            </div>
            <XCircle className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Adult Immunization Record</h3>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Record Vaccine
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vaccine</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Doses</TableHead>
              <TableHead>Last Dose</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Lot Number</TableHead>
              <TableHead>Administrator</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {immunizations.map((immunization) => (
              <TableRow key={immunization.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(immunization.status)}
                    <span className="font-medium">{immunization.vaccine}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(immunization.status)}</TableCell>
                <TableCell>
                  {immunization.doses_received !== undefined && immunization.doses_required ? (
                    <span>
                      {immunization.doses_received}/{immunization.doses_required}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {immunization.last_dose_date ? (
                    new Date(immunization.last_dose_date).toLocaleDateString()
                  ) : (
                    <span className="text-muted-foreground">Not recorded</span>
                  )}
                </TableCell>
                <TableCell>
                  {immunization.next_due_date ? (
                    <span
                      className={
                        immunization.status === "overdue"
                          ? "text-red-600 font-semibold"
                          : immunization.status === "due"
                          ? "text-orange-600 font-semibold"
                          : ""
                      }
                    >
                      {new Date(immunization.next_due_date).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {immunization.lot_number ? (
                    <span className="font-mono text-xs">{immunization.lot_number}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {immunization.administrator || <span className="text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {(overdue > 0 || due > 0) && (
        <Card className="p-4 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Immunizations Require Attention
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                {overdue > 0 && `${overdue} vaccine${overdue > 1 ? "s are" : " is"} overdue. `}
                {due > 0 && `${due} vaccine${due > 1 ? "s are" : " is"} due soon. `}
                Please coordinate with the client to schedule necessary immunizations.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
        <div className="flex gap-3">
          <Syringe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">CDC Adult Immunization Guidelines</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Follow CDC recommendations for adult vaccinations. Annual flu vaccines, Tdap boosters every 10 years, and age-appropriate vaccines like shingles and pneumonia are essential for preventive care.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
