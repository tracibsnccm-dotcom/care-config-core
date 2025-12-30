import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FolderOpen, 
  Users, 
  FileText, 
  Clock, 
  Stethoscope, 
  BarChart3,
  Wallet,
  Settings,
  MessageSquare
} from "lucide-react";

export function AttorneyQuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: FolderOpen,
      label: "View Cases",
      description: "Browse all your cases",
      onClick: () => navigate("/cases"),
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Clock,
      label: "Pending Assignments",
      description: "Review new client offers",
      onClick: () => navigate("/attorney-landing"),
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      icon: Stethoscope,
      label: "RN Liaison",
      description: "Clinical coordination",
      onClick: () => navigate("/rn-clinical-liaison"),
      color: "bg-teal-500/10 text-teal-600",
    },
    {
      icon: Users,
      label: "Providers",
      description: "Manage provider network",
      onClick: () => navigate("/providers"),
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      icon: BarChart3,
      label: "Reports",
      description: "View analytics & reports",
      onClick: () => navigate("/reports"),
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      icon: FileText,
      label: "Documents",
      description: "Access document hub",
      onClick: () => navigate("/document-hub"),
      color: "bg-green-500/10 text-green-600",
    },
    {
      icon: Wallet,
      label: "Billing & eWallet",
      description: "Manage payments",
      onClick: () => navigate("/attorney/billing"),
      color: "bg-[#b09837]/10 text-[#b09837]",
    },
    {
      icon: Settings,
      label: "Settings",
      description: "Account preferences",
      onClick: () => navigate("/settings"),
      color: "bg-gray-500/10 text-gray-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:border-primary"
                onClick={action.onClick}
              >
                <div className={`p-2 rounded-lg mb-2 ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
