import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Calendar, Users, AlertCircle, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function RNQuickActionsBar() {
  const navigate = useNavigate();

  const actions = [
    { icon: FileText, label: "New Note", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: MessageSquare, label: "Message Client", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: Calendar, label: "Schedule", onClick: () => navigate("/rn-diary") },
    { icon: Users, label: "Team Chat", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: AlertCircle, label: "Report Alert", onClick: () => navigate("/rn-clinical-liaison") },
    { icon: Activity, label: "Log Activity", onClick: () => navigate("/rn-clinical-liaison") },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={action.onClick}
        >
          <action.icon className="h-5 w-5" />
          <span className="text-xs">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
