import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, FileText, Calendar, CheckCircle2, AlertTriangle, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ActivityTimelineProps {
  caseId: string;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  created_at: string;
  user_name?: string;
}

export function ActivityTimeline({ caseId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`activity:${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attorney_rn_messages",
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  const fetchActivities = async () => {
    try {
      // Fetch messages
      const { data: messages } = await supabase
        .from("attorney_rn_messages")
        .select("id, message_text, created_at, sender_id, sender_role")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch tasks
      const { data: tasks } = await supabase
        .from("case_tasks")
        .select("id, title, status, created_at, updated_at")
        .eq("case_id", caseId)
        .order("updated_at", { ascending: false })
        .limit(10);

      // Fetch provider requests
      const { data: requests } = await supabase
        .from("provider_contact_requests")
        .select("id, reason, urgency, created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Combine and format activities
      const allActivities: Activity[] = [];

      messages?.forEach((msg) => {
        allActivities.push({
          id: msg.id,
          type: "message",
          title: "New Message",
          description: msg.message_text.substring(0, 100) + (msg.message_text.length > 100 ? "..." : ""),
          created_at: msg.created_at,
          user_name: msg.sender_role === "ATTORNEY" ? "You" : "RN CM",
        });
      });

      tasks?.forEach((task) => {
        allActivities.push({
          id: task.id,
          type: task.status === "completed" ? "task_completed" : "task_created",
          title: task.status === "completed" ? "Task Completed" : "New Task",
          description: task.title,
          created_at: task.status === "completed" ? task.updated_at : task.created_at,
        });
      });

      requests?.forEach((req) => {
        allActivities.push({
          id: req.id,
          type: req.urgency === "urgent" ? "urgent_request" : "request",
          title: "Provider Contact Request",
          description: req.reason.substring(0, 100) + (req.reason.length > 100 ? "..." : ""),
          created_at: req.created_at,
        });
      });

      // Sort by date
      allActivities.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(allActivities.slice(0, 15));
    } catch (error: any) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activity timeline");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle className="w-4 h-4" />;
      case "task_created":
        return <FileText className="w-4 h-4" />;
      case "task_completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "urgent_request":
        return <AlertTriangle className="w-4 h-4" />;
      case "request":
        return <Calendar className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "message":
        return "#128f8b";
      case "task_completed":
        return "#22c55e";
      case "urgent_request":
        return "#dc2626";
      case "task_created":
        return "#b09837";
      case "request":
        return "#0f2a6a";
      default:
        return "#64748b";
    }
  };

  if (loading) {
    return (
      <Card className="p-6 rounded-2xl border-2 shadow-lg">
        <p className="text-muted-foreground text-sm">Loading activity...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-2xl border-2 shadow-lg">
      <h3
        className="text-lg font-semibold mb-6"
        style={{ color: "#0f2a6a", borderBottom: "2px solid #b09837" }}
      >
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: `${getIconColor(activity.type)}20` }}
                >
                  <div style={{ color: getIconColor(activity.type) }}>
                    {getIcon(activity.type)}
                  </div>
                </div>
                {index < activities.length - 1 && (
                  <div className="w-px h-full bg-border mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(activity.created_at), "MMM d, yyyy 'at' h:mm a")}
                      {activity.user_name && ` • ${activity.user_name}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
