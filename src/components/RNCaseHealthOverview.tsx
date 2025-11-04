import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CaseHealth {
  status: "excellent" | "good" | "fair" | "poor";
  score: number;
  trend: "up" | "down" | "stable";
  criticalCases: number;
  stableCases: number;
  improvingCases: number;
}

export function RNCaseHealthOverview() {
  // Mock data - replace with real data from Supabase
  const health: CaseHealth = {
    status: "good",
    score: 78,
    trend: "up",
    criticalCases: 2,
    stableCases: 15,
    improvingCases: 8,
  };

  const getTrendIcon = () => {
    switch (health.trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "stable":
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Caseload Health Overview</CardTitle>
        <CardDescription>Overall status of your active cases</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Health Score</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getStatusColor()}`}>
                {health.score}%
              </span>
              {getTrendIcon()}
            </div>
          </div>
          <Progress value={health.score} className="h-2" />
          <p className={`text-sm capitalize ${getStatusColor()}`}>{health.status}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-red-600">{health.criticalCases}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-600">{health.stableCases}</p>
            <p className="text-xs text-muted-foreground">Stable</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">{health.improvingCases}</p>
            <p className="text-xs text-muted-foreground">Improving</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
