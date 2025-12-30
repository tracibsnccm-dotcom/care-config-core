import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Clock, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  time_entry_id: string;
  changed_by: string;
  changed_at: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  changer_profile?: {
    display_name: string;
  };
}

interface RNTimeAuditTrailProps {
  timeEntryId?: string;
}

export function RNTimeAuditTrail({ timeEntryId }: RNTimeAuditTrailProps) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLog();
  }, [timeEntryId]);

  async function fetchAuditLog() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("rn_time_entry_audit")
        .select(`
          *
        `)
        .order("changed_at", { ascending: false });

      if (timeEntryId) {
        query = query.eq("time_entry_id", timeEntryId);
      } else {
        // Fetch audit logs for all entries by this user
        const { data: timeEntries } = await supabase
          .from("rn_time_entries")
          .select("id")
          .eq("rn_user_id", user.id);

        const entryIds = timeEntries?.map(e => e.id) || [];
        if (entryIds.length > 0) {
          query = query.in("time_entry_id", entryIds);
        }
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = data?.map(entry => entry.changed_by).filter(Boolean) || [];
      const uniqueUserIds = [...new Set(userIds)];
      
      if (uniqueUserIds.length === 0) {
        setAuditLog([]);
        return;
      }
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", uniqueUserIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]));

      const enrichedData = data?.map(entry => ({
        ...entry,
        changer_profile: profilesMap.get(entry.changed_by)
      }));

      setAuditLog((enrichedData || []) as AuditEntry[]);
    } catch (error) {
      console.error("Error fetching audit log:", error);
    } finally {
      setLoading(false);
    }
  }

  function getActionIcon(action: string) {
    switch (action) {
      case "created":
        return <FileText className="h-4 w-4" />;
      case "updated":
        return <Edit className="h-4 w-4" />;
      case "deleted":
        return <Trash2 className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  }

  function getActionColor(action: string) {
    switch (action) {
      case "created":
        return "default";
      case "updated":
        return "secondary";
      case "deleted":
        return "destructive";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  }

  function formatFieldName(field: string): string {
    const fieldMap: Record<string, string> = {
      activity_type: "Activity Type",
      time_spent_minutes: "Time Spent",
      activity_description: "Description",
      approval_status: "Approval Status"
    };
    return fieldMap[field] || field;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading audit trail...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        {auditLog.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No audit entries found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditLog.map((entry) => (
              <div key={entry.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex-shrink-0 mt-1">
                  <Badge variant={getActionColor(entry.action) as any} className="gap-1">
                    {getActionIcon(entry.action)}
                    {entry.action}
                  </Badge>
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {entry.changer_profile?.display_name || "Unknown User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.changed_at), "MMM dd, h:mm a")}
                    </span>
                  </div>

                  {entry.field_changed && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">{formatFieldName(entry.field_changed)}:</span>
                      {entry.old_value && (
                        <span className="ml-2 line-through text-muted-foreground">{entry.old_value}</span>
                      )}
                      {entry.new_value && (
                        <span className="ml-2 font-medium">{entry.new_value}</span>
                      )}
                    </div>
                  )}

                  {entry.change_reason && (
                    <div className="text-sm text-muted-foreground italic">
                      Reason: {entry.change_reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
