import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";

const filings = [
  {
    document: "Motion for Summary Judgment",
    caseId: "C-2024-1892",
    court: "Superior Court - County",
    filingDate: "2024-06-26",
    status: "filed",
    confirmationNumber: "E-FILE-2024-6789",
  },
  {
    document: "Answer to Complaint",
    caseId: "C-2024-1876",
    court: "District Court - Federal",
    filingDate: "2024-06-25",
    status: "pending",
    confirmationNumber: "PENDING",
  },
  {
    document: "Discovery Responses",
    caseId: "C-2024-1845",
    court: "Superior Court - County",
    filingDate: "2024-06-24",
    status: "filed",
    confirmationNumber: "E-FILE-2024-6701",
  },
];

const upcomingDeadlines = [
  { document: "Response to Motion", caseId: "C-2024-1892", dueDate: "2024-07-05", daysLeft: 9 },
  { document: "Opposition Brief", caseId: "C-2024-1876", dueDate: "2024-07-10", daysLeft: 14 },
  { document: "Reply Brief", caseId: "C-2024-1845", dueDate: "2024-07-15", daysLeft: 19 },
];

export function CourtFilingIntegration() {
  return (
    <div className="space-y-6">
      {/* Integration Status */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">E-Filing Integration</h3>
            <p className="text-sm text-muted-foreground">
              Connected to state and federal e-filing systems
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <Badge className="bg-green-600">Active</Badge>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <div className="text-sm text-muted-foreground">Filings This Month</div>
            <div className="text-2xl font-bold">12</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">100%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg Processing Time</div>
            <div className="text-2xl font-bold">4.2 hrs</div>
          </div>
        </div>
      </Card>

      {/* Recent Filings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Recent Filings</h3>
            <p className="text-sm text-muted-foreground">
              Track your e-filed documents
            </p>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            New Filing
          </Button>
        </div>

        <div className="space-y-3">
          {filings.map((filing, idx) => (
            <Card key={idx} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="font-semibold">{filing.document}</div>
                    <div className="text-sm text-muted-foreground">
                      Case: {filing.caseId} • {filing.court}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Filed: {filing.filingDate}
                    </div>
                    {filing.status === "filed" && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Confirmation: {filing.confirmationNumber}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {filing.status === "filed" ? (
                    <Badge className="bg-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Filed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Upcoming Deadlines */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold">Upcoming Filing Deadlines</h3>
        </div>

        <div className="space-y-3">
          {upcomingDeadlines.map((deadline, idx) => (
            <Card
              key={idx}
              className={`p-4 ${
                deadline.daysLeft <= 7
                  ? "border-red-500/50 bg-red-500/5"
                  : deadline.daysLeft <= 14
                  ? "border-yellow-500/50 bg-yellow-500/5"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{deadline.document}</div>
                  <div className="text-sm text-muted-foreground">
                    Case: {deadline.caseId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {deadline.daysLeft} days
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Due: {deadline.dueDate}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Court Portals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Connected Court Portals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "State Superior Court", cases: 24, status: "active" },
            { name: "Federal District Court", cases: 8, status: "active" },
            { name: "Appellate Court", cases: 2, status: "active" },
            { name: "Workers Comp Board", cases: 6, status: "active" },
          ].map((portal, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{portal.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {portal.cases} active cases
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Feature Info */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-2">E-Filing Benefits</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Instant filing with automatic confirmation</li>
              <li>• 24/7 access to court filing systems</li>
              <li>• Automatic deadline tracking and reminders</li>
              <li>• Reduced filing errors with validation checks</li>
              <li>• Direct integration with your case management</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
