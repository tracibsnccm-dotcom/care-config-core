import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, CheckCircle2, Clock, TrendingUp, Users, AlertCircle } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

interface AnalyticsData {
  totalEntries: number;
  completedEntries: number;
  pendingEntries: number;
  overdueEntries: number;
  completionRate: number;
  avgResponseTime: number;
  entriesByType: Array<{ name: string; value: number }>;
  completionTrend: Array<{ date: string; completed: number; pending: number }>;
  rnPerformance: Array<{ name: string; completionRate: number; totalEntries: number }>;
}

export function DiaryAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("7");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = subDays(new Date(), days).toISOString().split("T")[0];

      // Fetch entries for the time range
      const { data: entries, error } = await supabase
        .from("rn_diary_entries")
        .select(`
          id,
          entry_type,
          completion_status,
          scheduled_date,
          created_at,
          completed_at,
          rn_id,
          profiles!rn_id(display_name)
        `)
        .gte("scheduled_date", startDate);

      if (error) throw error;

      // Calculate metrics
      const total = entries?.length || 0;
      const completed = entries?.filter((e) => e.completion_status === "completed").length || 0;
      const pending = entries?.filter((e) => e.completion_status === "pending").length || 0;
      const overdue = entries?.filter((e) => e.completion_status === "overdue").length || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate average response time (time from creation to completion)
      const completedWithTime = entries?.filter(
        (e) => e.completion_status === "completed" && e.completed_at && e.created_at
      );
      const avgResponseTime =
        completedWithTime && completedWithTime.length > 0
          ? completedWithTime.reduce((sum, e) => {
              const diff =
                new Date(e.completed_at!).getTime() - new Date(e.created_at).getTime();
              return sum + diff / (1000 * 60 * 60); // Convert to hours
            }, 0) / completedWithTime.length
          : 0;

      // Entries by type
      const typeGroups = entries?.reduce((acc, e) => {
        const type = e.entry_type || "other";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const entriesByType = Object.entries(typeGroups || {}).map(([name, value]) => ({
        name: name.replace("_", " "),
        value,
      }));

      // Completion trend (last 7 days)
      const trendDays = 7;
      const completionTrend = Array.from({ length: trendDays }, (_, i) => {
        const date = subDays(new Date(), trendDays - i - 1);
        const dateStr = format(date, "MMM dd");
        const dayEntries = entries?.filter(
          (e) => format(new Date(e.scheduled_date), "MMM dd") === dateStr
        );
        return {
          date: dateStr,
          completed: dayEntries?.filter((e) => e.completion_status === "completed").length || 0,
          pending: dayEntries?.filter((e) => e.completion_status === "pending").length || 0,
        };
      });

      // RN performance
      const rnGroups = entries?.reduce((acc, e) => {
        const rnName = (e.profiles as any)?.display_name || "Unknown";
        if (!acc[rnName]) {
          acc[rnName] = { total: 0, completed: 0 };
        }
        acc[rnName].total++;
        if (e.completion_status === "completed") {
          acc[rnName].completed++;
        }
        return acc;
      }, {} as Record<string, { total: number; completed: number }>);

      const rnPerformance = Object.entries(rnGroups || {})
        .map(([name, stats]) => ({
          name,
          completionRate: Math.round((stats.completed / stats.total) * 100),
          totalEntries: stats.total,
        }))
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, 10);

      setAnalytics({
        totalEntries: total,
        completedEntries: completed,
        pendingEntries: pending,
        overdueEntries: overdue,
        completionRate,
        avgResponseTime: Math.round(avgResponseTime),
        entriesByType,
        completionTrend,
        rnPerformance,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Diary Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEntries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completedEntries} of {analytics.totalEntries}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgResponseTime}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{analytics.overdueEntries}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Trend</CardTitle>
            <CardDescription>Daily completed vs pending entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.completionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Entries by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Entries by Type</CardTitle>
            <CardDescription>Distribution of entry types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.entriesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.entriesByType.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* RN Performance */}
      <Card>
        <CardHeader>
          <CardTitle>RN Performance</CardTitle>
          <CardDescription>Completion rates by RN Case Manager</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.rnPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completionRate" fill="#3b82f6" name="Completion Rate %" />
              <Bar dataKey="totalEntries" fill="#10b981" name="Total Entries" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}