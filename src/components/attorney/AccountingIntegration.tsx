import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Plus, AlertCircle, DollarSign, CheckCircle } from "lucide-react";

export function AccountingIntegration() {
  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <Card className="p-6 border-2 border-blue-200 bg-blue-50/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Accounting Software</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sync invoices, expenses, and case costs with QuickBooks, Xero, or your existing 
              accounting system for seamless financial management.
            </p>
            <Badge className="bg-blue-600">OAuth Connection</Badge>
          </div>
        </div>
      </Card>

      {/* Connection Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Connection Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Not Connected</div>
                <div className="text-sm text-muted-foreground">Connect your accounting software</div>
              </div>
            </div>
            <Button>Connect Now</Button>
          </div>
        </div>
      </Card>

      {/* Supported Platforms */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Supported Accounting Software</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { 
              name: "QuickBooks Online", 
              description: "Invoices, expenses, payments, trust accounting",
              setup: "OAuth 2.0 Connection",
              popular: true
            },
            { 
              name: "Xero", 
              description: "Full accounting sync, bank reconciliation",
              setup: "OAuth Connection",
              popular: true
            },
            { 
              name: "FreshBooks", 
              description: "Time tracking, invoicing, expense management",
              setup: "API Key Required",
              popular: false
            },
            { 
              name: "Sage Intacct", 
              description: "Advanced financial management and reporting",
              setup: "Web Services Connection",
              popular: false
            },
          ].map((platform, idx) => (
            <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {platform.name}
                      {platform.popular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{platform.description}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Setup: {platform.setup}
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Connect {platform.name}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* What Gets Synced */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Data Sync</h3>
        <div className="space-y-2">
          {[
            "Case-related invoices and billing",
            "Medical expenses and provider payments",
            "Expert witness fees and costs",
            "Client trust account transactions (IOLTA compliant)",
            "Expense reports and reimbursements",
            "Settlement distributions"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Trust Accounting Features */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          IOLTA/Trust Accounting
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          For IOLTA-compliant trust accounting, we recommend our premium Trust Accounting module 
          or connecting QuickBooks with our specialized trust account sync.
        </p>
        <Button variant="outline" size="sm">Learn About Trust Accounting</Button>
      </Card>

      {/* Manual Setup Instructions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Manual Connection Setup</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Accounting Software</Label>
            <Input placeholder="Select or enter platform name" />
          </div>
          <div className="space-y-2">
            <Label>Company ID / Client ID</Label>
            <Input placeholder="Enter your company/client ID" />
          </div>
          <div className="space-y-2">
            <Label>API Credentials</Label>
            <Input type="password" placeholder="Enter API key or credentials" />
          </div>
          <Button>Test Connection</Button>
        </div>
      </Card>

      {/* Quick Access Option */}
      <Card className="p-6 bg-muted/50">
        <h3 className="text-lg font-semibold mb-4">Or Use Quick Access Instead</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Prefer to keep systems separate? Save a quick access link to your accounting dashboard.
        </p>
        <div className="flex gap-2">
          <Input placeholder="https://quickbooks.intuit.com or your platform URL" />
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Save Link
          </Button>
        </div>
      </Card>
    </div>
  );
}
