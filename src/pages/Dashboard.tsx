import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { mockCases } from "@/lib/mockData";
import { ROLES } from "@/config/rcms";
import { FileText, Users, Stethoscope, AlertCircle, TrendingUp, Clock } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      name: "Total Cases",
      value: mockCases.length.toString(),
      change: "+12%",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      name: "Active Cases",
      value: mockCases.filter((c) => c.status === "IN_PROGRESS").length.toString(),
      change: "+8%",
      icon: TrendingUp,
      color: "text-status-active",
      bgColor: "bg-status-active/10",
    },
    {
      name: "Awaiting Consent",
      value: mockCases.filter((c) => c.status === "AWAITING_CONSENT").length.toString(),
      change: "-2%",
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      name: "Sensitive Cases",
      value: mockCases.filter((c) => c.status === "HOLD_SENSITIVE").length.toString(),
      change: "0%",
      icon: Clock,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      case: "CASE-2024-001",
      action: "Check-in completed",
      time: "2 hours ago",
      actor: "Maria Garcia (RN-CCM)",
    },
    {
      id: 2,
      case: "CASE-2024-003",
      action: "Flagged as sensitive",
      time: "5 hours ago",
      actor: "Lisa Chen (Attorney)",
    },
    {
      id: 3,
      case: "CASE-2024-002",
      action: "Created and awaiting consent",
      time: "1 day ago",
      actor: "Robert Johnson (Staff)",
    },
  ];

  return (
    <AppLayout currentRole={ROLES.ATTORNEY}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name} className="p-6 border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-2">{stat.change} from last month</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="p-6 border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{activity.case}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.actor} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <span className="font-medium">Create New Case</span>
              </button>
              <button className="w-full p-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary-light transition-colors flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span className="font-medium">Add Client</span>
              </button>
              <button className="w-full p-4 bg-accent text-accent-foreground rounded-lg hover:bg-accent-light transition-colors flex items-center gap-3">
                <Stethoscope className="w-5 h-5" />
                <span className="font-medium">Find Providers</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
