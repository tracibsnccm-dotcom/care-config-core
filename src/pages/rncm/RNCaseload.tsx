import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentApprovalQueue } from "@/components/rn/DocumentApprovalQueue";
import { Search, Filter, AlertTriangle, Clock, User, ClipboardCheck, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function RNCaseload() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterAttorney, setFilterAttorney] = useState("all");

  // Mock data - replace with real data from hooks
  const cases = [
    {
      id: "1",
      clientName: "Sarah M.",
      rcmsId: "RCMS-2024-001",
      riskLevel: "critical",
      attorney: "Johnson & Associates",
      lastContact: "2024-01-15",
      nextReview: "2024-01-20",
      openTasks: 3,
      status: "Active"
    },
    {
      id: "2",
      clientName: "John D.",
      rcmsId: "RCMS-2024-002",
      riskLevel: "at_risk",
      attorney: "Smith Law Firm",
      lastContact: "2024-01-18",
      nextReview: "2024-01-25",
      openTasks: 1,
      status: "Active"
    },
    {
      id: "3",
      clientName: "Maria G.",
      rcmsId: "RCMS-2024-003",
      riskLevel: "stable",
      attorney: "Johnson & Associates",
      lastContact: "2024-01-19",
      nextReview: "2024-02-01",
      openTasks: 0,
      status: "Active"
    },
  ];

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "at_risk":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">At Risk</Badge>;
      case "stable":
        return <Badge variant="secondary">Stable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const daysSinceContact = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.rcmsId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === "all" || c.riskLevel === filterRisk;
    const matchesAttorney = filterAttorney === "all" || c.attorney === filterAttorney;
    return matchesSearch && matchesRisk && matchesAttorney;
  });

  // Insurance Auth Mock Data
  const authorizations = [
    {
      id: "1",
      clientName: "Sarah M.",
      rcmsId: "RCMS-2024-001",
      serviceType: "Physical Therapy",
      visits: "12 visits",
      status: "pending",
      submittedDate: "2024-01-15",
      expiryDate: null,
      insurancePlan: "Blue Cross PPO"
    },
    {
      id: "2",
      clientName: "John D.",
      rcmsId: "RCMS-2024-002",
      serviceType: "Pain Management",
      visits: "6 visits",
      status: "approved",
      submittedDate: "2024-01-10",
      expiryDate: "2024-02-15",
      insurancePlan: "Aetna HMO"
    },
    {
      id: "3",
      clientName: "Maria G.",
      rcmsId: "RCMS-2024-003",
      serviceType: "Chiropractic Care",
      visits: "8 visits",
      status: "expiring_soon",
      submittedDate: "2023-12-20",
      expiryDate: "2024-01-25",
      insurancePlan: "UnitedHealthcare"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "denied":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Denied</Badge>;
      case "expiring_soon":
        return <Badge className="bg-orange-500 hover:bg-orange-600"><AlertCircle className="h-3 w-3 mr-1" />Expiring Soon</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filterAuthByStatus = (status: string) => {
    if (status === "all") return authorizations;
    return authorizations.filter(auth => auth.status === status);
  };

  const pendingCount = authorizations.filter(a => a.status === "pending").length;
  const expiringCount = authorizations.filter(a => a.status === "expiring_soon").length;

  return (
    <AppLayout>
      <div className="py-6 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-3">
              <span>Case Management</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
              RN Caseload
            </h1>
            <p className="text-[#0f2a6a]/80 mt-2">
              Manage cases, authorizations, and client assignments
            </p>
          </header>

          {/* Tabbed Interface */}
          <Tabs defaultValue="cases" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="cases">Active Cases</TabsTrigger>
              <TabsTrigger value="insurance">
                Insurance Auth
                {pendingCount > 0 && (
                  <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600">{pendingCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Cases Tab */}
            <TabsContent value="cases" className="space-y-4">

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or RCMS ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={filterRisk} onValueChange={setFilterRisk}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterAttorney} onValueChange={setFilterAttorney}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Attorney" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Attorneys</SelectItem>
                    <SelectItem value="Johnson & Associates">Johnson & Associates</SelectItem>
                    <SelectItem value="Smith Law Firm">Smith Law Firm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cases List */}
          <div className="space-y-4">
            {filteredCases.map((caseItem) => {
              const daysSince = daysSinceContact(caseItem.lastContact);
              const needsAttention = daysSince > 7;

              return (
                <Card key={caseItem.id} className={needsAttention ? "border-l-4 border-l-yellow-500" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{caseItem.clientName}</CardTitle>
                        <CardDescription className="text-sm">{caseItem.rcmsId}</CardDescription>
                      </div>
                      {getRiskBadge(caseItem.riskLevel)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Attorney</div>
                          <div className="text-muted-foreground">{caseItem.attorney}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Last Contact</div>
                          <div className={needsAttention ? "text-yellow-600 font-semibold" : "text-muted-foreground"}>
                            {daysSince} days ago
                            {needsAttention && " ⚠️"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Open Tasks</div>
                          <div className="text-muted-foreground">{caseItem.openTasks}</div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Next Review</div>
                        <div className="text-muted-foreground">
                          {format(new Date(caseItem.nextReview), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default">View Details</Button>
                      <Button size="sm" variant="outline">Add Note</Button>
                      <Button size="sm" variant="outline">Update Care Plan</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

            {filteredCases.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No cases found matching your filters.</p>
                </CardContent>
              </Card>
            )}
            </TabsContent>

            {/* Insurance Auth Tab */}
            <TabsContent value="insurance" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Review</p>
                        <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Expiring Soon</p>
                        <p className="text-3xl font-bold text-orange-600">{expiringCount}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Authorizations List */}
              <Card>
                <CardHeader>
                  <CardTitle>Authorization Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pending">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="approved">Approved</TabsTrigger>
                      <TabsTrigger value="expiring_soon">Expiring</TabsTrigger>
                      <TabsTrigger value="denied">Denied</TabsTrigger>
                    </TabsList>

                    {["pending", "approved", "expiring_soon", "denied"].map(status => (
                      <TabsContent key={status} value={status} className="mt-4">
                        <div className="space-y-4">
                          {filterAuthByStatus(status).length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No authorizations in this category.</p>
                          ) : (
                            filterAuthByStatus(status).map(auth => (
                              <div key={auth.id} className="border rounded-lg p-4 hover:bg-muted/50 transition">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-semibold text-lg">{auth.clientName}</h3>
                                    <p className="text-sm text-muted-foreground">{auth.rcmsId}</p>
                                  </div>
                                  {getStatusBadge(auth.status)}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                                  <div>
                                    <span className="font-medium">Service:</span>
                                    <p className="text-muted-foreground">{auth.serviceType}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Authorization:</span>
                                    <p className="text-muted-foreground">{auth.visits}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Insurance:</span>
                                    <p className="text-muted-foreground">{auth.insurancePlan}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                                  <div>
                                    <span className="font-medium">Submitted:</span>
                                    <p className="text-muted-foreground">{format(new Date(auth.submittedDate), "MMM d, yyyy")}</p>
                                  </div>
                                  {auth.expiryDate && (
                                    <div>
                                      <span className="font-medium">Expires:</span>
                                      <p className={auth.status === "expiring_soon" ? "text-orange-600 font-semibold" : "text-muted-foreground"}>
                                        {format(new Date(auth.expiryDate), "MMM d, yyyy")}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <Button size="sm" variant="default">
                                    <FileText className="h-4 w-4 mr-1" />
                                    View Details
                                  </Button>
                                  {auth.status === "pending" && (
                                    <Button size="sm" variant="outline">Follow Up</Button>
                                  )}
                                  {auth.status === "denied" && (
                                    <Button size="sm" variant="outline">Appeal</Button>
                                  )}
                                  {auth.status === "expiring_soon" && (
                                    <Button size="sm" variant="outline">Request Extension</Button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Document Approval Queue */}
              <div className="mt-6">
                <DocumentApprovalQueue />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
