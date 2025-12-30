import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2, PlayCircle } from "lucide-react";
import { format } from "date-fns";

interface DiaryEntry {
  id: string;
  title: string;
  entry_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  location?: string;
  completion_status: string;
  priority?: string;
}

interface TodayDiaryWidgetProps {
  entries: DiaryEntry[];
  onEntryClick: (entry: DiaryEntry) => void;
  onViewAll: () => void;
}

export function TodayDiaryWidget({ entries, onEntryClick, onViewAll }: TodayDiaryWidgetProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const todayEntries = entries.filter(e => e.scheduled_date === today);
  
  const pending = todayEntries.filter(e => e.completion_status === "pending" || e.completion_status === "overdue");
  const completed = todayEntries.filter(e => e.completion_status === "completed");
  const overdue = todayEntries.filter(e => e.completion_status === "overdue");

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "normal": return "bg-blue-100 text-blue-700 border-blue-200";
      case "low": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in_progress": return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case "overdue": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#0f2a6a]" />
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
          </Button>
        </div>
        <div className="flex gap-4 text-sm mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-muted-foreground">{pending.length} Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">{completed.length} Completed</span>
          </div>
          {overdue.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-muted-foreground">{overdue.length} Overdue</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {todayEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No entries scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {todayEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                onClick={() => onEntryClick(entry)}
                className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(entry.completion_status)}
                      <h4 className="font-semibold text-sm truncate">{entry.title}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {entry.scheduled_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.scheduled_time.slice(0, 5)}
                        </div>
                      )}
                      {entry.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{entry.location}</span>
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {entry.entry_type.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  {entry.priority && entry.priority !== "normal" && (
                    <Badge className={getPriorityColor(entry.priority)}>
                      {entry.priority}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {todayEntries.length > 5 && (
              <Button variant="outline" className="w-full" onClick={onViewAll}>
                View {todayEntries.length - 5} More
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
