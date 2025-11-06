import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, AlertTriangle, TrendingUp, Clock, FileText } from "lucide-react";
import { useTeamCases } from "@/hooks/useTeamCases";
import { usePerformanceMetrics } from "@/hooks/usePerformanceMetrics";
import { useCaseReviews } from "@/hooks/useCaseReviews";
import { Progress } from "@/components/ui/progress";

export function OverviewDashboard() {
  const { cases } = useTeamCases();
  const { metrics } = usePerformanceMetrics();
  const { reviews } = useCaseReviews();

  const activeRNs = new Set(cases.map(c => c.assigned_to).filter(Boolean)).size;
  const avgTaskCompletion = cases.length > 0 
    ? Math.round((cases.reduce((sum, c) => sum + (c.total_tasks > 0 ? (c.completed_tasks / c.total_tasks) * 100 : 0), 0) / cases.length))
    : 0;
  const pendingReviews = reviews.filter(r => r.status === 'pending').length;

  const overviewCards = [
    {
      title: "Total Active Cases",
      value: cases.length,
      icon: FileText,
      change: "+12% vs last month",
      color: "text-blue-600"
    },
    {
      title: "Active RN CMs",
      value: activeRNs,
      icon: Users,
      change: "100% capacity",
      color: "text-green-600"
    },
    {
      title: "Avg Task Completion",
      value: `${avgTaskCompletion}%`,
      icon: CheckCircle,
      change: "+5% vs last week",
      color: "text-emerald-600"
    },
    {
      title: "Pending Reviews",
      value: pendingReviews,
      icon: Clock,
      change: "3 due today",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{card.title}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-bold text-foreground">{card.value}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{card.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Team Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Documentation Quality</span>
                <span className="text-sm font-bold text-foreground">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Client Satisfaction</span>
                <span className="text-sm font-bold text-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">SLA Compliance</span>
                <span className="text-sm font-bold text-foreground">96%</span>
              </div>
              <Progress value={96} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Response Time</span>
                <span className="text-sm font-bold text-foreground">88%</span>
              </div>
              <Progress value={88} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-red-900">Critical Alerts</span>
                </div>
                <span className="text-sm font-bold text-red-600">3</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-sm font-medium text-orange-900">Overdue Tasks</span>
                </div>
                <span className="text-sm font-bold text-orange-600">8</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium text-yellow-900">Missing Documentation</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">5</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-blue-900">Pending Approvals</span>
                </div>
                <span className="text-sm font-bold text-blue-600">12</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}