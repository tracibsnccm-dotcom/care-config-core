import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Flag
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

type AssignmentStatus = "pending" | "in_progress" | "completed" | "overdue";
type AssignmentPriority = "low" | "medium" | "high" | "urgent";

interface Assignment {
  id: string;
  caseId: string;
  caseName: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
}

// Mock data
const mockAssignments: Assignment[] = [
  {
    id: "ASN-001",
    caseId: "CASE-2024-001",
    caseName: "A*** B***",
    title: "Initial Medical Records Review",
    description: "Review and summarize initial medical records from ED visit",
    assignedTo: "RN-001",
    assignedToName: "Maria Garcia (RN/CM)",
    status: "pending",
    priority: "high",
    dueDate: "2024-11-10",
    createdAt: "2024-11-06",
  },
  {
    id: "ASN-002",
    caseId: "CASE-2024-001",
    caseName: "A*** B***",
    title: "Provider Coordination",
    description: "Contact PT clinic and confirm appointment scheduling",
    assignedTo: "RN-001",
    assignedToName: "Maria Garcia (RN/CM)",
    status: "in_progress",
    priority: "medium",
    dueDate: "2024-11-08",
    createdAt: "2024-11-05",
  },
];

export function AssignmentsView() {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    caseId: "",
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium" as AssignmentPriority,
    dueDate: "",
  });

  const getStatusConfig = (status: AssignmentStatus) => {
    const configs = {
      pending: { 
        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", 
        icon: Clock, 
        label: "Pending" 
      },
      in_progress: { 
        color: "bg-blue-500/10 text-blue-600 border-blue-500/20", 
        icon: AlertCircle, 
        label: "In Progress" 
      },
      completed: { 
        color: "bg-green-500/10 text-green-600 border-green-500/20", 
        icon: CheckCircle2, 
        label: "Completed" 
      },
      overdue: { 
        color: "bg-destructive/10 text-destructive border-destructive/20", 
        icon: AlertCircle, 
        label: "Overdue" 
      },
    };
    return configs[status];
  };

  const getPriorityConfig = (priority: AssignmentPriority) => {
    const configs = {
      low: { color: "text-muted-foreground", label: "Low" },
      medium: { color: "text-blue-600", label: "Medium" },
      high: { color: "text-orange-600", label: "High" },
      urgent: { color: "text-destructive", label: "Urgent" },
    };
    return configs[priority];
  };

  const handleCreateAssignment = () => {
    if (!newAssignment.caseId || !newAssignment.title || !newAssignment.assignedTo || !newAssignment.dueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const assignment: Assignment = {
      id: `ASN-${String(assignments.length + 1).padStart(3, "0")}`,
      caseName: "Client Name",
      assignedToName: "Staff Member",
      status: "pending",
      createdAt: new Date().toISOString(),
      ...newAssignment,
    };

    setAssignments([...assignments, assignment]);
    setDialogOpen(false);
    setNewAssignment({
      caseId: "",
      title: "",
      description: "",
      assignedTo: "",
      priority: "medium",
      dueDate: "",
    });

    toast({
      title: "Assignment Created",
      description: "The assignment has been created successfully",
    });
  };

  const groupedAssignments = {
    pending: assignments.filter((a) => a.status === "pending"),
    in_progress: assignments.filter((a) => a.status === "in_progress"),
    completed: assignments.filter((a) => a.status === "completed"),
    overdue: assignments.filter((a) => a.status === "overdue"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pending Assignments</h2>
          <p className="text-muted-foreground">Manage RN/CM tasks and case reviews</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Assign a task to RN/CM staff for case review or coordination
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="caseId">Case ID *</Label>
                <Input
                  id="caseId"
                  placeholder="CASE-2024-001"
                  value={newAssignment.caseId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, caseId: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Initial Medical Records Review"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed instructions for the assignment..."
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assignedTo">Assign To *</Label>
                  <Select
                    value={newAssignment.assignedTo}
                    onValueChange={(value) => setNewAssignment({ ...newAssignment, assignedTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RN-001">Maria Garcia (RN/CM)</SelectItem>
                      <SelectItem value="RN-002">John Smith (RN/CM)</SelectItem>
                      <SelectItem value="STAFF-001">Robert Johnson (Staff)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newAssignment.priority}
                    onValueChange={(value: AssignmentPriority) => 
                      setNewAssignment({ ...newAssignment, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssignment}>Create Assignment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{groupedAssignments.pending.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{groupedAssignments.in_progress.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">{groupedAssignments.completed.length}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-destructive">{groupedAssignments.overdue.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-destructive opacity-20" />
          </div>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {assignments.map((assignment) => {
          const statusConfig = getStatusConfig(assignment.status);
          const StatusIcon = statusConfig.icon;
          const priorityConfig = getPriorityConfig(assignment.priority);

          return (
            <Card key={assignment.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                        <Badge className={`border ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <Flag className={`w-4 h-4 ${priorityConfig.color}`} />
                      </div>
                      <p className="text-sm text-muted-foreground">{assignment.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{assignment.caseName} ({assignment.caseId})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Assigned to: {assignment.assignedToName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View Details</Button>
                  {assignment.status !== "completed" && (
                    <Button size="sm">Mark Complete</Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {assignments.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No assignments found.</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Assignment
          </Button>
        </Card>
      )}
    </div>
  );
}
