import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/auth/supabaseAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamCaseManagement } from "@/components/ClinicalManagement/TeamCaseManagement";
import { TeamCalendarView } from "@/components/ClinicalManagement/TeamCalendarView";
import { TeamPerformanceDashboard } from "@/components/ClinicalManagement/TeamPerformanceDashboard";
import { WorkflowManagement } from "@/components/ClinicalManagement/WorkflowManagement";
import { Users, Calendar, BarChart3, Workflow } from "lucide-react";

export default function ClinicalManagementPortal() {
  const { user } = useAuth();
  
  const roleSet = new Set((user?.roles || []).map(r => r.toUpperCase()));
  const isDirector = roleSet.has("RN_CM_DIRECTOR");
  const isSupervisor = roleSet.has("RN_CM_SUPERVISOR");
  const isManager = roleSet.has("RN_CM_MANAGER");

  const roleTitle = isDirector ? "Director" : isSupervisor ? "Supervisor" : isManager ? "Manager" : "Clinical Management";

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Clinical Management Portal</h1>
          <p className="text-muted-foreground mt-2">
            {roleTitle} Dashboard - Manage team workflows, assignments, and performance
          </p>
        </div>

        <Tabs defaultValue="team-cases" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="team-cases" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Cases
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Team Calendar
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Workflows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team-cases">
            <Card>
              <CardHeader>
                <CardTitle>Team Case Management</CardTitle>
                <CardDescription>
                  Assign, reassign, and manage cases across your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamCaseManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Team Calendar</CardTitle>
                <CardDescription>
                  View schedules and appointments for all team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamCalendarView />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>
                  Monitor team metrics and individual performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamPerformanceDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Management</CardTitle>
                <CardDescription>
                  Create and manage care workflow templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
