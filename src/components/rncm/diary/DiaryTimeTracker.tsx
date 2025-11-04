import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRNTimer } from "@/hooks/useRNTimer";
import { Pause, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiaryTimeTrackerProps {
  entryId?: string;
  onTimeRecorded?: (minutes: number) => void;
}

export function DiaryTimeTracker({ entryId, onTimeRecorded }: DiaryTimeTrackerProps) {
  const { isRunning, formattedTime, minutes, start, pause, stop } = useRNTimer();
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (!entryId) return;

    const fetchTotalTime = async () => {
      const { data, error } = await supabase
        .from("rn_entry_time_tracking")
        .select("time_spent_minutes")
        .eq("entry_id", entryId);

      if (error) {
        console.error("Error fetching time:", error);
        return;
      }

      const total = data.reduce((sum, record) => sum + record.time_spent_minutes, 0);
      setTotalTime(total);
    };

    fetchTotalTime();
  }, [entryId]);

  const handleStop = async () => {
    const recordedMinutes = stop();
    
    if (entryId && recordedMinutes > 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("rn_entry_time_tracking").insert({
          entry_id: entryId,
          rn_id: user.id,
          time_spent_minutes: recordedMinutes,
        });

        if (error) throw error;

        setTotalTime((prev) => prev + recordedMinutes);
        toast.success(`Recorded ${recordedMinutes} minutes`);
        onTimeRecorded?.(recordedMinutes);
      } catch (error) {
        console.error("Error recording time:", error);
        toast.error("Failed to record time");
      }
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-mono font-bold">{formattedTime}</div>
          {totalTime > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
              Total: {totalTime} minutes
            </div>
          )}
        </div>
        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <Button onClick={start} variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button onClick={pause} variant="outline">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          <Button onClick={handleStop} variant="outline" disabled={minutes === 0}>
            <Square className="mr-2 h-4 w-4" />
            Stop & Save
          </Button>
        </div>
      </div>
    </Card>
  );
}
