import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Stethoscope, 
  Clipboard, 
  Activity,
  Brain,
  Heart,
  AlertCircle,
  Construction
} from "lucide-react";

export function ClinicalDataPlaceholder() {
  const placeholderForms = [
    {
      id: "medical-assessment",
      name: "Medical Assessment Form",
      description: "Comprehensive medical history and current condition assessment",
      icon: Stethoscope,
      category: "Assessment",
    },
    {
      id: "pain-diary",
      name: "Pain & Symptom Diary",
      description: "Daily pain tracking and symptom monitoring",
      icon: Activity,
      category: "Monitoring",
    },
    {
      id: "mental-health",
      name: "Mental Health Screening",
      description: "Psychological impact and mental health assessment",
      icon: Brain,
      category: "Assessment",
    },
    {
      id: "functional-capacity",
      name: "Functional Capacity Evaluation",
      description: "Assessment of physical capabilities and limitations",
      icon: Heart,
      category: "Evaluation",
    },
    {
      id: "treatment-notes",
      name: "Treatment Progress Notes",
      description: "RN/CM documentation of treatment progress and care coordination",
      icon: Clipboard,
      category: "Documentation",
    },
    {
      id: "medical-research",
      name: "Medical Research Findings",
      description: "Clinical research and evidence supporting the case",
      icon: FileText,
      category: "Research",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Notice */}
      <div className="flex items-start gap-4 p-6 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <Construction className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
            Clinical Data Entry Forms - Coming Soon
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            These forms are currently under development and will be available in a future update. 
            The placeholders below represent the planned clinical data collection forms that will be 
            integrated into the system for RN/CM clinical documentation and case building.
          </p>
        </div>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Clinical Data Entry Forms</h2>
        <p className="text-muted-foreground">
          Structured forms for clinical assessment and documentation (Placeholder)
        </p>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {placeholderForms.map((form) => {
          const Icon = form.icon;
          return (
            <Card key={form.id} className="p-6 opacity-60">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">
                    {form.category}
                  </Badge>
                  <h3 className="font-semibold text-foreground mb-1">{form.name}</h3>
                  <p className="text-sm text-muted-foreground">{form.description}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" disabled>
                  <Construction className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-muted/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <h4 className="font-semibold mb-2">What's Coming</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Structured Forms:</strong> Standardized clinical data collection forms</li>
              <li>• <strong>HIPAA Compliance:</strong> Secure storage and access control for clinical data</li>
              <li>• <strong>RN/CM Workflows:</strong> Integrated workflows for care managers and clinical staff</li>
              <li>• <strong>Case Building:</strong> Automatic integration with case files and medical summaries</li>
              <li>• <strong>Progress Tracking:</strong> Timeline views of clinical assessments and treatments</li>
              <li>• <strong>Export & Reporting:</strong> Generate clinical reports for case documentation</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
