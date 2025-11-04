import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format, subDays, isWithinInterval } from "date-fns";

interface DiaryProductivityInsightsProps {
  entries: any[];
  rnId?: string;
}

export function DiaryProductivityInsights({ entries, rnId }: DiaryProductivityInsightsProps) {
  const insights = useMemo(() => {
    const now = new Date();
    const last7Days = entries.filter((e) =>
      isWithinInterval(new Date(e.scheduled_date), {
        start: subDays(now, 7),
        end: now
      })
    );
    const last30Days = entries.filter((e) =>
      isWithinInterval(new Date(e.scheduled_date), {
        start: subDays(now, 30),
        end: now
      })
    );

    const completionRate7d =
      last7Days.length > 0
        ? (last7Days.filter((e) => e.completion_status === "completed").length / last7Days.length) * 100
        : 0;

    const completionRate30d =
      last30Days.length > 0
        ? (last30Days.filter((e) => e.completion_status === "completed").length / last30Days.length) * 100
        : 0;

    const avgEntriesPerDay = last7Days.length / 7;

    // Most active time of day
    const timeDistribution: Record<string, number> = {};
    last7Days.forEach((entry) => {
      if (entry.scheduled_time) {
        const hour = parseInt(entry.scheduled_time.split(":")[0]);
        const period = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
        timeDistribution[period] = (timeDistribution[period] || 0) + 1;
      }
    });

    const mostActiveTime = Object.entries(timeDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Most common entry type
    const typeDistribution: Record<string, number> = {};
    last7Days.forEach((entry) => {
      typeDistribution[entry.entry_type] = (typeDistribution[entry.entry_type] || 0) + 1;
    });

    const mostCommonType = Object.entries(typeDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const overdueCount = entries.filter((e) => e.completion_status === "overdue").length;

    return {
      completionRate7d: Math.round(completionRate7d),
      completionRate30d: Math.round(completionRate30d),
      avgEntriesPerDay: avgEntriesPerDay.toFixed(1),
      mostActiveTime,
      mostCommonType,
      overdueCount,
      total7Days: last7Days.length,
      total30Days: last30Days.length
    };
  }, [entries]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-lg">Productivity Insights</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">7-Day Completion</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{insights.completionRate7d}%</p>
          <p className="text-xs text-muted-foreground">{insights.total7Days} entries</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">30-Day Completion</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{insights.completionRate30d}%</p>
          <p className="text-xs text-muted-foreground">{insights.total30Days} entries</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Avg. Entries/Day</span>
          </div>
          <p className="text-2xl font-bold">{insights.avgEntriesPerDay}</p>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{insights.overdueCount}</p>
          <p className="text-xs text-muted-foreground">Needs attention</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Most Active Time:</span>
          <Badge variant="outline">{insights.mostActiveTime}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Most Common Type:</span>
          <Badge variant="outline">{insights.mostCommonType.replace("_", " ")}</Badge>
        </div>

        {insights.completionRate7d < 70 && (
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 text-sm">
            <p className="font-medium text-orange-900 dark:text-orange-100">💡 Tip</p>
            <p className="text-orange-700 dark:text-orange-300 text-xs mt-1">
              Your completion rate could be improved. Try setting reminders or breaking down large tasks.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
