import { Link } from "react-router-dom";
import { 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  ClipboardList,
  HeartPulse,
  MessageSquare,
  Settings,
  Users,
  Activity,
  FolderKanban,
  Calendar,
  ClipboardCheck,
  AlertCircle
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import { ROLES } from "@/config/rcms";
import { useRNAssignments, useRNAssessments, useRNDiary } from "@/hooks/useRNData";
import { format } from "date-fns";
import { EmergencyAlertsCard } from "@/components/RNClinicalLiaison/EmergencyAlertsCard";

export default function RNPortalLanding() {
  const { role } = useApp();
  const isSupervisor = role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN;
  const { assignments } = useRNAssignments();
  const { pending: pendingAssessments, requireFollowup } = useRNAssessments();
  const { entries: diaryEntries } = useRNDiary();

  const newAssignments = assignments.filter((a) => {
    const assignedDate = new Date(a.assigned_at);
    const daysSinceAssigned = Math.floor((Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceAssigned <= 3; // Consider "new" if assigned within last 3 days
  });

  const upcomingDiaryEntries = diaryEntries.slice(0, 5); // Show next 5 entries
  
  return (
    <AppLayout>
      <div className="py-10 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-3">
            <span>RN Case Management</span>
            <span className="opacity-75">Portal Home</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
            Welcome to Your RN Portal
          </h1>
          <p className="text-[#0f2a6a]/80 mt-2 max-w-2xl">
            Access your dashboard, manage cases, track compliance, and communicate with clients and providers.
          </p>
        </header>

          {/* Emergency Alerts - Priority Section */}
          <div className="mb-8">
            <EmergencyAlertsCard />
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {diaryEntries.filter((e) => e.scheduled_date === new Date().toISOString().split("T")[0]).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Appointments/calls</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{newAssignments.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 3 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingAssessments.length}</div>
                <p className="text-xs text-muted-foreground mt-1">To be completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Follow-Ups Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{requireFollowup.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* New Assigned Cases Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#0f2a6a]" />
                  New Assigned Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                {newAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No new assignments</p>
                ) : (
                  <div className="space-y-2">
                    {newAssignments.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="p-2 rounded bg-muted/50 text-sm">
                        <div className="font-medium">Case: {assignment.case_id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground">
                          Assigned {format(new Date(assignment.assigned_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    ))}
                    {newAssignments.length > 3 && (
                      <Link to="/cases" className="text-xs text-[#0f2a6a] hover:underline block mt-2">
                        View all {newAssignments.length} new assignments →
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assessments to Complete Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-yellow-600" />
                  Assessments to Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingAssessments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All assessments completed</p>
                ) : (
                  <div className="space-y-2">
                    {pendingAssessments.slice(0, 3).map((assessment) => (
                      <div key={assessment.id} className="p-2 rounded bg-yellow-50 dark:bg-yellow-900/20 text-sm">
                        <div className="font-medium">{assessment.assessment_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {assessment.due_date ? `Due: ${format(new Date(assessment.due_date), "MMM d")}` : "No due date"}
                        </div>
                      </div>
                    ))}
                    {pendingAssessments.length > 3 && (
                      <p className="text-xs text-yellow-600 mt-2">+{pendingAssessments.length - 3} more pending</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assessments Requiring Follow-Ups Card */}
            <Card className="hover:shadow-lg transition-shadow border-red-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Require Follow-Up
                </CardTitle>
              </CardHeader>
              <CardContent>
                {requireFollowup.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No follow-ups needed</p>
                ) : (
                  <div className="space-y-2">
                    {requireFollowup.slice(0, 3).map((assessment) => (
                      <div key={assessment.id} className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-sm">
                        <div className="font-medium">{assessment.assessment_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {assessment.followup_reason || "Follow-up required"}
                        </div>
                        {assessment.followup_due_date && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            Due: {format(new Date(assessment.followup_due_date), "MMM d")}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {requireFollowup.length > 3 && (
                      <p className="text-xs text-red-600 mt-2">+{requireFollowup.length - 3} more follow-ups</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Diary Entries */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0f2a6a]" />
                  My Diary - Upcoming Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingDiaryEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming appointments or calls</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingDiaryEntries.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition">
                        <div className="text-center min-w-[60px]">
                          <div className="text-sm font-semibold">{format(new Date(entry.scheduled_date), "MMM d")}</div>
                          {entry.scheduled_time && (
                            <div className="text-xs text-muted-foreground">
                              {entry.scheduled_time.slice(0, 5)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{entry.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.entry_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            {entry.location && ` • ${entry.location}`}
                          </div>
                          {entry.description && (
                            <div className="text-xs text-muted-foreground mt-1">{entry.description}</div>
                          )}
                        </div>
                        <Badge variant={entry.status === "scheduled" ? "secondary" : "default"}>
                          {entry.status}
                        </Badge>
                      </div>
                    ))}
                    <Link 
                      to={isSupervisor ? "/rn-supervisor-dashboard" : "/rn-dashboard"}
                      className="text-sm text-[#0f2a6a] hover:underline block mt-2"
                    >
                      View full diary →
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to={isSupervisor ? "/rn-supervisor-dashboard" : "/rn-dashboard"}
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#0f2a6a]/10 text-[#0f2a6a] group-hover:bg-[#0f2a6a] group-hover:text-white transition">
                {isSupervisor ? <Users className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">
                  {isSupervisor ? "Team Dashboard" : "My Dashboard"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {isSupervisor 
                    ? "Monitor team performance, manage assignments, and review quality metrics."
                    : "View your performance metrics, assigned cases, and quality targets."}
                </p>
                <Badge className="mt-3" variant="secondary">
                  {isSupervisor ? "Supervisor View" : "My Metrics"}
                </Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/cases"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#128f8b]/10 text-[#128f8b] group-hover:bg-[#128f8b] group-hover:text-white transition">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">My Cases</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Access assigned cases, update notes, and track care plans.
                </p>
                <Badge className="mt-3" variant="secondary">24 Active</Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/rn-clinical-liaison"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#0f2a6a]/10 text-[#0f2a6a] group-hover:bg-[#0f2a6a] group-hover:text-white transition">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Clinical Liaison</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Coordinate care, manage appointments, and track medical records.
                </p>
                <Badge className="mt-3" variant="secondary">Care Coordination</Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/rn-diary"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#0f2a6a]/10 text-[#0f2a6a] group-hover:bg-[#0f2a6a] group-hover:text-white transition">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">My Diary & Schedule</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  View all appointments, calls, follow-ups, and meetings in one calendar.
                </p>
                <Badge className="mt-3" variant="secondary">{upcomingDiaryEntries.length} Upcoming</Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/client-portal"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#128f8b]/10 text-[#128f8b] group-hover:bg-[#128f8b] group-hover:text-white transition">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Client Communication</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Message clients, review check-ins, and monitor wellness data.
                </p>
                <Badge className="mt-3" variant="secondary">HIPAA Secure</Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/providers"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#0f2a6a]/10 text-[#0f2a6a] group-hover:bg-[#0f2a6a] group-hover:text-white transition">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Provider Network</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Contact providers, request updates, and coordinate referrals.
                </p>
                <Badge className="mt-3" variant="secondary">Network Access</Badge>
              </div>
            </div>
          </Link>

          <Link
            to="/documents"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#128f8b]/10 text-[#128f8b] group-hover:bg-[#128f8b] group-hover:text-white transition">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Documents & Files</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Access medical records, reports, and case documentation.
                </p>
                <Badge className="mt-3" variant="secondary">Secure Storage</Badge>
              </div>
            </div>
          </Link>
        </div>

        {/* Compliance & Quality Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0f2a6a] mb-4">Compliance & Quality</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/rn-cm/compliance"
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white transition">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Compliance Tasks</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Required fields, care plan timeliness, documentation standards.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/rn-cm/quality"
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Quality Metrics</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track performance, compare with team averages, view trends.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Settings & Profile */}
        <div>
          <h2 className="text-xl font-bold text-[#0f2a6a] mb-4">Settings & Profile</h2>
          <Link
            to="/rn/settings"
            className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition group inline-flex items-start gap-3 w-full md:w-auto"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-700 group-hover:bg-gray-600 group-hover:text-white transition">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">RN Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Update profile, availability, communication preferences, and security settings.
              </p>
            </div>
          </Link>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
