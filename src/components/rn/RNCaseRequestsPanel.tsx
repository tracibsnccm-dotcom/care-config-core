import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface CaseRequest {
  id: string;
  case_id: string;
  request_type: string;
  priority: string;
  due_at: string | null;
  status: string;
  subject: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

interface CaseRequestUpdate {
  id: string;
  request_id: string;
  author_role: string;
  body: string;
  created_at: string;
}

interface RNCaseRequestsPanelProps {
  caseId: string;
}

export function RNCaseRequestsPanel({ caseId }: RNCaseRequestsPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [updatesByRequestId, setUpdatesByRequestId] = useState<Record<string, CaseRequestUpdate[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyByRequestId, setReplyByRequestId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers = () => ({ apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` });

  const fetchData = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/rc_case_requests?case_id=eq.${caseId}&order=created_at.desc`,
        { headers: headers() }
      );
      if (!r.ok) {
        setRequests([]);
        return;
      }
      const list: CaseRequest[] = await r.json();
      setRequests(list || []);
      const map: Record<string, CaseRequestUpdate[]> = {};
      for (const req of list || []) {
        const u = await fetch(
          `${supabaseUrl}/rest/v1/rc_case_request_updates?request_id=eq.${req.id}&order=created_at.asc`,
          { headers: headers() }
        );
        map[req.id] = u.ok ? (await u.json()) || [] : [];
      }
      setUpdatesByRequestId(map);
    } catch (e) {
      console.error("RNCaseRequestsPanel: fetch", e);
      setRequests([]);
      setUpdatesByRequestId({});
    } finally {
      setLoading(false);
    }
  }, [caseId, supabaseUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const postUpdate = async (requestId: string) => {
    const body = (replyByRequestId[requestId] || "").trim();
    if (!body || !user?.id) {
      toast({ title: "Error", description: "Message and sign-in are required.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const req = await fetch(`${supabaseUrl}/rest/v1/rc_case_request_updates`, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          request_id: requestId,
          case_id: caseId,
          author_user_id: user.id,
          author_role: "rn",
          body,
        }),
      });
      if (!req.ok) {
        const t = await req.text();
        throw new Error(t || "Failed to post update");
      }
      const reqRow = requests.find((r) => r.id === requestId);
      if (reqRow && reqRow.status === "OPEN") {
        await fetch(`${supabaseUrl}/rest/v1/rc_case_requests?id=eq.${requestId}`, {
          method: "PATCH",
          headers: { ...headers(), "Content-Type": "application/json" },
          body: JSON.stringify({ status: "RESPONDED", responded_at: new Date().toISOString() }),
        });
      }
      setReplyByRequestId((prev) => ({ ...prev, [requestId]: "" }));
      toast({ title: "Update posted", description: "Your response has been added." });
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to post update", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-slate-600">Loading requests…</div>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          Clinical Requests & Updates
        </CardTitle>
        <p className="text-slate-600 text-sm">View attorney requests and add your responses.</p>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">No requests for this case yet.</div>
        ) : (
          <ScrollArea className="h-[360px]">
            <div className="space-y-3 pr-2">
              {requests.map((r) => {
                const updates = updatesByRequestId[r.id] || [];
                const isExpanded = expandedId === r.id;
                const reply = replyByRequestId[r.id] ?? "";
                return (
                  <div key={r.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-full text-left p-3 hover:bg-slate-50 flex justify-between items-start"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      <div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          <Badge
                            className={
                              r.status === "OPEN" ? "bg-amber-500" : r.status === "RESPONDED" ? "bg-green-600" : "bg-slate-400"
                            }
                          >
                            {r.status}
                          </Badge>
                          <Badge variant="outline">{r.priority}</Badge>
                          <span className="text-slate-600 text-xs">{r.request_type}</span>
                        </div>
                        <p className="font-medium text-slate-800">{r.subject || r.request_type}</p>
                        <p className="text-slate-600 text-sm truncate">{r.body.slice(0, 80)}{r.body.length > 80 ? "…" : ""}</p>
                      </div>
                      <span className="text-slate-400 text-sm">{isExpanded ? "▼" : "▶"}</span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-200 p-3 bg-slate-50/50">
                        <p className="text-slate-700 text-sm whitespace-pre-wrap mb-3">{r.body}</p>
                        <p className="text-xs text-slate-500 mb-2">
                          Created {format(new Date(r.created_at), "MMM d, yyyy 'at' h:mm a")}
                          {r.responded_at && ` · Responded ${format(new Date(r.responded_at), "MMM d")}`}
                        </p>
                        {updates.length > 0 && (
                          <div className="space-y-2 mb-3">
                            <p className="text-xs font-medium text-slate-600">Updates</p>
                            {updates.map((u) => (
                              <div
                                key={u.id}
                                className={`p-2 rounded text-sm ${
                                  u.author_role === "rn" ? "bg-green-50 border border-green-200" : "bg-slate-100 border border-slate-200"
                                }`}
                              >
                                <span className="font-medium text-slate-700">{u.author_role === "rn" ? "You" : "Attorney"}</span>
                                <span className="text-slate-500 text-xs ml-2">{format(new Date(u.created_at), "MMM d, h:mm a")}</span>
                                <p className="text-slate-700 whitespace-pre-wrap mt-1">{u.body}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                          <Textarea
                            value={reply}
                            onChange={(e) => setReplyByRequestId((prev) => ({ ...prev, [r.id]: e.target.value }))}
                            placeholder="Add your response…"
                            rows={2}
                            className="border-slate-200 mb-2"
                          />
                          <Button size="sm" onClick={() => postUpdate(r.id)} disabled={!reply.trim() || sending}>
                            Post Update
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
