import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  FileText,
  Calendar,
  Activity,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { CarePlansViewer } from "@/components/CarePlansViewer";
import CareCoordinationDashboard from "./CareCoordinationDashboard";

interface CaseDrawerProps {
  caseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CaseData {
  id: string;
  client_label: string | null;
  status: string | null;
  created_at: string | null;
  client_type?: string | null;
  atty_ref?: string | null;
  attorney_code?: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  assigned_role?: string;
  assigned_to?: string;
}

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  created_at: string;
  status: string;
  category?: string;
}

interface Note {
  id: string;
  note_text: string;
  created_at: string;
  created_by: string;
  visibility: string;
}

export function CaseDrawer({ caseId, open, onOpenChange }: CaseDrawerProps) {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (caseId && open) {
      fetchCaseData();
    }
  }, [caseId, open]);

  const fetchCaseData = async () => {
    if (!caseId) return;

    try {
      setLoading(true);

      // Fetch case data
      const { data: caseInfo, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (caseError) throw caseError;
      setCaseData(caseInfo);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from("case_tasks")
        .select("*")
        .eq("case_id", caseId)
        .order("due_date", { ascending: true });

      setTasks(tasksData || []);

      // Fetch documents
      const { data: docsData } = await supabase
        .from("documents")
        .select("*")
        .eq("case_id", caseId)
        .order("uploaded_at", { ascending: false })
        .limit(10);

      setDocuments(docsData || []);

      // Fetch notes
      const { data: notesData } = await supabase
        .from("case_notes")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(10);

      setNotes(notesData || []);
    } catch (error) {
      console.error("Error fetching case data:", error);
      toast({
        title: "Error",
        description: "Failed to load case information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      completed: { variant: "default" as const, className: "bg-green-100 text-green-800" },
      in_progress: { variant: "secondary" as const, className: "bg-blue-100 text-blue-800" },
      pending: { variant: "outline" as const, className: "bg-gray-100 text-gray-800" },
      overdue: { variant: "destructive" as const, className: "bg-red-100 text-red-800" },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-white",
      low: "bg-green-500 text-white",
    };

    return (
      <Badge className={colors[priority] || colors.medium}>
        {priority}
      </Badge>
    );
  };

  if (!caseData) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Loading...</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Case: {caseData.client_label || "N/A"}</span>
            <Badge variant="outline">{caseData.status || "N/A"}</Badge>
          </SheetTitle>
          <SheetDescription>
            Complete case information and management tools
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="careplans">Care Plans</TabsTrigger>
            <TabsTrigger value="coordination">Coordination</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Client Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client ID</p>
                    <p className="font-medium">{caseData.client_label || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Case Status</p>
                    <p className="font-medium">{caseData.status || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {caseData.created_at ? format(parseISO(caseData.created_at), "MMM d, yyyy") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{caseData.client_type || "Standard"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                ) : (
                  <div className="space-y-3">
                    {notes.slice(0, 3).map((note) => (
                      <div key={note.id} className="border-l-2 border-primary pl-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline">Note</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(note.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm">{note.note_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{tasks.length}</p>
                    <p className="text-sm text-muted-foreground">Tasks</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{documents.length}</p>
                    <p className="text-sm text-muted-foreground">Documents</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{notes.length}</p>
                    <p className="text-sm text-muted-foreground">Notes</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Case Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks yet</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{task.title}</p>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {task.description}
                            </p>
                          )}
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Due: {format(parseISO(task.due_date), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Case Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents yet</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.document_type} • {format(parseISO(doc.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(doc.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Care Plans Tab */}
          <TabsContent value="careplans" className="mt-4">
            <CarePlansViewer caseId={caseId!} />
          </TabsContent>

          {/* Coordination Tab */}
          <TabsContent value="coordination" className="mt-4">
            <CareCoordinationDashboard caseId={caseId!} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
