import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, UserX, Trash2, CheckCircle } from "lucide-react";

interface DiaryBulkActionsProps {
  selectedEntries: string[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

export function DiaryBulkActions({ selectedEntries, onActionComplete, onClearSelection }: DiaryBulkActionsProps) {
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newRnId, setNewRnId] = useState("");
  const [availableRNs, setAvailableRNs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailableRNs = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("user_id, profiles!user_roles_user_id_fkey(display_name)")
      .in("role", ["RN_CM", "RCMS_CLINICAL_MGMT"]);

    setAvailableRNs(data || []);
  };

  const handleReschedule = async () => {
    if (!newDate) {
      toast.error("Please select a new date");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("rn_diary_entries")
        .update({ scheduled_date: newDate })
        .in("id", selectedEntries);

      if (error) throw error;

      toast.success(`${selectedEntries.length} entries rescheduled`);
      setRescheduleDialogOpen(false);
      setNewDate("");
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error("Error rescheduling:", error);
      toast.error("Failed to reschedule entries");
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!newRnId) {
      toast.error("Please select an RN");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("rn_diary_entries")
        .update({ rn_id: newRnId })
        .in("id", selectedEntries);

      if (error) throw error;

      toast.success(`${selectedEntries.length} entries reassigned`);
      setReassignDialogOpen(false);
      setNewRnId("");
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error("Error reassigning:", error);
      toast.error("Failed to reassign entries");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm(`Mark ${selectedEntries.length} entries as complete?`)) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("rn_diary_entries")
        .update({
          completion_status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: user.id
        })
        .in("id", selectedEntries);

      if (error) throw error;

      toast.success(`${selectedEntries.length} entries marked complete`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error("Error marking complete:", error);
      toast.error("Failed to mark entries complete");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedEntries.length} diary entries? This cannot be undone.`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("rn_diary_entries")
        .delete()
        .in("id", selectedEntries);

      if (error) throw error;

      toast.success(`${selectedEntries.length} entries deleted`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete entries");
    } finally {
      setLoading(false);
    }
  };

  if (selectedEntries.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg">
        <span className="font-medium">{selectedEntries.length} selected</span>
        <div className="flex gap-2 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRescheduleDialogOpen(true);
            }}
            disabled={loading}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Reschedule
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fetchAvailableRNs();
              setReassignDialogOpen(true);
            }}
            disabled={loading}
          >
            <UserX className="h-4 w-4 mr-2" />
            Reassign
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkComplete}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={loading}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Entries</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="new-date">New Date</Label>
            <Input
              id="new-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={loading}>
              Reschedule {selectedEntries.length} Entries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Entries</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="new-rn">Assign To</Label>
            <Select value={newRnId} onValueChange={setNewRnId}>
              <SelectTrigger id="new-rn" className="mt-1">
                <SelectValue placeholder="Select RN" />
              </SelectTrigger>
              <SelectContent>
                {availableRNs.map((rn: any) => (
                  <SelectItem key={rn.user_id} value={rn.user_id}>
                    {rn.profiles?.display_name || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassign} disabled={loading}>
              Reassign {selectedEntries.length} Entries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
