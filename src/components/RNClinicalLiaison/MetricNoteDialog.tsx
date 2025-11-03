import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MetricNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricName: string;
  metricLabel: string;
  currentValue: number;
  targetValue: number;
  metricDate: string;
  onSaved?: () => void;
}

export function MetricNoteDialog({
  open,
  onOpenChange,
  metricName,
  metricLabel,
  currentValue,
  targetValue,
  metricDate,
  onSaved,
}: MetricNoteDialogProps) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!note.trim()) {
      toast({
        title: "Note Required",
        description: "Please provide an explanation for below-standard performance.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("rn_metric_notes")
        .upsert({
          rn_user_id: user.id,
          metric_date: metricDate,
          metric_name: metricName,
          metric_value: currentValue,
          target_value: targetValue,
          note: note.trim(),
        }, {
          onConflict: 'rn_user_id,metric_date,metric_name',
        });

      if (error) throw error;

      toast({
        title: "Note Saved",
        description: "Your explanation has been documented.",
      });

      setNote("");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Below Standard Performance Note
          </DialogTitle>
          <DialogDescription>
            Document the reason for below-standard performance on this metric. This will be reviewed by your supervisor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{metricLabel}</span>
              <Badge variant="destructive">Below Target</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current Value:</span>
                <p className="font-semibold text-lg">{currentValue.toFixed(1)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Target Value:</span>
                <p className="font-semibold text-lg">{targetValue.toFixed(1)}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Date: {new Date(metricDate).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Explanation *</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Please explain circumstances that affected your performance on this metric (e.g., high-complexity cases, system issues, training needs, etc.)"
              className="min-h-[120px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              This note will be visible to your supervisor and included in performance reviews.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setNote("");
              onOpenChange(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !note.trim()}>
            {saving ? "Saving..." : "Save Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}