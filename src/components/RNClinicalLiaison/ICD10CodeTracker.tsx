import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface ICD10CodeTrackerProps {
  caseId: string;
}

interface ICD10Code {
  id: string;
  code: string;
  description: string;
  category: "primary" | "secondary" | "comorbidity";
  date_added: string;
  added_by: string;
}

export default function ICD10CodeTracker({ caseId }: ICD10CodeTrackerProps) {
  const [codes] = useState<ICD10Code[]>([
    {
      id: "1",
      code: "M54.5",
      description: "Low back pain",
      category: "primary",
      date_added: "2025-01-15",
      added_by: "M. Garcia, RN CCM",
    },
    {
      id: "2",
      code: "M79.3",
      description: "Myalgia",
      category: "secondary",
      date_added: "2025-01-15",
      added_by: "M. Garcia, RN CCM",
    },
    {
      id: "3",
      code: "G89.29",
      description: "Other chronic pain",
      category: "secondary",
      date_added: "2025-01-20",
      added_by: "M. Garcia, RN CCM",
    },
    {
      id: "4",
      code: "F41.1",
      description: "Generalized anxiety disorder",
      category: "comorbidity",
      date_added: "2025-01-22",
      added_by: "M. Garcia, RN CCM",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredCodes = codes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryBadge = (category: ICD10Code["category"]) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      primary: { variant: "default", label: "Primary" },
      secondary: { variant: "secondary", label: "Secondary" },
      comorbidity: { variant: "outline", label: "Comorbidity" },
    };
    const { variant, label } = config[category];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const primaryCodes = codes.filter((c) => c.category === "primary");
  const secondaryCodes = codes.filter((c) => c.category === "secondary");
  const comorbidityCodes = codes.filter((c) => c.category === "comorbidity");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Primary Diagnoses</p>
              <p className="text-2xl font-bold">{primaryCodes.length}</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Secondary Diagnoses</p>
              <p className="text-2xl font-bold">{secondaryCodes.length}</p>
            </div>
            <FileText className="h-8 w-8 text-secondary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Comorbidities</p>
              <p className="text-2xl font-bold">{comorbidityCodes.length}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">ICD-10 Diagnosis Codes</h3>
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
            {searchTerm ? "No codes match your search" : "No ICD-10 codes recorded"}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Added By</TableHead>
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
                  <TableCell>{getCategoryBadge(code.category)}</TableCell>
                  <TableCell>{new Date(code.date_added).toLocaleDateString()}</TableCell>
                  <TableCell>{code.added_by}</TableCell>
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
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">ICD-10 Code Reference</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              ICD-10 codes are used for diagnosis documentation, medical billing, and treatment planning. Ensure all codes are current and accurately reflect the patient's condition.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
