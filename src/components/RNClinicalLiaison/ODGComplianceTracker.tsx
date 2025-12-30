import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ODGComplianceTrackerProps {
  caseId: string;
}

interface ODGBenchmark {
  id: string;
  name: string;
  description: string;
  status: "compliant" | "non-compliant" | "pending" | "not-applicable";
  last_reviewed: string;
  notes?: string;
}

export default function ODGComplianceTracker({ caseId }: ODGComplianceTrackerProps) {
  const [benchmarks, setBenchmarks] = useState<ODGBenchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [complianceScore, setComplianceScore] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchODGCompliance();
  }, [caseId]);

  const fetchODGCompliance = async () => {
    try {
      setLoading(true);

      const { data: caseData, error } = await supabase
        .from("cases")
        .select("odg_benchmarks")
        .eq("id", caseId)
        .single();

      if (error) throw error;

      const odgData = caseData?.odg_benchmarks as any || {};

      const benchmarksList: ODGBenchmark[] = [
        {
          id: "1",
          name: "Initial Assessment",
          description: "Comprehensive initial medical assessment completed within 48 hours",
          status: odgData.initialAssessment ? "compliant" : "pending",
          last_reviewed: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Conservative Care Trial",
          description: "4-6 weeks of conservative treatment before invasive procedures",
          status: odgData.conservativeCareTrial ? "compliant" : "pending",
          last_reviewed: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Imaging As Indicated",
          description: "Diagnostic imaging ordered only when clinically indicated",
          status: odgData.imagingAsIndicated ? "compliant" : "pending",
          last_reviewed: new Date().toISOString(),
        },
        {
          id: "4",
          name: "Specialist Evaluation",
          description: "Specialist consultation obtained when appropriate",
          status: odgData.specialistEvaluation ? "compliant" : "pending",
          last_reviewed: new Date().toISOString(),
        },
        {
          id: "5",
          name: "Return to Function Plan",
          description: "Active treatment plan focused on functional recovery",
          status: odgData.returnToFunctionPlan ? "compliant" : "pending",
          last_reviewed: new Date().toISOString(),
        },
      ];

      setBenchmarks(benchmarksList);

      const compliantCount = benchmarksList.filter((b) => b.status === "compliant").length;
      const score = (compliantCount / benchmarksList.length) * 100;
      setComplianceScore(score);
    } catch (error) {
      console.error("Error fetching ODG compliance:", error);
      toast({
        title: "Error",
        description: "Failed to load ODG compliance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ODGBenchmark["status"]) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "non-compliant":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "not-applicable":
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ODGBenchmark["status"]) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      compliant: { variant: "default", label: "Compliant" },
      "non-compliant": { variant: "destructive", label: "Non-Compliant" },
      pending: { variant: "secondary", label: "Pending" },
      "not-applicable": { variant: "outline", label: "N/A" },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">ODG Compliance Score</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{complianceScore.toFixed(0)}%</span>
            <span className="text-sm text-muted-foreground">
              {benchmarks.filter((b) => b.status === "compliant").length} / {benchmarks.length} Benchmarks Met
            </span>
          </div>
          <Progress value={complianceScore} className="h-3" />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">ODG Treatment Guidelines</h3>
        <div className="space-y-4">
          {benchmarks.map((benchmark) => (
            <div key={benchmark.id} className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                {getStatusIcon(benchmark.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{benchmark.name}</h4>
                    {getStatusBadge(benchmark.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{benchmark.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Last reviewed: {new Date(benchmark.last_reviewed).toLocaleDateString()}
                  </p>
                  {benchmark.notes && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded">{benchmark.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">About ODG Guidelines</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Official Disability Guidelines (ODG) provide evidence-based treatment protocols to ensure optimal patient outcomes and cost-effective care.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
