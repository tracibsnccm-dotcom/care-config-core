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
  AlertCircle,
  TrendingDown
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/context/AppContext";
import { ROLES } from "@/config/rcms";
import { useRNAssignments, useRNAssessments, useRNDiary } from "@/hooks/useRNData";
import { format } from "date-fns";
import { RNToDoList } from "@/components/RNToDoList";
import { useEffect, useState } from "react";
import { fetchRNMetrics, type RNMetricsData } from "@/lib/rnMetrics";

export default function RNPortalLanding() {
  const { role } = useApp();
  const isSupervisor = role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN;
  const { assignments } = useRNAssignments();
  const { pending: pendingAssessments, requireFollowup } = useRNAssessments();
  const { entries: diaryEntries } = useRNDiary();
  const [metricsData, setMetricsData] = useState<RNMetricsData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const newAssignments = assignments.filter((a) => {
    const assignedDate = new Date(a.assigned_at);
    const daysSinceAssigned = Math.floor((Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceAssigned <= 3;
  });

  const upcomingDiaryEntries = diaryEntries.slice(0, 5);
  const hasEmergencies = metricsData && metricsData.metrics.alerts.length > 0;

  useEffect(() => {
    fetchRNMetrics()
      .then(data => {
        setMetricsData(data);
        setMetricsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch RN metrics:", err);
        setMetricsLoading(false);
      });
  }, []);

  const getColorClass = (value: number, target: number) => {
    if (value >= target) return "bg-green-500";
    if (value >= target - 5) return "bg-yellow-400";
    return "bg-red-500";
  };

  const getTrendIcon = (change: string) => {
    if (change.startsWith("+")) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change.startsWith("-")) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };
  
  return (
    <AppLayout>
      <div className="py-6 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-3">
            <span>RN Case Management</span>
            <span className="opacity-75">Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
            Welcome to Your Dashboard
          </h1>
          <p className="text-[#0f2a6a]/80 mt-2 max-w-2xl">
            Your performance metrics, assigned cases, and quick access to all tools.
          </p>
        </header>

          {/* Compact Emergency Alerts Banner */}
          {hasEmergencies && (
            <div className="mb-4">
              <Alert variant="destructive" className="border-l-4 animate-pulse">
                <AlertCircle className="h-4 w-4 animate-pulse" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="font-semibold">
                    {metricsData!.metrics.alerts.length} EMERGENCY Alert{metricsData!.metrics.alerts.length !== 1 ? 's' : ''} - SUICIDAL IDEATION
                  </span>
                  <Badge variant="destructive" className="animate-pulse">IMMEDIATE ACTION REQUIRED</Badge>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Quality & Performance Metrics - Always Visible */}
          {metricsData && (
            <section className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0f2a6a]">My Quality & Performance Metrics</CardTitle>
                  <CardDescription>
                    Your weekly and monthly performance vs. RCMS targets.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { 
                        label: "Notes ≤ 24h", 
                        value: metricsData.metrics.my_performance.notes_24h, 
                        target: metricsData.metrics.targets.notes_24h,
                        weekChange: metricsData.metrics.trend.week_change.notes_24h,
                        monthChange: metricsData.metrics.trend.month_change.notes_24h
                      },
                      { 
                        label: "Follow-Up Calls", 
                        value: metricsData.metrics.my_performance.followup_calls, 
                        target: metricsData.metrics.targets.followup_calls,
                        weekChange: metricsData.metrics.trend.week_change.followup_calls,
                        monthChange: metricsData.metrics.trend.month_change.followup_calls
                      },
                      { 
                        label: "Med Reconciliation", 
                        value: metricsData.metrics.my_performance.med_reconciliation, 
                        target: metricsData.metrics.targets.med_reconciliation,
                        weekChange: metricsData.metrics.trend.week_change.med_reconciliation,
                        monthChange: metricsData.metrics.trend.month_change.med_reconciliation
                      },
                      { 
                        label: "Care Plans Current", 
                        value: metricsData.metrics.my_performance.care_plans_current, 
                        target: metricsData.metrics.targets.care_plans_current,
                        weekChange: metricsData.metrics.trend.week_change.care_plans_current,
                        monthChange: metricsData.metrics.trend.month_change.care_plans_current
                      },
                    ].map((m, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-muted-foreground">{m.label}</div>
                          <div className="text-2xl font-bold text-foreground">{m.value}%</div>
                        </div>
                        <div className="h-2 rounded bg-muted mb-2">
                          <div 
                            className={`h-2 rounded transition-all ${getColorClass(m.value, m.target)}`} 
                            style={{ width: `${m.value}%` }} 
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">Target ≥ {m.target}%</div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              {getTrendIcon(m.weekChange)}
                              <span>Wk: {m.weekChange}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(m.monthChange)}
                              <span>Mo: {m.monthChange}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Tabbed Ribbon */}
          <Card className="mb-6">
            <Tabs defaultValue="overview" className="w-full">
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="diary">My Diary - Upcoming Schedule</TabsTrigger>
                  <TabsTrigger value="alerts">Alerts & Tasks</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent>
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="text-xs text-muted-foreground">Today's Schedule</div>
                      <div className="text-2xl font-bold text-blue-600 mt-1">
                        {diaryEntries.filter((e) => e.scheduled_date === new Date().toISOString().split("T")[0]).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Appointments</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="text-xs text-muted-foreground">New Assignments</div>
                      <div className="text-2xl font-bold mt-1">{newAssignments.length}</div>
                      <div className="text-xs text-muted-foreground">Last 3 days</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="text-xs text-muted-foreground">Incomplete Assessments</div>
                      <div className="text-2xl font-bold text-yellow-600 mt-1">{pendingAssessments.length}</div>
                      <div className="text-xs text-muted-foreground">To complete</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="text-xs text-muted-foreground">Follow-Ups</div>
                      <div className="text-2xl font-bold text-red-600 mt-1">{requireFollowup.length}</div>
                      <div className="text-xs text-muted-foreground">Required</div>
                    </div>
                  </div>
                </TabsContent>

                {/* My Diary - Upcoming Schedule Tab */}
                <TabsContent value="diary" className="mt-0">
                  {upcomingDiaryEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming appointments or calls</p>
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
                    </div>
                  )}
                </TabsContent>

                {/* Alerts & Tasks Tab */}
                <TabsContent value="alerts" className="mt-0">
                  {metricsData && metricsData.metrics.alerts.length > 0 ? (
                    <div className="space-y-2">
                      {metricsData.metrics.alerts.map((alert, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <div>
                              <div className="font-semibold text-sm">{alert.type}</div>
                              <div className="text-xs text-muted-foreground">{alert.case_id}</div>
                            </div>
                          </div>
                          <Badge variant={alert.priority === "high" ? "destructive" : "secondary"}>
                            {alert.days_overdue} day{alert.days_overdue > 1 ? 's' : ''} overdue
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No alerts at this time</p>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

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
                  {isSupervisor ? "Team Dashboard" : "Detailed Analytics"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {isSupervisor 
                    ? "Monitor team performance, manage assignments, and review quality metrics."
                    : "View comprehensive metrics dashboard with historical trends and analytics."}
                </p>
                <Badge className="mt-3" variant="secondary">
                  {isSupervisor ? "Supervisor View" : "Advanced View"}
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
                <Badge className="mt-3" variant="secondary">{assignments.length} Active</Badge>
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
            to="/attorney-dashboard"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[#0f2a6a]/10 text-[#0f2a6a] group-hover:bg-[#0f2a6a] group-hover:text-white transition">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Attorney Portal</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Communicate with attorneys, share case updates, and track legal coordination.
                </p>
                <Badge className="mt-3" variant="secondary">Legal Coordination</Badge>
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

          {/* To-Do List Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <RNToDoList />
          </div>
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
