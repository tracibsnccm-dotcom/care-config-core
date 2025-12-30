import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Plus, AlertCircle, Briefcase, CheckCircle } from "lucide-react";

export function PracticeManagementIntegration() {
  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <Card className="p-6 border-2 border-blue-200 bg-blue-50/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Practice Management Software</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Reconcile C.A.R.E. focuses on medical coordination while syncing with your existing 
              practice management system (Clio, MyCase, etc.) for case data.
            </p>
            <Badge className="bg-blue-600">API Connection</Badge>
          </div>
        </div>
      </Card>

      {/* Connection Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Connection Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Not Connected</div>
                <div className="text-sm text-muted-foreground">Connect your practice management software</div>
              </div>
            </div>
            <Button>Connect Now</Button>
          </div>
        </div>
      </Card>

      {/* Supported Platforms */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Supported Platforms</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { 
              name: "Clio", 
              description: "Full case sync, client data, documents",
              setup: "OAuth 2.0 Connection",
              popular: true
            },
            { 
              name: "MyCase", 
              description: "Case sync, calendar, contacts",
              setup: "API Key Required",
              popular: true
            },
            { 
              name: "PracticePanther", 
              description: "Matter sync, billing integration",
              setup: "OAuth Connection",
              popular: false
            },
            { 
              name: "Smokeball", 
              description: "Case data, documents, time entries",
              setup: "API Key Required",
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
        <h3 className="text-lg font-semibold mb-4">What Gets Synced</h3>
        <div className="space-y-2">
          {[
            "Client contact information and case details",
            "Case status and important dates",
            "Document uploads and medical records",
            "Calendar events and deadlines",
            "Time entries and billing information",
            "Notes and communications"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Manual Setup Instructions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Manual Connection Setup</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Practice Management Platform</Label>
            <Input placeholder="Select or enter platform name" />
          </div>
          <div className="space-y-2">
            <Label>API Key / Client ID</Label>
            <Input type="password" placeholder="Enter your API credentials" />
          </div>
          <div className="space-y-2">
            <Label>API Secret (if required)</Label>
            <Input type="password" placeholder="Enter API secret" />
          </div>
          <Button>Test Connection</Button>
        </div>
      </Card>

      {/* Quick Access Option */}
      <Card className="p-6 bg-muted/50">
        <h3 className="text-lg font-semibold mb-4">Or Use Quick Access Instead</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Don't need full API integration? Save a quick access link to your practice management dashboard.
        </p>
        <div className="flex gap-2">
          <Input placeholder="https://app.clio.com or your platform URL" />
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Save Link
          </Button>
        </div>
      </Card>
    </div>
  );
}
