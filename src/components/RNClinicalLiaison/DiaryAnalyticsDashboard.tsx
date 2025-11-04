import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { TrendingUp, Clock, Target, Users } from "lucide-react";
import { format, subDays, startOfWeek } from "date-fns";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function DiaryAnalyticsDashboard() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["diary-analytics", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data: entries } = await supabase
        .from("rn_diary_entries")
        .select("*")
        .eq("rn_id", user.id)
        .gte("scheduled_date", format(thirtyDaysAgo, "yyyy-MM-dd"));

      if (!entries) return null;

      // Entry type distribution
      const byType: Record<string, number> = {};
      entries.forEach(e => {
        byType[e.entry_type] = (byType[e.entry_type] || 0) + 1;
      });

      // Priority distribution
      const byPriority: Record<string, number> = {};
      entries.forEach(e => {
        byPriority[e.priority || 'medium'] = (byPriority[e.priority || 'medium'] || 0) + 1;
      });

      // Time allocation (by entry type)
      const timeAllocation: Record<string, number> = {};
      entries.forEach(e => {
        if (e.actual_duration_minutes) {
          timeAllocation[e.entry_type] = (timeAllocation[e.entry_type] || 0) + e.actual_duration_minutes;
        }
      });

      // Weekly trends
      const weeklyData: Record<string, { completed: number; total: number; week: string }> = {};
      entries.forEach(e => {
        const weekStart = startOfWeek(new Date(e.scheduled_date));
        const weekKey = format(weekStart, "MMM dd");
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { completed: 0, total: 0, week: weekKey };
        }
        weeklyData[weekKey].total++;
        if (e.completion_status === 'completed') {
          weeklyData[weekKey].completed++;
        }
      });

      return {
        byType: Object.entries(byType).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })),
        byPriority: Object.entries(byPriority).map(([name, value]) => ({ name, value })),
        timeAllocation: Object.entries(timeAllocation).map(([name, minutes]) => ({ 
          name: name.replace(/_/g, ' '), 
          hours: Math.round(minutes / 60 * 10) / 10 
        })),
        weeklyTrends: Object.values(weeklyData),
        totalEntries: entries.length,
        completedEntries: entries.filter(e => e.completion_status === 'completed').length,
        avgTimePerEntry: entries.filter(e => e.actual_duration_minutes).length > 0 
          ? Math.round(entries.reduce((sum, e) => sum + (e.actual_duration_minutes || 0), 0) / 
              entries.filter(e => e.actual_duration_minutes).length)
          : 0
      };
    },
    enabled: !!user?.id,
  });

  // Fetch team comparison data
  const { data: teamComparison } = useQuery({
    queryKey: ["team-comparison", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: allRNs } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "RN_CCM");

      if (!allRNs) return null;

      const thirtyDaysAgo = subDays(new Date(), 30);
      const teamData = await Promise.all(
        allRNs.map(async (rn) => {
          const { data: entries, count } = await supabase
            .from("rn_diary_entries")
            .select("*", { count: 'exact' })
            .eq("rn_id", rn.user_id)
            .gte("scheduled_date", format(thirtyDaysAgo, "yyyy-MM-dd"));

          const completed = entries?.filter(e => e.completion_status === 'completed').length || 0;
          
          return {
            rnId: rn.user_id,
            total: count || 0,
            completed,
            rate: count ? Math.round((completed / count) * 100) : 0
          };
        })
      );

      const myData = teamData.find(d => d.rnId === user.id);
      const teamAvg = teamData.reduce((sum, d) => sum + d.rate, 0) / teamData.length;

      return {
        myRate: myData?.rate || 0,
        teamAvg: Math.round(teamAvg),
        myRank: teamData.sort((a, b) => b.rate - a.rate).findIndex(d => d.rnId === user.id) + 1,
        totalRNs: teamData.length
      };
    },
    enabled: !!user?.id,
  });

  if (!analytics) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Total Entries</h3>
          </div>
          <p className="text-3xl font-bold">{analytics.totalEntries}</p>
          <p className="text-sm text-muted-foreground">Last 30 days</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Completion Rate</h3>
          </div>
          <p className="text-3xl font-bold">
            {Math.round((analytics.completedEntries / analytics.totalEntries) * 100)}%
          </p>
          <p className="text-sm text-muted-foreground">
            {analytics.completedEntries} completed
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Avg Time/Entry</h3>
          </div>
          <p className="text-3xl font-bold">{analytics.avgTimePerEntry}m</p>
          <p className="text-sm text-muted-foreground">Average duration</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Team Ranking</h3>
          </div>
          <p className="text-3xl font-bold">
            #{teamComparison?.myRank || '-'} / {teamComparison?.totalRNs || '-'}
          </p>
          <p className="text-sm text-muted-foreground">
            Team avg: {teamComparison?.teamAvg || 0}%
          </p>
        </Card>
      </div>

      <Tabs defaultValue="types" className="w-full">
        <TabsList>
          <TabsTrigger value="types">Entry Types</TabsTrigger>
          <TabsTrigger value="time">Time Allocation</TabsTrigger>
          <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
          <TabsTrigger value="priority">Priority Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Entry Distribution by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.byType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Time Spent by Entry Type (Hours)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.timeAllocation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Weekly Completion Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Entries by Priority</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.byPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
