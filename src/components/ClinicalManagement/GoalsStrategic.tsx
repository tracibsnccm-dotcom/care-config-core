import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Users, CheckCircle2 } from "lucide-react";

export function GoalsStrategic() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Goals & Strategic Planning</h2>
          <p className="text-muted-foreground">Department objectives and KPIs</p>
        </div>
        <Button>
          <Target className="h-4 w-4 mr-2" />
          Set New Goal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed YTD</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Department Strategic Goals - 2025</CardTitle>
          <CardDescription>Annual objectives and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { 
                goal: "Reduce Patient Readmission Rate by 15%", 
                progress: 68, 
                owner: "Clinical Team", 
                target: "Dec 2025",
                status: "on_track"
              },
              { 
                goal: "Achieve 95% Staff Satisfaction Score", 
                progress: 82, 
                owner: "Management", 
                target: "Dec 2025",
                status: "on_track"
              },
              { 
                goal: "Implement New EHR System", 
                progress: 45, 
                owner: "IT & Clinical", 
                target: "Jun 2025",
                status: "at_risk"
              },
              { 
                goal: "Expand Service Coverage to 3 New Counties", 
                progress: 30, 
                owner: "Business Development", 
                target: "Sep 2025",
                status: "on_track"
              }
            ].map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{item.goal}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Owner: {item.owner} • Target: {item.target}
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    item.status === "on_track" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  }>
                    {item.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
            <CardDescription>Current vs Target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { metric: "Patient Satisfaction", current: 87, target: 90, unit: "%" },
                { metric: "Avg Response Time", current: 2.4, target: 2.0, unit: "hrs" },
                { metric: "Documentation Accuracy", current: 94, target: 95, unit: "%" },
                { metric: "Staff Retention Rate", current: 92, target: 90, unit: "%" }
              ].map((kpi, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{kpi.metric}</div>
                    <div className="text-xs text-muted-foreground">Target: {kpi.target}{kpi.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{kpi.current}{kpi.unit}</div>
                    <div className={`text-xs ${kpi.current >= kpi.target ? "text-green-500" : "text-yellow-500"}`}>
                      {kpi.current >= kpi.target ? "✓ On target" : "△ Below target"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Individual Goal Progress</CardTitle>
            <CardDescription>Staff member objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Sarah Johnson, RN", goals: 5, completed: 4 },
                { name: "Michael Chen, RN", goals: 4, completed: 3 },
                { name: "Emily Rodriguez, RN", goals: 6, completed: 5 },
                { name: "David Kim, RN", goals: 5, completed: 5 }
              ].map((staff, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{staff.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {staff.completed} of {staff.goals} goals completed
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {Math.round((staff.completed / staff.goals) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
