import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, TrendingUp, AlertTriangle, Calendar, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LabResult {
  id: string;
  test_name: string;
  result_value: string;
  unit: string;
  reference_range: string;
  status: "normal" | "abnormal" | "critical";
  test_date: string;
  ordering_provider: string;
}

interface LabResultsDiagnosticsTrackerProps {
  caseId: string;
}

export default function LabResultsDiagnosticsTracker({ caseId }: LabResultsDiagnosticsTrackerProps) {
  // Mock data - in production, this would fetch from Supabase
  const [labResults] = useState<LabResult[]>([
    {
      id: "1",
      test_name: "Complete Blood Count (CBC)",
      result_value: "4.8",
      unit: "million cells/mcL",
      reference_range: "4.5-5.5",
      status: "normal",
      test_date: "2025-01-15",
      ordering_provider: "Dr. Smith"
    },
    {
      id: "2",
      test_name: "C-Reactive Protein (CRP)",
      result_value: "12.5",
      unit: "mg/L",
      reference_range: "<10",
      status: "abnormal",
      test_date: "2025-01-15",
      ordering_provider: "Dr. Smith"
    },
    {
      id: "3",
      test_name: "Hemoglobin A1C",
      result_value: "6.2",
      unit: "%",
      reference_range: "4.0-5.6",
      status: "abnormal",
      test_date: "2025-01-10",
      ordering_provider: "Dr. Johnson"
    },
    {
      id: "4",
      test_name: "MRI - Lumbar Spine",
      result_value: "Mild disc bulge at L4-L5",
      unit: "N/A",
      reference_range: "Normal",
      status: "abnormal",
      test_date: "2025-01-08",
      ordering_provider: "Dr. Williams"
    }
  ]);

  const normalResults = labResults.filter(r => r.status === "normal");
  const abnormalResults = labResults.filter(r => r.status === "abnormal");
  const criticalResults = labResults.filter(r => r.status === "critical");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "default";
      case "abnormal": return "secondary";
      case "critical": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Results</p>
              <p className="text-2xl font-bold">{labResults.length}</p>
            </div>
            <FlaskConical className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Normal</p>
              <p className="text-2xl font-bold text-green-500">{normalResults.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Abnormal</p>
              <p className="text-2xl font-bold text-orange-500">{abnormalResults.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-red-500">{criticalResults.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Lab Result
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Results ({labResults.length})</TabsTrigger>
          <TabsTrigger value="abnormal">Abnormal ({abnormalResults.length})</TabsTrigger>
          <TabsTrigger value="critical">Critical ({criticalResults.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-3">
            {labResults.map((result) => (
              <Card key={result.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{result.test_name}</h4>
                      <Badge variant={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Result</p>
                        <p className="font-medium">{result.result_value} {result.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reference Range</p>
                        <p>{result.reference_range}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Test Date</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.test_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ordering Provider</p>
                        <p>{result.ordering_provider}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="abnormal">
          <div className="space-y-3">
            {abnormalResults.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No abnormal results</p>
              </Card>
            ) : (
              abnormalResults.map((result) => (
                <Card key={result.id} className="p-4 border-orange-500">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{result.test_name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Result</p>
                          <p className="font-medium text-orange-500">{result.result_value} {result.unit}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expected Range</p>
                          <p>{result.reference_range}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="critical">
          <div className="space-y-3">
            {criticalResults.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-green-500">No critical results - Good news!</p>
              </Card>
            ) : (
              criticalResults.map((result) => (
                <Card key={result.id} className="p-4 border-red-500">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{result.test_name}</h4>
                      <Badge variant="destructive" className="mb-2">Requires Immediate Attention</Badge>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Result</p>
                          <p className="font-medium text-red-500">{result.result_value} {result.unit}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expected Range</p>
                          <p>{result.reference_range}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
