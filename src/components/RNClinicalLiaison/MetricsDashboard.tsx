import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MetricsDashboardProps {
  caseId: string;
}

interface Metrics {
  totalMessages: number;
  pendingFollowUps: number;
  avgResponseTime: string;
  lastActivity: string;
}

export function MetricsDashboard({ caseId }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    totalMessages: 0,
    pendingFollowUps: 0,
    avgResponseTime: "N/A",
    lastActivity: "Never",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [caseId]);

  const fetchMetrics = async () => {
    try {
      // Fetch total messages
      const { count: messageCount } = await supabase
        .from("attorney_rn_messages")
        .select("*", { count: "exact", head: true })
        .eq("case_id", caseId);

      // Fetch pending follow-ups
      const { count: followUpCount } = await supabase
        .from("case_tasks")
        .select("*", { count: "exact", head: true })
        .eq("case_id", caseId)
        .neq("status", "completed");

      // Fetch last activity
      const { data: lastMessage } = await supabase
        .from("attorney_rn_messages")
        .select("created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Calculate average response time (simplified)
      const { data: messages } = await supabase
        .from("attorney_rn_messages")
        .select("created_at, sender_role")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });

      let totalResponseTime = 0;
      let responseCount = 0;

      if (messages && messages.length > 1) {
        for (let i = 1; i < messages.length; i++) {
          if (messages[i].sender_role !== messages[i - 1].sender_role) {
            const timeDiff =
              new Date(messages[i].created_at).getTime() -
              new Date(messages[i - 1].created_at).getTime();
            totalResponseTime += timeDiff;
            responseCount++;
          }
        }
      }

      const avgResponseHours =
        responseCount > 0
          ? Math.round(totalResponseTime / responseCount / (1000 * 60 * 60))
          : 0;

      setMetrics({
        totalMessages: messageCount || 0,
        pendingFollowUps: followUpCount || 0,
        avgResponseTime: avgResponseHours > 0 ? `${avgResponseHours}h` : "N/A",
        lastActivity: lastMessage
          ? new Date(lastMessage.created_at).toLocaleDateString()
          : "Never",
      });
    } catch (error: any) {
      console.error("Error fetching metrics:", error);
      toast.error("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <Card className="p-4 rounded-xl border">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 rounded-xl border animate-pulse">
            <div className="h-12 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        icon={<MessageCircle className="w-5 h-5" />}
        label="Total Messages"
        value={metrics.totalMessages}
        color="#128f8b"
      />
      <MetricCard
        icon={<AlertCircle className="w-5 h-5" />}
        label="Pending Follow-ups"
        value={metrics.pendingFollowUps}
        color="#b09837"
      />
      <MetricCard
        icon={<Clock className="w-5 h-5" />}
        label="Avg Response Time"
        value={metrics.avgResponseTime}
        color="#0f2a6a"
      />
      <MetricCard
        icon={<CheckCircle2 className="w-5 h-5" />}
        label="Last Activity"
        value={metrics.lastActivity}
        color="#22c55e"
      />
    </div>
  );
}
