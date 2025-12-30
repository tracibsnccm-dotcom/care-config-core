import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, FileText, User, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuditEvent {
  id: string;
  event_type: string;
  actor_user_id?: string;
  event_meta: any;
  created_at: string;
}

interface AuditLog {
  id: number;
  action: string;
  actor_id?: string;
  actor_role?: string;
  meta: any;
  ts: string;
}

interface AuditComplianceViewerProps {
  caseId: string;
}

export default function AuditComplianceViewer({ caseId }: AuditComplianceViewerProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditData();
  }, [caseId]);

  const fetchAuditData = async () => {
    try {
      const [eventsRes, logsRes] = await Promise.all([
        supabase
          .from("audit_events")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("audit_logs")
          .select("*")
          .eq("case_id", caseId)
          .order("ts", { ascending: false })
          .limit(50)
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (logsRes.error) throw logsRes.error;

      setEvents(eventsRes.data || []);
      setLogs(logsRes.data || []);
    } catch (error: any) {
      toast.error("Failed to load audit data");
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    if (type.includes("create")) return "bg-green-500";
    if (type.includes("update")) return "bg-blue-500";
    if (type.includes("delete")) return "bg-red-500";
    if (type.includes("access")) return "bg-purple-500";
    return "bg-gray-500";
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading audit trail...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Audit Events</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">System Logs</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Compliance Status</p>
              <p className="text-lg font-bold text-green-500">Compliant</p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Audit Events ({events.length})</TabsTrigger>
          <TabsTrigger value="logs">System Logs ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <div className="space-y-3">
            {events.length === 0 ? (
              <Card className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No audit events recorded</p>
              </Card>
            ) : (
              events.map((event) => (
                <Card key={event.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getEventTypeColor(event.event_type)}>
                          {event.event_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      {event.event_meta && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Details:</p>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(event.event_meta, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="space-y-3">
            {logs.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No system logs recorded</p>
              </Card>
            ) : (
              logs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{log.action}</Badge>
                        {log.actor_role && (
                          <Badge variant="secondary">{log.actor_role}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.ts).toLocaleString()}
                        </span>
                      </div>
                      {log.meta && (
                        <div className="text-sm">
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
