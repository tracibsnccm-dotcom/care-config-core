import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Calendar, Award, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: "active" | "pto" | "training" | "leave";
  caseload: number;
  certifications: string[];
  performanceScore: number;
  nextReview: string;
}

export function StaffManagement() {
  const { toast } = useToast();
  const [staffMembers] = useState<StaffMember[]>([
    {
      id: "staff-001",
      name: "Sarah Johnson, RN",
      role: "Clinical Nurse",
      status: "active",
      caseload: 12,
      certifications: ["RN", "BSN", "CHPN"],
      performanceScore: 94,
      nextReview: "2025-03-15"
    },
    {
      id: "staff-002",
      name: "Michael Chen, RN",
      role: "Clinical Nurse",
      status: "active",
      caseload: 15,
      certifications: ["RN", "MSN"],
      performanceScore: 88,
      nextReview: "2025-02-20"
    },
    {
      id: "staff-003",
      name: "Emily Rodriguez, RN",
      role: "Clinical Nurse",
      status: "pto",
      caseload: 10,
      certifications: ["RN", "BSN"],
      performanceScore: 91,
      nextReview: "2025-04-10"
    },
    {
      id: "staff-004",
      name: "David Kim, RN",
      role: "Senior Clinical Nurse",
      status: "training",
      caseload: 8,
      certifications: ["RN", "MSN", "CHPN", "CNS"],
      performanceScore: 96,
      nextReview: "2025-03-01"
    }
  ]);

  const getStatusColor = (status: StaffMember["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pto":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "training":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "leave":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: StaffMember["status"]) => {
    switch (status) {
      case "active":
        return <UserCheck className="h-4 w-4" />;
      case "pto":
        return <Calendar className="h-4 w-4" />;
      case "training":
        return <Award className="h-4 w-4" />;
      case "leave":
        return <UserX className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const handleViewProfile = (staffId: string) => {
    toast({
      title: "Staff Profile",
      description: `Viewing profile for ${staffMembers.find(s => s.id === staffId)?.name}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">Manage team members and their assignments</p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.filter(s => s.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On PTO</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.filter(s => s.status === "pto").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Caseload</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(staffMembers.reduce((sum, s) => sum + s.caseload, 0) / staffMembers.length)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {staffMembers.map((staff) => (
          <Card key={staff.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{staff.name}</CardTitle>
                  <CardDescription>{staff.role}</CardDescription>
                </div>
                <Badge variant="outline" className={getStatusColor(staff.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(staff.status)}
                    {staff.status.toUpperCase()}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Caseload</div>
                  <div className="text-2xl font-bold">{staff.caseload}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Performance</div>
                  <div className="text-2xl font-bold">{staff.performanceScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Certifications</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {staff.certifications.map((cert) => (
                      <Badge key={cert} variant="secondary" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Next Review</div>
                  <div className="text-sm font-medium mt-1">{staff.nextReview}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => handleViewProfile(staff.id)}>
                  View Profile
                </Button>
                <Button size="sm" variant="outline">
                  Assign Cases
                </Button>
                <Button size="sm" variant="outline">
                  Schedule Review
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
