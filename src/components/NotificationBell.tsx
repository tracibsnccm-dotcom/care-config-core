import { useState, useRef, useEffect } from "react";
import { Bell, ExternalLink, AlertCircle, AlertTriangle, Info, CheckCircle, FileText, UserPlus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from 'date-fns';

const notificationIcons: Record<string, React.ElementType> = {
  document_uploaded: FileText,
  client_added: UserPlus,
  urgent_flag: AlertCircle,
  task_due: Clock,
};

const notificationColors: Record<string, string> = {
  important: "text-[hsl(var(--gold))]",
  general: "text-[hsl(var(--teal))]",
  urgent: "text-[#ff7b7b]",
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (feedRef.current && !feedRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const getNotificationIcon = (notification: Notification) => {
    // Check metadata for custom icon type
    const iconType = notification.metadata?.iconType as string | undefined;
    if (iconType && notificationIcons[iconType]) {
      const Icon = notificationIcons[iconType];
      return <Icon className="w-5 h-5" />;
    }
    
    // Fall back to type-based icons
    switch (notification.type) {
      case 'error': return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-success" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationColor = (notification: Notification) => {
    const priority = notification.metadata?.priority as string | undefined;
    return priority && notificationColors[priority] 
      ? notificationColors[priority] 
      : notificationColors.general;
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'error': return "bg-destructive/10 text-destructive border-destructive/20";
      case 'warning': return "bg-warning/10 text-warning border-warning/20";
      case 'success': return "bg-success/10 text-success border-success/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={feedRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[hsl(var(--gold))] text-foreground text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-background font-semibold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <Card className={cn(
          "absolute right-0 top-12 w-[380px] max-h-[480px] overflow-auto z-50",
          "border-border shadow-lg"
        )}>
          <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => {
                const iconColor = getNotificationColor(notification);
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-accent cursor-pointer transition-colors",
                      !notification.read && "bg-[hsl(var(--gold))]/10 border-l-4 border-l-[hsl(var(--gold))]"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={iconColor}>
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-[hsl(var(--gold))] flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-sm text-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {notification.link && (
                        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {notifications.length > 5 && (
              <div className="p-4 border-t border-border">
                <Button 
                  variant="outline" 
                  className="w-full text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))] hover:text-foreground border-[hsl(var(--gold))]"
                  onClick={() => {
                    navigate("/notifications");
                    setIsOpen(false);
                  }}
                >
                  View All Notifications
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
