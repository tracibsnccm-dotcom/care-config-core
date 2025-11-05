import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, TrendingDown, AlertCircle, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StaffWorkload {
  id: string;
  name: string;
  currentCases: number;
  capacity: number;
  utilizationRate: number;
  avgVisitsPerWeek: number;
  status: "overloaded" | "balanced" | "underutilized";
  specialties: string[];
}

export function WorkloadBalancer() {
  const { toast } = useToast();
  const [staff] = useState<StaffWorkload[]>([
    {
      id: "staff-001",
      name: "Sarah Johnson, RN",
      currentCases: 15,
      capacity: 12,
      utilizationRate: 125,
      avgVisitsPerWeek: 28,
      status: "overloaded",
      specialties: ["Palliative", "Wound Care"]
    },
    {
      id: "staff-002",
      name: "Michael Chen, RN",
      currentCases: 11,
      capacity: 12,
      utilizationRate: 92,
      avgVisitsPerWeek: 22,
      status: "balanced",
      specialties: ["Cardiac", "Diabetes"]
    },
    {
      id: "staff-003",
      name: "Emily Rodriguez, RN",
      currentCases: 7,
      capacity: 12,
      utilizationRate: 58,
      avgVisitsPerWeek: 14,
      status: "underutilized",
      specialties: ["Pediatric", "General"]
    },
    {
      id: "staff-004",
      name: "David Kim, RN",
      currentCases: 13,
      capacity: 12,
      utilizationRate: 108,
      avgVisitsPerWeek: 25,
      status: "overloaded",
      specialties: ["Wound Care", "Orthopedic"]
    },
    {
      id: "staff-005",
      name: "Lisa Martinez, RN",
      currentCases: 10,
      capacity: 12,
      utilizationRate: 83,
      avgVisitsPerWeek: 20,
      status: "balanced",
      specialties: ["General", "Palliative"]
    }
  ]);

  const getStatusColor = (status: StaffWorkload["status"]) => {
    switch (status) {
      case "overloaded":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "balanced":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "underutilized":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: StaffWorkload["status"]) => {
    switch (status) {
      case "overloaded":
        return <TrendingUp className="h-4 w-4" />;
      case "balanced":
        return <BarChart3 className="h-4 w-4" />;
      case "underutilized":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const handleAutoBalance = () => {
    toast({
      title: "Auto-Balance Initiated",
      description: "Analyzing workload and generating redistribution recommendations...",
    });
  };

  const handleReassignCase = (staffId: string) => {
    toast({
      title: "Reassignment Tool",
      description: `Opening case reassignment tool for ${staff.find(s => s.id === staffId)?.name}`,
    });
  };

  const overloadedCount = staff.filter(s => s.status === "overloaded").length;
  const avgUtilization = Math.round(
    staff.reduce((sum, s) => sum + s.utilizationRate, 0) / staff.length
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workload Balancer</h2>
          <p className="text-muted-foreground">Monitor and balance staff caseloads</p>
        </div>
        <Button onClick={handleAutoBalance}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Auto-Balance
        </Button>
      </div>

      {overloadedCount > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-500">Workload Alert</CardTitle>
            </div>
            <CardDescription>
              {overloadedCount} staff member{overloadedCount > 1 ? 's are' : ' is'} over capacity
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtilization}%</div>
            <Progress value={avgUtilization} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overloaded</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overloadedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanced</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => s.status === "balanced").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Underutilized</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => s.status === "underutilized").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {staff
          .sort((a, b) => b.utilizationRate - a.utilizationRate)
          .map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{member.name}</CardTitle>
                    <CardDescription>
                      {member.specialties.join(", ")}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={getStatusColor(member.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(member.status)}
                      {member.status.toUpperCase()}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Current Cases</div>
                      <div className="text-2xl font-bold">{member.currentCases}</div>
                      <div className="text-xs text-muted-foreground">of {member.capacity} capacity</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Utilization</div>
                      <div className="text-2xl font-bold">{member.utilizationRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Weekly Visits</div>
                      <div className="text-2xl font-bold">{member.avgVisitsPerWeek}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Available</div>
                      <div className="text-2xl font-bold">
                        {Math.max(0, member.capacity - member.currentCases)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Capacity</div>
                    <Progress 
                      value={Math.min(100, (member.currentCases / member.capacity) * 100)} 
                      className={member.utilizationRate > 100 ? "bg-red-500/20" : ""}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReassignCase(member.id)}>
                      Reassign Cases
                    </Button>
                    <Button size="sm" variant="outline">
                      View Cases
                    </Button>
                    <Button size="sm" variant="outline">
                      Adjust Capacity
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
