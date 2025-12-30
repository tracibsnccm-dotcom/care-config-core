import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Award, Target } from "lucide-react";

interface RNPerformanceMetricsProps {
  caseId: string;
}

export default function RNPerformanceMetrics({ caseId }: RNPerformanceMetricsProps) {
  const metrics = {
    responseTime: {
      value: 4.2,
      target: 8,
      unit: "hours",
      trend: "down",
      label: "Avg Response Time",
    },
    caseLoadCompliance: {
      value: 92,
      target: 85,
      unit: "%",
      trend: "up",
      label: "Case Load Compliance",
    },
    clientSatisfaction: {
      value: 4.7,
      target: 4.5,
      unit: "/5.0",
      trend: "up",
      label: "Client Satisfaction",
    },
    documentationQuality: {
      value: 96,
      target: 90,
      unit: "%",
      trend: "up",
      label: "Documentation Quality",
    },
  };

  const recentAchievements = [
    {
      id: "1",
      title: "Outstanding Response Time",
      description: "Maintained under 5 hour avg response time for 3 consecutive months",
      date: "2025-01-30",
    },
    {
      id: "2",
      title: "Client Satisfaction Leader",
      description: "Achieved highest client satisfaction rating in the region",
      date: "2025-01-15",
    },
  ];

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <Award className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">RN Care Manager Performance</h3>
            <p className="text-sm text-muted-foreground">Quality metrics and achievements for M. Garcia, RN CCM</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(metrics).map(([key, metric]) => (
          <Card key={key} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold">
                    {metric.value}
                    {metric.unit}
                  </span>
                  {getTrendIcon(metric.trend)}
                </div>
              </div>
              <Target className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Target: {metric.target}{metric.unit}</span>
                <span>
                  {metric.value >= metric.target ? (
                    <Badge variant="default" className="text-xs">Exceeds Target</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Below Target</Badge>
                  )}
                </span>
              </div>
              <Progress
                value={metric.unit === "hours" 
                  ? Math.min(100, (metric.target / metric.value) * 100)
                  : (metric.value / metric.target) * 100
                }
                className="h-2"
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recent Achievements</h3>
        </div>

        <div className="space-y-3">
          {recentAchievements.map((achievement) => (
            <div key={achievement.id} className="p-4 border rounded-lg bg-primary/5">
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{achievement.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(achievement.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
        <div className="flex gap-3">
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Performance Excellence</p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              This RN Case Manager consistently exceeds performance targets and maintains exceptional care quality standards.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
