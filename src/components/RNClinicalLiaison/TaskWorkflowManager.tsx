import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { CheckSquare, Plus, Clock, AlertCircle, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  assigned_to?: string;
  assigned_role?: string;
  created_at: string;
  completed_at?: string;
}

interface TaskWorkflowManagerProps {
  caseId: string;
}

export default function TaskWorkflowManager({ caseId }: TaskWorkflowManagerProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    assigned_role: "RN_CM"
  });

  useEffect(() => {
    fetchTasks();
  }, [caseId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("case_tasks")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title || !user) return;

    try {
      const { error } = await supabase.from("case_tasks").insert({
        case_id: caseId,
        created_by: user.id,
        ...formData,
        status: "pending"
      });

      if (error) throw error;
      
      toast.success("Task created successfully");
      setIsOpen(false);
      setFormData({ title: "", description: "", due_date: "", assigned_role: "RN_CM" });
      fetchTasks();
    } catch (error: any) {
      toast.error("Failed to create task");
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("case_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) throw error;
      
      toast.success("Task marked as completed");
      fetchTasks();
    } catch (error: any) {
      toast.error("Failed to update task");
    }
  };

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "pending": return "outline";
      default: return "outline";
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-4 gap-4 flex-1 mr-4">
          <Card className="p-3">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{pendingTasks.length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold">{inProgressTasks.length}</p>
          </Card>
          <Card className="p-3">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{completedTasks.length}</p>
          </Card>
          <Card className="p-3 border-orange-500">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-orange-500">{overdueTasks.length}</p>
          </Card>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Task Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task details..."
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Assign To Role</Label>
                <Select value={formData.assigned_role} onValueChange={(value) => setFormData({ ...formData, assigned_role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RN_CM">RN Case Manager</SelectItem>
                    <SelectItem value="RCMS_CLINICAL_MGMT">RN Clinical Manager</SelectItem>
                    <SelectItem value="ATTORNEY">Attorney</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTask} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pendingTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No pending tasks</p>
            </Card>
          ) : (
            pendingTasks.map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              return (
                <Card key={task.id} className={`p-4 ${isOverdue ? 'border-orange-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isOverdue && <AlertCircle className="h-4 w-4 text-orange-500" />}
                        <h4 className="font-semibold">{task.title}</h4>
                        <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
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
                        {task.assigned_role && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assigned_role}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleCompleteTask(task.id)}>
                      Complete
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-3">
          {inProgressTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No tasks in progress</p>
            </Card>
          ) : (
            inProgressTasks.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{task.title}</h4>
                      <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleCompleteTask(task.id)}>
                    Complete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No completed tasks</p>
            </Card>
          ) : (
            completedTasks.map((task) => (
              <Card key={task.id} className="p-4 opacity-60">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-green-500" />
                  <h4 className="font-semibold">{task.title}</h4>
                  {task.completed_at && (
                    <span className="text-sm text-muted-foreground ml-auto">
                      {new Date(task.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
