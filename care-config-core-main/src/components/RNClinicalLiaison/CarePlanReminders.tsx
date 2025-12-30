import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Check, X, Plus, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export function CarePlanReminders() {
  const [reminders, setReminders] = useState([
    {
      id: "1",
      case_id: "case-123",
      client_name: "J.D.",
      reminder_type: "review_due",
      title: "Care Plan Review Due",
      description: "30-day care plan review",
      reminder_date: new Date(2025, 3, 15),
      priority: "high",
      status: "pending",
    },
    {
      id: "2",
      case_id: "case-456",
      client_name: "M.S.",
      reminder_type: "goal_check",
      title: "Short-term Goal Check-in",
      description: "Review progress on mobility goals",
      reminder_date: new Date(2025, 3, 18),
      priority: "normal",
      status: "pending",
    },
    {
      id: "3",
      case_id: "case-789",
      client_name: "A.B.",
      reminder_type: "assessment_due",
      title: "Pain Assessment Due",
      description: "Quarterly pain assessment",
      reminder_date: new Date(2025, 3, 20),
      priority: "normal",
      status: "acknowledged",
    },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      default:
        return "secondary";
    }
  };

  const handleAcknowledge = (id: string) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, status: "acknowledged" } : r)
    );
  };

  const handleComplete = (id: string) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, status: "completed" } : r)
    );
  };

  const handleDismiss = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Care Plan Reminders</h2>
          <p className="text-sm text-muted-foreground">Stay on top of care plan reviews and updates</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Reminder
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.map((reminder) => (
          <Card key={reminder.id} className={reminder.status === "completed" ? "opacity-60" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getPriorityColor(reminder.priority)}>
                      {reminder.priority}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {reminder.reminder_type.replace("_", " ")}
                    </Badge>
                    {reminder.status === "acknowledged" && (
                      <Badge variant="secondary">Acknowledged</Badge>
                    )}
                    {reminder.status === "completed" && (
                      <Badge variant="default" className="bg-green-600">Completed</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{reminder.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{reminder.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(reminder.reminder_date, "MMM dd, yyyy")}
                    </div>
                    <span>Client: {reminder.client_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {reminder.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(reminder.id)}
                      >
                        <Bell className="w-4 h-4 mr-1" />
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleComplete(reminder.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    </>
                  )}
                  {reminder.status === "acknowledged" && (
                    <Button
                      size="sm"
                      onClick={() => handleComplete(reminder.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(reminder.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reminders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No reminders at this time. You're all caught up!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
