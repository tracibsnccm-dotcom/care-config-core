import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Flame } from "lucide-react";

interface DiaryWorkloadHeatmapProps {
  entries: any[];
  startDate: Date;
}

export function DiaryWorkloadHeatmap({ entries, startDate }: DiaryWorkloadHeatmapProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(startDate);
    const end = endOfWeek(startDate);
    return eachDayOfInterval({ start, end });
  }, [startDate]);

  const workloadByDay = useMemo(() => {
    const workload: Record<string, { count: number; duration: number; entries: any[] }> = {};

    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      workload[dayKey] = { count: 0, duration: 0, entries: [] };
    });

    entries.forEach((entry) => {
      const dayKey = entry.scheduled_date;
      if (workload[dayKey]) {
        workload[dayKey].count++;
        workload[dayKey].entries.push(entry);
        
        // Estimate duration based on entry type
        const durations: Record<string, number> = {
          consultation: 60,
          assessment: 90,
          phone_call: 30,
          meeting: 45,
          follow_up: 30,
          home_visit: 120,
          other: 30
        };
        workload[dayKey].duration += durations[entry.entry_type] || 30;
      }
    });

    return workload;
  }, [entries, weekDays]);

  const getIntensityColor = (count: number, duration: number) => {
    const totalMinutes = duration;
    if (totalMinutes === 0) return "bg-gray-100 dark:bg-gray-800";
    if (totalMinutes < 120) return "bg-green-200 dark:bg-green-900/40";
    if (totalMinutes < 240) return "bg-yellow-200 dark:bg-yellow-900/40";
    if (totalMinutes < 360) return "bg-orange-200 dark:bg-orange-900/40";
    return "bg-red-200 dark:bg-red-900/40";
  };

  const getIntensityLabel = (duration: number) => {
    if (duration === 0) return "Free";
    if (duration < 120) return "Light";
    if (duration < 240) return "Moderate";
    if (duration < 360) return "Busy";
    return "Very Busy";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-orange-600" />
        <h3 className="font-semibold text-lg">Workload Heatmap</h3>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayWorkload = workloadByDay[dayKey];
          const intensityColor = getIntensityColor(dayWorkload.count, dayWorkload.duration);
          const intensityLabel = getIntensityLabel(dayWorkload.duration);

          return (
            <div key={dayKey} className="space-y-2">
              <div className="text-center">
                <p className="text-xs font-medium">{format(day, "EEE")}</p>
                <p className="text-lg font-bold">{format(day, "d")}</p>
              </div>

              <div
                className={`${intensityColor} rounded-lg p-3 min-h-[120px] transition-all hover:shadow-md`}
              >
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {intensityLabel}
                  </Badge>
                  <p className="text-sm font-medium">{dayWorkload.count} entries</p>
                  {dayWorkload.duration > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ~{Math.round(dayWorkload.duration / 60)}h {dayWorkload.duration % 60}m
                    </p>
                  )}
                </div>

                {dayWorkload.entries.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {dayWorkload.entries.slice(0, 2).map((entry) => (
                      <p key={entry.id} className="text-xs truncate" title={entry.title}>
                        {entry.scheduled_time} - {entry.title}
                      </p>
                    ))}
                    {dayWorkload.entries.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{dayWorkload.entries.length - 2} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 dark:bg-green-900/40 rounded"></div>
          <span>Light (0-2h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-900/40 rounded"></div>
          <span>Moderate (2-4h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-200 dark:bg-orange-900/40 rounded"></div>
          <span>Busy (4-6h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-200 dark:bg-red-900/40 rounded"></div>
          <span>Very Busy (6h+)</span>
        </div>
      </div>
    </Card>
  );
}
