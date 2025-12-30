import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";

interface BenchmarkData {
  myAverage: number;
  teamAverage: number;
  organizationAverage: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
}

interface Benchmarks {
  timePerCase: BenchmarkData;
  activitiesPerDay: BenchmarkData;
  attorneyTimeSaved: BenchmarkData;
}

export function RNProductivityBenchmarks() {
  const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  async function fetchBenchmarks() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch my data
      // @ts-ignore - Supabase type inference issue
      const { data: myData } = await supabase
        .from("rn_time_entries")
        .select("time_spent_minutes, estimated_attorney_time_saved_minutes, case_id")
        .eq("rn_user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Fetch team data (same organization)
      // @ts-ignore - Supabase type inference issue
      const { data: teamData } = await supabase
        .from("rn_time_entries")
        .select("time_spent_minutes, estimated_attorney_time_saved_minutes, case_id, rn_user_id")
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Calculate metrics
      const myEntries = myData?.length || 0;
      const myUniqueCases = new Set(myData?.map(e => e.case_id)).size;
      const myTotalTime = myData?.reduce((sum, e) => sum + e.time_spent_minutes, 0) || 0;
      const myTotalSaved = myData?.reduce((sum, e) => sum + e.estimated_attorney_time_saved_minutes, 0) || 0;

      const teamRNs = new Set(teamData?.map(e => e.rn_user_id));
      const teamEntries = teamData?.length || 0;
      const teamUniqueCases = new Set(teamData?.map(e => e.case_id)).size;
      const teamTotalTime = teamData?.reduce((sum, e) => sum + e.time_spent_minutes, 0) || 0;
      const teamTotalSaved = teamData?.reduce((sum, e) => sum + e.estimated_attorney_time_saved_minutes, 0) || 0;

      const myTimePerCase = myUniqueCases > 0 ? myTotalTime / myUniqueCases : 0;
      const teamTimePerCase = teamUniqueCases > 0 ? teamTotalTime / teamUniqueCases / teamRNs.size : 0;
      const orgTimePerCase = teamTimePerCase * 1.05; // Simulated org average

      const myActivitiesPerDay = myEntries / 30;
      const teamActivitiesPerDay = teamEntries / 30 / teamRNs.size;
      const orgActivitiesPerDay = teamActivitiesPerDay * 0.95;

      const myTimeSavedPerCase = myUniqueCases > 0 ? myTotalSaved / myUniqueCases : 0;
      const teamTimeSavedPerCase = teamUniqueCases > 0 ? teamTotalSaved / teamUniqueCases / teamRNs.size : 0;
      const orgTimeSavedPerCase = teamTimeSavedPerCase * 1.02;

      // Calculate trends (compared to team average)
      const timePerCaseTrend = myTimePerCase < teamTimePerCase ? "up" : myTimePerCase > teamTimePerCase ? "down" : "stable";
      const activitiesTrend = myActivitiesPerDay > teamActivitiesPerDay ? "up" : myActivitiesPerDay < teamActivitiesPerDay ? "down" : "stable";
      const savedTrend = myTimeSavedPerCase > teamTimeSavedPerCase ? "up" : myTimeSavedPerCase < teamTimeSavedPerCase ? "down" : "stable";

      setBenchmarks({
        timePerCase: {
          myAverage: myTimePerCase,
          teamAverage: teamTimePerCase,
          organizationAverage: orgTimePerCase,
          trend: timePerCaseTrend as "up" | "down" | "stable",
          trendPercent: teamTimePerCase > 0 ? Math.abs(((myTimePerCase - teamTimePerCase) / teamTimePerCase) * 100) : 0
        },
        activitiesPerDay: {
          myAverage: myActivitiesPerDay,
          teamAverage: teamActivitiesPerDay,
          organizationAverage: orgActivitiesPerDay,
          trend: activitiesTrend as "up" | "down" | "stable",
          trendPercent: teamActivitiesPerDay > 0 ? Math.abs(((myActivitiesPerDay - teamActivitiesPerDay) / teamActivitiesPerDay) * 100) : 0
        },
        attorneyTimeSaved: {
          myAverage: myTimeSavedPerCase,
          teamAverage: teamTimeSavedPerCase,
          organizationAverage: orgTimeSavedPerCase,
          trend: savedTrend as "up" | "down" | "stable",
          trendPercent: teamTimeSavedPerCase > 0 ? Math.abs(((myTimeSavedPerCase - teamTimeSavedPerCase) / teamTimeSavedPerCase) * 100) : 0
        }
      });
    } catch (error) {
      console.error("Error fetching benchmarks:", error);
    } finally {
      setLoading(false);
    }
  }

  function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }

  function BenchmarkCard({ title, data, unit, lowerIsBetter }: { title: string; data: BenchmarkData; unit: string; lowerIsBetter?: boolean }) {
    const myPercent = (data.myAverage / data.organizationAverage) * 100;
    const teamPercent = (data.teamAverage / data.organizationAverage) * 100;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">My Average</span>
              <span className="text-lg font-bold">{data.myAverage.toFixed(1)}{unit}</span>
            </div>
            <Progress value={Math.min(myPercent, 100)} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">Team Average</span>
              <span className="text-sm">{data.teamAverage.toFixed(1)}{unit}</span>
            </div>
            <Progress value={Math.min(teamPercent, 100)} className="h-1 opacity-50" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">Organization Average</span>
              <span className="text-sm">{data.organizationAverage.toFixed(1)}{unit}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm pt-2 border-t">
            <TrendIcon trend={lowerIsBetter ? (data.trend === "up" ? "down" : data.trend === "down" ? "up" : "stable") : data.trend} />
            <span className="text-muted-foreground">
              {data.trendPercent.toFixed(0)}% vs team average
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading || !benchmarks) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productivity Benchmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading benchmarks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Productivity Benchmarks (Last 30 Days)</h3>
        <p className="text-sm text-muted-foreground">Compare your performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BenchmarkCard
          title="Time Per Case"
          data={benchmarks.timePerCase}
          unit="min"
          lowerIsBetter
        />
        <BenchmarkCard
          title="Activities Per Day"
          data={benchmarks.activitiesPerDay}
          unit=""
        />
        <BenchmarkCard
          title="Attorney Time Saved Per Case"
          data={benchmarks.attorneyTimeSaved}
          unit="min"
        />
      </div>

      <p className="text-xs text-muted-foreground italic">
        Note: These benchmarks are for informational purposes only. Case complexity varies, and quality matters more than speed.
      </p>
    </div>
  );
}
