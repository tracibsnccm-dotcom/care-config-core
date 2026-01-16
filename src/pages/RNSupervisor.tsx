import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabaseGet, supabaseInsert, supabaseUpdate } from "@/lib/supabaseRest";
import { useAuth } from "@/auth/supabaseAuth";
import { format } from "date-fns";
import { AlertCircle, Users, CheckCircle2, User } from "lucide-react";
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

interface PendingCase {
  id: string;
  case_number: string | null;
  case_type: string | null;
  date_of_injury: string | null;
  attorney_attested_at: string | null;
  rc_clients?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  rc_users?: {
    full_name: string | null;
    name?: string | null;
    email: string | null;
  } | null;
}

interface AvailableRN {
  id: string;
  full_name: string | null;
  name?: string | null;
  email: string | null;
  is_active?: boolean | null;
}

interface SupervisorProfile {
  id: string;
  full_name: string | null;
  name?: string | null;
  email: string | null;
  role: string | null;
}

export default function RNSupervisor() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // State
  const [supervisorName, setSupervisorName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCases, setPendingCases] = useState<PendingCase[]>([]);
  const [availableRNs, setAvailableRNs] = useState<AvailableRN[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedRNId, setSelectedRNId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // Load all data
  const loadAll = async () => {
    if (!authUser?.id) {
      setError("Not logged in. Please sign in to access the supervisor dashboard.");
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // 1. Load supervisor profile with retry logic
      let supervisor: SupervisorProfile | null = null;
      let supervisorError: Error | null = null;
      
      // Try with full_name first
      const { data: supervisorData, error: supervisorError1 } = await supabaseGet<SupervisorProfile[]>(
        'rc_users',
        `auth_user_id=eq.${authUser.id}&select=id,role,full_name,email&limit=1`
      );

      if (supervisorError1) {
        const errorMsg = supervisorError1.message || '';
        // Check if it's a column error (42703 = undefined column)
        if (errorMsg.includes('42703') || errorMsg.includes('does not exist') || errorMsg.includes('column') || errorMsg.includes('full_name')) {
          // Retry without full_name
          const { data: supervisorData2, error: supervisorError2 } = await supabaseGet<SupervisorProfile[]>(
            'rc_users',
            `auth_user_id=eq.${authUser.id}&select=id,role,email&limit=1`
          );
          if (supervisorError2) {
            supervisorError = supervisorError2;
          } else {
            const sup = Array.isArray(supervisorData2) ? supervisorData2[0] : supervisorData2;
            supervisor = sup as SupervisorProfile;
          }
        } else {
          supervisorError = supervisorError1;
        }
      } else {
        supervisor = Array.isArray(supervisorData) ? supervisorData[0] : supervisorData;
      }

      if (supervisorError) {
        throw new Error(`Failed to load supervisor profile: ${supervisorError.message}`);
      }

      if (supervisor) {
        const name = supervisor.full_name || supervisor.name || supervisor.email || supervisor.id.slice(0, 8) || "Supervisor";
        setSupervisorName(name);

        // Check role
        const role = supervisor.role?.toLowerCase();
        if (role !== "rn_supervisor" && role !== "supervisor") {
          setError("Access denied. This dashboard is for RN Supervisors only.");
          setLoading(false);
          return;
        }
      } else {
        setError("Supervisor profile not found. Please contact your administrator.");
        setLoading(false);
        return;
      }

      // 2. Load pending cases (attorney_confirmed) with retry logic
      let casesData: PendingCase[] | null = null;
      let casesError: Error | null = null;
      
      // Try with full_name first
      const { data: casesData1, error: casesError1 } = await supabaseGet<PendingCase[]>(
        'rc_cases',
        'case_status=eq.attorney_confirmed&select=id,case_number,client_id,attorney_id,case_type,date_of_injury,attorney_attested_at,rc_clients(first_name,last_name),rc_users!attorney_id(full_name,email)'
      );

      if (casesError1) {
        const errorMsg = casesError1.message || '';
        // Check if it's a column error
        if (errorMsg.includes('42703') || errorMsg.includes('does not exist') || errorMsg.includes('column') || errorMsg.includes('full_name')) {
          // Retry without full_name
          const { data: casesData2, error: casesError2 } = await supabaseGet<PendingCase[]>(
            'rc_cases',
            'case_status=eq.attorney_confirmed&select=id,case_number,client_id,attorney_id,case_type,date_of_injury,attorney_attested_at,rc_clients(first_name,last_name),rc_users!attorney_id(email)'
          );
          if (casesError2) {
            casesError = casesError2;
          } else {
            casesData = casesData2;
          }
        } else {
          casesError = casesError1;
        }
      } else {
        casesData = casesData1;
      }

      if (casesError) {
        throw new Error(`Failed to load cases: ${casesError.message}`);
      }

      // 3. Load existing assignments
      const { data: assignmentsData, error: assignmentsError } = await supabaseGet<{ case_id: string }[]>(
        'rc_case_assignments',
        'status=in.(pending_acceptance,active)&select=case_id'
      );

      if (assignmentsError) {
        // Log but don't fail - assignments table might not exist yet
        console.warn("Failed to load assignments:", assignmentsError);
      }

      // Filter out cases that already have assignments
      const assignedCaseIds = new Set(
        (Array.isArray(assignmentsData) ? assignmentsData : assignmentsData ? [assignmentsData] : [])
          .map(a => a.case_id)
      );

      const cases = Array.isArray(casesData) ? casesData : (casesData ? [casesData] : []);
      const pending = cases.filter(c => !assignedCaseIds.has(c.id));
      setPendingCases(pending);

      // 4. Load available RNs with retry logic
      let rnsData: AvailableRN[] | null = null;
      let rnsError: Error | null = null;
      
      // Try with full_name and is_active first
      const { data: rnsData1, error: rnsError1 } = await supabaseGet<AvailableRN[]>(
        'rc_users',
        'role=eq.rn&select=id,full_name,email,is_active'
      );

      if (rnsError1) {
        const errorMsg = rnsError1.message || '';
        // Check if it's a column error
        if (errorMsg.includes('42703') || errorMsg.includes('does not exist') || errorMsg.includes('column')) {
          // Retry with minimal fields
          const { data: rnsData2, error: rnsError2 } = await supabaseGet<AvailableRN[]>(
            'rc_users',
            'role=eq.rn&select=id,email'
          );
          if (rnsError2) {
            rnsError = rnsError2;
          } else {
            rnsData = rnsData2;
          }
        } else {
          rnsError = rnsError1;
        }
      } else {
        rnsData = rnsData1;
      }

      if (rnsError) {
        console.warn("Failed to load RNs:", rnsError);
        // Don't fail - just show empty list
        setAvailableRNs([]);
      } else {
        const rns = Array.isArray(rnsData) ? rnsData : (rnsData ? [rnsData] : []);
        // Filter by is_active if column exists, otherwise include all
        const activeRNs = rns.filter(rn => rn.is_active !== false);
        setAvailableRNs(activeRNs);
      }

    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when user changes
  useEffect(() => {
    loadAll();
  }, [authUser?.id]);

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

    if (!authUser?.id) {
      toast.error("Not authenticated");
      return;
    }

    setAssigning(true);
    try {
      // Get supervisor's rc_users ID
      const { data: supervisorData } = await supabaseGet<SupervisorProfile[]>(
        'rc_users',
        `auth_user_id=eq.${authUser.id}&select=id&limit=1`
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

      // Refresh the queue
      await loadAll();
    } catch (err: any) {
      console.error("Error assigning case:", err);
      toast.error(err.message || "Failed to assign case");
    } finally {
      setAssigning(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return "—";
    }
  };

  // Format name helper for rc_users (full_name/name/email/id)
  const formatUserName = (user: { full_name?: string | null; name?: string | null; email?: string | null; id?: string } | null | undefined): string => {
    if (!user) return "Unknown";
    if (user.full_name) return user.full_name;
    if (user.name) return user.name;
    if (user.email) return user.email;
    if (user.id) return user.id.slice(0, 8);
    return "Unknown";
  };

  // Format name helper for rc_clients (first_name/last_name)
  const formatClientName = (first: string | null, last: string | null): string => {
    if (first && last) return `${first} ${last}`.trim();
    return first || last || "Unknown";
  };

  // Show error state
  if (error && !loading) {
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
              {error.includes("Not logged in") || error.includes("not found") ? (
                <Button onClick={() => navigate("/rn-login")} variant="outline">
                  Go to RN Login
                </Button>
              ) : (
                <Button onClick={() => loadAll()} variant="outline">
                  Retry
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="p-6 md:p-8">
            <div className="text-center text-muted-foreground">Loading...</div>
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
            <p className="text-sm text-muted-foreground">
              Manage case assignments and oversee RN activities.
            </p>
          </div>
        </Card>

        {/* Pending Assignment Queue */}
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
            {pendingCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">No cases waiting for assignment.</p>
                <p className="text-sm">All attorney-confirmed cases have been assigned.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold text-sm">Case Number</th>
                        <th className="text-left p-2 font-semibold text-sm">Client Name</th>
                        <th className="text-left p-2 font-semibold text-sm">Date of Injury</th>
                        <th className="text-left p-2 font-semibold text-sm">Attorney</th>
                        <th className="text-left p-2 font-semibold text-sm">Attested</th>
                        <th className="text-left p-2 font-semibold text-sm">Case Type</th>
                        <th className="text-left p-2 font-semibold text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingCases.map((caseItem) => {
                        const clientName = formatClientName(
                          caseItem.rc_clients?.first_name || null,
                          caseItem.rc_clients?.last_name || null
                        );
                        const attorneyName = formatUserName(caseItem.rc_users);
                        const caseNumber = caseItem.case_number || caseItem.id.slice(0, 8);

                        return (
                          <tr key={caseItem.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <span className="font-mono text-sm">{caseNumber}</span>
                            </td>
                            <td className="p-2 text-sm">{clientName}</td>
                            <td className="p-2 text-sm">{formatDate(caseItem.date_of_injury)}</td>
                            <td className="p-2 text-sm">{attorneyName}</td>
                            <td className="p-2 text-sm">{formatDate(caseItem.attorney_attested_at)}</td>
                            <td className="p-2 text-sm">
                              {caseItem.case_type ? (
                                <span className="px-2 py-1 bg-muted rounded text-xs">
                                  {caseItem.case_type}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="p-2">
                              <Button
                                onClick={() => handleAssignClick(caseItem.id)}
                                size="sm"
                              >
                                Assign
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
                    {availableRNs.map((rn) => {
                      const rnName = formatUserName(rn);
                      return (
                        <SelectItem key={rn.id} value={rn.id}>
                          {rnName}
                        </SelectItem>
                      );
                    })}
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
