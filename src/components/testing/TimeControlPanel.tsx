import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSimulatedTime } from "@/hooks/useSimulatedTime";
import { Calendar, Clock, FastForward, Pause, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

function formatDateTime(date: Date): string {
  try {
    return format(date, "yyyy-MM-dd HH:mm:ss");
  } catch {
    return date.toISOString();
  }
}

export function TimeControlPanel() {
  const {
    simTime,
    isActive,
    realTime,
    loading,
    activateSimulatedTime,
    deactivateSimulatedTime,
    jumpTime,
    setSimulatedTime,
    getCurrentTime,
  } = useSimulatedTime();

  const [jumpHours, setJumpHours] = useState<number>(24);
  const [customDate, setCustomDate] = useState<string>("");
  const [customTime, setCustomTime] = useState<string>("");

  const handleSetCustomTime = () => {
    if (!customDate) return;
    
    const dateTimeString = customTime 
      ? `${customDate}T${customTime}`
      : `${customDate}T00:00:00`;
    
    setSimulatedTime(new Date(dateTimeString));
  };

  const currentTime = getCurrentTime();

  return (
    <div className="space-y-4">
      {/* Time Display */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Time</h3>
            <div className="flex items-center gap-2">
              {isActive ? (
                <>
                  <Clock className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">Simulated Active</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Real Time</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Time</Label>
              <div className="text-3xl font-mono font-bold">
                {formatDateTime(currentTime)}
              </div>
            </div>

            {isActive && (
              <div className="space-y-2">
                <Label>Real Time</Label>
                <div className="text-lg font-mono text-muted-foreground">
                  {formatDateTime(realTime)}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Controls</h3>
        <div className="flex flex-wrap gap-2">
          {!isActive ? (
            <Button onClick={() => activateSimulatedTime()}>
              <Play className="mr-2 h-4 w-4" />
              Activate Simulated Time
            </Button>
          ) : (
            <Button onClick={deactivateSimulatedTime} variant="destructive">
              <Pause className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          )}

          <Button onClick={() => jumpTime(1)} disabled={!isActive} variant="outline">
            <FastForward className="mr-2 h-4 w-4" />
            +1 Hour
          </Button>

          <Button onClick={() => jumpTime(24)} disabled={!isActive} variant="outline">
            <FastForward className="mr-2 h-4 w-4" />
            +1 Day
          </Button>

          <Button onClick={() => jumpTime(168)} disabled={!isActive} variant="outline">
            <FastForward className="mr-2 h-4 w-4" />
            +1 Week
          </Button>

          <Button onClick={() => jumpTime(-1)} disabled={!isActive} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            -1 Hour
          </Button>
        </div>
      </Card>

      {/* Custom Time Jump */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Custom Time Jump</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="jump-hours">Hours to Jump</Label>
            <Input
              id="jump-hours"
              type="number"
              value={jumpHours}
              onChange={(e) => setJumpHours(Number(e.target.value))}
              placeholder="Enter hours (positive or negative)"
            />
          </div>
          <Button onClick={() => jumpTime(jumpHours)} disabled={!isActive}>
            Jump Time
          </Button>
        </div>
      </Card>

      {/* Set Specific Time */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Set Specific Time</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="custom-date">Date</Label>
            <Input
              id="custom-date"
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="custom-time">Time (Optional)</Label>
            <Input
              id="custom-time"
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleSetCustomTime} className="mt-4" disabled={!customDate}>
          <Calendar className="mr-2 h-4 w-4" />
          Set Time
        </Button>
      </Card>
    </div>
  );
}
