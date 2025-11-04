import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format, formatDistanceToNow, isBefore, isToday } from "date-fns";

interface Deadline {
  id: string;
  title: string;
  dueDate: Date;
  priority: "high" | "medium" | "low";
  clientName: string;
}

export function RNUpcomingDeadlines() {
  // Mock data - replace with real data from Supabase
  const deadlines: Deadline[] = [
    {
      id: "1",
      title: "Care Plan Review",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4),
      priority: "high",
      clientName: "John Smith",
    },
    {
      id: "2",
      title: "Follow-up Assessment",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      priority: "medium",
      clientName: "Jane Doe",
    },
    {
      id: "3",
      title: "Medication Review",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48),
      priority: "medium",
      clientName: "Robert Johnson",
    },
  ];

  const getPriorityColor = (priority: Deadline["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
    }
  };

  const isOverdue = (date: Date) => isBefore(date, new Date());
  const isDueToday = (date: Date) => isToday(date);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Deadlines
        </CardTitle>
        <CardDescription>Tasks and reviews requiring attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deadlines.map((deadline) => (
            <div key={deadline.id} className="flex items-start justify-between gap-4 pb-3 border-b last:border-0">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{deadline.title}</p>
                <p className="text-xs text-muted-foreground">{deadline.clientName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(deadline.dueDate, "MMM d, h:mm a")}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={getPriorityColor(deadline.priority)}>
                  {deadline.priority}
                </Badge>
                {isOverdue(deadline.dueDate) && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
                {isDueToday(deadline.dueDate) && !isOverdue(deadline.dueDate) && (
                  <Badge variant="default">Today</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(deadline.dueDate, { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
