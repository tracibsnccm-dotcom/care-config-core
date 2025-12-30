import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

export default function RNInsuranceAuth() {
  const [activeTab, setActiveTab] = useState("pending");

  // Mock data - replace with real data from hooks
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
    {
      id: "4",
      clientName: "Robert L.",
      rcmsId: "RCMS-2024-004",
      serviceType: "Mental Health Counseling",
      visits: "10 sessions",
      status: "denied",
      submittedDate: "2024-01-12",
      expiryDate: null,
      insurancePlan: "Cigna PPO"
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

  const filterByStatus = (status: string) => {
    if (status === "all") return authorizations;
    return authorizations.filter(auth => auth.status === status);
  };

  const pendingCount = authorizations.filter(a => a.status === "pending").length;
  const expiringCount = authorizations.filter(a => a.status === "expiring_soon").length;
  const deniedCount = authorizations.filter(a => a.status === "denied").length;

  return (
    <AppLayout>
      <div className="py-6 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-3">
              <span>Insurance Authorization</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
              Authorization Tracker
            </h1>
            <p className="text-[#0f2a6a]/80 mt-2">
              Manage pre-authorizations and track expiration dates
            </p>
          </header>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Denied - Action Needed</p>
                    <p className="text-3xl font-bold text-red-600">{deniedCount}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
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
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="expiring_soon">Expiring Soon</TabsTrigger>
                  <TabsTrigger value="denied">Denied</TabsTrigger>
                </TabsList>

                {["pending", "approved", "expiring_soon", "denied"].map(status => (
                  <TabsContent key={status} value={status} className="mt-4">
                    <div className="space-y-4">
                      {filterByStatus(status).length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No authorizations in this category.</p>
                      ) : (
                        filterByStatus(status).map(auth => (
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
                                <span className="font-medium">Service Type:</span>
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
        </div>
      </div>
    </AppLayout>
  );
}
