import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Clock, User, ShieldCheck, ShieldX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface AuditLogEntry {
  id: string;
  target_user_id: string;
  role: AppRole;
  action: "assigned" | "removed";
  changed_by: string;
  changed_at: string;
  target_user_email?: string;
  target_user_name?: string;
  changed_by_email?: string;
  changed_by_name?: string;
}

export function RoleAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();

    // Set up real-time subscription
    const channel = supabase
      .channel("role_audit_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "role_change_audit",
        },
        () => {
          loadAuditLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      // Get audit log entries
      const { data: auditData, error: auditError } = await supabase
        .from("role_change_audit")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(50);

      if (auditError) throw auditError;

      // Get user details for all unique user IDs
      const userIds = new Set<string>();
      auditData?.forEach((entry) => {
        userIds.add(entry.target_user_id);
        userIds.add(entry.changed_by);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", Array.from(userIds));

      const profileMap = new Map(
        profiles?.map((p) => [p.id, { email: p.email, name: p.full_name }])
      );

      // Enhance audit data with user info
      const enhancedLogs: AuditLogEntry[] =
        auditData?.map((entry) => ({
          id: entry.id,
          target_user_id: entry.target_user_id,
          role: entry.role as AppRole,
          action: entry.action as "assigned" | "removed",
          changed_by: entry.changed_by,
          changed_at: entry.changed_at,
          target_user_email: profileMap.get(entry.target_user_id)?.email,
          target_user_name: profileMap.get(entry.target_user_id)?.name,
          changed_by_email: profileMap.get(entry.changed_by)?.email,
          changed_by_name: profileMap.get(entry.changed_by)?.name,
        })) || [];

      setLogs(enhancedLogs);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Role Change Audit Log
        </CardTitle>
        <CardDescription>
          Complete history of all role assignments and removals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No audit logs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {log.action === "assigned" ? (
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <ShieldX className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          Role {log.action === "assigned" ? "Assigned" : "Removed"}
                        </span>
                      </div>

                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Target:</span>
                          <span className="font-medium">
                            {log.target_user_name || log.target_user_email || "Unknown User"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Role:</span>
                          <Badge
                            variant={
                              log.role === "SUPER_ADMIN" || log.role === "SUPER_USER"
                                ? "destructive"
                                : (log.role as string) === "RCMS_STAFF"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {log.role}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Changed by:</span>
                          <span className="font-medium">
                            {log.changed_by_name || log.changed_by_email || "System"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground text-right">
                      <div>{new Date(log.changed_at).toLocaleString()}</div>
                      <div className="mt-1">
                        {formatDistanceToNow(new Date(log.changed_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
