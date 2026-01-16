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
  rc_users?: Record<string, any> | null;
}

interface AvailableRN extends Record<string, any> {
  id: string;
}

interface SupervisorProfile extends Record<string, any> {
  id: string;
}

// Helper function to load rc_users profile by trying multiple column names
async function loadRcUserProfileForAuthId(authId: string): Promise<Record<string, any> | null> {
  // Try auth_user_id first
  const { data: data1, error: error1 } = await supabaseGet<Record<string, any>[]>(
    'rc_users',
    `auth_user_id=eq.${authId}&select=*&limit=1`
  );

  if (!error1 && data1) {
    const result = Array.isArray(data1) ? data1[0] : data1;
    if (result) return result;
  }

  // Check if error is column-related
  const errorMsg1 = error1?.message || '';
  const isColumnError1 = errorMsg1.includes('42703') || errorMsg1.includes('does not exist') || errorMsg1.includes('column') || errorMsg1.includes('auth_user_id');

  // Try user_id if auth_user_id column doesn't exist or no results
  if (isColumnError1 || (!error1 && (!data1 || (Array.isArray(data1) && data1.length === 0)))) {
    const { data: data2, error: error2 } = await supabaseGet<Record<string, any>[]>(
      'rc_users',
      `user_id=eq.${authId}&select=*&limit=1`
    );

    if (!error2 && data2) {
      const result = Array.isArray(data2) ? data2[0] : data2;
      if (result) return result;
    }

    // Check if user_id column error
    const errorMsg2 = error2?.message || '';
    const isColumnError2 = errorMsg2.includes('42703') || errorMsg2.includes('does not exist') || errorMsg2.includes('column') || errorMsg2.includes('user_id');

    // Fallback to id if both previous columns don't exist or no results
    if (isColumnError2 || (!error2 && (!data2 || (Array.isArray(data2) && data2.length === 0)))) {
      const { data: data3, error: error3 } = await supabaseGet<Record<string, any>[]>(
        'rc_users',
        `id=eq.${authId}&select=*&limit=1`
      );

      if (!error3 && data3) {
        const result = Array.isArray(data3) ? data3[0] : data3;
        if (result) return result;
      }
    }
  }

  return null;
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

      // 1. Load supervisor profile using helper with fallbacks
      const supervisor = await loadRcUserProfileForAuthId(authUser.id);

      if (!supervisor) {
        setError("No supervisor profile row found for your auth account.");
        setLoading(false);
        return;
      }

      const name = formatUserName(supervisor);
      setSupervisorName(name);

      // Check role - try multiple possible role field names
      const role = (supervisor.role || supervisor.user_role || supervisor.account_role || '')?.toLowerCase();
      if (role !== "rn_supervisor" && role !== "supervisor") {
        setError("Access denied. This dashboard is for RN Supervisors only.");
        setLoading(false);
        return;
      }

      // 2. Load pending cases (attorney_confirmed) - no FK joins
      const { data: casesData, error: casesError } = await supabaseGet<PendingCase[]>(
        'rc_cases',
        'case_status=eq.attorney_confirmed&select=*'
      );

      if (casesError) {
        throw new Error(`Failed to load cases: ${casesError.message}`);
      }

      const cases = Array.isArray(casesData) ? casesData : (casesData ? [casesData] : []);

      // 2a. Load existing assignments to filter out already assigned cases
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

      const pending = cases.filter(c => !assignedCaseIds.has(c.id));

      // 2b. Load attorneys (all rc_users) and build name map
      const { data: allUsersData, error: usersError } = await supabaseGet<Record<string, any>[]>(
        'rc_users',
        'select=*'
      );

      const attorneyMap = new Map<string, Record<string, any>>();
      if (!usersError && allUsersData) {
        const allUsers = Array.isArray(allUsersData) ? allUsersData : [allUsersData];
        allUsers.forEach((user: any) => {
          if (user.id) {
            attorneyMap.set(user.id, user);
          }
        });
      }

      // 2c. Load clients and build name map
      const clientIds = [...new Set(pending.map(c => c.client_id).filter(Boolean))];
      const clientMap = new Map<string, Record<string, any>>();
      
      if (clientIds.length > 0) {
        // Build OR filter for client IDs
        const clientIdsFilter = clientIds.map(id => `id.eq.${id}`).join(',');
        const { data: clientsData, error: clientsError } = await supabaseGet<Record<string, any>[]>(
          'rc_clients',
          `or=(${clientIdsFilter})&select=*`
        );

        if (!clientsError && clientsData) {
          const clients = Array.isArray(clientsData) ? clientsData : [clientsData];
          clients.forEach((client: any) => {
            if (client.id) {
              clientMap.set(client.id, client);
            }
          });
        }
      }

      // 2d. Enhance pending cases with resolved names
      const pendingWithNames: PendingCase[] = pending.map((c: any) => {
        const attorney = c.attorney_id ? attorneyMap.get(c.attorney_id) : null;
        const client = c.client_id ? clientMap.get(c.client_id) : null;
        return {
          ...c,
          rc_users: attorney || null,
          rc_clients: client ? {
            first_name: client.first_name || null,
            last_name: client.last_name || null,
          } : null,
        };
      });

      setPendingCases(pendingWithNames);

      // 4. Load available RNs
      let rnsData: AvailableRN[] | null = null;
      let rnsError: Error | null = null;
      
      // Try with role filter first
      const { data: rnsData1, error: rnsError1 } = await supabaseGet<AvailableRN[]>(
        'rc_users',
        'role=eq.rn&select=*'
      );

      if (rnsError1) {
        const errorMsg = rnsError1.message || '';
        // If role column doesn't exist, fallback to select all and filter in JS
        if (errorMsg.includes('42703') || errorMsg.includes('does not exist') || errorMsg.includes('column') || errorMsg.includes('role')) {
          const { data: rnsData2, error: rnsError2 } = await supabaseGet<AvailableRN[]>(
            'rc_users',
            'select=*'
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
        // Filter by role in JS if needed (if we got all users)
        const rnRole = rnsError1 ? rns.filter((rn: any) => {
          const role = (rn.role || rn.user_role || rn.account_role || '').toLowerCase();
          return role === 'rn' || role === 'rn_cm';
        }) : rns;
        // Filter by is_active if column exists, otherwise include all
        const activeRNs = rnRole.filter((rn: any) => rn.is_active !== false);
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
    console.log("RNSupervisor.tsx mounted - build 1de1a5e", new Date().toISOString());
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
      // Get supervisor's rc_users ID using helper
      const supervisor = await loadRcUserProfileForAuthId(authUser.id);
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

  // Format name helper for rc_users - tries all possible name fields without requesting them
  const formatUserName = (user: Record<string, any> | null | undefined): string => {
    if (!user) return "Unknown";
    // Try all possible name fields in order of preference
    if (user.full_name) return user.full_name;
    if (user.name) return user.name;
    if (user.display_name) return user.display_name;
    if (user.username) return user.username;
    if (user.user_name) return user.user_name;
    // Try first_name + last_name if present
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim();
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    // Try email fields
    if (user.user_email) return user.user_email;
    if (user.email) return user.email;
    // Fallback to short ID
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
              <AlertDescription>
                <div className="space-y-2">
                  <div>{error}</div>
                  {authUser?.id && (
                    <div className="text-xs mt-2 font-mono text-muted-foreground">
                      Auth User ID: {authUser.id}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-3">
              {error.includes("Not logged in") || error.includes("not found") || error.includes("No supervisor profile") ? (
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
      {/* Build marker badge */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'black',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 99999,
        fontFamily: 'monospace'
      }}>
        RN SUPERVISOR BUILD: 1de1a5e
      </div>
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
