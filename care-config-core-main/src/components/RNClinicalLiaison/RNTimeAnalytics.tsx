import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Clock, TrendingUp, Activity } from "lucide-react";

interface TimeEntry {
  activity_type: string;
  time_spent_minutes: number;
  created_at: string;
}

const ACTIVITY_COLORS: Record<string, string> = {
  "medical_record_review": "hsl(var(--chart-1))",
  "provider_communication": "hsl(var(--chart-2))",
  "appointment_coordination": "hsl(var(--chart-3))",
  "treatment_plan_review": "hsl(var(--chart-4))",
  "insurance_authorization": "hsl(var(--chart-5))",
  "other": "hsl(var(--muted-foreground))"
};

const activityLabels: Record<string, string> = {
  medical_record_review: "Medical Record Review",
  provider_communication: "Provider Communication",
  appointment_coordination: "Appointment Coordination",
  treatment_plan_review: "Treatment Plan Review",
  insurance_authorization: "Insurance Authorization",
  care_plan_development: "Care Plan Development",
  client_education: "Client Education",
  documentation: "Clinical Documentation",
  case_research: "Case Research",
  team_coordination: "Team Coordination",
  other: "Other"
};

export function RNTimeAnalytics() {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [totalHours, setTotalHours] = useState(0);
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

      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabase
        .from("rn_time_entries")
        .select("activity_type, time_spent_minutes, created_at")
        .eq("rn_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (error) throw error;
      if (!data) return;

      // Process weekly data
      const weekMap = new Map<string, number>();
      const activityMap = new Map<string, number>();
      let total = 0;

      data.forEach((entry) => {
        const date = new Date(entry.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + entry.time_spent_minutes);
        activityMap.set(entry.activity_type, (activityMap.get(entry.activity_type) || 0) + entry.time_spent_minutes);
        total += entry.time_spent_minutes;
      });

      setWeeklyData(
        Array.from(weekMap.entries()).map(([week, minutes]) => ({
          week,
          hours: Math.round((minutes / 60) * 10) / 10
        }))
      );

      setActivityData(
        Array.from(activityMap.entries()).map(([activity, minutes]) => ({
          name: activityLabels[activity] || activity,
          value: Math.round((minutes / 60) * 10) / 10,
          color: ACTIVITY_COLORS[activity] || ACTIVITY_COLORS.other
        }))
      );

      setTotalHours(Math.round((total / 60) * 10) / 10);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Time Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            30-Day Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{totalHours} hours</div>
          <p className="text-sm text-muted-foreground mt-1">Total time logged in the last 30 days</p>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Time Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value) => [`${value} hours`, 'Time Spent']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Time by Activity Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={activityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}h`}
              >
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} hours`, 'Time Spent']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
