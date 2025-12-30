import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, List } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";

interface DiaryEntry {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time?: string;
  priority: "low" | "medium" | "high" | "urgent";
  completion_status: string;
  entry_type: string;
}

interface DiaryCalendarViewProps {
  entries: DiaryEntry[];
  onDateClick: (date: Date) => void;
  onEntryClick: (entry: DiaryEntry) => void;
}

export function DiaryCalendarView({ entries, onDateClick, onEntryClick }: DiaryCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEntriesForDate = (date: Date) => {
    return entries.filter(entry => 
      isSameDay(new Date(entry.scheduled_date), date)
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (view === "list") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="h-5 w-5" />
              List View
            </div>
            <Button variant="outline" size="sm" onClick={() => setView("calendar")}>
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No diary entries
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => onEntryClick(entry)}
                  className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(entry.scheduled_date), "MMM dd, yyyy")}
                        {entry.scheduled_time && ` at ${entry.scheduled_time}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getPriorityColor(entry.priority) as any}>
                        {entry.priority}
                      </Badge>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(entry.completion_status)}`}>
                        {entry.completion_status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setView("list")}>
            <List className="h-4 w-4 mr-2" />
            List View
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day, idx) => {
            const dayEntries = getEntriesForDate(day);
            const isCurrentMonth = day >= monthStart && day <= monthEnd;
            const today = isToday(day);

            return (
              <button
                key={idx}
                onClick={() => onDateClick(day)}
                className={`
                  min-h-[80px] p-2 border rounded-lg text-left hover:border-primary transition-colors
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${today ? "border-primary bg-primary/5" : ""}
                `}
              >
                <div className={`text-sm font-medium mb-1 ${today ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEntries.slice(0, 2).map((entry) => (
                    <div
                      key={entry.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEntryClick(entry);
                      }}
                      className={`text-xs p-1 rounded truncate ${getStatusColor(entry.completion_status)}`}
                    >
                      {entry.title}
                    </div>
                  ))}
                  {dayEntries.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEntries.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
