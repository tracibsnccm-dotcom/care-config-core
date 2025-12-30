import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { AlertTriangle, AlertCircle, Info, X, CheckCircle } from "lucide-react";
import { RCMS } from "@/constants/brand";
import { format } from "date-fns";

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  created_at: string;
  acknowledged_by: string | null;
}

interface ClinicalAlertsPanelProps {
  caseId: string;
}

export function ClinicalAlertsPanel({ caseId }: ClinicalAlertsPanelProps) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`alerts:${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_alerts",
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("case_alerts")
        .select("*")
        .eq("case_id", caseId)
        .is("acknowledged_by", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("case_alerts")
        .update({
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Alert acknowledged");
      fetchAlerts();
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast.error("Failed to acknowledge alert");
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
      case "urgent":
        return <AlertTriangle className="w-5 h-5" />;
      case "medium":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
      case "urgent":
        return "#e74c3c";
      case "medium":
        return "#f39c12";
      default:
        return "#3498db";
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-2 shadow-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="rounded-2xl border-2 shadow-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${RCMS.brandTeal}20` }}>
            <CheckCircle className="w-5 h-5" style={{ color: RCMS.brandTeal }} />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">No Active Alerts</h4>
            <p className="text-xs text-muted-foreground">All clinical alerts have been addressed</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-2 shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm" style={{ color: RCMS.brandNavy }}>
          Clinical Alerts ({alerts.length})
        </h3>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {alerts.map((alert) => {
          const color = getSeverityColor(alert.severity);
          return (
            <div
              key={alert.id}
              className="p-3 rounded-lg border-l-4 bg-card"
              style={{ borderLeftColor: color }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5" style={{ color }}>
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color }}>
                        {alert.alert_type}
                      </p>
                      <p className="text-sm text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAcknowledge(alert.id)}
                      className="h-7 px-2"
                      title="Acknowledge alert"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
