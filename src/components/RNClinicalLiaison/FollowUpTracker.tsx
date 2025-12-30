import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { StatusBadgeRCMS } from "@/components/StatusBadgeRCMS";
import { format } from "date-fns";

interface FollowUpTrackerProps {
  caseId: string;
}

interface FollowUp {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to: string;
  updated_at: string;
  profiles?: {
    display_name: string;
  };
}

export function FollowUpTracker({ caseId }: FollowUpTrackerProps) {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFollowUps = async () => {
    try {
      const { data: tasksData, error } = await supabase
        .from("case_tasks")
        .select("*")
        .eq("case_id", caseId)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (tasksData && tasksData.length > 0) {
        const assigneeIds = [
          ...new Set(tasksData.map((t) => t.assigned_to).filter(Boolean)),
        ];

        if (assigneeIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", assigneeIds as string[]);

          const profilesMap = new Map(
            profilesData?.map((p) => [p.user_id, p]) || []
          );

          const tasksWithProfiles = tasksData.map((task) => ({
            ...task,
            profiles: task.assigned_to ? profilesMap.get(task.assigned_to) : undefined,
          }));

          setFollowUps(tasksWithProfiles as any);
        } else {
          setFollowUps(tasksData as any);
        }
      } else {
        setFollowUps([]);
      }
    } catch (error: any) {
      console.error("Error fetching follow-ups:", error);
      toast.error("Failed to load follow-ups");
    }
  };

  useEffect(() => {
    fetchFollowUps();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`followups:${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_tasks",
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchFollowUps();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  const handleResolve = async (taskId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("case_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;
      toast.success("Follow-up marked as resolved");
      fetchFollowUps();
    } catch (error: any) {
      console.error("Error resolving follow-up:", error);
      toast.error("Failed to update follow-up");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "pending") return "follow_up_needed";
    if (status === "in_progress") return "in_progress";
    if (status === "completed") return "resolved";
    return "pending";
  };

  return (
    <Card className="rounded-2xl border-2 shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-lg font-semibold mb-1"
              style={{ color: "#0f2a6a", borderBottom: "2px solid #b09837" }}
            >
              Follow-Up & Task Tracker
            </h3>
            <p className="text-sm text-muted-foreground">
              Open follow-ups linked to reports and case activities
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/cases/${caseId}`, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View in Case Detail
          </Button>
        </div>

        {followUps.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No open follow-ups</p>
            <p className="text-sm text-muted-foreground mt-1">
              All tasks are up to date
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followUps.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadgeRCMS
                      status={getStatusBadge(task.status) as any}
                      lastUpdate={format(new Date(task.updated_at), "MMM d, h:mm a")}
                    />
                  </TableCell>
                  <TableCell>
                    {task.profiles?.display_name || "Unassigned"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(task.updated_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    {task.assigned_to === user?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(task.id)}
                        disabled={loading}
                        style={{
                          borderColor: "#128f8b",
                          color: "#128f8b",
                        }}
                        className="hover:bg-[#128f8b] hover:text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: "#faf4d6" }}>
          <p className="text-sm text-foreground">
            <strong>Tip:</strong> Follow-ups sync with your dashboard summary counts and
            are linked to case reports and activities.
          </p>
        </div>
      </div>
    </Card>
  );
}
