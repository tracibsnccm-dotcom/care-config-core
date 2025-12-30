import { useApp } from "@/context/AppContext";
import { ROLES } from "@/config/rcms";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { fetchRNMetrics, type RNMetricsData } from "@/lib/rnMetrics";
import { AlertCircle, TrendingUp, TrendingDown, Users, Target, Award, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RNSupervisorDashboard() {
  const { role } = useApp();
  const [metricsData, setMetricsData] = useState<RNMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Role-based access check - only supervisors/managers
  const allowedRoles: string[] = [ROLES.SUPER_USER, ROLES.SUPER_ADMIN];
  const hasAccess = allowedRoles.includes(role);

  useEffect(() => {
    if (hasAccess) {
      fetchRNMetrics()
        .then(data => {
          setMetricsData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch RN metrics:", err);
          setLoading(false);
        });
    }
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <AppLayout>
        <section className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 px-6">
          <div className="max-w-lg w-full text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-semibold mb-4">
              <span>Restricted</span>
              <span className="opacity-70">Supervisor Only</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              This page is restricted to RN Case Management Supervisors and Managers.
              If you believe this is an error, contact your administrator.
            </p>
          </div>
        </section>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="py-10 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f2a6a] mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading team metrics...</p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!metricsData) {
    return (
      <AppLayout>
        <div className="py-10 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load team metrics data.</AlertDescription>
            </Alert>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { metrics } = metricsData;

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
      <div className="py-10 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
              <Users className="w-4 h-4" />
              <span>Supervisor Dashboard</span>
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
              RN Team Management
            </h1>
            <p className="mt-2 text-[#0f2a6a]/80 max-w-2xl">
              Monitor team performance, identify trends, and ensure quality standards across all RN case managers.
            </p>
            <div className="mt-3 text-sm text-[#0f2a6a]/70">
              Period: <span className="font-semibold">{metrics.period}</span>
            </div>
          </header>

          {/* Team Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground mt-1">Active RN CMs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Avg Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">90%</div>
                <p className="text-xs text-muted-foreground mt-1">Team average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Top Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RN A</div>
                <p className="text-xs text-muted-foreground mt-1">94% score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.alerts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Require attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Section */}
          {metrics.alerts.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-[#0f2a6a] mb-3">Active Alerts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metrics.alerts.map((alert, idx) => (
                  <Alert 
                    key={idx} 
                    variant={alert.priority === "high" ? "destructive" : "default"}
                    className="border-l-4"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{alert.type}</span>
                          <span className="mx-2">•</span>
                          <span className="text-muted-foreground">{alert.case_id}</span>
                        </div>
                        <Badge variant={alert.priority === "high" ? "destructive" : "secondary"}>
                          {alert.days_overdue} day{alert.days_overdue > 1 ? "s" : ""} overdue
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </section>
          )}

          {/* Team Performance Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Team Overview</TabsTrigger>
              <TabsTrigger value="individual">Individual Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Team Averages */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0f2a6a]">Team Quality Metrics</CardTitle>
                  <CardDescription>
                    Average performance across all RN case managers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Notes ≤ 24h</span>
                          <span className="text-lg font-bold">{metrics.team_averages.notes_24h}%</span>
                        </div>
                        <div className="h-2 rounded bg-muted">
                          <div 
                            className={`h-2 rounded ${getColorClass(metrics.team_averages.notes_24h, metrics.targets.notes_24h)}`}
                            style={{ width: `${metrics.team_averages.notes_24h}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Target: ≥ {metrics.targets.notes_24h}%</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Follow-Up Calls</span>
                          <span className="text-lg font-bold">{metrics.team_averages.followup_calls}%</span>
                        </div>
                        <div className="h-2 rounded bg-muted">
                          <div 
                            className={`h-2 rounded ${getColorClass(metrics.team_averages.followup_calls, metrics.targets.followup_calls)}`}
                            style={{ width: `${metrics.team_averages.followup_calls}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Target: ≥ {metrics.targets.followup_calls}%</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Med Reconciliation</span>
                          <span className="text-lg font-bold">{metrics.team_averages.med_reconciliation}%</span>
                        </div>
                        <div className="h-2 rounded bg-muted">
                          <div 
                            className={`h-2 rounded ${getColorClass(metrics.team_averages.med_reconciliation, metrics.targets.med_reconciliation)}`}
                            style={{ width: `${metrics.team_averages.med_reconciliation}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Target: ≥ {metrics.targets.med_reconciliation}%</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Care Plans Current</span>
                          <span className="text-lg font-bold">{metrics.team_averages.care_plans_current}%</span>
                        </div>
                        <div className="h-2 rounded bg-muted">
                          <div 
                            className={`h-2 rounded ${getColorClass(metrics.team_averages.care_plans_current, metrics.targets.care_plans_current)}`}
                            style={{ width: `${metrics.team_averages.care_plans_current}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Target: ≥ {metrics.targets.care_plans_current}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="individual" className="space-y-6">
              {/* Individual RN Performance Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0f2a6a]">RN Performance Comparison</CardTitle>
                  <CardDescription>
                    Compare individual performance against team averages and targets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold">RN</th>
                          <th className="text-left px-4 py-3 font-semibold">Notes ≤24h</th>
                          <th className="text-left px-4 py-3 font-semibold">Follow-Ups</th>
                          <th className="text-left px-4 py-3 font-semibold">Med Rec</th>
                          <th className="text-left px-4 py-3 font-semibold">Care Plans</th>
                          <th className="text-left px-4 py-3 font-semibold">Overall Score</th>
                          <th className="text-left px-4 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "RN A", notes: 97, fu: 93, med: 91, cp: 95, score: 94, status: "excellent" },
                          { name: "RN B", notes: 92, fu: 88, med: 90, cp: 89, score: 90, status: "good" },
                          { name: "RN C", notes: 89, fu: 85, med: 87, cp: 86, score: 87, status: "good" },
                        ].map((rn, i) => (
                          <tr key={i} className="border-t border-border hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium">{rn.name}</td>
                            <td className="px-4 py-3">
                              <span className={rn.notes >= 90 ? "text-green-600 font-semibold" : ""}>{rn.notes}%</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={rn.fu >= 85 ? "text-green-600 font-semibold" : ""}>{rn.fu}%</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={rn.med >= 85 ? "text-green-600 font-semibold" : ""}>{rn.med}%</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={rn.cp >= 90 ? "text-green-600 font-semibold" : ""}>{rn.cp}%</span>
                            </td>
                            <td className="px-4 py-3 font-bold">{rn.score}%</td>
                            <td className="px-4 py-3">
                              <Badge variant={rn.status === "excellent" ? "default" : "secondary"}>
                                {rn.status === "excellent" ? "Exceeds" : "Meets"} Target
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#0f2a6a]">Performance Trends</CardTitle>
                  <CardDescription>
                    Week-over-week and month-over-month trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Trend visualization charts coming soon</p>
                    <p className="text-sm mt-2">Will display historical performance data and forecasts</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Implementation notes */}
          <section className="mt-8">
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Implementation To Do:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Connect to real-time RN performance data from backend</li>
                    <li>Add drill-down capability to view individual case details</li>
                    <li>Implement trend charts and historical data visualization</li>
                    <li>Add export functionality for performance reports</li>
                    <li>Create automated alerts for performance issues</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
