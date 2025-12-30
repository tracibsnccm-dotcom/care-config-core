import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Heart,
  ExternalLink 
} from "lucide-react";

export function DiaryProductivityDashboard() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["productivity-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: entries, error } = await supabase
        .from("rn_diary_entries")
        .select("*")
        .eq("rn_id", user.id)
        .gte("scheduled_date", thirtyDaysAgo.toISOString().split("T")[0]);

      if (error) throw error;

      const completed = entries.filter(e => e.completion_status === "completed").length;
      const total = entries.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      const timeSpent = entries
        .filter(e => e.actual_duration_minutes)
        .reduce((sum, e) => sum + (e.actual_duration_minutes || 0), 0);

      const overdue = entries.filter(e => e.completion_status === "overdue").length;
      
      // Calculate workload intensity (entries per day average)
      const workloadIntensity = total / 30;

      return {
        totalEntries: total,
        completedEntries: completed,
        completionRate,
        timeSpentHours: Math.round(timeSpent / 60),
        overdueEntries: overdue,
        workloadIntensity: Math.round(workloadIntensity * 10) / 10,
      };
    },
    enabled: !!user?.id,
  });

  // Burnout risk calculation
  const burnoutRisk = stats ? (
    stats.workloadIntensity > 15 ? "high" :
    stats.workloadIntensity > 10 ? "medium" :
    "low"
  ) : "low";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Activity className="h-6 w-6" />
        Productivity Dashboard
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completionRate.toFixed(0)}%</div>
            <Progress value={stats?.completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.completedEntries} of {stats?.totalEntries} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Time Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {stats?.timeSpentHours}h
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {stats?.overdueEntries}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Workload Intensity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {stats?.workloadIntensity}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tasks per day (avg)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Burnout Prevention Card */}
      <Card className={`border-2 ${
        burnoutRisk === 'high' ? 'border-red-500 bg-red-50' :
        burnoutRisk === 'medium' ? 'border-orange-500 bg-orange-50' :
        'border-green-500 bg-green-50'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Wellness & Burnout Prevention
          </CardTitle>
          <CardDescription>
            Your burnout risk level: <strong className="uppercase">{burnoutRisk}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            {burnoutRisk === 'high' && (
              <div className="space-y-2">
                <p className="font-medium text-red-700">⚠️ High workload detected</p>
                <p>Your current workload is above sustainable levels. Consider delegating tasks or adjusting your schedule.</p>
              </div>
            )}
            {burnoutRisk === 'medium' && (
              <div className="space-y-2">
                <p className="font-medium text-orange-700">⚡ Moderate workload</p>
                <p>You're managing well, but monitor your energy levels and take breaks.</p>
              </div>
            )}
            {burnoutRisk === 'low' && (
              <div className="space-y-2">
                <p className="font-medium text-green-700">✓ Healthy workload</p>
                <p>Your current pace is sustainable. Keep maintaining good work-life balance.</p>
              </div>
            )}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open("https://your-burnout-prevention-ip-link.com", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Access Burnout Prevention Resources
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Learn more about our evidence-based burnout prevention strategies and wellness tools.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}