import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Clock, FileText, Phone, Calendar } from "lucide-react";
import { useState } from "react";

interface Priority {
  id: string;
  type: "alert" | "deadline" | "callback" | "documentation" | "appointment";
  title: string;
  details: string;
  caseId?: string;
  urgency: "critical" | "high" | "medium";
  completed: boolean;
}

export function RNTodaysPriorities() {
  // Mock data - replace with real data from hooks
  const [priorities, setPriorities] = useState<Priority[]>([
    {
      id: "1",
      type: "alert",
      title: "Follow up on suicidal ideation alert",
      details: "Sarah M. - RCMS-2024-001",
      caseId: "RCMS-2024-001",
      urgency: "critical",
      completed: false
    },
    {
      id: "2",
      type: "deadline",
      title: "Complete care plan review",
      details: "Due today: John D. - RCMS-2024-002",
      caseId: "RCMS-2024-002",
      urgency: "high",
      completed: false
    },
    {
      id: "3",
      type: "callback",
      title: "Return call to client",
      details: "Maria G. medication questions",
      caseId: "RCMS-2024-003",
      urgency: "high",
      completed: false
    },
    {
      id: "4",
      type: "documentation",
      title: "Sign pending care plans",
      details: "2 care plans awaiting signature",
      urgency: "medium",
      completed: false
    },
    {
      id: "5",
      type: "appointment",
      title: "Team meeting at 2:00 PM",
      details: "Monthly quality review",
      urgency: "medium",
      completed: false
    },
  ]);

  const toggleComplete = (id: string) => {
    setPriorities(priorities.map(p => 
      p.id === id ? { ...p, completed: !p.completed } : p
    ));
  };

  const getIcon = (type: Priority["type"]) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "deadline":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "callback":
        return <Phone className="h-4 w-4 text-blue-500" />;
      case "documentation":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "appointment":
        return <Calendar className="h-4 w-4 text-green-500" />;
    }
  };

  const getUrgencyColor = (urgency: Priority["urgency"]) => {
    switch (urgency) {
      case "critical":
        return "border-l-red-500 bg-red-50";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      default:
        return "border-l-blue-500 bg-card";
    }
  };

  const activePriorities = priorities.filter(p => !p.completed);
  const criticalCount = activePriorities.filter(p => p.urgency === "critical").length;
  const completedCount = priorities.filter(p => p.completed).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#0f2a6a]">Today's Priorities</CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalCount} Critical
              </Badge>
            )}
            <Badge variant="outline">
              {completedCount}/{priorities.length} Done
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {priorities.map((priority) => (
            <div
              key={priority.id}
              className={`p-3 rounded-lg border-l-4 transition-all ${
                priority.completed 
                  ? "opacity-50 bg-muted" 
                  : getUrgencyColor(priority.urgency)
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={priority.completed}
                  onCheckedChange={() => toggleComplete(priority.id)}
                  className="mt-1"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getIcon(priority.type)}
                      <h4 className={`font-semibold text-sm ${
                        priority.completed ? "line-through" : ""
                      }`}>
                        {priority.title}
                      </h4>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {priority.details}
                  </p>

                  {!priority.completed && priority.caseId && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        View Case
                      </Button>
                      {priority.type === "callback" && (
                        <Button size="sm" variant="default" className="h-7 text-xs">
                          Call Now
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activePriorities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">🎉 All priorities completed for today!</p>
          </div>
        )}

        {activePriorities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {activePriorities.length} remaining tasks
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setPriorities(priorities.map(p => ({ ...p, completed: true })))}
              >
                Mark All Complete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
