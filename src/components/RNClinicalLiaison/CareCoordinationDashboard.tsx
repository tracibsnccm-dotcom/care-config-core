import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, FileText, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CareCoordinationDashboardProps {
  caseId: string;
}

interface CoordinationMetrics {
  activeProviders: number;
  scheduledAppointments: number;
  pendingDocuments: number;
  completedGoals: number;
  totalGoals: number;
  upcomingTasks: Array<{
    id: string;
    title: string;
    due_date: string;
  }>;
}

export default function CareCoordinationDashboard({ caseId }: CareCoordinationDashboardProps) {
  const [metrics, setMetrics] = useState<CoordinationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, [caseId]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Fetch active providers count
      const { count: providersCount } = await supabase
        .from("case_assignments")
        .select("*", { count: "exact", head: true })
        .eq("case_id", caseId)
        .eq("role", "PROVIDER");

      // Fetch pending documents
      const { count: docsCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("case_id", caseId)
        .eq("status", "pending");

      // Fetch upcoming tasks
      const { data: tasks } = await supabase
        .from("case_tasks")
        .select("id, title, due_date")
        .eq("case_id", caseId)
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(5);

      setMetrics({
        activeProviders: providersCount || 0,
        scheduledAppointments: 0, // Placeholder
        pendingDocuments: docsCount || 0,
        completedGoals: 3, // Placeholder
        totalGoals: 5, // Placeholder
        upcomingTasks: tasks || [],
      });
    } catch (error) {
      console.error("Error fetching coordination metrics:", error);
      toast({
        title: "Error",
        description: "Failed to load care coordination data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const goalProgress = metrics ? (metrics.completedGoals / metrics.totalGoals) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Providers</p>
              <p className="text-2xl font-bold">{metrics?.activeProviders}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Scheduled Appointments</p>
              <p className="text-2xl font-bold">{metrics?.scheduledAppointments}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Documents</p>
              <p className="text-2xl font-bold">{metrics?.pendingDocuments}</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Treatment Goals</p>
              <p className="text-2xl font-bold">
                {metrics?.completedGoals}/{metrics?.totalGoals}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Treatment Goal Progress</h3>
        <Progress value={goalProgress} className="h-3 mb-2" />
        <p className="text-sm text-muted-foreground">{goalProgress.toFixed(0)}% Complete</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Tasks</h3>
        {metrics?.upcomingTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming tasks</p>
        ) : (
          <div className="space-y-3">
            {metrics?.upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
