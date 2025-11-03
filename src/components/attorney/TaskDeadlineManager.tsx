import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { CheckSquare, Plus, Clock, AlertTriangle, Calendar, Scale } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  case_id: string;
  priority?: "high" | "medium" | "low";
}

interface Deadline {
  id: string;
  type: "statute" | "discovery" | "filing" | "response";
  title: string;
  date: string;
  case_id: string;
  days_remaining: number;
}

export default function TaskDeadlineManager() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      // Get cases assigned to attorney
      const { data: cases } = await supabase
        .from("case_assignments")
        .select("case_id")
        .eq("user_id", user?.id)
        .eq("role", "ATTORNEY");

      if (!cases || cases.length === 0) {
        setTasks([]);
        return;
      }

      const caseIds = cases.map(c => c.case_id);

      // Fetch tasks
      const { data, error } = await supabase
        .from("case_tasks")
        .select("*")
        .in("case_id", caseIds)
        .order("due_date", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("case_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) throw error;
      
      toast.success("Task completed");
      fetchTasks();
    } catch (error: any) {
      toast.error("Failed to update task");
    }
  };

  // Mock deadlines
  const deadlines: Deadline[] = [
    {
      id: "1",
      type: "statute",
      title: "Statute of Limitations - Smith Case",
      date: "2026-03-15",
      case_id: "RC-12345678",
      days_remaining: 132
    },
    {
      id: "2",
      type: "discovery",
      title: "Discovery Deadline - Johnson Case",
      date: "2025-11-15",
      case_id: "RC-87654321",
      days_remaining: 12
    },
    {
      id: "3",
      type: "filing",
      title: "Response Filing Deadline",
      date: "2025-11-08",
      case_id: "RC-11223344",
      days_remaining: 5
    }
  ];

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const overdueTasks = pendingTasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date()
  );
  const urgentDeadlines = deadlines.filter(d => d.days_remaining <= 30);

  const getDeadlineColor = (days: number) => {
    if (days <= 7) return "destructive";
    if (days <= 30) return "default";
    return "secondary";
  };

  const getDeadlineIcon = (type: string) => {
    switch (type) {
      case "statute": return <Scale className="h-5 w-5" />;
      case "discovery": return <AlertTriangle className="h-5 w-5" />;
      case "filing": return <CheckSquare className="h-5 w-5" />;
      case "response": return <Clock className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading tasks and deadlines...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
              <p className="text-2xl font-bold">{pendingTasks.length}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-red-500">{overdueTasks.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Urgent Deadlines</p>
              <p className="text-2xl font-bold text-orange-500">{urgentDeadlines.length}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-500">{completedTasks.length}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="deadlines">Legal Deadlines ({deadlines.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-3">
          <div className="flex justify-end mb-4">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>

          {pendingTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No pending tasks</p>
            </Card>
          ) : (
            pendingTasks.map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              return (
                <Card key={task.id} className={`p-4 ${isOverdue ? 'border-red-500' : ''}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => handleCompleteTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <h4 className="font-semibold">{task.title}</h4>
                        {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                        <span className="text-muted-foreground">
                          Case: {task.case_id.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-3">
          <Card className="p-4 bg-orange-50 dark:bg-orange-950 border-orange-500 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Critical Legal Deadlines</h4>
                <p className="text-sm text-muted-foreground">
                  Missing these deadlines may result in case dismissal or sanctions
                </p>
              </div>
            </div>
          </Card>

          {deadlines.map((deadline) => (
            <Card key={deadline.id} className={`p-4 ${
              deadline.days_remaining <= 7 ? 'border-red-500' : 
              deadline.days_remaining <= 30 ? 'border-orange-500' : ''
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getDeadlineIcon(deadline.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{deadline.title}</h4>
                      <Badge variant={getDeadlineColor(deadline.days_remaining)}>
                        {deadline.days_remaining} days
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(deadline.date).toLocaleDateString()}
                      </div>
                      <div className="mt-1">Case: {deadline.case_id}</div>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">Set Reminder</Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No completed tasks</p>
            </Card>
          ) : (
            completedTasks.map((task) => (
              <Card key={task.id} className="p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Case: {task.case_id.slice(-8)}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
