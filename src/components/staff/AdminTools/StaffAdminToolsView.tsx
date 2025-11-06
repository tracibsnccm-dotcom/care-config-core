import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, FileText, Users, Clock, Database } from "lucide-react";
import { useAuth } from "@/auth/supabaseAuth";

export function StaffAdminToolsView() {
  const { user } = useAuth();
  const isRcmsStaff = user?.roles?.includes("RCMS_STAFF");

  const tools = [
    {
      title: "Time Tracking",
      description: "Log and manage daily work hours",
      icon: Clock,
      available: true,
    },
    {
      title: "Template Management",
      description: "Manage document and email templates",
      icon: FileText,
      available: true,
    },
    {
      title: "Contact Directory",
      description: "Access staff and provider contacts",
      icon: Users,
      available: true,
    },
    {
      title: "System Settings",
      description: isRcmsStaff ? "Configure RCMS operational settings" : "Configure office settings",
      icon: Settings,
      available: isRcmsStaff,
    },
    {
      title: "Data Reports",
      description: "Generate operational reports",
      icon: Database,
      available: true,
    },
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
                }`}
              >
                <div className="flex items-start gap-3">
                  <tool.icon className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{tool.title}</h3>
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
