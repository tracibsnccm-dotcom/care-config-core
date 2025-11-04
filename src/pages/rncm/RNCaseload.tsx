import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, AlertTriangle, Clock, User } from "lucide-react";
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

  return (
    <AppLayout>
      <div className="py-6 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-3">
              <span>My Caseload</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
              Active Cases
            </h1>
            <p className="text-[#0f2a6a]/80 mt-2">
              Manage and monitor all your assigned cases
            </p>
          </header>

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
        </div>
      </div>
    </AppLayout>
  );
}
