import { useState, useRef, useEffect } from "react";
import { Bell, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export interface Notification {
  id: string;
  type: "CASE_LONGEVITY_ALERT" | "PROVIDER_CONFIRMED" | "DOC_UPLOADED" | "CONSENT_SIGNED" | "RISK_ESCALATED";
  caseId: string;
  riskLevel?: "stable" | "at_risk" | "critical";
  sdohFlags?: string[];
  message: string;
  timestamp: string;
  read?: boolean;
}

interface NotificationBellProps {
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAllRead?: () => void;
}

export function NotificationBell({ 
  notifications, 
  onNotificationClick,
  onMarkAllRead 
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const unreadCount = notifications.filter(n => !n.read).length;

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

  const getRiskBadgeClass = (level?: string) => {
    switch (level) {
      case "critical": return "bg-destructive/10 text-destructive border-destructive/20";
      case "at_risk": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    navigate(`/cases/${notification.caseId}`);
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
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-background font-semibold">
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
            {unreadCount > 0 && onMarkAllRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>

          <div className="divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent cursor-pointer transition-colors",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {notification.riskLevel && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs px-2 py-0", getRiskBadgeClass(notification.riskLevel))}
                          >
                            {notification.riskLevel === "critical" ? "CRITICAL" : 
                             notification.riskLevel === "at_risk" ? "AT RISK" : "INFO"}
                          </Badge>
                        )}
                        <span className="font-semibold text-sm text-foreground">
                          {notification.caseId}
                        </span>
                      </div>
                      
                      <p className="text-sm text-foreground mb-2">
                        {notification.message}
                      </p>
                      
                      {notification.sdohFlags && notification.sdohFlags.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          SDOH: {notification.sdohFlags.join(", ")}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
