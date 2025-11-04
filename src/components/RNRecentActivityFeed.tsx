import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, MessageSquare, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: "note" | "message" | "appointment" | "completed" | "alert";
  description: string;
  timestamp: Date;
  clientName?: string;
}

export function RNRecentActivityFeed() {
  // Mock data - replace with real data from Supabase
  const activities: Activity[] = [
    {
      id: "1",
      type: "note",
      description: "Added clinical note for follow-up",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      clientName: "John Smith",
    },
    {
      id: "2",
      type: "message",
      description: "Sent message regarding medication",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      clientName: "Jane Doe",
    },
    {
      id: "3",
      type: "completed",
      description: "Completed care plan review",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      clientName: "Robert Johnson",
    },
    {
      id: "4",
      type: "alert",
      description: "Responded to clinical alert",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      clientName: "Mary Williams",
    },
  ];

  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "note":
        return <FileText className="h-4 w-4" />;
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "appointment":
        return <Calendar className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest actions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="rounded-full bg-primary/10 p-2">
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  {activity.clientName && (
                    <p className="text-xs text-muted-foreground">{activity.clientName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
