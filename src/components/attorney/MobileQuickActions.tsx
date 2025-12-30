import { FileText, MessageSquare, Calendar, CheckSquare, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  badge?: number;
}

export default function MobileQuickActions() {
  const [activeTab, setActiveTab] = useState<string>("overview");

  const quickActions: QuickAction[] = [
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Cases",
      action: () => setActiveTab("overview")
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Messages",
      action: () => setActiveTab("communication"),
      badge: 3
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Calendar",
      action: () => setActiveTab("calendar")
    },
    {
      icon: <CheckSquare className="h-5 w-5" />,
      label: "Tasks",
      action: () => setActiveTab("tasks"),
      badge: 5
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Analytics",
      action: () => setActiveTab("analytics")
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Referrals",
      action: () => setActiveTab("referrals")
    }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 safe-area-bottom">
      <div className="grid grid-cols-6 gap-1 p-2">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="flex flex-col h-auto py-2 px-1 relative"
            onClick={action.action}
          >
            {action.badge && (
              <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {action.badge}
              </span>
            )}
            {action.icon}
            <span className="text-xs mt-1 leading-none">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
