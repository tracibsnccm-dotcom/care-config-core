import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, FileText, Calendar, AlertCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Communication {
  id: string;
  type: "announcement" | "policy" | "meeting" | "memo" | "alert";
  title: string;
  author: string;
  date: string;
  priority: "high" | "medium" | "low";
  read: boolean;
  content: string;
}

export function TeamCommunications() {
  const { toast } = useToast();
  const [communications] = useState<Communication[]>([
    {
      id: "comm-001",
      type: "alert",
      title: "Emergency Protocol Update - Immediate Action Required",
      author: "Clinical Director",
      date: "2025-01-10",
      priority: "high",
      read: false,
      content: "Updated emergency response protocols effective immediately..."
    },
    {
      id: "comm-002",
      type: "policy",
      title: "Updated Documentation Policy - Effective Feb 1",
      author: "Compliance Officer",
      date: "2025-01-09",
      priority: "high",
      read: false,
      content: "New documentation standards for electronic health records..."
    },
    {
      id: "comm-003",
      type: "meeting",
      title: "Department Meeting - Q1 Planning Session",
      author: "Sarah Johnson, RN Supervisor",
      date: "2025-01-08",
      priority: "medium",
      read: true,
      content: "Quarterly planning meeting scheduled for Jan 15 at 2pm..."
    },
    {
      id: "comm-004",
      type: "announcement",
      title: "New Team Member Welcome - Lisa Martinez, RN",
      author: "HR Department",
      date: "2025-01-07",
      priority: "low",
      read: true,
      content: "Please join us in welcoming Lisa Martinez to our team..."
    },
    {
      id: "comm-005",
      type: "memo",
      title: "Holiday Schedule Changes",
      author: "Scheduling Coordinator",
      date: "2025-01-06",
      priority: "medium",
      read: true,
      content: "Updated holiday coverage schedule for the remainder of Q1..."
    }
  ]);

  const getTypeIcon = (type: Communication["type"]) => {
    switch (type) {
      case "announcement":
        return <Bell className="h-4 w-4" />;
      case "policy":
        return <FileText className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      case "alert":
        return <AlertCircle className="h-4 w-4" />;
      case "memo":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Communication["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "";
    }
  };

  const handleViewCommunication = (commId: string) => {
    toast({
      title: "Communication",
      description: `Opening ${communications.find(c => c.id === commId)?.title}`,
    });
  };

  const unreadCount = communications.filter(c => !c.read).length;
  const highPriorityCount = communications.filter(c => c.priority === "high" && !c.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Communications</h2>
          <p className="text-muted-foreground">Department announcements and updates</p>
        </div>
        <Button>
          <MessageSquare className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {highPriorityCount > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-500">Unread Important Messages</CardTitle>
            </div>
            <CardDescription>
              You have {highPriorityCount} high-priority unread message{highPriorityCount > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{highPriorityCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {communications
          .sort((a, b) => {
            if (a.read !== b.read) return a.read ? 1 : -1;
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .map((comm) => (
            <Card 
              key={comm.id} 
              className={`${!comm.read ? "border-blue-500/50 bg-blue-500/5" : ""} ${comm.priority === "high" && !comm.read ? "border-red-500/50 bg-red-500/5" : ""}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${!comm.read ? "bg-blue-100" : "bg-gray-100"}`}>
                      {getTypeIcon(comm.type)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{comm.title}</CardTitle>
                        {!comm.read && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {comm.author} • {comm.date}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={getPriorityColor(comm.priority)}>
                    {comm.priority.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {comm.content}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleViewCommunication(comm.id)}>
                    Read Full Message
                  </Button>
                  {!comm.read && (
                    <Button size="sm" variant="outline">
                      Mark as Read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
