/**
 * RN Work Queue Page – /rn/queue
 *
 * Dedicated RN work surface with:
 * - Pending Work Queue (no initial care plan, 24h SLA with due/status/xh left)
 * - Active Work Queue (has initial care plan)
 * - RN name at top; case context safety (close panels on case switch is in CaseDetail).
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO, addHours } from "date-fns";
import { ExternalLink } from "lucide-react";

// --- Types ---

type PendingSlaStatus = "On Track" | "Due Soon" | "Urgent" | "Overdue";

interface PendingCase {
  id: string;
  case_number: string | null;
  client_name: string;
  date_of_injury: string | null;
  case_type: string | null;
  /** When the 24h SLA started (attorney_attested_at or intake/case created_at) */
  assigned_at: string;
  /** assigned_at + 24h */
  due_at: Date;
}

interface ActiveCase {
  id: string;
  case_number: string | null;
  client_name: string;
  date_of_injury: string | null;
  case_type: string | null;
}

// --- Helpers ---

function getSlaStatus(dueAt: Date): { status: PendingSlaStatus; color: string } {
  const now = new Date();
  const hoursRem = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursRem < 0) return { status: "Overdue", color: "text-red-600 bg-red-50 border-red-200" };
  if (hoursRem < 4) return { status: "Urgent", color: "text-red-600 bg-red-50 border-red-200" };
  if (hoursRem < 12) return { status: "Due Soon", color: "text-amber-700 bg-amber-50 border-amber-200" };
  return { status: "On Track", color: "text-green-700 bg-green-50 border-green-200" };
}

function getHoursLeft(dueAt: Date): string {
  const now = new Date();
  const hours = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hours < 0) return "Overdue";
  const h = Math.floor(hours);
  if (h <= 0) return "<1h left";
  return `${h}h left`;
}

// --- Page ---

export default function RNWorkQueuePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rnName, setRnName] = useState<string>("");
  const [pending, setPending] = useState<PendingCase[]>([]);
  const [active, setActive] = useState<ActiveCase[]>([]);
  /** Ticks every 60s to refresh "xh left" (no seconds, calm updates) */
  const [tick, setTick] = useState(0);

  const fetchQueue = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: rcUser, error: rcErr } = await supabase
        .from("rc_users")
        .select("id, full_name")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (rcErr) throw rcErr;
      if (!rcUser?.id) {
        setRnName("RN");
        setPending([]);
        setActive([]);
        setLoading(false);
        return;
      }
      setRnName(rcUser.full_name || "RN");
      const rcUserId = rcUser.id;

      const { data: directCases, error: casesErr } = await supabase
        .from("rc_cases")
        .select("id, case_number, date_of_injury, case_type, client_id")
        .eq("rn_cm_id", rcUserId);
      if (casesErr) throw casesErr;
      const caseIds = directCases?.map((c) => c.id) || [];
      if (caseIds.length === 0) {
        setPending([]);
        setActive([]);
        setLoading(false);
        return;
      }

      const { data: clients } = await supabase
        .from("rc_clients")
        .select("id, first_name, last_name")
        .in("id", directCases!.map((c) => c.client_id).filter(Boolean) as string[]);

      const { data: intakes } = await supabase
        .from("rc_client_intakes")
        .select("case_id, attorney_attested_at, created_at")
        .in("case_id", caseIds);

      const { data: carePlans } = await supabase
        .from("rc_care_plans")
        .select("case_id")
        .in("case_id", caseIds);
      const withCarePlan = new Set(carePlans?.map((cp) => cp.case_id) || []);

      const pendingList: PendingCase[] = [];
      const activeList: ActiveCase[] = [];

      for (const c of directCases!) {
        const client = clients?.find((cl) => cl.id === c.client_id);
        const clientName = client
          ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
          : "Unknown Client";
        const intake = intakes?.find((i) => i.case_id === c.id);
        const hasCarePlan = withCarePlan.has(c.id);
        const attested = !!intake?.attorney_attested_at;

        const assignedAt =
          intake?.attorney_attested_at || (intake as { created_at?: string })?.created_at;
        const assignedAtDate = assignedAt ? new Date(assignedAt) : new Date();
        const dueAt = addHours(assignedAtDate, 24);

        if (attested && !hasCarePlan) {
          pendingList.push({
            id: c.id,
            case_number: c.case_number,
            client_name: clientName,
            date_of_injury: c.date_of_injury,
            case_type: c.case_type,
            assigned_at: assignedAt || assignedAtDate.toISOString(),
            due_at: dueAt,
          });
        } else if (hasCarePlan) {
          activeList.push({
            id: c.id,
            case_number: c.case_number,
            client_name: clientName,
            date_of_injury: c.date_of_injury,
            case_type: c.case_type,
          });
        }
      }

      setPending(pendingList);
      setActive(activeList);
    } catch (e) {
      console.error("RNWorkQueuePage: fetch error", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchQueue();
  }, [user?.id, authLoading, fetchQueue]);

  useEffect(() => {
    const id = setInterval(() => setTick((s) => s + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const handleOpenCase = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading work queue…</p>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Please sign in to view your work queue.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Top: Page title + RN name (required) */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">RN Work Queue</h1>
          <p className="text-muted-foreground mt-1">{rnName}</p>
        </header>

        {/* Section 1: Pending Work Queue (Initial Care Plan Due < 24h) */}
        <Card className="mb-6 border-l-4 border-l-amber-500">
          <CardHeader className="bg-amber-50/50 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-amber-900">Pending Cases (Initial Care Plan Due &lt; 24h)</CardTitle>
              <Badge variant="secondary" className="bg-amber-200 text-amber-900">
                {pending.length}
              </Badge>
            </div>
            <CardDescription className="text-amber-800">Cases without initial care plan; 24-hour SLA</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {pending.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center">No pending cases.</p>
            ) : (
              <ScrollArea className="h-[320px]">
                <div className="space-y-2">
                  {pending.map((p) => {
                    const { status, color } = getSlaStatus(p.due_at);
                    const hoursLeft = getHoursLeft(p.due_at);
                    return (
                      <div
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 bg-card hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{p.case_number || p.id}</div>
                          <div className="text-xs text-muted-foreground">{p.client_name}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Due: {format(p.due_at, "MMM d, yyyy h:mm a")}
                            </span>
                            <Badge variant="outline" className={`text-xs ${color}`}>
                              {status}
                            </Badge>
                            <span className="text-xs font-medium">{hoursLeft}</span>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleOpenCase(p.id)}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Open Case
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Active Work Queue */}
        <Card>
          <CardHeader className="bg-green-50/50 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-green-900">Active Cases</CardTitle>
              <Badge variant="secondary" className="bg-green-200 text-green-900">
                {active.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
              {active.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">No active cases.</p>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2">
                    {active.map((a) => (
                      <div
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 bg-card hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{a.case_number || a.id}</div>
                          <div className="text-xs text-muted-foreground">{a.client_name}</div>
                          {a.date_of_injury && (
                            <div className="text-xs text-muted-foreground mt-1">
                              DOI: {format(parseISO(a.date_of_injury), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleOpenCase(a.id)}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Open Case
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
