import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, ListTodo } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";

interface DiaryQuickStatsProps {
  rnId?: string;
  date?: Date;
}

export function DiaryQuickStats({ rnId, date = new Date() }: DiaryQuickStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["diary-quick-stats", rnId, format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      let query = supabase
        .from("rn_diary_entries")
        .select("completion_status, priority, requires_approval, approval_status")
        .gte("scheduled_date", startDate.toISOString())
        .lte("scheduled_date", endDate.toISOString());

      if (rnId) {
        query = query.eq("rn_id", rnId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const completed = data.filter((e) => e.completion_status === "completed").length;
      const pending = data.filter((e) => e.completion_status === "pending").length;
      const overdue = data.filter((e) => e.completion_status === "overdue").length;
      const needsApproval = data.filter(
        (e) => e.requires_approval && e.approval_status === "pending"
      ).length;
      const high_priority = data.filter((e) => e.priority === "high").length;

      return {
        total: data.length,
        completed,
        pending,
        overdue,
        needsApproval,
        high_priority,
      };
    },
  });

  if (isLoading || !stats) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Today's Overview</h3>
        <Badge variant="outline">{format(date, "MMM d")}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ListTodo className="h-4 w-4" />
            <span className="text-xs">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">Done</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Pending</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Approval</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.needsApproval}</p>
        </div>
      </div>

      {stats.high_priority > 0 && (
        <div className="mt-3 pt-3 border-t">
          <Badge variant="destructive" className="text-xs">
            {stats.high_priority} high priority {stats.high_priority === 1 ? "item" : "items"}
          </Badge>
        </div>
      )}
    </Card>
  );
}
