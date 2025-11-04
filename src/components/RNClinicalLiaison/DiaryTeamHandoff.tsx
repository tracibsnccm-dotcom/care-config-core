import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Check, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function DiaryTeamHandoff() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [caseId, setCaseId] = useState("");
  const [toRnId, setToRnId] = useState("");
  const [handoffType, setHandoffType] = useState("shift_change");
  const [handoffNotes, setHandoffNotes] = useState("");
  const [priority, setPriority] = useState("medium");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch handoffs
  const { data: handoffs } = useQuery({
    queryKey: ["team-handoffs", user?.id],
    queryFn: async () => {
      if (!user?.id) return { sent: [], received: [] };

      const [{ data: sent }, { data: received }] = await Promise.all([
        supabase
          .from("rn_team_handoffs")
          .select("*, from_rn:profiles!from_rn_id(display_name), to_rn:profiles!to_rn_id(display_name), case:cases(client_label)")
          .eq("from_rn_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("rn_team_handoffs")
          .select("*, from_rn:profiles!from_rn_id(display_name), to_rn:profiles!to_rn_id(display_name), case:cases(client_label)")
          .eq("to_rn_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      return { sent: sent || [], received: received || [] };
    },
    enabled: !!user?.id,
  });

  // Fetch RN team members
  const { data: rnTeam } = useQuery({
    queryKey: ["rn-team"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, profiles(display_name)")
        .eq("role", "RN_CCM");
      return data || [];
    },
  });

  // Fetch cases assigned to current RN
  const { data: myCases } = useQuery({
    queryKey: ["my-cases", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("case_assignments")
        .select("case_id, cases(id, client_label)")
        .eq("user_id", user.id)
        .eq("role", "RN_CCM");
      return data?.map(a => a.cases).filter(Boolean) || [];
    },
    enabled: !!user?.id,
  });

  const createHandoffMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("rn_team_handoffs")
        .insert({
          case_id: caseId,
          from_rn_id: user.id,
          to_rn_id: toRnId,
          handoff_type: handoffType,
          handoff_notes: handoffNotes,
          priority,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-handoffs"] });
      toast.success("Handoff created successfully");
      setIsCreateOpen(false);
      setCaseId("");
      setToRnId("");
      setHandoffNotes("");
    },
  });

  const acknowledgeHandoffMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rn_team_handoffs")
        .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-handoffs"] });
      toast.success("Handoff acknowledged");
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          <h3 className="font-semibold">Team Handoffs</h3>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Handoff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Team Handoff</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Case</Label>
                <Select value={caseId} onValueChange={setCaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    {myCases?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.client_label || `Case ${c.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Hand Off To</Label>
                <Select value={toRnId} onValueChange={setToRnId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select RN" />
                  </SelectTrigger>
                  <SelectContent>
                    {rnTeam?.filter((rn: any) => rn.user_id !== user?.id).map((rn: any) => (
                      <SelectItem key={rn.user_id} value={rn.user_id}>
                        {rn.profiles?.display_name || "RN"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Handoff Type</Label>
                <Select value={handoffType} onValueChange={setHandoffType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shift_change">Shift Change</SelectItem>
                    <SelectItem value="case_transfer">Case Transfer</SelectItem>
                    <SelectItem value="vacation_coverage">Vacation Coverage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Handoff Notes</Label>
                <Textarea
                  value={handoffNotes}
                  onChange={(e) => setHandoffNotes(e.target.value)}
                  placeholder="Include important case details, pending actions, and any concerns..."
                  rows={6}
                />
              </div>

              <Button
                onClick={() => createHandoffMutation.mutate()}
                disabled={!caseId || !toRnId || !handoffNotes}
                className="w-full"
              >
                Create Handoff
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList>
          <TabsTrigger value="received">
            Received
            {handoffs?.received.filter((h: any) => !h.acknowledged).length > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {handoffs.received.filter((h: any) => !h.acknowledged).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-3">
          {handoffs?.received.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No handoffs received</p>
            </Card>
          ) : (
            handoffs?.received.map((handoff: any) => (
              <Card key={handoff.id} className={`p-4 ${!handoff.acknowledged ? 'border-blue-500 border-2' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getPriorityColor(handoff.priority)}>
                        {handoff.priority}
                      </Badge>
                      <Badge variant="outline">
                        {handoff.handoff_type.replace("_", " ")}
                      </Badge>
                      {!handoff.acknowledged && (
                        <Badge variant="secondary" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Needs Acknowledgment
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium mb-1">
                      From: {handoff.from_rn?.display_name || "RN"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Case: {handoff.case?.client_label || "Unknown"}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{handoff.handoff_notes}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(handoff.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>

                  {!handoff.acknowledged && (
                    <Button
                      size="sm"
                      onClick={() => acknowledgeHandoffMutation.mutate(handoff.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Acknowledge
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3">
          {handoffs?.sent.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No handoffs sent</p>
            </Card>
          ) : (
            handoffs?.sent.map((handoff: any) => (
              <Card key={handoff.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getPriorityColor(handoff.priority)}>
                        {handoff.priority}
                      </Badge>
                      <Badge variant="outline">
                        {handoff.handoff_type.replace("_", " ")}
                      </Badge>
                      {handoff.acknowledged ? (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Acknowledged
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <ArrowRight className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium mb-1">
                      To: {handoff.to_rn?.display_name || "RN"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Case: {handoff.case?.client_label || "Unknown"}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{handoff.handoff_notes}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Sent: {format(new Date(handoff.created_at), "MMM d, yyyy h:mm a")}
                      {handoff.acknowledged_at && ` • Acknowledged: ${format(new Date(handoff.acknowledged_at), "MMM d h:mm a")}`}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
