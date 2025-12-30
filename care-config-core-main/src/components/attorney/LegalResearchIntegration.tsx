import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Plus, Trash2, AlertCircle, BookOpen } from "lucide-react";
import { useState } from "react";

export function LegalResearchIntegration() {
  const [savedResearch, setSavedResearch] = useState([
    { id: 1, name: "Westlaw", url: "https://www.westlaw.com", username: "your_username" },
    { id: 2, name: "LexisNexis", url: "https://www.lexisnexis.com", username: "your_username" },
  ]);

  const savedSearchTemplates = [
    { name: "Medical Malpractice + Workers Comp", keywords: "medical malpractice workers compensation california" },
    { name: "Personal Injury Statutes", keywords: "personal injury statute limitations california" },
    { name: "Medical Records Law", keywords: "medical records disclosure HIPAA california" },
  ];

  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <Card className="p-6 border-2 border-blue-200 bg-blue-50/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Legal Research Platform</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Quick access to Westlaw, LexisNexis, or your existing research platform. 
              Save search templates specific to medical-legal cases for faster research.
            </p>
            <Badge className="bg-blue-600">Bring Your Own Subscription</Badge>
          </div>
        </div>
      </Card>

      {/* Saved Research Platforms */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Research Platforms</h3>
        <div className="space-y-3 mb-4">
          {savedResearch.map((platform) => (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">{platform.name}</div>
                  <div className="text-sm text-muted-foreground">Username: {platform.username}</div>
                  <div className="text-xs text-muted-foreground mt-1">{platform.url}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={platform.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Platform
                  </a>
                </Button>
                <Button size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Research Platform
        </Button>
      </Card>

      {/* Saved Search Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Medical-Legal Search Templates</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Pre-configured search queries for common medical-legal research topics
        </p>
        <div className="space-y-2">
          {savedSearchTemplates.map((template, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div>
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-muted-foreground mt-1">Keywords: {template.keywords}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">Copy Search</Button>
                <Button size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="mt-3">
          <Plus className="h-4 w-4 mr-2" />
          Add Search Template
        </Button>
      </Card>

      {/* Add New Platform Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Research Platform</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Platform Name</Label>
            <Input placeholder="e.g., Westlaw" />
          </div>
          <div className="space-y-2">
            <Label>Platform URL</Label>
            <Input placeholder="https://www.westlaw.com" />
          </div>
          <div className="space-y-2">
            <Label>Your Username (for reference)</Label>
            <Input placeholder="your_username" />
          </div>
          <Button>Save Platform Link</Button>
        </div>
      </Card>

      {/* Popular Research Platforms */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Popular Legal Research Platforms</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { name: "Westlaw", url: "https://www.westlaw.com" },
            { name: "LexisNexis", url: "https://www.lexisnexis.com" },
            { name: "Fastcase", url: "https://www.fastcase.com" },
            { name: "Casetext", url: "https://casetext.com" },
          ].map((provider, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <span className="font-medium text-sm">{provider.name}</span>
              <Button size="sm" variant="ghost" asChild>
                <a href={provider.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
