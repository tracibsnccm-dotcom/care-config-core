import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, FileText, Users, Clock, Database } from "lucide-react";
import { useAuth } from "@/auth/supabaseAuth";

export function StaffAdminToolsView() {
  const { user } = useAuth();
  const isRcmsStaff = user?.roles?.includes("RCMS_STAFF");

  const commonTools = [
    {
      title: "Time Tracking",
      description: "Log and manage daily work hours",
      icon: Clock,
      available: true,
      badge: null,
    },
    {
      title: "Template Management",
      description: "Manage document and email templates",
      icon: FileText,
      available: true,
      badge: null,
    },
    {
      title: "Contact Directory",
      description: "Access staff and provider contacts",
      icon: Users,
      available: true,
      badge: null,
    },
  ];

  const rcmsOnlyTools = [
    {
      title: "Clinical System Settings",
      description: "Configure RCMS operational settings and workflows",
      icon: Settings,
      available: true,
      badge: "RCMS",
    },
    {
      title: "Provider Network Admin",
      description: "Manage provider credentials and network",
      icon: Users,
      available: true,
      badge: "RCMS",
    },
    {
      title: "Compliance Dashboard",
      description: "Monitor compliance and quality metrics",
      icon: Database,
      available: true,
      badge: "RCMS",
    },
    {
      title: "RN Scheduling",
      description: "Manage RN assignments and availability",
      icon: Clock,
      available: true,
      badge: "RCMS",
    },
  ];

  const firmStaffTools = [
    {
      title: "Office Settings",
      description: "Configure law firm office preferences",
      icon: Settings,
      available: true,
      badge: "Firm",
    },
    {
      title: "Client Reports",
      description: "Generate client status and billing reports",
      icon: Database,
      available: true,
      badge: "Firm",
    },
  ];

  const tools = [
    ...commonTools,
    ...(isRcmsStaff ? rcmsOnlyTools : firmStaffTools),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Administrative Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <div
                key={tool.title}
                className={`p-4 border rounded-lg transition-colors ${
                  tool.available
                    ? "hover:bg-muted/50 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                } ${tool.badge === "RCMS" ? "bg-primary/5" : tool.badge === "Firm" ? "bg-secondary/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <tool.icon className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{tool.title}</h3>
                      {tool.badge && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          tool.badge === "RCMS" ? "bg-primary/20" : "bg-secondary/50"
                        }`}>
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {tool.description}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={!tool.available}
                    >
                      {tool.available ? "Open" : "Coming Soon"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Button variant="outline" className="justify-start">
              View All Cases
            </Button>
            <Button variant="outline" className="justify-start">
              Document Library
            </Button>
            <Button variant="outline" className="justify-start">
              Staff Directory
            </Button>
            {isRcmsStaff && (
              <>
                <Button variant="outline" className="justify-start">
                  Clinical Guidelines
                </Button>
                <Button variant="outline" className="justify-start">
                  Compliance Center
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
