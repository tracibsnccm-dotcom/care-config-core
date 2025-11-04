import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Phone, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  entry_type: string;
  defaultData: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    requires_contact: boolean;
    reminder_enabled: boolean;
    reminder_minutes_before: number;
  };
}

const TEMPLATES: Template[] = [
  {
    id: "initial-home-visit",
    name: "Initial Assessment Visit",
    description: "First comprehensive assessment with client",
    icon: FileText,
    category: "Assessment",
    entry_type: "consultation",
    defaultData: {
      title: "Initial Client Assessment",
      description: "Complete initial assessment including:\n- Medical history review\n- Current symptoms and concerns\n- Medication review\n- SDOH screening\n- Care plan development\n- Client education",
      priority: "high",
      requires_contact: true,
      reminder_enabled: true,
      reminder_minutes_before: 120,
    },
  },
  {
    id: "follow-up-call",
    name: "Follow-Up Phone Call",
    description: "Check-in call to monitor progress",
    icon: Phone,
    category: "Follow-Up",
    entry_type: "phone_call",
    defaultData: {
      title: "Follow-Up Phone Call",
      description: "Follow-up call to check:\n- Medication adherence\n- Symptom changes\n- Upcoming appointments\n- Barriers to care\n- Client concerns",
      priority: "medium",
      requires_contact: true,
      reminder_enabled: true,
      reminder_minutes_before: 30,
    },
  },
  {
    id: "medical-coordination",
    name: "Medical Appointment Coordination",
    description: "Coordinate upcoming medical appointment",
    icon: Calendar,
    category: "Coordination",
    entry_type: "meeting",
    defaultData: {
      title: "Medical Appointment Coordination",
      description: "Coordinate with:\n- Confirm appointment date/time\n- Transportation arrangements\n- Required documentation\n- Pre-appointment instructions\n- Follow-up scheduling",
      priority: "high",
      requires_contact: true,
      reminder_enabled: true,
      reminder_minutes_before: 60,
    },
  },
  {
    id: "crisis-intervention",
    name: "Crisis Intervention",
    description: "Urgent crisis response and intervention",
    icon: AlertCircle,
    category: "Crisis",
    entry_type: "consultation",
    defaultData: {
      title: "Crisis Intervention",
      description: "Crisis intervention:\n- Safety assessment\n- Immediate needs identification\n- Emergency resources activation\n- Crisis plan review\n- Follow-up scheduling\n- Documentation of intervention",
      priority: "urgent",
      requires_contact: true,
      reminder_enabled: false,
      reminder_minutes_before: 15,
    },
  },
  {
    id: "weekly-checkin",
    name: "Weekly Check-In",
    description: "Routine weekly progress check",
    icon: CheckCircle2,
    category: "Follow-Up",
    entry_type: "phone_call",
    defaultData: {
      title: "Weekly Check-In Call",
      description: "Weekly progress check:\n- Overall well-being\n- Pain/symptom levels\n- Medication status\n- Upcoming needs\n- Schedule next contact",
      priority: "medium",
      requires_contact: true,
      reminder_enabled: true,
      reminder_minutes_before: 30,
    },
  },
  {
    id: "care-plan-review",
    name: "Care Plan Review",
    description: "Review and update care plan with client",
    icon: FileText,
    category: "Assessment",
    entry_type: "consultation",
    defaultData: {
      title: "Care Plan Review",
      description: "Care plan review:\n- Goal progress evaluation\n- Plan adjustments needed\n- New concerns identification\n- Client feedback\n- Updated goals and interventions\n- Next review scheduling",
      priority: "medium",
      requires_contact: true,
      reminder_enabled: true,
      reminder_minutes_before: 60,
    },
  },
];

interface DiaryTemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateData: any) => void;
}

export function DiaryTemplateLibrary({ open, onOpenChange, onSelectTemplate }: DiaryTemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate({
      entry_type: template.entry_type,
      ...template.defaultData,
      template_name: template.name,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Diary Entry Templates</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all" ? "All" : category}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{template.category}</Badge>
                      <Badge variant={
                        template.defaultData.priority === "urgent" ? "destructive" :
                        template.defaultData.priority === "high" ? "default" :
                        "secondary"
                      }>
                        {template.defaultData.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No templates found matching your search.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}