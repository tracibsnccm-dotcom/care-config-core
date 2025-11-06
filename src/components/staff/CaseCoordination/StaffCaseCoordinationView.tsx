import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { Calendar, Users, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/supabaseAuth";

export function StaffCaseCoordinationView() {
  const { cases } = useApp();
  const { user } = useAuth();
  const isRcmsStaff = user?.roles?.includes("RCMS_STAFF");

  const activeCases = cases.filter(c => 
    c.status === "IN_PROGRESS" || c.status === "ROUTED"
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Case Coordination</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeCases.length > 0 ? (
              activeCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {caseItem.client.fullName || caseItem.client.displayNameMasked || caseItem.client.attyRef}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Case Type: {caseItem.intake.incidentType}
                      </p>
                    </div>
                    <Badge variant={
                      caseItem.status === "IN_PROGRESS" ? "default" : "secondary"
                    }>
                      {caseItem.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active cases requiring coordination</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { client: "Sarah Johnson", type: "Medical Evaluation", time: "Tomorrow, 10:00 AM" },
                { client: "Mike Torres", type: "Follow-up Call", time: "Tomorrow, 2:00 PM" },
              ].map((appt, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">{appt.client}</p>
                  <p className="text-xs text-muted-foreground">{appt.type}</p>
                  <p className="text-xs text-muted-foreground mt-1">{appt.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Coordination Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isRcmsStaff ? (
                /* RCMS Staff Tasks */
                [
                  { task: "Assign RN to new case", priority: "High", badge: "RCMS" },
                  { task: "Review provider credentials", priority: "Medium", badge: "RCMS" },
                  { task: "Schedule clinical coordination call", priority: "Medium", badge: "RCMS" },
                ].map((task, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-primary/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{task.task}</p>
                      <Badge variant={
                        task.priority === "High" ? "destructive" :
                        task.priority === "Medium" ? "default" :
                        "secondary"
                      } className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                    <span className="text-xs bg-primary/20 px-2 py-0.5 rounded">{task.badge}</span>
                  </div>
                ))
              ) : (
                /* Firm Staff Tasks */
                [
                  { task: "Schedule client consultation", priority: "High", badge: "Firm" },
                  { task: "Prepare case documents for attorney", priority: "Medium", badge: "Firm" },
                  { task: "Follow up on discovery requests", priority: "Low", badge: "Firm" },
                ].map((task, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-secondary/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{task.task}</p>
                      <Badge variant={
                        task.priority === "High" ? "destructive" :
                        task.priority === "Medium" ? "default" :
                        "secondary"
                      } className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                    <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded">{task.badge}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* RCMS Staff Only: Clinical Coordination Section */}
      {isRcmsStaff && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Clinical Coordination Dashboard
              <span className="text-xs bg-primary/20 px-2 py-1 rounded">RCMS Only</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">12</p>
                <p className="text-sm text-muted-foreground">Active RN Assignments</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">8</p>
                <p className="text-sm text-muted-foreground">Provider Network Updates</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">3</p>
                <p className="text-sm text-muted-foreground">Pending Authorizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Firm Staff Only: Legal Coordination Section */}
      {!isRcmsStaff && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Legal Coordination Dashboard
              <span className="text-xs bg-secondary/50 px-2 py-1 rounded">Firm Staff</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-secondary">5</p>
                <p className="text-sm text-muted-foreground">Pending Client Calls</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-secondary">3</p>
                <p className="text-sm text-muted-foreground">Documents to Review</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold text-secondary">7</p>
                <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
