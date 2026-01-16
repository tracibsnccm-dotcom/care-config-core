import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGet, supabaseInsert, supabaseUpdate } from "@/lib/supabaseRest";
import { format } from "date-fns";
import { AlertCircle, FileText, RefreshCw, ArrowRight, Clock, User, Users, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CheckinItem {
  id: string;
  case_id: string | null;
  client_id: string | null;
  created_at: string;
  note?: string | null;
}

interface RNNoteItem {
  id: string;
  case_id: string | null;
  created_at: string;
  note_text?: string | null;
  author_id?: string | null;
  author_name?: string | null;
}

interface PendingCase {
  id: string;
  case_number: string | null;
  case_type: string | null;
  date_of_injury: string | null;
  attorney_id: string | null;
  rc_clients?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  rc_users?: {
    full_name: string | null;
  } | null;
}

interface AvailableRN {
  id: string;
  full_name: string | null;
}

export default function RNSupervisor() {
  console.log("RNSupervisor: start");
  
  const navigate = useNavigate();
  const [supervisorEmail, setSupervisorEmail] = useState<string>("");
  const [supervisorName, setSupervisorName] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<CheckinItem[]>([]);
  const [notes, setNotes] = useState<RNNoteItem[]>([]);
  const [checkinsLoading, setCheckinsLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [pendingCases, setPendingCases] = useState<PendingCase[]>([]);
  const [availableRNs, setAvailableRNs] = useState<AvailableRN[]>([]);
  const [pendingCasesLoading, setPendingCasesLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedRNId, setSelectedRNId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const initializedRef = useRef(false);

  // Initialize: get user directly and check role
  useEffect(() => {
    const initialize = async () => {
      if (initializedRef.current) return;
      
      try {
        // Get user directly from Supabase auth
        console.log("RNSupervisor: calling supabase.auth.getUser()");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("RNSupervisor: Auth error:", authError);
          setError(`Authentication error: ${authError.message}`);
          return;
        }

        if (!user) {
          console.error("RNSupervisor: No user found - not logged in");
          setError("Not logged in. Please sign in to access the supervisor dashboard.");
          return;
        }

        console.log("RNSupervisor: user loaded", { userId: user.id, email: user.email });

        // Fetch profile and role
        console.log("RNSupervisor: fetching profile for user", user.id);
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name, email")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("RNSupervisor: Error fetching profile:", profileError);
          setError(`Failed to load profile: ${profileError.message}`);
          return;
        }

        if (profileData) {
          const role = profileData.role?.toLowerCase() || null;
          console.log("RNSupervisor: profile loaded", { role, fullName: profileData.full_name });
          
          setUserRole(role);
          setSupervisorName(profileData.full_name || "");
          setSupervisorEmail(profileData.email || user.email || "");

          // Role guard: if not rn_supervisor, stop loading immediately
          if (role !== "rn_supervisor") {
            console.log("RNSupervisor: role is not rn_supervisor, stopping");
            return;
          }
        } else {
          // No profile found
          console.warn("RNSupervisor: No profile found for user");
          setError("Profile not found. Please contact your administrator.");
          return;
        }

        // If we get here, user is authorized
      } catch (error: any) {
        console.error("RNSupervisor: Error in initialization:", error);
        setError(`Error loading dashboard: ${error?.message || "Unknown error"}`);
      } finally {
        // Always set loading to false and mark as initialized
        console.log("RNSupervisor: initialization complete, setting loading = false");
        setLoading(false);
        initializedRef.current = true;
      }
    };

    initialize();
  }, []); // Run once on mount

  // Load recent check-ins
  const loadCheckins = async () => {
    if (userRole !== "rn_supervisor") return;

    setCheckinsLoading(true);
    try {
      console.log("RNSupervisor: loading checkins...");
      
      // Try rc_client_checkins first
      const { data: checkinsData, error: checkinsError } = await supabase
        .from("rc_client_checkins")
        .select("id, case_id, client_id, created_at, note")
        .order("created_at", { ascending: false })
        .limit(10);

      if (checkinsError) {
        // If rc_client_checkins doesn't exist, try client_checkins
        if (checkinsError.code === "PGRST116" || checkinsError.message.includes("does not exist")) {
          const { data: altCheckinsData, error: altError } = await supabase
            .from("client_checkins")
            .select("id, case_id, client_id, created_at, note")
            .order("created_at", { ascending: false })
            .limit(10);

          if (!altError && altCheckinsData) {
            setCheckins(altCheckinsData);
            console.log("RNSupervisor: checkins loaded", altCheckinsData.length);
          } else {
            console.log("RNSupervisor: checkins loaded", 0, "(table not accessible)");
          }
        } else {
          console.error("RNSupervisor: Error loading check-ins:", checkinsError);
          // Don't set error - just show empty state
        }
      } else if (checkinsData) {
        setCheckins(checkinsData);
        console.log("RNSupervisor: checkins loaded", checkinsData.length);
      } else {
        console.log("RNSupervisor: checkins loaded", 0);
      }
    } catch (error: any) {
      console.error("RNSupervisor: Error loading check-ins:", error);
      // Don't crash - just show empty state
    } finally {
      setCheckinsLoading(false);
    }
  };

  // Load recent RN notes
  const loadNotes = async () => {
    if (userRole !== "rn_supervisor") return;

    setNotesLoading(true);
    try {
      console.log("RNSupervisor: loading notes...");
      
      // Try rc_rn_notes first
      const { data: notesData, error: notesError } = await supabase
        .from("rc_rn_notes")
        .select("id, case_id, created_at, note_text, author_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (notesError) {
        // If rc_rn_notes doesn't exist, try alternative table names
        if (notesError.code === "PGRST116" || notesError.message.includes("does not exist")) {
          // Try rn_notes as fallback
          const { data: altNotesData, error: altError } = await supabase
            .from("rn_notes")
            .select("id, case_id, created_at, note_text, author_id")
            .order("created_at", { ascending: false })
            .limit(10);

          if (!altError && altNotesData) {
            // Try to get author names
            const authorIds = altNotesData
              .map((n: any) => n.author_id)
              .filter((id: string | null) => id) as string[];
            
            if (authorIds.length > 0) {
              try {
                const { data: authorData } = await supabase
                  .from("profiles")
                  .select("id, full_name")
                  .in("id", authorIds);

                const authorMap = new Map(
                  (authorData || []).map((a: any) => [a.id, a.full_name || "RN"])
                );

                const notesWithAuthors = altNotesData.map((n: any) => ({
                  ...n,
                  author_name: authorMap.get(n.author_id) || "RN",
                }));
                setNotes(notesWithAuthors);
                console.log("RNSupervisor: notes loaded", notesWithAuthors.length);
              } catch (authorError) {
                setNotes(altNotesData);
                console.log("RNSupervisor: notes loaded", altNotesData.length, "(without author names)");
              }
            } else {
              setNotes(altNotesData);
              console.log("RNSupervisor: notes loaded", altNotesData.length);
            }
          } else {
            console.log("RNSupervisor: notes loaded", 0, "(table not accessible)");
          }
        } else {
          console.error("RNSupervisor: Error loading RN notes:", notesError);
          // Don't set error - just show empty state
        }
      } else if (notesData) {
        // Try to get author names if author_id is present
        const authorIds = notesData
          .map((n: any) => n.author_id)
          .filter((id: string | null) => id) as string[];
        
        if (authorIds.length > 0) {
          try {
            const { data: authorData } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", authorIds);

            const authorMap = new Map(
              (authorData || []).map((a: any) => [a.id, a.full_name || "RN"])
            );

            const notesWithAuthors = notesData.map((n: any) => ({
              ...n,
              author_name: authorMap.get(n.author_id) || "RN",
            }));
            setNotes(notesWithAuthors);
            console.log("RNSupervisor: notes loaded", notesWithAuthors.length);
          } catch (authorError) {
            // If author lookup fails, just use notes without author names
            setNotes(notesData);
            console.log("RNSupervisor: notes loaded", notesData.length, "(without author names)");
          }
        } else {
          setNotes(notesData);
          console.log("RNSupervisor: notes loaded", notesData.length);
        }
      } else {
        console.log("RNSupervisor: notes loaded", 0);
      }
    } catch (error: any) {
      console.error("RNSupervisor: Error loading RN notes:", error);
      // Don't crash - just show empty state
    } finally {
      setNotesLoading(false);
    }
  };

  // Load pending cases
  const loadPendingCases = async () => {
    if (userRole !== "rn_supervisor") return;

    setPendingCasesLoading(true);
    try {
      console.log("RNSupervisor: loading pending cases...");
      
      // Get cases that are attorney_confirmed
      const { data: casesData, error: casesError } = await supabaseGet(
        'rc_cases',
        'case_status=eq.attorney_confirmed&select=id,case_number,case_type,date_of_injury,attorney_id,client_id'
      );

      if (casesError) {
        console.error("RNSupervisor: Error loading cases:", casesError);
        return;
      }

      // Get existing assignments to filter out already assigned cases
      const { data: assignmentsData, error: assignmentsError } = await supabaseGet(
        'rc_case_assignments',
        'status=in.(pending_acceptance,active)&select=case_id'
      );

      if (assignmentsError) {
        console.error("RNSupervisor: Error loading assignments:", assignmentsError);
        // Continue anyway - might be table doesn't exist yet
      }

      const assignedCaseIds = new Set(
        (Array.isArray(assignmentsData) ? assignmentsData : assignmentsData ? [assignmentsData] : [])
          .map((a: any) => a.case_id)
      );

      const cases = Array.isArray(casesData) ? casesData : (casesData ? [casesData] : []);
      const pending = cases.filter((c: any) => !assignedCaseIds.has(c.id));

      // Fetch client and attorney names separately for each case
      const pendingWithDetails = await Promise.all(
        pending.map(async (caseItem: any) => {
          let clientName = null;
          let attorneyName = null;

          // Fetch client name
          if (caseItem.client_id) {
            try {
              const { data: clientData } = await supabaseGet(
                'rc_clients',
                `id=eq.${caseItem.client_id}&select=first_name,last_name&limit=1`
              );
              const client = Array.isArray(clientData) ? clientData[0] : clientData;
              if (client) {
                clientName = {
                  first_name: client.first_name,
                  last_name: client.last_name,
                };
              }
            } catch (e) {
              console.error("Error fetching client:", e);
            }
          }

          // Fetch attorney name
          if (caseItem.attorney_id) {
            try {
              const { data: attorneyData } = await supabaseGet(
                'rc_users',
                `id=eq.${caseItem.attorney_id}&select=full_name&limit=1`
              );
              const attorney = Array.isArray(attorneyData) ? attorneyData[0] : attorneyData;
              if (attorney) {
                attorneyName = { full_name: attorney.full_name };
              }
            } catch (e) {
              console.error("Error fetching attorney:", e);
            }
          }

          return {
            ...caseItem,
            rc_clients: clientName,
            rc_users: attorneyName,
          };
        })
      );

      setPendingCases(pendingWithDetails);
      console.log("RNSupervisor: pending cases loaded", pendingWithDetails.length);
    } catch (error: any) {
      console.error("RNSupervisor: Error loading pending cases:", error);
    } finally {
      setPendingCasesLoading(false);
    }
  };

  // Load available RNs
  const loadAvailableRNs = async () => {
    if (userRole !== "rn_supervisor") return;

    try {
      console.log("RNSupervisor: loading available RNs...");
      
      const { data: rnsData, error: rnsError } = await supabaseGet(
        'rc_users',
        'role=eq.rn_cm&select=id,full_name&order=full_name.asc'
      );

      if (rnsError) {
        console.error("RNSupervisor: Error loading RNs:", rnsError);
        return;
      }

      const rns = Array.isArray(rnsData) ? rnsData : (rnsData ? [rnsData] : []);
      setAvailableRNs(rns);
      console.log("RNSupervisor: available RNs loaded", rns.length);
    } catch (error: any) {
      console.error("RNSupervisor: Error loading RNs:", error);
    }
  };

  // Load data when role is confirmed
  useEffect(() => {
    if (userRole === "rn_supervisor" && !loading) {
      loadCheckins();
      loadNotes();
      loadPendingCases();
      loadAvailableRNs();
      console.log("RNSupervisor: done");
    }
  }, [userRole, loading]);

  // Refresh handler
  const handleRefresh = () => {
    loadCheckins();
    loadNotes();
    loadPendingCases();
    loadAvailableRNs();
  };

  // Handle assign button click
  const handleAssignClick = (caseId: string) => {
    setSelectedCaseId(caseId);
    setSelectedRNId("");
    setAssignDialogOpen(true);
  };

  // Handle assignment confirmation
  const handleAssignConfirm = async () => {
    if (!selectedCaseId || !selectedRNId) {
      toast.error("Please select an RN to assign");
      return;
    }

    setAssigning(true);
    try {
      // Get current user ID for assigned_by
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Get supervisor's rc_users ID
      const { data: supervisorData } = await supabaseGet(
        'rc_users',
        `auth_user_id=eq.${user.id}&select=id&limit=1`
      );
      const supervisor = Array.isArray(supervisorData) ? supervisorData[0] : supervisorData;
      const supervisorId = supervisor?.id || null;

      // Insert assignment
      const { error: assignError } = await supabaseInsert(
        'rc_case_assignments',
        {
          case_id: selectedCaseId,
          user_id: selectedRNId,
          status: 'pending_acceptance',
          assigned_at: new Date().toISOString(),
          assigned_by: supervisorId,
        }
      );

      if (assignError) {
        throw new Error(`Failed to create assignment: ${assignError.message}`);
      }

      // Update case status
      const { error: caseError } = await supabaseUpdate(
        'rc_cases',
        `id=eq.${selectedCaseId}`,
        {
          case_status: 'assigned_to_rn',
        }
      );

      if (caseError) {
        console.error("Error updating case status:", caseError);
        // Don't throw - assignment was created successfully
      }

      toast.success("Case assigned successfully");
      setAssignDialogOpen(false);
      setSelectedCaseId(null);
      setSelectedRNId("");
      
      // Refresh pending cases
      loadPendingCases();
    } catch (error: any) {
      console.error("Error assigning case:", error);
      toast.error(error.message || "Failed to assign case");
    } finally {
      setAssigning(false);
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 md:p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-3">
              {error.includes("Not logged in") || error.includes("Profile not found") ? (
                <Button onClick={() => navigate("/rn-login")} variant="outline">
                  Go to RN Login
                </Button>
              ) : (
                <Button onClick={() => window.location.reload()} variant="outline">
                  Refresh Page
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Route guard: if not rn_supervisor, show not authorized
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 md:p-8">
            <div className="text-center text-muted-foreground">Loading...</div>
          </Card>
        </div>
      </div>
    );
  }

  if (userRole !== "rn_supervisor") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 md:p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not authorized</AlertTitle>
              <AlertDescription>
                This dashboard is for RN Supervisors only.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={() => navigate("/rn-login")} variant="outline">
                Go to RN Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 md:p-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">RN Supervisor Dashboard</h1>
            {supervisorName && (
              <p className="text-sm text-muted-foreground">
                Welcome, {supervisorName}
              </p>
            )}
            {supervisorEmail && (
              <p className="text-xs text-muted-foreground">
                {supervisorEmail}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Audit and oversight tools for RN supervisors.
            </p>
          </div>
        </Card>

        {/* Supervisor Tools Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Supervisor Tools
            </CardTitle>
            <CardDescription>
              Quick access to RN portal and dashboard controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate("/rn-console")}
                className="flex items-center gap-2"
              >
                Go to RN Console
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center gap-2"
                disabled={checkinsLoading || notesLoading}
              >
                <RefreshCw className={`h-4 w-4 ${(checkinsLoading || notesLoading) ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent RN Check-ins Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent RN Check-ins
            </CardTitle>
            <CardDescription>
              Last 10 client check-ins submitted by RNs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkinsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading check-ins...</div>
            ) : checkins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">No check-ins found</p>
                <p className="text-sm">No recent check-ins are available at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkins.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.case_id && (
                          <span className="font-mono text-sm font-medium">
                            Case: {item.case_id.slice(0, 8)}...
                          </span>
                        )}
                        {item.client_id && (
                          <span className="text-sm text-muted-foreground">
                            Client: {item.client_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <p className="text-sm text-foreground mt-1 line-clamp-2">
                          {item.note}
                        </p>
                      )}
                      {item.created_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Assignment Queue Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pending Assignment Queue
            </CardTitle>
            <CardDescription>
              Cases awaiting RN assignment (attorney confirmed, not yet assigned)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingCasesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading pending cases...</div>
            ) : pendingCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">No pending cases</p>
                <p className="text-sm">All attorney-confirmed cases have been assigned.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCases.map((caseItem) => {
                  const clientName = caseItem.rc_clients
                    ? `${caseItem.rc_clients.first_name || ''} ${caseItem.rc_clients.last_name || ''}`.trim()
                    : 'N/A';
                  const attorneyName = caseItem.rc_users?.full_name || 'N/A';
                  
                  return (
                    <div
                      key={caseItem.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm font-semibold">
                            {caseItem.case_number || 'N/A'}
                          </span>
                          {caseItem.case_type && (
                            <span className="text-xs px-2 py-1 bg-muted rounded">
                              {caseItem.case_type}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium">Client:</span> {clientName}
                          </div>
                          {caseItem.date_of_injury && (
                            <div>
                              <span className="font-medium">Date of Injury:</span>{' '}
                              {format(new Date(caseItem.date_of_injury), "MMM d, yyyy")}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Attorney:</span> {attorneyName}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAssignClick(caseItem.id)}
                        size="sm"
                        className="ml-4"
                      >
                        Assign
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent RN Notes Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent RN Notes
            </CardTitle>
            <CardDescription>
              Last 10 clinical notes submitted by RNs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">No notes found</p>
                <p className="text-sm">No recent RN notes are available at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.case_id && (
                          <span className="font-mono text-sm font-medium">
                            Case: {item.case_id.slice(0, 8)}...
                          </span>
                        )}
                        {item.author_name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            {item.author_name}
                          </div>
                        )}
                      </div>
                      {item.note_text && (
                        <p className="text-sm text-foreground mt-1 line-clamp-3">
                          {item.note_text}
                        </p>
                      )}
                      {item.created_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign RN Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Case to RN</DialogTitle>
              <DialogDescription>
                Select an RN to assign this case to. The RN will receive a notification to accept the assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select RN</label>
                <Select value={selectedRNId} onValueChange={setSelectedRNId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an RN..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRNs.map((rn) => (
                      <SelectItem key={rn.id} value={rn.id}>
                        {rn.full_name || `RN ${rn.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAssignDialogOpen(false);
                  setSelectedCaseId(null);
                  setSelectedRNId("");
                }}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignConfirm}
                disabled={assigning || !selectedRNId}
              >
                {assigning ? "Assigning..." : "Assign Case"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
