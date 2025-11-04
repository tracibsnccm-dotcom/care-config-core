import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GitBranch, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiaryCaseTimelineSyncProps {
  entryId: string;
  caseId: string;
  autoSync?: boolean;
  onSyncChange?: (autoSync: boolean) => void;
}

export function DiaryCaseTimelineSync({
  entryId,
  caseId,
  autoSync = true,
  onSyncChange
}: DiaryCaseTimelineSyncProps) {
  const [syncing, setSyncing] = useState(false);

  const syncToTimeline = async () => {
    setSyncing(true);
    try {
      // Get entry details
      const { data: entry, error: entryError } = await supabase
        .from("rn_diary_entries")
        .select("*")
        .eq("id", entryId)
        .single();

      if (entryError) throw entryError;

      // Check if already synced
      const { data: existing } = await supabase
        .from("audit_events")
        .select("id")
        .eq("case_id", caseId)
        .eq("event_meta->>diary_entry_id", entryId)
        .single();

      if (existing) {
        toast.info("Entry already synced to case timeline");
        return;
      }

      // Create timeline event
      const { error: timelineError } = await supabase
        .from("audit_events")
        .insert({
          case_id: caseId,
          event_type: `diary_${entry.entry_type}`,
          actor_user_id: entry.rn_id,
          event_meta: {
            diary_entry_id: entryId,
            title: entry.title,
            description: entry.description,
            scheduled_date: entry.scheduled_date,
            scheduled_time: entry.scheduled_time,
            completion_status: entry.completion_status,
            completed_at: entry.completed_at
          }
        });

      if (timelineError) throw timelineError;

      toast.success("Entry synced to case timeline!");
    } catch (error) {
      console.error("Timeline sync error:", error);
      toast.error("Failed to sync to timeline");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        <h4 className="font-medium">Case Timeline Integration</h4>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-sync">Auto-sync to timeline</Label>
          <p className="text-xs text-muted-foreground">
            Automatically add completed entries to case timeline
          </p>
        </div>
        <Switch
          id="auto-sync"
          checked={autoSync}
          onCheckedChange={onSyncChange}
        />
      </div>

      <Button
        onClick={syncToTimeline}
        disabled={syncing}
        variant="outline"
        className="w-full flex items-center gap-2"
      >
        <CheckCircle className="h-4 w-4" />
        {syncing ? "Syncing..." : "Sync to Timeline Now"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Syncing creates a case timeline event that tracks this diary activity in the client's case history.
      </p>
    </Card>
  );
}
