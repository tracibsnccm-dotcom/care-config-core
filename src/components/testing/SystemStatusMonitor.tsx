import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

export function SystemStatusMonitor() {
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [upcomingReminders, setUpcomingReminders] = useState(0);
  const [expiringItems, setExpiringItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      // Check overdue tasks
      const { data: tasks } = await supabase.rpc('check_overdue_tasks');
      setOverdueTasks(tasks?.length || 0);

      // Check upcoming reminders
      const { data: reminders } = await supabase.rpc('check_upcoming_reminders', {
        days_ahead: 7,
      });
      setUpcomingReminders(reminders?.length || 0);

      // Check expiring items
      const { data: items } = await supabase.rpc('check_expiring_items', {
        days_ahead: 30,
      });
      setExpiringItems(items?.length || 0);
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Loading system status...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Status Monitor</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Real-time monitoring of time-sensitive items in the system
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overdue Tasks */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="font-medium">Overdue Tasks</span>
              </div>
              <Badge variant={overdueTasks > 0 ? "destructive" : "secondary"}>
                {overdueTasks}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Tasks past their due date
            </p>
          </div>

          {/* Upcoming Reminders */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Upcoming Reminders</span>
              </div>
              <Badge variant={upcomingReminders > 0 ? "default" : "secondary"}>
                {upcomingReminders}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Next 7 days
            </p>
          </div>

          {/* Expiring Items */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Expiring Soon</span>
              </div>
              <Badge variant={expiringItems > 0 ? "default" : "secondary"}>
                {expiringItems}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Next 30 days
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Testing Tips</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Simulated Time in Effect</p>
              <p className="text-sm text-muted-foreground">
                All timestamps, reminders, and time-based triggers now use simulated time when active
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Jump Time to Test Workflows</p>
              <p className="text-sm text-muted-foreground">
                Use time jumps to immediately see how reminders, expirations, and alerts trigger
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Monitor Event Log</p>
              <p className="text-sm text-muted-foreground">
                All time jumps and scenario loads are logged for tracking test progress
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
