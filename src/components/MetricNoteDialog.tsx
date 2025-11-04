import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText } from "lucide-react";

interface MetricNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricName: string;
  metricLabel: string;
  currentValue: number;
  targetValue: number;
}

interface MetricNote {
  date: string;
  note: string;
  value: number;
}

export function MetricNoteDialog({
  open,
  onOpenChange,
  metricName,
  metricLabel,
  currentValue,
  targetValue,
}: MetricNoteDialogProps) {
  const [note, setNote] = useState("");
  const [previousNotes, setPreviousNotes] = useState<MetricNote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadPreviousNotes();
    }
  }, [open, metricName]);

  const loadPreviousNotes = () => {
    try {
      const saved = localStorage.getItem(`metric-notes-${metricName}`);
      if (saved) {
        setPreviousNotes(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const handleSave = () => {
    if (!note.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setLoading(true);
    try {
      const newNote: MetricNote = {
        date: new Date().toISOString(),
        note: note.trim(),
        value: currentValue,
      };

      const updatedNotes = [newNote, ...previousNotes].slice(0, 10); // Keep last 10 notes
      localStorage.setItem(`metric-notes-${metricName}`, JSON.stringify(updatedNotes));
      
      toast.success("Note saved successfully");
      setNote("");
      setPreviousNotes(updatedNotes);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    } finally {
      setLoading(false);
    }
  };

  const isBelowTarget = currentValue < targetValue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Note: {metricLabel}
          </DialogTitle>
          <DialogDescription>
            Current: <span className="font-bold">{currentValue}%</span> | Target: <span className="font-bold">{targetValue}%</span>
            {isBelowTarget && (
              <Badge variant="destructive" className="ml-2">Below Target</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Add Note or Explanation
            </label>
            <Textarea
              placeholder="Document reasons for performance, outliers, special circumstances, or action plans..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {isBelowTarget 
                ? "Explain why this metric is below target and your plan to improve."
                : "Document any special circumstances or context for this period."}
            </p>
          </div>

          {previousNotes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Previous Notes</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {previousNotes.map((prevNote, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(prevNote.date).toLocaleDateString()} - Value: {prevNote.value}%
                      </span>
                    </div>
                    <p className="text-foreground">{prevNote.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !note.trim()}>
            {loading ? "Saving..." : "Save Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
