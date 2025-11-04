import { useApp } from "@/context/AppContext";
import { ROLES } from "@/config/rcms";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { fetchRNMetrics, type RNMetricsData } from "@/lib/rnMetrics";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import RNCM_Compliance_Demo from "./RNCMCompliance";
import RNQualityDashboard from "./RNQualityDashboard";

export default function RNDashboard() {
  const { role } = useApp();
  const [metricsData, setMetricsData] = useState<RNMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Role-based access check
  const allowedRoles: string[] = [ROLES.RN_CCM, ROLES.SUPER_USER, ROLES.SUPER_ADMIN];
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
              <span className="opacity-70">RCMS Staff Only</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              This page is restricted to RCMS Nurse Case Managers and Supervisors.
              If you believe this is an error, contact your RCMS administrator.
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
                <p className="text-muted-foreground">Loading metrics...</p>
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
              <AlertDescription>Failed to load metrics data.</AlertDescription>
            </Alert>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { metrics } = metricsData;
  
  const myMetrics = [
    { 
      label: "Notes ≤ 24h", 
      value: metrics.my_performance.notes_24h, 
      target: metrics.targets.notes_24h,
      weekChange: metrics.trend.week_change.notes_24h,
      monthChange: metrics.trend.month_change.notes_24h
    },
    { 
      label: "Follow-Up Calls", 
      value: metrics.my_performance.followup_calls, 
      target: metrics.targets.followup_calls,
      weekChange: metrics.trend.week_change.followup_calls,
      monthChange: metrics.trend.month_change.followup_calls
    },
    { 
      label: "Med Reconciliation", 
      value: metrics.my_performance.med_reconciliation, 
      target: metrics.targets.med_reconciliation,
      weekChange: metrics.trend.week_change.med_reconciliation,
      monthChange: metrics.trend.month_change.med_reconciliation
    },
    { 
      label: "Care Plans Current", 
      value: metrics.my_performance.care_plans_current, 
      target: metrics.targets.care_plans_current,
      weekChange: metrics.trend.week_change.care_plans_current,
      monthChange: metrics.trend.month_change.care_plans_current
    },
  ];

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
            <span>RCMS Internal</span>
            <span className="opacity-70">Individual View</span>
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
            RN Dashboard
          </h1>
          <p className="mt-2 text-[#0f2a6a]/80 max-w-2xl">
            Track performance, quality metrics, and compliance. Access all oversight tools in one place.
          </p>
          <div className="mt-3 text-sm text-[#0f2a6a]/70">
            Period: <span className="font-semibold">{metrics.period}</span>
          </div>
        </header>

        {/* Tabbed Interface */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="performance">My Performance</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
          </TabsList>

          {/* Performance Tab (Original Dashboard Content) */}
          <TabsContent value="performance" className="space-y-6">
            {/* Alerts Section */}
            {metrics.alerts.length > 0 && (
          <section className="mb-6">
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

        {/* My Performance Metrics */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0f2a6a]">My Quality Metrics</CardTitle>
              <CardDescription>
                Your weekly and monthly performance vs. RCMS targets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myMetrics.map((m, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">{m.label}</div>
                    <div className="mt-1 text-2xl font-extrabold text-foreground">{m.value}%</div>
                    <div className="mt-2 h-2 rounded bg-muted">
                      <div 
                        className={`h-2 rounded ${getColorClass(m.value, m.target)}`} 
                        style={{ width: `${m.value}%` }} 
                      />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Target ≥ {m.target}%</div>
                    
                    {/* Trend indicators */}
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        {getTrendIcon(m.weekChange)}
                        <span>Week: {m.weekChange}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(m.monthChange)}
                        <span>Month: {m.monthChange}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            </Card>
          </section>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <RNCM_Compliance_Demo />
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality">
            <RNQualityDashboard currentRole={role as any} />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
