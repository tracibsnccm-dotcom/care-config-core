import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Play } from "lucide-react";

interface DiaryEntry {
  id: string;
  title: string;
  description?: string;
  completion_status: string;
  linked_time_entry_id?: string;
}

interface DiaryCompletionWorkflowProps {
  entry: DiaryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}

export function DiaryCompletionWorkflow({ entry, open, onOpenChange, onCompleted }: DiaryCompletionWorkflowProps) {
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: "in_progress" | "completed" | "cancelled") => {
    if (!entry) return;

    if (newStatus === "completed" && !outcomeNotes.trim()) {
      toast.error("Please provide outcome notes before completing");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates: any = {
        completion_status: newStatus,
        outcome_notes: outcomeNotes.trim() || null
      };

      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user.id;
      }

      const { error } = await supabase
        .from("rn_diary_entries")
        .update(updates)
        .eq("id", entry.id);

      if (error) throw error;

      toast.success(`Diary entry marked as ${newStatus.replace("_", " ")}`);
      setOutcomeNotes("");
      onCompleted();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async () => {
    if (!entry) return;

    try {
      // Update diary entry to in progress with timer started metadata
      await supabase
        .from("rn_diary_entries")
        .update({ 
          completion_status: "in_progress",
          metadata: { time_tracking_started: new Date().toISOString() }
        })
        .eq("id", entry.id);

      toast.success("Timer started - Entry marked as in progress");
      onCompleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error starting timer:", error);
      toast.error("Failed to start timer");
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complete Diary Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{entry.title}</h3>
            {entry.description && (
              <p className="text-sm text-muted-foreground">{entry.description}</p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              Current Status
              <Badge variant={
                entry.completion_status === "completed" ? "default" :
                entry.completion_status === "in_progress" ? "secondary" :
                entry.completion_status === "overdue" ? "destructive" :
                "outline"
              }>
                {entry.completion_status.replace("_", " ")}
              </Badge>
            </Label>
          </div>

          <div>
            <Label htmlFor="outcome-notes">Outcome Notes *</Label>
            <Textarea
              id="outcome-notes"
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder="Describe what was accomplished, any follow-up needed, and key outcomes..."
              rows={6}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required for completion. Include important details for continuity of care.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <Label className="mb-3 block">Quick Actions</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleStartTimer}
                disabled={loading}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange("in_progress")}
                disabled={loading || entry.completion_status === "in_progress"}
              >
                <Clock className="h-4 w-4 mr-2" />
                Mark In Progress
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleStatusChange("cancelled")}
            disabled={loading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Entry
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Close
          </Button>
          <Button
            onClick={() => handleStatusChange("completed")}
            disabled={loading || !outcomeNotes.trim()}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
