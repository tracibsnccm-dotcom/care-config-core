import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, CheckCircle2, Clock, AlertCircle, Plus } from "lucide-react";
import { useState } from "react";

interface PreventiveCareTrackerProps {
  caseId: string;
}

interface PreventiveScreening {
  id: string;
  screening_type: string;
  category: "cancer" | "cardiovascular" | "metabolic" | "other";
  last_completed?: string;
  next_due?: string;
  result?: string;
  status: "up-to-date" | "due" | "overdue" | "not-applicable";
  recommended_frequency: string;
  provider?: string;
}

export default function PreventiveCareTracker({ caseId }: PreventiveCareTrackerProps) {
  const [screenings] = useState<PreventiveScreening[]>([
    {
      id: "1",
      screening_type: "Mammogram",
      category: "cancer",
      last_completed: "2024-06-15",
      next_due: "2025-06-15",
      result: "Normal",
      status: "up-to-date",
      recommended_frequency: "Annual (ages 40+)",
      provider: "Women's Imaging Center",
    },
    {
      id: "2",
      screening_type: "PSA (Prostate-Specific Antigen)",
      category: "cancer",
      last_completed: "2024-03-10",
      next_due: "2025-03-10",
      result: "1.2 ng/mL (Normal)",
      status: "up-to-date",
      recommended_frequency: "Annual (ages 50+)",
      provider: "Primary Care",
    },
    {
      id: "3",
      screening_type: "Cholesterol Panel (Lipid Profile)",
      category: "cardiovascular",
      last_completed: "2024-01-20",
      next_due: "2025-01-20",
      result: "Total: 185 mg/dL, LDL: 110 mg/dL, HDL: 55 mg/dL",
      status: "up-to-date",
      recommended_frequency: "Every 4-6 years (or annually if at risk)",
      provider: "LabCorp",
    },
    {
      id: "4",
      screening_type: "Colonoscopy",
      category: "cancer",
      last_completed: "2020-08-15",
      next_due: "2025-08-15",
      result: "Normal, no polyps",
      status: "due",
      recommended_frequency: "Every 10 years (ages 45+)",
      provider: "GI Specialists",
    },
    {
      id: "5",
      screening_type: "Blood Pressure Check",
      category: "cardiovascular",
      last_completed: "2025-01-15",
      next_due: "2025-02-15",
      result: "118/76 mmHg",
      status: "up-to-date",
      recommended_frequency: "Monthly (if hypertensive) or annual",
      provider: "Primary Care",
    },
    {
      id: "6",
      screening_type: "Hemoglobin A1C (Diabetes)",
      category: "metabolic",
      last_completed: "2024-10-05",
      next_due: "2025-04-05",
      result: "5.4% (Normal)",
      status: "up-to-date",
      recommended_frequency: "Every 3 years (ages 45+) or annually if prediabetic",
      provider: "Quest Diagnostics",
    },
    {
      id: "7",
      screening_type: "Bone Density (DEXA Scan)",
      category: "other",
      status: "overdue",
      next_due: "2024-01-01",
      recommended_frequency: "Baseline at age 65 (women) or 70 (men)",
    },
  ]);

  const getStatusIcon = (status: PreventiveScreening["status"]) => {
    switch (status) {
      case "up-to-date":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "due":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "not-applicable":
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PreventiveScreening["status"]) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      "up-to-date": { variant: "default", label: "Up to Date" },
      due: { variant: "secondary", label: "Due Soon" },
      overdue: { variant: "destructive", label: "Overdue" },
      "not-applicable": { variant: "outline", label: "N/A" },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getCategoryBadge = (category: PreventiveScreening["category"]) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      cancer: { variant: "default", label: "Cancer Screening" },
      cardiovascular: { variant: "secondary", label: "Cardiovascular" },
      metabolic: { variant: "outline", label: "Metabolic" },
      other: { variant: "outline", label: "Other" },
    };
    const { variant, label } = config[category];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const upToDate = screenings.filter((s) => s.status === "up-to-date").length;
  const due = screenings.filter((s) => s.status === "due").length;
  const overdue = screenings.filter((s) => s.status === "overdue").length;

  const screeningsByCategory = screenings.reduce((acc, screening) => {
    acc[screening.category] = (acc[screening.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-3">Screenings by Category</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(screeningsByCategory).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between text-sm p-2 border rounded">
              <span className="capitalize">{category}</span>
              <Badge variant="outline">{count}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Preventive Care Screenings</h3>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Screening
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Screening</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Completed</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Latest Result</TableHead>
              <TableHead>Frequency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {screenings.map((screening) => (
              <TableRow key={screening.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(screening.status)}
                    <span className="font-medium">{screening.screening_type}</span>
                  </div>
                </TableCell>
                <TableCell>{getCategoryBadge(screening.category)}</TableCell>
                <TableCell>{getStatusBadge(screening.status)}</TableCell>
                <TableCell>
                  {screening.last_completed ? (
                    new Date(screening.last_completed).toLocaleDateString()
                  ) : (
                    <span className="text-muted-foreground">Not recorded</span>
                  )}
                </TableCell>
                <TableCell>
                  {screening.next_due ? (
                    <span
                      className={
                        screening.status === "overdue"
                          ? "text-red-600 font-semibold"
                          : screening.status === "due"
                          ? "text-orange-600 font-semibold"
                          : ""
                      }
                    >
                      {new Date(screening.next_due).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs text-sm">
                  {screening.result || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {screening.recommended_frequency}
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
                Screenings Require Attention
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                {overdue > 0 && `${overdue} screening${overdue > 1 ? "s are" : " is"} overdue. `}
                {due > 0 && `${due} screening${due > 1 ? "s are" : " is"} due soon. `}
                Please coordinate with the client to schedule necessary preventive screenings.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
        <div className="flex gap-3">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">USPSTF Guidelines</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Follow U.S. Preventive Services Task Force (USPSTF) recommendations for age-appropriate screenings. Regular preventive care reduces risk of chronic diseases and improves long-term outcomes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
