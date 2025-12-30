import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, TrendingUp, CheckCircle2, Calendar } from "lucide-react";

interface Goal {
  id: string;
  goal_text: string;
  category: string;
  target_date?: string;
  current_progress: number;
  status: string;
  created_at: string;
}

interface GoalProgressDashboardProps {
  caseId: string;
}

export default function GoalProgressDashboard({ caseId }: GoalProgressDashboardProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, [caseId]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("client_goals")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");
  const averageProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.current_progress, 0) / activeGoals.length)
    : 0;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      physical: "bg-blue-500",
      mental: "bg-purple-500",
      social: "bg-green-500",
      functional: "bg-orange-500",
      pain: "bg-red-500"
    };
    return colors[category.toLowerCase()] || "bg-gray-500";
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading goals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Goals</p>
              <p className="text-2xl font-bold">{activeGoals.length}</p>
            </div>
            <Target className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed Goals</p>
              <p className="text-2xl font-bold">{completedGoals.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Progress</p>
              <p className="text-2xl font-bold">{averageProgress}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Goals</h3>
        {activeGoals.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No active goals</p>
          </Card>
        ) : (
          activeGoals.map((goal) => (
            <Card key={goal.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{goal.goal_text}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(goal.category)}>
                        {goal.category}
                      </Badge>
                      {goal.target_date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(goal.target_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{goal.current_progress}%</p>
                  </div>
                </div>
                <Progress value={goal.current_progress} className="h-2" />
              </div>
            </Card>
          ))
        )}
      </div>

      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">Completed Goals</h3>
          <div className="grid gap-3">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="p-3 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{goal.goal_text}</span>
                  </div>
                  <Badge className={getCategoryColor(goal.category)}>
                    {goal.category}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
