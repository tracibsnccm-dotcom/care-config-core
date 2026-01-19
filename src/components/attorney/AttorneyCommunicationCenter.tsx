import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Calendar, MessageSquare, Plus, Inbox } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";

// Gate: fallback "Select a case" for testing only in dev or when VITE_ENABLE_DEMO is true.
// In production, the fallback UI is hidden.
const allowUnassignedCaseSelect =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === "true";

// localStorage key for the fallback-selected case (used when 0 assigned cases).
const FALLBACK_CASE_KEY = "rcms_attorney_comm_fallback_case_id";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Case {
  id: string;
  case_number: string | null;
  client_id: string;
  client_name?: string;
}

interface CaseRequest {
  id: string;
  case_id: string;
  created_by_user_id: string | null;
  created_by_role: string;
  request_type: string;
  priority: string;
  due_at: string | null;
  status: string;
  subject: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  closed_at: string | null;
}

interface CaseRequestUpdate {
  id: string;
  request_id: string;
  case_id: string;
  author_user_id: string | null;
  author_role: string;
  body: string;
  created_at: string;
}

const REQUEST_TYPES = ["Clarification", "Record Gap", "Timeline", "Clinical Summary", "Other"] as const;
const PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;

function mapCase(c: any): Case {
  return {
    id: c.id,
    case_number: c.case_number,
    client_id: c.client_id,
    client_name: c.rc_clients
      ? `${c.rc_clients.first_name || ""} ${c.rc_clients.last_name || ""}`.trim()
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AttorneyCommunicationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"requests" | "all-activity">("requests");
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [updatesByRequestId, setUpdatesByRequestId] = useState<Record<string, CaseRequestUpdate[]>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [addUpdateBody, setAddUpdateBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Fallback case list when 0 assigned (gated by allowUnassignedCaseSelect)
  const [fallbackCases, setFallbackCases] = useState<Case[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const hasTriedRestore = useRef(false);

  // Create Request form: request_type, priority, body only
  const [formType, setFormType] = useState<string>(REQUEST_TYPES[0]);
  const [formPriority, setFormPriority] = useState<string>("Normal");
  const [formBody, setFormBody] = useState("");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers = () => ({ apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` });

  // -------------------------------------------------------------------------
  // Fetch cases: rc_case_assignments (fallback case_assignments), then rc_cases
  // Only set COMM-FETCH-ERROR when the query truly errors (!res.ok), not for empty []
  // When we get assigned cases, clear the fallback localStorage.
  // -------------------------------------------------------------------------
  const fetchCases = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      let r = await fetch(
        `${supabaseUrl}/rest/v1/rc_case_assignments?user_id=eq.${user.id}&status=eq.active&select=case_id`,
        { headers: headers() }
      );
      if (!r.ok) {
        r = await fetch(
          `${supabaseUrl}/rest/v1/case_assignments?user_id=eq.${user.id}&role=eq.ATTORNEY&select=case_id`,
          { headers: headers() }
        );
      }
      if (!r.ok) {
        setErrorCode("COMM-FETCH-ERROR");
        setCases([]);
        setLoading(false);
        return;
      }
      const assignments = (await r.json()) || [];
      const caseIds = assignments.map((a: { case_id?: string }) => a.case_id).filter(Boolean);
      if (caseIds.length === 0) {
        setCases([]);
        setErrorCode(null);
        setLoading(false);
        return;
      }
      let casesRes = await fetch(
        `${supabaseUrl}/rest/v1/rc_cases?id=in.(${caseIds.join(",")})&is_superseded=eq.false&select=id,case_number,client_id,rc_clients(first_name,last_name)&order=case_number.asc`,
        { headers: headers() }
      );
      if (!casesRes.ok) {
        casesRes = await fetch(
          `${supabaseUrl}/rest/v1/rc_cases?id=in.(${caseIds.join(",")})&is_superseded=eq.false&select=id,case_number,client_id&order=case_number.asc`,
          { headers: headers() }
        );
      }
      if (!casesRes.ok) {
        setErrorCode("COMM-FETCH-ERROR");
        setCases([]);
        setLoading(false);
        return;
      }
      const data = (await casesRes.json()) || [];
      setCases(data.map(mapCase));
      setErrorCode(null);
      try {
        localStorage.removeItem(FALLBACK_CASE_KEY);
      } catch (_) {}
    } catch (e) {
      console.error("AttorneyCommunicationCenter: fetchCases", e);
      setErrorCode("COMM-FETCH-ERROR");
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabaseUrl]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // -------------------------------------------------------------------------
  // Restore: when 0 assigned and gated, try to restore last fallback-selected case from localStorage.
  // Run once. On success set cases + selectedCaseId; on failure clear localStorage.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (loading || cases.length > 0 || !allowUnassignedCaseSelect || hasTriedRestore.current) return;
    hasTriedRestore.current = true;
    const stored = typeof window !== "undefined" ? localStorage.getItem(FALLBACK_CASE_KEY) : null;
    if (!stored?.trim()) return;
    (async () => {
      try {
        let res = await fetch(
          `${supabaseUrl}/rest/v1/rc_cases?id=eq.${stored}&is_superseded=eq.false&select=id,case_number,client_id,rc_clients(first_name,last_name)`,
          { headers: headers() }
        );
        if (!res.ok) {
          res = await fetch(
            `${supabaseUrl}/rest/v1/rc_cases?id=eq.${stored}&is_superseded=eq.false&select=id,case_number,client_id`,
            { headers: headers() }
          );
        }
        if (!res.ok) {
          localStorage.removeItem(FALLBACK_CASE_KEY);
          return;
        }
        const arr = (await res.json()) || [];
        if (arr.length === 0) {
          localStorage.removeItem(FALLBACK_CASE_KEY);
          return;
        }
        const c = mapCase(arr[0]);
        setCases([c]);
        setSelectedCaseId(c.id);
      } catch (_) {
        try {
          localStorage.removeItem(FALLBACK_CASE_KEY);
        } catch (_) {}
      }
    })();
  }, [loading, cases.length, supabaseUrl]);

  // -------------------------------------------------------------------------
  // Fetch fallback case list (recent rc_cases) when 0 assigned and gated. Used for "Select a case" testing.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (cases.length > 0 || !allowUnassignedCaseSelect) return;
    setFallbackLoading(true);
    (async () => {
      try {
        let res = await fetch(
          `${supabaseUrl}/rest/v1/rc_cases?is_superseded=eq.false&select=id,case_number,client_id,rc_clients(first_name,last_name)&order=created_at.desc&limit=50`,
          { headers: headers() }
        );
        if (!res.ok) {
          res = await fetch(
            `${supabaseUrl}/rest/v1/rc_cases?is_superseded=eq.false&select=id,case_number,client_id&order=created_at.desc&limit=50`,
            { headers: headers() }
          );
        }
        if (res.ok) {
          const data = (await res.json()) || [];
          setFallbackCases(data.map(mapCase));
        } else {
          setFallbackCases([]);
        }
      } catch (_) {
        setFallbackCases([]);
      } finally {
        setFallbackLoading(false);
      }
    })();
  }, [cases.length, supabaseUrl]);

  // -------------------------------------------------------------------------
  // Fetch requests for selected case from rc_case_requests
  // -------------------------------------------------------------------------
  const fetchRequests = useCallback(async () => {
    if (!selectedCaseId) {
      setRequests([]);
      setUpdatesByRequestId({});
      return;
    }
    setRequestsLoading(true);
    try {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/rc_case_requests?case_id=eq.${selectedCaseId}&order=created_at.desc`,
        { headers: headers() }
      );
      if (!r.ok) {
        setRequests([]);
        setUpdatesByRequestId({});
        setRequestsLoading(false);
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
        if (u.ok) {
          map[req.id] = (await u.json()) || [];
        } else {
          map[req.id] = [];
        }
      }
      setUpdatesByRequestId(map);
    } catch (e) {
      console.error("AttorneyCommunicationCenter: fetchRequests", e);
      setRequests([]);
      setUpdatesByRequestId({});
    } finally {
      setRequestsLoading(false);
    }
  }, [selectedCaseId, supabaseUrl]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async () => {
    if (!selectedCaseId || !formBody.trim() || !user?.id) {
      toast({ title: "Error", description: "Case, message, and sign-in are required.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rc_case_requests`, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          case_id: selectedCaseId,
          created_by_user_id: user.id,
          created_by_role: "attorney",
          request_type: formType,
          priority: formPriority,
          body: formBody.trim(),
          subject: null,
          due_at: null,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to create request");
      }
      setNewRequestOpen(false);
      setFormBody("");
      setFormType(REQUEST_TYPES[0]);
      setFormPriority("Normal");
      toast({ title: "Request created", description: "Your clinical request has been submitted." });
      fetchRequests();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create request", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const addUpdate = async () => {
    if (!selectedRequestId || !addUpdateBody.trim() || !selectedCaseId || !user?.id) {
      toast({ title: "Error", description: "Request, message, and sign-in are required.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rc_case_request_updates`, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          request_id: selectedRequestId,
          case_id: selectedCaseId,
          author_user_id: user.id,
          author_role: "attorney",
          body: addUpdateBody.trim(),
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to add update");
      }
      setAddUpdateBody("");
      toast({ title: "Update added", description: "Your update has been posted." });
      fetchRequests();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to add update", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const allActivityItems: { kind: "request" | "update"; createdAt: string; req: CaseRequest; update?: CaseRequestUpdate }[] = [];
  for (const req of requests) {
    allActivityItems.push({ kind: "request", createdAt: req.created_at, req });
    for (const u of updatesByRequestId[req.id] || []) {
      allActivityItems.push({ kind: "update", createdAt: u.created_at, req, update: u });
    }
  }
  allActivityItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const selectedRequest = selectedRequestId ? requests.find((r) => r.id === selectedRequestId) : null;
  const selectedUpdates = selectedRequestId ? (updatesByRequestId[selectedRequestId] || []) : [];

  // -------------------------------------------------------------------------
  // No assigned cases: premium state + CTA + gated fallback selector
  // -------------------------------------------------------------------------
  const handleFallbackCaseSelect = (caseId: string) => {
    const c = fallbackCases.find((x) => x.id === caseId);
    if (!c) return;
    setCases([c]);
    setSelectedCaseId(c.id);
    setSelectedRequestId(null);
    try {
      localStorage.setItem(FALLBACK_CASE_KEY, c.id);
    } catch (_) {}
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  if (errorCode === "COMM-FETCH-ERROR") {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <p className="text-red-800">Could not load communications. Please try again. (COMM-FETCH-ERROR)</p>
        </CardContent>
      </Card>
    );
  }

  if (cases.length === 0) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-amber-800 font-medium">No cases assigned to you yet. (COMM-NO-CASES)</p>
            <p className="text-amber-700/90 text-sm mt-1">You don&apos;t have any cases assigned yet.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
              <Link to="/attorney/pending-intakes">
                <Inbox className="w-4 h-4 mr-2" />
                View Pending Intakes
              </Link>
            </Button>
          </div>
          {allowUnassignedCaseSelect && (
            <div className="pt-4 border-t border-amber-200/80">
            <Label className="text-amber-800/90 text-sm">Select a case (for testing)</Label>
              {fallbackLoading ? (
                <p className="text-amber-700/80 text-sm mt-1">Loading cases…</p>
              ) : (
                <Select onValueChange={handleFallbackCaseSelect} value="">
                  <SelectTrigger className="mt-1 max-w-xs bg-white border-amber-300">
                    <SelectValue placeholder="Choose a case to load communications…" />
                  </SelectTrigger>
                  <SelectContent>
                    {fallbackCases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.case_number || c.id.slice(0, 8)} — {c.client_name || "Client"}
                      </SelectItem>
                    ))}
                    {fallbackCases.length === 0 && !fallbackLoading && (
                      <div className="py-2 px-2 text-sm text-slate-500">No cases available</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 text-2xl flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Clinical Requests & Updates
          </CardTitle>
          <p className="text-slate-600 text-sm mt-1">Request clinical information from RN and view responses.</p>
        </CardHeader>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <Label className="text-slate-700">Case</Label>
        <Select
          value={selectedCaseId ?? ""}
          onValueChange={(v) => {
            setSelectedCaseId(v || null);
            setSelectedRequestId(null);
          }}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a case to view Requests & Updates." />
          </SelectTrigger>
          <SelectContent>
            {cases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.case_number || c.id.slice(0, 8)} — {c.client_name || "Client"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedCaseId && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6 text-center">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-700">Select a case to view Requests & Updates.</p>
          </CardContent>
        </Card>
      )}

      {selectedCaseId && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "requests" | "all-activity")} className="w-full">
          <TabsList className="bg-white border-b border-slate-200">
            <TabsTrigger value="requests" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Requests
            </TabsTrigger>
            <TabsTrigger value="all-activity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              All Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setNewRequestOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> New Request
              </Button>
            </div>

            {requestsLoading ? (
              <div className="py-8 text-center text-slate-600">Loading requests…</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-[400px]">
                      {requests.length === 0 ? (
                        <div className="py-6 text-center">
                          <p className="text-slate-500 text-sm mb-3">No requests yet for this case.</p>
                          <Button onClick={() => setNewRequestOpen(true)} variant="outline" size="sm">
                            Create Request
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {requests.map((r) => (
                            <div
                              key={r.id}
                              onClick={() => setSelectedRequestId(r.id)}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedRequestId === r.id ? "bg-blue-50 border-blue-300" : "bg-white border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-1 mb-1">
                                <Badge
                                  variant={r.status === "OPEN" ? "default" : r.status === "RESPONDED" ? "secondary" : "outline"}
                                  className={
                                    r.status === "OPEN"
                                      ? "bg-amber-500"
                                      : r.status === "RESPONDED"
                                      ? "bg-green-600"
                                      : "bg-slate-400"
                                  }
                                >
                                  {r.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">{r.priority}</Badge>
                                {r.due_at && (
                                  <span className="text-xs text-slate-500">{format(new Date(r.due_at), "MMM d")}</span>
                                )}
                              </div>
                              <p className="font-medium text-slate-800 truncate">{r.subject || r.request_type}</p>
                              <p className="text-xs text-slate-500 truncate">{r.body.slice(0, 60)}{r.body.length > 60 ? "…" : ""}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Detail & Updates</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {!selectedRequest ? (
                      <div className="py-8 text-center text-slate-500 text-sm">Select a request to view details and updates.</div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <div className="flex flex-wrap gap-1 mb-1">
                            <Badge
                              className={
                                selectedRequest.status === "OPEN"
                                  ? "bg-amber-500"
                                  : selectedRequest.status === "RESPONDED"
                                  ? "bg-green-600"
                                  : "bg-slate-400"
                              }
                            >
                              {selectedRequest.status}
                            </Badge>
                            <Badge variant="outline">{selectedRequest.priority}</Badge>
                            <Badge variant="outline">{selectedRequest.request_type}</Badge>
                          </div>
                          {selectedRequest.subject && <p className="font-medium text-slate-800">{selectedRequest.subject}</p>}
                          <p className="text-slate-700 whitespace-pre-wrap text-sm">{selectedRequest.body}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Created {format(new Date(selectedRequest.created_at), "MMM d, yyyy 'at' h:mm a")}
                            {selectedRequest.responded_at &&
                              ` · Responded ${format(new Date(selectedRequest.responded_at), "MMM d, yyyy")}`}
                            {selectedRequest.closed_at &&
                              ` · Closed ${format(new Date(selectedRequest.closed_at), "MMM d, yyyy")}`}
                          </p>
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-sm font-medium text-slate-700 mb-2">Updates</p>
                          {selectedUpdates.length === 0 ? (
                            <p className="text-slate-500 text-sm">No updates yet.</p>
                          ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {selectedUpdates.map((u) => (
                                <div
                                  key={u.id}
                                  className={`p-2 rounded text-sm ${
                                    u.author_role === "rn" ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"
                                  }`}
                                >
                                  <span className="font-medium text-slate-700">
                                    {u.author_role === "rn" ? "RN Response" : "Attorney"}
                                  </span>
                                  <span className="text-slate-500 text-xs ml-2">
                                    {format(new Date(u.created_at), "MMM d, h:mm a")}
                                  </span>
                                  <p className="text-slate-700 whitespace-pre-wrap mt-1">{u.body}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3">
                            <Label className="text-slate-600">Add Update (optional)</Label>
                            <Textarea
                              value={addUpdateBody}
                              onChange={(e) => setAddUpdateBody(e.target.value)}
                              placeholder="Add a follow-up or note…"
                              rows={2}
                              className="mt-1 border-slate-200"
                            />
                            <Button
                              size="sm"
                              className="mt-2"
                              onClick={addUpdate}
                              disabled={!addUpdateBody.trim() || sending}
                            >
                              Post Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all-activity" className="space-y-4">
            {allActivityItems.length === 0 ? (
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-800">No activity yet</p>
                  <p className="text-slate-600 text-sm">Requests and RN updates will appear here in chronological order.</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {allActivityItems.map((item, idx) => (
                    <Card
                      key={item.kind + "-" + (item.update?.id ?? item.req.id) + "-" + idx}
                      className={item.kind === "request" ? "bg-slate-50 border-slate-200" : "bg-green-50 border-green-200"}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge className={item.kind === "request" ? "bg-blue-600" : "bg-green-600"}>
                              {item.kind === "request" ? "Request" : "RN Update"}
                            </Badge>
                            <span className="text-slate-600 text-xs ml-2">
                              {item.req.request_type}
                              {item.update && ` on request`}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {format(new Date(item.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-slate-800 text-sm mt-2 whitespace-pre-wrap">
                          {item.kind === "request" ? item.req.body : item.update!.body}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message (required)</Label>
              <Textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} placeholder="Describe what you need…" rows={4} required />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={formPriority} onValueChange={setFormPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRequestOpen(false)}>Cancel</Button>
            <Button onClick={createRequest} disabled={!formBody.trim() || sending}>Create Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
