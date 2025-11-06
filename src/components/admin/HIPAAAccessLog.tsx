import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, CheckCircle, Clock, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface HIPAAAccessAttempt {
  id: string;
  user_id: string;
  user_role: string;
  case_id: string | null;
  feature_attempted: string;
  access_granted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  attempted_at: string;
  created_at: string;
}

export function HIPAAAccessLog() {
  const [attempts, setAttempts] = useState<HIPAAAccessAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "denied" | "granted">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchCaseId, setSearchCaseId] = useState("");

  useEffect(() => {
    fetchAttempts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("hipaa_access_attempts_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hipaa_access_attempts",
        },
        (payload) => {
          setAttempts((prev) => [payload.new as HIPAAAccessAttempt, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchAttempts() {
    setLoading(true);
    try {
      let query = supabase
        .from("hipaa_access_attempts")
        .select("*")
        .order("attempted_at", { ascending: false })
        .limit(100);

      if (filter === "denied") {
        query = query.eq("access_granted", false);
      } else if (filter === "granted") {
        query = query.eq("access_granted", true);
      }

      if (roleFilter !== "all") {
        query = query.eq("user_role", roleFilter);
      }

      if (searchCaseId) {
        query = query.ilike("case_id", `%${searchCaseId}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error("Error fetching HIPAA access attempts:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAttempts();
  }, [filter, roleFilter, searchCaseId]);

  const deniedCount = attempts.filter((a) => !a.access_granted).length;
  const grantedCount = attempts.filter((a) => a.access_granted).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attempts.length}</div>
            <p className="text-xs text-muted-foreground">Last 100 attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Denied</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{deniedCount}</div>
            <p className="text-xs text-muted-foreground">Blocked access attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Granted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{grantedCount}</div>
            <p className="text-xs text-muted-foreground">Authorized access</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            HIPAA Access Attempt Log
          </CardTitle>
          <CardDescription>
            Comprehensive audit trail of all access attempts to protected health information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attempts</SelectItem>
                <SelectItem value="denied">Access Denied</SelectItem>
                <SelectItem value="granted">Access Granted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="RCMS_STAFF">RCMS Staff</SelectItem>
                <SelectItem value="CLINICAL_STAFF_EXTERNAL">Clinical Staff</SelectItem>
                <SelectItem value="PROVIDER">Provider</SelectItem>
                <SelectItem value="RN_CM">RN Care Manager</SelectItem>
                <SelectItem value="ATTORNEY">Attorney</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search by Case ID..."
              value={searchCaseId}
              onChange={(e) => setSearchCaseId(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Loading access logs...
                </div>
              ) : attempts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Filter className="mb-2 h-8 w-8" />
                  <p>No access attempts found</p>
                </div>
              ) : (
                attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className="mt-1">
                      {attempt.access_granted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={attempt.access_granted ? "default" : "destructive"}>
                          {attempt.user_role}
                        </Badge>
                        <Badge variant="outline">{attempt.feature_attempted}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(attempt.attempted_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">User ID:</span>{" "}
                        <span className="font-mono text-xs">{attempt.user_id}</span>
                      </div>
                      {attempt.case_id && (
                        <div className="text-sm">
                          <span className="font-medium">Case ID:</span>{" "}
                          <span className="font-mono text-xs">{attempt.case_id}</span>
                        </div>
                      )}
                      {attempt.metadata && Object.keys(attempt.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Context:</span>{" "}
                          {attempt.metadata.user_org_type && (
                            <span className="ml-1">
                              {attempt.metadata.user_org_type}
                            </span>
                          )}
                          {attempt.metadata.elevated_access && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Elevated Access
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={attempt.access_granted ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {attempt.access_granted ? "GRANTED" : "DENIED"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
