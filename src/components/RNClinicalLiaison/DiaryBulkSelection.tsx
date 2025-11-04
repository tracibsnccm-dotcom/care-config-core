import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckSquare, Trash2, Calendar, AlertCircle } from "lucide-react";

interface DiaryBulkSelectionProps {
  selectedEntries: string[];
  onClearSelection: () => void;
}

export function DiaryBulkSelection({ selectedEntries, onClearSelection }: DiaryBulkSelectionProps) {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newStatus, setNewStatus] = useState("");
  const queryClient = useQueryClient();

  const bulkRescheduleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rn_diary_entries")
        .update({ scheduled_date: newDate })
        .in("id", selectedEntries);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      setIsRescheduleOpen(false);
      onClearSelection();
      toast.success(`Rescheduled ${selectedEntries.length} entries`);
    },
    onError: () => toast.error("Failed to reschedule entries"),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("rn_diary_entries")
        .update({ completion_status: status })
        .in("id", selectedEntries);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      onClearSelection();
      toast.success(`Updated ${selectedEntries.length} entries`);
    },
    onError: () => toast.error("Failed to update entries"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rn_diary_entries")
        .delete()
        .in("id", selectedEntries);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      onClearSelection();
      toast.success(`Deleted ${selectedEntries.length} entries`);
    },
    onError: () => toast.error("Failed to delete entries"),
  });

  if (selectedEntries.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border-2 border-primary rounded-lg shadow-xl p-4 flex items-center gap-3">
        <span className="font-medium">{selectedEntries.length} selected</span>
        
        <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Reschedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Date</Label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <Button 
                onClick={() => bulkRescheduleMutation.mutate()} 
                disabled={bulkRescheduleMutation.isPending}
                className="w-full"
              >
                Reschedule {selectedEntries.length} Entries
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Select value={newStatus} onValueChange={(value) => {
          setNewStatus(value);
          bulkStatusMutation.mutate(value);
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Update status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => {
            if (confirm(`Delete ${selectedEntries.length} entries? This cannot be undone.`)) {
              bulkDeleteMutation.mutate();
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>

        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Cancel
        </Button>
      </div>
    </div>
  );
}