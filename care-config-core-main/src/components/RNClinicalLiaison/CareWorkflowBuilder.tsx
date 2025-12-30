import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, GitBranch, Play, Settings, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CareWorkflowBuilder() {
  const [workflows, setWorkflows] = useState([
    {
      id: "1",
      template_name: "Standard Orthopedic Intake",
      workflow_type: "intake",
      estimated_duration_days: 14,
      steps: [
        { step: 1, name: "Initial Assessment", duration_days: 1 },
        { step: 2, name: "Imaging Review", duration_days: 3 },
        { step: 3, name: "Specialist Referral", duration_days: 5 },
        { step: 4, name: "Care Plan Development", duration_days: 2 },
      ],
      is_active: true,
      is_system_template: true,
    },
    {
      id: "2",
      template_name: "TBI Care Coordination",
      workflow_type: "care_coordination",
      estimated_duration_days: 30,
      steps: [
        { step: 1, name: "Neurological Assessment", duration_days: 2 },
        { step: 2, name: "Cognitive Testing", duration_days: 5 },
        { step: 3, name: "Family Education", duration_days: 1 },
        { step: 4, name: "Multi-disciplinary Team Meeting", duration_days: 3 },
      ],
      is_active: true,
      is_system_template: false,
    },
  ]);

  const getWorkflowTypeColor = (type: string) => {
    switch (type) {
      case "intake":
        return "default";
      case "assessment":
        return "secondary";
      case "care_coordination":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Care Workflow Builder</h2>
          <p className="text-sm text-muted-foreground">Create and manage care coordination workflows</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
              Workflow builder form would go here...
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflow Templates */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getWorkflowTypeColor(workflow.workflow_type)} className="capitalize">
                      {workflow.workflow_type.replace("_", " ")}
                    </Badge>
                    {workflow.is_system_template && (
                      <Badge variant="secondary">System Template</Badge>
                    )}
                    {workflow.is_active && (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900">
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{workflow.template_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Est. Duration: {workflow.estimated_duration_days} days • {workflow.steps.length} steps
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Workflow Steps */}
              <div className="space-y-2">
                {workflow.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-semibold text-sm">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{step.name}</p>
                      <p className="text-xs text-muted-foreground">{step.duration_days} day(s)</p>
                    </div>
                    {index < workflow.steps.length - 1 && (
                      <div className="text-muted-foreground">→</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <Play className="w-4 h-4 mr-1" />
                  Apply to Case
                </Button>
                {!workflow.is_system_template && (
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-1" />
                  Duplicate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <GitBranch className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No workflows created yet. Start by creating your first workflow template.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
