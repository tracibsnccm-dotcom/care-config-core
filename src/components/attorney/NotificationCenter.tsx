import { useState, useEffect } from "react";
import { Bell, CheckCheck, Clock, FileText, MessageSquare, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "assignment" | "message" | "deadline" | "document" | "alert";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: "low" | "medium" | "high";
  case_id?: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('attorney-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' }, 
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Mock notifications - replace with actual DB query
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "assignment",
        title: "New Case Assignment",
        message: "You've been assigned to Case #2024-001",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        read: false,
        priority: "high"
      },
      {
        id: "2",
        type: "message",
        title: "New Message from Client",
        message: "Sarah Johnson sent you a message",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
        priority: "medium"
      },
      {
        id: "3",
        type: "deadline",
        title: "Upcoming Deadline",
        message: "Discovery deadline in 2 days for Case #2024-001",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        read: true,
        priority: "high"
      },
      {
        id: "4",
        type: "document",
        title: "Document Uploaded",
        message: "Client uploaded medical records",
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        read: true,
        priority: "low"
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast({ title: "All notifications marked as read" });
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "assignment": return <FileText className="h-4 w-4" />;
      case "message": return <MessageSquare className="h-4 w-4" />;
      case "deadline": return <Clock className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      case "alert": return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
    }
  };

  const filterNotifications = (filter: string) => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="assignment">Cases</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
          </TabsList>

          {["all", "unread", "assignment", "message"].map(filter => (
            <TabsContent key={filter} value={filter} className="m-0">
              <ScrollArea className="h-96">
                {filterNotifications(filter).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filterNotifications(filter).map(notification => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-accent/30' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          <div className="mt-1">{getIcon(notification.type)}</div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <Badge variant={getPriorityColor(notification.priority)} className="shrink-0">
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
