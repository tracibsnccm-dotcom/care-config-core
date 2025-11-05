import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/auth/supabaseAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Calendar, 
  BarChart3, 
  Workflow,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  ClipboardCheck,
  UserCheck,
  FileText,
  Target
} from "lucide-react";
import { ManagementMetrics } from "@/components/ClinicalManagement/ManagementMetrics";
import { ManagementReviewQueue } from "@/components/ClinicalManagement/ManagementReviewQueue";
import { ManagementApprovalQueue } from "@/components/ClinicalManagement/ManagementApprovalQueue";
import { TeamCaseManagement } from "@/components/ClinicalManagement/TeamCaseManagement";
import { TeamPerformanceDashboard } from "@/components/ClinicalManagement/TeamPerformanceDashboard";
import { WorkflowManagement } from "@/components/ClinicalManagement/WorkflowManagement";
import { ManagementQuickActions } from "@/components/ClinicalManagement/ManagementQuickActions";
import { StaffManagement } from "@/components/ClinicalManagement/StaffManagement";
import { TrainingCompliance } from "@/components/ClinicalManagement/TrainingCompliance";
import { WorkloadBalancer } from "@/components/ClinicalManagement/WorkloadBalancer";
import { QualityImprovement } from "@/components/ClinicalManagement/QualityImprovement";
import { ClinicalAudits } from "@/components/ClinicalManagement/ClinicalAudits";
import { ClientSatisfaction } from "@/components/ClinicalManagement/ClientSatisfaction";
import { TeamCommunications } from "@/components/ClinicalManagement/TeamCommunications";
import { FinancialDashboard } from "@/components/ClinicalManagement/FinancialDashboard";
import { RiskManagement } from "@/components/ClinicalManagement/RiskManagement";
import { CredentialingTracker } from "@/components/ClinicalManagement/CredentialingTracker";
import { ResourceManagement } from "@/components/ClinicalManagement/ResourceManagement";
import { SchedulingCalendar } from "@/components/ClinicalManagement/SchedulingCalendar";
import { GoalsStrategic } from "@/components/ClinicalManagement/GoalsStrategic";
import { useState, useEffect } from "react";

