import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Phone, Mail, Clock } from "lucide-react";

interface DiaryTemplate {
  name: string;
  icon: any;
  entry_type: string;
  title: string;
  description: string;
  requires_contact: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  reminder_minutes_before: number;
}

const templates: DiaryTemplate[] = [
  {
    name: "Follow-up Call",
    icon: Phone,
    entry_type: "phone_call",
    title: "Client Follow-up Call",
    description: "Scheduled follow-up call with client to review progress and address concerns",
    requires_contact: true,
    priority: "medium",
    reminder_minutes_before: 30
  },
  {
    name: "Care Plan Review",
    icon: FileText,
    entry_type: "care_plan_review",
    title: "Care Plan Review",
    description: "Review and update client care plan based on recent progress",
    requires_contact: false,
    priority: "high",
    reminder_minutes_before: 60
  },
  {
    name: "Provider Coordination",
    icon: Phone,
    entry_type: "provider_coordination",
    title: "Provider Coordination Call",
    description: "Coordinate care with healthcare provider",
    requires_contact: true,
    priority: "medium",
    reminder_minutes_before: 30
  },
  {
    name: "Med Reconciliation",
    icon: Clock,
    entry_type: "medication_reconciliation",
    title: "Medication Reconciliation",
    description: "Review current medications and update medication list",
    requires_contact: false,
    priority: "high",
    reminder_minutes_before: 60
  },
  {
    name: "Email Follow-up",
    icon: Mail,
    entry_type: "email",
    title: "Email Follow-up",
    description: "Send follow-up email regarding care coordination",
    requires_contact: true,
    priority: "low",
    reminder_minutes_before: 60
  },
  {
    name: "Appointment Check",
    icon: Calendar,
    entry_type: "appointment_confirmation",
    title: "Appointment Confirmation",
    description: "Confirm upcoming appointment with client",
    requires_contact: true,
    priority: "medium",
    reminder_minutes_before: 1440 // 1 day
  }
];

interface DiaryEntryTemplatesProps {
  onSelectTemplate: (template: any) => void;
}

export function DiaryEntryTemplates({ onSelectTemplate }: DiaryEntryTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSelect = (template: DiaryTemplate) => {
    setSelectedTemplate(template.name);
    onSelectTemplate({
      entry_type: template.entry_type,
      title: template.title,
      description: template.description,
      requires_contact: template.requires_contact,
      priority: template.priority,
      reminder_minutes_before: template.reminder_minutes_before,
      reminder_enabled: true,
      template_name: template.name
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Quick Entry Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.name}
                onClick={() => handleSelect(template)}
                className={`p-4 border rounded-lg text-left hover:border-primary hover:bg-accent transition-colors ${
                  selectedTemplate === template.name ? "border-primary bg-accent" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{template.name}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {template.priority}
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
