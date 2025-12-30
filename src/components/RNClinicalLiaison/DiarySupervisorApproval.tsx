import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface DiarySupervisorApprovalProps {
  entryId: string;
  requiresApproval?: boolean;
  approvalStatus?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvalNotes?: string | null;
  onApprovalChange?: () => void;
}

export function DiarySupervisorApproval({
  entryId,
  requiresApproval,
  approvalStatus,
  approvedBy,
  approvedAt,
  approvalNotes,
  onApprovalChange,
}: DiarySupervisorApprovalProps) {
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async (status: "approved" | "rejected") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("rn_diary_entries")
        .update({
          approval_status: status,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          approval_notes: notes || null,
        })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: (_, status) => {
      toast.success(status === "approved" ? "Entry approved" : "Entry rejected");
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      queryClient.invalidateQueries({ queryKey: ["supervisor-diary"] });
      onApprovalChange?.();
      setNotes("");
    },
    onError: (error) => {
      toast.error("Failed to update approval: " + error.message);
    },
  });

  if (!requiresApproval) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-orange-50 dark:bg-orange-950/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <h3 className="font-semibold text-orange-900 dark:text-orange-100">
          Supervisor Approval Required
        </h3>
      </div>

      {approvalStatus === "pending" && (
        <>
          <p className="text-sm text-muted-foreground">
            This entry requires supervisor approval due to its critical nature (emergency alert or
            health-impacting event).
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Approval Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this approval decision..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => approveMutation.mutate("approved")}
              disabled={approveMutation.isPending}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => approveMutation.mutate("rejected")}
              disabled={approveMutation.isPending}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </>
      )}

      {approvalStatus === "approved" && (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">Approved</p>
            {approvedAt && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(approvedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            )}
            {approvalNotes && <p className="text-sm mt-1">{approvalNotes}</p>}
          </div>
        </div>
      )}

      {approvalStatus === "rejected" && (
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">Rejected</p>
            {approvedAt && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(approvedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            )}
            {approvalNotes && <p className="text-sm mt-1">{approvalNotes}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
