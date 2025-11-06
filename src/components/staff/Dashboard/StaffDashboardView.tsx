import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/auth/supabaseAuth";

export function StaffDashboardView() {
  const { cases } = useApp();
  const { user } = useAuth();
  
  const isRcmsStaff = user?.roles?.includes("RCMS_STAFF");

  const today = new Date().toDateString();
  const todayDocuments = 5; // Mock data
  const pendingReviews = cases.filter(c => c.status === "ROUTED").length;
  const completedToday = cases.filter(
    (c) =>
      c.status === "CLOSED" &&
      new Date(c.updatedAt || "").toDateString() === today
  ).length;
  const urgentItems = cases.filter((c) => c.status === "HOLD_SENSITIVE").length;

  const stats = [
    { label: "Documents Today", value: todayDocuments, icon: FileText, color: "text-blue-600" },
    { label: "Pending Reviews", value: pendingReviews, icon: Clock, color: "text-amber-600" },
    { label: "Completed Today", value: completedToday, icon: CheckCircle, color: "text-green-600" },
    { label: "Urgent Items", value: urgentItems, icon: AlertCircle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isRcmsStaff ? "RCMS Staff Quick Actions" : "Attorney Firm Quick Actions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Common Actions for All Staff */}
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h3 className="font-semibold mb-2">Process Documents</h3>
              <p className="text-sm text-muted-foreground">
                Review and organize incoming case documents
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <h3 className="font-semibold mb-2">Schedule Coordination</h3>
              <p className="text-sm text-muted-foreground">
                Manage appointments and case timelines
              </p>
            </div>
            
            {/* RCMS Staff Specific Actions */}
            {isRcmsStaff ? (
              <>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-primary/5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    Clinical Workflow Management
                    <span className="text-xs bg-primary/20 px-2 py-0.5 rounded">RCMS</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Coordinate RN assignments and clinical workflows
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-primary/5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    Provider Network Management
                    <span className="text-xs bg-primary/20 px-2 py-0.5 rounded">RCMS</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Manage provider relationships and credentials
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-primary/5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    Compliance Monitoring
                    <span className="text-xs bg-primary/20 px-2 py-0.5 rounded">RCMS</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Track compliance and quality metrics
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-primary/5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    System Operations
                    <span className="text-xs bg-primary/20 px-2 py-0.5 rounded">RCMS</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure RCMS operational settings
                  </p>
                </div>
              </>
            ) : (
              /* Attorney Firm Staff Specific Actions */
              <>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-secondary/5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    Client Communications
                    <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded">Firm</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Handle client inquiries and updates
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-secondary/5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    Attorney Support
                    <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded">Firm</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Assist with case preparation and filing
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "Document uploaded", case: "Smith v. Jones", time: "10 minutes ago" },
              { action: "Case status updated", case: "Johnson Medical", time: "1 hour ago" },
              { action: "Meeting scheduled", case: "Taylor Personal Injury", time: "2 hours ago" },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.case}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
