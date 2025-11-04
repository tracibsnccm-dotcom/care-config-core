import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TimeEntry {
  id: string;
  case_id: string;
  activity_type: string;
  activity_description: string;
  time_spent_minutes: number;
  estimated_attorney_time_saved_minutes: number;
  approval_status: "pending" | "approved" | "rejected";
  submitted_at: string;
  rn_user_id: string;
  rn_profile?: {
    display_name: string;
  };
  case?: {
    client_number: string;
    client_label: string;
  };
}

const activityLabels: Record<string, string> = {
  medical_record_review: "Medical Record Review",
  provider_communication: "Provider Communication",
  appointment_coordination: "Appointment Coordination",
  treatment_plan_review: "Treatment Plan Review",
  insurance_authorization: "Insurance Authorization",
  care_plan_development: "Care Plan Development",
  client_education: "Client Education",
  documentation: "Clinical Documentation",
  case_research: "Case Research",
  team_coordination: "Team Coordination"
};

export function RNTimeApproval() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; entryId: string | null }>({ open: false, entryId: null });
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  async function fetchPendingEntries() {
    try {
      const { data, error } = await supabase
        .from("rn_time_entries")
        .select(`
          *,
          case:cases(client_number, client_label)
        `)
        .eq("submitted_for_approval", true)
        .eq("approval_status", "pending")
        .order("submitted_at", { ascending: true });

      if (error) throw error;

      // Fetch RN profiles separately
      const rnIds = data?.map(e => e.rn_user_id) || [];
      const uniqueRnIds = [...new Set(rnIds.filter(id => id !== null && id !== undefined))];
      
      if (uniqueRnIds.length === 0) {
        setEntries([]);
        return;
      }
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", uniqueRnIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]));

      const enrichedData = data?.map(entry => ({
        ...entry,
        rn_profile: profilesMap.get(entry.rn_user_id)
      }));

      setEntries(enrichedData as any || []);
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast.error("Failed to load time entries");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(entryId: string) {
    try {
      const { error } = await supabase
        .from("rn_time_entries")
        .update({
          approval_status: "approved",
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", entryId);

      if (error) throw error;

      toast.success("Time entry approved");
      fetchPendingEntries();
    } catch (error) {
      console.error("Error approving entry:", error);
      toast.error("Failed to approve time entry");
    }
  }

  async function handleReject() {
    if (!rejectDialog.entryId || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const { error } = await supabase
        .from("rn_time_entries")
        .update({
          approval_status: "rejected",
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq("id", rejectDialog.entryId);

      if (error) throw error;

      toast.success("Time entry rejected");
      setRejectDialog({ open: false, entryId: null });
      setRejectionReason("");
      fetchPendingEntries();
    } catch (error) {
      console.error("Error rejecting entry:", error);
      toast.error("Failed to reject time entry");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Entry Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Entry Approvals
            {entries.length > 0 && (
              <Badge variant="secondary">{entries.length} Pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{entry.rn_profile?.display_name || "Unknown RN"}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.case?.client_number || "N/A"} - {entry.case?.client_label || "Unknown Case"}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {activityLabels[entry.activity_type] || entry.activity_type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Time Spent:</span>
                      <span className="ml-2 font-medium">{(entry.time_spent_minutes / 60).toFixed(2)}h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Attorney Time Saved:</span>
                      <span className="ml-2 font-medium">{(entry.estimated_attorney_time_saved_minutes / 60).toFixed(2)}h</span>
                    </div>
                  </div>

                  {entry.activity_description && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Description:</span>
                      <p className="mt-1">{entry.activity_description}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Submitted: {format(new Date(entry.submitted_at), "MMM dd, yyyy 'at' h:mm a")}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(entry.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejectDialog({ open: true, entryId: entry.id })}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, entryId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Reject Time Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this time entry. The RN will be notified.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, entryId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
