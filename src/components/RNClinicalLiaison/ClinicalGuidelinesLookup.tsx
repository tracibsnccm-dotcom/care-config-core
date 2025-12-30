import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, ExternalLink, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ClinicalGuidelinesLookup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Placeholder data
  const guidelines = [
    {
      id: "1",
      guideline_source: "odg",
      diagnosis_code: "M54.5",
      diagnosis_name: "Low Back Pain",
      treatment_category: "Physical Therapy",
      guideline_title: "Conservative Care for Acute Low Back Pain",
      recommended_duration: "4-6 weeks",
      frequency_guidelines: "2-3 times per week",
      evidence_level: "strong",
    },
    {
      id: "2",
      guideline_source: "mcg",
      diagnosis_code: "S13.4",
      diagnosis_name: "Whiplash Injury",
      treatment_category: "Manual Therapy",
      guideline_title: "Cervical Spine Mobilization Protocol",
      recommended_duration: "6-8 weeks",
      frequency_guidelines: "Weekly initially, then biweekly",
      evidence_level: "moderate",
    },
    {
      id: "3",
      guideline_source: "internal",
      diagnosis_code: "G43.9",
      diagnosis_name: "Migraine",
      treatment_category: "Behavioral Health",
      guideline_title: "Cognitive Behavioral Therapy for Migraine",
      recommended_duration: "8-12 sessions",
      frequency_guidelines: "Weekly sessions",
      evidence_level: "strong",
    },
  ];

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "odg":
        return "default";
      case "mcg":
        return "secondary";
      case "internal":
        return "outline";
      default:
        return "outline";
    }
  };

  const getEvidenceBadgeColor = (level: string) => {
    switch (level) {
      case "strong":
        return "default";
      case "moderate":
        return "secondary";
      case "limited":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Clinical Guidelines (ODG/MCG)</h2>
        <p className="text-sm text-muted-foreground">Evidence-based treatment guidelines lookup</p>
      </div>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <strong>Placeholder Feature:</strong> Full ODG/MCG integration requires licensing and API access.
          Contact your administrator to enable these clinical decision support tools.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by diagnosis or treatment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Guideline Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="odg">ODG (Official Disability Guidelines)</SelectItem>
                <SelectItem value="mcg">MCG Health</SelectItem>
                <SelectItem value="internal">Internal Guidelines</SelectItem>
                <SelectItem value="acoem">ACOEM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <div className="space-y-4">
        {guidelines.map((guideline) => (
          <Card key={guideline.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getSourceBadgeColor(guideline.guideline_source)} className="uppercase">
                      {guideline.guideline_source}
                    </Badge>
                    <Badge variant={getEvidenceBadgeColor(guideline.evidence_level)} className="capitalize">
                      {guideline.evidence_level} Evidence
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ICD-10: {guideline.diagnosis_code}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{guideline.guideline_title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Diagnosis</p>
                <p className="text-sm text-muted-foreground">{guideline.diagnosis_name}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Treatment Category</p>
                  <p className="text-sm text-muted-foreground">{guideline.treatment_category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Recommended Duration</p>
                  <p className="text-sm text-muted-foreground">{guideline.recommended_duration}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Frequency</p>
                  <p className="text-sm text-muted-foreground">{guideline.frequency_guidelines}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <BookOpen className="w-4 h-4 mr-1" />
                  View Full Guideline
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Source
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {guidelines.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No guidelines found. Try a different search term.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
