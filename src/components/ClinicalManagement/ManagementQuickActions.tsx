import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  UserPlus, 
  FileText, 
  Calendar, 
  BarChart3,
  ClipboardCheck,
  Users,
  MessageSquare,
  Settings
} from "lucide-react";

interface ManagementQuickActionsProps {
  role: string;
}

export function ManagementQuickActions({ role }: ManagementQuickActionsProps) {
  const actions = [
    { icon: UserPlus, label: "Assign Case", variant: "default" as const },
    { icon: ClipboardCheck, label: "Review Performance", variant: "outline" as const },
    { icon: Calendar, label: "Schedule Meeting", variant: "outline" as const },
    { icon: FileText, label: "Create Report", variant: "outline" as const },
    { icon: MessageSquare, label: "Team Message", variant: "outline" as const },
    { icon: BarChart3, label: "View Analytics", variant: "outline" as const },
    { icon: Users, label: "Manage Team", variant: "outline" as const },
    { icon: Settings, label: "Settings", variant: "outline" as const },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-sm">Quick Actions</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Button 
              key={idx} 
              variant={action.variant}
              size="sm"
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
