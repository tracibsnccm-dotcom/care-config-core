import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, FileText, Clock } from "lucide-react";

export function DiaryQualityChecker({ entryId }: { entryId?: string }) {
  const { data: qualityScore } = useQuery({
    queryKey: ["quality-score", entryId],
    queryFn: async () => {
      if (!entryId) return null;

      // Calculate quality score using the database function
      const { data, error } = await supabase.rpc("calculate_entry_quality_score", {
        p_entry_id: entryId
      });

      if (error) throw error;
      return data as {
        completeness_score: number;
        timeliness_score: number;
        documentation_quality: number;
        compliance_flags: Array<{ type: string; message: string }>;
        overall_score: number;
      };
    },
    enabled: !!entryId,
  });

  if (!qualityScore) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: "default" as const, label: "Excellent" };
    if (score >= 60) return { variant: "secondary" as const, label: "Good" };
    return { variant: "destructive" as const, label: "Needs Improvement" };
  };

  const overallBadge = getScoreBadge(qualityScore.overall_score);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="font-semibold">Documentation Quality</h3>
          </div>
          <Badge variant={overallBadge.variant}>
            {overallBadge.label}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(qualityScore.overall_score)}`}>
                {Math.round(qualityScore.overall_score)}%
              </span>
            </div>
            <Progress value={qualityScore.overall_score} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Completeness</span>
              </div>
              <div className="flex items-center justify-between">
                <Progress value={qualityScore.completeness_score} className="h-2 flex-1 mr-2" />
                <span className="text-sm font-bold">{qualityScore.completeness_score}%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Timeliness</span>
              </div>
              <div className="flex items-center justify-between">
                <Progress value={qualityScore.timeliness_score} className="h-2 flex-1 mr-2" />
                <span className="text-sm font-bold">{qualityScore.timeliness_score}%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Documentation</span>
              </div>
              <div className="flex items-center justify-between">
                <Progress value={qualityScore.documentation_quality} className="h-2 flex-1 mr-2" />
                <span className="text-sm font-bold">{qualityScore.documentation_quality}%</span>
              </div>
            </div>
          </div>

          {qualityScore.compliance_flags && qualityScore.compliance_flags.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Compliance Flags</span>
              </div>
              <div className="space-y-2">
                {qualityScore.compliance_flags.map((flag: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        {flag.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        {flag.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> To improve your score, ensure all required fields are completed, 
              add detailed descriptions, and log entries promptly after completion.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
