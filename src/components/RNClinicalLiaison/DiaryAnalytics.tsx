import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface CompletionStats {
  total: number;
  completed: number;
  overdue: number;
  onTime: number;
  onTimeRate: number;
}

interface EntryTypeStats {
  type: string;
  count: number;
  completionRate: number;
}

export function DiaryAnalytics() {
  const [stats, setStats] = useState<CompletionStats | null>(null);
  const [typeStats, setTypeStats] = useState<EntryTypeStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // @ts-ignore
      const { data: entries } = await supabase
        .from("rn_diary_entries")
        .select("*")
        .eq("rn_id", user.id)
        .gte("scheduled_date", thirtyDaysAgo.toISOString().split('T')[0]);

      if (!entries) return;

      // Calculate completion stats
      const total = entries.length;
      const completed = entries.filter((e: any) => e.completion_status === "completed").length;
      const overdue = entries.filter((e: any) => e.completion_status === "overdue").length;
      
      // Calculate on-time completions
      const onTime = entries.filter((e: any) => {
        if (e.completion_status !== "completed" || !e.completed_at) return false;
        const scheduledDateTime = new Date(e.scheduled_date + (e.scheduled_time ? `T${e.scheduled_time}` : ""));
        return new Date(e.completed_at) <= scheduledDateTime;
      }).length;

      const onTimeRate = completed > 0 ? (onTime / completed) * 100 : 0;

      setStats({
        total,
        completed,
        overdue,
        onTime,
        onTimeRate
      });

      // Calculate stats by entry type
      const typeMap = new Map<string, { total: number; completed: number }>();

      entries.forEach((e: any) => {
        const type = e.entry_type;
        const current = typeMap.get(type) || { total: 0, completed: 0 };
        current.total++;
        if (e.completion_status === "completed") current.completed++;
        typeMap.set(type, current);
      });

      const typeStatsArray: EntryTypeStats[] = Array.from(typeMap.entries()).map(([type, data]) => ({
        type: type.replace(/_/g, " "),
        count: data.total,
        completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0
      }));

      setTypeStats(typeStatsArray);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Completion Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">{stats.onTimeRate.toFixed(0)}%</div>
              <p className="text-sm text-muted-foreground">On-Time Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate by Entry Type */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Rate by Entry Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="type" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Completion Rate']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="completionRate" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Completion Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm font-bold">
                {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} className="h-3" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">On-Time Completion Rate</span>
              <span className="text-sm font-bold text-primary">{stats.onTimeRate.toFixed(1)}%</span>
            </div>
            <Progress value={stats.onTimeRate} className="h-3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