export default function ClinicalManagementPortal() {
  const { user } = useAuth();
  
  const roleSet = new Set((user?.roles || []).map(r => r.toUpperCase()));
  const isDirector = roleSet.has("RN_CM_DIRECTOR");
  const isSupervisor = roleSet.has("RN_CM_SUPERVISOR");
  const isManager = roleSet.has("RN_CM_MANAGER");

  const roleTitle = isDirector ? "Director" : isSupervisor ? "Supervisor" : isManager ? "Manager" : "Clinical Management";
  const roleLevel = isDirector ? "executive" : isSupervisor ? "leadership" : "operational";

  const [pendingReviews, setPendingReviews] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    // These would be fetched from the database
    setPendingReviews(12);
    setPendingApprovals(8);
  }, []);

  return (
    <AppLayout>
      <div className="py-6 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-3">
              <Users className="h-4 w-4" />
              <span>Clinical {roleTitle}</span>
              <span className="opacity-75">Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
              Welcome to Your Management Dashboard
            </h1>
            <p className="text-[#0f2a6a]/80 mt-2 max-w-2xl">
              Manage your team, review performance metrics, and approve key decisions.
            </p>
          </header>

          {/* Quick Actions Bar */}
          <section className="mb-6">
            <ManagementQuickActions role={roleTitle} />
          </section>

          {/* Urgent Alerts */}
          {pendingReviews > 10 && (
            <div className="mb-4">
              <Alert variant="destructive" className="border-l-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="font-semibold">
                    {pendingReviews} items require immediate review
                  </span>
                  <Badge variant="destructive">ACTION REQUIRED</Badge>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Management Metrics */}
          <section className="mb-6">
            <ManagementMetrics 
              roleLevel={roleLevel}
              isDirector={isDirector}
              isSupervisor={isSupervisor}
              isManager={isManager}
            />
          </section>

          {/* Summary Cards */}
          <section className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border bg-card hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <Badge variant="outline" className="text-xs">Urgent</Badge>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mt-1">{pendingReviews}</div>
                <div className="text-xs text-muted-foreground">Pending Reviews</div>
              </div>
              
              <div className="p-3 rounded-lg border bg-card hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <Badge variant="outline" className="text-xs">Action</Badge>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-1">{pendingApprovals}</div>
                <div className="text-xs text-muted-foreground">Pending Approvals</div>
              </div>
              
              <div className="p-3 rounded-lg border bg-card hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-1">24</div>
                <div className="text-xs text-muted-foreground">Team Members</div>
              </div>
              
              <div className="p-3 rounded-lg border bg-card hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <Badge variant="outline" className="text-xs">Performance</Badge>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">94%</div>
                <div className="text-xs text-muted-foreground">Team Avg</div>
              </div>
            </div>
          </section>

          {/* Main Tabbed Interface */}
          <Card className="mb-6">
            <Tabs defaultValue="overview" className="w-full">
              <CardHeader className="pb-6">
                <TabsList className="grid w-full grid-cols-6 lg:grid-cols-9 mb-2">
                  <TabsTrigger value="overview">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="reviews">
                    Reviews
                    {pendingReviews > 0 && (
                      <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-yellow-600 animate-pulse" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approvals">
                    Approvals
                    {pendingApprovals > 0 && (
                      <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="team-cases">
                    Cases
                  </TabsTrigger>
                  <TabsTrigger value="staff">
                    Staff
                  </TabsTrigger>
                  <TabsTrigger value="workload">
                    Workload
                  </TabsTrigger>
                  <TabsTrigger value="training">
                    Training
                  </TabsTrigger>
                  <TabsTrigger value="performance">
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="quality">
                    Quality
                  </TabsTrigger>
                  <TabsTrigger value="audits">
                    Audits
                  </TabsTrigger>
                  <TabsTrigger value="satisfaction">
                    Satisfaction
                  </TabsTrigger>
                  <TabsTrigger value="communications">
                    Comms
                  </TabsTrigger>
                  <TabsTrigger value="financial">
                    Financial
                  </TabsTrigger>
                  <TabsTrigger value="risk">
                    Risk
                  </TabsTrigger>
                  <TabsTrigger value="credentials">
                    Credentials
                  </TabsTrigger>
                  <TabsTrigger value="resources">
                    Resources
                  </TabsTrigger>
                  <TabsTrigger value="scheduling">
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="goals">
                    Goals
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="pt-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Today's Priorities</CardTitle>
                        <CardDescription>Most urgent items requiring attention</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">3 RN performance reviews overdue</div>
                              <div className="text-xs text-muted-foreground">Due 2 days ago</div>
                            </div>
                            <Badge variant="destructive" className="text-xs">Critical</Badge>
                          </div>
                          
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                            <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">5 case reassignments pending approval</div>
                              <div className="text-xs text-muted-foreground">Requested today</div>
                            </div>
                            <Badge variant="outline" className="text-xs">Urgent</Badge>
                          </div>
                          
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">Weekly team report due tomorrow</div>
                              <div className="text-xs text-muted-foreground">Due in 1 day</div>
                            </div>
                            <Badge variant="outline" className="text-xs">Upcoming</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Team Status</CardTitle>
                        <CardDescription>Current team health and capacity</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Team Capacity</span>
                              <span className="font-semibold">78%</span>
                            </div>
                            <div className="h-2 rounded bg-muted">
                              <div className="h-2 rounded bg-green-500" style={{ width: '78%' }} />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Avg Response Time</span>
                              <span className="font-semibold">2.4 hrs</span>
                            </div>
                            <div className="h-2 rounded bg-muted">
                              <div className="h-2 rounded bg-blue-500" style={{ width: '85%' }} />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Quality Score</span>
                              <span className="font-semibold">94%</span>
                            </div>
                            <div className="h-2 rounded bg-muted">
                              <div className="h-2 rounded bg-emerald-500" style={{ width: '94%' }} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Review Queue Tab */}
                <TabsContent value="reviews" className="mt-4">
                  <ManagementReviewQueue roleLevel={roleLevel} />
                </TabsContent>

                {/* Approvals Tab */}
                <TabsContent value="approvals" className="mt-4">
                  <ManagementApprovalQueue roleLevel={roleLevel} />
                </TabsContent>

                {/* Team Cases Tab */}
                <TabsContent value="team-cases" className="mt-4">
                  <TeamCaseManagement />
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="mt-4">
                  <TeamPerformanceDashboard />
                </TabsContent>

                {/* Staff Tab */}
                <TabsContent value="staff" className="mt-4">
                  <StaffManagement />
                </TabsContent>

                {/* Training Tab */}
                <TabsContent value="training" className="mt-4">
                  <TrainingCompliance />
                </TabsContent>

                {/* Workload Tab */}
                <TabsContent value="workload" className="mt-4">
                  <WorkloadBalancer />
                </TabsContent>

                {/* Quality Improvement Tab */}
                <TabsContent value="quality" className="mt-4">
                  <QualityImprovement />
                </TabsContent>

                {/* Clinical Audits Tab */}
                <TabsContent value="audits" className="mt-4">
                  <ClinicalAudits />
                </TabsContent>

                {/* Client Satisfaction Tab */}
                <TabsContent value="satisfaction" className="mt-4">
                  <ClientSatisfaction />
                </TabsContent>

                {/* Team Communications Tab */}
                <TabsContent value="communications" className="mt-4">
                  <TeamCommunications />
                </TabsContent>

                {/* Financial Dashboard Tab */}
                <TabsContent value="financial" className="mt-4">
                  <FinancialDashboard />
                </TabsContent>

                {/* Risk Management Tab */}
                <TabsContent value="risk" className="mt-4">
                  <RiskManagement />
                </TabsContent>

                {/* Credentialing Tracker Tab */}
                <TabsContent value="credentials" className="mt-4">
                  <CredentialingTracker />
                </TabsContent>

                {/* Resource Management Tab */}
                <TabsContent value="resources" className="mt-4">
                  <ResourceManagement />
                </TabsContent>

                {/* Scheduling Calendar Tab */}
                <TabsContent value="scheduling" className="mt-4">
                  <SchedulingCalendar />
                </TabsContent>

                {/* Goals & Strategic Planning Tab */}
                <TabsContent value="goals" className="mt-4">
                  <GoalsStrategic />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Workflows - Separate Section for Directors/Supervisors */}
          {(isDirector || isSupervisor) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Workflow Management
                </CardTitle>
                <CardDescription>
                  Create and manage care workflow templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowManagement />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
