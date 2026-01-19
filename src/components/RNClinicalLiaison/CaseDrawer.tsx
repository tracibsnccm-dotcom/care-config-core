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
import { ConsentDocumentViewer } from "@/components/ConsentDocumentViewer";

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
    fourPs?: {
      physical?: number;
      psychological?: number;
      psychosocial?: number;
      professional?: number;
    };
    sdoh?: {
      food?: number;
      safety?: number;
      housing?: number;
      financial?: number;
      transport?: number;
      transportation?: number;
    };
    consent?: {
      scope?: {
        shareWithAttorney?: boolean;
        shareWithProviders?: boolean;
        shareWithRN?: boolean;
      } | string;
      signed?: boolean;
      signedAt?: string;
      restrictedAccess?: boolean;
    };
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
        `select=*&id=eq.${caseId}&is_superseded=eq.false&limit=1`
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="careplans">Care Plans</TabsTrigger>
            <TabsTrigger value="coordination">Coordination</TabsTrigger>
            <TabsTrigger value="consents">Consents</TabsTrigger>
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
                    {caseData.intake_data?.intake && (
                      <div className="mb-4 space-y-4">
                        {/* Incident Information */}
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <h4 className="font-semibold text-red-900 mb-3">Incident Information</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><strong>Type:</strong> {caseData.intake_data.intake.incidentType || "N/A"}</p>
                            <p><strong>Date:</strong> {caseData.intake_data.intake.incidentDate || "N/A"}</p>
                            <p><strong>Severity Self-Score:</strong> {caseData.intake_data.intake.severitySelfScore || "N/A"}/10</p>
                          </div>
                          {caseData.intake_data.intake.incidentNarrative && (
                            <div className="mt-3">
                              <strong>Client's Description:</strong>
                              <p className="mt-1 p-2 bg-white rounded border">{caseData.intake_data.intake.incidentNarrative}</p>
                            </div>
                          )}
                          {caseData.intake_data.intake.incidentNarrativeExtra && (
                            <div className="mt-2">
                              <strong>Additional Details:</strong>
                              <p className="mt-1 p-2 bg-white rounded border">{caseData.intake_data.intake.incidentNarrativeExtra}</p>
                            </div>
                          )}
                        </div>

                        {/* Medical Information */}
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-3">Medical Information</h4>
                          
                          {caseData.intake_data.intake.injuries && caseData.intake_data.intake.injuries.length > 0 && (
                            <div className="mb-2">
                              <strong>Injuries:</strong>
                              <p>{Array.isArray(caseData.intake_data.intake.injuries) ? caseData.intake_data.intake.injuries.join(", ") : caseData.intake_data.intake.injuries}</p>
                            </div>
                          )}
                          
                          {caseData.intake_data.intake.conditions && (
                            <div className="mb-2">
                              <strong>Pre-existing Conditions:</strong>
                              <p>{Array.isArray(caseData.intake_data.intake.conditions) ? caseData.intake_data.intake.conditions.join(", ") : caseData.intake_data.intake.conditions || "None reported"}</p>
                            </div>
                          )}
                          
                          {caseData.intake_data.intake.allergies && (
                            <div className="mb-2">
                              <strong>Allergies:</strong>
                              <p>{Array.isArray(caseData.intake_data.intake.allergies) ? caseData.intake_data.intake.allergies.join(", ") : caseData.intake_data.intake.allergies || "None reported"}</p>
                            </div>
                          )}
                          
                          {caseData.intake_data.intake.medList && (
                            <div className="mb-2">
                              <strong>Current Medications:</strong>
                              <p>{Array.isArray(caseData.intake_data.intake.medList) ? caseData.intake_data.intake.medList.join(", ") : caseData.intake_data.intake.medList || "None reported"}</p>
                            </div>
                          )}
                          
                          {caseData.intake_data.intake.initialTreatment && (
                            <div className="mb-2">
                              <strong>Initial Treatment:</strong>
                              <p>{caseData.intake_data.intake.initialTreatment}</p>
                            </div>
                          )}
                        </div>

                        {/* Physical Health Notes */}
                        {(caseData.intake_data.intake.physicalPreNotes || caseData.intake_data.intake.physicalPostNotes || 
                          (caseData.intake_data.intake.physicalPreDiagnoses && caseData.intake_data.intake.physicalPreDiagnoses.length > 0) ||
                          (caseData.intake_data.intake.physicalPostDiagnoses && caseData.intake_data.intake.physicalPostDiagnoses.length > 0)) && (
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-green-900 mb-3">Physical Health Assessment</h4>
                            
                            {caseData.intake_data.intake.physicalPreDiagnoses && caseData.intake_data.intake.physicalPreDiagnoses.length > 0 && (
                              <div className="mb-3">
                                <strong>Pre-Incident Diagnoses:</strong>
                                <p>{Array.isArray(caseData.intake_data.intake.physicalPreDiagnoses) ? caseData.intake_data.intake.physicalPreDiagnoses.join(", ") : caseData.intake_data.intake.physicalPreDiagnoses}</p>
                              </div>
                            )}
                            
                            {caseData.intake_data.intake.physicalPreNotes && (
                              <div className="mb-3">
                                <strong>Pre-Incident Notes:</strong>
                                <p className="mt-1 p-2 bg-white rounded border">{caseData.intake_data.intake.physicalPreNotes}</p>
                              </div>
                            )}
                            
                            {caseData.intake_data.intake.physicalPostDiagnoses && caseData.intake_data.intake.physicalPostDiagnoses.length > 0 && (
                              <div className="mb-3">
                                <strong>Post-Incident Diagnoses:</strong>
                                <p>{Array.isArray(caseData.intake_data.intake.physicalPostDiagnoses) ? caseData.intake_data.intake.physicalPostDiagnoses.join(", ") : caseData.intake_data.intake.physicalPostDiagnoses}</p>
                              </div>
                            )}
                            
                            {caseData.intake_data.intake.physicalPostNotes && (
                              <div className="mb-2">
                                <strong>Post-Incident Notes:</strong>
                                <p className="mt-1 p-2 bg-white rounded border">{caseData.intake_data.intake.physicalPostNotes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Behavioral Health Notes */}
                        {(caseData.intake_data.intake.bhNotes || 
                          (caseData.intake_data.intake.bhPreDiagnoses && caseData.intake_data.intake.bhPreDiagnoses.length > 0) ||
                          (caseData.intake_data.intake.bhPostDiagnoses && caseData.intake_data.intake.bhPostDiagnoses.length > 0)) && (
                          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold text-yellow-900 mb-3">Behavioral Health Assessment</h4>
                            
                            {caseData.intake_data.intake.bhPreDiagnoses && caseData.intake_data.intake.bhPreDiagnoses.length > 0 && (
                              <div className="mb-3">
                                <strong>Pre-Incident Diagnoses:</strong>
                                <p>{Array.isArray(caseData.intake_data.intake.bhPreDiagnoses) ? caseData.intake_data.intake.bhPreDiagnoses.join(", ") : caseData.intake_data.intake.bhPreDiagnoses}</p>
                              </div>
                            )}
                            
                            {caseData.intake_data.intake.bhPostDiagnoses && caseData.intake_data.intake.bhPostDiagnoses.length > 0 && (
                              <div className="mb-3">
                                <strong>Post-Incident Diagnoses:</strong>
                                <p>{Array.isArray(caseData.intake_data.intake.bhPostDiagnoses) ? caseData.intake_data.intake.bhPostDiagnoses.join(", ") : caseData.intake_data.intake.bhPostDiagnoses}</p>
                              </div>
                            )}
                            
                            {caseData.intake_data.intake.bhNotes && (
                              <div className="mb-2">
                                <strong>Notes:</strong>
                                <p className="mt-1 p-2 bg-white rounded border">{caseData.intake_data.intake.bhNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4Ps Wellness Scores */}
                    {caseData.intake_data?.fourPs && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mt-4">
                        <h4 className="font-semibold text-blue-900 mb-3">4Ps Wellness Assessment (Client Self-Report)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-white rounded border">
                            <div className="text-2xl font-bold text-blue-600">{caseData.intake_data.fourPs.physical || "N/A"}</div>
                            <div className="text-xs text-gray-600">Physical</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded border">
                            <div className="text-2xl font-bold text-purple-600">{caseData.intake_data.fourPs.psychological || "N/A"}</div>
                            <div className="text-xs text-gray-600">Psychological</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded border">
                            <div className="text-2xl font-bold text-green-600">{caseData.intake_data.fourPs.psychosocial || "N/A"}</div>
                            <div className="text-xs text-gray-600">Psychosocial</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded border">
                            <div className="text-2xl font-bold text-orange-600">{caseData.intake_data.fourPs.professional || "N/A"}</div>
                            <div className="text-xs text-gray-600">Professional</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Scale: 1 (Critical) to 5 (Stable)</p>
                      </div>
                    )}

                    {/* SDOH Scores */}
                    {caseData.intake_data?.sdoh && (
                      <div className="p-4 bg-teal-50 rounded-lg border border-teal-200 mt-4">
                        <h4 className="font-semibold text-teal-900 mb-3">Social Determinants of Health (SDOH)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="text-xl font-bold text-teal-600">{caseData.intake_data.sdoh.food || "N/A"}</div>
                            <div className="text-xs text-gray-600">Food Security</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="text-xl font-bold text-teal-600">{caseData.intake_data.sdoh.safety || "N/A"}</div>
                            <div className="text-xs text-gray-600">Safety</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="text-xl font-bold text-teal-600">{caseData.intake_data.sdoh.housing || "N/A"}</div>
                            <div className="text-xs text-gray-600">Housing</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="text-xl font-bold text-teal-600">{caseData.intake_data.sdoh.financial || "N/A"}</div>
                            <div className="text-xs text-gray-600">Financial</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded border">
                            <div className="text-xl font-bold text-teal-600">{caseData.intake_data.sdoh.transport || caseData.intake_data.sdoh.transportation || "N/A"}</div>
                            <div className="text-xs text-gray-600">Transportation</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Scale: 1 (At Risk) to 5 (Stable)</p>
                      </div>
                    )}

                    {/* Consent Records */}
                    {caseData.intake_data?.consent && (
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 mt-4">
                        <h4 className="font-semibold text-emerald-900 mb-3">Consent Records</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${caseData.intake_data.consent.signed ? 'bg-green-500' : 'bg-red-500'} text-white text-xs`}>
                              {caseData.intake_data.consent.signed ? '✓' : '✗'}
                            </span>
                            <span><strong>Consent Signed:</strong> {caseData.intake_data.consent.signed ? 'Yes' : 'No'}</span>
                          </div>
                          
                          {caseData.intake_data.consent.signedAt && (
                            <p><strong>Signed At:</strong> {new Date(caseData.intake_data.consent.signedAt).toLocaleString()}</p>
                          )}
                          
                          {caseData.intake_data.consent.scope && (
                            <div className="mt-3 p-3 bg-white rounded border">
                              <strong>Consent Scope:</strong>
                              <ul className="mt-1 ml-4 list-disc">
                                {typeof caseData.intake_data.consent.scope === 'object' ? (
                                  <>
                                    {caseData.intake_data.consent.scope.shareWithAttorney && (
                                      <li>✓ Share with Attorney</li>
                                    )}
                                    {caseData.intake_data.consent.scope.shareWithProviders && (
                                      <li>✓ Share with Healthcare Providers</li>
                                    )}
                                    {caseData.intake_data.consent.scope.shareWithRN && (
                                      <li>✓ Share with RN Case Manager</li>
                                    )}
                                  </>
                                ) : (
                                  <li>{caseData.intake_data.consent.scope}</li>
                                )}
                              </ul>
                            </div>
                          )}
                          
                          <p><strong>Restricted Access:</strong> {caseData.intake_data.consent.restrictedAccess ? 'Yes - Limited sharing' : 'No - Standard sharing'}</p>
                        </div>
                        
                        <div className="mt-4 p-3 bg-emerald-100 rounded border border-emerald-300">
                          <p className="text-xs text-emerald-800">
                            <strong>Note:</strong> This consent was obtained during client intake. 
                            Copies should be saved to the case file for Client, Attorney, and RN records.
                          </p>
                        </div>
                      </div>
                    )}
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

          {/* Consents Tab */}
          <TabsContent value="consents" className="mt-4">
            <ConsentDocumentViewer caseId={caseId!} showPrintButton={true} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
