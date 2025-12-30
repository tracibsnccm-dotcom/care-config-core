import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface ManagementMetricsProps {
  roleLevel: "executive" | "leadership" | "operational";
  isDirector: boolean;
  isSupervisor: boolean;
  isManager: boolean;
}

export function ManagementMetrics({ roleLevel, isDirector, isSupervisor, isManager }: ManagementMetricsProps) {
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

  // Director-level metrics
  const directorMetrics = [
    { label: "Overall Team Performance", value: 92, target: 95, weekChange: "+2%", icon: Users },
    { label: "Budget Utilization", value: 87, target: 90, weekChange: "+3%", icon: CheckCircle },
    { label: "Staff Retention Rate", value: 95, target: 90, weekChange: "+1%", icon: Users },
    { label: "Quality Compliance", value: 94, target: 95, weekChange: "0%", icon: CheckCircle },
  ];

  // Supervisor-level metrics
  const supervisorMetrics = [
    { label: "Team Productivity", value: 88, target: 90, weekChange: "+4%", icon: Users },
    { label: "Case Review Timeliness", value: 85, target: 90, weekChange: "-2%", icon: Clock },
    { label: "RN Documentation Quality", value: 92, target: 95, weekChange: "+1%", icon: CheckCircle },
    { label: "Team Satisfaction", value: 89, target: 85, weekChange: "+5%", icon: Users },
  ];

  // Manager-level metrics
  const managerMetrics = [
    { label: "Case Assignment Efficiency", value: 91, target: 90, weekChange: "+3%", icon: Users },
    { label: "Approval Processing Time", value: 86, target: 90, weekChange: "-1%", icon: Clock },
    { label: "Team Workload Balance", value: 88, target: 85, weekChange: "+2%", icon: Users },
    { label: "Documentation Standards", value: 93, target: 95, weekChange: "+1%", icon: CheckCircle },
  ];

  const metrics = isDirector ? directorMetrics : isSupervisor ? supervisorMetrics : managerMetrics;
  const title = isDirector ? "Executive Metrics" : isSupervisor ? "Leadership Metrics" : "Operational Metrics";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#0f2a6a]">{title}</CardTitle>
        <CardDescription>
          Your key performance indicators and team health metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div 
                key={i} 
                className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-all cursor-pointer relative group"
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {m.value >= m.target ? (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      On Target
                    </Badge>
                  ) : m.value >= m.target - 5 ? (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      Near Target
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      Below Target
                    </Badge>
                  )}
                </div>
                
                <div className="text-xs font-medium text-muted-foreground mb-1">{m.label}</div>
                <div className="text-2xl font-bold text-foreground mb-3">{m.value}%</div>
                
                <div className="h-2 rounded bg-muted mb-2">
                  <div 
                    className={`h-2 rounded transition-all ${getColorClass(m.value, m.target)}`} 
                    style={{ width: `${m.value}%` }} 
                  />
                </div>
                
                <div className="flex items-center justify-between text-[10px]">
                  <div className="text-muted-foreground">Target: {m.target}%</div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(m.weekChange)}
                    <span className={m.weekChange.startsWith("+") ? "text-green-600" : m.weekChange.startsWith("-") ? "text-red-600" : "text-muted-foreground"}>
                      {m.weekChange}
                    </span>
                  </div>
                </div>
                
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>

        {/* Team-wide metrics for all roles */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900">Active Team Members</div>
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-xs text-blue-700">2 on PTO this week</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-green-900">Completed Reviews</div>
                <div className="text-2xl font-bold text-green-600">87</div>
                <div className="text-xs text-green-700">This week</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-900">Items Needing Action</div>
                <div className="text-2xl font-bold text-yellow-600">12</div>
                <div className="text-xs text-yellow-700">Urgent</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
