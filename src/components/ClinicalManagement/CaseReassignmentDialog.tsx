import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

interface RNTeamMember {
  user_id: string;
  display_name: string;
  current_caseload: number;
}

interface CaseReassignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  currentRNId: string;
  currentRNName: string;
  clientLabel: string;
  teamMembers: RNTeamMember[];
  onReassignSuccess: () => void;
}

export function CaseReassignmentDialog({
  open,
  onOpenChange,
  caseId,
  currentRNId,
  currentRNName,
  clientLabel,
  teamMembers,
  onReassignSuccess
}: CaseReassignmentDialogProps) {
  const { user } = useAuth();
  const [selectedRNId, setSelectedRNId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReassign = async () => {
    if (!selectedRNId) {
      toast.error("Please select a team member");
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert reassignment record (triggers auto-logging)
      const { error: reassignError } = await supabase
        .from("case_reassignments")
        .insert({
          case_id: caseId,
          from_rn_id: currentRNId,
          to_rn_id: selectedRNId,
          reassigned_by: user?.id,
          reason,
          notes
        });

      if (reassignError) throw reassignError;

      // Update case assignment
      const { error: deleteError } = await supabase
        .from("case_assignments")
        .delete()
        .eq("case_id", caseId)
        .eq("user_id", currentRNId)
        .eq("role", "RN_CCM");

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("case_assignments")
        .insert({
          case_id: caseId,
          user_id: selectedRNId,
          role: "RN_CCM"
        });

      if (insertError) throw insertError;

      toast.success("Case reassigned successfully");
      onReassignSuccess();
      onOpenChange(false);
      setSelectedRNId("");
      setReason("");
      setNotes("");
    } catch (error: any) {
      console.error("Reassignment error:", error);
      toast.error(error.message || "Failed to reassign case");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMember = teamMembers.find(m => m.user_id === selectedRNId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reassign Case</DialogTitle>
          <DialogDescription>
            Reassign {clientLabel} to another team member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">Current Assignment</p>
              <p className="text-sm text-muted-foreground">{currentRNName}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">New Assignment</p>
              <p className="text-sm text-muted-foreground">
                {selectedMember?.display_name || "Select team member"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rn-select">Assign To</Label>
            <Select value={selectedRNId} onValueChange={setSelectedRNId}>
              <SelectTrigger id="rn-select">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers
                  .filter(m => m.user_id !== currentRNId)
                  .map(member => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.display_name} (Caseload: {member.current_caseload})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workload_balance">Workload Balance</SelectItem>
                <SelectItem value="expertise_match">Expertise Match</SelectItem>
                <SelectItem value="availability">Availability</SelectItem>
                <SelectItem value="client_request">Client Request</SelectItem>
                <SelectItem value="leave_coverage">Leave Coverage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={isSubmitting || !selectedRNId}>
            {isSubmitting ? "Reassigning..." : "Reassign Case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
