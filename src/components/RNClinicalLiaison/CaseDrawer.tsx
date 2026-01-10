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
import { supabaseGet } from "@/lib/supabaseRest";
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
  case_number?: string | null;
  case_status: string | null;
  case_type?: string | null;
  created_at: string | null;
  client_id?: string | null;
  attorney_id?: string | null;
  intake_data?: {
    fourPs?: any;
    sdoh?: any;
    client?: {
      fullName?: string;
      email?: string;
      phone?: string;
      state?: string;
    };
    intake?: any;
  } | null;
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
  created_by: string | null;
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

      // Fetch case data from rc_cases
      const { data: caseInfoData, error: caseError } = await supabaseGet(
        'rc_cases',
        `select=*&id=eq.${caseId}&limit=1`
      );

      if (caseError) throw caseError;

      const caseInfo = Array.isArray(caseInfoData) ? (caseInfoData[0] || null) : caseInfoData;

      if (!caseInfo) {
        throw new Error('Case not found');
      }

      // Fetch intake data from rc_client_intakes
      const { data: intakeDataRaw } = await supabaseGet(
        'rc_client_intakes',
        `select=intake_json&case_id=eq.${caseId}&intake_status=eq.attorney_confirmed&order=intake_submitted_at.desc&limit=1`
      );

      const intakeData = Array.isArray(intakeDataRaw) ? (intakeDataRaw[0] || null) : intakeDataRaw;

      // Combine case data with intake data
      const combinedCaseData: CaseData = {
        ...caseInfo,
        intake_data: intakeData?.intake_json || null,
      };
      setCaseData(combinedCaseData);

      // Fetch tasks (keep case_tasks for now as specified)
      const { data: tasksData } = await supabaseGet(
        'case_tasks',
        `select=*&case_id=eq.${caseId}&order=due_date.asc`
      );

      const tasksArray = Array.isArray(tasksData) ? tasksData : (tasksData ? [tasksData] : []);
      setTasks(tasksArray);

      // Fetch documents (keep documents table for now)
      const { data: docsData } = await supabaseGet(
        'documents',
        `select=*&case_id=eq.${caseId}&order=uploaded_at.desc&limit=10`
      );

      const docsArray = Array.isArray(docsData) ? docsData : (docsData ? [docsData] : []);
      setDocuments(docsArray);

      // Fetch clinical notes from rc_clinical_notes
      const { data: notesData, error: notesError } = await supabaseGet(
        'rc_clinical_notes',
        `select=*&case_id=eq.${caseId}&order=created_at.desc&limit=10`
      );

      if (notesError) {
        console.error("Error fetching notes:", notesError);
        // Fallback to empty array if notes fail
        setNotes([]);
      } else {
        const notesArray = Array.isArray(notesData) ? notesData : (notesData ? [notesData] : []);
        setNotes(notesArray);
      }

      // Fetch activity log from rc_activity_log
      // Note: We can add this later if needed for the UI
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
            <span>Case: {caseData.case_number || caseData.id || "N/A"}</span>
            <Badge variant="outline">{caseData.case_status || "N/A"}</Badge>
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
                    <p className="text-sm text-muted-foreground">Case Number</p>
                    <p className="font-medium">{caseData.case_number || caseData.id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Case Status</p>
                    <p className="font-medium">{caseData.case_status || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {caseData.created_at ? format(parseISO(caseData.created_at), "MMM d, yyyy") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{caseData.case_type || "Standard"}</p>
                  </div>
                </div>
                {caseData.intake_data && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {caseData.intake_data.client && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Client Information</h4>
                        <p><strong>Name:</strong> {caseData.intake_data.client.fullName || "N/A"}</p>
                        <p><strong>State:</strong> {caseData.intake_data.client.state || "N/A"}</p>
                        {caseData.intake_data.client.email && <p><strong>Email:</strong> {caseData.intake_data.client.email}</p>}
                        {caseData.intake_data.client.phone && <p><strong>Phone:</strong> {caseData.intake_data.client.phone}</p>}
                      </div>
                    )}
                    {caseData.intake_data.intake && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Intake Details</h4>
                        <p><strong>Incident Type:</strong> {caseData.intake_data.intake.incidentType || "N/A"}</p>
                        <p><strong>Incident Date:</strong> {caseData.intake_data.intake.incidentDate || "N/A"}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold mb-2">Intake Assessment</p>
                      {caseData.intake_data.fourPs && (
                        <div className="text-sm text-muted-foreground mb-2">
                          <p>4Ps: Physical: {caseData.intake_data.fourPs.physical || "N/A"}, 
                             Psychological: {caseData.intake_data.fourPs.psychological || "N/A"}, 
                             Psychosocial: {caseData.intake_data.fourPs.psychosocial || "N/A"}, 
                             Professional: {caseData.intake_data.fourPs.professional || "N/A"}</p>
                        </div>
                      )}
                      {caseData.intake_data.sdoh && (
                        <div className="text-sm text-muted-foreground">
                          <p>SDOH data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                          <Badge variant="outline">Clinical Note</Badge>
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
