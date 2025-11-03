import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle2, AlertCircle, Calendar } from "lucide-react";

interface DischargePlanningModuleProps {
  caseId: string;
}

export default function DischargePlanningModule({ caseId }: DischargePlanningModuleProps) {
  const [checklist, setChecklist] = useState([
    { id: "1", item: "Final medical assessment completed", completed: false, critical: true },
    { id: "2", item: "Discharge medications reviewed and prescribed", completed: false, critical: true },
    { id: "3", item: "Follow-up appointments scheduled", completed: false, critical: true },
    { id: "4", item: "Home care arrangements confirmed", completed: false, critical: false },
    { id: "5", item: "Medical equipment needs addressed", completed: false, critical: false },
    { id: "6", item: "Patient education materials provided", completed: false, critical: false },
    { id: "7", item: "Transportation arrangements made", completed: false, critical: false },
    { id: "8", item: "Emergency contact information verified", completed: false, critical: true },
    { id: "9", item: "Discharge summary prepared", completed: false, critical: true },
    { id: "10", item: "Insurance/billing documentation complete", completed: false, critical: false }
  ]);

  const toggleItem = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const criticalIncomplete = checklist.filter(item => item.critical && !item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-2xl font-bold">{Math.round(progress)}%</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <Progress value={progress} className="mt-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Items Complete</p>
              <p className="text-2xl font-bold">{completedCount} / {checklist.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className={`p-4 ${criticalIncomplete > 0 ? 'border-orange-500' : 'border-green-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Items Pending</p>
              <p className={`text-2xl font-bold ${criticalIncomplete > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                {criticalIncomplete}
              </p>
            </div>
            <AlertCircle className={`h-8 w-8 ${criticalIncomplete > 0 ? 'text-orange-500' : 'text-green-500'}`} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Discharge Planning Checklist</h3>
          <Badge variant={progress === 100 ? "default" : "secondary"}>
            {progress === 100 ? "Ready for Discharge" : "In Progress"}
          </Badge>
        </div>

        <div className="space-y-4">
          {checklist.map((item) => (
            <div 
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                item.completed ? 'bg-muted/50' : ''
              } ${item.critical && !item.completed ? 'border-orange-500' : ''}`}
            >
              <Checkbox
                id={item.id}
                checked={item.completed}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor={item.id}
                  className={`text-sm font-medium cursor-pointer ${
                    item.completed ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {item.item}
                </label>
                {item.critical && !item.completed && (
                  <Badge variant="destructive" className="ml-2">Critical</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {criticalIncomplete > 0 ? (
                <span className="text-orange-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Complete all critical items before discharge
                </span>
              ) : (
                <span className="text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  All critical items completed
                </span>
              )}
            </div>
            <Button 
              disabled={progress !== 100}
              className="ml-4"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Discharge Summary
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-3">Discharge Instructions</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p><strong>Follow-up:</strong> Schedule within 7-10 days post-discharge</p>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p><strong>Medications:</strong> Review discharge prescriptions with patient</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p><strong>Warning Signs:</strong> Educate patient on when to seek immediate care</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
